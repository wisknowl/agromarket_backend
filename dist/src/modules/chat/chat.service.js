"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessage = exports.getConversationMessages = exports.getConversationById = exports.getOrCreateConversationWithUser = exports.getUserConversations = void 0;
const prisma_1 = __importDefault(require("../../core/database/prisma"));
const push_service_1 = require("../notifications/push.service");
const getUserConversations = async (userId) => {
    const conversations = await prisma_1.default.conversation.findMany({
        where: {
            OR: [{ participantAId: userId }, { participantBId: userId }],
        },
        include: {
            messages: {
                take: 1,
                orderBy: { createdAt: 'desc' },
            },
        },
        orderBy: { updatedAt: 'desc' },
    });
    if (conversations.length === 0) {
        return [];
    }
    // Collect other participants
    const otherUserIds = Array.from(new Set(conversations.map((c) => c.participantAId === userId ? c.participantBId : c.participantAId)));
    const users = await prisma_1.default.user.findMany({
        where: { id: { in: otherUserIds } },
        select: {
            id: true,
            name: true,
            avatarUrl: true,
            role: true,
            isVerified: true,
            farmerProfile: {
                select: {
                    farmName: true,
                    creditTier: true,
                    creditScore: true,
                },
            },
        },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));
    return conversations.map((conv) => {
        const otherId = conv.participantAId === userId ? conv.participantBId : conv.participantAId;
        const otherUser = userMap.get(otherId);
        const latestMsg = conv.messages[0];
        const timeFormatted = conv.updatedAt
            ? new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'Just now';
        return {
            id: conv.id,
            participantId: otherId,
            participantName: otherUser?.name || 'AgroMarket User',
            participantAvatar: otherUser?.avatarUrl || null,
            participantRole: otherUser?.role || 'BUYER',
            farmerName: otherUser?.farmerProfile?.farmName || otherUser?.name,
            farmerAvatar: otherUser?.avatarUrl || null,
            isVerified: otherUser?.isVerified || false,
            creditTier: otherUser?.farmerProfile?.creditTier || 'BRONZE',
            isOnline: true,
            lastMessage: conv.lastMessage || latestMsg?.content || 'Started a conversation',
            lastMessageTime: timeFormatted,
            updatedAt: conv.updatedAt,
            unreadCount: 0,
            messages: conv.messages,
        };
    });
};
exports.getUserConversations = getUserConversations;
const getOrCreateConversationWithUser = async (userId, targetUserId) => {
    let conversation = await prisma_1.default.conversation.findFirst({
        where: {
            OR: [
                { participantAId: userId, participantBId: targetUserId },
                { participantAId: targetUserId, participantBId: userId },
            ],
        },
    });
    if (!conversation) {
        conversation = await prisma_1.default.conversation.create({
            data: {
                participantAId: userId,
                participantBId: targetUserId,
                lastMessage: 'Conversation started',
            },
        });
    }
    const targetUser = await prisma_1.default.user.findUnique({
        where: { id: targetUserId },
        select: {
            id: true,
            name: true,
            avatarUrl: true,
            role: true,
            isVerified: true,
            farmerProfile: {
                select: {
                    farmName: true,
                    creditTier: true,
                    creditScore: true,
                },
            },
        },
    });
    return {
        conversation,
        targetUser,
    };
};
exports.getOrCreateConversationWithUser = getOrCreateConversationWithUser;
const getConversationById = async (conversationId, currentUserId) => {
    const conversation = await prisma_1.default.conversation.findUnique({
        where: { id: conversationId },
    });
    if (!conversation)
        return null;
    const otherId = conversation.participantAId === currentUserId ? conversation.participantBId : conversation.participantAId;
    const otherUser = await prisma_1.default.user.findUnique({
        where: { id: otherId },
        select: {
            id: true,
            name: true,
            avatarUrl: true,
            role: true,
            isVerified: true,
            farmerProfile: {
                select: {
                    farmName: true,
                    creditTier: true,
                    creditScore: true,
                },
            },
        },
    });
    return {
        conversation,
        targetUser: otherUser,
    };
};
exports.getConversationById = getConversationById;
const getConversationMessages = async (conversationId) => {
    return prisma_1.default.message.findMany({
        where: { conversationId },
        include: {
            sender: {
                select: { id: true, name: true, avatarUrl: true },
            },
        },
        orderBy: { createdAt: 'asc' },
    });
};
exports.getConversationMessages = getConversationMessages;
const sendMessage = async (senderId, receiverId, content) => {
    // Find or create conversation
    let conversation = await prisma_1.default.conversation.findFirst({
        where: {
            OR: [
                { participantAId: senderId, participantBId: receiverId },
                { participantAId: receiverId, participantBId: senderId },
            ],
        },
    });
    if (!conversation) {
        conversation = await prisma_1.default.conversation.create({
            data: {
                participantAId: senderId,
                participantBId: receiverId,
                lastMessage: content,
            },
        });
    }
    else {
        await prisma_1.default.conversation.update({
            where: { id: conversation.id },
            data: { lastMessage: content, updatedAt: new Date() },
        });
    }
    const message = await prisma_1.default.message.create({
        data: {
            conversationId: conversation.id,
            senderId,
            receiverId,
            content,
        },
        include: {
            sender: { select: { id: true, name: true, avatarUrl: true } },
        },
    });
    // Asynchronously dispatch real push notification to the recipient
    const senderName = message.sender?.name || 'AgroMarket Partner';
    (0, push_service_1.sendPushToUser)(receiverId, {
        title: `🌾 ${senderName}`,
        body: content,
        data: {
            conversationId: conversation.id,
            senderId,
            type: 'CHAT_MESSAGE',
        },
    }).catch((err) => console.error('[PUSH ERROR] Failed to dispatch chat notification:', err));
    return { conversation, message };
};
exports.sendMessage = sendMessage;
