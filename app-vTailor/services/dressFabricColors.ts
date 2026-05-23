import type { TabId } from './dressGlbResolver';

export type FabricShade = {
  id: string;
  name: string;
  hex: string;
};

export type FabricColorFamily = {
  id: string;
  name: string;
  /** Swatch on the main-color row (matches family tone). */
  iconHex: string;
  shades: FabricShade[];
};

/** Main color → shades (exact hex applied on 3D fabric). */
export const CASUAL_FABRIC_COLOR_FAMILIES: FabricColorFamily[] = [
  {
    id: 'red',
    name: 'Red',
    iconHex: '#FF2222',
    shades: [
      { id: 'red-classic', name: 'Classic Red', hex: '#FF2222' },
      { id: 'red-crimson', name: 'Crimson', hex: '#7A0010' },
      { id: 'red-cherry', name: 'Cherry', hex: '#FF0050' },
      { id: 'red-rose', name: 'Rose', hex: '#FF9EB5' },
      { id: 'red-maroon', name: 'Maroon', hex: '#3D0018' },
      { id: 'red-brick', name: 'Brick', hex: '#C41E3A' },
    ],
  },
  {
    id: 'pink',
    name: 'Pink',
    iconHex: '#E91E8C',
    shades: [
      { id: 'pink-rani', name: 'Rani Pink', hex: '#E91E8C' },
      { id: 'pink-gulabi', name: 'Gulabi Pink', hex: '#F4A6C8' },
      { id: 'pink-rose', name: 'Rose Pink', hex: '#F43F5E' },
      { id: 'pink-magenta', name: 'Magenta Pink', hex: '#C71585' },
      { id: 'pink-onion', name: 'Onion Pink', hex: '#D889A8' },
    ],
  },
  {
    id: 'blue',
    name: 'Blue',
    iconHex: '#0057FF',
    shades: [
      { id: 'blue-royal', name: 'Royal Blue', hex: '#0057FF' },
      { id: 'blue-sky', name: 'Sky Blue', hex: '#87CEEB' },
      { id: 'blue-navy', name: 'Navy Blue', hex: '#000080' },
      { id: 'blue-ice', name: 'Ice Blue', hex: '#A5F3FC' },
      { id: 'blue-powder', name: 'Powder Blue', hex: '#B0E0E6' },
    ],
  },
  {
    id: 'green',
    name: 'Green',
    iconHex: '#00A86B',
    shades: [
      { id: 'green-mint', name: 'Mint Green', hex: '#98FF98' },
      { id: 'green-emerald', name: 'Emerald Green', hex: '#50C878' },
      { id: 'green-olive', name: 'Olive Green', hex: '#808000' },
      { id: 'green-sea', name: 'Sea Green', hex: '#2E8B57' },
      { id: 'green-forest', name: 'Forest Green', hex: '#228B22' },
    ],
  },
  {
    id: 'purple',
    name: 'Purple',
    iconHex: '#9B59B6',
    shades: [
      { id: 'purple-lavender', name: 'Lavender', hex: '#E6E6FA' },
      { id: 'purple-plum', name: 'Plum', hex: '#8E4585' },
      { id: 'purple-violet', name: 'Violet', hex: '#8F00FF' },
      { id: 'purple-mauve', name: 'Mauve', hex: '#E0B0FF' },
      { id: 'purple-grape', name: 'Grape Purple', hex: '#6F2DA8' },
    ],
  },
  {
    id: 'black',
    name: 'Black',
    iconHex: '#000000',
    shades: [
      { id: 'black-pure', name: 'Pure Black', hex: '#000000' },
      { id: 'black-jet', name: 'Jet Black', hex: '#0A0A0A' },
      { id: 'black-charcoal', name: 'Charcoal Black', hex: '#1C1C1C' },
    ],
  },
  {
    id: 'white',
    name: 'White',
    iconHex: '#FFFFFF',
    shades: [
      { id: 'white-pure', name: 'Pure White', hex: '#FFFFFF' },
      { id: 'white-ivory', name: 'Ivory White', hex: '#FFFFF0' },
      { id: 'white-cream', name: 'Cream White', hex: '#FFFDD0' },
      { id: 'white-off', name: 'Off White', hex: '#FAF9F6' },
    ],
  },
  {
    id: 'teal',
    name: 'Teal',
    iconHex: '#0D9488',
    shades: [
      { id: 'teal-classic', name: 'Classic Teal', hex: '#0D9488' },
      { id: 'teal-petrol', name: 'Petrol Teal', hex: '#006D77' },
      { id: 'teal-sea', name: 'Sea Teal', hex: '#14B8A6' },
      { id: 'teal-pastel', name: 'Pastel Teal', hex: '#5EEAD4' },
      { id: 'teal-deep', name: 'Deep Teal', hex: '#115E59' },
    ],
  },
  {
    id: 'orange',
    name: 'Orange',
    iconHex: '#FF6600',
    shades: [
      { id: 'orange-coral', name: 'Coral Orange', hex: '#FF7F50' },
      { id: 'orange-tangerine', name: 'Tangerine Orange', hex: '#FF6600' },
      { id: 'orange-peach', name: 'Peach Orange', hex: '#FFCBA4' },
    ],
  },
];

