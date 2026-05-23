import React, { useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Text } from 'react-native';
import { ThemedText } from './themed-text';
import { useRouter } from 'expo-router';
import { SURFACE_MUTED, TEXT_DARK, UI } from '@/constants/ui';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import { dressPreviewFromOrderDescription } from '@/services/orderDressPreview';

type OrderStatusFilter = 'All' | 'Active' | 'Delivered' | 'Canceled';

const FILTERS: OrderStatusFilter[] = ['All', 'Active', 'Delivered', 'Canceled'];

const orders = [
  {
    id: 1,
    name: 'Long Frock',
    tailor: 'Ahmad Tailor',
    status: 'In Progress',
    date: '2026-12-25',
    price: 8500,
    color: 'Red',
    initials: 'AT',
    tailorId: 'sample-tailor-aliya-formal',
    tailorPhone: '+923215560190',
    rating: '4.8 (245 reviews)',
    sample: { neck: 'Round Neck', sleeves: 'Bell Sleeves', style: 'Flared Bottom', color: 'Beige' },
    measurements: { chest: '36 in', waist: '30 in', length: '52 in', shoulder: '15 in' },
  },
  {
    id: 2,
    name: 'Shalwar Kameez',
    tailor: 'Master Tailors',
    status: 'Cutting',
    date: '2026-12-20',
    price: 25000,
    color: 'Blue',
    initials: 'MT',
    tailorId: 'sample-tailor-fatima-traditional',
    tailorPhone: '+923129018820',
    rating: '4.6 (180 reviews)',
    sample: { neck: 'V-Neck', sleeves: 'Bell Sleeves', style: 'Straight Style', color: 'Beige' },
    measurements: { chest: '38 in', waist: '32 in', length: '44 in', shoulder: '16 in' },
  },
  {
    id: 3,
    name: 'Kurti',
    tailor: 'Classic Stitches',
    status: 'Delivered',
    date: '2026-12-15',
    price: 3500,
    color: 'Green',
    initials: 'CS',
    tailorId: 'sample-tailor-noor-party',
    tailorPhone: '+923332198744',
    rating: '4.7 (132 reviews)',
    sample: { neck: 'Round Neck', sleeves: 'Bell Sleeves', style: 'Straight Style', color: 'Beige' },
    measurements: { chest: '35 in', waist: '29 in', length: '40 in', shoulder: '14.5 in' },
  },
  {
    id: 4,
    name: 'Lehenga',
    tailor: 'Ahmad Tailor',
    status: 'Delivered',
    date: '2026-12-10',
    price: 6000,
    color: 'Black',
    initials: 'AT',
    tailorId: 'sample-tailor-zainab-bridal',
    tailorPhone: '+923004102231',
    rating: '4.8 (245 reviews)',
    sample: { neck: 'Round Neck', sleeves: 'Bell Sleeves', style: 'Flared Style', color: 'Beige' },
    measurements: { chest: '37 in', waist: '31 in', length: '54 in', shoulder: '15.5 in' },
  },
];

const CustomerOrders = () => {
  const router = useRouter();
  const tint = useThemeColor({}, 'tint');
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
      <View style={[styles.headerSection, { backgroundColor: tint }]}>
        <ThemedText style={styles.headerEyebrow}>Track every stitch</ThemedText>
        <ThemedText style={styles.headerTitle}>My Orders</ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
          {FILTERS.map((filter) => {
            const active = selectedFilter === filter;
            return (
              <Pressable
                key={filter}
                onPress={() => setSelectedFilter(filter)}
                style={[
                  styles.filterChip,
                  active ? styles.filterChipActive : [styles.filterChipInactive, { borderColor: inputBorder }],
                ]}
              >
                <Text style={[styles.filterText, active ? styles.filterTextActive : styles.filterTextInactive]}>
                  {filter} ({filterCounts[filter]})
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

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
                  <ThemedText style={styles.orderTailor}>{order.tailor}</ThemedText>
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
  headerSection: { margin: 16, paddingHorizontal: 18, paddingTop: 24, paddingBottom: 18, borderRadius: 24, ...UI.shadow },
  headerEyebrow: { color: '#fff', opacity: 0.86, fontSize: 12, fontWeight: '700', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.7 },
  headerTitle: { fontSize: 24, fontWeight: '900', marginBottom: 16, color: '#fff' },
  filtersRow: { gap: 10, paddingRight: 16 },
  filterChip: { borderRadius: 999, paddingHorizontal: 15, paddingVertical: 10, borderWidth: 1 },
  filterChipActive: { backgroundColor: '#fff', borderColor: '#fff' },
  filterChipInactive: { backgroundColor: 'rgba(255,255,255,0.18)' },
  filterText: { fontSize: 12, fontWeight: '700' },
  filterTextActive: { color: '#ec4899' },
  filterTextInactive: { color: '#fff' },
  scrollView: { flex: 1 },
  ordersList: { paddingHorizontal: 16, paddingTop: 6, gap: 12 },
  emptyCard: { padding: 18, backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', ...UI.softShadow },
  emptyText: { color: '#6b7280', fontWeight: '600' },
  orderCard: { padding: 16, backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, ...UI.softShadow },
  orderHeader: { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 12 },
  avatar: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#fdf2f8', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#be185d', fontWeight: '900', fontSize: 12 },
  orderName: { fontSize: 16, fontWeight: '900', color: TEXT_DARK },
  orderTailor: { fontSize: 12, color: '#6b7280', marginTop: 2, fontWeight: '600' },
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
