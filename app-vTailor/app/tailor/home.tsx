import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const orders = [
  {
    id: 'ORD001',
    customer: 'Ali Hassan',
    phone: '+92 300 1234567',
    garment: 'Formal Suit',
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
    customer: 'Zara Khan',
    phone: '+92 333 9876543',
    garment: 'Bridal Dress',
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
    customer: 'Usman Tariq',
    phone: '+92 321 5558899',
    garment: 'Kurta Pajama',
    status: 'ready',
    amount: 6500,
    timeLeft: 'Ready for pickup',
    penalty: 0,
    delivery: 'Jan 04 • Store Pickup',
    urgent: false,
    hasMeasurements: true,
  },
];

export default function TailorHome() {
  const { user } = useAuth();
  const router = useRouter();
  const card = useThemeColor({}, 'card');
  const inputBorder = useThemeColor({}, 'inputBorder');
  const tint = '#f9c8d8';

  const getStatusStyle = (status: string) => {
    if (status === 'ready') return { backgroundColor: '#ecfdf3', color: '#15803d' };
    if (status === 'pending') return { backgroundColor: '#fff7ed', color: '#c2410c' };
    return { backgroundColor: '#e0f2fe', color: '#075985' }; // in progress
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>
      <View style={[styles.headerWrap, { backgroundColor: tint }]}> 
        <View>
          <Text style={styles.welcome}>Welcome,</Text>
          <Text style={styles.name}>{user?.name || 'Sehrish Naseer'}</Text>
        </View>
        <Pressable style={styles.bellWrap} onPress={() => router.push('/tailor/notifications')}>
          <Ionicons name="notifications-outline" size={22} color="#111" />
          <View style={styles.badge}><Text style={styles.badgeText}>3</Text></View>
        </Pressable>
      </View>

      <View style={styles.quickRow}>
        <Pressable style={[styles.quickCard, { borderColor: inputBorder }]} onPress={() => router.push('/tailor/3d')}>
          <Text style={styles.quickIcon}>🧵</Text>
          <Text style={styles.quickLabel}>3D Review</Text>
        </Pressable>
        <Pressable style={[styles.quickCard, { borderColor: inputBorder }]} onPress={() => router.push('/tailor/measurements')}>
          <Text style={styles.quickIcon}>📏</Text>
          <Text style={styles.quickLabel}>Measurements</Text>
        </Pressable>
        <Pressable style={[styles.quickCard, { borderColor: inputBorder }]} onPress={() => router.push('/tailor/timeline')}>
          <Text style={styles.quickIcon}>⏱️</Text>
          <Text style={styles.quickLabel}>Stitching Timeline</Text>
        </Pressable>
      </View>

      <View style={styles.sectionHeader}>
        <ThemedText style={styles.sectionTitle}>Current Customers</ThemedText>
        <Pressable onPress={() => router.push('/tailor/orders')}><Text style={styles.link}>View all →</Text></Pressable>
      </View>

      {orders.slice(0, 2).map((order) => {
        const statusStyle = getStatusStyle(order.status);
        console.log('Order data:', { id: order.id, customer: order.customer, status: order.status });
        return (
          <Pressable key={order.id} style={[styles.orderCard, { backgroundColor: card, borderColor: order.urgent ? '#fca5a5' : inputBorder, shadowColor: '#000' }]}> 
            <View style={styles.orderRow}>
              <View style={styles.customerInfo}>
                <Text style={styles.customer}>{String(order.customer)}</Text>
                <Text style={styles.orderMeta}>{order.id}</Text>
              </View>

              <View style={[styles.statusPill, { backgroundColor: statusStyle.backgroundColor }]}>
                <Text style={[styles.statusText, { color: statusStyle.color }]}>{order.status}</Text>
              </View>

              <View style={styles.priceTimeWrapper}>
                <View style={styles.priceCol}>
                  <Text style={styles.label}>Price</Text>
                  <Text style={styles.amount}>Rs {order.amount.toLocaleString()}</Text>
                </View>
                <View style={styles.timeCol}>
                  <Text style={styles.label}>Time Left</Text>
                  <Text style={styles.time}>{order.timeLeft}</Text>
                </View>
              </View>
            </View>

            <View style={styles.detailsRow}>
              <View style={styles.detailCol}>
                <Text style={styles.label}>Garment</Text>
                <Text style={styles.detailValue}>{order.garment}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.label}>Contact</Text>
                <Text style={styles.detailValue}>{order.phone}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.label}>Penalty</Text>
                <Text style={[styles.detailValue, order.penalty ? styles.penalty : null]}>
                  {order.penalty ? `Rs ${order.penalty}` : 'None'}
                </Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.label}>Delivery</Text>
                <Text style={styles.detailValue}>{order.delivery}</Text>
              </View>
            </View>

            <View style={styles.actionsRow}>
              <Pressable style={styles.primaryBtn} onPress={() => router.push('/tailor/orders')}>
                <Text style={styles.primaryText}>Open Orders</Text>
              </Pressable>
              <Pressable
                style={[styles.secondaryBtn, { borderColor: inputBorder }]}
                onPress={() => router.push('/tailor/measurements')}
              >
                <Text style={styles.secondaryText}>
                  {order.hasMeasurements ? 'Measurements' : 'Take Measurements'}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        );
      })}

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 40, paddingHorizontal: 16, paddingTop: 20 },
  headerWrap: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  welcome: { color: '#4b5563', fontSize: 13, marginBottom: 4 },
  name: { color: '#111827', fontWeight: '800', fontSize: 20 },
  bellWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  quickRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  quickCard: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  quickIcon: { fontSize: 18, marginBottom: 6 },
  quickLabel: { fontWeight: '700', fontSize: 12, color: '#111827' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontWeight: '800', fontSize: 16 },
  link: { color: '#ec4899', fontWeight: '700', fontSize: 12 },
  orderCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  orderRow: { 
    flexDirection: 'row', 
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 10,
  },
  customerInfo: { 
    flex: 1,
    minWidth: 100,
    maxWidth: '60%',
  },
  customer: { fontSize: 16, fontWeight: '900', color: '#111827', letterSpacing: 0.3 },
  orderMeta: { color: '#6b7280', fontSize: 11, marginTop: 2 },
  statusPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, minWidth: 80, alignItems: 'center' },
  statusText: { fontWeight: '700', fontSize: 11, textTransform: 'capitalize' },
  priceTimeWrapper: { 
    flexDirection: 'row', 
    gap: 12,
    flex: 1,
    minWidth: 140,
  },
  priceCol: { 
    flex: 1,
    alignItems: 'flex-end',
  },
  timeCol: { 
    flex: 1,
    alignItems: 'flex-end',
  },
  label: { color: '#6b7280', fontSize: 10, fontWeight: '600', marginBottom: 2 },
  amount: { fontWeight: '800', fontSize: 14, color: '#111827' },
  time: { color: '#ef4444', fontWeight: '700', fontSize: 12 },
  detailsRow: { 
    flexDirection: 'row', 
    gap: 10,
    marginBottom: 12,
    justifyContent: 'space-between',
  },
  detailCol: { 
    flex: 1,
  },
  detailValue: { fontWeight: '700', fontSize: 12, color: '#111827' },
  penalty: { color: '#b91c1c' },
  actionsRow: { flexDirection: 'row', gap: 10 },
  primaryBtn: { flex: 1, backgroundColor: '#111827', paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  primaryText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  secondaryBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1, alignItems: 'center', backgroundColor: '#fff' },
  secondaryText: { fontWeight: '800', color: '#111827', fontSize: 12 },
});
