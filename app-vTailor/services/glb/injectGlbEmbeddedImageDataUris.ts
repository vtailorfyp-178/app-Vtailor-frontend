/**
 * React Native cannot use Blob URLs for GLB-embedded images.
 * Inline images as data: URIs in the JSON chunk so GLTFLoader can load textures.
 */
const GLB_MAGIC = 0x46546c67;
const JSON_CHUNK_TYPE = 0x4e4f534a;
const BIN_CHUNK_TYPE = 0x004e4942;

function pad4(n: number): number {
  return (n + 3) & ~3;
}

type GltfJson = {
  bufferViews?: Array<{ buffer?: number; byteOffset?: number; byteLength: number }>;
  images?: Array<{
    bufferView?: number;
    mimeType?: string;
    uri?: string;
  }>;
};

function detectMime(bytes: Uint8Array): string {
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50) return 'image/png';
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xd8) return 'image/jpeg';
  if (bytes.length >= 12 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
    return 'image/webp';
  }
  return 'image/png';
}

function bytesToBase64(bytes: Uint8Array): string {
  const chunk = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunk) {
    const slice = bytes.subarray(i, Math.min(i + chunk, bytes.length));
    binary += String.fromCharCode(...slice);
  }
  return btoa(binary);
}

function readGlbChunks(buf: ArrayBuffer): {
  json: GltfJson;
  jsonLen: number;
  binData: Uint8Array | null;
} | null {
  if (buf.byteLength < 20) return null;
  const view = new DataView(buf);
  if (view.getUint32(0, true) !== GLB_MAGIC || view.getUint32(4, true) !== 2) return null;

  const jsonLen = view.getUint32(12, true);
  const jsonType = view.getUint32(16, true);
  if (jsonType !== JSON_CHUNK_TYPE || jsonLen <= 0) return null;

  const jsonStart = 20;
  if (jsonStart + jsonLen > buf.byteLength) return null;

  let json: GltfJson;
  try {
    json = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, jsonStart, jsonLen))) as GltfJson;
  } catch {
    return null;
  }

  const jsonPaddedLen = pad4(jsonLen);
  const binOffset = 20 + jsonPaddedLen;
  if (binOffset + 8 > buf.byteLength) return { json, jsonLen, binData: null };

  const binLen = view.getUint32(binOffset, true);
  if (view.getUint32(binOffset + 4, true) !== BIN_CHUNK_TYPE) return { json, jsonLen, binData: null };

  const binPaddedLen = pad4(binLen);
  const binDataStart = binOffset + 8;
  if (binDataStart + binPaddedLen > buf.byteLength) return { json, jsonLen, binData: null };

  return {
    json,
    jsonLen,
    binData: new Uint8Array(buf, binDataStart, binPaddedLen),
  };
}

function rebuildGlb(json: GltfJson, originalJsonLen: number, binData: Uint8Array | null): ArrayBuffer {
  const newJsonBytes = new TextEncoder().encode(JSON.stringify(json));
  const newJsonPaddedLen = pad4(newJsonBytes.length);
  const paddedJson = new Uint8Array(newJsonPaddedLen);
  paddedJson.set(newJsonBytes);

  const oldJsonPaddedLen = pad4(originalJsonLen);
  const binPaddedLen = binData ? pad4(binData.length) : 0;
  const totalLen = 12 + 8 + newJsonPaddedLen + (binData ? 8 + binPaddedLen : 0);
  const out = new ArrayBuffer(totalLen);
  const outView = new DataView(out);
  const outBytes = new Uint8Array(out);

  outView.setUint32(0, GLB_MAGIC, true);
  outView.setUint32(4, 2, true);
  outView.setUint32(8, totalLen, true);
  outView.setUint32(12, newJsonBytes.length, true);
  outView.setUint32(16, JSON_CHUNK_TYPE, true);
  outBytes.set(paddedJson, 20);

  if (binData) {
    const binHdrOff = 20 + newJsonPaddedLen;
    outView.setUint32(binHdrOff, binData.length, true);
    outView.setUint32(binHdrOff + 4, BIN_CHUNK_TYPE, true);
    outBytes.set(binData.subarray(0, binData.length), binHdrOff + 8);
  }

  return out;
}

export function injectGlbEmbeddedImageDataUris(buf: ArrayBuffer): ArrayBuffer {
  const parsed = readGlbChunks(buf);
  if (!parsed?.binData || !Array.isArray(parsed.json.images) || !parsed.json.images.length) {
    return buf;
  }

  const { json, jsonLen, binData } = parsed;
  const views = json.bufferViews;
  if (!views?.length) return buf;

  let changed = false;

  for (const image of json.images ?? []) {
    if (image.uri || image.bufferView == null) continue;
    const view = views[image.bufferView];
    if (!view) continue;

    const offset = view.byteOffset ?? 0;
    const length = view.byteLength;
    if (length <= 0 || offset + length > binData.length) continue;

    const bytes = binData.subarray(offset, offset + length);
    const mime = image.mimeType || detectMime(bytes);
    const dataUri = `data:${mime};base64,${bytesToBase64(bytes)}`;
    image.uri = dataUri;
    delete image.bufferView;
    delete image.mimeType;
    changed = true;
  }

  if (!changed) return buf;
  return rebuildGlb(json, jsonLen, binData);
}
