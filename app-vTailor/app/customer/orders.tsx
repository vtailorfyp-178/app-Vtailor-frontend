import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ThemedText } from '@/components/themed-text';
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
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.8}>
              <Ionicons name="arrow-back" size={26} color="#111827" />
            </TouchableOpacity>
            <ThemedText style={styles.title}>All Orders</ThemedText>
            <View style={styles.headerSpacer} />
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
                  <View style={{ flex: 1 }}>
                    <Text style={styles.orderName}>{order.name}</Text>
                    <Text style={styles.tailorName}>{order.tailor}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}> 
                    <Text style={[styles.statusText, { color: statusStyle.color }]}>{order.status}</Text>
                  </View>
                </View>

                <View style={styles.detailsRow}>
                  <View style={styles.detailColumn}>
                    <Text style={styles.detailLabel}>Price</Text>
                    <Text style={styles.priceText}>Rs. {order.price.toLocaleString()}</Text>
                  </View>
                  <View style={styles.detailColumn}>
                    <Text style={styles.detailLabel}>Date</Text>
                    <Text style={styles.dateText}>{order.date}</Text>
                  </View>
                  <View style={styles.detailColumn}>
                    <Text style={styles.detailLabel}>Contact</Text>
                    <Text style={styles.contactText}>{order.tailorPhone}</Text>
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
  container: { flex: 1 },
  header: { paddingHorizontal: 18, paddingTop: Platform.select({ ios: 64, android: 36, default: 36 }), paddingBottom: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backButton: { width: 46, height: 46, borderRadius: 12, backgroundColor: '#f5f5f5', alignItems: 'center', justifyContent: 'center' },
  headerSpacer: { width: 46 },
  title: { flex: 1, textAlign: 'center', fontSize: 22, fontWeight: '800', color: '#111827' },
  filtersRow: { gap: 16, paddingRight: 12 },
  filterChip: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  filterChipActive: { backgroundColor: '#111827' },
  filterChipInactive: { backgroundColor: '#f7f7f7' },
  filterText: { fontSize: 13, fontWeight: '800' },
  filterTextActive: { color: '#fff' },
  filterTextInactive: { color: '#4b5563' },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 18, paddingTop: 2, paddingBottom: 120 },
  emptyCard: { padding: 18, borderRadius: 14, borderWidth: 1, borderColor: '#f1dfe7', marginBottom: 12, alignItems: 'center' },
  emptyText: { color: '#6b7280', fontWeight: '600' },
  card: { padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#f1dfe7', marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  orderName: { fontSize: 20, fontWeight: '800', color: '#111827' },
  tailorName: { fontSize: 12, color: '#6b7280', marginTop: 3, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  statusText: { fontSize: 13, fontWeight: '800' },
  detailsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  detailColumn: { flex: 1 },
  detailLabel: { color: '#6b7280', fontSize: 12, fontWeight: '600', marginBottom: 5 },
  dateText: { color: '#be4b5b', fontWeight: '800', fontSize: 13 },
  priceText: { fontWeight: '900', fontSize: 17, color: '#111827' },
  contactText: { color: '#4b5563', fontWeight: '600', fontSize: 13 },
});
