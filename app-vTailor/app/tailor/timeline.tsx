import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ThemedText } from '@/components/themed-text';
import { useRouter } from 'expo-router';

export default function TailorTimeline() {
  const router = useRouter();
  return (
    <ProtectedRoute requiredRole="tailor">
      <ScrollView contentContainerStyle={styles.wrapper}>
        <ThemedText style={styles.title}>Stitching Timeline</ThemedText>
        <View style={styles.card}>
          <Text style={styles.small}>Update stitching progress for orders. Each update sends a notification to the customer.</Text>
          <Pressable style={styles.button} onPress={() => router.push('/tailor')}>
            <Text style={styles.buttonText}>Back to Home</Text>
          </Pressable>
        </View>
      </ScrollView>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  wrapper: { padding: 16, paddingBottom: 120 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  card: { padding: 12, borderRadius: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb' },
  small: { color: '#6b7280', marginBottom: 8 },
  button: { marginTop: 12, backgroundColor: '#111827', padding: 10, borderRadius: 8 },
  buttonText: { color: '#fff', fontWeight: '700' },
});
