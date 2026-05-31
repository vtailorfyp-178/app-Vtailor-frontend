/**
 * Bell-bottom reference PBR — Patiyala / shalwar kameez use the same cloth profile.
 */
import * as THREE from 'three';

/** Matte stitched fabric (no metal/plastic shine). */
export const CASUAL_FABRIC_METALNESS = 0;
export const CASUAL_FABRIC_ROUGHNESS = 0.68;
export const CASUAL_FABRIC_ROUGHNESS_FLAT = 0.72;
export const CASUAL_FABRIC_ENV_INTENSITY = 0.44;
export const CASUAL_FABRIC_ENV_INTENSITY_FLAT = 0.4;

/** Soft chiffon — frill saree drape (lighter sheen than stitched cotton). */
export const CHIFFON_FABRIC_ROUGHNESS = 0.54;
export const CHIFFON_FABRIC_ENV_INTENSITY = 0.52;

export function applyChiffonFabricMaterial(
  mat: THREE.MeshStandardMaterial,
  isDressFabric: boolean,
): void {
  if (!isDressFabric) {
    applyCasualFabricBaseMaterial(mat, false);
    return;
  }
  const hasMaps = Boolean(mat.map || mat.normalMap || mat.roughnessMap || mat.metalnessMap);
  mat.metalness = 0;
  mat.metalnessMap = null;
  mat.roughness = hasMaps
    ? Math.min(Math.max(mat.roughness, CHIFFON_FABRIC_ROUGHNESS), 0.62)
    : CHIFFON_FABRIC_ROUGHNESS;
  mat.emissive.setHex(0x000000);
  mat.emissiveIntensity = 0;
  if ('envMapIntensity' in mat) {
    mat.envMapIntensity = hasMaps ? CHIFFON_FABRIC_ENV_INTENSITY : CHIFFON_FABRIC_ENV_INTENSITY * 0.92;
  }
  mat.side = THREE.DoubleSide;
  mat.toneMapped = true;
  mat.needsUpdate = true;
}

export function applyCasualFabricBaseMaterial(
  mat: THREE.MeshStandardMaterial,
  isDressFabric: boolean,
): void {
  if (!isDressFabric) {
    mat.metalness = Math.min(mat.metalness, 0.1);
    mat.roughness = Math.max(mat.roughness, 0.58);
    if ('envMapIntensity' in mat) mat.envMapIntensity = 0.32;
    mat.needsUpdate = true;
    return;
  }

  const hasMaps = Boolean(mat.map || mat.normalMap || mat.roughnessMap || mat.metalnessMap);
  mat.metalness = CASUAL_FABRIC_METALNESS;
  mat.metalnessMap = null;
  if (!hasMaps) {
    mat.roughnessMap = null;
    mat.metalnessMap = null;
  }
  mat.roughness = hasMaps
    ? Math.max(Math.min(mat.roughness, 0.85), CASUAL_FABRIC_ROUGHNESS)
    : CASUAL_FABRIC_ROUGHNESS_FLAT;
  mat.emissive.setHex(0x000000);
  mat.emissiveIntensity = 0;
  if ('envMapIntensity' in mat) {
    mat.envMapIntensity = hasMaps ? CASUAL_FABRIC_ENV_INTENSITY : CASUAL_FABRIC_ENV_INTENSITY_FLAT;
  }
  mat.side = THREE.DoubleSide;
  mat.toneMapped = true;
  mat.needsUpdate = true;
}

/** Runtime shade — same pipeline as bell bottom (multiply on maps when present). */
export function applyCasualFabricTintToMesh(mat: THREE.MeshStandardMaterial, hex: string): void {
  const hasMaps = Boolean(mat.map || mat.normalMap || mat.roughnessMap || mat.metalnessMap);
  applyCasualFabricBaseMaterial(mat, true);
  if (!hasMaps) {
    mat.map = null;
    mat.normalMap = null;
    mat.roughnessMap = null;
    mat.metalnessMap = null;
  }
  mat.color.set(hex);
  mat.needsUpdate = true;
}

/** Runtime custom print — replaces/albedo map while keeping PBR normal/roughness when present. */
export function applyCasualFabricTextureToMesh(
  mat: THREE.MeshStandardMaterial,
  texture: THREE.Texture,
): void {
  applyCasualFabricBaseMaterial(mat, true);
  mat.map = texture;
  mat.color.set('#ffffff');
  mat.transparent = false;
  mat.opacity = 1;
  mat.needsUpdate = true;
}

/** Clear custom print — restore flat white fabric base. */
export function clearCasualFabricTextureFromMesh(mat: THREE.MeshStandardMaterial): void {
  mat.map = null;
  mat.color.set('#ffffff');
  mat.transparent = false;
  applyCasualFabricBaseMaterial(mat, true);
  mat.needsUpdate = true;
}
