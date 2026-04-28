import React, { useEffect, useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import AppBackButton from '@/components/AppBackButton';

/**
 * Test screen to verify user data persistence on login.
 * This helps verify that when a user logs in with an existing email,
 * their customizations, measurements, and orders are properly restored.
 * 
 * To use:
 * 1. Create a customization as a customer (create some 3D customizations)
 * 2. Go back to profile/home and logout
 * 3. Log back in with the SAME email
 * 4. Check this screen - your customizations should appear
 */

export default function DataPersistenceTest() {
  const router = useRouter();
  const { userId, userRole, token } = useAuth();
  const tint = useThemeColor({}, 'tint');
  const card = useThemeColor({}, 'card');

  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    if (userId) {
      // Optionally fetch debug info about current session
      setDebugInfo({
        userId,
        userRole,
        hasToken: !!token,
        timestamp: new Date().toISOString(),
      });
    }
  }, [userId, userRole, token]);

  return (
    <ProtectedRoute requiredRole="customer">
      <ThemedView style={styles.container}>
        <View style={[styles.header, { backgroundColor: tint }]}>
          <AppBackButton onPress={() => router.back()} variant="tint" />
          <ThemedText style={styles.headerTitle}>Data Persistence Test</ThemedText>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          <ThemedText style={styles.sectionTitle}>Session Info</ThemedText>
          <View style={[styles.infoBox, { backgroundColor: card }]}>
            <ThemedText>User ID: {userId || 'Not set'}</ThemedText>
            <ThemedText>Role: {userRole || 'Not set'}</ThemedText>
            <ThemedText>Token: {token ? 'Active' : 'Inactive'}</ThemedText>
          </View>

          <ThemedText style={styles.sectionTitle}>Test Instructions</ThemedText>
          <View style={[styles.instructionsBox, { backgroundColor: card }]}>
            <ThemedText style={styles.instructions}>
              1️⃣ Create a customization:
              Navigate to &quot;Customize&quot; and create a 3D design. Save it.
            </ThemedText>
            <ThemedText style={styles.instructions}>
              2️⃣ Logout:
              Go to Profile → Settings → Logout
            </ThemedText>
            <ThemedText style={styles.instructions}>
              3️⃣ Login again:
              Use the SAME email address you just logged out from.
            </ThemedText>
            <ThemedText style={styles.instructions}>
              4️⃣ Check customizations:
              Go to &quot;My Customizations&quot;. Your saved design should appear!
            </ThemedText>
          </View>

          <ThemedText style={styles.sectionTitle}>What's Being Restored?</ThemedText>
          <View style={[styles.featureBox, { backgroundColor: card }]}>
            <ThemedText>✅ Customizations (3D designs)</ThemedText>
            <ThemedText>✅ User Profile (name, email, phone, etc.)</ThemedText>
            <ThemedText>📋 Measurements (future)</ThemedText>
            <ThemedText>📋 Orders (future)</ThemedText>
          </View>

          <ThemedText style={styles.sectionTitle}>Technical Details</ThemedText>
          <View style={[styles.techBox, { backgroundColor: card }]}>
            <ThemedText style={styles.techText}>
              Storage Keys by User:
              {'\n'}• customizations_{'${userId}'}
              {'\n'}• measurements_{'${userId}'}
              {'\n'}• orders_{'${userId}'}
            </ThemedText>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </ThemedView>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 40, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerSpacer: { width: 84 },
  headerTitle: { flex: 1, color: '#fff', fontWeight: '700', fontSize: 18, textAlign: 'center' },
  scroll: { padding: 16, paddingBottom: 80 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: 20, marginBottom: 10 },
  infoBox: { borderRadius: 8, padding: 12, marginBottom: 16 },
  instructionsBox: { borderRadius: 8, padding: 12, marginBottom: 16 },
  instructions: { marginBottom: 12, lineHeight: 20 },
  featureBox: { borderRadius: 8, padding: 12, marginBottom: 16 },
  techBox: { borderRadius: 8, padding: 12, marginBottom: 16 },
  techText: { fontSize: 12, lineHeight: 18, fontFamily: 'monospace' },
});
