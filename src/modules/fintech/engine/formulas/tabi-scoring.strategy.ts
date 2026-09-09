import { NormalizedMetrics, WeightMatrix } from '../types/credit-scoring.types';
import { CreditEngineConfig } from '../config/credit-engine.config';

export interface IScoringStrategy {
  readonly version: string;
  calculate(metrics: NormalizedMetrics, weights: WeightMatrix): { aggregateScore: number; ficoScore: number };
}

export class TabiV1Strategy implements IScoringStrategy {
  readonly version = CreditEngineConfig.version;

  calculate(metrics: NormalizedMetrics, weights: WeightMatrix): { aggregateScore: number; ficoScore: number } {
    // 1. Aggregate weighted score [0, 100]
    const aggregate =
      metrics.salesFulfillment * weights.salesFulfillment +
      metrics.listingFrequency * weights.listingFrequency +
      metrics.reviewBayesian * weights.reviewBayesian +
      metrics.deliveryReliability * weights.deliveryReliability +
      metrics.networkReach * weights.networkReach +
      metrics.engagementVelocity * weights.engagementVelocity +
      metrics.repaymentIntegrity * weights.repaymentIntegrity +
      metrics.kycCompliance * weights.kycCompliance;

    const aggregateScore = Number(Math.min(100, Math.max(0, aggregate)).toFixed(2));

    // 2. FICO-like scaling [300, 850]
    // FicoScore = 300 + (AggregateCreditScore / 100) * 550
    const fico = CreditEngineConfig.ficoMin + (aggregateScore / 100) * (CreditEngineConfig.ficoMax - CreditEngineConfig.ficoMin);
    const ficoScore = Math.round(fico);

    return {
      aggregateScore,
      ficoScore,
    };
  }
}
