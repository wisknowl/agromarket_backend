import prisma from '../../core/database/prisma';
import { sendPushToUser } from '../notifications/push.service';

export const getUserConversations = async (userId: string) => {
  const conversations = await prisma.conversation.findMany({
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
  const otherUserIds = Array.from(
    new Set(
      conversations.map((c) =>
        c.participantAId === userId ? c.participantBId : c.participantAId
      )
    )
  );

  const users = await prisma.user.findMany({
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

export const getOrCreateConversationWithUser = async (userId: string, targetUserId: string) => {
  let conversation = await prisma.conversation.findFirst({
    where: {
      OR: [
        { participantAId: userId, participantBId: targetUserId },
        { participantAId: targetUserId, participantBId: userId },
      ],
    },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        participantAId: userId,
        participantBId: targetUserId,
        lastMessage: 'Conversation started',
      },
    });
  }

  const targetUser = await prisma.user.findUnique({
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

export const getConversationById = async (conversationId: string, currentUserId: string) => {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation) return null;

  const otherId = conversation.participantAId === currentUserId ? conversation.participantBId : conversation.participantAId;
  const otherUser = await prisma.user.findUnique({
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

  // Asynchronously dispatch real push notification to the recipient
  const senderName = message.sender?.name || 'AgroMarket Partner';
  sendPushToUser(receiverId, {
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

