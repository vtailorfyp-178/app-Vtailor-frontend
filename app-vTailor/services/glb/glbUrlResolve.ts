import { Platform } from 'react-native';
import type { DressSelections } from '@/services/dressGlbResolver';
import { resolveBundledDressGlbAsync } from '@/services/dressGlbResolver';
import { pathForCloudinaryLookup } from '@/services/glb/catalogDisplayPath';
import { resolveGlbModelUrl, type GlbModelPath } from '@/services/glb/glbModelUrl';
import { prefetchGlbBuffer, prefetchGltfScene } from '@/services/glb/loadGltfFromUrl';
import { warmGlbDiskCache } from '@/services/glb/glbDiskCache';import {
  ensureCloudinaryModelCatalog,
  prefetchCloudinaryModelCatalog,
  shouldRefreshStaleGlbUrl,
} from '@/services/glb/cloudinaryModelCatalog';
import {
  isCasualShortShirtModelId,
  isTrouserShirtBellBottomModelId,
  isTrouserShirtTulipTrouserModelId,
} from '@/services/glb/dressGlbTypes';
import { with3dPreviewDefaults } from '@/services/glb/threePreviewReadiness';

const URL_CACHE_VERSION = 'display-v40-switch-perf';
const MAX_WEB_MATRIX_WARMS = 6;
const MAX_COLOR_WARMS = 4;

/** Cloudinary URL lookup path (optimized long frock, mobile grarah/patiyala). */
export function pathForPreviewUrl(relativePath: GlbModelPath): GlbModelPath {
  return pathForCloudinaryLookup(relativePath);
}

type ResolvedGlb = { url: string; path: GlbModelPath };

const urlCache = new Map<string, ResolvedGlb | null>();

const DRESS_COLORS = ['red', 'blue', 'white', 'black'] as const;
const LONG_FROCK_NECKS = ['round', 'v-neck'] as const;
const LONG_FROCK_SLEEVES_FLARED = ['full', 'bell', 'layered', 'balloon'] as const;
const LONG_FROCK_SLEEVES_SPLIT = ['full', 'bell'] as const;
const SHALWAR_NECKS = ['round', 'v-neck', 'square', 'boat-neck'] as const;
const SHALWAR_SLEEVES = ['full', 'bell', 'layered', 'balloon'] as const;
const SAREE_STYLES = ['plain', 'frill'] as const;
const TROUSER_NECKS = ['round', 'collar', 'keyhole'] as const;
const BELL_SLEEVES = ['straight', 'puff', 'flared-bell'] as const;
const TULIP_SLEEVES = ['full', 'bell', 'puff'] as const;
const PATIYALA_SLEEVES = ['full', 'bell', 'balloon', 'layered'] as const;
const PATIYALA_NECKS = ['round', 'v-neck', 'square', 'boat-neck'] as const;

let matrixPrefetchTimer: ReturnType<typeof setTimeout> | null = null;

function cacheKey(modelId: string, selections: DressSelections): string {
  return `${URL_CACHE_VERSION}::${modelId}::${JSON.stringify(selections)}`;
}

/** Instant cache read — undefined if not warmed yet. */
export function peekDressGlbUrlCached(
  selections: DressSelections,
  modelId: string,
): ResolvedGlb | null | undefined {
  const key = cacheKey(modelId, selections);
  if (!urlCache.has(key)) return undefined;
  const cached = urlCache.get(key) ?? null;
  if (cached?.url && shouldRefreshStaleGlbUrl(cached.url)) {
    urlCache.delete(key);
    return undefined;
  }
  return cached;
}

export async function resolveDressGlbUrlCached(
  selections: DressSelections,
  modelId: string,
): Promise<ResolvedGlb | null> {
  const key = cacheKey(modelId, selections);
  const peek = peekDressGlbUrlCached(selections, modelId);
  if (peek !== undefined) return peek;

  const relativePath = await resolveBundledDressGlbAsync(selections, modelId);
  if (!relativePath) {
    urlCache.set(key, null);
    return null;
  }

  const previewPath = pathForPreviewUrl(relativePath);
  const url = await resolveGlbModelUrl(previewPath);
  const result = { url, path: relativePath };
  urlCache.set(key, result);
  return result;
}

function warmResolvedUrl(hit: ResolvedGlb | null): void {
  if (!hit?.url) return;
  if (Platform.OS === 'web') {
    prefetchGlbBuffer(hit.url);
    prefetchGltfScene(hit.url);
  } else {
    warmGlbDiskCache(hit.url);
  }
}

