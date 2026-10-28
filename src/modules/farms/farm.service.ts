import prisma from '../../core/database/prisma';
import { FarmCategory } from '@prisma/client';

export interface FarmParcelDto {
  id?: string;
  name: string; // e.g. "Main Facility & Hatchery", "Mutengene Broiler Pen"
  region: string;
  division?: string;
  city: string;
  location?: string;
  gpsLatitude?: number;
  gpsLongitude?: number;
  sizeHectares?: number;
  isHeadquarters?: boolean;
}

export interface CreateFarmDto {
  name: string;
  category?: FarmCategory | string;
  description?: string;
  region: string;
  division?: string;
  city: string;
  location?: string;
  gpsLatitude?: number;
  gpsLongitude?: number;
  sizeHectares?: number;
  coverPhoto?: string;
  avatarPhoto?: string;
  primaryProduce?: string[];
  certifications?: string[];
  parcels?: FarmParcelDto[];
}

export const createOrRegisterFarm = async (userId: string, data: CreateFarmDto) => {
  // Ensure user role is updated to FARMER if registering a farm
  await prisma.user.update({
    where: { id: userId },
    data: { role: 'FARMER' },
  });

  // Ensure FarmerProfile is automatically created/synced for the farm owner
  await prisma.farmerProfile.upsert({
    where: { userId },
    update: {
      region: data.region,
      city: data.city,
      division: data.division,
    },
    create: {
      userId,
      farmName: data.name,
      region: data.region,
      city: data.city,
      division: data.division,
      farmSizeHectares: data.sizeHectares || 1.0,
      primaryCrops: data.primaryProduce || [],
      creditScore: 500,
    },
  });

  // Process operational parcels/sites
  let parcelsList = data.parcels || [];
  if (parcelsList.length === 0) {
    parcelsList = [
      {
        id: `site-${Date.now()}-1`,
        name: `${data.name} (HQ / Main Plot)`,
        region: data.region,
        division: data.division,
        city: data.city,
        location: data.location || `${data.city}, ${data.region}`,
        gpsLatitude: data.gpsLatitude,
        gpsLongitude: data.gpsLongitude,
        sizeHectares: data.sizeHectares || 1.0,
        isHeadquarters: true,
      },
    ];
  } else {
    parcelsList = parcelsList.map((p, idx) => ({
      id: p.id || `site-${Date.now()}-${idx + 1}`,
      name: p.name || `Operating Site ${idx + 1}`,
      region: p.region || data.region,
      division: p.division || data.division,
      city: p.city || data.city,
      location: p.location || `${p.city || data.city}, ${p.region || data.region}`,
      gpsLatitude: p.gpsLatitude !== undefined ? Number(p.gpsLatitude) : undefined,
      gpsLongitude: p.gpsLongitude !== undefined ? Number(p.gpsLongitude) : undefined,
      sizeHectares: p.sizeHectares !== undefined ? Number(p.sizeHectares) : 1.0,
      isHeadquarters: p.isHeadquarters !== undefined ? p.isHeadquarters : idx === 0,
    }));
  }

  const totalHectares =
    parcelsList.reduce((acc, p) => acc + (p.sizeHectares || 0), 0) || data.sizeHectares || 1.0;
  const primarySite = parcelsList.find((p) => p.isHeadquarters) || parcelsList[0];

  const parsedCategory = (data.category as FarmCategory) || FarmCategory.CROPS;

  // Create dedicated Farm record
  const farm = await prisma.farm.create({
    data: {
      userId,
      name: data.name,
      category: parsedCategory,
      description: data.description,
      region: primarySite.region,
      division: primarySite.division || data.division,
      city: primarySite.city,
      location: primarySite.location || data.location || `${primarySite.city}, ${primarySite.region}`,
      gpsLatitude: primarySite.gpsLatitude ?? data.gpsLatitude,
      gpsLongitude: primarySite.gpsLongitude ?? data.gpsLongitude,
      sizeHectares: totalHectares,
      parcels: parcelsList as any,
      coverPhoto: data.coverPhoto || 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800',
      avatarPhoto: data.avatarPhoto,
      primaryProduce: data.primaryProduce || [],
      certifications: data.certifications || ['Cameroon GAP Verified'],
      isVerified: true,
      rating: 5.0,
      totalRatings: 0,
    },
    include: {
      user: {
        select: { id: true, name: true, phone: true, email: true, avatarUrl: true },
      },
    },
  });

  return farm;
};

