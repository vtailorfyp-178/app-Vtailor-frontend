import { UI } from '@/constants/ui';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { ThemedText } from './themed-text';

type AppBackButtonProps = {
  label?: string;
  onPress: () => void;
  variant?: 'light' | 'tint';
};

export default function AppBackButton({ label = 'Back', onPress, variant = 'light' }: AppBackButtonProps) {
  const light = variant === 'light';

  return (
    <Pressable
      onPress={onPress}
      style={[styles.button, light ? styles.lightButton : styles.tintButton]}
      hitSlop={8}
    >
      <Ionicons name="chevron-back" size={18} color={light ? '#ec4899' : '#fff'} />
      <ThemedText style={[styles.label, { color: light ? '#ec4899' : '#fff' }]}>{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingLeft: 8,
    paddingRight: 12,
    marginRight: 10,
    borderRadius: 999,
    ...UI.softShadow,
  },
  lightButton: {
    backgroundColor: '#fff',
  },
  tintButton: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    shadowOpacity: 0,
    elevation: 0,
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
  },
});
