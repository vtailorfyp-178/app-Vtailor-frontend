import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet, Image, Platform, useWindowDimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import AppBackButton from '@/components/AppBackButton';
import { DressGlbPreview } from '@/components/DressGlbPreview';
import { type TabId } from '@/services/dressGlbResolver';
import {
  CASUAL_FABRIC_COLOR_FAMILIES,
  fabricColorHexFromId,
  fabricColorNameFromId,
  getDefaultShadeForFamily,
  getFamilyIdForShade,
  getShadesForFamily,
  isDarkFabricHex,
  isValidFabricShadeId,
  usesCasualShortShirtFabricTint,
  usesPatiyalaRuntimeFabricTint,
} from '@/services/dressFabricColors';
import { useBundledDressGlb } from '@/hooks/useBundledDressGlb';
import {
  canShowGlbPreview,
  isReadyFor3dPreview,
  with3dPreviewDefaults,
} from '@/services/glb/threePreviewReadiness';
import {
  clearDressGlbUrlCache,
  prefetchDressGlbUrl,
  prefetchDressModelCatalog,
  resolveDressGlbUrlCached,
} from '@/services/glb/glbUrlResolve';
import { prefetchGltfScene } from '@/services/glb/loadGltfFromUrl';
import { prefetchGlbBuffer } from '@/services/glb/loadGltfFromUrl';
import { clearParsedSceneCache } from '@/services/glb/glbParsedSceneCache';
import { safeRouterBack } from '@/utils/safeRouterBack';
import type { Href } from 'expo-router';
import { resolveCustomizePreviewImage } from '@/services/dressCustomizePreview';

type CustomizationOption = { id: string; name: string; color?: string; emoji?: string; hex?: string };

type TabConfig = { id: TabId; label: string };

const MODELS_WITH_GLB_CATALOG = new Set([
  'shalwar-kameez-short',
  'short-frock-shalwar',
  'long-frock',
  'saree',
  'grarah-short-shirt',
  'grarah-peplum',
  'lehnga-bridal',
  'lehnga-circular',
]);

const neckOptions: CustomizationOption[] = [
  { id: 'round', name: 'Round neck' },
  { id: 'v-neck', name: 'V-neck' },
];

const casualShortShirtNeckOptions: CustomizationOption[] = [
  { id: 'round', name: 'Round neck' },
  { id: 'v-neck', name: 'V-neck' },
  { id: 'square', name: 'Square neck' },
  { id: 'boat-neck', name: 'Boat neck' },
];

const casualShortShirtSleeveOptions: CustomizationOption[] = [
  { id: 'full', name: 'Full sleeves' },
  { id: 'bell', name: 'Bell sleeves' },
  { id: 'balloon', name: 'Balloon / puff sleeves' },
  { id: 'layered', name: 'Layered sleeves' },
];

const shalwarKameezNeckOptions: CustomizationOption[] = [
  { id: 'round', name: 'Round neck' },
  { id: 'v-neck', name: 'V-neck' },
  { id: 'square', name: 'Square neck' },
];

const bridalNeckOptions: CustomizationOption[] = [
  { id: 'round', name: 'Round neck' },
  { id: 'sweetheart', name: 'Sweetheart neck' },
];

const sleeveOptionsFull: CustomizationOption[] = [
  { id: 'full', name: 'Full sleeves' },
  { id: 'bell', name: 'Bell sleeves' },
];

const sareeSleeveOptions: CustomizationOption[] = [
  { id: 'full', name: 'Full sleeves' },
  { id: 'short', name: 'Short sleeves' },
];

const sareeColorOptions: CustomizationOption[] = [
  { id: 'red', name: 'Red', emoji: '🔴' },
  { id: 'blue', name: 'Blue', emoji: '🔵' },
  { id: 'white', name: 'White', emoji: '⚪' },
  { id: 'black', name: 'Black', emoji: '⚫' },
];

const grarahColorOptions: CustomizationOption[] = [...sareeColorOptions];

const grarahSleeveOptions: CustomizationOption[] = [
  { id: 'full', name: 'Full sleeves' },
  { id: 'bell', name: 'Flared bell sleeves' },
];

const bridalSleeveOptions: CustomizationOption[] = [
  { id: 'full', name: 'Full sleeves' },
  { id: 'short', name: 'Short sleeves' },
];

const bridalColorOptions: CustomizationOption[] = [
  { id: 'peach', name: 'Peach', hex: '#E8B89D' },
  { id: 'maroon', name: 'Maroon', hex: '#6B1F2B' },
  { id: 'iceblue', name: 'Ice blue', hex: '#A8D8EA' },
  { id: 'red', name: 'Red', hex: '#C62828' },
];

