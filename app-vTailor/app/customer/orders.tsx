import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import NotificationBell from '@/components/NotificationBell';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

const stats = [
  { emoji: '🎁', label: 'Total', value: 8, bg: '#fff0f6', tint: '#ec4899' },
  { emoji: '🕒', label: 'In Progress', value: 2, bg: '#fffbeb', tint: '#b45309' },
  { emoji: '✅', label: 'Delivered', value: 5, bg: '#ecfdf5', tint: '#059669' },
  { emoji: '❌', label: 'Cancelled', value: 1, bg: '#fff1f2', tint: '#dc2626' },
];

const orders = [
  { id: 1, name: 'Formal Suit', tailor: 'Ahmad Tailor', status: 'In Progress', date: '25 Dec', price: 8500 },
  { id: 2, name: 'Wedding Sherwani', tailor: 'Master Tailors', status: 'Cutting', date: '20 Dec', price: 25000 },
  { id: 3, name: 'Casual Kurta', tailor: 'Classic Stitches', status: 'Delivered', date: '15 Dec', price: 3500 },
  { id: 4, name: 'Office Shirts (3)', tailor: 'Ahmad Tailor', status: 'Delivered', date: '10 Dec', price: 6000 },
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
              <View key={order.id} style={[styles.card, { backgroundColor: card }]}> 
                <View style={styles.cardTop}>
                  <View>
                    <Text style={styles.orderName}>{order.name}</Text>
                    <Text style={styles.tailorName}>{order.tailor}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}> 
                    <Text style={[styles.statusText, { color: statusStyle.color }]}>{order.status}</Text>
                  </View>
                </View>

                <View style={styles.cardBottom}>
                  <Text style={styles.dateText}>{order.date}</Text>
                  <Text style={styles.priceText}>Rs. {order.price.toLocaleString()}</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 12, borderBottomWidth: 1, borderColor: '#eee' },
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
});
