"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeedRankingEngine = void 0;
const feed_engine_config_1 = require("./config/feed-engine.config");
const affinity_signal_1 = require("./signals/affinity.signal");
const engagement_signal_1 = require("./signals/engagement.signal");
const proximity_signal_1 = require("./signals/proximity.signal");
const freshness_ranker_1 = require("./rankers/freshness.ranker");
class FeedRankingEngine {
    /**
     * Scores and ranks an array of candidate posts according to the TikTok-model formulation:
     * PostRank(u, p) = (alpha * Affinity + beta * EngagementRate + gamma * GeoProximity) * FreshnessDecay
     */
    static rankPosts(posts, context) {
        const scoredPosts = posts.map((post) => {
            // 1. Affinity
            const { score: affinityScore, isPartnerBoosted } = affinity_signal_1.AffinitySignal.calculate(post, context);
            // 2. Engagement Rate
            const engagementRate = engagement_signal_1.EngagementSignal.calculate(post);
            // 3. Geo-Proximity
            const { score: geoProximityScore } = proximity_signal_1.ProximitySignal.calculate(post, context);
            // 4. Freshness Decay
            const freshnessDecay = freshness_ranker_1.FreshnessRanker.calculate(post.createdAt);
            // Master Formula
            const weightedSum = feed_engine_config_1.FeedEngineConfig.alpha * affinityScore +
                feed_engine_config_1.FeedEngineConfig.beta * engagementRate +
                feed_engine_config_1.FeedEngineConfig.gamma * geoProximityScore;
            const totalRankScore = Number((weightedSum * freshnessDecay).toFixed(4));
            return {
                postId: post.id,
                totalRankScore,
                affinityScore,
                engagementRate,
                geoProximityScore,
                freshnessDecay,
                isPartnerBoosted,
                post,
            };
        });
        // Sort descending by totalRankScore
        scoredPosts.sort((a, b) => b.totalRankScore - a.totalRankScore);
        return scoredPosts;
    }
    /**
     * Pure single-post evaluation for debugging or inspection
     */
    static scoreSinglePost(post, context) {
        return this.rankPosts([post], context)[0];
    }
}
exports.FeedRankingEngine = FeedRankingEngine;
