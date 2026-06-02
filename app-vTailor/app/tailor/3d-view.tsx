import React, { useMemo } from 'react';
import { View, ScrollView, Pressable, StyleSheet, Image, useWindowDimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DressGlbPreview } from '@/components/DressGlbPreview';
import { TailorScreenShell } from '@/components/tailor/TailorScreenShell';
import { TAILOR, tailorStyles } from '@/components/tailor/tailorUi';
import {
  fabricColorHexFromId,
  usesCasualShortShirtFabricTint,
} from '@/services/dressFabricColors';
import { type TabId } from '@/services/dressGlbResolver';
import { useBundledDressGlb } from '@/hooks/useBundledDressGlb';
import { with3dPreviewDefaults } from '@/services/glb/threePreviewReadiness';
import {
  formatSelectionLines,
  getOrderById,
} from '@/services/tailor/tailorOrderCatalog';

const MOCK_3D_TEMPLATES: Record<number, any> = {
  1: {
    customerName: 'Ali Hassan',
    garment: 'Long Frock',
    color: 'Maroon',
    fabric: 'Silk',
    customizations: ['Embroidery added', 'Neckline modified', 'Sleeves adjusted'],
    templateUrl: 'https://via.placeholder.com/400x300/8B0000/FFFFFF?text=Long+Frock+3D',
  },
  2: {
    customerName: 'Zara Khan',
    garment: 'Lehenga',
    color: 'Red & Gold',
    fabric: 'Net',
    customizations: ['Heavy embroidery', 'Dupatta customized', 'Waist fitted'],
    templateUrl: 'https://via.placeholder.com/400x300/DC143C/FFFFFF?text=Lehenga+3D',
  },
  3: {
    customerName: 'Fatima Bibi',
    garment: 'Shalwar Kameez',
    color: 'Turquoise',
    fabric: 'Lawn',
    customizations: ['Printed design', 'Trouser length adjusted'],
    templateUrl: 'https://via.placeholder.com/400x300/40E0D0/FFFFFF?text=Shalwar+Kameez+3D',
  },
  4: {
    customerName: 'Amina Sheikh',
    garment: 'Bridal Dress',
    color: 'White',
    fabric: 'Tulle',
    customizations: ['Full embroidery', 'Train design', 'Veil matching'],
    templateUrl: 'https://via.placeholder.com/400x300/FFFFFF/000000?text=Bridal+Dress+3D',
  },
  5: {
    customerName: 'Usman Tariq',
    garment: 'Sharara',
    color: 'Navy Blue',
    fabric: 'Chiffon',
    customizations: ['Beaded neckline', 'Tapered sleeves', 'Custom hem length'],
    templateUrl: 'https://via.placeholder.com/400x300/191970/FFFFFF?text=Sharara+3D',
  },
};

const defaultSelections: Record<TabId, string | null> = {
  neck: null,
  sleeves: null,
  bottom: null,
  'frock-style': null,
  colors: null,
  'saree-style': null,
  'fabric-print': null,
};

function mergeSelections(raw: unknown): Record<TabId, string | null> | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, string | null>;
  return { ...defaultSelections, ...o };
}

