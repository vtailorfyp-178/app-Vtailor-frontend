import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'services', 'glb', 'chunks');

function toMobile(content) {
  return content.replace(/= '(3d model\/(?:[^']+\/)+)([^'/]+\.glb)'/g, (match, dir, file) => {
    if (dir.endsWith('mobile/')) return match;
    return `= '${dir}mobile/${file}'`;
  });
}

const files = ['longFrockGlb', 'sareeGlb', 'grarahShirtGlb', 'grarahPeplumGlb', 'lehngaBridalGlb', 'lehngaCircularGlb'];

for (const base of files) {
  const src = path.join(root, `${base}.ts`);
  const body = await readFile(src, 'utf8');
  await writeFile(path.join(root, `${base}.native.ts`), `/** Mobile GLB paths (backend URLs) */\n\n${toMobile(body)}\n`);
  console.log('native:', base);
}
