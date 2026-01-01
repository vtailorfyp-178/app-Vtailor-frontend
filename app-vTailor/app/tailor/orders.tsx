import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ThemedText } from '@/components/themed-text';

type Order = { id: string; customer: string; status: 'pending' | 'in_progress' | 'ready' | 'cancelled'; price: number };

const sampleOrders: Order[] = [
  { id: 'ORD001', customer: 'Aisha Khan', status: 'in_progress', price: 1200 },
  { id: 'ORD002', customer: 'Sara Ali', status: 'pending', price: 850 },
  { id: 'ORD003', customer: 'Nadia Hussain', status: 'ready', price: 1500 },
  { id: 'ORD004', customer: 'Laila Shah', status: 'cancelled', price: 600 },
];

export default function TailorOrders() {
  const [filter, setFilter] = useState<'all' | 'active' | 'done' | 'cancelled'>('all');

  const counts = useMemo(() => {
    return {
      all: sampleOrders.length,
      active: sampleOrders.filter((o) => o.status === 'in_progress' || o.status === 'pending').length,
      done: sampleOrders.filter((o) => o.status === 'ready').length,
      cancelled: sampleOrders.filter((o) => o.status === 'cancelled').length,
    };
  }, []);

  const filtered = sampleOrders.filter((o) => {
    if (filter === 'all') return true;
    if (filter === 'active') return o.status === 'in_progress' || o.status === 'pending';
    if (filter === 'done') return o.status === 'ready';
    return o.status === 'cancelled';
  });

  return (
    <ProtectedRoute requiredRole="tailor">
      <ScrollView contentContainerStyle={styles.wrapper}>
        <ThemedText style={styles.title}>Orders</ThemedText>
        <View style={styles.filters}>
          <Pressable style={[styles.filterBtn, filter === 'all' && styles.filterActive]} onPress={() => setFilter('all')}>
            <Text style={filter === 'all' ? styles.filterTextActive : styles.filterText}>All ({counts.all})</Text>
          </Pressable>
          <Pressable style={[styles.filterBtn, filter === 'active' && styles.filterActive]} onPress={() => setFilter('active')}>
            <Text style={filter === 'active' ? styles.filterTextActive : styles.filterText}>Active ({counts.active})</Text>
          </Pressable>
          <Pressable style={[styles.filterBtn, filter === 'done' && styles.filterActive]} onPress={() => setFilter('done')}>
            <Text style={filter === 'done' ? styles.filterTextActive : styles.filterText}>Done ({counts.done})</Text>
          </Pressable>
          <Pressable style={[styles.filterBtn, filter === 'cancelled' && styles.filterActive]} onPress={() => setFilter('cancelled')}>
            <Text style={filter === 'cancelled' ? styles.filterTextActive : styles.filterText}>Cancelled ({counts.cancelled})</Text>
          </Pressable>
        </View>

        {filtered.map((o) => (
          <View key={o.id} style={styles.card}>
            <View style={styles.cardRow}>
              <Text style={styles.cardTitle}>{o.customer}</Text>
              <Text style={styles.small}>{o.id}</Text>
            </View>
            <Text style={styles.small}>Rs {o.price} • {o.status.replace('_', ' ')}</Text>
          </View>
        ))}
      </ScrollView>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  wrapper: { padding: 16, paddingBottom: 120 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  filters: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  filterBtn: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8, backgroundColor: '#f3f4f6' },
  filterActive: { backgroundColor: '#111827' },
  filterText: { color: '#374151', fontWeight: '600' },
  filterTextActive: { color: '#fff', fontWeight: '700' },
  card: { padding: 12, borderRadius: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 8 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  cardTitle: { fontWeight: '700' },
  small: { color: '#6b7280' },
});

