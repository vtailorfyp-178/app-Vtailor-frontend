/**
 * Shared fabric + color behaviour for Patiyala shalwar and Trouser shirt bell bottom.
 */

export function isCasualFabricDressModelId(modelId: string): boolean {
  return (
    modelId === 'trouser-shirt-bell-bottom' ||
    modelId === 'trouser-shirt-tulip-trouser' ||
    modelId === 'shalwar-kameez-short' ||
    modelId === 'short-frock-shalwar'
  );
}

export function isCasualFabricDressGlbUrl(glbUrl?: string): boolean {
  const u = decodeURIComponent(glbUrl ?? '').toLowerCase();
  return /patiyala|bell-bottom|tulip-trouser|trouser-shirt|trouser shirt/i.test(u);
}

/** Frill saree GLBs — soft chiffon fabric profile (Three.js + model-viewer). */
export function isFrillSareeGlbUrl(glbUrl?: string): boolean {
  const u = decodeURIComponent(glbUrl ?? '').toLowerCase();
  return /frill[\s_-]?saree|sari\/frill|frill sari|flirred|flired/i.test(u);
}

/** Runtime shade tint (keeps embroidery maps when present — bell bottom). */
export function glbAllowsCasualFabricRuntimeTint(modelUrl?: string): boolean {
  return isCasualFabricDressGlbUrl(modelUrl);
}

/** Runtime custom fabric print texture — same casual dress GLBs as color tint. */
export function glbAllowsRuntimeFabricTexture(modelUrl?: string): boolean {
  return isCasualFabricDressGlbUrl(modelUrl);
}

/** Custom fabric print upload removed from casual dress UI — color tint only. */
export function supportsCustomFabricPrint(
  _modelId: string,
  _selections: Partial<Record<string, string | null>>,
): boolean {
  return false;
}
