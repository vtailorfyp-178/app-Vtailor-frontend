/**
 * Optimize the female measurement mannequin GLB for web/mobile.
 * Source: app-Vtailor/3d model/3d measurement model.glb
 * Output: app-Vtailor/3d model/measurement/mobile/measurement-model.glb
 *
 * Run: npm run compress:measurement-model
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compressGlbPreserveTextures } from './glb-textured-compress.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const sourcePath = path.resolve(
  projectRoot,
  '../../app-Vtailor/3d model/3d measurement model.glb',
);
const outPath = path.resolve(
  projectRoot,
  '../../app-Vtailor/3d model/measurement/mobile/measurement-model.glb',
);

const { before, after, simplifyRatio } = await compressGlbPreserveTextures(sourcePath, outPath, {
  simplifyRatio: 0.26,
  error: 0.005,
});

const pct = ((1 - after / before) * 100).toFixed(1);
console.log(`Source: ${sourcePath}`);
console.log(`Output: ${outPath}`);
console.log(
  `Optimized: ${(before / 1024 / 1024).toFixed(2)}MB → ${(after / 1024 / 1024).toFixed(2)}MB (${pct}%, ratio=${simplifyRatio})`,
);
