/**
 * Merge models-service upload results → app data/cloudinaryCatalog.json
 * Run after: cd app-Vtailor/models-service && npm run upload:grarah-optimized
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const serviceData = path.resolve(root, '../../app-Vtailor/models-service/data');
const out = path.join(root, 'data', 'cloudinaryCatalog.json');

const sources = [
  path.join(serviceData, 'uploadGrarahOptimizedResults.json'),
  path.join(serviceData, 'uploadResults.json'),
].filter((p) => fs.existsSync(p));

if (!sources.length) {
  console.error('No upload results found under', serviceData);
  process.exit(1);
}

/** Long frock legacy: optimized → mobile with spaces. */
function optimizedToMobileSpaced(relativePath) {
  const m = relativePath.match(/^(.+)\/optimized\/optimized-(.+)\.glb$/i);
  if (!m || relativePath.toLowerCase().includes('grarah/')) return null;
  return `${m[1]}/mobile/${m[2].replace(/-/g, ' ')}.glb`;
}

/** Grarah: optimized → mobile kebab (same stem as resolver). */
function optimizedToGrarahMobile(relativePath) {
  const m = relativePath.match(
    /^3d model\/3d grarah\/(shirt|peplum)\/optimized\/optimized-(.+)\.glb$/i,
  );
  if (!m) return null;
  return `3d model/3d grarah/${m[1]}/mobile/${m[2]}.glb`;
}

const existing = fs.existsSync(out)
  ? JSON.parse(fs.readFileSync(out, 'utf8'))
  : [];

const byPath = new Map();
for (const row of existing) {
  if (row?.relativePath) byPath.set(row.relativePath.toLowerCase(), row);
}

function addRow(row) {
  if (!row.url || !row.relativePath) return;
  const key = row.relativePath.toLowerCase();
  byPath.set(key, {
    relativePath: row.relativePath,
    url: row.url,
    aliasOf: row.aliasOf || null,
  });
}

for (const src of sources) {
  const raw = JSON.parse(fs.readFileSync(src, 'utf8'));
  for (const r of raw) {
    addRow({ relativePath: r.relativePath, url: r.url, aliasOf: r.aliasOf || null });
    const grarahMobile = optimizedToGrarahMobile(r.relativePath);
    if (grarahMobile) {
      addRow({ relativePath: grarahMobile, url: r.url, aliasOf: r.relativePath });
    }
    const spacedMobile = optimizedToMobileSpaced(r.relativePath);
    if (spacedMobile) {
      addRow({ relativePath: spacedMobile, url: r.url, aliasOf: r.relativePath });
    }
  }
}

const items = [...byPath.values()];
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(items));
console.log('Merged', items.length, 'catalog entries →', out);
