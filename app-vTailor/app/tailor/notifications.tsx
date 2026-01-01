import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

const notifications = [
  { id: 1, type: 'new_order', title: 'New Order Request', message: "Ahmad Khan wants to order a Wedding Sherwani", time: '10 min ago', action: true },
  { id: 2, type: 'deadline', title: 'Delivery Reminder', message: "2 days left for Ali Hassan's Formal Suit delivery", time: '1 hour ago' },
  { id: 3, type: 'update', title: 'Update Reminder', message: 'Time to share stitching progress with Zara Khan', time: '3 hours ago' },
  { id: 4, type: 'wallet', title: 'Payment Received', message: 'Rs. 12,000 added to your wallet from Zara Khan', time: '5 hours ago' },
  { id: 5, type: 'penalty', title: 'Penalty Deducted', message: 'Rs. 425 deducted for late delivery (5%)', time: '1 day ago' },
  { id: 6, type: 'cancelled', title: 'Order Cancelled', message: 'Customer cancelled the Casual Kurta order', time: '2 days ago' },
];

const typeIcon = (type: string) => {
  switch (type) {
    case 'new_order':
      return '🧾';
    case 'deadline':
      return '⏰';
    case 'update':
      return '📦';
    case 'wallet':
      return '💰';
    case 'penalty':
      return '⚠️';
    case 'cancelled':
      return '❌';
    default:
      return '🔔';
  }
};

export default function TailorNotifications() {
  const router = useRouter();
  const bg = useThemeColor({}, 'background');
  const card = useThemeColor({}, 'card');
  const muted = useThemeColor({}, 'muted');

  return (
    <ProtectedRoute requiredRole="tailor">
      <View style={[styles.container, { backgroundColor: bg }]}> 
        <View style={[styles.header, { borderBottomColor: '#eee' }]}>
          <Pressable onPress={() => (router as any).back()} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </Pressable>
          <ThemedText style={styles.title}>Notifications</ThemedText>
        </View>

        <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 120 }}>
          {notifications.map((n) => (
            <View key={n.id} style={[styles.card, { backgroundColor: card, borderColor: '#eaeaea' }]}>
              <View style={styles.row}>
                <View style={styles.iconBox}>
                  <Text style={styles.iconText}>{typeIcon(n.type)}</Text>
                </View>
                <View style={styles.content}>
                  <Text style={styles.nTitle}>{n.title}</Text>
                  <Text style={[styles.nMessage, { color: muted }]}>{n.message}</Text>
                  <Text style={[styles.nTime, { color: muted }]}>{n.time}</Text>
                </View>
              </View>

              {n.action && (
                <View style={styles.actionsRow}>
                  <Pressable style={[styles.actionBtn, styles.acceptBtn]} onPress={() => {}}>
                    <Text style={styles.actionText}>Accept</Text>
                  </Pressable>
                  <Pressable style={[styles.actionBtn, styles.declineBtn]} onPress={() => {}}>
                    <Text style={[styles.actionText, { color: '#111827' }]}>Decline</Text>
                  </Pressable>
                </View>
              )}
            </View>
          ))}

          {notifications.length === 0 && (
            <View style={styles.emptyWrap}>
              <View style={[styles.emptyIcon, { backgroundColor: '#f3f4f6' }]}>
                <Text style={{ fontSize: 28, color: '#6b7280' }}>🔔</Text>
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
  container: { flex: 1 },
  header: { paddingTop: 40, paddingHorizontal: 12, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1 },
  backButton: { marginRight: 8, padding: 6 },
  backIcon: { fontSize: 18 },
  title: { fontSize: 20, fontWeight: '700' },
  card: { padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  iconBox: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#fff5f7', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  iconText: { fontSize: 18 },
  content: { flex: 1 },
  nTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  nMessage: { fontSize: 13 },
  nTime: { fontSize: 11, marginTop: 6 },
  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  actionBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  acceptBtn: { backgroundColor: '#ec4899' },
  declineBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb' },
  actionText: { color: '#fff', fontWeight: '700' },
  emptyWrap: { alignItems: 'center', padding: 24 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  emptyDesc: { fontSize: 13 },
});
