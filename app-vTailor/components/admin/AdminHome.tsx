import React, { useCallback, useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ROLE_COLORS, SURFACE_MUTED, TEXT_DARK, UI } from '@/constants/ui';
import { getAdminStats, type AdminStats } from '@/services/adminApi';
import { Ionicons } from '@expo/vector-icons';

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={[styles.statCard, { borderColor: color }]}>
      <ThemedText style={[styles.statValue, { color }]}>{value}</ThemedText>
      <ThemedText style={styles.statLabel}>{label}</ThemedText>
    </View>
  );
}

export default function AdminHome() {
  const { token, loginEmail } = useAuth();
  const router = useRouter();
  const tint = useThemeColor({}, 'tint');
  const card = useThemeColor({}, 'card');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setError(null);
    try {
      const data = await getAdminStats(token);
      setStats(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load stats');
    }
  }, [token]);

  React.useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const accent = ROLE_COLORS.admin.primary;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: SURFACE_MUTED }}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accent} />}
    >
      <View style={[styles.headerCard, { backgroundColor: card }]}>
        <View style={[styles.iconWrap, { backgroundColor: ROLE_COLORS.admin.soft }]}>
          <Ionicons name="shield-checkmark" size={28} color={accent} />
        </View>
        <View style={{ flex: 1 }}>
          <ThemedText style={styles.headerTitle}>Admin Dashboard</ThemedText>
          <ThemedText style={styles.headerSub}>{loginEmail || 'Platform admin'}</ThemedText>
        </View>
      </View>

      {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}

      {stats ? (
        <View style={styles.grid}>
          <StatCard label="Total users" value={stats.users_total} color={accent} />
          <StatCard label="Customers" value={stats.customers} color="#ec4899" />
          <StatCard label="Tailors" value={stats.tailors} color="#2563eb" />
          <StatCard label="Inactive" value={stats.users_inactive} color="#64748b" />
          <StatCard label="All orders" value={stats.orders_total} color={accent} />
          <StatCard label="Pending" value={stats.orders_pending} color="#d97706" />
          <StatCard label="Confirmed" value={stats.orders_confirmed} color="#059669" />
          <StatCard label="Declined" value={stats.orders_declined} color="#dc2626" />
        </View>
      ) : (
        <ThemedText style={styles.loading}>Loading stats…</ThemedText>
      )}

      <View style={styles.quickRow}>
        <Pressable
          style={[styles.quickBtn, { backgroundColor: accent }]}
          onPress={() => (router as any).replace('/admin?tab=users')}
        >
          <Ionicons name="people" size={18} color="#fff" />
          <ThemedText style={styles.quickBtnText}>Manage users</ThemedText>
        </Pressable>
        <Pressable
          style={[styles.quickBtn, { backgroundColor: ROLE_COLORS.admin.primaryDark }]}
          onPress={() => (router as any).replace('/admin?tab=orders')}
        >
          <Ionicons name="cube" size={18} color="#fff" />
          <ThemedText style={styles.quickBtnText}>View orders</ThemedText>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32 },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: UI.radius.lg,
    marginBottom: 16,
    ...UI.shadow,
  },
  iconWrap: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: TEXT_DARK },
  headerSub: { fontSize: 13, color: '#64748b', marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    ...UI.softShadow,
  },
  statValue: { fontSize: 26, fontWeight: '900' },
  statLabel: { fontSize: 12, color: '#64748b', marginTop: 4, fontWeight: '600' },
  quickRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  quickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  quickBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  error: { color: '#dc2626', marginBottom: 12, fontSize: 13 },
  loading: { color: '#64748b', textAlign: 'center', marginTop: 24 },
});