const bottomOptions = [
  { id: 'straight', name: 'Straight style' },
  { id: 'tulip', name: 'Tulip style' },
];

const CASUAL_SHALWAR_BOTTOM_IDS = new Set(['patiyala', 'straight']);

const shararaBottomOptions: CustomizationOption[] = [{ id: 'flared', name: 'Flared style' }];

const frockStyleOptions = [
  { id: 'flared-bottom', name: 'Flared' },
  { id: 'front-slit', name: 'Front slit' },
];

const sareeStyleOptions: CustomizationOption[] = [
  { id: 'plain', name: 'Plain' },
  { id: 'frill', name: 'Frill' },
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

const LONG_FROCK_EXCLUDED_COLORS = new Set(['green', 'yellow', 'beige']);

const imgPlainSaree = require('../../2d model/variations/plain saree.png');
const imgFrillSaree = require('../../2d model/variations/frill saree.png');
const imgSaree = require('../../2d model/variations/saree.png');
const imgShortShirtShalwar = require('../../2d model/short-shirt-shalwar.png');
const imgCasualDress = require('../../2d model/casual dresses.jpg');

const optionImages: Record<string, any> = {
  round: require('../../2d model/variations/round-neck.png'),
  'v-neck': require('../../2d model/variations/v-neck.png'),
  square: require('../../2d model/variations/square neck.png'),
  'boat-neck': require('../../2d model/variations/boat neck.png'),
  balloon: require('../../2d model/variations/balloon-sleeves.png'),
  layered: require('../../2d model/variations/layered-sleeves.png'),
  sweetheart: require('../../2d model/variations/sweatheart neckline.png'),
  full: require('../../2d model/variations/full-sleeves.png'),
  short: require('../../2d model/variations/short-sleeves.png'),
  bell: require('../../2d model/variations/bell-sleeves.png'),
  'flared-bell': require('../../2d model/variations/flarred-bell-sleeves.png'),
  straight: require('../../2d model/variations/straight-style.png'),
  tulip: require('../../2d model/variations/tulip-style.png'),
  patiyala: require('../../2d model/variations/patiyala-shalwar.png'),
  flared: require('../../2d model/variations/flared-bottom.png'),
  'flared-bottom': require('../../2d model/variations/flared-bottom.png'),
  'front-slit': require('../../2d model/variations/front-slit-frock.png'),
  plain: imgPlainSaree,
  frill: imgFrillSaree,
  saree: imgSaree,
};

function stripLongFrockDisallowedColors(
  mid: string,
  s: Record<TabId, string | null>,
): Record<TabId, string | null> {
  if (mid !== 'long-frock') return s;
  if (s.colors != null && LONG_FROCK_EXCLUDED_COLORS.has(s.colors)) return { ...s, colors: null };
  return s;
}

function isValidFrockStyleId(id: string): id is 'flared-bottom' | 'front-slit' {
  return id === 'flared-bottom' || id === 'front-slit';
}

function isValidSareeStyleId(id: string): id is 'plain' | 'frill' {
  return id === 'plain' || id === 'frill';
}

function isValidShalwarBottomId(id: string): boolean {
  return CASUAL_SHALWAR_BOTTOM_IDS.has(id);
}

function isCasualShortShirtModel(modelId: string): boolean {
  return modelId === 'shalwar-kameez-short';
}

function isCasualShortShirtWithFabricTint(
  modelId: string,
  bottom: string | null | undefined,
): boolean {
  if (!isCasualShortShirtModel(modelId)) return false;
  if (bottom == null) return true;
  return bottom === 'patiyala' || bottom === 'straight';
}

function isShalwarKameezModel(modelId: string): boolean {
  return (
    modelId === 'shalwar-kameez' ||
    modelId === 'shalwar-kameez-long' ||
    modelId === 'shalwar-kameez-short' ||
    modelId === 'short-frock-shalwar'
  );
}

function initialActiveTab(modelId: string, styleLocked: boolean): TabId {
  if (modelId === 'saree' && styleLocked) return 'neck';
  if (modelId === 'saree') return 'saree-style';
  if (modelId === 'long-frock' && styleLocked) return 'neck';
  if (modelId === 'long-frock') return 'frock-style';
  if (isCasualShortShirtModel(modelId) && styleLocked) return 'neck';
  return 'neck';
}

function customize3dBackFallback(dressLine: string, modelId: string): Href {
  if (dressLine === 'wedding') return '/customer/wedding-dresses';
  if (dressLine === 'party-formal') return '/customer/formal-dresses';
  if (dressLine === 'casual') return '/customer/casual-dresses';
  if (modelId === 'grarah-short-shirt' || modelId === 'grarah-peplum') {
    return '/customer/grarah-style';
  }
  if (modelId === 'lehnga-bridal' || modelId === 'lehnga-circular') {
    return '/customer/lehnga-style';
  }
  if (modelId === 'long-frock') return '/customer/long-frock-style';
  if (modelId === 'saree') return '/customer/saree-style';
  if (isCasualShortShirtModel(modelId)) return '/customer/shalwar-kameez-bottom-style';
  return '/customer';
}

export default function Customize3D() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { width: screenW, height: screenH } = useWindowDimensions();
  const glViewportW = Math.max(280, Math.floor(screenW - 48));
  const glViewportH =
    Platform.OS === 'web'
      ? Math.min(440, Math.max(360, Math.floor(screenH * 0.42)))
      : Math.min(400, Math.max(300, Math.floor(screenH * 0.38)));

  const modelId = (params.modelId as string) || '';
  const dressLine = (params.dressLine as string) || '';
  const presetFrockStyleRaw = (params.presetFrockStyle as string) || '';
  const presetFrockStyle = isValidFrockStyleId(presetFrockStyleRaw) ? presetFrockStyleRaw : '';
  const presetSareeStyleRaw = (params.presetSareeStyle as string) || '';
  const presetSareeStyle = isValidSareeStyleId(presetSareeStyleRaw) ? presetSareeStyleRaw : '';
  const presetBottomRaw = (params.presetBottom as string) || '';
  const presetBottom = isValidShalwarBottomId(presetBottomRaw) ? presetBottomRaw : '';
  const shirtStyleName = (params.shirtStyleName as string) || '';
  const shalwarTypeName = (params.shalwarTypeName as string) || '';
  const tint = useThemeColor({}, 'tint');
  const card = useThemeColor({}, 'card');
  const inputBorder = useThemeColor({}, 'inputBorder');

  const isSaree = modelId === 'saree';
  const isGrarah = modelId === 'grarah-short-shirt' || modelId === 'grarah-peplum';
  const isLehngaBridal = modelId === 'lehnga-bridal';
  const isLehngaCircular = modelId === 'lehnga-circular';
  const isLehngaStyle = isLehngaBridal || isLehngaCircular;
  const isCasualShortShirt = isCasualShortShirtModel(modelId);
  const usesFrockStyleTab = ['long-frock', 'short-frock', 'gown'].includes(modelId);
  const isSharara = modelId === 'sharara';

  const frockStyleLocked = useMemo(() => {
    if (modelId !== 'long-frock') return false;
    if (presetFrockStyle) return true;
    try {
      const s = params?.selections ? JSON.parse(params.selections as string) : null;
      const fs = s?.['frock-style'];
      return typeof fs === 'string' && isValidFrockStyleId(fs);
    } catch {
      return false;
    }
  }, [modelId, presetFrockStyle, params.selections]);

  const sareeStyleLocked = useMemo(() => {
    if (modelId !== 'saree') return false;
    if (presetSareeStyle) return true;
    try {
      const s = params?.selections ? JSON.parse(params.selections as string) : null;
      const ss = s?.['saree-style'];
      return typeof ss === 'string' && isValidSareeStyleId(ss);
    } catch {
      return false;
    }
  }, [modelId, presetSareeStyle, params.selections]);

  const shalwarBottomLocked = useMemo(() => {
    if (!isCasualShortShirt) return false;
    if (presetBottom) return true;
    try {
      const s = params?.selections ? JSON.parse(params.selections as string) : null;
      const b = s?.bottom;
      return typeof b === 'string' && isValidShalwarBottomId(b);
    } catch {
      return false;
    }
  }, [isCasualShortShirt, presetBottom, params.selections]);

  const availableTabs = useMemo((): TabConfig[] => {
    if (isCasualShortShirt && shalwarBottomLocked) {
      return [
        { id: 'neck', label: 'Neck' },
        { id: 'sleeves', label: 'Sleeves' },
        { id: 'colors', label: 'Colors' },
      ];
    }
    if (isGrarah || isLehngaStyle) {
      return [
        { id: 'neck', label: 'Neck' },
        { id: 'sleeves', label: 'Sleeves' },
        { id: 'colors', label: 'Colors' },
      ];
    }
    if (isSaree && sareeStyleLocked) {
      return [
        { id: 'neck', label: 'Neck' },
        { id: 'sleeves', label: 'Sleeves' },
        { id: 'colors', label: 'Colors' },
      ];
    }
    if (isSaree) {
      return [
        { id: 'saree-style', label: 'Saree style' },
        { id: 'neck', label: 'Neck' },
        { id: 'sleeves', label: 'Sleeves' },
        { id: 'colors', label: 'Colors' },
      ];
    }
    if (modelId === 'long-frock' && frockStyleLocked) {
      return [
        { id: 'neck', label: 'Neck' },
        { id: 'sleeves', label: 'Sleeves' },
        { id: 'colors', label: 'Colors' },
      ];
    }
    if (modelId === 'long-frock') {
      return [
        { id: 'frock-style', label: 'Dress style' },
        { id: 'neck', label: 'Neck' },
        { id: 'sleeves', label: 'Sleeves' },
        { id: 'colors', label: 'Colors' },
      ];
    }
    if (usesFrockStyleTab) {
      return [
        { id: 'neck', label: 'Neck' },
        { id: 'sleeves', label: 'Sleeves' },
        { id: 'frock-style', label: 'Dress style' },
        { id: 'colors', label: 'Colors' },
      ];
    }
    return [
      { id: 'neck', label: 'Neck' },
      { id: 'sleeves', label: 'Sleeves' },
      { id: 'bottom', label: 'Bottom' },
      { id: 'colors', label: 'Colors' },
    ];
  }, [
    isCasualShortShirt,
    shalwarBottomLocked,
    isGrarah,
    isLehngaStyle,
    isSaree,
    modelId,
    usesFrockStyleTab,
    frockStyleLocked,
    sareeStyleLocked,
  ]);

  const styleLocked = frockStyleLocked || sareeStyleLocked || shalwarBottomLocked;

  const [activeTab, setActiveTab] = useState<TabId>(() => initialActiveTab(modelId, styleLocked));

  useEffect(() => {
    setActiveTab(initialActiveTab(modelId, styleLocked));
  }, [modelId, styleLocked]);

  const defaultSelections: Record<TabId, string | null> = {
    neck: null,
    sleeves: null,
    bottom: null,
    'frock-style': null,
    colors: null,
    'saree-style': null,
  };

  const initialSelections: Record<TabId, string | null> = (() => {
    try {
      const s = params?.selections ? JSON.parse(params.selections as string) : null;
      const merged = s ? ({ ...defaultSelections, ...(s as any) } as Record<TabId, string | null>) : { ...defaultSelections };
      if (modelId === 'long-frock' && presetFrockStyle) {
        merged['frock-style'] = presetFrockStyle;
      }
      if (modelId === 'saree' && presetSareeStyle) {
        merged['saree-style'] = presetSareeStyle;
      }
      if (isCasualShortShirt && presetBottom) {
        merged.bottom = presetBottom;
      }
      return stripLongFrockDisallowedColors(modelId, merged);
    } catch {
      const base = { ...defaultSelections };
      if (modelId === 'long-frock' && presetFrockStyle) base['frock-style'] = presetFrockStyle;
      if (modelId === 'saree' && presetSareeStyle) base['saree-style'] = presetSareeStyle;
      if (isCasualShortShirt && presetBottom) base.bottom = presetBottom;
      return base;
    }
  })();

  const [selections, setSelections] = useState<Record<TabId, string | null>>(initialSelections);

  const [activeColorFamily, setActiveColorFamily] = useState<string>(() => {
    const fromShade = getFamilyIdForShade(initialSelections.colors);
    return fromShade ?? 'white';
  });

  const lockedFrockStyleLabel = frockStyleOptions.find((o) => o.id === selections['frock-style'])?.name;
  const lockedSareeStyleLabel = sareeStyleOptions.find((o) => o.id === selections['saree-style'])?.name;
  const lockedShalwarBottomLabel =
    shalwarTypeName ||
    (selections.bottom === 'patiyala'
      ? 'Patiyala shalwar'
      : selections.bottom === 'straight'
        ? 'Straight shalwar'
        : '');

  const selectionsFor3d = useMemo(
    () => with3dPreviewDefaults(modelId, selections),
    [modelId, selections],
  );

  const usesFabricTint = usesCasualShortShirtFabricTint(modelId, selectionsFor3d);
  const usesPatiyalaTint = usesPatiyalaRuntimeFabricTint(modelId, selectionsFor3d);
  /** White patiyala GLB until customer taps a shade — no default red tint. */
  const fabricColorHex =
    usesPatiyalaTint && selections.colors
      ? fabricColorHexFromId(selections.colors)
      : null;
  const activeFabricShades = useMemo(
    () => getShadesForFamily(activeColorFamily),
    [activeColorFamily],
  );

  const customizationColors = useMemo(() => {
    if (isLehngaBridal) return bridalColorOptions;
    if (isLehngaCircular || isGrarah || modelId === 'saree') return grarahColorOptions;
    if (modelId === 'long-frock') return colorOptions.filter((c) => !LONG_FROCK_EXCLUDED_COLORS.has(c.id));
    return colorOptions;
  }, [isGrarah, isLehngaBridal, isLehngaCircular, modelId]);

  const prefetch3dForSelections = useCallback(
    (next: Record<TabId, string | null>) => {
      if (!MODELS_WITH_GLB_CATALOG.has(modelId)) return;
      prefetchDressGlbUrl(with3dPreviewDefaults(modelId, next), modelId);
    },
    [modelId],
  );

  const handleSelect = useCallback(
    (tab: TabId, id: string) => {
      setSelections((p) => {
        const next = { ...p, [tab]: id };
        prefetch3dForSelections(next);
        return next;
      });
    },
    [prefetch3dForSelections],
  );

  const handleSelectColorFamily = useCallback(
    (familyId: string) => {
      setActiveColorFamily(familyId);
      const defaultShade = getDefaultShadeForFamily(familyId);
      if (!defaultShade) return;
      setSelections((p) => {
        const currentFamily = getFamilyIdForShade(p.colors);
        if (currentFamily === familyId && p.colors) return p;
        const next = { ...p, colors: defaultShade.id };
        prefetch3dForSelections(next);
        return next;
      });
    },
    [prefetch3dForSelections],
  );

  const handleSelectFabricShade = useCallback(
    (shadeId: string) => {
      const familyId = getFamilyIdForShade(shadeId);
      if (familyId) setActiveColorFamily(familyId);
      setSelections((p) => {
        const next = { ...p, colors: shadeId };
        prefetch3dForSelections(next);
        return next;
      });
    },
    [prefetch3dForSelections],
  );

  const getNeckOptions = useCallback((): CustomizationOption[] => {
    if (isLehngaBridal) return bridalNeckOptions;
    if (isCasualShortShirt && isCasualShortShirtWithFabricTint(modelId, selections.bottom)) {
      return casualShortShirtNeckOptions;
    }
    if (isShalwarKameezModel(modelId)) return shalwarKameezNeckOptions;
    return neckOptions;
  }, [isLehngaBridal, modelId, isCasualShortShirt, selections.bottom]);

  const getSleeveOptions = useCallback((): CustomizationOption[] => {
    if (isLehngaBridal) return bridalSleeveOptions;
    if (isCasualShortShirt && isCasualShortShirtWithFabricTint(modelId, selections.bottom)) {
      return casualShortShirtSleeveOptions;
    }
    if (isGrarah || isLehngaCircular) return grarahSleeveOptions;
    if (modelId === 'saree') return sareeSleeveOptions;
    if (modelId !== 'long-frock') return sleeveOptionsFull;
    if (selections['frock-style'] === 'front-slit') {
      return [
        { id: 'full', name: 'Full sleeves' },
        { id: 'bell', name: 'Flared bell sleeves' },
      ];
    }
    return sleeveOptionsFull;
  }, [isGrarah, isLehngaBridal, isLehngaCircular, modelId, selections, isCasualShortShirt]);

  const getOptions = (tab: TabId): CustomizationOption[] => {
    if (tab === 'bottom' && isSharara) return shararaBottomOptions;
    if (tab === 'colors') return customizationColors;
    if (tab === 'saree-style') return sareeStyleOptions;
    if (tab === 'frock-style') return frockStyleOptions;
    if (tab === 'neck') return getNeckOptions();
    if (tab === 'sleeves') return getSleeveOptions();
    return bottomOptions;
  };

  const completed = availableTabs.filter((tab) => {
    if (tab.id === 'colors' && usesFabricTint) return isValidFabricShadeId(selections.colors ?? '');
    return Boolean(selections[tab.id]);
  }).length;
  const isComplete = completed === availableTabs.length;
  const activeOptionName = getOptions(activeTab).find((opt) => opt.id === selections[activeTab])?.name;
  const modelName = (params.modelName as string) || 'your dress';
  const selectedColor =
    usesFabricTint && selections.colors
      ? fabricColorNameFromId(selections.colors) ?? undefined
      : customizationColors.find((opt) => opt.id === selections.colors)?.name;
  const suggestionText = selectedColor
    ? `${selectedColor} works beautifully for ${modelName}. Pair it with balanced sleeves and a clean neckline for an elegant stitched look.`
    : `Choose a color first to get fabric, season, and styling suggestions for ${modelName}.`;

  const selectionKeyFor3d = JSON.stringify(selectionsFor3d);
  const canShowGlb = canShowGlbPreview(modelId, selectionsFor3d);
  const readyFor3d = isReadyFor3dPreview(modelId, selections);
  const dressGlb = useBundledDressGlb(selectionsFor3d, modelId, canShowGlb);
  const glbMatchesSelection =
    dressGlb.resolvedKey === selectionKeyFor3d && !dressGlb.loading;
  const isGlbUpdating =
    Boolean(dressGlb.url) && (dressGlb.loading || !glbMatchesSelection);
  const showGlb3d =
    canShowGlb && (dressGlb.error != null || dressGlb.url != null);
  const catalogHas3d = MODELS_WITH_GLB_CATALOG.has(modelId);

  const imageSource = useMemo(() => {
    const fromService = resolveCustomizePreviewImage(modelId, selections);
    if (fromService) return fromService;
    if (modelId === 'kurti' || modelId === 'kurti-trouser') return imgCasualDress;
    if (modelId === 'short-frock' || modelId === 'short-frock-shalwar' || modelId === 'shalwar-kameez-short' || modelId === 'shalwar-kameez') {
      return imgShortShirtShalwar;
    }
    if (modelId === 'sharara') return require('../../2d model/shrara.jpg');
    return null;
  }, [modelId, selections]);

  useEffect(() => {
    clearDressGlbUrlCache();
    clearParsedSceneCache();
  }, [modelId]);

  useEffect(() => {
    if (!catalogHas3d || !modelId) return;
    prefetchDressModelCatalog();
  }, [catalogHas3d, modelId]);

  /** Warm URL + GLB download on every pick so first paint is fast and correct */
  useEffect(() => {
    if (!catalogHas3d || !modelId) return;
    void resolveDressGlbUrlCached(selectionsFor3d, modelId)
      .then((hit) => {
        if (hit?.url) prefetchGltfScene(hit.url);
      })
      .catch(() => {});
  }, [catalogHas3d, modelId, selectionKeyFor3d]);

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { backgroundColor: tint }]}>
        <AppBackButton
          onPress={() =>
            safeRouterBack(router, customize3dBackFallback(dressLine, modelId))
          }
          variant="tint"
        />
        <ThemedText style={styles.headerTitle}>3D Customization</ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {dressLine ? (
          <ThemedText style={styles.dressLineHint}>
            {dressLine === 'party-formal'
              ? 'Party / Formal'
              : dressLine === 'wedding'
                ? 'Wedding'
                : dressLine === 'casual'
                  ? 'Casual'
                  : dressLine}
          </ThemedText>
        ) : null}

        {frockStyleLocked && lockedFrockStyleLabel ? (
          <View style={[styles.stylePill, { borderColor: inputBorder, backgroundColor: card }]}>
            <ThemedText style={styles.stylePillLabel}>Dress style</ThemedText>
            <ThemedText style={styles.stylePillValue}>{lockedFrockStyleLabel}</ThemedText>
          </View>
        ) : null}

        {sareeStyleLocked && lockedSareeStyleLabel ? (
          <View style={[styles.stylePill, { borderColor: inputBorder, backgroundColor: card }]}>
            <ThemedText style={styles.stylePillLabel}>Saree style</ThemedText>
            <ThemedText style={styles.stylePillValue}>{lockedSareeStyleLabel}</ThemedText>
          </View>
        ) : null}

        {shalwarBottomLocked && shirtStyleName ? (
          <View style={[styles.stylePill, { borderColor: inputBorder, backgroundColor: card }]}>
            <ThemedText style={styles.stylePillLabel}>Shirt style</ThemedText>
            <ThemedText style={styles.stylePillValue}>{shirtStyleName}</ThemedText>
          </View>
        ) : null}

        {shalwarBottomLocked && lockedShalwarBottomLabel ? (
          <View style={[styles.stylePill, { borderColor: inputBorder, backgroundColor: card }]}>
            <ThemedText style={styles.stylePillLabel}>Shalwar type</ThemedText>
            <ThemedText style={styles.stylePillValue}>{lockedShalwarBottomLabel}</ThemedText>
          </View>
        ) : null}

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
          {showGlb3d && dressGlb.error ? (
            <DressGlbPreview
              glbUrl={dressGlb.url ?? 'about:blank'}
              width={glViewportW}
              height={glViewportH}
              fallbackImage={imageSource}
              loadError={dressGlb.error}
            />
          ) : showGlb3d && dressGlb.url != null ? (
            <DressGlbPreview
              glbUrl={dressGlb.url}
              width={glViewportW}
              height={glViewportH}
              fabricColorHex={fabricColorHex}
              fallbackImage={imageSource}
              isUpdating={isGlbUpdating}
            />
          ) : canShowGlb && dressGlb.url == null && (dressGlb.loading || !glbMatchesSelection) ? (
            <View style={styles.previewLoadingWrap}>
              {imageSource ? (
                <Image source={imageSource} style={styles.previewImage} resizeMode="contain" />
              ) : null}
              <ThemedText style={styles.previewHint}>Loading 3D model…</ThemedText>
            </View>
          ) : imageSource ? (
            <Image source={imageSource} style={styles.previewImage} resizeMode="contain" />
          ) : (
            <ThemedText>3D Avatar Preview</ThemedText>
          )}
        </View>
        {catalogHas3d && !canShowGlb ? (
          <ThemedText style={styles.previewHint}>
            {isCasualShortShirt && selections.bottom === 'straight'
              ? '3D preview is available for Patiyala shalwar. Choose Patiyala at the shalwar step, then pick neck and sleeves.'
              : modelId === 'long-frock'
                ? 'Choose dress style (Flared or Front slit), then pick round or V-neck to start the 3D preview.'
                : modelId === 'saree'
                  ? 'Choose saree style (Plain or Frill), then pick round or V-neck to start the 3D preview.'
                  : 'Select neck (and dress style where shown) to open the 3D preview.'}
          </ThemedText>
        ) : canShowGlb && !readyFor3d ? (
          <ThemedText style={styles.previewHint}>
            {modelId === 'long-frock' || modelId === 'saree'
              ? '3D preview started — pick sleeves and color (red, blue, white, black) to match your final dress.'
              : 'Pick remaining options to finish your design.'}
          </ThemedText>
        ) : null}
        {dressGlb.error ? (
          <ThemedText style={styles.previewHint}>{dressGlb.error}</ThemedText>
        ) : null}

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
            <ThemedText style={styles.aiDesc}>{suggestionText}</ThemedText>
            <ThemedText style={styles.aiMeta}>
              {activeOptionName
                ? `Current ${availableTabs.find((t) => t.id === activeTab)?.label ?? activeTab}: ${activeOptionName}`
                : 'Select options to personalize suggestions'}
            </ThemedText>
          </View>
        </Pressable>

        <View style={styles.optionsWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {availableTabs.map((t) => (
              <Pressable
                key={t.id}
                onPress={() => setActiveTab(t.id)}
                style={[styles.tabBtn, activeTab === t.id && { backgroundColor: tint }]}
              >
                <ThemedText style={[activeTab === t.id ? { color: '#fff' } : {}, { fontSize: 12 }]}>{t.label}</ThemedText>
              </Pressable>
            ))}
          </ScrollView>

          {activeTab === 'colors' && usesFabricTint ? (
            <>
              <ThemedText style={styles.colorSectionLabel}>Main color</ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                {CASUAL_FABRIC_COLOR_FAMILIES.map((family) => {
                  const isActiveFamily = activeColorFamily === family.id;
                  return (
                    <Pressable
                      key={family.id}
                      onPress={() => handleSelectColorFamily(family.id)}
                      style={[
                        styles.optCard,
                        styles.colorFamilyCard,
                        isActiveFamily && { borderColor: tint, borderWidth: 2 },
                      ]}
                    >
                      <View style={styles.colorEmojiWrap}>
                        <View
                          style={[
                            styles.colorFabricSwatch,
                            { backgroundColor: family.iconHex },
                            family.id === 'white' && styles.colorFabricSwatchWhite,
                          ]}
                        />
                      </View>
                      <ThemedText style={styles.colorOptionName}>{family.name}</ThemedText>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <ThemedText style={[styles.colorSectionLabel, { marginTop: 14 }]}>
                {CASUAL_FABRIC_COLOR_FAMILIES.find((f) => f.id === activeColorFamily)?.name ?? 'Color'} shades
              </ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                {activeFabricShades.map((shade) => {
                  const isSelected = selections.colors === shade.id;
                  return (
                    <Pressable
                      key={shade.id}
                      onPress={() => handleSelectFabricShade(shade.id)}
                      style={[styles.optCard, styles.colorShadeCard, isSelected && { borderColor: tint, borderWidth: 2 }]}
                    >
                      <View style={styles.colorEmojiWrap}>
                        <View
                          style={[
                            styles.colorFabricSwatch,
                            styles.colorFabricSwatchShade,
                            { backgroundColor: shade.hex },
                            shade.id.startsWith('white-') && styles.colorFabricSwatchWhite,
                            isDarkFabricHex(shade.hex) && styles.colorFabricSwatchDark,
                          ]}
                        />
                      </View>
                      <ThemedText style={styles.colorOptionName}>{shade.name}</ThemedText>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
              {getOptions(activeTab).map((opt) => (
                <Pressable
                  key={opt.id}
                  onPress={() => handleSelect(activeTab, opt.id)}
                  style={[styles.optCard, selections[activeTab] === opt.id && { borderColor: tint, borderWidth: 2 }]}
                >
                  {activeTab === 'colors' ? (
                    <View style={styles.colorEmojiWrap}>
                      {opt.hex ? (
                        <View
                          style={[
                            styles.colorFabricSwatch,
                            { backgroundColor: opt.hex },
                            opt.id === 'white' && styles.colorFabricSwatchWhite,
                          ]}
                        />
                      ) : opt.id === 'beige' ? (
                        <View style={styles.colorBeigeCircle} />
                      ) : (
                        <ThemedText style={styles.colorEmoji}>{opt.emoji || '🎨'}</ThemedText>
                      )}
                    </View>
                  ) : (
                    <Image
                      source={
                        activeTab === 'sleeves' &&
                        opt.id === 'bell' &&
                        ((modelId === 'long-frock' && selections['frock-style'] === 'front-slit') ||
                          isGrarah ||
                          isLehngaCircular)
                          ? optionImages['flared-bell']
                          : optionImages[opt.id] || imageSource || require('../../assets/images/vTailorlogo.jpeg')
                      }
                      style={styles.optImage}
                      resizeMode="cover"
                    />
                  )}
                  <ThemedText style={{ fontSize: 12, textAlign: 'center', marginTop: 8 }}>{opt.name}</ThemedText>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: inputBorder, backgroundColor: card }]}>
        <Pressable
          onPress={() => {
            if (!isComplete) return;
            router.push({
              pathname: '/customer/view-3d-model',
              params: {
                modelId,
                modelName: (params.modelName as string) || '',
                dressLine: dressLine || '',
                selections: JSON.stringify(selections),
              },
            });
          }}
          disabled={!isComplete}
          style={[styles.proceed, { backgroundColor: isComplete ? tint : '#f3f4f6' }]}
        >
          <ThemedText style={{ color: isComplete ? '#fff' : '#999' }}>
            {isComplete ? 'View 3D model' : `Complete selections (${completed}/${availableTabs.length})`}
          </ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 12, paddingBottom: 24 },
  header: { paddingTop: 40, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerSpacer: { width: 84 },
  headerTitle: { flex: 1, color: '#fff', fontWeight: '700', textAlign: 'center' },
  dressLineHint: { fontSize: 12, fontWeight: '700', color: '#64748b', marginBottom: 8, paddingHorizontal: 4 },
  stylePill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  stylePillLabel: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  stylePillValue: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  preview: { height: 220, borderRadius: 12, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  previewImage: { width: '100%', height: '100%' },
  previewLoadingWrap: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewHint: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 12,
  },
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
  colorBeigeCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#f2e6d6',
    borderWidth: 1,
    borderColor: 'rgba(180, 160, 130, 0.35)',
  },
  colorFabricSwatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.14)',
  },
  colorFabricSwatchWhite: {
    borderColor: 'rgba(15, 23, 42, 0.22)',
  },
  colorFabricSwatchShade: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  colorFabricSwatchDark: {
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.55)',
  },
  colorSectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    paddingHorizontal: 4,
  },
  colorFamilyCard: { width: 88 },
  colorShadeCard: { width: 96 },
  colorOptionName: { fontSize: 11, textAlign: 'center', marginTop: 8, fontWeight: '600' },
  footer: { padding: 12 },
  proceed: { padding: 14, borderRadius: 12, alignItems: 'center' },
});
