import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function TailorHome() {
  const { user } = useAuth();
  const tint = useThemeColor({}, 'tint');
  const card = useThemeColor({}, 'card');
  const router = useRouter();

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>
      <View style={[styles.header, { backgroundColor: tint }]}> 
        <ThemedText style={styles.welcome}>Welcome back,</ThemedText>
        <ThemedText style={styles.name}>{user?.name || 'Tailor'}</ThemedText>
      </View>

      {/* Order Summary Cards */}
      <View style={styles.summarySection}>
        <View style={[styles.summaryCard, { backgroundColor: '#ecfdf5' }]}>
          <Text style={styles.summaryNumber}>12</Text>
          <Text style={styles.summaryLabel}>Total Orders</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#fef3c7' }]}>
          <Text style={styles.summaryNumber}>5</Text>
          <Text style={styles.summaryLabel}>In Progress</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#dbeafe' }]}>
          <Text style={styles.summaryNumber}>7</Text>
          <Text style={styles.summaryLabel}>Completed</Text>
        </View>
      </View>

      {/* Delivery & Penalty */}
      <View style={styles.section}>
        <Pressable 
          style={[styles.deliveryPenaltyCard, { backgroundColor: card }]}
          onPress={() => router.push('/tailor/customer-delivery-list')}
        >
          <View style={styles.deliveryPenaltyIcon}>
            <Ionicons name="warning-outline" size={28} color="#ef4444" />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.deliveryPenaltyTitle}>Delivery & Penalty</Text>
            <Text style={styles.deliveryPenaltySubtitle}>Track delivery deadlines & penalties</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#9ca3af" />
        </Pressable>
      </View>

      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Current Orders</ThemedText>
        <View style={[styles.card, { backgroundColor: card }]}>
          <ThemedText>Order list placeholder</ThemedText>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 80 },
  header: { paddingTop: 40, padding: 16 },
  welcome: { color: '#fff', opacity: 0.9 },
  name: { color: '#fff', fontWeight: '700', fontSize: 20 },
  summarySection: { 
    flexDirection: 'row', 
    paddingHorizontal: 16, 
    paddingTop: 16, 
    gap: 12 
  },
  summaryCard: { 
    flex: 1, 
    padding: 16, 
    borderRadius: 12, 
    alignItems: 'center' 
  },
  summaryNumber: { 
    fontSize: 28, 
    fontWeight: '800', 
    color: '#111827', 
    marginBottom: 4 
  },
  summaryLabel: { 
    fontSize: 12, 
    color: '#6b7280', 
    fontWeight: '600' 
  },
  section: { padding: 16 },
  sectionTitle: { fontWeight: '700', marginBottom: 8 },
  card: { padding: 12, borderRadius: 12 },
  deliveryPenaltyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fee2e2',
    backgroundColor: '#fef2f2',
  },
  deliveryPenaltyIcon: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deliveryPenaltyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  deliveryPenaltySubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
});
