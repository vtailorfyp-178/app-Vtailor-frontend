import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/contexts/AuthContext';
import { Conversations, setAuthToken } from '@/services/conversationApi';
import { getNearbyTailors, type NearbyTailor } from '@/services/tailorsApi';

type SortMode = 'distance' | 'rating' | 'reviews';
type PriceRange = 'all' | 'budget' | 'mid' | 'premium';
type RatingFilter = 'all' | '4.0' | '4.5';
type AvailabilityFilter = 'all' | 'open';

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

function priceBounds(range: PriceRange): { min?: number; max?: number } {
  if (range === 'budget') return { max: 1500 };
  if (range === 'mid') return { min: 1500, max: 3500 };
  if (range === 'premium') return { min: 3500 };
  return {};
}

export default function FindTailorsWebScreen() {
  const router = useRouter();
  const { token, userId } = useAuth();

  const tint = useThemeColor({}, 'tint');
  const card = useThemeColor({}, 'card');
  const inputBorder = useThemeColor({}, 'inputBorder');
  const muted = useThemeColor({}, 'muted');
  const text = useThemeColor({}, 'text');

  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortMode>('distance');
  const [priceRange, setPriceRange] = useState<PriceRange>('all');
  const [minRating, setMinRating] = useState<RatingFilter>('all');
  const [availability, setAvailability] = useState<AvailabilityFilter>('all');
  const [specialty, setSpecialty] = useState<string>('all');
  const [tailors, setTailors] = useState<NearbyTailor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const specialtyOptions = useMemo(() => {
    const set = new Set<string>();
    for (const tailor of tailors) {
      for (const item of tailor.specialization || []) {
        if (item) set.add(item);
      }
    }
    return ['all', ...Array.from(set).slice(0, 10)];
  }, [tailors]);

  const loadTailors = useCallback(async (isRefresh = false) => {
    if (!token) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      setErrorText(null);
      const bounds = priceBounds(priceRange);
      const data = await getNearbyTailors({
        token,
        latitude: 24.8607,
        longitude: 67.0011,
        radiusKm: 10,
        specialty: specialty !== 'all' ? specialty : undefined,
        priceMin: bounds.min,
        priceMax: bounds.max,
        minRating: minRating === 'all' ? undefined : Number(minRating),
        availability: availability === 'open' ? true : undefined,
        queryText: query,
        sortBy,
        limit: 80,
      });
      setTailors(data.results || []);
    } catch {
      setErrorText('Unable to load nearby tailors right now.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, priceRange, specialty, minRating, availability, query, sortBy]);

  useEffect(() => {
    loadTailors();
  }, [loadTailors]);

  const onMessagePress = async (tailor: NearbyTailor) => {
    if (!token || !userId) return;

    try {
      setAuthToken(token);
      const conversation = await Conversations.getOrCreate(tailor.user_id, userId);
      router.push({
        pathname: '/customer/chat-conversation',
        params: {
          conversation_id: conversation.conversation_id,
          id: conversation.conversation_id,
          otherUserId: tailor.user_id,
          otherUserName: tailor.name,
          otherUserAvatar: tailor.avatar || initials(tailor.name),
        },
      });
    } catch {
      router.push({
        pathname: '/customer/chat-conversation',
        params: {
          tailorId: tailor.user_id,
          otherUserId: tailor.user_id,
          otherUserName: tailor.name,
          otherUserAvatar: tailor.avatar || initials(tailor.name),
          demo: '1',
        },
      });
    }
  };

  const renderFilterChip = (label: string, active: boolean, onPress: () => void, narrow = false) => (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          borderColor: active ? tint : inputBorder,
          backgroundColor: active ? `${tint}22` : card,
          minWidth: narrow ? 70 : 96,
        },
      ]}
    >
      <ThemedText style={{ color: active ? text : muted, fontWeight: active ? '700' : '500', fontSize: 12 }}>
        {label}
      </ThemedText>
    </Pressable>
  );

  const renderTailorCard = ({ item }: { item: NearbyTailor }) => (
    <View style={[styles.tailorCard, { backgroundColor: card, borderColor: inputBorder }]}> 
      <View style={styles.cardTopRow}>
        <View style={styles.avatarWrap}>
          {item.avatar && item.avatar.startsWith('http') ? (
            <Image source={{ uri: item.avatar }} style={styles.avatarImage} />
          ) : (
            <ThemedText style={styles.avatarText}>{initials(item.name)}</ThemedText>
          )}
          <View style={[styles.presenceDot, { backgroundColor: item.is_available ? '#16a34a' : '#9ca3af' }]} />
        </View>
        <View style={{ flex: 1 }}>
          <ThemedText numberOfLines={1} style={styles.tailorName}>{item.name}</ThemedText>
          <ThemedText numberOfLines={1} style={{ color: muted, fontSize: 12 }}>
            {(item.specialization || []).join(' • ') || 'General tailoring'}
          </ThemedText>
        </View>
      </View>

      <View style={styles.metaRow}>
        <ThemedText style={styles.metaText}>Rating {item.rating.toFixed(1)}</ThemedText>
        <ThemedText style={styles.metaText}>{item.review_count} reviews</ThemedText>
      </View>

      <View style={styles.metaRow}>
        <ThemedText style={styles.metaText}>Rs {item.price_from} - {item.price_to}</ThemedText>
        <ThemedText style={[styles.metaText, { color: item.is_available ? '#15803d' : '#6b7280' }]}>
          {item.is_available ? 'Open now' : 'Closed'}
        </ThemedText>
      </View>

      <View style={styles.actionsRow}>
        <Pressable style={[styles.actionBtn, { borderColor: inputBorder }]} onPress={() => (router as any).push(`/customer/tailor/${item.user_id}`)}>
          <ThemedText style={styles.actionText}>View</ThemedText>
        </Pressable>
        <Pressable style={[styles.actionBtnFilled, { backgroundColor: tint }]} onPress={() => onMessagePress(item)}>
          <ThemedText style={[styles.actionText, { color: '#fff' }]}>Message</ThemedText>
        </Pressable>
      </View>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { backgroundColor: tint }]}> 
        <Pressable onPress={() => (router as any).back()}><ThemedText style={{ color: '#fff' }}>{'< Back'}</ThemedText></Pressable>
        <ThemedText style={styles.headerTitle}>Find Tailors Nearby</ThemedText>
        <View style={{ width: 56 }} />
      </View>

      <View style={[styles.searchWrap, { backgroundColor: card, borderColor: inputBorder }]}> 
        <TextInput placeholder="Search tailor name or specialty" value={query} onChangeText={setQuery} style={[styles.searchInput, { color: text }]} placeholderTextColor={muted} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
        {renderFilterChip('List', true, () => {}, true)}
        {renderFilterChip('Distance', sortBy === 'distance', () => setSortBy('distance'))}
        {renderFilterChip('Rating', sortBy === 'rating', () => setSortBy('rating'))}
        {renderFilterChip('Reviews', sortBy === 'reviews', () => setSortBy('reviews'))}
        {renderFilterChip('All', specialty === 'all', () => setSpecialty('all'), true)}
        {specialtyOptions.filter((item) => item !== 'all').slice(0, 5).map((item) => renderFilterChip(item, specialty === item, () => setSpecialty(item)))}
        {renderFilterChip('Any price', priceRange === 'all', () => setPriceRange('all'))}
        {renderFilterChip('Budget', priceRange === 'budget', () => setPriceRange('budget'))}
        {renderFilterChip('Mid', priceRange === 'mid', () => setPriceRange('mid'), true)}
        {renderFilterChip('Premium', priceRange === 'premium', () => setPriceRange('premium'))}
        {renderFilterChip('Any rating', minRating === 'all', () => setMinRating('all'))}
        {renderFilterChip('4.0+', minRating === '4.0', () => setMinRating('4.0'), true)}
        {renderFilterChip('4.5+', minRating === '4.5', () => setMinRating('4.5'), true)}
        {renderFilterChip('All status', availability === 'all', () => setAvailability('all'))}
        {renderFilterChip('Open only', availability === 'open', () => setAvailability('open'))}
      </ScrollView>

      {loading && (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={tint} />
        </View>
      )}

      {!loading && errorText && (
        <View style={styles.loadingWrap}>
          <ThemedText style={{ color: muted, textAlign: 'center' }}>{errorText}</ThemedText>
        </View>
      )}

      {!loading && !errorText && (
        <FlatList
          data={tailors}
          keyExtractor={(item) => item.user_id}
          renderItem={renderTailorCard}
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 16 }}
          onRefresh={() => loadTailors(true)}
          refreshing={refreshing}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 40,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { color: '#fff', fontWeight: '700' },
  searchWrap: { marginHorizontal: 12, marginTop: 12, borderRadius: 12, borderWidth: 1, padding: 8 },
  searchInput: { height: 44, paddingHorizontal: 8 },
  chipsRow: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 8,
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  tailorCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    position: 'relative',
  },
  avatarImage: { width: 44, height: 44, borderRadius: 22 },
  avatarText: { fontWeight: '800', fontSize: 14, color: '#111827' },
  presenceDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#fff',
    position: 'absolute',
    right: -1,
    bottom: -1,
  },
  tailorName: { fontWeight: '700', fontSize: 14, marginBottom: 2 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  metaText: { fontSize: 12, color: '#6b7280' },
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
  actionText: { fontWeight: '700' },
});
