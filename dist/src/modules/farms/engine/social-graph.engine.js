"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocialGraphEngine = void 0;
const prisma_1 = __importDefault(require("../../../core/database/prisma"));
class SocialGraphEngine {
    /**
     * Evaluates bidirectional relationship IsAgroPartner(u, v) <=> (u, v) in E and (v, u) in E
     */
    static async evaluatePartnerStatus(userId, targetUserId) {
        if (userId === targetUserId) {
            return {
                userId,
                targetUserId,
                isMutualPartner: true,
                userFollowsTarget: true,
                targetFollowsUser: true,
                privileges: this.resolvePrivileges(true),
            };
        }
        try {
            const [userFollowsTarget, targetFollowsUser] = await Promise.all([
                prisma_1.default.follow.findUnique({
                    where: {
                        followerId_followingId: { followerId: userId, followingId: targetUserId },
                    },
                }),
                prisma_1.default.follow.findUnique({
                    where: {
                        followerId_followingId: { followerId: targetUserId, followingId: userId },
                    },
                }),
            ]);
            const isMutualPartner = Boolean(userFollowsTarget && targetFollowsUser);
            return {
                userId,
                targetUserId,
                isMutualPartner,
                userFollowsTarget: Boolean(userFollowsTarget),
                targetFollowsUser: Boolean(targetFollowsUser),
                privileges: this.resolvePrivileges(isMutualPartner),
            };
        }
        catch (e) {
            // In offline or testing mode
            return {
                userId,
                targetUserId,
                isMutualPartner: false,
                userFollowsTarget: false,
                targetFollowsUser: false,
                privileges: this.resolvePrivileges(false),
            };
        }
    }
    /**
     * Retrieves all user IDs who are Mutual AgroPartners with the specified user
     */
    static async getMutualPartnerUserIds(userId) {
        try {
            // Find bidirectional follows: user follows X and X follows user
            const following = await prisma_1.default.follow.findMany({
                where: { followerId: userId },
                select: { followingId: true },
            });
            const followingIds = following.map((f) => f.followingId);
            if (followingIds.length === 0)
                return [];
            const mutual = await prisma_1.default.follow.findMany({
                where: {
                    followerId: { in: followingIds },
                    followingId: userId,
                },
                select: { followerId: true },
            });
            return mutual.map((m) => m.followerId);
        }
        catch (e) {
            return [];
        }
    }
    /**
     * Unlocks trade privileges based on mutual partnership
     */
    static resolvePrivileges(isMutualPartner) {
        if (isMutualPartner) {
            return {
                wholesaleDiscountEligible: true,
                recommendedDiscountPct: this.DEFAULT_WHOLESALE_DISCOUNT_PCT,
                canDispatchOfferCards: true,
                storyStreamPriority: true,
                activePresenceVisible: true,
            };
        }
        return {
            wholesaleDiscountEligible: false,
            recommendedDiscountPct: 0.0,
            canDispatchOfferCards: false,
            storyStreamPriority: false,
            activePresenceVisible: false,
        };
    }
    /**
     * Calculates wholesale discounted price for a harvest yield
     */
    static calculatePartnerPrice(retailPrice, isMutualPartner, customDiscountPct) {
        if (!isMutualPartner) {
            return { price: retailPrice, discountApplied: 0, isDiscounted: false };
        }
        const discountPct = customDiscountPct ?? this.DEFAULT_WHOLESALE_DISCOUNT_PCT;
        const discountAmount = Math.round(retailPrice * discountPct * 100) / 100;
        const partnerPrice = Math.max(0, retailPrice - discountAmount);
        return {
            price: partnerPrice,
            discountApplied: discountAmount,
            isDiscounted: true,
        };
    }
}
exports.SocialGraphEngine = SocialGraphEngine;
SocialGraphEngine.DEFAULT_WHOLESALE_DISCOUNT_PCT = 0.20; // 20% standard wholesale partner discount
