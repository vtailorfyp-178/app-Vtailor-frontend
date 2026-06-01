import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ThemedText } from '@/components/themed-text';
import { SURFACE_MUTED, TEXT_DARK, UI } from '@/constants/ui';
import AppBackButton from '@/components/AppBackButton';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DEMO_CUSTOMER_ORDERS, dressPreviewFromOrderDescription } from '@/services/orderDressPreview';
import { useAuth } from '@/contexts/AuthContext';
import { getOrders, confirmOrder, rejectPrice, type Order as ApiOrder } from '@/services/ordersApi';

type OrderStatusFilter = 'All' | 'Active' | 'Delivered' | 'Canceled';

const orders = DEMO_CUSTOMER_ORDERS.map((o) => ({
  id: o.id,
  name: o.name,
  tailorId: o.tailorId,
  tailor: o.tailor,
  tailorPhone: o.tailorPhone,
  tailorAvatar: o.tailorAvatar,
  rating: o.rating,
  status: o.status,
  date: o.date,
  price: o.price,
  sample: o.sample,
}));

const FILTERS: OrderStatusFilter[] = ['All', 'Active', 'Delivered', 'Canceled'];

// Status helpers shared for both sample and real orders
const getStatusColors = (status: string) => {
  switch (status) {
    case 'Delivered':      return { bg: '#ecfdf5', color: '#059669' };
    case 'In Progress':    return { bg: '#e0f2fe', color: '#0e7490' };
    case 'Cutting':        return { bg: '#fffbeb', color: '#b45309' };
    case 'Canceled':
    case 'declined':       return { bg: '#fee2e2', color: '#dc2626' };
    case 'pending':        return { bg: '#fef3c7', color: '#b45309' };
    case 'accepted':
    case 'confirmed':      return { bg: '#ecfdf5', color: '#059669' };
    case 'price_proposed': return { bg: '#fff7ed', color: '#c2410c' };
    default:               return { bg: '#f3f4f6', color: '#6b7280' };
  }
};

