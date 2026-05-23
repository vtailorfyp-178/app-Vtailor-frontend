import * as THREE from 'three';

/**
 * THREE.js embeds `material.name` in GLSL as `#define SHADER_NAME …`.
 * UUID-style names (e.g. tripo_material_…-8d64-7e15…) break mobile GLSL compilers.
 */
function toGlslSafeName(raw: string | undefined, index: number): string {
  const cleaned = (raw ?? 'material')
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');

  const base = cleaned && !/^[0-9]/.test(cleaned) ? cleaned : `mat_${cleaned || 'surface'}`;
  return `${base}_${index}`;
}

export function sanitizeGltfMaterialNames(root: THREE.Object3D): void {
  let index = 0;
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (const mat of mats) {
      if (!mat) continue;
      mat.name = toGlslSafeName(mat.name, index);
      index += 1;
    }
  });
}
