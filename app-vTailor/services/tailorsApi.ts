import { Platform } from 'react-native';
import Constants from 'expo-constants';

const expoHostCandidates = [
  Constants.expoConfig?.hostUri,
  (Constants as any).expoGoConfig?.hostUri,
  (Constants as any).expoConfig?.debuggerHost,
  (Constants as any).expoGoConfig?.debuggerHost,
]
  .filter(Boolean)
  .map((value) => String(value).replace(/^.*?:\/\//, '').replace(/:\d+$/, '').trim())
  .filter(Boolean);

const EMULATOR_ANDROID_HOST = '10.0.2.2';
const EXPO_API_BASE = (process.env.EXPO_PUBLIC_API_BASE_URL || '').trim();

function buildBaseUrl(host: string) {
  return `http://${host}:8000/app/api/v1`;
}

function getCandidateBaseUrls() {
  const urls: string[] = [];
  if (EXPO_API_BASE) urls.push(EXPO_API_BASE);

  if (Platform.OS === 'web') {
    const webHost = (typeof window !== 'undefined' && window.location && window.location.hostname) || 'localhost';
    urls.push(
      `http://${webHost}:8000/app/api/v1`,
      'http://127.0.0.1:8000/app/api/v1',
      'http://localhost:8000/app/api/v1',
    );
    return Array.from(new Set(urls));
  }

  if (Platform.OS === 'android') urls.push(buildBaseUrl(EMULATOR_ANDROID_HOST));
  urls.push(...expoHostCandidates.map(buildBaseUrl));
  urls.push(buildBaseUrl('127.0.0.1'));
  urls.push(buildBaseUrl('localhost'));
  return Array.from(new Set(urls));
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const baseUrls = getCandidateBaseUrls();
  let lastError: unknown = null;

  for (const base of baseUrls) {
    try {
      const res = await fetch(`${base}${path}`, init);
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Request failed (${res.status}): ${body}`);
      }
      return (await res.json()) as T;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('Unable to reach API server');
}

export type NearbyTailor = {
  user_id: string;
  name: string;
  shop_name?: string | null;
  address?: string | null;
  bio?: string | null;
  working_hours?: string | null;
  phone?: string | null;
  avatar?: string | null;
  specialization: string[];
  experience?: string | null;
  rating: number;
  review_count: number;
  price_from: number;
  price_to: number;
  is_available: boolean;
  location: {
    latitude: number;
    longitude: number;
  };
  distance_km: number;
  last_location_at?: string | null;
};

export type NearbyTailorsResponse = {
  latitude: number;
  longitude: number;
  radius_km: number;
  count: number;
  results: NearbyTailor[];
};

export type NearbyTailorQuery = {
  token: string;
  latitude: number;
  longitude: number;
  radiusKm?: number;
  specialty?: string;
  priceMin?: number;
  priceMax?: number;
  minRating?: number;
  availability?: boolean;
  queryText?: string;
  sortBy?: 'distance' | 'rating' | 'reviews' | 'review_count';
  limit?: number;
};

export async function getNearbyTailors(params: NearbyTailorQuery): Promise<NearbyTailorsResponse> {
  const search = new URLSearchParams({
    latitude: String(params.latitude),
    longitude: String(params.longitude),
    radius_km: String(params.radiusKm ?? 10),
    sort_by: params.sortBy === 'reviews' ? 'review_count' : (params.sortBy ?? 'distance'),
    limit: String(params.limit ?? 60),
  });

  if (params.specialty && params.specialty !== 'all') search.set('specialty', params.specialty);
  if (typeof params.priceMin === 'number') search.set('price_min', String(params.priceMin));
  if (typeof params.priceMax === 'number') search.set('price_max', String(params.priceMax));
  if (typeof params.minRating === 'number') search.set('min_rating', String(params.minRating));
  if (typeof params.availability === 'boolean') search.set('availability', String(params.availability));
  if (params.queryText && params.queryText.trim()) search.set('q', params.queryText.trim());

  return request<NearbyTailorsResponse>(`/tailors/nearby?${search.toString()}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${params.token}`,
    },
  });
}

export async function getTailorProfile(token: string, tailorId: string): Promise<NearbyTailor> {
  return request<NearbyTailor>(`/tailors/${encodeURIComponent(tailorId)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function updateTailorAvailability(token: string, isAvailable: boolean) {
  return request<{ status: string; is_available: boolean; availability_updated_at?: string }>(
    '/tailors/availability',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ is_available: isAvailable }),
    }
  );
}

export async function updateTailorLocation(token: string, payload: { latitude: number; longitude: number; is_available?: boolean }) {
  return request<{ status: string; is_available: boolean; location: { latitude: number; longitude: number }; last_location_at?: string }>(
    '/tailors/location',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  );
}
