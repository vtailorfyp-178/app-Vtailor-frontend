import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/contexts/AuthContext';
import { Conversations, setAuthToken } from '@/services/conversationApi';
import { getNearbyTailors, type NearbyTailor } from '@/services/tailorsApi';
import MapView, { Marker } from '@/components/MapPrimitives';

type SortMode = 'distance' | 'rating' | 'reviews';
type SortFilter = SortMode | null;
type DistanceFilter = 2 | 3 | 5 | null;
type RatingFilter = 'all' | '3' | '4';

type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

function toRegion(latitude: number, longitude: number): Region {
  return {
    latitude,
    longitude,
    latitudeDelta: 0.035,
    longitudeDelta: 0.025,
  };
}

function isSameArea(a: Region, b: Region) {
  return Math.abs(a.latitude - b.latitude) < 0.0005 && Math.abs(a.longitude - b.longitude) < 0.0005;
}

const DEFAULT_REGION = toRegion(31.5204, 74.3587);
const SPECIALTY_OPTIONS = ['all', 'Formal', 'Party', 'Traditional'];

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

export default function FindTailorsNativeScreen() {
  const router = useRouter();
  const { token, userId } = useAuth();

  const tint = useThemeColor({}, 'tint');
  const card = useThemeColor({}, 'card');
  const inputBorder = useThemeColor({}, 'inputBorder');
  const muted = useThemeColor({}, 'muted');
  const text = useThemeColor({}, 'text');

  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortFilter>(null);
  const [distanceKm, setDistanceKm] = useState<DistanceFilter>(5);
  const [minRating, setMinRating] = useState<RatingFilter>('all');
  const [specialty, setSpecialty] = useState<string>('all');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draftSortBy, setDraftSortBy] = useState<SortFilter>(null);
  const [draftDistanceKm, setDraftDistanceKm] = useState<DistanceFilter>(5);
  const [draftMinRating, setDraftMinRating] = useState<RatingFilter>('all');
  const [draftSpecialty, setDraftSpecialty] = useState<string>('all');

  const [locationReady, setLocationReady] = useState(false);
  const [searchRegion, setSearchRegion] = useState<Region>(DEFAULT_REGION);
  const [tailors, setTailors] = useState<NearbyTailor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTailorId, setSelectedTailorId] = useState<string | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  const mapRef = useRef<any>(null);
  const listRef = useRef<FlatList<NearbyTailor> | null>(null);
  const focusingTailorRef = useRef(false);

  const filterSummary = useMemo(() => {
    const parts = [
      distanceKm ? `${distanceKm} km` : 'Any distance',
      minRating === 'all' ? null : `${minRating}+ rating`,
      sortBy === 'distance' ? 'Nearest' : sortBy === 'rating' ? 'Top rated' : null,
      specialty === 'all' ? null : specialty,
    ].filter(Boolean);
    return parts.join(' • ');
  }, [distanceKm, minRating, sortBy, specialty]);

  const openFilters = () => {
    setDraftDistanceKm(distanceKm);
    setDraftMinRating(minRating);
    setDraftSortBy(sortBy);
    setDraftSpecialty(specialty);
    setFiltersOpen((current) => !current);
  };

  const applyFilters = () => {
    setDistanceKm(draftDistanceKm);
    setMinRating(draftMinRating);
    setSortBy(draftSortBy);
    setSpecialty(draftSpecialty);
    setFiltersOpen(false);
  };

  const resetDraftFilters = () => {
    setDraftDistanceKm(5);
    setDraftMinRating('all');
    setDraftSortBy(null);
    setDraftSpecialty('all');
  };

  const loadTailors = useCallback(
    async (isRefresh = false) => {
      if (!token) return;
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        setErrorText(null);

        const fetchForRegion = (targetRegion: Region) =>
          getNearbyTailors({
            token,
            latitude: targetRegion.latitude,
            longitude: targetRegion.longitude,
            radiusKm: distanceKm ?? 10,
            specialty: specialty !== 'all' ? specialty : undefined,
            minRating: minRating === 'all' ? undefined : Number(minRating),
            queryText: query,
            sortBy: sortBy ?? undefined,
            limit: 80,
          });

        let data = await fetchForRegion(searchRegion);
        if ((data.results || []).length === 0 && (searchRegion.latitude !== DEFAULT_REGION.latitude || searchRegion.longitude !== DEFAULT_REGION.longitude)) {
          data = await fetchForRegion(DEFAULT_REGION);
          setSearchRegion((current) => (isSameArea(current, DEFAULT_REGION) ? current : DEFAULT_REGION));
          mapRef.current?.animateToRegion(DEFAULT_REGION, 450);
        }

        const results = data.results || [];
        setTailors(results);
        if (results.length > 0) {
          setSelectedTailorId((prev) => (prev && results.some((item) => item.user_id === prev) ? prev : results[0].user_id));
        } else {
          setSelectedTailorId(null);
        }
      } catch {
        setErrorText('Unable to load nearby tailors right now. Check your connection and try again.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, searchRegion, distanceKm, specialty, minRating, query, sortBy]
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        if (mounted) {
          setErrorText(null);
          setLocationReady(true);
        }
        return;
      }

      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      if (!mounted) return;

      const nextRegion = toRegion(current.coords.latitude, current.coords.longitude);
      setSearchRegion((current) => (isSameArea(current, nextRegion) ? current : nextRegion));
      mapRef.current?.animateToRegion(nextRegion, 450);
      setLocationReady(true);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!token) return;

    const timer = setTimeout(() => {
      loadTailors();
    }, 220);

    return () => clearTimeout(timer);
  }, [searchRegion, token, query, specialty, distanceKm, minRating, sortBy, loadTailors]);

  useEffect(() => {
    if (!token) return;
    const intervalId = setInterval(() => {
      loadTailors(true);
    }, 60000);
    return () => clearInterval(intervalId);
  }, [searchRegion, token, loadTailors]);

  const onMarkerPress = (tailor: NearbyTailor) => {
    setSelectedTailorId(tailor.user_id);
    const idx = tailors.findIndex((item) => item.user_id === tailor.user_id);
    if (idx >= 0) {
      listRef.current?.scrollToIndex({ index: idx, animated: true });
    }
    focusingTailorRef.current = true;
    mapRef.current?.animateToRegion(toRegion(tailor.location.latitude, tailor.location.longitude), 450);
    setTimeout(() => {
      focusingTailorRef.current = false;
    }, 600);
  };

  const onTailorCardPress = (tailor: NearbyTailor) => {
    setSelectedTailorId(tailor.user_id);
    focusingTailorRef.current = true;
    mapRef.current?.animateToRegion(toRegion(tailor.location.latitude, tailor.location.longitude), 450);
    setTimeout(() => {
      focusingTailorRef.current = false;
    }, 600);
  };

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
          otherUserPhone: tailor.phone || '',
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
          otherUserPhone: tailor.phone || '',
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

  const renderTailorCard = ({ item }: { item: NearbyTailor }) => {
    const selected = selectedTailorId === item.user_id;

    return (
      <Pressable
        onPress={() => onTailorCardPress(item)}
        style={[
          styles.tailorCard,
          {
            backgroundColor: card,
            borderColor: selected ? tint : inputBorder,
            borderWidth: selected ? 2 : 1,
          },
        ]}
      >
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
          <ThemedText style={styles.metaText}>{item.distance_km.toFixed(1)} km</ThemedText>
          <ThemedText style={styles.metaText}>Rating {item.rating.toFixed(1)}</ThemedText>
          <ThemedText style={styles.metaText}>{item.review_count} reviews</ThemedText>
        </View>

        <View style={styles.metaRow}>
          <ThemedText style={styles.metaText}>Rs {item.price_from} - {item.price_to}</ThemedText>
          <ThemedText style={[styles.metaText, { color: item.is_available ? '#15803d' : '#6b7280' }]}>
            {item.is_available ? 'Open now' : 'Closed'}
          </ThemedText>
        </View>

        {selected && (
          <View style={[styles.detailsBox, { borderColor: inputBorder }]}>
            <ThemedText style={[styles.detailLine, { color: text }]}>
              {item.address || 'Address not available'}
            </ThemedText>
            {item.working_hours ? (
              <ThemedText style={[styles.detailLine, { color: muted }]}>Hours: {item.working_hours}</ThemedText>
            ) : null}
            {item.bio ? (
              <ThemedText style={[styles.detailLine, { color: muted }]}>{item.bio}</ThemedText>
            ) : null}
          </View>
        )}

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
                  distance: `${item.distance_km.toFixed(1)} km`,
                  isAvailable: String(item.is_available),
                },
              })
            }
          >
            <ThemedText style={styles.actionText}>View</ThemedText>
          </Pressable>
          <Pressable
            style={[styles.actionBtnFilled, { backgroundColor: tint }]}
            onPress={() => onMessagePress(item)}
          >
            <ThemedText style={[styles.actionText, { color: '#fff' }]}>Message</ThemedText>
          </Pressable>
        </View>
      </Pressable>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { backgroundColor: tint }]}> 
        <Pressable onPress={() => (router as any).back()}><ThemedText style={{ color: '#fff' }}>{'< Back'}</ThemedText></Pressable>
        <ThemedText style={styles.headerTitle}>Find Tailors Nearby</ThemedText>
        <View style={{ width: 56 }} />
      </View>

      <View style={[styles.searchWrap, { backgroundColor: card, borderColor: inputBorder }]}> 
        <TextInput
          placeholder="Search tailor name or specialty"
          value={query}
          onChangeText={setQuery}
          style={[styles.searchInput, { color: text }]}
          placeholderTextColor={muted}
        />
      </View>

      <View style={[styles.filtersPanel, { backgroundColor: card, borderColor: inputBorder }]}>
        <Pressable onPress={openFilters} style={styles.filterDropdownHeader}>
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.filterTitle}>Filters</ThemedText>
            <ThemedText numberOfLines={1} style={{ color: muted, fontSize: 12, marginTop: 2 }}>
              {filterSummary}
            </ThemedText>
          </View>
          <ThemedText style={[styles.clearFilters, { color: tint }]}>{filtersOpen ? 'Close' : 'Open'}</ThemedText>
        </Pressable>

        {filtersOpen && (
          <View style={styles.dropdownBody}>
            <View style={styles.filterGroup}>
              <ThemedText style={[styles.filterLabel, { color: muted }]}>Distance</ThemedText>
              <View style={styles.chipsRow}>
                {renderFilterChip('Nearest', draftSortBy === 'distance', () => setDraftSortBy((current) => (current === 'distance' ? null : 'distance')))}
                {renderFilterChip('2 km', draftDistanceKm === 2, () => setDraftDistanceKm((current) => (current === 2 ? null : 2)), true)}
                {renderFilterChip('3 km', draftDistanceKm === 3, () => setDraftDistanceKm((current) => (current === 3 ? null : 3)), true)}
                {renderFilterChip('5 km', draftDistanceKm === 5, () => setDraftDistanceKm((current) => (current === 5 ? null : 5)), true)}
              </View>
            </View>

            <View style={styles.filterGroup}>
              <ThemedText style={[styles.filterLabel, { color: muted }]}>Rating</ThemedText>
              <View style={styles.chipsRow}>
                {renderFilterChip('3+', draftMinRating === '3', () => setDraftMinRating((current) => (current === '3' ? 'all' : '3')), true)}
                {renderFilterChip('4+', draftMinRating === '4', () => setDraftMinRating((current) => (current === '4' ? 'all' : '4')), true)}
                {renderFilterChip('Top rated', draftSortBy === 'rating', () => setDraftSortBy((current) => (current === 'rating' ? null : 'rating')))}
              </View>
            </View>

            <View style={styles.filterGroup}>
              <ThemedText style={[styles.filterLabel, { color: muted }]}>Specialty</ThemedText>
              <View style={styles.chipsRow}>
                {SPECIALTY_OPTIONS.map((item) =>
                  renderFilterChip(
                    item === 'all' ? 'All' : item,
                    draftSpecialty === item,
                    () => setDraftSpecialty((current) => (current === item ? 'all' : item)),
                    item === 'all'
                  )
                )}
              </View>
            </View>

            <View style={styles.filterActionsRow}>
              <Pressable onPress={resetDraftFilters} style={[styles.secondaryFilterBtn, { borderColor: inputBorder }]}>
                <ThemedText style={[styles.filterBtnText, { color: text }]}>Reset</ThemedText>
              </Pressable>
              <Pressable onPress={applyFilters} style={[styles.applyFilterBtn, { backgroundColor: tint }]}>
                <ThemedText style={[styles.filterBtnText, { color: '#fff' }]}>Apply filters</ThemedText>
              </Pressable>
            </View>
          </View>
        )}
      </View>

      <View style={styles.mapContainer}>
        <MapView
          ref={(ref) => {
            mapRef.current = ref;
          }}
          style={StyleSheet.absoluteFill}
          initialRegion={DEFAULT_REGION}
          onRegionChangeComplete={(nextRegion: Region) => {
            if (!locationReady) return;
            if (focusingTailorRef.current) return;
            setSearchRegion((current) => (isSameArea(current, nextRegion) ? current : nextRegion));
          }}
          showsUserLocation
          showsMyLocationButton
        >
          {tailors.map((tailor) => (
            <Marker
              key={tailor.user_id}
              coordinate={{
                latitude: tailor.location.latitude,
                longitude: tailor.location.longitude,
              }}
              onPress={() => onMarkerPress(tailor)}
            >
              <View style={[styles.markerBubble, { borderColor: selectedTailorId === tailor.user_id ? tint : '#d1d5db' }]}>
                {tailor.avatar && tailor.avatar.startsWith('http') ? (
                  <Image source={{ uri: tailor.avatar }} style={styles.markerAvatar} />
                ) : (
                  <ThemedText style={styles.markerText}>{initials(tailor.name)}</ThemedText>
                )}
                <View style={[styles.markerDot, { backgroundColor: tailor.is_available ? '#16a34a' : '#9ca3af' }]} />
              </View>
            </Marker>
          ))}
        </MapView>
        {loading ? (
          <View style={styles.mapLoading}>
            <ActivityIndicator color={tint} />
          </View>
        ) : null}
      </View>

      {errorText ? (
        <View style={styles.inlineMessage}>
          <ThemedText style={{ color: muted, textAlign: 'center' }}>{errorText}</ThemedText>
          <Pressable onPress={() => loadTailors(true)} style={[styles.retryButton, { borderColor: tint }]}>
            <ThemedText style={[styles.retryText, { color: tint }]}>Retry</ThemedText>
          </Pressable>
        </View>
      ) : null}

      {!loading && !errorText && tailors.length === 0 ? (
        <View style={styles.inlineMessage}>
          <ThemedText style={{ color: muted, textAlign: 'center' }}>
            No tailors match these filters. Try 5 km or a lower rating.
          </ThemedText>
        </View>
      ) : (
        <FlatList
          ref={(ref) => {
            listRef.current = ref;
          }}
          data={tailors}
          keyExtractor={(item) => item.user_id}
          renderItem={renderTailorCard}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <ThemedText style={styles.listTitle}>Nearby tailors</ThemedText>
              <ThemedText style={{ color: muted, fontSize: 12 }}>{tailors.length} result{tailors.length === 1 ? '' : 's'}</ThemedText>
            </View>
          }
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 24 }}
          onRefresh={() => loadTailors(true)}
          refreshing={refreshing}
          onScrollToIndexFailed={(info) => {
            setTimeout(() => {
              listRef.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: true });
            }, 100);
          }}
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
  filtersPanel: {
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  filterDropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterTitle: { fontSize: 15, fontWeight: '800' },
  clearFilters: { fontSize: 12, fontWeight: '700' },
  dropdownBody: { marginTop: 12 },
  filterGroup: { marginTop: 8 },
  filterLabel: { fontSize: 11, fontWeight: '700', marginBottom: 7, textTransform: 'uppercase' },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
  filterActionsRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  secondaryFilterBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  applyFilterBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  filterBtnText: { fontWeight: '800', fontSize: 13 },
  mapContainer: { height: 260, marginHorizontal: 12, marginTop: 16, borderRadius: 18, overflow: 'hidden' },
  mapFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#eef2f7' },
  mapLoading: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  inlineMessage: { paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center', gap: 8 },
  retryButton: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryText: { fontSize: 12, fontWeight: '800' },
  listHeader: {
    paddingTop: 14,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listTitle: { fontSize: 16, fontWeight: '800' },
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
  detailsBox: { marginTop: 12, paddingTop: 10, borderTopWidth: 1, gap: 4 },
  detailLine: { fontSize: 12, lineHeight: 17 },
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
  markerBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    position: 'relative',
  },
  markerAvatar: { width: 40, height: 40, borderRadius: 20 },
  markerText: { fontWeight: '800', color: '#111827' },
  markerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#fff',
    position: 'absolute',
    right: 1,
    bottom: 1,
  },
});
