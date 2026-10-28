"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveUserPushToken = exports.updateProfile = exports.toggleFollowUser = exports.getUserPublicProfile = exports.getCurrentUserProfile = exports.loginUser = exports.registerUser = void 0;
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
            farmerProfile: {
                include: {
                    loanApplications: true,
                },
            },
            wholesalerProfile: true,
            transporterProfile: true,
            financialProfile: true,
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
        throw new Error('User not found');
    }
    // AgroVestors are equity/ROI farm investors, distinct from institutional loans
    const agroVestorsCount = user.investments?.length ?? 0;
    const { passwordHash: _, ...safeUser } = user;
    return {
        ...safeUser,
        followersCount: user._count.followers,
        followingCount: user._count.following,
        farmsCount: user._count.farms,
        postsCount: user._count.posts,
        agroVestorsCount,
    };
};
exports.getCurrentUserProfile = getCurrentUserProfile;
const getUserPublicProfile = async (targetUserId, currentUserId) => {
    const user = await prisma_1.default.user.findUnique({
        where: { id: targetUserId },
        include: {
            farms: {
                include: {
                    yields: {
                        where: { isAvailable: true },
                        include: {
                            category: true,
                            farm: {
                                select: {
                                    id: true,
                                    name: true,
                                    region: true,
                                    city: true,
                                    location: true,
                                },
                            },
                        },
                        orderBy: { createdAt: 'desc' },
                    },
                },
            },
            farmerProfile: {
                include: {
                    loanApplications: true,
                },
            },
            wholesalerProfile: true,
            transporterProfile: true,
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
    // AgroVestors are equity/ROI farm investors, distinct from institutional loans
    const agroVestorsCount = user.investments?.length ?? 0;
    const { passwordHash: _, ...safeUser } = user;
    return {
        ...safeUser,
        isFollowing,
        followersCount: user._count.followers,
        followingCount: user._count.following,
        farmsCount: user._count.farms,
        postsCount: user._count.posts,
        agroVestorsCount,
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
const updateProfile = async (userId, data) => {
    const currentUser = await prisma_1.default.user.findUnique({
        where: { id: userId },
        include: {
            farms: true,
            farmerProfile: true,
            wholesalerProfile: true,
            transporterProfile: true,
            financialProfile: true,
        },
    });
    if (!currentUser) {
        throw new Error('User not found.');
    }
    let phoneToUpdate = undefined;
    if (data.phone && data.phone.trim() !== '') {
        const trimmedPhone = data.phone.trim();
        // Only check and update if phone actually changed
        if (trimmedPhone !== currentUser.phone) {
            // Check if another account has this exact phone or a normalized variant
            const digits = trimmedPhone.replace(/\D/g, '');
            const candidates = [trimmedPhone];
            if (digits) {
                candidates.push(digits);
                candidates.push(`+${digits}`);
                if (digits.length === 9) {
                    candidates.push(`+237${digits}`);
                    candidates.push(`237${digits}`);
                }
                else if (digits.startsWith('237') && digits.length === 12) {
                    candidates.push(digits.slice(3));
                    candidates.push(`+${digits}`);
                }
            }
            const existingUser = await prisma_1.default.user.findFirst({
                where: {
                    id: { not: userId },
                    phone: { in: Array.from(new Set(candidates)) },
                },
                select: { id: true, name: true, phone: true, email: true },
            });
            if (existingUser) {
                throw new Error(`The phone number "${trimmedPhone}" is already registered to another account (${existingUser.name || existingUser.email}). Please use a different phone number or keep your existing one.`);
            }
            phoneToUpdate = trimmedPhone;
        }
    }
    try {
        const updatedUser = await prisma_1.default.user.update({
            where: { id: userId },
            data: {
                ...(data.name && data.name.trim() && { name: data.name.trim() }),
                ...(phoneToUpdate && { phone: phoneToUpdate }),
                ...(data.avatarUrl && { avatarUrl: data.avatarUrl }),
            },
            include: {
                farms: true,
                farmerProfile: true,
                wholesalerProfile: true,
                transporterProfile: true,
                financialProfile: true,
            },
        });
        if (data.bio) {
            if (updatedUser.farmerProfile) {
                await prisma_1.default.farmerProfile.update({
                    where: { userId },
                    data: { bio: data.bio.trim() },
                });
            }
            else if (updatedUser.role === client_1.UserRole.FARMER) {
                await prisma_1.default.farmerProfile.create({
                    data: {
                        userId,
                        bio: data.bio.trim(),
                        farmName: `${updatedUser.name}'s Farm`,
                        region: 'West Region',
                        city: 'Foumbot',
                        creditScore: 500,
                    },
                });
            }
        }
        const { passwordHash: _, ...safeUser } = updatedUser;
        return safeUser;
    }
    catch (err) {
        if (err.code === 'P2002') {
            const target = err.meta?.target || [];
            if (target.includes('phone') || String(err.message).includes('phone')) {
                throw new Error('This phone number is already registered to another account.');
            }
            if (target.includes('email') || String(err.message).includes('email')) {
                throw new Error('This email address is already registered to another account.');
            }
        }
        throw err;
    }
};
exports.updateProfile = updateProfile;
const saveUserPushToken = async (userId, expoPushToken) => {
    const updatedUser = await prisma_1.default.user.update({
        where: { id: userId },
        data: { expoPushToken },
        select: { id: true, name: true, expoPushToken: true },
    });
    return updatedUser;
};
exports.saveUserPushToken = saveUserPushToken;
