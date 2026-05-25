/** Native long frock — paths match Cloudinary catalog (`optimized/*.glb`). */

import type { DressSelections, TabId } from '../dressGlbTypes';

const LF_OPT = '3d model/3d long frock/optimized';

function lf(kebab: string): string {
  return `${LF_OPT}/optimized-${kebab}.glb`;
}

const GLB_BLACK_LONG_FROCK_ROUND_BELL_FLARED = lf('black-round-neck-bell-sleeves-flarred');
const GLB_BLACK_LONG_FROCK_ROUND_BELL_SPLIT = lf('black-round-neck-bell-sleeves-split');
const GLB_BLACK_LONG_FROCK_ROUND_FULL_FLARED = lf('black-round-neck-full-sleeves-flarred');
const GLB_BLACK_LONG_FROCK_ROUND_FULL_SPLIT = lf('black-round-neck-full-sleeves-split');
const GLB_BLACK_LONG_FROCK_V_BELL_SPLIT = lf('black-v-neck-bell-sleeeves-split');
const GLB_BLACK_LONG_FROCK_V_BELL_FLARED = lf('black-v-neck-bell-sleeves-flarred');
const GLB_BLACK_LONG_FROCK_V_FULL_FLARED = lf('black-v-neck-full-sleeves-flarred');
const GLB_BLACK_LONG_FROCK_V_FULL_SPLIT = lf('black-v-neck-full-sleeves-split');

const GLB_BLUE_LONG_FROCK_ROUND_BELL_FLARED = lf('blue-round-neck-bell-sleeves-flarred');
const GLB_BLUE_LONG_FROCK_ROUND_BELL_SPLIT = lf('blue-round-neck-bell-sleeves');
const GLB_BLUE_LONG_FROCK_ROUND_FULL_FLARED = lf('blue-round-neck-full-sleeves-flarred');
const GLB_BLUE_LONG_FROCK_ROUND_FULL_SPLIT = lf('blue-round-neck-full-sleeves-split');
const GLB_BLUE_LONG_FROCK_V_BELL_SPLIT = lf('blue-v-neck-bell-sleeves-split');
const GLB_BLUE_LONG_FROCK_V_BELL_FLARED = lf('blue-v-neck-bell-sleeves-flarred-');
const GLB_BLUE_LONG_FROCK_V_FULL_FLARED = lf('blue-v-neck-full-sleeves-flarred');
const GLB_BLUE_LONG_FROCK_V_FULL_SPLIT = lf('blue-v-neck-full-sleeves-split');

const GLB_RED_LONG_FROCK_ROUND_BELL_FLARED = lf('red-round-neck-bell-sleeves-flarred');
const GLB_RED_LONG_FROCK_ROUND_BELL_SPLIT = lf('red-round-neck-bell-sleeves-split');
const GLB_RED_LONG_FROCK_ROUND_FULL_FLARED = lf('red-round-neck-full-sleeves-flarred');
const GLB_RED_LONG_FROCK_ROUND_FULL_SPLIT = lf('red-round-neck-full-sleeves-split');
const GLB_RED_LONG_FROCK_V_BELL_SPLIT = lf('red-v-neck-bell-sleeves-split');
const GLB_RED_LONG_FROCK_V_BELL_FLARED = lf('red-v-neck-bell-sleeves-flarred');
const GLB_RED_LONG_FROCK_V_FULL_FLARED = lf('red-v-neck-full-sleeves-flarred');
const GLB_RED_LONG_FROCK_V_FULL_SPLIT = lf('red-v-neck-full-sleeves-split');

const GLB_WHITE_LONG_FROCK_ROUND_BELL_FLARED = lf('white-round-neck-bell-sleeves-flarred');
const GLB_WHITE_LONG_FROCK_ROUND_BELL_SPLIT = lf('white-round-neck-bell-sleeves-split');
const GLB_WHITE_LONG_FROCK_ROUND_FULL_FLARED = lf('white-round-neck-full-sleeves-flarred');
const GLB_WHITE_LONG_FROCK_ROUND_FULL_SPLIT = lf('white-round-neck-full-sleeves-split');
const GLB_WHITE_LONG_FROCK_V_BELL_SPLIT = lf('white-v-neck-bell-sleeves-split');
const GLB_WHITE_LONG_FROCK_V_BELL_FLARED = lf('white-v-neck-bell-sleeves-flarred');
const GLB_WHITE_LONG_FROCK_V_FULL_FLARED = lf('white-v-neck-full-sleeves-flarred--');
const GLB_WHITE_LONG_FROCK_V_FULL_SPLIT = lf('white-v-neck-full-sleeves-split');

type LongFrockFlaredSet = {
  roundBell: string;
  roundFull: string;
  vBell: string;
  vFull: string;
};

type LongFrockSplitSet = {
  roundBell: string;
  roundFull: string;
  vBell: string;
  vFull: string;
};

