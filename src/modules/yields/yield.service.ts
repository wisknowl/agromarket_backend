import { ProduceUnit } from '@prisma/client';
import prisma from '../../core/database/prisma';


export const getAllYields = async (params: {
  category?: string;
  region?: string;
  search?: string;
  farmId?: string;
  isWholesale?: boolean;
  isOrganic?: boolean;
}) => {
  const { category, region, search, farmId, isWholesale, isOrganic } = params;

  return prisma.agroYield.findMany({
    where: {
      isAvailable: true,
      ...(farmId && { farmId }),
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
      farm: true,
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
      farm: true,
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
export interface CreateYieldDto {
  farmId?: string;
  categoryId: string;
  categoryName?: string;
  title: string;
  frenchTitle?: string;
  description: string;
  originRegion: string;
  pricePerUnit: number;
  oldPrice?: number;
  unit: string;
  customUnit?: string;
  seasonality?: string;
  shelfLifeDays?: number;
  stockQuantity: number;
  minOrderQuantity?: number;
  isWholesaleBulkAvailable?: boolean;
  bulkMinQuantity?: number;
  bulkPricePerUnit?: number;
  isOrganic?: boolean;
  harvestDate?: string;
  mediaUrls: string[];
}

export const createYield = async (userId: string, data: CreateYieldDto) => {
  let farmerId: string | undefined;
  const farmer = await prisma.farmerProfile.findUnique({
    where: { userId },
  });

  if (farmer) {
    farmerId = farmer.id;
  }

  // 1. Resolve Category Safely to avoid Foreign Key Violations
  let category = await prisma.category.findUnique({
    where: { id: data.categoryId },
  });

  if (!category && (data.categoryName || data.categoryId)) {
    const searchTarget = data.categoryName || data.categoryId;
    category = await prisma.category.findFirst({
      where: {
        OR: [
          { name: { equals: searchTarget, mode: 'insensitive' } },
          { name: { contains: searchTarget.replace(/^cat-/, '').trim(), mode: 'insensitive' } },
          { frenchName: { contains: searchTarget, mode: 'insensitive' } },
        ],
      },
    });
  }

  if (!category) {
    category = await prisma.category.findFirst();
  }

  if (!category) {
    category = await prisma.category.create({
      data: {
        name: 'Vegetables & Greens',
        frenchName: 'Légumes & Maraîchers',
        description: 'Fresh farm produce and harvests',
      },
    });
  }

  // 2. Map Unit safely to PostgreSQL ProduceUnit enum
  const VALID_PRISMA_UNITS = ['KG', 'CRATE', 'BAG_50KG', 'BAG_100KG', 'BUCKET', 'BUNCH', 'NET'];
  let mappedUnit: ProduceUnit = 'KG';
  const rawUnit = (data.unit || 'KG').toUpperCase();

  if (VALID_PRISMA_UNITS.includes(rawUnit)) {
    mappedUnit = rawUnit as ProduceUnit;
  } else if (rawUnit === 'BAG_25KG') {
    mappedUnit = 'BAG_50KG';
  } else if (rawUnit === 'BASIN') {
    mappedUnit = 'BUCKET';
  } else if (rawUnit === 'PIECE' || rawUnit === 'BUNCH') {
    mappedUnit = 'BUNCH';
  } else if (rawUnit === 'TON') {
    mappedUnit = 'BAG_100KG';
  } else if (rawUnit === 'CARTON' || rawUnit === 'NET') {
    mappedUnit = 'NET';
  } else {
    mappedUnit = 'KG';
  }

  // 3. Enrich Description with Agricultural Context (Custom Unit, Seasonality, Shelf-Life)
  let enrichedDesc = data.description || '';
  const badges: string[] = [];
  if (data.customUnit) {
    badges.push(`Unit: ${data.customUnit}`);
  }
  if (data.seasonality) {
    badges.push(`Season: ${data.seasonality}`);
  }
  if (data.shelfLifeDays) {
    badges.push(`Shelf Life: ${data.shelfLifeDays} days`);
  }
  if (badges.length > 0) {
    enrichedDesc = `${enrichedDesc}\n\n[Agro Info: ${badges.join(' • ')}]`;
  }

  return prisma.agroYield.create({
    data: {
      farmerId,
      farmId: data.farmId,
      categoryId: category.id,
      title: data.title,
      frenchTitle: data.frenchTitle,
      description: enrichedDesc.trim(),
      originRegion: data.originRegion,
      pricePerUnit: data.pricePerUnit,
      oldPrice: data.oldPrice,
      unit: mappedUnit,
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
      farm: true,
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

