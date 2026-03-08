import React, { useMemo, useState } from 'react';
import { View, ScrollView, TextInput, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

type Tailor = {
  id: number;
  name: string;
  rating: number;
  reviews: number;
  experience: number;
  distance: string;
  specialization: string[];
  avatar: string;
  isAvailable: boolean;
};

const ALL: Tailor[] = [
  { id: 1, name: 'Ahmad Master Tailor', rating: 4.9, reviews: 156, experience: 15, distance: '0.8 km', specialization: ['Formal', 'Wedding'], avatar: '👨‍🔧', isAvailable: true },
  { id: 2, name: 'Karachi Tailoring House', rating: 4.7, reviews: 89, experience: 10, distance: '1.2 km', specialization: ['Casual'], avatar: '🧵', isAvailable: true },
  { id: 3, name: 'Classic Stitchers', rating: 4.8, reviews: 210, experience: 20, distance: '2.5 km', specialization: ['Traditional'], avatar: '✂️', isAvailable: false },
];

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
      <View style={[styles.header, { backgroundColor: tint }]}> 
        <Pressable onPress={() => (router as any).back()}><ThemedText style={{ color: '#fff' }}>{'< Back'}</ThemedText></Pressable>
        <ThemedText style={styles.headerTitle}>Find Tailors</ThemedText>
        <View style={{ width: 56 }} />
      </View>

      <View style={[styles.searchWrap, { backgroundColor: card, borderColor: inputBorder }]}> 
        <TextInput placeholder="Search tailors..." value={query} onChangeText={setQuery} style={styles.searchInput} placeholderTextColor={muted} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 12 }}>
        {tailors.map((t) => (
          <View key={t.id} style={[styles.card, { backgroundColor: card, borderColor: inputBorder }]}> 
            <Pressable onPress={() => (router as any).push(`/customer/tailor/${t.id}`)}>
              <ThemedText style={{ fontWeight: '700' }}>{t.name}</ThemedText>
              <ThemedText style={{ color: muted }}>{t.specialization.join(', ')}</ThemedText>
              <ThemedText style={{ marginTop: 6 }}>{t.distance} • {t.experience}+ yrs</ThemedText>
            </Pressable>

            <View style={styles.actionsRow}>
              <Pressable
                style={[styles.actionBtn, { borderColor: inputBorder }]}
                onPress={() => (router as any).push(`/customer/tailor/${t.id}`)}
              >
                <ThemedText style={styles.actionText}>View Profile</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.actionBtnFilled, { backgroundColor: tint }]}
                onPress={() => (router as any).push({ pathname: '/customer/chat', params: { tailorId: t.id, tailorName: t.name } })}
              >
                <ThemedText style={[styles.actionText, { color: '#fff' }]}>Chat</ThemedText>
              </Pressable>
            </View>
          </View>
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
