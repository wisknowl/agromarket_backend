import { FeedEngineConfig } from '../config/feed-engine.config';

export class FreshnessRanker {
  /**
   * Computes exponential time decay: e^(-lambda * t_hours)
   * Recent morning harvest posts receive values close to 1.0, decaying smoothly over days.
   */
  public static calculate(createdAt: Date): number {
    const ageMillis = Math.max(0, Date.now() - new Date(createdAt).getTime());
    const ageHours = ageMillis / (1000 * 60 * 60);

    const decay = Math.exp(-FeedEngineConfig.lambda * ageHours);
    return Number(Math.max(0.01, decay).toFixed(4));
  }
}
