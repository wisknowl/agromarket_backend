import prisma from '../../core/database/prisma';

export interface RegisterWholesalerDto {
  businessName: string;
  tradeLicenseNumber?: string;
  primaryMarketCity: string;
  buyingCapacityTons?: number;
  preferredCommodities?: string[];
}

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
  return prisma.wholesalerProfile.upsert({
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
};
