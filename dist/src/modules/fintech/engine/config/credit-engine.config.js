"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreditEngineConfig = void 0;
exports.CreditEngineConfig = {
    version: 'v1.0.0-tabi',
    // Section 7.2: Victory Eyong Tabi Standard Weight Matrix
    standardWeights: {
        repaymentIntegrity: 0.25,
        salesFulfillment: 0.20,
        deliveryReliability: 0.15,
        reviewBayesian: 0.12,
        listingFrequency: 0.10,
        engagementVelocity: 0.08,
        networkReach: 0.05,
        kycCompliance: 0.05,
    },
    // Normalization scaling bounds [M_min, M_max] for raw metrics
    metricBounds: {
        salesFulfillment: { min: 0, max: 50 },
        listingFrequency: { min: 0, max: 20 },
        reviewBayesian: { min: 1.0, max: 5.0 },
        deliveryReliability: { min: 0.0, max: 1.0 },
        networkReach: { min: 0, max: 200 },
        engagementVelocity: { min: 0, max: 500 },
        repaymentIntegrity: { min: 0.0, max: 1.0 },
        kycCompliance: { min: 0, max: 100 },
    },
    // Bayesian rating constants (Section 7.1 M3)
    bayesianPriorRating: 4.0, // m: platform baseline prior
    bayesianConfidenceWeight: 10, // C: confidence weight
    // FICO scaling
    ficoMin: 300,
    ficoMax: 850,
    // Decision Tiers & Thresholds (Section 7.3)
    thresholds: {
        routeBMinimumFico: 500,
        bronze: { min: 500, max: 649, loanLimitUsd: 800, loanLimitXaf: 500000, escrowDeductionPct: 0.20 },
        silver: { min: 650, max: 749, loanLimitUsd: 2500, loanLimitXaf: 1600000, escrowDeductionPct: 0.15 },
        gold: { min: 750, max: 850, loanLimitUsd: 10000, loanLimitXaf: 6500000, escrowDeductionPct: 0.10 },
    },
    // Cold-Start Stage 1 Threshold
    coldStartOrderThreshold: 3,
};
