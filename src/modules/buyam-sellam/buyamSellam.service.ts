import prisma from '../../core/database/prisma';
import { slugify } from '../farms/farm.service';

export interface StoreSiteDto {
  id?: string;
  name: string; // e.g. "Dock 4 Cold Room", "Exterior Dry Warehouse"
  location?: string;
  capacityTons?: number;
  facilityType?: string; // COLD_ROOM, AMBIENT_SHED, GRAIN_SILO, PACKAGING_BAY
  operatingHours?: string;
}

export interface CreateStoreDto {
  name: string;
  storeType?: string; // WHOLESALE_DEPOT, RETAIL_HUB, COOPERATIVE_SHED, COLD_STORAGE
  description?: string;
  region: string;
  division?: string;
  city: string;
  marketZone?: string;
  address?: string;
  gpsLatitude?: number;
  gpsLongitude?: number;
  storageCapacityTons?: number;
  hasColdStorage?: boolean;
  tradeLicenseNumber?: string;
  linkedFarmId?: string;
  sites?: StoreSiteDto[];
  coverPhoto?: string;
  avatarPhoto?: string;
}

export interface RegisterWholesalerDto {
  businessName: string;
  tradeLicenseNumber?: string;
  primaryMarketCity: string;
  buyingCapacityTons?: number;
  preferredCommodities?: string[];
  linkedFarmId?: string;
  storeBio?: string;
}

export const checkStoreSlugAvailability = async (name: string, storeIdToExclude?: string) => {
  const baseSlug = slugify(name);
  if (!baseSlug) {
    return { slug: '', available: false, candidate: '' };
  }

  const existing = await (prisma as any).store.findFirst({
    where: {
      slug: baseSlug,
      ...(storeIdToExclude ? { NOT: { id: storeIdToExclude } } : {}),
    },
    select: { id: true, name: true, slug: true },
  });

  if (!existing) {
    return { slug: baseSlug, available: true, candidate: baseSlug };
  }

  const count = await (prisma as any).store.count({
    where: {
      slug: { startsWith: baseSlug },
    },
  });

  const suggestion = `${baseSlug}-${count + 1}`;
  return { slug: baseSlug, available: false, candidate: suggestion };
};

export const generateUniqueStoreSlug = async (name: string): Promise<string> => {
  const check = await checkStoreSlugAvailability(name);
  if (check.available) {
    return check.slug;
  }
  return check.candidate;
};

export const createOrRegisterStore = async (userId: string, data: CreateStoreDto) => {
  // 1. Update user role to WHOLESALER if currently BUYER
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user && user.role === 'BUYER') {
    await prisma.user.update({
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
  const uniqueSlug = await generateUniqueStoreSlug(data.name);
  const store = await (prisma as any).store.create({
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
  await prisma.wholesalerProfile.upsert({
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

export const getMyStores = async (userId: string) => {
  const stores = await (prisma as any).store.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  // If no store exists yet, auto-migrate from legacy wholesalerProfile if present
  if (stores.length === 0) {
    const legacy = await prisma.wholesalerProfile.findUnique({ where: { userId } });
    if (legacy) {
      const defaultStore = await (prisma as any).store.create({
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

export const getAllPublicStores = async (params?: { search?: string; region?: string }) => {
  const { search, region } = params || {};
  return (prisma as any).store.findMany({
    where: {
      ...(region && { region: { contains: region, mode: 'insensitive' } }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { city: { contains: search, mode: 'insensitive' } },
          { marketZone: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    },
    include: {
      yields: {
        where: { isAvailable: true },
        include: { category: true },
        take: 4,
      },
      user: {
        select: { id: true, name: true, phone: true, email: true, avatarUrl: true },
      },
    },
    orderBy: { rating: 'desc' },
  });
};

export const getStoreById = async (id: string, currentUserId?: string) => {
  const store = await (prisma as any).store.findFirst({
    where: {
      OR: [
        { id },
        { slug: id },
        { userId: id }
      ]
    },
    include: {
      yields: {
        where: { isAvailable: true },
        include: {
          category: true,
          farm: {
            select: { id: true, name: true, slug: true, coverPhoto: true, avatarPhoto: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      user: {
        select: { id: true, name: true, phone: true, email: true, avatarUrl: true, role: true },
      },
    },
  });

  if (!store) throw new Error('Store not found');

  let linkedFarm = null;
  if (store.linkedFarmId) {
    linkedFarm = await prisma.farm.findUnique({
      where: { id: store.linkedFarmId },
      select: { id: true, name: true, slug: true, coverPhoto: true, avatarPhoto: true, region: true, city: true },
    }).catch(() => null);
  }

  const isOwner = Boolean(currentUserId && store.userId === currentUserId);

  return {
    ...store,
    isOwner,
    linkedFarm,
  };
};

export const updateStore = async (id: string, userId: string, data: Partial<CreateStoreDto>) => {
  const existing = await (prisma as any).store.findFirst({
    where: { id, userId },
  });
  if (!existing) throw new Error('Store not found or unauthorized');

  return (prisma as any).store.update({
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

export const getWholesalerProfile = async (userId: string) => {
  const profile = await prisma.wholesalerProfile.findUnique({
    where: { userId },
    include: {
      user: {
        select: { id: true, name: true, phone: true, email: true, avatarUrl: true },
      },
    },
  });

  if (!profile) throw new Error('Buyam-Sellam wholesaler profile not found');
  return profile;
};

export const registerOrUpdateWholesaler = async (userId: string, data: RegisterWholesalerDto) => {
  const profile = await prisma.wholesalerProfile.upsert({
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
  await (prisma as any).store.upsert({
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
