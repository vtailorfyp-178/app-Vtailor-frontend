import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ThemedText } from './themed-text';

type Props = { value: string; onChange: (v: string) => void; placeholder?: string };

export default function SearchBar({ value, onChange, placeholder = 'Search' }: Props) {
  const card = useThemeColor({}, 'card');
  const inputBorder = useThemeColor({}, 'inputBorder');
  const muted = useThemeColor({}, 'muted');

  return (
    <View style={[styles.wrap, { backgroundColor: card, borderColor: inputBorder }]}> 
      <TextInput placeholder={placeholder} value={value} onChangeText={onChange} style={styles.input} placeholderTextColor={muted} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { margin: 12, borderRadius: 12, borderWidth: 1, padding: 8 },
  input: { height: 44, paddingHorizontal: 8 },
});
