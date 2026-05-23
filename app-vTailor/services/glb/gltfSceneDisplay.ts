import * as THREE from 'three';
import { sanitizeGltfMaterialNames } from './sanitizeGltfMaterialNames';

const FABRIC_MESH_SKIP = /mannequin|mannicun|human|skin|hair|face|hand|foot|shoe|eye|lash|body/i;
/** Patiyala GLBs: only skip mannequin parts; dress panels may be named "body". */
const PATIYALA_TINT_SKIP = /mannequin|mannicun|human|skin|hair|face|hand|foot|shoe|eye|lash/i;

/** Soft chiffon / lawn — not metallic jewelry or mannequin hardware. */
export function applyChiffonClothMaterial(
  mat: THREE.MeshStandardMaterial,
  isDressFabric: boolean,
): void {
  if (!isDressFabric) {
    mat.metalness = Math.min(mat.metalness, 0.18);
    mat.roughness = Math.max(mat.roughness, 0.55);
    if ('envMapIntensity' in mat) mat.envMapIntensity = 0.45;
    mat.needsUpdate = true;
    return;
  }
  mat.metalness = 0;
  const hasBaseMap = Boolean(mat.map);
  mat.roughness = hasBaseMap ? Math.max(mat.roughness, 0.62) : Math.max(mat.roughness, 0.9);
  if (!hasBaseMap) {
    mat.metalnessMap = null;
    mat.roughnessMap = null;
  }
  mat.emissive.setHex(0x000000);
  mat.emissiveIntensity = 0;
  if ('envMapIntensity' in mat) mat.envMapIntensity = hasBaseMap ? 0.35 : 0.22;
  mat.side = THREE.DoubleSide;
  mat.needsUpdate = true;
}

export function isFabricDressMesh(meshName: string): boolean {
  return !FABRIC_MESH_SKIP.test(meshName);
}

export function isPatiyalaTintMesh(meshName: string): boolean {
  return !PATIYALA_TINT_SKIP.test(meshName);
}

function fixTextureColorSpace(tex: THREE.Texture | null | undefined): void {
  if (!tex) return;
  if ('colorSpace' in tex) {
    tex.colorSpace = THREE.SRGBColorSpace;
  }
  tex.needsUpdate = true;
}

function copyMapsOntoStandard(
  from: THREE.Material,
  to: THREE.MeshStandardMaterial,
): void {
  const mapKeys = [
    'map',
    'normalMap',
    'metalnessMap',
    'roughnessMap',
    'aoMap',
    'emissiveMap',
    'alphaMap',
  ] as const;

  for (const key of mapKeys) {
    const tex = (from as unknown as Record<string, THREE.Texture | null | undefined>)[key];
    if (tex) {
      (to as unknown as Record<string, THREE.Texture>)[key] = tex;
      fixTextureColorSpace(tex);
    }
  }
}

/** Preserve GLB textures and PBR colors when converting for expo-gl / Three.js. */
export function toDisplayStandardMaterial(source: THREE.Material): THREE.MeshStandardMaterial {
  if (source instanceof THREE.MeshStandardMaterial) {
    const mat = source.clone();
    mat.side = THREE.DoubleSide;
    copyMapsOntoStandard(source, mat);
    mat.needsUpdate = true;
    return mat;
  }

  if (source instanceof THREE.MeshPhysicalMaterial) {
    const mat = new THREE.MeshStandardMaterial();
    mat.name = source.name;
    mat.color.copy(source.color);
    mat.emissive.copy(source.emissive);
    mat.metalness = Math.min(Math.max(source.metalness, 0), 0.08);
    mat.roughness = Math.max(source.roughness, 0.82);
    mat.opacity = source.opacity;
    mat.transparent = source.transparent;
    mat.alphaTest = source.alphaTest;
    mat.envMapIntensity = source.envMapIntensity ?? 1;
    copyMapsOntoStandard(source, mat);
    mat.side = THREE.DoubleSide;
    mat.needsUpdate = true;
    return mat;
  }

  if (source instanceof THREE.MeshLambertMaterial || source instanceof THREE.MeshPhongMaterial) {
    const mat = new THREE.MeshStandardMaterial();
    mat.name = source.name;
    mat.color.copy(source.color);
    if ('emissive' in source && source.emissive) {
      mat.emissive.copy(source.emissive as THREE.Color);
    }
    if ('map' in source && source.map) {
      mat.map = source.map;
      fixTextureColorSpace(source.map);
    }
    mat.metalness = 0.05;
    mat.roughness = 0.82;
    mat.side = THREE.DoubleSide;
    mat.needsUpdate = true;
    return mat;
  }

  const mat = new THREE.MeshStandardMaterial();
  mat.name = source.name;
  if ('color' in source && source.color instanceof THREE.Color) {
    mat.color.copy(source.color);
  }
  copyMapsOntoStandard(source, mat);
  mat.side = THREE.DoubleSide;
  mat.metalness = 0.08;
  mat.roughness = 0.78;
  mat.needsUpdate = true;
  return mat;
}

/** Solid fabric recolor (no texture maps). */
export function applyFabricColorTintToMesh(
  mat: THREE.MeshStandardMaterial,
  hex: string,
  baseColor: THREE.Color,
): void {
  mat.color.set(hex);
  mat.map = null;
  mat.normalMap = null;
  mat.roughnessMap = null;
  mat.metalnessMap = null;
  mat.metalness = 0;
  mat.roughness = 0.9;
  if ('envMapIntensity' in mat) mat.envMapIntensity = 0.35;
  mat.emissive.setHex(0x000000);
  mat.emissiveIntensity = 0;
  mat.toneMapped = true;
  mat.needsUpdate = true;
  void baseColor;
}

