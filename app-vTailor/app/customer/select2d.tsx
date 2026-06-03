import React from 'react';
import { View, ScrollView, Pressable, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import AppBackButton from '@/components/AppBackButton';

const logo = require('../../assets/images/vTailorlogo.jpeg');
const weddingDressesImage = require('../../dress_assets/traditional dresses.jpg');
const casualDressesImage = require('../../dress_assets/casual dresses.jpg');
const partyFormalDressesImage = require('../../dress_assets/partyformal 2.jpg');

const models = [
  { id: 'party-formal', name: 'Party / Formal dress' },
  { id: 'wedding', name: 'Wedding dress' },
  { id: 'casual', name: 'Casual dress' },
];

export default function Select2D() {
  const router = useRouter();
  const tint = useThemeColor({}, 'tint');
  const card = useThemeColor({}, 'card');
  const inputBorder = useThemeColor({}, 'inputBorder');

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { backgroundColor: tint }]}>
        <AppBackButton onPress={() => (router as any).back()} variant="tint" />
        <ThemedText style={styles.headerTitle}>What do you want to stitch?</ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.grid}>
        {models.map((m) => (
          <Pressable
            key={m.id}
            onPress={() => {
              if (m.id === 'party-formal') {
                (router as any).push('/customer/formal-dresses');
              } else if (m.id === 'wedding') {
                (router as any).push('/customer/wedding-dresses');
              } else if (m.id === 'casual') {
                (router as any).push('/customer/casual-dresses');
              } else {
                (router as any).push({ pathname: '/customer/customize3d', params: { modelId: m.id, modelName: m.name } });
              }
            }}
            style={[styles.card, { backgroundColor: card, borderColor: inputBorder }]}
          >
            <Image
              source={
                m.id === 'wedding'
                  ? weddingDressesImage
                  : m.id === 'casual'
                    ? casualDressesImage
                    : m.id === 'party-formal'
                      ? partyFormalDressesImage
                      : logo
              }
              style={styles.thumb}
              resizeMode="contain"
            />
            <ThemedText style={styles.modelName}>{m.name}</ThemedText>
          </Pressable>
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 40, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerSpacer: { width: 84 },
  headerTitle: { flex: 1, color: '#fff', fontWeight: '700', fontSize: 16, textAlign: 'center' },
  grid: { padding: 12, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { width: '48%', borderRadius: 12, marginBottom: 12, overflow: 'hidden', alignItems: 'center', borderWidth: 2 },
  thumb: { width: '100%', height: 140 },
  modelName: { padding: 10, fontWeight: '600', textAlign: 'center' },
});
