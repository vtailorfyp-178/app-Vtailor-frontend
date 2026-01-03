import React from 'react';
import { View, ScrollView, Pressable, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

const logo = require('../../assets/images/vTailorlogo.jpeg');

const traditionalDresses = [
  { id: 'shalwar-kameez', name: 'Shalwar Kameez', emoji: '👗' },
  { id: 'ghagra', name: 'Ghagra', emoji: '👚' },
  { id: 'sharara', name: 'Sharara', emoji: '✨' },
  { id: 'lehenga', name: 'Lehenga', emoji: '💃' },
];

export default function TraditionalDresses() {
  const router = useRouter();
  const tint = useThemeColor({}, 'tint');
  const card = useThemeColor({}, 'card');
  const inputBorder = useThemeColor({}, 'inputBorder');

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { backgroundColor: tint }]}>
        <Pressable onPress={() => (router as any).back()}>
          <ThemedText style={{ color: '#fff' }}>{'< Back'}</ThemedText>
        </Pressable>
        <ThemedText style={styles.headerTitle}>Traditional Dresses</ThemedText>
        <View style={{ width: 56 }} />
      </View>

      <ScrollView contentContainerStyle={styles.grid}>
        {traditionalDresses.map((dress) => (
          <Pressable
            key={dress.id}
            onPress={() =>
              (router as any).push({
                pathname: '/customer/customize3d',
                params: { modelId: dress.id, modelName: dress.name },
              })
            }
            style={[styles.card, { backgroundColor: card, borderColor: inputBorder }]}
          >
            <View style={styles.emojiContainer}>
              <ThemedText style={styles.emoji}>{dress.emoji}</ThemedText>
            </View>
            <Image source={logo} style={styles.thumb} resizeMode="cover" />
            <ThemedText style={styles.dressName}>{dress.name}</ThemedText>
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
  headerTitle: { color: '#fff', fontWeight: '700', fontSize: 16 },
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
  emojiContainer: {
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 36 },
  thumb: { width: '100%', height: 100 },
  dressName: { padding: 10, fontWeight: '600', textAlign: 'center' },
});
