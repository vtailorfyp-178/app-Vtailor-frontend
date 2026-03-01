import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { ThemedText } from './themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

type Props = {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  right?: React.ReactNode;
};

export default function HeaderBar({ title, showBack = true, onBack, right }: Props) {
  const tint = useThemeColor({}, 'tint');

  return (
    <View style={[styles.header, { backgroundColor: tint }]}> 
      {showBack ? (
        <Pressable onPress={onBack} style={styles.side}>
          <ThemedText style={{ color: '#fff' }}>{'< Back'}</ThemedText>
        </Pressable>
      ) : <View style={styles.side} />}

      <ThemedText style={styles.title}>{title}</ThemedText>
      <View style={styles.side}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 40, padding: 16, flexDirection: 'row', alignItems: 'Center', justifyContent: 'space-between' },
  title: { color: '#fff', fontWeight: '700' },
  side: { width: 56 },
});
