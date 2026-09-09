"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProximitySignal = void 0;
const feed_engine_config_1 = require("../config/feed-engine.config");
class ProximitySignal {
    /**
     * Calculates spatial distance between buyer coordinates and harvest farm via Haversine equation.
     * Returns a normalized proximity score in (0, 1].
     */
    static calculate(post, context) {
        if (!context ||
            context.deliveryLatitude == null ||
            context.deliveryLongitude == null ||
            post.farmLatitude == null ||
            post.farmLongitude == null) {
            // Neutral score when location is not available
            return { score: 0.5 };
        }
        const distanceKm = this.haversineDistance(context.deliveryLatitude, context.deliveryLongitude, post.farmLatitude, post.farmLongitude);
        // Hyperbolic proximity curve: 1.0 when distance is 0 km, 0.5 at 50 km, asymptotically approaching 0
        const score = 1 / (1 + distanceKm / feed_engine_config_1.FeedEngineConfig.proximityHalfLifeKm);
        return {
            score: Number(score.toFixed(3)),
            distanceKm: Number(distanceKm.toFixed(1)),
        };
    }
    /**
     * Haversine formula implementation in kilometers
     */
    static haversineDistance(lat1, lon1, lat2, lon2) {
        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRadians(lat1)) *
                Math.cos(this.toRadians(lat2)) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return this.EARTH_RADIUS_KM * c;
    }
    static toRadians(degrees) {
        return (degrees * Math.PI) / 180;
    }
}
exports.ProximitySignal = ProximitySignal;
/**
 * Earth's mean radius in kilometers
 */
ProximitySignal.EARTH_RADIUS_KM = 6371;
