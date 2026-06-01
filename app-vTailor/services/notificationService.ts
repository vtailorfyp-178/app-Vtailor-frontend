/**
 * notificationService.ts
 * ----------------------
 * Handles local notifications for the vTailor app.
 *
 * NOTE: expo-notifications is NOT imported in Expo Go (SDK 53+ blocks push on import).
 *       Use a development build for remote push; Expo Go skips notifications entirely.
 */

import { Platform } from 'react-native';
import { router } from 'expo-router';
import Constants from 'expo-constants';

type NotificationsModule = typeof import('expo-notifications');

function isExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}

function notificationsSupported(): boolean {
  return Platform.OS !== 'web' && !isExpoGo();
}

let notificationsModule: NotificationsModule | null | undefined;
let handlerInitialized = false;

async function loadNotifications(): Promise<NotificationsModule | null> {
  if (!notificationsSupported()) return null;
  if (notificationsModule !== undefined) return notificationsModule;

  try {
    const mod = await import('expo-notifications');
    notificationsModule = mod;

    if (!handlerInitialized) {
      handlerInitialized = true;
      try {
        mod.setNotificationHandler({
          handleNotification: async (): Promise<import('expo-notifications').NotificationBehavior> => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
            priority: mod.AndroidNotificationPriority.MAX,
          }),
        });
      } catch {
        // Ignore on unsupported platforms
      }
    }

    return mod;
  } catch (err) {
    console.warn('[Notifications] module unavailable:', err);
    notificationsModule = null;
    return null;
  }
}

// ── Active-channel tracker ────────────────────────────────────────────────────

let _currentOpenChannelId: string | null = null;

/** Call when the user opens a chat screen, pass null when they leave. */
export function setCurrentOpenChannel(channelId: string | null): void {
  _currentOpenChannelId = channelId;
}

// ── Permissions ───────────────────────────────────────────────────────────────

export async function requestNotificationPermissions(): Promise<boolean> {
  const Notifications = await loadNotifications();
  if (!Notifications) return false;

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
    console.warn('[Notifications] requestPermissions failed:', err);
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
  if (_currentOpenChannelId && _currentOpenChannelId === opts.channelId) return;

  const Notifications = await loadNotifications();
  if (!Notifications) return;

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
      trigger: null,
    });
  } catch (err) {
    console.warn('[Notifications] scheduleMessageNotification failed:', err);
  }
}

// ── Tap handler ───────────────────────────────────────────────────────────────

let _tapHandlerSubscription: { remove: () => void } | null = null;

export function setupNotificationTapHandler(): () => void {
  if (!notificationsSupported()) return () => {};

  void (async () => {
    const Notifications = await loadNotifications();
    if (!Notifications) return;

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
            const role = data.role || 'customer';
            const pathname =
              role === 'tailor'
                ? '/tailor/chat/[id]'
                : '/customer/chat-conversation';
            router.push({
              pathname: pathname as '/tailor/chat/[id]' | '/customer/chat-conversation',
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
      console.warn('[Notifications] setupNotificationTapHandler failed:', err);
    }
  })();

  return () => {
    _tapHandlerSubscription?.remove();
    _tapHandlerSubscription = null;
  };
}

// ── Clear badge ───────────────────────────────────────────────────────────────

export async function clearBadgeCount(): Promise<void> {
  const Notifications = await loadNotifications();
  if (!Notifications) return;

  try {
    await Notifications.setBadgeCountAsync(0);
  } catch {
    // Ignore — not supported on all platforms
  }
}
