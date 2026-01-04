import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useRouter } from 'expo-router';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import BottomTabBar, { TAB_BAR_HEIGHT } from '@/components/BottomTabBar';

export default function TailorDetails() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const bg = useThemeColor({}, 'background');
  const cardBg = useThemeColor({}, 'card');
  const tint = useThemeColor({}, 'tint');
  const muted = useThemeColor({}, 'muted');

  // Get the source tab (default to orders if not specified)
  const fromTab = typeof params.from === 'string' ? params.from : 'orders';

  // Sample tailor data - in a real app, this would come from params or an API
  const tailorData = {
    id: params.tailorId || 1,
    name: 'Ahmad Tailor',
    phone: '+92 300 1234567',
    email: 'ahmad@tailors.com',
    address: '123 Fashion Street, Karachi',
    rating: 4.8,
    reviews: 128,
    experience: '8 Years',
    specializations: ['Formal Dresses', 'Wedding Attire', 'Traditional'],
    description: 'Expert tailor with 8 years of experience in custom tailoring and alterations. Known for quality work and customer satisfaction.',
    availableOrders: 3,
    deliveryTime: '5-7 days',
  };

  const handleContactTailor = () => {
    router.push(`/customer/chat?tailorId=${tailorData.id}&tailorName=${tailorData.name}`);
  };

  return (
    <ProtectedRoute requiredRole="customer">
      <View style={[styles.container, { backgroundColor: bg, paddingBottom: TAB_BAR_HEIGHT }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: tint }]}>
          <Pressable onPress={() => router.replace(`/customer?tab=${fromTab}`)} style={styles.headerButton}>
            <Ionicons name="chevron-back" size={26} color="#fff" />
          </Pressable>
          <ThemedText style={[styles.headerTitle, { color: '#fff' }]}>Tailor Details</ThemedText>
          <View style={styles.headerButton} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Tailor Profile Card */}
          <View style={[styles.profileCard, { backgroundColor: cardBg }]}>
            <View style={styles.avatarSection}>
              <View style={[styles.avatar, { backgroundColor: tint }]}>
                <Text style={styles.avatarText}>👤</Text>
              </View>
              <View style={styles.profileInfo}>
                <ThemedText style={styles.tailorName}>{tailorData.name}</ThemedText>
                <View style={styles.ratingRow}>
                  <Text style={styles.star}>⭐</Text>
                  <ThemedText style={styles.rating}>{tailorData.rating}</ThemedText>
                  <ThemedText style={[styles.reviews, { color: muted }]}>({tailorData.reviews} reviews)</ThemedText>
                </View>
              </View>
            </View>
          </View>

          {/* Contact Information */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: muted }]}>CONTACT INFORMATION</Text>
            <View style={[styles.infoCard, { backgroundColor: cardBg }]}>
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>📱</Text>
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: muted }]}>Phone</Text>
                  <Text style={styles.infoValue}>{tailorData.phone}</Text>
                </View>
              </View>
              <View style={[styles.divider, { backgroundColor: muted }]} />
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>✉️</Text>
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: muted }]}>Email</Text>
                  <Text style={styles.infoValue}>{tailorData.email}</Text>
                </View>
              </View>
              <View style={[styles.divider, { backgroundColor: muted }]} />
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>📍</Text>
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: muted }]}>Address</Text>
                  <Text style={styles.infoValue}>{tailorData.address}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* About Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: muted }]}>ABOUT</Text>
            <View style={[styles.aboutCard, { backgroundColor: cardBg }]}>
              <ThemedText style={styles.description}>{tailorData.description}</ThemedText>
            </View>
          </View>

          {/* Specializations */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: muted }]}>SPECIALIZATIONS</Text>
            <View style={styles.chipsRow}>
              {tailorData.specializations.map((spec) => (
                <View key={spec} style={[styles.chip, { backgroundColor: tint + '20' }]}>
                  <Text style={[styles.chipText, { color: tint }]}>{spec}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Details Grid */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: muted }]}>DETAILS</Text>
            <View style={styles.detailsGrid}>
              <View style={[styles.detailItem, { backgroundColor: cardBg }]}>
                <Text style={styles.detailIcon}>💼</Text>
                <Text style={[styles.detailValue, { color: tint }]}>{tailorData.experience}</Text>
                <Text style={[styles.detailLabel, { color: muted }]}>Experience</Text>
              </View>
              <View style={[styles.detailItem, { backgroundColor: cardBg }]}>
                <Text style={styles.detailIcon}>📋</Text>
                <Text style={[styles.detailValue, { color: tint }]}>{tailorData.availableOrders}</Text>
                <Text style={[styles.detailLabel, { color: muted }]}>Available Orders</Text>
              </View>
              <View style={[styles.detailItem, { backgroundColor: cardBg }]}>
                <Text style={styles.detailIcon}>⏱️</Text>
                <Text style={[styles.detailValue, { color: tint }]}>{tailorData.deliveryTime}</Text>
                <Text style={[styles.detailLabel, { color: muted }]}>Delivery Time</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonSection}>
            <Pressable
              style={[styles.contactBtn, { borderColor: tint }]}
              onPress={handleContactTailor}
            >
              <Ionicons name="call" size={20} color={tint} />
              <Text style={[styles.contactBtnText, { color: tint }]}>Contact Tailor</Text>
            </Pressable>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>

        <BottomTabBar basePath="customer" />
      </View>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, paddingTop: 40 },
  headerButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '700' },
  content: { padding: 16 },
  profileCard: { padding: 16, borderRadius: 16, marginBottom: 20 },
  avatarSection: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { fontSize: 40 },
  profileInfo: { flex: 1 },
  tailorName: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  star: { marginRight: 4 },
  rating: { fontWeight: '700', marginRight: 4 },
  reviews: { fontSize: 13 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 10, letterSpacing: 0.5 },
  infoCard: { borderRadius: 12, padding: 12, overflow: 'hidden' },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 8 },
  infoIcon: { fontSize: 20, marginRight: 12 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, marginBottom: 2 },
  infoValue: { fontSize: 14, fontWeight: '600' },
  divider: { height: 1, marginVertical: 4, opacity: 0.2 },
  aboutCard: { padding: 14, borderRadius: 12 },
  description: { fontSize: 14, lineHeight: 20 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  chipText: { fontSize: 12, fontWeight: '600' },
  detailsGrid: { flexDirection: 'row', gap: 10 },
  detailItem: { flex: 1, alignItems: 'center', padding: 14, borderRadius: 12 },
  detailIcon: { fontSize: 24, marginBottom: 6 },
  detailValue: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  detailLabel: { fontSize: 11 },
  buttonSection: { gap: 10, marginTop: 10 },
  contactBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 2, paddingVertical: 14, borderRadius: 12, gap: 8 },
  contactBtnText: { fontSize: 16, fontWeight: '700' },
  hireBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, gap: 8 },
  hireBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
