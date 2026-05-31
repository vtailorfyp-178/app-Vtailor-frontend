/**
 * Optional models-service API for trouser shirt / tulip trouser catalog.
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
  if (!res.ok) throw new Error(`Tulip trouser API ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

export type TulipTrouserModelResponse = {
  neckType: string;
  sleeveType: string;
  relativePath: string;
  modelUrl: string | null;
};

export const fetchTulipTrouserCategories = () =>
  getJson<{ categories: { id: string; name: string }[] }>('/tulip-trouser/categories');

export const fetchTulipTrouserVariations = () =>
  getJson<{ variations: { id: string; name: string; thumbnail: string | null }[] }>(
    '/tulip-trouser/variations',
  );

export const fetchTulipTrouserNeckTypes = () =>
  getJson<{ neckTypes: { id: string; name: string }[] }>('/tulip-trouser/neck-types');

export const fetchTulipTrouserSleeveTypes = () =>
  getJson<{ sleeveTypes: { id: string; name: string }[] }>('/tulip-trouser/sleeve-types');

export const fetchTulipTrouserColors = () =>
  getJson<{ colorShadeIds: string[]; runtimeTint: boolean }>('/tulip-trouser/colors');

export const fetchTulipTrouserModel = (neck: string, sleeve: string) =>
  getJson<TulipTrouserModelResponse>(
    `/tulip-trouser/model?neck=${encodeURIComponent(neck)}&sleeve=${encodeURIComponent(sleeve)}`,
  );

export const fetchTulipTrouserCatalog = () =>
  getJson<{ variation: string; variants: TulipTrouserModelResponse[] }>('/tulip-trouser/catalog');
