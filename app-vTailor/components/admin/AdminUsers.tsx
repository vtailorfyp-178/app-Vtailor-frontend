import React, { useCallback, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  Pressable,
  Alert,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_COLORS, SURFACE_MUTED, TEXT_DARK, UI } from '@/constants/ui';
import { getAdminUsers, setUserActive, type AdminUser } from '@/services/adminApi';

const FILTERS = [
  { id: '', label: 'All' },
  { id: 'customer', label: 'Customers' },
  { id: 'tailor', label: 'Tailors' },
] as const;

export default function AdminUsers() {
  const { token, userId } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const accent = ROLE_COLORS.admin.primary;

  const load = useCallback(async () => {
    if (!token) return;
    setError(null);
    try {
      const data = await getAdminUsers(token, { role: filter || undefined, limit: 100 });
      setUsers(data.users || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load users');
    }
  }, [token, filter]);

  React.useEffect(() => {
    load();
  }, [load]);

  const toggleActive = (user: AdminUser) => {
    if (!token || user.user_id === userId || user.role === 'admin') return;
    const next = !user.is_active;
    Alert.alert(
      next ? 'Activate user?' : 'Deactivate user?',
      user.email || user.user_id,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: next ? 'Activate' : 'Deactivate',
          style: next ? 'default' : 'destructive',
          onPress: async () => {
            try {
              await setUserActive(token, user.user_id, next);
              await load();
            } catch (e) {
              Alert.alert('Error', e instanceof Error ? e.message : 'Update failed');
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
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
        data={users}
        keyExtractor={(item) => item.user_id}
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
        ListEmptyComponent={<ThemedText style={styles.empty}>No users found</ThemedText>}
        renderItem={({ item }) => {
          const active = item.is_active !== false;
          const canToggle = item.user_id !== userId && item.role !== 'admin';
          return (
            <View style={[styles.card, !active && styles.cardInactive]}>
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.email}>{item.email || '—'}</ThemedText>
                <ThemedText style={styles.meta}>{item.name || 'No name'} · {item.role}</ThemedText>
                <ThemedText style={[styles.status, { color: active ? '#059669' : '#dc2626' }]}>
                  {active ? 'Active' : 'Inactive'}
                </ThemedText>
              </View>
              {canToggle ? (
                <Pressable
                  onPress={() => toggleActive(item)}
                  style={[styles.actionBtn, { borderColor: accent }]}
                >
                  <ThemedText style={{ color: accent, fontWeight: '700', fontSize: 12 }}>
                    {active ? 'Deactivate' : 'Activate'}
                  </ThemedText>
                </Pressable>
              ) : null}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SURFACE_MUTED },
  filterRow: { flexDirection: 'row', gap: 8, padding: 16, paddingBottom: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  chipText: { fontSize: 12, fontWeight: '700', color: TEXT_DARK },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...UI.softShadow,
  },
  cardInactive: { opacity: 0.65 },
  email: { fontWeight: '800', fontSize: 14, color: TEXT_DARK },
  meta: { fontSize: 12, color: '#64748b', marginTop: 4 },
  status: { fontSize: 11, fontWeight: '700', marginTop: 6 },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  error: { color: '#dc2626', paddingHorizontal: 16, fontSize: 13 },
  empty: { textAlign: 'center', color: '#64748b', marginTop: 40 },
});
