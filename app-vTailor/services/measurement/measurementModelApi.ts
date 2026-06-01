import { fetchWithApiFallback } from '@/services/apiBase';
import { warmGlbDiskCache } from '@/services/glb/glbDiskCache';
import {
  buildGlbModelUrl,
  resolveGlbModelUrl,
  resolveGlbModelsOrigin,
} from '@/services/glb/glbModelUrl';
import { getCloudinaryUrlForPath, useCloudinaryModels } from '@/services/glb/cloudinaryModelCatalog';

export const MEASUREMENT_GLB_PATH = '3d model/measurement/mobile/measurement-model.glb';

/** Known-good Cloudinary URL (matches MongoDB registration). Works without backend. */
export const MEASUREMENT_MODEL_CLOUDINARY_FALLBACK =
  'https://res.cloudinary.com/db7k22ekb/raw/upload/v1780245604/vtailor-models/measurement-models/measurement-model';

export type MeasurementModelRecord = {
  id: string;
  name: string;
  type: 'measurement';
  modelUrl: string;
  publicId?: string;
  createdAt?: string | null;
  fallback?: boolean;
};

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
let cached: { at: number; record: MeasurementModelRecord } | null = null;
let prefetchPromise: Promise<MeasurementModelRecord> | null = null;

async function parseJson<T>(res: Response): Promise<T> {
  const body = (await res.json().catch(() => ({}))) as T & { detail?: string | { msg?: string }[] };
  if (!res.ok) {
    const detail = body.detail;
    const message =
      typeof detail === 'string'
        ? detail
        : Array.isArray(detail)
          ? detail.map((d) => d?.msg || String(d)).join(', ')
          : `Request failed (${res.status})`;
    throw new Error(message);
  }
  return body;
}

function storeRecord(record: MeasurementModelRecord): MeasurementModelRecord {
  cached = { at: Date.now(), record };
  if (record.modelUrl && /^https?:\/\//i.test(record.modelUrl)) {
    warmGlbDiskCache(record.modelUrl);
  }
  return record;
}

export function getCachedMeasurementModel(): MeasurementModelRecord | null {
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.record;
  }
  return null;
}

/** HTTPS URLs to try in WebView (never file:// — breaks GLTFLoader in RN WebView). */
export function getMeasurementModelUrlCandidates(): string[] {
  const urls: string[] = [];
  const envUrl = (process.env.EXPO_PUBLIC_MEASUREMENT_MODEL_URL || '').trim();
  if (envUrl && /^https?:\/\//i.test(envUrl)) {
    urls.push(envUrl);
  }

  if (useCloudinaryModels()) {
    const embedded = getCloudinaryUrlForPath(MEASUREMENT_GLB_PATH);
    if (embedded) urls.push(embedded);
  }

  urls.push(MEASUREMENT_MODEL_CLOUDINARY_FALLBACK);

  const seen = new Set<string>();
  return urls.filter((u) => {
    const key = u.replace(/\/$/, '');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function localStaticMeasurementUrl(): Promise<string | null> {
  try {
    const origin = await resolveGlbModelsOrigin();
    return buildGlbModelUrl(MEASUREMENT_GLB_PATH, origin);
  } catch {
    return null;
  }
}

async function fetchMeasurementModelFromApi(name: string): Promise<MeasurementModelRecord | null> {
  try {
    const res = await fetchWithApiFallback(`/measurement-models/${encodeURIComponent(name)}`, {
      method: 'GET',
    });
    const record = await parseJson<MeasurementModelRecord>(res);
    if (record.modelUrl && !record.fallback) {
      return record;
    }
  } catch {
    /* backend optional — Cloudinary fallback works offline from API */
  }
  return null;
}

/** Warm URL + disk cache at app start so the mannequin opens faster. */
export function prefetchMeasurementModelAsset(): Promise<MeasurementModelRecord> {
  if (!prefetchPromise) {
    prefetchPromise = fetchMeasurementModel().catch((err) => {
      prefetchPromise = null;
      throw err;
    });
  }
  return prefetchPromise;
}

export async function fetchMeasurementModel(name = 'measurement-model'): Promise<MeasurementModelRecord> {
  const hit = getCachedMeasurementModel();
  if (hit) return hit;

  const candidates = getMeasurementModelUrlCandidates();

  // Prefer instant Cloudinary URL — no backend round-trip required on phone.
  const instant: MeasurementModelRecord = {
    id: '',
    name,
    type: 'measurement',
    modelUrl: candidates[0],
    fallback: true,
  };
  storeRecord(instant);

  // Refresh from API / catalog / local static in background when reachable.
  void (async () => {
    const apiRecord = await fetchMeasurementModelFromApi(name);
    if (apiRecord?.modelUrl) {
      storeRecord(apiRecord);
      return;
    }

    const resolvedUrl = await resolveGlbModelUrl(MEASUREMENT_GLB_PATH).catch(() => null);
    if (resolvedUrl && /^https?:\/\//i.test(resolvedUrl)) {
      storeRecord({ ...instant, modelUrl: resolvedUrl });
      return;
    }

    const localUrl = await localStaticMeasurementUrl();
    if (localUrl && !candidates.includes(localUrl)) {
      storeRecord({ ...instant, modelUrl: localUrl });
    }
  })();

  return instant;
}

export function clearMeasurementModelCache(): void {
  cached = null;
  prefetchPromise = null;
}