/** Patiyala / shalwar: flat fabric tint (white GLB → customer shade). */
export function applyPatiyalaFabricTintToMesh(mat: THREE.MeshStandardMaterial, hex: string): void {
  mat.map = null;
  mat.color.set(hex);
  mat.metalness = 0;
  mat.roughness = 0.82;
  mat.emissive.setHex(0x000000);
  mat.emissiveIntensity = 0;
  if ('envMapIntensity' in mat) mat.envMapIntensity = 0.32;
  mat.toneMapped = true;
  mat.needsUpdate = true;
}

/** Runtime patiyala color — tint every dress mesh (used when fabric shade changes). */
export function applyPatiyalaFabricTintToScene(scene: THREE.Object3D, hex: string | null): void {
  scene.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh) || !isPatiyalaTintMesh(obj.name)) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (const source of mats) {
      const mat =
        source instanceof THREE.MeshStandardMaterial
          ? source
          : toDisplayStandardMaterial(source);
      if (!(source instanceof THREE.MeshStandardMaterial)) {
        const idx = mats.indexOf(source);
        if (idx >= 0) mats[idx] = mat;
        obj.material = mats.length === 1 ? mats[0] : mats;
      }
      applyChiffonClothMaterial(mat, true);
      if (hex) applyPatiyalaFabricTintToMesh(mat, hex);
    }
  });
}

/** Grarah CDN GLBs: no embedded maps — apply wedding shade + fabric PBR on all meshes. */
export function applyGrarahWeddingDisplayToScene(scene: THREE.Object3D, hex: string): void {
  scene.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    const sourceMats = Array.isArray(obj.material) ? obj.material : [obj.material];
    const nextMats: THREE.Material[] = [];
    for (const source of sourceMats) {
      const mat = toDisplayStandardMaterial(source);
      mat.map = null;
      mat.normalMap = null;
      mat.metalnessMap = null;
      mat.roughnessMap = null;
      mat.color.set(hex);
      mat.metalness = 0.06;
      mat.roughness = 0.78;
      mat.emissive.setHex(0x000000);
      mat.emissiveIntensity = 0;
      if ('envMapIntensity' in mat) mat.envMapIntensity = 0.42;
      mat.side = THREE.DoubleSide;
      mat.needsUpdate = true;
      nextMats.push(mat);
    }
    obj.material = nextMats.length === 1 ? nextMats[0] : nextMats;
  });
}

/** Keep GLB maps/colors for long frock, saree, lehnga (no chiffon override). */
function ensureEmbeddedTextureDisplay(scene: THREE.Object3D): void {
  scene.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (const mat of mats) {
      if (!(mat instanceof THREE.MeshStandardMaterial)) continue;
      if (mat.map) fixTextureColorSpace(mat.map);
      mat.side = THREE.DoubleSide;
      mat.needsUpdate = true;
    }
  });
}

function centerAndScaleScene(scene: THREE.Object3D): THREE.Object3D {
  const box = new THREE.Box3().setFromObject(scene);
  const size = box.getSize(new THREE.Vector3());
  const maxSide = Math.max(size.x, size.y, size.z, 1e-6);
  if (!Number.isFinite(maxSide) || box.isEmpty()) {
    throw new Error('Model has invalid bounds.');
  }

  scene.position.sub(box.getCenter(new THREE.Vector3()));
  scene.updateMatrixWorld(true);
  const box2 = new THREE.Box3().setFromObject(scene);
  scene.position.sub(new THREE.Vector3(0, box2.min.y, 0));
  scene.scale.setScalar(2.35 / maxSide);
  scene.rotation.y = Math.PI;
  return scene;
}

function applyMaterialsToScene(
  scene: THREE.Object3D,
  fabricColorHex?: string | null,
  options?: { patiyalaTint?: boolean },
): void {
  const tintFabric = Boolean(fabricColorHex);
  const patiyalaTint = options?.patiyalaTint ?? false;

  scene.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    const isDressFabric = patiyalaTint
      ? isPatiyalaTintMesh(obj.name)
      : isFabricDressMesh(obj.name);
    const sourceMats = Array.isArray(obj.material) ? obj.material : [obj.material];
    const nextMats: THREE.Material[] = [];

    for (const source of sourceMats) {
      const mat = toDisplayStandardMaterial(source);
      applyChiffonClothMaterial(mat, isDressFabric);
      if (tintFabric && isDressFabric && fabricColorHex) {
        if (patiyalaTint) applyPatiyalaFabricTintToMesh(mat, fabricColorHex);
        else applyFabricColorTintToMesh(mat, fabricColorHex, mat.color);
      }
      nextMats.push(mat);
    }

    obj.material = nextMats.length === 1 ? nextMats[0] : nextMats;
  });
}

/** Native path after texture strip: same material pipeline (uses baseColor from GLB). */
export function prepareGltfSceneLight(
  scene: THREE.Object3D,
  fabricColorHex?: string | null,
): THREE.Object3D {
  sanitizeGltfMaterialNames(scene);
  applyMaterialsToScene(scene, fabricColorHex);
  return centerAndScaleScene(scene);
}

export function prepareGltfSceneForDisplay(
  scene: THREE.Object3D,
  fabricColorHex?: string | null,
  options?: {
    lightweight?: boolean;
    patiyalaTint?: boolean;
    preserveTextures?: boolean;
  },
): THREE.Object3D {
  void options?.lightweight;
  sanitizeGltfMaterialNames(scene);
  if (options?.preserveTextures) {
    ensureEmbeddedTextureDisplay(scene);
  } else {
    applyMaterialsToScene(scene, fabricColorHex, {
      patiyalaTint: options?.patiyalaTint,
    });
  }
  return centerAndScaleScene(scene);
}
