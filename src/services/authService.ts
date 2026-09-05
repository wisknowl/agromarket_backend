import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthUserPayload } from '../types';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'agromarket_super_secret_jwt_key_2026_cameroon';

export interface RegisterDto {
  name: string;
  email: string;
  phone: string;
  password: string;
  role?: UserRole;
  // Optional farmer profile fields
  farmName?: string;
  region?: string;
  city?: string;
  cooperativeName?: string;
  // Optional wholesaler profile fields
  businessName?: string;
  primaryMarketCity?: string;
  // Optional transporter profile fields
  vehicleType?: string;
  licensePlate?: string;
}

export const registerUser = async (data: RegisterDto) => {
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email: data.email }, { phone: data.phone }],
    },
  });

  if (existingUser) {
    throw new Error('User with this email or phone number already exists');
  }

  const passwordHash = await bcrypt.hash(data.password, 10);
  const role = data.role || UserRole.BUYER;

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      passwordHash,
      role,
      isVerified: role === UserRole.BUYER,
      // Auto-create role-specific profile if details provided
      ...(role === UserRole.FARMER && {
        farmerProfile: {
          create: {
            farmName: data.farmName || `${data.name}'s Farm`,
            region: data.region || 'West Region',
            city: data.city || 'Foumbot',
            cooperativeName: data.cooperativeName,
            creditScore: 500,
          },
        },
      }),
      ...(role === UserRole.WHOLESALER && {
        wholesalerProfile: {
          create: {
            businessName: data.businessName || `${data.name} Wholesale Enterprises`,
            primaryMarketCity: data.primaryMarketCity || 'Douala Sandaga',
          },
        },
      }),
      ...(role === UserRole.AGRO_TRANSPORTER && {
        transporterProfile: {
          create: {
            vehicleType: data.vehicleType || 'Canter Truck (5 Ton)',
            licensePlate: data.licensePlate || 'LT-000-CM',
            maxLoadKg: 3500,
          },
        },
      }),
    },
    include: {
      farmerProfile: true,
      wholesalerProfile: true,
      transporterProfile: true,
      financialProfile: true,
    },
  });

  const payload: AuthUserPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });

  return { user, token };
};

export const loginUser = async (emailOrPhone: string, password: string) => {
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: emailOrPhone }, { phone: emailOrPhone }],
    },
    include: {
      farmerProfile: true,
      wholesalerProfile: true,
      transporterProfile: true,
      financialProfile: true,
    },
  });

  if (!user) {
    throw new Error('Invalid credentials. Account not found.');
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isValidPassword) {
    throw new Error('Invalid credentials. Incorrect password.');
  }

  const payload: AuthUserPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });

  const { passwordHash: _, ...safeUser } = user;
  return { user: safeUser, token };
};

export const getCurrentUserProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      farmerProfile: true,
      wholesalerProfile: true,
      transporterProfile: true,
      financialProfile: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
};
