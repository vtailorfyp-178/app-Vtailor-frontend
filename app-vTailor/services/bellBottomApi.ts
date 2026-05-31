/**
 * Optional models-service API for trouser shirt / bell bottom catalog.
 * App resolves GLBs locally; use these for admin tools or dynamic thumbnails.
 */
import Constants from 'expo-constants';

function modelsApiBase(): string {
  const extra = Constants.expoConfig?.extra as { modelsApiUrl?: string } | undefined;
  return (
    extra?.modelsApiUrl?.replace(/\/$/, '') ||
    process.env.EXPO_PUBLIC_MODELS_API_URL?.replace(/\/$/, '') ||
    'http://localhost:3001'
  );
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${modelsApiBase()}${path}`);
  if (!res.ok) throw new Error(`Bell bottom API ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

export type BellBottomModelResponse = {
  neckType: string;
  sleeveType: string;
  relativePath: string;
  modelUrl: string | null;
};

export const fetchBellBottomCategories = () =>
  getJson<{ categories: { id: string; name: string }[] }>('/bell-bottom/categories');

export const fetchBellBottomVariations = () =>
  getJson<{ variations: { id: string; name: string; thumbnail: string | null }[] }>(
    '/bell-bottom/variations',
  );

export const fetchBellBottomNeckTypes = () =>
  getJson<{ neckTypes: { id: string; name: string }[] }>('/bell-bottom/neck-types');

export const fetchBellBottomSleeveTypes = () =>
  getJson<{ sleeveTypes: { id: string; name: string }[] }>('/bell-bottom/sleeve-types');

export const fetchBellBottomColors = () =>
  getJson<{ colorShadeIds: string[]; runtimeTint: boolean }>('/bell-bottom/colors');

export const fetchBellBottomModel = (neck: string, sleeve: string) =>
  getJson<BellBottomModelResponse>(
    `/bell-bottom/model?neck=${encodeURIComponent(neck)}&sleeve=${encodeURIComponent(sleeve)}`,
  );

export const fetchBellBottomCatalog = () =>
  getJson<{ variation: string; variants: BellBottomModelResponse[] }>('/bell-bottom/catalog');
