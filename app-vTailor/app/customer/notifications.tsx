import { Ionicons } from '@expo/vector-icons';
import { SURFACE_MUTED, TEXT_DARK, UI } from '@/constants/ui';
import AppBackButton from '@/components/AppBackButton';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/contexts/AuthContext';
import {
  type AppNotification,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/services/notificationsApi';

// ── Notification type → icon / colour ─────────────────────────────────────────

function notifIcon(type: string): React.ComponentProps<typeof Ionicons>['name'] {
  switch (type) {
    case 'chat_message':         return 'chatbubble-outline';
    case 'chat_started':         return 'chatbubbles-outline';
    case 'wallet_pending':       return 'time-outline';
    case 'wallet_confirmed':     return 'card-outline';
    case 'wallet_failed':        return 'close-circle-outline';
    case 'order_requested':      return 'receipt-outline';
    case 'order_accepted':       return 'checkmark-circle-outline';
    case 'order_declined':       return 'close-circle-outline';
    case 'order_price_proposed': return 'pricetag-outline';
    case 'order_confirmed':      return 'checkmark-done-circle-outline';
    default:                     return 'notifications-outline';
  }
}

function notifColor(type: string): string {
  switch (type) {
    case 'chat_message':         return '#3b82f6';
    case 'chat_started':         return '#8b5cf6';
    case 'wallet_pending':       return '#f59e0b';
    case 'wallet_confirmed':     return '#059669';
    case 'wallet_failed':        return '#ef4444';
    case 'order_requested':      return '#f97316';
    case 'order_accepted':       return '#059669';
    case 'order_declined':       return '#ef4444';
    case 'order_price_proposed': return '#c2410c';
    case 'order_confirmed':      return '#059669';
    default:                     return '#ec4899';
  }
}

function relativeTime(iso: string): string {
  try {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60)   return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400)return `${Math.floor(diff / 3600)} hr ago`;
    return `${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) === 1 ? '' : 's'} ago`;
  } catch {
    return '';
  }
}

// ── Demo notifications (shown when no real ones exist) ────────────────────────

const DEMO_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'demo-1', user_id: '', type: 'order_price_proposed', is_read: false,
    title: 'Tailor Proposed a Price',
    message: 'Aliya Formal Dresses wants Rs. 9,500 for your Long Frock (budget: Rs. 8,500). Approve or Reject?',
    data: {}, created_at: new Date(Date.now() - 1 * 3600_000).toISOString(),
  },
  {
    id: 'demo-1b', user_id: '', type: 'order_accepted', is_read: true,
    title: 'Order Accepted!',
    message: 'Zainab Couture accepted your Shalwar Kameez request at Rs. 6,000. Delivery: 7 days.',
    data: {}, created_at: new Date(Date.now() - 3 * 3600_000).toISOString(),
  },
  {
    id: 'demo-2', user_id: '', type: 'wallet_confirmed', is_read: true,
    title: 'Payment Confirmed',
    message: 'Rs. 8,500 wallet top-up via JazzCash has been confirmed.',
    data: {}, created_at: new Date(Date.now() - 24 * 3600_000).toISOString(),
  },
  {
    id: 'demo-3', user_id: '', type: 'chat_started', is_read: true,
    title: 'New Message',
    message: 'Zainab Bridal Couture started a conversation with you.',
    data: {}, created_at: new Date(Date.now() - 48 * 3600_000).toISOString(),
  },
];

// ── Component ──────────────────────────────────────────────────────────────────

