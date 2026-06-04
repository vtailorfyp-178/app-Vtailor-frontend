import React, { useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Text } from 'react-native';
import { ThemedText } from './themed-text';
import { useRouter } from 'expo-router';
import { CustomerScreenHeader } from '@/components/customer/CustomerScreenHeader';
import { SURFACE_MUTED, TEXT_DARK, UI } from '@/constants/ui';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import { DEMO_CUSTOMER_ORDERS, dressPreviewFromOrderDescription } from '@/services/orderDressPreview';

type OrderStatusFilter = 'All' | 'Active' | 'Delivered' | 'Canceled';

const FILTERS: OrderStatusFilter[] = ['All', 'Active', 'Delivered', 'Canceled'];

const orders = DEMO_CUSTOMER_ORDERS.map((o) => ({
  id: o.id,
  name: o.name,
  tailor: o.tailor,
  status: o.status,
  date: o.date,
  price: o.price,
  color: o.sample.color,
  initials: o.tailorAvatar,
  tailorId: o.tailorId,
  tailorPhone: o.tailorPhone,
  rating: o.rating.replace('⭐ ', ''),
  sample: o.sample,
  measurements: o.measurements,
}));

const CustomerOrders = () => {
  const router = useRouter();
  const tint = useThemeColor({}, 'tint');
  const card = useThemeColor({}, 'card');
  const inputBorder = useThemeColor({}, 'inputBorder');
  const [selectedFilter, setSelectedFilter] = useState<OrderStatusFilter>('All');

  const filteredOrders = useMemo(() => {
    if (selectedFilter === 'All') return orders;
    if (selectedFilter === 'Active') {
      return orders.filter((order) => order.status === 'In Progress' || order.status === 'Cutting');
    }
    if (selectedFilter === 'Delivered') {
      return orders.filter((order) => order.status === 'Delivered');
    }
    return orders.filter((order) => order.status === 'Canceled' || order.status === 'Cancelled');
  }, [selectedFilter]);

  const filterCounts = useMemo<Record<OrderStatusFilter, number>>(() => ({
    All: orders.length,
    Active: orders.filter((order) => order.status === 'In Progress' || order.status === 'Cutting').length,
    Delivered: orders.filter((order) => order.status === 'Delivered').length,
    Canceled: orders.filter((order) => order.status === 'Canceled' || order.status === 'Cancelled').length,
  }), []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered':
        return '#14b8a6';
      case 'In Progress':
      case 'Cutting':
        return '#f59e0b';
      case 'Canceled':
      case 'Cancelled':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  return (
    <View style={styles.container}>
      <CustomerScreenHeader
        eyebrow="Track & manage"
        title="My Orders"
        tint={tint}
        footer={
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
            {FILTERS.map((filter) => {
              const active = selectedFilter === filter;
              return (
                <Pressable
                  key={filter}
                  onPress={() => setSelectedFilter(filter)}
                  style={[
                    styles.filterChip,
                    active
                      ? [styles.filterChipActive, { backgroundColor: '#fff', borderColor: '#fff' }]
                      : styles.filterChipInactive,
                  ]}
                >
                  <Text style={[styles.filterText, active ? styles.filterTextActive : styles.filterTextInactive]}>
                    {filter} ({filterCounts[filter]})
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        }
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.ordersList}>
          {filteredOrders.length === 0 ? (
            <View style={styles.emptyCard}>
              <ThemedText style={styles.emptyText}>No orders found for {selectedFilter}.</ThemedText>
            </View>
          ) : null}
          {filteredOrders.map((order) => (
            <Pressable
              key={order.id}
              style={[styles.orderCard, { borderColor: inputBorder }]}
              onPress={() => {
                const preview = dressPreviewFromOrderDescription(order.name);
                router.push({
                  pathname: '/customer/order-timeline',
                  params: {
                    orderId: `ORD-${String(order.id).padStart(3, '0')}`,
                    demo: '1',
                    orderDescription: order.name,
                    orderDate: order.date,
                    orderPrice: String(order.price),
                    tailorName: order.tailor,
                    tailorId: order.tailorId,
                    tailorPhone: order.tailorPhone,
                    tailorAvatar: order.initials,
                    tailorRating: order.rating,
                    statusLabel: order.status,
                    sampleNeck: order.sample.neck,
                    sampleSleeves: order.sample.sleeves,
                    sampleStyle: order.sample.style,
                    sampleColor: order.sample.color,
                    measurementChest: order.measurements.chest,
                    measurementWaist: order.measurements.waist,
                    measurementLength: order.measurements.length,
                    measurementShoulder: order.measurements.shoulder,
                    ...(preview
                      ? {
                          modelId: preview.modelId,
                          selections: JSON.stringify(preview.selections),
                        }
                      : {}),
                  },
                } as any);
              }}
            >
              <View style={styles.orderHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{order.initials}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText style={styles.orderName}>{order.name}</ThemedText>
                  <ThemedText style={[styles.orderTailor, { color: tint }]}>{order.tailor}</ThemedText>
                </View>
                <View style={styles.priceWrap}>
                  <ThemedText style={styles.priceLabel}>Total</ThemedText>
                  <ThemedText style={styles.orderPrice}>Rs. {order.price.toLocaleString()}</ThemedText>
                </View>
              </View>

              <View style={styles.compactMetaRow}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
                  <ThemedText style={[styles.statusText, { color: getStatusColor(order.status) }]}>{order.status}</ThemedText>
                </View>
                <View style={styles.metaChip}>
                  <Ionicons name="calendar-outline" size={13} color="#be185d" />
                  <ThemedText style={styles.metaChipText}>{order.date}</ThemedText>
                </View>
              </View>

              <View style={styles.orderFooter}>
                <View style={styles.samplePill}>
                  <Ionicons name="color-palette-outline" size={14} color="#be185d" />
                  <ThemedText style={styles.samplePillText}>{order.color} dress</ThemedText>
                </View>
                <View style={styles.timelineHint}>
                  <ThemedText style={styles.timelineHintText}>View timeline</ThemedText>
                  <Ionicons name="chevron-forward" size={15} color="#ec4899" />
                </View>
              </View>
            </Pressable>
          ))}
        </View>
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SURFACE_MUTED },
  filtersRow: { gap: 8, paddingRight: 8 },
  filterChip: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1 },
  filterChipActive: {},
  filterChipInactive: { backgroundColor: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.35)' },
  filterText: { fontSize: 12, fontWeight: '700' },
  filterTextActive: { color: '#be185d' },
  filterTextInactive: { color: 'rgba(255,255,255,0.92)' },
  scrollView: { flex: 1 },
  ordersList: { paddingHorizontal: 16, paddingTop: 6, gap: 12 },
  emptyCard: { padding: 18, backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', ...UI.softShadow },
  emptyText: { color: '#6b7280', fontWeight: '600' },
  orderCard: { padding: 16, backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, ...UI.softShadow },
  orderHeader: { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 12 },
  avatar: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#fdf2f8', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#be185d', fontWeight: '900', fontSize: 12 },
  orderName: { fontSize: 16, fontWeight: '900', color: TEXT_DARK },
  orderTailor: { fontSize: 12, marginTop: 3, fontWeight: '700' },
  priceWrap: { alignItems: 'flex-end' },
  priceLabel: { color: '#9ca3af', fontSize: 10, fontWeight: '800', marginBottom: 2 },
  orderPrice: { fontSize: 13, fontWeight: '900', color: TEXT_DARK },
  compactMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  statusText: { fontSize: 11, fontWeight: '800' },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#fff7fb', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6 },
  metaChipText: { color: '#be185d', fontSize: 11, fontWeight: '800' },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  samplePill: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fdf2f8', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 8 },
  samplePillText: { color: '#be185d', fontSize: 11, fontWeight: '800' },
  timelineHint: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  timelineHintText: { color: '#ec4899', fontSize: 12, fontWeight: '900' },
  bottomPadding: { height: 100 },
});

export default CustomerOrders;
