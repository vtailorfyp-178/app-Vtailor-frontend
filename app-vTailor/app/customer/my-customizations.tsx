import React, { useEffect, useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet, Image, useWindowDimensions, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/contexts/AuthContext';
import { getUserCustomizations, setCustomizationsSnapshot } from '@/services/userDataService';
import AppBackButton from '@/components/AppBackButton';
import { DressGlbPreview } from '@/components/DressGlbPreview';
import { type TabId } from '@/services/dressGlbResolver';
import { useBundledDressGlb } from '@/hooks/useBundledDressGlb';
import {
  fabricColorHexFromId,
  usesCasualShortShirtFabricTint,
} from '@/services/dressFabricColors';
import { with3dPreviewDefaults } from '@/services/glb/threePreviewReadiness';

type Item = { id: string; modelId: string; modelName: string; selections: Record<string, string | null>; createdAt: string };

const defaultSelections: Record<TabId, string | null> = {
  neck: null,
  sleeves: null,
  bottom: null,
  'frock-style': null,
  colors: null,
  'saree-style': null,
};

function SavedCustomizationPreview({
  item,
  glPreviewW,
  glPreviewH,
  imageFor,
}: {
  item: Item;
  glPreviewW: number;
  glPreviewH: number;
  imageFor: (modelId: string) => number | null;
}) {
  const merged = mergedSelections(item.selections || {});
  const selectionsFor3d = with3dPreviewDefaults(item.modelId, merged);
  const dressGlb = useBundledDressGlb(selectionsFor3d, item.modelId);
  const fabricHex = usesCasualShortShirtFabricTint(item.modelId, merged)
    ? fabricColorHexFromId(merged.colors)
    : null;
  const src2d = imageFor(item.modelId);

  return (
    <View style={styles.thumbWrap}>
      {dressGlb.url != null ? (
        <DressGlbPreview
          key={`${item.id}-${dressGlb.url}-${merged.colors ?? ''}`}
          glbUrl={dressGlb.url}
          width={glPreviewW}
          height={glPreviewH}
          fabricColorHex={fabricHex}
          fallbackImage={src2d}
        />
      ) : src2d ? (
        <Image source={src2d} style={styles.thumb2d} resizeMode="contain" />
      ) : null}
    </View>
  );
}

function mergedSelections(selections: Record<string, string | null>): Record<TabId, string | null> {
  return { ...defaultSelections, ...selections } as Record<TabId, string | null>;
}

export default function MyCustomizations() {
  const router = useRouter();
  const { width: screenW } = useWindowDimensions();
  const glPreviewW = Math.max(260, Math.floor(screenW - 48));
  const glPreviewH = 200;
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
          setItems(list.reverse());
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

  const imageFor = (modelId: string) => {
    if (modelId === 'kurti') return require('../../2d model/casual dresses.jpg');
    if (modelId === 'kurti-trouser') return require('../../2d model/casual dresses.jpg');
    if (modelId === 'short-frock') return require('../../2d model/short-shirt-shalwar.png');
    if (modelId === 'short-frock-shalwar' || modelId === 'shalwar-kameez-short')
      return require('../../2d model/short-shirt-shalwar.png');
    if (modelId === 'long-frock') return require('../../2d model/long frock 2.png');
    if (modelId === 'saree') return require('../../2d model/variations/saree.png');
    if (modelId === 'shalwar-kameez' || modelId === 'shalwar-kameez-long')
      return require('../../2d model/short-shirt-shalwar.png');
    if (modelId === 'sharara') return require('../../2d model/shrara.jpg');
    if (modelId === 'grarah-short-shirt') return require('../../2d model/variations/short-shirt-grarah.png');
    if (modelId === 'grarah-peplum') return require('../../2d model/variations/peplum-grarah.png');
    if (modelId === 'lehnga-circular') return require('../../2d model/variations/circular.png');
    if (modelId === 'lehnga-bridal' || modelId === 'lehnga') return require('../../2d model/bridal-lehnga.png');
    return null;
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { backgroundColor: tint }]}> 
        <AppBackButton onPress={() => (router as any).back()} variant="tint" />
        <ThemedText style={styles.headerTitle}>My Customizations</ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {items.length ? (
          items.map((it) => (
            <View key={it.id} style={[styles.card, { backgroundColor: card, borderColor: inputBorder }]}>
              <SavedCustomizationPreview
                item={it}
                glPreviewW={glPreviewW}
                glPreviewH={glPreviewH}
                imageFor={imageFor}
              />
              <View style={styles.cardBody}>
                <View style={styles.cardHead}>
                  <ThemedText style={styles.title}>{it.modelName}</ThemedText>
                  <Pressable
                    onPress={() => deleteCustomization(it.id)}
                    accessibilityRole="button"
                    accessibilityLabel="Delete saved design"
                    style={styles.deleteBtn}>
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  </Pressable>
                </View>
                <ThemedText style={styles.meta}>{new Date(it.createdAt).toLocaleString()}</ThemedText>
                <View style={styles.actions}>
                  <Pressable onPress={() => router.push({ pathname: '/customer/customize3d', params: { modelId: it.modelId, modelName: it.modelName, selections: JSON.stringify(it.selections) } })} style={[styles.editBtn, { borderColor: inputBorder }]}>
                    <ThemedText>Edit</ThemedText>
                  </Pressable>
                </View>
              </View>
            </View>
          ))
        ) : (
          <ThemedText style={{ padding: 16 }}>You have no saved customizations yet.</ThemedText>
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
  card: { borderRadius: 12, marginBottom: 12, overflow: 'hidden', borderWidth: 1 },
  thumbWrap: { width: '100%', alignItems: 'center', backgroundColor: '#f8fafc' },
  thumb2d: { width: '100%', height: 200 },
  cardBody: { padding: 12 },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  title: { fontWeight: '700', marginBottom: 4 },
  deleteBtn: { padding: 4, borderRadius: 16 },
  meta: { color: '#6b7280', fontSize: 12, marginBottom: 8 },
  actions: { flexDirection: 'row' },
  editBtn: { padding: 8, borderRadius: 8, borderWidth: 1 },
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
});
