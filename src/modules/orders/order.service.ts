import { OrderStatus, PaymentMethod } from '@prisma/client';
import prisma from '../../core/database/prisma';
import { EscrowMachine, SettlementLedger, EscrowState } from './engine';
import { eventBus } from '../../core/events/event-bus';
import { CreditScoringEngine } from '../fintech/engine';

export interface CheckoutDto {
  items: Array<{ yieldId: string; quantity: number }>;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryPhone: string;
  deliveryNotes?: string;
  paymentMethod: PaymentMethod;
  currency?: string;
}

export const createEscrowOrder = async (buyerId: string, data: CheckoutDto) => {
  if (!data.items || data.items.length === 0) {
    throw new Error('Cannot checkout an empty basket');
  }

  const currency = data.currency || 'XAF';

  // Calculate items subtotal and verify stock
  let subtotal = 0;
  let primaryFarmerId = '';
  const orderItemsData: Array<{
    yieldId: string;
    farmerId: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }> = [];

  for (const item of data.items) {
    const yieldItem = await prisma.agroYield.findUnique({
      where: { id: item.yieldId },
    });

    if (!yieldItem) throw new Error(`Product ${item.yieldId} not found`);
    if (yieldItem.stockQuantity < item.quantity) {
      throw new Error(
        `Insufficient harvest stock for ${yieldItem.title}. Available: ${yieldItem.stockQuantity} ${yieldItem.unit}`
      );
    }

    const price = Number(yieldItem.pricePerUnit);
    const itemTotal = price * item.quantity;
    subtotal += itemTotal;

    const farmerId = yieldItem.farmerId || yieldItem.farmId || '';
    if (!primaryFarmerId && farmerId) {
      primaryFarmerId = farmerId;
    }

    orderItemsData.push({
      yieldId: yieldItem.id,
      farmerId,
      quantity: item.quantity,
      unitPrice: price,
      totalPrice: itemTotal,
    });
  }

  // Delivery fee calculation (Cameroon local shipping: 1000 FCFA base, free if 10+ items)
  const totalItemCount = data.items.reduce((sum, i) => sum + i.quantity, 0);
  const deliveryFee = totalItemCount >= 10 ? 0 : 1000;

  // Compute Multi-Party Atomic Settlement via Engine 3
  const settlement = await SettlementLedger.computeSettlement({
    subtotal,
    deliveryFee,
    currency,
    farmerId: primaryFarmerId,
  });

  const order = await prisma.order.create({
    data: {
      buyerId,
      status: OrderStatus.ESCROW_LOCKED,
      paymentMethod: data.paymentMethod,
      currency,
      subtotal,
      deliveryFee,
      totalAmount: settlement.grossAmount,
      deliveryAddress: data.deliveryAddress,
      deliveryCity: data.deliveryCity,
      deliveryPhone: data.deliveryPhone,
      deliveryNotes: data.deliveryNotes,
      paymentReference: `${data.paymentMethod}-${Date.now()}`,
      items: {
        create: orderItemsData,
      },
      escrow: {
        create: {
          amountHeld: settlement.grossAmount,
          farmerPayout: settlement.farmerNetPayout,
          transporterFee: settlement.transporterFee,
          platformFee: settlement.platformCommission,
        },
      },
    },
    include: {
      items: {
        include: { yield: true, farmer: true },
      },
      escrow: true,
    },
  });

  // Execute FSM transition
  EscrowMachine.transition(order.id, 'ORDER_CREATED', 'ESCROW_LOCKED');

  // Decrement stock
  for (const item of data.items) {
    await prisma.agroYield.update({
      where: { id: item.yieldId },
      data: { stockQuantity: { decrement: item.quantity } },
    });
  }

  // Clear user cart
  await prisma.cartItem.deleteMany({
    where: { userId: buyerId },
  });

  return {
    ...order,
    settlementBreakdown: settlement,
  };
};

export const getBuyerOrders = async (buyerId: string) => {
  return prisma.order.findMany({
    where: { buyerId },
    include: {
      items: {
        include: { yield: true, farmer: true },
      },
      escrow: true,
      deliveryTrip: {
        include: { transporter: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const getOrderById = async (orderId: string, userId: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: { yield: true, farmer: true },
      },
      escrow: true,
      buyer: {
        select: { id: true, name: true, phone: true, avatarUrl: true },
      },
      deliveryTrip: {
        include: { transporter: true },
      },
    },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  return order;
};

export const getFarmerOrders = async (userId: string) => {
  const farmer = await prisma.farmerProfile.findUnique({
    where: { userId },
  });

  if (!farmer) throw new Error('Farmer profile not found');

  return prisma.orderItem.findMany({
    where: { farmerId: farmer.id },
    include: {
      order: {
        include: { buyer: { select: { id: true, name: true, phone: true } } },
      },
      yield: true,
    },
    orderBy: { order: { createdAt: 'desc' } },
  });
};

export const updateOrderStatus = async (
  orderId: string,
  targetStatus: OrderStatus,
  actorUserId: string
) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) throw new Error('Order not found');

  const currentFsmState = order.status as unknown as EscrowState;
  const targetFsmState = targetStatus as unknown as EscrowState;

  const transition = EscrowMachine.transition(orderId, currentFsmState, targetFsmState);
  if (!transition.valid) {
    throw new Error(transition.message);
  }

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: { status: targetStatus },
  });

  return updatedOrder;
};

export const releaseEscrowFunds = async (orderId: string, buyerId: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      escrow: true,
      items: {
        include: { farmer: true },
      },
    },
  });

  if (!order || order.buyerId !== buyerId) {
    throw new Error('Unauthorized or order not found');
  }

  // FSM Transition to ESCROW_RELEASED
  const currentFsmState = (order.status === 'DELIVERED' ? 'DELIVERED' : 'IN_TRANSIT') as EscrowState;
  EscrowMachine.transition(orderId, currentFsmState, 'ESCROW_RELEASED');

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: OrderStatus.COMPLETED,
      isEscrowReleased: true,
    },
  });

  await prisma.escrowRecord.update({
    where: { orderId },
    data: { releasedAt: new Date() },
  });

  // Re-calculate credit score for all involved farmers in background
  const farmerIds = Array.from(new Set(order.items.map((i) => i.farmerId).filter(Boolean)));
  for (const farmerId of farmerIds) {
    setImmediate(async () => {
      try {
        await CreditScoringEngine.evaluateFarmer({
          farmerId,
          triggeredBy: `ORDER_COMPLETED_${orderId}`,
        });
      } catch (e) {
        console.error(`[EscrowRelease] Auto-rescore failed for farmer ${farmerId}:`, e);
      }
    });
  }

  return {
    success: true,
    message: 'Escrow funds successfully released to farmer & transporter! Credit score updated.',
  };
};
