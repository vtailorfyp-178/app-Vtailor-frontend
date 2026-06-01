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
import { Ionicons } from '@expo/vector-icons';
import { fetchOrCreateStreamChannel } from '@/services/streamChatService';
import { getNearbyTailors, type NearbyTailor } from '@/services/tailorsApi';
import { searchUsers, type UserSearchResult } from '@/services/usersApi';

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

const DEMO_TAILORS: NearbyTailor[] = [
  {
    user_id: 'demo_tailor_1',
    name: 'Ustad Imran Darzi',
    email: 'imran.darzi@demo.vtailor',
    shop_name: 'Imran Fashion House',
    address: 'Gulberg III, Lahore',
    bio: 'Expert in bridal and formal wear with 15+ years experience.',
    working_hours: 'Mon–Sat: 10am – 8pm',
    phone: '+923001234567',
    avatar: null,
    specialization: ['Bridal', 'Formal', 'Sherwani'],
    experience: '15 years',
    rating: 4.8,
    review_count: 124,
    price_from: 2500,
    price_to: 15000,
    is_available: true,
    location: { latitude: 31.5204, longitude: 74.3587 },
    distance_km: 1.2,
  },
  {
    user_id: 'demo_tailor_2',
    name: 'Nasreen Khayyat',
    email: 'nasreen.khayyat@demo.vtailor',
    shop_name: 'Nasreen Boutique',
    address: 'Model Town, Lahore',
    bio: 'Specialising in ladies suits, lehengas, and party wear.',
    working_hours: 'Mon–Sun: 11am – 9pm',
    phone: '+923211234567',
    avatar: null,
    specialization: ['Ladies Suits', 'Party Wear', 'Lehenga'],
    experience: '10 years',
    rating: 4.6,
    review_count: 87,
    price_from: 1800,
    price_to: 9000,
    is_available: true,
    location: { latitude: 31.4840, longitude: 74.3292 },
    distance_km: 2.4,
  },
  {
    user_id: 'demo_tailor_3',
    name: 'Ali Hassan Tailor',
    email: 'ali.hassan@demo.vtailor',
    shop_name: 'Hassan Tailors',
    address: 'DHA Phase 5, Lahore',
    bio: 'Gents specialist — suits, shalwar kameez, and western formals.',
    working_hours: 'Mon–Sat: 9am – 7pm',
    phone: '+923451234567',
    avatar: null,
    specialization: ['Gents Suits', 'Shalwar Kameez', 'Formals'],
    experience: '8 years',
    rating: 4.4,
    review_count: 63,
    price_from: 1200,
    price_to: 6000,
    is_available: false,
    location: { latitude: 31.4713, longitude: 74.4049 },
    distance_km: 3.1,
  },
  {
    user_id: 'demo_tailor_4',
    name: 'Rabia Mirza',
    email: 'rabia.mirza@demo.vtailor',
    shop_name: 'Rabia Couture',
    address: 'Johar Town, Lahore',
    bio: 'Premium bridal and couture designer with unique embroidery work.',
    working_hours: 'Tue–Sun: 10am – 8pm',
    phone: '+923311234567',
    avatar: null,
    specialization: ['Bridal', 'Couture', 'Embroidery'],
    experience: '12 years',
    rating: 4.9,
    review_count: 201,
    price_from: 5000,
    price_to: 35000,
    is_available: true,
    location: { latitude: 31.4677, longitude: 74.2699 },
    distance_km: 4.5,
  },
  {
    user_id: 'demo_tailor_5',
    name: 'Tariq Budget Tailors',
    email: 'tariq.bunai@demo.vtailor',
    shop_name: 'Tariq Tailors',
    address: 'Badami Bagh, Lahore',
    bio: 'Affordable stitching for all occasions. Alterations available.',
    working_hours: 'Mon–Sat: 8am – 6pm',
    phone: '+923561234567',
    avatar: null,
    specialization: ['Alterations', 'Budget', 'Traditional'],
    experience: '20 years',
    rating: 4.1,
    review_count: 310,
    price_from: 500,
    price_to: 2500,
    is_available: true,
    location: { latitude: 31.5765, longitude: 74.3249 },
    distance_km: 5.8,
  },
];

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
  const [dbTailors, setDbTailors] = useState<UserSearchResult[]>([]);
  const [dbLoading, setDbLoading] = useState(false);

  const displayTailors = useMemo(() => {
    if (tailors.length > 0) return tailors;
    if (!query.trim()) return DEMO_TAILORS;
    const q = query.toLowerCase();
    return DEMO_TAILORS.filter(
      (t) => t.name.toLowerCase().includes(q) || t.specialization.some((s) => s.toLowerCase().includes(q))
    );
  }, [tailors, query]);

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
      const results = data.results || [];
      setTailors(results);
      // Always fetch all registered DB tailors for the scroll-down section
      if (token) {
        setDbLoading(true);
        searchUsers(token, query, 'tailor', 50)
          .then(setDbTailors)
          .catch(() => setDbTailors([]))
          .finally(() => setDbLoading(false));
      }
    } catch {
      setErrorText('Unable to load nearby tailors. Showing all tailors from database.');
      // On error, still try DB search
      if (token) {
        setDbLoading(true);
        searchUsers(token, query, 'tailor', 50)
          .then(setDbTailors)
          .catch(() => setDbTailors([]))
          .finally(() => setDbLoading(false));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, priceRange, specialty, minRating, availability, query, sortBy]);

  useEffect(() => {
    loadTailors();
  }, [loadTailors]);

  // DB search when user types (query debounce handled by useCallback dep)
  useEffect(() => {
    if (!token) return;
    setDbLoading(true);
    searchUsers(token, query, 'tailor', 50)
      .then(setDbTailors)
      .catch(() => setDbTailors([]))
      .finally(() => setDbLoading(false));
  }, [query, token]);

  const onMessagePressDb = async (tailor: UserSearchResult) => {
    if (!token || !userId) return;
    try {
      const channel = await fetchOrCreateStreamChannel(token, tailor.user_id, userId);
      router.push({
        pathname: '/customer/chat-conversation',
        params: {
          stream_channel_id: channel.channel_id,
          stream_cid: channel.cid,
          id: channel.channel_id,
          otherUserId: tailor.user_id,
          otherUserName: tailor.name || 'Tailor',
          otherUserEmail: tailor.email || '',
          otherUserPhone: tailor.phone || '',
        },
      });
    } catch {
      router.push({
        pathname: '/customer/chat-conversation',
        params: {
          tailorId: tailor.user_id,
          id: `real-${tailor.user_id}`,
          otherUserId: tailor.user_id,
          otherUserName: tailor.name || 'Tailor',
          otherUserEmail: tailor.email || '',
          otherUserPhone: tailor.phone || '',
        },
      });
    }
  };

  const onMessagePress = async (tailor: NearbyTailor) => {
    if (!token || !userId) return;

    if (tailor.user_id.startsWith('demo_')) {
      router.push({
        pathname: '/customer/chat-conversation',
        params: {
          id: `demo-${tailor.user_id}`,
          otherUserId: tailor.user_id,
          otherUserName: tailor.name,
          otherUserEmail: tailor.email || '',
          otherUserPhone: tailor.phone || '',
        },
      });
      return;
    }

    try {
      const channel = await fetchOrCreateStreamChannel(token, tailor.user_id, userId);
      router.push({
        pathname: '/customer/chat-conversation',
        params: {
          stream_channel_id: channel.channel_id,
          stream_cid: channel.cid,
          id: channel.channel_id,
          otherUserId: tailor.user_id,
          otherUserName: tailor.name,
          otherUserEmail: tailor.email || '',
          otherUserPhone: tailor.phone || '',
        },
      });
    } catch {
      // Fallback: navigate with tailorId so chat-conversation can create the channel directly
      router.push({
        pathname: '/customer/chat-conversation',
        params: {
          tailorId: tailor.user_id,
          otherUserId: tailor.user_id,
          otherUserName: tailor.name,
          otherUserEmail: tailor.email || '',
          otherUserPhone: tailor.phone || '',
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
        <Pressable
          style={[styles.actionBtn, { borderColor: inputBorder }]}
          onPress={() =>
            (router as any).push({
              pathname: '/customer/tailor/[id]',
              params: {
                id: item.user_id,
                name: item.name,
                address: item.address || '',
                specialization: (item.specialization || []).join(','),
                rating: String(item.rating),
                reviews: String(item.review_count),
                distance: `${item.distance_km?.toFixed?.(1) || '0.0'} km`,
                isAvailable: String(item.is_available),
              },
            })
          }
        >
          <ThemedText style={styles.actionText}>View</ThemedText>
        </Pressable>
        <Pressable
          style={[styles.actionBtn, { borderColor: tint }]}
          onPress={() =>
            (router as any).push({
              pathname: '/customer/place-order',
              params: {
                tailorId:       item.user_id,
                tailorName:     item.name,
                specialization: (item.specialization || []).join(','),
                rating:         String(item.rating),
                priceFrom:      String(item.price_from || ''),
                priceTo:        String(item.price_to || ''),
              },
            })
          }
        >
          <ThemedText style={[styles.actionText, { color: tint }]}>Order</ThemedText>
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
          data={displayTailors}
          keyExtractor={(item) => item.user_id}
          renderItem={renderTailorCard}
          ListHeaderComponent={
            displayTailors.length > 0 ? (
              <View style={styles.listHeader}>
                <ThemedText style={styles.listTitle}>
                  {tailors.length > 0 ? 'Nearby tailors' : 'Featured tailors'}
                </ThemedText>
                <ThemedText style={{ color: muted, fontSize: 12 }}>
                  {displayTailors.length} result{displayTailors.length === 1 ? '' : 's'}
                </ThemedText>
              </View>
            ) : null
          }
          ListFooterComponent={
            <View style={[styles.dbSectionHeader, { borderColor: inputBorder, marginTop: 8 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="people-circle-outline" size={16} color={tint} />
                <ThemedText style={[styles.dbSectionTitle, { color: tint }]}>
                  {query ? `Matching "${query}" in database` : 'All registered tailors'}
                </ThemedText>
                {dbLoading && <ActivityIndicator size="small" color={tint} style={{ marginLeft: 6 }} />}
              </View>
              {!dbLoading && dbTailors.length === 0 && (
                <ThemedText style={{ color: muted, fontSize: 13, paddingTop: 8, paddingBottom: 12 }}>
                  No registered tailor accounts found yet.
                </ThemedText>
              )}
              {dbTailors.map((tailor) => (
                <View
                  key={tailor.user_id}
                  style={[styles.dbCard, { backgroundColor: card, borderColor: inputBorder }]}
                >
                  <View style={[styles.dbAvatar, { backgroundColor: `${tint}22` }]}>
                    <ThemedText style={[styles.dbAvatarText, { color: tint }]}>
                      {initials(tailor.name || tailor.email || '?')}
                    </ThemedText>
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={{ fontWeight: '700', fontSize: 14 }}>
                      {tailor.name || '(No name)'}
                    </ThemedText>
                    <ThemedText style={{ color: muted, fontSize: 12 }} numberOfLines={1}>
                      {tailor.email || tailor.phone || tailor.user_id}
                    </ThemedText>
                    {tailor.specialization.length > 0 && (
                      <ThemedText style={{ color: tint, fontSize: 12 }} numberOfLines={1}>
                        {tailor.specialization.join(' • ')}
                      </ThemedText>
                    )}
                  </View>
                  <Pressable
                    style={[styles.msgBtn, { backgroundColor: tint }]}
                    onPress={() => onMessagePressDb(tailor)}
                  >
                    <Ionicons name="chatbubble-ellipses-outline" size={16} color="#fff" />
                  </Pressable>
                </View>
              ))}
            </View>
          }
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 24 }}
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
  dbSectionHeader: {
    flexDirection: 'column',
    paddingHorizontal: 8,
    paddingTop: 16,
    paddingBottom: 10,
    borderTopWidth: 1,
  },
  dbSectionTitle: { fontSize: 13, fontWeight: '700', flex: 1 },
  dbCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginHorizontal: 12,
    marginBottom: 12,
  },
  actionBtnFilled: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionText: { fontWeight: '700' },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 10,
  },
  listTitle: { fontWeight: '700', fontSize: 15 },
  dbAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  dbAvatarText: { fontWeight: '700', fontSize: 14 },
  msgBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
