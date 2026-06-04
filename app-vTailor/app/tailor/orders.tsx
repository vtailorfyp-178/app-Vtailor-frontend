import { ProtectedRoute } from '@/components/ProtectedRoute';
import { CustomerScreenHeader } from '@/components/customer/CustomerScreenHeader';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { SURFACE_MUTED, TEXT_DARK, UI, ROLE_COLORS } from '@/constants/ui';
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
  const tint = useThemeColor({}, 'tint');
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
        <CustomerScreenHeader
          eyebrow="Tailor workspace"
          title="My Orders"
          tint={tint}
          footer={
            <View style={styles.filtersRow}>
              {(['all', 'active', 'done', 'cancelled'] as const).map((key) => {
                const active = filter === key;
                const labels = {
                  all: `All (${counts.all})`,
                  active: `Active (${counts.active})`,
                  done: `Done (${counts.done})`,
                  cancelled: `Cancelled (${counts.cancelled})`,
                };
                return (
                  <Pressable
                    key={key}
                    style={[styles.filterChip, active && styles.filterChipActive]}
                    onPress={() => setFilter(key)}
                  >
                    <Text style={active ? styles.filterTextActive : styles.filterText}>{labels[key]}</Text>
                  </Pressable>
                );
              })}
            </View>
          }
        />

        <View style={styles.listWrap}>
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
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: SURFACE_MUTED },
  container: { paddingBottom: 40, paddingTop: 4 },
  filtersRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  filterChipActive: { backgroundColor: '#fff', borderColor: '#fff' },
  filterText: { color: 'rgba(255,255,255,0.92)', fontWeight: '700', fontSize: 12 },
  filterTextActive: { color: ROLE_COLORS.tailor.primaryDark, fontWeight: '700', fontSize: 12 },
  listWrap: { paddingHorizontal: 16, paddingTop: 8 },
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

