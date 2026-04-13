import NotificationBell from '@/components/NotificationBell';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const stats = [
  { emoji: '🎁', label: 'Total', value: 8, bg: '#fff0f6', tint: '#ec4899' },
  { emoji: '🕒', label: 'In Progress', value: 2, bg: '#fffbeb', tint: '#b45309' },
  { emoji: '✅', label: 'Delivered', value: 5, bg: '#ecfdf5', tint: '#059669' },
  { emoji: '❌', label: 'Cancelled', value: 1, bg: '#fff1f2', tint: '#dc2626' },
];

const orders = [
  {
    id: 1,
    name: 'Long Frock',
    tailor: 'Ahmad Tailor',
    rating: '⭐ 4.8 (245 reviews)',
    status: 'In Progress',
    date: '2026-12-25',
    price: 8500,
    sample: { neck: 'Round Neck', sleeves: 'Full Sleeves', style: 'Flared Bottom', color: 'Red' },
  },
  {
    id: 2,
    name: 'Shalwar Kameez',
    tailor: 'Master Tailors',
    rating: '⭐ 4.6 (180 reviews)',
    status: 'Cutting',
    date: '2026-12-20',
    price: 25000,
    sample: { neck: 'V-Neck', sleeves: 'Bell Sleeves', style: 'Straight Style', color: 'Blue' },
  },
  {
    id: 3,
    name: 'Kurti',
    tailor: 'Classic Stitches',
    rating: '⭐ 4.7 (132 reviews)',
    status: 'Delivered',
    date: '2026-12-15',
    price: 3500,
    sample: { neck: 'Round Neck', sleeves: 'Full Sleeves', style: 'Tulip Style', color: 'Green' },
  },
  {
    id: 4,
    name: 'Lehenga',
    tailor: 'Ahmad Tailor',
    rating: '⭐ 4.8 (245 reviews)',
    status: 'Delivered',
    date: '2026-12-10',
    price: 6000,
    sample: { neck: 'V-Neck', sleeves: 'Bell Sleeves', style: 'Flared Style', color: 'Black' },
  },
];

const getStatusColors = (status: string) => {
  switch (status) {
    case 'Delivered':
      return { bg: '#ecfdf5', color: '#059669' };
    case 'In Progress':
    case 'Cutting':
      return { bg: '#fffbeb', color: '#b45309' };
    case 'Cancelled':
      return { bg: '#fff1f2', color: '#dc2626' };
    default:
      return { bg: '#f3f4f6', color: '#6b7280' };
  }
};

export default function CustomerOrders() {
  const bg = useThemeColor({}, 'background');
  const card = useThemeColor({}, 'card');
  const router = useRouter();

  const openTimeline = (order: (typeof orders)[number]) => {
    router.push({
      pathname: '/customer/order-timeline',
      params: {
        orderId: `ORD-${String(order.id).padStart(3, '0')}`,
        demo: '1',
        orderDescription: order.name,
        orderDate: order.date,
        tailorName: order.tailor,
        tailorRating: order.rating,
        statusLabel: order.status,
        sampleNeck: order.sample.neck,
        sampleSleeves: order.sample.sleeves,
        sampleStyle: order.sample.style,
        sampleColor: order.sample.color,
      },
    });
  };

  return (
    <ProtectedRoute requiredRole="customer">
      <View style={[styles.container, { backgroundColor: bg }]}> 
        <View style={styles.header}> 
          <View style={styles.headerRow}>
            <ThemedText style={styles.title}>My Orders</ThemedText>
            <NotificationBell count={2} basePath="customer" />
          </View>

          <View style={styles.statsRow}>
            {stats.map((s) => (
              <View key={s.label} style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: s.bg }]}>
                  <Text style={[styles.statEmoji, { color: s.tint }]}>{s.emoji}</Text>
                </View>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <ScrollView style={styles.list} contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
          {orders.map((order) => {
            const statusStyle = getStatusColors(order.status);
            return (
              <TouchableOpacity 
                key={order.id} 
                style={[styles.card, { backgroundColor: card }]}
                onPress={() => openTimeline(order)}
                activeOpacity={0.7}
              > 
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.orderName}>{order.name}</Text>
                    <Text style={styles.tailorName}>{order.tailor}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}> 
                    <Text style={[styles.statusText, { color: statusStyle.color }]}>{order.status}</Text>
                  </View>
                </View>

                <View style={styles.cardBottom}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.dateText}>{order.date}</Text>
                    <Text style={styles.priceText}>Rs. {order.price.toLocaleString()}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.viewButton}
                    onPress={() => openTimeline(order)}
                  >
                    <Ionicons name="arrow-forward" size={18} color="#3b82f6" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: Platform.select({ ios: 64, android: 36, default: 36 }), paddingBottom: 12, borderBottomWidth: 1, borderColor: '#eee' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 20, fontWeight: '700' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statItem: { flex: 1, alignItems: 'center' },
  statIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  statEmoji: { fontSize: 20 },
  statValue: { fontSize: 16, fontWeight: '700' },
  statLabel: { fontSize: 11, color: '#6b7280' },
  list: { flex: 1 },
  card: { padding: 12, borderRadius: 14, borderWidth: 1, borderColor: '#eaeaea', marginBottom: 10 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  orderName: { fontSize: 15, fontWeight: '700' },
  tailorName: { fontSize: 12, color: '#6b7280' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  statusText: { fontSize: 12, fontWeight: '700' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateText: { color: '#6b7280' },
  priceText: { fontWeight: '800' },
  viewButton: { padding: 8, borderRadius: 8, backgroundColor: '#eff6ff', marginLeft: 8 },
});
