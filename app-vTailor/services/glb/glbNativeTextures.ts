import { Platform } from 'react-native';
import * as THREE from 'three';
import * as LegacyFS from 'expo-file-system/legacy';
import {
  detectImageMime,
  readGlbChunks,
  type GltfJsonRoot,
} from './glbJsonUtils';

export type NativeTextureSlot =
  | 'map'
  | 'normalMap'
  | 'roughnessMap'
  | 'metalnessMap'
  | 'aoMap'
  | 'emissiveMap';

export type GlbMaterialTextureBinding = {
  materialIndex: number;
  slot: NativeTextureSlot;
  imageIndex: number;
};

function textureImageIndex(json: GltfJsonRoot, textureIndex: number): number | null {
  const src = json.textures?.[textureIndex]?.source;
  return src == null ? null : src;
}

function pushBinding(
  out: GlbMaterialTextureBinding[],
  json: GltfJsonRoot,
  materialIndex: number,
  slot: NativeTextureSlot,
  textureIndex: number | undefined,
): void {
  if (textureIndex == null) return;
  const imageIndex = textureImageIndex(json, textureIndex);
  if (imageIndex == null) return;
  out.push({ materialIndex, slot, imageIndex });
}

/** Read texture bindings from GLB JSON before strip (for post-parse texture apply). */
export function extractGlbMaterialTextureBindings(json: GltfJsonRoot): GlbMaterialTextureBinding[] {
  const bindings: GlbMaterialTextureBinding[] = [];
  const materials = json.materials;
  if (!materials?.length) return bindings;

  for (let i = 0; i < materials.length; i += 1) {
    const mat = materials[i];
    const pbr = mat.pbrMetallicRoughness;
    pushBinding(bindings, json, i, 'map', pbr?.baseColorTexture?.index);
    const mr = pbr?.metallicRoughnessTexture?.index;
    if (mr != null) {
      pushBinding(bindings, json, i, 'roughnessMap', mr);
      pushBinding(bindings, json, i, 'metalnessMap', mr);
    }
    pushBinding(bindings, json, i, 'normalMap', mat.normalTexture?.index);
    pushBinding(bindings, json, i, 'aoMap', mat.occlusionTexture?.index);
    pushBinding(bindings, json, i, 'emissiveMap', mat.emissiveTexture?.index);
  }

  return bindings;
}

/** Embedded GLB images as raw bytes (index matches glTF `images` array). */
export function extractGlbEmbeddedImageBytes(buf: ArrayBuffer): (Uint8Array | null)[] {
  const parsed = readGlbChunks(buf);
  if (!parsed?.binData || !parsed.json.images?.length) return [];

  const { json, binData } = parsed;
  const views = json.bufferViews;
  if (!views?.length) return [];

  return parsed.json.images.map((image) => {
    if (image.bufferView == null) return null;
    const view = views[image.bufferView];
    if (!view) return null;
    const offset = view.byteOffset ?? 0;
    const length = view.byteLength;
    if (length <= 0 || offset + length > binData.length) return null;
    return binData.subarray(offset, offset + length);
  });
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

function cacheFileForImage(imageIndex: number, bytes: Uint8Array, mime: string): string {
  const ext = mime.includes('jpeg') ? 'jpg' : mime.includes('webp') ? 'webp' : 'png';
  let hash = imageIndex;
  for (let i = 0; i < Math.min(bytes.length, 48); i += 1) {
    hash = (hash * 31 + bytes[i]!) | 0;
  }
  return `${LegacyFS.cacheDirectory}vt-glb-tex-${Math.abs(hash)}.${ext}`;
}

async function loadTextureFromBytes(bytes: Uint8Array, imageIndex: number): Promise<THREE.Texture> {
  const mime = detectImageMime(bytes);
  const path = cacheFileForImage(imageIndex, bytes, mime);
  const info = await LegacyFS.getInfoAsync(path);
  if (!info.exists) {
    await LegacyFS.writeAsStringAsync(path, bytesToBase64(bytes), {
      encoding: LegacyFS.EncodingType.Base64,
    });
  }

  const uri = path.startsWith('file://') ? path : `file://${path}`;

  return new Promise((resolve, reject) => {
    new THREE.TextureLoader().load(
      uri,
      (texture) => {
        texture.flipY = false;
        if ('colorSpace' in texture) {
          texture.colorSpace = THREE.SRGBColorSpace;
        }
        texture.needsUpdate = true;
        resolve(texture);
      },
      undefined,
      reject,
    );
  });
}

type GltfParseResult = {
  materials?: THREE.Material[];
  parser?: { materials: THREE.Material[] };
};

/**
 * React Native cannot load embedded GLB images via Blob / data: URI.
 * Apply textures after mesh-only parse using files in expo cache.
 */
export async function applyNativeGlbTextures(
  gltf: GltfParseResult,
  bindings: GlbMaterialTextureBinding[],
  imageBytes: (Uint8Array | null)[],
): Promise<void> {
  if (Platform.OS === 'web' || !bindings.length) return;

  const materials = gltf.materials ?? gltf.parser?.materials ?? [];
  if (!materials.length) return;

  const textureByImage = new Map<number, THREE.Texture>();

  const getTexture = async (imageIndex: number): Promise<THREE.Texture | null> => {
    const cached = textureByImage.get(imageIndex);
    if (cached) return cached;
    const bytes = imageBytes[imageIndex];
    if (!bytes?.length) return null;
    try {
      const tex = await loadTextureFromBytes(bytes, imageIndex);
      textureByImage.set(imageIndex, tex);
      return tex;
    } catch (err) {
      console.warn('[glbNativeTextures] image', imageIndex, err);
      return null;
    }
  };

  for (const binding of bindings) {
    const mat = materials[binding.materialIndex];
    if (!mat || !(mat instanceof THREE.MeshStandardMaterial)) continue;
    const tex = await getTexture(binding.imageIndex);
    if (!tex) continue;
    if (binding.slot === 'map' || binding.slot === 'emissiveMap') {
      if ('colorSpace' in tex) tex.colorSpace = THREE.SRGBColorSpace;
    } else if ('colorSpace' in tex) {
      tex.colorSpace = THREE.NoColorSpace;
    }
    mat[binding.slot] = tex;
    mat.needsUpdate = true;
  }
}
