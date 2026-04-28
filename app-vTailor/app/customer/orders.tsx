import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ThemedText } from '@/components/themed-text';
import { SURFACE_MUTED, TEXT_DARK, UI } from '@/constants/ui';
import AppBackButton from '@/components/AppBackButton';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type OrderStatusFilter = 'All' | 'Active' | 'Delivered' | 'Canceled';

const orders = [
  {
    id: 1,
    name: 'Long Frock',
    tailorId: 'sample-tailor-aliya-formal',
    tailor: 'Aliya Formal Dresses',
    tailorPhone: '+923215560190',
    tailorAvatar: 'AF',
    rating: '⭐ 4.8 (245 reviews)',
    status: 'In Progress',
    date: '2026-12-25',
    price: 8500,
    sample: { neck: 'Round Neck', sleeves: 'Full Sleeves', style: 'Flared Bottom', color: 'Red' },
  },
  {
    id: 2,
    name: 'Shalwar Kameez',
    tailorId: 'sample-tailor-fatima-traditional',
    tailor: 'Fatima Traditional Wear',
    tailorPhone: '+923129018820',
    tailorAvatar: 'FT',
    rating: '⭐ 4.6 (180 reviews)',
    status: 'Cutting',
    date: '2026-12-20',
    price: 25000,
    sample: { neck: 'V-Neck', sleeves: 'Bell Sleeves', style: 'Straight Style', color: 'Blue' },
  },
  {
    id: 3,
    name: 'Kurti',
    tailorId: 'sample-tailor-noor-party',
    tailor: 'Noor Party Wear Studio',
    tailorPhone: '+923332198744',
    tailorAvatar: 'NP',
    rating: '⭐ 4.7 (132 reviews)',
    status: 'Delivered',
    date: '2026-12-15',
    price: 3500,
    sample: { neck: 'Round Neck', sleeves: 'Full Sleeves', style: 'Tulip Style', color: 'Green' },
  },
  {
    id: 4,
    name: 'Lehenga',
    tailorId: 'sample-tailor-zainab-bridal',
    tailor: 'Zainab Bridal Couture',
    tailorPhone: '+923004102231',
    tailorAvatar: 'ZB',
    rating: '⭐ 4.8 (245 reviews)',
    status: 'Delivered',
    date: '2026-12-10',
    price: 6000,
    sample: { neck: 'V-Neck', sleeves: 'Bell Sleeves', style: 'Flared Style', color: 'Black' },
  },
  {
    id: 5,
    name: 'Party Maxi',
    tailor: 'Hira Party Couture',
    tailorId: 'sample-tailor-hira-party',
    tailorPhone: '+923457740091',
    tailorAvatar: 'HP',
    rating: '⭐ 4.4 (98 reviews)',
    status: 'Canceled',
    date: '2026-12-05',
    price: 12000,
    sample: { neck: 'Boat Neck', sleeves: 'Half Sleeves', style: 'A-Line', color: 'Pink' },
  },
];

const FILTERS: OrderStatusFilter[] = ['All', 'Active', 'Delivered', 'Canceled'];

const getStatusColors = (status: string) => {
  switch (status) {
    case 'Delivered':
      return { bg: '#ecfdf5', color: '#059669' };
    case 'In Progress':
      return { bg: '#e0f2fe', color: '#0e7490' };
    case 'Cutting':
      return { bg: '#fffbeb', color: '#b45309' };
    case 'Canceled':
      return { bg: '#e0f2fe', color: '#0369a1' };
    default:
      return { bg: '#f3f4f6', color: '#6b7280' };
  }
};

