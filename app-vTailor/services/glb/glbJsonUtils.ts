const GLB_MAGIC = 0x46546c67;
const JSON_CHUNK_TYPE = 0x4e4f534a;
const BIN_CHUNK_TYPE = 0x004e4942;

export function pad4(n: number): number {
  return (n + 3) & ~3;
}

export type GltfJsonRoot = {
  bufferViews?: Array<{ buffer?: number; byteOffset?: number; byteLength: number }>;
  images?: Array<{
    bufferView?: number;
    mimeType?: string;
    uri?: string;
  }>;
  textures?: Array<{ source?: number }>;
  materials?: Array<{
    pbrMetallicRoughness?: {
      baseColorTexture?: { index: number };
      metallicRoughnessTexture?: { index: number };
    };
    normalTexture?: { index: number };
    occlusionTexture?: { index: number };
    emissiveTexture?: { index: number };
  }>;
};

export function readGlbChunks(buf: ArrayBuffer): {
  json: GltfJsonRoot;
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

  let json: GltfJsonRoot;
  try {
    json = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, jsonStart, jsonLen))) as GltfJsonRoot;
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

export function glbUsesDracoCompression(buf: ArrayBuffer): boolean {
  try {
    const view = new DataView(buf);
    if (view.byteLength < 24 || view.getUint32(0, true) !== GLB_MAGIC) return false;
    const jsonLen = view.getUint32(12, true);
    if (jsonLen <= 0 || jsonLen > 8_000_000) return false;
    const json = new TextDecoder().decode(new Uint8Array(buf, 20, jsonLen));
    return json.includes('KHR_draco_mesh_compression');
  } catch {
    return false;
  }
}

export function detectImageMime(bytes: Uint8Array): string {
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50) return 'image/png';
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xd8) return 'image/jpeg';
  if (bytes.length >= 12 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
    return 'image/webp';
  }
  return 'image/png';
}
