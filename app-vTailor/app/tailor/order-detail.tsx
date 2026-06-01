import React from 'react';
import { View, ScrollView, StyleSheet, Pressable, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import AppBackButton from '@/components/AppBackButton';
import { SURFACE_MUTED, TEXT_DARK, UI } from '@/constants/ui';

type OrderCustomization = {
  modelId: string;
  modelName: string;
  selections: Record<string, string | null>;
};

type SampleOrder = {
  id: string;
  customerId: number;
  customer: string;
  phone: string;
  garment: string;
  status: string;
  amount: number;
  timeLeft: string;
  penalty: number;
  delivery: string;
  deliveryDate: string;
  urgent: boolean;
  occasion: boolean;
  hasMeasurements: boolean;
  customization?: OrderCustomization;
};

const SAMPLE_ORDERS: SampleOrder[] = [
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
    customization: {
      modelId: 'long-frock',
      modelName: 'Long Frock',
      selections: {
        neck: 'v-neck',
        sleeves: 'bell',
        bottom: null,
        'frock-style': 'flared-bottom',
        colors: 'beige',
      },
    },
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
    customization: {
      modelId: 'sharara',
      modelName: 'Sharara',
      selections: {
        neck: 'round',
        sleeves: 'full',
        bottom: 'flared',
        'frock-style': null,
        colors: 'beige',
      },
    },
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
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: tint }]}>
          <AppBackButton onPress={handleBack} variant="tint" />
          <ThemedText style={[styles.headerTitle, { color: '#fff' }]}>Order Details</ThemedText>
          <ThemedText style={styles.headerSub}>Manage progress, measurements, and customer chat</ThemedText>
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
              <View style={styles.labelRow}><Ionicons name="shirt-outline" size={15} color={tint} /><Text style={styles.label}>Garment</Text></View>
              <Text style={styles.value}>{order.garment}</Text>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.labelRow}><Ionicons name="call-outline" size={15} color={tint} /><Text style={styles.label}>Customer Phone</Text></View>
              <Text style={styles.value}>{order.phone}</Text>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.labelRow}><Ionicons name="cube-outline" size={15} color={tint} /><Text style={styles.label}>Delivery</Text></View>
              <Text style={styles.value}>{order.delivery}</Text>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.labelRow}><Ionicons name="cash-outline" size={15} color={tint} /><Text style={styles.label}>Amount</Text></View>
              <Text style={styles.value}>Rs {order.amount.toLocaleString()}</Text>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.labelRow}><Ionicons name="time-outline" size={15} color={tint} /><Text style={styles.label}>Time Left</Text></View>
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
                onPress={() =>
                  router.push({
                    pathname: order.hasMeasurements ? '/tailor/measurement-detail' : '/tailor/measurements',
                    params: { orderId: order.id, customerName: order.customer },
                  })
                }>
                <Ionicons name="body" size={18} color="#111827" />
                <Text style={[styles.actionText, { color: '#111827' }]}>Measurements</Text>
              </Pressable>
              <Pressable style={[styles.actionBtn, { borderColor: '#ec4899', borderWidth: 1 }]}
                onPress={() => {
                  const c = order.customization;
                  const baseParams = {
                    orderId: order.id,
                    customerId: String(customerId),
                    customerName: order.customer,
                  };
                  if (c?.modelId && c.selections) {
                    router.push({
                      pathname: '/tailor/3d-view',
                      params: {
                        ...baseParams,
                        modelId: c.modelId,
                        modelName: c.modelName || order.garment,
                        selections: JSON.stringify(c.selections),
                      },
                    });
                  } else {
                    router.push({ pathname: '/tailor/3d-review' });
                  }
                }}>
                <Ionicons name="cube" size={18} color="#ec4899" />
                <Text style={[styles.actionText, { color: '#ec4899' }]}>3D Preview</Text>
              </Pressable>
            </View>
            <View style={[styles.actionsRow, { marginTop: 10 }]}>
              <Pressable style={[styles.actionBtn, { borderColor: '#ef4444', borderWidth: 1 }]}
                onPress={() =>
                  router.push({ pathname: '/tailor/timeline-detail', params: { orderId: order.id } })
                }>
                <Ionicons name="time" size={18} color="#ef4444" />
                <Text style={[styles.actionText, { color: '#ef4444' }]}>Timeline</Text>
              </Pressable>
              <Pressable style={[styles.actionBtn, { backgroundColor: '#111827' }]}
                onPress={() => router.push({ pathname: '/tailor/chat/[id]', params: { id: String(customerId), returnTo: '/tailor?tab=chat' } })}>
                <Ionicons name="chatbubbles" size={18} color="#fff" />
                <Text style={[styles.actionText, { color: '#fff' }]}>Chat</Text>
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
  container: { flex: 1, backgroundColor: SURFACE_MUTED },
  header: { paddingHorizontal: 16, paddingBottom: 18, paddingTop: 40, gap: 10 },
  headerTitle: { fontSize: 22, fontWeight: '900' },
  headerSub: { color: '#fff', opacity: 0.88, fontSize: 13, fontWeight: '600' },
  content: { padding: 16, paddingBottom: 120 },
  card: { padding: 16, borderRadius: 20, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 16, ...UI.softShadow },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  customer: { fontSize: 20, fontWeight: '900', color: TEXT_DARK },
  meta: { fontSize: 12, marginTop: 2 },
  statusPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  statusText: { fontWeight: '700', fontSize: 11 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, gap: 12 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1 },
  label: { fontSize: 13, color: '#6b7280', fontWeight: '600' },
  value: { fontSize: 13, fontWeight: '900', color: TEXT_DARK, flexShrink: 1, textAlign: 'right' },
  penalty: { color: '#b91c1c' },
  badgesRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  actionsCard: { padding: 16, borderRadius: 20, borderWidth: 1, borderColor: '#e5e7eb', ...UI.softShadow },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 12 },
  actionsRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, paddingVertical: 13, borderRadius: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  actionBtnWide: { flex: 1, paddingVertical: 13, borderRadius: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  actionText: { fontSize: 13, fontWeight: '800' },
});