const ALL_SHADES: FabricShade[] = CASUAL_FABRIC_COLOR_FAMILIES.flatMap((f) => f.shades);

const HEX_BY_SHADE_ID = new Map(ALL_SHADES.map((s) => [s.id, s.hex]));
const NAME_BY_SHADE_ID = new Map(ALL_SHADES.map((s) => [s.id, s.name]));
const FAMILY_BY_SHADE_ID = new Map(
  CASUAL_FABRIC_COLOR_FAMILIES.flatMap((f) => f.shades.map((s) => [s.id, f.id] as const)),
);

/** @deprecated Use shade ids from CASUAL_FABRIC_COLOR_FAMILIES */
export const CASUAL_SHALWAR_FABRIC_COLORS = ALL_SHADES.map((s) => ({
  id: s.id,
  name: s.name,
  hex: s.hex,
}));

export function getFabricColorFamily(familyId: string): FabricColorFamily | undefined {
  return CASUAL_FABRIC_COLOR_FAMILIES.find((f) => f.id === familyId);
}

export function getFamilyIdForShade(shadeId: string | null | undefined): string | null {
  if (!shadeId) return null;
  return FAMILY_BY_SHADE_ID.get(shadeId) ?? null;
}

export function getShadesForFamily(familyId: string): FabricShade[] {
  return getFabricColorFamily(familyId)?.shades ?? [];
}

export function getDefaultShadeForFamily(familyId: string): FabricShade | null {
  const shades = getShadesForFamily(familyId);
  return shades[0] ?? null;
}

/** Main-color row swatch — same hex shown on 3D when customer picks a family first. */
export function fabricColorHexForFamily(familyId: string): string | null {
  const family = getFabricColorFamily(familyId);
  if (!family) return null;
  return family.iconHex;
}

export function isDarkFabricHex(hex: string): boolean {
  const h = hex.replace('#', '');
  if (h.length < 6) return false;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  if ([r, g, b].some((c) => Number.isNaN(c))) return false;
  return 0.299 * r + 0.587 * g + 0.114 * b < 72;
}

export function isValidFabricShadeId(shadeId: string): boolean {
  return HEX_BY_SHADE_ID.has(shadeId);
}

export function fabricColorHexFromId(colorId: string | null | undefined): string | null {
  if (!colorId) return null;
  return HEX_BY_SHADE_ID.get(colorId) ?? null;
}

export function fabricColorNameFromId(colorId: string | null | undefined): string | null {
  if (!colorId) return null;
  return NAME_BY_SHADE_ID.get(colorId) ?? null;
}

export function isCasualShortShirtShalwarFlow(
  modelId: string,
  selections: Partial<Record<TabId, string | null>>,
): boolean {
  const isShort =
    modelId === 'shalwar-kameez-short' || modelId === 'short-frock-shalwar';
  const bottom = selections.bottom;
  if (!isShort) return false;
  if (bottom == null) return true;
  return bottom === 'patiyala' || bottom === 'straight';
}

/** @deprecated */
export function isCasualPatiyalaShortShirtFlow(
  modelId: string,
  selections: Partial<Record<TabId, string | null>>,
): boolean {
  return isCasualShortShirtShalwarFlow(modelId, selections) && selections.bottom === 'patiyala';
}

export function usesCasualShortShirtFabricTint(
  modelId: string,
  selections: Partial<Record<TabId, string | null>>,
): boolean {
  return isCasualShortShirtShalwarFlow(modelId, selections);
}

/** Patiyala short shirt: white GLB until customer picks a fabric shade on Colors tab. */
export function usesPatiyalaRuntimeFabricTint(
  modelId: string,
  selections: Partial<Record<TabId, string | null>>,
): boolean {
  if (!isCasualShortShirtShalwarFlow(modelId, selections)) return false;
  const bottom = selections.bottom;
  return bottom === 'patiyala' || bottom == null;
}

/** @deprecated */
export function usesCasualPatiyalaFabricTint(
  modelId: string,
  selections: Partial<Record<TabId, string | null>>,
): boolean {
  return usesCasualShortShirtFabricTint(modelId, selections);
}
