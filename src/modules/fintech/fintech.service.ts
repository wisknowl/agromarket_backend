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

export interface AgroVestorCampaign {
  id: string;
  farmerId: string;
  farmerName: string;
  farmName: string;
  avatarUrl: string;
  region: string;
  cropType: string;
  title: string;
  description: string;
  targetAmount: number;
  fundedAmount: number;
  minPledge: number;
  expectedRoiPercent: number;
  durationMonths: number;
  creditScore: number;
  creditTier: CreditTier;
  riskLevel: 'LOW' | 'MODERATE' | 'ELEVATED';
  radar: {
    salesFulfillment: number;
    listingFrequency: number;
    reviewBayesian: number;
    deliveryReliability: number;
    networkReach: number;
    engagementVelocity: number;
    repaymentIntegrity: number;
    kycCompliance: number;
  };
  backersCount: number;
  escrowSecured: boolean;
  status: 'ACTIVE' | 'FUNDED' | 'IN_PRODUCTION' | 'SETTLED';
  createdAt: string;
}

export interface AgroVestorInvestment {
  id: string;
  userId: string;
  userName: string;
  campaignId: string;
  campaignTitle: string;
  farmerName: string;
  farmName: string;
  amountInvested: number;
  projectedReturnAmount: number;
  expectedRoiPercent: number;
  durationMonths: number;
  currency: string;
  paymentMethod: string;
  paymentProvider: string;
  status: 'ESCROW_HELD' | 'PRODUCING' | 'REPAID';
  investedAt: string;
  payoutDueDate: string;
}

export interface AgroPatronSubscription {
  id: string;
  userId: string;
  userName: string;
  farmerId: string;
  farmerName: string;
  farmName: string;
  plan: 'MONTHLY' | 'SEASONAL';
  amount: number;
  currency: string;
  paymentMethod: 'MOBILE_MONEY' | 'CARD' | 'BANK_TRANSFER' | 'AGROWALLET' | string;
  paymentProvider: string;
  discountRatePercent: number;
  hasEarlyHarvestAccess: boolean;
  hasPrivateStoryAccess: boolean;
  subscribedAt: string;
  expiresAt: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
}

const agroVestorCampaignsStore: AgroVestorCampaign[] = [];
const agroVestorInvestmentsStore: AgroVestorInvestment[] = [];
const agroPatronSubscriptionsStore: AgroPatronSubscription[] = [];

export const getAgroVestorCampaigns = async (): Promise<AgroVestorCampaign[]> => {
  if (agroVestorCampaignsStore.length === 0) {
    const farmers = await prisma.farmerProfile.findMany({
      take: 6,
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true, farms: true },
        },
      },
    });

    const defaultFarms = [
      {
        crop: 'Greenhouse Tomatoes & Peppers',
        title: 'Ndop Valley Hybrid Tomato Drip-Irrigation Expansion',
        desc: 'Funding automated solar drip-irrigation kits and F1 hybrid seed nurseries to supply regional wholesale markets during dry season peak pricing.',
        target: 1500000,
        funded: 850000,
        min: 25000,
        roi: 15.0,
        months: 4,
      },
      {
        crop: 'Penja White Pepper Export',
        title: 'Penja Protected Geographical Indication Harvest Lot',
        desc: 'Expanding washed volcanic Penja white pepper processing and curing sheds for international diaspora specialty export contracts.',
        target: 3000000,
        funded: 2100000,
        min: 50000,
        roi: 18.5,
        months: 6,
      },
      {
        crop: 'Foumbot Seed Potatoes',
        title: 'Highland Volcanic Certified Seed Potato Multiplier',
        desc: 'Working with regional agricultural institutes to multiply disease-resistant CIP potato seed tubers across 4 hectares of volcanic loam.',
        target: 2000000,
        funded: 1400000,
        min: 30000,
        roi: 14.0,
        months: 5,
      },
    ];

    for (let idx = 0; idx < defaultFarms.length; idx++) {
      const def = defaultFarms[idx];
      const matchedFarmer = farmers[idx] || farmers[0];
      let score = 760;
      let tier: CreditTier = CreditTier.GOLD;
      let radar = {
        salesFulfillment: 0.88,
        listingFrequency: 0.82,
        reviewBayesian: 0.92,
        deliveryReliability: 0.85,
        networkReach: 0.78,
        engagementVelocity: 0.80,
        repaymentIntegrity: 0.95,
        kycCompliance: 1.0,
      };

      if (matchedFarmer) {
        try {
          const decision = await CreditScoringEngine.evaluateFarmer({
            farmerId: matchedFarmer.id,
            triggeredBy: 'AGROVESTOR_SEED',
          });
          score = decision.ficoScore || 760;
          tier = decision.tier || CreditTier.GOLD;
          if (decision.normalizedRadar) {
            radar = decision.normalizedRadar;
          }
        } catch {
          // Keep defaults
        }
      }

      agroVestorCampaignsStore.push({
        id: `avc-${idx + 1}`,
        farmerId: matchedFarmer?.id || `farmer-${idx + 1}`,
        farmerName: matchedFarmer?.user?.name || (idx === 0 ? 'Tanyi Farms Cooperative' : idx === 1 ? 'Penja Volcanic Estates' : 'Foumbot Seed Multipliers'),
        farmName: matchedFarmer?.farmName || (idx === 0 ? 'Tanyi Organic Valley' : idx === 1 ? 'Penja Heritage Plantation' : 'Highland Potato Nursery'),
        avatarUrl: matchedFarmer?.user?.avatarUrl || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500',
        region: matchedFarmer?.region || (idx === 0 ? 'Northwest Agricultural Belt' : idx === 1 ? 'Littoral Basin' : 'Highland Plateau Corridor'),
        cropType: def.crop,
        title: def.title,
        description: def.desc,
        targetAmount: def.target,
        fundedAmount: def.funded,
        minPledge: def.min,
        expectedRoiPercent: def.roi,
        durationMonths: def.months,
        creditScore: score,
        creditTier: tier,
        riskLevel: tier === CreditTier.PLATINUM || tier === CreditTier.GOLD ? 'LOW' : tier === CreditTier.SILVER ? 'MODERATE' : 'ELEVATED',
        radar,
        backersCount: Math.floor(def.funded / (def.min * 2)) + 3,
        escrowSecured: true,
        status: def.funded >= def.target ? 'FUNDED' : 'ACTIVE',
        createdAt: new Date(Date.now() - (idx + 1) * 86400000 * 3).toISOString(),
      });
    }
  }

  return agroVestorCampaignsStore;
};

