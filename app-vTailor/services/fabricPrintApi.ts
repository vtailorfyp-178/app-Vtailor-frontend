import { fetchWithApiFallback } from '@/services/apiBase';
import { fetchWithModelsApiFallback } from '@/services/modelsApiBase';
import {
  buildFabricPrintSelectionFromUpload,
  serializeFabricPrintSelection,
  type FabricPatternMeta,
  type FabricPrintSelection,
} from '@/services/glb/fabricPrintSelection';

export type FabricPrintRecord = {
  id: string;
  userId: string;
  printName: string;
  printImage: string;
  cloudinaryUrl: string;
  tileUrl?: string;
  megatileUrl?: string;
  patternMeta?: FabricPatternMeta;
  publicId: string;
  uploadDate: string;
};

/** CDN URL for repeat tile (preserves motif sharpness). */
export function fabricPrintTextureUrl(cloudinaryUrl: string): string {
  if (!cloudinaryUrl) return cloudinaryUrl;
  if (!cloudinaryUrl.includes('res.cloudinary.com')) return cloudinaryUrl;
  const marker = '/upload/';
  const idx = cloudinaryUrl.indexOf(marker);
  if (idx === -1) return cloudinaryUrl;
  const prefix = cloudinaryUrl.slice(0, idx + marker.length);
  const suffix = cloudinaryUrl.slice(idx + marker.length);
  return `${prefix}q_auto:good,f_auto,c_limit,w_1024/${suffix}`;
}

export function fabricPrintSelectionFromRecord(record: FabricPrintRecord): FabricPrintSelection {
  return buildFabricPrintSelectionFromUpload({
    cloudinaryUrl: fabricPrintTextureUrl(record.cloudinaryUrl),
    tileUrl: record.tileUrl ? fabricPrintTextureUrl(record.tileUrl) : undefined,
    megatileUrl: record.megatileUrl ? fabricPrintTextureUrl(record.megatileUrl) : undefined,
    patternMeta: record.patternMeta,
  });
}

export function serializeFabricPrintRecord(record: FabricPrintRecord): string {
  return serializeFabricPrintSelection(fabricPrintSelectionFromRecord(record));
}

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

function buildUploadForm(params: {
  uri: string;
  userId: string;
  printName?: string;
  mimeType?: string;
  fileName?: string;
}): FormData {
  const form = new FormData();
  const name = params.fileName || `fabric-print-${Date.now()}.jpg`;
  const type = params.mimeType || 'image/jpeg';
  form.append('file', { uri: params.uri, name, type } as unknown as Blob);
  form.append('userId', params.userId);
  if (params.printName) form.append('printName', params.printName);
  return form;
}

async function postFabricPrintUpload(form: FormData): Promise<FabricPrintRecord> {
  try {
    const res = await fetchWithApiFallback('/fabric-prints/upload', {
      method: 'POST',
      body: form,
    });
    return parseJson<FabricPrintRecord>(res);
  } catch (primaryErr) {
    try {
      const res = await fetchWithModelsApiFallback('/fabric-prints/upload', {
        method: 'POST',
        body: form,
      });
      return parseJson<FabricPrintRecord>(res);
    } catch {
      throw primaryErr;
    }
  }
}

export async function uploadFabricPrintSelection(params: {
  uri: string;
  userId: string;
  printName?: string;
  mimeType?: string;
  fileName?: string;
}): Promise<FabricPrintSelection> {
  const data = await postFabricPrintUpload(buildUploadForm(params));
  return fabricPrintSelectionFromRecord(data);
}

export async function listFabricPrints(userId: string): Promise<FabricPrintRecord[]> {
  try {
    const res = await fetchWithApiFallback(
      `/fabric-prints?userId=${encodeURIComponent(userId)}`,
    );
    const data = await parseJson<{ prints: FabricPrintRecord[] }>(res);
    return (data.prints || []).map((p) => ({
      ...p,
      cloudinaryUrl: fabricPrintTextureUrl(p.cloudinaryUrl),
      tileUrl: p.tileUrl ? fabricPrintTextureUrl(p.tileUrl) : undefined,
      megatileUrl: p.megatileUrl ? fabricPrintTextureUrl(p.megatileUrl) : undefined,
    }));
  } catch {
    const res = await fetchWithModelsApiFallback(
      `/fabric-prints?userId=${encodeURIComponent(userId)}`,
    );
    const data = await parseJson<{ prints: FabricPrintRecord[] }>(res);
    return (data.prints || []).map((p) => ({
      ...p,
      cloudinaryUrl: fabricPrintTextureUrl(p.cloudinaryUrl),
      tileUrl: p.tileUrl ? fabricPrintTextureUrl(p.tileUrl) : undefined,
      megatileUrl: p.megatileUrl ? fabricPrintTextureUrl(p.megatileUrl) : undefined,
    }));
  }
}
