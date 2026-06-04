import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { CustomerScreenHeader } from '@/components/customer/CustomerScreenHeader';
import { ThemedText } from '@/components/themed-text';
import { SURFACE_MUTED, ROLE_COLORS, UI } from '@/constants/ui';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Href, useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface MediaItem {
  id: string;
  type: 'image' | 'video';
  uri?: string;
  thumbnail?: string;
  name: string;
}

const SAMPLE_WORK_STORAGE_KEY = 'TAILOR_SAMPLE_WORK';

export default function TailorProfile() {
  const auth = useAuth();
  const { user } = auth;
  const cardBg = useThemeColor({}, 'card');
  const tint = ROLE_COLORS.tailor.primary;
  const router = useRouter();
  const [savedSampleWork, setSavedSampleWork] = useState<MediaItem[]>([]);

  const specializations = ['Formal Dresses', 'Wedding Attire', 'Traditional'];
  const sampleWork = [1, 2, 3, 4, 5, 6];
  const menuItems: { label: string; path: Href; icon: keyof typeof Ionicons.glyphMap }[] = [
    { label: 'Settings', path: '/tailor/settings', icon: 'settings-outline' },
    { label: 'Help & Support', path: '/tailor/help', icon: 'help-circle-outline' },
  ];

  const handleLogout = () => {
    try {
      // @ts-ignore
      if (auth.logout) auth.logout();
    } catch {}
    router.replace('/auth');
  };

  useFocusEffect(
    useCallback(() => {
      const loadSampleWork = async () => {
        try {
          const saved = await AsyncStorage.getItem(SAMPLE_WORK_STORAGE_KEY);
          setSavedSampleWork(saved ? JSON.parse(saved) : []);
        } catch {
          setSavedSampleWork([]);
        }
      };

      loadSampleWork();
    }, []),
  );

  return (
    <ProtectedRoute requiredRole="tailor">
      <View style={[styles.container, { backgroundColor: SURFACE_MUTED }]}>
        <CustomerScreenHeader
          eyebrow="Your account"
          title="Profile"
          tint={tint}
          rightSlot={
            <Pressable style={styles.iconBtn} onPress={() => router.push('/tailor/profile-edit')}>
              <Ionicons name="create-outline" size={20} color="#fff" />
            </Pressable>
          }
          footer={
            <View style={[styles.profileCard, { backgroundColor: cardBg }]}>
              <View style={[styles.avatar, { backgroundColor: '#fdf2f8' }]}>
                {user?.avatar ? (
                  <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
                ) : (
                  <Ionicons name="person-outline" size={32} color={tint} />
                )}
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.name}>{user?.name || 'Tailor Name'}</Text>
                <Text style={styles.phone}>{auth?.loginEmail || user?.email || 'tailor@example.com'}</Text>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={15} color="#f59e0b" />
                  <Text style={styles.rating}>4.8</Text>
                  <Text style={styles.reviews}>(128 reviews)</Text>
                </View>
              </View>
            </View>
          }
        />

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Specializations</Text>
            <View style={styles.chipsRow}>
              {specializations.map((s) => (
                <View key={s} style={styles.chip}><Text style={styles.chipText}>{s}</Text></View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Information</Text>
            <View style={[styles.infoCard, { backgroundColor: cardBg }]}>
              <View style={styles.infoRow}><Ionicons name="call-outline" size={19} color="#ec4899" style={styles.infoIcon} /><View style={{flex:1}}><Text style={styles.infoLabel}>Phone</Text><Text style={styles.infoValue}>{user?.phone || 'Not set'}</Text></View></View>
              <View style={styles.infoRow}><Ionicons name="mail-outline" size={19} color="#ec4899" style={styles.infoIcon} /><View style={{flex:1}}><Text style={styles.infoLabel}>Email</Text><Text style={styles.infoValue}>{auth?.loginEmail || user?.email || 'Not set'}</Text></View></View>
              <View style={styles.infoRow}><Ionicons name="location-outline" size={19} color="#ec4899" style={styles.infoIcon} /><View style={{flex:1}}><Text style={styles.infoLabel}>Address</Text><Text style={styles.infoValue}>{user?.address || 'Not set'}</Text></View></View>
              <View style={styles.infoRow}><Ionicons name="briefcase-outline" size={19} color="#ec4899" style={styles.infoIcon} /><View style={{flex:1}}><Text style={styles.infoLabel}>Experience</Text><Text style={styles.infoValue}>{user?.experience ? `${user.experience} Years` : 'Not set'}</Text></View></View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sampleHeader}><Text style={styles.sectionLabel}>Sample Work</Text>
            <Pressable onPress={() => router.push('/tailor/sample-work-edit')}><Text style={styles.linkText}>Edit</Text></Pressable></View>
            <View style={styles.grid}>
              {savedSampleWork.length > 0
                ? savedSampleWork.map((item) => (
                  <View key={item.id} style={[styles.sampleBox, { backgroundColor: '#f3f4f6' }]}>
                    {item.type === 'image' && item.uri ? (
                      <Image source={{ uri: item.uri }} style={styles.sampleImage} />
                    ) : (
                      <View style={styles.videoSample}>
                        <Ionicons name="play-circle" size={28} color="#fff" />
                      </View>
                    )}
                  </View>
                ))
                : sampleWork.map((i) => (
                  <View key={i} style={[styles.sampleBox, { backgroundColor: '#f3f4f6' }]}>
                    <Text style={styles.sampleText}>Sample {i}</Text>
                  </View>
                ))}
            </View>
          </View>

          <View style={styles.section}>
            {menuItems.map((m) => (
              <Pressable key={m.label} style={[styles.menuItem, { backgroundColor: cardBg }]} onPress={() => router.push(m.path)}>
                <Ionicons name={m.icon} size={20} color="#ec4899" style={styles.menuIcon} />
                <Text style={styles.menuLabel}>{m.label}</Text>
                <Text style={styles.menuArrow}>›</Text>
              </Pressable>
            ))}
          </View>

          <Pressable style={styles.logoutBtn} onPress={handleLogout}><Text style={styles.logoutText}>Logout</Text></Pressable>
        </ScrollView>
      </View>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 20,
    ...UI.softShadow,
  },
  profileInfo: { flex: 1, marginLeft: 12 },
  avatar: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%', borderRadius: 40 },
  name: { fontSize: 18, fontWeight: '700' },
  phone: { color: '#6b7280' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  star: { marginRight: 6 },
  rating: { fontWeight: '700' },
  reviews: { marginLeft: 6, color: '#6b7280' },
  content: { padding: 16, paddingBottom: 120 },
  section: { marginBottom: 16 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#6b7280', marginBottom: 8, textTransform: 'uppercase' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#f3d1de', marginRight: 8, marginBottom: 8 },
  chipText: { color: '#ec4899', fontWeight: '600' },
  infoCard: { padding: 12, borderRadius: 18, borderWidth: 1, borderColor: '#f1d6e2', ...UI.softShadow },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  infoIcon: { width: 40, textAlign: 'center' },
  infoLabel: { color: '#6b7280', fontSize: 12 },
  infoValue: { fontWeight: '700' },
  sampleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  sampleBox: { width: '32%', aspectRatio: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8, marginRight: 4, overflow: 'hidden' },
  sampleImage: { width: '100%', height: '100%' },
  videoSample: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1f2937' },
  sampleText: { color: '#6b7280', fontSize: 12 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: '#f1d6e2', ...UI.softShadow },
  menuIcon: { width: 32, textAlign: 'center' },
  menuLabel: { flex: 1, fontWeight: '700' },
  menuArrow: { color: '#6b7280' },
  logoutBtn: { marginTop: 8, backgroundColor: '#ef4444', padding: 12, borderRadius: 12, alignItems: 'center' },
  logoutText: { color: '#fff', fontWeight: '700' },
  linkText: { color: '#ec4899', fontWeight: '700' },
});
