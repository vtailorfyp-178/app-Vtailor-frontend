import type { TabId } from './dressGlbTypes';

export type TulipTrouserNeck = 'round' | 'collar' | 'keyhole';
export type TulipTrouserSleeve = 'full' | 'bell' | 'puff';

export type TulipTrouserGlbMap = Record<TulipTrouserNeck, Record<TulipTrouserSleeve, string>>;

export const TROUSER_SHIRT_TULIP_TROUSER_MODEL_ID = 'trouser-shirt-tulip-trouser';

function isTulipTrouserNeck(id: string | null): id is TulipTrouserNeck {
  return id === 'round' || id === 'collar' || id === 'keyhole';
}

function isTulipTrouserSleeve(id: string | null): id is TulipTrouserSleeve {
  return id === 'full' || id === 'bell' || id === 'puff';
}

export function isTrouserShirtTulipTrouserModelId(modelId: string): boolean {
  return modelId === TROUSER_SHIRT_TULIP_TROUSER_MODEL_ID;
}

export function resolveTulipTrouserGlbFromMap(
  map: TulipTrouserGlbMap,
  s: Record<TabId, string | null>,
  modelId: string,
): string | null {
  if (!isTrouserShirtTulipTrouserModelId(modelId)) return null;
  if (!isTulipTrouserNeck(s.neck)) return null;

  const sleeves: TulipTrouserSleeve = isTulipTrouserSleeve(s.sleeves) ? s.sleeves : 'full';
  return map[s.neck][sleeves] ?? null;
}
