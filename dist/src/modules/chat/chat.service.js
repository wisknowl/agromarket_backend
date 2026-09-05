"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessage = exports.getConversationMessages = exports.getUserConversations = void 0;
const prisma_1 = __importDefault(require("../../core/database/prisma"));
const getUserConversations = async (userId) => {
    return prisma_1.default.conversation.findMany({
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
};
exports.getUserConversations = getUserConversations;
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
    return { conversation, message };
};
exports.sendMessage = sendMessage;
