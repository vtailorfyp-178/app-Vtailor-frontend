import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Image } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useRouter } from 'expo-router';

export default function TailorProfile() {
  const auth = useAuth();
  const { user } = auth;
  const bg = useThemeColor({}, 'background');
  const cardBg = useThemeColor({}, 'card');
  const router = useRouter();

  const specializations = ['Formal Dresses', 'Wedding Attire', 'Traditional'];
  const sampleWork = [1, 2, 3, 4, 5, 6];
  const menuItems = [
    { label: 'Settings', path: '/tailor/settings', emoji: '⚙️' },
    { label: 'Help & Support', path: '/tailor/help', emoji: '❓' },
  ];

  const handleLogout = () => {
    try { /* call logout if present */
      // @ts-ignore
      if (auth.logout) auth.logout();
    } catch {}
    router.replace('/auth');
  };

  return (
    <ProtectedRoute requiredRole="tailor">
      <View style={[styles.container, { backgroundColor: bg }]}> 
        <View style={styles.headerGradient}>
          <View style={styles.headerTop}>
            <ThemedText style={styles.headerTitle}>Profile</ThemedText>
            <Pressable style={styles.iconBtn} onPress={() => router.push('/tailor/profile-edit')}>
              <Text style={styles.iconBtnText}>✏️</Text>
            </Pressable>
          </View>

          <View style={styles.profileRow}>
            <View style={[styles.avatar, { backgroundColor: cardBg }]}> 
              {user?.avatar
                ? <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
                : <Text style={styles.avatarIcon}>👤</Text>
              }
            </View>
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.name}>{user?.name || 'Tailor Name'}</Text>
              <Text style={styles.phone}>{auth?.loginEmail || user?.email || 'tailor@example.com'}</Text>
              <View style={styles.ratingRow}>
                <Text style={styles.star}>⭐</Text>
                <Text style={styles.rating}>4.8</Text>
                <Text style={styles.reviews}>(128 reviews)</Text>
              </View>
            </View>
          </View>
        </View>

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
              <View style={styles.infoRow}><Text style={styles.infoIcon}>📱</Text><View style={{flex:1}}><Text style={styles.infoLabel}>Phone</Text><Text style={styles.infoValue}>{user?.phone || 'Not set'}</Text></View></View>
              <View style={styles.infoRow}><Text style={styles.infoIcon}>✉️</Text><View style={{flex:1}}><Text style={styles.infoLabel}>Email</Text><Text style={styles.infoValue}>{auth?.loginEmail || user?.email || 'Not set'}</Text></View></View>
              <View style={styles.infoRow}><Text style={styles.infoIcon}>📍</Text><View style={{flex:1}}><Text style={styles.infoLabel}>Address</Text><Text style={styles.infoValue}>{user?.address || 'Not set'}</Text></View></View>
              <View style={styles.infoRow}><Text style={styles.infoIcon}>💼</Text><View style={{flex:1}}><Text style={styles.infoLabel}>Experience</Text><Text style={styles.infoValue}>{user?.experience ? `${user.experience} Years` : 'Not set'}</Text></View></View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sampleHeader}><Text style={styles.sectionLabel}>Sample Work</Text>
            <Pressable onPress={() => router.push('/tailor/sample-work-edit')}><Text style={styles.linkText}>Edit</Text></Pressable></View>
            <View style={styles.grid}>
              {sampleWork.map((i) => (
                <View key={i} style={[styles.sampleBox, { backgroundColor: '#f3f4f6' }]}>
                  <Text style={styles.sampleText}>Sample {i}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            {menuItems.map((m) => (
              <Pressable key={m.label} style={[styles.menuItem, { backgroundColor: cardBg }]} onPress={() => router.push(m.path)}>
                <Text style={styles.menuIcon}>{m.emoji}</Text>
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
  headerGradient: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 12, backgroundColor: '#fff0f6', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#6b21a8' },
  iconBtn: { padding: 8, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.6)' },
  iconBtnText: { fontSize: 14 },
  profileRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%', borderRadius: 40 },
  avatarIcon: { fontSize: 32 },
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
  infoCard: { padding: 12, borderRadius: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  infoIcon: { width: 40, textAlign: 'center' },
  infoLabel: { color: '#6b7280', fontSize: 12 },
  infoValue: { fontWeight: '700' },
  sampleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  sampleBox: { width: '32%', aspectRatio: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  sampleText: { color: '#6b7280', fontSize: 12 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 8 },
  menuIcon: { width: 32, textAlign: 'center' },
  menuLabel: { flex: 1, fontWeight: '700' },
  menuArrow: { color: '#6b7280' },
  logoutBtn: { marginTop: 8, backgroundColor: '#ef4444', padding: 12, borderRadius: 12, alignItems: 'center' },
  logoutText: { color: '#fff', fontWeight: '700' },
  linkText: { color: '#ec4899', fontWeight: '700' },
});

