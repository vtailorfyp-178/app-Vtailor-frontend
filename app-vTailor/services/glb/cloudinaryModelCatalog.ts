import { Platform } from 'react-native';
import { getCandidateBaseUrls } from '@/services/apiBase';
import { apiBaseToOrigin } from '@/services/glb/glbApiOrigin';
import {
  expandCatalogAliases,
  normalizeBasenameSlug,
  toOptimizedRelativePath,
} from '@/services/glb/catalogPathAliases';
import { pathForCloudinaryLookup } from '@/services/glb/catalogDisplayPath';
import embeddedCatalog from '@/data/cloudinaryCatalog.json';
import bellBottomCatalog from '@/data/bellBottomCloudinaryCatalog.json';
import tulipTrouserCatalog from '@/data/tulipTrouserCloudinaryCatalog.json';

export type CloudinaryCatalogEntry = {
  name?: string;
  url: string;
  folder?: string;
  category?: string;
  relativePath?: string;
  subcategory?: string;
  aliasOf?: string | null;
};

type EmbeddedRow = {
  relativePath: string;
  url: string;
  aliasOf?: string | null;
};

const CATALOG_TTL_MS = 5 * 60 * 1000;

let pathToUrl = new Map<string, string>();
/** `${dressCategory}::${slug}` → url — avoids long-frock vs patiyala slug collisions. */
let slugToUrlByCategory = new Map<string, string>();
let catalogLoadedAt = 0;
let loadPromise: Promise<Map<string, string>> | null = null;
let lastFetchError: string | null = null;
let embeddedApplied = false;

export function normalizeGlbCatalogPath(relativePath: string): string {
  return String(relativePath || '')
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .trim()
    .toLowerCase();
}

function cloudinaryDisabledByEnv(): boolean {
  const flag = (process.env.EXPO_PUBLIC_USE_CLOUDINARY_MODELS ?? 'true').toLowerCase();
  return flag === 'false' || flag === '0';
}

export function useCloudinaryModels(): boolean {
  return !cloudinaryDisabledByEnv();
}

function dressCategoryKey(relativePath: string): string {
  const p = relativePath.toLowerCase();
  if (p.includes('long frock') || p.includes('long-frock')) return 'long-frock';
  if (p.includes('saree')) return 'saree';
  if (p.includes('shalwar') || p.includes('patiyala')) return 'shalwar';
  if (p.includes('trouser shirt') || p.includes('trouser-shirt') || p.includes('bell-bottom') || p.includes('tulip-trouser')) {
    return 'trouser-shirt';
  }
  if (p.includes('lehnga')) return 'lehnga';
  if (p.includes('grarah')) return 'grarah';
  return 'other';
}

function registerSlugForPath(relativePath: string, url: string): void {
  const slug = normalizeBasenameSlug(relativePath);
  const cat = dressCategoryKey(relativePath);
  slugToUrlByCategory.set(`${cat}::${slug}`, url);
  if (slug.includes('sleeeves')) {
    slugToUrlByCategory.set(`${cat}::${slug.replace(/sleeeves/g, 'sleeves')}`, url);
  }
}

function registerCatalogPath(relativePath: string, url: string): void {
  const key = normalizeGlbCatalogPath(relativePath);
  pathToUrl.set(key, url);
  registerSlugForPath(relativePath, url);
  for (const alias of expandCatalogAliases(relativePath, url)) {
    const aliasKey = normalizeGlbCatalogPath(alias);
    if (!pathToUrl.has(aliasKey)) {
      pathToUrl.set(aliasKey, url);
    }
    registerSlugForPath(alias, url);
  }
}

function applyCatalogRows(rows: Array<{ relativePath?: string; url?: string; aliasOf?: string | null }>): void {
  for (const item of rows) {
    if (!item.url || !item.relativePath) continue;
    registerCatalogPath(item.relativePath, item.url);
    if (item.aliasOf) {
      registerCatalogPath(item.aliasOf, item.url);
    }
  }
}

function ensureEmbeddedCatalog(): void {
  if (embeddedApplied) return;
  applyCatalogRows(embeddedCatalog as EmbeddedRow[]);
  applyCatalogRows(bellBottomCatalog as EmbeddedRow[]);
  applyCatalogRows(tulipTrouserCatalog as EmbeddedRow[]);
  embeddedApplied = true;
  if (pathToUrl.size > 0) {
    catalogLoadedAt = Date.now();
  }
}

export function isCloudinaryCatalogReady(): boolean {
  return pathToUrl.size > 0;
}

function getModelsApiBaseSync(): string | null {
  const direct = (process.env.EXPO_PUBLIC_MODELS_API_URL || '').trim();
  if (direct) return direct.replace(/\/$/, '');
  return null;
}

export async function resolveModelsApiBase(): Promise<string | null> {
  const env = getModelsApiBaseSync();
  if (env) return env;

  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

  const bases = await getCandidateBaseUrls();
  const first = bases[0];
  if (first) {
    const origin = apiBaseToOrigin(first);
    return origin.replace(/:8000$/, ':3001');
  }

  return 'http://127.0.0.1:3001';
}

function isCatalogFresh(): boolean {
  return pathToUrl.size > 0 && Date.now() - catalogLoadedAt < CATALOG_TTL_MS;
}

export function getLastCatalogFetchError(): string | null {
  return lastFetchError;
}

