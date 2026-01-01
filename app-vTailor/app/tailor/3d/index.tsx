import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ThemedText } from '@/components/themed-text';
import { useRouter, useLocalSearchParams } from 'expo-router';

// Placeholder: route moved to ../3d.tsx
export const Tailor3DIndexPlaceholder = true;

const styles = StyleSheet.create({
  wrapper: { padding: 16, paddingBottom: 120 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  card: { padding: 12, borderRadius: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb' },
  small: { color: '#6b7280', marginBottom: 8 },
  button: { marginTop: 12, backgroundColor: '#111827', padding: 10, borderRadius: 8 },
  buttonText: { color: '#fff', fontWeight: '700' },
});
