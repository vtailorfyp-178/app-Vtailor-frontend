export function isGrarahModelUrl(modelUrl?: string): boolean {
  const u = decodeURIComponent(modelUrl ?? '').toLowerCase();
  return /grarah|3d-grarah/i.test(u);
}

function grarahHasEmbeddedTextures(modelUrl?: string): boolean {
  const u = decodeURIComponent(modelUrl ?? '').toLowerCase();
  return /\/optimized\/optimized-|grarah\/[^/]+-optimized\/optimized-/i.test(u);
}

/** GLBs with embedded texture maps — preserve materials as-is. */
export function glbNeedsEmbeddedTextures(modelUrl?: string): boolean {
  if (isGrarahModelUrl(modelUrl) && grarahHasEmbeddedTextures(modelUrl)) return true;
  const u = decodeURIComponent(modelUrl ?? '').toLowerCase();
  if (/bridal-lehnga-optimized|optimized-mahroon|optimized-.*bridal/i.test(u)) return true;
  if (/bell-bottom\/optimized|trouser-shirt\/bell-bottom/i.test(u)) return true;
  if (/tulip-trouser\/optimized|trouser-shirt\/tulip-trouser/i.test(u)) return true;
  return /saree|lehnga|bridal|embroid|long[\s-]?frock/i.test(u);
}

/** Disabled — grarah uses per-color GLB files, not runtime tint. */
export function glbNeedsGrarahWeddingColor(_modelUrl?: string): boolean {
  return false;
}

/** Wedding grarah/peplum: color = swap GLB variant (neck + sleeves + color). */
export function glbUsesVariantModelForColor(modelId?: string): boolean {
  return modelId === 'grarah-short-shirt' || modelId === 'grarah-peplum';
}