export async function ensureCloudinaryModelCatalog(force = false): Promise<Map<string, string>> {
  if (!useCloudinaryModels()) return pathToUrl;

  ensureEmbeddedCatalog();
  if (!force && isCatalogFresh()) return pathToUrl;
  if (!force && loadPromise) return loadPromise;

  loadPromise = (async () => {
    lastFetchError = null;
    const base = await resolveModelsApiBase();
    if (!base) return pathToUrl;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25_000);

    try {
      const res = await fetch(`${base}/models`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      if (!res.ok) {
        throw new Error(`Models API ${res.status}`);
      }

      const items = (await res.json()) as CloudinaryCatalogEntry[];
      applyCatalogRows(items);
      catalogLoadedAt = Date.now();
      return pathToUrl;
    } catch (err) {
      lastFetchError = err instanceof Error ? err.message : String(err);
      if (pathToUrl.size === 0) {
        console.warn('[cloudinaryModelCatalog]', lastFetchError);
      }
      return pathToUrl;
    } finally {
      clearTimeout(timeout);
      loadPromise = null;
    }
  })();

  return loadPromise;
}

/** Disk filenames sometimes have double spaces or a space before `.glb`. */
function glbPathLookupVariants(relativePath: string): string[] {
  const norm = String(relativePath || '')
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .trim();
  const out = new Set<string>([norm]);
  const collapsedSpaces = norm.replace(/  +/g, ' ');
  out.add(collapsedSpaces);
  out.add(collapsedSpaces.replace(/\s+\.glb$/i, '.glb'));
  out.add(norm.replace(/ +\.glb$/i, '.glb'));
  out.add(norm.replace(/\.glb\.glb$/i, '.glb'));
  if (/\.glb$/i.test(norm) && !/\.glb\.glb$/i.test(norm)) {
    out.add(`${norm}.glb`);
  }
  const stem = norm.replace(/\.glb$/i, '');
  if (/-\.glb$/i.test(norm) || stem.endsWith('-')) {
    out.add(`${stem.replace(/-+$/, '')}.glb`);
    out.add(`${stem.replace(/-+$/, '')}--.glb`);
    out.add(`${stem.replace(/-+$/, '')}-.glb`);
  }
  if (/sleeeves/i.test(stem)) {
    out.add(`${stem.replace(/sleeeves/gi, 'sleeves')}.glb`);
  }
  if (/flarred/i.test(stem)) {
    out.add(`${stem.replace(/flarred/gi, 'flared')}.glb`);
  }
  return [...out];
}

function catalogLookupBases(relativePath: string): string[] {
  const canonical = pathForCloudinaryLookup(relativePath);
  const bases = canonical === relativePath ? [relativePath] : [canonical, relativePath];
  return [...new Set(bases)];
}

export function getCloudinaryUrlForPath(relativePath: string): string | null {
  ensureEmbeddedCatalog();

  for (const base of catalogLookupBases(relativePath)) {
    for (const variant of glbPathLookupVariants(base)) {
      const direct = pathToUrl.get(normalizeGlbCatalogPath(variant));
      if (direct) return direct;
    }

    if (!base.includes('/mobile/')) {
      for (const variant of glbPathLookupVariants(base)) {
        const mobileKey = normalizeGlbCatalogPath(
          variant.replace(/\/([^/]+\.glb)$/i, '/mobile/$1'),
        );
        const mobileHit = pathToUrl.get(mobileKey);
        if (mobileHit) return mobileHit;
      }
    }

    for (const variant of glbPathLookupVariants(base)) {
      const optimizedPath = toOptimizedRelativePath(variant);
      if (optimizedPath) {
        const optHit = pathToUrl.get(normalizeGlbCatalogPath(optimizedPath));
        if (optHit) return optHit;
      }
    }
  }

  const normPath = relativePath.replace(/\\/g, '/');
  if (
    /\/optimized\/optimized-[^/]+\.glb$/i.test(normPath) ||
    /\/optimized-[^/]+-shirt\.glb$/i.test(normPath)
  ) {
    return null;
  }

  const slug = normalizeBasenameSlug(relativePath);
  const cat = dressCategoryKey(relativePath);
  const scoped = slugToUrlByCategory.get(`${cat}::${slug}`);
  if (scoped) return scoped;

  for (const base of catalogLookupBases(relativePath)) {
    for (const variant of glbPathLookupVariants(base)) {
      const hit = slugToUrlByCategory.get(`${dressCategoryKey(variant)}::${slug}`);
      if (hit) return hit;
    }
  }

  return slugToUrlByCategory.get(`other::${slug}`) ?? null;
}

export function clearCloudinaryModelCatalog(): void {
  pathToUrl = new Map();
  slugToUrlByCategory = new Map();
  catalogLoadedAt = 0;
  loadPromise = null;
  lastFetchError = null;
  embeddedApplied = false;
  ensureEmbeddedCatalog();
}

export function prefetchCloudinaryModelCatalog(): void {
  if (!useCloudinaryModels()) return;
  ensureEmbeddedCatalog();
  void ensureCloudinaryModelCatalog().catch(() => {});
}

export function shouldRefreshStaleGlbUrl(url: string): boolean {
  if (!useCloudinaryModels() || !isCloudinaryCatalogReady()) return false;
  return !/res\.cloudinary\.com/i.test(url);
}
