import React from 'react';
import { ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

const CustomerNotifications = () => {
  const router = useRouter();

  const notifications = [
    {
      id: 1,
      type: 'request_accepted',
      title: 'Request Accepted!',
      message: 'Ahmad Master Tailor has accepted your Long Frock request. They will contact you soon!',
      time: '5 min ago',
      color: '#059669',
      icon: '✅',
    },
    {
      id: 2,
      type: 'status',
      title: 'Order Update',
      message: 'Your Long Frock cutting is completed. Stitching begins tomorrow!',
      time: '2 hours ago',
      color: '#f59e0b',
      icon: '📦',
    },
    {
      id: 3,
      type: 'delivery',
      title: 'Delivery Reminder',
      message: '3 days left for Shalwar Kameez delivery',
      time: '5 hours ago',
      color: null,
      icon: '⏱️',
    },
    {
      id: 4,
      type: 'complete',
      title: 'Order Completed',
      message: 'Your Casual Kurta order has been completed. Ready for pickup!',
      time: '1 day ago',
      color: null,
      icon: '✅',
    },
    {
      id: 5,
      type: 'payment',
      title: 'Payment Confirmed',
      message: 'Rs. 8,500 payment received for Long Frock',
      time: '2 days ago',
      color: '#0f172a',
      icon: '💳',
    },
    {
      id: 6,
      type: 'cancelled',
      title: 'Order Cancelled',
      message: 'Tailor cancelled your order. Refund initiated.',
      time: '3 days ago',
      color: '#ef4444',
      icon: '❌',
    },
  ];

  // theme colors
  const tint = useThemeColor({}, 'tint');
  const muted = useThemeColor({}, 'muted');
  const iconBg = useThemeColor({}, 'iconBg');

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => (router as any).back()}>
          <ThemedText style={styles.backText}>←</ThemedText>
        </Pressable>
        <ThemedText style={styles.title}>Notifications</ThemedText>
      </ThemedView>

      <ScrollView contentContainerStyle={styles.list}>
        {notifications.length === 0 ? (
          <ThemedView style={styles.empty}>
            <ThemedText style={styles.emptyIcon}>🔔</ThemedText>
            <ThemedText style={styles.emptyTitle}>No Notifications</ThemedText>
            <ThemedText style={styles.emptyDesc}>You're all caught up!</ThemedText>
          </ThemedView>
        ) : (
          notifications.map((notif) => (
            <ThemedView key={notif.id} style={styles.card}>
              <ThemedView style={[styles.iconBox, { backgroundColor: (notif.color ? notif.color + '22' : iconBg) }]}>
                <ThemedText style={[styles.icon, { color: tint }]}>{notif.icon}</ThemedText>
              </ThemedView>
              <ThemedView style={styles.content}>
                <ThemedText style={styles.nTitle}>{notif.title}</ThemedText>
                <ThemedText style={[styles.nMessage, { color: muted }]}>{notif.message}</ThemedText>
                <ThemedText style={[styles.nTime, { color: muted }]}>{notif.time}</ThemedText>
              </ThemedView>
            </ThemedView>
          ))
        )}
      </ScrollView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 40, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  backButton: { padding: 8, marginRight: 8 },
  backText: { fontSize: 18 },
  title: { fontSize: 18, fontWeight: '700' },
  list: { padding: 12, paddingBottom: 120 },
  card: { flexDirection: 'row', padding: 12, backgroundColor: '#f9fafb', borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#e5e7eb' },
  iconBox: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  icon: { fontSize: 18 },
  content: { flex: 1 },
  nTitle: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  nMessage: { fontSize: 13, color: '#6b7280' },
  nTime: { fontSize: 11, color: '#9ca3af', marginTop: 8 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '600' },
  emptyDesc: { fontSize: 13, color: '#6b7280', marginTop: 6 },
});

export default CustomerNotifications;
