import { ProtectedRoute } from '@/components/ProtectedRoute';
import AppBackButton from '@/components/AppBackButton';
import { DressGlbPreview } from '@/components/DressGlbPreview';
import { ROLE_COLORS, UI, TEXT_DARK, TEXT_MUTED } from '@/constants/ui';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/AuthContext';
import { DEMO_CUSTOMER_ORDERS, dressPreviewFromOrderDescription } from '@/services/orderDressPreview';
import { getUserCustomizations } from '@/services/userDataService';
import { type TabId } from '@/services/dressGlbResolver';
import { useBundledDressGlb } from '@/hooks/useBundledDressGlb';
import {
  fabricColorHexFromId,
  fabricColorNameFromId,
  usesCasualShortShirtFabricTint,
} from '@/services/dressFabricColors';
import { with3dPreviewDefaults } from '@/services/glb/threePreviewReadiness';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  SafeAreaView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

const THEME = ROLE_COLORS.customer;

function SectionHeader({
  icon,
  title,
  accentColor,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  accentColor: string;
}) {
  return (
    <View style={styles.cardTitleRow}>
      <View style={styles.sectionIconWrap}>
        <Ionicons name={icon} size={16} color={accentColor} />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

const STEPS = [
  "Order Accepted",
  "Cutting In Progress",
  "Cutting Completed",
  "Stitching In Progress",
  "Stitching Completed",
  "Detailing In Progress",
  "Dress Completed",
];

type CustomizationItem = {
  id: string;
  modelId?: string;
  modelName?: string;
  createdAt?: string;
  selections?: Record<string, string | null>;
};

type TimelineOrder = {
  orderId: string;
  orderDescription: string;
  orderDate: string;
  orderPrice: string;
  tailorName: string;
  tailorId: string;
  tailorPhone: string;
  tailorAvatar: string;
  tailorRating: string;
  statusLabel: string;
  sampleNeck: string;
  sampleSleeves: string;
  sampleStyle: string;
  sampleColor: string;
  modelId?: string;
  selections?: Record<string, string | null>;
};

const TIMELINE_ORDERS: TimelineOrder[] = DEMO_CUSTOMER_ORDERS.map((o) => ({
  orderId: `ORD-${String(o.id).padStart(3, '0')}`,
  orderDescription: o.name,
  orderDate: o.date,
  orderPrice: String(o.price),
  tailorName: o.tailor,
  tailorId: o.tailorId,
  tailorPhone: o.tailorPhone,
  tailorAvatar: o.tailorAvatar,
  tailorRating: o.rating,
  statusLabel: o.status,
  sampleNeck: o.sample.neck,
  sampleSleeves: o.sample.sleeves,
  sampleStyle: o.sample.style,
  sampleColor: o.sample.color,
  modelId: o.modelId,
  selections: o.selections,
}));

const defaultSelections: Record<TabId, string | null> = {
  neck: null,
  sleeves: null,
  bottom: null,
  'frock-style': null,
  colors: null,
  'saree-style': null,
  'fabric-print': null,
};

function mergedSelections(selections: Record<string, string | null>): Record<TabId, string | null> {
  return { ...defaultSelections, ...selections } as Record<TabId, string | null>;
}

function imageForModel(modelId: string) {
  if (modelId === 'kurti') return require('../../dress_assets/casual dresses.jpg');
  if (modelId === 'kurti-trouser') return require('../../dress_assets/casual dresses.jpg');
  if (modelId === 'short-frock') return require('../../dress_assets/short-shirt-shalwar.png');
  if (modelId === 'short-frock-shalwar' || modelId === 'shalwar-kameez-short')
    return require('../../dress_assets/short-shirt-shalwar.png');
  if (modelId === 'long-frock') return require('../../dress_assets/long frock 2.png');
  if (modelId === 'saree') return require('../../dress_assets/variations/saree.png');
  if (modelId === 'shalwar-kameez' || modelId === 'shalwar-kameez-long')
    return require('../../dress_assets/short-shirt-shalwar.png');
  if (modelId === 'sharara') return require('../../dress_assets/shrara.png');
  if (modelId === 'grarah-short-shirt') return require('../../dress_assets/variations/short-shirt-grarah.png');
  if (modelId === 'grarah-peplum') return require('../../dress_assets/variations/peplum-grarah.png');
  if (modelId === 'lehnga-circular') return require('../../dress_assets/variations/circular.png');
  if (modelId === 'lehnga-bridal' || modelId === 'lehnga') return require('../../dress_assets/bridal-lehnga.png');
  return null;
}

function safeParseSelections(json: string): Record<string, string | null> {
  try {
    const v = JSON.parse(json) as Record<string, string | null>;
    return v && typeof v === 'object' ? v : {};
  } catch {
    return {};
  }
}

const selectionNameMap: Record<string, Record<string, string>> = {
  neck: {
    round: 'Round Neck',
    'v-neck': 'V-Neck',
    square: 'Square neck',
    'boat-neck': 'Boat neck',
    sweetheart: 'Sweetheart neck',
  },
  sleeves: {
    full: 'Full Sleeves',
    bell: 'Bell Sleeves',
    short: 'Short Sleeves',
    balloon: 'Balloon / puff sleeves',
    layered: 'Layered sleeves',
  },
  bottom: {
    straight: 'Straight shalwar',
    tulip: 'Tulip shalwar',
    dhoti: 'Dhoti shalwar',
    patiyala: 'Patiyala shalwar',
    farshi: 'Farshi shalwar',
    flared: 'Flared Style',
  },
  'frock-style': {
    'flared-bottom': 'Flared',
    'front-slit': 'Front slit',
  },
  colors: {
    red: 'Red',
    blue: 'Blue',
    green: 'Green',
    black: 'Black',
    white: 'White',
    yellow: 'Yellow',
    beige: 'Beige',
    peach: 'Peach',
    maroon: 'Maroon',
    iceblue: 'Ice blue',
    'mint-green': 'Mint green',
    lavender: 'Lavender',
    pink: 'Pink',
    purple: 'Purple',
    navy: 'Navy',
  },
  'saree-style': {
    plain: 'Plain',
    frill: 'Frill',
  },
};

function readSelectionLabel(key: string, value: string | null | undefined) {
  if (!value) return 'Not selected';
  if (key === 'colors') {
    return fabricColorNameFromId(value) ?? selectionNameMap[key]?.[value] ?? value;
  }
  return selectionNameMap[key]?.[value] || value;
}

function formatOrderDate(value?: string) {
  if (!value) return new Date().toISOString().slice(0, 10);
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString().slice(0, 10);
  return parsed.toISOString().slice(0, 10);
}

export default function CustomerOrderTimelineScreen() {
  const tint = useThemeColor({}, 'tint');
  const params = useLocalSearchParams();
  const { width: screenW } = useWindowDimensions();
  const glPreviewW = Math.max(260, Math.floor(screenW - 64));
  const glPreviewH = 220;
  const { userId } = useAuth();

  const demoMode = (params.demo as string) === '1';
  const selectedOrderId = typeof params.orderId === 'string' ? params.orderId : '';
  const hasSelectedOrder = selectedOrderId.length > 0;
  const selectedTimelineOrder = TIMELINE_ORDERS.find((order) => order.orderId === selectedOrderId) || null;
  const orderDescriptionFromParams = (params.orderDescription as string) || 'Customized Dress';
  const orderDateFromParams = formatOrderDate(params.orderDate as string);
  const tailorNameFromParams = (params.tailorName as string) || 'Ahmad Tailor Store';
  const tailorIdFromParams = (params.tailorId as string) || 'sample-tailor-aliya-formal';
  const tailorPhoneFromParams = (params.tailorPhone as string) || '+923001234567';
  const tailorAvatarFromParams = (params.tailorAvatar as string) || tailorNameFromParams
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
  const tailorRatingFromParams = (params.tailorRating as string) || '⭐ 4.8 (245 reviews)';
  const orderPriceFromParams = (params.orderPrice as string) || '';
  const statusLabelFromParams = (params.statusLabel as string) || '';
  const measurementRows = [
    { label: 'Chest / Bust', value: (params.measurementChest as string) || '36 in' },
    { label: 'Waist', value: (params.measurementWaist as string) || '30 in' },
    { label: 'Dress Length', value: (params.measurementLength as string) || '52 in' },
    { label: 'Shoulder', value: (params.measurementShoulder as string) || '15 in' },
  ];
  const [currentStep, setCurrentStep] = useState(0);
  const [orderDescription, setOrderDescription] = useState(orderDescriptionFromParams);
  const [orderDate, setOrderDate] = useState(orderDateFromParams);
  const [tailorName, setTailorName] = useState(tailorNameFromParams);
  const [tailorRating, setTailorRating] = useState(tailorRatingFromParams);
  const [orderInfoRows, setOrderInfoRows] = useState<Array<{ label: string; value: string }>>([
    { label: 'Neck', value: 'Not selected' },
    { label: 'Sleeves', value: 'Not selected' },
    { label: 'Style', value: 'Not selected' },
    { label: 'Color', value: 'Not selected' },
  ]);
  const [previewModelId, setPreviewModelId] = useState<string | null>(null);
  const [previewSelections, setPreviewSelections] = useState<Record<string, string | null>>({});
  const router = useRouter();
  const ORDER_ID = (params.orderId as string) || 'ORD-001';
  const STORAGE_KEY = `order_progress_${ORDER_ID}`;

  const paramModelId = (params.modelId as string) || '';
  const paramSelectionsJson = (params.selections as string) || '';

  const mergedPreviewSelections = useMemo(
    () => mergedSelections(previewSelections || {}),
    [previewSelections],
  );
  const previewSelectionsFor3d = useMemo(() => {
    if (!previewModelId) return mergedPreviewSelections;
    return with3dPreviewDefaults(previewModelId, mergedPreviewSelections);
  }, [previewModelId, mergedPreviewSelections]);
  const previewDressGlb = useBundledDressGlb(
    previewSelectionsFor3d,
    previewModelId != null && previewModelId.length > 0 ? previewModelId : '',
  );
  const previewFabricHex = usesCasualShortShirtFabricTint(previewModelId ?? '', mergedPreviewSelections)
    ? fabricColorHexFromId(mergedPreviewSelections.colors)
    : null;
  const previewFabricTextureUrl = mergedPreviewSelections['fabric-print'];
  const previewFabricColorHex = previewFabricTextureUrl ? null : previewFabricHex;
  const preview2d = previewModelId ? imageForModel(previewModelId) : null;
  const [activeTab, setActiveTab] = useState<'tailor' | 'order'>('order');

  useEffect(() => {
    setActiveTab('order');
  }, [selectedOrderId]);

  const handleViewTailorProfile = () => {
    router.push({
      pathname: '/customer/tailor-details',
      params: {
        tailorId: tailorIdFromParams,
        tailorName: tailorName,
        tailorPhone: tailorPhoneFromParams,
        tailorAvatar: tailorAvatarFromParams,
        tailorRating: tailorRating,
        from: 'orders',
      },
    } as any);
  };

  const handleView3dModel = () => {
    if (!previewModelId) return;
    router.push({
      pathname: '/customer/view-3d-model',
      params: {
        modelId: previewModelId,
        modelName: orderDescription,
        selections: JSON.stringify(previewSelections),
        fullScreen: '1',
      },
    } as any);
  };

  const openOrder = (order: TimelineOrder) => {
    router.push({
      pathname: '/customer/order-timeline',
      params: {
        orderId: order.orderId,
        demo: '1',
        orderDescription: order.orderDescription,
        orderDate: order.orderDate,
        orderPrice: order.orderPrice,
        tailorName: order.tailorName,
        tailorId: order.tailorId,
        tailorPhone: order.tailorPhone,
        tailorAvatar: order.tailorAvatar,
        tailorRating: order.tailorRating,
        statusLabel: order.statusLabel,
        sampleNeck: order.sampleNeck,
        sampleSleeves: order.sampleSleeves,
        sampleStyle: order.sampleStyle,
        sampleColor: order.sampleColor,
        ...(order.modelId
          ? {
              modelId: order.modelId,
              selections: JSON.stringify(order.selections || {}),
            }
          : {}),
      },
    } as any);
  };

  const loadCustomizationDetails = useCallback(async () => {
    const applyPreview = (modelId: string | null | undefined, selections: Record<string, string | null>) => {
      if (modelId && String(modelId).trim().length > 0) {
        setPreviewModelId(String(modelId).trim());
        setPreviewSelections(selections || {});
      } else {
        setPreviewModelId(null);
        setPreviewSelections({});
      }
    };

    const applyFromRouteOrPreset = () => {
      if (paramModelId) {
        applyPreview(paramModelId, safeParseSelections(paramSelectionsJson));
        return;
      }
      const preset = dressPreviewFromOrderDescription(orderDescriptionFromParams);
      if (preset) {
        applyPreview(preset.modelId, preset.selections as Record<string, string | null>);
      } else {
        applyPreview(null, {});
      }
    };

    try {
      if (demoMode) {
        setOrderDescription(orderDescriptionFromParams);
        setOrderDate(orderDateFromParams);
        setTailorName(tailorNameFromParams);
        setTailorRating(tailorRatingFromParams);
        setOrderInfoRows([
          { label: 'Neck', value: (params.sampleNeck as string) || 'Round Neck' },
          { label: 'Sleeves', value: (params.sampleSleeves as string) || 'Full Sleeves' },
          { label: 'Style', value: (params.sampleStyle as string) || 'Flared Bottom' },
          { label: 'Color', value: (params.sampleColor as string) || 'Beige' },
        ]);
        applyFromRouteOrPreset();
        return;
      }

      let list: CustomizationItem[] = [];
      if (userId) {
        list = await getUserCustomizations(userId);
      } else {
        const rawGlobal = await AsyncStorage.getItem('CUSTOMIZATIONS');
        list = rawGlobal ? (JSON.parse(rawGlobal) as CustomizationItem[]) : [];
      }

      if (!list.length) {
        setOrderDescription(orderDescriptionFromParams);
        setOrderDate(orderDateFromParams);
        setTailorName(tailorNameFromParams);
        setTailorRating(tailorRatingFromParams);
        setOrderInfoRows([
          { label: 'Neck', value: (params.sampleNeck as string) || 'Round Neck' },
          { label: 'Sleeves', value: (params.sampleSleeves as string) || 'Full Sleeves' },
          { label: 'Style', value: (params.sampleStyle as string) || 'Flared Bottom' },
          { label: 'Color', value: (params.sampleColor as string) || 'Beige' },
        ]);
        applyFromRouteOrPreset();
        return;
      }

      const selectedCustomizationId = (params.customizationId as string) || '';
      const matched = selectedCustomizationId ? list.find((item) => item.id === selectedCustomizationId) : null;

      const latest = matched || [...list].sort((a, b) => {
        const t1 = new Date(a.createdAt || '').getTime() || 0;
        const t2 = new Date(b.createdAt || '').getTime() || 0;
        return t2 - t1;
      })[0];

      const selections = latest.selections || {};
      const style = selections['frock-style'] || selections.bottom;
      const sareeStyle = selections['saree-style'];

      setOrderDescription(latest.modelName || orderDescriptionFromParams || 'Customized Dress');
      setOrderDate(formatOrderDate(latest.createdAt || orderDateFromParams));
      setTailorName(tailorNameFromParams);
      setTailorRating(tailorRatingFromParams);

      const styleRow = sareeStyle
        ? { label: 'Saree style', value: readSelectionLabel('saree-style', sareeStyle) }
        : { label: 'Style', value: readSelectionLabel(selections['frock-style'] ? 'frock-style' : 'bottom', style) };

      setOrderInfoRows([
        { label: 'Neck', value: readSelectionLabel('neck', selections.neck) },
        { label: 'Sleeves', value: readSelectionLabel('sleeves', selections.sleeves) },
        styleRow,
        { label: 'Color', value: readSelectionLabel('colors', selections.colors) },
      ]);

      const mid = latest.modelId || paramModelId;
      if (mid) {
        applyPreview(mid, selections);
      } else {
        const preset = dressPreviewFromOrderDescription(latest.modelName || orderDescriptionFromParams);
        if (preset) {
          applyPreview(preset.modelId, preset.selections as Record<string, string | null>);
        } else {
          applyPreview(null, {});
        }
      }
    } catch (error) {
      console.log('Error loading customization details:', error);
    }
  }, [
    demoMode,
    userId,
    orderDescriptionFromParams,
    orderDateFromParams,
    tailorNameFromParams,
    tailorRatingFromParams,
    paramModelId,
    paramSelectionsJson,
    params.sampleNeck,
    params.sampleSleeves,
    params.sampleStyle,
    params.sampleColor,
    params.customizationId,
  ]);

  // Load saved progress when component mounts
  useEffect(() => {
    loadProgressFromStorage();
  }, []);

  useEffect(() => {
    loadCustomizationDetails();
  }, [loadCustomizationDetails]);

  // Reload progress every time screen is focused
  useFocusEffect(
    useCallback(() => {
      loadProgressFromStorage();
      loadCustomizationDetails();
    }, [loadCustomizationDetails])
  );

  const loadProgressFromStorage = async () => {
    try {
      const savedProgress = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedProgress !== null) {
        setCurrentStep(parseInt(savedProgress));
      }
    } catch (error) {
      console.log("Error loading progress:", error);
    }
  };

  const getEstimatedDate = (stepIndex: number) => {
    const daysPerStep = 2;
    const startDate = new Date(orderDate);
    const estimatedDate = new Date(startDate.getTime() + (stepIndex * daysPerStep * 24 * 60 * 60 * 1000));
    return estimatedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const progressPercent = Math.min(
    100,
    Math.round((currentStep / Math.max(STEPS.length - 1, 1)) * 100),
  );

  const renderItem = ({ item, index }: { item: string; index: number }) => {
    const completed = index < currentStep;
    const active = index === currentStep;

    return (
      <View style={styles.row}>
        <View style={styles.left}>
          <View
            style={[
              styles.circle,
              completed && styles.completed,
              active && { backgroundColor: tint, borderColor: tint },
            ]}
          >
            {completed && (
              <Ionicons name="checkmark" size={16} color="#fff" />
            )}
            {active && (
              <Ionicons name="ellipsis-horizontal" size={16} color="#fff" />
            )}
          </View>
          {index !== STEPS.length - 1 && (
            <View style={[styles.line, completed && { backgroundColor: tint }]} />
          )}
        </View>

        <View style={styles.right}>
          <Text
            style={[
              styles.title,
              completed && styles.completedText,
              active && { color: tint, fontWeight: '900', fontSize: 15 },
            ]}
          >
            {item}
          </Text>
          {active && (
            <Text style={[styles.sub, { color: tint }]}>Currently working on this step</Text>
          )}
          {completed && (
            <Text style={styles.subCompleted}>Completed</Text>
          )}
          {!completed && !active && (
            <Text style={styles.subPending}>Pending</Text>
          )}
          <Text style={styles.estimatedDate}>Est. {getEstimatedDate(index)}</Text>
        </View>
      </View>
    );
  };

  if (!hasSelectedOrder) {
    return (
      <ProtectedRoute requiredRole="customer">
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.container}>
            <View style={[styles.headerContainer, { backgroundColor: tint }]}>
              <AppBackButton onPress={() => router.back()} />
              <View style={styles.headerContent}>
                <Text style={styles.header}>Order Timeline</Text>
                <Text style={styles.subheader}>Tap any order to open its timeline</Text>
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              <View style={styles.ordersPanelCard}>
                <View style={styles.panelHeader}>
                  <View>
                    <Text style={[styles.panelEyebrow, { color: tint }]}>All Orders</Text>
                    <Text style={styles.panelTitle}>Open one order to see the timeline</Text>
                  </View>
                  <View style={styles.panelHeaderIcon}>
                    <Ionicons name="layers-outline" size={20} color={tint} />
                  </View>
                </View>

                {TIMELINE_ORDERS.map((order) => (
                  <Pressable key={order.orderId} style={styles.orderListCard} onPress={() => openOrder(order)}>
                    <View style={styles.orderListTop}>
                      <View style={styles.orderListAvatar}>
                        <Text style={styles.orderListAvatarText}>{order.tailorAvatar}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.orderListTitle}>{order.orderDescription}</Text>
                        <Text style={[styles.orderListSubtitle, { color: tint }]}>{order.tailorName}</Text>
                      </View>
                      <View style={styles.orderListPriceWrap}>
                        <Text style={styles.orderListPriceLabel}>Total</Text>
                        <Text style={styles.orderListPrice}>Rs {Number(order.orderPrice).toLocaleString()}</Text>
                      </View>
                    </View>
                    <View style={styles.orderListMetaRow}>
                      <View style={styles.orderListPill}>
                        <Text style={[styles.orderListPillText, { color: tint }]}>{order.statusLabel}</Text>
                      </View>
                      <Text style={styles.orderListDate}>{order.orderDate}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>
        </SafeAreaView>
      </ProtectedRoute>
    );
  }

  if (activeTab === 'tailor') {
    return (
      <ProtectedRoute requiredRole="customer">
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.container}>
            <View style={[styles.headerContainer, { backgroundColor: tint }]}>
              <AppBackButton onPress={() => router.back()} />
              <View style={styles.headerContent}>
                <Text style={styles.header}>Order Progress</Text>
                <Text style={styles.subheader}>Tailor details for {tailorName}</Text>
              </View>
            </View>

            <View style={styles.tabRow}>
              <Pressable onPress={() => setActiveTab('tailor')} style={[styles.tabBtn, { backgroundColor: tint, borderColor: tint }]}>
                <Text style={[styles.tabText, styles.tabTextActive]}>Tailor Detail</Text>
              </Pressable>
              <Pressable onPress={() => setActiveTab('order')} style={styles.tabBtn}>
                <Text style={styles.tabText}>Order Detail</Text>
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              <View style={styles.tailorDetailCard}>
                <View style={styles.tailorDetailHero}>
                  <View style={[styles.tailorAvatarLarge, { backgroundColor: tint }]}>
                    <Text style={styles.tailorAvatarLargeText}>{tailorAvatarFromParams.slice(0, 2)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tailorNameLarge}>{tailorName}</Text>
                    <Text style={styles.tailorRatingLarge}>{tailorRating}</Text>
                    <View style={styles.verifiedPill}>
                      <Ionicons name="shield-checkmark" size={12} color={tint} />
                      <Text style={[styles.verifiedPillText, { color: tint }]}>Verified tailor</Text>
                    </View>
                  </View>
                  <View style={styles.statusPill}>
                    <Text style={[styles.statusPillText, { color: tint }]}>{statusLabelFromParams || STEPS[currentStep]}</Text>
                  </View>
                </View>

                <View style={styles.detailInfoGrid}>
                  <View style={styles.detailInfoItem}>
                    <Ionicons name="finger-print-outline" size={16} color={tint} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.detailInfoLabel}>Tailor ID</Text>
                      <Text style={styles.detailInfoValue} numberOfLines={1}>{tailorIdFromParams}</Text>
                    </View>
                  </View>
                  <View style={styles.detailInfoItem}>
                    <Ionicons name="call-outline" size={16} color={tint} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.detailInfoLabel}>Phone</Text>
                      <Text style={styles.detailInfoValue}>{tailorPhoneFromParams}</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.buttonContainerInline}>
                <TouchableOpacity style={[styles.profileButton, { borderColor: tint }]} onPress={handleViewTailorProfile}>
                  <Ionicons name="person-circle-outline" size={20} color={tint} />
                  <Text style={[styles.profileButtonText, { color: tint }]}>View Full Tailor Profile</Text>
                  <Ionicons name="chevron-forward" size={16} color={tint} />
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </SafeAreaView>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="customer">
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Header with Back Button */}
          <View style={[styles.headerContainer, { backgroundColor: tint }]}>
            <AppBackButton onPress={() => router.back()} />
            <View style={styles.headerContent}>
              <Text style={styles.header}>Order Progress</Text>
              <Text style={styles.subheader}>Track your order status</Text>
            </View>
          </View>

          <View style={styles.tabRow}>
            <Pressable onPress={() => setActiveTab('tailor')} style={styles.tabBtn}>
              <Text style={styles.tabText}>Tailor Detail</Text>
            </Pressable>
            <Pressable onPress={() => setActiveTab('order')} style={[styles.tabBtn, { backgroundColor: tint, borderColor: tint }]}>
              <Text style={[styles.tabText, styles.tabTextActive]}>Order Detail</Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <View style={styles.orderHeroCard}>
              <View style={styles.orderHeroHeader}>
                <View style={[styles.tailorAvatarLarge, { backgroundColor: tint }]}>
                  <Text style={styles.tailorAvatarLargeText}>{tailorAvatarFromParams.slice(0, 2)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.orderHeroLabel, { color: tint }]}>{ORDER_ID}</Text>
                  <Text style={styles.orderHeroTitle}>{orderDescription}</Text>
                  <Text style={[styles.orderHeroTailor, { color: tint }]}>{tailorName}</Text>
                  <Text style={styles.orderHeroDate}>Ordered on {orderDate}</Text>
                </View>
                {orderPriceFromParams ? (
                  <View style={styles.priceCard}>
                    <Text style={styles.priceLabel}>Total</Text>
                    <Text style={styles.priceValue}>Rs {Number(orderPriceFromParams).toLocaleString()}</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.orderHeroMetaRow}>
                <View style={styles.statusPill}>
                  <Text style={[styles.statusPillText, { color: tint }]}>{statusLabelFromParams || STEPS[currentStep]}</Text>
                </View>
                <Text style={styles.tailorRatingCompact}>{tailorRating}</Text>
              </View>

              <View style={styles.progressSection}>
                <View style={styles.progressHeaderRow}>
                  <Text style={styles.sectionTitle}>Overall Progress</Text>
                  <View style={[styles.progressBadge, { backgroundColor: tint }]}>
                    <Text style={styles.progressBadgeText}>{progressPercent}%</Text>
                  </View>
                </View>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${progressPercent}%` },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  Step {currentStep + 1} of {STEPS.length} · {STEPS[currentStep]}
                </Text>
              </View>
            </View>

            {previewModelId && (previewDressGlb.url != null || preview2d != null) ? (
              <View style={styles.previewCard}>
                <SectionHeader icon="cube-outline" title="Ordered 3D Design" accentColor={tint} />
                <View style={styles.previewViewport}>
                  {previewDressGlb.url != null ? (
                    <DressGlbPreview
                      key={`${ORDER_ID}-${previewDressGlb.url}-${mergedPreviewSelections.colors ?? ''}`}
                      glbUrl={previewDressGlb.url}
                      width={glPreviewW}
                      height={glPreviewH}
                      fabricColorHex={previewFabricColorHex}
                      fabricTextureUrl={previewFabricTextureUrl}
                      fallbackImage={preview2d}
                    />
                  ) : preview2d ? (
                    <Image source={preview2d} style={styles.preview2d} resizeMode="contain" />
                  ) : null}
                </View>
                <Pressable style={styles.view3dLink} onPress={handleView3dModel}>
                  <Ionicons name="expand-outline" size={18} color={tint} />
                  <Text style={[styles.view3dLinkText, { color: tint }]}>View full 3D model</Text>
                  <Ionicons name="chevron-forward" size={16} color={tint} />
                </Pressable>
              </View>
            ) : null}

            <View style={styles.designCard}>
              <SectionHeader icon="color-palette-outline" title="Design Details" accentColor={tint} />
              <View style={styles.infoGrid}>
                {orderInfoRows.map((row) => (
                  <View key={row.label} style={styles.infoChip}>
                    <Text style={styles.infoChipLabel}>{row.label}</Text>
                    <Text style={styles.infoChipValue}>{row.value}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.designCard}>
              <SectionHeader icon="body-outline" title="Measurements" accentColor={tint} />
              <View style={styles.infoGrid}>
                {measurementRows.map((row) => (
                  <View key={row.label} style={styles.infoChip}>
                    <Text style={styles.infoChipLabel}>{row.label}</Text>
                    <Text style={styles.infoChipValue}>{row.value}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.timelineSection}>
              <SectionHeader icon="git-branch-outline" title="Production Timeline" accentColor={tint} />
              <FlatList
                data={STEPS}
                keyExtractor={(item, index) => index.toString()}
                renderItem={renderItem}
                scrollEnabled={false}
              />
            </View>

            <View
              style={[
                styles.statusMessageCard,
                currentStep === STEPS.length - 1 ? styles.statusComplete : styles.statusInProgress,
              ]}
            >
              {currentStep === STEPS.length - 1 ? (
                <>
                  <View style={[styles.statusIconWrap, styles.statusIconComplete]}>
                    <Ionicons name="checkmark-circle" size={36} color="#10b981" />
                  </View>
                  <Text style={styles.statusTitle}>Order Complete!</Text>
                  <Text style={styles.statusMessage}>
                    Your dress is ready for pickup. Contact the tailor for delivery details.
                  </Text>
                </>
              ) : (
                <>
                  <View style={[styles.statusIconWrap, styles.statusIconActive]}>
                    <Ionicons name="cut-outline" size={32} color={tint} />
                  </View>
                  <Text style={styles.statusTitle}>In Progress</Text>
                  <Text style={styles.statusMessage}>
                    Your tailor is working on: {STEPS[currentStep]}
                  </Text>
                </>
              )}
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.soft,
  },
  container: {
    flex: 1,
    backgroundColor: THEME.soft,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 44,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    ...UI.shadow,
  },
  headerContent: {
    flex: 1,
  },
  header: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 2,
  },
  subheader: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.88)',
    fontWeight: '600',
  },
  scrollContent: {
    paddingTop: 14,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  ordersPanelCard: {
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    ...UI.softShadow,
  },
  panelHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: THEME.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ordersPanel: { gap: 12 },
  panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  panelEyebrow: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
  panelTitle: { color: TEXT_DARK, fontSize: 17, fontWeight: '900', marginTop: 4 },
  orderListCard: {
    backgroundColor: THEME.soft,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 14,
    marginBottom: 10,
  },
  orderListTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  orderListAvatar: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: THEME.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderListAvatarText: { color: '#fff', fontWeight: '900' },
  orderListTitle: { fontSize: 16, fontWeight: '900', color: TEXT_DARK },
  orderListSubtitle: { fontSize: 12, marginTop: 2, fontWeight: '700' },
  orderListPriceWrap: { alignItems: 'flex-end' },
  orderListPriceLabel: { fontSize: 10, color: TEXT_MUTED, fontWeight: '800' },
  orderListPrice: { fontSize: 13, color: TEXT_DARK, fontWeight: '900' },
  orderListMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  orderListPill: { backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: THEME.border },
  orderListPillText: { fontSize: 11, fontWeight: '900' },
  orderListDate: { color: TEXT_MUTED, fontSize: 12, fontWeight: '600' },
  tabRow: { flexDirection: 'row', gap: 8, marginHorizontal: 16, marginTop: 12, marginBottom: 4 },
  tabBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 999,
    paddingVertical: 11,
    alignItems: 'center',
    backgroundColor: '#fff',
    ...UI.softShadow,
  },
  tabText: { color: TEXT_MUTED, fontWeight: '800', fontSize: 12 },
  tabTextActive: { color: '#fff' },
  orderHeroCard: {
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: THEME.border,
    ...UI.softShadow,
  },
  orderHeroHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  orderHeroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: THEME.border,
  },
  orderHeroTailor: { fontSize: 13, fontWeight: '800', marginTop: 4 },
  tailorRatingCompact: { fontSize: 12, color: TEXT_MUTED, fontWeight: '700' },
  tailorDetailCard: {
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: THEME.border,
    ...UI.softShadow,
  },
  tailorDetailHero: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  tailorAvatarLarge: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: THEME.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tailorAvatarLargeText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  tailorNameLarge: { fontSize: 18, fontWeight: '900', color: TEXT_DARK },
  tailorRatingLarge: { fontSize: 13, color: TEXT_MUTED, marginTop: 3, fontWeight: '600' },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: THEME.soft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  verifiedPillText: { fontSize: 10, fontWeight: '800' },
  detailInfoGrid: { gap: 10, marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: THEME.border },
  detailInfoItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  detailInfoLabel: { fontSize: 10, color: TEXT_MUTED, fontWeight: '800', textTransform: 'uppercase' },
  detailInfoValue: { fontSize: 13, color: TEXT_DARK, fontWeight: '700', marginTop: 2 },
  buttonContainerInline: { marginBottom: 8 },
  tailorCard: {
    backgroundColor: THEME.soft,
    borderRadius: 22,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  tailorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tailorAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: THEME.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tailorInfo: {
    flex: 1,
  },
  tailorName: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  tailorRating: {
    fontSize: 14,
    color: TEXT_MUTED,
    marginTop: 2,
  },
  statusPill: {
    maxWidth: 110,
    borderRadius: 999,
    backgroundColor: THEME.soft,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  tinyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: THEME.border,
  },
  tinyLabel: { color: TEXT_MUTED, fontSize: 11, fontWeight: '700' },
  tinyValue: { color: TEXT_DARK, fontSize: 11, fontWeight: '800' },
  demoBadge: {
    fontSize: 11,
    fontWeight: '700',
    backgroundColor: THEME.soft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  orderDetailsSection: {
    marginBottom: 12,
  },
  preview2d: {
    width: '100%',
    height: 220,
  },
  priceCard: {
    backgroundColor: THEME.soft,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'flex-end',
    borderWidth: 1,
    borderColor: THEME.border,
  },
  priceLabel: {
    color: TEXT_MUTED,
    fontSize: 10,
    fontWeight: '900',
    marginBottom: 2,
  },
  priceValue: {
    color: TEXT_DARK,
    fontSize: 15,
    fontWeight: '900',
  },
  designCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: THEME.border,
    marginTop: 12,
    ...UI.softShadow,
  },
  sectionIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: THEME.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  infoChip: {
    width: '48%',
    backgroundColor: THEME.soft,
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  infoChipLabel: {
    color: TEXT_MUTED,
    fontSize: 10,
    fontWeight: '900',
    marginBottom: 3,
    textTransform: 'uppercase',
  },
  infoChipValue: {
    color: TEXT_DARK,
    fontSize: 12,
    fontWeight: '800',
  },
  progressSection: {
    paddingTop: 14,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: THEME.border,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  progressBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  progressBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
  },
  progressBar: {
    height: 10,
    backgroundColor: THEME.soft,
    borderRadius: 999,
    marginBottom: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: THEME.border,
  },
  progressFill: {
    height: '100%',
    backgroundColor: THEME.primary,
    borderRadius: 999,
  },
  progressText: {
    fontSize: 12,
    color: TEXT_MUTED,
    fontWeight: '600',
  },
  timelineSection: {
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: THEME.border,
    ...UI.softShadow,
  },
  row: {
    flexDirection: "row",
    marginBottom: 24,
  },
  left: {
    width: 40,
    alignItems: "center",
  },
  circle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#cbd5e1',
  },
  completed: {
    backgroundColor: '#10b981',
    borderColor: '#059669',
  },
  line: {
    width: 3,
    flex: 1,
    backgroundColor: '#e2e8f0',
    marginTop: 6,
    borderRadius: 2,
  },
  right: {
    flex: 1,
    marginLeft: 14,
    paddingTop: 2,
  },
  title: {
    fontSize: 14,
    color: TEXT_MUTED,
    fontWeight: '600',
  },
  completedText: {
    color: '#10b981',
    fontWeight: '800',
  },
  sub: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '700',
  },
  subCompleted: {
    fontSize: 11,
    color: '#10b981',
    marginTop: 4,
    fontWeight: '700',
  },
  subPending: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
    fontWeight: '600',
  },
  estimatedDate: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 6,
    fontWeight: '600',
  },
  statusMessageCard: {
    borderRadius: 20,
    padding: 22,
    marginTop: 14,
    alignItems: 'center',
    borderWidth: 1,
    ...UI.softShadow,
  },
  statusInProgress: {
    backgroundColor: THEME.soft,
    borderColor: THEME.border,
  },
  statusComplete: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  statusIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statusIconActive: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: THEME.border,
  },
  statusIconComplete: {
    backgroundColor: '#fff',
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: TEXT_DARK,
    marginTop: 8,
  },
  statusMessage: {
    fontSize: 14,
    color: TEXT_MUTED,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 21,
    fontWeight: '500',
  },
  previewCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: THEME.border,
    marginTop: 0,
    ...UI.softShadow,
  },
  previewViewport: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: THEME.soft,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: THEME.border,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: TEXT_DARK,
  },
  orderHeroLabel: {
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 3,
    letterSpacing: 0.4,
  },
  orderHeroTitle: {
    color: TEXT_DARK,
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 26,
  },
  orderHeroDate: {
    color: TEXT_MUTED,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  view3dLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: THEME.soft,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  buttonContainer: {
    padding: 0,
    paddingBottom: 8,
    gap: 10,
  },
  profileButton: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    ...UI.softShadow,
  },
  profileButtonText: {
    fontSize: 15,
    fontWeight: '800',
    flex: 1,
    textAlign: 'center',
  },
  view3dLinkText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
