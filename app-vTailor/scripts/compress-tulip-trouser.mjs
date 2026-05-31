/**
 * Compress tulip-trouser GLBs (textures preserved) → optimized kebab filenames.
 *
 * Place sources in:
 *   app-Vtailor/3d model/3d trouser shirt/tulip-trouser/original/
 *   app-Vtailor/3d model/3d trouser shirt/Tulip trouser/  (legacy folder)
 *
 * Run: npm run compress:tulip-trouser
 */
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compressGlbPreserveTextures } from './glb-textured-compress.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../../app-Vtailor/3d model/3d trouser shirt/tulip-trouser');
const originalDir = path.join(root, 'original');
const optimizedDir = path.join(root, 'optimized');
const legacyDir = path.resolve(
  __dirname,
  '../../../app-Vtailor/3d model/3d trouser shirt/Tulip trouser',
);
const desktopSourceDir = path.resolve(process.env.USERPROFILE || '', 'Desktop', 'tulip-trouser');

const VARIANTS = [
  { neck: 'round', sleeve: 'full', out: 'round-neck-full-sleeve.glb', patterns: [/round.*full/i] },
  {
    neck: 'round',
    sleeve: 'bell',
    out: 'round-neck-bell-sleeve.glb',
    patterns: [/round.*bell/i],
  },
  {
    neck: 'round',
    sleeve: 'puff',
    out: 'round-neck-puff-sleeve.glb',
    patterns: [/round.*(puff|balloon)/i],
  },
  {
    neck: 'collar',
    sleeve: 'full',
    out: 'collar-neck-full-sleeve.glb',
    patterns: [/collar.*full/i, /^color\s+with\s+full/i],
  },
  {
    neck: 'collar',
    sleeve: 'bell',
    out: 'collar-neck-bell-sleeve.glb',
    patterns: [/collar.*bell/i, /^color\s+with\s+bell/i],
  },
  {
    neck: 'collar',
    sleeve: 'puff',
    out: 'collar-neck-puff-sleeve.glb',
    patterns: [/collar.*(puff|balloon)/i, /^color\s+with\s+puff/i],
  },
  {
    neck: 'keyhole',
    sleeve: 'full',
    out: 'keyhole-neck-full-sleeve.glb',
    patterns: [/keyhole.*full/i],
  },
  {
    neck: 'keyhole',
    sleeve: 'bell',
    out: 'keyhole-neck-bell-sleeve.glb',
    patterns: [/keyhole.*bell/i],
  },
  {
    neck: 'keyhole',
    sleeve: 'puff',
    out: 'keyhole-neck-puff-sleeve.glb',
    patterns: [/keyhole.*(puff|balloon)/i],
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
  const dirs = [desktopSourceDir, legacyDir, originalDir, root].filter((d) => existsSync(d));
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

mkdirSync(optimizedDir, { recursive: true });

const sources = collectSources();
if (!sources.length) {
  console.error('No source GLBs found. Add files to:\n ', originalDir, '\n or', legacyDir);
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
console.log('Next: cd models-service && npm run upload:tulip-trouser');
