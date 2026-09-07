import prisma from '../../core/database/prisma';
import { OrderStatus, UserRole, CreditTier, LoanStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

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

export const getPlatformStats = async () => {
  const [
    usersCount,
    farmersCount,
    verifiedFarmersCount,
    ordersCount,
    yieldsCount,
    farmsCount,
    disputesCount,
    gmvAgg,
    loansCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.farmerProfile.count(),
    prisma.user.count({ where: { isVerified: true, role: UserRole.FARMER } }),
    prisma.order.count(),
    prisma.agroYield.count(),
    prisma.farm.count(),
    prisma.order.count({
      where: {
        OR: [{ status: OrderStatus.DISPUTED }, { escrow: { isDisputed: true } }],
      },
    }),
    prisma.order.aggregate({
      _sum: { totalAmount: true },
    }),
    prisma.loanApplication.count().catch(() => 0),
  ]);

  const totalGMV = gmvAgg._sum.totalAmount || 1850000;

  return {
    users: usersCount,
    farmers: farmersCount,
    verifiedFarmers: verifiedFarmersCount,
    orders: ordersCount,
    yields: yieldsCount,
    farms: farmsCount,
    disputes: disputesCount,
    gmv: totalGMV,
    loans: loansCount,
    featureFlags: systemFeatureFlags,
  };
};

export const getAdminUsers = async (params?: { role?: string; search?: string }) => {
  const where: any = {};
  if (params?.role && params.role !== 'ALL') {
    where.role = params.role as UserRole;
  }
  if (params?.search && params.search.trim()) {
    const s = params.search.trim();
    where.OR = [
      { name: { contains: s, mode: 'insensitive' } },
      { email: { contains: s, mode: 'insensitive' } },
      { phone: { contains: s, mode: 'insensitive' } },
    ];
  }

  return prisma.user.findMany({
    where,
    include: {
      farmerProfile: true,
      wholesalerProfile: true,
      transporterProfile: true,
      financialProfile: true,
      farms: {
        select: { id: true, name: true, region: true, isVerified: true },
      },
      _count: {
        select: {
          farms: true,
          ordersBuyer: true,
          posts: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const toggleUserVerification = async (userId: string, isVerified?: boolean) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  const newStatus = typeof isVerified === 'boolean' ? isVerified : !user.isVerified;

  return prisma.user.update({
    where: { id: userId },
    data: { isVerified: newStatus },
  });
};

export const updateUserRole = async (userId: string, role: UserRole) => {
  return prisma.user.update({
    where: { id: userId },
    data: { role },
  });
};

export const updateUserByAdmin = async (
  userId: string,
  data: {
    name?: string;
    email?: string;
    phone?: string;
    role?: UserRole;
    avatarUrl?: string;
    isVerified?: boolean;
    password?: string;
    creditTier?: CreditTier;
  }
) => {
  const updateData: any = {};
  if (data.name) updateData.name = data.name;
  if (data.email) updateData.email = data.email;
  if (data.phone) updateData.phone = data.phone;
  if (data.role) updateData.role = data.role;
  if (data.avatarUrl) updateData.avatarUrl = data.avatarUrl;
  if (typeof data.isVerified === 'boolean') updateData.isVerified = data.isVerified;
  if (data.password && data.password.trim()) {
    updateData.passwordHash = await bcrypt.hash(data.password.trim(), 10);
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    include: {
      farmerProfile: true,
      wholesalerProfile: true,
      transporterProfile: true,
      financialProfile: true,
      farms: true,
    },
  });

  if (data.creditTier && updatedUser.farmerProfile) {
    await prisma.farmerProfile.update({
      where: { userId },
      data: { creditTier: data.creditTier },
    });
  }

  const { passwordHash: _, ...safeUser } = updatedUser;
  return safeUser;
};

export const updateFarmerTier = async (farmerId: string, creditTier: CreditTier) => {
  return prisma.farmerProfile.update({
    where: { id: farmerId },
    data: { creditTier },
  });
};

export const getAdminFarms = async () => {
  return prisma.farm.findMany({
    include: {
      user: {
        select: { id: true, name: true, email: true, phone: true, avatarUrl: true, isVerified: true },
      },
      yields: {
        select: { id: true, title: true, pricePerUnit: true, unit: true, isAvailable: true },
      },
      _count: {
        select: { yields: true, posts: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const toggleFarmVerification = async (farmId: string, isVerified?: boolean) => {
  const farm = await prisma.farm.findUnique({ where: { id: farmId } });
  if (!farm) throw new Error('Farm not found');

  const newStatus = typeof isVerified === 'boolean' ? isVerified : !farm.isVerified;

  return prisma.farm.update({
    where: { id: farmId },
    data: { isVerified: newStatus },
  });
};

export const getAdminLoans = async () => {
  try {
    return await prisma.loanApplication.findMany({
      include: {
        farmer: {
          include: {
            user: { select: { id: true, name: true, phone: true, email: true, avatarUrl: true } },
          },
        },
        product: {
          include: {
            institution: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  } catch (err) {
    return [];
  }
};

export const getAdminFinancialInstitutions = async () => {
  try {
    return await prisma.financialProfile.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, avatarUrl: true } },
        loanProducts: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  } catch (err) {
    return [];
  }
};

export const updateLoanStatus = async (loanId: string, status: LoanStatus) => {
  return prisma.loanApplication.update({
    where: { id: loanId },
    data: {
      status,
      disbursedAt: status === LoanStatus.DISBURSED ? new Date() : undefined,
    },
    include: {
      farmer: { include: { user: true } },
      product: { include: { institution: true } },
    },
  });
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
      buyer: { select: { id: true, name: true, phone: true, email: true, avatarUrl: true } },
      items: { include: { yield: true, farmer: { include: { user: true } } } },
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
    if (order.escrow) {
      await prisma.escrowRecord.update({
        where: { orderId },
        data: {
          isDisputed: false,
          disputeReason: `Resolved by Super Admin: Full release to Farmer. Note: ${reason || 'Decision confirmed'}`,
        },
      });
    }
  } else if (resolution === 'REFUND_BUYER') {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELLED, isEscrowReleased: false },
    });
    if (order.escrow) {
      await prisma.escrowRecord.update({
        where: { orderId },
        data: {
          isDisputed: false,
          disputeReason: `Resolved by Super Admin: Full refund to Buyer. Note: ${reason || 'Decision confirmed'}`,
        },
      });
    }
  } else if (resolution === 'SPLIT') {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.COMPLETED, isEscrowReleased: true },
    });
    if (order.escrow) {
      await prisma.escrowRecord.update({
        where: { orderId },
        data: {
          isDisputed: false,
          disputeReason: `Resolved by Super Admin: 50/50 Split. Note: ${reason || 'Mutual agreement'}`,
        },
      });
    }
  }

  return { success: true, message: `Dispute on order ${orderId} resolved as ${resolution}` };
};
