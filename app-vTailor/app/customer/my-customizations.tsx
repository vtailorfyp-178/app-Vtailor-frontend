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
import { TraditionalDressGlbViewer } from '@/components/TraditionalDressGlbViewer';
import { resolveBundledDressGlb, type TabId } from '@/services/dressGlbResolver';

type Item = { id: string; modelId: string; modelName: string; selections: Record<string, string | null>; createdAt: string };

const defaultSelections: Record<TabId, string | null> = {
  neck: null,
  sleeves: null,
  bottom: null,
  'frock-style': null,
  colors: null,
};

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
    if (modelId === 'kurti') return require('../../2d model/kurti 2.jpeg');
    if (modelId === 'kurti-trouser') return require('../../2d model/kurti 2.jpeg');
    if (modelId === 'short-frock') return require('../../2d model/short frock.jpeg');
    if (modelId === 'short-frock-shalwar') return require('../../2d model/short frock.jpeg');
    if (modelId === 'long-frock') return require('../../2d model/long frock 1.jpeg');
    if (modelId === 'shalwar-kameez') return require('../../2d model/shalwar kameez 1.jpeg');
    if (modelId === 'sharara') return require('../../2d model/shrara.jpg');
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
          items.map((it) => {
            const glbModule = resolveBundledDressGlb(mergedSelections(it.selections || {}), it.modelId);
            const src2d = imageFor(it.modelId);
            return (
            <View key={it.id} style={[styles.card, { backgroundColor: card, borderColor: inputBorder }]}> 
              <View style={styles.thumbWrap}>
                {glbModule != null ? (
                  <TraditionalDressGlbViewer
                    key={`${it.id}-${glbModule}`}
                    glbModule={glbModule}
                    width={glPreviewW}
                    height={glPreviewH}
                  />
                ) : src2d ? (
                  <Image source={src2d} style={styles.thumb2d} resizeMode="contain" />
                ) : null}
              </View>
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
            );
          })
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
