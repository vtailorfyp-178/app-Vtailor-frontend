import React, { useEffect, useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/contexts/AuthContext';
import { getUserCustomizations } from '@/services/userDataService';
import AppBackButton from '@/components/AppBackButton';

type Item = { id: string; modelId: string; modelName: string; selections: Record<string, string | null>; createdAt: string };

export default function MyCustomizations() {
  const router = useRouter();
  const { userId } = useAuth();
  const tint = useThemeColor({}, 'tint');
  const card = useThemeColor({}, 'card');
  const inputBorder = useThemeColor({}, 'inputBorder');

  const [items, setItems] = useState<Item[]>([]);

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
          items.map((it) => (
            <View key={it.id} style={[styles.card, { backgroundColor: card, borderColor: inputBorder }]}> 
              {imageFor(it.modelId) ? (
                <Image source={imageFor(it.modelId)} style={styles.thumb} resizeMode="contain" />
              ) : null}
              <View style={styles.cardBody}>
                <ThemedText style={styles.title}>{it.modelName}</ThemedText>
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
  thumb: { width: '100%', height: 160 },
  cardBody: { padding: 12 },
  title: { fontWeight: '700', marginBottom: 4 },
  meta: { color: '#6b7280', fontSize: 12, marginBottom: 8 },
  actions: { flexDirection: 'row' },
  editBtn: { padding: 8, borderRadius: 8, borderWidth: 1 },
});
