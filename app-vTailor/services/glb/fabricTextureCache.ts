import { Platform } from 'react-native';
import * as THREE from 'three';
import * as LegacyFS from 'expo-file-system/legacy';
import type { FabricPatternMeta } from '@/services/glb/fabricPrintSelection';
import { parseFabricPrintSelection } from '@/services/glb/fabricPrintSelection';

const LOG = '[fabricTexture]';
const IMAGE_CACHE_DIR = `${LegacyFS.cacheDirectory ?? ''}vtailor-fabric-img/`;
const loader = new THREE.TextureLoader();
const cache = new Map<string, THREE.Texture>();
const inflight = new Map<string, Promise<THREE.Texture>>();
const remoteInflight = new Map<string, Promise<string>>();

/** Ordered URLs to try — full swatch first so print is always visible. */
export function fabricPrintTextureCandidates(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  const parsed = parseFabricPrintSelection(raw);
  if (!parsed) return [raw.trim()];
  const ordered = [parsed.sourceUrl, parsed.tileUrl, parsed.megatileUrl, raw.trim()];
  const seen = new Set<string>();
  return ordered.filter((u) => {
    const key = u?.trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeLoadUri(url: string): string {
  const trimmed = url.trim();
  if (Platform.OS === 'web') return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('file://')) return trimmed;
  if (trimmed.startsWith('/')) return `file://${trimmed}`;
  if (trimmed.startsWith('content://')) return trimmed;
  return trimmed;
}

function configureSimpleFabricTexture(tex: THREE.Texture, fromLocalFile = false): THREE.Texture {
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.flipY = Platform.OS === 'web' ? true : fromLocalFile ? false : true;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.offset.set(0, 0);
  tex.rotation = 0;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}

function textureHasImage(tex: THREE.Texture | null | undefined): boolean {
  if (!tex?.image) return false;
  const img = tex.image as {
    width?: number;
    height?: number;
    data?: unknown;
    uri?: string;
  };
  if (typeof img.width === 'number' && typeof img.height === 'number') {
    return img.width > 0 && img.height > 0;
  }
  if (img.data || img.uri) return true;
  return true;
}

function imageUrlToFilename(url: string): string {
  let hash = 2166136261;
  for (let i = 0; i < url.length; i += 1) {
    hash ^= url.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const lower = url.toLowerCase();
  const ext = lower.includes('.png') ? 'png' : lower.includes('.webp') ? 'webp' : 'jpg';
  return `${(hash >>> 0).toString(16)}.${ext}`;
}

async function ensureImageCacheDir(): Promise<void> {
  if (!IMAGE_CACHE_DIR) return;
  const info = await LegacyFS.getInfoAsync(IMAGE_CACHE_DIR);
  if (!info.exists) {
    await LegacyFS.makeDirectoryAsync(IMAGE_CACHE_DIR, { intermediates: true });
  }
}

function toFileUri(path: string): string {
  return path.startsWith('file://') ? path : `file://${path}`;
}

/** RN expo-gl: download Cloudinary/HTTPS image to cache before TextureLoader. */
async function downloadRemoteFabricImage(url: string): Promise<string> {
  const key = url.trim();
  const pending = remoteInflight.get(key);
  if (pending) return pending;

  const task = (async () => {
    await ensureImageCacheDir();
    const localUri = `${IMAGE_CACHE_DIR}${imageUrlToFilename(key)}`;
    const info = await LegacyFS.getInfoAsync(localUri);
    if (info.exists && 'size' in info && info.size && info.size > 64) {
      console.log(`${LOG} Cloudinary cache hit`, { localUri: localUri.slice(0, 100) });
      return toFileUri(localUri);
    }

    console.log(`${LOG} downloading Cloudinary URL`, key.slice(0, 120));
    const result = await LegacyFS.downloadAsync(key, localUri);
    console.log(`${LOG} Cloudinary download`, {
      status: result.status,
      uri: localUri.slice(0, 100),
    });
    if (result.status < 200 || result.status >= 300) {
      await LegacyFS.deleteAsync(localUri, { idempotent: true });
      throw new Error(`Cloudinary download HTTP ${result.status}`);
    }
    return toFileUri(localUri);
  })();

  remoteInflight.set(key, task);
  try {
    return await task;
  } finally {
    remoteInflight.delete(key);
  }
}

function logTextureLoaded(url: string, tex: THREE.Texture): void {
  const img = tex.image as { width?: number; height?: number } | undefined;
  console.log(`${LOG} TextureLoader success`, {
    url: url.slice(0, 120),
    hasImage: textureHasImage(tex),
    width: img?.width,
    height: img?.height,
  });
}

function loadWithTextureLoader(url: string, fromLocalFile = false): Promise<THREE.Texture> {
  const loadUri = normalizeLoadUri(url);
  console.log(`${LOG} TextureLoader loading`, loadUri.slice(0, 120));

  return new Promise((resolve, reject) => {
    loader.load(
      loadUri,
      (tex) => {
        configureSimpleFabricTexture(tex, fromLocalFile);
        if (!textureHasImage(tex)) {
          console.warn(`${LOG} TextureLoader returned empty image`, loadUri.slice(0, 120));
          reject(new Error('Texture image empty'));
          return;
        }
        logTextureLoaded(loadUri, tex);
        console.log(`${LOG} material map ready`, {
          colorSpace: tex.colorSpace,
          flipY: tex.flipY,
          hasImage: Boolean(tex.image),
        });
        resolve(tex);
      },
      undefined,
      (err) => {
        console.warn(`${LOG} TextureLoader error`, loadUri.slice(0, 120), err);
        reject(err instanceof Error ? err : new Error('TextureLoader failed'));
      },
    );
  });
}

/** RN fallback: copy local/content URI to cache path TextureLoader accepts. */
async function loadLocalFileTexture(url: string): Promise<THREE.Texture> {
  const ext = url.toLowerCase().includes('.png') ? 'png' : 'jpg';
  const cacheUri = `${LegacyFS.cacheDirectory}vtailor-fabric-${Date.now()}.${ext}`;
  const cachePath = cacheUri.replace(/^file:\/\//, '');

  if (url.startsWith('content://') || url.startsWith('file://') || url.startsWith('/')) {
    const from = url.startsWith('/') && !url.startsWith('file://') ? `file://${url}` : url;
    await LegacyFS.copyAsync({ from, to: cachePath });
    return loadWithTextureLoader(toFileUri(cacheUri), true);
  }

  const path = url.replace(/^file:\/\//, '');
  const info = await LegacyFS.getInfoAsync(path);
  if (!info.exists) throw new Error('Local fabric file missing');
  await LegacyFS.copyAsync({ from: path, to: cachePath });
  return loadWithTextureLoader(toFileUri(cacheUri), true);
}

async function loadSingleUrl(url: string): Promise<THREE.Texture> {
  const key = url.trim();
  const cached = cache.get(key);
  if (cached && textureHasImage(cached)) return cached;

  const pending = inflight.get(key);
  if (pending) return pending;

  const task = (async () => {
    const isRemote = /^https?:\/\//i.test(key);
    const isLocal = key.startsWith('file://') || key.startsWith('/') || key.startsWith('content://');

    if (Platform.OS !== 'web' && isRemote) {
      try {
        const fileUrl = await downloadRemoteFabricImage(key);
        const tex = await loadWithTextureLoader(fileUrl, true);
        cache.set(key, tex);
        return tex;
      } catch (remoteErr) {
        console.warn(`${LOG} remote download path failed`, key.slice(0, 100), remoteErr);
      }
    }

    try {
      const tex = await loadWithTextureLoader(key, isLocal);
      cache.set(key, tex);
      return tex;
    } catch (firstErr) {
      if (Platform.OS !== 'web' && isLocal) {
        try {
          const tex = await loadLocalFileTexture(key.startsWith('/') ? `file://${key}` : key);
          cache.set(key, tex);
          return tex;
        } catch (localErr) {
          console.warn(`${LOG} local file fallback failed`, localErr);
        }
      }
      throw firstErr;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, task);
  return task;
}

/**
 * Load customer print — tries source → tile → megatile until one succeeds.
 */
export async function loadFabricPrintTexture(
  raw: string | null | undefined,
): Promise<THREE.Texture | null> {
  const candidates = fabricPrintTextureCandidates(raw);
  console.log(`${LOG} candidates`, candidates.map((u) => u.slice(0, 100)));

  let lastError: unknown = null;
  for (const url of candidates) {
    try {
      const tex = await loadSingleUrl(url);
      if (textureHasImage(tex)) return tex;
    } catch (err) {
      lastError = err;
      console.warn(`${LOG} candidate failed`, url.slice(0, 100), err);
    }
  }

  console.error(`${LOG} all candidates failed`, lastError);
  return null;
}

/** @deprecated Use loadFabricPrintTexture — kept for imports. */
export async function loadFabricTexture(
  url: string,
  _meta?: FabricPatternMeta,
): Promise<THREE.Texture> {
  const tex = await loadSingleUrl(url);
  return tex;
}

/** Simple shared texture per mesh (same image, modest repeat). */
export async function loadFabricTextureForMesh(
  url: string,
  _mesh: THREE.Mesh,
  _meta: FabricPatternMeta,
  _modelRoot?: THREE.Object3D | null,
): Promise<THREE.Texture> {
  return loadSingleUrl(url);
}

export function peekCachedFabricTexture(url: string): THREE.Texture | null {
  return cache.get(url.trim()) ?? null;
}

export function releaseFabricTexture(url: string | null | undefined): void {
  if (!url) return;
  const tex = cache.get(url.trim());
  if (!tex) return;
  tex.dispose();
  cache.delete(url.trim());
}

export { textureHasImage };
