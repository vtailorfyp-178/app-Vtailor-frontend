import { Platform } from 'react-native';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import {
  FALLBACK_GLB_PATH,
  resolveGlbModelUrl,
  type GlbModelPath,
} from './glbModelUrl';
import { GlbLoadSupersededError, isAbortLikeError, isGlbLoadSupersededError } from './glbFetchErrors';
import { getCachedGlbBuffer, setCachedGlbBuffer } from './glbModelCache';
import {
  getCachedParsedScene,
  hasCachedParsedScene,
  setCachedParsedScene,
} from './glbParsedSceneCache';
import { isGlbArrayBuffer } from './glbBufferUtils';
import { injectGlbEmbeddedImageDataUris } from './injectGlbEmbeddedImageDataUris';
import { stripGlbTexturesForNative } from './stripGlbTextures';
import { prepareGltfSceneForDisplay } from './gltfSceneDisplay';
import { isCasualFabricDressGlbUrl, isFrillSareeGlbUrl } from './casualFabricDress';
import { glbNeedsEmbeddedTextures } from './glbMaterialPolicy';
import { diagnoseGlbBuffer, logGlbMaterialDiagnostics } from './glbDiagnostics';
import { runExclusiveGlbTask } from './glbLoadMutex';
import { warmGlbDiskCache } from './glbDiskCache';
import { glbUsesDracoCompression, readGlbChunks } from './glbJsonUtils';
import {
  applyNativeGlbTextures,
  extractGlbEmbeddedImageBytes,
  extractGlbMaterialTextureBindings,
} from './glbNativeTextures';

const LOAD_TIMEOUT_MS = Platform.OS === 'web' ? 120000 : 90000;
const NATIVE_MAX_GLB_BYTES = 14 * 1024 * 1024;

const LONG_FROCK_FALLBACK_PATH: GlbModelPath =
  '3d model/3d long frock/mobile/white round neck full sleeves flarred.glb';

let webFetchGeneration = 0;
const inflightDownloads = new Map<string, Promise<ArrayBuffer>>();

let sharedDracoLoader: DRACOLoader | null = null;

const DRACO_DECODER_PATH = 'https://www.gstatic.com/draco/versioned/decoders/1.5.7/';

/** Draco only on web — native dress preview uses WebView (model-viewer), not Three parse. */
function createGltfLoader(): GLTFLoader {
  const loader = new GLTFLoader();
  if (Platform.OS === 'web') {
    if (!sharedDracoLoader) {
      sharedDracoLoader = new DRACOLoader();
      sharedDracoLoader.setDecoderPath(DRACO_DECODER_PATH);
    }
    loader.setDRACOLoader(sharedDracoLoader);
  }
  return loader;
}

function xhrArrayBuffer(uri: string, timeoutMs: number): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const timer = setTimeout(() => {
      xhr.abort();
      reject(new Error('Model download timed out. Check your connection.'));
    }, timeoutMs);

    xhr.open('GET', uri, true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = () => {
      clearTimeout(timer);
      const buf = xhr.response as ArrayBuffer | null;
      if (xhr.status >= 200 && xhr.status < 300 && buf && buf.byteLength >= 80) {
        resolve(buf);
        return;
      }
      reject(new Error(`Could not load model (HTTP ${xhr.status}).`));
    };
    xhr.onerror = () => {
      clearTimeout(timer);
      reject(new Error('Network error while loading model.'));
    };
    xhr.onabort = () => {
      clearTimeout(timer);
      reject(new Error('Model download was cancelled.'));
    };
    xhr.send();
  });
}

async function downloadGlbBuffer(url: string): Promise<ArrayBuffer> {
  if (Platform.OS === 'web') {
    const gen = ++webFetchGeneration;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), LOAD_TIMEOUT_MS);
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error(`Could not load model (${res.status}).`);
      const buf = await res.arrayBuffer();
      if (gen !== webFetchGeneration) throw new GlbLoadSupersededError();
      return buf;
    } catch (err) {
      if (isAbortLikeError(err)) throw new GlbLoadSupersededError();
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }
  return xhrArrayBuffer(url, LOAD_TIMEOUT_MS);
}

function assertNativeSize(buf: ArrayBuffer): void {
  if (Platform.OS === 'web') return;
  if (buf.byteLength > NATIVE_MAX_GLB_BYTES) {
    throw new Error(
      '3D model is too large for this device. Ensure mobile GLB files exist on the server.',
    );
  }
}

