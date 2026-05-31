import { fetchWithApiFallback } from '@/services/apiBase';
import { resolveGlbModelUrl } from '@/services/glb/glbModelUrl';

export const MEASUREMENT_GLB_PATH = '3d model/measurement/mobile/measurement-model.glb';

export type MeasurementModelRecord = {
  id: string;
  name: string;
  type: 'measurement';
  modelUrl: string;
  publicId?: string;
  createdAt?: string | null;
  fallback?: boolean;
};

const CACHE_TTL_MS = 5 * 60 * 1000;
let cached: { at: number; record: MeasurementModelRecord } | null = null;

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

export async function fetchMeasurementModel(name = 'measurement-model'): Promise<MeasurementModelRecord> {
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.record;
  }

  try {
    const res = await fetchWithApiFallback(`/measurement-models/${encodeURIComponent(name)}`, {
      method: 'GET',
    });
    const record = await parseJson<MeasurementModelRecord>(res);
    if (record.modelUrl && !record.fallback) {
      cached = { at: Date.now(), record };
      return record;
    }
  } catch {
    /* fall through to bundled / static GLB */
  }

  const localUrl = await resolveGlbModelUrl(MEASUREMENT_GLB_PATH);
  const record: MeasurementModelRecord = {
    id: '',
    name,
    type: 'measurement',
    modelUrl: localUrl,
    fallback: true,
  };
  cached = { at: Date.now(), record };
  return record;
}

export function clearMeasurementModelCache(): void {
  cached = null;
}