function prefetchMatrixVariants(
  selections: DressSelections,
  modelId: string,
  necks: readonly string[],
  sleeves: readonly string[],
  staggerMs = 120,
): void {
  let delay = 0;
  let warmed = 0;
  for (const neck of necks) {
    for (const sleeve of sleeves) {
      if (warmed >= MAX_WEB_MATRIX_WARMS) return;
      const next = with3dPreviewDefaults(modelId, { ...selections, neck, sleeves: sleeve });
      setTimeout(() => queueResolve(next, modelId), delay);
      delay += staggerMs;
      warmed += 1;
    }
  }
}

function prefetchDressMatrixVariants(selections: DressSelections, modelId: string): void {
  if (isTrouserShirtBellBottomModelId(modelId)) {
    const necks = selections.neck ? [selections.neck] : TROUSER_NECKS;
    prefetchMatrixVariants(selections, modelId, necks, BELL_SLEEVES, 50);
    return;
  }
  if (isTrouserShirtTulipTrouserModelId(modelId)) {
    const necks = selections.neck ? [selections.neck] : TROUSER_NECKS;
    prefetchMatrixVariants(selections, modelId, necks, TULIP_SLEEVES, 50);
    return;
  }
  if (isCasualShortShirtModelId(modelId) && selections.bottom !== 'straight') {
    const necks = selections.neck ? [selections.neck] : PATIYALA_NECKS;
    prefetchMatrixVariants(selections, modelId, necks, PATIYALA_SLEEVES, 70);
  }
}

function queueResolve(selections: DressSelections, modelId: string): void {
  void resolveDressGlbUrlCached(selections, modelId).then(warmResolvedUrl).catch(() => {});
}

function prefetchColorVariants(
  selections: DressSelections,
  modelId: string,
  pickedColor: string | null | undefined,
): void {
  let warmed = 0;
  for (const color of DRESS_COLORS) {
    if (color === pickedColor) continue;
    if (warmed >= MAX_COLOR_WARMS) break;
    queueResolve({ ...selections, colors: color }, modelId);
    warmed += 1;
  }
}

let variantPrefetchTimer: ReturnType<typeof setTimeout> | null = null;

function prefetchSiblingVariants(selections: DressSelections, modelId: string): void {
  const pickedColor = selections.colors;

  if (
    modelId === 'long-frock' ||
    modelId === 'grarah-short-shirt' ||
    modelId === 'grarah-peplum' ||
    modelId === 'lehnga-bridal' ||
    modelId === 'lehnga-circular' ||
    modelId === 'saree'
  ) {
    prefetchColorVariants(selections, modelId, pickedColor);
  }

  if (modelId === 'long-frock') {
    const fs = selections['frock-style'];
    const otherFs = fs === 'front-slit' ? 'flared-bottom' : fs === 'flared-bottom' ? 'front-slit' : null;
    if (otherFs) {
      queueResolve({ ...selections, 'frock-style': otherFs }, modelId);
    }
  }
}

/** Warm current GLB + likely next taps (colors on native too — disk cache). */
export function prefetchDressGlbUrl(selections: DressSelections, modelId: string): void {
  queueResolve(selections, modelId);

  if (variantPrefetchTimer) clearTimeout(variantPrefetchTimer);
  variantPrefetchTimer = setTimeout(() => {
    variantPrefetchTimer = null;
    prefetchSiblingVariants(selections, modelId);
  }, Platform.OS === 'web' ? 400 : 80);

  if (Platform.OS === 'web') {
    if (matrixPrefetchTimer) clearTimeout(matrixPrefetchTimer);
    matrixPrefetchTimer = setTimeout(() => {
      matrixPrefetchTimer = null;
      prefetchDressMatrixVariants(selections, modelId);
    }, 900);
  }
}

/** Pre-warm all dress colors for current neck/sleeves — call when customize screen opens. */
export function prefetchDressColorGrid(selections: DressSelections, modelId: string): void {
  queueResolve(selections, modelId);
  for (const color of DRESS_COLORS) {
    queueResolve({ ...selections, colors: color }, modelId);
  }
}

/** Warm default preview before user opens customize (trouser shirt style screen). */
export function prefetchTrouserShirtEntry(modelId: string): void {
  prefetchCloudinaryModelCatalog();
  const base = with3dPreviewDefaults(modelId, {
    neck: null,
    sleeves: null,
    bottom: null,
    colors: null,
    'frock-style': null,
    'saree-style': null,
    'fabric-print': null,
  });
  queueResolve(base, modelId);
  if (Platform.OS === 'web') {
    setTimeout(() => prefetchDressMatrixVariants(base, modelId), 400);
  }
}

export function clearDressGlbUrlCache(): void {
  urlCache.clear();
}

/** Warm Cloudinary path index while user picks dress options. */
export function prefetchDressModelCatalog(): void {
  prefetchCloudinaryModelCatalog();
}