function apiStatusLabel(s: string) {
  if (s === 'pending')        return 'Pending';
  if (s === 'accepted')       return 'Accepted';
  if (s === 'declined')       return 'Declined';
  if (s === 'price_proposed') return 'Price Proposed';
  if (s === 'confirmed')      return 'Confirmed ✓';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function isActiveStatus(s: string) {
  return s === 'In Progress' || s === 'Cutting' || s === 'pending' || s === 'accepted' || s === 'price_proposed' || s === 'confirmed';
}
function isDeliveredStatus(s: string) {
  return s === 'Delivered';
}
function isCanceledStatus(s: string) {
  return s === 'Canceled' || s === 'declined';
}

export default function CustomerOrders() {
  const bg   = useThemeColor({}, 'background');
  const card = useThemeColor({}, 'card');
  const muted = useThemeColor({}, 'muted');
  const tint = useThemeColor({}, 'tint');
  const router = useRouter();
  const { token } = useAuth();

  const [selectedFilter, setSelectedFilter] = useState<OrderStatusFilter>('All');
  const [apiOrders, setApiOrders]   = useState<ApiOrder[]>([]);
  const [loadingApi, setLoadingApi] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadApiOrders = useCallback(async () => {
    if (!token) return;
    setLoadingApi(true);
    try {
      const data = await getOrders(token);
      setApiOrders(data);
    } catch {
      // silently fall through to sample data
    } finally {
      setLoadingApi(false);
    }
  }, [token]);

  useEffect(() => { loadApiOrders(); }, [loadApiOrders]);

  const handleConfirm = async (order: ApiOrder) => {
    if (!token) return;
    Alert.alert(
      'Approve Price',
      `Approve Rs. ${order.proposed_price?.toLocaleString()} for "${order.description}"?\n\nThis will confirm the order.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            setActionLoading(order.id);
            try {
              const updated = await confirmOrder(token, order.id);
              setApiOrders((prev) => prev.map((o) => (o.id === order.id ? updated : o)));
              Alert.alert('Order Confirmed!', 'The tailor has been notified. Your order is now placed.');
            } catch (e: any) {
              Alert.alert('Error', e?.message || 'Failed to confirm order');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const handleRejectPrice = async (order: ApiOrder) => {
    if (!token) return;
    Alert.alert(
      'Reject Price',
      `Reject the Rs. ${order.proposed_price?.toLocaleString()} proposal for "${order.description}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(order.id);
            try {
              const updated = await rejectPrice(token, order.id);
              setApiOrders((prev) => prev.map((o) => (o.id === order.id ? updated : o)));
            } catch (e: any) {
              Alert.alert('Error', e?.message || 'Failed to reject price');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  // ── sample orders filter ────────────────────────────────────────────────────
  const filteredSamples = useMemo(() => {
    if (selectedFilter === 'All')       return orders;
    if (selectedFilter === 'Active')    return orders.filter((o) => isActiveStatus(o.status));
    if (selectedFilter === 'Delivered') return orders.filter((o) => isDeliveredStatus(o.status));
    return orders.filter((o) => isCanceledStatus(o.status));
  }, [selectedFilter]);

  // ── api orders filter ───────────────────────────────────────────────────────
  const filteredApi = useMemo(() => {
    if (selectedFilter === 'All')       return apiOrders;
    if (selectedFilter === 'Active')    return apiOrders.filter((o) => isActiveStatus(o.status));
    if (selectedFilter === 'Delivered') return apiOrders.filter((o) => isDeliveredStatus(o.status));
    return apiOrders.filter((o) => isCanceledStatus(o.status));
  }, [selectedFilter, apiOrders]);

  // ── filter counts (combined) ────────────────────────────────────────────────
  const allOrders  = [...apiOrders, ...orders];
  const filterCounts = useMemo<Record<OrderStatusFilter, number>>(() => ({
    All:       allOrders.length,
    Active:    allOrders.filter((o) => isActiveStatus(o.status)).length,
    Delivered: allOrders.filter((o) => isDeliveredStatus(o.status)).length,
    Canceled:  allOrders.filter((o) => isCanceledStatus(o.status)).length,
  }), [apiOrders]);

  const openTimeline = (order: (typeof orders)[number]) => {
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
        tailorAvatar: order.tailorAvatar,
        tailorRating: order.rating,
        statusLabel: order.status,
        sampleNeck: order.sample.neck,
        sampleSleeves: order.sample.sleeves,
        sampleStyle: order.sample.style,
        sampleColor: order.sample.color,
        ...(preview
          ? { modelId: preview.modelId, selections: JSON.stringify(preview.selections) }
          : {}),
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

          {/* ── Real API Orders ──────────────────────────────────────────── */}
          {loadingApi && (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={tint} />
              <Text style={[styles.emptyText, { marginLeft: 8 }]}>Loading your orders…</Text>
            </View>
          )}

          {!loadingApi && filteredApi.length > 0 && (
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionPill, { backgroundColor: tint }]}>
                <Ionicons name="checkmark-circle" size={13} color="#fff" />
                <Text style={styles.sectionPillText}>My Orders</Text>
              </View>
            </View>
          )}

          {filteredApi.map((order) => {
            const s = getStatusColors(order.status);
            const isPriceProposed = order.status === 'price_proposed';
            const isActioning = actionLoading === order.id;
            return (
              <View key={order.id} style={[
                styles.card,
                { backgroundColor: card, borderColor: isPriceProposed ? '#f97316' : '#d1fae5' },
              ]}>
                {isPriceProposed && (
                  <View style={styles.priceProposedBanner}>
                    <Ionicons name="pricetag" size={14} color="#c2410c" />
                    <Text style={styles.priceProposedBannerText}>
                      Tailor proposed a new price — action required!
                    </Text>
                  </View>
                )}
                <View style={styles.cardTop}>
                  <View style={[styles.avatar, { backgroundColor: isPriceProposed ? '#fff7ed' : '#d1fae5' }]}>
                    <Text style={[styles.avatarText, { color: isPriceProposed ? '#c2410c' : '#059669' }]}>
                      {order.tailor_name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.orderName}>{order.description}</Text>
                    <Text style={styles.tailorName}>{order.tailor_name}</Text>
                  </View>
                  <View style={styles.priceWrap}>
                    <Text style={styles.priceLabel}>Budget</Text>
                    <Text style={styles.priceText}>Rs. {order.budget.toLocaleString()}</Text>
                  </View>
                </View>
                <View style={styles.compactMetaRow}>
                  <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
                    <Text style={[styles.statusText, { color: s.color }]}>{apiStatusLabel(order.status)}</Text>
                  </View>
                  {order.proposed_price != null && (
                    <View style={[styles.metaChip, isPriceProposed ? { backgroundColor: '#fff7ed' } : {}]}>
                      <Ionicons name="pricetag-outline" size={13} color={isPriceProposed ? '#c2410c' : '#059669'} />
                      <Text style={[styles.metaChipText, { color: isPriceProposed ? '#c2410c' : '#059669' }]}>
                        Rs. {order.proposed_price.toLocaleString()}
                      </Text>
                    </View>
                  )}
                  {order.delivery_days != null && (
                    <View style={styles.metaChip}>
                      <Ionicons name="time-outline" size={13} color="#0e7490" />
                      <Text style={[styles.metaChipText, { color: '#0e7490' }]}>{order.delivery_days}d delivery</Text>
                    </View>
                  )}
                </View>
                {!!order.note && (
                  <Text style={[styles.tailorName, { marginTop: 4, fontStyle: 'italic' }]}>"{order.note}"</Text>
                )}

                {/* Approve / Reject buttons for price_proposed orders */}
                {isPriceProposed && (
                  <View style={styles.priceActionRow}>
                    <TouchableOpacity
                      onPress={() => handleRejectPrice(order)}
                      disabled={isActioning}
                      style={styles.rejectPriceBtn}
                      activeOpacity={0.7}
                    >
                      {isActioning
                        ? <ActivityIndicator size="small" color="#dc2626" />
                        : <>
                            <Ionicons name="close-circle-outline" size={18} color="#dc2626" />
                            <Text style={styles.rejectPriceBtnText}>Reject</Text>
                          </>
                      }
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleConfirm(order)}
                      disabled={isActioning}
                      style={styles.approvePriceBtn}
                      activeOpacity={0.7}
                    >
                      {isActioning
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <>
                            <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                            <Text style={styles.approvePriceBtnText}>Approve</Text>
                          </>
                      }
                    </TouchableOpacity>
                  </View>
                )}

                {order.status === 'confirmed' && (
                  <View style={styles.confirmedRow}>
                    <Ionicons name="checkmark-circle" size={16} color="#059669" />
                    <Text style={{ color: '#059669', fontWeight: '700', fontSize: 12 }}>
                      Order placed at Rs. {order.proposed_price?.toLocaleString() ?? order.budget.toLocaleString()}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}

          {/* ── Sample/Demo Orders ───────────────────────────────────────── */}
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionPill, { backgroundColor: '#f3e8ff' }]}>
              <Ionicons name="flask-outline" size={13} color="#7c3aed" />
              <Text style={[styles.sectionPillText, { color: '#7c3aed' }]}>Sample Orders</Text>
            </View>
          </View>

          {filteredSamples.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: card }]}>
              <Ionicons name="file-tray-outline" size={32} color="#ec4899" />
              <Text style={styles.emptyText}>No sample orders match this filter.</Text>
            </View>
          ) : null}

          {filteredSamples.map((order) => {
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
                    <Text style={[styles.tailorName, { color: tint }]}>{order.tailor}</Text>
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
  tailorName: { fontSize: 12, marginTop: 3, fontWeight: '700' },
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
  loadingRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  sectionHeader: { marginBottom: 8, marginTop: 4 },
  sectionPill: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  sectionPillText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  priceProposedBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#fff7ed', borderRadius: 8, padding: 8, marginBottom: 10,
  },
  priceProposedBannerText: { color: '#c2410c', fontSize: 12, fontWeight: '700', flex: 1 },
  priceActionRow: {
    flexDirection: 'row', gap: 8, marginTop: 12, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: '#fed7aa',
  },
  rejectPriceBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: 11, borderRadius: 12, borderWidth: 1.5, borderColor: '#dc2626',
  },
  rejectPriceBtnText: { color: '#dc2626', fontWeight: '700', fontSize: 13 },
  approvePriceBtn: {
    flex: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: 11, borderRadius: 12, backgroundColor: '#059669',
  },
  approvePriceBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  confirmedRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#f0fdf4', borderRadius: 8, padding: 8, marginTop: 8,
  },
})
