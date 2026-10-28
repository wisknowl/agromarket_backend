import prisma from '../../core/database/prisma';
import { FeedRankingEngine, CandidatePost, UserContext } from './engine';

export const getAllPosts = async (params?: { farmId?: string; userId?: string }) => {
  return prisma.post.findMany({
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

export const getRankedFeed = async (context?: UserContext & { limit?: number }) => {
  const posts = await prisma.post.findMany({
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

  const candidates: CandidatePost[] = posts.map((p) => ({
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

  const rankedScores = FeedRankingEngine.rankPosts(candidates, context);
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

export const createPost = async (
  userId: string,
  data: { content: string; mediaUrl: string; isVideo?: boolean; linkedYieldId?: string; farmId?: string }
) => {
  let resolvedFarmId = data.farmId;
  if (!resolvedFarmId) {
    const userFarm = await prisma.farm.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    if (!userFarm) {
      throw new Error('A registered farm page is required to publish a harvest story. Please create your farm first.');
    }
    resolvedFarmId = userFarm.id;
  } else {
    const verifiedFarm = await prisma.farm.findFirst({
      where: { id: resolvedFarmId, userId },
    });
    if (!verifiedFarm) {
      throw new Error('Selected farm was not found or unauthorized.');
    }
  }

  let farmerId: string | undefined;
  const farmer = await prisma.farmerProfile.findUnique({
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

  return prisma.post.create({
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

export const deletePost = async (postId: string, userId: string, userRole?: string) => {
  const post = await prisma.post.findUnique({
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
  await prisma.postLike.deleteMany({ where: { postId } }).catch(() => {});
  await prisma.postComment.deleteMany({ where: { postId } }).catch(() => {});

  // Delete post
  await prisma.post.delete({ where: { id: postId } });
  return { success: true, message: 'Post deleted successfully' };
};
