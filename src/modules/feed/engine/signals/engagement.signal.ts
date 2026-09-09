import { CandidatePost } from '../types/feed-ranking.types';
import { FeedEngineConfig } from '../config/feed-engine.config';
import { telemetryService } from '../../../../core/telemetry/telemetry.service';

export class EngagementSignal {
  /**
   * Evaluates post engagement rate combining video completion rate, shares, comments, and likes per impression.
   */
  public static calculate(post: CandidatePost): number {
    const weights = FeedEngineConfig.engagementWeights;

    // Retrieve real-time telemetry metrics if available
    const telemetry = telemetryService.getEntityMetrics('POST', post.id);

    const impressions = Math.max(1, post.impressionsCount || telemetry.impressions || (post.likesCount + post.commentsCount + 10));
    const likes = post.likesCount || telemetry.likes || 0;
    const comments = post.commentsCount || telemetry.comments || 0;
    const shares = post.sharesCount || telemetry.shares || 0;
    const completions = post.videoCompletionCount || telemetry.completionCount || 0;

    const weightedInteractions =
      completions * weights.videoCompletion +
      shares * weights.shares +
      comments * weights.comments +
      likes * weights.likes;

    // ER in [0, inf), log-dampened to keep in reasonable range [0, 5]
    const rawRate = weightedInteractions / impressions;
    const normalizedRate = Math.log1p(rawRate * 2);

    return Number(normalizedRate.toFixed(3));
  }
}
