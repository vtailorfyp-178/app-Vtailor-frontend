/**
 * Deep GLB inspection: compare working lehnga vs broken grarah Cloudinary assets.
 * Run: node scripts/inspect-glb-assets.mjs
 */
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const catalog = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../data/cloudinaryCatalog.json'), 'utf8'),
);

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          fetchBuffer(res.headers.location).then(resolve).catch(reject);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} ${url}`));
          return;
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      })
      .on('error', reject);
  });
}

function parseGlb(buf) {
  const jsonLen = buf.readUInt32LE(12);
  const json = JSON.parse(buf.slice(20, 20 + jsonLen).toString('utf8'));
  let bin = null;
  if (buf.length > 20 + jsonLen + 8) {
    const binLen = buf.readUInt32LE(20 + jsonLen);
    const binStart = 20 + jsonLen + 8;
    if (binLen > 0 && binStart + binLen <= buf.length) {
      bin = buf.slice(binStart, binStart + binLen);
    }
  }
  return { json, bin, fileSize: buf.length };
}

function inspectGlb(label, buf) {
  const { json, bin, fileSize } = parseGlb(buf);
  const materials = (json.materials ?? []).map((m, i) => {
    const pbr = m.pbrMetallicRoughness ?? {};
    return {
      index: i,
      name: m.name ?? `material_${i}`,
      baseColorFactor: pbr.baseColorFactor,
      hasBaseColorTex: pbr.baseColorTexture != null,
      baseColorTexIndex: pbr.baseColorTexture?.index,
      metallicRoughnessTex: pbr.metallicRoughnessTexture?.index,
      normalTex: m.normalTexture?.index,
      emissiveTex: m.emissiveTexture?.index,
      occlusionTex: m.occlusionTexture?.index,
      emissiveFactor: m.emissiveFactor,
      alphaMode: m.alphaMode,
      doubleSided: m.doubleSided,
      extensions: Object.keys(m.extensions ?? {}),
    };
  });

  const images = (json.images ?? []).map((img, i) => ({
    index: i,
    mimeType: img.mimeType,
    bufferView: img.bufferView,
    uri: img.uri ? String(img.uri).slice(0, 120) : null,
    embedded: img.bufferView != null,
    external: Boolean(img.uri && !img.uri.startsWith('data:')),
  }));

  const textures = (json.textures ?? []).map((t, i) => ({
    index: i,
    source: t.source,
    sampler: t.sampler,
  }));

  const meshes = (json.meshes ?? []).map((m, i) => ({
    index: i,
    name: m.name,
    primitives: (m.primitives ?? []).map((p) => ({
      material: p.material,
      attributes: Object.keys(p.attributes ?? {}),
      mode: p.mode,
    })),
  }));

  const nodes = (json.nodes ?? []).map((n, i) => ({
    index: i,
    name: n.name,
    mesh: n.mesh,
    children: n.children,
  }));

  return {
    label,
    fileSizeKB: Math.round(fileSize / 1024),
    binSizeKB: bin ? Math.round(bin.length / 1024) : 0,
    extensionsUsed: json.extensionsUsed ?? [],
    extensionsRequired: json.extensionsRequired ?? [],
    imageCount: images.length,
    textureCount: textures.length,
    materialCount: materials.length,
    meshCount: meshes.length,
    images,
    textures,
    materials,
    meshes,
    nodes: nodes.slice(0, 8),
  };
}

function findCatalogUrl(relativePath) {
  const row = catalog.find((c) => c.relativePath === relativePath);
  if (!row) return null;
  return row.url;
}

async function main() {
  const pairs = [
    {
      role: 'WORKING lehnga circular',
      path: '3d model/3d lehnga/circular lehnga/optimized/optimized-white-round-neck-full-sleeves-circular-lehnga.glb',
    },
    {
      role: 'WORKING lehnga (mobile)',
      path: '3d model/3d lehnga/circular lehnga/mobile/white round neck full sleeves circular lehnga.glb',
    },
    {
      role: 'FIXED grarah shirt (resolver → optimized)',
      path: '3d model/3d grarah/shirt/optimized/optimized-white-round-neck-full-sleeves-shirt.glb',
    },
    {
      role: 'FIXED grarah peplum (optimized)',
      path: '3d model/3d grarah/peplum/optimized/optimized-white-round-neck-full-sleeves-peplum.glb',
    },
    {
      role: 'OLD broken grarah mobile (textureless)',
      path: '3d model/3d grarah/peplum/mobile/white-round-neck-full-sleeves-peplum.glb',
    },
    {
      role: 'BROKEN grarah red',
      path: '3d model/3d grarah/shirt/mobile/red-round-neck-bell-sleeves-shirt.glb',
    },
    {
      role: 'WORKING long frock',
      path: '3d model/3d long frock/optimized/optimized-white-round-neck-full-sleeves-flarred.glb',
    },
  ];

  const results = [];
  for (const { role, path: rel } of pairs) {
    const url = findCatalogUrl(rel);
    if (!url) {
      results.push({ role, path: rel, error: 'NOT IN CATALOG' });
      continue;
    }
    try {
      const buf = await fetchBuffer(url);
      const report = inspectGlb(role, buf);
      report.catalogPath = rel;
      report.url = url.slice(0, 100) + '…';
      results.push(report);

      // Probe external texture URIs
      const { json } = parseGlb(buf);
      for (const img of json.images ?? []) {
        if (img.uri && !img.uri.startsWith('data:') && !img.uri.startsWith('http')) {
          report.externalTextureUri = img.uri;
        }
        if (img.uri && img.uri.startsWith('http')) {
          try {
            const head = await fetchBuffer(img.uri);
            report.externalTextureFetch = { uri: img.uri.slice(0, 80), ok: true, bytes: head.length };
          } catch (e) {
            report.externalTextureFetch = { uri: img.uri.slice(0, 80), ok: false, error: String(e) };
          }
        }
      }
    } catch (e) {
      results.push({ role, path: rel, error: String(e) });
    }
  }

  const outPath = path.join(__dirname, '../data/glb-inspection-report.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log('Wrote', outPath);
  for (const r of results) {
    console.log('\n===', r.label || r.role, '===');
    if (r.error) {
      console.log('ERROR:', r.error);
      continue;
    }
    console.log(
      `size=${r.fileSizeKB}KB bin=${r.binSizeKB}KB images=${r.imageCount} textures=${r.textureCount} materials=${r.materialCount}`,
    );
    console.log('extensionsUsed:', r.extensionsUsed);
    if (r.materials?.length) console.log('materials:', JSON.stringify(r.materials, null, 2));
    if (r.meshes?.length) console.log('meshes:', JSON.stringify(r.meshes, null, 2));
    if (r.images?.length) console.log('images:', JSON.stringify(r.images, null, 2));
  }
}

main().catch(console.error);
