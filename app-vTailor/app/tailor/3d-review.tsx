import React, { useCallback, useEffect, useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { getGlobalCustomizations } from '@/services/userDataService';

type SavedDesign = {
  id: string;
  modelId: string;
  modelName: string;
  selections: Record<string, string | null>;
  createdAt: string;
  customerUserId?: string | null;
};

export default function Tailor3DReview() {
  const router = useRouter();
  const card = useThemeColor({}, 'card');
  const tint = useThemeColor({}, 'tint');
  const muted = useThemeColor({}, 'muted');
  const bg = useThemeColor({}, 'background');

  const [designs, setDesigns] = useState<SavedDesign[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDesigns = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getGlobalCustomizations();
      const normalized = (Array.isArray(list) ? list : []).filter(
        (x): x is SavedDesign =>
          Boolean(x && typeof x === 'object' && (x as SavedDesign).id && (x as SavedDesign).modelId),
      );
      setDesigns(normalized.reverse());
    } catch {
      setDesigns([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDesigns();
  }, [loadDesigns]);

  useFocusEffect(
    useCallback(() => {
      loadDesigns();
    }, [loadDesigns]),
  );

  return (
    <ProtectedRoute requiredRole="tailor">
      <View style={[styles.container, { backgroundColor: bg }]}>
        <View style={[styles.header, { backgroundColor: tint }]}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#fff" />
          </Pressable>
          <ThemedText style={[styles.headerTitle, { color: '#fff' }]}>3D Customization Review</ThemedText>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <ThemedText style={styles.subtitle}>Customer designs saved from the app (same device). Tap to open interactive 3D.</ThemedText>

          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={tint} />
            </View>
          ) : designs.length === 0 ? (
            <ThemedText style={[styles.empty, { color: muted }]}>
              No saved 3D designs yet. When a customer finishes customization and continues toward measurements, their dress appears here for you to review.
            </ThemedText>
          ) : (
            designs.map((d) => (
              <Pressable
                key={d.id}
                style={[styles.card, { backgroundColor: card }]}
                onPress={() =>
                  router.push({
                    pathname: '/tailor/3d-view',
                    params: {
                      designId: d.id,
                      customerId: d.customerUserId || '',
                      customerName: 'Customer',
                      modelId: d.modelId,
                      modelName: d.modelName,
                      selections: JSON.stringify(d.selections || {}),
                    },
                  })
                }
              >
                <View style={styles.cardTop}>
                  <View style={styles.cardLeft}>
                    <ThemedText style={styles.customerName}>{d.modelName}</ThemedText>
                    <ThemedText style={[styles.garment, { color: muted }]}>{d.modelId.replace(/-/g, ' ')}</ThemedText>
                    {d.customerUserId ? (
                      <ThemedText style={[styles.meta, { color: muted }]}>Customer id: {d.customerUserId}</ThemedText>
                    ) : null}
                  </View>
                  <View style={[styles.previewBadge, { borderColor: tint }]}>
                    <ThemedText style={[styles.previewText, { color: tint }]}>3D Preview</ThemedText>
                  </View>
                </View>
                <View style={styles.cardBottom}>
                  <ThemedText style={[styles.date, { color: muted }]}>📅 {new Date(d.createdAt).toLocaleString()}</ThemedText>
                  <Ionicons name="arrow-forward" size={18} color={tint} />
                </View>
              </Pressable>
            ))
          )}

          <View style={styles.spacer} />
        </ScrollView>
      </View>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, paddingTop: 40 },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '700' },
  content: { padding: 16, paddingBottom: 100 },
  subtitle: { fontSize: 14, color: '#6b7280', marginBottom: 16 },
  loadingWrap: { paddingVertical: 40, alignItems: 'center' },
  empty: { fontSize: 14, lineHeight: 20, paddingVertical: 8 },
  card: { padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardLeft: { flex: 1 },
  customerName: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  garment: { fontSize: 13 },
  meta: { fontSize: 11, marginTop: 4 },
  previewBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  previewText: { fontSize: 12, fontWeight: '700' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { fontSize: 12 },
  spacer: { height: 40 },
});
