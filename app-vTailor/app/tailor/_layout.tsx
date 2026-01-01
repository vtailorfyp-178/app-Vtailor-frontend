import React from 'react';
import { Slot } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import BottomTabBar, { TAB_BAR_HEIGHT } from '@/components/BottomTabBar';

export default function TailorLayout() {
  return (
    <View style={[styles.container, { paddingBottom: TAB_BAR_HEIGHT }]}>
      <Slot />
      <BottomTabBar basePath="tailor" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
