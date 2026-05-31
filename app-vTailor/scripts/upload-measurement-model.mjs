/**
 * Upload measurement-model.glb to FastAPI → Cloudinary → MongoDB.
 *
 * Prerequisites:
 *   npm run compress:measurement-model
 *   FastAPI running with Cloudinary env configured
 *
 * Run: npm run upload:measurement-model
 *      npm run upload:measurement-model -- --api http://127.0.0.1:8000/app/api/v1
 */
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const glbPath = path.resolve(
  projectRoot,
  '../../app-Vtailor/3d model/measurement/mobile/measurement-model.glb',
);

const apiArg = process.argv.find((a) => a.startsWith('--api='));
const apiBase = (apiArg?.split('=')[1] || process.env.VTAILOR_API_BASE || 'http://127.0.0.1:8000/app/api/v1').replace(
  /\/$/,
  '',
);

async function main() {
  const info = await stat(glbPath);
  console.log(`Uploading ${glbPath} (${(info.size / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`API: ${apiBase}/measurement-models/upload`);

  const buffer = await readFile(glbPath);
  const blob = new Blob([buffer], { type: 'model/gltf-binary' });
  const form = new FormData();
  form.append('file', blob, 'measurement-model.glb');
  form.append('name', 'measurement-model');

  const res = await fetch(`${apiBase}/measurement-models/upload`, {
    method: 'POST',
    body: form,
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error('Upload failed:', body);
    process.exit(1);
  }

  console.log('Upload complete:');
  console.log(JSON.stringify(body, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
