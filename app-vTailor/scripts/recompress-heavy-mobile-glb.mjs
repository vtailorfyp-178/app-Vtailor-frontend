/**
 * Re-compress mobile/ GLBs that are still too large for phones (>9MB).
 * Uses a lower simplify ratio than the default mobile pass.
 *
 * Run: node scripts/recompress-heavy-mobile-glb.mjs
 */
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compressGlbFile } from './glb-mobile-compress.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const modelsRoot = path.join(projectRoot, '3d model');
const MAX_MOBILE_BYTES = 9 * 1024 * 1024;
const HEAVY_RATIO = 0.22;

async function walkMobileGlbs(dir, list = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkMobileGlbs(full, list);
    } else if (entry.name.endsWith('.glb') && dir.endsWith(`${path.sep}mobile`)) {
      list.push(full);
    }
  }
  return list;
}

async function pickSource(mobilePath) {
  const fileName = path.basename(mobilePath);
  const parentDir = path.dirname(path.dirname(mobilePath));
  const fullSource = path.join(parentDir, fileName);
  try {
    const st = await stat(fullSource);
    if (st.size > 80) return fullSource;
  } catch {
    /* use mobile as source */
  }
  return mobilePath;
}

async function main() {
  const mobileFiles = await walkMobileGlbs(modelsRoot);
  const heavy = [];
  for (const p of mobileFiles) {
    const st = await stat(p);
    if (st.size > MAX_MOBILE_BYTES) heavy.push(p);
  }

  console.log(`Found ${heavy.length} mobile GLBs over ${(MAX_MOBILE_BYTES / 1024 / 1024).toFixed(0)}MB.`);

  let done = 0;
  for (const outPath of heavy) {
    const rel = path.relative(projectRoot, outPath);
    const inPath = await pickSource(outPath);
    try {
      const { before, after } = await compressGlbFile(inPath, outPath, { simplifyRatio: HEAVY_RATIO });
      const pct = ((1 - after / before) * 100).toFixed(1);
      console.log(
        `[${++done}/${heavy.length}] ${rel}: ${(before / 1024 / 1024).toFixed(2)}MB → ${(after / 1024 / 1024).toFixed(2)}MB (${pct}%)`,
      );
    } catch (err) {
      console.error(`FAILED ${rel}:`, err instanceof Error ? err.message : err);
    }
  }

  console.log('Heavy mobile recompress finished.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
