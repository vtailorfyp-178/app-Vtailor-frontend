type TabId = 'neck' | 'sleeves' | 'bottom' | 'frock-style' | 'colors' | 'saree-style';

export type CasualPatiyalaNeck = 'round' | 'v-neck' | 'square' | 'boat-neck';
export type CasualPatiyalaSleeve = 'full' | 'bell' | 'layered' | 'balloon';

export type PatiyalaGlbMap = Record<CasualPatiyalaNeck, Record<CasualPatiyalaSleeve, string>>;

function isCasualPatiyalaNeck(id: string | null): id is CasualPatiyalaNeck {
  return id === 'round' || id === 'v-neck' || id === 'square' || id === 'boat-neck';
}

function isCasualPatiyalaSleeve(id: string | null): id is CasualPatiyalaSleeve {
  return id === 'full' || id === 'bell' || id === 'layered' || id === 'balloon';
}

export function resolveCasualPatiyalaShortShirtGlbFromMap(
  map: PatiyalaGlbMap,
  s: Record<TabId, string | null>,
  modelId: string,
): string | null {
  const isShortShirt =
    modelId === 'shalwar-kameez-short' || modelId === 'short-frock-shalwar';
  if (!isShortShirt) return null;
  if (s.bottom != null && s.bottom !== 'patiyala') return null;
  if (!isCasualPatiyalaNeck(s.neck)) return null;

  const sleeves: CasualPatiyalaSleeve = isCasualPatiyalaSleeve(s.sleeves) ? s.sleeves : 'full';
  return map[s.neck][sleeves] ?? null;
}
