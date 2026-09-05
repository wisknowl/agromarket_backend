"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPlatformStats = exports.resolveDispute = exports.getDisputedOrders = exports.updateFeatureFlag = exports.getFeatureFlags = void 0;
const prisma_1 = __importDefault(require("../../core/database/prisma"));
const client_1 = require("@prisma/client");
// In-memory or DB-backed feature flags
let systemFeatureFlags = {
    agroFeedEnabled: true,
    directYieldsEnabled: true,
    basketCheckoutEnabled: true,
    fintechLoansEnabled: true,
    buyamSellamModuleEnabled: true,
    transporterLogisticsEnabled: true,
    instantEscrowAutoRelease: false,
};
const getFeatureFlags = async () => {
    return systemFeatureFlags;
};
exports.getFeatureFlags = getFeatureFlags;
const updateFeatureFlag = async (flagName, isEnabled) => {
    systemFeatureFlags[flagName] = isEnabled;
    return systemFeatureFlags;
};
exports.updateFeatureFlag = updateFeatureFlag;
const getDisputedOrders = async () => {
    return prisma_1.default.order.findMany({
        where: {
            OR: [
                { status: client_1.OrderStatus.DISPUTED },
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
exports.getDisputedOrders = getDisputedOrders;
const resolveDispute = async (orderId, resolution, reason) => {
    const order = await prisma_1.default.order.findUnique({
        where: { id: orderId },
        include: { escrow: true },
    });
    if (!order)
        throw new Error('Order not found');
    if (resolution === 'RELEASE_TO_FARMER') {
        await prisma_1.default.order.update({
            where: { id: orderId },
            data: { status: client_1.OrderStatus.COMPLETED, isEscrowReleased: true },
        });
        await prisma_1.default.escrowRecord.update({
            where: { orderId },
            data: { isDisputed: false, disputeReason: `Resolved by Super Admin: Full release to Farmer. Note: ${reason || 'N/A'}` },
        });
    }
    else if (resolution === 'REFUND_BUYER') {
        await prisma_1.default.order.update({
            where: { id: orderId },
            data: { status: client_1.OrderStatus.CANCELLED, isEscrowReleased: false },
        });
        await prisma_1.default.escrowRecord.update({
            where: { orderId },
            data: { isDisputed: false, disputeReason: `Resolved by Super Admin: Full refund to Buyer. Note: ${reason || 'N/A'}` },
        });
    }
    return { success: true, message: `Dispute on order ${orderId} resolved as ${resolution}` };
};
exports.resolveDispute = resolveDispute;
const getPlatformStats = async () => {
    const [usersCount, farmersCount, ordersCount, yieldsCount] = await Promise.all([
        prisma_1.default.user.count(),
        prisma_1.default.farmerProfile.count(),
        prisma_1.default.order.count(),
        prisma_1.default.agroYield.count(),
    ]);
    return {
        users: usersCount,
        farmers: farmersCount,
        orders: ordersCount,
        yields: yieldsCount,
        featureFlags: systemFeatureFlags,
    };
};
exports.getPlatformStats = getPlatformStats;
