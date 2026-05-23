import { Ionicons } from '@expo/vector-icons';
import { SURFACE_MUTED, TEXT_DARK, UI } from '@/constants/ui';
import AppBackButton from '@/components/AppBackButton';
import React from 'react';
import { ScrollView, Pressable, StyleSheet, View } from 'react-native';
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
      icon: 'checkmark-circle-outline' as const,
    },
    {
      id: 2,
      type: 'status',
      title: 'Order Update',
      message: 'Your Long Frock cutting is completed. Stitching begins tomorrow!',
      time: '2 hours ago',
      color: '#f59e0b',
      icon: 'cube-outline' as const,
    },
    {
      id: 3,
      type: 'delivery',
      title: 'Delivery Reminder',
      message: '3 days left for Shalwar Kameez delivery',
      time: '5 hours ago',
      color: null,
      icon: 'time-outline' as const,
    },
    {
      id: 4,
      type: 'complete',
      title: 'Order Completed',
      message: 'Your Casual Kurta order has been completed. Ready for pickup!',
      time: '1 day ago',
      color: null,
      icon: 'shield-checkmark-outline' as const,
    },
    {
      id: 5,
      type: 'payment',
      title: 'Payment Confirmed',
      message: 'Rs. 8,500 payment received for Long Frock',
      time: '2 days ago',
      color: '#0f172a',
      icon: 'card-outline' as const,
    },
    {
      id: 6,
      type: 'cancelled',
      title: 'Order Cancelled',
      message: 'Tailor cancelled your order. Refund initiated.',
      time: '3 days ago',
      color: '#ef4444',
      icon: 'close-circle-outline' as const,
    },
  ];

  // theme colors
  const tint = useThemeColor({}, 'tint');
  const muted = useThemeColor({}, 'muted');
  const iconBg = useThemeColor({}, 'iconBg');

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <AppBackButton onPress={() => (router as any).back()} />
        <View style={{ flex: 1 }}>
          <ThemedText style={styles.title}>Notifications</ThemedText>
          <ThemedText style={[styles.subtitle, { color: muted }]}>Order, delivery, and wallet updates</ThemedText>
        </View>
      </ThemedView>

      <ScrollView contentContainerStyle={styles.list}>
        {notifications.length === 0 ? (
          <ThemedView style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="notifications-outline" size={34} color={tint} />
            </View>
            <ThemedText style={styles.emptyTitle}>No Notifications</ThemedText>
            <ThemedText style={styles.emptyDesc}>You're all caught up!</ThemedText>
          </ThemedView>
        ) : (
          notifications.map((notif) => (
            <ThemedView key={notif.id} style={styles.card}>
              <ThemedView style={[styles.iconBox, { backgroundColor: (notif.color ? notif.color + '22' : iconBg) }]}>
                <Ionicons name={notif.icon} size={21} color={notif.color || tint} />
              </ThemedView>
              <ThemedView style={styles.content}>
                <View style={styles.titleRow}>
                  <ThemedText style={styles.nTitle}>{notif.title}</ThemedText>
                  <View style={[styles.dot, { backgroundColor: notif.color || tint }]} />
                </View>
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
  container: { flex: 1, backgroundColor: SURFACE_MUTED },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 16, paddingTop: 10 },
  backButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginRight: 10, ...UI.softShadow },
  title: { fontSize: 23, fontWeight: '900', color: TEXT_DARK },
  subtitle: { fontSize: 12, marginTop: 3, fontWeight: '600' },
  list: { padding: 16, paddingBottom: 120 },
  card: { flexDirection: 'row', padding: 14, backgroundColor: '#fff', borderRadius: UI.radius.lg, marginBottom: 12, borderWidth: 1, borderColor: '#fbcfe8', ...UI.softShadow },
  iconBox: { width: 46, height: 46, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  content: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  nTitle: { fontSize: 14, fontWeight: '800', marginBottom: 4, color: TEXT_DARK },
  nMessage: { fontSize: 13, color: '#6b7280', lineHeight: 18 },
  nTime: { fontSize: 11, color: '#9ca3af', marginTop: 8 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { width: 66, height: 66, borderRadius: 24, backgroundColor: '#fdf2f8', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '600' },
  emptyDesc: { fontSize: 13, color: '#6b7280', marginTop: 6 },
});

export default CustomerNotifications;
