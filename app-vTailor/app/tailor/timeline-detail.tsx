import { ProtectedRoute } from '@/components/ProtectedRoute';
import AppBackButton from '@/components/AppBackButton';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  getOrderById,
  orderProgressStorageKey,
  type TailorOrderRecord,
} from '@/services/tailor/tailorOrderCatalog';
import { ROLE_COLORS, SURFACE_MUTED } from '@/constants/ui';

const STEPS = [
  'Order Accepted',
  'Cutting In Progress',
  'Cutting Completed',
  'Stitching In Progress',
  'Stitching Completed',
  'Detailing In Progress',
  'Dress Completed',
];

export default function TailorTimelineDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const orderId = String(params.orderId || 'ORD-001');
  const order: TailorOrderRecord | undefined = useMemo(() => getOrderById(orderId), [orderId]);

  const [currentStep, setCurrentStep] = useState(0);
  const storageKey = orderProgressStorageKey(orderId);

  const loadProgress = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem(storageKey);
      if (saved != null) setCurrentStep(parseInt(saved, 10));
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  useEffect(() => {
    void loadProgress();
  }, [loadProgress]);

  useFocusEffect(
    useCallback(() => {
      void loadProgress();
    }, [loadProgress]),
  );

  useEffect(() => {
    if (currentStep > 0) {
      void AsyncStorage.setItem(storageKey, String(currentStep));
    }
  }, [currentStep, storageKey]);

  const updateNextStep = () => {
    if (currentStep < STEPS.length - 1) {
      const next = currentStep + 1;
      setCurrentStep(next);
      Alert.alert('Progress Updated', `Step: ${STEPS[next]}`);
    } else {
      router.back();
    }
  };

  if (!order) {
    return (
      <ProtectedRoute requiredRole="tailor">
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.headerContainer}>
            <AppBackButton onPress={() => router.back()} variant="tint" />
            <Text style={styles.header}>Order not found</Text>
          </View>
        </SafeAreaView>
      </ProtectedRoute>
    );
  }

  const m = order.measurements;

  return (
    <ProtectedRoute requiredRole="tailor">
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.headerContainer}>
            <AppBackButton onPress={() => router.back()} variant="tint" />
            <View style={styles.headerContent}>
              <Text style={styles.header}>{order.customerName}</Text>
              <Text style={styles.subheader}>{order.orderId} • Stitching timeline</Text>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <View style={styles.customerCard}>
              <View style={styles.customerHeader}>
                <View style={styles.customerAvatar}>
                  <Ionicons name="person" size={32} color="#fff" />
                </View>
                <View style={styles.customerInfo}>
                  <Text style={styles.customerName}>{order.customerName}</Text>
                  <Text style={styles.customerPhone}>{order.phone}</Text>
                </View>
              </View>

              <View style={styles.orderDetailsSection}>
                <Text style={styles.sectionTitle}>Order Details</Text>
                <DetailRow label="Order ID" value={order.orderId} />
                <DetailRow label="Dress" value={order.garment} />
                <DetailRow label="Color" value={order.color ?? '—'} />
                <DetailRow label="Fabric" value={order.fabric ?? '—'} />
                <DetailRow label="Delivery" value={order.deliveryLabel} />
                <DetailRow label="Amount" value={`Rs ${order.amount.toLocaleString()}`} />
                {order.notes ? <DetailRow label="Notes" value={order.notes} /> : null}
              </View>

              {m ? (
                <View style={styles.measurementsSection}>
                  <Text style={styles.sectionTitle}>Key Measurements</Text>
                  <View style={styles.measurementGrid}>
                    <MeasureCell label="Bust" value={m.basic.bust} />
                    <MeasureCell label="Waist" value={m.basic.waist} />
                    <MeasureCell label="Shoulder" value={m.basic.shoulder} />
                  </View>
                </View>
              ) : null}
            </View>

            <View style={styles.timelineSection}>
              <Text style={styles.sectionTitle}>Progress Timeline</Text>
              <FlatList
                data={STEPS}
                keyExtractor={(_, index) => String(index)}
                scrollEnabled={false}
                renderItem={({ item, index }) => {
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
                          {completed ? <Ionicons name="checkmark" size={16} color="#fff" /> : null}
                        </View>
                        {index !== STEPS.length - 1 ? <View style={styles.line} /> : null}
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
                        {active ? <Text style={styles.sub}>Currently in progress</Text> : null}
                        {completed ? <Text style={styles.subCompleted}>Completed</Text> : null}
                      </View>
                    </View>
                  );
                }}
              />
            </View>
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.backActionButton} onPress={() => router.back()}>
              <Text style={styles.backActionButtonText}>← All orders</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, currentStep === STEPS.length - 1 && styles.buttonCompleted]}
              onPress={updateNextStep}
            >
              <Text style={styles.buttonText}>
                {currentStep === STEPS.length - 1 ? 'Order completed — back' : 'Mark next step complete'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </ProtectedRoute>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}:</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function MeasureCell({ label, value }: { label: string; value?: string }) {
  return (
    <View style={styles.measurementItem}>
      <Text style={styles.measurementLabel}>{label}</Text>
      <Text style={styles.measurementValue}>{value ? `${value} in` : '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: SURFACE_MUTED },
  container: { flex: 1, backgroundColor: '#fff' },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 18,
    backgroundColor: ROLE_COLORS.tailor.primary,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerContent: { flex: 1 },
  header: { fontSize: 20, fontWeight: '800', color: '#fff' },
  subheader: { fontSize: 13, color: 'rgba(255,255,255,0.88)', marginTop: 2 },
  scrollContent: { padding: 16 },
  customerCard: {
    backgroundColor: ROLE_COLORS.tailor.soft,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: ROLE_COLORS.tailor.border,
  },
  customerHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  customerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: ROLE_COLORS.tailor.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  customerInfo: { flex: 1 },
  customerName: { fontSize: 18, fontWeight: '700', color: '#111827' },
  customerPhone: { fontSize: 14, color: '#6b7280', marginTop: 2 },
  orderDetailsSection: {
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#d1d5db',
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 12 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  detailLabel: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  detailValue: { fontSize: 13, color: '#111827', fontWeight: '600', flex: 1, textAlign: 'right', marginLeft: 8 },
  measurementsSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#d1d5db',
  },
  measurementGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  measurementItem: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  measurementLabel: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  measurementValue: { fontSize: 13, fontWeight: '700', color: ROLE_COLORS.tailor.primaryDark },
  timelineSection: { marginTop: 8 },
  row: { flexDirection: 'row', marginBottom: 24 },
  left: { width: 40, alignItems: 'center' },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#d1d5db',
  },
  completed: { backgroundColor: '#10b981', borderColor: '#059669' },
  active: { backgroundColor: ROLE_COLORS.tailor.primary, borderColor: ROLE_COLORS.tailor.primaryDark },
  line: { width: 3, flex: 1, backgroundColor: '#e5e7eb', marginTop: 6 },
  right: { flex: 1, marginLeft: 16, paddingTop: 2 },
  title: { fontSize: 15, color: '#6b7280', fontWeight: '500' },
  completedText: { color: '#10b981', fontWeight: '600' },
  activeText: { color: ROLE_COLORS.tailor.primaryDark, fontWeight: '700', fontSize: 16 },
  sub: { fontSize: 12, color: ROLE_COLORS.tailor.primary, marginTop: 4, fontWeight: '500' },
  subCompleted: { fontSize: 12, color: '#10b981', marginTop: 4 },
  buttonContainer: {
    padding: 16,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 10,
  },
  backActionButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: ROLE_COLORS.tailor.primary,
    borderRadius: 14,
    alignItems: 'center',
  },
  backActionButtonText: { color: ROLE_COLORS.tailor.primaryDark, fontSize: 16, fontWeight: '700' },
  button: {
    backgroundColor: ROLE_COLORS.tailor.primaryDark,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonCompleted: { backgroundColor: '#10b981' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
