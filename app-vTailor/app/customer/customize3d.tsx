import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  useWindowDimensions,
  type ImageSourcePropType,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import AppBackButton from '@/components/AppBackButton';
import { DressGlbPreview } from '@/components/DressGlbPreview';
import { FabricPrintUploadPanel } from '@/components/FabricPrintUploadPanel';
import { useAuth } from '@/contexts/AuthContext';
import { type TabId } from '@/services/dressGlbResolver';
import {
  CASUAL_FABRIC_COLOR_FAMILIES,
  fabricColorHexFromId,
  getDefaultShadeForFamily,
  getFamilyIdForShade,
  getShadesForFamily,
  isDarkFabricHex,
  isValidFabricShadeId,
  usesCasualShortShirtFabricTint,
  usesCasualFabricColorFamilies,
  usesCasualFabricRuntimeTint,
} from '@/services/dressFabricColors';
import { useBundledDressGlb } from '@/hooks/useBundledDressGlb';
import {
  canShowGlbPreview,
  isReadyFor3dPreview,
  with3dPreviewDefaults,
} from '@/services/glb/threePreviewReadiness';
import {
  prefetchDressGlbUrl,
  prefetchDressModelCatalog,
} from '@/services/glb/glbUrlResolve';
import { supportsCustomFabricPrint } from '@/services/glb/casualFabricDress';
import { safeRouterBack } from '@/utils/safeRouterBack';
import type { Href } from 'expo-router';
import { resolveCustomizePreviewImage } from '@/services/dressCustomizePreview';

type CustomizationOption = { id: string; name: string; color?: string; emoji?: string; hex?: string };

type TabConfig = { id: TabId; label: string };

