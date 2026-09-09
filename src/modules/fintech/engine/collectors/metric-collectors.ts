import prisma from '../../../../core/database/prisma';
import { RawMetrics } from '../types/credit-scoring.types';
import { CreditEngineConfig } from '../config/credit-engine.config';

export class MetricCollectors {
  /**
   * Ingests all 8 empirical metrics for a given farmer profile over a rolling window.
   */
  public static async collectAll(farmerId: string): Promise<RawMetrics> {
    const farmer = await prisma.farmerProfile.findUnique({
      where: { id: farmerId },
      include: {
        user: {
          include: {
            followers: true,
          },
        },
        yields: {
          include: {
            reviews: true,
          },
        },
        posts: {
          include: {
            likes: true,
            comments: true,
          },
        },
        loanApplications: true,
        orderItemsSold: {
          include: {
            order: {
              include: {
                escrow: true,
              },
            },
          },
        },
      },
    });

    if (!farmer) {
      throw new Error(`FarmerProfile not found for ID: ${farmerId}`);
    }

    // 1. M1: Sales Fulfillment Volume
    const completedOrders = farmer.orderItemsSold.filter(
      (item) => item.order.status === 'COMPLETED'
    );
    const salesFulfillment = completedOrders.length;

    // 2. M2: Listing Regularity & Active Crops
    const activeYields = farmer.yields.filter((y) => y.isAvailable);
    const uniqueProduceVarieties = new Set(activeYields.map((y) => y.categoryId)).size;
    // Estimate monthly update frequency from yield creation/updates in the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentUpdatesCount = farmer.yields.filter((y) => y.updatedAt >= thirtyDaysAgo).length;
    const monthlyUpdateFrequency = Math.max(1, recentUpdatesCount);
    const listingFrequency = uniqueProduceVarieties * monthlyUpdateFrequency;

    // 3. M3: Customer Review Bayesian Average
    // R_bar = (C * m + sum(r_j)) / (C + n)
    const allReviews = farmer.yields.flatMap((y) => y.reviews);
    const n = allReviews.length;
    const ratingSum = allReviews.reduce((sum, r) => sum + r.rating, 0);
    const C = CreditEngineConfig.bayesianConfidenceWeight;
    const m = CreditEngineConfig.bayesianPriorRating;
    const reviewBayesian = Number(((C * m + ratingSum) / (C + n)).toFixed(2));

    // 4. M4: Delivery Reliability Ratio
    const totalAcceptedOrders = farmer.orderItemsSold.length;
    const disputedOrdersCount = farmer.orderItemsSold.filter(
      (item) => item.order.status === 'DISPUTED' || item.order.escrow?.isDisputed
    ).length;
    const deliveryReliability = totalAcceptedOrders > 0
      ? Math.max(0, (totalAcceptedOrders - disputedOrdersCount) / totalAcceptedOrders)
      : 1.0; // Clean slate for new farmers

    // 5. M5: Trade Follower Network
    const networkReach = farmer.user.followers.length || farmer.totalFollowers || 0;

    // 6. M6: Engagement Velocity
    // Score = (Likes * 1.0) + (Comments * 2.5) + (Shares * 4.0) + (Offers * 3.0)
    let totalLikes = 0;
    let totalComments = 0;
    for (const post of farmer.posts) {
      totalLikes += post.likes.length || post.likesCount || 0;
      totalComments += post.comments.length || post.commentsCount || 0;
    }
    const engagementVelocity = totalLikes * 1.0 + totalComments * 2.5;

    // 7. M7: Loan Repayment Integrity
    const disbursedLoans = farmer.loanApplications.filter(
      (l) => l.status === 'DISBURSED' || l.status === 'REPAID'
    );
    let repaymentIntegrity = 1.0; // Default intact if no loan defaults
    if (disbursedLoans.length > 0) {
      let totalDue = 0;
      let totalRepaid = 0;
      for (const loan of disbursedLoans) {
        const principal = Number(loan.approvedAmount || loan.requestedAmount);
        totalDue += principal;
        totalRepaid += Number(loan.totalRepaidAmount || 0);
      }
      repaymentIntegrity = totalDue > 0 ? Math.min(1.0, totalRepaid / totalDue) : 1.0;
    }

    // 8. M8: KYC & Verification Confidence
    // National ID Verified (30 pts) + GPS Coordinates (30 pts) + Cooperative Membership (40 pts)
    let kycCompliance = 0;
    if (farmer.nationalIdNumber && farmer.nationalIdNumber.trim().length > 3) {
      kycCompliance += 30;
    }
    if (farmer.gpsLatitude && farmer.gpsLongitude) {
      kycCompliance += 30;
    }
    if (farmer.cooperativeName && farmer.cooperativeName.trim().length > 2) {
      kycCompliance += 40;
    }

    return {
      salesFulfillment,
      listingFrequency,
      reviewBayesian,
      deliveryReliability,
      networkReach,
      engagementVelocity,
      repaymentIntegrity,
      kycCompliance,
    };
  }
}
