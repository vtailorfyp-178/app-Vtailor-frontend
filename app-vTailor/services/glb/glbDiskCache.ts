import * as LegacyFS from 'expo-file-system/legacy';
import { Platform } from 'react-native';

const CACHE_DIR = `${LegacyFS.cacheDirectory ?? ''}vtailor-glb/`;
const MAX_DISK_ENTRIES = 24;

const inflight = new Map<string, Promise<string | null>>();

function urlToFilename(url: string): string {
  let hash = 2166136261;
  for (let i = 0; i < url.length; i++) {
    hash ^= url.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `${(hash >>> 0).toString(16)}.glb`;
}

async function ensureCacheDir(): Promise<void> {
  if (!CACHE_DIR) return;
  const info = await LegacyFS.getInfoAsync(CACHE_DIR);
  if (!info.exists) {
    await LegacyFS.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
  }
}

async function trimDiskCache(): Promise<void> {
  try {
    const names = await LegacyFS.readDirectoryAsync(CACHE_DIR);
    if (names.length <= MAX_DISK_ENTRIES) return;
    const entries = await Promise.all(
      names.map(async (name) => {
        const uri = `${CACHE_DIR}${name}`;
        const info = await LegacyFS.getInfoAsync(uri);
        return { uri, modTime: info.exists && 'modificationTime' in info ? info.modificationTime ?? 0 : 0 };
      }),
    );
    entries.sort((a, b) => a.modTime - b.modTime);
    const removeCount = entries.length - MAX_DISK_ENTRIES;
    for (let i = 0; i < removeCount; i++) {
      await LegacyFS.deleteAsync(entries[i].uri, { idempotent: true });
    }
  } catch {
    /* best effort */
  }
}

/** Local file:// path when GLB is on disk (fast WebView load with allowFileAccess). */
export async function getDiskCachedGlbFileUrl(url: string): Promise<string | null> {
  if (Platform.OS === 'web' || !url || !/^https?:\/\//i.test(url)) return null;
  try {
    await ensureCacheDir();
    const localUri = `${CACHE_DIR}${urlToFilename(url)}`;
    const info = await LegacyFS.getInfoAsync(localUri);
    if (!info.exists || !info.size || info.size < 80) return null;
    return localUri;
  } catch {
    return null;
  }
}

/** Wait until a background download finishes (used before injecting cached file). */
export async function waitForDiskCachedGlbFileUrl(
  url: string,
  timeoutMs = 12_000,
): Promise<string | null> {
  const existing = await getDiskCachedGlbFileUrl(url);
  if (existing) return existing;

  const pending = inflight.get(url);
  if (!pending) return null;

  const raced = await Promise.race([
    pending.then(() => getDiskCachedGlbFileUrl(url)),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
  ]);
  return raced ?? null;
}

/** Local viewer URI (content:// on Android) when this GLB was cached on disk. */
export async function getDiskCachedGlbViewerUri(url: string): Promise<string | null> {
  if (Platform.OS === 'web' || !url || !/^https?:\/\//i.test(url)) return null;
  try {
    await ensureCacheDir();
    const localUri = `${CACHE_DIR}${urlToFilename(url)}`;
    const info = await LegacyFS.getInfoAsync(localUri);
    if (!info.exists || !info.size) return null;
    if (Platform.OS === 'android') {
      return LegacyFS.getContentUriAsync(localUri);
    }
    return localUri;
  } catch {
    return null;
  }
}

/** Download GLB to disk for faster WebView reloads (deduped). */
export async function downloadGlbToDisk(url: string): Promise<string | null> {
  if (Platform.OS === 'web' || !url || !/^https?:\/\//i.test(url)) return null;

  const existing = inflight.get(url);
  if (existing) return existing;

  const task = (async () => {
    try {
      const cached = await getDiskCachedGlbFileUrl(url);
      if (cached) return cached;

      await ensureCacheDir();
      const localUri = `${CACHE_DIR}${urlToFilename(url)}`;
      const result = await LegacyFS.downloadAsync(url, localUri);
      if (result.status < 200 || result.status >= 300) {
        await LegacyFS.deleteAsync(localUri, { idempotent: true });
        return null;
      }
      void trimDiskCache();
      return getDiskCachedGlbFileUrl(url);
    } catch {
      return null;
    } finally {
      inflight.delete(url);
    }
  })();

  inflight.set(url, task);
  return task;
}

export function warmGlbDiskCache(url: string): void {
  void downloadGlbToDisk(url).catch(() => {});
}

/** Remove a bad cached file so the viewer can retry from Cloudinary HTTPS. */
export async function clearDiskCacheForUrl(url: string): Promise<void> {
  if (Platform.OS === 'web' || !url || !/^https?:\/\//i.test(url)) return;
  try {
    await ensureCacheDir();
    const localUri = `${CACHE_DIR}${urlToFilename(url)}`;
    await LegacyFS.deleteAsync(localUri, { idempotent: true });
  } catch {
    /* ignore */
  }
}
