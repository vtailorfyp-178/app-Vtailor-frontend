import type { DressSelections, TabId } from '../dressGlbTypes';

const GLB_WHITE_PEPLUM_ROUND_BELL = '3d model/3d grarah/peplum/white round neck bell sleeves peplum.glb';
const GLB_WHITE_PEPLUM_ROUND_FULL = '3d model/3d grarah/peplum/white round neck full sleeves peplum.glb';
const GLB_WHITE_PEPLUM_V_BELL = '3d model/3d grarah/peplum/white v neck bell sleeves peplum.glb';
const GLB_WHITE_PEPLUM_V_FULL = '3d model/3d grarah/peplum/white v neck full sleeves peplum.glb';
const GLB_RED_PEPLUM_ROUND_BELL = '3d model/3d grarah/peplum/red round neck bell sleeves peplum.glb';
const GLB_RED_PEPLUM_ROUND_FULL = '3d model/3d grarah/peplum/red round neck full sleeves peplum.glb';
const GLB_RED_PEPLUM_V_BELL = '3d model/3d grarah/peplum/red v neck bell sleeves peplum.glb';
const GLB_RED_PEPLUM_V_FULL = '3d model/3d grarah/peplum/red v neck full sleeves peplum.glb';
const GLB_BLACK_PEPLUM_ROUND_BELL = '3d model/3d grarah/peplum/black round neck bell sleeves peplum.glb';
const GLB_BLACK_PEPLUM_ROUND_FULL = '3d model/3d grarah/peplum/black round neck full sleeves peplum.glb';
const GLB_BLACK_PEPLUM_V_BELL = '3d model/3d grarah/peplum/black v neck bell sleeves peplum.glb';
const GLB_BLACK_PEPLUM_V_FULL = '3d model/3d grarah/peplum/black v neck full sleeves peplum.glb';
const GLB_BLUE_PEPLUM_ROUND_BELL = '3d model/3d grarah/peplum/blue round neck bell sleeves peplum.glb';
const GLB_BLUE_PEPLUM_ROUND_FULL = '3d model/3d grarah/peplum/blue round neck full sleeves peplum.glb';
const GLB_BLUE_PEPLUM_V_BELL = '3d model/3d grarah/peplum/blue v neck bell sleeves peplum.glb';
const GLB_BLUE_PEPLUM_V_FULL = '3d model/3d grarah/peplum/blue v neck full sleeves peplum.glb';

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

function resolveGrarahByColor(s: Record<TabId, string | null>, sets: Record<string, GrarahComboSet>): string | null {
  const col = s.colors;
  if (col === 'red') return resolveGrarahCombo(s, sets.red);
  if (col === 'black') return resolveGrarahCombo(s, sets.black);
  if (col === 'blue') return resolveGrarahCombo(s, sets.blue);
  if (col === 'white' || col == null) return resolveGrarahCombo(s, sets.white);
  return null;
}

const GRARAH_PEPLUM_SETS: Record<string, GrarahComboSet> = {
  white: {
    roundBell: GLB_WHITE_PEPLUM_ROUND_BELL,
    roundFull: GLB_WHITE_PEPLUM_ROUND_FULL,
    vBell: GLB_WHITE_PEPLUM_V_BELL,
    vFull: GLB_WHITE_PEPLUM_V_FULL,
  },
  red: {
    roundBell: GLB_RED_PEPLUM_ROUND_BELL,
    roundFull: GLB_RED_PEPLUM_ROUND_FULL,
    vBell: GLB_RED_PEPLUM_V_BELL,
    vFull: GLB_RED_PEPLUM_V_FULL,
  },
  black: {
    roundBell: GLB_BLACK_PEPLUM_ROUND_BELL,
    roundFull: GLB_BLACK_PEPLUM_ROUND_FULL,
    vBell: GLB_BLACK_PEPLUM_V_BELL,
    vFull: GLB_BLACK_PEPLUM_V_FULL,
  },
  blue: {
    roundBell: GLB_BLUE_PEPLUM_ROUND_BELL,
    roundFull: GLB_BLUE_PEPLUM_ROUND_FULL,
    vBell: GLB_BLUE_PEPLUM_V_BELL,
    vFull: GLB_BLUE_PEPLUM_V_FULL,
  },
};

export function resolveBundledGrarahPeplumGlb(s: DressSelections): string | null {
  return resolveGrarahByColor(s, GRARAH_PEPLUM_SETS);
}
