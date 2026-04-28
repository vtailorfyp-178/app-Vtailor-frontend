import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch, Alert } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { deleteAccount } from '@/services/authApi';

export default function TailorSettings() {
  const auth = useAuth();
  const router = useRouter();
  const bg = useThemeColor({}, 'background');
  const cardBg = useThemeColor({}, 'card');
  const tint = useThemeColor({}, 'tint');
  const muted = useThemeColor({}, 'muted');

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [emailUpdates, setEmailUpdates] = useState(false);

  const handleToggleAllNotifications = (value: boolean) => {
    setNotificationsEnabled(value);
    setPushEnabled(value);
    setSmsEnabled(value);
    setEmailUpdates(value);
  };

  const handleChangeEmail = () => {
    Alert.alert('Change Email', 'Email update feature coming soon', [{ text: 'OK' }]);
  };

  const handleChangePhone = () => {
    Alert.alert('Change Phone', 'Phone update feature coming soon', [{ text: 'OK' }]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            if (!auth.token || !auth.userId) {
              Alert.alert('Session expired', 'Please log in again.');
              return;
            }

            try {
              await deleteAccount(auth.token, auth.userId);
              auth.logout();
              router.replace('/auth');
            } catch (error) {
              console.error('Delete account failed:', error);
              Alert.alert('Delete failed', 'Unable to delete account right now.');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  return (
    <ProtectedRoute requiredRole="tailor">
      <View style={[styles.container, { backgroundColor: bg }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: tint }]}>
          <Pressable onPress={() => router.replace('/tailor?tab=profile')} style={styles.headerButton}>
            <Ionicons name="chevron-back" size={26} color="#fff" />
          </Pressable>
          <ThemedText style={[styles.headerTitle, { color: '#fff' }]}>Settings</ThemedText>
          <View style={styles.headerButton} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Account Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: muted }]}>ACCOUNT</Text>
            <View style={styles.sectionContent}>
              <Pressable style={[styles.settingItem, { backgroundColor: cardBg }]} onPress={handleChangeEmail}>
                <View style={styles.settingLeft}>
                  <Ionicons name="mail-outline" size={20} color={tint} style={styles.settingIcon} />
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={styles.settingLabel}>Email Address</Text>
                    <Text style={[styles.settingValue, { color: muted }]}>{auth.user?.email || 'Not set'}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={muted} />
              </Pressable>

              <Pressable style={[styles.settingItem, { backgroundColor: cardBg, marginTop: 8 }]} onPress={handleChangePhone}>
                <View style={styles.settingLeft}>
                  <Ionicons name="mail-open-outline" size={20} color={tint} style={styles.settingIcon} />
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={styles.settingLabel}>Email</Text>
                    <Text style={[styles.settingValue, { color: muted }]}>{auth.loginEmail || auth.user?.email || 'Not set'}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={muted} />
              </Pressable>
            </View>
          </View>

          {/* Notifications Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: muted }]}>NOTIFICATIONS</Text>
            <View style={styles.sectionContent}>
              <View style={[styles.settingItem, { backgroundColor: cardBg }]}>
                <View style={styles.settingLeft}>
                  <Ionicons name="notifications-outline" size={20} color={tint} style={styles.settingIcon} />
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={styles.settingLabel}>All Notifications</Text>
                    <Text style={[styles.settingValue, { color: muted }]}>Control all notifications</Text>
                  </View>
                </View>
                <Switch value={notificationsEnabled} onValueChange={handleToggleAllNotifications} />
              </View>

              <View style={[styles.settingItem, { backgroundColor: cardBg, marginTop: 8 }]}>
                <View style={styles.settingLeft}>
                  <Ionicons name="phone-portrait-outline" size={20} color={tint} style={styles.settingIcon} />
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={styles.settingLabel}>Push Notifications</Text>
                    <Text style={[styles.settingValue, { color: muted }]}>Order updates and alerts</Text>
                  </View>
                </View>
                <Switch value={pushEnabled} onValueChange={setPushEnabled} />
              </View>

              <View style={[styles.settingItem, { backgroundColor: cardBg, marginTop: 8 }]}>
                <View style={styles.settingLeft}>
                  <Ionicons name="chatbubble-ellipses-outline" size={20} color={tint} style={styles.settingIcon} />
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={styles.settingLabel}>SMS Notifications</Text>
                    <Text style={[styles.settingValue, { color: muted }]}>Updates via SMS</Text>
                  </View>
                </View>
                <Switch value={smsEnabled} onValueChange={setSmsEnabled} />
              </View>
            </View>
          </View>

          {/* Privacy & Security Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: muted }]}>PRIVACY & SECURITY</Text>
            <View style={styles.sectionContent}>
              <Pressable style={[styles.settingItem, { backgroundColor: cardBg }]} onPress={() => router.push('/tailor/privacy-policy')}>
                <View style={styles.settingLeft}>
                  <Ionicons name="lock-closed-outline" size={20} color={tint} style={styles.settingIcon} />
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={styles.settingLabel}>Privacy Policy</Text>
                    <Text style={[styles.settingValue, { color: muted }]}>Read our policies</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={muted} />
              </Pressable>

              <Pressable style={[styles.settingItem, { backgroundColor: cardBg, marginTop: 8 }]} onPress={() => router.push('/tailor/terms-conditions' as any)}>
                <View style={styles.settingLeft}>
                  <Ionicons name="document-text-outline" size={20} color={tint} style={styles.settingIcon} />
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={styles.settingLabel}>Terms & Conditions</Text>
                    <Text style={[styles.settingValue, { color: muted }]}>View terms</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={muted} />
              </Pressable>
            </View>
          </View>

          {/* Danger Zone */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: muted }]}>DANGER ZONE</Text>
            <View style={styles.sectionContent}>
              <Pressable
                style={[styles.settingItem, { backgroundColor: '#fee2e2' }]}
                onPress={handleDeleteAccount}
              >
                <View style={styles.settingLeft}>
                  <Ionicons name="trash-outline" size={20} color="#dc2626" style={styles.settingIcon} />
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={[styles.settingLabel, { color: '#dc2626' }]}>Delete Account</Text>
                    <Text style={[styles.settingValue, { color: '#991b1b' }]}>Permanently delete your account</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#dc2626" />
              </Pressable>
            </View>
          </View>

          {/* App Version */}
          <View style={[styles.section, { borderBottomWidth: 0 }]}>
            <View style={[styles.settingItem, { backgroundColor: cardBg, justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={[styles.versionText, { color: muted }]}>App Version 1.0.0</Text>
            </View>
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
  headerButton: { width: 44, height: 44, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '700' },
  content: { padding: 16 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 12, fontWeight: '700', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionContent: { overflow: 'hidden', borderRadius: 12 },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  settingIcon: { fontSize: 20 },
  settingLabel: { fontSize: 14, fontWeight: '700', color: '#111827' },
  settingValue: { fontSize: 12, marginTop: 4 },
  versionText: { fontSize: 13, fontWeight: '500' },
});
