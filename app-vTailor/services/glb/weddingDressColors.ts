/** Wedding / saree / grarah tab colors (red, blue, white, black). */

export const WEDDING_DRESS_COLOR_HEX: Record<string, string> = {
  red: '#B91C1C',
  blue: '#1E40AF',
  white: '#F5F0E8',
  black: '#1C1917',
};

export function weddingDressColorHex(colorId: string | null | undefined): string | null {
  if (!colorId) return null;
  return WEDDING_DRESS_COLOR_HEX[colorId] ?? null;
}
