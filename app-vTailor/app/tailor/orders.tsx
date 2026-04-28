import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ThemedText } from '@/components/themed-text';
import { SURFACE_MUTED, TEXT_DARK, UI } from '@/constants/ui';
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const BORDER = '#E0E0E0';

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
    garment: 'Short Frock with Shalwar',
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
  const pathname = usePathname();
  const [filter, setFilter] = useState<'all' | 'active' | 'done' | 'cancelled'>('all');
  const returnTo = pathname === '/tailor/orders' ? '/tailor/orders' : '/tailor?tab=orders';

  const getStatusStyle = (status: string) => {
    if (status === 'ready') return { backgroundColor: '#E8F8EF', color: '#2E9D65', label: 'Ready' };
    if (status === 'pending') return { backgroundColor: '#FFF3E6', color: '#A65F18', label: 'Pending' };
    if (status === 'cancelled') return { backgroundColor: '#E7F4FF', color: '#316E90', label: 'Cancelled' };
    return { backgroundColor: '#E7F4FF', color: '#316E90', label: 'In Progress' };
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
      <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </Pressable>
          <View style={styles.headerTextWrap}>
            <ThemedText style={styles.headerEyebrow}>Tailor workspace</ThemedText>
            <ThemedText style={styles.title}>All Orders</ThemedText>
          </View>
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
              style={styles.card}
              onPress={() =>
                router.push({
                  pathname: '/tailor/order-detail',
                  params: {
                    orderId: order.id,
                    customerId: String(order.customerId),
                    customerName: order.customer,
                    returnTo,
                  },
                })
              }
            >
              <View style={styles.cardRow}>
                <View style={styles.cardLeft}>
                  <Text style={styles.cardTitle}>{String(order.customer)} {order.id}</Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: statusStyle.backgroundColor }]}>
                  <Text style={[styles.statusText, { color: statusStyle.color }]}>{statusStyle.label}</Text>
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
  screen: { flex: 1, backgroundColor: SURFACE_MUTED },
  container: { paddingBottom: 40, paddingHorizontal: 16, paddingTop: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, backgroundColor: '#fff', borderRadius: 22, padding: 12, ...UI.softShadow },
  headerTextWrap: { flex: 1, alignItems: 'center' },
  headerEyebrow: { fontSize: 11, color: '#ec4899', fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 2 },
  backBtn: { width: 44, height: 44, borderRadius: 16, backgroundColor: '#FCE4F2', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '900', textAlign: 'center', color: TEXT_DARK },
  filters: { flexDirection: 'row', gap: 8, marginBottom: 18, justifyContent: 'space-between' },
  filterBtn: { paddingVertical: 10, paddingHorizontal: 11, borderRadius: 999, backgroundColor: '#fff', borderWidth: 1, borderColor: BORDER },
  filterActive: { backgroundColor: '#ec4899', borderColor: '#ec4899' },
  filterText: { color: '#374151', fontWeight: '600', fontSize: 12 },
  filterTextActive: { color: '#fff', fontWeight: '600', fontSize: 12 },
  card: { 
    backgroundColor: '#fff',
    padding: 16, 
    borderRadius: 18, 
    borderWidth: 1, 
    borderColor: BORDER,
    marginBottom: 12,
    ...UI.softShadow,
  },
  cardRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 14,
  },
  cardLeft: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: '900', color: TEXT_DARK, marginBottom: 4 },
  detailsRow: { flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
  label: { color: '#6b7280', fontSize: 12, fontWeight: '400', marginBottom: 4 },
  amount: { fontWeight: '800', fontSize: 16, color: TEXT_DARK },
  time: { color: '#D34B5D', fontWeight: '600', fontSize: 12 },
  small: { color: '#6b7280', fontSize: 12, fontWeight: '400' },
  statusPill: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, minWidth: 82, alignItems: 'center' },
  statusText: { fontWeight: '600', fontSize: 12 },
});

