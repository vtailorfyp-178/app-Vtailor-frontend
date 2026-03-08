import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Text, Pressable } from 'react-native';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '@/components/themed-text';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const STORAGE_KEY = 'vtailor_penalty_orders';

type PersistedEntry = {
  orderId?: string;
  id?: string;
  tailorName?: string;
  customerName?: string;
  orderAmount: number;
  daysLate?: number;
  lateDays?: number;
  penaltyAmount?: number;
  penalty?: number;
  penaltyRate?: number; // fraction e.g. 0.02 or 0.10
  deliveryDate?: string;
};

export default function TailorPenaltyPage() {
  const [items, setItems] = useState<PersistedEntry[]>([]);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) {
          setItems([]);
          return;
        }

        const parsed = JSON.parse(raw);

        // normalize different shapes
        const list: PersistedEntry[] = (parsed || []).map((p: any) => ({
          orderId: p.orderId ?? p.id,
          tailorName: p.tailorName ?? p.customerName ?? p.tailorName,
          orderAmount: p.orderAmount ?? p.orderAmount ?? p.orderPrice ?? 0,
          daysLate: p.daysLate ?? p.lateDays ?? 0,
          lateDays: p.lateDays ?? p.daysLate ?? 0,
          penaltyAmount: p.penaltyAmount ?? p.penalty ?? 0,
          penaltyRate: p.penaltyRate ?? (p.occasion ? 0.1 : 0.02),
          deliveryDate: p.deliveryDate,
        }));

        setItems(list);
      } catch (e) {
        setItems([]);
      }
    })();
  }, []);

  const formatCurrency = (n = 0) => `Rs ${Math.round(n).toLocaleString()}`;

  return (
    <ProtectedRoute requiredRole="tailor">
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color="#111" />
          </Pressable>
          <ThemedText type="title">Penalty Center</ThemedText>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="defaultSemiBold" style={{ marginBottom: 8 }}>Tracked Penalties</ThemedText>
          {items.length === 0 && (
            <View style={styles.emptyBox}>
              <Text style={{ color: '#6b7280' }}>No penalties recorded yet.</Text>
            </View>
          )}

          {/* Group penalties by customer/tailor */}
          {(() => {
            const grouped = items.reduce<Record<string, PersistedEntry[]>>((acc, it) => {
              const name = it.tailorName ?? 'Unknown Customer';
              if (!acc[name]) acc[name] = [];
              acc[name].push(it);
              return acc;
            }, {});

            return Object.entries(grouped).map(([customer, list]) => {
              const customerTotal = list.reduce((s, it) => s + (it.penaltyAmount ?? it.penalty ?? Math.round(((it.lateDays ?? it.daysLate ?? 0) * ((it.penaltyRate ?? 0.02) * (it.orderAmount ?? 0))) )), 0);

              return (
                <View key={customer} style={[styles.card, { backgroundColor: '#fffef6' }]}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{customer}</Text>
                    <Text style={styles.cardSub}>Total Penalty: {formatCurrency(customerTotal)}</Text>
                  </View>

                  {list.map((it, idx) => {
                    const days = (it.daysLate ?? it.lateDays) ?? 0;
                    const rate = it.penaltyRate ?? 0.02;
                    const perDay = Math.round((it.orderAmount ?? 0) * rate);
                    const total = it.penaltyAmount ?? it.penalty ?? Math.round(days * perDay);
                    const receivable = Math.round((it.orderAmount ?? 0) - total);

                    return (
                      <View key={`${it.orderId ?? it.id}_${idx}`} style={{ marginBottom: 10 }}>
                        <Text style={{ fontWeight: '700', marginBottom: 4 }}>{it.orderId ?? it.id} — {formatCurrency(it.orderAmount)}</Text>
                        <Text style={{ color: '#6b7280', marginBottom: 4 }}>Per-day: {(rate * 100).toFixed(0)}% ({formatCurrency(perDay)}) · Days late: {days} · Total: {formatCurrency(total)}</Text>
                        <Text style={{ color: '#374151', marginBottom: 6 }}>Statement: Rs {perDay.toLocaleString()} will be deducted per late day from the order payout. After {days} late day(s), total deduction is Rs {total.toLocaleString()}. You'll receive Rs {receivable.toLocaleString()}.</Text>
                        <Text style={styles.metaText}>Delivery: {it.deliveryDate ?? '—'}</Text>
                        <View style={{ height: 8 }} />
                      </View>
                    );
                  })}
                </View>
              );
            });
          })()}

          <View style={{ height: 80 }} />
        </ScrollView>
      </View>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { paddingTop: 44, paddingHorizontal: 16, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { padding: 6 },
  content: { padding: 16 },
  emptyBox: { padding: 20, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  cardTitle: { fontWeight: '800', color: '#111', fontSize: 14 },
  cardSub: { color: '#6b7280', fontSize: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { color: '#6b7280', fontSize: 13 },
  value: { color: '#111', fontWeight: '700', fontSize: 13 },
  metaRow: { marginTop: 8 },
  metaText: { color: '#9ca3af', fontSize: 12 },
});
