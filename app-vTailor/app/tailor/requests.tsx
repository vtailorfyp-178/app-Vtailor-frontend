import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, View, ScrollView, Pressable,
  StyleSheet, Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import AppBackButton from '@/components/AppBackButton';
import { SURFACE_MUTED, TEXT_DARK, UI } from '@/constants/ui';
import { useAuth } from '@/contexts/AuthContext';
import {
  getOrders, acceptOrder, declineOrder, proposePrice,
  type Order as ApiOrder,
} from '@/services/ordersApi';

// ── Sample data ───────────────────────────────────────────────────────────────

interface SampleRequest {
  id: string;
  customerName: string;
  dressType: string;
  budget: number;
  submittedDate: string;
  status: 'pending' | 'accepted' | 'declined' | 'price_proposed';
  initials: string;
}

const SAMPLE_REQUESTS: SampleRequest[] = [
  {
    id: 'REQ-001', customerName: 'Fatima Khan', dressType: 'Long Frock',
    budget: 8500, submittedDate: '03 Jan 2026 • 2:30 PM', status: 'pending', initials: 'FK',
  },
  {
    id: 'REQ-002', customerName: 'Aisha Ahmed', dressType: 'Shalwar Kameez',
    budget: 6000, submittedDate: '02 Jan 2026 • 11:15 AM', status: 'pending', initials: 'AA',
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

function statusColor(s: string) {
  if (s === 'accepted' || s === 'confirmed') return { bg: '#ecfdf5', color: '#059669', icon: 'checkmark-circle' as const };
  if (s === 'declined')  return { bg: '#fff1f2', color: '#dc2626', icon: 'close-circle' as const };
  if (s === 'price_proposed') return { bg: '#fef3c7', color: '#b45309', icon: 'pricetag' as const };
  return { bg: '#f3f4f6', color: '#6b7280', icon: 'time-outline' as const };
}

function statusLabel(s: string) {
  switch (s) {
    case 'pending':        return 'Pending';
    case 'accepted':       return 'Accepted';
    case 'declined':       return 'Declined';
    case 'price_proposed': return 'Price Proposed';
    case 'confirmed':      return 'Confirmed';
    default:               return s;
  }
}

// ── Propose Price Modal ───────────────────────────────────────────────────────

interface ProposePriceModalProps {
  visible: boolean;
  order: ApiOrder | null;
  onClose: () => void;
  onSubmit: (price: number, days: number, note: string) => void;
  submitting: boolean;
}

function ProposePriceModal({ visible, order, onClose, onSubmit, submitting }: ProposePriceModalProps) {
  const tint = useThemeColor({}, 'tint');
  const card = useThemeColor({}, 'card');
  const inputBorder = useThemeColor({}, 'inputBorder');
  const muted = useThemeColor({}, 'muted');

  const [price, setPrice] = useState('');
  const [days, setDays]   = useState('7');
  const [note, setNote]   = useState('');

  useEffect(() => {
    if (visible && order) {
      setPrice(String(order.budget));
      setDays('7');
      setNote('');
    }
  }, [visible, order]);

  const handleSubmit = () => {
    const p = Number(price);
    const d = Number(days);
    if (!p || p <= 0) { Alert.alert('Error', 'Enter a valid price'); return; }
    if (!d || d <= 0) { Alert.alert('Error', 'Enter valid delivery days'); return; }
    onSubmit(p, d, note.trim());
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={[styles.modalSheet, { backgroundColor: card }]}>
          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>Propose Your Price</ThemedText>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={24} color={muted} />
            </Pressable>
          </View>

          {order && (
            <View style={[styles.modalOrderInfo, { borderColor: inputBorder }]}>
              <ThemedText style={{ fontWeight: '700', fontSize: 14 }}>{order.customer_name}</ThemedText>
              <ThemedText style={{ color: muted, fontSize: 12, marginTop: 2 }}>{order.description}</ThemedText>
              <ThemedText style={{ color: '#059669', fontSize: 13, fontWeight: '700', marginTop: 4 }}>
                Customer budget: Rs. {order.budget.toLocaleString()}
              </ThemedText>
            </View>
          )}

          <ThemedText style={[styles.inputLabel, { color: muted }]}>Your Price (Rs.)</ThemedText>
          <TextInput
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
            placeholder="e.g. 9000"
            style={[styles.modalInput, { borderColor: inputBorder, color: TEXT_DARK }]}
            placeholderTextColor={muted}
          />

          <ThemedText style={[styles.inputLabel, { color: muted }]}>Delivery Days</ThemedText>
          <TextInput
            value={days}
            onChangeText={setDays}
            keyboardType="numeric"
            placeholder="e.g. 7"
            style={[styles.modalInput, { borderColor: inputBorder, color: TEXT_DARK }]}
            placeholderTextColor={muted}
          />

          <ThemedText style={[styles.inputLabel, { color: muted }]}>Note (optional)</ThemedText>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Any message for the customer…"
            multiline
            numberOfLines={2}
            style={[styles.modalInput, styles.modalTextArea, { borderColor: inputBorder, color: TEXT_DARK }]}
            placeholderTextColor={muted}
          />

          <View style={styles.modalActions}>
            <Pressable onPress={onClose} style={[styles.modalCancelBtn, { borderColor: inputBorder }]}>
              <ThemedText style={{ fontWeight: '600' }}>Cancel</ThemedText>
            </Pressable>
            <Pressable
              onPress={handleSubmit}
              disabled={submitting}
              style={[styles.modalSubmitBtn, { backgroundColor: tint }]}
            >
              {submitting
                ? <ActivityIndicator size="small" color="#fff" />
                : <ThemedText style={{ color: '#fff', fontWeight: '700' }}>Send Proposal</ThemedText>
              }
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function TailorRequests() {
  const router = useRouter();
  const { token } = useAuth();
  const tint        = useThemeColor({}, 'tint');
  const card        = useThemeColor({}, 'card');
  const inputBorder = useThemeColor({}, 'inputBorder');
  const muted       = useThemeColor({}, 'muted');

  const [sampleRequests, setSampleRequests] = useState<SampleRequest[]>(SAMPLE_REQUESTS);
  const [apiOrders, setApiOrders]           = useState<ApiOrder[]>([]);
  const [loadingApi, setLoadingApi]         = useState(false);
  const [proposeTarget, setProposeTarget]   = useState<ApiOrder | null>(null);
  const [proposing, setProposing]           = useState(false);

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

  // ── Tailor actions ──────────────────────────────────────────────────────────

  const handleAcceptAtBudget = async (order: ApiOrder) => {
    if (!token) return;
    Alert.alert(
      'Confirm Acceptance',
      `Accept "${order.description}" at customer's budget of Rs. ${order.budget.toLocaleString()}?\n\nDelivery will be 7 days by default.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            try {
              const updated = await acceptOrder(token, order.id, {
                proposed_price: order.budget,
                delivery_days: 7,
              });
              setApiOrders((prev) => prev.map((o) => (o.id === order.id ? updated : o)));
            } catch (e: any) {
              Alert.alert('Error', e?.message || 'Failed to accept');
            }
          },
        },
      ]
    );
  };

  const handleProposePriceSubmit = async (price: number, days: number, note: string) => {
    if (!token || !proposeTarget) return;
    setProposing(true);
    try {
      const updated = await proposePrice(token, proposeTarget.id, {
        proposed_price: price,
        delivery_days: days,
        note: note || undefined,
      });
      setApiOrders((prev) => prev.map((o) => (o.id === proposeTarget.id ? updated : o)));
      setProposeTarget(null);
      Alert.alert('Proposal Sent', 'Your price proposal has been sent to the customer.');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to send proposal');
    } finally {
      setProposing(false);
    }
  };

  const handleDecline = async (order: ApiOrder) => {
    if (!token) return;
    Alert.alert(
      'Decline Order',
      `Decline "${order.description}" from ${order.customer_name}?`,
      [
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
      ]
    );
  };

  const handleSampleAccept = (reqId: string) => {
    (router as any).push({
      pathname: '/tailor/decided-price',
      params: {
        orderId: reqId,
        customerName: SAMPLE_REQUESTS.find((r) => r.id === reqId)?.customerName,
        price: String(SAMPLE_REQUESTS.find((r) => r.id === reqId)?.budget),
      },
    });
    setSampleRequests((prev) =>
      prev.map((r) => (r.id === reqId ? { ...r, status: 'accepted' as const } : r))
    );
  };

  const handleSampleDecline = (reqId: string) => {
    setSampleRequests((prev) =>
      prev.map((r) => (r.id === reqId ? { ...r, status: 'declined' as const } : r))
    );
  };

  const pendingApi       = apiOrders.filter((o) => o.status === 'pending');
  const pendingSamples   = sampleRequests.filter((r) => r.status === 'pending');
  const processedApi     = apiOrders.filter((o) => o.status !== 'pending');
  const processedSamples = sampleRequests.filter((r) => r.status !== 'pending');

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { backgroundColor: tint }]}>
        <AppBackButton onPress={() => (router as any).back()} variant="tint" />
        <ThemedText style={styles.headerTitle}>Customer Requests</ThemedText>
        <ThemedText style={styles.headerSub}>Review orders and respond with a price</ThemedText>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* ── Loading ─────────────────────────────────────────────────────── */}
        {loadingApi && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <ActivityIndicator size="small" color={tint} />
            <ThemedText style={{ color: muted }}>Loading requests…</ThemedText>
          </View>
        )}

        {/* ── Real API — Pending ───────────────────────────────────────────── */}
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
                {/* Header row */}
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

                {/* Details */}
                <View style={styles.detailsRow}>
                  <View style={styles.detailItem}>
                    <ThemedText style={[styles.label, { color: muted }]}>Customer Budget</ThemedText>
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

                {/* 3-button action row */}
                <View style={[styles.actionButtons, { borderTopColor: inputBorder }]}>
                  <Pressable
                    onPress={() => handleDecline(order)}
                    style={[styles.declineBtn, { borderColor: '#dc2626' }]}
                  >
                    <Ionicons name="close" size={16} color="#dc2626" />
                    <ThemedText style={[styles.btnText, { color: '#dc2626' }]}>Decline</ThemedText>
                  </Pressable>

                  <Pressable
                    onPress={() => setProposeTarget(order)}
                    style={[styles.proposeBtn, { borderColor: '#b45309', backgroundColor: '#fef9c3' }]}
                  >
                    <Ionicons name="pricetag-outline" size={16} color="#b45309" />
                    <ThemedText style={[styles.btnText, { color: '#b45309' }]}>Negotiate</ThemedText>
                  </Pressable>

                  <Pressable
                    onPress={() => handleAcceptAtBudget(order)}
                    style={[styles.acceptBtn, { backgroundColor: '#059669' }]}
                  >
                    <Ionicons name="checkmark" size={16} color="#fff" />
                    <ThemedText style={[styles.btnText, { color: '#fff' }]}>Accept</ThemedText>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── Real API — Processed ─────────────────────────────────────────── */}
        {processedApi.length > 0 && (
          <View style={{ marginTop: 12 }}>
            <View style={styles.sectionHeader}>
              <ThemedText style={[styles.sectionTitle, { fontSize: 14 }]}>Responded</ThemedText>
            </View>
            {processedApi.map((order) => {
              const sc = statusColor(order.status);
              return (
                <View key={order.id} style={[
                  styles.requestCard, styles.processedCard,
                  { backgroundColor: sc.bg, borderColor: sc.color }
                ]}>
                  <View style={styles.requestHeader}>
                    <View style={styles.customerInfo}>
                      <View style={[styles.customerAvatar, { backgroundColor: `${sc.color}22` }]}>
                        <ThemedText style={[styles.customerAvatarText, { color: sc.color }]}>
                          {order.customer_name.charAt(0).toUpperCase()}
                        </ThemedText>
                      </View>
                      <View style={{ marginLeft: 12, flex: 1 }}>
                        <ThemedText style={styles.customerName}>{order.customer_name}</ThemedText>
                        <ThemedText style={[styles.small, { color: '#6b7280' }]}>{order.description}</ThemedText>
                      </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: `${sc.color}22` }]}>
                      <Ionicons name={sc.icon} size={18} color={sc.color} />
                      <ThemedText style={[styles.statusText, { color: sc.color }]}>
                        {statusLabel(order.status)}
                      </ThemedText>
                    </View>
                  </View>

                  {order.proposed_price != null && (
                    <View style={styles.proposedRow}>
                      <Ionicons name="pricetag-outline" size={14} color={sc.color} />
                      <ThemedText style={[styles.small, { color: sc.color, fontWeight: '700' }]}>
                        Your price: Rs. {order.proposed_price.toLocaleString()}
                        {order.delivery_days ? ` · ${order.delivery_days} days` : ''}
                      </ThemedText>
                    </View>
                  )}
                  {order.status === 'price_proposed' && (
                    <ThemedText style={[styles.small, { color: '#b45309', marginTop: 4 }]}>
                      Waiting for customer approval…
                    </ThemedText>
                  )}
                  {order.status === 'confirmed' && (
                    <ThemedText style={[styles.small, { color: '#059669', marginTop: 4, fontWeight: '700' }]}>
                      Order confirmed! Customer approved your price.
                    </ThemedText>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* ── Empty real state ──────────────────────────────────────────────── */}
        {!loadingApi && pendingApi.length === 0 && processedApi.length === 0 && (
          <View style={[styles.emptyState, { backgroundColor: card }]}>
            <View style={[styles.emptyIcon, { backgroundColor: '#FCE4F2' }]}>
              <Ionicons name="file-tray-outline" size={26} color={tint} />
            </View>
            <ThemedText style={{ fontWeight: '600', marginBottom: 4 }}>No real requests yet</ThemedText>
            <ThemedText style={{ color: muted, fontSize: 12, textAlign: 'center' }}>
              Customers who place orders will appear here.
            </ThemedText>
          </View>
        )}

        {/* ── Sample Requests ───────────────────────────────────────────────── */}
        <View style={{ marginTop: 24 }}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Sample Requests</ThemedText>
            <View style={[styles.badge, { backgroundColor: '#7c3aed' }]}>
              <ThemedText style={styles.badgeText}>{pendingSamples.length}</ThemedText>
            </View>
            <View style={styles.demoPill}>
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
                  <Pressable
                    onPress={() => handleSampleDecline(request.id)}
                    style={[styles.declineBtn, { borderColor: '#dc2626' }]}
                  >
                    <Ionicons name="close" size={16} color="#dc2626" />
                    <ThemedText style={[styles.btnText, { color: '#dc2626' }]}>Decline</ThemedText>
                  </Pressable>
                  <Pressable
                    onPress={() => handleSampleAccept(request.id)}
                    style={[styles.acceptBtn, { backgroundColor: tint, flex: 2 }]}
                  >
                    <Ionicons name="checkmark" size={16} color="#fff" />
                    <ThemedText style={[styles.btnText, { color: '#fff' }]}>Accept</ThemedText>
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Processed samples */}
        {processedSamples.length > 0 && (
          <View style={{ marginTop: 12 }}>
            {processedSamples.map((request) => {
              const sc = statusColor(request.status);
              return (
                <View key={request.id} style={[
                  styles.requestCard, styles.processedCard,
                  { backgroundColor: sc.bg, borderColor: sc.color }
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
                      <Ionicons name={sc.icon} size={20} color={sc.color} />
                      <ThemedText style={[styles.statusText, { color: sc.color }]}>
                        {statusLabel(request.status)}
                      </ThemedText>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* ── Propose Price Modal ───────────────────────────────────────────── */}
      <ProposePriceModal
        visible={proposeTarget !== null}
        order={proposeTarget}
        onClose={() => setProposeTarget(null)}
        onSubmit={handleProposePriceSubmit}
        submitting={proposing}
      />
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
    gap: 8,
  },
  sectionTitle: { fontSize: 17, fontWeight: '900', color: TEXT_DARK },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: '#fff', fontWeight: '600', fontSize: 12 },
  emptyState: {
    borderRadius: 12, padding: 32, alignItems: 'center', marginBottom: 16, ...UI.softShadow,
  },
  emptyIcon: { width: 58, height: 58, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  requestCard: {
    borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 12, ...UI.softShadow,
  },
  processedCard: { opacity: 0.82 },
  requestHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12,
  },
  customerInfo: { flexDirection: 'row', flex: 1, alignItems: 'center' },
  customerAvatar: { width: 48, height: 48, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  customerAvatarText: { fontSize: 15, fontWeight: '900' },
  customerName: { fontSize: 15, fontWeight: '900', color: TEXT_DARK },
  small: { fontSize: 12, marginTop: 2 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
  },
  statusText: { marginLeft: 4, fontWeight: '600', fontSize: 12 },
  detailsRow: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, gap: 12,
  },
  detailItem: { flex: 1 },
  label: { fontSize: 11 },
  detailValueRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 },
  value: { fontSize: 14, fontWeight: '900', color: TEXT_DARK },
  proposedRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  actionButtons: {
    flexDirection: 'row', marginTop: 12, paddingTop: 12, borderTopWidth: 1, gap: 6,
  },
  declineBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderWidth: 1.5, borderRadius: 14,
  },
  proposeBtn: {
    flex: 1.2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderWidth: 1.5, borderRadius: 14,
  },
  acceptBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: 14,
  },
  btnText: { marginLeft: 4, fontWeight: '700', fontSize: 11 },
  demoPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, backgroundColor: '#f3e8ff' },
  demoPillText: { fontSize: 10, fontWeight: '700', color: '#7c3aed' },
  // Modal styles
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '900', color: TEXT_DARK },
  modalOrderInfo: {
    borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 16,
  },
  inputLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  modalInput: {
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, marginBottom: 14,
  },
  modalTextArea: { height: 72, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  modalCancelBtn: {
    flex: 1, borderWidth: 1, borderRadius: 14, alignItems: 'center',
    justifyContent: 'center', paddingVertical: 14,
  },
  modalSubmitBtn: {
    flex: 2, borderRadius: 14, alignItems: 'center',
    justifyContent: 'center', paddingVertical: 14,
  },
});
