"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureNormalizer = void 0;
const credit_engine_config_1 = require("../config/credit-engine.config");
class FeatureNormalizer {
    /**
     * Normalizes a raw metric value into a standardized scalar Z_i in [0, 100] using Min-Max scaling.
     */
    static minMaxScale(value, min, max) {
        if (max <= min)
            return 0;
        const scaled = ((value - min) / (max - min)) * 100;
        return Math.min(100, Math.max(0, scaled));
    }
    /**
     * Normalizes all 8 raw metrics into standard [0, 100] scalars.
     */
    static normalizeAll(raw) {
        const b = credit_engine_config_1.CreditEngineConfig.metricBounds;
        return {
            salesFulfillment: Number(this.minMaxScale(raw.salesFulfillment, b.salesFulfillment.min, b.salesFulfillment.max).toFixed(2)),
            listingFrequency: Number(this.minMaxScale(raw.listingFrequency, b.listingFrequency.min, b.listingFrequency.max).toFixed(2)),
            reviewBayesian: Number(this.minMaxScale(raw.reviewBayesian, b.reviewBayesian.min, b.reviewBayesian.max).toFixed(2)),
            deliveryReliability: Number(this.minMaxScale(raw.deliveryReliability, b.deliveryReliability.min, b.deliveryReliability.max).toFixed(2)),
            networkReach: Number(this.minMaxScale(raw.networkReach, b.networkReach.min, b.networkReach.max).toFixed(2)),
            engagementVelocity: Number(this.minMaxScale(raw.engagementVelocity, b.engagementVelocity.min, b.engagementVelocity.max).toFixed(2)),
            repaymentIntegrity: Number(this.minMaxScale(raw.repaymentIntegrity, b.repaymentIntegrity.min, b.repaymentIntegrity.max).toFixed(2)),
            kycCompliance: Number(this.minMaxScale(raw.kycCompliance, b.kycCompliance.min, b.kycCompliance.max).toFixed(2)),
        };
    }
}
exports.FeatureNormalizer = FeatureNormalizer;
