import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useRouter } from 'expo-router';
import { Ionicons } from "@expo/vector-icons";

interface CustomerMeasurement {
  id: string;
  customerName: string;
  orderId: string;
  dressType: string;
  submittedDate: string;
  shirt: {
    arm?: string;
    chest?: string;
    neck?: string;
    length?: string;
    shoulder?: string;
    waist?: string;
  };
  trouser: {
    waist?: string;
    length?: string;
    phuncha?: string;
  };
}

// Sample customer measurements data
const SAMPLE_MEASUREMENTS: CustomerMeasurement[] = [
  {
    id: 'M-001',
    customerName: 'Fatima Khan',
    orderId: 'ORD-001',
    dressType: 'Long Frock',
    submittedDate: '02 Jan 2026',
    shirt: {
      arm: '32',
      chest: '38',
      neck: '16',
      length: '28',
      shoulder: '14',
      waist: '32',
    },
    trouser: {
      waist: '32',
      length: '30',
      phuncha: '14',
    },
  },
  {
    id: 'M-002',
    customerName: 'Aisha Ahmed',
    orderId: 'ORD-002',
    dressType: 'Shalwar Kameez',
    submittedDate: '31 Dec 2025',
    shirt: {
      arm: '30',
      chest: '36',
      neck: '15.5',
      length: '26',
      shoulder: '13',
      waist: '30',
    },
    trouser: {
      waist: '30',
      length: '28',
      phuncha: '13',
    },
  },
  {
    id: 'M-003',
    customerName: 'Zara Ali',
    orderId: 'ORD-003',
    dressType: 'Kurti',
    submittedDate: '30 Dec 2025',
    shirt: {
      arm: '31',
      chest: '37',
      neck: '15.5',
      length: '27',
      shoulder: '13.5',
      waist: '31',
    },
    trouser: {
      waist: '31',
      length: '29',
      phuncha: '13.5',
    },
  },
];

export default function TailorMeasurements() {
  const router = useRouter();
  const tint = useThemeColor({}, 'tint');
  const card = useThemeColor({}, 'card');
  const inputBorder = useThemeColor({}, 'inputBorder');
  const muted = useThemeColor({}, 'muted');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <ProtectedRoute requiredRole="tailor">
      <ThemedView style={styles.container}>
        <View style={[styles.header, { backgroundColor: tint }]}>
          <Pressable onPress={() => (router as any).back()}>
            <ThemedText style={{ color: '#fff' }}>{'< Back'}</ThemedText>
          </Pressable>
          <ThemedText style={styles.headerTitle}>Customer Measurements</ThemedText>
          <View style={{ width: 56 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          {SAMPLE_MEASUREMENTS.map((measurement) => (
            <Pressable
              key={measurement.id}
              onPress={() => setExpandedId(expandedId === measurement.id ? null : measurement.id)}
              style={[styles.card, { backgroundColor: card, borderColor: inputBorder }]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.customerInfo}>
                  <ThemedText style={styles.customerName}>{measurement.customerName}</ThemedText>
                  <ThemedText style={[styles.small, { color: muted }]}>{measurement.dressType} • {measurement.orderId}</ThemedText>
                  <ThemedText style={[styles.small, { color: muted }]}>Submitted: {measurement.submittedDate}</ThemedText>
                </View>
                <Ionicons
                  name={expandedId === measurement.id ? 'chevron-up' : 'chevron-down'}
                  size={24}
                  color={tint}
                />
              </View>

              {expandedId === measurement.id && (
                <View style={[styles.expandedContent, { borderTopColor: inputBorder }]}>
                  <View style={styles.sectionGroup}>
                    <ThemedText style={styles.sectionTitle}>👕 Shirt Measurements (inches)</ThemedText>
                    <View style={styles.measurementGrid}>
                      {Object.entries(measurement.shirt).map(([key, value]) => (
                        <View key={key} style={styles.measurementItem}>
                          <ThemedText style={[styles.label, { color: muted }]}>
                            {key.charAt(0).toUpperCase() + key.slice(1)}
                          </ThemedText>
                          <ThemedText style={styles.value}>{value || '--'}</ThemedText>
                        </View>
                      ))}
                    </View>
                  </View>

                  <View style={styles.sectionGroup}>
                    <ThemedText style={styles.sectionTitle}>🩳 Trouser Measurements (inches)</ThemedText>
                    <View style={styles.measurementGrid}>
                      {Object.entries(measurement.trouser).map(([key, value]) => (
                        <View key={key} style={styles.measurementItem}>
                          <ThemedText style={[styles.label, { color: muted }]}>
                            {key === 'phuncha' ? 'Phuncha' : key.charAt(0).toUpperCase() + key.slice(1)}
                          </ThemedText>
                          <ThemedText style={styles.value}>{value || '--'}</ThemedText>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              )}
            </Pressable>
          ))}
        </ScrollView>
      </ThemedView>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 40,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { color: '#fff', fontWeight: '700', fontSize: 16 },
  scroll: { padding: 12 },
  card: {
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  customerInfo: { flex: 1 },
  customerName: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  small: { fontSize: 12, marginTop: 2 },
  expandedContent: {
    padding: 14,
    borderTopWidth: 1,
  },
  sectionGroup: { marginBottom: 14 },
  sectionTitle: { fontSize: 14, fontWeight: '600', marginBottom: 10 },
  measurementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  measurementItem: {
    width: '48%',
    paddingVertical: 8,
  },
  label: { fontSize: 12, marginBottom: 4 },
  value: { fontSize: 14, fontWeight: '600' },
});
