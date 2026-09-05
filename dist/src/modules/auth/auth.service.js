"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleFollowUser = exports.getUserPublicProfile = exports.getCurrentUserProfile = exports.loginUser = exports.registerUser = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../../core/database/prisma"));
const JWT_SECRET = process.env.JWT_SECRET || 'agromarket_super_secret_jwt_key_2026_cameroon';
const registerUser = async (data) => {
    const existingUser = await prisma_1.default.user.findFirst({
        where: {
            OR: [{ email: data.email }, { phone: data.phone }],
        },
    });
    if (existingUser) {
        throw new Error('User with this email or phone number already exists');
    }
    const passwordHash = await bcryptjs_1.default.hash(data.password, 10);
    const role = data.role || client_1.UserRole.BUYER;
    const user = await prisma_1.default.user.create({
        data: {
            name: data.name,
            email: data.email,
            phone: data.phone,
            passwordHash,
            role,
            isVerified: role === client_1.UserRole.BUYER,
            // Auto-create role-specific profile if details provided
            ...(role === client_1.UserRole.FARMER && {
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
            ...(role === client_1.UserRole.WHOLESALER && {
                wholesalerProfile: {
                    create: {
                        businessName: data.businessName || `${data.name} Wholesale Enterprises`,
                        primaryMarketCity: data.primaryMarketCity || 'Douala Sandaga',
                    },
                },
            }),
            ...(role === client_1.UserRole.AGRO_TRANSPORTER && {
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
    const payload = {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
    };
    const token = jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: '30d' });
    return { user, token };
};
exports.registerUser = registerUser;
const loginUser = async (emailOrPhone, password) => {
    const user = await prisma_1.default.user.findFirst({
        where: {
            OR: [{ email: emailOrPhone }, { phone: emailOrPhone }],
        },
        include: {
            farms: true,
            farmerProfile: true,
            wholesalerProfile: true,
            transporterProfile: true,
            financialProfile: true,
        },
    });
    if (!user) {
        throw new Error('Invalid credentials. Account not found.');
    }
    const isValidPassword = await bcryptjs_1.default.compare(password, user.passwordHash);
    if (!isValidPassword) {
        throw new Error('Invalid credentials. Incorrect password.');
    }
    const payload = {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
    };
    const token = jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: '30d' });
    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser, token };
};
exports.loginUser = loginUser;
const getCurrentUserProfile = async (userId) => {
    const user = await prisma_1.default.user.findUnique({
        where: { id: userId },
        include: {
            farms: true,
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
exports.getCurrentUserProfile = getCurrentUserProfile;
const getUserPublicProfile = async (targetUserId, currentUserId) => {
    const user = await prisma_1.default.user.findUnique({
        where: { id: targetUserId },
        include: {
            farms: true,
            posts: {
                orderBy: { createdAt: 'desc' },
                include: {
                    farm: true,
                    likes: true,
                    comments: {
                        include: { user: { select: { id: true, name: true, avatarUrl: true } } },
                        take: 3,
                    },
                },
            },
            _count: {
                select: {
                    followers: true,
                    following: true,
                    farms: true,
                    posts: true,
                },
            },
        },
    });
    if (!user) {
        throw new Error('User profile not found');
    }
    let isFollowing = false;
    if (currentUserId && currentUserId !== targetUserId) {
        const followRecord = await prisma_1.default.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId: currentUserId,
                    followingId: targetUserId,
                },
            },
        });
        isFollowing = Boolean(followRecord);
    }
    const { passwordHash: _, ...safeUser } = user;
    return {
        ...safeUser,
        isFollowing,
        followersCount: user._count.followers,
        followingCount: user._count.following,
        farmsCount: user._count.farms,
        postsCount: user._count.posts,
    };
};
exports.getUserPublicProfile = getUserPublicProfile;
const toggleFollowUser = async (followerId, followingId) => {
    if (followerId === followingId) {
        throw new Error('You cannot follow yourself');
    }
    const existing = await prisma_1.default.follow.findUnique({
        where: {
            followerId_followingId: { followerId, followingId },
        },
    });
    if (existing) {
        await prisma_1.default.follow.delete({
            where: { id: existing.id },
        });
        return { isFollowing: false };
    }
    else {
        await prisma_1.default.follow.create({
            data: { followerId, followingId },
        });
        return { isFollowing: true };
    }
};
exports.toggleFollowUser = toggleFollowUser;
