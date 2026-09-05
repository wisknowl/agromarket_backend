"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addPostComment = exports.toggleLikePost = exports.createPost = exports.getAllPosts = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getAllPosts = async () => {
    return prisma.post.findMany({
        include: {
            farmer: {
                include: {
                    user: {
                        select: { id: true, name: true, avatarUrl: true },
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
    const farmer = await prisma.farmerProfile.findUnique({
        where: { userId },
    });
    if (!farmer)
        throw new Error('Only registered farmers can publish AgroFeed harvest stories');
    return prisma.post.create({
        data: {
            farmerId: farmer.id,
            content: data.content,
            mediaUrl: data.mediaUrl,
            isVideo: data.isVideo || false,
            linkedYieldId: data.linkedYieldId,
        },
        include: {
            farmer: {
                include: { user: true },
            },
        },
    });
};
exports.createPost = createPost;
const toggleLikePost = async (postId, userId) => {
    const existingLike = await prisma.postLike.findUnique({
        where: {
            postId_userId: { postId, userId },
        },
    });
    if (existingLike) {
        await prisma.postLike.delete({
            where: { id: existingLike.id },
        });
        await prisma.post.update({
            where: { id: postId },
            data: { likesCount: { decrement: 1 } },
        });
        return { liked: false };
    }
    else {
        await prisma.postLike.create({
            data: { postId, userId },
        });
        await prisma.post.update({
            where: { id: postId },
            data: { likesCount: { increment: 1 } },
        });
        return { liked: true };
    }
};
exports.toggleLikePost = toggleLikePost;
const addPostComment = async (postId, userId, content) => {
    const comment = await prisma.postComment.create({
        data: { postId, userId, content },
        include: {
            user: {
                select: { id: true, name: true, avatarUrl: true },
            },
        },
    });
    await prisma.post.update({
        where: { id: postId },
        data: { commentsCount: { increment: 1 } },
    });
    return comment;
};
exports.addPostComment = addPostComment;
