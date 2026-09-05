"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addPostComment = exports.toggleLikePost = exports.createPost = exports.getAllPosts = void 0;
const prisma_1 = __importDefault(require("../../core/database/prisma"));
const getAllPosts = async (params) => {
    return prisma_1.default.post.findMany({
        where: {
            ...(params?.farmId && { farmId: params.farmId }),
            ...(params?.userId && { userId: params.userId }),
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
const createPost = async (userId, data) => {
    let farmerId;
    const farmer = await prisma_1.default.farmerProfile.findUnique({
        where: { userId },
    });
    if (farmer) {
        farmerId = farmer.id;
    }
    return prisma_1.default.post.create({
        data: {
            userId,
            farmerId,
            farmId: data.farmId,
            content: data.content,
            mediaUrl: data.mediaUrl,
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
