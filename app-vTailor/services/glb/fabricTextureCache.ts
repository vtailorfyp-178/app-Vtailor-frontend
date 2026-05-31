import * as THREE from 'three';
import type { FabricPatternMeta } from '@/services/glb/fabricPrintSelection';
import { applyFabricRepeatToTexture } from '@/services/glb/fabricUvRepeat';

const loader = new THREE.TextureLoader();
const cache = new Map<string, THREE.Texture>();
const inflight = new Map<string, Promise<THREE.Texture>>();

function cacheKey(url: string, meta?: FabricPatternMeta): string {
  if (!meta) return url;
  return `${url}|${meta.tileWidth}x${meta.tileHeight}|${meta.repeatsPerMeter}`;
}

function configureFabricTexture(tex: THREE.Texture): THREE.Texture {
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.flipY = false;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 1);
  tex.offset.set(0, 0);
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = 8;
  tex.generateMipmaps = true;
  tex.needsUpdate = true;
  return tex;
}

export function peekCachedFabricTexture(url: string, meta?: FabricPatternMeta): THREE.Texture | null {
  return cache.get(cacheKey(url, meta)) ?? null;
}

export function loadFabricTexture(
  url: string,
  meta?: FabricPatternMeta,
): Promise<THREE.Texture> {
  const key = cacheKey(url, meta);
  const cached = cache.get(key);
  if (cached) return Promise.resolve(cached);

  const pending = inflight.get(key);
  if (pending) return pending;

  const promise = new Promise<THREE.Texture>((resolve, reject) => {
    loader.load(
      url,
      (tex) => {
        configureFabricTexture(tex);
        cache.set(key, tex);
        inflight.delete(key);
        resolve(tex);
      },
      undefined,
      (err) => {
        inflight.delete(key);
        reject(err instanceof Error ? err : new Error('Could not load fabric texture.'));
      },
    );
  });
  inflight.set(key, promise);
  return promise;
}

/**
 * Clone base tile texture and apply UV-preserving repeat for one mesh.
 */
export async function loadFabricTextureForMesh(
  url: string,
  mesh: THREE.Mesh,
  meta: FabricPatternMeta,
): Promise<THREE.Texture> {
  const base = await loadFabricTexture(url, meta);
  const cloned = base.clone();
  cloned.image = base.image;
  cloned.needsUpdate = true;
  return applyFabricRepeatToTexture(cloned, mesh, meta);
}

export function releaseFabricTexture(url: string | null | undefined, meta?: FabricPatternMeta): void {
  if (!url) return;
  const key = cacheKey(url, meta);
  const tex = cache.get(key);
  if (!tex) return;
  tex.dispose();
  cache.delete(key);
}
