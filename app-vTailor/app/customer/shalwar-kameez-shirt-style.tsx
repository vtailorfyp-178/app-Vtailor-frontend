import React from 'react';
import { View, ScrollView, Pressable, StyleSheet, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import AppBackButton from '@/components/AppBackButton';

const longShirtImage = require('../../dress_assets/short-shirt-shalwar.png');
const shortShirtImage = require('../../dress_assets/short-shirt-shalwar.png');

const shirtStyles = [
  { id: 'long', name: 'Long shirt with shalwar', image: longShirtImage },
  { id: 'short', name: 'Short shirt with shalwar', image: shortShirtImage },
] as const;

export default function ShalwarKameezShirtStyleScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const tint = useThemeColor({}, 'tint');
  const card = useThemeColor({}, 'card');
  const inputBorder = useThemeColor({}, 'inputBorder');

  const dressLine = (params.dressLine as string) || 'casual';

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { backgroundColor: tint }]}>
        <AppBackButton onPress={() => (router as any).back()} variant="tint" />
        <ThemedText style={styles.headerTitle}>Shalwar kameez</ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.grid}>
        {shirtStyles.map((style) => (
          <Pressable
            key={style.id}
            onPress={() =>
              (router as any).push({
                pathname: '/customer/shalwar-kameez-bottom-style',
                params: {
                  dressLine,
                  shirtStyle: style.id,
                  shirtStyleName: style.name,
                },
              })
            }
            style={[styles.card, { backgroundColor: card, borderColor: inputBorder }]}
          >
            <Image source={style.image} style={styles.thumb} resizeMode="contain" />
            <ThemedText style={styles.dressName}>{style.name}</ThemedText>
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
