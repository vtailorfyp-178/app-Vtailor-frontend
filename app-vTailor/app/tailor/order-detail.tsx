import React from 'react';
import { View, ScrollView, StyleSheet, Pressable, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ProtectedRoute } from '@/components/ProtectedRoute';

const SAMPLE_ORDERS = [
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
    deliveryDate: '2026-01-12',
    urgent: false,
    occasion: false,
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
    deliveryDate: '2026-01-06',
    urgent: true,
    occasion: true,
    hasMeasurements: false,
  },
  {
    id: 'ORD003',
    customerId: 5,
    customer: 'Usman Tariq',
    phone: '+92 321 5558899',
    garment: 'Sharara',
    status: 'ready',
    amount: 6500,
    timeLeft: 'Ready for pickup',
    penalty: 0,
    delivery: 'Jan 04 • Store Pickup',
    deliveryDate: '2026-01-04',
    urgent: false,
    occasion: false,
    hasMeasurements: true,
  },
];

const getStatusStyle = (status: string) => {
  if (status === 'ready') return { bg: '#ecfdf3', color: '#15803d', label: 'Ready' };
  if (status === 'pending') return { bg: '#fff7ed', color: '#c2410c', label: 'Pending' };
  return { bg: '#e0f2fe', color: '#075985', label: 'In Progress' };
};

export default function OrderDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const orderId = (params.orderId as string) || '';
  const returnTo = typeof params.returnTo === 'string' ? params.returnTo : null;

  const card = useThemeColor({}, 'card');
  const tint = useThemeColor({}, 'tint');
  const muted = useThemeColor({}, 'muted');
  const bg = useThemeColor({}, 'background');

  const order = SAMPLE_ORDERS.find((o) => o.id === orderId) || SAMPLE_ORDERS[0];
  const statusStyle = getStatusStyle(order.status);
  const customerId = order.customerId ?? 1;

  const handleBack = () => {
    if (returnTo) {
      router.replace(returnTo as any);
      return;
    }
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/tailor/orders');
  };

  return (
    <ProtectedRoute requiredRole="tailor">
      <View style={[styles.container, { backgroundColor: bg }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: tint }]}>
          <Pressable onPress={handleBack} style={styles.headerButton}>
            <Ionicons name="chevron-back" size={26} color="#fff" />
          </Pressable>
          <ThemedText style={[styles.headerTitle, { color: '#fff' }]}>Order Details</ThemedText>
          <View style={styles.headerButton} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.card, { backgroundColor: card }]}
            >
            <View style={styles.topRow}>
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.customer}>{order.customer}</ThemedText>
                <ThemedText style={[styles.meta, { color: muted }]}>{order.id}</ThemedText>
              </View>
              <View style={[styles.statusPill, { backgroundColor: statusStyle.bg }]}>
                <Text style={[styles.statusText, { color: statusStyle.color }]}>{statusStyle.label}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Garment</Text>
              <Text style={styles.value}>{order.garment}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Customer Phone</Text>
              <Text style={styles.value}>{order.phone}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Delivery</Text>
              <Text style={styles.value}>{order.delivery}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Amount</Text>
              <Text style={styles.value}>Rs {order.amount.toLocaleString()}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Time Left</Text>
              <Text style={[styles.value, { color: '#ef4444' }]}>{order.timeLeft}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Penalty</Text>
              <Text style={[styles.value, order.penalty ? styles.penalty : null]}>
                {order.penalty ? `Rs ${order.penalty}` : 'None'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Measurements</Text>
              <Text style={styles.value}>{order.hasMeasurements ? 'Captured' : 'Not captured'}</Text>
            </View>
            <View style={styles.badgesRow}>
              {order.urgent ? (
                <View style={[styles.badge, { backgroundColor: '#fef2f2' }]}>
                  <Text style={[styles.badgeText, { color: '#b91c1c' }]}>Urgent</Text>
                </View>
              ) : null}
              {order.occasion ? (
                <View style={[styles.badge, { backgroundColor: '#fffbeb' }]}>
                  <Text style={[styles.badgeText, { color: '#d97706' }]}>Occasion</Text>
                </View>
              ) : null}
            </View>
          </View>

          <View style={[styles.actionsCard, { backgroundColor: card }]}
            >
            <ThemedText style={styles.sectionTitle}>Next Actions</ThemedText>
            <View style={styles.actionsRow}>
              <Pressable style={[styles.actionBtn, { borderColor: '#111827', borderWidth: 1 }]}
                onPress={() => router.push({ pathname: '/tailor/measurements', params: { customerId: String(customerId), orderId: order.id, customerName: order.customer } })}>
                <Ionicons name="body" size={18} color="#111827" />
                <Text style={[styles.actionText, { color: '#111827' }]}>Measurements</Text>
              </Pressable>
              <Pressable style={[styles.actionBtn, { borderColor: '#ec4899', borderWidth: 1 }]}
                onPress={() => router.push({ pathname: '/tailor/3d-view', params: { customerId: String(customerId), customerName: order.customer } })}>
                <Ionicons name="cube" size={18} color="#ec4899" />
                <Text style={[styles.actionText, { color: '#ec4899' }]}>3D Preview</Text>
              </Pressable>
            </View>
            <View style={[styles.actionsRow, { marginTop: 10 }]}>
              <Pressable style={[styles.actionBtnWide, { backgroundColor: '#111827' }]}
                onPress={() => router.push({ pathname: '/tailor/chat/[id]', params: { id: String(customerId), returnTo: '/tailor?tab=chat' } })}>
                <Ionicons name="chatbubbles" size={18} color="#fff" />
                <Text style={[styles.actionText, { color: '#fff' }]}>Open Chat</Text>
              </Pressable>
            </View>
          </View>

          <View style={{ height: 80 }} />
        </ScrollView>
      </View>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, paddingTop: 40 },
  headerButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '700' },
  content: { padding: 16 },
  card: { padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 16 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  customer: { fontSize: 18, fontWeight: '800', color: '#111827' },
  meta: { fontSize: 12, marginTop: 2 },
  statusPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  statusText: { fontWeight: '700', fontSize: 11 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  label: { fontSize: 13, color: '#6b7280', fontWeight: '600' },
  value: { fontSize: 13, fontWeight: '800', color: '#111827' },
  penalty: { color: '#b91c1c' },
  badgesRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  actionsCard: { padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#e5e7eb' },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 12 },
  actionsRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  actionBtnWide: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  actionText: { fontSize: 13, fontWeight: '800' },
});
