import React from 'react';
import { View, ScrollView, Pressable, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import AppBackButton from '@/components/AppBackButton';

const logo = require('../../assets/images/vTailorlogo.jpeg');
const longFrockImage = require('../../dress_assets/long frock 2.png');
const sareeImage = require('../../dress_assets/variations/saree.png');

const partyFormalDresses = [
  { id: 'long-frock', name: 'Long frock' },
  { id: 'saree', name: 'Saree' },
];

export default function FormalDresses() {
  const router = useRouter();
  const tint = useThemeColor({}, 'tint');
  const card = useThemeColor({}, 'card');
  const inputBorder = useThemeColor({}, 'inputBorder');

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { backgroundColor: tint }]}>
        <AppBackButton onPress={() => (router as any).back()} variant="tint" />
        <ThemedText style={styles.headerTitle}>Party / Formal</ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.grid}>
        {partyFormalDresses.map((dress) => (
          <Pressable
            key={dress.id}
            onPress={() => {
              if (dress.id === 'long-frock') {
                (router as any).push({
                  pathname: '/customer/long-frock-style',
                  params: { dressLine: 'party-formal', modelName: dress.name },
                });
                return;
              }
              if (dress.id === 'saree') {
                (router as any).push({
                  pathname: '/customer/saree-style',
                  params: { dressLine: 'party-formal', modelName: dress.name },
                });
                return;
              }
              (router as any).push({
                pathname: '/customer/customize3d',
                params: {
                  modelId: dress.id,
                  modelName: dress.name,
                  dressLine: 'party-formal',
                },
              });
            }}
            style={[styles.card, { backgroundColor: card, borderColor: inputBorder }]}
          >
            <Image
              source={dress.id === 'long-frock' ? longFrockImage : dress.id === 'saree' ? sareeImage : logo}
              style={styles.thumb}
              resizeMode="contain"
            />
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
