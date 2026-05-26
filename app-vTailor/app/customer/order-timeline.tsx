import { ProtectedRoute } from '@/components/ProtectedRoute';
import AppBackButton from '@/components/AppBackButton';
import { DressGlbPreview } from '@/components/DressGlbPreview';
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/AuthContext';
import { dressPreviewFromOrderDescription } from '@/services/orderDressPreview';
import { getUserCustomizations } from '@/services/userDataService';
import { type TabId } from '@/services/dressGlbResolver';
import { useBundledDressGlb } from '@/hooks/useBundledDressGlb';
import { useThemeColor } from '@/hooks/use-theme-color';
import {
  fabricColorHexFromId,
  fabricColorNameFromId,
  usesCasualShortShirtFabricTint,
} from '@/services/dressFabricColors';
import { with3dPreviewDefaults } from '@/services/glb/threePreviewReadiness';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';

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

const TIMELINE_ORDERS: TimelineOrder[] = [
  {
    orderId: 'ORD-001',
    orderDescription: 'Long Frock',
    orderDate: '2026-12-25',
    orderPrice: '8500',
    tailorName: 'Ahmad Tailor',
    tailorId: 'sample-tailor-aliya-formal',
    tailorPhone: '+923215560190',
    tailorAvatar: 'AT',
    tailorRating: '⭐ 4.8 (245 reviews)',
    tailorEmail: 'ahmad@tailors.com',
    tailorAddress: '123 Fashion Street, Karachi',
    tailorExperience: '8 Years',
    specialization: 'Formal Dresses, Wedding Attire, Traditional',
    tailorDescription: 'Expert tailor with 8 years of experience in custom tailoring and alterations. Known for quality work and customer satisfaction.',
    tailorDeliveryTime: '7-10 days',
    statusLabel: 'In Progress',
    sampleNeck: 'Round Neck',
    sampleSleeves: 'Bell Sleeves',
    sampleStyle: 'Flared Bottom',
    sampleColor: 'Beige',
    modelId: 'long-frock',
    selections: { neck: 'v-neck', sleeves: 'bell', bottom: null, 'frock-style': 'flared-bottom', colors: 'beige' },
  },
  {
    orderId: 'ORD-002',
    orderDescription: 'Shalwar Kameez',
    orderDate: '2026-12-20',
    orderPrice: '25000',
    tailorName: 'Master Tailors',
    tailorId: 'sample-tailor-fatima-traditional',
    tailorPhone: '+923129018820',
    tailorAvatar: 'MT',
    tailorRating: '⭐ 4.6 (180 reviews)',
    tailorEmail: 'fatima@mastertailors.com',
    tailorAddress: '45 Old Street, Lahore',
    tailorExperience: '6 Years',
    specialization: 'Traditional, Casual',
    tailorDescription: 'Specializes in traditional shalwar kameez and custom casual wear.',
    tailorDeliveryTime: '5-8 days',
    statusLabel: 'Cutting',
    sampleNeck: 'V-Neck',
    sampleSleeves: 'Bell Sleeves',
    sampleStyle: 'Straight Style',
    sampleColor: 'Beige',
  },
  {
    orderId: 'ORD-003',
    orderDescription: 'Kurti',
    orderDate: '2026-12-15',
    orderPrice: '3500',
    tailorName: 'Classic Stitches',
    tailorId: 'sample-tailor-noor-party',
    tailorPhone: '+923332198744',
    tailorAvatar: 'CS',
    tailorRating: '⭐ 4.7 (132 reviews)',
    tailorEmail: 'noor@classicstitches.com',
    tailorAddress: '88 Market Road, Islamabad',
    tailorExperience: '4 Years',
    specialization: 'Party Wear, Kurtis',
    tailorDescription: 'Contemporary designs for party wear and everyday kurtis.',
    tailorDeliveryTime: '4-6 days',
    statusLabel: 'Delivered',
    sampleNeck: 'Round Neck',
    sampleSleeves: 'Bell Sleeves',
    sampleStyle: 'Straight Style',
    sampleColor: 'Beige',
  },
  {
    orderId: 'ORD-004',
    orderDescription: 'Lehenga',
    orderDate: '2026-12-10',
    orderPrice: '6000',
    tailorName: 'Ahmad Tailor',
    tailorId: 'sample-tailor-zainab-bridal',
    tailorPhone: '+923004102231',
    tailorAvatar: 'AT',
    tailorRating: '⭐ 4.8 (245 reviews)',
    statusLabel: 'Delivered',
    sampleNeck: 'Round Neck',
    sampleSleeves: 'Bell Sleeves',
    sampleStyle: 'Flared Style',
    sampleColor: 'Beige',
  },
];

