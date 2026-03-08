import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import BottomTabBar, { TAB_BAR_HEIGHT } from '@/components/BottomTabBar';
import { ThemedText } from '@/components/themed-text';

const TailorDashboard = () => {
  const [, setActiveTab] = useState('home');

  return (
    <ProtectedRoute requiredRole="tailor">
      <View style={{ flex: 1, paddingBottom: TAB_BAR_HEIGHT }}>
        <View style={styles.container}>
          <ThemedText style={styles.title}>Tailor Dashboard</ThemedText>
          <ThemedText style={styles.subtitle}>Coming Soon!</ThemedText>
        </View>
        <BottomTabBar basePath="tailor" onTabChange={setActiveTab} />
      </View>
    </ProtectedRoute>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
});

// Do not default-export this component to avoid creating an automatic route.
// This file remains for reference; the actual route is `app/tailor/index.tsx`.
// Keep this file for reference only — do not export as default to avoid duplicate route.
export const TailorDashboardComponent = TailorDashboard;
