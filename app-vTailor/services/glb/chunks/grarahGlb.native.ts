/** Native grarah — per color/neck/sleeves GLB variant (no runtime tint). */

import type { DressSelections, TabId } from '../dressGlbTypes';

const SHIRT_OPT = '3d model/3d grarah/shirt/optimized';
const PEPLUM_OPT = '3d model/3d grarah/peplum/optimized';

function shirtGlb(kebab: string): string {
  return `${SHIRT_OPT}/optimized-${kebab}-shirt.glb`;
}

function peplumGlb(kebab: string): string {
  return `${PEPLUM_OPT}/optimized-${kebab}-peplum.glb`;
}

const GLB_WHITE_SHIRT_ROUND_BELL = shirtGlb('white-round-neck-bell-sleeves');
const GLB_WHITE_SHIRT_ROUND_FULL = shirtGlb('white-round-neck-full-sleeves');
const GLB_WHITE_SHIRT_V_BELL = shirtGlb('white-v-neck-bell-sleeves');
const GLB_WHITE_SHIRT_V_FULL = shirtGlb('white-v-neck-full-sleeves');
const GLB_RED_SHIRT_ROUND_BELL = shirtGlb('red-round-neck-bell-sleeves');
const GLB_RED_SHIRT_ROUND_FULL = shirtGlb('red-round-neck-full-sleeves');
const GLB_RED_SHIRT_V_BELL = shirtGlb('red-v-neck-bell-sleeves');
const GLB_RED_SHIRT_V_FULL = shirtGlb('red-v-neck-full-sleeves');
const GLB_BLACK_SHIRT_ROUND_BELL = shirtGlb('black-round-neck-bell-sleeves');
const GLB_BLACK_SHIRT_ROUND_FULL = shirtGlb('black-round-neck-full-sleeves');
const GLB_BLACK_SHIRT_V_BELL = shirtGlb('black-v-neck-bell-sleeves');
const GLB_BLACK_SHIRT_V_FULL = shirtGlb('black-v-neck-full-sleeves');
const GLB_BLUE_SHIRT_ROUND_BELL = shirtGlb('blue-round-neck-bell-sleeves');
const GLB_BLUE_SHIRT_ROUND_FULL = shirtGlb('blue-round-neck-full-sleeves');
const GLB_BLUE_SHIRT_V_BELL = shirtGlb('blue-v-neck-bell-sleeves');
const GLB_BLUE_SHIRT_V_FULL = shirtGlb('blue-v-neck-full-sleeves');

const GLB_WHITE_PEPLUM_ROUND_BELL = peplumGlb('white-round-neck-bell-sleeves');
const GLB_WHITE_PEPLUM_ROUND_FULL = peplumGlb('white-round-neck-full-sleeves');
const GLB_WHITE_PEPLUM_V_BELL = peplumGlb('white-v-neck-bell-sleeves');
const GLB_WHITE_PEPLUM_V_FULL = peplumGlb('white-v-neck-full-sleeves');
const GLB_RED_PEPLUM_ROUND_BELL = peplumGlb('red-round-neck-bell-sleeves');
const GLB_RED_PEPLUM_ROUND_FULL = peplumGlb('red-round-neck-full-sleeves');
const GLB_RED_PEPLUM_V_BELL = peplumGlb('red-v-neck-bell-sleeves');
const GLB_RED_PEPLUM_V_FULL = peplumGlb('red-v-neck-full-sleeves');
const GLB_BLACK_PEPLUM_ROUND_BELL = peplumGlb('black-round-neck-bell-sleeves');
const GLB_BLACK_PEPLUM_ROUND_FULL = peplumGlb('black-round-neck-full-sleeves');
const GLB_BLACK_PEPLUM_V_BELL = peplumGlb('black-v-neck-bell-sleeves');
const GLB_BLACK_PEPLUM_V_FULL = peplumGlb('black-v-neck-full-sleeves');
const GLB_BLUE_PEPLUM_ROUND_BELL = peplumGlb('blue-round-neck-bell-sleeves');
const GLB_BLUE_PEPLUM_ROUND_FULL = peplumGlb('blue-round-neck-full-sleeves');
const GLB_BLUE_PEPLUM_V_BELL = peplumGlb('blue-v-neck-bell-sleeves');
const GLB_BLUE_PEPLUM_V_FULL = peplumGlb('blue-v-neck-full-sleeves');

