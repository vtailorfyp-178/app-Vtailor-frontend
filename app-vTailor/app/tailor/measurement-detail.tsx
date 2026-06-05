import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  ActivityIndicator,
  Pressable,
  Alert,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { MeasurementModelViewer } from '@/components/MeasurementModelViewer';
import { TailorEmptyState, TailorScreenShell } from '@/components/tailor/TailorScreenShell';
import { TAILOR, tailorStyles } from '@/components/tailor/tailorUi';
import {
  markTailorTemplateApproved,
  measurementValuesForModel,
  orderProgressStorageKey,
  resolveTailorOrder,
  type TailorOrderRecord,
} from '@/services/tailor/tailorOrderCatalog';
import { safeLocaleString } from '@/utils/safeDisplay';
import AsyncStorage from '@react-native-async-storage/async-storage';

function MeasurementSection({
  title,
  data,
}: {
  title: string;
  data?: Record<string, string>;
}) {
  if (!data) return null;
  const entries = Object.entries(data).filter(([, v]) => v?.trim());
  if (!entries.length) return null;
  return (
    <View style={tailorStyles.card}>
      <ThemedText style={tailorStyles.sectionTitle}>{title}</ThemedText>
      <View style={styles.grid}>
        {entries.map(([key, value]) => (
          <View key={key} style={styles.cell}>
            <ThemedText style={styles.label}>
              {key === 'phuncha' ? 'Phuncha' : key.charAt(0).toUpperCase() + key.slice(1)}
            </ThemedText>
            <ThemedText style={styles.value}>{value} in</ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
}

function hasAnyMeasurements(order?: TailorOrderRecord): boolean {
  const m = order?.measurements;
  if (!m) return false;
  return [m.basic, m.shirt, m.trouser, m.other].some(
    (group) => group && Object.values(group).some((v) => Boolean(String(v || '').trim())),
  );
}

export default function TailorMeasurementDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const orderId = String(params.orderId || '');
  const designId = String(params.designId || '');
  const customerNameParam = String(params.customerName || '');
  const { width } = useWindowDimensions();
  const viewerW = Math.max(280, width - 64);
  const viewerH = 380;

  const [order, setOrder] = useState<TailorOrderRecord | undefined>();
  const [loading, setLoading] = useState(true);

  const loadOrder = useCallback(async () => {
    if (!orderId && !designId) {
      setOrder(undefined);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const resolved = await resolveTailorOrder(
        orderId,
        designId || undefined,
        customerNameParam || undefined,
      );
      setOrder(resolved);
    } catch {
      setOrder(undefined);
    } finally {
      setLoading(false);
    }
  }, [orderId, designId, customerNameParam]);

  useFocusEffect(
    useCallback(() => {
      void loadOrder();
    }, [loadOrder]),
  );

  const modelValues = useMemo(
    () => measurementValuesForModel(order?.measurements),
    [order?.measurements],
  );

  const proceedToTimeline = async () => {
    try {
      const id = order?.orderId || orderId;
      if (id) {
        await markTailorTemplateApproved(id);
        await AsyncStorage.setItem(orderProgressStorageKey(id), '1');
      }
      router.push({
        pathname: '/tailor/timeline-detail',
        params: { orderId: id },
      });
    } catch {
      Alert.alert('Could not open timeline', 'Please try again.');
    }
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="tailor">
        <TailorScreenShell title="Measurements" onBack={() => router.back()}>
          <ActivityIndicator size="large" color={TAILOR.primary} style={{ marginTop: 40 }} />
          <ThemedText style={styles.loadingText}>Loading customer measurements…</ThemedText>
        </TailorScreenShell>
      </ProtectedRoute>
    );
  }

  if (!order) {
    return (
      <ProtectedRoute requiredRole="tailor">
        <TailorScreenShell title="Measurements" onBack={() => router.back()}>
          <TailorEmptyState
            icon="alert-circle-outline"
            title="Order not found"
            message="This design may not be saved yet. Ask the customer to complete measurements, then open it from 3D Review again."
          />
          <Pressable style={[styles.secondaryBtn, { borderColor: TAILOR.border }]} onPress={() => router.back()}>
            <ThemedText style={[styles.secondaryBtnText, { color: TAILOR.primary }]}>Go back</ThemedText>
          </Pressable>
        </TailorScreenShell>
      </ProtectedRoute>
    );
  }

  if (!hasAnyMeasurements(order)) {
    return (
      <ProtectedRoute requiredRole="tailor">
        <TailorScreenShell
          title={order.customerName}
          subtitle={`${order.orderId} • ${order.garment}`}
          onBack={() => router.back()}
        >
          <TailorEmptyState
            icon="resize-outline"
            title="No measurements yet"
            message={`${order.customerName} has not submitted body measurements for this design.`}
          />
          <Pressable style={[styles.secondaryBtn, { borderColor: TAILOR.border }]} onPress={() => router.back()}>
            <ThemedText style={[styles.secondaryBtnText, { color: TAILOR.primary }]}>Back to 3D review</ThemedText>
          </Pressable>
        </TailorScreenShell>
      </ProtectedRoute>
    );
  }

  const m = order.measurements!;

  return (
    <ProtectedRoute requiredRole="tailor">
      <TailorScreenShell
        title={order.customerName}
        subtitle={`${order.orderId} • ${order.garment}`}
        onBack={() => router.back()}
        contentStyle={{ paddingHorizontal: 0 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={[tailorStyles.card, styles.sidePad]}>
            <ThemedText style={styles.customerName}>{order.customerName}</ThemedText>
            <ThemedText style={styles.meta}>{order.phone}</ThemedText>
            {m.updatedAt ? (
              <ThemedText style={styles.meta}>
                Submitted: {safeLocaleString(m.updatedAt)}
              </ThemedText>
            ) : null}
          </View>

          <View style={[tailorStyles.card, styles.sidePad, styles.viewerWrap]}>
            <ThemedText style={tailorStyles.sectionTitle}>3D Measurement Model</ThemedText>
            <ThemedText style={styles.viewerHint}>
              Labels show the same basic measurements the customer entered on the mannequin.
            </ThemedText>
            <MeasurementModelViewer width={viewerW} height={viewerH} measurementValues={modelValues} />
          </View>

          <View style={styles.sidePad}>
            <MeasurementSection title="Basic Measurements" data={m.basic} />
            <MeasurementSection title="Shirt Measurements" data={m.shirt} />
            <MeasurementSection title="Trouser Measurements" data={m.trouser} />
            {m.other && Object.keys(m.other).length > 0 ? (
              <MeasurementSection title="Other Measurements" data={m.other} />
            ) : null}
          </View>

          <View style={styles.sidePad}>
            <Pressable style={styles.proceedBtn} onPress={proceedToTimeline}>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <ThemedText style={styles.proceedText}>Proceed to stitching timeline</ThemedText>
            </Pressable>
          </View>
        </ScrollView>
      </TailorScreenShell>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 100 },
  sidePad: { marginHorizontal: 16 },
  loadingText: { textAlign: 'center', marginTop: 12, color: TAILOR.textMuted },
  customerName: { fontSize: 18, fontWeight: '800', marginBottom: 4, color: TAILOR.text },
  meta: { fontSize: 12, marginTop: 2, color: TAILOR.textMuted },
  viewerWrap: { overflow: 'hidden' },
  viewerHint: { fontSize: 12, marginBottom: 10, lineHeight: 17, color: TAILOR.textMuted },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  cell: {
    width: '48%',
    marginBottom: 10,
    backgroundColor: TAILOR.soft,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: TAILOR.border,
  },
  label: { fontSize: 11, marginBottom: 4, color: TAILOR.textMuted, fontWeight: '600' },
  value: { fontSize: 15, fontWeight: '800', color: TAILOR.text },
  secondaryBtn: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    backgroundColor: '#fff',
  },
  secondaryBtnText: { fontWeight: '700', fontSize: 15 },
  proceedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  proceedText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
