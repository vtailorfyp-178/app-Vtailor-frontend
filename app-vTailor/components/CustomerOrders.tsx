import React, { useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Text } from 'react-native';
import { ThemedText } from './themed-text';
import { useRouter } from 'expo-router';

type OrderStatusFilter = 'All' | 'Active' | 'Delivered' | 'Canceled';

const FILTERS: OrderStatusFilter[] = ['All', 'Active', 'Delivered', 'Canceled'];

const orders = [
  { id: 1, name: 'Long Frock', tailor: 'Ahmad Tailor', status: 'In Progress', date: '25 Dec', price: 8500 },
  { id: 2, name: 'Shalwar Kameez', tailor: 'Master Tailors', status: 'Cutting', date: '20 Dec', price: 25000 },
  { id: 3, name: 'Kurti', tailor: 'Classic Stitches', status: 'Delivered', date: '15 Dec', price: 3500 },
  { id: 4, name: 'Lehenga', tailor: 'Ahmad Tailor', status: 'Delivered', date: '10 Dec', price: 6000 },
];

const CustomerOrders = () => {
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
      case 'Delivered': return '#14b8a6';
      case 'In Progress':
      case 'Cutting': return '#f59e0b';
      case 'Canceled':
      case 'Cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerSection}>
        <ThemedText style={styles.headerTitle}>My Orders</ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
          {FILTERS.map((filter) => {
            const active = selectedFilter === filter;
            return (
              <Pressable
                key={filter}
                onPress={() => setSelectedFilter(filter)}
                style={[styles.filterChip, active ? styles.filterChipActive : styles.filterChipInactive]}
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
            <Pressable key={order.id} style={styles.orderCard} onPress={() => router.push(`/customer/tailor-details?tailorId=${order.id}&from=orders`)}>
              <View style={styles.orderHeader}>
                <View style={{ flex: 1 }}>
                  <ThemedText style={styles.orderName}>{order.name}</ThemedText>
                  <Pressable onPress={() => router.push(`/customer/tailor-details?tailorId=${order.id}&from=orders`)}>
                    <ThemedText style={[styles.orderTailor, { color: '#3b82f6', fontWeight: '600' }]}>{order.tailor}</ThemedText>
                  </Pressable>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
                  <ThemedText style={[styles.statusText, { color: getStatusColor(order.status) }]}>{order.status}</ThemedText>
                </View>
              </View>
              <View style={styles.orderFooter}>
                <ThemedText style={styles.orderDate}>{order.date}</ThemedText>
                <ThemedText style={styles.orderPrice}>Rs. {order.price.toLocaleString()}</ThemedText>
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
  container: { flex: 1, backgroundColor: '#ffffff' },
  headerSection: { paddingHorizontal: 16, paddingTop: 40, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerTitle: { fontSize: 22, fontWeight: '700', marginBottom: 16 },
  filtersRow: { gap: 10, paddingRight: 16 },
  filterChip: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1 },
  filterChipActive: { backgroundColor: '#111827', borderColor: '#111827' },
  filterChipInactive: { backgroundColor: '#fff', borderColor: '#e5e7eb' },
  filterText: { fontSize: 12, fontWeight: '700' },
  filterTextActive: { color: '#fff' },
  filterTextInactive: { color: '#6b7280' },
  scrollView: { flex: 1 },
  ordersList: { paddingHorizontal: 16, paddingTop: 16, gap: 10 },
  emptyCard: { padding: 18, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center' },
  emptyText: { color: '#6b7280', fontWeight: '600' },
  orderCard: { padding: 14, backgroundColor: '#f9fafb', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  orderName: { fontSize: 14, fontWeight: '600' },
  orderTailor: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: '500' },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderDate: { fontSize: 12, color: '#6b7280' },
  orderPrice: { fontSize: 12, fontWeight: '600' },
  bottomPadding: { height: 100 },
});

export default CustomerOrders;
