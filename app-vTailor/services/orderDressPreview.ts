/**
 * Maps an order’s dress name (or similar label) to modelId + selections so the
 * bundled GLB resolver can show the same 3D style the customer ordered.
 */
import type { TabId } from '@/services/dressGlbResolver';

const defaultSelections: Record<TabId, string | null> = {
  neck: null,
  sleeves: null,
  bottom: null,
  'frock-style': null,
  colors: null,
};

function mergeSelections(partial: Partial<Record<TabId, string | null>>): Record<TabId, string | null> {
  return { ...defaultSelections, ...partial } as Record<TabId, string | null>;
}

/** Bundled GLBs only cover specific combos — presets use those combos per dress type. */
const PRESETS_BY_NAME: Record<string, { modelId: string; selections: Record<TabId, string | null> }> = {
  'Long Frock': {
    modelId: 'long-frock',
    selections: mergeSelections({
      neck: 'round',
      sleeves: 'bell',
      'frock-style': 'flared-bottom',
      colors: 'beige',
    }),
  },
  'Shalwar Kameez': {
    modelId: 'shalwar-kameez',
    selections: mergeSelections({
      neck: 'v-neck',
      sleeves: 'bell',
      bottom: 'straight',
      colors: 'beige',
    }),
  },
  /** Kurti silhouette → closest bundled short‑frock‑shalwar preview. */
  Kurti: {
    modelId: 'short-frock-shalwar',
    selections: mergeSelections({
      neck: 'round',
      sleeves: 'bell',
      bottom: 'straight',
      colors: 'beige',
    }),
  },
  /** Lehenga → sharara‑style bundled model. */
  Lehenga: {
    modelId: 'sharara',
    selections: mergeSelections({
      neck: 'round',
      sleeves: 'bell',
      bottom: 'flared',
      colors: 'beige',
    }),
  },
  'Party Maxi': {
    modelId: 'long-frock',
    selections: mergeSelections({
      neck: 'v-neck',
      sleeves: 'bell',
      'frock-style': 'flared-bottom',
      colors: 'beige',
    }),
  },
};

export function dressPreviewFromOrderDescription(orderDescription: string): {
  modelId: string;
  selections: Record<TabId, string | null>;
} | null {
  const trimmed = orderDescription.trim();
  const preset = PRESETS_BY_NAME[trimmed];
  return preset ? { modelId: preset.modelId, selections: preset.selections } : null;
}
