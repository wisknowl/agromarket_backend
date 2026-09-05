"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessage = exports.getConversationMessages = exports.getUserConversations = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getUserConversations = async (userId) => {
    return prisma.conversation.findMany({
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
    return prisma.message.findMany({
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
    let conversation = await prisma.conversation.findFirst({
        where: {
            OR: [
                { participantAId: senderId, participantBId: receiverId },
                { participantAId: receiverId, participantBId: senderId },
            ],
        },
    });
    if (!conversation) {
        conversation = await prisma.conversation.create({
            data: {
                participantAId: senderId,
                participantBId: receiverId,
                lastMessage: content,
            },
        });
    }
    else {
        await prisma.conversation.update({
            where: { id: conversation.id },
            data: { lastMessage: content, updatedAt: new Date() },
        });
    }
    const message = await prisma.message.create({
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
