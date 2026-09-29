import prisma from '../../core/database/prisma';

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: string;
}

/**
 * Dispatches a push notification to an ExpoPushToken via Expo's HTTP push gateway.
 */
export const sendExpoPushNotification = async (
  expoPushToken: string,
  payload: PushPayload
): Promise<boolean> => {
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
  } catch (error) {
    console.error(`[PUSH ERROR] Failed to send push notification:`, error);
    return false;
  }
};

/**
 * Dispatches a push notification directly to a user by userId.
 */
export const sendPushToUser = async (userId: string, payload: PushPayload): Promise<boolean> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, expoPushToken: true },
    });

    if (!user || !user.expoPushToken) {
      console.log(`[PUSH] User ${userId} has no registered push token.`);
      return false;
    }

    return await sendExpoPushNotification(user.expoPushToken, payload);
  } catch (err) {
    console.error(`[PUSH ERROR] Error looking up user ${userId} for push notification:`, err);
    return false;
  }
};