export default function CustomerOrders() {
  const bg = useThemeColor({}, 'background');
  const card = useThemeColor({}, 'card');
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState<OrderStatusFilter>('All');

  const filteredOrders = useMemo(() => {
    if (selectedFilter === 'All') return orders;
    if (selectedFilter === 'Active') {
      return orders.filter((order) => order.status === 'In Progress' || order.status === 'Cutting');
    }
    if (selectedFilter === 'Delivered') {
      return orders.filter((order) => order.status === 'Delivered');
    }
    return orders.filter((order) => order.status === 'Canceled');
  }, [selectedFilter]);

  const filterCounts = useMemo<Record<OrderStatusFilter, number>>(() => ({
    All: orders.length,
    Active: orders.filter((order) => order.status === 'In Progress' || order.status === 'Cutting').length,
    Delivered: orders.filter((order) => order.status === 'Delivered').length,
    Canceled: orders.filter((order) => order.status === 'Canceled').length,
  }), []);

  const openTimeline = (order: (typeof orders)[number]) => {
    router.push({
      pathname: '/customer/order-timeline',
      params: {
        orderId: `ORD-${String(order.id).padStart(3, '0')}`,
        demo: '1',
        orderDescription: order.name,
        orderDate: order.date,
        tailorName: order.tailor,
        tailorId: order.tailorId,
        tailorPhone: order.tailorPhone,
        tailorAvatar: order.tailorAvatar,
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
            <AppBackButton onPress={() => router.back()} />
            <View style={styles.headerTitleWrap}>
              <ThemedText style={styles.title}>All Orders</ThemedText>
              <Text style={styles.subtitle}>Track every customer order in one place</Text>
            </View>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <Ionicons name="bag-check-outline" size={26} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryLabel}>Current Work</Text>
              <Text style={styles.summaryTitle}>{filterCounts.Active} active orders</Text>
              <Text style={styles.summaryText}>{filterCounts.Delivered} delivered, {filterCounts.Canceled} canceled</Text>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
            {FILTERS.map((filter) => {
              const active = selectedFilter === filter;
              return (
                <TouchableOpacity
                  key={filter}
                  onPress={() => setSelectedFilter(filter)}
                  style={[
                    styles.filterChip,
                    active ? styles.filterChipActive : styles.filterChipInactive,
                  ]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.filterText, active ? styles.filterTextActive : styles.filterTextInactive]}>
                    {filter} ({filterCounts[filter]})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {filteredOrders.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: card }]}>
              <Ionicons name="file-tray-outline" size={32} color="#ec4899" />
              <Text style={styles.emptyText}>No orders found for {selectedFilter}.</Text>
            </View>
          ) : null}
          {filteredOrders.map((order) => {
            const statusStyle = getStatusColors(order.status);
            return (
              <TouchableOpacity
                key={order.id} 
                style={[styles.card, { backgroundColor: card }]}
                onPress={() => openTimeline(order)}
                activeOpacity={0.7}
              > 
                <View style={styles.cardTop}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{order.tailorAvatar}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.orderName}>{order.name}</Text>
                    <Text style={styles.tailorName}>{order.tailor}</Text>
                  </View>
                  <View style={styles.priceWrap}>
                    <Text style={styles.priceLabel}>Total</Text>
                    <Text style={styles.priceText}>Rs. {order.price.toLocaleString()}</Text>
                  </View>
                </View>

                <View style={styles.compactMetaRow}>
                  <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[styles.statusText, { color: statusStyle.color }]}>{order.status}</Text>
                  </View>
                  <View style={styles.metaChip}>
                    <Ionicons name="calendar-outline" size={13} color="#be185d" />
                    <Text style={styles.metaChipText}>{order.date}</Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <View style={styles.samplePill}>
                    <Ionicons name="color-palette-outline" size={14} color="#be185d" />
                    <Text style={styles.samplePillText}>{order.sample.color} dress</Text>
                  </View>
                  <View style={styles.timelineHint}>
                    <Text style={styles.timelineHintText}>View timeline</Text>
                    <Ionicons name="chevron-forward" size={16} color="#ec4899" />
                  </View>
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
  container: { flex: 1, backgroundColor: SURFACE_MUTED },
  header: { paddingHorizontal: 18, paddingTop: Platform.select({ ios: 20, android: 12, default: 12 }), paddingBottom: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  backButton: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...UI.softShadow },
  headerSpacer: { width: 84 },
  headerTitleWrap: { flex: 1, alignItems: 'center' },
  title: { textAlign: 'center', fontSize: 23, fontWeight: '900', color: TEXT_DARK },
  subtitle: { color: '#6b7280', fontSize: 12, fontWeight: '600', marginTop: 3 },
  summaryCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#ec4899', borderRadius: UI.radius.xl, padding: 16, marginBottom: 16, ...UI.shadow },
  summaryIcon: { width: 54, height: 54, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' },
  summaryLabel: { color: '#ffe4f0', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryTitle: { color: '#fff', fontSize: 20, fontWeight: '900', marginTop: 2 },
  summaryText: { color: '#ffe4f0', fontSize: 12, marginTop: 3, fontWeight: '600' },
  filtersRow: { gap: 10, paddingRight: 12 },
  filterChip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1,
  },
  filterChipActive: { backgroundColor: '#111827', borderColor: '#111827' },
  filterChipInactive: { backgroundColor: '#fff', borderColor: '#fbcfe8' },
  filterText: { fontSize: 13, fontWeight: '800' },
  filterTextActive: { color: '#fff' },
  filterTextInactive: { color: '#4b5563' },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 18, paddingTop: 2, paddingBottom: 120 },
  emptyCard: { padding: 24, borderRadius: UI.radius.lg, borderWidth: 1, borderColor: '#f1dfe7', marginBottom: 12, alignItems: 'center', gap: 8 },
  emptyText: { color: '#6b7280', fontWeight: '600' },
  card: { padding: 15, borderRadius: UI.radius.lg, borderWidth: 1, borderColor: '#f1dfe7', marginBottom: 14, ...UI.softShadow },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 12 },
  avatar: { width: 46, height: 46, borderRadius: 16, backgroundColor: '#fdf2f8', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#be185d', fontWeight: '900', fontSize: 13 },
  orderName: { fontSize: 19, fontWeight: '900', color: TEXT_DARK },
  tailorName: { fontSize: 12, color: '#6b7280', marginTop: 3, fontWeight: '600' },
  priceWrap: { alignItems: 'flex-end' },
  priceLabel: { color: '#9ca3af', fontSize: 10, fontWeight: '800', marginBottom: 2 },
  priceText: { fontWeight: '900', fontSize: 15, color: '#111827' },
  compactMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999 },
  statusText: { fontSize: 12, fontWeight: '800' },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#fff7fb', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  metaChipText: { color: '#be185d', fontSize: 11, fontWeight: '800' },
  cardFooter: { marginTop: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  samplePill: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fdf2f8', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 8 },
  samplePillText: { color: '#be185d', fontSize: 11, fontWeight: '800' },
  timelineHint: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  timelineHintText: { color: '#ec4899', fontSize: 12, fontWeight: '900' },
});
