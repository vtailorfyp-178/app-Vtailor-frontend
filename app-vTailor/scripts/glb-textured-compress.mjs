/**
 * Mobile GLB compression that preserves embedded PBR textures (bridal lehnga, saree, etc.).
 * No Draco — RN model-viewer / Three.js load raw GLB over HTTPS.
 */
import { mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { NodeIO } from '@gltf-transform/core';
import { KHRMeshQuantization } from '@gltf-transform/extensions';
import { dedup, flatten, prune, simplify, weld } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';

export const texturedIo = new NodeIO().registerExtensions([KHRMeshQuantization]);

/**
 * @param {string} inPath
 * @param {string} outPath
 * @param {{ simplifyRatio?: number; error?: number }} [opts]
 */
export async function compressGlbPreserveTextures(inPath, outPath, opts = {}) {
  await mkdir(path.dirname(outPath), { recursive: true });
  const before = (await stat(inPath)).size;
  const ratio =
    opts.simplifyRatio ??
    (before > 45 * 1024 * 1024 ? 0.22 : before > 30 * 1024 * 1024 ? 0.28 : 0.34);
  const error = opts.error ?? 0.003;

  const doc = await texturedIo.read(inPath);
  await doc.transform(
    dedup(),
    weld(),
    simplify({ simplifier: MeshoptSimplifier, ratio, error }),
    flatten(),
    prune(),
  );
  await texturedIo.write(outPath, doc);
  const after = (await stat(outPath)).size;
  return { before, after, simplifyRatio: ratio };
}