export default function Tailor3DView() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { width: screenW } = useWindowDimensions();
  const glViewportW = Math.max(280, Math.floor(screenW - 32));
  const glViewportH = 340;

  const orderIdParam = (params.orderId as string) || '';
  const customerId = String(params.customerId || '1');
  const customerNameParam = (params.customerName as string) || '';
  const modelIdParam = (params.modelId as string) || '';
  const modelNameParam = (params.modelName as string) || '';

  const parsedSelections = useMemo(() => {
    try {
      const raw = params.selections as string | undefined;
      if (!raw || !raw.trim()) return null;
      return mergeSelections(JSON.parse(raw));
    } catch {
      return null;
    }
  }, [params.selections]);

  const hasCustomerDesign = Boolean(modelIdParam && parsedSelections);
  const selectionsFor3d = useMemo(() => {
    const base = parsedSelections ?? defaultSelections;
    if (!hasCustomerDesign || !modelIdParam) return base;
    return with3dPreviewDefaults(modelIdParam, base);
  }, [hasCustomerDesign, modelIdParam, parsedSelections]);
  const dressGlb = useBundledDressGlb(selectionsFor3d, hasCustomerDesign ? modelIdParam : '');

  const customerFabricHex =
    hasCustomerDesign && parsedSelections
      ? usesCasualShortShirtFabricTint(modelIdParam, parsedSelections)
        ? fabricColorHexFromId(parsedSelections.colors)
        : null
      : null;

  const orderFromCatalog = orderIdParam ? getOrderById(orderIdParam) : undefined;
  const template = MOCK_3D_TEMPLATES[parseInt(customerId, 10) || 1];
  const muted = useThemeColor({}, 'muted');

  const displayName =
    orderFromCatalog?.customerName ||
    (hasCustomerDesign ? customerNameParam || 'Customer' : template?.customerName || customerNameParam);
  const garmentLabel =
    orderFromCatalog?.garment ||
    (hasCustomerDesign ? modelNameParam || modelIdParam : template?.garment);

  const handleApprove = () => {
    router.push({
      pathname: '/tailor/measurement-detail',
      params: { orderId: orderIdParam || orderFromCatalog?.orderId || 'ORD001' },
    });
  };

  const handleRequestChanges = () => {
    router.push({
      pathname: '/tailor/chat/[id]',
      params: { id: customerId, returnTo: '/tailor/3d-review' },
    });
  };

  if (!hasCustomerDesign && !template) {
    return (
      <ProtectedRoute requiredRole="tailor">
        <TailorScreenShell title="View Not Found" onBack={() => router.back()}>
          <ThemedText style={{ color: muted, lineHeight: 20 }}>
            No 3D template for this customer. Open 3D Customization Review to pick a saved design.
          </ThemedText>
        </TailorScreenShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="tailor">
      <TailorScreenShell
        title="3D Template"
        subtitle={displayName}
        onBack={() => router.back()}
        contentStyle={{ paddingHorizontal: 0 }}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[tailorStyles.card, styles.sidePad]}>
            <ThemedText style={styles.customerNameLarge}>{displayName}</ThemedText>
            {orderFromCatalog ? (
              <ThemedText style={[styles.orderMeta, { color: muted }]}>
                {orderFromCatalog.orderId} • {orderFromCatalog.phone}
              </ThemedText>
            ) : null}
            <View style={styles.infoRow}>
              <ThemedText style={[styles.label, { color: muted }]}>Garment:</ThemedText>
              <ThemedText style={styles.value}>{garmentLabel}</ThemedText>
            </View>
            {orderFromCatalog?.color ? (
              <View style={styles.infoRow}>
                <ThemedText style={[styles.label, { color: muted }]}>Color / Fabric:</ThemedText>
                <ThemedText style={styles.value}>
                  {orderFromCatalog.color}
                  {orderFromCatalog.fabric ? ` • ${orderFromCatalog.fabric}` : ''}
                </ThemedText>
              </View>
            ) : null}
            {hasCustomerDesign ? (
              <View style={styles.infoRow}>
                <ThemedText style={[styles.label, { color: muted }]}>Source:</ThemedText>
                <ThemedText style={styles.value}>Customer 3D order design</ThemedText>
              </View>
            ) : (
              <>
                <View style={styles.infoRow}>
                  <ThemedText style={[styles.label, { color: muted }]}>Color:</ThemedText>
                  <ThemedText style={styles.value}>{template.color}</ThemedText>
                </View>
                <View style={styles.infoRow}>
                  <ThemedText style={[styles.label, { color: muted }]}>Fabric:</ThemedText>
                  <ThemedText style={styles.value}>{template.fabric}</ThemedText>
                </View>
              </>
            )}
          </View>

          <View style={[tailorStyles.card, styles.sidePad]}>
            <ThemedText style={styles.sectionTitle}>3D Customized Template</ThemedText>
            {hasCustomerDesign && dressGlb.url != null ? (
              <DressGlbPreview
                key={`${modelIdParam}-${dressGlb.url}`}
                glbUrl={dressGlb.url}
                width={glViewportW}
                height={glViewportH}
                fabricColorHex={customerFabricHex}
              />
            ) : hasCustomerDesign && (dressGlb.loading || dressGlb.url == null) ? (
              <View style={[styles.fallbackBox, { borderColor: '#e5e7eb' }]}>
                <ThemedText style={{ color: muted, textAlign: 'center', padding: 12 }}>
                  This dress combo has no bundled 3D file yet; variations are still listed below.
                </ThemedText>
              </View>
            ) : (
              <Image source={{ uri: template.templateUrl }} style={styles.templateImage} resizeMode="cover" />
            )}
          </View>

          <View style={[tailorStyles.card, styles.sidePad]}>
            <ThemedText style={styles.sectionTitle}>Customizations Applied</ThemedText>
            {hasCustomerDesign ? (
              formatSelectionLines(parsedSelections!).map((line, idx) => (
                <View key={idx} style={styles.customizationItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                  <ThemedText style={[styles.customizationText, { marginLeft: 10 }]}>{line}</ThemedText>
                </View>
              ))
            ) : (
              template.customizations.map((customization: string, idx: number) => (
                <View key={idx} style={styles.customizationItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                  <ThemedText style={[styles.customizationText, { marginLeft: 10 }]}>{customization}</ThemedText>
                </View>
              ))
            )}
          </View>

          <View style={[styles.actionsSection, styles.sidePad]}>
            <Pressable style={styles.approveButton} onPress={handleApprove}>
              <Ionicons name="checkmark" size={20} color="#fff" />
              <ThemedText style={styles.buttonText}>Approve Template</ThemedText>
            </Pressable>
            <Pressable style={styles.rejectButton} onPress={handleRequestChanges}>
              <Ionicons name="close" size={20} color="#ef4444" />
              <ThemedText style={[styles.buttonText, { color: '#ef4444' }]}>Request Changes</ThemedText>
            </Pressable>
          </View>

          <View style={styles.spacer} />
        </ScrollView>
      </TailorScreenShell>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  sidePad: { marginHorizontal: 16 },
  content: { paddingBottom: 100 },
  customerNameLarge: { fontSize: 18, fontWeight: '800', marginBottom: 4, color: TAILOR.text },
  orderMeta: { fontSize: 12, marginBottom: 10, color: TAILOR.textMuted },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '600', color: TAILOR.textMuted },
  value: { fontSize: 13, fontWeight: '700', color: TAILOR.text },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 12, color: TAILOR.text },
  templateImage: { width: '100%', height: 300, backgroundColor: '#f3f4f6', borderRadius: 14 },
  fallbackBox: { marginBottom: 4, borderRadius: 12, borderWidth: 1, borderColor: TAILOR.border },
  customizationItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  customizationText: { fontSize: 13, fontWeight: '600', color: TAILOR.text },
  actionsSection: { gap: 10, marginTop: 4 },
  approveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    backgroundColor: '#10b981',
  },
  rejectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#ef4444',
    backgroundColor: '#fff',
    gap: 8,
  },
  buttonText: { fontSize: 14, fontWeight: '800', color: '#fff' },
  spacer: { height: 40 },
});
