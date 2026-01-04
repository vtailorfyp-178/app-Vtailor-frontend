import React from 'react';
import { View, ScrollView, Pressable, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ProtectedRoute } from '@/components/ProtectedRoute';

const CUSTOMERS_3D = [
  { id: 1, name: 'Ali Hassan', garment: 'Long Frock', date: 'Jan 10' },
  { id: 2, name: 'Zara Khan', garment: 'Lehenga', date: 'Jan 08' },
  { id: 3, name: 'Fatima Bibi', garment: 'Shalwar Kameez', date: 'Jan 05' },
  { id: 4, name: 'Amina Sheikh', garment: 'Bridal Dress', date: 'Jan 03' },
];

export default function Tailor3DReview() {
  const router = useRouter();
  const card = useThemeColor({}, 'card');
  const tint = useThemeColor({}, 'tint');
  const muted = useThemeColor({}, 'muted');
  const bg = useThemeColor({}, 'background');

  return (
    <ProtectedRoute requiredRole="tailor">
      <View style={[styles.container, { backgroundColor: bg }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: tint }]}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#fff" />
          </Pressable>
          <ThemedText style={[styles.headerTitle, { color: '#fff' }]}>3D Customization Review</ThemedText>
          <View style={{ width: 44 }} />
        </View>

        {/* Content */}
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <ThemedText style={styles.subtitle}>Review customer's 3D templates</ThemedText>

          {CUSTOMERS_3D.map((customer) => (
            <Pressable
              key={customer.id}
              style={[styles.card, { backgroundColor: card }]}
              onPress={() =>
                router.push({
                  pathname: '/tailor/3d-view',
                  params: { customerId: customer.id, customerName: customer.name },
                })
              }
            >
              <View style={styles.cardTop}>
                <View style={styles.cardLeft}>
                  <ThemedText style={styles.customerName}>{customer.name}</ThemedText>
                  <ThemedText style={[styles.garment, { color: muted }]}>{customer.garment}</ThemedText>
                </View>
                <View style={[styles.previewBadge, { borderColor: tint }]}> 
                  <ThemedText style={[styles.previewText, { color: tint }]}>Show Preview</ThemedText>
                </View>
              </View>
              <View style={styles.cardBottom}>
                <ThemedText style={[styles.date, { color: muted }]}>📅 {customer.date}</ThemedText>
                <Ionicons name="arrow-forward" size={18} color={tint} />
              </View>
            </Pressable>
          ))}

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
  subtitle: { fontSize: 14, color: '#6b7280', marginBottom: 16 },
  card: { padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardLeft: { flex: 1 },
  customerName: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  garment: { fontSize: 13 },
  previewBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  previewText: { fontSize: 12, fontWeight: '700' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { fontSize: 12 },
  spacer: { height: 40 },
});
