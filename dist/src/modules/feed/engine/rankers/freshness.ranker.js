"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FreshnessRanker = void 0;
const feed_engine_config_1 = require("../config/feed-engine.config");
class FreshnessRanker {
    /**
     * Computes exponential time decay: e^(-lambda * t_hours)
     * Recent morning harvest posts receive values close to 1.0, decaying smoothly over days.
     */
    static calculate(createdAt) {
        const ageMillis = Math.max(0, Date.now() - new Date(createdAt).getTime());
        const ageHours = ageMillis / (1000 * 60 * 60);
        const decay = Math.exp(-feed_engine_config_1.FeedEngineConfig.lambda * ageHours);
        return Number(Math.max(0.01, decay).toFixed(4));
    }
}
exports.FreshnessRanker = FreshnessRanker;
