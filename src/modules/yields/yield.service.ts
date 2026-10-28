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
  let farmer = await prisma.farmerProfile.findUnique({
    where: { userId },
  });

  // 0. Ensure farmId is resolved (either passed or user's primary farm)
  let targetFarmId = data.farmId;
  if (!targetFarmId) {
    const defaultFarm = await prisma.farm.findFirst({ where: { userId } });
    if (defaultFarm) {
      targetFarmId = defaultFarm.id;
    }
  }

  // If farmerProfile doesn't exist, create it from the farm or user metadata
  if (!farmer) {
    let farmName = 'Family Agro Farm';
    let region = data.originRegion || 'West Region';
    let city = 'Foumbot';

    if (targetFarmId) {
      const farmObj = await prisma.farm.findUnique({ where: { id: targetFarmId } });
      if (farmObj) {
        farmName = farmObj.name;
        region = farmObj.region;
        city = farmObj.city;
      }
    }

    farmer = await prisma.farmerProfile.create({
      data: {
        userId,
        farmName,
        region,
        city,
        creditScore: 500,
      },
    });
  }

  const farmerId = farmer.id;

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
      farmId: targetFarmId,
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

export interface UpdateYieldDto {
  title?: string;
  frenchTitle?: string;
  description?: string;
  pricePerUnit?: number;
  oldPrice?: number;
  unit?: string;
  originRegion?: string;
  categoryId?: string;
  categoryName?: string;
  stockQuantity?: number;
  stockDelta?: number;
  isAvailable?: boolean;
  minOrderQuantity?: number;
  isWholesaleBulkAvailable?: boolean;
  bulkMinQuantity?: number;
  bulkPricePerUnit?: number;
  isOrganic?: boolean;
  mediaUrls?: string[];
}

export const updateYield = async (
  userId: string,
  userRole: string,
  yieldId: string,
  updates: UpdateYieldDto
) => {
  const yieldItem = await prisma.agroYield.findUnique({
    where: { id: yieldId },
    include: {
      farm: true,
      farmer: true,
    },
  });

  if (!yieldItem) {
    throw new Error('AgroYield product not found');
  }

  const isOwner =
    yieldItem.farm?.userId === userId ||
    yieldItem.farmer?.userId === userId ||
    userRole === 'ADMIN';

  if (!isOwner) {
    throw new Error('Forbidden: You do not have permission to modify this produce listing');
  }

  let newStockQuantity = yieldItem.stockQuantity;
  if (updates.stockQuantity !== undefined) {
    newStockQuantity = Math.max(0, updates.stockQuantity);
  } else if (updates.stockDelta !== undefined) {
    newStockQuantity = Math.max(0, yieldItem.stockQuantity + updates.stockDelta);
  }

  let isAvailable = updates.isAvailable !== undefined ? updates.isAvailable : yieldItem.isAvailable;
  if (newStockQuantity === 0 && updates.isAvailable === undefined) {
    isAvailable = false;
  } else if (
    newStockQuantity > 0 &&
    updates.isAvailable === undefined &&
    !yieldItem.isAvailable &&
    updates.stockDelta &&
    updates.stockDelta > 0
  ) {
    isAvailable = true;
  }

  const VALID_PRISMA_UNITS = ['KG', 'CRATE', 'BAG_50KG', 'BAG_100KG', 'BUCKET', 'BUNCH', 'NET'];
  let mappedUnit: ProduceUnit | undefined = undefined;
  if (updates.unit) {
    const rawUnit = updates.unit.toUpperCase();
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
  }

  let targetCategoryId = updates.categoryId;
  if (!targetCategoryId && updates.categoryName) {
    const cat = await prisma.category.findFirst({
      where: {
        OR: [
          { name: { equals: updates.categoryName, mode: 'insensitive' } },
          { name: { contains: updates.categoryName.replace(/^cat-/, '').trim(), mode: 'insensitive' } },
        ],
      },
    });
    if (cat) targetCategoryId = cat.id;
  }

  return prisma.agroYield.update({
    where: { id: yieldId },
    data: {
      ...(updates.title && { title: updates.title.trim() }),
      ...(updates.frenchTitle !== undefined && { frenchTitle: updates.frenchTitle }),
      ...(updates.description !== undefined && { description: updates.description.trim() }),
      ...(updates.pricePerUnit !== undefined && { pricePerUnit: updates.pricePerUnit }),
      ...(updates.oldPrice !== undefined && { oldPrice: updates.oldPrice }),
      ...(mappedUnit && { unit: mappedUnit }),
      ...(updates.originRegion && { originRegion: updates.originRegion.trim() }),
      ...(targetCategoryId && { categoryId: targetCategoryId }),
      stockQuantity: newStockQuantity,
      isAvailable,
      ...(updates.minOrderQuantity !== undefined && { minOrderQuantity: updates.minOrderQuantity }),
      ...(updates.isWholesaleBulkAvailable !== undefined && {
        isWholesaleBulkAvailable: updates.isWholesaleBulkAvailable,
      }),
      ...(updates.bulkMinQuantity !== undefined && { bulkMinQuantity: updates.bulkMinQuantity }),
      ...(updates.bulkPricePerUnit !== undefined && { bulkPricePerUnit: updates.bulkPricePerUnit }),
      ...(updates.isOrganic !== undefined && { isOrganic: updates.isOrganic }),
      ...(updates.mediaUrls && { mediaUrls: updates.mediaUrls }),
    },
    include: {
      category: true,
      farm: true,
      farmer: true,
      pricingTiers: true,
    },
  });
};

export const deleteYield = async (userId: string, userRole: string, yieldId: string) => {
  const yieldItem = await prisma.agroYield.findUnique({
    where: { id: yieldId },
    include: { farm: true, farmer: true },
  });

  if (!yieldItem) {
    throw new Error('AgroYield product not found');
  }

  const isOwner =
    yieldItem.farm?.userId === userId ||
    yieldItem.farmer?.userId === userId ||
    userRole === 'ADMIN';

  if (!isOwner) {
    throw new Error('Forbidden: You do not have permission to delete this produce listing');
  }

  const orderCount = await prisma.orderItem.count({ where: { yieldId } });
  if (orderCount === 0) {
    await prisma.savedYield.deleteMany({ where: { yieldId } });
    await prisma.cartItem.deleteMany({ where: { yieldId } });
    await prisma.yieldPricingTier.deleteMany({ where: { yieldId } });
    return prisma.agroYield.delete({ where: { id: yieldId } });
  } else {
    // If order history exists, soft-delete and detach so order records remain intact
    return prisma.agroYield.update({
      where: { id: yieldId },
      data: { isAvailable: false, stockQuantity: 0, farmId: null },
    });
  }
};


