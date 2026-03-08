import { Slot } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

export default function TailorLayout() {
  return (
    <View style={styles.container}>
      <Slot />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: Platform.select({ ios: 64, android: 36, default: 36 }) },
});
