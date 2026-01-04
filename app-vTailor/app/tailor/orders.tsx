import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const orders = [
  {
    id: 'ORD001',
    customerId: 1,
    customer: 'Ali Hassan',
    phone: '+92 300 1234567',
    garment: 'Long Frock',
    status: 'in progress',
    amount: 1200,
    timeLeft: '2d 5h left',
    penalty: 0,
    delivery: 'Jan 12 • Pickup',
    urgent: false,
    hasMeasurements: true,
  },
  {
    id: 'ORD002',
    customerId: 2,
    customer: 'Zara Khan',
    phone: '+92 333 9876543',
    garment: 'Lehenga',
    status: 'pending',
    amount: 9500,
    timeLeft: '18h left',
    penalty: 320,
    delivery: 'Jan 06 • Home Delivery',
    urgent: true,
    hasMeasurements: false,
  },
  {
    id: 'ORD003',
    customerId: 5,
    customer: 'Usman Tariq',
    phone: '+92 321 5558899',
    garment: 'Ghagra',
    status: 'ready',
    amount: 6500,
    timeLeft: 'Ready for pickup',
    penalty: 0,
    delivery: 'Jan 04 • Store Pickup',
    urgent: false,
    hasMeasurements: true,
  },
  {
    id: 'ORD004',
    customerId: 6,
    customer: 'Hira Malik',
    phone: '+92 300 7778899',
    garment: 'Maxi Dress',
    status: 'cancelled',
    amount: 4200,
    timeLeft: '-',
    penalty: 0,
    delivery: '—',
    urgent: false,
    hasMeasurements: false,
  },
];

export default function TailorOrders() {
  const router = useRouter();
  const card = useThemeColor({}, 'card');
  const inputBorder = useThemeColor({}, 'inputBorder');
  const [filter, setFilter] = useState<'all' | 'active' | 'done' | 'cancelled'>('all');

  const getStatusStyle = (status: string) => {
    if (status === 'ready') return { backgroundColor: '#ecfdf3', color: '#15803d' };
    if (status === 'pending') return { backgroundColor: '#fff7ed', color: '#c2410c' };
    return { backgroundColor: '#e0f2fe', color: '#075985' };
  };

  const filtered = orders.filter((o) => {
    if (filter === 'all') return true;
    if (filter === 'active') return o.status === 'in progress' || o.status === 'pending';
    if (filter === 'done') return o.status === 'ready';
    return o.status === 'cancelled';
  });

  const counts = {
    all: orders.length,
    active: orders.filter((o) => o.status === 'in progress' || o.status === 'pending').length,
    done: orders.filter((o) => o.status === 'ready').length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
  };

  return (
    <ProtectedRoute requiredRole="tailor">
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </Pressable>
          <ThemedText style={styles.title}>All Orders</ThemedText>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.filters}>
          <Pressable style={[styles.filterBtn, filter === 'all' && styles.filterActive]} onPress={() => setFilter('all')}>
            <Text style={filter === 'all' ? styles.filterTextActive : styles.filterText}>All ({counts.all})</Text>
          </Pressable>
          <Pressable style={[styles.filterBtn, filter === 'active' && styles.filterActive]} onPress={() => setFilter('active')}>
            <Text style={filter === 'active' ? styles.filterTextActive : styles.filterText}>Active ({counts.active})</Text>
          </Pressable>
          <Pressable style={[styles.filterBtn, filter === 'done' && styles.filterActive]} onPress={() => setFilter('done')}>
            <Text style={filter === 'done' ? styles.filterTextActive : styles.filterText}>Done ({counts.done})</Text>
          </Pressable>
          <Pressable style={[styles.filterBtn, filter === 'cancelled' && styles.filterActive]} onPress={() => setFilter('cancelled')}>
            <Text style={filter === 'cancelled' ? styles.filterTextActive : styles.filterText}>Cancelled ({counts.cancelled})</Text>
          </Pressable>
        </View>

        {filtered.map((order) => {
          const statusStyle = getStatusStyle(order.status);
          return (
            <Pressable
              key={order.id}
              style={[styles.card, { backgroundColor: card, borderColor: inputBorder }]}
              onPress={() =>
                router.push({ pathname: '/tailor/order-detail', params: { orderId: order.id, customerId: String(order.customerId), customerName: order.customer } })
              }
            >
              <View style={styles.cardRow}>
                <View style={styles.cardLeft}>
                  <Text style={styles.cardTitle}>{String(order.customer)} {order.id}</Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: statusStyle.backgroundColor }]}>
                  <Text style={[styles.statusText, { color: statusStyle.color }]}>{order.status}</Text>
                </View>
              </View>
              <View style={styles.detailsRow}>
                <View>
                  <Text style={styles.label}>Price</Text>
                  <Text style={styles.amount}>Rs {order.amount.toLocaleString()}</Text>
                </View>
                <View>
                  <Text style={styles.label}>Time</Text>
                  <Text style={styles.time}>{order.timeLeft}</Text>
                </View>
                <View>
                  <Text style={styles.label}>Contact</Text>
                  <Text style={styles.small}>{order.phone}</Text>
                </View>
              </View>
            </Pressable>
          );
        })}

        <View style={{ height: 120 }} />
      </ScrollView>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 40, paddingHorizontal: 16, paddingTop: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '800', flex: 1, textAlign: 'center' },
  filters: { flexDirection: 'row', gap: 8, marginBottom: 16, justifyContent: 'space-between' },
  filterBtn: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8, backgroundColor: '#f3f4f6' },
  filterActive: { backgroundColor: '#111827' },
  filterText: { color: '#374151', fontWeight: '600', fontSize: 12 },
  filterTextActive: { color: '#fff', fontWeight: '700', fontSize: 12 },
  card: { 
    padding: 12, 
    borderRadius: 12, 
    borderWidth: 1, 
    marginBottom: 10,
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 8,
  },
  cardLeft: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '900', color: '#111827', marginBottom: 4, letterSpacing: 0.3 },
  detailsRow: { flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
  label: { color: '#6b7280', fontSize: 10, fontWeight: '600', marginBottom: 2 },
  amount: { fontWeight: '800', fontSize: 14, color: '#111827' },
  time: { color: '#ef4444', fontWeight: '700', fontSize: 12 },
  small: { color: '#6b7280', fontSize: 12, fontWeight: '500' },
  statusPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, minWidth: 70, alignItems: 'center' },
  statusText: { fontWeight: '700', fontSize: 11, textTransform: 'capitalize' },
});

