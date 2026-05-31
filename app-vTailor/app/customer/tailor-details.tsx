import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ROLE_COLORS, UI } from '@/constants/ui';
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
  rating?: string;
};

const THEME = ROLE_COLORS.customer;

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
  rating: '4.8 (245 reviews)',
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

function parseRatingValue(rating?: string): string {
  if (!rating) return '4.8';
  const match = rating.match(/[\d.]+/);
  return match?.[0] ?? '4.8';
}

export default function TailorDetails() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { tailorProfile } = useAuth();
  const bg = useThemeColor({}, 'background');
  const cardBg = useThemeColor({}, 'card');
  const tint = useThemeColor({}, 'tint');
  const muted = useThemeColor({}, 'muted');

  const routeTailorData: Partial<TailorDetailsData> = {
    id: params.tailorId || undefined,
    name: typeof params.tailorName === 'string' ? params.tailorName : undefined,
    phone: typeof params.tailorPhone === 'string' ? params.tailorPhone : undefined,
    email: typeof params.tailorEmail === 'string' ? params.tailorEmail : undefined,
    address: typeof params.tailorAddress === 'string' ? params.tailorAddress : undefined,
    experience: typeof params.tailorExperience === 'string' ? params.tailorExperience : undefined,
    description: typeof params.tailorDescription === 'string' ? params.tailorDescription : undefined,
    avatar: typeof params.tailorAvatar === 'string' ? params.tailorAvatar : undefined,
    rating: typeof params.tailorRating === 'string' ? params.tailorRating : undefined,
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

  const avatarLabel =
    typeof tailorData.avatar === 'string' && tailorData.avatar.trim()
      ? tailorData.avatar.trim().slice(0, 2).toUpperCase()
      : tailorData.name
          .split(' ')
          .slice(0, 2)
          .map((part) => part[0])
          .join('')
          .toUpperCase();

  const ratingScore = parseRatingValue(tailorData.rating);

  const handleContactTailor = () => {
    router.push({
      pathname: '/customer/chat-conversation',
      params: {
        tailorId: String(tailorData.id),
        otherUserId: String(tailorData.id),
        otherUserName: tailorData.name,
        otherUserAvatar: avatarLabel,
        otherUserPhone: tailorData.phone,
      },
    } as any);
  };

  const handleCallTailor = () => {
    const dialNumber = tailorData.phone.replace(/\s+/g, '');
    Linking.openURL(`tel:${dialNumber}`).catch(() => {
      Alert.alert('Call Failed', `Unable to open dialer for ${tailorData.phone}.`);
    });
  };

  const contactItems = [
    { icon: 'call-outline' as const, label: 'Phone', value: tailorData.phone },
    { icon: 'mail-outline' as const, label: 'Email', value: tailorData.email },
    { icon: 'location-outline' as const, label: 'Address', value: tailorData.address },
    { icon: 'briefcase-outline' as const, label: 'Experience', value: tailorData.experience || 'Not set' },
  ];

  return (
    <ProtectedRoute requiredRole="customer">
      <View style={[styles.container, { backgroundColor: bg }]}>
        <View style={[styles.heroBanner, { backgroundColor: tint }]}>
          <AppBackButton onPress={() => router.back()} variant="tint" />
          <ThemedText style={styles.heroTitle}>Tailor Profile</ThemedText>
          <View style={styles.heroSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.profileHeroCard, { backgroundColor: cardBg }]}>
            <View style={styles.profileTopRow}>
              <View style={[styles.avatarRing, { borderColor: THEME.border }]}>
                <View style={[styles.avatar, { backgroundColor: tint }]}>
                  <Text style={styles.avatarText}>{avatarLabel}</Text>
                </View>
              </View>
              <View style={styles.profileMain}>
                <ThemedText style={styles.tailorName}>{tailorData.name}</ThemedText>
                <View style={styles.verifiedRow}>
                  <Ionicons name="shield-checkmark" size={14} color={THEME.primaryDark} />
                  <Text style={styles.verifiedText}>Verified tailor on vTailor</Text>
                </View>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={15} color="#f59e0b" />
                  <Text style={styles.ratingScore}>{ratingScore}</Text>
                  <Text style={[styles.ratingMeta, { color: muted }]}>
                    {tailorData.rating?.replace(/⭐\s*/g, '').replace(/^[\d.]+\s*/, '') || 'Top rated'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={[styles.statBox, { backgroundColor: THEME.soft }]}>
                <Ionicons name="ribbon-outline" size={18} color={THEME.primaryDark} />
                <Text style={styles.statValue}>{tailorData.experience || '—'}</Text>
                <Text style={[styles.statLabel, { color: muted }]}>Experience</Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: THEME.soft }]}>
                <Ionicons name="star-outline" size={18} color={THEME.primaryDark} />
                <Text style={styles.statValue}>{ratingScore}</Text>
                <Text style={[styles.statLabel, { color: muted }]}>Rating</Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: THEME.soft }]}>
                <Ionicons name="shirt-outline" size={18} color={THEME.primaryDark} />
                <Text style={styles.statValue}>{tailorData.specializations.length}</Text>
                <Text style={[styles.statLabel, { color: muted }]}>Styles</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: muted }]}>CONTACT</Text>
            <View style={styles.contactGrid}>
              {contactItems.map((item) => (
                <View key={item.label} style={[styles.contactCard, { backgroundColor: cardBg }]}>
                  <View style={[styles.contactIconWrap, { backgroundColor: THEME.soft }]}>
                    <Ionicons name={item.icon} size={18} color={THEME.primaryDark} />
                  </View>
                  <Text style={[styles.contactLabel, { color: muted }]}>{item.label}</Text>
                  <Text style={styles.contactValue} numberOfLines={2}>
                    {item.value}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: muted }]}>ABOUT</Text>
            <View style={[styles.aboutCard, { backgroundColor: cardBg, borderColor: THEME.border }]}>
              <Ionicons name="chatbox-ellipses-outline" size={20} color={THEME.primaryDark} style={styles.aboutIcon} />
              <ThemedText style={styles.description}>{tailorData.description}</ThemedText>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: muted }]}>SPECIALIZATIONS</Text>
            <View style={styles.chipsRow}>
              {tailorData.specializations.length > 0 ? (
                tailorData.specializations.map((spec) => (
                  <View key={spec} style={[styles.chip, { backgroundColor: THEME.soft, borderColor: THEME.border }]}>
                    <Ionicons name="checkmark-circle" size={13} color={THEME.primaryDark} />
                    <Text style={[styles.chipText, { color: THEME.primaryDark }]}>{spec}</Text>
                  </View>
                ))
              ) : (
                <Text style={[styles.emptyText, { color: muted }]}>No specializations provided</Text>
              )}
            </View>
          </View>

          <View style={styles.buttonSection}>
            <Pressable
              style={[styles.contactBtn, { borderColor: tint }]}
              onPress={handleContactTailor}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={20} color={tint} />
              <Text style={[styles.contactBtnText, { color: tint }]}>Message Tailor</Text>
            </Pressable>
            <Pressable style={[styles.callBtn, { backgroundColor: tint }]} onPress={handleCallTailor}>
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
  heroBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 44,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    ...UI.shadow,
  },
  heroTitle: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '800', color: '#fff' },
  heroSpacer: { width: 84 },
  content: { paddingHorizontal: 16, paddingTop: 0, paddingBottom: 8 },
  profileHeroCard: {
    marginTop: -18,
    borderRadius: 22,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: THEME.border,
    ...UI.softShadow,
  },
  profileTopRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarRing: {
    padding: 3,
    borderRadius: 999,
    borderWidth: 2,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 22, fontWeight: '900' },
  profileMain: { flex: 1 },
  tailorName: { fontSize: 22, fontWeight: '900', marginBottom: 6 },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 },
  verifiedText: { fontSize: 11, fontWeight: '700', color: THEME.primaryDark },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingScore: { fontSize: 14, fontWeight: '900', color: '#0f172a' },
  ratingMeta: { fontSize: 12, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  statBox: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 4,
  },
  statValue: { fontSize: 14, fontWeight: '900', color: '#0f172a' },
  statLabel: { fontSize: 10, fontWeight: '700' },
  section: { marginBottom: 18 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 10,
    letterSpacing: 0.6,
  },
  contactGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  contactCard: {
    width: '48%',
    flexGrow: 1,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: THEME.border,
    ...UI.softShadow,
  },
  contactIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  contactLabel: { fontSize: 10, fontWeight: '800', marginBottom: 3, textTransform: 'uppercase' },
  contactValue: { fontSize: 13, fontWeight: '700', color: '#0f172a', lineHeight: 18 },
  aboutCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    ...UI.softShadow,
  },
  aboutIcon: { marginBottom: 8 },
  description: { fontSize: 14, lineHeight: 22, fontWeight: '500' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: { fontSize: 12, fontWeight: '700' },
  emptyText: { fontSize: 13, fontWeight: '600' },
  buttonSection: { gap: 10, marginTop: 4 },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    backgroundColor: '#fff',
    ...UI.softShadow,
  },
  contactBtnText: { fontSize: 16, fontWeight: '800' },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    ...UI.shadow,
  },
  callBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
