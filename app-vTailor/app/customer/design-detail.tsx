import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  Image,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/contexts/AuthContext';
import AppBackButton from '@/components/AppBackButton';
import { DressGlbPreview } from '@/components/DressGlbPreview';
import { useBundledDressGlb } from '@/hooks/useBundledDressGlb';
import {
  resolveDressFabricColorHex,
} from '@/services/dressFabricColors';
import { resolveCustomizePreviewImage } from '@/services/dressCustomizePreview';
import { with3dPreviewDefaults } from '@/services/glb/threePreviewReadiness';
import { type TabId } from '@/services/dressGlbResolver';
import {
  getSavedDesignById,
  listCustomizationEntries,
  type SavedDesign,
} from '@/services/savedDesign';
import { SURFACE_MUTED, TEXT_DARK, UI } from '@/constants/ui';
import { safeLocaleString } from '@/utils/safeDisplay';

type DetailTab = 'design' | 'measurements' | 'tailor';

const TABS: { id: DetailTab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'design', label: 'Design', icon: 'color-palette-outline' },
  { id: 'measurements', label: 'Measurements', icon: 'body-outline' },
  { id: 'tailor', label: 'Tailor', icon: 'person-outline' },
];

const MEASUREMENT_GROUPS: { title: string; fields: { id: string; label: string }[]; key: 'basic' | 'shirt' | 'trouser' | 'other' }[] = [
  {
    title: 'Basic',
    key: 'basic',
    fields: [
      { id: 'shoulder', label: 'Shoulder Width' },
      { id: 'biceps', label: 'Biceps' },
      { id: 'arm', label: 'Arm Length' },
      { id: 'thigh', label: 'Thigh' },
      { id: 'armpit', label: 'Armpit' },
      { id: 'bust', label: 'Bust / Chest' },
      { id: 'waist', label: 'Waist' },
      { id: 'hip', label: 'Hips' },
    ],
  },
  {
    title: 'Shirt',
    key: 'shirt',
    fields: [
      { id: 'neck', label: 'Neck' },
      { id: 'length', label: 'Shirt Length' },
      { id: 'chawk', label: 'Chawk' },
      { id: 'gherah', label: 'Gherah' },
    ],
  },
  {
    title: 'Trouser',
    key: 'trouser',
    fields: [
      { id: 'length', label: 'Trouser Length' },
      { id: 'phuncha', label: 'Phuncha / Bottom' },
      { id: 'inseam', label: 'Inseam' },
    ],
  },
  {
    title: 'Other (optional)',
    key: 'other',
    fields: [
      { id: 'frockFlare', label: 'Flared for Frock' },
      { id: 'sareePalu', label: 'Palu Length for Saree' },
      { id: 'ghararaThigh', label: 'Thigh for Gharara' },
      { id: 'ghararaFlare', label: 'Flared for Gharara' },
      { id: 'lehengaLength', label: 'Shirt Length for Lehenga' },
    ],
  },
];

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() || '').join('');
}

