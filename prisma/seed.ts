import { PrismaClient, UserRole, CreditTier, ProduceUnit, InstitutionType, PaymentMethod, OrderStatus, LoanStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting AgroBazaar Cameroon Seed Data...');

  // 1. Clean existing data in order of foreign key dependencies
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.review.deleteMany();
  await prisma.savedYield.deleteMany();
  await prisma.postComment.deleteMany();
  await prisma.postLike.deleteMany();
  await prisma.post.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.deliveryTrip.deleteMany();
  await prisma.escrowRecord.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.yieldPricingTier.deleteMany();
  await prisma.agroYield.deleteMany();
  await prisma.category.deleteMany();
  await prisma.loanApplication.deleteMany();
  await prisma.loanProduct.deleteMany();
  await prisma.financialProfile.deleteMany();
  await prisma.transporterProfile.deleteMany();
  await prisma.wholesalerProfile.deleteMany();
  await prisma.farmerProfile.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 10);
  const adminPasswordHash = await bcrypt.hash('superadmin123', 10);

  // 2. Seed Categories
  const catVegetables = await prisma.category.create({
    data: {
      name: 'Vegetables & Greens',
      frenchName: 'Légumes & Maraîchers',
      icon: 'leaf',
      imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&auto=format&fit=crop&q=60',
      description: 'Fresh organic tomatoes, peppers, cabbages from Foumbot and West region valley farms.',
    },
  });

  const catTubers = await prisma.category.create({
    data: {
      name: 'Tubers & Roots',
      frenchName: 'Tubercules & Racines',
      icon: 'sprout',
      imageUrl: 'https://images.unsplash.com/photo-1570723735746-c9bd51bd7c40?w=500&auto=format&fit=crop&q=60',
      description: 'Irish potatoes from Bamenda highlands, sweet cassava, and cocoyams.',
    },
  });

  const catPlantains = await prisma.category.create({
    data: {
      name: 'Plantains & Bananas',
      frenchName: 'Plantains & Bananes',
      icon: 'tree-palm',
      imageUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500&auto=format&fit=crop&q=60',
      description: 'Rich bunches from Njombé-Penja and South West plantations.',
    },
  });

  const catCashCrops = await prisma.category.create({
    data: {
      name: 'Cash Crops & Spices',
      frenchName: 'Cultures de Rente & Épices',
      icon: 'award',
      imageUrl: 'https://images.unsplash.com/photo-1611854779393-1b2da9d400fe?w=500&auto=format&fit=crop&q=60',
      description: 'Penja White Pepper, Arabica Coffee from Bamenda, and organic cocoa beans.',
    },
  });

  // 3. Seed Users across all 5 Actor Roles

  // Admin / Agricultural Extension Officer
  const adminUser = await prisma.user.create({
    data: {
      name: 'Chief Agro Administrator',
      email: 'superadmin@agrobazaar.com',
      phone: '+237600000000',
      passwordHash: adminPasswordHash,
      avatarUrl: 'https://randomuser.me/api/portraits/men/1.jpg',
      role: UserRole.ADMIN,
      isVerified: true,
    },
  });

  // Farmer 1: Victoy Eyong (Foumbot Organic Farmer - Gold Tier)
  const farmer1User = await prisma.user.create({
    data: {
      name: 'Victoy Eyong',
      email: 'victoy@agrobazaar.com',
      phone: '+237671111111',
      passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=60',
      role: UserRole.FARMER,
      isVerified: true,
      farmerProfile: {
        create: {
          farmName: 'Green Valley Organic Farms',
          region: 'West Region',
          division: 'Noun',
          city: 'Foumbot',
          gpsLatitude: 5.5086,
          gpsLongitude: 10.6318,
          bio: 'Leading producer of fresh vine tomatoes, green peppers, and cabbage in the fertile Foumbot valley.',
          coverPhoto: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1000&auto=format&fit=crop&q=60',
          cooperativeName: 'Foumbot Agricultural Co-op (CAPLAME)',
          rating: 4.9,
          totalRatings: 142,
          totalFollowers: 320,
          farmSizeHectares: 8.5,
          primaryCrops: ['Vine Tomatoes', 'Green Bell Peppers', 'Savoy Cabbage'],
          creditTier: CreditTier.GOLD,
          creditScore: 780,
        },
      },
    },
    include: { farmerProfile: true },
  });

  // Farmer 2: Mbah Paul (Bamenda Highlands - Silver Tier)
  const farmer2User = await prisma.user.create({
    data: {
      name: 'Mbah Paul Fru',
      email: 'mbah@agrobazaar.com',
      phone: '+237672222222',
      passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=60',
      role: UserRole.FARMER,
      isVerified: true,
      farmerProfile: {
        create: {
          farmName: 'Highland Roots & Arabica Coffee',
          region: 'Northwest Region',
          division: 'Mezam',
          city: 'Bamenda',
          gpsLatitude: 5.9631,
          gpsLongitude: 10.1591,
          bio: 'Cool climate potato farming and highland roasted Arabica coffee beans.',
          coverPhoto: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=1000&auto=format&fit=crop&q=60',
          cooperativeName: 'Northwest Cooperative Association (NWCA)',
          rating: 4.7,
          totalRatings: 88,
          totalFollowers: 210,
          farmSizeHectares: 12.0,
          primaryCrops: ['Irish Potatoes', 'Sweet Potatoes', 'Arabica Coffee'],
          creditTier: CreditTier.SILVER,
          creditScore: 685,
        },
      },
    },
    include: { farmerProfile: true },
  });

  // Wholesaler / Buyam-Sellam: Mamma Ngozi
  const wholesalerUser = await prisma.user.create({
    data: {
      name: 'Mamma Ngozi Biyeh',
      email: 'ngozi@agrobazaar.com',
      phone: '+237673333333',
      passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&auto=format&fit=crop&q=60',
      role: UserRole.WHOLESALER,
      isVerified: true,
      wholesalerProfile: {
        create: {
          businessName: 'Ngozi Central Sandaga Wholesale',
          tradeLicenseNumber: 'RC/DLA/2022/B/1458',
          primaryMarketCity: 'Douala (Marché Sandaga & Marché Deido)',
          buyingCapacityTons: 15.0,
          preferredCommodities: ['Tomatoes', 'Irish Potatoes', 'Plantains', 'Onions'],
        },
      },
    },
    include: { wholesalerProfile: true },
  });

  // Agro-Transporter: Tanyi Logistics
  const transporterUser = await prisma.user.create({
    data: {
      name: 'Tanyi Boris',
      email: 'tanyi@agrobazaar.com',
      phone: '+237674444444',
      passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=60',
      role: UserRole.AGRO_TRANSPORTER,
      isVerified: true,
      transporterProfile: {
        create: {
          vehicleType: 'Mitsubishi Canter (5.0 Ton Ventilated Truck)',
          licensePlate: 'LT-849-EF',
          maxLoadKg: 5000,
          operatingCorridors: [
            'Foumbot -> Bafoussam -> Douala',
            'Bamenda -> Bafoussam -> Yaounde',
            'Njombe-Penja -> Douala',
          ],
          isAvailable: true,
        },
      },
    },
    include: { transporterProfile: true },
  });

  // Financial Partner: Advans Cameroun / Njangi Agri-Credit
  const financialUser = await prisma.user.create({
    data: {
      name: 'Advans Agri-Fintech Desk',
      email: 'finance@agrobazaar.com',
      phone: '+237675555555',
      passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=500&auto=format&fit=crop&q=60',
      role: UserRole.FINANCIAL_OFFICER,
      isVerified: true,
      financialProfile: {
        create: {
          institutionName: 'Advans Cameroun Microfinance EMF',
          institutionType: InstitutionType.MICROFINANCE_EMF,
          licenseNumber: 'COBAC/EMF/CAT2/2018/004',
          headquartersCity: 'Douala',
          totalDisbursed: 45000000,
          activeLoanCount: 38,
        },
      },
    },
    include: { financialProfile: true },
  });

  // Buyer / Consumer: Sarah Manga
  const buyerUser = await prisma.user.create({
    data: {
      name: 'Sarah Manga',
      email: 'sarah@agrobazaar.com',
      phone: '+237676666666',
      passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format&fit=crop&q=60',
      role: UserRole.BUYER,
      isVerified: true,
    },
  });

  // 4. Seed AgroYield Products (with Cameroonian Units & Bulk Wholesale Tiers)
  const yield1 = await prisma.agroYield.create({
    data: {
      farmerId: farmer1User.farmerProfile!.id,
      categoryId: catVegetables.id,
      title: 'Fresh Foumbot Vine Tomatoes',
      frenchTitle: 'Tomates Fraîches de Foumbot (Casier)',
      description: 'Crisp, sun-ripened organic tomatoes harvested daily from the fertile volcanic soils of Foumbot.',
      originRegion: 'Foumbot, West Region',
      pricePerUnit: 1500, // 1500 FCFA/kg retail
      oldPrice: 1800,
      unit: ProduceUnit.KG,
      stockQuantity: 450,
      minOrderQuantity: 1.0,
      isWholesaleBulkAvailable: true,
      bulkMinQuantity: 10, // 10 crates (25kg each)
      bulkPricePerUnit: 22000, // 22,000 FCFA per crate wholesale
      isOrganic: true,
      harvestDate: new Date(),
      mediaUrls: [
        'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1582284540020-8acbe03f4924?w=500&auto=format&fit=crop&q=60',
      ],
      rating: 4.9,
    },
  });

  const yield2 = await prisma.agroYield.create({
    data: {
      farmerId: farmer2User.farmerProfile!.id,
      categoryId: catTubers.id,
      title: 'Bamenda Red Irish Potatoes',
      frenchTitle: 'Pommes de Terre Rouges de Bamenda (Sac 50kg)',
      description: 'Firm, highly nutritious mountain potatoes perfect for fries, stews, and roasting.',
      originRegion: 'Santa / Bamenda, Northwest Region',
      pricePerUnit: 1200, // 1200 FCFA/kg
      oldPrice: 1500,
      unit: ProduceUnit.KG,
      stockQuantity: 120,
      minOrderQuantity: 2.0,
      isWholesaleBulkAvailable: true,
      bulkMinQuantity: 5, // 5 bags of 50kg
      bulkPricePerUnit: 28000, // 28,000 FCFA per 50kg bag wholesale
      isOrganic: true,
      harvestDate: new Date(),
      mediaUrls: [
        'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&auto=format&fit=crop&q=60',
      ],
      rating: 4.8,
    },
  });

  const yield3 = await prisma.agroYield.create({
    data: {
      farmerId: farmer2User.farmerProfile!.id,
      categoryId: catCashCrops.id,
      title: 'Bamenda Highland Roasted Arabica Coffee',
      frenchTitle: 'Café Arabica Torréfié des Hauts Plateaux de Bamenda',
      description: 'Hand-picked premium Arabica beans, sun-dried and medium roasted with chocolate and citrus notes.',
      originRegion: 'Bamenda, Northwest Region',
      pricePerUnit: 4500, // 4500 FCFA/kg
      unit: ProduceUnit.KG,
      stockQuantity: 80,
      isWholesaleBulkAvailable: true,
      bulkMinQuantity: 20,
      bulkPricePerUnit: 3800,
      isOrganic: true,
      mediaUrls: [
        'https://images.unsplash.com/photo-1611854779393-1b2da9d400fe?w=500&auto=format&fit=crop&q=60',
      ],
      rating: 5.0,
    },
  });

  // 5. Seed AgroFeed Social Posts (Harvest Stories)
  await prisma.post.create({
    data: {
      farmerId: farmer1User.farmerProfile!.id,
      content: 'Early morning harvest in Foumbot! Look at the deep red color on this new batch of tomatoes. Loading up crates for Douala today! #FoumbotFarming #FreshHarvest #AgroBazaar',
      mediaUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&auto=format&fit=crop&q=60',
      isVideo: false,
      linkedYieldId: yield1.id,
      likesCount: 54,
      commentsCount: 12,
    },
  });

  await prisma.post.create({
    data: {
      farmerId: farmer2User.farmerProfile!.id,
      content: 'Drying our Arabica beans under the Bamenda morning sun. The aroma is incredible! Pre-orders open now. #CameroonCoffee #Arabica #Bamenda',
      mediaUrl: 'https://images.unsplash.com/photo-1611854779393-1b2da9d400fe?w=500&auto=format&fit=crop&q=60',
      isVideo: false,
      linkedYieldId: yield3.id,
      likesCount: 89,
      commentsCount: 24,
    },
  });

  // 6. Seed Loan Products (Fintech & Njangi)
  const loanProduct1 = await prisma.loanProduct.create({
    data: {
      financialProfileId: financialUser.financialProfile!.id,
      title: 'Seasonal Fertilizer & Seed Advance (Prêt Intrants)',
      frenchTitle: 'Crédit Campagne Engrais & Semences Certifiées',
      description: 'Quick micro-loan for planting season inputs with automated 20% deduction upon harvest sales.',
      minAmount: 100000,
      maxAmount: 1500000,
      interestRatePercent: 4.5,
      durationMonths: 6,
      requiredCreditTier: CreditTier.SILVER,
    },
  });

  await prisma.loanApplication.create({
    data: {
      farmerId: farmer1User.farmerProfile!.id,
      productId: loanProduct1.id,
      purpose: 'Purchasing high-yield organic tomato seeds and solar drip irrigation kit',
      requestedAmount: 500000,
      approvedAmount: 500000,
      interestRate: 4.5,
      durationMonths: 6,
      status: LoanStatus.DISBURSED,
      repaymentDeductionPct: 20.0,
      disbursedAt: new Date(),
    },
  });

  // 7. Seed Sample Escrow Order
  const order1 = await prisma.order.create({
    data: {
      buyerId: buyerUser.id,
      status: OrderStatus.ESCROW_LOCKED,
      paymentMethod: PaymentMethod.MTN_MOMO,
      subtotal: 7500,
      deliveryFee: 1000,
      totalAmount: 8500,
      deliveryAddress: 'Bonapriso, Avenue de Gaulle, Douala',
      deliveryCity: 'Douala',
      deliveryPhone: '+237676666666',
      paymentReference: 'MOMO-2026-0901-84920',
      items: {
        create: [
          {
            yieldId: yield1.id,
            farmerId: farmer1User.farmerProfile!.id,
            quantity: 5, // 5kg tomatoes
            unitPrice: 1500,
            totalPrice: 7500,
          },
        ],
      },
      escrow: {
        create: {
          amountHeld: 8500,
          farmerPayout: 7000,
          transporterFee: 1000,
          platformFee: 500,
        },
      },
    },
  });

  console.log('✅ AgroBazaar Cameroon Seed Data Created Successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