export const createAgroVestorCampaign = async (
  userId: string,
  data: {
    title: string;
    description: string;
    cropType: string;
    targetAmount: number;
    minPledge: number;
    expectedRoiPercent: number;
    durationMonths: number;
  }
): Promise<AgroVestorCampaign> => {
  const farmer = await prisma.farmerProfile.findUnique({
    where: { userId },
    include: {
      user: true,
    },
  });

  if (!farmer) throw new Error('Only registered farmers can launch an AgroVestor campaign');

  const decision = await CreditScoringEngine.evaluateFarmer({
    farmerId: farmer.id,
    triggeredBy: 'NEW_AGROVESTOR_CAMPAIGN',
  });

  const campaign: AgroVestorCampaign = {
    id: `avc-${Date.now()}`,
    farmerId: farmer.id,
    farmerName: farmer.user.name,
    farmName: farmer.farmName,
    avatarUrl: farmer.user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
    region: farmer.region || 'Agricultural Corridor',
    cropType: data.cropType,
    title: data.title,
    description: data.description,
    targetAmount: Number(data.targetAmount),
    fundedAmount: 0,
    minPledge: Number(data.minPledge || 25000),
    expectedRoiPercent: Number(data.expectedRoiPercent || 12.0),
    durationMonths: Number(data.durationMonths || 4),
    creditScore: decision.ficoScore || 700,
    creditTier: decision.tier || CreditTier.SILVER,
    riskLevel: decision.tier === CreditTier.GOLD || decision.tier === CreditTier.PLATINUM ? 'LOW' : 'MODERATE',
    radar: decision.normalizedRadar || {
      salesFulfillment: 0.8,
      listingFrequency: 0.8,
      reviewBayesian: 0.8,
      deliveryReliability: 0.8,
      networkReach: 0.8,
      engagementVelocity: 0.8,
      repaymentIntegrity: 0.8,
      kycCompliance: 1.0,
    },
    backersCount: 0,
    escrowSecured: true,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  };

  agroVestorCampaignsStore.unshift(campaign);
  return campaign;
};

export const pledgeAgroVestorInvestment = async (
  userId: string,
  data: {
    campaignId: string;
    amount: number;
    paymentMethod?: string;
    paymentProvider?: string;
    currency?: string;
  }
): Promise<AgroVestorInvestment> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) throw new Error('User not found');

  const campaigns = await getAgroVestorCampaigns();
  const campaign = campaigns.find((c) => c.id === data.campaignId);
  if (!campaign) throw new Error('AgroVestor campaign not found');

  const amount = Number(data.amount);
  if (amount < campaign.minPledge) {
    throw new Error(`Minimum investment pledge is ${campaign.minPledge.toLocaleString()} FCFA`);
  }

  campaign.fundedAmount += amount;
  campaign.backersCount += 1;
  if (campaign.fundedAmount >= campaign.targetAmount) {
    campaign.status = 'FUNDED';
  }

  const projectedReturnAmount = Math.round(amount * (1 + campaign.expectedRoiPercent / 100));
  const dueDate = new Date();
  dueDate.setMonth(dueDate.getMonth() + campaign.durationMonths);

  const investment: AgroVestorInvestment = {
    id: `avi-${Date.now()}`,
    userId: user.id,
    userName: user.name,
    campaignId: campaign.id,
    campaignTitle: campaign.title,
    farmerName: campaign.farmerName,
    farmName: campaign.farmName,
    amountInvested: amount,
    projectedReturnAmount,
    expectedRoiPercent: campaign.expectedRoiPercent,
    durationMonths: campaign.durationMonths,
    currency: data.currency || 'XAF',
    paymentMethod: data.paymentMethod || 'MOBILE_MONEY',
    paymentProvider: data.paymentProvider || 'GLOBAL_MULTI_CHANNEL',
    status: 'ESCROW_HELD',
    investedAt: new Date().toISOString(),
    payoutDueDate: dueDate.toISOString(),
  };

  agroVestorInvestmentsStore.unshift(investment);
  return investment;
};

