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

export function supportsCustomFabricPrint(
  modelId: string,
  selections: Partial<Record<string, string | null>>,
): boolean {
  if (!isCasualFabricDressModelId(modelId)) return false;
  if (modelId === 'shalwar-kameez-short' || modelId === 'short-frock-shalwar') {
    const bottom = selections.bottom;
    return bottom === 'patiyala' || bottom == null;
  }
  return true;
}
