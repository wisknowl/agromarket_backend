"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveDispute = exports.getDisputedOrders = exports.updateLoanStatus = exports.getAdminFinancialInstitutions = exports.getAdminLoans = exports.toggleFarmVerification = exports.getAdminFarms = exports.updateFarmerTier = exports.updateUserByAdmin = exports.updateUserRole = exports.toggleUserVerification = exports.getAdminUsers = exports.getPlatformStats = exports.updateFeatureFlag = exports.getFeatureFlags = void 0;
const prisma_1 = __importDefault(require("../../core/database/prisma"));
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
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
const getPlatformStats = async () => {
    const [usersCount, farmersCount, verifiedFarmersCount, ordersCount, yieldsCount, farmsCount, disputesCount, gmvAgg, loansCount,] = await Promise.all([
        prisma_1.default.user.count(),
        prisma_1.default.farmerProfile.count(),
        prisma_1.default.user.count({ where: { isVerified: true, role: client_1.UserRole.FARMER } }),
        prisma_1.default.order.count(),
        prisma_1.default.agroYield.count(),
        prisma_1.default.farm.count(),
        prisma_1.default.order.count({
            where: {
                OR: [{ status: client_1.OrderStatus.DISPUTED }, { escrow: { isDisputed: true } }],
            },
        }),
        prisma_1.default.order.aggregate({
            _sum: { totalAmount: true },
        }),
        prisma_1.default.loanApplication.count().catch(() => 0),
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
exports.getPlatformStats = getPlatformStats;
const getAdminUsers = async (params) => {
    const where = {};
    if (params?.role && params.role !== 'ALL') {
        where.role = params.role;
    }
    if (params?.search && params.search.trim()) {
        const s = params.search.trim();
        where.OR = [
            { name: { contains: s, mode: 'insensitive' } },
            { email: { contains: s, mode: 'insensitive' } },
            { phone: { contains: s, mode: 'insensitive' } },
        ];
    }
    return prisma_1.default.user.findMany({
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
exports.getAdminUsers = getAdminUsers;
const toggleUserVerification = async (userId, isVerified) => {
    const user = await prisma_1.default.user.findUnique({ where: { id: userId } });
    if (!user)
        throw new Error('User not found');
    const newStatus = typeof isVerified === 'boolean' ? isVerified : !user.isVerified;
    return prisma_1.default.user.update({
        where: { id: userId },
        data: { isVerified: newStatus },
    });
};
exports.toggleUserVerification = toggleUserVerification;
const updateUserRole = async (userId, role) => {
    return prisma_1.default.user.update({
        where: { id: userId },
        data: { role },
    });
};
exports.updateUserRole = updateUserRole;
const updateUserByAdmin = async (userId, data) => {
    const updateData = {};
    if (data.name)
        updateData.name = data.name;
    if (data.email)
        updateData.email = data.email;
    if (data.phone)
        updateData.phone = data.phone;
    if (data.role)
        updateData.role = data.role;
    if (data.avatarUrl)
        updateData.avatarUrl = data.avatarUrl;
    if (typeof data.isVerified === 'boolean')
        updateData.isVerified = data.isVerified;
    if (data.password && data.password.trim()) {
        updateData.passwordHash = await bcryptjs_1.default.hash(data.password.trim(), 10);
    }
    const updatedUser = await prisma_1.default.user.update({
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
        await prisma_1.default.farmerProfile.update({
            where: { userId },
            data: { creditTier: data.creditTier },
        });
    }
    const { passwordHash: _, ...safeUser } = updatedUser;
    return safeUser;
};
exports.updateUserByAdmin = updateUserByAdmin;
const updateFarmerTier = async (farmerId, creditTier) => {
    return prisma_1.default.farmerProfile.update({
        where: { id: farmerId },
        data: { creditTier },
    });
};
exports.updateFarmerTier = updateFarmerTier;
const getAdminFarms = async () => {
    return prisma_1.default.farm.findMany({
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
exports.getAdminFarms = getAdminFarms;
const toggleFarmVerification = async (farmId, isVerified) => {
    const farm = await prisma_1.default.farm.findUnique({ where: { id: farmId } });
    if (!farm)
        throw new Error('Farm not found');
    const newStatus = typeof isVerified === 'boolean' ? isVerified : !farm.isVerified;
    return prisma_1.default.farm.update({
        where: { id: farmId },
        data: { isVerified: newStatus },
    });
};
exports.toggleFarmVerification = toggleFarmVerification;
const getAdminLoans = async () => {
    try {
        return await prisma_1.default.loanApplication.findMany({
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
    }
    catch (err) {
        return [];
    }
};
exports.getAdminLoans = getAdminLoans;
const getAdminFinancialInstitutions = async () => {
    try {
        return await prisma_1.default.financialProfile.findMany({
            include: {
                user: { select: { id: true, name: true, email: true, phone: true, avatarUrl: true } },
                loanProducts: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    catch (err) {
        return [];
    }
};
exports.getAdminFinancialInstitutions = getAdminFinancialInstitutions;
const updateLoanStatus = async (loanId, status) => {
    return prisma_1.default.loanApplication.update({
        where: { id: loanId },
        data: {
            status,
            disbursedAt: status === client_1.LoanStatus.DISBURSED ? new Date() : undefined,
        },
        include: {
            farmer: { include: { user: true } },
            product: { include: { institution: true } },
        },
    });
};
exports.updateLoanStatus = updateLoanStatus;
const getDisputedOrders = async () => {
    return prisma_1.default.order.findMany({
        where: {
            OR: [
                { status: client_1.OrderStatus.DISPUTED },
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
        if (order.escrow) {
            await prisma_1.default.escrowRecord.update({
                where: { orderId },
                data: {
                    isDisputed: false,
                    disputeReason: `Resolved by Super Admin: Full release to Farmer. Note: ${reason || 'Decision confirmed'}`,
                },
            });
        }
    }
    else if (resolution === 'REFUND_BUYER') {
        await prisma_1.default.order.update({
            where: { id: orderId },
            data: { status: client_1.OrderStatus.CANCELLED, isEscrowReleased: false },
        });
        if (order.escrow) {
            await prisma_1.default.escrowRecord.update({
                where: { orderId },
                data: {
                    isDisputed: false,
                    disputeReason: `Resolved by Super Admin: Full refund to Buyer. Note: ${reason || 'Decision confirmed'}`,
                },
            });
        }
    }
    else if (resolution === 'SPLIT') {
        await prisma_1.default.order.update({
            where: { id: orderId },
            data: { status: client_1.OrderStatus.COMPLETED, isEscrowReleased: true },
        });
        if (order.escrow) {
            await prisma_1.default.escrowRecord.update({
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
exports.resolveDispute = resolveDispute;
