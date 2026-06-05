import React, { useEffect, useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/contexts/AuthContext';
import { type TabId } from '@/services/dressGlbResolver';
import { getUserCustomizations, setCustomizationsSnapshot } from '@/services/userDataService';
import AppBackButton from '@/components/AppBackButton';
import { type SavedDesign } from '@/services/savedDesign';
import { safeLocaleString } from '@/utils/safeDisplay';

type Item = SavedDesign;

const defaultSelections: Record<TabId, string | null> = {
  neck: null,
  sleeves: null,
  bottom: null,
  'frock-style': null,
  colors: null,
  'saree-style': null,
  'fabric-print': null,
};

function mergedSelections(selections: Record<string, string | null>): Record<TabId, string | null> {
  return { ...defaultSelections, ...selections } as Record<TabId, string | null>;
}

function humanizeSelection(value: string | null | undefined): string {
  if (!value) return '';
  return value
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

function getModelHeading(item: Item): string {
  const id = String(item.modelId || '').toLowerCase();
  if (id.includes('shalwar-kameez')) return 'Shalwar Kameez';
  if (id.includes('long-frock')) return 'Long Frock';
  if (id.includes('short-frock')) return 'Short Frock';
  if (id.includes('saree')) return 'Saree';
  if (id.includes('lehnga')) return 'Lehnga';
  if (id.includes('grarah')) return 'Grarah';
  if (id.includes('sharara')) return 'Sharara';
  return humanizeSelection(item.modelName);
}

function buildCustomizationDescription(item: Item): string {
  const merged = mergedSelections(item.selections || {});
  const modelId = item.modelId.toLowerCase();
  const color = merged.colors ? `${humanizeSelection(merged.colors)} color` : '';
  const neck = merged.neck ? `${humanizeSelection(merged.neck)} neck` : '';
  const sleeves = merged.sleeves ? `${humanizeSelection(merged.sleeves)} sleeves` : '';
  const style = humanizeSelection(merged['frock-style'] ?? merged.bottom);
  const sareeStyle = merged['saree-style'] ? `${humanizeSelection(merged['saree-style'])} style` : '';

  if (modelId.includes('shalwar-kameez')) {
    const shalwarStyle = style || 'matching shalwar';
    const parts = [
      `short shirt with ${shalwarStyle}`,
      color,
      neck,
      sleeves,
    ].filter(Boolean);
    return `${getModelHeading(item)} in ${parts.join(', ')}`;
  }

  if (modelId.includes('long-frock')) {
    const parts = [style || 'flared style', color, neck, sleeves].filter(Boolean);
    return `${getModelHeading(item)} in ${parts.join(', ')}`;
  }

  if (modelId.includes('saree')) {
    const parts = [sareeStyle || 'plain style', color, neck, sleeves].filter(Boolean);
    return `${getModelHeading(item)} in ${parts.join(', ')}`;
  }

  const genericParts = [style, color, neck, sleeves, sareeStyle].filter(Boolean);
  if (!genericParts.length) return getModelHeading(item);
  return `${getModelHeading(item)} in ${genericParts.join(', ')}`;
}

function buildCustomizationSummary(item: Item): string {
  return buildCustomizationDescription(item);
}

function openSavedCustomization(router: ReturnType<typeof useRouter>, item: Item, tab?: 'design' | 'measurements' | 'tailor') {
  router.push({
    pathname: '/customer/design-detail',
    params: {
      id: item.id,
      ...(tab ? { tab } : {}),
    },
  });
}

export default function MyCustomizations() {
  const router = useRouter();
  const { userId } = useAuth();
  const tint = useThemeColor({}, 'tint');
  const card = useThemeColor({}, 'card');
  const inputBorder = useThemeColor({}, 'inputBorder');

  const [items, setItems] = useState<Item[]>([]);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        // Load from user-specific storage if userId exists
        if (userId) {
          const list = await getUserCustomizations(userId);
          setItems(
            (list as Item[])
              .filter((row) => row && typeof row === 'object' && row.id)
              .reverse(),
          );
        } else {
          setItems([]);
        }
      } catch (e) {
        setItems([]);
      }
    };
    load();
  }, [userId]);

  const deleteCustomization = (id: string) => {
    setDeleteTargetId(id);
  };

  const confirmDeleteCustomization = async () => {
    if (!deleteTargetId) return;
    const updated = items.filter((it) => it.id !== deleteTargetId);
    setItems(updated);
    setDeleteTargetId(null);
    await setCustomizationsSnapshot(userId, [...updated].reverse());
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { backgroundColor: tint }]}> 
        <AppBackButton onPress={() => (router as any).back()} variant="tint" />
        <ThemedText style={styles.headerTitle}>My Designs</ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {items.length ? (
          items.map((it) => (
            <Pressable
              key={it.id}
              style={({ pressed }) => [
                styles.card,
                { backgroundColor: card, borderColor: inputBorder },
                pressed && styles.cardPressed,
              ]}
              onPress={() => openSavedCustomization(router, it)}
            >
              <View style={[styles.badgeRow, { backgroundColor: it.orderPlaced ? '#059669' : tint }]}> 
                <Ionicons name={it.orderPlaced ? 'checkmark-circle-outline' : 'sparkles-outline'} size={14} color="#fff" />
                <ThemedText style={styles.badgeText}>
                  {it.orderPlaced ? 'Order placed' : 'Saved design'}
                </ThemedText>
              </View>
              <View style={styles.cardBody}>
                <View style={styles.cardHead}>
                  <ThemedText style={styles.title}>{getModelHeading(it)}</ThemedText>
                  <Pressable
                    onPress={() => deleteCustomization(it.id)}
                    accessibilityRole="button"
                    accessibilityLabel="Delete saved design"
                    style={styles.deleteBtn}>
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  </Pressable>
                </View>
                <ThemedText style={styles.summary}>{buildCustomizationSummary(it)}</ThemedText>
                {it.orderPlaced && it.tailor?.tailorName ? (
                  <ThemedText style={styles.tailorLine}>Tailor: {it.tailor.tailorName}</ThemedText>
                ) : null}
                <ThemedText style={styles.meta}>{safeLocaleString(it.createdAt)}</ThemedText>
                <View style={styles.footerRow}>
                  <View style={styles.tapPill}>
                    <Ionicons name="layers-outline" size={14} color={tint} />
                    <ThemedText style={[styles.tapPillText, { color: tint }]}>Tap for design · measurements · tailor</ThemedText>
                  </View>
                </View>
              </View>
            </Pressable>
          ))
        ) : (
          <View style={[styles.emptyState, { borderColor: inputBorder, backgroundColor: card }]}>
            <Ionicons name="images-outline" size={30} color={tint} />
            <ThemedText style={styles.emptyTitle}>No saved designs yet</ThemedText>
            <ThemedText style={styles.emptyText}>Completed designs with customizations, measurements, and tailor details will appear here after you place an order.</ThemedText>
          </View>
        )}
      </ScrollView>

      <Modal
        animationType="fade"
        transparent
        visible={deleteTargetId != null}
        onRequestClose={() => setDeleteTargetId(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: card, borderColor: inputBorder }]}>
            <ThemedText style={styles.modalTitle}>Delete Model</ThemedText>
            <ThemedText style={styles.modalText}>Do you want to delete the model?</ThemedText>
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, styles.discardButton, { borderColor: inputBorder }]}
                onPress={() => setDeleteTargetId(null)}>
                <ThemedText>Discard</ThemedText>
              </Pressable>
              <Pressable style={[styles.modalButton, styles.deleteConfirmButton]} onPress={confirmDeleteCustomization}>
                <ThemedText style={styles.deleteConfirmText}>Delete</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 40, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerSpacer: { width: 84 },
  headerTitle: { flex: 1, color: '#fff', fontWeight: '700', textAlign: 'center' },
  scroll: { padding: 12 },
  card: { borderRadius: 18, marginBottom: 12, overflow: 'hidden', borderWidth: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  cardPressed: { opacity: 0.94, transform: [{ scale: 0.992 }] },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase' },
  cardBody: { padding: 14 },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6, gap: 12 },
  title: { fontWeight: '800', fontSize: 18, flex: 1, paddingRight: 12 },
  deleteBtn: { padding: 4, borderRadius: 16 },
  summary: { color: '#334155', fontSize: 14, lineHeight: 22, marginBottom: 6 },
  tailorLine: { color: '#0e7490', fontSize: 13, fontWeight: '700', marginBottom: 6 },
  meta: { color: '#64748b', fontSize: 12, marginBottom: 10 },
  footerRow: { flexDirection: 'row', alignItems: 'center' },
  tapPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.03)' },
  tapPillText: { fontSize: 12, fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  modalTitle: { fontWeight: '700', fontSize: 18, marginBottom: 8 },
  modalText: { color: '#6b7280', marginBottom: 16 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  modalButton: { borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14 },
  discardButton: { borderWidth: 1 },
  deleteConfirmButton: { backgroundColor: '#dc2626' },
  deleteConfirmText: { color: '#fff', fontWeight: '600' },
  emptyState: { padding: 20, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginTop: 18, gap: 8 },
  emptyTitle: { fontWeight: '800', fontSize: 16, marginTop: 4 },
  emptyText: { color: '#64748b', textAlign: 'center', fontSize: 13, lineHeight: 19 },
});
