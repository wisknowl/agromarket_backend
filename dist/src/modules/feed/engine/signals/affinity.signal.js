"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AffinitySignal = void 0;
const feed_engine_config_1 = require("../config/feed-engine.config");
class AffinitySignal {
    /**
     * Calculates buyer-to-farmer affinity score.
     * If buyer and farmer are Mutual AgroPartners, applies a +2.5x boost.
     */
    static calculate(post, context) {
        let baseAffinity = 1.0;
        let isPartnerBoosted = false;
        if (!context || !context.userId) {
            return { score: baseAffinity, isPartnerBoosted: false };
        }
        const farmerId = post.farmerId || (post.farmer ? post.farmer.id : undefined);
        // Mutual AgroPartner Boost (+2.5x)
        if (farmerId && context.partnerFarmerIds && context.partnerFarmerIds.includes(farmerId)) {
            baseAffinity *= feed_engine_config_1.FeedEngineConfig.partnerAffinityMultiplier;
            isPartnerBoosted = true;
        }
        // High-credit verified farmer trust boost (Section 4.1)
        if (post.farmerCreditTier === 'GOLD' || post.farmer?.creditTier === 'GOLD') {
            baseAffinity += 0.3;
        }
        else if (post.farmerCreditTier === 'SILVER' || post.farmer?.creditTier === 'SILVER') {
            baseAffinity += 0.15;
        }
        return {
            score: Number(baseAffinity.toFixed(3)),
            isPartnerBoosted,
        };
    }
}
exports.AffinitySignal = AffinitySignal;
