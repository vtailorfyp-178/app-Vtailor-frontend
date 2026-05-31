export type TabId =
  | 'neck'
  | 'sleeves'
  | 'bottom'
  | 'frock-style'
  | 'colors'
  | 'saree-style'
  | 'fabric-print';

export type DressSelections = Record<TabId, string | null>;

/** GLB routing uses the same model id as the customize screen (no legacy remap). */
export function resolveGlbModelId(modelId: string): string {
  return modelId;
}

export function isCasualShortShirtModelId(modelId: string): boolean {
  return modelId === 'shalwar-kameez-short' || modelId === 'short-frock-shalwar';
}

export function isTrouserShirtBellBottomModelId(modelId: string): boolean {
  return modelId === 'trouser-shirt-bell-bottom';
}

export function isTrouserShirtTulipTrouserModelId(modelId: string): boolean {
  return modelId === 'trouser-shirt-tulip-trouser';
}

export function isTrouserShirtVariationModelId(modelId: string): boolean {
  return isTrouserShirtBellBottomModelId(modelId) || isTrouserShirtTulipTrouserModelId(modelId);
}
