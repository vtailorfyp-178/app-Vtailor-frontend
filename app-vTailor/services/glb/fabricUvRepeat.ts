import * as THREE from 'three';
import type { FabricPatternMeta } from '@/services/glb/fabricPrintSelection';

export type UvBounds = {
  minU: number;
  maxU: number;
  minV: number;
  maxV: number;
  spanU: number;
  spanV: number;
};

export type FabricRepeatPlan = {
  repeatX: number;
  repeatY: number;
  offsetX: number;
  offsetY: number;
  metersPerTile: number;
};

const MEGATILE_GRID = 6;

export function getMeshUvBounds(mesh: THREE.Mesh): UvBounds | null {
  const uv = mesh.geometry?.attributes?.uv as THREE.BufferAttribute | undefined;
  if (!uv || uv.count === 0) return null;

  let minU = Infinity;
  let maxU = -Infinity;
  let minV = Infinity;
  let maxV = -Infinity;

  for (let i = 0; i < uv.count; i++) {
    const u = uv.getX(i);
    const v = uv.getY(i);
    if (u < minU) minU = u;
    if (u > maxU) maxU = u;
    if (v < minV) minV = v;
    if (v > maxV) maxV = v;
  }

  return {
    minU,
    maxU,
    minV,
    maxV,
    spanU: Math.max(maxU - minU, 0.001),
    spanV: Math.max(maxV - minV, 0.001),
  };
}

export function estimateMeshWidthMeters(mesh: THREE.Mesh): number {
  mesh.updateWorldMatrix(true, false);
  const box = new THREE.Box3().setFromObject(mesh);
  const size = box.getSize(new THREE.Vector3());
  return Math.max(size.x, size.z, 0.22);
}

export function estimateMeshHeightMeters(mesh: THREE.Mesh): number {
  mesh.updateWorldMatrix(true, false);
  const box = new THREE.Box3().setFromObject(mesh);
  return Math.max(box.getSize(new THREE.Vector3()).y, 0.28);
}

function metersPerTileFromMeta(meta: FabricPatternMeta): number {
  const motifCm = Math.max(meta.motifSizeCm || 8, 2.5);
  return motifCm / 100;
}

function clampRepeat(value: number): number {
  return THREE.MathUtils.clamp(value, 0.35, 64);
}

/**
 * Physical textile repeat — tile repeats across mesh UV span proportional to world size.
 * Preserves tile aspect ratio (no stretch on V).
 */
export function computeFabricTextureRepeat(
  mesh: THREE.Mesh,
  meta: FabricPatternMeta,
): { repeatX: number; repeatY: number } {
  const uv = getMeshUvBounds(mesh);
  const spanU = uv?.spanU ?? 1;
  const spanV = uv?.spanV ?? 1;
  const metersPerTile = metersPerTileFromMeta(meta);

  const widthM = estimateMeshWidthMeters(mesh);
  const heightM = estimateMeshHeightMeters(mesh);

  const motifsAcrossU = widthM / metersPerTile;
  const motifsAcrossV = heightM / metersPerTile;

  return {
    repeatX: clampRepeat(spanU * motifsAcrossU),
    repeatY: clampRepeat(spanV * motifsAcrossV),
  };
}

/** Align pattern across shirt / trouser panels using shared world origin. */
export function computeFabricWorldAlignedOffset(
  mesh: THREE.Mesh,
  modelRoot: THREE.Object3D | null | undefined,
  repeatX: number,
  repeatY: number,
  metersPerTile: number,
): { offsetX: number; offsetY: number } {
  const uv = getMeshUvBounds(mesh);
  const spanU = uv?.spanU ?? 1;
  const spanV = uv?.spanV ?? 1;
  const minU = uv?.minU ?? 0;
  const minV = uv?.minV ?? 0;

  mesh.updateWorldMatrix(true, false);
  const meshBox = new THREE.Box3().setFromObject(mesh);

  let originX = meshBox.min.x;
  let originY = meshBox.min.y;
  if (modelRoot) {
    modelRoot.updateWorldMatrix(true, false);
    const modelBox = new THREE.Box3().setFromObject(modelRoot);
    originX = modelBox.min.x;
    originY = modelBox.min.y;
  }

  const worldU = (meshBox.min.x - originX) / metersPerTile;
  const worldV = (meshBox.min.y - originY) / metersPerTile;

  const phaseU = worldU - Math.floor(worldU);
  const phaseV = worldV - Math.floor(worldV);

  return {
    offsetX: -(phaseU * repeatX + minU * repeatX),
    offsetY: -(phaseV * repeatY + minV * repeatY),
  };
}

export function buildFabricRepeatPlan(
  mesh: THREE.Mesh,
  meta: FabricPatternMeta,
  modelRoot?: THREE.Object3D | null,
): FabricRepeatPlan {
  const metersPerTile = metersPerTileFromMeta(meta);
  const { repeatX, repeatY } = computeFabricTextureRepeat(mesh, meta);
  const { offsetX, offsetY } = computeFabricWorldAlignedOffset(
    mesh,
    modelRoot,
    repeatX,
    repeatY,
    metersPerTile,
  );

  return { repeatX, repeatY, offsetX, offsetY, metersPerTile };
}

export function applyFabricRepeatToTexture(
  texture: THREE.Texture,
  mesh: THREE.Mesh,
  meta: FabricPatternMeta,
  modelRoot?: THREE.Object3D | null,
): THREE.Texture {
  const plan = buildFabricRepeatPlan(mesh, meta, modelRoot);

  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(plan.repeatX, plan.repeatY);
  texture.offset.set(plan.offsetX, plan.offsetY);
  texture.rotation = 0;

  texture.anisotropy = Math.max(texture.anisotropy, 16);
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

/** model-viewer KHR_texture_transform scale for repeat tile URL. */
export function modelViewerFabricScale(meta: FabricPatternMeta): { scaleU: number; scaleV: number } {
  const metersPerTile = metersPerTileFromMeta(meta);
  const garmentWidthM = 0.48;
  const garmentHeightM = 0.72;
  const motifsU = garmentWidthM / metersPerTile;
  const motifsV = garmentHeightM / metersPerTile;
  return {
    scaleU: THREE.MathUtils.clamp(motifsU, 2, 28),
    scaleV: THREE.MathUtils.clamp(motifsV, 2, 28),
  };
}

/** model-viewer scale when using 6×6 megatile (each axis already contains MEGATILE_GRID repeats). */
export function modelViewerMegatileScale(meta: FabricPatternMeta): { scaleU: number; scaleV: number } {
  const { scaleU, scaleV } = modelViewerFabricScale(meta);
  return {
    scaleU: THREE.MathUtils.clamp(scaleU / MEGATILE_GRID, 0.35, 5),
    scaleV: THREE.MathUtils.clamp(scaleV / MEGATILE_GRID, 0.35, 5),
  };
}
