import React from 'react';
import { View, ScrollView, Pressable, StyleSheet, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function PreviewCustomization() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const modelId = (params.modelId as string) || '';
  const modelName = (params.modelName as string) || '';
  const selectionsStr = (params.selections as string) || '{}';
  let selections: Record<string, string | null> = {};
  try {
    selections = JSON.parse(selectionsStr);
  } catch (e) {
    selections = {};
  }

  const tint = useThemeColor({}, 'tint');
  const card = useThemeColor({}, 'card');
  const inputBorder = useThemeColor({}, 'inputBorder');

  const imageSource =
    modelId === 'maxi'
      ? require('../../2d model/Maxi 1.jpeg')
      : modelId === 'kurti'
      ? require('../../2d model/kurti 2.jpeg')
      : modelId === 'short-frock'
      ? require('../../2d model/short frock.jpeg')
      : modelId === 'long-frock'
      ? require('../../2d model/long frock 1.jpeg')
      : modelId === 'shalwar-kameez'
      ? require('../../2d model/shalwar kameez 1.jpeg')
      : null;

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { backgroundColor: tint }]}> 
        <Pressable onPress={() => (router as any).back()}>
          <ThemedText style={{ color: '#fff' }}>{'< Back'}</ThemedText>
        </Pressable>
        <ThemedText style={styles.headerTitle}>Preview</ThemedText>
        <View style={{ width: 56 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.preview, { backgroundColor: card, borderColor: inputBorder }]}> 
          {imageSource ? (
            <Image source={imageSource} style={styles.previewImage} resizeMode="contain" />
          ) : (
            <ThemedText>No preview available</ThemedText>
          )}
        </View>

        <View style={styles.details}>
          <ThemedText style={{ fontWeight: '700', marginBottom: 8 }}>{modelName || 'Customized Model'}</ThemedText>
          {Object.keys(selections).length ? (
            Object.entries(selections).map(([k, v]) => (
              <ThemedText key={k}>{`${k}: ${v ?? '—'}`}</ThemedText>
            ))
          ) : (
            <ThemedText>No selections made</ThemedText>
          )}
        </View>

        <Pressable onPress={() => (router as any).push('/customer/find-tailors')} style={[styles.proceed, { backgroundColor: tint }]}> 
          <ThemedText style={{ color: '#fff' }}>Proceed to Find Tailor</ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 40, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { color: '#fff', fontWeight: '700' },
  scroll: { padding: 12 },
  preview: { height: 320, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  previewImage: { width: '100%', height: '100%' },
  details: { marginTop: 12, padding: 12 },
  proceed: { marginTop: 16, padding: 14, borderRadius: 12, alignItems: 'center' },
});
