import * as THREE from 'three';
import {
  applyCasualFabricBaseMaterial,
  applyCasualFabricTintToMesh as applyCasualFabricTintToMeshCore,
  applyChiffonFabricMaterial,
} from './casualFabricMaterial';
import { sanitizeGltfMaterialNames } from './sanitizeGltfMaterialNames';

const FABRIC_MESH_SKIP = /mannequin|mannicun|human|skin|hair|face|hand|foot|shoe|eye|lash|body/i;
/** Patiyala GLBs: only skip mannequin parts; dress panels may be named "body". */
const PATIYALA_TINT_SKIP = /mannequin|mannicun|human|skin|hair|face|hand|foot|shoe|eye|lash/i;

/** Soft chiffon / lawn — frill saree uses lighter drape PBR. */
export function applyChiffonClothMaterial(
  mat: THREE.MeshStandardMaterial,
  isDressFabric: boolean,
): void {
  applyChiffonFabricMaterial(mat, isDressFabric);
}

export function isFabricDressMesh(meshName: string): boolean {
  return !FABRIC_MESH_SKIP.test(meshName);
}

export function isPatiyalaTintMesh(meshName: string): boolean {
  return !PATIYALA_TINT_SKIP.test(meshName);
}

function fixTextureColorSpace(tex: THREE.Texture | null | undefined): void {
  if (!tex) return;
  tex.flipY = false;
  if ('colorSpace' in tex) {
    tex.colorSpace = THREE.SRGBColorSpace;
  }
  tex.needsUpdate = true;
}

function fixDataMapTexture(tex: THREE.Texture | null | undefined): void {
  if (!tex) return;
  tex.flipY = false;
  if ('colorSpace' in tex) {
    tex.colorSpace = THREE.NoColorSpace;
  }
  tex.needsUpdate = true;
}

function configurePbrMaterialMaps(mat: THREE.MeshStandardMaterial, isDressFabric: boolean): void {
  fixTextureColorSpace(mat.map);
  fixTextureColorSpace(mat.emissiveMap);
  fixDataMapTexture(mat.normalMap);
  fixDataMapTexture(mat.roughnessMap);
  fixDataMapTexture(mat.metalnessMap);
  fixDataMapTexture(mat.aoMap);
  applyCasualFabricBaseMaterial(mat, isDressFabric);
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
    mat.envMapIntensity = Math.min(source.envMapIntensity ?? 1, 0.4);
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
  void baseColor;
  mat.map = null;
  mat.normalMap = null;
  mat.roughnessMap = null;
  mat.metalnessMap = null;
  applyCasualFabricBaseMaterial(mat, true);
  mat.color.set(hex);
  mat.needsUpdate = true;
}

/** Patiyala / shalwar: flat fabric tint (white GLB → customer shade). */
export function applyPatiyalaFabricTintToMesh(mat: THREE.MeshStandardMaterial, hex: string): void {
  applyCasualFabricTintToMesh(mat, hex);
}

/**
 * Patiyala + bell bottom: same fabric PBR. Keeps PBR maps when present (bell bottom embroidery).
 */
export function applyCasualFabricTintToMesh(mat: THREE.MeshStandardMaterial, hex: string): void {
  applyCasualFabricTintToMeshCore(mat, hex);
}

/** Runtime casual fabric color — patiyala + bell bottom + tulip. */
export function applyCasualFabricTintToScene(scene: THREE.Object3D, hex: string | null): void {
  applyDressFabricMaterialsToScene(scene, { fabricColorHex: hex, tintAllDressPanels: true });
}

/** Runtime patiyala color — same pipeline as bell bottom. */
export function applyPatiyalaFabricTintToScene(scene: THREE.Object3D, hex: string | null): void {
  applyCasualFabricTintToScene(scene, hex);
}

/** Grarah CDN GLBs: wedding shade + unified fabric PBR on all meshes. */
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
      applyCasualFabricBaseMaterial(mat, true);
      nextMats.push(mat);
    }
    obj.material = nextMats.length === 1 ? nextMats[0] : nextMats;
  });
}

export type DressFabricMaterialOptions = {
  fabricColorHex?: string | null;
  /** Patiyala / bell bottom / tulip: include body panels in tint. */
  tintAllDressPanels?: boolean;
  /** Frill saree — soft chiffon drape. */
  chiffon?: boolean;
};

/**
 * Unified Three.js fabric PBR for every dress GLB — keeps embroidery maps when present.
 */
export function applyDressFabricMaterialsToScene(
  scene: THREE.Object3D,
  options?: DressFabricMaterialOptions,
): void {
  const hex = options?.fabricColorHex ?? null;
  const tintAll = options?.tintAllDressPanels ?? false;
  const chiffon = options?.chiffon ?? false;

  const applyFabricBase = (mat: THREE.MeshStandardMaterial, isDress: boolean): void => {
    if (chiffon && isDress) applyChiffonFabricMaterial(mat, true);
    else applyCasualFabricBaseMaterial(mat, isDress);
  };

  scene.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    obj.castShadow = true;
    obj.receiveShadow = true;
    const isDress = tintAll ? isPatiyalaTintMesh(obj.name) : isFabricDressMesh(obj.name);
    const sourceMats = Array.isArray(obj.material) ? obj.material : [obj.material];
    const nextMats: THREE.Material[] = [];

    for (const source of sourceMats) {
      const mat =
        source instanceof THREE.MeshStandardMaterial
          ? source
          : toDisplayStandardMaterial(source);
      if (mat.map || mat.normalMap || mat.roughnessMap) {
        fixTextureColorSpace(mat.map);
        fixTextureColorSpace(mat.emissiveMap);
        fixDataMapTexture(mat.normalMap);
        fixDataMapTexture(mat.roughnessMap);
        fixDataMapTexture(mat.metalnessMap);
        fixDataMapTexture(mat.aoMap);
        applyFabricBase(mat, isDress);
      } else {
        applyFabricBase(mat, isDress);
      }
      if (hex && isDress) {
        const hasMaps = Boolean(mat.map || mat.normalMap || mat.roughnessMap);
        if (hasMaps) applyCasualFabricTintToMesh(mat, hex);
        else applyFabricColorTintToMesh(mat, hex, mat.color);
      }
      mat.side = THREE.DoubleSide;
      nextMats.push(mat);
    }
    obj.material = nextMats.length === 1 ? nextMats[0] : nextMats;
  });
}

/** Keep GLB maps and apply fabric PBR (long frock, saree, lehnga, bell bottom embroidery). */
function ensureEmbeddedTextureDisplay(
  scene: THREE.Object3D,
  fabricColorHex?: string | null,
  patiyalaTint?: boolean,
): void {
  applyDressFabricMaterialsToScene(scene, {
    fabricColorHex,
    tintAllDressPanels: patiyalaTint,
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
  applyDressFabricMaterialsToScene(scene, {
    fabricColorHex,
    tintAllDressPanels: options?.patiyalaTint ?? false,
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
    chiffon?: boolean;
  },
): THREE.Object3D {
  void options?.lightweight;
  sanitizeGltfMaterialNames(scene);
  const fabricOpts = {
    fabricColorHex,
    tintAllDressPanels: options?.patiyalaTint,
    chiffon: options?.chiffon,
  };
  if (options?.preserveTextures) {
    applyDressFabricMaterialsToScene(scene, fabricOpts);
  } else {
    applyDressFabricMaterialsToScene(scene, fabricOpts);
  }
  return centerAndScaleScene(scene);
}
