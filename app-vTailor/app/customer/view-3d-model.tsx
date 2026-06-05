import React, { useMemo, useState } from 'react';
import { View, Pressable, StyleSheet, Image, useWindowDimensions, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/contexts/AuthContext';
import AppBackButton from '@/components/AppBackButton';
import { DressGlbPreview } from '@/components/DressGlbPreview';
import { type TabId } from '@/services/dressGlbResolver';
import { useBundledDressGlb } from '@/hooks/useBundledDressGlb';
import {
  resolveDressFabricColorHex,
} from '@/services/dressFabricColors';
import { persistNewCustomization } from '@/services/persistCustomization';
import { saveCustomizationProgress } from '@/services/customerOrderDraft';
import { resolveCustomizePreviewImage } from '@/services/dressCustomizePreview';
import { with3dPreviewDefaults } from '@/services/glb/threePreviewReadiness';
import { TEXT_DARK } from '@/constants/ui';

const defaultSelections: Record<TabId, string | null> = {
  neck: null,
  sleeves: null,
  bottom: null,
  'frock-style': null,
  colors: null,
  'saree-style': null,
  'fabric-print': null,
};

export default function View3DModelScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { width: screenW, height: screenH } = useWindowDimensions();
  const { userId } = useAuth();
  const tint = useThemeColor({}, 'tint');
  const card = useThemeColor({}, 'card');
  const inputBorder = useThemeColor({}, 'inputBorder');
  const muted = useThemeColor({}, 'muted');

  const modelId = (params.modelId as string) || '';
  const modelName = (params.modelName as string) || 'your dress';
  /** Order timeline: model only. My Customizations: footer edit + measurements CTA. After customize: measurements CTA. */
  const isPreviewOnly =
    (params.fullScreen as string) === '1' || (params.flow as string) === 'preview';
  const isSavedFlow = (params.flow as string) === 'saved';
  const isFinalizeFlow = (params.flow as string) === 'finalize';
  const isModelFocused = isPreviewOnly || isSavedFlow || isFinalizeFlow;

  const headerH = isFinalizeFlow ? insets.top + 52 : isModelFocused ? 48 + insets.top : 52 + insets.top;
  const footerH = isPreviewOnly ? 0 : 96 + insets.bottom;
  const glViewportW = Math.max(280, Math.floor(screenW));
  const glViewportH = Math.max(
    320,
    Math.floor(
      screenH -
        (isFinalizeFlow ? footerH : isPreviewOnly ? headerH : headerH + footerH),
    ),
  );

  const openCustomizeEditor = () => {
    router.push({
      pathname: '/customer/customize3d',
      params: {
        modelId,
        modelName,
        dressLine: (params.dressLine as string) || '',
        selections: JSON.stringify(selections),
      },
    });
  };

  const selections = useMemo(() => {
    try {
      const s = params.selections ? JSON.parse(params.selections as string) : null;
      return s ? { ...defaultSelections, ...(s as Partial<Record<TabId, string | null>>) } : defaultSelections;
    } catch {
      return defaultSelections;
    }
  }, [params.selections]);

  const selectionsFor3d = useMemo(
    () => with3dPreviewDefaults(modelId, selections),
    [modelId, selections],
  );
  const dressGlb = useBundledDressGlb(selectionsFor3d, modelId, true);
  const fabricTextureUrl = selections['fabric-print'];
  const fabricColorHex = resolveDressFabricColorHex(modelId, selectionsFor3d);
  const showGlb3d = dressGlb.url != null;
  const imageSource = useMemo(
    () => resolveCustomizePreviewImage(modelId, selections),
    [modelId, selections],
  );

  const [goingToMeasurements, setGoingToMeasurements] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);

  const goMeasurements = async () => {
    setGoingToMeasurements(true);
    try {
      if (isFinalizeFlow) {
        await persistNewCustomization(userId, modelId, modelName, selections);
      }
      router.push({
        pathname: '/customer/measurements',
        params: { modelId, modelName, selections: JSON.stringify(selections) },
      });
    } finally {
      setGoingToMeasurements(false);
    }
  };

  const saveAndGoDashboard = async () => {
    setSavingDraft(true);
    try {
      await saveCustomizationProgress({
        userId,
        modelId,
        modelName,
        dressLine: (params.dressLine as string) || '',
        selections,
      });
      Alert.alert('Saved', 'Your design is saved. Continue anytime from the dashboard.');
      (router as any).replace('/customer');
    } catch {
      Alert.alert('Save failed', 'Could not save your design. Please try again.');
    } finally {
      setSavingDraft(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      {isFinalizeFlow ? null : (
        <View
          style={[
            styles.header,
            (isPreviewOnly || isSavedFlow) && styles.headerMinimal,
            {
              backgroundColor: isPreviewOnly || isSavedFlow ? card : tint,
              paddingTop: insets.top + 8,
            },
          ]}
        >
          <AppBackButton
            onPress={() => router.back()}
            variant={isPreviewOnly || isSavedFlow ? 'light' : 'tint'}
          />
          {isSavedFlow ? (
            <ThemedText style={[styles.headerTitleDark, { color: TEXT_DARK }]}>{modelName}</ThemedText>
          ) : !isPreviewOnly ? (
            <ThemedText style={styles.headerTitle}>Your 3D design</ThemedText>
          ) : (
            <ThemedText style={[styles.headerTitleDark, { color: TEXT_DARK }]}>3D preview</ThemedText>
          )}
          <View style={styles.headerSpacer} />
        </View>
      )}

      <View
        style={[
          styles.viewerWrap,
          isFinalizeFlow && styles.viewerWrapImmersive,
          { backgroundColor: isFinalizeFlow ? '#0f172a' : card, borderColor: inputBorder },
        ]}
      >
        {isFinalizeFlow ? (
          <View style={[styles.backOverlay, { top: insets.top + 8 }]}>
            <AppBackButton onPress={() => router.back()} variant="light" />
          </View>
        ) : null}
        {showGlb3d && dressGlb.url != null ? (
          <DressGlbPreview
            glbUrl={dressGlb.url}
            width={glViewportW}
            height={glViewportH}
            fabricColorHex={fabricColorHex}
            fabricTextureUrl={fabricTextureUrl}
            backgroundImage={imageSource}
            fallbackImage={imageSource}
            loadError={dressGlb.error}
            framing="presentation"
            modelId={modelId}
            selections={selectionsFor3d}
          />
        ) : imageSource ? (
          <>
            <Image source={imageSource} style={styles.previewImage} resizeMode="contain" />
            <ThemedText
              style={[
                styles.fallbackNote,
                { color: isFinalizeFlow ? 'rgba(255,255,255,0.75)' : muted },
              ]}
            >
              Loading 3D model… showing reference look.
            </ThemedText>
          </>
        ) : (
          <ThemedText style={{ color: isFinalizeFlow ? '#94a3b8' : muted }}>
            3D preview unavailable for this combination.
          </ThemedText>
        )}
      </View>

      {!isPreviewOnly ? (
        <View
          style={[
            styles.footer,
            { borderTopColor: inputBorder, backgroundColor: card, paddingBottom: 16 + insets.bottom },
          ]}
        >
          <Pressable
            onPress={goMeasurements}
            disabled={goingToMeasurements || savingDraft}
            style={[styles.proceed, { backgroundColor: tint, opacity: goingToMeasurements ? 0.75 : 1 }]}
          >
            <ThemedText style={styles.proceedText}>
              {goingToMeasurements ? 'Opening…' : 'Continue to measurements'}
            </ThemedText>
          </Pressable>
          {isSavedFlow ? (
            <Pressable
              onPress={openCustomizeEditor}
              style={[styles.editBtn, { borderColor: inputBorder }]}
              accessibilityRole="button"
              accessibilityLabel="Edit design"
            >
              <ThemedText style={[styles.editBtnText, { color: tint }]}>Edit design</ThemedText>
            </Pressable>
          ) : null}
          {isFinalizeFlow ? (
            <Pressable
              onPress={saveAndGoDashboard}
              disabled={savingDraft || goingToMeasurements}
              style={[styles.saveDashboardBtn, { borderColor: inputBorder, opacity: savingDraft ? 0.75 : 1 }]}
            >
              <ThemedText style={[styles.saveDashboardText, { color: tint }]}>
                {savingDraft ? 'Saving…' : 'Save & back to Dashboard'}
              </ThemedText>
            </Pressable>
          ) : null}
          {isFinalizeFlow ? (
            <Pressable
              onPress={openCustomizeEditor}
              style={[styles.editBtn, { borderColor: inputBorder }]}
            >
              <ThemedText style={[styles.editBtnText, { color: tint }]}>Edit variations</ThemedText>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerMinimal: {
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1d6e2',
  },
  headerSpacer: { width: 84 },
  headerTitle: { flex: 1, color: '#fff', fontWeight: '700', textAlign: 'center', fontSize: 18 },
  headerTitleDark: { flex: 1, fontWeight: '700', textAlign: 'center', fontSize: 16 },
  viewerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    overflow: 'hidden',
  },
  viewerWrapImmersive: {
    borderTopWidth: 0,
    flex: 1,
  },
  backOverlay: {
    position: 'absolute',
    left: 12,
    zIndex: 10,
  },
  previewImage: { width: '100%', height: '100%' },
  fallbackNote: { paddingHorizontal: 16, paddingBottom: 16, fontSize: 13, textAlign: 'center' },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    gap: 10,
  },
  proceed: { padding: 16, borderRadius: 12, alignItems: 'center' },
  proceedText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  saveDashboardBtn: {
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    backgroundColor: '#fff',
  },
  saveDashboardText: { fontWeight: '700', fontSize: 15 },
  editBtn: { padding: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, backgroundColor: '#fff' },
  editBtnText: { fontWeight: '700', fontSize: 15 },
});
