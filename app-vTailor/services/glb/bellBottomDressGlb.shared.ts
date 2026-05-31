import type { TabId } from './dressGlbTypes';

export type BellBottomNeck = 'round' | 'collar' | 'keyhole';
export type BellBottomSleeve = 'straight' | 'puff' | 'flared-bell';

export type BellBottomGlbMap = Record<BellBottomNeck, Record<BellBottomSleeve, string>>;

export const TROUSER_SHIRT_BELL_BOTTOM_MODEL_ID = 'trouser-shirt-bell-bottom';

function isBellBottomNeck(id: string | null): id is BellBottomNeck {
  return id === 'round' || id === 'collar' || id === 'keyhole';
}

function isBellBottomSleeve(id: string | null): id is BellBottomSleeve {
  return id === 'straight' || id === 'puff' || id === 'flared-bell';
}

export function isTrouserShirtBellBottomModelId(modelId: string): boolean {
  return modelId === TROUSER_SHIRT_BELL_BOTTOM_MODEL_ID;
}

export function resolveBellBottomGlbFromMap(
  map: BellBottomGlbMap,
  s: Record<TabId, string | null>,
  modelId: string,
): string | null {
  if (!isTrouserShirtBellBottomModelId(modelId)) return null;
  if (!isBellBottomNeck(s.neck)) return null;

  const sleeves: BellBottomSleeve = isBellBottomSleeve(s.sleeves) ? s.sleeves : 'straight';
  return map[s.neck][sleeves] ?? null;
}
