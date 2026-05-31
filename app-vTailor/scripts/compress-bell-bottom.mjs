/**
 * Compress bell-bottom GLBs (textures preserved) → optimized kebab filenames.
 *
 * Place sources in:
 *   app-Vtailor/3d model/3d trouser shirt/bell-bottom/original/
 *   (any .glb name matching round/collar/keyhole + straight/puff/flared)
 *
 * Run: npm run compress:bell-bottom
 */
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compressGlbPreserveTextures } from './glb-textured-compress.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../../app-Vtailor/3d model/3d trouser shirt/bell-bottom');
const originalDir = path.join(root, 'original');
const optimizedDir = path.join(root, 'optimized');
/** User asset drop folder (Desktop). */
const desktopSourceDir = path.resolve(process.env.USERPROFILE || '', 'Desktop', 'bell-bottom');

const VARIANTS = [
  { neck: 'round', sleeve: 'straight', out: 'round-neck-straight-sleeve.glb', patterns: [/round.*straight/i] },
  { neck: 'round', sleeve: 'puff', out: 'round-neck-puff-sleeve.glb', patterns: [/round.*(puff|balloon)/i] },
  {
    neck: 'round',
    sleeve: 'flared-bell',
    out: 'round-neck-flared-bell-sleeve.glb',
    patterns: [/round.*(flared|flarred|bell)/i],
  },
  {
    neck: 'collar',
    sleeve: 'straight',
    out: 'collar-neck-straight-sleeve.glb',
    patterns: [/collar.*straight/i, /color\s+neck.*straight/i],
  },
  {
    neck: 'collar',
    sleeve: 'puff',
    out: 'collar-neck-puff-sleeve.glb',
    patterns: [/collar.*(puff|balloon)/i, /color\s+neck.*(puff|balloon)/i],
  },
  {
    neck: 'collar',
    sleeve: 'flared-bell',
    out: 'collar-neck-flared-bell-sleeve.glb',
    patterns: [/collar.*(flared|bell)/i, /^color\s+with\s+bell/i, /color\s+neck.*(flared|bell)/i],
  },
  { neck: 'keyhole', sleeve: 'straight', out: 'keyhole-straight-sleeve.glb', patterns: [/keyhole.*straight/i] },
  { neck: 'keyhole', sleeve: 'puff', out: 'keyhole-puff-sleeve.glb', patterns: [/keyhole.*(puff|balloon)/i] },
  {
    neck: 'keyhole',
    sleeve: 'flared-bell',
    out: 'keyhole-flared-bell-sleeve.glb',
    patterns: [/keyhole.*(flared|flarred|bell)/i],
  },
];

function matchVariant(fileName) {
  const base = fileName.replace(/\.glb$/i, '');
  const kebab = base.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  for (const v of VARIANTS) {
    const outStem = v.out.replace(/\.glb$/i, '');
    if (kebab === outStem) return v;
    if (v.patterns.some((re) => re.test(base))) return v;
  }
  return null;
}

function collectSources() {
  const dirs = [desktopSourceDir, originalDir, root].filter((d) => existsSync(d));
  const files = [];
  for (const dir of dirs) {
    for (const name of readdirSync(dir)) {
      if (!name.toLowerCase().endsWith('.glb')) continue;
      if (dir === root && name.startsWith('optimized')) continue;
      files.push(path.join(dir, name));
    }
  }
  return files;
}

const sources = collectSources();
if (!sources.length) {
  console.error('No source GLBs found. Add files to:\n ', originalDir);
  process.exit(1);
}

const assigned = new Map();
for (const src of sources) {
  const variant = matchVariant(path.basename(src));
  if (!variant) {
    console.warn('Unmatched (skipped):', path.basename(src));
    continue;
  }
  if (assigned.has(variant.out)) {
    console.warn('Duplicate variant, keeping first:', variant.out);
    continue;
  }
  assigned.set(variant.out, { src, variant });
}

if (!assigned.size) {
  console.error('Could not match any GLB to neck/sleeve variants. Check filenames.');
  process.exit(1);
}

let ratio = 0.14;
for (const { src, variant } of assigned.values()) {
  const outPath = path.join(optimizedDir, variant.out);
  let result = await compressGlbPreserveTextures(src, outPath, { simplifyRatio: ratio });
  if (result.after > 10 * 1024 * 1024) {
    ratio = 0.1;
    result = await compressGlbPreserveTextures(src, outPath, { simplifyRatio: ratio });
  }
  console.log(
    `${path.basename(src)} → ${variant.out}: ${(result.before / 1e6).toFixed(2)} MB → ${(result.after / 1e6).toFixed(2)} MB`,
  );
  if (result.after > 10 * 1024 * 1024) {
    console.warn('  ⚠ Still >10 MB — lower simplifyRatio or reduce texture size');
  }
}

console.log(`\nOptimized ${assigned.size} file(s) in ${optimizedDir}`);
console.log('Next: cd models-service && npm run upload:bell-bottom');
