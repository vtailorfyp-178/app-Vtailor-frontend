import React from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { ThemedText } from './themed-text';

const CustomerProfile = () => {
  const { user } = useAuth();
  const router = useRouter();

  const menuItems = [
    { icon: '⚙️', label: 'Settings' },
    { icon: '❓', label: 'Help & Support' },
  ];

  const handleLogout = () => {
    router.replace('/auth');
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerSection}>
        <ThemedText style={styles.headerTitle}>Profile</ThemedText>
        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}><ThemedText style={styles.avatarEmoji}>👤</ThemedText></View>
          <View style={styles.profileInfo}>
            <ThemedText style={styles.profileName}>{user?.name || 'Customer Name'}</ThemedText>
            <ThemedText style={styles.profilePhone}>{user?.email || '+92 300 1234567'}</ThemedText>
          </View>
          <Pressable style={styles.editBtn}><ThemedText style={styles.editIcon}>✏️</ThemedText></Pressable>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <ThemedText style={styles.sectionLabel}>Personal Information</ThemedText>
          <View style={styles.infoCard}>
            {[
              { icon: '👤', label: 'Full Name', value: user?.name || 'Not set', bg: '#e0f2fe' },
              { icon: '📱', label: 'Phone Number', value: user?.email || 'Not set', bg: '#fef08a' },
              { icon: '📧', label: 'Email', value: user?.email || 'Not set', bg: '#ccfbf1' },
              { icon: '📍', label: 'Address', value: user?.address || 'Not set', bg: '#dbeafe' },
            ].map((info, idx) => (
              <View key={idx}>
                {idx > 0 && <View style={styles.divider} />}
                <View style={styles.infoItem}>
                  <View style={[styles.infoIconBox, { backgroundColor: info.bg }]}>
                    <ThemedText style={styles.infoIcon}>{info.icon}</ThemedText>
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
            <Pressable key={item.label} style={styles.menuItem}>
              <View style={styles.menuIconBox}><ThemedText style={styles.menuIcon}>{item.icon}</ThemedText></View>
              <ThemedText style={styles.menuLabel}>{item.label}</ThemedText>
              <ThemedText style={styles.menuArrow}>→</ThemedText>
            </Pressable>
          ))}
        </View>

        <View style={styles.logoutSection}>
          <Pressable style={styles.logoutBtn} onPress={handleLogout}>
            <ThemedText style={styles.logoutIcon}>🚪</ThemedText>
            <ThemedText style={styles.logoutText}>Logout</ThemedText>
          </Pressable>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  headerSection: { paddingHorizontal: 16, paddingTop: 40, paddingBottom: 20, backgroundColor: '#0ea5a4', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#ffffff', marginBottom: 16 },
  profileCard: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#ffffff', borderRadius: 16 },
  profileAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarEmoji: { fontSize: 28 },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  profilePhone: { fontSize: 12, color: '#6b7280' },
  editBtn: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center' },
  editIcon: { fontSize: 18 },
  scrollView: { flex: 1 },
  section: { paddingHorizontal: 16, paddingTop: 24 },
  sectionLabel: { fontSize: 11, color: '#6b7280', textTransform: 'uppercase', fontWeight: '600', letterSpacing: 0.5, marginBottom: 12 },
  infoCard: { backgroundColor: '#f9fafb', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', overflow: 'hidden' },
  infoItem: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  infoIconBox: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  infoIcon: { fontSize: 18 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, color: '#6b7280', marginBottom: 2 },
  infoValue: { fontSize: 13, fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#e5e7eb' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: '#f9fafb', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 10 },
  menuIconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  menuIcon: { fontSize: 18 },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: '500' },
  menuArrow: { fontSize: 16, color: '#6b7280' },
  logoutSection: { paddingHorizontal: 16, paddingTop: 16, marginTop: 8 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, backgroundColor: '#fee2e2', borderRadius: 12, borderWidth: 1, borderColor: '#fecaca' },
  logoutIcon: { fontSize: 18, marginRight: 8 },
  logoutText: { fontSize: 16, fontWeight: '600', color: '#dc2626' },
  bottomPadding: { height: 100 },
});

export default CustomerProfile;
