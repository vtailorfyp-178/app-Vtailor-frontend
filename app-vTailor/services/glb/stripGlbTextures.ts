/**
 * React Native cannot create Blob URLs from embedded GLB image bufferViews.
 * Remove image/texture references from the JSON chunk so GLTFLoader skips them.
 */
const GLB_MAGIC = 0x46546c67;
const JSON_CHUNK_TYPE = 0x4e4f534a;
const BIN_CHUNK_TYPE = 0x004e4942;

function pad4(n: number): number {
  return (n + 3) & ~3;
}

type GltfJson = {
  images?: unknown[];
  textures?: unknown[];
  samplers?: unknown[];
  materials?: Array<{
    pbrMetallicRoughness?: Record<string, unknown>;
    normalTexture?: unknown;
    occlusionTexture?: unknown;
    emissiveTexture?: unknown;
  }>;
};

export function stripGlbTexturesForNative(buf: ArrayBuffer): ArrayBuffer {
  if (buf.byteLength < 20) return buf;

  const view = new DataView(buf);
  if (view.getUint32(0, true) !== GLB_MAGIC || view.getUint32(4, true) !== 2) return buf;

  const jsonLen = view.getUint32(12, true);
  const jsonType = view.getUint32(16, true);
  if (jsonType !== JSON_CHUNK_TYPE || jsonLen <= 0) return buf;

  const jsonStart = 20;
  if (jsonStart + jsonLen > buf.byteLength) return buf;

  let json: GltfJson;
  try {
    json = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, jsonStart, jsonLen))) as GltfJson;
  } catch {
    return buf;
  }

  if (!json.images?.length && !json.textures?.length) return buf;

  delete json.images;
  delete json.textures;
  delete json.samplers;

  if (Array.isArray(json.materials)) {
    for (const mat of json.materials) {
      const pbr = mat.pbrMetallicRoughness;
      if (pbr) {
        delete pbr.baseColorTexture;
        delete pbr.metallicRoughnessTexture;
      }
      delete mat.normalTexture;
      delete mat.occlusionTexture;
      delete mat.emissiveTexture;
    }
  }

  const newJsonBytes = new TextEncoder().encode(JSON.stringify(json));
  const newJsonPaddedLen = pad4(newJsonBytes.length);
  const paddedJson = new Uint8Array(newJsonPaddedLen);
  paddedJson.set(newJsonBytes);

  const oldJsonPaddedLen = pad4(jsonLen);
  const binOffset = 20 + oldJsonPaddedLen;
  if (binOffset + 8 > buf.byteLength) return buf;

  const binLen = view.getUint32(binOffset, true);
  if (view.getUint32(binOffset + 4, true) !== BIN_CHUNK_TYPE) return buf;

  const binPaddedLen = pad4(binLen);
  const binDataStart = binOffset + 8;
  if (binDataStart + binPaddedLen > buf.byteLength) return buf;
  const binData = new Uint8Array(buf, binDataStart, binPaddedLen);

  const totalLen = 12 + 8 + newJsonPaddedLen + 8 + binPaddedLen;
  const out = new ArrayBuffer(totalLen);
  const outView = new DataView(out);
  const outBytes = new Uint8Array(out);

  outView.setUint32(0, GLB_MAGIC, true);
  outView.setUint32(4, 2, true);
  outView.setUint32(8, totalLen, true);
  outView.setUint32(12, newJsonBytes.length, true);
  outView.setUint32(16, JSON_CHUNK_TYPE, true);
  outBytes.set(paddedJson, 20);

  const binHdrOff = 20 + newJsonPaddedLen;
  outView.setUint32(binHdrOff, binLen, true);
  outView.setUint32(binHdrOff + 4, BIN_CHUNK_TYPE, true);
  outBytes.set(binData, binHdrOff + 8);

  return out;
}
