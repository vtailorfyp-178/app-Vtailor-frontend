/**
 * Copy GLBs from backend repo `app-Vtailor/3d model/` into `app-Vtailor/app/3dModels/3d model/`.
 * Run from app-vTailor: node scripts/sync-3dmodels-to-backend.mjs
 */
import { cp, mkdir, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(frontendRoot, '..', '..');

const SOURCES = [
  path.join(repoRoot, 'app-Vtailor', '3d model'),
  path.join(frontendRoot, '3d model'),
  path.join(repoRoot, 'app-Vtailor', 'app', '3dModels', '3d model'),
];

const dest = path.join(repoRoot, 'app-Vtailor', 'app', '3dModels', '3d model');

async function pickSource() {
  for (const candidate of SOURCES) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      /* try next */
    }
  }
  throw new Error(
    `No GLB source folder found. Expected one of:\n${SOURCES.map((s) => `  - ${s}`).join('\n')}`,
  );
}

async function main() {
  const source = await pickSource();
  await mkdir(path.dirname(dest), { recursive: true });
  await cp(source, dest, { recursive: true, force: true });
  console.log(`Synced GLB library:\n  ${source}\n→ ${dest}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