/** Store raw GLB bytes. On native, never fall back to full-quality (OOM). */
export async function fetchGlbBuffer(url: string): Promise<ArrayBuffer> {
  const cached = getCachedGlbBuffer(url);
  if (cached) return cached;

  let inflight = inflightDownloads.get(url);
  if (!inflight) {
    inflight = downloadGlbBuffer(url).finally(() => {
      inflightDownloads.delete(url);
    });
    inflightDownloads.set(url, inflight);
  }

  const buf = await inflight;

  if (buf.byteLength < 80 || !isGlbArrayBuffer(buf)) {
    throw new Error('Model file is missing or not a valid GLB (check backend 3dModels folder).');
  }

  assertNativeSize(buf);
  setCachedGlbBuffer(url, buf);
  return buf;
}

/** Warm GLB download — memory cache (Three.js) + disk cache (native WebView). */
export function prefetchGlbBuffer(url: string): void {
  if (!url || getCachedGlbBuffer(url)) return;
  if (!/^https?:\/\//i.test(url)) return;
  void fetchGlbBuffer(url).catch(() => {});
  if (Platform.OS !== 'web') {
    warmGlbDiskCache(url);
  }
}

let prefetchParseChain: Promise<void> = Promise.resolve();
const prefetchParseQueued = new Set<string>();

function schedulePrefetchParse(url: string): void {
  if (!url || !/^https?:\/\//i.test(url)) return;
  if (hasCachedParsedScene(url) || prefetchParseQueued.has(url)) return;
  prefetchParseQueued.add(url);
  prefetchParseChain = prefetchParseChain.then(async () => {
    prefetchParseQueued.delete(url);
    if (hasCachedParsedScene(url)) return;
    try {
      const buf = await fetchGlbBuffer(url);
      if (hasCachedParsedScene(url)) return;
      await runExclusiveGlbTask(async () => {
        if (hasCachedParsedScene(url)) return;
        const model = await parseBuffer(buf, null, url);
        setCachedParsedScene(url, model);
      });
    } catch {
      /* background warm */
    }
  });
}

/** Download + parse in background so the next tap shows instantly (web Three.js only). */
export function prefetchGltfScene(url: string): void {
  prefetchGlbBuffer(url);
  if (Platform.OS === 'web') {
    schedulePrefetchParse(url);
  }
}

export { glbNeedsEmbeddedTextures } from './glbMaterialPolicy';

function buffersForNativeParse(buf: ArrayBuffer, modelUrl?: string): ArrayBuffer[] {
  if (Platform.OS === 'web') return [buf];

  const attempts: ArrayBuffer[] = [];
  const seen = new Set<ArrayBuffer>();
  const push = (b: ArrayBuffer) => {
    if (!seen.has(b)) {
      seen.add(b);
      attempts.push(b);
    }
  };

  const injected = injectGlbEmbeddedImageDataUris(buf);
  push(injected);
  if (injected !== buf) push(buf);

  const usesDraco = glbUsesDracoCompression(buf);
  if (!usesDraco && !glbNeedsEmbeddedTextures(modelUrl)) {
    try {
      push(stripGlbTexturesForNative(buf));
    } catch {
      /* raw + injected only */
    }
  }

  return attempts.length ? attempts : [buf];
}

function isNativeThreeParseError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /turboModuleProxy|createObjectURL|ArrayBufferView|Creating blobs|Couldn't load texture|slice' of null|DRACO|draco|Could not parse/i.test(
    msg,
  );
}

/** Only swap to another dress file when download fails — not on parse/texture errors. */
function isGlbNetworkError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /HTTP\s*\d{3}|network error|timed out|Could not load model \(|download timed out/i.test(msg);
}

async function parseBuffer(
  buf: ArrayBuffer,
  _fabricColorHex?: string | null,
  modelUrl?: string,
): Promise<THREE.Object3D> {
  if (!isGlbArrayBuffer(buf)) {
    throw new Error('Downloaded file is not a valid GLB.');
  }

  if (modelUrl && __DEV__) {
    const diag = diagnoseGlbBuffer(buf, modelUrl);
    if (diag) logGlbMaterialDiagnostics(diag);
  }

  const preserveTextures = glbNeedsEmbeddedTextures(modelUrl);
  const patiyalaTint = isCasualFabricDressGlbUrl(modelUrl) && !preserveTextures;
  const chiffon = isFrillSareeGlbUrl(modelUrl);
  const loader = createGltfLoader();

  if (Platform.OS !== 'web') {
    const chunks = readGlbChunks(buf);
    const bindings = chunks ? extractGlbMaterialTextureBindings(chunks.json) : [];
    const imageBytes = extractGlbEmbeddedImageBytes(buf);
    const hasEmbeddedTextures = bindings.length > 0 || glbNeedsEmbeddedTextures(modelUrl);
    const parseBuf = hasEmbeddedTextures ? stripGlbTexturesForNative(buf) : buf;

    try {
      const gltf = await loader.parseAsync(parseBuf, '');
      if (bindings.length) {
        await applyNativeGlbTextures(gltf, bindings, imageBytes);
      }
      return prepareGltfSceneForDisplay(gltf.scene, null, {
        patiyalaTint,
        preserveTextures,
        chiffon,
      });
    } catch (nativeErr) {
      const msg = nativeErr instanceof Error ? nativeErr.message : String(nativeErr);
      throw new Error(`Could not parse 3D model: ${msg}`);
    }
  }

  const attempts = buffersForNativeParse(buf, modelUrl);
  let lastError: unknown = null;
  for (const attempt of attempts) {
    try {
      const gltf = await loader.parseAsync(attempt, '');
      return prepareGltfSceneForDisplay(gltf.scene, null, {
        patiyalaTint,
        preserveTextures,
        chiffon,
      });
    } catch (err) {
      lastError = err;
    }
  }

  const msg = lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(`Could not parse 3D model: ${msg}`);
}

function cloneCachedScene(template: THREE.Object3D): THREE.Object3D {
  return template.clone(true);
}

async function loadGltfFromUrlInner(
  modelUrl: string,
  fabricColorHex?: string | null,
  options?: { allowFallback?: boolean },
): Promise<LoadGltfResult> {
  const allowFallback = options?.allowFallback !== false;

  const cachedScene = getCachedParsedScene(modelUrl);
  if (cachedScene) {
    return {
      model: cloneCachedScene(cachedScene),
      usedFallback: false,
      resolvedUrl: modelUrl,
    };
  }

  try {
    const buf = await fetchGlbBuffer(modelUrl);
    const model = await runExclusiveGlbTask(() =>
      parseBuffer(buf, fabricColorHex, modelUrl),
    );
    setCachedParsedScene(modelUrl, model);
    return {
      model: cloneCachedScene(model),
      usedFallback: false,
      resolvedUrl: modelUrl,
    };
  } catch (primaryErr) {
    if (isGlbLoadSupersededError(primaryErr)) throw primaryErr;
    if (!allowFallback || !isGlbNetworkError(primaryErr)) throw primaryErr;

    console.warn('[loadGltfFromUrl] download failed, trying fallback path:', primaryErr);
    const isLongFrock = decodeURIComponent(modelUrl).includes('3d long frock');
    const fallbackPath = isLongFrock
      ? LONG_FROCK_FALLBACK_PATH
      : (await import('./patiyalaDressGlb')).resolveCasualPatiyalaShortShirtGlb(
          {
            neck: 'round',
            sleeves: 'full',
            bottom: 'patiyala',
            colors: null,
            'frock-style': null,
            'saree-style': null,
          },
          'shalwar-kameez-short',
        ) ?? FALLBACK_GLB_PATH;
    const fallbackUrl = await resolveGlbModelUrl(fallbackPath);
    if (fallbackUrl === modelUrl) throw primaryErr;

    const buf = await fetchGlbBuffer(fallbackUrl);
    const model = await parseBuffer(buf, fabricColorHex, fallbackUrl);
    return { model, usedFallback: true, resolvedUrl: fallbackUrl };
  }
}

export type LoadGltfResult = {
  model: THREE.Object3D;
  usedFallback: boolean;
  resolvedUrl: string;
};

export { isNativeThreeParseError };

export function loadGltfFromUrl(
  modelUrl: string,
  fabricColorHex?: string | null,
  options?: { allowFallback?: boolean },
): Promise<LoadGltfResult> {
  return loadGltfFromUrlInner(modelUrl, fabricColorHex, options);
}

export async function loadGltfFromModelPath(
  relativePath: GlbModelPath,
  modelUrl: string,
  fabricColorHex?: string | null,
): Promise<LoadGltfResult> {
  void relativePath;
  return loadGltfFromUrl(modelUrl, fabricColorHex);
}
