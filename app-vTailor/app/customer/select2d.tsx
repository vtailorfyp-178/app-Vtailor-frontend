import React from 'react';
import { View, ScrollView, Pressable, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

const logo = require('../../assets/images/vTailorlogo.jpeg');
const traditionalDressesImage = require('../../2d model/traditional dresses.jpg');
const casualDressesImage = require('../../2d model/casual dresses.jpg');
const partyFormalDressesImage = require('../../2d model/partyformal 2.jpg');

const models = [
  { id: 'traditional', name: 'Traditional Dresses' },
  { id: 'casual', name: 'Casual Dress' },
  { id: 'party-formal', name: 'Party/Formal Dresses' },
];

export default function Select2D() {
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
        <ThemedText style={styles.headerTitle}>What do you want to stitch?</ThemedText>
        <View style={{ width: 56 }} />
      </View>

      <ScrollView contentContainerStyle={styles.grid}>
        {models.map((m) => (
          <Pressable
            key={m.id}
            onPress={() => {
              if (m.id === 'traditional') {
                (router as any).push('/customer/traditional-dresses');
              } else if (m.id === 'casual') {
                (router as any).push('/customer/casual-dresses');
              } else if (m.id === 'party-formal') {
                (router as any).push('/customer/formal-dresses');
              } else {
                (router as any).push({ pathname: '/customer/customize3d', params: { modelId: m.id, modelName: m.name } });
              }
            }}
            style={[styles.card, { backgroundColor: card, borderColor: inputBorder }]}
          >
            <Image 
              source={
                m.id === 'traditional' ? traditionalDressesImage : 
                m.id === 'casual' ? casualDressesImage : 
                m.id === 'party-formal' ? partyFormalDressesImage :
                logo
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
  headerTitle: { color: '#fff', fontWeight: '700', fontSize: 16 },
  grid: { padding: 12, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { width: '48%', borderRadius: 12, marginBottom: 12, overflow: 'hidden', alignItems: 'center', borderWidth: 2 },
  thumb: { width: '100%', height: 140 },
  modelName: { padding: 10, fontWeight: '600' },
});
