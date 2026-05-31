/**
 * notificationService.ts
 * ----------------------
 * Handles local notifications for the vTailor app.
 *
 * NOTE: Remote push notifications (FCM/APNs) require a development build.
 *       In Expo Go only LOCAL notifications are used; push tokens are skipped.
 *
 * Usage flow:
 *  1. Call requestNotificationPermissions() once on app start.
 *  2. Call setupNotificationTapHandler() to handle user tapping a notification.
 *  3. streamChatService calls scheduleMessageNotification() on message.new events.
 *  4. Call setCurrentOpenChannel(channelId | null) when entering/leaving a chat screen.
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import Constants from 'expo-constants';

// ── Detect Expo Go vs dev build ───────────────────────────────────────────────

function isExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}

// ── Foreground notification handler ──────────────────────────────────────────
// Must be set before any notification API call, but only when supported

try {
  Notifications.setNotificationHandler({
    handleNotification: async (): Promise<Notifications.NotificationBehavior> => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
      priority: Notifications.AndroidNotificationPriority.MAX,
    }),
  });
} catch {
  // Silently skip on platforms where this is not supported (web)
}

// ── Active-channel tracker ────────────────────────────────────────────────────

let _currentOpenChannelId: string | null = null;

/** Call when the user opens a chat screen, pass null when they leave. */
export function setCurrentOpenChannel(channelId: string | null): void {
  _currentOpenChannelId = channelId;
}

// ── Permissions ───────────────────────────────────────────────────────────────

export async function requestNotificationPermissions(): Promise<boolean> {
  // Web: notifications not supported in Expo context
  if (Platform.OS === 'web') return false;

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('vtailor-messages', {
        name: 'Messages',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 200, 100, 200],
        lightColor: '#E91E8C',
        sound: 'default',
      });
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;

    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch (err) {
    console.warn('[Notifications] requestPermissions failed (Expo Go limitation):', err);
    return false;
  }
}

// ── Schedule a local notification ────────────────────────────────────────────

export async function scheduleMessageNotification(opts: {
  senderName: string;
  messageText: string;
  channelId: string;
  channelCid: string;
  otherUserId: string;
  otherUserName: string;
  role?: string;
}): Promise<void> {
  // Suppress if the user is already viewing this channel
  if (_currentOpenChannelId && _currentOpenChannelId === opts.channelId) return;
  // Skip on web — local notifications are not supported
  if (Platform.OS === 'web') return;

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: opts.senderName,
        body: opts.messageText || '📷 Sent an image',
        sound: true,
        badge: 1,
        data: {
          channelId: opts.channelId,
          channelCid: opts.channelCid,
          otherUserId: opts.otherUserId,
          otherUserName: opts.otherUserName,
          senderName: opts.senderName,
          screen: 'chat',
          role: opts.role ?? 'customer',
        } as Record<string, string>,
      },
      trigger: null, // fire immediately
    });
  } catch (err) {
    console.warn('[Notifications] scheduleMessageNotification failed:', err);
  }
}

// ── Tap handler ───────────────────────────────────────────────────────────────

let _tapHandlerSubscription: Notifications.Subscription | null = null;

export function setupNotificationTapHandler(): () => void {
  if (Platform.OS === 'web') return () => {};

  try {
    if (_tapHandlerSubscription) {
      _tapHandlerSubscription.remove();
      _tapHandlerSubscription = null;
    }

    _tapHandlerSubscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as Record<string, string>;
        if (data?.screen !== 'chat') return;

        try {
          // Support both customer and tailor roles from the notification data
          const role = data.role || 'customer';
          const pathname =
            role === 'tailor'
              ? '/tailor/chat/[id]'
              : '/customer/chat-conversation';
          router.push({
            pathname: pathname as any,
            params: {
              stream_channel_id: data.channelId ?? '',
              stream_cid: data.channelCid ?? '',
              id: data.channelId ?? '',
              otherUserId: data.otherUserId ?? '',
              otherUserName: data.otherUserName ?? data.senderName ?? 'User',
            },
          });
        } catch (err) {
          console.warn('[Notifications] tap navigation failed:', err);
        }
      }
    );
  } catch (err) {
    console.warn('[Notifications] setupNotificationTapHandler failed (Expo Go limitation):', err);
  }

  return () => {
    _tapHandlerSubscription?.remove();
    _tapHandlerSubscription = null;
  };
}

// ── Clear badge ───────────────────────────────────────────────────────────────

export async function clearBadgeCount(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.setBadgeCountAsync(0);
  } catch {
    // Ignore — not supported on all platforms
  }
}
