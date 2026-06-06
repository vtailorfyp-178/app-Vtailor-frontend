import React, { useCallback, useState } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Pressable } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_COLORS, SURFACE_MUTED, TEXT_DARK, UI } from '@/constants/ui';
import { getAdminOrders, type AdminOrder } from '@/services/adminApi';

const STATUS_FILTERS = [
  { id: '', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'declined', label: 'Declined' },
] as const;

function statusColor(status: string): string {
  if (status === 'confirmed') return '#059669';
  if (status === 'declined') return '#dc2626';
  if (status === 'pending') return '#d97706';
  return '#6366f1';
}

export default function AdminOrders() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const accent = ROLE_COLORS.admin.primary;

  const load = useCallback(async () => {
    if (!token) return;
    setError(null);
    try {
      const data = await getAdminOrders(token, { status: filter || undefined, limit: 100 });
      setOrders(data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load orders');
    }
  }, [token, filter]);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        {STATUS_FILTERS.map((f) => (
          <Pressable
            key={f.id || 'all'}
            onPress={() => setFilter(f.id)}
            style={[styles.chip, filter === f.id && { backgroundColor: accent, borderColor: accent }]}
          >
            <ThemedText style={[styles.chipText, filter === f.id && { color: '#fff' }]}>{f.label}</ThemedText>
          </Pressable>
        ))}
      </View>

      {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
            tintColor={accent}
          />
        }
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        ListEmptyComponent={<ThemedText style={styles.empty}>No orders found</ThemedText>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <ThemedText style={styles.names}>{item.customer_name} → {item.tailor_name}</ThemedText>
              <ThemedText style={[styles.badge, { color: statusColor(item.status) }]}>
                {item.status.replace('_', ' ')}
              </ThemedText>
            </View>
            <ThemedText style={styles.desc} numberOfLines={2}>{item.description}</ThemedText>
            <ThemedText style={styles.budget}>Budget: Rs {Number(item.budget || 0).toLocaleString()}</ThemedText>
            {item.proposed_price != null ? (
              <ThemedText style={styles.proposed}>
                Proposed: Rs {Number(item.proposed_price).toLocaleString()}
              </ThemedText>
            ) : null}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SURFACE_MUTED },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 16, paddingBottom: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  chipText: { fontSize: 12, fontWeight: '700', color: TEXT_DARK },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...UI.softShadow,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  names: { flex: 1, fontWeight: '800', fontSize: 13, color: TEXT_DARK },
  badge: { fontSize: 11, fontWeight: '800', textTransform: 'capitalize' },
  desc: { fontSize: 13, color: '#475569', marginTop: 8 },
  budget: { fontSize: 12, fontWeight: '700', color: TEXT_DARK, marginTop: 8 },
  proposed: { fontSize: 12, color: '#64748b', marginTop: 4 },
  error: { color: '#dc2626', paddingHorizontal: 16, fontSize: 13 },
  empty: { textAlign: 'center', color: '#64748b', marginTop: 40 },
});
