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
    spanU: Math.max(maxU - minU, 0.01),
    spanV: Math.max(maxV - minV, 0.01),
  };
}

export function estimateMeshWidthMeters(mesh: THREE.Mesh): number {
  mesh.updateWorldMatrix(true, false);
  const box = new THREE.Box3().setFromObject(mesh);
  const size = box.getSize(new THREE.Vector3());
  return Math.max(size.x, size.z, 0.28);
}

/** One tile = one motif repeat; scale from detected motifSizeCm. */
export function computeFabricTextureRepeat(
  mesh: THREE.Mesh,
  meta: FabricPatternMeta,
): { repeatX: number; repeatY: number } {
  const uv = getMeshUvBounds(mesh);
  const motifCm = Math.max(meta.motifSizeCm || 8, 3);
  const rpm = 100 / motifCm;
  const widthM = estimateMeshWidthMeters(mesh);
  const tileAspect = Math.max(meta.tileWidth, 1) / Math.max(meta.tileHeight, 1);

  const motifsAcrossGarment = widthM * rpm;
  const spanU = uv?.spanU ?? 1;
  const spanV = uv?.spanV ?? 1;

  const repeatX = spanU * motifsAcrossGarment;
  const repeatY = (spanV / spanU) * repeatX / tileAspect;

  const clamp = (v: number) => THREE.MathUtils.clamp(v, 2, 32);
  return {
    repeatX: clamp(repeatX),
    repeatY: clamp(repeatY),
  };
}

export function applyFabricRepeatToTexture(
  texture: THREE.Texture,
  mesh: THREE.Mesh,
  meta: FabricPatternMeta,
): THREE.Texture {
  const { repeatX, repeatY } = computeFabricTextureRepeat(mesh, meta);
  const uv = getMeshUvBounds(mesh);

  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);

  if (uv) {
    texture.offset.set(-uv.minU * repeatX, -uv.minV * repeatY);
  } else {
    texture.offset.set(0, 0);
  }

  texture.anisotropy = Math.max(texture.anisotropy, 12);
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

export function modelViewerFabricScale(meta: FabricPatternMeta): { scaleU: number; scaleV: number } {
  const motifCm = Math.max(meta.motifSizeCm || 8, 3);
  const rpm = 100 / motifCm;
  const scaleU = THREE.MathUtils.clamp(rpm * 0.38, 4, 22);
  const tileAspect = Math.max(meta.tileWidth, 1) / Math.max(meta.tileHeight, 1);
  return { scaleU, scaleV: scaleU / tileAspect };
}
