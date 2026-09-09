import { CandidatePost, UserContext } from '../types/feed-ranking.types';
import { FeedEngineConfig } from '../config/feed-engine.config';

export class AffinitySignal {
  /**
   * Calculates buyer-to-farmer affinity score.
   * If buyer and farmer are Mutual AgroPartners, applies a +2.5x boost.
   */
  public static calculate(post: CandidatePost, context?: UserContext): { score: number; isPartnerBoosted: boolean } {
    let baseAffinity = 1.0;
    let isPartnerBoosted = false;

    if (!context || !context.userId) {
      return { score: baseAffinity, isPartnerBoosted: false };
    }

    const farmerId = post.farmerId || (post.farmer ? post.farmer.id : undefined);

    // Mutual AgroPartner Boost (+2.5x)
    if (farmerId && context.partnerFarmerIds && context.partnerFarmerIds.includes(farmerId)) {
      baseAffinity *= FeedEngineConfig.partnerAffinityMultiplier;
      isPartnerBoosted = true;
    }

    // High-credit verified farmer trust boost (Section 4.1)
    if (post.farmerCreditTier === 'GOLD' || post.farmer?.creditTier === 'GOLD') {
      baseAffinity += 0.3;
    } else if (post.farmerCreditTier === 'SILVER' || post.farmer?.creditTier === 'SILVER') {
      baseAffinity += 0.15;
    }

    return {
      score: Number(baseAffinity.toFixed(3)),
      isPartnerBoosted,
    };
  }
}