const CustomerNotifications = () => {
  const router = useRouter();
  const { token } = useAuth();
  const tint    = useThemeColor({}, 'tint');
  const muted   = useThemeColor({}, 'muted');
  const iconBg  = useThemeColor({}, 'iconBg');

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Race the API call against an 8-second timeout so we never spin > 8s
      const data = await Promise.race([
        getNotifications(token, 50),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 8000)
        ),
      ]);
      setNotifications(data);
    } catch {
      setError('Could not load notifications. Showing sample data below.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const handleTap = async (notif: AppNotification, isDemo = false) => {
    if (!isDemo && token && !notif.is_read) {
      await markNotificationRead(token, notif.id).catch(() => {});
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
      );
    }
    const data = notif.data as Record<string, string>;

    // Order price proposal → navigate to orders so customer can Approve/Reject
    if (
      notif.type === 'order_price_proposed' ||
      notif.type === 'order_accepted' ||
      notif.type === 'order_declined'
    ) {
      (router as any).push('/customer/orders');
      return;
    }

    // Chat notifications → go to the specific conversation
    if ((notif.type === 'chat_message' || notif.type === 'chat_started') && data.channelId) {
      router.push({
        pathname: '/customer/chat-conversation',
        params: {
          stream_channel_id: data.channelId,
          stream_cid: data.channelCid ?? '',
          id: data.channelId,
          otherUserId: data.otherUserId ?? '',
          otherUserName: data.otherUserName ?? '',
        },
      });
    }
  };

  const handleMarkAllRead = async () => {
    if (!token) return;
    await markAllNotificationsRead(token);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <AppBackButton onPress={() => (router as any).back()} />
        <View style={{ flex: 1 }}>
          <ThemedText style={styles.title}>Notifications</ThemedText>
          <ThemedText style={[styles.subtitle, { color: muted }]}>
            Chat, delivery, and wallet updates
          </ThemedText>
        </View>
        {unreadCount > 0 && (
          <Pressable onPress={handleMarkAllRead} style={styles.markAllBtn}>
            <ThemedText style={[styles.markAllText, { color: tint }]}>Mark all read</ThemedText>
          </Pressable>
        )}
      </ThemedView>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={tint} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {/* Error banner — non-blocking, shows above content */}
          {error && (
            <View style={styles.errorBanner}>
              <Ionicons name="cloud-offline-outline" size={16} color="#b45309" />
              <ThemedText style={styles.errorBannerText}>{error}</ThemedText>
              <Pressable onPress={load} style={styles.retryInline}>
                <ThemedText style={[styles.retryInlineText, { color: tint }]}>Retry</ThemedText>
              </Pressable>
            </View>
          )}

          {/* Show real notifications; fall back to demo ones when empty */}
          {(notifications.length > 0 ? notifications : DEMO_NOTIFICATIONS).map((notif) => {
            const color = notifColor(notif.type);
            const isReal = notifications.length > 0;
            const isOrderType = notif.type === 'order_price_proposed' || notif.type === 'order_accepted' || notif.type === 'order_declined';
            const isTappable  = isReal || isOrderType;
            return (
              <Pressable
                key={notif.id}
                onPress={() => isTappable ? handleTap(notif, !isReal) : undefined}
                style={({ pressed }) => [{ opacity: pressed && isTappable ? 0.75 : 1 }]}
              >
                <ThemedView style={[
                  styles.card,
                  !notif.is_read && styles.cardUnread,
                  isOrderType && { borderLeftWidth: 3, borderLeftColor: color },
                ]}>
                  <ThemedView style={[styles.iconBox, { backgroundColor: color + '22' }]}>
                    <Ionicons name={notifIcon(notif.type)} size={21} color={color} />
                  </ThemedView>
                  <ThemedView style={styles.content}>
                    <View style={styles.titleRow}>
                      <ThemedText style={styles.nTitle}>{notif.title}</ThemedText>
                      {!notif.is_read && <View style={[styles.dot, { backgroundColor: color }]} />}
                    </View>
                    <ThemedText style={[styles.nMessage, { color: muted }]}>{notif.message}</ThemedText>
                    <View style={styles.nFooter}>
                      <ThemedText style={[styles.nTime, { color: muted }]}>{relativeTime(notif.created_at)}</ThemedText>
                      {isOrderType && (
                        <View style={[styles.viewHint, { backgroundColor: color + '18' }]}>
                          <ThemedText style={[styles.viewHintText, { color }]}>View Order</ThemedText>
                          <Ionicons name="chevron-forward" size={12} color={color} />
                        </View>
                      )}
                    </View>
                  </ThemedView>
                </ThemedView>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: SURFACE_MUTED },
  header:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 16, paddingTop: 10 },
  title:      { fontSize: 23, fontWeight: '900', color: TEXT_DARK },
  subtitle:   { fontSize: 12, marginTop: 3, fontWeight: '600' },
  markAllBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  markAllText:{ fontSize: 12, fontWeight: '700' },
  list:       { padding: 16, paddingBottom: 120 },
  center:     { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  errorBanner:{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fef3c7', borderRadius: 10, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: '#fcd34d' },
  errorBannerText: { flex: 1, fontSize: 12, color: '#92400e', fontWeight: '600' },
  retryInline:{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#fcd34d' },
  retryInlineText: { fontSize: 12, fontWeight: '700' },
  card: {
    flexDirection: 'row',
    padding: 14,
    backgroundColor: '#fff',
    borderRadius: UI.radius.lg,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#fbcfe8',
    ...UI.softShadow,
  },
  cardUnread: { borderColor: '#ec4899', backgroundColor: '#fff9fc' },
  iconBox:    { width: 46, height: 46, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  content:    { flex: 1 },
  titleRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  dot:        { width: 8, height: 8, borderRadius: 4 },
  nTitle:     { fontSize: 14, fontWeight: '800', marginBottom: 4, color: TEXT_DARK },
  nMessage:   { fontSize: 13, color: '#6b7280', lineHeight: 18 },
  nTime:      { fontSize: 11, color: '#9ca3af', marginTop: 4 },
  nFooter:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  viewHint:   { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  viewHintText: { fontSize: 11, fontWeight: '700' },
  empty:      { alignItems: 'center', paddingTop: 60 },
  emptyIcon:  { width: 66, height: 66, borderRadius: 24, backgroundColor: '#fdf2f8', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '600' },
  emptyDesc:  { fontSize: 13, color: '#6b7280', marginTop: 6 },
});

export default CustomerNotifications;
