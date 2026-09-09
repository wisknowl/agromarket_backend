"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreditScoringEngine = void 0;
const prisma_1 = __importDefault(require("../../../core/database/prisma"));
const event_bus_1 = require("../../../core/events/event-bus");
const metric_collectors_1 = require("./collectors/metric-collectors");
const feature_normalizer_1 = require("./normalizers/feature-normalizer");
const tabi_scoring_strategy_1 = require("./formulas/tabi-scoring.strategy");
const cold_start_strategy_1 = require("./formulas/cold-start.strategy");
const decision_router_1 = require("./decision/decision-router");
class CreditScoringEngine {
    /**
     * Set custom or shadow scoring strategy (for A/B testing or ML shadow scoring)
     */
    static setStrategy(strategy) {
        this.strategy = strategy;
    }
    /**
     * Evaluates or re-scores a farmer profile through the full deterministic pipeline.
     */
    static async evaluateFarmer(params) {
        const { farmerId, triggeredBy = 'MANUAL_OR_API', overrideRawMetrics } = params;
        // Stage 1: Ingestion
        const rawMetrics = overrideRawMetrics || (await metric_collectors_1.MetricCollectors.collectAll(farmerId));
        // Stage 2: Normalization & Progressive Weight Selection
        const { weights, isColdStart } = cold_start_strategy_1.ColdStartStrategy.getAdjustedWeights(rawMetrics.salesFulfillment);
        const normalizedRadar = feature_normalizer_1.FeatureNormalizer.normalizeAll(rawMetrics);
        // Stage 3: Mathematical Formulation
        const { aggregateScore, ficoScore } = this.strategy.calculate(normalizedRadar, weights);
        // Stage 4: Decision Routing & Tier Determination
        const decision = decision_router_1.DecisionRouter.route({
            farmerId,
            aggregateScore,
            ficoScore,
            isColdStart,
            rawMetrics,
            normalizedRadar,
            weightsApplied: weights,
        });
        // Stage 5: State Persistence & Event Sourcing Audit Snapshot
        try {
            await prisma_1.default.$transaction([
                // Update live materialized profile
                prisma_1.default.farmerProfile.update({
                    where: { id: farmerId },
                    data: {
                        creditScore: decision.ficoScore,
                        creditTier: decision.tier,
                    },
                }),
                // Commit immutable event sourcing snapshot
                prisma_1.default.farmerCreditAuditSnapshot.create({
                    data: {
                        farmerId,
                        score: decision.ficoScore,
                        tier: decision.tier,
                        algorithmVersion: decision.algorithmVersion,
                        metricsSnapshot: normalizedRadar,
                        triggeredBy,
                    },
                }),
            ]);
            // Emit domain event
            event_bus_1.eventBus.publish('CREDIT_SCORE_RECALCULATED', {
                farmerId,
                score: decision.ficoScore,
                tier: decision.tier,
                decision,
            });
        }
        catch (error) {
            console.warn(`[CreditEngine] Note: Database commit failed or running in test mode:`, error.message);
        }
        return decision;
    }
    /**
     * Pure deterministic computation helper (useful for simulations and unit tests without DB calls)
     */
    static computePure(rawMetrics, farmerId = 'test-farmer') {
        const { weights, isColdStart } = cold_start_strategy_1.ColdStartStrategy.getAdjustedWeights(rawMetrics.salesFulfillment);
        const normalizedRadar = feature_normalizer_1.FeatureNormalizer.normalizeAll(rawMetrics);
        const { aggregateScore, ficoScore } = this.strategy.calculate(normalizedRadar, weights);
        return decision_router_1.DecisionRouter.route({
            farmerId,
            aggregateScore,
            ficoScore,
            isColdStart,
            rawMetrics,
            normalizedRadar,
            weightsApplied: weights,
        });
    }
}
exports.CreditScoringEngine = CreditScoringEngine;
CreditScoringEngine.strategy = new tabi_scoring_strategy_1.TabiV1Strategy();
