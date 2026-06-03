import React, { useEffect } from 'react';
import { View, ScrollView, Pressable, StyleSheet, Image, ImageSourcePropType } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import AppBackButton from '@/components/AppBackButton';
import { prefetchTrouserShirtEntry } from '@/services/glb/glbUrlResolve';

/** Replace this asset anytime — UI reads from one place. */
const bellBottomThumbnail: ImageSourcePropType = require('../../dress_assets/bell-bottom.png');
const tulipTrouserThumbnail: ImageSourcePropType = require('../../dress_assets/tulip-trouser.png');

const trouserVariations = [
  {
    id: 'bell-bottom',
    name: 'Bell bottom',
    image: bellBottomThumbnail,
    modelId: 'trouser-shirt-bell-bottom',
  },
  {
    id: 'tulip-trouser',
    name: 'Tulip trouser',
    image: tulipTrouserThumbnail,
    modelId: 'trouser-shirt-tulip-trouser',
  },
] as const;

export default function TrouserShirtStyleScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const tint = useThemeColor({}, 'tint');
  const card = useThemeColor({}, 'card');
  const inputBorder = useThemeColor({}, 'inputBorder');

  const dressLine = (params.dressLine as string) || 'casual';
  const shirtStyleName = 'Trouser shirt';

  useEffect(() => {
    prefetchTrouserShirtEntry('trouser-shirt-bell-bottom');
    prefetchTrouserShirtEntry('trouser-shirt-tulip-trouser');
  }, []);

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { backgroundColor: tint }]}>
        <AppBackButton onPress={() => (router as any).back()} variant="tint" />
        <ThemedText style={styles.headerTitle}>Trouser shirt</ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.grid}>
        {trouserVariations.map((variation) => (
          <Pressable
            key={variation.id}
            onPress={() =>
              (router as any).push({
                pathname: '/customer/customize3d',
                params: {
                  modelId: variation.modelId,
                  modelName: `${shirtStyleName} · ${variation.name}`,
                  dressLine,
                  presetVariation: variation.id,
                  shirtStyleName,
                  variationName: variation.name,
                },
              })
            }
            style={[styles.card, { backgroundColor: card, borderColor: inputBorder }]}
          >
            <Image source={variation.image} style={styles.thumb} resizeMode="contain" />
            <ThemedText style={styles.dressName}>{variation.name}</ThemedText>
          </Pressable>
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 40,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerSpacer: { width: 84 },
  headerTitle: { flex: 1, color: '#fff', fontWeight: '700', fontSize: 16, textAlign: 'center' },
  grid: {
    padding: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    alignItems: 'center',
    borderWidth: 1,
  },
  thumb: { width: '100%', height: 160 },
  dressName: { padding: 12, fontWeight: '600', textAlign: 'center' },
});
