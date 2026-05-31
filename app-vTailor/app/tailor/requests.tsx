import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, View, ScrollView, Pressable, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import AppBackButton from '@/components/AppBackButton';
import { SURFACE_MUTED, TEXT_DARK, UI } from '@/constants/ui';
import { useAuth } from '@/contexts/AuthContext';
import { getOrders, acceptOrder, declineOrder, type Order as ApiOrder } from '@/services/ordersApi';

interface CustomerRequest {
  id: string;
  customerName: string;
  dressType: string;
  budget: number;
  submittedDate: string;
  status: 'pending' | 'accepted' | 'declined';
  initials: string;
}

const SAMPLE_REQUESTS: CustomerRequest[] = [
  {
    id: 'REQ-001',
    customerName: 'Fatima Khan',
    dressType: 'Long Frock',
    budget: 8500,
    submittedDate: '03 Jan 2026 • 2:30 PM',
    status: 'pending',
    initials: 'FK',
  },
  {
    id: 'REQ-002',
    customerName: 'Aisha Ahmed',
    dressType: 'Shalwar Kameez',
    budget: 6000,
    submittedDate: '02 Jan 2026 • 11:15 AM',
    status: 'pending',
    initials: 'AA',
  },
];

function relTime(iso: string): string {
  try {
    const d = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (d < 60)    return 'Just now';
    if (d < 3600)  return `${Math.floor(d / 60)} min ago`;
    if (d < 86400) return `${Math.floor(d / 3600)} hr ago`;
    return `${Math.floor(d / 86400)}d ago`;
  } catch { return ''; }
}

