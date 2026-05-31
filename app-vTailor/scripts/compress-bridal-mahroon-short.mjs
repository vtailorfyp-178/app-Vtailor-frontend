/**
 * Compress Bridal lehnga (maroon round short) — preserves embedded PBR textures for Cloudinary.
 * Run: node scripts/compress-bridal-mahroon-short.mjs
 * Then: cd ../../../app-Vtailor/models-service && npm run upload:bridal-mahroon-short
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compressGlbPreserveTextures } from './glb-textured-compress.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const bridalDir = path.resolve(
  __dirname,
  '../../../app-Vtailor/3d model/3d lehnga/Bridal lehnga',
);
const candidates = [
  path.join(bridalDir, 'optimized', 'maroon round neck short sleeves.glb'),
  path.join(bridalDir, 'mahroon round neck short sleeves .glb'),
  path.join(bridalDir, 'maroon round neck short sleeves.glb'),
];

const source = candidates.find((p) => existsSync(p));
if (!source) {
  console.error('Source GLB not found. Expected one of:\n', candidates.join('\n'));
  process.exit(1);
}

const outPath = path.join(
  bridalDir,
  'optimized',
  'optimized-mahroon-round-neck-short-sleeves-.glb',
);

/** Target &lt;10 MB for Cloudinary raw upload while keeping base/normal/MR maps. */
const { before, after, simplifyRatio } = await compressGlbPreserveTextures(source, outPath, {
  simplifyRatio: 0.12,
  error: 0.003,
});

if (after > 10 * 1024 * 1024) {
  console.error(
    `Output ${(after / 1e6).toFixed(2)} MB exceeds Cloudinary 10 MB limit. Lower simplifyRatio.`,
  );
  process.exit(1);
}

console.log('Source:', source);
console.log('Output:', outPath);
console.log(`Size: ${(before / 1e6).toFixed(2)} MB → ${(after / 1e6).toFixed(2)} MB (ratio ${simplifyRatio})`);
console.log('Textures preserved — upload with: npm run upload:bridal-mahroon-short');
