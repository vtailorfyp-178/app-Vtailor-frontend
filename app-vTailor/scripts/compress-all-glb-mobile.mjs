/**
 * Build mobile/ copies for every GLB under `3d model/` (skips existing mobile/ outputs).
 * Run: node scripts/compress-all-glb-mobile.mjs
 *      node scripts/compress-all-glb-mobile.mjs --force
 */
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compressGlbFile } from './glb-mobile-compress.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const modelsRoot = path.join(projectRoot, '3d model');
const force = process.argv.includes('--force');

async function walkGlbs(dir, list = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'mobile') continue;
      await walkGlbs(full, list);
    } else if (entry.name.endsWith('.glb')) {
      list.push(full);
    }
  }
  return list;
}

async function shouldSkip(inPath, outPath) {
  if (force) return false;
  try {
    const [src, dst] = await Promise.all([stat(inPath), stat(outPath)]);
    return dst.mtimeMs >= src.mtimeMs && dst.size > 80;
  } catch {
    return false;
  }
}

async function main() {
  const sources = await walkGlbs(modelsRoot);
  console.log(`Found ${sources.length} source GLBs (excluding mobile/ folders).`);

  let done = 0;
  let skipped = 0;
  let failed = 0;

  for (const inPath of sources) {
    const dir = path.dirname(inPath);
    const fileName = path.basename(inPath);
    const outPath = path.join(dir, 'mobile', fileName);
    const rel = path.relative(projectRoot, inPath);

    try {
      if (await shouldSkip(inPath, outPath)) {
        skipped += 1;
        continue;
      }
      const { before, after } = await compressGlbFile(inPath, outPath);
      const pct = ((1 - after / before) * 100).toFixed(1);
      console.log(
        `[${++done}/${sources.length - skipped}] ${rel}: ${(before / 1024 / 1024).toFixed(2)}MB → ${(after / 1024 / 1024).toFixed(2)}MB (${pct}%)`,
      );
    } catch (err) {
      failed += 1;
      console.error(`FAILED ${rel}:`, err instanceof Error ? err.message : err);
    }
  }

  console.log(`Done. compressed=${done} skipped=${skipped} failed=${failed}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
