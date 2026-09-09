import { WeightMatrix } from '../types/credit-scoring.types';
import { CreditEngineConfig } from '../config/credit-engine.config';

export class ColdStartStrategy {
  /**
   * Dynamically adjusts metric weights based on account maturity.
   * New farmers with < 3 completed orders receive progressive weighting based on identity & activity.
   */
  public static getAdjustedWeights(completedOrdersCount: number): {
    weights: WeightMatrix;
    isColdStart: boolean;
  } {
    if (completedOrdersCount < CreditEngineConfig.coldStartOrderThreshold) {
      return {
        isColdStart: true,
        weights: {
          kycCompliance: 0.40,      // 40% based on verified identity & farm GPS
          listingFrequency: 0.30,   // 30% based on active produce catalogs
          engagementVelocity: 0.20, // 20% buyer chat & social activity
          networkReach: 0.10,       // 10% followers
          salesFulfillment: 0.00,   // Not penalized for 0 sales yet
          deliveryReliability: 0.00,
          reviewBayesian: 0.00,
          repaymentIntegrity: 0.00,
        },
      };
    }

    return {
      isColdStart: false,
      weights: CreditEngineConfig.standardWeights,
    };
  }
}
