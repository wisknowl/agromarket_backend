import { eventBus } from '../events/event-bus';

export interface TelemetryEventPayload {
  userId?: string;
  eventType: 'VIEW' | 'VIDEO_WATCH' | 'LIKE' | 'SHARE' | 'COMMENT' | 'OFFER_SENT' | 'SEARCH';
  entityType: 'POST' | 'YIELD' | 'FARMER' | 'ORDER';
  entityId: string;
  metadata?: {
    watchDurationSeconds?: number;
    videoTotalSeconds?: number;
    completedPercentage?: number;
    query?: string;
    [key: string]: any;
  };
  timestamp?: Date;
}

export interface AggregatedEntityMetrics {
  views: number;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  avgWatchPercentage: number;
  completionCount: number; // Watched >= 80%
}

class TelemetryService {
  // Fast in-memory telemetry buffer for high-frequency video/view telemetry
  private metricsStore: Map<string, AggregatedEntityMetrics> = new Map();

  /**
   * Tier 1 (Hot Path Synchronous <30ms): Ingest telemetry event
   */
  public recordEvent(event: TelemetryEventPayload): void {
    const timestamp = event.timestamp || new Date();
    const key = `${event.entityType}:${event.entityId}`;

    let metrics = this.metricsStore.get(key);
    if (!metrics) {
      metrics = {
        views: 0,
        impressions: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        avgWatchPercentage: 0,
        completionCount: 0,
      };
      this.metricsStore.set(key, metrics);
    }

    metrics.impressions += 1;

    switch (event.eventType) {
      case 'VIEW':
        metrics.views += 1;
        break;
      case 'LIKE':
        metrics.likes += 1;
        break;
      case 'SHARE':
        metrics.shares += 1;
        break;
      case 'COMMENT':
        metrics.comments += 1;
        break;
      case 'VIDEO_WATCH':
        const duration = event.metadata?.watchDurationSeconds || 0;
        const total = event.metadata?.videoTotalSeconds || 1;
        const pct = Math.min(100, Math.max(0, (duration / total) * 100));
        
        // Exponential moving average for watch percentage
        metrics.avgWatchPercentage = metrics.views > 0
          ? metrics.avgWatchPercentage * 0.8 + pct * 0.2
          : pct;
        metrics.views += 1;

        if (pct >= 80) {
          metrics.completionCount += 1;
        }
        break;
    }

    // Publish event asynchronously to EventBus
    eventBus.publish('TELEMETRY_RECORDED', {
      ...event,
      timestamp,
    });
  }

  /**
   * Retrieve aggregated metrics for a given entity (e.g. post or farm)
   */
  public getEntityMetrics(entityType: 'POST' | 'YIELD' | 'FARMER', entityId: string): AggregatedEntityMetrics {
    const key = `${entityType}:${entityId}`;
    return (
      this.metricsStore.get(key) || {
        views: 0,
        impressions: 1, // Avoid division by zero
        likes: 0,
        comments: 0,
        shares: 0,
        avgWatchPercentage: 0,
        completionCount: 0,
      }
    );
  }

  /**
   * Clears or flushes telemetry memory (for testing or scheduled workers)
   */
  public flush(): void {
    this.metricsStore.clear();
  }
}

export const telemetryService = new TelemetryService();
export default telemetryService;
