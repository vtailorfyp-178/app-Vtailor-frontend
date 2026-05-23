import React, { useMemo, useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet, Image, useWindowDimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/contexts/AuthContext';
import AppBackButton from '@/components/AppBackButton';
import { DressGlbPreview } from '@/components/DressGlbPreview';
import { type TabId } from '@/services/dressGlbResolver';
import { useBundledDressGlb } from '@/hooks/useBundledDressGlb';
import {
  fabricColorHexFromId,
  usesCasualShortShirtFabricTint,
} from '@/services/dressFabricColors';
import { persistNewCustomization } from '@/services/persistCustomization';
import { resolveCustomizePreviewImage } from '@/services/dressCustomizePreview';
import { with3dPreviewDefaults } from '@/services/glb/threePreviewReadiness';

const defaultSelections: Record<TabId, string | null> = {
  neck: null,
  sleeves: null,
  bottom: null,
  'frock-style': null,
  colors: null,
  'saree-style': null,
};

export default function View3DModelScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { width: screenW } = useWindowDimensions();
  const glViewportW = Math.max(280, Math.floor(screenW - 48));
  const glViewportH = 360;
  const { userId } = useAuth();
  const tint = useThemeColor({}, 'tint');
  const card = useThemeColor({}, 'card');
  const inputBorder = useThemeColor({}, 'inputBorder');
  const muted = useThemeColor({}, 'muted');

  const modelId = (params.modelId as string) || '';
  const modelName = (params.modelName as string) || 'your dress';

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
  const usesFabricTint = usesCasualShortShirtFabricTint(modelId, selections);
  const fabricColorHex = usesFabricTint ? fabricColorHexFromId(selections.colors) : null;
  const showGlb3d = dressGlb.url != null;
  const imageSource = useMemo(
    () => resolveCustomizePreviewImage(modelId, selections),
    [modelId, selections],
  );

  const [goingToMeasurements, setGoingToMeasurements] = useState(false);

  const goMeasurements = async () => {
    setGoingToMeasurements(true);
    try {
      await persistNewCustomization(userId, modelId, modelName, selections);
      router.push({
        pathname: '/customer/measurements',
        params: { modelId, modelName, selections: JSON.stringify(selections) },
      });
    } finally {
      setGoingToMeasurements(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { backgroundColor: tint }]}>
        <AppBackButton onPress={() => router.back()} variant="tint" />
        <ThemedText style={styles.headerTitle}>Your 3D dress</ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <ThemedText style={[styles.lead, { color: muted }]}>
          Review your dress in 3D. When you are happy, continue to enter measurements.
        </ThemedText>

        <View
          style={[
            styles.preview,
            {
              backgroundColor: card,
              borderColor: inputBorder,
              minHeight: showGlb3d ? glViewportH + 16 : 240,
            },
          ]}
        >
          {showGlb3d && dressGlb.url != null ? (
            <DressGlbPreview
              glbUrl={dressGlb.url}
              width={glViewportW}
              height={glViewportH}
              fabricColorHex={fabricColorHex}
              fallbackImage={imageSource}
              loadError={dressGlb.error}
            />
          ) : imageSource ? (
            <>
              <Image source={imageSource} style={styles.previewImage} resizeMode="contain" />
              <ThemedText style={[styles.fallbackNote, { color: muted }]}>
                This combination uses the reference look. You can still continue to measurements below.
              </ThemedText>
            </>
          ) : (
            <ThemedText>3D preview</ThemedText>
          )}
        </View>

        <Pressable
          onPress={goMeasurements}
          disabled={goingToMeasurements}
          style={[styles.proceed, { backgroundColor: tint, opacity: goingToMeasurements ? 0.75 : 1 }]}
        >
          <ThemedText style={styles.proceedText}>
            {goingToMeasurements ? 'Saving…' : 'Continue to measurements'}
          </ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 40, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerSpacer: { width: 84 },
  headerTitle: { flex: 1, color: '#fff', fontWeight: '700', textAlign: 'center' },
  scroll: { padding: 16, paddingBottom: 32 },
  lead: { fontSize: 14, lineHeight: 20, marginBottom: 14 },
  preview: {
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 20,
  },
  previewImage: { width: '100%', height: 240 },
  fallbackNote: { paddingHorizontal: 12, paddingBottom: 12, fontSize: 12, textAlign: 'center' },
  proceed: { padding: 16, borderRadius: 12, alignItems: 'center' },
  proceedText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
