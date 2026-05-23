/**
 * Shared mobile GLB compression (RN-safe: no Draco, no embedded textures).
 */
import { mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { NodeIO } from '@gltf-transform/core';
import { KHRMeshQuantization } from '@gltf-transform/extensions';
import { dedup, flatten, prune, simplify, weld } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';

/** No Draco — THREE DRACOLoader uses Blob + Web Workers, which break on React Native. */
export const io = new NodeIO().registerExtensions([KHRMeshQuantization]);

export function stripAllTextures(document) {
  const root = document.getRoot();
  for (const material of root.listMaterials()) {
    material.setBaseColorTexture(null);
    material.setEmissiveTexture(null);
    material.setNormalTexture(null);
    material.setOcclusionTexture(null);
    material.setMetallicRoughnessTexture(null);
    const factor = material.getBaseColorFactor();
    if (!factor || factor[3] === 0) {
      material.setBaseColorFactor([1, 1, 1, 1]);
    }
  }
  for (const texture of root.listTextures()) {
    texture.dispose();
  }
}

/**
 * @param {string} inPath
 * @param {string} outPath
 * @param {{ simplifyRatio?: number }} [opts]
 */
export async function compressGlbFile(inPath, outPath, opts = {}) {
  await mkdir(path.dirname(outPath), { recursive: true });
  const before = (await stat(inPath)).size;
  const ratio =
    opts.simplifyRatio ??
    (before > 45 * 1024 * 1024 ? 0.28 : before > 30 * 1024 * 1024 ? 0.34 : 0.42);
  const doc = await io.read(inPath);
  stripAllTextures(doc);
  await doc.transform(
    dedup(),
    weld(),
    simplify({ simplifier: MeshoptSimplifier, ratio, error: 0.004 }),
    flatten(),
    prune(),
  );
  await io.write(outPath, doc);
  const after = (await stat(outPath)).size;
  return { before, after };
}