export default function TailorRequests() {
  const router = useRouter();
  const { token } = useAuth();
  const tint        = useThemeColor({}, 'tint');
  const card        = useThemeColor({}, 'card');
  const inputBorder = useThemeColor({}, 'inputBorder');
  const muted       = useThemeColor({}, 'muted');

  const [sampleRequests, setSampleRequests] = useState<CustomerRequest[]>(SAMPLE_REQUESTS);
  const [apiOrders, setApiOrders]           = useState<ApiOrder[]>([]);
  const [loadingApi, setLoadingApi]         = useState(false);

  const loadApiOrders = useCallback(async () => {
    if (!token) return;
    setLoadingApi(true);
    try {
      const data = await getOrders(token);
      setApiOrders(data);
    } catch {
      // silently show sample data only
    } finally {
      setLoadingApi(false);
    }
  }, [token]);

  useEffect(() => { loadApiOrders(); }, [loadApiOrders]);

  const handleApiAccept = (order: ApiOrder) => {
    Alert.prompt
      ? Alert.prompt(
          'Set Price',
          `Propose a price for "${order.description}"`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Accept',
              onPress: async (price?: string) => {
                if (!price || !token) return;
                try {
                  const updated = await acceptOrder(token, order.id, {
                    proposed_price: Number(price),
                    delivery_days: 7,
                  });
                  setApiOrders((prev) => prev.map((o) => (o.id === order.id ? updated : o)));
                } catch (e: any) {
                  Alert.alert('Error', e?.message || 'Failed to accept');
                }
              },
            },
          ],
          'plain-text',
          String(order.budget)
        )
      : (router as any).push({
          pathname: '/tailor/decided-price',
          params: { orderId: order.id, customerName: order.customer_name, price: String(order.budget) },
        });
  };

  const handleApiDecline = async (order: ApiOrder) => {
    if (!token) return;
    Alert.alert('Decline Order', `Decline "${order.description}" from ${order.customer_name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Decline',
        style: 'destructive',
        onPress: async () => {
          try {
            const updated = await declineOrder(token, order.id);
            setApiOrders((prev) => prev.map((o) => (o.id === order.id ? updated : o)));
          } catch (e: any) {
            Alert.alert('Error', e?.message || 'Failed to decline');
          }
        },
      },
    ]);
  };

  const handleSampleAccept = (reqId: string) => {
    const req = sampleRequests.find((r) => r.id === reqId);
    if (req) {
      (router as any).push({ pathname: '/tailor/decided-price', params: { orderId: req.id, customerName: req.customerName, price: String(req.budget) } });
      setSampleRequests((prev) => prev.map((r) => (r.id === reqId ? { ...r, status: 'accepted' as const } : r)));
    }
  };

  const handleSampleDecline = (reqId: string) => {
    setSampleRequests((prev) => prev.map((r) => (r.id === reqId ? { ...r, status: 'declined' as const } : r)));
  };

  const pendingApi       = apiOrders.filter((o) => o.status === 'pending');
  const processedApi     = apiOrders.filter((o) => o.status !== 'pending');
  const pendingSamples   = sampleRequests.filter((r) => r.status === 'pending');
  const processedSamples = sampleRequests.filter((r) => r.status !== 'pending');

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { backgroundColor: tint }]}>
        <AppBackButton onPress={() => (router as any).back()} variant="tint" />
        <ThemedText style={styles.headerTitle}>Customer Requests</ThemedText>
        <ThemedText style={styles.headerSub}>Review new orders and respond quickly</ThemedText>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* ── Real API Pending Requests ─────────────────────────────────── */}
        {loadingApi && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <ActivityIndicator size="small" color={tint} />
            <ThemedText style={{ color: muted }}>Loading requests…</ThemedText>
          </View>
        )}

        {pendingApi.length > 0 && (
          <View>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>New Requests</ThemedText>
              <View style={[styles.badge, { backgroundColor: '#059669' }]}>
                <ThemedText style={styles.badgeText}>{pendingApi.length}</ThemedText>
              </View>
            </View>
            {pendingApi.map((order) => (
              <View key={order.id} style={[styles.requestCard, { backgroundColor: card, borderColor: '#bbf7d0' }]}>
                <View style={styles.requestHeader}>
                  <View style={styles.customerInfo}>
                    <View style={[styles.customerAvatar, { backgroundColor: '#d1fae5' }]}>
                      <ThemedText style={[styles.customerAvatarText, { color: '#059669' }]}>
                        {order.customer_name.charAt(0).toUpperCase()}
                      </ThemedText>
                    </View>
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <ThemedText style={styles.customerName}>{order.customer_name}</ThemedText>
                      <ThemedText style={[styles.small, { color: muted }]}>{order.description}</ThemedText>
                    </View>
                  </View>
                </View>
                <View style={styles.detailsRow}>
                  <View style={styles.detailItem}>
                    <ThemedText style={[styles.label, { color: muted }]}>Budget</ThemedText>
                    <View style={styles.detailValueRow}>
                      <Ionicons name="cash-outline" size={16} color="#059669" />
                      <ThemedText style={styles.value}>Rs {order.budget.toLocaleString()}</ThemedText>
                    </View>
                  </View>
                  <View style={styles.detailItem}>
                    <ThemedText style={[styles.label, { color: muted }]}>Received</ThemedText>
                    <View style={styles.detailValueRow}>
                      <Ionicons name="time-outline" size={15} color={muted} />
                      <ThemedText style={[styles.small, { color: muted }]}>{relTime(order.created_at)}</ThemedText>
                    </View>
                  </View>
                </View>
                <View style={[styles.actionButtons, { borderTopColor: inputBorder }]}>
                  <Pressable onPress={() => handleApiDecline(order)} style={[styles.declineBtn, { borderColor: '#dc2626' }]}>
                    <Ionicons name="close" size={18} color="#dc2626" />
                    <ThemedText style={[styles.btnText, { color: '#dc2626' }]}>Decline</ThemedText>
                  </Pressable>
                  <Pressable onPress={() => handleApiAccept(order)} style={[styles.acceptBtn, { backgroundColor: '#059669' }]}>
                    <Ionicons name="checkmark" size={18} color="#fff" />
                    <ThemedText style={[styles.btnText, { color: '#fff' }]}>Accept</ThemedText>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Processed real orders */}
        {processedApi.length > 0 && (
          <View style={{ marginTop: 12 }}>
            {processedApi.map((order) => (
              <View key={order.id} style={[
                styles.requestCard, styles.processedCard,
                { backgroundColor: order.status === 'accepted' ? '#ecfdf5' : '#fff1f2',
                  borderColor: order.status === 'accepted' ? '#059669' : '#dc2626' }
              ]}>
                <View style={styles.requestHeader}>
                  <View style={styles.customerInfo}>
                    <View style={[styles.customerAvatar, { backgroundColor: '#FCE4F2' }]}>
                      <ThemedText style={[styles.customerAvatarText, { color: tint }]}>
                        {order.customer_name.charAt(0).toUpperCase()}
                      </ThemedText>
                    </View>
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <ThemedText style={styles.customerName}>{order.customer_name}</ThemedText>
                      <ThemedText style={[styles.small, { color: muted }]}>{order.description}</ThemedText>
                    </View>
                  </View>
                  <View style={styles.statusBadge}>
                    <Ionicons
                      name={order.status === 'accepted' ? 'checkmark-circle' : 'close-circle'}
                      size={20}
                      color={order.status === 'accepted' ? '#059669' : '#dc2626'}
                    />
                    <ThemedText style={[styles.statusText, { color: order.status === 'accepted' ? '#059669' : '#dc2626' }]}>
                      {order.status === 'accepted' ? 'Accepted' : 'Declined'}
                    </ThemedText>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── Sample Pending Requests ───────────────────────────────────── */}
        <View style={{ marginTop: 20 }}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Sample Requests</ThemedText>
            <View style={[styles.badge, { backgroundColor: '#7c3aed' }]}>
              <ThemedText style={styles.badgeText}>{pendingSamples.length}</ThemedText>
            </View>
            <View style={[styles.demoPill]}>
              <ThemedText style={styles.demoPillText}>Demo</ThemedText>
            </View>
          </View>

          {pendingSamples.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: card }]}>
              <View style={[styles.emptyIcon, { backgroundColor: '#FCE4F2' }]}>
                <Ionicons name="file-tray-outline" size={26} color={tint} />
              </View>
              <ThemedText style={{ fontWeight: '600', marginBottom: 4 }}>No Pending Sample Requests</ThemedText>
            </View>
          ) : (
            pendingSamples.map((request) => (
              <View key={request.id} style={[styles.requestCard, { backgroundColor: card, borderColor: inputBorder }]}>
                <View style={styles.requestHeader}>
                  <View style={styles.customerInfo}>
                    <View style={[styles.customerAvatar, { backgroundColor: '#FCE4F2' }]}>
                      <ThemedText style={[styles.customerAvatarText, { color: tint }]}>{request.initials}</ThemedText>
                    </View>
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <ThemedText style={styles.customerName}>{request.customerName}</ThemedText>
                      <ThemedText style={[styles.small, { color: muted }]}>{request.dressType}</ThemedText>
                    </View>
                  </View>
                </View>
                <View style={styles.detailsRow}>
                  <View style={styles.detailItem}>
                    <ThemedText style={[styles.label, { color: muted }]}>Budget</ThemedText>
                    <View style={styles.detailValueRow}>
                      <Ionicons name="cash-outline" size={16} color={tint} />
                      <ThemedText style={styles.value}>Rs {request.budget.toLocaleString()}</ThemedText>
                    </View>
                  </View>
                  <View style={styles.detailItem}>
                    <ThemedText style={[styles.label, { color: muted }]}>Requested</ThemedText>
                    <View style={styles.detailValueRow}>
                      <Ionicons name="time-outline" size={15} color={muted} />
                      <ThemedText style={[styles.small, { color: muted, flex: 1 }]}>{request.submittedDate}</ThemedText>
                    </View>
                  </View>
                </View>
                <View style={[styles.actionButtons, { borderTopColor: inputBorder }]}>
                  <Pressable onPress={() => handleSampleDecline(request.id)} style={[styles.declineBtn, { borderColor: '#dc2626' }]}>
                    <Ionicons name="close" size={18} color="#dc2626" />
                    <ThemedText style={[styles.btnText, { color: '#dc2626' }]}>Decline</ThemedText>
                  </Pressable>
                  <Pressable onPress={() => handleSampleAccept(request.id)} style={[styles.acceptBtn, { backgroundColor: tint }]}>
                    <Ionicons name="checkmark" size={18} color="#fff" />
                    <ThemedText style={[styles.btnText, { color: '#fff' }]}>Accept</ThemedText>
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Processed sample requests */}
        {processedSamples.length > 0 && (
          <View style={{ marginTop: 12 }}>
            {processedSamples.map((request) => (
              <View key={request.id} style={[
                styles.requestCard, styles.processedCard,
                { backgroundColor: request.status === 'accepted' ? '#ecfdf5' : '#fff1f2',
                  borderColor: request.status === 'accepted' ? '#059669' : '#dc2626' }
              ]}>
                <View style={styles.requestHeader}>
                  <View style={styles.customerInfo}>
                    <View style={[styles.customerAvatar, { backgroundColor: '#FCE4F2' }]}>
                      <ThemedText style={[styles.customerAvatarText, { color: tint }]}>{request.initials}</ThemedText>
                    </View>
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <ThemedText style={styles.customerName}>{request.customerName}</ThemedText>
                      <ThemedText style={[styles.small, { color: muted }]}>{request.dressType}</ThemedText>
                    </View>
                  </View>
                  <View style={styles.statusBadge}>
                    <Ionicons
                      name={request.status === 'accepted' ? 'checkmark-circle' : 'close-circle'}
                      size={20}
                      color={request.status === 'accepted' ? '#059669' : '#dc2626'}
                    />
                    <ThemedText style={[styles.statusText, { color: request.status === 'accepted' ? '#059669' : '#dc2626' }]}>
                      {request.status === 'accepted' ? 'Accepted' : 'Declined'}
                    </ThemedText>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SURFACE_MUTED },
  header: {
    paddingTop: 40,
    paddingHorizontal: 16,
    paddingBottom: 18,
    gap: 10,
  },
  headerTitle: { color: '#fff', fontWeight: '900', fontSize: 22 },
  headerSub: { color: '#fff', opacity: 0.88, fontSize: 13, fontWeight: '600' },
  scroll: { padding: 16, paddingBottom: 120 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: '900', color: TEXT_DARK },
  badge: { marginLeft: 12, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: '#fff', fontWeight: '600', fontSize: 12 },
  emptyState: {
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
    ...UI.softShadow,
  },
  emptyIcon: { width: 58, height: 58, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyText: { fontSize: 12, textAlign: 'center' },
  requestCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    ...UI.softShadow,
  },
  processedCard: { opacity: 0.7 },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerInfo: { flexDirection: 'row', flex: 1, alignItems: 'center' },
  customerAvatar: { width: 48, height: 48, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  customerAvatarText: { fontSize: 15, fontWeight: '900' },
  customerName: { fontSize: 15, fontWeight: '900', color: TEXT_DARK },
  small: { fontSize: 12, marginTop: 2 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: { marginLeft: 6, fontWeight: '600', fontSize: 12 },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  detailItem: { flex: 1 },
  label: { fontSize: 11 },
  detailValueRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 },
  value: { fontSize: 14, fontWeight: '900', color: TEXT_DARK },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  declineBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderWidth: 1.5,
    borderRadius: 14,
    marginRight: 8,
  },
  acceptBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 14,
  },
  btnText: { marginLeft: 6, fontWeight: '600', fontSize: 12 },
  demoPill: { marginLeft: 8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, backgroundColor: '#f3e8ff' },
  demoPillText: { fontSize: 10, fontWeight: '700', color: '#7c3aed' },
});
