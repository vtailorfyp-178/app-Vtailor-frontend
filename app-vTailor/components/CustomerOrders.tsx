import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { ThemedText } from './themed-text';

const CustomerOrders = () => {
  const stats = [
    { icon: '📦', label: 'Total', value: 8 },
    { icon: '⏳', label: 'In Progress', value: 2 },
    { icon: '✅', label: 'Delivered', value: 5 },
    { icon: '❌', label: 'Cancelled', value: 1 },
  ];

  const orders = [
    { id: 1, name: 'Long Frock', tailor: 'Ahmad Tailor', status: 'In Progress', date: '25 Dec', price: 8500 },
    { id: 2, name: 'Shalwar Kameez', tailor: 'Master Tailors', status: 'Cutting', date: '20 Dec', price: 25000 },
    { id: 3, name: 'Kurti', tailor: 'Classic Stitches', status: 'Delivered', date: '15 Dec', price: 3500 },
    { id: 4, name: 'Lehenga', tailor: 'Ahmad Tailor', status: 'Delivered', date: '10 Dec', price: 6000 },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered': return '#14b8a6';
      case 'In Progress':
      case 'Cutting': return '#f59e0b';
      case 'Cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerSection}>
        <ThemedText style={styles.headerTitle}>My Orders</ThemedText>
        <View style={styles.statsGrid}>
          {stats.map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <ThemedText style={styles.statIcon}>{stat.icon}</ThemedText>
              <ThemedText style={styles.statValue}>{stat.value}</ThemedText>
              <ThemedText style={styles.statLabel}>{stat.label}</ThemedText>
            </View>
          ))}
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.ordersList}>
          {orders.map((order) => (
            <View key={order.id} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View>
                  <ThemedText style={styles.orderName}>{order.name}</ThemedText>
                  <ThemedText style={styles.orderTailor}>{order.tailor}</ThemedText>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
                  <ThemedText style={[styles.statusText, { color: getStatusColor(order.status) }]}>{order.status}</ThemedText>
                </View>
              </View>
              <View style={styles.orderFooter}>
                <ThemedText style={styles.orderDate}>{order.date}</ThemedText>
                <ThemedText style={styles.orderPrice}>Rs. {order.price.toLocaleString()}</ThemedText>
              </View>
            </View>
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
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  statCard: { flex: 1, alignItems: 'center', padding: 12 },
  statIcon: { fontSize: 24, marginBottom: 6 },
  statValue: { fontSize: 16, fontWeight: '700' },
  statLabel: { fontSize: 9, color: '#6b7280', marginTop: 4 },
  scrollView: { flex: 1 },
  ordersList: { paddingHorizontal: 16, paddingTop: 16, gap: 10 },
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
