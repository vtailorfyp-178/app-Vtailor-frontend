import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { updateTailorAvailability, updateTailorLocation } from '@/services/tailorsApi';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

// Storage key used across wallet / penalty screens
const STORAGE_KEY = 'vtailor_penalty_orders';

// Sample orders. Add `deliveryDate` (ISO) for computed logic.
const orders = [
  {
    id: 'ORD001',
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

export default function TailorHome() {
  const { user, token, userRole } = useAuth();
  const router = useRouter();
  const card = useThemeColor({}, 'card');
  const inputBorder = useThemeColor({}, 'inputBorder');
  const tint = '#f9c8d8';
  const [penaltiesMap, setPenaltiesMap] = useState<Record<string, number>>({});
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [syncingPresence, setSyncingPresence] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);

  const getStatusStyle = (status: string) => {
    if (status === 'ready') return { backgroundColor: '#ecfdf3', color: '#15803d' };
    if (status === 'pending') return { backgroundColor: '#fff7ed', color: '#c2410c' };
    return { backgroundColor: '#e0f2fe', color: '#075985' }; // in progress
  };

  // compute per-order penalty and persist to AsyncStorage so wallet screens can pick it up
  useEffect(() => {
    (async () => {
      try {
        const today = new Date();
        const map: Record<string, number> = {};
        const persisted: Array<any> = [];

        orders.forEach((o) => {
          const delivery = o.deliveryDate ? new Date(o.deliveryDate) : null;
          if (!delivery) return;

          const msPerDay = 1000 * 60 * 60 * 24;
          const diff = Math.floor((today.getTime() - delivery.getTime()) / msPerDay);
          const daysLate = diff > 0 ? diff : 0;
          const penaltyRate = o.occasion ? 0.10 : 0.02; // 10% per day for occasion days, otherwise 2%
          const penaltyPerDay = penaltyRate * o.amount;
          const penaltyAmount = Math.round(daysLate * penaltyPerDay);

          map[o.id] = penaltyAmount;

          // Persist all orders to penalty tracking (penaltyAmount may be 0)
          persisted.push({
            orderId: o.id,
            customerName: o.customer,
            tailorName: o.customer,
            orderAmount: o.amount,
            daysLate,
            lateDays: daysLate,
            penaltyRate,
            penaltyAmount,
            penalty: penaltyAmount,
            deliveryDate: o.deliveryDate,
            status: o.status,
            garment: o.garment,
          });
        });

        setPenaltiesMap(map);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
      } catch (e) {
        // no-op
        console.warn('Penalty compute error', e);
      }
    })();
  }, []);

  useEffect(() => {
    if (!token || userRole !== 'tailor') return;

    let active = true;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const syncLocation = async (availability?: boolean) => {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== 'granted') return;

        const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (!active) return;

        await updateTailorLocation(token, {
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
          is_available: typeof availability === 'boolean' ? availability : isOpen,
        });
        setLastSyncAt(new Date().toLocaleTimeString());
      } catch {
        // ignore background sync errors and keep dashboard responsive
      }
    };

    syncLocation();
    intervalId = setInterval(() => {
      syncLocation();
    }, 45000);

    return () => {
      active = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [token, userRole, isOpen]);

  const handleAvailabilityToggle = async (nextValue: boolean) => {
    if (!token || userRole !== 'tailor') return;

    setSyncingPresence(true);
    try {
      await updateTailorAvailability(token, nextValue);
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status === 'granted') {
        const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        await updateTailorLocation(token, {
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
          is_available: nextValue,
        });
      }
      setIsOpen(nextValue);
      setLastSyncAt(new Date().toLocaleTimeString());
    } catch {
      // no-op, keep previous status if API fails
    } finally {
      setSyncingPresence(false);
    }
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

      <View style={[styles.presenceCard, { borderColor: inputBorder, backgroundColor: card }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.presenceTitle}>Shop Status</Text>
          <Text style={[styles.presenceSubtitle, { color: isOpen ? '#15803d' : '#6b7280' }]}>
            {isOpen ? 'Open and visible on customer map' : 'Closed and hidden from open-only filter'}
          </Text>
          <Text style={styles.syncMeta}>
            {syncingPresence ? 'Syncing status...' : `Location auto-sync every 45s${lastSyncAt ? ` • Last ${lastSyncAt}` : ''}`}
          </Text>
        </View>
        <Switch
          value={isOpen}
          onValueChange={handleAvailabilityToggle}
          thumbColor="#ffffff"
          trackColor={{ false: '#d1d5db', true: '#22c55e' }}
        />
      </View>

      <View style={styles.quickRow}>
        <Pressable style={[styles.quickCard, { borderColor: inputBorder }]} onPress={() => router.push('/tailor/3d-review')}>
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
        const penaltyAmount = penaltiesMap[order.id] ?? order.penalty ?? 0;
        const deliveryDate = order.deliveryDate ? new Date(order.deliveryDate) : null;
        let daysUntilDelivery: number | null = null;
        if (deliveryDate) {
          const msPerDay = 1000 * 60 * 60 * 24;
          daysUntilDelivery = Math.ceil((deliveryDate.getTime() - new Date().getTime()) / msPerDay);
        }
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
            {/* Warning when delivery within 2 days and not ready */}
            {typeof daysUntilDelivery === 'number' && daysUntilDelivery <= 2 && order.status !== 'ready' ? (
              <View style={{ padding: 10, backgroundColor: '#fffbeb', borderRadius: 10, marginBottom: 10 }}>
                <Text style={{ color: '#92400e', fontWeight: '700' }}>⚠️ Delivery due in {daysUntilDelivery} day(s). Late delivery will incur {order.occasion ? '10% (occasion)' : '2%'} per day penalty deducted from your payout.</Text>
              </View>
            ) : null}

            {/* Penalty details - separate section per order */}
            <View style={{ padding: 10, backgroundColor: '#fff7f7', borderRadius: 10, marginBottom: 10 }}>
              <Text style={{ fontWeight: '800', marginBottom: 6 }}>Penalty Details</Text>
              <Text style={{ color: '#6b7280', marginBottom: 4 }}>Per-day rate: {order.occasion ? '10% (occasion)' : '2%'}</Text>
              <Text style={{ color: penaltyAmount ? '#b91c1c' : '#6b7280', fontWeight: penaltyAmount ? '800' : '600' }}>{penaltyAmount ? `Current penalty: Rs ${penaltyAmount}` : 'Current penalty: None'}</Text>
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
                <Text style={[styles.detailValue, penaltyAmount ? styles.penalty : null]}>
                  {penaltyAmount ? `Rs ${penaltyAmount}` : 'None'}
                </Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.label}>Delivery</Text>
                <Text style={styles.detailValue}>{order.delivery}</Text>
              </View>
            </View>

            <View style={styles.actionsRow}>
              <Pressable
                style={styles.primaryBtn}
                onPress={() => router.push({ pathname: '/tailor/order-detail', params: { orderId: order.id } })}
              >
                <Text style={styles.primaryText}>View Order</Text>
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

      {/* Penalty summary card below Current Customers */}
      <View style={[styles.orderCard, { backgroundColor: '#fff7f7', borderColor: inputBorder }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <ThemedText style={{ fontWeight: '800' }}>Penalty Center</ThemedText>
          <Text style={{ color: '#6b7280', fontSize: 12 }}>Auto-updated</Text>
        </View>
        <Text style={{ color: '#6b7280', marginBottom: 8 }}>Total pending penalty</Text>
        <Text style={{ fontWeight: '900', fontSize: 18, color: '#b91c1c', marginBottom: 12 }}>Rs {Object.values(penaltiesMap).reduce((s, v) => s + (v || 0), 0).toLocaleString()}</Text>
        <Pressable style={styles.primaryBtn} onPress={() => router.push('/tailor/penalty')}>
          <Text style={styles.primaryText}>View Penalty Details</Text>
        </Pressable>
      </View>

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
  presenceCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  presenceTitle: { fontSize: 14, fontWeight: '800', color: '#111827', marginBottom: 4 },
  presenceSubtitle: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  syncMeta: { fontSize: 11, color: '#6b7280' },
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
