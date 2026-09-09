"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyLoanApplications = exports.applyForSeasonalLoan = exports.getAvailableLoanProducts = exports.getFarmerCreditScore = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("../../core/database/prisma"));
const engine_1 = require("./engine");
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
    // Execute algorithmic credit evaluation engine
    const decision = await engine_1.CreditScoringEngine.evaluateFarmer({
        farmerId: farmer.id,
        triggeredBy: 'API_GET_CREDIT_SCORE',
    });
    return {
        ...decision,
        farmerName: farmer.farmName,
        rating: farmer.rating,
        totalRatings: farmer.totalRatings,
        loanApplications: farmer.loanApplications,
        tierDetails: {
            [client_1.CreditTier.BRONZE]: 'Standard Producer (Up to 500,000 FCFA / $800 USD Loan Eligibility)',
            [client_1.CreditTier.SILVER]: 'Verified Producer (Up to 1,600,000 FCFA / $2,500 USD Loan Eligibility)',
            [client_1.CreditTier.GOLD]: 'Master Producer (Up to 6,500,000 FCFA / $10,000 USD Loan Eligibility & Priority MoMo Payout)',
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
const getMyLoanApplications = async (userId) => {
    const farmer = await prisma_1.default.farmerProfile.findUnique({
        where: { userId },
    });
    if (!farmer)
        throw new Error('Farmer profile not found');
    return prisma_1.default.loanApplication.findMany({
        where: { farmerId: farmer.id },
        include: {
            product: {
                include: {
                    institution: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });
};
exports.getMyLoanApplications = getMyLoanApplications;
