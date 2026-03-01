import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './themed-text';

type Props = { available: boolean };

export default function AvailabilityBadge({ available }: Props) {
  return (
    <View style={styles.row}>
      <Ionicons name={available ? 'checkmark-circle' : 'close-circle'} size={20} color={available ? '#059669' : '#dc2626'} />
      <ThemedText style={{ marginLeft: 8 }}>{available ? 'Available Now' : 'Not Available'}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', marginTop: 8 } });
