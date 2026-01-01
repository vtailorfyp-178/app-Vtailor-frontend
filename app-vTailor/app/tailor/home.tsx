import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function TailorHome() {
  const { user } = useAuth();
  const tint = useThemeColor({}, 'tint');
  const card = useThemeColor({}, 'card');

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>
      <View style={[styles.header, { backgroundColor: tint }]}> 
        <ThemedText style={styles.welcome}>Welcome back,</ThemedText>
        <ThemedText style={styles.name}>{user?.name || 'Tailor'}</ThemedText>
      </View>

      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Current Orders</ThemedText>
        <View style={[styles.card, { backgroundColor: card }]}>
          <ThemedText>Order list placeholder</ThemedText>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 120 },
  header: { paddingTop: 40, padding: 16 },
  welcome: { color: '#fff', opacity: 0.9 },
  name: { color: '#fff', fontWeight: '700', fontSize: 20 },
  section: { padding: 16 },
  sectionTitle: { fontWeight: '700', marginBottom: 8 },
  card: { padding: 12, borderRadius: 12 },
});