function resolveLongFrockFlared(s: Record<TabId, string | null>, set: LongFrockFlaredSet): string | null {
  const { neck, sleeves } = s;
  if (neck === 'round' && sleeves === 'bell') return set.roundBell;
  if (neck === 'round' && sleeves === 'full') return set.roundFull;
  if (neck === 'v-neck' && sleeves === 'bell') return set.vBell;
  if (neck === 'v-neck' && sleeves === 'full') return set.vFull;
  if (neck === 'round') return sleeves === 'bell' ? set.roundBell : set.roundFull;
  if (neck === 'v-neck') return sleeves === 'bell' ? set.vBell : set.vFull;
  return null;
}

function resolveLongFrockSplit(s: Record<TabId, string | null>, set: LongFrockSplitSet): string | null {
  const { neck, sleeves } = s;
  if (neck === 'round' && sleeves === 'bell') return set.roundBell;
  if (neck === 'round' && sleeves === 'full') return set.roundFull;
  if (neck === 'v-neck' && sleeves === 'bell') return set.vBell;
  if (neck === 'v-neck' && sleeves === 'full') return set.vFull;
  if (neck === 'round') return set.roundFull;
  if (neck === 'v-neck') return set.vFull;
  return null;
}

function resolveLongFrockByColor(s: Record<TabId, string | null>): string | null {
  const fs = s['frock-style'];
  if (fs === 'front-slit') {
    if (s.colors === 'black')
      return resolveLongFrockSplit(s, {
        roundBell: GLB_BLACK_LONG_FROCK_ROUND_BELL_SPLIT,
        roundFull: GLB_BLACK_LONG_FROCK_ROUND_FULL_SPLIT,
        vBell: GLB_BLACK_LONG_FROCK_V_BELL_SPLIT,
        vFull: GLB_BLACK_LONG_FROCK_V_FULL_SPLIT,
      });
    if (s.colors === 'blue')
      return resolveLongFrockSplit(s, {
        roundBell: GLB_BLUE_LONG_FROCK_ROUND_BELL_SPLIT,
        roundFull: GLB_BLUE_LONG_FROCK_ROUND_FULL_SPLIT,
        vBell: GLB_BLUE_LONG_FROCK_V_BELL_SPLIT,
        vFull: GLB_BLUE_LONG_FROCK_V_FULL_SPLIT,
      });
    if (s.colors === 'red')
      return resolveLongFrockSplit(s, {
        /** Cloudinary filenames: full ↔ bell split assets are swapped for red open slit. */
        roundBell: GLB_RED_LONG_FROCK_ROUND_FULL_SPLIT,
        roundFull: GLB_RED_LONG_FROCK_ROUND_BELL_SPLIT,
        vBell: GLB_RED_LONG_FROCK_V_BELL_SPLIT,
        vFull: GLB_RED_LONG_FROCK_V_FULL_SPLIT,
      });
    if (s.colors === 'white' || s.colors == null)
      return resolveLongFrockSplit(s, {
        roundBell: GLB_WHITE_LONG_FROCK_ROUND_BELL_SPLIT,
        roundFull: GLB_WHITE_LONG_FROCK_ROUND_FULL_SPLIT,
        vBell: GLB_WHITE_LONG_FROCK_V_BELL_SPLIT,
        vFull: GLB_WHITE_LONG_FROCK_V_FULL_SPLIT,
      });
    return null;
  }

  if (fs === 'flared-bottom' || fs == null) {
    if (s.colors === 'black')
      return resolveLongFrockFlared(s, {
        roundBell: GLB_BLACK_LONG_FROCK_ROUND_BELL_FLARED,
        roundFull: GLB_BLACK_LONG_FROCK_ROUND_FULL_FLARED,
        vBell: GLB_BLACK_LONG_FROCK_V_BELL_FLARED,
        vFull: GLB_BLACK_LONG_FROCK_V_FULL_FLARED,
      });
    if (s.colors === 'blue')
      return resolveLongFrockFlared(s, {
        roundBell: GLB_BLUE_LONG_FROCK_ROUND_BELL_FLARED,
        roundFull: GLB_BLUE_LONG_FROCK_ROUND_FULL_FLARED,
        vBell: GLB_BLUE_LONG_FROCK_V_BELL_FLARED,
        vFull: GLB_BLUE_LONG_FROCK_V_FULL_FLARED,
      });
    if (s.colors === 'red')
      return resolveLongFrockFlared(s, {
        roundBell: GLB_RED_LONG_FROCK_ROUND_BELL_FLARED,
        roundFull: GLB_RED_LONG_FROCK_ROUND_FULL_FLARED,
        vBell: GLB_RED_LONG_FROCK_V_BELL_FLARED,
        vFull: GLB_RED_LONG_FROCK_V_FULL_FLARED,
      });
    if (s.colors === 'white' || s.colors == null)
      return resolveLongFrockFlared(s, {
        roundBell: GLB_WHITE_LONG_FROCK_ROUND_BELL_FLARED,
        roundFull: GLB_WHITE_LONG_FROCK_ROUND_FULL_FLARED,
        vBell: GLB_WHITE_LONG_FROCK_V_BELL_FLARED,
        vFull: GLB_WHITE_LONG_FROCK_V_FULL_FLARED,
      });
  }

  return null;
}

export function resolveBundledLongFrockGlb(s: DressSelections): string | null {
  return resolveLongFrockByColor(s);
}
