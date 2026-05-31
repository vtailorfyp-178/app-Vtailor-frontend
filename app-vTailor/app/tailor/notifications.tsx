import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import { ROLE_COLORS, SURFACE_MUTED, TEXT_DARK, UI } from '@/constants/ui';
import { useAuth } from '@/contexts/AuthContext';
import {
  type AppNotification,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/services/notificationsApi';

// ── Type helpers ──────────────────────────────────────────────────────────────

function typeIcon(type: string): React.ComponentProps<typeof Ionicons>['name'] {
  switch (type) {
    case 'chat_message':    return 'chatbubble-outline';
    case 'chat_started':    return 'mail-unread-outline';
    case 'wallet_pending':  return 'time-outline';
    case 'wallet_confirmed':return 'wallet-outline';
    case 'wallet_failed':   return 'warning-outline';
    case 'order_requested': return 'receipt-outline';
    case 'order_accepted':  return 'checkmark-circle-outline';
    case 'order_declined':  return 'close-circle-outline';
    default:                return 'notifications-outline';
  }
}

function typeColor(type: string): string {
  switch (type) {
    case 'wallet_confirmed':return '#059669';
    case 'wallet_failed':   return '#d97706';
    case 'wallet_pending':  return '#7c3aed';
    case 'chat_message':    return '#3b82f6';
    case 'chat_started':    return '#8b5cf6';
    case 'order_requested': return '#f97316';
    case 'order_accepted':  return '#059669';
    case 'order_declined':  return '#ef4444';
    default:                return ROLE_COLORS.tailor.primary;
  }
}

// ── Demo notifications ────────────────────────────────────────────────────────

const DEMO_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'demo-t1', user_id: '', type: 'order_requested', is_read: false,
    title: 'New Order Request',
    message: 'Fatima Khan sent a request for "Long Frock". Budget: Rs. 8,500.',
    data: {}, created_at: new Date(Date.now() - 30 * 60_000).toISOString(),
  },
  {
    id: 'demo-t2', user_id: '', type: 'wallet_confirmed', is_read: true,
    title: 'Payment Received',
    message: 'Rs. 12,000 added to your wallet from Zara Khan.',
    data: {}, created_at: new Date(Date.now() - 5 * 3600_000).toISOString(),
  },
  {
    id: 'demo-t3', user_id: '', type: 'chat_message', is_read: true,
    title: 'Aisha Ahmed',
    message: 'Can you show me a progress update on the kameez?',
    data: {}, created_at: new Date(Date.now() - 24 * 3600_000).toISOString(),
  },
];

// ── Component ──────────────────────────────────────────────────────────────────

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

// ── Component ──────────────────────────────────────────────────────────────────

export default function TailorNotifications() {
  const router  = useRouter();
  const { token } = useAuth();
  const bg    = useThemeColor({}, 'background');
  const card  = useThemeColor({}, 'card');
  const muted = useThemeColor({}, 'muted');
  const tint  = useThemeColor({}, 'tint');

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

  const handleTap = async (notif: AppNotification) => {
    if (!token) return;
    if (!notif.is_read) {
      await markNotificationRead(token, notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
      );
    }
    const data = notif.data as Record<string, string>;
    if ((notif.type === 'chat_message' || notif.type === 'chat_started') && data.channelId) {
      router.push({
        pathname: '/tailor/chat/[id]' as any,
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
    <ProtectedRoute requiredRole="tailor">
      <View style={[styles.container, { backgroundColor: bg }]}>
        <View style={[styles.header, { borderBottomColor: '#eee' }]}>
          <Pressable onPress={() => (router as any).back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={TEXT_DARK} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.title}>Notifications</ThemedText>
            <ThemedText style={[styles.subtitle, { color: muted }]}>
              Chat and wallet alerts
            </ThemedText>
          </View>
          {unreadCount > 0 && (
            <Pressable onPress={handleMarkAllRead} style={styles.markAllBtn}>
              <ThemedText style={[styles.markAllText, { color: tint }]}>Mark all read</ThemedText>
            </Pressable>
          )}
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={tint} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.list}>
            {/* Non-blocking error banner */}
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
            {(notifications.length > 0 ? notifications : DEMO_NOTIFICATIONS).map((n) => {
              const isReal = notifications.length > 0;
              return (
                <Pressable key={n.id} onPress={() => isReal ? handleTap(n) : undefined}>
                  <View style={[
                    styles.card,
                    { backgroundColor: card, borderColor: n.is_read ? '#eaeaea' : '#c4b5fd' },
                    !n.is_read && styles.cardUnread,
                  ]}>
                    <View style={styles.row}>
                      <View style={[styles.iconBox, { backgroundColor: `${typeColor(n.type)}22` }]}>
                        <Ionicons name={typeIcon(n.type)} size={21} color={typeColor(n.type)} />
                      </View>
                      <View style={styles.content}>
                        <View style={styles.titleRow}>
                          <ThemedText style={styles.nTitle}>{n.title}</ThemedText>
                          {!n.is_read && <View style={[styles.dot, { backgroundColor: typeColor(n.type) }]} />}
                        </View>
                        <ThemedText style={[styles.nMessage, { color: muted }]}>{n.message}</ThemedText>
                        <ThemedText style={[styles.nTime, { color: muted }]}>{relativeTime(n.created_at)}</ThemedText>
                      </View>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: SURFACE_MUTED },
  header:     { paddingTop: 10, paddingHorizontal: 16, paddingBottom: 16, flexDirection: 'row', alignItems: 'center' },
  backButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginRight: 10, ...UI.softShadow },
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
  card:       { padding: 14, borderRadius: UI.radius.lg, borderWidth: 1, marginBottom: 12, ...UI.softShadow },
  cardUnread: { backgroundColor: '#faf5ff' },
  row:        { flexDirection: 'row', alignItems: 'flex-start' },
  iconBox:    { width: 46, height: 46, borderRadius: 16, backgroundColor: '#fff5f7', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  content:    { flex: 1 },
  titleRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  dot:        { width: 8, height: 8, borderRadius: 4 },
  nTitle:     { fontSize: 14, fontWeight: '800', marginBottom: 4, color: TEXT_DARK },
  nMessage:   { fontSize: 13, lineHeight: 18 },
  nTime:      { fontSize: 11, marginTop: 6 },
  emptyDesc:  { fontSize: 13 },
});
