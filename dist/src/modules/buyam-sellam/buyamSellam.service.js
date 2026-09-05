"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerOrUpdateWholesaler = exports.getWholesalerProfile = void 0;
const prisma_1 = __importDefault(require("../../core/database/prisma"));
const getWholesalerProfile = async (userId) => {
    const profile = await prisma_1.default.wholesalerProfile.findUnique({
        where: { userId },
        include: {
            user: {
                select: { id: true, name: true, phone: true, email: true, avatarUrl: true },
            },
        },
    });
    if (!profile)
        throw new Error('Buyam-Sellam wholesaler profile not found');
    return profile;
};
exports.getWholesalerProfile = getWholesalerProfile;
const registerOrUpdateWholesaler = async (userId, data) => {
    return prisma_1.default.wholesalerProfile.upsert({
        where: { userId },
        update: {
            businessName: data.businessName,
            tradeLicenseNumber: data.tradeLicenseNumber,
            primaryMarketCity: data.primaryMarketCity,
            buyingCapacityTons: data.buyingCapacityTons || 1.0,
            preferredCommodities: data.preferredCommodities || [],
        },
        create: {
            userId,
            businessName: data.businessName,
            tradeLicenseNumber: data.tradeLicenseNumber,
            primaryMarketCity: data.primaryMarketCity,
            buyingCapacityTons: data.buyingCapacityTons || 1.0,
            preferredCommodities: data.preferredCommodities || [],
        },
    });
};
exports.registerOrUpdateWholesaler = registerOrUpdateWholesaler;
