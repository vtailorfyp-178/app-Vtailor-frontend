import type { DressSelections, TabId } from '../dressGlbTypes';

/** Party/Formal → Long Frock, black — assets in `3d model/3d long frock/`. */
const GLB_BLACK_LONG_FROCK_ROUND_BELL_FLARED = '3d model/3d long frock/black round neck bell sleeves flarred.glb';
const GLB_BLACK_LONG_FROCK_ROUND_BELL_SPLIT = '3d model/3d long frock/black round neck bell sleeves split.glb';
const GLB_BLACK_LONG_FROCK_ROUND_FULL_FLARED = '3d model/3d long frock/black round neck full sleeves flarred.glb';
const GLB_BLACK_LONG_FROCK_ROUND_FULL_SPLIT = '3d model/3d long frock/black round neck full sleeves split.glb';
const GLB_BLACK_LONG_FROCK_V_BELL_SPLIT = '3d model/3d long frock/black v neck bell sleeeves split.glb';
const GLB_BLACK_LONG_FROCK_V_BELL_FLARED = '3d model/3d long frock/black v neck bell sleeves flarred.glb';
const GLB_BLACK_LONG_FROCK_V_FULL_FLARED = '3d model/3d long frock/black v neck full sleeves flarred.glb';
const GLB_BLACK_LONG_FROCK_V_FULL_SPLIT = '3d model/3d long frock/black v neck full sleeves split.glb';

/** Party/Formal → Long Frock, blue — filenames match files on disk (`3d model/3d long frock/`). */
const GLB_BLUE_LONG_FROCK_ROUND_BELL_FLARED = '3d model/3d long frock/blue round neck bell sleeves flarred.glb';
/** On disk the split variant is named without "split" suffix. */
const GLB_BLUE_LONG_FROCK_ROUND_BELL_SPLIT = '3d model/3d long frock/blue round neck bell sleeves.glb';
const GLB_BLUE_LONG_FROCK_ROUND_FULL_FLARED = '3d model/3d long frock/blue round neck full sleeves flarred.glb';
const GLB_BLUE_LONG_FROCK_ROUND_FULL_SPLIT = '3d model/3d long frock/blue round neck full sleeves split.glb';
const GLB_BLUE_LONG_FROCK_V_BELL_SPLIT = '3d model/3d long frock/blue v neck bell sleeves split.glb';
/** Trailing space before extension in the bundled asset filename. */
const GLB_BLUE_LONG_FROCK_V_BELL_FLARED = '3d model/3d long frock/blue v neck bell sleeves flarred .glb';
const GLB_BLUE_LONG_FROCK_V_FULL_FLARED = '3d model/3d long frock/blue v neck full sleeves flarred.glb';
const GLB_BLUE_LONG_FROCK_V_FULL_SPLIT = '3d model/3d long frock/blue v neck full sleeves split.glb';

/** Party/Formal → Long Frock, red — `3d model/3d long frock/`. */
const GLB_RED_LONG_FROCK_ROUND_BELL_FLARED = '3d model/3d long frock/red round neck bell sleeves flarred.glb';
const GLB_RED_LONG_FROCK_ROUND_BELL_SPLIT = '3d model/3d long frock/red round neck bell sleeves split.glb';
const GLB_RED_LONG_FROCK_ROUND_FULL_FLARED = '3d model/3d long frock/red round neck full sleeves flarred.glb';
const GLB_RED_LONG_FROCK_ROUND_FULL_SPLIT = '3d model/3d long frock/red round neck full sleeves split.glb';
const GLB_RED_LONG_FROCK_V_BELL_SPLIT = '3d model/3d long frock/red v neck bell sleeves split.glb';
const GLB_RED_LONG_FROCK_V_BELL_FLARED = '3d model/3d long frock/red v neck bell sleeves flarred.glb';
const GLB_RED_LONG_FROCK_V_FULL_FLARED = '3d model/3d long frock/red v neck full sleeves flarred.glb';
const GLB_RED_LONG_FROCK_V_FULL_SPLIT = '3d model/3d long frock/red v neck full sleeves split.glb';

/** Party/Formal → Long Frock, white — `3d model/3d long frock/`. */
const GLB_WHITE_LONG_FROCK_ROUND_BELL_FLARED = '3d model/3d long frock/white round neck bell sleeves flarred.glb';
const GLB_WHITE_LONG_FROCK_ROUND_BELL_SPLIT = '3d model/3d long frock/white round neck bell sleeves split.glb';
const GLB_WHITE_LONG_FROCK_ROUND_FULL_FLARED = '3d model/3d long frock/white round neck full sleeves flarred.glb';
const GLB_WHITE_LONG_FROCK_ROUND_FULL_SPLIT = '3d model/3d long frock/white round neck full sleeves split.glb';
const GLB_WHITE_LONG_FROCK_V_BELL_SPLIT = '3d model/3d long frock/white v neck bell sleeves split.glb';
const GLB_WHITE_LONG_FROCK_V_BELL_FLARED = '3d model/3d long frock/white v neck bell sleeves flarred.glb';
/** Filename on disk has two spaces before `.glb`. */
const GLB_WHITE_LONG_FROCK_V_FULL_FLARED = '3d model/3d long frock/white v neck full sleeves flarred  .glb';
const GLB_WHITE_LONG_FROCK_V_FULL_SPLIT = '3d model/3d long frock/white v neck full sleeves split.glb';



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
        roundBell: GLB_RED_LONG_FROCK_ROUND_BELL_SPLIT,
        roundFull: GLB_RED_LONG_FROCK_ROUND_FULL_SPLIT,
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
