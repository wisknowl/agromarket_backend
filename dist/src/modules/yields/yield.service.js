"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllCategories = exports.createYield = exports.getYieldById = exports.getAllYields = void 0;
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
    let farmerId;
    const farmer = await prisma_1.default.farmerProfile.findUnique({
        where: { userId },
    });
    if (farmer) {
        farmerId = farmer.id;
    }
    return prisma_1.default.agroYield.create({
        data: {
            farmerId,
            farmId: data.farmId,
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
