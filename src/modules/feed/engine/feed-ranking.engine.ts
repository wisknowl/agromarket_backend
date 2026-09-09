import { CandidatePost, UserContext, PostRankingScore } from './types/feed-ranking.types';
import { FeedEngineConfig } from './config/feed-engine.config';
import { AffinitySignal } from './signals/affinity.signal';
import { EngagementSignal } from './signals/engagement.signal';
import { ProximitySignal } from './signals/proximity.signal';
import { FreshnessRanker } from './rankers/freshness.ranker';

export class FeedRankingEngine {
  /**
   * Scores and ranks an array of candidate posts according to the TikTok-model formulation:
   * PostRank(u, p) = (alpha * Affinity + beta * EngagementRate + gamma * GeoProximity) * FreshnessDecay
   */
  public static rankPosts(posts: CandidatePost[], context?: UserContext): PostRankingScore[] {
    const scoredPosts: PostRankingScore[] = posts.map((post) => {
      // 1. Affinity
      const { score: affinityScore, isPartnerBoosted } = AffinitySignal.calculate(post, context);

      // 2. Engagement Rate
      const engagementRate = EngagementSignal.calculate(post);

      // 3. Geo-Proximity
      const { score: geoProximityScore } = ProximitySignal.calculate(post, context);

      // 4. Freshness Decay
      const freshnessDecay = FreshnessRanker.calculate(post.createdAt);

      // Master Formula
      const weightedSum =
        FeedEngineConfig.alpha * affinityScore +
        FeedEngineConfig.beta * engagementRate +
        FeedEngineConfig.gamma * geoProximityScore;

      const totalRankScore = Number((weightedSum * freshnessDecay).toFixed(4));

      return {
        postId: post.id,
        totalRankScore,
        affinityScore,
        engagementRate,
        geoProximityScore,
        freshnessDecay,
        isPartnerBoosted,
        post,
      };
    });

    // Sort descending by totalRankScore
    scoredPosts.sort((a, b) => b.totalRankScore - a.totalRankScore);

    return scoredPosts;
  }

  /**
   * Pure single-post evaluation for debugging or inspection
   */
  public static scoreSinglePost(post: CandidatePost, context?: UserContext): PostRankingScore {
    return this.rankPosts([post], context)[0];
  }
}
