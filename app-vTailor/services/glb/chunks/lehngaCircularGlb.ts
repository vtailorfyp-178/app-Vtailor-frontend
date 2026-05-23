import type { DressSelections, TabId } from '../dressGlbTypes';

const LC_OPT = '3d model/3d lehnga/circular/optimized';

function lc(kebab: string): string {
  return `${LC_OPT}/optimized-${kebab}.glb`;
}

const GLB_WHITE_CIRCULAR_ROUND_BELL = lc('white-round-neck-bell-sleeves-circular');
const GLB_WHITE_CIRCULAR_ROUND_FULL = lc('white-round-neck-full-sleeves-circular');
const GLB_WHITE_CIRCULAR_V_BELL = lc('white-v-neck-bell-sleeves-circular');
const GLB_WHITE_CIRCULAR_V_FULL = lc('white-v-neck-full-sleeves-circular');
const GLB_RED_CIRCULAR_ROUND_BELL = lc('red-round-neck-bell-sleeves-circular');
const GLB_RED_CIRCULAR_ROUND_FULL = lc('red-round-neck-full-sleeves-circular');
const GLB_RED_CIRCULAR_V_BELL = lc('red-v-neck-bell-sleeves-circular');
const GLB_RED_CIRCULAR_V_FULL = lc('red-v-neck-full-sleeves-circular');
const GLB_BLUE_ROUND_FULL_UI = lc('blue-v-neck-full-sleeves-circular');
const GLB_BLACK_ROUND_FULL_UI = lc('black-v-neck-full-sleeves-circular');
const GLB_BLUE_V_FULL_UI = lc('blue-round-neck-full-sleeves-circular');
const GLB_BLACK_V_FULL_UI = lc('black-round-neck-full-sleeves-circular');
const GLB_BLUE_CIRCULAR_ROUND_BELL = lc('blue-round-neck-bell-sleeves-circular');
const GLB_BLUE_CIRCULAR_V_BELL = lc('blue-v-neck-bell-sleeves-circular');
const GLB_BLACK_CIRCULAR_ROUND_BELL = lc('black-round-neck-bell-sleeves-circular');
const GLB_BLACK_CIRCULAR_V_BELL = lc('black-v-neck-bell-sleeves-circular');

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

function circularSetForColor(col: string | null): GrarahComboSet | null {
  if (col === 'red')
    return {
      roundBell: GLB_RED_CIRCULAR_ROUND_BELL,
      roundFull: GLB_RED_CIRCULAR_ROUND_FULL,
      vBell: GLB_RED_CIRCULAR_V_BELL,
      vFull: GLB_RED_CIRCULAR_V_FULL,
    };
  if (col === 'black')
    return {
      roundBell: GLB_BLACK_CIRCULAR_ROUND_BELL,
      roundFull: GLB_BLACK_ROUND_FULL_UI,
      vBell: GLB_BLACK_CIRCULAR_V_BELL,
      vFull: GLB_BLACK_V_FULL_UI,
    };
  if (col === 'blue')
    return {
      roundBell: GLB_BLUE_CIRCULAR_ROUND_BELL,
      roundFull: GLB_BLUE_ROUND_FULL_UI,
      vBell: GLB_BLUE_CIRCULAR_V_BELL,
      vFull: GLB_BLUE_V_FULL_UI,
    };
  if (col === 'white' || col == null)
    return {
      roundBell: GLB_WHITE_CIRCULAR_ROUND_BELL,
      roundFull: GLB_WHITE_CIRCULAR_ROUND_FULL,
      vBell: GLB_WHITE_CIRCULAR_V_BELL,
      vFull: GLB_WHITE_CIRCULAR_V_FULL,
    };
  return null;
}

export function resolveBundledCircularLehngaGlb(s: DressSelections): string | null {
  const set = circularSetForColor(s.colors);
  if (!set) return null;
  return resolveGrarahCombo(s, set);
}
