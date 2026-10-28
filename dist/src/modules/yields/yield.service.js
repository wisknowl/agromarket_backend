"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteYield = exports.updateYield = exports.getAllCategories = exports.createYield = exports.getYieldById = exports.getAllYields = void 0;
const prisma_1 = __importDefault(require("../../core/database/prisma"));
const getAllYields = async (params) => {
    const { category, region, search, farmId, isWholesale, isOrganic } = params;
    return prisma_1.default.agroYield.findMany({
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
exports.getAllYields = getAllYields;
const getYieldById = async (id) => {
    const yieldItem = await prisma_1.default.agroYield.findUnique({
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
    if (!yieldItem)
        throw new Error('AgroYield product not found');
    return yieldItem;
};
exports.getYieldById = getYieldById;
const createYield = async (userId, data) => {
    let farmer = await prisma_1.default.farmerProfile.findUnique({
        where: { userId },
    });
    // 0. Ensure farmId is resolved (either passed or user's primary farm)
    let targetFarmId = data.farmId;
    if (!targetFarmId) {
        const defaultFarm = await prisma_1.default.farm.findFirst({ where: { userId } });
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
            const farmObj = await prisma_1.default.farm.findUnique({ where: { id: targetFarmId } });
            if (farmObj) {
                farmName = farmObj.name;
                region = farmObj.region;
                city = farmObj.city;
            }
        }
        farmer = await prisma_1.default.farmerProfile.create({
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
    let category = await prisma_1.default.category.findUnique({
        where: { id: data.categoryId },
    });
    if (!category && (data.categoryName || data.categoryId)) {
        const searchTarget = data.categoryName || data.categoryId;
        category = await prisma_1.default.category.findFirst({
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
        category = await prisma_1.default.category.findFirst();
    }
    if (!category) {
        category = await prisma_1.default.category.create({
            data: {
                name: 'Vegetables & Greens',
                frenchName: 'Légumes & Maraîchers',
                description: 'Fresh farm produce and harvests',
            },
        });
    }
    // 2. Map Unit safely to PostgreSQL ProduceUnit enum
    const VALID_PRISMA_UNITS = ['KG', 'CRATE', 'BAG_50KG', 'BAG_100KG', 'BUCKET', 'BUNCH', 'NET'];
    let mappedUnit = 'KG';
    const rawUnit = (data.unit || 'KG').toUpperCase();
    if (VALID_PRISMA_UNITS.includes(rawUnit)) {
        mappedUnit = rawUnit;
    }
    else if (rawUnit === 'BAG_25KG') {
        mappedUnit = 'BAG_50KG';
    }
    else if (rawUnit === 'BASIN') {
        mappedUnit = 'BUCKET';
    }
    else if (rawUnit === 'PIECE' || rawUnit === 'BUNCH') {
        mappedUnit = 'BUNCH';
    }
    else if (rawUnit === 'TON') {
        mappedUnit = 'BAG_100KG';
    }
    else if (rawUnit === 'CARTON' || rawUnit === 'NET') {
        mappedUnit = 'NET';
    }
    else {
        mappedUnit = 'KG';
    }
    // 3. Enrich Description with Agricultural Context (Custom Unit, Seasonality, Shelf-Life)
    let enrichedDesc = data.description || '';
    const badges = [];
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
    return prisma_1.default.agroYield.create({
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
exports.createYield = createYield;
const getAllCategories = async () => {
    return prisma_1.default.category.findMany({
        include: {
            _count: {
                select: { yields: true },
            },
        },
    });
};
exports.getAllCategories = getAllCategories;
const updateYield = async (userId, userRole, yieldId, updates) => {
    const yieldItem = await prisma_1.default.agroYield.findUnique({
        where: { id: yieldId },
        include: {
            farm: true,
            farmer: true,
        },
    });
    if (!yieldItem) {
        throw new Error('AgroYield product not found');
    }
    const isOwner = yieldItem.farm?.userId === userId ||
        yieldItem.farmer?.userId === userId ||
        userRole === 'ADMIN';
    if (!isOwner) {
        throw new Error('Forbidden: You do not have permission to modify this produce listing');
    }
    let newStockQuantity = yieldItem.stockQuantity;
    if (updates.stockQuantity !== undefined) {
        newStockQuantity = Math.max(0, updates.stockQuantity);
    }
    else if (updates.stockDelta !== undefined) {
        newStockQuantity = Math.max(0, yieldItem.stockQuantity + updates.stockDelta);
    }
    let isAvailable = updates.isAvailable !== undefined ? updates.isAvailable : yieldItem.isAvailable;
    if (newStockQuantity === 0 && updates.isAvailable === undefined) {
        isAvailable = false;
    }
    else if (newStockQuantity > 0 &&
        updates.isAvailable === undefined &&
        !yieldItem.isAvailable &&
        updates.stockDelta &&
        updates.stockDelta > 0) {
        isAvailable = true;
    }
    const VALID_PRISMA_UNITS = ['KG', 'CRATE', 'BAG_50KG', 'BAG_100KG', 'BUCKET', 'BUNCH', 'NET'];
    let mappedUnit = undefined;
    if (updates.unit) {
        const rawUnit = updates.unit.toUpperCase();
        if (VALID_PRISMA_UNITS.includes(rawUnit)) {
            mappedUnit = rawUnit;
        }
        else if (rawUnit === 'BAG_25KG') {
            mappedUnit = 'BAG_50KG';
        }
        else if (rawUnit === 'BASIN') {
            mappedUnit = 'BUCKET';
        }
        else if (rawUnit === 'PIECE' || rawUnit === 'BUNCH') {
            mappedUnit = 'BUNCH';
        }
        else if (rawUnit === 'TON') {
            mappedUnit = 'BAG_100KG';
        }
        else if (rawUnit === 'CARTON' || rawUnit === 'NET') {
            mappedUnit = 'NET';
        }
        else {
            mappedUnit = 'KG';
        }
    }
    let targetCategoryId = updates.categoryId;
    if (!targetCategoryId && updates.categoryName) {
        const cat = await prisma_1.default.category.findFirst({
            where: {
                OR: [
                    { name: { equals: updates.categoryName, mode: 'insensitive' } },
                    { name: { contains: updates.categoryName.replace(/^cat-/, '').trim(), mode: 'insensitive' } },
                ],
            },
        });
        if (cat)
            targetCategoryId = cat.id;
    }
    return prisma_1.default.agroYield.update({
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
exports.updateYield = updateYield;
const deleteYield = async (userId, userRole, yieldId) => {
    const yieldItem = await prisma_1.default.agroYield.findUnique({
        where: { id: yieldId },
        include: { farm: true, farmer: true },
    });
    if (!yieldItem) {
        throw new Error('AgroYield product not found');
    }
    const isOwner = yieldItem.farm?.userId === userId ||
        yieldItem.farmer?.userId === userId ||
        userRole === 'ADMIN';
    if (!isOwner) {
        throw new Error('Forbidden: You do not have permission to delete this produce listing');
    }
    const orderCount = await prisma_1.default.orderItem.count({ where: { yieldId } });
    if (orderCount === 0) {
        await prisma_1.default.savedYield.deleteMany({ where: { yieldId } });
        await prisma_1.default.cartItem.deleteMany({ where: { yieldId } });
        await prisma_1.default.yieldPricingTier.deleteMany({ where: { yieldId } });
        return prisma_1.default.agroYield.delete({ where: { id: yieldId } });
    }
    else {
        // If order history exists, soft-delete and detach so order records remain intact
        return prisma_1.default.agroYield.update({
            where: { id: yieldId },
            data: { isAvailable: false, stockQuantity: 0, farmId: null },
        });
    }
};
exports.deleteYield = deleteYield;