export const getMyAgroVestments = async (userId: string): Promise<AgroVestorInvestment[]> => {
  return agroVestorInvestmentsStore.filter((i) => i.userId === userId);
};

// -------------------------------------------------------------
// AGROPATRON (MICRO-PATRONAGE SUBSCRIPTION SYSTEM)
// -------------------------------------------------------------

export const patronizeFarm = async (
  userId: string,
  data: {
    farmerId: string;
    plan?: 'MONTHLY' | 'SEASONAL';
    paymentMethod?: string;
    paymentProvider?: string;
    currency?: string;
    phoneNumber?: string;
    amount?: number;
  }
): Promise<AgroPatronSubscription> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) throw new Error('User not found');

  // Lookup target farmer
  const farmer = await prisma.farmerProfile.findFirst({
    where: {
      OR: [
        { id: data.farmerId },
        { userId: data.farmerId },
      ],
    },
    include: {
      user: {
        include: {
          farms: true,
        },
      },
    },
  });

  const farmerName = farmer?.user?.name || 'Verified Agro Producer';
  const farmName = farmer?.farmName || farmer?.user?.farms?.[0]?.name || 'Agro Enterprise';
  const plan = data.plan || 'MONTHLY';
  const isMonthly = plan === 'MONTHLY';
  const amount = data.amount || (isMonthly ? 1200 : 3600); // ~$2 USD monthly or ~$6 seasonal
  const currency = data.currency || 'XAF';

  const expiry = new Date();
  if (isMonthly) {
    expiry.setDate(expiry.getDate() + 30);
  } else {
    expiry.setDate(expiry.getDate() + 120); // 4-month crop season
  }

  const subscription: AgroPatronSubscription = {
    id: `patron-${Date.now()}`,
    userId: user.id,
    userName: user.name,
    farmerId: farmer?.id || data.farmerId,
    farmerName,
    farmName,
    plan,
    amount,
    currency,
    paymentMethod: data.paymentMethod || 'MOBILE_MONEY',
    paymentProvider: data.paymentProvider || 'M-PESA / AIRTEL / MOMO / VISA',
    discountRatePercent: 8.0, // 8% patron discount on all harvest lots
    hasEarlyHarvestAccess: true,
    hasPrivateStoryAccess: true,
    subscribedAt: new Date().toISOString(),
    expiresAt: expiry.toISOString(),
    status: 'ACTIVE',
  };

  agroPatronSubscriptionsStore.unshift(subscription);

  // Sync with DB Follow relation if target user exists
  if (farmer?.userId && farmer.userId !== user.id) {
    try {
      await prisma.follow.upsert({
        where: {
          followerId_followingId: {
            followerId: user.id,
            followingId: farmer.userId,
          },
        },
        create: {
          followerId: user.id,
          followingId: farmer.userId,
        },
        update: {},
      });
    } catch {
      // Non-blocking
    }
  }

  return subscription;
};

export const getFarmPatronStatus = async (
  userId: string,
  farmerId: string
): Promise<{
  isPatron: boolean;
  subscription?: AgroPatronSubscription;
  discountRatePercent: number;
  hasEarlyHarvestAccess: boolean;
}> => {
  const activeSub = agroPatronSubscriptionsStore.find(
    (s) =>
      s.userId === userId &&
      (s.farmerId === farmerId || s.farmerName.toLowerCase().includes(farmerId.toLowerCase())) &&
      s.status === 'ACTIVE' &&
      new Date(s.expiresAt) > new Date()
  );

  return {
    isPatron: !!activeSub,
    subscription: activeSub,
    discountRatePercent: activeSub ? activeSub.discountRatePercent : 0,
    hasEarlyHarvestAccess: !!activeSub,
  };
};

export const getMyPatronages = async (userId: string): Promise<AgroPatronSubscription[]> => {
  return agroPatronSubscriptionsStore.filter(
    (s) => s.userId === userId && s.status === 'ACTIVE'
  );
};

