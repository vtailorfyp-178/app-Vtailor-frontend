import { Platform } from 'react-native';

const MAX_CACHE_ENTRIES = Platform.OS === 'web' ? 10 : 4;
const MAX_CACHE_BYTES = Platform.OS === 'web' ? 48 * 1024 * 1024 : 12 * 1024 * 1024;

type CacheEntry = {
  buffer: ArrayBuffer;
  loadedAt: number;
};

const bufferCache = new Map<string, CacheEntry>();
let activeLoadUrl: string | null = null;

function touchLru(url: string, entry: CacheEntry): void {
  bufferCache.delete(url);
  bufferCache.set(url, entry);
  while (bufferCache.size > MAX_CACHE_ENTRIES) {
    const oldest = bufferCache.keys().next().value;
    if (oldest) bufferCache.delete(oldest);
  }
}

export function getCachedGlbBuffer(url: string): ArrayBuffer | null {
  const hit = bufferCache.get(url);
  if (!hit) return null;
  touchLru(url, hit);
  return hit.buffer;
}

export function setCachedGlbBuffer(url: string, buffer: ArrayBuffer): void {
  if (buffer.byteLength > MAX_CACHE_BYTES) return;
  touchLru(url, { buffer, loadedAt: Date.now() });
}

export function clearGlbBufferCache(): void {
  bufferCache.clear();
}

export function setActiveGlbLoadUrl(url: string | null): void {
  activeLoadUrl = url;
}

export function isStaleGlbLoad(url: string, generation: number, loadGeneration: number): boolean {
  return generation !== loadGeneration || (activeLoadUrl != null && activeLoadUrl !== url);
}