const defaultSelections: Record<TabId, string | null> = {
  neck: null,
  sleeves: null,
  bottom: null,
  'frock-style': null,
  colors: null,
  'saree-style': null,
};

function mergedSelections(selections: Record<string, string | null>): Record<TabId, string | null> {
  return { ...defaultSelections, ...selections } as Record<TabId, string | null>;
}

function imageForModel(modelId: string) {
  if (modelId === 'kurti') return require('../../2d model/casual dresses.jpg');
  if (modelId === 'kurti-trouser') return require('../../2d model/casual dresses.jpg');
  if (modelId === 'short-frock') return require('../../2d model/short-shirt-shalwar.png');
  if (modelId === 'short-frock-shalwar' || modelId === 'shalwar-kameez-short')
    return require('../../2d model/short-shirt-shalwar.png');
  if (modelId === 'long-frock') return require('../../2d model/long frock 2.png');
  if (modelId === 'saree') return require('../../2d model/variations/saree.png');
  if (modelId === 'shalwar-kameez' || modelId === 'shalwar-kameez-long')
    return require('../../2d model/short-shirt-shalwar.png');
  if (modelId === 'sharara') return require('../../2d model/shrara.jpg');
  if (modelId === 'grarah-short-shirt') return require('../../2d model/variations/short-shirt-grarah.png');
  if (modelId === 'grarah-peplum') return require('../../2d model/variations/peplum-grarah.png');
  if (modelId === 'lehnga-circular') return require('../../2d model/variations/circular.png');
  if (modelId === 'lehnga-bridal' || modelId === 'lehnga') return require('../../2d model/bridal-lehnga.png');
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
  const params = useLocalSearchParams();
  const { width: screenW } = useWindowDimensions();
  const glPreviewW = Math.max(260, Math.floor(screenW - 64));
  const glPreviewH = 220;
  const { userId } = useAuth();
  const tint = useThemeColor({}, 'tint');

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
  const tailorEmailFromParams = (params.tailorEmail as string) || '';
  const tailorAddressFromParams = (params.tailorAddress as string) || '';
  const tailorExperienceFromParams = (params.tailorExperience as string) || '';
  const tailorDescriptionFromParams = (params.tailorDescription as string) || '';
  const tailorDeliveryTimeFromParams = (params.tailorDeliveryTime as string) || '';
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
  const preview2d = previewModelId ? imageForModel(previewModelId) : null;
  const [activeTab, setActiveTab] = useState<'tailor' | 'order'>('order');

  useEffect(() => {
    setActiveTab('order');
  }, [selectedOrderId]);

  const handleContactTailor = () => {
    router.push({
      pathname: '/customer/chat-conversation',
      params: {
        tailorId: tailorIdFromParams,
        otherUserId: tailorIdFromParams,
        otherUserName: tailorName,
        otherUserAvatar: tailorAvatarFromParams,
        otherUserPhone: tailorPhoneFromParams,
      },
    });
  };

  const handleCallTailor = () => {
    const dialNumber = tailorPhoneFromParams.replace(/\s+/g, '');
    Linking.openURL(`tel:${dialNumber}`).catch(() => {
      Alert.alert('Call Failed', `Unable to open dialer for ${tailorPhoneFromParams}.`);
    });
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
        tailorEmail: order.tailorEmail,
        tailorAddress: order.tailorAddress,
        tailorExperience: order.tailorExperience,
        specialization: order.specialization,
        tailorDescription: order.tailorDescription,
        tailorDeliveryTime: order.tailorDeliveryTime,
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
              active && styles.active,
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
            <View style={[styles.line, completed && styles.lineCompleted]} />
          )}
        </View>

        <View style={styles.right}>
          <Text
            style={[
              styles.title,
              completed && styles.completedText,
              active && styles.activeText,
            ]}
          >
            {item}
          </Text>
          {active && (
            <Text style={styles.sub}>Currently working on this step</Text>
          )}
          {completed && (
            <Text style={styles.subCompleted}>✓ Completed</Text>
          )}
          {!completed && !active && (
            <Text style={styles.subPending}>Pending</Text>
          )}
          <Text style={styles.estimatedDate}>Est: {getEstimatedDate(index)}</Text>
        </View>
      </View>
    );
  };

  if (!hasSelectedOrder) {
    return (
      <ProtectedRoute requiredRole="customer">
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.container}>
            <View style={styles.headerContainer}>
              <AppBackButton onPress={() => router.back()} />
              <View style={styles.headerContent}>
                <Text style={styles.header}>Order Timeline</Text>
                <Text style={styles.subheader}>Tap any order to open its timeline</Text>
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              <View style={styles.ordersPanel}>
                <View style={styles.panelHeader}>
                  <View>
                    <Text style={styles.panelEyebrow}>All Orders</Text>
                    <Text style={styles.panelTitle}>Open one order to see the timeline</Text>
                  </View>
                  <Ionicons name="layers-outline" size={22} color="#be185d" />
                </View>

                {TIMELINE_ORDERS.map((order) => (
                  <Pressable key={order.orderId} style={styles.orderListCard} onPress={() => openOrder(order)}>
                    <View style={styles.orderListTop}>
                      <View style={styles.orderListAvatar}>
                        <Text style={styles.orderListAvatarText}>{order.tailorAvatar}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.orderListTitle}>{order.orderDescription}</Text>
                        <Text style={styles.orderListSubtitle}>{order.tailorName}</Text>
                      </View>
                      <View style={styles.orderListPriceWrap}>
                        <Text style={styles.orderListPriceLabel}>Total</Text>
                        <Text style={styles.orderListPrice}>Rs {Number(order.orderPrice).toLocaleString()}</Text>
                      </View>
                    </View>
                    <View style={styles.orderListMetaRow}>
                      <View style={styles.orderListPill}>
                        <Text style={styles.orderListPillText}>{order.statusLabel}</Text>
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
            <View style={styles.headerContainer}>
              <AppBackButton onPress={() => router.back()} />
              <View style={styles.headerContent}>
                <Text style={styles.header}>Order Progress</Text>
                <Text style={styles.subheader}>Tailor details for {tailorName}</Text>
              </View>
            </View>

            <View style={styles.tabRow}>
              <Pressable onPress={() => setActiveTab('tailor')} style={[styles.tabBtn, styles.tabBtnActive]}>
                <Text style={[styles.tabText, styles.tabTextActive]}>Tailor Detail</Text>
              </Pressable>
              <Pressable onPress={() => setActiveTab('order')} style={styles.tabBtn}>
                <Text style={styles.tabText}>Order Detail</Text>
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              <View style={styles.tailorCard}>
                <View style={styles.tailorHeader}>
                  <View style={styles.tailorAvatar}>
                    <Ionicons name="storefront" size={32} color="#fff" />
                  </View>
                  <View style={styles.tailorInfo}>
                    <Text style={styles.tailorName}>{tailorName}</Text>
                    <Text style={styles.tailorRating}>{tailorRating}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.orderModelButton, { borderColor: tint, marginTop: 14, marginBottom: 0 }]}
                  onPress={() =>
                    router.push({
                      pathname: '/customer/tailor-details',
                      params: {
                        tailorId: tailorIdFromParams,
                        tailorName,
                        tailorPhone: tailorPhoneFromParams,
                        tailorAvatar: tailorAvatarFromParams,
                        tailorEmail: tailorEmailFromParams,
                        tailorAddress: tailorAddressFromParams,
                        tailorExperience: tailorExperienceFromParams,
                        specialization: params.specialization,
                        tailorDescription: tailorDescriptionFromParams,
                        from: 'orders',
                      },
                    })
                  }
                >
                  <Ionicons name="person-circle-outline" size={20} color={tint} />
                  <Text style={[styles.orderModelButtonText, { color: tint }]}>View Tailor Profile</Text>
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
          <View style={styles.headerContainer}>
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
            <Pressable onPress={() => setActiveTab('order')} style={[styles.tabBtn, styles.tabBtnActive]}>
              <Text style={[styles.tabText, styles.tabTextActive]}>Order Detail</Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Order Hero Card */}
            <View style={styles.tailorCard}>
              <View style={styles.tailorHeader}>
                <View style={styles.tailorAvatar}>
                  <Ionicons name="storefront" size={32} color="#fff" />
                </View>
                <View style={styles.tailorInfo}>
                  <Text style={styles.tailorName}>{tailorName}</Text>
                  <Text style={styles.tailorRating}>{tailorRating}</Text>
                </View>
              </View>

              {/* Order Details */}
              <View style={styles.orderDetailsSection}>
                <View style={styles.orderHeroTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.orderHeroLabel}>{ORDER_ID}</Text>
                    <Text style={styles.orderHeroTitle}>{orderDescription}</Text>
                    <Text style={styles.orderHeroDate}>Ordered on {orderDate}</Text>
                  </View>
                  {orderPriceFromParams ? (
                    <View style={styles.priceCard}>
                      <Text style={styles.priceLabel}>Total</Text>
                      <Text style={styles.priceValue}>Rs {Number(orderPriceFromParams).toLocaleString()}</Text>
                    </View>
                  ) : null}
                </View>
              </View>

              <TouchableOpacity
                style={[styles.orderModelButton, { borderColor: tint }]}
                onPress={() =>
                  router.push({
                    pathname: '/customer/view-3d-model',
                    params: {
                      modelId: previewModelId || paramModelId || '',
                      modelName: orderDescription,
                      selections: JSON.stringify(previewSelectionsFor3d),
                      viewOnly: '1',
                    },
                  })
                }
                disabled={!previewModelId && !paramModelId}
              >
                <Ionicons name="cube-outline" size={20} color={tint} />
                <Text style={[styles.orderModelButtonText, { color: tint }]}>View Full Model</Text>
              </TouchableOpacity>

              {previewModelId && (previewDressGlb.url != null || preview2d != null) ? (
                <View style={styles.previewCard}>
                  <View style={styles.cardTitleRow}>
                    <Ionicons name="cube-outline" size={18} color="#be185d" />
                    <Text style={styles.sectionTitle}>Ordered 3D design</Text>
                  </View>
                  <View style={styles.previewViewport}>
                    {previewDressGlb.url != null ? (
                      <DressGlbPreview
                        key={`${ORDER_ID}-${previewDressGlb.url}-${mergedPreviewSelections.colors ?? ''}`}
                        glbUrl={previewDressGlb.url}
                        width={glPreviewW}
                        height={glPreviewH}
                        fabricColorHex={previewFabricHex}
                        fallbackImage={preview2d}
                      />
                    ) : preview2d ? (
                      <Image source={preview2d} style={styles.preview2d} resizeMode="contain" />
                    ) : null}
                  </View>
                </View>
              ) : null}

              <View style={styles.designCard}>
                <View style={styles.cardTitleRow}>
                  <Ionicons name="color-palette-outline" size={18} color="#be185d" />
                  <Text style={styles.sectionTitle}>Design Details</Text>
                </View>
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
                <View style={styles.cardTitleRow}>
                  <Ionicons name="body-outline" size={18} color="#be185d" />
                  <Text style={styles.sectionTitle}>Measurements</Text>
                </View>
                <View style={styles.infoGrid}>
                  {measurementRows.map((row) => (
                    <View key={row.label} style={styles.infoChip}>
                      <Text style={styles.infoChipLabel}>{row.label}</Text>
                      <Text style={styles.infoChipValue}>{row.value}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressSection}>
                <Text style={styles.sectionTitle}>Overall Progress</Text>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${(currentStep / (STEPS.length - 1)) * 100}%` }
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {currentStep + 1} of {STEPS.length} steps completed
                </Text>
              </View>
            </View>

            {/* Timeline Section */}
            <View style={styles.timelineSection}>
              <Text style={styles.sectionTitle}>Timeline</Text>
              <FlatList
                data={STEPS}
                keyExtractor={(item, index) => index.toString()}
                renderItem={renderItem}
                scrollEnabled={false}
              />
            </View>

            {/* Status Message */}
            <View style={styles.statusMessageCard}>
              {currentStep === STEPS.length - 1 ? (
                <>
                  <Ionicons name="checkmark-circle" size={40} color="#10b981" />
                  <Text style={styles.statusTitle}>Order Complete!</Text>
                  <Text style={styles.statusMessage}>
                    Your dress is ready for pickup. Contact the tailor for delivery details.
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="time-outline" size={40} color="#f59e0b" />
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
    backgroundColor: "#f3f4f6",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 44,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    marginRight: 12,
    padding: 8,
  },
  headerContent: {
    flex: 1,
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 2,
  },
  subheader: {
    fontSize: 13,
    color: "#6b7280",
  },
  scrollContent: {
    paddingTop: 32,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  ordersPanel: { gap: 12 },
  panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  panelEyebrow: { color: '#be185d', fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
  panelTitle: { color: '#111827', fontSize: 18, fontWeight: '900', marginTop: 4 },
  orderListCard: { backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: '#fbcfe8', padding: 14, marginBottom: 12 },
  orderListTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  orderListAvatar: { width: 46, height: 46, borderRadius: 16, backgroundColor: '#ec4899', alignItems: 'center', justifyContent: 'center' },
  orderListAvatarText: { color: '#fff', fontWeight: '900' },
  orderListTitle: { fontSize: 16, fontWeight: '900', color: '#111827' },
  orderListSubtitle: { fontSize: 12, color: '#6b7280', marginTop: 2, fontWeight: '600' },
  orderListPriceWrap: { alignItems: 'flex-end' },
  orderListPriceLabel: { fontSize: 10, color: '#9ca3af', fontWeight: '800' },
  orderListPrice: { fontSize: 13, color: '#111827', fontWeight: '900' },
  orderListMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  orderListPill: { backgroundColor: '#fdf2f8', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  orderListPillText: { color: '#be185d', fontSize: 11, fontWeight: '900' },
  orderListDate: { color: '#6b7280', fontSize: 12, fontWeight: '600' },
  tabRow: { flexDirection: 'row', gap: 10, marginHorizontal: 16, marginTop: 10 },
  tabBtn: { flex: 1, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 999, paddingVertical: 10, alignItems: 'center', backgroundColor: '#fff' },
  tabBtnActive: { backgroundColor: '#be185d', borderColor: '#be185d' },
  tabText: { color: '#374151', fontWeight: '800', fontSize: 12 },
  tabTextActive: { color: '#fff' },
  tailorCard: {
    backgroundColor: "#fff7fb",
    borderRadius: 22,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#fbcfe8",
  },
  tailorHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  tailorAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#ec4899",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  tailorInfo: {
    flex: 1,
  },
  tailorName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  tailorRating: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2,
  },
  statusPill: {
    maxWidth: 110,
    borderRadius: 999,
    backgroundColor: "#fdf2f8",
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  statusPillText: {
    color: "#be185d",
    fontSize: 11,
    fontWeight: "800",
    textAlign: "center",
  },
  tinyRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#fbcfe8' },
  tinyLabel: { color: '#6b7280', fontSize: 11, fontWeight: '700' },
  tinyValue: { color: '#111827', fontSize: 11, fontWeight: '800' },
  demoBadge: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1d4ed8",
    backgroundColor: "#dbeafe",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  orderDetailsSection: {
    marginBottom: 12,
  },
  previewCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 13,
    borderWidth: 1,
    borderColor: '#fbcfe8',
    marginTop: 12,
  },
  previewViewport: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    overflow: 'hidden',
  },
  preview2d: {
    width: '100%',
    height: 220,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#111827",
  },
  orderHeroTop: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  orderHeroLabel: {
    color: "#be185d",
    fontSize: 11,
    fontWeight: "900",
    marginBottom: 3,
  },
  orderHeroTitle: {
    color: "#111827",
    fontSize: 22,
    fontWeight: "900",
  },
  orderHeroDate: {
    color: "#6b7280",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  priceCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: "flex-end",
    borderWidth: 1,
    borderColor: "#fbcfe8",
  },
  priceLabel: {
    color: "#9ca3af",
    fontSize: 10,
    fontWeight: "900",
    marginBottom: 2,
  },
  priceValue: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "900",
  },
  designCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 13,
    borderWidth: 1,
    borderColor: "#fbcfe8",
    marginTop: 12,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  infoChip: {
    width: "48%",
    backgroundColor: "#fff7fb",
    borderRadius: 14,
    padding: 10,
  },
  infoChipLabel: {
    color: "#9ca3af",
    fontSize: 10,
    fontWeight: "900",
    marginBottom: 3,
  },
  infoChipValue: {
    color: "#111827",
    fontSize: 12,
    fontWeight: "800",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 13,
    color: "#111827",
    fontWeight: "600",
  },
  progressSection: {
    paddingTop: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#dbeafe",
    borderRadius: 4,
    marginBottom: 8,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#3b82f6",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
  },
  timelineSection: {
    marginTop: 8,
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
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#e5e7eb",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#d1d5db",
  },
  completed: {
    backgroundColor: "#10b981",
    borderColor: "#059669",
  },
  active: {
    backgroundColor: "#f59e0b",
    borderColor: "#d97706",
  },
  line: {
    width: 3,
    flex: 1,
    backgroundColor: "#e5e7eb",
    marginTop: 6,
  },
  lineCompleted: {
    backgroundColor: "#10b981",
  },
  right: {
    flex: 1,
    marginLeft: 16,
    paddingTop: 2,
  },
  title: {
    fontSize: 15,
    color: "#6b7280",
    fontWeight: "500",
  },
  completedText: {
    color: "#10b981",
    fontWeight: "600",
  },
  activeText: {
    color: "#f59e0b",
    fontWeight: "700",
    fontSize: 16,
  },
  sub: {
    fontSize: 12,
    color: "#f59e0b",
    marginTop: 4,
    fontWeight: "500",
  },
  subCompleted: {
    fontSize: 12,
    color: "#10b981",
    marginTop: 4,
    fontWeight: "500",
  },
  subPending: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 4,
  },
  estimatedDate: {
    fontSize: 11,
    color: "#d1d5db",
    marginTop: 6,
    fontStyle: "italic",
  },
  statusMessageCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 20,
    marginVertical: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginTop: 12,
  },
  statusMessage: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 8,
    textAlign: "center",
  },
  buttonContainer: {
    padding: 16,
    paddingBottom: 20,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    gap: 10,
  },
  orderModelButton: {
    flexDirection: "row",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 14,
  },
  orderModelButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
  contactButton: {
    flexDirection: "row",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: "#3b82f6",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  contactButtonText: {
    color: "#3b82f6",
    fontSize: 16,
    fontWeight: "700",
  },
  callButton: {
    flexDirection: "row",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#3b82f6",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  callButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
