import prisma from '../../core/database/prisma';

export const getAllPosts = async (params?: { farmId?: string; userId?: string }) => {
  return prisma.post.findMany({
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

export const createPost = async (
  userId: string,
  data: { content: string; mediaUrl: string; isVideo?: boolean; linkedYieldId?: string; farmId?: string }
) => {
  let farmerId: string | undefined;
  const farmer = await prisma.farmerProfile.findUnique({
    where: { userId },
  });
  if (farmer) {
    farmerId = farmer.id;
  }

  return prisma.post.create({
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

export const toggleLikePost = async (postId: string, userId: string) => {
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
  } else {
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

export const addPostComment = async (postId: string, userId: string, content: string) => {
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
