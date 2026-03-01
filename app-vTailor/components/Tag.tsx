import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from './themed-text';

type Props = { label: string };

export default function Tag({ label }: Props) {
  return (
    <View style={styles.tag}>
      <ThemedText style={{ color: '#fff', fontSize: 12 }}>{label}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginRight: 8, marginBottom: 8, backgroundColor: '#2563eb' },
});
