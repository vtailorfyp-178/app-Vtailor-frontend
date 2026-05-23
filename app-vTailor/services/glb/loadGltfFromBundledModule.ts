import { Asset } from 'expo-asset';
import Constants from 'expo-constants';
import { Image, Platform } from 'react-native';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import * as LegacyFS from 'expo-file-system/legacy';
import { stripGlbTexturesForNative } from './stripGlbTextures';
import { sanitizeGltfMaterialNames } from './sanitizeGltfMaterialNames';

const FABRIC_MESH_SKIP = /mannequin|mannicun|human|skin|hair|face|hand|foot|shoe|eye|lash|body/i;

let sharedDracoLoader: DRACOLoader | null = null;

function createGltfLoader(): GLTFLoader {
  const loader = new GLTFLoader();
  if (Platform.OS === 'web') {
    if (!sharedDracoLoader) {
      sharedDracoLoader = new DRACOLoader();
      sharedDracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
    }
    loader.setDRACOLoader(sharedDracoLoader);
  }
  return loader;
}

function normalizeDevAssetUri(uri: string): string {
  if (!/localhost|127\.0\.0\.1/.test(uri)) return uri;
  const debuggerHost =
    Constants.expoConfig?.hostUri ??
    (Constants as { manifest2?: { extra?: { expoGo?: { debuggerHost?: string } } } }).manifest2?.extra
      ?.expoGo?.debuggerHost;
  const host = debuggerHost?.split(':')[0];
  return host ? uri.replace(/localhost|127\.0\.0\.1/g, host) : uri;
}

async function resolveAssetUri(assetModule: number): Promise<string> {
  try {
    await Asset.loadAsync(assetModule as never);
    const asset = Asset.fromModule(assetModule);
    await asset.downloadAsync();
    const fromAsset = asset.localUri ?? asset.uri;
    if (fromAsset) return normalizeDevAssetUri(fromAsset);
  } catch (err) {
    console.warn('[loadGltf] Asset cache failed, using Metro URI:', err);
  }

  const fromImage = Image.resolveAssetSource(assetModule)?.uri;
  if (fromImage) return normalizeDevAssetUri(fromImage);

  throw new Error('Model asset URI missing.');
}

function xhrArrayBuffer(uri: string): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', uri, true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = () => {
      const buf = xhr.response as ArrayBuffer | null;
      if (buf && buf.byteLength >= 80) {
        resolve(buf);
        return;
      }
      reject(new Error(`Could not read model (HTTP ${xhr.status}).`));
    };
    xhr.onerror = () => reject(new Error('Network error while loading model.'));
    xhr.send();
  });
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const clean = base64.replace(/\s/g, '');
  const chars = atob(clean);
  const bytes = new Uint8Array(chars.length);
  for (let i = 0; i < chars.length; i += 1) {
    bytes[i] = chars.charCodeAt(i);
  }
  return bytes.buffer;
}

async function readUriAsArrayBuffer(uri: string): Promise<ArrayBuffer> {
  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    try {
      return await xhrArrayBuffer(uri);
    } catch {
      /* fall through */
    }
  }

  if (Platform.OS !== 'web' && uri.startsWith('file://')) {
    try {
      const b64 = await LegacyFS.readAsStringAsync(uri, {
        encoding: LegacyFS.EncodingType.Base64,
      });
      const buf = base64ToArrayBuffer(b64);
      if (buf.byteLength >= 80) return buf;
    } catch {
      /* fall through */
    }
  }

  return xhrArrayBuffer(uri);
}

function applyMatteFabricMaterial(mat: THREE.MeshStandardMaterial, isDressFabric: boolean): void {
  mat.side = THREE.DoubleSide;
  if (isDressFabric) {
    mat.metalness = 0;
    mat.roughness = 0.94;
    if ('envMapIntensity' in mat) mat.envMapIntensity = 0.06;
  } else {
    mat.metalness = Math.min(mat.metalness ?? 0, 0.04);
    mat.roughness = Math.max(mat.roughness ?? 0.5, 0.62);
  }
  mat.emissive.setHex(0x000000);
  mat.emissiveIntensity = 0;
  mat.needsUpdate = true;
}

function prepareDressRoot(scene: THREE.Object3D, fabricColorHex?: string | null): THREE.Object3D {
  sanitizeGltfMaterialNames(scene);

  scene.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    const isDressFabric = !FABRIC_MESH_SKIP.test(obj.name);
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    const next: THREE.Material[] = [];
    for (const source of mats) {
      let mat: THREE.Material = source;
      if (!(source instanceof THREE.MeshStandardMaterial)) {
        const std = new THREE.MeshStandardMaterial({ color: 0xf5f5f5 });
        if ('color' in source && source.color) {
          std.color.copy(source.color as THREE.Color);
        }
        mat = std;
      }
      const stdMat = mat as THREE.MeshStandardMaterial;
      applyMatteFabricMaterial(stdMat, isDressFabric);
      if (isDressFabric && fabricColorHex) {
        stdMat.color.set(fabricColorHex);
        stdMat.map = null;
        stdMat.normalMap = null;
        stdMat.metalnessMap = null;
        stdMat.roughnessMap = null;
      }
      next.push(mat);
    }
    obj.material = next.length === 1 ? next[0] : next;
  });

  const box = new THREE.Box3().setFromObject(scene);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxSide = Math.max(size.x, size.y, size.z, 1e-6);
  if (!Number.isFinite(maxSide) || box.isEmpty()) {
    throw new Error('Model has invalid bounds.');
  }

  scene.position.sub(center);
  scene.updateMatrixWorld(true);
  const box2 = new THREE.Box3().setFromObject(scene);
  scene.position.sub(new THREE.Vector3(0, box2.min.y, 0));
  scene.scale.setScalar(2.62 / maxSide);

  return scene;
}

/** Load + parse GLB off the GL thread (reduces OOM vs GLView + parse together). */
export async function loadGltfFromBundledModule(
  assetModule: number,
  fabricColorHex?: string | null,
): Promise<THREE.Object3D> {
  const uri = await resolveAssetUri(assetModule);
  let buf = await readUriAsArrayBuffer(uri);
  if (Platform.OS !== 'web') {
    buf = stripGlbTexturesForNative(buf);
  }

  const loader = createGltfLoader();
  const gltf = await loader.parseAsync(buf, '');
  return prepareDressRoot(gltf.scene, fabricColorHex);
}
