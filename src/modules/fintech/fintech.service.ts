import { LoanStatus, CreditTier } from '@prisma/client';
import prisma from '../../core/database/prisma';
import { CreditScoringEngine } from './engine';

export const getFarmerCreditScore = async (userId: string) => {
  const farmer = await prisma.farmerProfile.findUnique({
    where: { userId },
    include: {
      loanApplications: {
        include: { product: { include: { institution: true } } },
      },
    },
  });

  if (!farmer) throw new Error('Farmer profile not found');

  // Execute algorithmic credit evaluation engine
  const decision = await CreditScoringEngine.evaluateFarmer({
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
      [CreditTier.BRONZE]: 'Standard Producer (Up to 500,000 FCFA / $800 USD Loan Eligibility)',
      [CreditTier.SILVER]: 'Verified Producer (Up to 1,600,000 FCFA / $2,500 USD Loan Eligibility)',
      [CreditTier.GOLD]: 'Master Producer (Up to 6,500,000 FCFA / $10,000 USD Loan Eligibility & Priority MoMo Payout)',
      [CreditTier.PLATINUM]: 'Elite Cooperative (Up to 15,000,000 FCFA Commercial Credit Line)',
    },
  };
};

export const getAvailableLoanProducts = async () => {
  return prisma.loanProduct.findMany({
    include: {
      institution: true,
    },
  });
};

export const applyForSeasonalLoan = async (
  userId: string,
  data: {
    productId: string;
    purpose: string;
    requestedAmount: number;
    durationMonths: number;
  }
) => {
  const farmer = await prisma.farmerProfile.findUnique({
    where: { userId },
  });

  if (!farmer) throw new Error('Only registered farmers can apply for seasonal loans');

  const product = await prisma.loanProduct.findUnique({
    where: { id: data.productId },
  });

  if (!product) throw new Error('Loan product not found');

  return prisma.loanApplication.create({
    data: {
      farmerId: farmer.id,
      productId: product.id,
      purpose: data.purpose,
      requestedAmount: data.requestedAmount,
      interestRate: product.interestRatePercent,
      durationMonths: data.durationMonths || product.durationMonths,
      status: LoanStatus.SUBMITTED,
      repaymentDeductionPct: 20.0,
    },
    include: {
      product: { include: { institution: true } },
    },
  });
};

export const getMyLoanApplications = async (userId: string) => {
  const farmer = await prisma.farmerProfile.findUnique({
    where: { userId },
  });

  if (!farmer) throw new Error('Farmer profile not found');

  return prisma.loanApplication.findMany({
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
