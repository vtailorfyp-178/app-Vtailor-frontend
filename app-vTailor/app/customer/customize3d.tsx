import React, { useMemo, useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet, Image, useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/contexts/AuthContext';
import { saveUserCustomization } from '@/services/userDataService';
import { Ionicons } from '@expo/vector-icons';
import AppBackButton from '@/components/AppBackButton';
import { TraditionalDressGlbViewer } from '@/components/TraditionalDressGlbViewer';

const GLB_TRADITIONAL_LONG_FROCK = require('../../3d model/traditional dress 3d model.glb');
const GLB_BEIGE_ETHNIC_GOWN_LONG_FROCK = require('../../3d model/beige ethnic gown 3d model.glb');
const GLB_BEIGE_SHARARA_BELL = require('../../3d model/beige dress 3d model.glb');
const GLB_BEIGE_ETHNIC_SHARARA_FULL = require('../../3d model/beige ethnic dress 3d model.glb');
const GLB_BEIGE_GOWN_SHARARA_ROUND_BELL = require('../../3d model/beige gown 3d model.glb');
const GLB_BEIGE_TRADITIONAL_OUTFIT_SHARARA_ROUND_FULL = require('../../3d model/beige traditional outfit 3d model.glb');
const GLB_PEACH_CAPE_SHALWAR_V_BELL_STRAIGHT = require('../../3d model/peach cape dress 3d model.glb');
const GLB_PEACH_TUNIC_SHALWAR_V_FULL_STRAIGHT = require('../../3d model/peach tunic 3d model.glb');
const GLB_PINK_ANARKALI_SHORT_FROCK_SHALWAR_ROUND_BELL_STRAIGHT = require('../../3d model/pink anarkali dress 3d model.glb');
const GLB_PINK_SALWAR_KAMEEZ_SHORT_FROCK_V_BELL_STRAIGHT = require('../../3d model/pink salwar kameez 3d model.glb');
const GLB_ETHNIC_GOWN_MARKED_LONG_FROCK_ROUND_BELL_FLARED = require('../../3d model/ethnic gown 3d model (1).glb');

type TabId = 'neck' | 'sleeves' | 'bottom' | 'frock-style' | 'colors';
type CustomizationOption = { id: string; name: string; color?: string; emoji?: string };

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

const shararaBottomOptions: CustomizationOption[] = [{ id: 'flared', name: 'Flared Style' }];

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
  { id: 'beige', name: 'Beige' },
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

const options: Record<TabId, CustomizationOption[]> = {
  neck: neckOptions,
  sleeves: sleeveOptions,
  bottom: bottomOptions,
  'frock-style': frockStyleOptions,
  colors: colorOptions,
};

/**
 * Party/Formal → Long Frock → V-neck + full path: beige ethnic gown GLB as soon as both are picked,
 * through Frock Style flared-bottom + Beige color; hidden for non-beige colors once a color is selected.
 */
function shouldShowBeigeEthnicGownLongFrockGlbCombo(s: Record<TabId, string | null>, mid: string) {
  if (mid !== 'long-frock') return false;
  if (s.neck !== 'v-neck' || s.sleeves !== 'full') return false;
  const col = s.colors;
  if (col != null && col !== 'beige') return false;
  return true;
}

/**
 * Party/Formal → Long Frock → V-neck + bell path: traditional dress GLB as soon as both are picked,
 * through Frock Style flared-bottom + Beige color; hidden for non-beige colors once a color is selected.
 */
function shouldShowTraditionalDressGlbCombo(s: Record<TabId, string | null>, mid: string) {
  if (mid !== 'long-frock') return false;
  if (s.neck !== 'v-neck' || s.sleeves !== 'bell') return false;
  const col = s.colors;
  if (col != null && col !== 'beige') return false;
  return true;
}

/**
 * Party/Formal → Long Frock → round + bell path: ethnic gown (1) GLB as soon as both are picked,
 * through Frock Style flared-bottom + Beige color; hidden for non-beige colors once a color is selected.
 */
function shouldShowEthnicGownMarkedLongFrockRoundBellFlaredGlbCombo(
  s: Record<TabId, string | null>,
  mid: string
) {
  if (mid !== 'long-frock') return false;
  if (s.neck !== 'round' || s.sleeves !== 'bell') return false;
  const col = s.colors;
  if (col != null && col !== 'beige') return false;
  return true;
}

/**
 * Party/Formal → Short Frock with Shalwar → round + bell path: pink anarkali dress GLB as soon as both are picked,
 * through straight bottom + Beige color; hidden for non-beige colors once a color is selected.
 * If bottom is chosen and not straight, this GLB does not apply.
 */
function shouldShowPinkAnarkaliShortFrockShalwarRoundBellStraightGlbCombo(
  s: Record<TabId, string | null>,
  mid: string
) {
  if (mid !== 'short-frock-shalwar') return false;
  if (s.neck !== 'round' || s.sleeves !== 'bell') return false;
  const col = s.colors;
  if (col != null && col !== 'beige') return false;
  if (s.bottom != null && s.bottom !== 'straight') return false;
  return true;
}

/**
 * Party/Formal → Short Frock with Shalwar → V-neck + bell path: pink salwar kameez GLB as soon as both are picked,
 * through straight bottom + Beige color; hidden for non-beige colors once a color is selected.
 * If bottom is chosen and not straight, this GLB does not apply.
 */
function shouldShowPinkSalwarKameezShortFrockShalwarVNeckBellStraightGlbCombo(
  s: Record<TabId, string | null>,
  mid: string
) {
  if (mid !== 'short-frock-shalwar') return false;
  if (s.neck !== 'v-neck' || s.sleeves !== 'bell') return false;
  const col = s.colors;
  if (col != null && col !== 'beige') return false;
  if (s.bottom != null && s.bottom !== 'straight') return false;
  return true;
}

/**
 * Traditional → Shalwar Kameez → V-neck + bell path: peach cape dress GLB as soon as both are picked,
 * through straight bottom + Beige color; hidden for non-beige colors once a color is selected.
 * If bottom is chosen and not straight, this GLB does not apply.
 */
function shouldShowPeachCapeShalwarKameezVNeckBellStraightGlbCombo(s: Record<TabId, string | null>, mid: string) {
  if (mid !== 'shalwar-kameez') return false;
  if (s.neck !== 'v-neck' || s.sleeves !== 'bell') return false;
  const col = s.colors;
  if (col != null && col !== 'beige') return false;
  if (s.bottom != null && s.bottom !== 'straight') return false;
  return true;
}

/**
 * Traditional → Shalwar Kameez → V-neck: peach tunic GLB as soon as V-neck is chosen (default V-neck preview),
 * through straight bottom + Beige color. Peach cape (V-neck + bell path) is checked first in resolver and wins when bell is selected.
 */
function shouldShowPeachTunicShalwarKameezVNeckFullStraightGlbCombo(s: Record<TabId, string | null>, mid: string) {
  if (mid !== 'shalwar-kameez') return false;
  if (s.neck !== 'v-neck') return false;
  const col = s.colors;
  if (col != null && col !== 'beige') return false;
  if (s.bottom != null && s.bottom !== 'straight') return false;
  return true;
}

/**
 * Traditional → Sharara → round + bell path: beige gown GLB as soon as both are picked,
 * through flared bottom + Beige color; hidden for non-beige colors once a color is selected.
 */
function shouldShowBeigeGownShararaRoundBellGlbCombo(s: Record<TabId, string | null>, mid: string) {
  if (mid !== 'sharara') return false;
  if (s.neck !== 'round' || s.sleeves !== 'bell') return false;
  const col = s.colors;
  if (col != null && col !== 'beige') return false;
  return true;
}

/**
 * Traditional → Sharara: show Sharara reference image until Neck or Sleeves is chosen;
 * then beige traditional outfit GLB for the round + full-sleeves line (& beige/non-beige color rules).
 * Round + bell (any bottom) uses beige gown (checked earlier in resolver).
 */
function shouldShowBeigeTraditionalOutfitShararaProgressiveGlbCombo(s: Record<TabId, string | null>, mid: string) {
  if (mid !== 'sharara') return false;
  if (s.neck == null && s.sleeves == null) return false;
  const col = s.colors;
  if (col != null && col !== 'beige') return false;
  if (s.neck === 'v-neck') return false;
  if (s.neck === 'round' && s.sleeves === 'bell') return false;
  return true;
}

/**
 * Traditional → Sharara → V-neck + bell path: beige dress GLB as soon as both are picked,
 * through flared bottom + Beige color; hidden for non-beige colors once a color is selected.
 */
function shouldShowBeigeDressShararaGlbCombo(s: Record<TabId, string | null>, mid: string) {
  if (mid !== 'sharara') return false;
  if (s.neck !== 'v-neck' || s.sleeves !== 'bell') return false;
  const col = s.colors;
  if (col != null && col !== 'beige') return false;
  return true;
}

/**
 * Traditional → Sharara → V-neck path: beige ethnic dress GLB (full-sleeves line), progressive;
 * bell sleeves belong to beige dress GLB instead.
 */
function shouldShowBeigeEthnicShararaGlbCombo(s: Record<TabId, string | null>, mid: string) {
  if (mid !== 'sharara') return false;
  if (s.neck !== 'v-neck') return false;
  const col = s.colors;
  if (col != null && col !== 'beige') return false;
  if (s.sleeves === 'bell') return false;
  return true;
}

function resolveBundledDressGlb(s: Record<TabId, string | null>, mid: string): number | null {
  if (shouldShowBeigeEthnicGownLongFrockGlbCombo(s, mid)) return GLB_BEIGE_ETHNIC_GOWN_LONG_FROCK as number;
  if (shouldShowTraditionalDressGlbCombo(s, mid)) return GLB_TRADITIONAL_LONG_FROCK as number;
  if (shouldShowEthnicGownMarkedLongFrockRoundBellFlaredGlbCombo(s, mid))
    return GLB_ETHNIC_GOWN_MARKED_LONG_FROCK_ROUND_BELL_FLARED as number;
  if (shouldShowPinkAnarkaliShortFrockShalwarRoundBellStraightGlbCombo(s, mid))
    return GLB_PINK_ANARKALI_SHORT_FROCK_SHALWAR_ROUND_BELL_STRAIGHT as number;
  if (shouldShowPinkSalwarKameezShortFrockShalwarVNeckBellStraightGlbCombo(s, mid))
    return GLB_PINK_SALWAR_KAMEEZ_SHORT_FROCK_V_BELL_STRAIGHT as number;
  if (shouldShowPeachCapeShalwarKameezVNeckBellStraightGlbCombo(s, mid))
    return GLB_PEACH_CAPE_SHALWAR_V_BELL_STRAIGHT as number;
  if (shouldShowPeachTunicShalwarKameezVNeckFullStraightGlbCombo(s, mid))
    return GLB_PEACH_TUNIC_SHALWAR_V_FULL_STRAIGHT as number;
  if (shouldShowBeigeGownShararaRoundBellGlbCombo(s, mid)) return GLB_BEIGE_GOWN_SHARARA_ROUND_BELL as number;
  if (shouldShowBeigeTraditionalOutfitShararaProgressiveGlbCombo(s, mid))
    return GLB_BEIGE_TRADITIONAL_OUTFIT_SHARARA_ROUND_FULL as number;
  if (shouldShowBeigeEthnicShararaGlbCombo(s, mid)) return GLB_BEIGE_ETHNIC_SHARARA_FULL as number;
  if (shouldShowBeigeDressShararaGlbCombo(s, mid)) return GLB_BEIGE_SHARARA_BELL as number;
  return null;
}

export default function Customize3D() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { width: screenW } = useWindowDimensions();
  const glViewportW = Math.max(280, Math.floor(screenW - 48));
  const glViewportH = 320;

  const { userId } = useAuth();
  const modelId = (params.modelId as string) || '';
  const tint = useThemeColor({}, 'tint');
  const card = useThemeColor({}, 'card');
  const inputBorder = useThemeColor({}, 'inputBorder');

  /** Long/short frock & gown use frock-style; short-frock-shalwar uses bottom (shalwar) like traditional kameez. */
  const usesFrockStyleTab = ['long-frock', 'short-frock', 'gown'].includes(modelId);
  const isSharara = modelId === 'sharara';

  const availableTabs = useMemo(() => {
    if (usesFrockStyleTab) {
      return baseTabs.filter((tab) => ['neck', 'sleeves', 'frock-style', 'colors'].includes(tab.id));
    }

    return baseTabs.filter((tab) => ['neck', 'sleeves', 'bottom', 'colors'].includes(tab.id));
  }, [usesFrockStyleTab]);

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

  const getOptions = (tab: TabId): CustomizationOption[] => {
    if (tab === 'bottom' && isSharara) {
      return shararaBottomOptions;
    }

    return options[tab];
  };

  const saveCustomization = async () => {
    try {
      const item = {
        id: Date.now().toString(),
        modelId,
        modelName: (params.modelName as string) || '',
        selections,
        createdAt: new Date().toISOString(),
      };

      // Save to global storage for backward compat
      const listRaw = await AsyncStorage.getItem('CUSTOMIZATIONS');
      const list = listRaw ? JSON.parse(listRaw) : [];
      list.push(item);
      await AsyncStorage.setItem('CUSTOMIZATIONS', JSON.stringify(list));

      // Also save to user-specific storage if userId exists
      if (userId) {
        await saveUserCustomization(userId, item);
      }
    } catch (e) {
      // ignore storage errors for now
    }
  };

  const completed = availableTabs.filter((tab) => Boolean(selections[tab.id])).length;
  const isComplete = completed === availableTabs.length;
  const activeOptionName = getOptions(activeTab).find((opt) => opt.id === selections[activeTab])?.name;
  const modelName = (params.modelName as string) || 'your dress';
  const selectedColor = colorOptions.find((opt) => opt.id === selections.colors)?.name;
  const suggestionText = selectedColor
    ? `${selectedColor} works beautifully for ${modelName}. Pair it with balanced sleeves and a clean neckline for an elegant stitched look.`
    : `Choose a color first to get fabric, season, and styling suggestions for ${modelName}.`;

  const activeGlbModule = resolveBundledDressGlb(selections, modelId);
  const showGlb3d = activeGlbModule != null;

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
        <AppBackButton onPress={() => (router as any).back()} variant="tint" />
        <ThemedText style={styles.headerTitle}>3D Customization</ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View
          style={[
            styles.preview,
            {
              backgroundColor: card,
              borderColor: inputBorder,
              height: showGlb3d ? glViewportH + 16 : 220,
              minHeight: showGlb3d ? glViewportH + 16 : 220,
              alignItems: 'center',
            },
          ]}
        >
          {showGlb3d && activeGlbModule != null ? (
            <TraditionalDressGlbViewer
              key={activeGlbModule}
              glbModule={activeGlbModule}
              width={glViewportW}
              height={glViewportH}
            />
          ) : imageSource ? (
            <Image source={imageSource} style={styles.previewImage} resizeMode="contain" />
          ) : (
            <ThemedText>3D Avatar Preview</ThemedText>
          )}
        </View>

        <Pressable
          onPress={() => (router as any).push('/customer/ai-assistant')}
          style={[styles.aiStyleCard, { borderColor: inputBorder, backgroundColor: card }]}
        >
          <View style={[styles.aiIconBox, { backgroundColor: '#fdf2f8' }]}>
            <Ionicons name="sparkles-outline" size={22} color={tint} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.aiTitleRow}>
              <ThemedText style={styles.aiTitle}>AI Style Suggestions</ThemedText>
              <View style={[styles.aiPill, { backgroundColor: tint }]}>
                <ThemedText style={styles.aiPillText}>Ask AI</ThemedText>
              </View>
            </View>
            <ThemedText style={styles.aiDesc}>
              {suggestionText}
            </ThemedText>
            <ThemedText style={styles.aiMeta}>
              {activeOptionName ? `Current ${activeTab.replace('-', ' ')}: ${activeOptionName}` : 'Select options to personalize suggestions'}
            </ThemedText>
          </View>
        </Pressable>

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
                    {opt.id === 'beige' ? (
                      <View style={styles.colorBeigeCircle} />
                    ) : (
                      <ThemedText style={styles.colorEmoji}>{opt.emoji || '🎨'}</ThemedText>
                    )}
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
  headerSpacer: { width: 84 },
  headerTitle: { flex: 1, color: '#fff', fontWeight: '700', textAlign: 'center' },
  scroll: { padding: 12 },
  preview: { height: 220, borderRadius: 12, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  previewImage: { width: '100%', height: '100%' },
  aiStyleCard: { flexDirection: 'row', padding: 14, borderRadius: 16, borderWidth: 1, marginTop: 12, alignItems: 'flex-start' },
  aiIconBox: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  aiTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  aiTitle: { fontSize: 15, fontWeight: '800' },
  aiPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  aiPillText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  aiDesc: { marginTop: 6, fontSize: 12, lineHeight: 18, color: '#4b5563' },
  aiMeta: { marginTop: 8, fontSize: 11, color: '#be185d', fontWeight: '700' },
  optionsWrap: { paddingTop: 12 },
  tabBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, marginRight: 8, alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
  optCard: { width: 92, padding: 6, borderRadius: 12, marginRight: 8, borderWidth: 1, alignItems: 'center' },
  optImage: { width: '100%', height: 56, borderRadius: 10, backgroundColor: '#f3f4f6' },
  colorEmojiWrap: { width: '100%', height: 56, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },
  colorEmoji: { fontSize: 24 },
  /** Light beige dot — same visual weight as colored circle emojis (~24px). */
  colorBeigeCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#f2e6d6',
    borderWidth: 1,
    borderColor: 'rgba(180, 160, 130, 0.35)',
  },
  footer: { padding: 12 },
  proceed: { padding: 14, borderRadius: 12, alignItems: 'center' },
});
