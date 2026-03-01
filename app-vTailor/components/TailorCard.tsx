import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { ThemedText } from './themed-text';
import Tag from './Tag';
import { Tailor as TailorType } from '@/constants/tailors';
import { useThemeColor } from '@/hooks/use-theme-color';

type Props = { tailor: TailorType; onPress?: () => void; onChat?: () => void };

export default function TailorCard({ tailor, onPress, onChat }: Props) {
  const card = useThemeColor({}, 'card');
  const inputBorder = useThemeColor({}, 'inputBorder');
  const muted = useThemeColor({}, 'muted');

  return (
    <View style={[styles.card, { backgroundColor: card, borderColor: inputBorder }]}> 
      <Pressable onPress={onPress}>
        <ThemedText style={{ fontWeight: '700' }}>{tailor.name}</ThemedText>
        <ThemedText style={{ color: muted }}>{tailor.specialization.join(', ')}</ThemedText>
        <ThemedText style={{ marginTop: 6 }}>{tailor.distance} • {tailor.experience}+ yrs</ThemedText>
      </Pressable>

      <View style={styles.actionsRow}>
        <Pressable style={[styles.actionBtn, { borderColor: inputBorder }]} onPress={onPress}>
          <ThemedText style={styles.actionText}>View Profile</ThemedText>
        </Pressable>
        <Pressable style={[styles.actionBtnFilled, { backgroundColor: useThemeColor({}, 'tint') }]} onPress={onChat}>
          <ThemedText style={[styles.actionText, { color: '#fff' }]}>Chat</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  actionsRow: { flexDirection: 'row', marginTop: 12, gap: 8 },
  actionBtn: { flex: 1, paddingVertical: 10, borderWidth: 1, borderRadius: 10, alignItems: 'center' },
  actionBtnFilled: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  actionText: { fontWeight: '600' },
});
