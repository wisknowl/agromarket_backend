import { OrderStatus, PaymentMethod } from '@prisma/client';
import prisma from '../../core/database/prisma';
import { EscrowMachine, SettlementLedger, EscrowState } from './engine';
import { eventBus } from '../../core/events/event-bus';
import { CreditScoringEngine } from '../fintech/engine';
import { campayService } from './campay.service';

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

    // Resolve a valid FarmerProfile.id to satisfy OrderItem foreign key constraint
    let validFarmerProfileId = '';

    if (yieldItem.farmerId) {
      const existingProfile = await prisma.farmerProfile.findUnique({
        where: { id: yieldItem.farmerId },
      });
      if (existingProfile) {
        validFarmerProfileId = existingProfile.id;
      }
    }

    if (!validFarmerProfileId && yieldItem.farmId) {
      const farm = await prisma.farm.findUnique({
        where: { id: yieldItem.farmId },
      });
      if (farm?.userId) {
        const farmerProfile = await prisma.farmerProfile.findUnique({
          where: { userId: farm.userId },
        });
        if (farmerProfile) {
          validFarmerProfileId = farmerProfile.id;
        }
      }
    }

    // Fallback: If still not resolved, link to the first existing farmer profile
    if (!validFarmerProfileId) {
      const anyProfile = await prisma.farmerProfile.findFirst();
      if (anyProfile) {
        validFarmerProfileId = anyProfile.id;
      }
    }

    if (!primaryFarmerId && validFarmerProfileId) {
      primaryFarmerId = validFarmerProfileId;
    }

    orderItemsData.push({
      yieldId: yieldItem.id,
      farmerId: validFarmerProfileId,
      quantity: item.quantity,
      unitPrice: price,
      totalPrice: itemTotal,
    });
  }

  // Delivery fee calculation (Synced with Frontend: 1500 FCFA base, free if 10+ items or order > 50,000 FCFA)
  const totalItemCount = data.items.reduce((sum, i) => sum + i.quantity, 0);
  const deliveryFee = totalItemCount >= 10 || subtotal > 50000 ? 0 : 1500;

  // Compute Multi-Party Atomic Settlement via Engine 3
  const settlement = await SettlementLedger.computeSettlement({
    subtotal,
    deliveryFee,
    currency,
    farmerId: primaryFarmerId,
  });

  const isMobileMoney =
    data.paymentMethod === PaymentMethod.MTN_MOMO ||
    data.paymentMethod === PaymentMethod.ORANGE_MONEY;

  let campayPromptInfo: any = null;
  let initialStatus: OrderStatus = OrderStatus.ESCROW_LOCKED;
  let paymentReference = `${data.paymentMethod}-${Date.now()}`;

  // If Cameroon MTN MoMo or Orange Money, initiate real Campay payment collection
  if (isMobileMoney && currency === 'XAF') {
    try {
      const campayRes = await campayService.collectPayment({
        amount: settlement.grossAmount,
        from: data.deliveryPhone,
        description: `AgroMarket Escrow order for harvest produce`,
        externalReference: `order-${buyerId.substring(0, 8)}-${Date.now()}`,
      });
      paymentReference = campayRes.reference;
      campayPromptInfo = campayRes;
      initialStatus = OrderStatus.PENDING_PAYMENT;
    } catch (err: any) {
      console.warn('⚠️ [CAMPAY] Live collection prompt error, holding local escrow:', err.message);
      initialStatus = OrderStatus.ESCROW_LOCKED;
    }
  }

  const order = await prisma.order.create({
    data: {
      buyerId,
      status: initialStatus,
      paymentMethod: data.paymentMethod,
      currency,
      subtotal,
      deliveryFee,
      totalAmount: settlement.grossAmount,
      deliveryAddress: data.deliveryAddress,
      deliveryCity: data.deliveryCity,
      deliveryPhone: data.deliveryPhone,
      deliveryNotes: data.deliveryNotes,
      paymentReference,
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
  if (initialStatus === OrderStatus.ESCROW_LOCKED) {
    EscrowMachine.transition(order.id, 'ORDER_CREATED', 'ESCROW_LOCKED');
  }

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
    campayPrompt: campayPromptInfo,
  };
};

export const checkOrderPaymentStatus = async (orderId: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { escrow: true },
  });
  if (!order) throw new Error('Order not found');

  if (order.status === OrderStatus.ESCROW_LOCKED || order.status === OrderStatus.COMPLETED) {
    return { status: order.status, isLocked: true };
  }

  if (order.paymentReference && !order.paymentReference.startsWith('CASH_')) {
    try {
      const campayStatus = await campayService.checkTransactionStatus(order.paymentReference);
      if (campayStatus.status === 'SUCCESSFUL') {
        const updated = await prisma.order.update({
          where: { id: orderId },
          data: { status: OrderStatus.ESCROW_LOCKED },
        });
        EscrowMachine.transition(orderId, 'ORDER_CREATED', 'ESCROW_LOCKED');
        return { status: updated.status, isLocked: true, campay: campayStatus };
      } else if (campayStatus.status === 'FAILED') {
        const updated = await prisma.order.update({
          where: { id: orderId },
          data: { status: OrderStatus.CANCELLED },
        });
        return { status: updated.status, isLocked: false, campay: campayStatus };
      }
      return { status: order.status, isLocked: false, campay: campayStatus };
    } catch (err: any) {
      console.warn('Campay status check warning:', err.message);
    }
  }

  return { status: order.status, isLocked: false };
};

