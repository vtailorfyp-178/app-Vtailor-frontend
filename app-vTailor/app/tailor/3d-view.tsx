import React, { useMemo } from 'react';
import { View, ScrollView, Pressable, StyleSheet, Image, useWindowDimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { TraditionalDressGlbViewer } from '@/components/TraditionalDressGlbViewer';
import { resolveBundledDressGlb, type TabId } from '@/services/dressGlbResolver';

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
};

function mergeSelections(raw: unknown): Record<TabId, string | null> | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, string | null>;
  return { ...defaultSelections, ...o };
}

function selectionLines(sel: Record<TabId, string | null>): string[] {
  const labels: Partial<Record<TabId, string>> = {
    neck: 'Neck',
    sleeves: 'Sleeves',
    bottom: 'Bottom',
    'frock-style': 'Frock style',
    colors: 'Color',
  };
  const lines: string[] = [];
  (Object.keys(labels) as TabId[]).forEach((k) => {
    const v = sel[k];
    if (v) lines.push(`${labels[k]}: ${v}`);
  });
  return lines.length ? lines : ['(No variation details)'];
}

export default function Tailor3DView() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { width: screenW } = useWindowDimensions();
  const glViewportW = Math.max(280, Math.floor(screenW - 32));
  const glViewportH = 340;

  const customerId = parseInt(String(params.customerId || ''), 10) || 1;
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
  const glbModule = hasCustomerDesign ? resolveBundledDressGlb(parsedSelections!, modelIdParam) : null;

  const template = MOCK_3D_TEMPLATES[customerId];
  const tint = useThemeColor({}, 'tint');
  const card = useThemeColor({}, 'card');
  const bg = useThemeColor({}, 'background');
  const muted = useThemeColor({}, 'muted');

  const displayName = hasCustomerDesign ? customerNameParam || 'Customer' : template?.customerName || customerNameParam;
  const garmentLabel = hasCustomerDesign ? modelNameParam || modelIdParam : template?.garment;

  const handleApprove = () => {
    router.push('/tailor/measurements');
  };

  const handleRequestChanges = () => {
    router.push({ pathname: '/tailor/chat/[id]', params: { id: String(customerId), returnTo: '/tailor' } });
  };

  if (!hasCustomerDesign && !template) {
    return (
      <ProtectedRoute requiredRole="tailor">
        <View style={[styles.container, { backgroundColor: bg }]}>
          <View style={[styles.header, { backgroundColor: tint }]}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={28} color="#fff" />
            </Pressable>
            <ThemedText style={[styles.headerTitle, { color: '#fff' }]}>View Not Found</ThemedText>
            <View style={{ width: 44 }} />
          </View>
          <ScrollView contentContainerStyle={styles.content}>
            <ThemedText style={{ color: muted, padding: 16 }}>
              No 3D template for this customer. Open 3D Customization Review to pick a saved design, or ensure the order includes design details.
            </ThemedText>
          </ScrollView>
        </View>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="tailor">
      <View style={[styles.container, { backgroundColor: bg }]}>
        <View style={[styles.header, { backgroundColor: tint }]}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#fff" />
          </Pressable>
          <ThemedText style={[styles.headerTitle, { color: '#fff' }]}>3D Template</ThemedText>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.infoCard, { backgroundColor: card }]}>
            <ThemedText style={styles.customerNameLarge}>{displayName}</ThemedText>
            <View style={styles.infoRow}>
              <ThemedText style={[styles.label, { color: muted }]}>Garment:</ThemedText>
              <ThemedText style={styles.value}>{garmentLabel}</ThemedText>
            </View>
            {hasCustomerDesign ? (
              <View style={styles.infoRow}>
                <ThemedText style={[styles.label, { color: muted }]}>Source:</ThemedText>
                <ThemedText style={styles.value}>Customer 3D design</ThemedText>
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

          <View style={[styles.templateSection, { backgroundColor: card }]}>
            <ThemedText style={styles.sectionTitle}>3D Customized Template</ThemedText>
            {hasCustomerDesign && glbModule != null ? (
              <TraditionalDressGlbViewer
                key={`${modelIdParam}-${glbModule}`}
                glbModule={glbModule}
                width={glViewportW}
                height={glViewportH}
              />
            ) : hasCustomerDesign && glbModule == null ? (
              <View style={[styles.fallbackBox, { borderColor: '#e5e7eb' }]}>
                <ThemedText style={{ color: muted, textAlign: 'center', padding: 12 }}>
                  This dress combo has no bundled 3D file yet; variations are still listed below.
                </ThemedText>
              </View>
            ) : (
              <Image source={{ uri: template.templateUrl }} style={styles.templateImage} resizeMode="cover" />
            )}
          </View>

          <View style={[styles.customizationsSection, { backgroundColor: card }]}>
            <ThemedText style={styles.sectionTitle}>Customizations Applied</ThemedText>
            {hasCustomerDesign ? (
              selectionLines(parsedSelections!).map((line, idx) => (
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

          <View style={styles.actionsSection}>
            <Pressable style={[styles.approveButton, { backgroundColor: '#10b981' }]} onPress={handleApprove}>
              <Ionicons name="checkmark" size={20} color="#fff" />
              <ThemedText style={styles.buttonText}>Approve Template</ThemedText>
            </Pressable>
            <Pressable style={[styles.rejectButton, { borderColor: '#ef4444' }]} onPress={handleRequestChanges}>
              <Ionicons name="close" size={20} color="#ef4444" />
              <ThemedText style={[styles.buttonText, { color: '#ef4444' }]}>Request Changes</ThemedText>
            </Pressable>
          </View>

          <View style={styles.spacer} />
        </ScrollView>
      </View>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, paddingTop: 40 },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '700' },
  content: { padding: 16, paddingBottom: 100 },
  infoCard: { padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#e5e7eb' },
  customerNameLarge: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '600' },
  value: { fontSize: 13, fontWeight: '700' },
  templateSection: { marginBottom: 16, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#e5e7eb' },
  sectionTitle: { fontSize: 16, fontWeight: '700', padding: 16, paddingBottom: 12 },
  templateImage: { width: '100%', height: 300, backgroundColor: '#f3f4f6' },
  fallbackBox: { marginHorizontal: 12, marginBottom: 12, borderRadius: 12, borderWidth: 1 },
  customizationsSection: { padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#e5e7eb' },
  customizationItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  customizationText: { fontSize: 13, fontWeight: '500' },
  actionsSection: { gap: 10 },
  approveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, gap: 8 },
  rejectButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, borderWidth: 2 },
  buttonText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  spacer: { height: 40 },
});
