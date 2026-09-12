import prisma from '../../core/database/prisma';

export interface DynamicNotification {
  id: string;
  category: 'SYSTEM' | 'ACTIVITY' | 'FOLLOW' | 'ORDER' | 'FINTECH';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  avatarUrl?: string;
  targetId?: string;
  targetType?: 'post' | 'order' | 'profile' | 'yield' | 'loan';
  badge?: string;
  actorName?: string;
}

export const getUserNotifications = async (
  userId: string,
  categoryFilter?: string
): Promise<DynamicNotification[]> => {
  const notifications: DynamicNotification[] = [];

  // 1. Fetch Orders (Escrow & Delivery alerts)
  const orders = await prisma.order.findMany({
    where: { buyerId: userId },
    take: 10,
    orderBy: { createdAt: 'desc' },
  });

  for (const o of orders) {
    const timeStr = new Date(o.createdAt).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    if (o.status === 'COMPLETED' || o.isEscrowReleased) {
      notifications.push({
        id: `notif-escrow-${o.id}`,
        category: 'SYSTEM',
        title: 'Escrow Funds Released 💰',
        message: `Payment for Order #${o.orderNumber || o.id.slice(0, 8)} (${Number(o.totalAmount).toLocaleString()} ${o.currency}) was completed and released securely.`,
        timestamp: timeStr,
        isRead: true,
        targetId: o.id,
        targetType: 'order',
        badge: 'ESCROW_RELEASED',
      });
    } else {
      notifications.push({
        id: `notif-order-${o.id}`,
        category: 'ORDER',
        title: `Order Status: ${o.status.replace(/_/g, ' ')} 📦`,
        message: `Your order for delivery to ${o.deliveryCity} is currently ${o.status.toLowerCase().replace(/_/g, ' ')}.`,
        timestamp: timeStr,
        isRead: false,
        targetId: o.id,
        targetType: 'order',
        badge: 'ORDER_UPDATE',
      });
    }
  }

  // 2. Fetch Loans (Fintech / Credit updates)
  const farmerProfile = await prisma.farmerProfile.findUnique({
    where: { userId },
  });

  if (farmerProfile) {
    const loans = await prisma.loanApplication.findMany({
      where: { farmerId: farmerProfile.id },
      include: { product: true },
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    for (const l of loans) {
      const timeStr = new Date(l.createdAt).toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
      });
      notifications.push({
        id: `notif-loan-${l.id}`,
        category: 'FINTECH',
        title: `Loan Application: ${l.status} 🏦`,
        message: `Your seasonal input application for "${l.product?.title || 'Seasonal Loan'}" (${Number(l.requestedAmount).toLocaleString()} XAF) is ${l.status.toLowerCase()}.`,
        timestamp: timeStr,
        isRead: l.status === 'APPROVED',
        targetId: l.id,
        targetType: 'loan',
        badge: l.status === 'APPROVED' ? 'LOAN_APPROVED' : 'LOAN_REVIEW',
      });
    }

    // System badge for credit score
    notifications.push({
      id: `notif-credit-${farmerProfile.id}`,
      category: 'SYSTEM',
      title: `Credit Rating: ${farmerProfile.creditTier} Tier ⭐`,
      message: `Your farmer credit rating is evaluated at Score ${farmerProfile.creditScore} (${farmerProfile.creditTier} Tier) based on verifiable harvest transactions.`,
      timestamp: 'Today',
      isRead: true,
      targetId: farmerProfile.id,
      targetType: 'profile',
      badge: 'VERIFIED',
    });
  }

  // 3. Fetch Followers / Mutual Partners (Follow alerts)
  const followers = await prisma.follow.findMany({
    where: { followingId: userId },
    include: {
      follower: {
        select: { id: true, name: true, avatarUrl: true, role: true },
      },
    },
    take: 10,
    orderBy: { createdAt: 'desc' },
  });

  for (const f of followers) {
    const timeStr = new Date(f.createdAt).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
    });
    notifications.push({
      id: `notif-follow-${f.id}`,
      category: 'FOLLOW',
      title: 'New Connection Request / Follower 🤝',
      message: `${f.follower.name} started following your farm and market activity.`,
      timestamp: timeStr,
      isRead: false,
      avatarUrl: f.follower.avatarUrl || undefined,
      actorName: f.follower.name,
      targetId: f.follower.id,
      targetType: 'profile',
      badge: 'PARTNER',
    });
  }

  // 4. Fetch Community Activity (Comments on user's posts)
  const comments = await prisma.postComment.findMany({
    where: { post: { userId } },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
      post: { select: { id: true, content: true } },
    },
    take: 10,
    orderBy: { createdAt: 'desc' },
  });

  for (const c of comments) {
    const timeStr = new Date(c.createdAt).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
    });
    notifications.push({
      id: `notif-comment-${c.id}`,
      category: 'ACTIVITY',
      title: 'New Comment on Your Harvest Story 💬',
      message: `${c.user.name} commented: "${c.content.slice(0, 60)}"`,
      timestamp: timeStr,
      isRead: false,
      avatarUrl: c.user.avatarUrl || undefined,
      actorName: c.user.name,
      targetId: c.post.id,
      targetType: 'post',
      badge: 'COMMENT',
    });
  }

  // 5. Filter by category if requested
  if (categoryFilter) {
    const upper = categoryFilter.toUpperCase();
    return notifications.filter(
      (n) => n.category === upper || (upper === 'SYSTEM' && (n.category === 'SYSTEM' || n.category === 'FINTECH' || n.category === 'ORDER'))
    );
  }

  return notifications;
};
