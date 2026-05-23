/**
 * Generates dressGlbResolverImpl.native.ts — same resolver, mobile/ GLB paths (URL strings).
 * Run: node scripts/generate-dress-glb-resolver-native.mjs
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const srcPath = path.join(projectRoot, 'services', 'glb', 'dressGlbResolverImpl.ts');
const outPath = path.join(projectRoot, 'services', 'glb', 'dressGlbResolverImpl.native.ts');

const header = `/**
 * AUTO-GENERATED — do not edit by hand.
 * Run: npm run generate:resolver-native
 * Mobile-optimized GLB paths (…/mobile/…) for React Native.
 */

`;

function toMobilePathLine(line) {
  return line.replace(/= '(3d model\/(?:[^']+\/)+)([^'/]+\.glb)'/g, (match, dir, file) => {
    if (dir.endsWith('mobile/')) return match;
    return `= '${dir}mobile/${file}'`;
  });
}

async function main() {
  const src = await readFile(srcPath, 'utf8');
  const lines = src.split('\n').map((line) => {
    if (line.includes("'3d model/")) {
      return toMobilePathLine(line);
    }
    return line;
  });

  const body = lines.join('\n');
  await writeFile(outPath, header + body, 'utf8');
  const count = (body.match(/\/mobile\//g) ?? []).length;
  console.log(`Wrote ${path.relative(projectRoot, outPath)} (${count} mobile paths).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
