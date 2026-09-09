"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecisionRouter = void 0;
const credit_scoring_types_1 = require("../types/credit-scoring.types");
const credit_engine_config_1 = require("../config/credit-engine.config");
class DecisionRouter {
    /**
     * Evaluates FICO score against decision gates and builds decision contract with actionable roadmap.
     */
    static route(params) {
        const { farmerId, aggregateScore, ficoScore, isColdStart, rawMetrics, normalizedRadar, weightsApplied } = params;
        const cfg = credit_engine_config_1.CreditEngineConfig.thresholds;
        let tier = credit_scoring_types_1.CreditTier.BRONZE;
        let route = 'ROUTE_A_PENDING';
        let maxLoanLimitUsd = 0;
        let maxLoanLimitXaf = 0;
        let autoEscrowDeductionRate = 0.20;
        const educationalFeedback = [];
        if (ficoScore < cfg.routeBMinimumFico) {
            // Route A: Below Threshold
            route = 'ROUTE_A_PENDING';
            tier = credit_scoring_types_1.CreditTier.BRONZE;
            maxLoanLimitUsd = 0;
            maxLoanLimitXaf = 0;
            educationalFeedback.push('Credit limit currently locked. Complete more verified harvest deliveries without disputes to unlock micro-seed financing.');
            if (rawMetrics.kycCompliance < 70) {
                educationalFeedback.push('Add your National ID and verify farm GPS location to boost your base score by up to 60 points.');
            }
            if (rawMetrics.listingFrequency < 5) {
                educationalFeedback.push('List at least 2 active harvest varieties with weekly inventory updates.');
            }
        }
        else if (ficoScore >= cfg.gold.min) {
            // Gold Tier
            route = 'ROUTE_B_APPROVED';
            tier = credit_scoring_types_1.CreditTier.GOLD;
            maxLoanLimitUsd = cfg.gold.loanLimitUsd;
            maxLoanLimitXaf = cfg.gold.loanLimitXaf;
            autoEscrowDeductionRate = cfg.gold.escrowDeductionPct;
        }
        else if (ficoScore >= cfg.silver.min) {
            // Silver Tier
            route = 'ROUTE_B_APPROVED';
            tier = credit_scoring_types_1.CreditTier.SILVER;
            maxLoanLimitUsd = cfg.silver.loanLimitUsd;
            maxLoanLimitXaf = cfg.silver.loanLimitXaf;
            autoEscrowDeductionRate = cfg.silver.escrowDeductionPct;
        }
        else {
            // Bronze Tier
            route = 'ROUTE_B_APPROVED';
            tier = credit_scoring_types_1.CreditTier.BRONZE;
            maxLoanLimitUsd = cfg.bronze.loanLimitUsd;
            maxLoanLimitXaf = cfg.bronze.loanLimitXaf;
            autoEscrowDeductionRate = cfg.bronze.escrowDeductionPct;
        }
        // Roadmap to next tier (Section 13)
        let nextTier;
        let pointsNeeded = 0;
        if (ficoScore < 500) {
            nextTier = credit_scoring_types_1.CreditTier.BRONZE;
            pointsNeeded = 500 - ficoScore;
        }
        else if (ficoScore < 650) {
            nextTier = credit_scoring_types_1.CreditTier.SILVER;
            pointsNeeded = 650 - ficoScore;
        }
        else if (ficoScore < 750) {
            nextTier = credit_scoring_types_1.CreditTier.GOLD;
            pointsNeeded = 750 - ficoScore;
        }
        const recommendations = [];
        if (nextTier) {
            if (normalizedRadar.deliveryReliability < 90) {
                recommendations.push({
                    metricKey: 'deliveryReliability',
                    metricLabel: 'Delivery Reliability',
                    currentScore: normalizedRadar.deliveryReliability,
                    targetScore: 95,
                    advice: 'Fulfill your next 3 orders on time without buyer disputes to gain up to 25 credit points.',
                });
            }
            if (normalizedRadar.salesFulfillment < 70) {
                recommendations.push({
                    metricKey: 'salesFulfillment',
                    metricLabel: 'Sales Volume',
                    currentScore: normalizedRadar.salesFulfillment,
                    targetScore: 80,
                    advice: 'Complete more sales through AgroMarket to prove steady harvest production.',
                });
            }
            if (normalizedRadar.reviewBayesian < 80) {
                recommendations.push({
                    metricKey: 'reviewBayesian',
                    metricLabel: 'Customer Reviews',
                    currentScore: normalizedRadar.reviewBayesian,
                    targetScore: 90,
                    advice: 'Encourage satisfied buyers to leave 5-star verified reviews on your produce.',
                });
            }
            if (normalizedRadar.kycCompliance < 100) {
                recommendations.push({
                    metricKey: 'kycCompliance',
                    metricLabel: 'KYC & Verification',
                    currentScore: normalizedRadar.kycCompliance,
                    targetScore: 100,
                    advice: 'Provide your cooperative membership and GPS farm pin for an instant score upgrade.',
                });
            }
        }
        return {
            farmerId,
            algorithmVersion: credit_engine_config_1.CreditEngineConfig.version,
            aggregateScore,
            ficoScore,
            tier,
            route,
            maxLoanLimitUsd,
            maxLoanLimitXaf,
            autoEscrowDeductionRate,
            isColdStart,
            rawMetrics,
            normalizedRadar,
            weightsApplied,
            roadmapToNextTier: nextTier
                ? {
                    nextTier,
                    pointsNeeded,
                    recommendations,
                }
                : undefined,
            educationalFeedback: educationalFeedback.length > 0 ? educationalFeedback : undefined,
        };
    }
}
exports.DecisionRouter = DecisionRouter;
