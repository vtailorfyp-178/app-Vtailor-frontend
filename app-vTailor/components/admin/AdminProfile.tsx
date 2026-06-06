import React from 'react';
import { View, StyleSheet, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_COLORS, SURFACE_MUTED, TEXT_DARK, UI } from '@/constants/ui';
import { Ionicons } from '@expo/vector-icons';

export default function AdminProfile() {
  const { loginEmail, logout } = useAuth();
  const router = useRouter();
  const accent = ROLE_COLORS.admin.primary;

  const handleLogout = () => {
    Alert.alert('Logout', 'Sign out of admin panel?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          logout();
          (router as any).replace('/auth');
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={[styles.avatar, { backgroundColor: ROLE_COLORS.admin.soft }]}>
          <Ionicons name="shield-checkmark" size={36} color={accent} />
        </View>
        <ThemedText style={styles.title}>Platform Admin</ThemedText>
        <ThemedText style={styles.email}>{loginEmail || '—'}</ThemedText>
        <ThemedText style={styles.hint}>
          Manage users and orders from the Dashboard, Users, and Orders tabs.
        </ThemedText>
      </View>

      <Pressable style={[styles.logoutBtn, { backgroundColor: accent }]} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#fff" />
        <ThemedText style={styles.logoutText}>Logout</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SURFACE_MUTED, padding: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    ...UI.shadow,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: { fontSize: 20, fontWeight: '900', color: TEXT_DARK },
  email: { fontSize: 14, color: '#64748b', marginTop: 6 },
  hint: { fontSize: 13, color: '#64748b', textAlign: 'center', marginTop: 16, lineHeight: 20 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  logoutText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
