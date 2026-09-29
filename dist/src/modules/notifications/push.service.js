"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPushToUser = exports.sendExpoPushNotification = void 0;
const prisma_1 = __importDefault(require("../../core/database/prisma"));
/**
 * Dispatches a push notification to an ExpoPushToken via Expo's HTTP push gateway.
 */
const sendExpoPushNotification = async (expoPushToken, payload) => {
    if (!expoPushToken || (!expoPushToken.startsWith('ExponentPushToken') && !expoPushToken.startsWith('ExpoPushToken'))) {
        console.log(`[PUSH] Skipping invalid push token: ${expoPushToken}`);
        return false;
    }
    try {
        const response = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Accept-Encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                to: expoPushToken,
                sound: payload.sound || 'agrom_chime.wav',
                title: payload.title,
                body: payload.body,
                data: payload.data || {},
                priority: 'high',
                channelId: payload.data?.channelId || 'agromarket_alerts',
            }),
        });
        const result = await response.json();
        console.log(`[PUSH] Successfully dispatched push notification:`, result);
        return true;
    }
    catch (error) {
        console.error(`[PUSH ERROR] Failed to send push notification:`, error);
        return false;
    }
};
exports.sendExpoPushNotification = sendExpoPushNotification;
/**
 * Dispatches a push notification directly to a user by userId.
 */
const sendPushToUser = async (userId, payload) => {
    try {
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, expoPushToken: true },
        });
        if (!user || !user.expoPushToken) {
            console.log(`[PUSH] User ${userId} has no registered push token.`);
            return false;
        }
        return await (0, exports.sendExpoPushNotification)(user.expoPushToken, payload);
    }
    catch (err) {
        console.error(`[PUSH ERROR] Error looking up user ${userId} for push notification:`, err);
        return false;
    }
};
exports.sendPushToUser = sendPushToUser;
