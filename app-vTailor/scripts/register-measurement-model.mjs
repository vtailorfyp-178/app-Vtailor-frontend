/**
 * Register measurement-model.glb static URL in MongoDB (when Cloudinary >10MB limit).
 *
 * Run: npm run register:measurement-model
 *      npm run register:measurement-model -- --api=http://192.168.100.46:8000/app/api/v1
 *      npm run register:measurement-model -- --host=192.168.100.46
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const hostArg = process.argv.find((a) => a.startsWith('--host='));
const apiArg = process.argv.find((a) => a.startsWith('--api='));
const host = hostArg?.split('=')[1] || process.env.VTAILOR_LAN_IP || '192.168.100.46';
const apiBase = (apiArg?.split('=')[1] || process.env.VTAILOR_API_BASE || `http://${host}:8000/app/api/v1`).replace(
  /\/$/,
  '',
);

const modelUrl =
  `http://${host}:8000/3dModels/` +
  ['3d model', 'measurement', 'mobile', 'measurement-model.glb']
    .map((s) => encodeURIComponent(s))
    .join('/');

async function main() {
  console.log(`Registering model URL in MongoDB:\n  ${modelUrl}`);
  console.log(`API: ${apiBase}/measurement-models/save`);

  const res = await fetch(`${apiBase}/measurement-models/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'measurement-model',
      modelUrl,
      publicId: 'local/measurement-model',
    }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error('Save failed:', body);
    process.exit(1);
  }

  console.log('Saved to MongoDB:');
  console.log(JSON.stringify(body, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
