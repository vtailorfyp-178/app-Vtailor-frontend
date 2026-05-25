import { Platform } from 'react-native';
import type * as THREE from 'three';

const MAX_PARSED_ENTRIES = Platform.OS === 'web' ? 10 : 8;

const parsedCache = new Map<string, THREE.Object3D>();

function touchLru(url: string, scene: THREE.Object3D): void {
  parsedCache.delete(url);
  parsedCache.set(url, scene);
  while (parsedCache.size > MAX_PARSED_ENTRIES) {
    const oldest = parsedCache.keys().next().value;
    if (oldest) {
      const entry = parsedCache.get(oldest);
      parsedCache.delete(oldest);
      entry?.traverse?.((node) => {
        const mesh = node as THREE.Mesh;
        if (!mesh.isMesh) return;
        mesh.geometry?.dispose();
        const m = mesh.material;
        if (Array.isArray(m)) m.forEach((mat) => mat.dispose());
        else m?.dispose?.();
      });
    }
  }
}

/** Template scene (no fabric tint) — clone before attaching to the viewer. */
export function getCachedParsedScene(url: string): THREE.Object3D | null {
  const hit = parsedCache.get(url);
  if (!hit) return null;
  touchLru(url, hit);
  return hit;
}

export function setCachedParsedScene(url: string, scene: THREE.Object3D): void {
  touchLru(url, scene);
}

export function hasCachedParsedScene(url: string): boolean {
  return parsedCache.has(url);
}

export function clearParsedSceneCache(): void {
  parsedCache.clear();
}
