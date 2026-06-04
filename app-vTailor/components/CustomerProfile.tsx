import React from 'react';
import { View, ScrollView, Pressable, StyleSheet, Image } from 'react-native';
import { Href, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { ThemedText } from './themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { CustomerScreenHeader } from '@/components/customer/CustomerScreenHeader';
import { SURFACE_MUTED, TEXT_DARK, UI } from '@/constants/ui';
import { Ionicons } from '@expo/vector-icons';

const CustomerProfile = () => {
  const { user, loginEmail, logout } = useAuth();
  const router = useRouter();
  const tint = useThemeColor({}, 'tint');
  const card = useThemeColor({}, 'card');
  const inputBorder = useThemeColor({}, 'inputBorder');
  const muted = useThemeColor({}, 'muted');
  const iconBg = useThemeColor({}, 'iconBg');

  const displayEmail = user?.email || loginEmail || '';

  const menuItems: { icon: keyof typeof Ionicons.glyphMap; label: string; path: Href }[] = [
    { icon: 'settings-outline', label: 'Settings', path: '/customer/settings' },
    { icon: 'help-circle-outline', label: 'Help & Support', path: '/customer/help' },
  ];

  const handleLogout = () => {
    if (logout) logout();
    router.replace('/auth');
  };

  return (
    <View style={[styles.container, { backgroundColor: SURFACE_MUTED }]}>
      <CustomerScreenHeader
        eyebrow="Your account"
        title="Profile"
        tint={tint}
        footer={
          <View style={[styles.profileCard, { backgroundColor: card }]}>
            <View style={[styles.profileAvatar, { backgroundColor: iconBg }]}>
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
              ) : (
                <Ionicons name="person-outline" size={29} color={tint} />
              )}
            </View>
            <View style={styles.profileInfo}>
              <ThemedText style={styles.profileName}>{user?.name || 'Customer Name'}</ThemedText>
              <ThemedText style={[styles.profilePhone, { color: muted }]}>{displayEmail}</ThemedText>
            </View>
            <Pressable style={[styles.editBtn, { backgroundColor: iconBg }]} onPress={() => router.push('/customer/profile-edit')}>
              <Ionicons name="create-outline" size={20} color={tint} />
            </Pressable>
          </View>
        }
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <ThemedText style={styles.sectionLabel}>Personal Information</ThemedText>
          <View style={[styles.infoCard, { backgroundColor: card, borderColor: inputBorder }]}>
            {[
              { icon: 'person-outline', label: 'Full Name', value: user?.name || 'Not set', bg: '#e0f2fe', color: '#0284c7' },
              { icon: 'call-outline', label: 'Phone Number', value: user?.phone || 'Not set', bg: '#fef08a', color: '#a16207' },
              { icon: 'mail-outline', label: 'Email', value: displayEmail || 'Not set', bg: '#ccfbf1', color: '#0f766e' },
              { icon: 'location-outline', label: 'Address', value: user?.address || 'Not set', bg: '#dbeafe', color: '#2563eb' },
            ].map((info, idx) => (
              <View key={idx}>
                {idx > 0 && <View style={[styles.divider, { backgroundColor: inputBorder }]} />}
                <View style={styles.infoItem}>
                  <View style={[styles.infoIconBox, { backgroundColor: info.bg }]}>
                    <Ionicons name={info.icon as any} size={20} color={info.color} />
                  </View>
                  <View style={styles.infoContent}>
                    <ThemedText style={styles.infoLabel}>{info.label}</ThemedText>
                    <ThemedText style={styles.infoValue}>{info.value}</ThemedText>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          {menuItems.map((item) => (
            <Pressable key={item.label} style={[styles.menuItem, { backgroundColor: card, borderColor: inputBorder }]} onPress={() => router.push(item.path)}>
              <View style={[styles.menuIconBox, { backgroundColor: iconBg }]}>
                <Ionicons name={item.icon} size={20} color={tint} />
              </View>
              <ThemedText style={styles.menuLabel}>{item.label}</ThemedText>
              <ThemedText style={styles.menuArrow}>→</ThemedText>
            </Pressable>
          ))}
        </View>

        <View style={styles.logoutSection}>
          <Pressable style={[styles.logoutBtn, { backgroundColor: card, borderColor: inputBorder }]} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#ef4444" style={styles.logoutIcon} />
            <ThemedText style={styles.logoutText}>Logout</ThemedText>
          </Pressable>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  profileCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 20, ...UI.softShadow },
  profileAvatar: { width: 62, height: 62, borderRadius: 31, justifyContent: 'center', alignItems: 'center', marginRight: 12, overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%', borderRadius: 28 },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 16, fontWeight: '800', marginBottom: 2, color: TEXT_DARK },
  profilePhone: { fontSize: 12, color: '#6b7280' },
  editBtn: { width: 42, height: 42, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1 },
  section: { paddingHorizontal: 16, paddingTop: 24 },
  sectionLabel: { fontSize: 11, color: '#6b7280', textTransform: 'uppercase', fontWeight: '600', letterSpacing: 0.5, marginBottom: 12 },
  infoCard: { borderRadius: 18, borderWidth: 1, overflow: 'hidden', ...UI.softShadow },
  infoItem: { flexDirection: 'row', alignItems: 'center', padding: 15 },
  infoIconBox: { width: 42, height: 42, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, marginBottom: 3, color: '#64748b', fontWeight: '700' },
  infoValue: { fontSize: 13, fontWeight: '700', color: TEXT_DARK },
  divider: { height: 1 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 18, borderWidth: 1, marginBottom: 10, ...UI.softShadow },
  menuIconBox: { width: 42, height: 42, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: '800', color: TEXT_DARK },
  menuArrow: { fontSize: 16, color: '#6b7280' },
  logoutSection: { paddingHorizontal: 16, paddingTop: 16, marginTop: 8 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, borderRadius: 18, borderWidth: 1, ...UI.softShadow },
  logoutIcon: { marginRight: 8 },
  logoutText: { fontSize: 16, fontWeight: '600' },
  bottomPadding: { height: 100 },
});

export default CustomerProfile;
