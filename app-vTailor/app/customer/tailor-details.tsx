import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Linking } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useRouter } from 'expo-router';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import AppBackButton from '@/components/AppBackButton';
import { useAuth } from '@/contexts/AuthContext';

type TailorDetailsData = {
  id: string | number;
  name: string;
  phone: string;
  email: string;
  address: string;
  experience: string;
  specializations: string[];
  description: string;
  avatar?: string;
};

const DEFAULT_TAILOR_DETAILS: TailorDetailsData = {
  id: 1,
  name: 'Ahmad Tailor',
  phone: '+92 300 1234567',
  email: 'ahmad@tailors.com',
  address: '123 Fashion Street, Karachi',
  experience: '8 Years',
  specializations: ['Formal Dresses', 'Wedding Attire', 'Traditional'],
  description:
    'Expert tailor with 8 years of experience in custom tailoring and alterations. Known for quality work and customer satisfaction.',
  avatar: '',
};

function splitSpecializations(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === 'string' && value.trim()) {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

export default function TailorDetails() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { tailorProfile } = useAuth();
  const bg = useThemeColor({}, 'background');
  const cardBg = useThemeColor({}, 'card');
  const tint = useThemeColor({}, 'tint');
  const muted = useThemeColor({}, 'muted');

  // Get the source tab (default to orders if not specified)
  const fromTab = typeof params.from === 'string' ? params.from : 'orders';

  const routeTailorData: Partial<TailorDetailsData> = {
    id: params.tailorId || undefined,
    name: typeof params.tailorName === 'string' ? params.tailorName : undefined,
    phone: typeof params.tailorPhone === 'string' ? params.tailorPhone : undefined,
    email: typeof params.tailorEmail === 'string' ? params.tailorEmail : undefined,
    address: typeof params.tailorAddress === 'string' ? params.tailorAddress : undefined,
    experience: typeof params.tailorExperience === 'string' ? params.tailorExperience : undefined,
    description: typeof params.tailorDescription === 'string' ? params.tailorDescription : undefined,
    avatar: typeof params.tailorAvatar === 'string' ? params.tailorAvatar : undefined,
    specializations: splitSpecializations(params.specialization),
  };

  const profileTailorData: Partial<TailorDetailsData> = tailorProfile
    ? {
        id: params.tailorId || tailorProfile.email || tailorProfile.phone || 1,
        name: tailorProfile.name,
        phone: tailorProfile.phone,
        email: tailorProfile.email,
        address: tailorProfile.address,
        experience: tailorProfile.experience,
        specializations: tailorProfile.specialization,
        description: tailorProfile.description,
        avatar: tailorProfile.avatar,
      }
    : {};

  const tailorData: TailorDetailsData = {
    ...DEFAULT_TAILOR_DETAILS,
    ...profileTailorData,
    ...routeTailorData,
    specializations:
      routeTailorData.specializations?.length
        ? routeTailorData.specializations
        : profileTailorData.specializations?.length
          ? profileTailorData.specializations
          : DEFAULT_TAILOR_DETAILS.specializations,
  };

  const avatarLabel = typeof tailorData.avatar === 'string' && tailorData.avatar.trim()
    ? tailorData.avatar.trim().slice(0, 2).toUpperCase()
    : tailorData.name
        .split(' ')
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase();

  const handleContactTailor = () => {
    router.push(`/customer/chat?tailorId=${tailorData.id}&tailorName=${tailorData.name}`);
  };

  const handleCallTailor = async () => {
    if (!tailorData.phone) return;
    const phoneNumber = String(tailorData.phone).replace(/\s+/g, '');
    await Linking.openURL(`tel:${phoneNumber}`);
  };

  return (
    <ProtectedRoute requiredRole="customer">
      <View style={[styles.container, { backgroundColor: bg }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: tint }]}>
          <AppBackButton onPress={() => (router as any).replace(`/customer?tab=${fromTab}`)} variant="tint" />
          <ThemedText style={[styles.headerTitle, { color: '#fff' }]}>Tailor Details</ThemedText>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Tailor Profile Card */}
          <View style={[styles.profileCard, { backgroundColor: cardBg }]}>
            <View style={styles.avatarSection}>
              <View style={[styles.avatar, { backgroundColor: tint }]}>
                {tailorData.avatar ? (
                  <Text style={styles.avatarText}>{avatarLabel}</Text>
                ) : (
                  <Ionicons name="person-outline" size={38} color="#fff" />
                )}
              </View>
              <View style={styles.profileInfo}>
                <ThemedText style={styles.tailorName}>{tailorData.name}</ThemedText>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={15} color="#f59e0b" style={styles.star} />
                  <ThemedText style={styles.rating}>Profile verified</ThemedText>
                  <ThemedText style={[styles.reviews, { color: muted }]}>Tailor profile</ThemedText>
                </View>
              </View>
            </View>

            <View style={styles.badgeRow}>
              <View style={[styles.infoBadge, { backgroundColor: tint + '18' }]}>
                <Ionicons name="call-outline" size={14} color={tint} />
                <Text style={[styles.infoBadgeText, { color: tint }]}>{tailorData.phone}</Text>
              </View>
              <View style={[styles.infoBadge, { backgroundColor: tint + '18' }]}>
                <Ionicons name="briefcase-outline" size={14} color={tint} />
                <Text style={[styles.infoBadgeText, { color: tint }]}>{tailorData.experience || 'Not set'}</Text>
              </View>
            </View>
          </View>

          {/* Contact Information */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: muted }]}>CONTACT INFORMATION</Text>
            <View style={[styles.infoCard, { backgroundColor: cardBg }]}>
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={20} color={tint} style={styles.infoIcon} />
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: muted }]}>Phone</Text>
                  <Text style={styles.infoValue}>{tailorData.phone}</Text>
                </View>
              </View>
              <View style={[styles.divider, { backgroundColor: muted }]} />
              <View style={styles.infoRow}>
                <Ionicons name="mail-outline" size={20} color={tint} style={styles.infoIcon} />
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: muted }]}>Email</Text>
                  <Text style={styles.infoValue}>{tailorData.email}</Text>
                </View>
              </View>
              <View style={[styles.divider, { backgroundColor: muted }]} />
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={20} color={tint} style={styles.infoIcon} />
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: muted }]}>Address</Text>
                  <Text style={styles.infoValue}>{tailorData.address}</Text>
                </View>
              </View>
              <View style={[styles.divider, { backgroundColor: muted }]} />
              <View style={styles.infoRow}>
                <Ionicons name="briefcase-outline" size={20} color={tint} style={styles.infoIcon} />
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: muted }]}>Experience</Text>
                  <Text style={styles.infoValue}>{tailorData.experience || 'Not set'}</Text>
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
              {tailorData.specializations.length > 0 ? tailorData.specializations.map((spec) => (
                <View key={spec} style={[styles.chip, { backgroundColor: tint + '20' }]}>
                  <Text style={[styles.chipText, { color: tint }]}>{spec}</Text>
                </View>
              )) : (
                <Text style={[styles.emptyText, { color: muted }]}>No specializations provided</Text>
              )}
            </View>
          </View>

          {/* Details Grid */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: muted }]}>DETAILS</Text>
            <View style={styles.detailsGrid}>
              <View style={[styles.detailItem, { backgroundColor: cardBg }]}>
                <Ionicons name="briefcase-outline" size={24} color={tint} style={styles.detailIcon} />
                <Text style={[styles.detailValue, { color: tint }]}>{tailorData.experience || 'Not set'}</Text>
                <Text style={[styles.detailLabel, { color: muted }]}>Experience</Text>
              </View>
              <View style={[styles.detailItem, { backgroundColor: cardBg }]}>
                <Ionicons name="mail-outline" size={24} color={tint} style={styles.detailIcon} />
                <Text style={[styles.detailValue, { color: tint }]}>{tailorData.email || 'Not set'}</Text>
                <Text style={[styles.detailLabel, { color: muted }]}>Email</Text>
              </View>
              <View style={[styles.detailItem, { backgroundColor: cardBg }]}>
                <Ionicons name="location-outline" size={24} color={tint} style={styles.detailIcon} />
                <Text style={[styles.detailValue, { color: tint }]}>{tailorData.address || 'Not set'}</Text>
                <Text style={[styles.detailLabel, { color: muted }]}>Address</Text>
              </View>
            </View>
          </View>

          <View style={styles.buttonSection}>
            <Pressable
              style={[styles.contactBtn, { borderColor: tint }]}
              onPress={handleContactTailor}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={20} color={tint} />
              <Text style={[styles.contactBtnText, { color: tint }]}>Contact Tailor</Text>
            </Pressable>

            <Pressable
              style={[styles.callBtn, { backgroundColor: tint }]}
              onPress={handleCallTailor}
            >
              <Ionicons name="call" size={20} color="#fff" />
              <Text style={styles.callBtnText}>Call Tailor</Text>
            </Pressable>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, paddingTop: 40 },
  headerSpacer: { width: 84, height: 44 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '700' },
  content: { padding: 16 },
  profileCard: { padding: 16, borderRadius: 16, marginBottom: 20 },
  avatarSection: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '900' },
  profileInfo: { flex: 1 },
  tailorName: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  star: { marginRight: 4 },
  rating: { fontWeight: '700', marginRight: 4 },
  reviews: { fontSize: 13 },
  badgeRow: { flexDirection: 'row', gap: 10, marginTop: 14, flexWrap: 'wrap' },
  infoBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, gap: 6 },
  infoBadgeText: { fontSize: 12, fontWeight: '700' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 10, letterSpacing: 0.5 },
  infoCard: { borderRadius: 16, padding: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#f3f4f6' },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 8 },
  infoIcon: { marginRight: 12 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, marginBottom: 2 },
  infoValue: { fontSize: 14, fontWeight: '600' },
  divider: { height: 1, marginVertical: 4, opacity: 0.2 },
  aboutCard: { padding: 14, borderRadius: 16, borderWidth: 1, borderColor: '#f3f4f6' },
  description: { fontSize: 14, lineHeight: 20 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  chipText: { fontSize: 12, fontWeight: '600' },
  emptyText: { fontSize: 13, fontWeight: '600' },
  detailsGrid: { flexDirection: 'row', gap: 10 },
  detailItem: { flex: 1, alignItems: 'center', padding: 14, borderRadius: 16, borderWidth: 1, borderColor: '#f3f4f6' },
  detailIcon: { marginBottom: 6 },
  detailValue: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  detailLabel: { fontSize: 11 },
  buttonSection: { gap: 10, marginTop: 10 },
  contactBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 2, paddingVertical: 14, borderRadius: 12, gap: 8 },
  contactBtnText: { fontSize: 16, fontWeight: '700' },
  callBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, gap: 8 },
  callBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  hireBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, gap: 8 },
  hireBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
