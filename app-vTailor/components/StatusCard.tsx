import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { ThemedText } from './themed-text';

type Props = { type: 'sending' | 'accepted' | 'declined' | 'empty'; message?: string; onPrimary?: () => void; primaryLabel?: string };

export default function StatusCard({ type, message, onPrimary, primaryLabel }: Props) {
  if (type === 'empty') return null;

  const cfg: Record<string, { emoji: string; bg: string; border: string; label?: string }> = {
    sending: { emoji: '⏳', bg: '#fffbeb', border: '#b45309', label: 'Request Sending...' },
    accepted: { emoji: '✅', bg: '#ecfdf5', border: '#059669', label: 'Request Accepted!' },
    declined: { emoji: '❌', bg: '#fff1f2', border: '#dc2626', label: 'Request Declined' },
  };

  const c = cfg[type];

  return (
    <View style={[styles.card, { backgroundColor: c.bg, borderColor: c.border }]}> 
      <ThemedText style={{ fontSize: 40, marginBottom: 12 }}>{c.emoji}</ThemedText>
      <ThemedText style={{ fontSize: 18, fontWeight: '700', marginBottom: 8, textAlign: 'center' }}>{c.label}</ThemedText>
      {message ? <ThemedText style={styles.msg}>{message}</ThemedText> : null}
      {onPrimary ? (
        <Pressable onPress={onPrimary} style={[styles.btn, { backgroundColor: '#111827' }]}> 
          <ThemedText style={{ color: '#fff' }}>{primaryLabel || 'Proceed'}</ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 24, borderRadius: 16, borderWidth: 2, alignItems: 'center', marginBottom: 16 },
  msg: { fontSize: 14, textAlign: 'center', marginBottom: 12 },
  btn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, marginTop: 16, alignItems: 'center' },
});
