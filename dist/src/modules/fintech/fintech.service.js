"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyPatronages = exports.getFarmPatronStatus = exports.patronizeFarm = exports.getMyAgroVestments = exports.pledgeAgroVestorInvestment = exports.createAgroVestorCampaign = exports.getAgroVestorCampaigns = exports.getMyLoanApplications = exports.applyForSeasonalLoan = exports.getAvailableLoanProducts = exports.getFarmerCreditScore = void 0;
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
const agroVestorCampaignsStore = [];
const agroVestorInvestmentsStore = [];
const agroPatronSubscriptionsStore = [];
const getAgroVestorCampaigns = async () => {
    if (agroVestorCampaignsStore.length === 0) {
        const farmers = await prisma_1.default.farmerProfile.findMany({
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
            let tier = client_1.CreditTier.GOLD;
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
                    const decision = await engine_1.CreditScoringEngine.evaluateFarmer({
                        farmerId: matchedFarmer.id,
                        triggeredBy: 'AGROVESTOR_SEED',
                    });
                    score = decision.ficoScore || 760;
                    tier = decision.tier || client_1.CreditTier.GOLD;
                    if (decision.normalizedRadar) {
                        radar = decision.normalizedRadar;
                    }
                }
                catch {
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
                riskLevel: tier === client_1.CreditTier.PLATINUM || tier === client_1.CreditTier.GOLD ? 'LOW' : tier === client_1.CreditTier.SILVER ? 'MODERATE' : 'ELEVATED',
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
exports.getAgroVestorCampaigns = getAgroVestorCampaigns;
const createAgroVestorCampaign = async (userId, data) => {
    const farmer = await prisma_1.default.farmerProfile.findUnique({
        where: { userId },
        include: {
            user: true,
        },
    });
    if (!farmer)
        throw new Error('Only registered farmers can launch an AgroVestor campaign');
    const decision = await engine_1.CreditScoringEngine.evaluateFarmer({
        farmerId: farmer.id,
        triggeredBy: 'NEW_AGROVESTOR_CAMPAIGN',
    });
    const campaign = {
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
        creditTier: decision.tier || client_1.CreditTier.SILVER,
        riskLevel: decision.tier === client_1.CreditTier.GOLD || decision.tier === client_1.CreditTier.PLATINUM ? 'LOW' : 'MODERATE',
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
exports.createAgroVestorCampaign = createAgroVestorCampaign;
const pledgeAgroVestorInvestment = async (userId, data) => {
    const user = await prisma_1.default.user.findUnique({
        where: { id: userId },
    });
    if (!user)
        throw new Error('User not found');
    const campaigns = await (0, exports.getAgroVestorCampaigns)();
    const campaign = campaigns.find((c) => c.id === data.campaignId);
    if (!campaign)
        throw new Error('AgroVestor campaign not found');
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
    const investment = {
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
exports.pledgeAgroVestorInvestment = pledgeAgroVestorInvestment;
const getMyAgroVestments = async (userId) => {
    return agroVestorInvestmentsStore.filter((i) => i.userId === userId);
};
exports.getMyAgroVestments = getMyAgroVestments;
// -------------------------------------------------------------
// AGROPATRON (MICRO-PATRONAGE SUBSCRIPTION SYSTEM)
// -------------------------------------------------------------
const patronizeFarm = async (userId, data) => {
    const user = await prisma_1.default.user.findUnique({
        where: { id: userId },
    });
    if (!user)
        throw new Error('User not found');
    // Lookup target farmer
    const farmer = await prisma_1.default.farmerProfile.findFirst({
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
    }
    else {
        expiry.setDate(expiry.getDate() + 120); // 4-month crop season
    }
    const subscription = {
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
            await prisma_1.default.follow.upsert({
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
        }
        catch {
            // Non-blocking
        }
    }
    return subscription;
};
exports.patronizeFarm = patronizeFarm;
const getFarmPatronStatus = async (userId, farmerId) => {
    const activeSub = agroPatronSubscriptionsStore.find((s) => s.userId === userId &&
        (s.farmerId === farmerId || s.farmerName.toLowerCase().includes(farmerId.toLowerCase())) &&
        s.status === 'ACTIVE' &&
        new Date(s.expiresAt) > new Date());
    return {
        isPatron: !!activeSub,
        subscription: activeSub,
        discountRatePercent: activeSub ? activeSub.discountRatePercent : 0,
        hasEarlyHarvestAccess: !!activeSub,
    };
};
exports.getFarmPatronStatus = getFarmPatronStatus;
const getMyPatronages = async (userId) => {
    return agroPatronSubscriptionsStore.filter((s) => s.userId === userId && s.status === 'ACTIVE');
};
exports.getMyPatronages = getMyPatronages;