type GrarahComboSet = {
  roundBell: string;
  roundFull: string;
  vBell: string;
  vFull: string;
};

function resolveGrarahCombo(s: Record<TabId, string | null>, set: GrarahComboSet): string | null {
  const { neck, sleeves } = s;
  if (neck === 'round' && sleeves === 'bell') return set.roundBell;
  if (neck === 'round' && sleeves === 'full') return set.roundFull;
  if (neck === 'v-neck' && sleeves === 'bell') return set.vBell;
  if (neck === 'v-neck' && sleeves === 'full') return set.vFull;
  if (neck === 'round') return sleeves === 'bell' ? set.roundBell : set.roundFull;
  if (neck === 'v-neck') return sleeves === 'bell' ? set.vBell : set.vFull;
  return null;
}

function resolveGrarahShirtByColor(s: Record<TabId, string | null>): string | null {
  if (s.colors === 'white' || s.colors == null)
    return resolveGrarahCombo(s, {
      roundBell: GLB_WHITE_SHIRT_ROUND_BELL,
      roundFull: GLB_WHITE_SHIRT_ROUND_FULL,
      vBell: GLB_WHITE_SHIRT_V_BELL,
      vFull: GLB_WHITE_SHIRT_V_FULL,
    });
  if (s.colors === 'red')
    return resolveGrarahCombo(s, {
      roundBell: GLB_RED_SHIRT_ROUND_BELL,
      roundFull: GLB_RED_SHIRT_ROUND_FULL,
      vBell: GLB_RED_SHIRT_V_BELL,
      vFull: GLB_RED_SHIRT_V_FULL,
    });
  if (s.colors === 'black')
    return resolveGrarahCombo(s, {
      roundBell: GLB_BLACK_SHIRT_ROUND_BELL,
      roundFull: GLB_BLACK_SHIRT_ROUND_FULL,
      vBell: GLB_BLACK_SHIRT_V_BELL,
      vFull: GLB_BLACK_SHIRT_V_FULL,
    });
  if (s.colors === 'blue')
    return resolveGrarahCombo(s, {
      roundBell: GLB_BLUE_SHIRT_ROUND_BELL,
      roundFull: GLB_BLUE_SHIRT_ROUND_FULL,
      vBell: GLB_BLUE_SHIRT_V_BELL,
      vFull: GLB_BLUE_SHIRT_V_FULL,
    });
  return null;
}

function resolveGrarahPeplumByColor(s: Record<TabId, string | null>): string | null {
  if (s.colors === 'white' || s.colors == null)
    return resolveGrarahCombo(s, {
      roundBell: GLB_WHITE_PEPLUM_ROUND_BELL,
      roundFull: GLB_WHITE_PEPLUM_ROUND_FULL,
      vBell: GLB_WHITE_PEPLUM_V_BELL,
      vFull: GLB_WHITE_PEPLUM_V_FULL,
    });
  if (s.colors === 'red')
    return resolveGrarahCombo(s, {
      roundBell: GLB_RED_PEPLUM_ROUND_BELL,
      roundFull: GLB_RED_PEPLUM_ROUND_FULL,
      vBell: GLB_RED_PEPLUM_V_BELL,
      vFull: GLB_RED_PEPLUM_V_FULL,
    });
  if (s.colors === 'black')
    return resolveGrarahCombo(s, {
      roundBell: GLB_BLACK_PEPLUM_ROUND_BELL,
      roundFull: GLB_BLACK_PEPLUM_ROUND_FULL,
      vBell: GLB_BLACK_PEPLUM_V_BELL,
      vFull: GLB_BLACK_PEPLUM_V_FULL,
    });
  if (s.colors === 'blue')
    return resolveGrarahCombo(s, {
      roundBell: GLB_BLUE_PEPLUM_ROUND_BELL,
      roundFull: GLB_BLUE_PEPLUM_ROUND_FULL,
      vBell: GLB_BLUE_PEPLUM_V_BELL,
      vFull: GLB_BLUE_PEPLUM_V_FULL,
    });
  return null;
}

export function resolveBundledGrarahShirtGlb(s: DressSelections): string | null {
  return resolveGrarahShirtByColor(s);
}

export function resolveBundledGrarahPeplumGlb(s: DressSelections): string | null {
  return resolveGrarahPeplumByColor(s);
}
