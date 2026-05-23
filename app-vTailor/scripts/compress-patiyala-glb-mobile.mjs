/**
 * Build mobile-friendly Patiyala GLBs for Expo Go / Android.
 * Run: node scripts/compress-patiyala-glb-mobile.mjs
 */
import { mkdir, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compressGlbFile } from './glb-mobile-compress.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const srcDir = path.join(projectRoot, '3d model', '3d shalwar kameez', 'patiyala');
const outDir = path.join(srcDir, 'mobile');

async function compressOne(fileName) {
  const inPath = path.join(srcDir, fileName);
  const outPath = path.join(outDir, fileName);
  const { before, after } = await compressGlbFile(inPath, outPath);
  const pct = ((1 - after / before) * 100).toFixed(1);
  console.log(`${fileName}: ${(before / 1024 / 1024).toFixed(2)}MB → ${(after / 1024 / 1024).toFixed(2)}MB (${pct}% smaller)`);
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const files = (await readdir(srcDir)).filter((f) => f.endsWith('.glb'));
  console.log(`Compressing ${files.length} Patiyala GLBs → mobile/`);
  for (const file of files) {
    await compressOne(file);
  }
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