export default function DesignDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; tab?: string }>();
  const insets = useSafeAreaInsets();
  const { width: screenW } = useWindowDimensions();
  const { userId } = useAuth();
  const tint = useThemeColor({}, 'tint');
  const card = useThemeColor({}, 'card');
  const inputBorder = useThemeColor({}, 'inputBorder');
  const muted = useThemeColor({}, 'muted');

  const designId = params.id || '';
  const initialTab = (params.tab as DetailTab) || 'design';
  const [activeTab, setActiveTab] = useState<DetailTab>(
    TABS.some((t) => t.id === initialTab) ? initialTab : 'design',
  );
  const [design, setDesign] = useState<SavedDesign | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDesign = useCallback(async () => {
    if (!designId) {
      setDesign(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const row = await getSavedDesignById(userId, designId);
      setDesign(row);
    } finally {
      setLoading(false);
    }
  }, [designId, userId]);

  useFocusEffect(
    useCallback(() => {
      loadDesign();
    }, [loadDesign]),
  );

  const selections = useMemo(
    () => (design?.selections || {}) as Record<TabId, string | null>,
    [design?.selections],
  );
  const selectionsFor3d = useMemo(
    () => (design?.modelId ? with3dPreviewDefaults(design.modelId, selections) : selections),
    [design?.modelId, selections],
  );
  const dressGlb = useBundledDressGlb(selectionsFor3d, design?.modelId || '', true);
  const fabricTextureUrl = selections['fabric-print'];
  const fabricColorHex = resolveDressFabricColorHex(design?.modelId || '', selectionsFor3d);
  const imageSource = useMemo(
    () => (design?.modelId ? resolveCustomizePreviewImage(design.modelId, selections) : null),
    [design?.modelId, selections],
  );
  const customizationRows = useMemo(() => listCustomizationEntries(selections), [selections]);
  const modelViewportH = Math.max(280, Math.floor(screenW * 0.95));

  const openCustomizeEditor = () => {
    if (!design) return;
    router.push({
      pathname: '/customer/customize3d',
      params: {
        modelId: design.modelId,
        modelName: design.modelName,
        dressLine: design.dressLine || '',
        selections: JSON.stringify(selections),
      },
    });
  };

  const renderDesignTab = () => (
    <ScrollView contentContainerStyle={styles.tabScroll} showsVerticalScrollIndicator={false}>
      <View style={[styles.modelCard, { backgroundColor: card, borderColor: inputBorder }]}>
        {dressGlb.url ? (
          <DressGlbPreview
            glbUrl={dressGlb.url}
            width={Math.max(280, Math.floor(screenW - 48))}
            height={modelViewportH}
            fabricColorHex={fabricColorHex}
            fabricTextureUrl={fabricTextureUrl}
            backgroundImage={imageSource}
            fallbackImage={imageSource}
            loadError={dressGlb.error}
            framing="presentation"
            modelId={design?.modelId}
            selections={selectionsFor3d}
          />
        ) : imageSource ? (
          <Image source={imageSource} style={{ width: '100%', height: modelViewportH }} resizeMode="contain" />
        ) : (
          <View style={[styles.emptyModel, { height: modelViewportH }]}>
            <Ionicons name="cube-outline" size={32} color={muted} />
            <ThemedText style={{ color: muted, marginTop: 8 }}>3D preview unavailable</ThemedText>
          </View>
        )}
      </View>

      <ThemedText style={styles.sectionTitle}>Customizations</ThemedText>
      {customizationRows.length ? (
        customizationRows.map((row) => (
          <View key={row.label} style={[styles.rowCard, { backgroundColor: card, borderColor: inputBorder }]}>
            <ThemedText style={[styles.rowLabel, { color: muted }]}>{row.label}</ThemedText>
            <ThemedText style={styles.rowValue}>{row.value}</ThemedText>
          </View>
        ))
      ) : (
        <View style={[styles.emptyBlock, { borderColor: inputBorder, backgroundColor: card }]}>
          <ThemedText style={{ color: muted }}>No customization options saved for this design.</ThemedText>
        </View>
      )}

      {design?.modelId ? (
        <Pressable onPress={openCustomizeEditor} style={[styles.secondaryBtn, { borderColor: inputBorder }]}>
          <ThemedText style={[styles.secondaryBtnText, { color: tint }]}>Edit design</ThemedText>
        </Pressable>
      ) : null}
    </ScrollView>
  );

  const renderMeasurementsTab = () => {
    const m = design?.measurements;
    const hasAny = m && MEASUREMENT_GROUPS.some((g) => g.fields.some((f) => m[g.key]?.[f.id]?.trim()));

    if (!hasAny) {
      return (
        <View style={[styles.emptyBlock, { borderColor: inputBorder, backgroundColor: card, margin: 16 }]}>
          <Ionicons name="body-outline" size={28} color={muted} />
          <ThemedText style={[styles.emptyTitle, { marginTop: 8 }]}>No measurements saved</ThemedText>
          <ThemedText style={{ color: muted, textAlign: 'center', marginTop: 4 }}>
            Measurements from your order flow will appear here.
          </ThemedText>
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/customer/measurements',
                params: {
                  modelId: design?.modelId || '',
                  modelName: design?.modelName || '',
                  selections: JSON.stringify(selections),
                },
              })
            }
            style={[styles.secondaryBtn, { borderColor: inputBorder, marginTop: 16 }]}
          >
            <ThemedText style={[styles.secondaryBtnText, { color: tint }]}>Add measurements</ThemedText>
          </Pressable>
        </View>
      );
    }

    return (
      <ScrollView contentContainerStyle={styles.tabScroll} showsVerticalScrollIndicator={false}>
        {MEASUREMENT_GROUPS.map((group) => {
          const rows = group.fields
            .map((f) => ({ ...f, value: m?.[group.key]?.[f.id]?.trim() || '' }))
            .filter((f) => Boolean(f.value));
          if (!rows.length) return null;
          return (
            <View key={group.title} style={styles.measureGroup}>
              <ThemedText style={styles.sectionTitle}>{group.title}</ThemedText>
              {rows.map((row) => (
                <View key={`${group.key}-${row.id}`} style={[styles.rowCard, { backgroundColor: card, borderColor: inputBorder }]}>
                  <ThemedText style={[styles.rowLabel, { color: muted }]}>{row.label}</ThemedText>
                  <ThemedText style={styles.rowValue}>{row.value} in</ThemedText>
                </View>
              ))}
            </View>
          );
        })}
      </ScrollView>
    );
  };

  const renderTailorTab = () => {
    if (!design?.orderPlaced || !design.tailor) {
      return (
        <View style={[styles.emptyBlock, { borderColor: inputBorder, backgroundColor: card, margin: 16 }]}>
          <Ionicons name="person-outline" size={28} color={muted} />
          <ThemedText style={[styles.emptyTitle, { marginTop: 8 }]}>No tailor assigned</ThemedText>
          <ThemedText style={{ color: muted, textAlign: 'center', marginTop: 4 }}>
            Place an order with a tailor to see their details here.
          </ThemedText>
          <Pressable
            onPress={() => (router as any).push('/customer/find-tailors')}
            style={[styles.primaryBtn, { backgroundColor: tint, marginTop: 16 }]}
          >
            <ThemedText style={styles.primaryBtnText}>Find tailors</ThemedText>
          </Pressable>
        </View>
      );
    }

    const { tailor, order } = design;
    return (
      <ScrollView contentContainerStyle={styles.tabScroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.tailorCard, { backgroundColor: card, borderColor: inputBorder }]}>
          <View style={[styles.tailorAvatar, { backgroundColor: `${tint}22` }]}>
            <ThemedText style={[styles.tailorAvatarText, { color: tint }]}>{initials(tailor.tailorName)}</ThemedText>
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.tailorName}>{tailor.tailorName}</ThemedText>
            {!!tailor.specialization && (
              <ThemedText style={{ color: muted, fontSize: 12, marginTop: 2 }}>
                {tailor.specialization.replace(/,/g, ' • ')}
              </ThemedText>
            )}
            <View style={styles.chipRow}>
              {!!tailor.rating && (
                <ThemedText style={styles.chipGold}>⭐ {tailor.rating}</ThemedText>
              )}
              {!!(tailor.priceFrom && tailor.priceTo) && (
                <ThemedText style={styles.chipBlue}>Rs {tailor.priceFrom}–{tailor.priceTo}</ThemedText>
              )}
            </View>
          </View>
        </View>

        {order ? (
          <>
            <ThemedText style={styles.sectionTitle}>Order request</ThemedText>
            <View style={[styles.rowCard, { backgroundColor: card, borderColor: inputBorder }]}>
              <ThemedText style={[styles.rowLabel, { color: muted }]}>Description</ThemedText>
              <ThemedText style={styles.rowValue}>{order.description}</ThemedText>
            </View>
            <View style={[styles.rowCard, { backgroundColor: card, borderColor: inputBorder }]}>
              <ThemedText style={[styles.rowLabel, { color: muted }]}>Budget</ThemedText>
              <ThemedText style={styles.rowValue}>Rs {order.budget.toLocaleString()}</ThemedText>
            </View>
            <View style={[styles.rowCard, { backgroundColor: card, borderColor: inputBorder }]}>
              <ThemedText style={[styles.rowLabel, { color: muted }]}>Expected delivery</ThemedText>
              <ThemedText style={styles.rowValue}>
                {order.deliveryDays} day{order.deliveryDays === 1 ? '' : 's'}
              </ThemedText>
            </View>
            <View style={[styles.rowCard, { backgroundColor: card, borderColor: inputBorder }]}>
              <ThemedText style={[styles.rowLabel, { color: muted }]}>Placed on</ThemedText>
              <ThemedText style={styles.rowValue}>{safeLocaleString(order.placedAt)}</ThemedText>
            </View>
            <Pressable
              onPress={() => (router as any).push('/customer/orders')}
              style={[styles.secondaryBtn, { borderColor: inputBorder }]}
            >
              <ThemedText style={[styles.secondaryBtnText, { color: tint }]}>View in My Orders</ThemedText>
            </Pressable>
          </>
        ) : null}
      </ScrollView>
    );
  };

  return (
    <ThemedView style={styles.root}>
      <View style={[styles.header, { backgroundColor: tint, paddingTop: insets.top + 8 }]}>
        <AppBackButton onPress={() => router.back()} variant="tint" />
        <ThemedText style={styles.headerTitle} numberOfLines={1}>
          {design?.modelName || 'My Design'}
        </ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <View style={[styles.tabBar, { backgroundColor: card, borderBottomColor: inputBorder }]}>
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              style={[styles.tabItem, active && { borderBottomColor: tint, borderBottomWidth: 2 }]}
            >
              <Ionicons name={tab.icon} size={16} color={active ? tint : muted} />
              <ThemedText style={[styles.tabLabel, { color: active ? tint : muted }]}>{tab.label}</ThemedText>
            </Pressable>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={tint} />
        </View>
      ) : !design ? (
        <View style={[styles.emptyBlock, { borderColor: inputBorder, backgroundColor: card, margin: 16 }]}>
          <ThemedText style={styles.emptyTitle}>Design not found</ThemedText>
        </View>
      ) : (
        <View style={styles.tabContent}>
          {activeTab === 'design' ? renderDesignTab() : null}
          {activeTab === 'measurements' ? renderMeasurementsTab() : null}
          {activeTab === 'tailor' ? renderTailorTab() : null}
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: SURFACE_MUTED },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: { flex: 1, color: '#fff', fontWeight: '700', textAlign: 'center', fontSize: 17 },
  headerSpacer: { width: 84 },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 4,
  },
  tabLabel: { fontSize: 12, fontWeight: '700' },
  tabContent: { flex: 1 },
  tabScroll: { padding: 16, paddingBottom: 32 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  modelCard: {
    borderRadius: UI.radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
    ...UI.softShadow,
  },
  emptyModel: { alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: TEXT_DARK, marginBottom: 10, marginTop: 4 },
  rowCard: {
    borderWidth: 1,
    borderRadius: UI.radius.md,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  rowLabel: { fontSize: 13, flex: 1 },
  rowValue: { fontSize: 14, fontWeight: '700', color: TEXT_DARK, textAlign: 'right', flex: 1 },
  measureGroup: { marginBottom: 8 },
  emptyBlock: {
    borderWidth: 1,
    borderRadius: UI.radius.lg,
    padding: 20,
    alignItems: 'center',
  },
  emptyTitle: { fontWeight: '800', fontSize: 16, color: TEXT_DARK },
  secondaryBtn: {
    marginTop: 8,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    backgroundColor: '#fff',
  },
  secondaryBtnText: { fontWeight: '700', fontSize: 15 },
  primaryBtn: { padding: 14, borderRadius: 12, alignItems: 'center', alignSelf: 'stretch' },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  tailorCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: UI.radius.lg,
    borderWidth: 1,
    marginBottom: 16,
    ...UI.softShadow,
  },
  tailorAvatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tailorAvatarText: { fontSize: 18, fontWeight: '800' },
  tailorName: { fontSize: 16, fontWeight: '800', color: TEXT_DARK },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  chipGold: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    color: '#92400e',
    backgroundColor: '#fef3c7',
  },
  chipBlue: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    color: '#1e40af',
    backgroundColor: '#dbeafe',
  },
});