const MODELS_WITH_GLB_CATALOG = new Set([
  'shalwar-kameez-short',
  'short-frock-shalwar',
  'trouser-shirt-bell-bottom',
  'trouser-shirt-tulip-trouser',
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

const bellBottomNeckOptions: CustomizationOption[] = [
  { id: 'round', name: 'Round neck' },
  { id: 'collar', name: 'Collar neck' },
  { id: 'keyhole', name: 'Round keyhole neck' },
];

const tulipTrouserNeckOptions: CustomizationOption[] = [
  { id: 'round', name: 'Round neck' },
  { id: 'collar', name: 'Collar neck' },
  { id: 'keyhole', name: 'Collar keyhole neck' },
];

const bellBottomSleeveOptions: CustomizationOption[] = [
  { id: 'straight', name: 'Pleated straight sleeves' },
  { id: 'puff', name: 'Puff/balloon sleeves' },
  { id: 'flared-bell', name: 'Pleated flared bell sleeves' },
];

const tulipTrouserSleeveOptions: CustomizationOption[] = [
  { id: 'full', name: 'Pleated full sleeves' },
  { id: 'bell', name: 'Pleated bell sleeves' },
  { id: 'puff', name: 'Puff/balloon sleeves' },
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
const imgTrouserShirtCollarNeck = require('../../2d model/variations/collar neck.png');
const imgRoundKeyholeNeck = require('../../2d model/variations/round keyhole neck.png');
const imgCollarKeyholeNeck = require('../../2d model/variations/Collar Keyhole neck.png');
const imgPleatedFlarredBellSleeves = require('../../2d model/variations/pleated-flarred-bell sleeves.png');
const imgPleatedBellSleeves = require('../../2d model/variations/pleated bell sleeves.png');
const imgPleatedBalloonSleeves = require('../../2d model/variations/pleated balloon sleeves.png');
const imgPleatesFullSleeves = require('../../2d model/variations/pleates full sleeves.png');

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
  collar: require('../../2d model/variations/round-neck.png'),
  keyhole: require('../../2d model/variations/v-neck.png'),
  puff: require('../../2d model/variations/balloon-sleeves.png'),
  straight: require('../../2d model/short-shirt-shalwar.png'),
  tulip: require('../../2d model/tulip-trouser.png'),
  patiyala: require('../../2d model/variations/patiyala-shalwar.png'),
  flared: require('../../2d model/variations/flared-bottom.png'),
  'flared-bottom': require('../../2d model/variations/flared-bottom.png'),
  'front-slit': require('../../2d model/variations/front-slit-frock.png'),
  plain: imgPlainSaree,
  frill: imgFrillSaree,
  saree: imgSaree,
};

function resolveTrouserShirtOptionImage(
  tab: TabId,
  optId: string,
  isBellBottom: boolean,
  isTulipTrouser: boolean,
): number | null {
  if (!isBellBottom && !isTulipTrouser) return null;
  if (tab === 'neck') {
    if (optId === 'collar') return imgTrouserShirtCollarNeck;
    if (optId === 'keyhole') {
      return isTulipTrouser ? imgCollarKeyholeNeck : imgRoundKeyholeNeck;
    }
    return optionImages.round;
  }
  if (tab === 'sleeves') {
    if (optId === 'puff') return imgPleatedBalloonSleeves;
    if (optId === 'flared-bell') return imgPleatedFlarredBellSleeves;
    if (isTulipTrouser && optId === 'bell') return imgPleatedBellSleeves;
    if (optId === 'straight' || optId === 'full') return imgPleatesFullSleeves;
  }
  return null;
}

type OptionImageCtx = {
  modelId: string;
  isBellBottom: boolean;
  isTulipTrouser: boolean;
  isGrarah: boolean;
  isLehngaCircular: boolean;
  frockStyle: string | null;
  fallbackSource: ImageSourcePropType | null;
};

function resolveOptionImageSource(
  tab: TabId,
  optId: string,
  ctx: OptionImageCtx,
): ImageSourcePropType {
  const trouserImg = resolveTrouserShirtOptionImage(tab, optId, ctx.isBellBottom, ctx.isTulipTrouser);
  if (trouserImg != null) return trouserImg;
  if (
    tab === 'sleeves' &&
    optId === 'bell' &&
    ((ctx.modelId === 'long-frock' && ctx.frockStyle === 'front-slit') ||
      ctx.isGrarah ||
      ctx.isLehngaCircular)
  ) {
    return optionImages['flared-bell'];
  }
  return optionImages[optId] || ctx.fallbackSource || require('../../assets/images/vTailorlogo.jpeg');
}

function OptionThumb({
  source,
  style,
  contentFit = 'cover',
  recyclingKey,
}: {
  source: ImageSourcePropType;
  style: object;
  contentFit?: 'cover' | 'contain';
  recyclingKey?: string;
}) {
  return (
    <ExpoImage
      source={source}
      style={style}
      contentFit={contentFit}
      cachePolicy="memory-disk"
      transition={0}
      recyclingKey={recyclingKey}
    />
  );
}

function isTrouserKeyholeNeckOption(
  tab: TabId,
  optId: string,
  isBellBottom: boolean,
  isTulipTrouser: boolean,
): boolean {
  return tab === 'neck' && optId === 'keyhole' && (isBellBottom || isTulipTrouser);
}

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

function isTrouserShirtBellBottomModel(modelId: string): boolean {
  return modelId === 'trouser-shirt-bell-bottom';
}

function isTrouserShirtTulipTrouserModel(modelId: string): boolean {
  return modelId === 'trouser-shirt-tulip-trouser';
}

function isTrouserShirtVariationModel(modelId: string): boolean {
  return isTrouserShirtBellBottomModel(modelId) || isTrouserShirtTulipTrouserModel(modelId);
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
  if (isTrouserShirtVariationModel(modelId) && styleLocked) return 'neck';
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
  if (isTrouserShirtVariationModel(modelId)) return '/customer/trouser-shirt-style';
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
  const isBellBottom = isTrouserShirtBellBottomModel(modelId);
  const isTulipTrouser = isTrouserShirtTulipTrouserModel(modelId);
  const isTrouserShirtVariation = isTrouserShirtVariationModel(modelId);
  const usesFrockStyleTab = ['long-frock', 'short-frock', 'gown'].includes(modelId);
  const isSharara = modelId === 'sharara';
  const presetVariation = (params.presetVariation as string) || '';
  const variationName = (params.variationName as string) || '';

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

  const trouserVariationLocked = useMemo(() => {
    if (!isTrouserShirtVariation) return false;
    return (
      presetVariation === 'bell-bottom' ||
      presetVariation === 'tulip-trouser' ||
      Boolean(variationName)
    );
  }, [isTrouserShirtVariation, presetVariation, variationName]);

  const availableTabsBase = useMemo((): TabConfig[] => {
    if (isTrouserShirtVariation && trouserVariationLocked) {
      return [
        { id: 'neck', label: 'Neck' },
        { id: 'sleeves', label: 'Sleeves' },
        { id: 'colors', label: 'Colors' },
      ];
    }
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
    isTrouserShirtVariation,
    trouserVariationLocked,
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

  const styleLocked = frockStyleLocked || sareeStyleLocked || shalwarBottomLocked || trouserVariationLocked;

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
    'fabric-print': null,
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

  const { userId } = useAuth();

  const supportsFabricPrint = supportsCustomFabricPrint(modelId, selections);

  const availableTabs = useMemo((): TabConfig[] => {
    if (!supportsFabricPrint) return availableTabsBase;
    return [...availableTabsBase, { id: 'fabric-print', label: 'Upload Print' }];
  }, [availableTabsBase, supportsFabricPrint]);

  const requiredTabs = useMemo(
    () => availableTabs.filter((t) => t.id !== 'fabric-print'),
    [availableTabs],
  );

  const fabricTextureUrl = selections['fabric-print'];

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
      : '');
  const lockedTrouserVariationLabel =
    variationName ||
    (presetVariation === 'bell-bottom'
      ? 'Bell bottom'
      : presetVariation === 'tulip-trouser'
        ? 'Tulip trouser'
        : '');

  const selectionsFor3d = useMemo(
    () => with3dPreviewDefaults(modelId, selections),
    [modelId, selections],
  );

  const usesFabricTint = usesCasualFabricColorFamilies(modelId, selectionsFor3d);
  const usesCasualTint = usesCasualFabricRuntimeTint(modelId, selectionsFor3d);
  /** Base / textured GLB until customer picks a fabric shade. */
  const fabricColorHex =
    fabricTextureUrl
      ? null
      : usesCasualTint && selections.colors
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

  const handleSelect = useCallback((tab: TabId, id: string) => {
    setSelections((p) => ({ ...p, [tab]: id }));
  }, []);

  const handleSelectColorFamily = useCallback((familyId: string) => {
    setActiveColorFamily(familyId);
    const defaultShade = getDefaultShadeForFamily(familyId);
    if (!defaultShade) return;
    setSelections((p) => {
      const currentFamily = getFamilyIdForShade(p.colors);
      if (currentFamily === familyId && p.colors) return p;
      return { ...p, colors: defaultShade.id };
    });
  }, []);

  const handleSelectFabricShade = useCallback((shadeId: string) => {
    const familyId = getFamilyIdForShade(shadeId);
    if (familyId) setActiveColorFamily(familyId);
    setSelections((p) => ({ ...p, colors: shadeId }));
  }, []);

  const getNeckOptions = useCallback((): CustomizationOption[] => {
    if (isTulipTrouser) return tulipTrouserNeckOptions;
    if (isBellBottom) return bellBottomNeckOptions;
    if (isLehngaBridal) return bridalNeckOptions;
    if (isCasualShortShirt && isCasualShortShirtWithFabricTint(modelId, selections.bottom)) {
      return casualShortShirtNeckOptions;
    }
    if (isShalwarKameezModel(modelId)) return shalwarKameezNeckOptions;
    return neckOptions;
  }, [isBellBottom, isTulipTrouser, isLehngaBridal, modelId, isCasualShortShirt, selections.bottom]);

  const getSleeveOptions = useCallback((): CustomizationOption[] => {
    if (isTulipTrouser) return tulipTrouserSleeveOptions;
    if (isBellBottom) return bellBottomSleeveOptions;
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
  }, [isBellBottom, isTulipTrouser, isGrarah, isLehngaBridal, isLehngaCircular, modelId, selections, isCasualShortShirt]);

  const getOptions = (tab: TabId): CustomizationOption[] => {
    if (tab === 'bottom' && isSharara) return shararaBottomOptions;
    if (tab === 'colors') return customizationColors;
    if (tab === 'saree-style') return sareeStyleOptions;
    if (tab === 'frock-style') return frockStyleOptions;
    if (tab === 'neck') return getNeckOptions();
    if (tab === 'sleeves') return getSleeveOptions();
    return bottomOptions;
  };

  const completed = requiredTabs.filter((tab) => {
    if (tab.id === 'colors' && usesFabricTint) return isValidFabricShadeId(selections.colors ?? '');
    return Boolean(selections[tab.id]);
  }).length;
  const isComplete = completed === requiredTabs.length;
  const selectionKeyFor3d = JSON.stringify(selectionsFor3d);
  const canShowGlb = canShowGlbPreview(modelId, selectionsFor3d);
  const readyFor3d = isReadyFor3dPreview(modelId, selections);
  const dressGlb = useBundledDressGlb(selectionsFor3d, modelId, canShowGlb);
  const glbMatchesSelection =
    dressGlb.resolvedKey === selectionKeyFor3d && !dressGlb.loading;
  const displayGlbUrl = dressGlb.url;
  const hasDisplayGlbUrl = displayGlbUrl != null;
  const isGlbUpdating = hasDisplayGlbUrl && (dressGlb.loading || !glbMatchesSelection);
  const showGlb3d = canShowGlb && (hasDisplayGlbUrl || dressGlb.error != null);
  const showGlbLoadError = canShowGlb && dressGlb.error != null && !hasDisplayGlbUrl;
  const catalogHas3d = MODELS_WITH_GLB_CATALOG.has(modelId);

  const imageSource = useMemo(() => {
    const fromService = resolveCustomizePreviewImage(modelId, selections);
    if (fromService) return fromService;
    if (modelId === 'kurti' || modelId === 'kurti-trouser') return imgCasualDress;
    if (modelId === 'short-frock' || modelId === 'short-frock-shalwar' || modelId === 'shalwar-kameez-short' || modelId === 'shalwar-kameez') {
      return imgShortShirtShalwar;
    }
    if (modelId === 'sharara') return require('../../2d model/shrara.png');
    return null;
  }, [modelId, selections]);

  const optionImageCtx = useMemo(
    (): OptionImageCtx => ({
      modelId,
      isBellBottom,
      isTulipTrouser,
      isGrarah,
      isLehngaCircular,
      frockStyle: selections['frock-style'],
      fallbackSource: imageSource,
    }),
    [modelId, isBellBottom, isTulipTrouser, isGrarah, isLehngaCircular, selections, imageSource],
  );

  const selectedPicks = useMemo(() => {
    return availableTabs
      .filter((t) => {
        if (t.id === 'fabric-print') return Boolean(selections['fabric-print']);
        if (t.id === 'colors' && usesFabricTint) return isValidFabricShadeId(selections.colors ?? '');
        return Boolean(selections[t.id]);
      })
      .map((t) => {
        const optId = selections[t.id]!;
        if (t.id === 'fabric-print') {
          return {
            key: t.id,
            tabLabel: t.label,
            name: 'Custom print',
            hex: null as string | null,
            source: { uri: optId } as ImageSourcePropType,
          };
        }
        if (t.id === 'colors') {
          if (usesFabricTint) {
            const shade =
              activeFabricShades.find((s) => s.id === optId) ??
              CASUAL_FABRIC_COLOR_FAMILIES.flatMap((f) => getShadesForFamily(f.id)).find(
                (s) => s.id === optId,
              );
            return {
              key: t.id,
              tabLabel: t.label,
              name: shade?.name ?? optId,
              hex: shade?.hex ?? null,
              source: null as ImageSourcePropType | null,
            };
          }
          const colorOpt = customizationColors.find((c) => c.id === optId) as CustomizationOption | undefined;
          return {
            key: t.id,
            tabLabel: t.label,
            name: colorOpt?.name ?? optId,
            hex: colorOpt?.hex ?? null,
            source: null as ImageSourcePropType | null,
          };
        }
        const opt = getOptions(t.id).find((o) => o.id === optId);
        return {
          key: t.id,
          tabLabel: t.label,
          name: opt?.name ?? optId,
          hex: null as string | null,
          source: resolveOptionImageSource(t.id, optId, optionImageCtx),
        };
      });
  }, [
    availableTabs,
    selections,
    usesFabricTint,
    activeFabricShades,
    customizationColors,
    optionImageCtx,
    isSharara,
    modelId,
    getNeckOptions,
    getSleeveOptions,
  ]);

  useEffect(() => {
    if (!catalogHas3d || !modelId) return;
    prefetchDressModelCatalog();
  }, [catalogHas3d, modelId]);

  /** Warm URL resolution as soon as selections change (native skips heavy buffer prefetch). */
  useEffect(() => {
    if (!catalogHas3d || !modelId || !canShowGlb) return;
    prefetchDressGlbUrl(selectionsFor3d, modelId);
  }, [catalogHas3d, modelId, selectionKeyFor3d, canShowGlb]);

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

        {trouserVariationLocked && lockedTrouserVariationLabel ? (
          <View style={[styles.stylePill, { borderColor: inputBorder, backgroundColor: card }]}>
            <ThemedText style={styles.stylePillLabel}>Style</ThemedText>
            <ThemedText style={styles.stylePillValue}>{lockedTrouserVariationLabel}</ThemedText>
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
          {showGlbLoadError ? (
            <DressGlbPreview
              glbUrl="about:blank"
              width={glViewportW}
              height={glViewportH}
              fallbackImage={imageSource}
              loadError={dressGlb.error}
            />
          ) : showGlb3d && hasDisplayGlbUrl ? (
            <DressGlbPreview
              glbUrl={displayGlbUrl}
              width={glViewportW}
              height={glViewportH}
              fabricColorHex={fabricColorHex}
              fabricTextureUrl={fabricTextureUrl}
              fallbackImage={imageSource}
              isUpdating={isGlbUpdating}
            />
          ) : canShowGlb && !hasDisplayGlbUrl && dressGlb.loading ? (
            <View style={styles.previewLoadingWrap}>
              {imageSource ? (
                <ExpoImage
                  source={imageSource}
                  style={styles.previewImage}
                  contentFit="contain"
                  cachePolicy="memory-disk"
                  transition={0}
                />
              ) : null}
              <ThemedText style={styles.previewHint}>Loading 3D model…</ThemedText>
            </View>
          ) : imageSource ? (
            <ExpoImage
              source={imageSource}
              style={styles.previewImage}
              contentFit="contain"
              cachePolicy="memory-disk"
              transition={0}
            />
          ) : (
            <ThemedText>3D Avatar Preview</ThemedText>
          )}
        </View>
        {catalogHas3d && !canShowGlb ? (
          <ThemedText style={styles.previewHint}>
            {isCasualShortShirt
              ? '3D preview is available for Patiyala shalwar only. Choose Patiyala at the shalwar step, then pick neck and sleeves.'
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
        {showGlbLoadError ? (
          <ThemedText style={styles.previewHint}>{dressGlb.error}</ThemedText>
        ) : null}

        <View style={styles.optionsSection}>
          <View style={styles.optionsWrap}>
          {selectedPicks.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.selectedPicksRow}
            >
              {selectedPicks.map((pick) => (
                <Pressable
                  key={pick.key}
                  onPress={() => setActiveTab(pick.key as TabId)}
                  style={[
                    styles.selectedPickChip,
                    { borderColor: inputBorder },
                    activeTab === pick.key && { borderColor: tint, borderWidth: 2 },
                  ]}
                >
                  {pick.hex ? (
                    <View
                      style={[
                        styles.selectedPickSwatch,
                        { backgroundColor: pick.hex },
                        pick.hex.toLowerCase() === '#ffffff' && styles.colorFabricSwatchWhite,
                      ]}
                    />
                  ) : pick.source ? (
                    <OptionThumb
                      source={pick.source}
                      style={styles.selectedPickThumb}
                      recyclingKey={`pick-${pick.key}`}
                    />
                  ) : null}
                  <ThemedText style={styles.selectedPickLabel} numberOfLines={1}>
                    {pick.tabLabel}
                  </ThemedText>
                  <ThemedText style={styles.selectedPickName} numberOfLines={1}>
                    {pick.name}
                  </ThemedText>
                </Pressable>
              ))}
            </ScrollView>
          ) : null}
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

          {activeTab === 'fabric-print' ? (
            <FabricPrintUploadPanel
              userId={userId || 'guest'}
              printUrl={fabricTextureUrl}
              onPrintUrlChange={(url) =>
                setSelections((p) => ({ ...p, 'fabric-print': url }))
              }
            />
          ) : activeTab === 'colors' && usesFabricTint ? (
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
                  ) : isTrouserKeyholeNeckOption(activeTab, opt.id, isBellBottom, isTulipTrouser) ? (
                    <View style={styles.optImageKeyholeFrame}>
                      <OptionThumb
                        source={
                          resolveTrouserShirtOptionImage(activeTab, opt.id, isBellBottom, isTulipTrouser) ??
                          optionImages.keyhole
                        }
                        style={styles.optImageKeyhole}
                        contentFit="contain"
                        recyclingKey={`${activeTab}-${opt.id}-keyhole`}
                      />
                    </View>
                  ) : (
                    <OptionThumb
                      source={resolveOptionImageSource(activeTab, opt.id, optionImageCtx)}
                      style={styles.optImage}
                      recyclingKey={`${activeTab}-${opt.id}`}
                    />
                  )}
                  <ThemedText style={{ fontSize: 12, textAlign: 'center', marginTop: 8 }}>{opt.name}</ThemedText>
                </Pressable>
              ))}
            </ScrollView>
          )}
          </View>

          <Pressable
            onPress={() => (router as any).push('/customer/ai-assistant')}
            style={({ pressed }) => [
              styles.aiFab,
              { backgroundColor: tint, borderColor: inputBorder, opacity: pressed ? 0.88 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="AI style suggestions"
          >
            <Ionicons name="sparkles" size={22} color="#fff" />
          </Pressable>
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
                flow: 'finalize',
              },
            });
          }}
          disabled={!isComplete}
          style={[styles.proceed, { backgroundColor: isComplete ? tint : '#f3f4f6' }]}
        >
          <ThemedText style={{ color: isComplete ? '#fff' : '#999' }}>
            {isComplete
              ? 'View 3D model'
              : `Complete selections (${completed}/${requiredTabs.length})`}
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
  optionsSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
    gap: 8,
  },
  optionsWrap: { flex: 1, minWidth: 0, paddingTop: 4 },
  selectedPicksRow: { marginBottom: 10 },
  selectedPickChip: {
    width: 72,
    padding: 6,
    borderRadius: 10,
    marginRight: 8,
    borderWidth: 1,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  selectedPickThumb: { width: '100%', height: 44, borderRadius: 8, backgroundColor: '#f3f4f6' },
  selectedPickSwatch: {
    width: '100%',
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  selectedPickLabel: { fontSize: 10, color: '#64748b', marginTop: 4, fontWeight: '600' },
  selectedPickName: { fontSize: 10, color: '#0f172a', fontWeight: '700', textAlign: 'center' },
  aiFab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: { elevation: 4 },
      default: {},
    }),
  },
  tabBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, marginRight: 8, alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
  optCard: { width: 92, padding: 6, borderRadius: 12, marginRight: 8, borderWidth: 1, alignItems: 'center' },
  optImage: { width: '100%', height: 56, borderRadius: 10, backgroundColor: '#f3f4f6' },
  /** Round / collar keyhole neck — slightly smaller so full collar + neck stays visible. */
  optImageKeyholeFrame: {
    width: '100%',
    height: 58,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optImageKeyhole: {
    width: '83%',
    height: 53,
  },
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
