import { CreditTier } from '@prisma/client';

export { CreditTier };

export interface RawMetrics {
  salesFulfillment: number;    // M1: Completed Orders Count
  listingFrequency: number;    // M2: Active produce varieties * monthly updates
  reviewBayesian: number;      // M3: Bayesian average review rating (1.0 - 5.0)
  deliveryReliability: number; // M4: Orders without dispute / total orders [0.0 - 1.0]
  networkReach: number;        // M5: Follower count (buyers, wholesalers, transporters)
  engagementVelocity: number;  // M6: (Likes * 1) + (Comments * 2.5) + (Shares * 4) + (Offers * 3)
  repaymentIntegrity: number;  // M7: Principal Repaid on Time / Principal Due [0.0 - 1.0]
  kycCompliance: number;       // M8: National ID (30) + GPS (30) + Coop (40) [0 - 100]
}

export interface NormalizedMetrics {
  salesFulfillment: number;    // Z1: [0 - 100]
  listingFrequency: number;    // Z2: [0 - 100]
  reviewBayesian: number;      // Z3: [0 - 100]
  deliveryReliability: number; // Z4: [0 - 100]
  networkReach: number;        // Z5: [0 - 100]
  engagementVelocity: number;  // Z6: [0 - 100]
  repaymentIntegrity: number;  // Z7: [0 - 100]
  kycCompliance: number;       // Z8: [0 - 100]
}

export interface WeightMatrix {
  salesFulfillment: number;
  listingFrequency: number;
  reviewBayesian: number;
  deliveryReliability: number;
  networkReach: number;
  engagementVelocity: number;
  repaymentIntegrity: number;
  kycCompliance: number;
}

export type CreditDecisionRoute = 'ROUTE_A_PENDING' | 'ROUTE_B_APPROVED';

export interface ActionableRecommendation {
  metricKey: keyof NormalizedMetrics;
  metricLabel: string;
  currentScore: number;
  targetScore: number;
  advice: string;
}

export interface CreditDecisionContract {
  farmerId: string;
  algorithmVersion: string;
  aggregateScore: number;      // 0 - 100
  ficoScore: number;           // 300 - 850
  tier: CreditTier;
  route: CreditDecisionRoute;
  maxLoanLimitUsd: number;
  maxLoanLimitXaf: number;
  autoEscrowDeductionRate: number; // e.g. 0.20 (20%)
  isColdStart: boolean;
  rawMetrics: RawMetrics;
  normalizedRadar: NormalizedMetrics;
  weightsApplied: WeightMatrix;
  roadmapToNextTier?: {
    nextTier: CreditTier;
    pointsNeeded: number;
    recommendations: ActionableRecommendation[];
  };
  educationalFeedback?: string[];
}
