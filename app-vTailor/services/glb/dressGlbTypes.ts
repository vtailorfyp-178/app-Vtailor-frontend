export type TabId = 'neck' | 'sleeves' | 'bottom' | 'frock-style' | 'colors' | 'saree-style';

export type DressSelections = Record<TabId, string | null>;

/** GLB routing uses the same model id as the customize screen (no legacy remap). */
export function resolveGlbModelId(modelId: string): string {
  return modelId;
}

export function isCasualShortShirtModelId(modelId: string): boolean {
  return modelId === 'shalwar-kameez-short' || modelId === 'short-frock-shalwar';
}
