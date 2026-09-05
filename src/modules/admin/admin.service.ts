import prisma from '../../core/database/prisma';
import { OrderStatus } from '@prisma/client';

// In-memory or DB-backed feature flags
let systemFeatureFlags: Record<string, boolean> = {
  agroFeedEnabled: true,
  directYieldsEnabled: true,
  basketCheckoutEnabled: true,
  fintechLoansEnabled: true,
  buyamSellamModuleEnabled: true,
  transporterLogisticsEnabled: true,
  instantEscrowAutoRelease: false,
};

export const getFeatureFlags = async () => {
  return systemFeatureFlags;
};

export const updateFeatureFlag = async (flagName: string, isEnabled: boolean) => {
  systemFeatureFlags[flagName] = isEnabled;
  return systemFeatureFlags;
};

export const getDisputedOrders = async () => {
  return prisma.order.findMany({
    where: {
      OR: [
        { status: OrderStatus.DISPUTED },
        { escrow: { isDisputed: true } },
      ],
    },
    include: {
      buyer: { select: { id: true, name: true, phone: true, email: true } },
      items: { include: { yield: true, farmer: true } },
      escrow: true,
      deliveryTrip: true,
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const resolveDispute = async (
  orderId: string,
  resolution: 'RELEASE_TO_FARMER' | 'REFUND_BUYER' | 'SPLIT',
  reason?: string
) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { escrow: true },
  });

  if (!order) throw new Error('Order not found');

  if (resolution === 'RELEASE_TO_FARMER') {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.COMPLETED, isEscrowReleased: true },
    });
    await prisma.escrowRecord.update({
      where: { orderId },
      data: { isDisputed: false, disputeReason: `Resolved by Super Admin: Full release to Farmer. Note: ${reason || 'N/A'}` },
    });
  } else if (resolution === 'REFUND_BUYER') {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELLED, isEscrowReleased: false },
    });
    await prisma.escrowRecord.update({
      where: { orderId },
      data: { isDisputed: false, disputeReason: `Resolved by Super Admin: Full refund to Buyer. Note: ${reason || 'N/A'}` },
    });
  }

  return { success: true, message: `Dispute on order ${orderId} resolved as ${resolution}` };
};

export const getPlatformStats = async () => {
  const [usersCount, farmersCount, ordersCount, yieldsCount] = await Promise.all([
    prisma.user.count(),
    prisma.farmerProfile.count(),
    prisma.order.count(),
    prisma.agroYield.count(),
  ]);

  return {
    users: usersCount,
    farmers: farmersCount,
    orders: ordersCount,
    yields: yieldsCount,
    featureFlags: systemFeatureFlags,
  };
};
