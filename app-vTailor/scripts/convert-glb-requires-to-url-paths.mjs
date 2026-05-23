/**
 * Replaces Metro `require('…/3d model/…glb')` with URL path strings for backend loading.
 * Run: node scripts/convert-glb-requires-to-url-paths.mjs
 */
import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const glbRoot = path.join(projectRoot, 'services', 'glb');

const FILES = [
  'dressGlbResolverImpl.ts',
  'patiyalaDressGlb.ts',
  'patiyalaDressGlb.native.ts',
  'chunks/longFrockGlb.ts',
  'chunks/longFrockGlb.native.ts',
  'chunks/sareeGlb.ts',
  'chunks/sareeGlb.native.ts',
  'chunks/grarahShirtGlb.ts',
  'chunks/grarahShirtGlb.native.ts',
  'chunks/grarahPeplumGlb.ts',
  'chunks/grarahPeplumGlb.native.ts',
  'chunks/lehngaBridalGlb.ts',
  'chunks/lehngaBridalGlb.native.ts',
  'chunks/lehngaCircularGlb.ts',
  'chunks/lehngaCircularGlb.native.ts',
  'chunks/lehngaGlb.ts',
  'chunks/lehngaGlb.native.ts',
  'chunks/grarahGlb.ts',
  'chunks/grarahGlb.native.ts',
];

function convertContent(src) {
  let out = src;

  out = out.replace(/require\('(?:\.\.\/)+3d model\/([^']+)'\)/g, "'3d model/$1'");

  out = out.replace(/\s+as number\b/g, '');

  out = out.replace(
    /Record<CasualPatiyalaNeck, Record<CasualPatiyalaSleeve, number>>/g,
    'Record<CasualPatiyalaNeck, Record<CasualPatiyalaSleeve, string>>',
  );

  out = out.replace(/PatiyalaGlbMap = Record<[^>]+number>/g, (m) => m.replace('number', 'string'));

  out = out.replace(/\broundBell: number\b/g, 'roundBell: string');
  out = out.replace(/\broundFull: number\b/g, 'roundFull: string');
  out = out.replace(/\bvBell: number\b/g, 'vBell: string');
  out = out.replace(/\bvFull: number\b/g, 'vFull: string');
  out = out.replace(/\broundShort: number\b/g, 'roundShort: string');
  out = out.replace(/\bsweetheartFull: number\b/g, 'sweetheartFull: string');
  out = out.replace(/\bsweetheartShort: number\b/g, 'sweetheartShort: string');
  out = out.replace(/\broundFull: number\b/g, 'roundFull: string');

  out = out.replace(/\): number \| null/g, '): string | null');
  out = out.replace(/: number \| null/g, ': string | null');

  return out;
}

async function main() {
  for (const rel of FILES) {
    const filePath = path.join(glbRoot, rel);
    try {
      const src = await readFile(filePath, 'utf8');
      const out = convertContent(src);
      if (out !== src) {
        await writeFile(filePath, out, 'utf8');
        console.log('Updated', rel);
      } else {
        console.log('Skipped (no changes)', rel);
      }
    } catch (err) {
      if (err && err.code === 'ENOENT') {
        console.warn('Missing', rel);
      } else {
        throw err;
      }
    }
  }
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
