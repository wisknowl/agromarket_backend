"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Seeding PostgreSQL Database with real test accounts...');
    const passwordHash = await bcryptjs_1.default.hash('password123', 10);
    const adminPasswordHash = await bcryptjs_1.default.hash('admin123', 10);
    // 1. Clean up or find Admin User
    let admin = await prisma.user.findFirst({
        where: { OR: [{ email: 'admin@agromarket.com' }, { phone: '+237600000000' }] },
    });
    if (admin) {
        admin = await prisma.user.update({
            where: { id: admin.id },
            data: {
                email: 'admin@agromarket.com',
                phone: '+237600000000',
                passwordHash: adminPasswordHash,
                role: client_1.UserRole.ADMIN,
            },
        });
    }
    else {
        admin = await prisma.user.create({
            data: {
                name: 'Agro Chief Admin',
                email: 'admin@agromarket.com',
                phone: '+237600000000',
                passwordHash: adminPasswordHash,
                role: client_1.UserRole.ADMIN,
                isVerified: true,
                avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
            },
        });
    }
    console.log('✅ Admin user ready:', admin.email);
    // 2. Clean up or find Standard User
    let user = await prisma.user.findFirst({
        where: { OR: [{ email: 'user@agromarket.com' }, { phone: '+237671111111' }] },
    });
    if (user) {
        user = await prisma.user.update({
            where: { id: user.id },
            data: {
                email: 'user@agromarket.com',
                phone: '+237671111111',
                passwordHash,
                role: client_1.UserRole.FARMER,
            },
        });
    }
    else {
        user = await prisma.user.create({
            data: {
                name: 'Victoy Eyong',
                email: 'user@agromarket.com',
                phone: '+237671111111',
                passwordHash,
                role: client_1.UserRole.FARMER,
                isVerified: true,
                avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
            },
        });
    }
    console.log('✅ Standard user ready:', user.email);
    // 3. Clear and recreate test farms for user
    await prisma.farm.deleteMany({
        where: { userId: user.id },
    });
    const farm1 = await prisma.farm.create({
        data: {
            userId: user.id,
            name: 'Green Valley Organic Farms',
            category: client_1.FarmCategory.CROPS,
            description: 'Volcanic soil farm in the fertile valleys of Foumbot. Producing fresh tomatoes, Irish potatoes, and Penja pepper.',
            region: 'West Region',
            division: 'Noun',
            city: 'Foumbot',
            location: 'Mile 4 Valley Road, Foumbot',
            sizeHectares: 4.5,
            isVerified: true,
            rating: 4.9,
            totalRatings: 142,
            coverPhoto: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800',
            primaryProduce: ['Fresh Tomatoes', 'Irish Potatoes', 'Penja Pepper', 'Cabbage'],
            certifications: ['Cameroon GAP Certified', '100% Organic Verified'],
        },
    });
    const farm2 = await prisma.farm.create({
        data: {
            userId: user.id,
            name: 'Highlands Free-Range Poultry',
            category: client_1.FarmCategory.POULTRY,
            description: 'Pasture-raised organic broilers and fresh farm table eggs in Bafoussam.',
            region: 'West Region',
            division: 'Mifi',
            city: 'Bafoussam',
            location: 'Bafoussam Rural Bypass',
            sizeHectares: 2.0,
            isVerified: true,
            rating: 4.8,
            totalRatings: 88,
            coverPhoto: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=800',
            primaryProduce: ['Broiler Chickens', 'Fresh Table Eggs', 'Organic Poultry Manure'],
            certifications: ['Veterinary Health Approved'],
        },
    });
    console.log(`✅ Seeded 2 Farms in PostgreSQL: "${farm1.name}" and "${farm2.name}"`);
    // 4. Ensure Categories exist
    const catVeg = await prisma.category.upsert({
        where: { name: 'Vegetables & Greens' },
        update: {},
        create: {
            name: 'Vegetables & Greens',
            frenchName: 'Légumes & Maraîchers',
            icon: 'carrot',
            imageUrl: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=500',
            description: 'Farm-fresh organic vegetables directly harvested from volcanic soils.',
        },
    });
    const catPoultry = await prisma.category.upsert({
        where: { name: 'Livestock & Poultry' },
        update: {},
        create: {
            name: 'Livestock & Poultry',
            frenchName: 'Élevage & Volaille',
            icon: 'egg',
            imageUrl: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=500',
            description: 'Healthy free-range chickens, table eggs, and quality livestock.',
        },
    });
    const catTubers = await prisma.category.upsert({
        where: { name: 'Tubers & Roots' },
        update: {},
        create: {
            name: 'Tubers & Roots',
            frenchName: 'Tubercules & Racines',
            icon: 'sprout',
            imageUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500',
            description: 'Irish potatoes, cassava, yams, and sweet potatoes.',
        },
    });
    const catFruits = await prisma.category.upsert({
        where: { name: 'Fruits & Berries' },
        update: {},
        create: {
            name: 'Fruits & Berries',
            frenchName: 'Fruits & Baies',
            icon: 'apple',
            imageUrl: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=500',
            description: 'Tropical bananas, pineapples, papayas, and citrus fruits.',
        },
    });
    const catSpices = await prisma.category.upsert({
        where: { name: 'Spices & Herbs' },
        update: {},
        create: {
            name: 'Spices & Herbs',
            frenchName: 'Épices & Herbes',
            icon: 'flame',
            imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500',
            description: 'Penja pepper, garlic, ginger, and aromatic culinary herbs.',
        },
    });
    // 5. Seed Real AgroYields linked to the user's farms
    await prisma.agroYield.deleteMany({
        where: { farmId: { in: [farm1.id, farm2.id] } },
    });
    const yield1 = await prisma.agroYield.create({
        data: {
            farmId: farm1.id,
            categoryId: catVeg.id,
            title: 'Fresh Foumbot Vine Tomatoes',
            frenchTitle: 'Tomates Fraîches de Foumbot',
            description: 'Grade-A vine-ripened organic tomatoes harvested from fertile volcanic soil in Noun division. Super juicy, firm skin, and long shelf life.',
            originRegion: 'Foumbot, West Region',
            pricePerUnit: 1200,
            oldPrice: 1500,
            unit: 'CRATE',
            stockQuantity: 450,
            minOrderQuantity: 1,
            isWholesaleBulkAvailable: true,
            bulkMinQuantity: 20,
            bulkPricePerUnit: 950,
            isAvailable: true,
            isOrganic: true,
            harvestDate: new Date(),
            mediaUrls: [
                'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800',
                'https://images.unsplash.com/photo-1546470427-e26264be0b11?w=800',
            ],
            rating: 4.9,
        },
    });
    const yield2 = await prisma.agroYield.create({
        data: {
            farmId: farm1.id,
            categoryId: catTubers.id,
            title: 'Santa Highland Red Irish Potatoes (Bag 50kg)',
            frenchTitle: 'Pommes de Terre Rouges de Santa (Sac 50kg)',
            description: 'Cleaned red-skin Irish potatoes, grown at high altitude in Santa / Foumbot corridor for dense starch and unmatched taste.',
            originRegion: 'Santa, Northwest Region',
            pricePerUnit: 18000,
            oldPrice: 22000,
            unit: 'BAG_50KG',
            stockQuantity: 80,
            minOrderQuantity: 1,
            isWholesaleBulkAvailable: true,
            bulkMinQuantity: 10,
            bulkPricePerUnit: 16500,
            isAvailable: true,
            isOrganic: true,
            harvestDate: new Date(),
            mediaUrls: [
                'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=800',
            ],
            rating: 4.8,
        },
    });
    const yield3 = await prisma.agroYield.create({
        data: {
            farmId: farm1.id,
            categoryId: catSpices.id,
            title: 'Authentic Penja Black Pepper (1kg Cask)',
            frenchTitle: 'Poivre Noir de Penja IGP (1kg)',
            description: 'Geographically protected Penja black pepper with intense aroma and volcanic terroir notes. Handpicked and sun-cured.',
            originRegion: 'Penja / West Border',
            pricePerUnit: 7500,
            oldPrice: 9000,
            unit: 'KG',
            stockQuantity: 150,
            minOrderQuantity: 1,
            isWholesaleBulkAvailable: true,
            bulkMinQuantity: 5,
            bulkPricePerUnit: 6500,
            isAvailable: true,
            isOrganic: true,
            harvestDate: new Date(),
            mediaUrls: [
                'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800',
            ],
            rating: 5.0,
        },
    });
    const yield4 = await prisma.agroYield.create({
        data: {
            farmId: farm2.id,
            categoryId: catPoultry.id,
            title: 'Farm-Fresh Free-Range Table Eggs (Crate of 30)',
            frenchTitle: 'Œufs Frais de Table (Alvéole de 30)',
            description: 'Nutrient-rich brown eggs from pasture-raised hens fed on natural grains and volcanic greens in Bafoussam.',
            originRegion: 'Bafoussam, West Region',
            pricePerUnit: 2400,
            oldPrice: 2800,
            unit: 'CRATE',
            stockQuantity: 120,
            minOrderQuantity: 1,
            isWholesaleBulkAvailable: true,
            bulkMinQuantity: 15,
            bulkPricePerUnit: 2100,
            isAvailable: true,
            isOrganic: true,
            harvestDate: new Date(),
            mediaUrls: [
                'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=800',
                'https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=800',
            ],
            rating: 5.0,
        },
    });
    const yield5 = await prisma.agroYield.create({
        data: {
            farmId: farm2.id,
            categoryId: catPoultry.id,
            title: 'Dressed Organic Broiler Chicken (2.2kg Average)',
            frenchTitle: 'Poulet de Chair Éviscéré Bio (2.2kg)',
            description: 'Hygienically dressed and chilled fresh broiler chicken raised on natural diet. No hormones or antibiotics.',
            originRegion: 'Bafoussam, West Region',
            pricePerUnit: 4200,
            oldPrice: 5000,
            unit: 'KG',
            stockQuantity: 95,
            minOrderQuantity: 1,
            isWholesaleBulkAvailable: true,
            bulkMinQuantity: 10,
            bulkPricePerUnit: 3700,
            isAvailable: true,
            isOrganic: true,
            harvestDate: new Date(),
            mediaUrls: [
                'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=800',
            ],
            rating: 4.9,
        },
    });
    console.log('✅ Seeded 5 Real AgroYields across 2 Farms with shoppable buy links');
    // 6. Seed Real AgroFeed Posts linked to farms and user
    await prisma.post.deleteMany({
        where: { userId: user.id },
    });
    const post1 = await prisma.post.create({
        data: {
            userId: user.id,
            farmId: farm1.id,
            content: 'Early morning harvest at Green Valley! 🍅 These vine tomatoes are picked at peak ripeness right here in Foumbot. 100% organic volcanic soil produce ready for market and restaurant orders! #FreshHarvest #Foumbot #OrganicAgri',
            mediaUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800',
            isVideo: false,
            linkedYieldId: yield1.id,
            likesCount: 28,
            commentsCount: 6,
        },
    });
    const post2 = await prisma.post.create({
        data: {
            userId: user.id,
            farmId: farm1.id,
            content: 'Sorting and boxing our fresh Irish potatoes ready for bulk dispatch to Douala Sandaga market! 🥔 Pre-order your crates now with escrow guarantee. #SantaPotatoes #AgroMarket #Wholesale',
            mediaUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=800',
            isVideo: false,
            linkedYieldId: yield2.id,
            likesCount: 42,
            commentsCount: 9,
        },
    });
    const post3 = await prisma.post.create({
        data: {
            userId: user.id,
            farmId: farm2.id,
            content: 'Our free-range pasture layers enjoying the morning sun in Bafoussam! 🥚 Fresh crates of 30 eggs gathered daily. Tap the card below to order direct from farm! #HighlandsPoultry #FreshEggs',
            mediaUrl: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=800',
            isVideo: false,
            linkedYieldId: yield3.id,
            likesCount: 35,
            commentsCount: 4,
        },
    });
    // Add real comments to post1
    await prisma.postComment.createMany({
        data: [
            {
                postId: post1.id,
                userId: admin.id,
                content: 'Impressive harvest quality Victoy! Are these available for bulk delivery to Yaounde?',
            },
            {
                postId: post1.id,
                userId: user.id,
                content: 'Yes! We ship via our partnered transporters with refrigerated transit. Order directly through the app!',
            },
        ],
    });
    console.log('✅ Seeded 3 Real Posts with Comments & Shoppable Yields');
    // 7. Ensure FarmerProfile anchor is created for credit scoring
    await prisma.farmerProfile.upsert({
        where: { userId: user.id },
        update: { farmName: farm1.name },
        create: {
            userId: user.id,
            farmName: farm1.name,
            region: 'West Region',
            city: 'Foumbot',
            rating: 4.9,
            totalRatings: 142,
            totalFollowers: 320,
            creditTier: client_1.CreditTier.GOLD,
            creditScore: 780,
        },
    });
    console.log('🎉 PostgreSQL Database Seed Completed Successfully!');
}
main()
    .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
