"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerOrUpdateWholesaler = exports.getWholesalerProfile = exports.updateStore = exports.getStoreById = exports.getMyStores = exports.createOrRegisterStore = exports.generateUniqueStoreSlug = exports.checkStoreSlugAvailability = void 0;
const prisma_1 = __importDefault(require("../../core/database/prisma"));
const farm_service_1 = require("../farms/farm.service");
const checkStoreSlugAvailability = async (name, storeIdToExclude) => {
    const baseSlug = (0, farm_service_1.slugify)(name);
    if (!baseSlug) {
        return { slug: '', available: false, candidate: '' };
    }
    const existing = await prisma_1.default.store.findFirst({
        where: {
            slug: baseSlug,
            ...(storeIdToExclude ? { NOT: { id: storeIdToExclude } } : {}),
        },
        select: { id: true, name: true, slug: true },
    });
    if (!existing) {
        return { slug: baseSlug, available: true, candidate: baseSlug };
    }
    const count = await prisma_1.default.store.count({
        where: {
            slug: { startsWith: baseSlug },
        },
    });
    const suggestion = `${baseSlug}-${count + 1}`;
    return { slug: baseSlug, available: false, candidate: suggestion };
};
exports.checkStoreSlugAvailability = checkStoreSlugAvailability;
const generateUniqueStoreSlug = async (name) => {
    const check = await (0, exports.checkStoreSlugAvailability)(name);
    if (check.available) {
        return check.slug;
    }
    return check.candidate;
};
exports.generateUniqueStoreSlug = generateUniqueStoreSlug;
const createOrRegisterStore = async (userId, data) => {
    // 1. Update user role to WHOLESALER if currently BUYER
    const user = await prisma_1.default.user.findUnique({ where: { id: userId } });
    if (user && user.role === 'BUYER') {
        await prisma_1.default.user.update({
            where: { id: userId },
            data: { role: 'WHOLESALER' },
        });
    }
    // 2. Prepare default depot site if none provided
    const sites = data.sites && data.sites.length > 0
        ? data.sites.map((s, idx) => ({
            id: s.id || `site-${Date.now()}-${idx}`,
            name: s.name || `Depot Site ${idx + 1}`,
            location: s.location || data.marketZone || data.city,
            capacityTons: s.capacityTons || 2.5,
            facilityType: s.facilityType || (data.hasColdStorage ? 'COLD_ROOM' : 'AMBIENT_SHED'),
            operatingHours: s.operatingHours || '06:00 - 18:00 (Mon - Sat)',
        }))
        : [
            {
                id: `site-${Date.now()}-1`,
                name: 'Main Dispatch Depot',
                location: data.marketZone || data.city,
                capacityTons: data.storageCapacityTons || 5.0,
                facilityType: data.hasColdStorage ? 'COLD_ROOM' : 'AMBIENT_SHED',
                operatingHours: '06:00 - 18:00 (Mon - Sat)',
            },
        ];
    // 3. Create the Store record
    const uniqueSlug = await (0, exports.generateUniqueStoreSlug)(data.name);
    const store = await prisma_1.default.store.create({
        data: {
            userId,
            name: data.name.trim(),
            slug: uniqueSlug,
            storeType: data.storeType || 'WHOLESALE_DEPOT',
            description: data.description?.trim(),
            region: data.region,
            division: data.division,
            city: data.city,
            marketZone: data.marketZone?.trim(),
            address: data.address?.trim(),
            gpsLatitude: data.gpsLatitude,
            gpsLongitude: data.gpsLongitude,
            storageCapacityTons: data.storageCapacityTons || 5.0,
            hasColdStorage: Boolean(data.hasColdStorage),
            tradeLicenseNumber: data.tradeLicenseNumber?.trim(),
            linkedFarmId: data.linkedFarmId || undefined,
            sites,
            coverPhoto: data.coverPhoto || 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=1000',
            avatarPhoto: data.avatarPhoto || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400',
            isVerified: true,
            rating: 5.0,
            totalRatings: 0,
        },
    });
    // 4. Upsert legacy WholesalerProfile for backward compatibility
    await prisma_1.default.wholesalerProfile.upsert({
        where: { userId },
        update: {
            businessName: data.name,
            primaryMarketCity: data.marketZone ? `${data.city} • ${data.marketZone}` : data.city,
            buyingCapacityTons: data.storageCapacityTons || 5.0,
            tradeLicenseNumber: data.tradeLicenseNumber,
        },
        create: {
            userId,
            businessName: data.name,
            primaryMarketCity: data.marketZone ? `${data.city} • ${data.marketZone}` : data.city,
            buyingCapacityTons: data.storageCapacityTons || 5.0,
            tradeLicenseNumber: data.tradeLicenseNumber,
        },
    }).catch(() => null);
    return store;
};
exports.createOrRegisterStore = createOrRegisterStore;
const getMyStores = async (userId) => {
    const stores = await prisma_1.default.store.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
    });
    // If no store exists yet, auto-migrate from legacy wholesalerProfile if present
    if (stores.length === 0) {
        const legacy = await prisma_1.default.wholesalerProfile.findUnique({ where: { userId } });
        if (legacy) {
            const defaultStore = await prisma_1.default.store.create({
                data: {
                    userId,
                    name: legacy.businessName || 'Central Wholesale Depot',
                    storeType: 'WHOLESALE_DEPOT',
                    region: 'Littoral Region',
                    city: legacy.primaryMarketCity?.split('•')[0]?.trim() || 'Douala',
                    marketZone: legacy.primaryMarketCity || 'Marché Sandaga',
                    storageCapacityTons: legacy.buyingCapacityTons || 5.0,
                    tradeLicenseNumber: legacy.tradeLicenseNumber,
                    isVerified: true,
                    rating: 5.0,
                    sites: [
                        {
                            id: 'site-default-1',
                            name: 'Main Dispatch Depot Shed',
                            location: legacy.primaryMarketCity || 'Marché Sandaga',
                            capacityTons: legacy.buyingCapacityTons || 5.0,
                            facilityType: 'AMBIENT_SHED',
                            operatingHours: '06:00 - 18:00 (Mon - Sat)',
                        },
                    ],
                },
            });
            return [defaultStore];
        }
    }
    return stores;
};
exports.getMyStores = getMyStores;
const getStoreById = async (id) => {
    const store = await prisma_1.default.store.findFirst({
        where: {
            OR: [
                { id },
                { slug: id }
            ]
        },
        include: {
            user: {
                select: { id: true, name: true, phone: true, email: true, avatarUrl: true },
            },
        },
    });
    if (!store)
        throw new Error('Store not found');
    return store;
};
exports.getStoreById = getStoreById;
const updateStore = async (id, userId, data) => {
    const existing = await prisma_1.default.store.findFirst({
        where: { id, userId },
    });
    if (!existing)
        throw new Error('Store not found or unauthorized');
    return prisma_1.default.store.update({
        where: { id },
        data: {
            ...(data.name && { name: data.name.trim() }),
            ...(data.storeType && { storeType: data.storeType }),
            ...(data.description !== undefined && { description: data.description?.trim() }),
            ...(data.region && { region: data.region }),
            ...(data.division !== undefined && { division: data.division }),
            ...(data.city && { city: data.city }),
            ...(data.marketZone !== undefined && { marketZone: data.marketZone?.trim() }),
            ...(data.address !== undefined && { address: data.address?.trim() }),
            ...(data.storageCapacityTons !== undefined && { storageCapacityTons: data.storageCapacityTons }),
            ...(data.hasColdStorage !== undefined && { hasColdStorage: data.hasColdStorage }),
            ...(data.tradeLicenseNumber !== undefined && { tradeLicenseNumber: data.tradeLicenseNumber?.trim() }),
            ...(data.linkedFarmId !== undefined && { linkedFarmId: data.linkedFarmId || null }),
            ...(data.sites && { sites: data.sites }),
            ...(data.coverPhoto && { coverPhoto: data.coverPhoto }),
            ...(data.avatarPhoto && { avatarPhoto: data.avatarPhoto }),
        },
    });
};
exports.updateStore = updateStore;
const getWholesalerProfile = async (userId) => {
    const profile = await prisma_1.default.wholesalerProfile.findUnique({
        where: { userId },
        include: {
            user: {
                select: { id: true, name: true, phone: true, email: true, avatarUrl: true },
            },
        },
    });
    if (!profile)
        throw new Error('Buyam-Sellam wholesaler profile not found');
    return profile;
};
exports.getWholesalerProfile = getWholesalerProfile;
const registerOrUpdateWholesaler = async (userId, data) => {
    const profile = await prisma_1.default.wholesalerProfile.upsert({
        where: { userId },
        update: {
            businessName: data.businessName,
            tradeLicenseNumber: data.tradeLicenseNumber,
            primaryMarketCity: data.primaryMarketCity,
            buyingCapacityTons: data.buyingCapacityTons || 1.0,
            preferredCommodities: data.preferredCommodities || [],
        },
        create: {
            userId,
            businessName: data.businessName,
            tradeLicenseNumber: data.tradeLicenseNumber,
            primaryMarketCity: data.primaryMarketCity,
            buyingCapacityTons: data.buyingCapacityTons || 1.0,
            preferredCommodities: data.preferredCommodities || [],
        },
    });
    // Ensure default Store also exists
    await prisma_1.default.store.upsert({
        where: { id: `store-default-${userId}` },
        update: {
            name: data.businessName,
            city: data.primaryMarketCity?.split('•')[0]?.trim() || 'Douala',
            marketZone: data.primaryMarketCity,
            storageCapacityTons: data.buyingCapacityTons || 5.0,
            tradeLicenseNumber: data.tradeLicenseNumber,
            linkedFarmId: data.linkedFarmId,
        },
        create: {
            id: `store-default-${userId}`,
            userId,
            name: data.businessName,
            storeType: 'WHOLESALE_DEPOT',
            region: 'Littoral Region',
            city: data.primaryMarketCity?.split('•')[0]?.trim() || 'Douala',
            marketZone: data.primaryMarketCity,
            storageCapacityTons: data.buyingCapacityTons || 5.0,
            tradeLicenseNumber: data.tradeLicenseNumber,
            linkedFarmId: data.linkedFarmId,
            isVerified: true,
            sites: [
                {
                    id: 'site-default-1',
                    name: 'Main Dispatch Depot Shed',
                    location: data.primaryMarketCity,
                    capacityTons: data.buyingCapacityTons || 5.0,
                    facilityType: 'AMBIENT_SHED',
                    operatingHours: '06:00 - 18:00 (Mon - Sat)',
                },
            ],
        },
    }).catch(() => null);
    return profile;
};
exports.registerOrUpdateWholesaler = registerOrUpdateWholesaler;
