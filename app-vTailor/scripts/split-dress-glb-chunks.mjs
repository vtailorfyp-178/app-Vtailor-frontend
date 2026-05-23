/**
 * Split dressGlbResolverImpl.ts into lazy-loaded chunks (+ native mobile paths).
 * Run: node scripts/split-dress-glb-chunks.mjs
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const srcPath = path.join(projectRoot, 'services', 'glb', 'dressGlbResolverImpl.ts');
const chunksDir = path.join(projectRoot, 'services', 'glb', 'chunks');

const CHUNKS = [
  {
    file: 'longFrockGlb.ts',
    exportName: 'resolveBundledLongFrockGlb',
    bodyExport: 'resolveLongFrockByColor',
    startMarker: '/** Party/Formal → Long Frock, black',
    endMarker: '/** Party/Formal → Saree plain',
    extraLines: ['resolveLongFrockFlared', 'resolveLongFrockSplit', 'resolveLongFrockByColor'],
    typeNames: ['LongFrockFlaredSet', 'LongFrockSplitSet'],
  },
  {
    file: 'sareeGlb.ts',
    exportName: 'resolveBundledSareeGlb',
    bodyExport: 'resolveSareeDressGlb',
    startMarker: '/** Party/Formal → Saree plain',
    endMarker: '/** Wedding → Grarah short shirt',
    extraLines: ['resolveSareeDressGlb'],
  },
  {
    file: 'grarahGlb.ts',
    sliceOnly: true,
    startMarker: '/** Wedding → Grarah short shirt',
    endMarker: '/** Wedding → Bridal lehnga',
    customExport: `export function resolveBundledGrarahGlb(
  s: DressSelections,
  modelId: string,
): number | null {
  if (modelId === 'grarah-short-shirt') return resolveGrarahShortShirtGlb(s);
  if (modelId === 'grarah-peplum') return resolveGrarahPeplumGlb(s);
  return null;
}`,
  },
  {
    file: 'lehngaGlb.ts',
    exportName: 'resolveBundledLehngaGlb',
    bodyExport: null,
    startMarker: '/** Wedding → Bridal lehnga',
    endMarker: '/** Casual short shirt maps',
    extraLines: [
      'resolveBridalCombo',
      'resolveBridalLehngaGlb',
      'resolveCircularLehngaGlb',
    ],
    typeNames: ['BridalComboSet'],
    constNames: ['BRIDAL_LEHNGA_SETS', 'CIRCULAR_LEHNGA_SETS'],
    customExport: `export function resolveBundledLehngaGlb(
  s: DressSelections,
  modelId: string,
): number | null {
  if (modelId === 'lehnga-bridal') return resolveBridalLehngaGlb(s);
  if (modelId === 'lehnga-circular') return resolveCircularLehngaGlb(s);
  return null;
}`,
  },
];

function sliceBetween(src, startMarker, endMarker) {
  const start = src.indexOf(startMarker);
  const end = src.indexOf(endMarker, start + 1);
  if (start < 0 || end < 0) throw new Error(`Markers not found: ${startMarker}`);
  return src.slice(start, end);
}

function extractFunction(src, name) {
  const start = src.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`Function not found: ${name}`);
  const braceStart = src.indexOf('{', start);
  let depth = 0;
  for (let i = braceStart; i < src.length; i += 1) {
    if (src[i] === '{') depth += 1;
    else if (src[i] === '}') {
      depth -= 1;
      if (depth === 0) return src.slice(start, i + 1);
    }
  }
  throw new Error(`Unclosed function: ${name}`);
}

function extractFunctions(src, names) {
  return names.map((name) => extractFunction(src, name)).join('\n\n');
}

function extractConstBlock(src, name) {
  const start = src.indexOf(`const ${name}`);
  if (start < 0) throw new Error(`Const not found: ${name}`);
  const semi = src.indexOf('};', start);
  if (semi < 0) throw new Error(`Const block not closed: ${name}`);
  return src.slice(start, semi + 2);
}

function extractTypes(src, names) {
  return names.map((name) => extractConstBlock(src.replace(/^type /, 'type '), name)).join('\n\n');
}

function toMobileRequire(content) {
  return content.replace(
    /require\('(\.\.\/\.\.\/\.\.\/3d model\/(?:[^']+\/)+)([^'/]+\.glb)'\)/g,
    (match, dir, file) => {
      if (dir.endsWith('/mobile/')) return match;
      return `require('${dir}mobile/${file}')`;
    },
  );
}

function extractTypeDef(src, name) {
  const start = src.indexOf(`type ${name}`);
  if (start < 0) throw new Error(`Type not found: ${name}`);
  const end = src.indexOf('};', start);
  return src.slice(start, end + 2);
}

async function buildChunk(chunk, fullSrc) {
  const bodyBlock = sliceBetween(fullSrc, chunk.startMarker, chunk.endMarker);
  const header = `import type { DressSelections, TabId } from '../dressGlbTypes';

`;

  const exportBlock =
    chunk.customExport ??
    `export function ${chunk.exportName}(s: DressSelections): number | null {
  return ${chunk.bodyExport}(s);
}`;

  if (chunk.sliceOnly) {
    const body = bodyBlock.replaceAll("require('../../3d model/", "require('../../../3d model/");
    return header + body + '\n\n' + exportBlock + '\n';
  }

  const funcBlock = extractFunctions(fullSrc, chunk.extraLines);
  const typesBlock = (chunk.typeNames ?? [])
    .map((n) => extractTypeDef(fullSrc, n))
    .join('\n\n');
  const requires = bodyBlock.replaceAll("require('../../3d model/", "require('../../../3d model/");
  return header + requires + '\n\n' + typesBlock + '\n\n' + funcBlock + '\n\n' + exportBlock + '\n';
}

async function main() {
  const src = await readFile(srcPath, 'utf8');
  await mkdir(chunksDir, { recursive: true });

  for (const chunk of CHUNKS) {
    const body = await buildChunk(chunk, src);
    const outWeb = path.join(chunksDir, chunk.file);
    const outNative = path.join(chunksDir, chunk.file.replace('.ts', '.native.ts'));
    await writeFile(outWeb, body, 'utf8');
    const nativeHeader = `/** AUTO-GENERATED native chunk — mobile GLB paths */\n\n`;
    await writeFile(outNative, nativeHeader + toMobileRequire(body), 'utf8');
    console.log('Wrote', chunk.file, '+ native');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
