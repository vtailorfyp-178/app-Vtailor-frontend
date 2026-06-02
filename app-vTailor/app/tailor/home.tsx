import { ThemedText } from '@/components/themed-text';
import { SURFACE_MUTED, UI, ROLE_COLORS } from '@/constants/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { updateTailorAvailability, updateTailorLocation } from '@/services/tailorsApi';
import { getUnreadCount } from '@/services/notificationsApi';
import { getOrders, type Order as ApiOrder } from '@/services/ordersApi';
import { getWalletSummary } from '@/services/walletApi';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
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

function avatarLetters(name: string): string {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'ST'
  );
}

function formatEarned(amount: number): string {
  if (amount >= 1000) {
    const k = amount / 1000;
    return k >= 10 ? `${Math.round(k)}k` : `${k.toFixed(1)}k`;
  }
  return String(Math.round(amount));
}

type StatCardProps = {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
  tint: string;
  soft: string;
};

function StatCard({ icon, value, label, tint, soft }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconWrap, { backgroundColor: soft }]}>
        <Ionicons name={icon} size={15} color={tint} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

type QuickActionProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  tint: string;
  soft: string;
  highlight?: boolean;
  badge?: number;
};

function QuickActionCard({ icon, label, onPress, tint, soft, highlight, badge }: QuickActionProps) {
  return (
    <Pressable
      style={[
        styles.actionCard,
        highlight ? styles.actionCardHighlight : null,
      ]}
      onPress={onPress}
    >
      <View style={[styles.actionIconWrap, { backgroundColor: highlight ? '#fff0e6' : soft }]}>
        <Ionicons name={icon} size={22} color={highlight ? '#ea580c' : tint} />
        {highlight && badge ? (
          <View style={styles.actionBadge}>
            <Text style={styles.actionBadgeText}>{badge > 99 ? '99+' : String(badge)}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.actionLabel} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function TailorHome() {
  const { user, token, userRole } = useAuth();
  const router = useRouter();
  const card = useThemeColor({}, 'card');
  const muted = useThemeColor({}, 'muted');
  const tint = ROLE_COLORS.tailor.primary;
  const tailorSoft = ROLE_COLORS.tailor.soft;
  const tailorBorder = ROLE_COLORS.tailor.border;
  const tailorDark = ROLE_COLORS.tailor.primaryDark;
  const [penaltiesMap, setPenaltiesMap] = useState<Record<string, number>>({});
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [syncingPresence, setSyncingPresence] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingOrders, setPendingOrders] = useState<ApiOrder[]>([]);
  const [apiOrderCount, setApiOrderCount] = useState(0);
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    if (!token) return;
    getUnreadCount(token).then(setUnreadCount).catch(() => {});
  }, [token]);

  useEffect(() => {
    if (!token) return;
    getOrders(token)
      .then((list) => {
        setApiOrderCount(list.length);
        setPendingOrders(list.filter((o) => o.status === 'pending'));
      })
      .catch(() => {});
    getWalletSummary(token, 5)
      .then((summary) => setWalletBalance(summary.balance ?? 0))
      .catch(() => {});
  }, [token]);

  const displayName = user?.name?.trim() || 'Sehrish Tailor';
  const initials = avatarLetters(displayName);
  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const activeOrderCount = useMemo(
    () => orders.filter((o) => o.status !== 'ready').length + apiOrderCount,
    [apiOrderCount],
  );
  const totalOrders = Math.max(orders.length, apiOrderCount) || orders.length;
  const pendingCount = pendingOrders.length || orders.filter((o) => o.status === 'pending').length;

  const demoEarned = useMemo(() => orders.reduce((sum, o) => sum + o.amount, 0), []);
  const stats = useMemo(
    () => [
      { icon: 'cube-outline' as const, value: String(totalOrders), label: 'Orders' },
      {
        icon: 'cash-outline' as const,
        value: formatEarned(walletBalance > 0 ? walletBalance : demoEarned),
        label: 'Earned',
      },
      { icon: 'trending-up-outline' as const, value: String(pendingCount), label: 'Pending' },
      { icon: 'star-outline' as const, value: '4.9', label: 'Rating' },
    ],
    [totalOrders, walletBalance, pendingCount, demoEarned],
  );

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
        const persisted: any[] = [];

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

        const servicesEnabled = await Location.hasServicesEnabledAsync();
        if (!servicesEnabled) return;

        const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (!active) return;

        await updateTailorLocation(token, {
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
          is_available: typeof availability === 'boolean' ? availability : isOpen,
        });
      } catch {
        // ignore background sync errors and keep dashboard responsive
      }
    };

    void syncLocation().catch(() => {});
    intervalId = setInterval(() => {
      void syncLocation().catch(() => {});
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
        const servicesEnabled = await Location.hasServicesEnabledAsync();
        if (servicesEnabled) {
          const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          await updateTailorLocation(token, {
            latitude: current.coords.latitude,
            longitude: current.coords.longitude,
            is_available: nextValue,
          });
        }
      }
      setIsOpen(nextValue);
    } catch {
      // no-op, keep previous status if API fails
    } finally {
      setSyncingPresence(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <View style={styles.heroBlock}>
        <View style={[styles.headerWrap, { backgroundColor: tint }]}>
          <View style={styles.headerRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.headerCenter}>
              <Text style={styles.welcome}>Welcome back,</Text>
              <Text style={styles.name} numberOfLines={1}>
                {displayName}
              </Text>
              <Text style={styles.headerMeta}>
                {todayLabel} · {activeOrderCount} active order{activeOrderCount === 1 ? '' : 's'}
              </Text>
            </View>
            <Pressable style={styles.bellWrap} onPress={() => router.push('/tailor/notifications')}>
              <Ionicons name="notifications-outline" size={22} color="#fff" />
              {unreadCount > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : String(unreadCount)}</Text>
                </View>
              ) : null}
            </Pressable>
          </View>
        </View>

        <View style={styles.statsRow}>
          {stats.map((item) => (
            <StatCard
              key={item.label}
              icon={item.icon}
              value={item.value}
              label={item.label}
              tint={tint}
              soft={tailorSoft}
            />
          ))}
        </View>
      </View>

      <View style={[styles.presenceCard, { borderColor: tailorBorder, backgroundColor: card }]}>
        <View style={[styles.presenceIconWrap, { backgroundColor: tailorSoft }]}>
          <Ionicons name="storefront-outline" size={16} color={tint} />
        </View>
        <View style={styles.presenceText}>
          <View style={styles.presenceTitleRow}>
            <Text style={styles.presenceTitle}>Shop Status</Text>
            <View style={[styles.presencePill, { backgroundColor: isOpen ? '#ecfdf3' : '#f3f4f6' }]}>
              <Text style={[styles.presencePillText, { color: isOpen ? '#15803d' : '#6b7280' }]}>
                {isOpen ? 'Open' : 'Closed'}
              </Text>
            </View>
          </View>
          <Text style={styles.presenceSubtitle} numberOfLines={1}>
            {syncingPresence
              ? 'Syncing…'
              : isOpen
                ? 'Visible on customer map'
                : 'Hidden from open-only filter'}
          </Text>
        </View>
        <Switch
          value={isOpen}
          onValueChange={handleAvailabilityToggle}
          thumbColor="#ffffff"
          trackColor={{ false: '#d1d5db', true: tint }}
          style={styles.presenceSwitch}
        />
      </View>

      <Text style={styles.sectionLabel}>Quick Actions</Text>
      <View style={styles.actionGrid}>
        <QuickActionCard
          icon="cube-outline"
          label="3D Review"
          tint={tint}
          soft={tailorSoft}
          onPress={() => router.push('/tailor/3d-review')}
        />
        <QuickActionCard
          icon="body-outline"
          label="Measurements"
          tint={tint}
          soft={tailorSoft}
          onPress={() => router.push('/tailor/measurements')}
        />
        <QuickActionCard
          icon="time-outline"
          label="Stitching Timeline"
          tint={tint}
          soft={tailorSoft}
          onPress={() => router.push('/tailor/timeline')}
        />
        <QuickActionCard
          icon="people-outline"
          label="Customer Requests"
          tint={tint}
          soft={tailorSoft}
          highlight={pendingOrders.length > 0}
          badge={pendingOrders.length}
          onPress={() => router.push('/tailor/requests' as any)}
        />
      </View>

      <Pressable
        style={[styles.aiCard, { backgroundColor: tailorSoft, borderColor: tailorBorder }]}
        onPress={() => router.push('/tailor/ai-assistant' as any)}
      >
        <View style={[styles.aiIconWrap, { backgroundColor: tint }]}>
          <Ionicons name="sparkles" size={22} color="#fff" />
        </View>
        <View style={styles.aiContent}>
          <Text style={[styles.aiTitle, { color: tailorDark }]}>AI Style Assistant</Text>
          <Text style={[styles.aiDesc, { color: muted }]}>Get design and fabric suggestions</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={tint} />
      </Pressable>

      {/* ── Current Customers ────────────────────────────────────────── */}
      <View style={styles.sectionHeader}>
        <ThemedText style={styles.sectionTitle}>Current Customers</ThemedText>
        <Pressable onPress={() => router.push('/tailor/orders')}><Text style={styles.link}>View all →</Text></Pressable>
      </View>

      {orders.slice(0, 2).map((order) => {
        const statusStyle = getStatusStyle(order.status);
        const penaltyAmount = penaltiesMap[order.id] ?? order.penalty ?? 0;
        return (
          <Pressable
            key={order.id}
            style={[
              styles.orderCardCompact,
              {
                backgroundColor: card,
                borderColor: order.urgent ? '#fca5a5' : tailorBorder,
              },
            ]}
            onPress={() => router.push({ pathname: '/tailor/order-detail', params: { orderId: order.id } })}
          >
            <View style={styles.orderCompactTop}>
              <View style={styles.orderCompactMain}>
                <Text style={styles.orderCompactName} numberOfLines={1}>
                  {String(order.customer)}
                </Text>
                <Text style={styles.orderCompactMeta} numberOfLines={1}>
                  {order.garment} · Rs {order.amount.toLocaleString()}
                </Text>
              </View>
              <View style={[styles.statusPillCompact, { backgroundColor: statusStyle.backgroundColor }]}>
                <Text style={[styles.statusTextCompact, { color: statusStyle.color }]}>{order.status}</Text>
              </View>
            </View>
            <View style={styles.orderCompactBottom}>
              <Text
                style={[styles.orderCompactTime, order.urgent ? styles.orderCompactUrgent : null]}
                numberOfLines={1}
              >
                {order.timeLeft}
                {penaltyAmount > 0 ? ` · Penalty Rs ${penaltyAmount.toLocaleString()}` : ''}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={tint} />
            </View>
          </Pressable>
        );
      })}

      <Pressable
        style={[styles.penaltyCardCompact, { borderColor: tailorBorder, backgroundColor: '#fff7f7' }]}
        onPress={() => router.push('/tailor/penalty')}
      >
        <View style={[styles.penaltyIconWrap, { backgroundColor: '#fee2e2' }]}>
          <Ionicons name="alert-circle-outline" size={18} color="#b91c1c" />
        </View>
        <View style={styles.penaltyCompactText}>
          <Text style={styles.penaltyCompactTitle}>Penalty Center</Text>
          <Text style={styles.penaltyCompactAmount}>
            Rs {Object.values(penaltiesMap).reduce((s, v) => s + (v || 0), 0).toLocaleString()} pending
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={tint} />
      </Pressable>

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: SURFACE_MUTED },
  container: { paddingBottom: 40, paddingHorizontal: 16, paddingTop: 8 },
  heroBlock: { marginBottom: 4 },
  headerWrap: {
    borderRadius: 28,
    overflow: 'hidden',
    ...UI.shadow,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 22,
    gap: 12,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '900', fontSize: 17, letterSpacing: 0.5 },
  headerCenter: { flex: 1, minWidth: 0 },
  welcome: { color: 'rgba(255,255,255,0.92)', fontSize: 13, marginBottom: 2, fontWeight: '600' },
  name: { color: '#fff', fontWeight: '900', fontSize: 22, letterSpacing: 0.2 },
  headerMeta: { color: 'rgba(255,255,255,0.88)', fontSize: 12, marginTop: 4, fontWeight: '600' },
  bellWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#fff',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: ROLE_COLORS.tailor.primaryDark, fontSize: 10, fontWeight: '800' },
  statsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 6,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ROLE_COLORS.tailor.border,
    paddingVertical: 10,
    paddingHorizontal: 2,
    alignItems: 'center',
    ...UI.softShadow,
  },
  statIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  statValue: { fontSize: 15, fontWeight: '900', color: '#111827', marginBottom: 1 },
  statLabel: { fontSize: 10, fontWeight: '600', color: '#6b7280' },
  presenceCard: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    ...UI.softShadow,
  },
  presenceIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presenceText: { flex: 1, minWidth: 0 },
  presenceTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  presenceTitle: { fontSize: 13, fontWeight: '800', color: '#111827' },
  presencePill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  presencePillText: { fontSize: 10, fontWeight: '800' },
  presenceSubtitle: { fontSize: 11, fontWeight: '500', color: '#6b7280' },
  presenceSwitch: { transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#374151',
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
    marginBottom: 18,
  },
  actionCard: {
    width: '48%',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: ROLE_COLORS.tailor.border,
    backgroundColor: '#fff',
    alignItems: 'center',
    ...UI.softShadow,
  },
  actionCardHighlight: {
    borderColor: '#fdba74',
    backgroundColor: '#fffaf5',
  },
  actionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    position: 'relative',
  },
  actionBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ea580c',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  actionBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  actionLabel: {
    fontWeight: '700',
    fontSize: 12,
    color: '#111827',
    textAlign: 'center',
    lineHeight: 16,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 4 },
  sectionTitle: { fontWeight: '800', fontSize: 16 },
  link: { color: ROLE_COLORS.tailor.primary, fontWeight: '700', fontSize: 12 },
  orderCardCompact: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    ...UI.softShadow,
  },
  orderCompactTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 8,
  },
  orderCompactMain: { flex: 1, minWidth: 0 },
  orderCompactName: { fontSize: 14, fontWeight: '800', color: '#111827', marginBottom: 2 },
  orderCompactMeta: { fontSize: 12, fontWeight: '600', color: '#6b7280' },
  statusPillCompact: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  statusTextCompact: { fontWeight: '700', fontSize: 10, textTransform: 'capitalize' },
  orderCompactBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  orderCompactTime: { flex: 1, fontSize: 11, fontWeight: '600', color: '#6b7280' },
  orderCompactUrgent: { color: '#dc2626', fontWeight: '700' },
  penaltyCardCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
    ...UI.softShadow,
  },
  penaltyIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  penaltyCompactText: { flex: 1, minWidth: 0 },
  penaltyCompactTitle: { fontSize: 13, fontWeight: '800', color: '#111827', marginBottom: 2 },
  penaltyCompactAmount: { fontSize: 12, fontWeight: '700', color: '#b91c1c' },
  aiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 20,
    ...UI.shadow,
  },
  aiIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  aiContent: { flex: 1 },
  aiTitle: { fontSize: 15, fontWeight: '800' },
  aiDesc: { fontSize: 12, marginTop: 3, fontWeight: '500' },
});
