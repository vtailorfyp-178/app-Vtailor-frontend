import type { DressSelections } from '@/services/dressGlbResolver';
import { resolveBundledDressGlbAsync } from '@/services/dressGlbResolver';
import { pathForCloudinaryLookup } from '@/services/glb/catalogDisplayPath';
import { resolveGlbModelUrl, type GlbModelPath } from '@/services/glb/glbModelUrl';
import { prefetchGltfScene } from '@/services/glb/loadGltfFromUrl';
import {
  ensureCloudinaryModelCatalog,
  prefetchCloudinaryModelCatalog,
  shouldRefreshStaleGlbUrl,
} from '@/services/glb/cloudinaryModelCatalog';

const URL_CACHE_VERSION = 'display-v28-red-split-swap';

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

  await ensureCloudinaryModelCatalog();

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
  if (hit?.url) prefetchGltfScene(hit.url);
}

function queueResolve(selections: DressSelections, modelId: string): void {
  void resolveDressGlbUrlCached(selections, modelId).then(warmResolvedUrl).catch(() => {});
}

function prefetchColorVariants(
  selections: DressSelections,
  modelId: string,
  pickedColor: string | null | undefined,
): void {
  for (const color of DRESS_COLORS) {
    if (color === pickedColor) continue;
    queueResolve({ ...selections, colors: color }, modelId);
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

/** Warm current GLB immediately; sibling variants after a short pause (avoids network storms). */
export function prefetchDressGlbUrl(selections: DressSelections, modelId: string): void {
  queueResolve(selections, modelId);
  if (variantPrefetchTimer) clearTimeout(variantPrefetchTimer);
  variantPrefetchTimer = setTimeout(() => {
    variantPrefetchTimer = null;
    prefetchSiblingVariants(selections, modelId);
  }, 450);
}

export function clearDressGlbUrlCache(): void {
  urlCache.clear();
}

/** Warm Cloudinary path index while user picks dress options. */
export function prefetchDressModelCatalog(): void {
  prefetchCloudinaryModelCatalog();
}
