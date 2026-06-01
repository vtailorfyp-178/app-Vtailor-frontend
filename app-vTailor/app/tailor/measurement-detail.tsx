import React, { useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { MeasurementModelViewer } from '@/components/MeasurementModelViewer';
import { TailorScreenShell } from '@/components/tailor/TailorScreenShell';
import { TAILOR, tailorStyles } from '@/components/tailor/tailorUi';
import {
  getOrderById,
  measurementValuesForModel,
  type TailorOrderRecord,
} from '@/services/tailor/tailorOrderCatalog';

function MeasurementSection({
  title,
  data,
}: {
  title: string;
  data: Record<string, string>;
}) {
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

export default function TailorMeasurementDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const orderId = String(params.orderId || '');
  const { width } = useWindowDimensions();
  const viewerW = Math.max(280, width - 64);
  const viewerH = 380;

  const order: TailorOrderRecord | undefined = useMemo(() => getOrderById(orderId), [orderId]);
  const modelValues = useMemo(
    () => measurementValuesForModel(order?.measurements),
    [order?.measurements],
  );

  if (!order) {
    return (
      <ProtectedRoute requiredRole="tailor">
        <TailorScreenShell title="Measurements" onBack={() => router.back()}>
          <ActivityIndicator size="large" color={TAILOR.primary} style={{ marginTop: 40 }} />
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
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={[tailorStyles.card, styles.sidePad]}>
            <ThemedText style={styles.customerName}>{order.customerName}</ThemedText>
            <ThemedText style={styles.meta}>{order.phone}</ThemedText>
            {m.updatedAt ? (
              <ThemedText style={styles.meta}>
                Submitted: {new Date(m.updatedAt).toLocaleString()}
              </ThemedText>
            ) : null}
          </View>

          <View style={[tailorStyles.card, styles.sidePad, styles.viewerWrap]}>
            <ThemedText style={tailorStyles.sectionTitle}>3D Measurement Model</ThemedText>
            <ThemedText style={styles.viewerHint}>
              Labels show the same basic measurements the customer entered on the mannequin.
            </ThemedText>
            <MeasurementModelViewer
              width={viewerW}
              height={viewerH}
              measurementValues={modelValues}
            />
          </View>

          <View style={styles.sidePad}>
            <MeasurementSection title="Basic Measurements" data={m.basic} />
            <MeasurementSection title="Shirt Measurements" data={m.shirt} />
            <MeasurementSection title="Trouser Measurements" data={m.trouser} />
            {m.other && Object.keys(m.other).length > 0 ? (
              <MeasurementSection title="Other Measurements" data={m.other} />
            ) : null}
          </View>
        </ScrollView>
      </TailorScreenShell>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 100 },
  sidePad: { marginHorizontal: 16 },
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
});
