import React, { useMemo, useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

type TabId = 'neck' | 'sleeves' | 'bottom' | 'frock-style' | 'colors';

const baseTabs: { id: TabId; label: string }[] = [
  { id: 'neck', label: 'Neck' },
  { id: 'sleeves', label: 'Sleeves' },
  { id: 'bottom', label: 'Bottom' },
  { id: 'frock-style', label: 'Frock Style' },
  { id: 'colors', label: 'Colors' },
];

const neckOptions = [
  { id: 'round', name: 'Round Neck' },
  { id: 'v-neck', name: 'V-Neck' },
];

const sleeveOptions = [
  { id: 'full', name: 'Full Sleeves' },
  { id: 'bell', name: 'Bell Sleeves' },
];

const bottomOptions = [
  { id: 'straight', name: 'Straight Style' },
  { id: 'tulip', name: 'Tulip Style' },
];

const shararaBottomOptions = [{ id: 'flared', name: 'Flared Style' }];

const frockStyleOptions = [
  { id: 'flared-bottom', name: 'Flared Bottom' },
  { id: 'front-slit', name: 'Front Slit' },
];

const colorOptions = [
  { id: 'red', name: 'Red', emoji: '🔴' },
  { id: 'blue', name: 'Blue', emoji: '🔵' },
  { id: 'green', name: 'Green', emoji: '🟢' },
  { id: 'black', name: 'Black', emoji: '⚫' },
  { id: 'white', name: 'White', emoji: '⚪' },
  { id: 'yellow', name: 'Yellow', emoji: '🟡' },
];

const optionImages: Record<string, any> = {
  round: require('../../2d model/variations/round-neck.png'),
  'v-neck': require('../../2d model/variations/v-neck.png'),
  full: require('../../2d model/variations/full-sleeves.png'),
  bell: require('../../2d model/variations/bell-sleeves.png'),
  straight: require('../../2d model/variations/straight-style.png'),
  tulip: require('../../2d model/variations/tulip-style.png'),
  flared: require('../../2d model/variations/flared-bottom.png'),
  'flared-bottom': require('../../2d model/variations/flared-bottom.png'),
  'front-slit': require('../../2d model/variations/front-slit-frock.png'),
};

const options: Record<TabId, Array<{ id: string; name: string; color?: string; emoji?: string }>> = {
  neck: neckOptions,
  sleeves: sleeveOptions,
  bottom: bottomOptions,
  'frock-style': frockStyleOptions,
  colors: colorOptions,
};

export default function Customize3D() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const modelId = (params.modelId as string) || '';
  const tint = useThemeColor({}, 'tint');
  const card = useThemeColor({}, 'card');
  const inputBorder = useThemeColor({}, 'inputBorder');

  const isFrock = ['long-frock', 'short-frock', 'short-frock-shalwar', 'gown'].includes(modelId);
  const isSharara = modelId === 'sharara';

  const availableTabs = useMemo(() => {
    if (isFrock) {
      return baseTabs.filter((tab) => ['neck', 'sleeves', 'frock-style', 'colors'].includes(tab.id));
    }

    return baseTabs.filter((tab) => ['neck', 'sleeves', 'bottom', 'colors'].includes(tab.id));
  }, [isFrock]);

  const [activeTab, setActiveTab] = useState<TabId>('neck');
  const defaultSelections: Record<TabId, string | null> = {
    neck: null,
    sleeves: null,
    bottom: null,
    'frock-style': null,
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

  const getOptions = (tab: TabId) => {
    if (tab === 'bottom' && isSharara) {
      return shararaBottomOptions;
    }

    return options[tab];
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

  const completed = availableTabs.filter((tab) => Boolean(selections[tab.id])).length;
  const isComplete = completed === availableTabs.length;

  const imageSource =
    modelId === 'kurti'
      ? require('../../2d model/kurti 2.jpeg')
      : modelId === 'kurti-trouser'
      ? require('../../2d model/kurti 2.jpeg')
      : modelId === 'short-frock'
      ? require('../../2d model/short frock.jpeg')
      : modelId === 'short-frock-shalwar'
      ? require('../../2d model/short frock.jpeg')
      : modelId === 'long-frock'
      ? require('../../2d model/long frock 1.jpeg')
      : modelId === 'shalwar-kameez'
      ? require('../../2d model/shalwar kameez 1.jpeg')
      : modelId === 'sharara'
      ? require('../../2d model/shrara.jpg')
      : null;

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { backgroundColor: tint }]}> 
        <Pressable onPress={() => (router as any).back()}><ThemedText style={{ color: '#fff' }}>{'< Back'}</ThemedText></Pressable>
        <ThemedText style={styles.headerTitle}>3D Customization</ThemedText>
        <View style={{ width: 56 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.preview, { backgroundColor: card, borderColor: inputBorder }]}> 
          {imageSource ? (
            <Image source={imageSource} style={styles.previewImage} resizeMode="contain" />
          ) : (
            <ThemedText>3D Avatar Preview</ThemedText>
          )}
        </View>

        <View style={styles.optionsWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {availableTabs.map((t) => (
              <Pressable key={t.id} onPress={() => setActiveTab(t.id)} style={[styles.tabBtn, activeTab === t.id && { backgroundColor: tint }]}> 
                <ThemedText style={[activeTab === t.id ? { color: '#fff' } : {}, { fontSize: 12 }]}>{t.label}</ThemedText>
              </Pressable>
            ))}
          </ScrollView>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
            {getOptions(activeTab).map((opt) => (
              <Pressable key={opt.id} onPress={() => handleSelect(activeTab, opt.id)} style={[styles.optCard, selections[activeTab] === opt.id && { borderColor: tint, borderWidth: 2 }]}> 
                {activeTab === 'colors' ? (
                  <View style={styles.colorEmojiWrap}>
                    <ThemedText style={styles.colorEmoji}>{opt.emoji || '🎨'}</ThemedText>
                  </View>
                ) : (
                  <Image source={optionImages[opt.id] || imageSource || require('../../assets/images/vTailorlogo.jpeg')} style={styles.optImage} resizeMode="cover" />
                )}
                <ThemedText style={{ fontSize: 12, textAlign: 'center', marginTop: 8 }}>{opt.name}</ThemedText>
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
              pathname: '/customer/measurements',
              params: { modelId, modelName: (params.modelName as string) || '', selections: JSON.stringify(selections) },
            });
          }}
          disabled={!isComplete}
          style={[styles.proceed, { backgroundColor: isComplete ? tint : '#f3f4f6' }]}
        >
          <ThemedText style={{ color: isComplete ? '#fff' : '#999' }}>{isComplete ? 'Continue to Measurements' : `Complete selections (${completed}/${availableTabs.length})`}</ThemedText>
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
  previewImage: { width: '100%', height: '100%' },
  optionsWrap: { paddingTop: 12 },
  tabBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, marginRight: 8, alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
  optCard: { width: 92, padding: 6, borderRadius: 12, marginRight: 8, borderWidth: 1, alignItems: 'center' },
  optImage: { width: '100%', height: 56, borderRadius: 10, backgroundColor: '#f3f4f6' },
  colorEmojiWrap: { width: '100%', height: 56, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },
  colorEmoji: { fontSize: 24 },
  footer: { padding: 12 },
  proceed: { padding: 14, borderRadius: 12, alignItems: 'center' },
});