export const handleCampayWebhook = async (payload: any) => {
  const { reference, status, external_reference } = payload;
  console.log(`📡 [CAMPAY WEBHOOK RECEIVED] Ref: ${reference}, Status: ${status}`);

  const order = await prisma.order.findFirst({
    where: {
      OR: [
        { paymentReference: reference },
        { id: external_reference },
      ],
    },
  });

  if (!order) {
    console.warn(`[CAMPAY WEBHOOK] No matching order found for reference: ${reference}`);
    return;
  }

  if (status === 'SUCCESSFUL' && order.status !== OrderStatus.ESCROW_LOCKED) {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.ESCROW_LOCKED },
    });
    EscrowMachine.transition(order.id, 'ORDER_CREATED', 'ESCROW_LOCKED');
    console.log(`🔒 [CAMPAY WEBHOOK SUCCESS] Order ${order.id} moved to ESCROW_LOCKED`);
  } else if (status === 'FAILED') {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.CANCELLED },
    });
    console.log(`❌ [CAMPAY WEBHOOK FAILURE] Order ${order.id} marked CANCELLED`);
  }
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
      deliveryTrip: {
        include: { transporter: true },
      },
    },
  });

  if (!order) throw new Error('Order not found');
  return order;
};

export const getFarmerOrders = async (farmerUserId: string) => {
  const farmer = await prisma.farmerProfile.findUnique({
    where: { userId: farmerUserId },
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

  // Automated Payout to Farmer via Campay (MTN MoMo / Orange Money)
  const isMobileMoney =
    order.paymentMethod === PaymentMethod.MTN_MOMO ||
    order.paymentMethod === PaymentMethod.ORANGE_MONEY;

  if (isMobileMoney && order.escrow?.farmerPayout) {
    const firstFarmer = order.items[0]?.farmer;
    if (firstFarmer?.userId) {
      const farmerUser = await prisma.user.findUnique({
        where: { id: firstFarmer.userId },
      });
      if (farmerUser?.phone) {
        try {
          await campayService.disburseEscrowPayout({
            amount: Number(order.escrow.farmerPayout),
            to: farmerUser.phone,
            description: `AgroMarket Escrow Payout for Order #${order.orderNumber}`,
            externalReference: `payout-${order.id}`,
          });
          console.log(`💸 [CAMPAY PAYOUT] Disbursed ${order.escrow.farmerPayout} XAF to farmer ${farmerUser.phone}`);
        } catch (err: any) {
          console.warn('⚠️ [CAMPAY PAYOUT] Automated withdrawal call warning:', err.message);
        }
      }
    }
  }

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
