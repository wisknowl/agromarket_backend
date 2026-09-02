import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getUserConversations = async (userId: string) => {
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

export const getConversationMessages = async (conversationId: string) => {
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

export const sendMessage = async (senderId: string, receiverId: string, content: string) => {
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
  } else {
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
