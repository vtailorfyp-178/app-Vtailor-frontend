import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import BottomTabBar from '@/components/BottomTabBar';
import { ThemedText } from '@/components/themed-text';

const TailorDashboard = () => {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <ProtectedRoute requiredRole="tailor">
      <View style={{ flex: 1 }}>
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

export default TailorDashboard;
