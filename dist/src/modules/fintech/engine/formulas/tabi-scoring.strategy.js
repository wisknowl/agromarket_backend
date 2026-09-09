"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TabiV1Strategy = void 0;
const credit_engine_config_1 = require("../config/credit-engine.config");
class TabiV1Strategy {
    constructor() {
        this.version = credit_engine_config_1.CreditEngineConfig.version;
    }
    calculate(metrics, weights) {
        // 1. Aggregate weighted score [0, 100]
        const aggregate = metrics.salesFulfillment * weights.salesFulfillment +
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
        const fico = credit_engine_config_1.CreditEngineConfig.ficoMin + (aggregateScore / 100) * (credit_engine_config_1.CreditEngineConfig.ficoMax - credit_engine_config_1.CreditEngineConfig.ficoMin);
        const ficoScore = Math.round(fico);
        return {
            aggregateScore,
            ficoScore,
        };
    }
}
exports.TabiV1Strategy = TabiV1Strategy;
