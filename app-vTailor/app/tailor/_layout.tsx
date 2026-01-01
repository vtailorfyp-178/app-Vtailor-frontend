import React from 'react';
import { Slot } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import BottomTabBar from '@/components/BottomTabBar';

export default function TailorLayout() {
  return (
    <View style={styles.container}>
      <Slot />
      <BottomTabBar basePath="tailor" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
