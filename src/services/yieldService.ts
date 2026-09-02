import { PrismaClient, ProduceUnit } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateYieldDto {
  categoryId: string;
  title: string;
  frenchTitle?: string;
  description: string;
  originRegion: string;
  pricePerUnit: number;
  oldPrice?: number;
  unit: ProduceUnit;
  stockQuantity: number;
  minOrderQuantity?: number;
  isWholesaleBulkAvailable?: boolean;
  bulkMinQuantity?: number;
  bulkPricePerUnit?: number;
  isOrganic?: boolean;
  harvestDate?: string;
  mediaUrls: string[];
}

export const getAllYields = async (params: {
  category?: string;
  region?: string;
  search?: string;
  isWholesale?: boolean;
  isOrganic?: boolean;
}) => {
  const { category, region, search, isWholesale, isOrganic } = params;

  return prisma.agroYield.findMany({
    where: {
      isAvailable: true,
      ...(category && {
        category: {
          name: { contains: category, mode: 'insensitive' },
        },
      }),
      ...(region && {
        originRegion: { contains: region, mode: 'insensitive' },
      }),
      ...(isWholesale !== undefined && { isWholesaleBulkAvailable: isWholesale }),
      ...(isOrganic !== undefined && { isOrganic }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { frenchTitle: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { originRegion: { contains: search, mode: 'insensitive' } },
        ],
      }),
    },
    include: {
      category: true,
      farmer: {
        include: {
          user: {
            select: { id: true, name: true, phone: true, avatarUrl: true },
          },
        },
      },
      pricingTiers: true,
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const getYieldById = async (id: string) => {
  const yieldItem = await prisma.agroYield.findUnique({
    where: { id },
    include: {
      category: true,
      farmer: {
        include: {
          user: {
            select: { id: true, name: true, phone: true, avatarUrl: true },
          },
        },
      },
      pricingTiers: true,
      reviews: {
        include: {
          user: {
            select: { id: true, name: true, avatarUrl: true },
          },
        },
      },
    },
  });

  if (!yieldItem) throw new Error('AgroYield product not found');
  return yieldItem;
};

export const createYield = async (userId: string, data: CreateYieldDto) => {
  const farmer = await prisma.farmerProfile.findUnique({
    where: { userId },
  });

  if (!farmer) {
    throw new Error('Only registered farmers can list AgroYield harvests');
  }

  return prisma.agroYield.create({
    data: {
      farmerId: farmer.id,
      categoryId: data.categoryId,
      title: data.title,
      frenchTitle: data.frenchTitle,
      description: data.description,
      originRegion: data.originRegion,
      pricePerUnit: data.pricePerUnit,
      oldPrice: data.oldPrice,
      unit: data.unit,
      stockQuantity: data.stockQuantity,
      minOrderQuantity: data.minOrderQuantity || 1,
      isWholesaleBulkAvailable: data.isWholesaleBulkAvailable || false,
      bulkMinQuantity: data.bulkMinQuantity,
      bulkPricePerUnit: data.bulkPricePerUnit,
      isOrganic: data.isOrganic || false,
      harvestDate: data.harvestDate ? new Date(data.harvestDate) : new Date(),
      mediaUrls: data.mediaUrls,
    },
    include: {
      category: true,
      farmer: true,
    },
  });
};

export const getAllCategories = async () => {
  return prisma.category.findMany({
    include: {
      _count: {
        select: { yields: true },
      },
    },
  });
};
