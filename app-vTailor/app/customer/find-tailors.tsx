import React, { useMemo, useState } from 'react';
import { View, ScrollView, TextInput, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Tailor, ALL } from '@/constants/tailors';
import { TailorCard, SearchBar, HeaderBar } from '@/components';
// tailors data imported from constants/tailors

export default function FindTailors() {
  const router = useRouter();
  const tint = useThemeColor({}, 'tint');
  const card = useThemeColor({}, 'card');
  const inputBorder = useThemeColor({}, 'inputBorder');
  const muted = useThemeColor({}, 'muted');

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'nearby' | 'top-rated'>('all');

  const tailors = useMemo(() => ALL.filter((t) => {
    if (query && !t.name.toLowerCase().includes(query.toLowerCase())) return false;
    if (filter === 'nearby') return parseFloat(t.distance) <= 2;
    if (filter === 'top-rated') return t.rating >= 4.8;
    return true;
  }), [query, filter]);

  return (
    <ThemedView style={styles.container}>
      <HeaderBar title="Find Tailors" onBack={() => (router as any).back()} />

      <SearchBar value={query} onChange={setQuery} placeholder="Search tailors..." />

      <ScrollView contentContainerStyle={{ padding: 12 }}>
        {tailors.map((t) => (
          <TailorCard
            key={t.id}
            tailor={t}
            onPress={() => (router as any).push({ pathname: '/customer/Tailor[id]', params: { id: t.id } })}
            onChat={() => (router as any).push({ pathname: '/customer/chat', params: { tailorId: t.id, tailorName: t.name } })}
          />
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 40, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { color: '#fff', fontWeight: '700' },
  searchWrap: { margin: 12, borderRadius: 12, borderWidth: 1, padding: 8 },
  searchInput: { height: 44, paddingHorizontal: 8 },
  card: { padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  actionsRow: { flexDirection: 'row', marginTop: 12, gap: 8 },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionBtnFilled: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionText: { fontWeight: '600' },
});
