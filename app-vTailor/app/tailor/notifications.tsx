import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import { ROLE_COLORS, SURFACE_MUTED, TEXT_DARK, UI } from '@/constants/ui';

const notifications = [
  { id: 1, type: 'new_request', title: 'New Customer Request', message: 'Fatima Khan sent a request for Long Frock', time: '2 min ago', action: true },
  { id: 2, type: 'new_order', title: 'New Order Request', message: "Ahmad Khan wants to order a Shalwar Kameez", time: '10 min ago', action: true },
  { id: 3, type: 'deadline', title: 'Delivery Reminder', message: "2 days left for Ali Hassan's Long Frock delivery", time: '1 hour ago' },
  { id: 4, type: 'update', title: 'Update Reminder', message: 'Time to share stitching progress with Zara Khan', time: '3 hours ago' },
  { id: 5, type: 'wallet', title: 'Payment Received', message: 'Rs. 12,000 added to your wallet from Zara Khan', time: '5 hours ago' },
  { id: 6, type: 'penalty', title: 'Penalty Deducted', message: 'Rs. 425 deducted for late delivery (5%)', time: '1 day ago' },
  { id: 7, type: 'cancelled', title: 'Order Cancelled', message: 'Customer cancelled the Casual Kurta order', time: '2 days ago' },
];

const typeIcon = (type: string) => {
  switch (type) {
    case 'new_request':
      return 'mail-unread-outline' as const;
    case 'new_order':
      return 'receipt-outline' as const;
    case 'deadline':
      return 'alarm-outline' as const;
    case 'update':
      return 'cube-outline' as const;
    case 'wallet':
      return 'wallet-outline' as const;
    case 'penalty':
      return 'warning-outline' as const;
    case 'cancelled':
      return 'close-circle-outline' as const;
    default:
      return 'notifications-outline' as const;
  }
};

const typeColor = (type: string) => {
  switch (type) {
    case 'wallet':
      return '#059669';
    case 'penalty':
      return '#d97706';
    case 'cancelled':
      return '#dc2626';
    case 'deadline':
      return '#7c3aed';
    default:
      return ROLE_COLORS.tailor.primary;
  }
};

export default function TailorNotifications() {
  const router = useRouter();
  const bg = useThemeColor({}, 'background');
  const card = useThemeColor({}, 'card');
  const muted = useThemeColor({}, 'muted');

  const handleViewRequests = () => {
    (router as any).push('/tailor/requests');
  };

  return (
    <ProtectedRoute requiredRole="tailor">
      <View style={[styles.container, { backgroundColor: bg }]}> 
        <View style={[styles.header, { borderBottomColor: '#eee' }]}>
          <Pressable onPress={() => (router as any).back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={TEXT_DARK} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.title}>Notifications</ThemedText>
            <ThemedText style={[styles.subtitle, { color: muted }]}>Customer requests, orders, and wallet alerts</ThemedText>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.list}>
          {notifications.map((n) => (
            <View key={n.id} style={[styles.card, { backgroundColor: card, borderColor: '#eaeaea' }]}>
              <View style={styles.row}>
                <View style={[styles.iconBox, { backgroundColor: `${typeColor(n.type)}22` }]}>
                  <Ionicons name={typeIcon(n.type)} size={21} color={typeColor(n.type)} />
                </View>
                <View style={styles.content}>
                  <View style={styles.titleRow}>
                    <Text style={styles.nTitle}>{n.title}</Text>
                    <View style={[styles.dot, { backgroundColor: typeColor(n.type) }]} />
                  </View>
                  <Text style={[styles.nMessage, { color: muted }]}>{n.message}</Text>
                  <Text style={[styles.nTime, { color: muted }]}>{n.time}</Text>
                </View>
              </View>

              {n.action && (
                <View style={styles.actionsRow}>
                  <Pressable style={[styles.actionBtn, styles.acceptBtn]} onPress={handleViewRequests}>
                    <Text style={styles.actionText}>View Request</Text>
                  </Pressable>
                </View>
              )}
            </View>
          ))}

          {notifications.length === 0 && (
            <View style={styles.emptyWrap}>
              <View style={[styles.emptyIcon, { backgroundColor: '#f3f4f6' }]}>
                <Ionicons name="notifications-outline" size={32} color={ROLE_COLORS.tailor.primaryDark} />
              </View>
              <Text style={styles.emptyTitle}>No Notifications</Text>
              <Text style={[styles.emptyDesc, { color: muted }]}>You're all caught up!</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SURFACE_MUTED },
  header: { paddingTop: 10, paddingHorizontal: 16, paddingBottom: 16, flexDirection: 'row', alignItems: 'center' },
  backButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginRight: 10, ...UI.softShadow },
  title: { fontSize: 23, fontWeight: '900', color: TEXT_DARK },
  subtitle: { fontSize: 12, marginTop: 3, fontWeight: '600' },
  list: { padding: 16, paddingBottom: 120 },
  card: { padding: 14, borderRadius: UI.radius.lg, borderWidth: 1, marginBottom: 12, ...UI.softShadow },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  iconBox: { width: 46, height: 46, borderRadius: 16, backgroundColor: '#fff5f7', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  content: { flex: 1 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  nTitle: { fontSize: 14, fontWeight: '800', marginBottom: 4, color: TEXT_DARK },
  nMessage: { fontSize: 13, lineHeight: 18 },
  nTime: { fontSize: 11, marginTop: 6 },
  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  actionBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  acceptBtn: { backgroundColor: ROLE_COLORS.tailor.primary },
  declineBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb' },
  actionText: { color: '#fff', fontWeight: '700' },
  emptyWrap: { alignItems: 'center', padding: 24 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  emptyDesc: { fontSize: 13 },
});
