import { CandidatePost, UserContext } from '../types/feed-ranking.types';
import { FeedEngineConfig } from '../config/feed-engine.config';

export class ProximitySignal {
  /**
   * Earth's mean radius in kilometers
   */
  private static readonly EARTH_RADIUS_KM = 6371;

  /**
   * Calculates spatial distance between buyer coordinates and harvest farm via Haversine equation.
   * Returns a normalized proximity score in (0, 1].
   */
  public static calculate(post: CandidatePost, context?: UserContext): { score: number; distanceKm?: number } {
    if (
      !context ||
      context.deliveryLatitude == null ||
      context.deliveryLongitude == null ||
      post.farmLatitude == null ||
      post.farmLongitude == null
    ) {
      // Neutral score when location is not available
      return { score: 0.5 };
    }

    const distanceKm = this.haversineDistance(
      context.deliveryLatitude,
      context.deliveryLongitude,
      post.farmLatitude,
      post.farmLongitude
    );

    // Hyperbolic proximity curve: 1.0 when distance is 0 km, 0.5 at 50 km, asymptotically approaching 0
    const score = 1 / (1 + distanceKm / FeedEngineConfig.proximityHalfLifeKm);

    return {
      score: Number(score.toFixed(3)),
      distanceKm: Number(distanceKm.toFixed(1)),
    };
  }

  /**
   * Haversine formula implementation in kilometers
   */
  public static haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return this.EARTH_RADIUS_KM * c;
  }

  private static toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }
}
