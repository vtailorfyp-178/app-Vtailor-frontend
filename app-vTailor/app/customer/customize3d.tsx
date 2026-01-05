import React, { useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

type TabId = 'neck' | 'sleeves' | 'length' | 'accessories' | 'fabric' | 'colors';

const tabs: { id: TabId; label: string; icon: string }[] = [
  { id: 'neck', label: 'Neck', icon: '👔' },
  { id: 'sleeves', label: 'Sleeves', icon: '💪' },
  { id: 'length', label: 'Length', icon: '📏' },
  { id: 'accessories', label: 'Accessories', icon: '✨' },
  { id: 'fabric', label: 'Fabric', icon: '🧵' },
  { id: 'colors', label: 'Colors', icon: '🎨' },
];

const options: Record<TabId, Array<{ id: string; name: string; preview: string }>> = {
  neck: [
    { id: 'round', name: 'Round Neck', preview: '⭕' },
    { id: 'v-neck', name: 'V-Neck', preview: '🔻' },
    { id: 'collar', name: 'Collar', preview: '👔' },
  ],
  sleeves: [
    { id: 'full', name: 'Full Sleeves', preview: '🦾' },
    { id: 'half', name: 'Half Sleeves', preview: '💪' },
  ],
  length: [
    { id: 'short', name: 'Short', preview: '📏' },
    { id: 'long', name: 'Long', preview: '📜' },
  ],
  accessories: [
    { id: 'buttons', name: 'Buttons', preview: '🔘' },
    { id: 'embroidery', name: 'Embroidery', preview: '🪡' },
  ],
  fabric: [
    { id: 'cotton', name: 'Cotton', preview: '🌿' },
    { id: 'silk', name: 'Silk', preview: '🧣' },
  ],
  colors: [
    { id: 'navy', name: 'Navy', preview: '🔵' },
    { id: 'rose', name: 'Rose Pink', preview: '🩷' },
  ],
};

export default function Customize3D() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const modelId = (params.modelId as string) || '';
  const tint = useThemeColor({}, 'tint');
  const card = useThemeColor({}, 'card');
  const inputBorder = useThemeColor({}, 'inputBorder');

  const [activeTab, setActiveTab] = useState<TabId>('neck');
  const defaultSelections: Record<TabId, string | null> = {
    neck: null,
    sleeves: null,
    length: null,
    accessories: null,
    fabric: null,
    colors: null,
  };

  const initialSelections: Record<TabId, string | null> = (() => {
    try {
      const s = params?.selections ? JSON.parse(params.selections as string) : null;
      return s ? { ...defaultSelections, ...(s as any) } : defaultSelections;
    } catch (e) {
      return defaultSelections;
    }
  })();

  const [selections, setSelections] = useState<Record<TabId, string | null>>(initialSelections);

  const handleSelect = (tab: TabId, id: string) => {
    setSelections((p) => ({ ...p, [tab]: id }));
  };

  const saveCustomization = async () => {
    try {
      const listRaw = await AsyncStorage.getItem('CUSTOMIZATIONS');
      const list = listRaw ? JSON.parse(listRaw) : [];
      const item = {
        id: Date.now().toString(),
        modelId,
        modelName: (params.modelName as string) || '',
        selections,
        createdAt: new Date().toISOString(),
      };
      list.push(item);
      await AsyncStorage.setItem('CUSTOMIZATIONS', JSON.stringify(list));
    } catch (e) {
      // ignore storage errors for now
    }
  };

  const completed = Object.values(selections).filter(Boolean).length;
  const isComplete = completed === tabs.length;

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { backgroundColor: tint }]}> 
        <Pressable onPress={() => (router as any).back()}><ThemedText style={{ color: '#fff' }}>{'< Back'}</ThemedText></Pressable>
        <ThemedText style={styles.headerTitle}>3D Customization</ThemedText>
        <View style={{ width: 56 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.preview, { backgroundColor: card, borderColor: inputBorder }]}> 
          {modelId === 'maxi' ? (
            <Image source={require('../../2d model/Maxi 1.jpeg')} style={styles.previewImage} resizeMode="contain" />
          ) : modelId === 'kurti' ? (
            <Image source={require('../../2d model/kurti 2.jpeg')} style={styles.previewImage} resizeMode="contain" />
          ) : modelId === 'short-frock' ? (
            <Image source={require('../../2d model/short frock.jpeg')} style={styles.previewImage} resizeMode="contain" />
          ) : modelId === 'long-frock' ? (
            <Image source={require('../../2d model/long frock 1.jpeg')} style={styles.previewImage} resizeMode="contain" />
          ) : modelId === 'shalwar-kameez' ? (
            <Image source={require('../../2d model/shalwar kameez 1.jpeg')} style={styles.previewImage} resizeMode="contain" />
          ) : (
            <ThemedText>3D Avatar Preview</ThemedText>
          )}
        </View>

        <View style={styles.suggestions}>
          <ThemedText style={{ fontWeight: '700', marginBottom: 8 }}>AI Suggestions</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[{ d: 'Formal Elegance', desc: 'V-neck with full sleeves in navy silk' }].map((s, i) => (
              <View key={i} style={[styles.suggCard, { backgroundColor: card, borderColor: inputBorder }]}> 
                <ThemedText style={{ fontWeight: '600' }}>{s.d}</ThemedText>
                <ThemedText style={{ color: '#6b7280' }}>{s.desc}</ThemedText>
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={styles.optionsWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {tabs.map((t) => (
              <Pressable key={t.id} onPress={() => setActiveTab(t.id)} style={[styles.tabBtn, activeTab === t.id && { backgroundColor: tint }]}> 
                <ThemedText style={activeTab === t.id ? { color: '#fff' } : {}}>{t.icon}</ThemedText>
                <ThemedText style={[activeTab === t.id ? { color: '#fff' } : {}, { fontSize: 12 }]}>{t.label}</ThemedText>
              </Pressable>
            ))}
          </ScrollView>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
            {options[activeTab].map((opt) => (
              <Pressable key={opt.id} onPress={() => handleSelect(activeTab, opt.id)} style={[styles.optCard, selections[activeTab] === opt.id && { borderColor: tint, borderWidth: 2 }]}> 
                <ThemedText style={{ fontSize: 24, textAlign: 'center' }}>{opt.preview}</ThemedText>
                <ThemedText style={{ fontSize: 12, textAlign: 'center' }}>{opt.name}</ThemedText>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

        <View style={[styles.footer, { borderTopColor: inputBorder, backgroundColor: card }]}> 
        <Pressable
          onPress={async () => {
            if (!isComplete) return;
            await saveCustomization();
            (router as any).push({
              pathname: '/customer/preview-customization',
              params: { modelId, modelName: (params.modelName as string) || '', selections: JSON.stringify(selections) },
            });
          }}
          disabled={!isComplete}
          style={[styles.proceed, { backgroundColor: isComplete ? tint : '#f3f4f6' }]}
        >
          <ThemedText style={{ color: isComplete ? '#fff' : '#999' }}>{isComplete ? 'Preview Customization' : `Complete selections (${completed}/${tabs.length})`}</ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 40, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { color: '#fff', fontWeight: '700' },
  scroll: { padding: 12 },
  preview: { height: 220, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  suggestions: { marginTop: 12 },
  suggCard: { padding: 12, borderRadius: 12, marginRight: 8, borderWidth: 1 },
  previewImage: { width: '100%', height: '100%' },
  optionsWrap: { paddingTop: 12 },
  tabBtn: { padding: 10, borderRadius: 12, marginRight: 8, alignItems: 'center' },
  optCard: { width: 88, padding: 10, borderRadius: 12, marginRight: 8, borderWidth: 1, alignItems: 'center' },
  footer: { padding: 12 },
  proceed: { padding: 14, borderRadius: 12, alignItems: 'center' },
});