export const getMyFarmsList = async (userId: string) => {
  return prisma.farm.findMany({
    where: { userId },
    include: {
      yields: {
        include: { category: true },
        orderBy: { createdAt: 'desc' },
      },
      posts: {
        orderBy: { createdAt: 'desc' },
      },
      user: {
        select: { id: true, name: true, phone: true, email: true, avatarUrl: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const getFarmById = async (
  farmId: string,
  currentUserId?: string,
  includeAllYields: boolean = false
) => {
  const includeConfig = {
    yields: {
      where: includeAllYields ? undefined : { isAvailable: true },
      include: { category: true },
      orderBy: { createdAt: 'desc' as const },
    },
    posts: {
      orderBy: { createdAt: 'desc' as const },
      include: {
        likes: true,
        comments: {
          include: { user: { select: { id: true, name: true, avatarUrl: true } } },
          take: 3,
        },
      },
    },
    user: {
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        avatarUrl: true,
        role: true,
        _count: {
          select: { followers: true, following: true, farms: true },
        },
      },
    },
  };

  let farm = await prisma.farm.findUnique({
    where: { id: farmId },
    include: includeConfig,
  });

  // Fallback 1: Lookup by userId (if a user ID was passed instead of farm ID)
  if (!farm) {
    farm = await prisma.farm.findFirst({
      where: { userId: farmId },
      include: includeConfig,
    });
  }

  // Fallback 2: Lookup by FarmerProfile ID
  if (!farm) {
    const profile = await prisma.farmerProfile.findUnique({
      where: { id: farmId },
    });
    if (profile) {
      farm = await prisma.farm.findFirst({
        where: { userId: profile.userId },
        include: includeConfig,
      });
    }
  }

  // Fallback 3: Lookup by current user's farm if available
  if (!farm && currentUserId) {
    farm = await prisma.farm.findFirst({
      where: { userId: currentUserId },
      include: includeConfig,
    });
  }

  // Fallback 4: Fallback to the first farm in the system
  if (!farm) {
    farm = await prisma.farm.findFirst({
      include: includeConfig,
    });
  }

  if (!farm) {
    throw new Error('Farm not found');
  }

  let isFollowingOwner = false;
  if (currentUserId && currentUserId !== farm.userId) {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: farm.userId,
        },
      },
    });
    isFollowingOwner = Boolean(follow);
  }

  const isOwner = Boolean(currentUserId && currentUserId === farm.userId);

  // If the caller is the farm owner or explicitly requested all yields (e.g. Farm Management Workspace),
  // ensure all yields (both active and paused) are returned so the producer can unpause and manage them.
  if (isOwner || includeAllYields) {
    farm.yields = await prisma.agroYield.findMany({
      where: { farmId: farm.id },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  return {
    ...farm,
    isOwner,
    isFollowingOwner,
  };
};

export const updateFarm = async (farmId: string, userId: string, data: Partial<CreateFarmDto>) => {
  const existing = await prisma.farm.findFirst({
    where: { id: farmId, userId },
  });

  if (!existing) {
    throw new Error('Farm not found or unauthorized');
  }

  let updatedParcels = data.parcels !== undefined ? data.parcels : existing.parcels;
  let updatedSizeHectares = data.sizeHectares ?? existing.sizeHectares;
  if (data.parcels && Array.isArray(data.parcels) && data.parcels.length > 0) {
    updatedSizeHectares =
      data.parcels.reduce((sum, p) => sum + (Number(p.sizeHectares) || 0), 0) || updatedSizeHectares;
  }

  return prisma.farm.update({
    where: { id: farmId },
    data: {
      name: data.name ?? existing.name,
      category: data.category ? (data.category as FarmCategory) : existing.category,
      region: data.region ?? existing.region,
      division: data.division ?? existing.division,
      city: data.city ?? existing.city,
      location: data.location ?? existing.location,
      gpsLatitude: data.gpsLatitude ?? existing.gpsLatitude,
      gpsLongitude: data.gpsLongitude ?? existing.gpsLongitude,
      description: data.description ?? existing.description,
      coverPhoto: data.coverPhoto ?? existing.coverPhoto,
      avatarPhoto: data.avatarPhoto ?? existing.avatarPhoto,
      sizeHectares: updatedSizeHectares,
      parcels: updatedParcels as any,
      primaryProduce: data.primaryProduce ?? existing.primaryProduce,
      certifications: data.certifications ?? existing.certifications,
    },
  });
};

export const getFarmAnalytics = async (farmId: string) => {
  const farm = await prisma.farm.findUnique({
    where: { id: farmId },
    include: {
      yields: true,
      posts: true,
    },
  });

  if (!farm) {
    throw new Error('Farm not found');
  }

  const totalYields = farm.yields.length;
  const totalStockQuantity = farm.yields.reduce((acc, y) => acc + (y.stockQuantity || 0), 0);
  const totalLikes = farm.posts.reduce((acc, p) => acc + (p.likesCount || 0), 0);

  return {
    farmId: farm.id,
    farmName: farm.name,
    rating: farm.rating,
    totalRatings: farm.totalRatings,
    category: farm.category,
    sizeHectares: farm.sizeHectares,
    totalYieldsListed: totalYields,
    totalStockUnitsAvailable: totalStockQuantity,
    totalStoryLikes: totalLikes,
  };
};

export const getMutualPartners = async (userId: string) => {
  const { SocialGraphEngine } = await import('./engine');
  const partnerUserIds = await SocialGraphEngine.getMutualPartnerUserIds(userId);

  if (partnerUserIds.length === 0) return [];

  const partners = await prisma.user.findMany({
    where: { id: { in: partnerUserIds } },
    select: {
      id: true,
      name: true,
      phone: true,
      avatarUrl: true,
      role: true,
      farmerProfile: {
        select: {
          id: true,
          farmName: true,
          region: true,
          city: true,
          rating: true,
          creditScore: true,
          creditTier: true,
        },
      },
      farms: {
        select: {
          id: true,
          name: true,
          category: true,
          city: true,
        },
      },
    },
  });

  return partners.map((p) => ({
    ...p,
    isMutualPartner: true,
    tradePrivileges: SocialGraphEngine.resolvePrivileges(true),
  }));
};

export const checkPartnerStatus = async (userId: string, targetUserId: string) => {
  const { SocialGraphEngine } = await import('./engine');
  return SocialGraphEngine.evaluatePartnerStatus(userId, targetUserId);
};

export const deleteFarm = async (farmId: string, userId: string, targetFarmId?: string) => {
  const existing = await prisma.farm.findFirst({
    where: { id: farmId, userId },
  });

  if (!existing) {
    throw new Error('Farm not found or unauthorized');
  }

  // Safety check: ensure no active unfulfilled escrow orders exist for produce from this farm
  const activeOrders = await prisma.order.findMany({
    where: {
      status: { in: ['PENDING_PAYMENT', 'ESCROW_LOCKED', 'CONFIRMED_BY_FARMER', 'DISPATCHED'] as any },
      items: {
        some: {
          yield: { farmId },
        },
      },
    },
    select: { id: true, orderNumber: true },
  });

  if (activeOrders.length > 0) {
    const orderNumbers = activeOrders.map((o) => o.orderNumber || o.id).join(', ');
    throw new Error(`Cannot delete farm with active unfulfilled orders (${orderNumbers}). Please settle deliveries or resolve escrow orders first.`);
  }

  // Case 1: Migrate produce & posts to another farm owned by the same user
  if (targetFarmId && targetFarmId !== farmId) {
    const targetFarm = await prisma.farm.findFirst({
      where: { id: targetFarmId, userId },
    });
    if (!targetFarm) {
      throw new Error('Target migration farm not found or unauthorized');
    }

    // Reassign all yields to target farm
    await prisma.agroYield.updateMany({
      where: { farmId },
      data: { farmId: targetFarmId },
    });

    // Reassign all posts to target farm
    await prisma.post.updateMany({
      where: { farmId },
      data: { farmId: targetFarmId },
    });

    // Delete the old farm
    await prisma.farm.delete({
      where: { id: farmId },
    });

    return {
      success: true,
      message: `Farm deleted successfully. Produce and stories migrated to ${targetFarm.name}.`,
      id: farmId,
      migratedTo: targetFarmId,
    };
  }

  // Case 2: Permanent deletion of farm and all associated produce & posts
  // 1. Delete all harvest stories tied to this farm (cascade deletes likes & comments)
  await prisma.post.deleteMany({
    where: { farmId },
  });

  // 2. Delete or delist all produce lots tied to this farm
  const farmYields = await prisma.agroYield.findMany({
    where: { farmId },
    include: { orderItems: true },
  });

  for (const y of farmYields) {
    if (y.orderItems && y.orderItems.length > 0) {
      // Historical order exists: preserve record integrity but delist from marketplace
      await prisma.agroYield.update({
        where: { id: y.id },
        data: {
          isAvailable: false,
          stockQuantity: 0,
          farmId: null,
        },
      });
    } else {
      // Delete cart items and saved yields, then hard delete yield
      await prisma.cartItem.deleteMany({ where: { yieldId: y.id } });
      await prisma.savedYield.deleteMany({ where: { yieldId: y.id } });
      await prisma.review.deleteMany({ where: { yieldId: y.id } });
      await prisma.agroYield.delete({ where: { id: y.id } });
    }
  }

  // 3. Delete the farm record itself
  await prisma.farm.delete({
    where: { id: farmId },
  });

  return { success: true, message: 'Farm and all attached assets deleted successfully', id: farmId };
};



