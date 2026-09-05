"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyForSeasonalLoan = exports.getAvailableLoanProducts = exports.getFarmerCreditScore = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("../../core/database/prisma"));
const getFarmerCreditScore = async (userId) => {
    const farmer = await prisma_1.default.farmerProfile.findUnique({
        where: { userId },
        include: {
            loanApplications: {
                include: { product: { include: { institution: true } } },
            },
        },
    });
    if (!farmer)
        throw new Error('Farmer profile not found');
    // Compute live score breakdown based on completed deliveries
    const completedOrders = await prisma_1.default.orderItem.count({
        where: {
            farmerId: farmer.id,
            order: { status: 'COMPLETED' },
        },
    });
    return {
        creditScore: farmer.creditScore,
        creditTier: farmer.creditTier,
        rating: farmer.rating,
        totalRatings: farmer.totalRatings,
        completedOrders,
        loanApplications: farmer.loanApplications,
        tierDetails: {
            [client_1.CreditTier.BRONZE]: 'Standard Producer (Up to 500,000 FCFA Loan Eligibility)',
            [client_1.CreditTier.SILVER]: 'Verified Producer (Up to 1,500,000 FCFA Loan Eligibility)',
            [client_1.CreditTier.GOLD]: 'Master Producer (Up to 5,000,000 FCFA Loan Eligibility & Priority MoMo Payout)',
            [client_1.CreditTier.PLATINUM]: 'Elite Cooperative (Up to 15,000,000 FCFA Commercial Credit Line)',
        },
    };
};
exports.getFarmerCreditScore = getFarmerCreditScore;
const getAvailableLoanProducts = async () => {
    return prisma_1.default.loanProduct.findMany({
        include: {
            institution: true,
        },
    });
};
exports.getAvailableLoanProducts = getAvailableLoanProducts;
const applyForSeasonalLoan = async (userId, data) => {
    const farmer = await prisma_1.default.farmerProfile.findUnique({
        where: { userId },
    });
    if (!farmer)
        throw new Error('Only registered farmers can apply for seasonal loans');
    const product = await prisma_1.default.loanProduct.findUnique({
        where: { id: data.productId },
    });
    if (!product)
        throw new Error('Loan product not found');
    return prisma_1.default.loanApplication.create({
        data: {
            farmerId: farmer.id,
            productId: product.id,
            purpose: data.purpose,
            requestedAmount: data.requestedAmount,
            interestRate: product.interestRatePercent,
            durationMonths: data.durationMonths || product.durationMonths,
            status: client_1.LoanStatus.SUBMITTED,
            repaymentDeductionPct: 20.0,
        },
        include: {
            product: { include: { institution: true } },
        },
    });
};
exports.applyForSeasonalLoan = applyForSeasonalLoan;
