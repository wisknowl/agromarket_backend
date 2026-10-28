"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePost = exports.addPostComment = exports.toggleLikePost = exports.createPost = exports.getRankedFeed = exports.getAllPosts = void 0;
const prisma_1 = __importDefault(require("../../core/database/prisma"));
const engine_1 = require("./engine");
const getAllPosts = async (params) => {
    return prisma_1.default.post.findMany({
        where: {
            ...(params?.farmId && { farmId: params.farmId }),
            ...(params?.userId && {
                OR: [
                    { userId: params.userId },
                    { farmer: { userId: params.userId } },
                    { farm: { userId: params.userId } },
                ],
            }),
        },
        include: {
            farm: true,
            user: {
                select: { id: true, name: true, phone: true, avatarUrl: true, role: true },
            },
            farmer: {
                include: {
                    user: {
                        select: { id: true, name: true, phone: true, avatarUrl: true },
                    },
                },
            },
            likes: true,
            comments: {
                include: {
                    user: {
                        select: { id: true, name: true, avatarUrl: true },
                    },
                },
                take: 5,
                orderBy: { createdAt: 'desc' },
            },
        },
        orderBy: { createdAt: 'desc' },
    });
};
exports.getAllPosts = getAllPosts;
const getRankedFeed = async (context) => {
    const posts = await prisma_1.default.post.findMany({
        take: context?.limit || 50,
        include: {
            farm: true,
            user: {
                select: { id: true, name: true, phone: true, avatarUrl: true, role: true },
            },
            farmer: {
                include: {
                    user: {
                        select: { id: true, name: true, phone: true, avatarUrl: true },
                    },
                },
            },
            likes: true,
            comments: {
                include: {
                    user: {
                        select: { id: true, name: true, avatarUrl: true },
                    },
                },
                take: 3,
                orderBy: { createdAt: 'desc' },
            },
        },
        orderBy: { createdAt: 'desc' },
    });
    const candidates = posts.map((p) => ({
        id: p.id,
        farmerId: p.farmerId,
        farmId: p.farmId,
        userId: p.userId,
        content: p.content,
        mediaUrl: p.mediaUrl,
        isVideo: p.isVideo,
        linkedYieldId: p.linkedYieldId,
        likesCount: p.likesCount,
        commentsCount: p.commentsCount,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        farmLatitude: p.farm?.gpsLatitude || p.farmer?.gpsLatitude || null,
        farmLongitude: p.farm?.gpsLongitude || p.farmer?.gpsLongitude || null,
        farmerCreditScore: p.farmer?.creditScore || null,
        farmerCreditTier: p.farmer?.creditTier || null,
        farm: p.farm,
        user: p.user,
        farmer: p.farmer,
        likes: p.likes,
        comments: p.comments,
    }));
    const rankedScores = engine_1.FeedRankingEngine.rankPosts(candidates, context);
    return rankedScores.map((s) => ({
        ...s.post,
        rankingMetadata: {
            totalRankScore: s.totalRankScore,
            affinityScore: s.affinityScore,
            engagementRate: s.engagementRate,
            geoProximityScore: s.geoProximityScore,
            freshnessDecay: s.freshnessDecay,
            isPartnerBoosted: s.isPartnerBoosted,
        },
    }));
};
exports.getRankedFeed = getRankedFeed;
const createPost = async (userId, data) => {
    let resolvedFarmId = data.farmId;
    if (!resolvedFarmId) {
        const userFarm = await prisma_1.default.farm.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
        if (!userFarm) {
            throw new Error('A registered farm page is required to publish a harvest story. Please create your farm first.');
        }
        resolvedFarmId = userFarm.id;
    }
    else {
        const verifiedFarm = await prisma_1.default.farm.findFirst({
            where: { id: resolvedFarmId, userId },
        });
        if (!verifiedFarm) {
            throw new Error('Selected farm was not found or unauthorized.');
        }
    }
    let farmerId;
    const farmer = await prisma_1.default.farmerProfile.findUnique({
        where: { userId },
    });
    if (farmer) {
        farmerId = farmer.id;
    }
    let normalizedMedia = data.mediaUrl;
    const uploadsIdx = normalizedMedia.indexOf('/uploads/');
    if (uploadsIdx !== -1) {
        normalizedMedia = normalizedMedia.substring(uploadsIdx);
    }
    return prisma_1.default.post.create({
        data: {
            userId,
            farmerId,
            farmId: resolvedFarmId,
            content: data.content,
            mediaUrl: normalizedMedia,
            isVideo: data.isVideo || false,
            linkedYieldId: data.linkedYieldId,
        },
        include: {
            farm: true,
            user: true,
            farmer: {
                include: { user: true },
            },
        },
    });
};
exports.createPost = createPost;
const toggleLikePost = async (postId, userId) => {
    const existingLike = await prisma_1.default.postLike.findUnique({
        where: {
            postId_userId: { postId, userId },
        },
    });
    if (existingLike) {
        await prisma_1.default.postLike.delete({
            where: { id: existingLike.id },
        });
        await prisma_1.default.post.update({
            where: { id: postId },
            data: { likesCount: { decrement: 1 } },
        });
        return { liked: false };
    }
    else {
        await prisma_1.default.postLike.create({
            data: { postId, userId },
        });
        await prisma_1.default.post.update({
            where: { id: postId },
            data: { likesCount: { increment: 1 } },
        });
        return { liked: true };
    }
};
exports.toggleLikePost = toggleLikePost;
const addPostComment = async (postId, userId, content) => {
    const comment = await prisma_1.default.postComment.create({
        data: { postId, userId, content },
        include: {
            user: {
                select: { id: true, name: true, avatarUrl: true },
            },
        },
    });
    await prisma_1.default.post.update({
        where: { id: postId },
        data: { commentsCount: { increment: 1 } },
    });
    return comment;
};
exports.addPostComment = addPostComment;
const deletePost = async (postId, userId, userRole) => {
    const post = await prisma_1.default.post.findUnique({
        where: { id: postId },
        include: { farmer: true },
    });
    if (!post) {
        throw new Error('Post not found');
    }
    // Only post author, farm owner, or admin can delete
    const isOwner = post.userId === userId || post.farmer?.userId === userId || userRole === 'ADMIN';
    if (!isOwner) {
        throw new Error('Unauthorized to delete this post');
    }
    // Clean up likes and comments first
    await prisma_1.default.postLike.deleteMany({ where: { postId } }).catch(() => { });
    await prisma_1.default.postComment.deleteMany({ where: { postId } }).catch(() => { });
    // Delete post
    await prisma_1.default.post.delete({ where: { id: postId } });
    return { success: true, message: 'Post deleted successfully' };
};
exports.deletePost = deletePost;
