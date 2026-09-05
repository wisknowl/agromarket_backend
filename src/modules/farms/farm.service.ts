import prisma from '../../core/database/prisma';
import { FarmCategory } from '@prisma/client';

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
}

export const createOrRegisterFarm = async (userId: string, data: CreateFarmDto) => {
  // Ensure user role is updated to FARMER if registering a farm
  await prisma.user.update({
    where: { id: userId },
    data: { role: 'FARMER' },
  });

  const parsedCategory = (data.category as FarmCategory) || FarmCategory.CROPS;

  // Create dedicated Farm record
  const farm = await prisma.farm.create({
    data: {
      userId,
      name: data.name,
      category: parsedCategory,
      description: data.description,
      region: data.region,
      division: data.division,
      city: data.city,
      location: data.location || `${data.city}, ${data.region}`,
      gpsLatitude: data.gpsLatitude,
      gpsLongitude: data.gpsLongitude,
      sizeHectares: data.sizeHectares || 1.0,
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

export const getFarmById = async (farmId: string, currentUserId?: string) => {
  const farm = await prisma.farm.findUnique({
    where: { id: farmId },
    include: {
      yields: {
        where: { isAvailable: true },
        include: { category: true },
        orderBy: { createdAt: 'desc' },
      },
      posts: {
        orderBy: { createdAt: 'desc' },
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
    },
  });

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
      sizeHectares: data.sizeHectares ?? existing.sizeHectares,
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

