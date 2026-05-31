import { NodeIO } from '@gltf-transform/core';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const glbPath = path.resolve(
  __dirname,
  '../../../app-Vtailor/3d model/3d measurement model.glb',
);

const io = new NodeIO();
const doc = await io.read(glbPath);
const root = doc.getRoot();

console.log('Named nodes:');
for (const node of root.listNodes()) {
  const name = node.getName();
  if (!name) continue;
  const t = node.getTranslation();
  const mesh = node.getMesh();
  console.log(
    `  ${name}${mesh ? ' [mesh]' : ''} pos=[${t.map((v) => v.toFixed(3)).join(', ')}]`,
  );
}

console.log('\nMeshes:');
for (const mesh of root.listMeshes()) {
  const name = mesh.getName();
  if (name) console.log(`  ${name}`);
}
