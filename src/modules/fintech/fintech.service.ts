import { LoanStatus, CreditTier } from '@prisma/client';
import prisma from '../../core/database/prisma';

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

  // Compute live score breakdown based on completed deliveries
  const completedOrders = await prisma.orderItem.count({
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
      [CreditTier.BRONZE]: 'Standard Producer (Up to 500,000 FCFA Loan Eligibility)',
      [CreditTier.SILVER]: 'Verified Producer (Up to 1,500,000 FCFA Loan Eligibility)',
      [CreditTier.GOLD]: 'Master Producer (Up to 5,000,000 FCFA Loan Eligibility & Priority MoMo Payout)',
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
