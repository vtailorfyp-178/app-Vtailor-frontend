/**
 * Maps dress customization selections + model id to a bundled GLB asset module id.
 * Shared by customize3d and the post-customization 3D review screen.
 */

import type { TabId } from './dressGlbTypes';

export type { TabId } from './dressGlbTypes';

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

/** Party/Formal → Saree plain — folder `3d model/3d sari/plain saree/`. Typo `whiite` matches asset on disk. */
const GLB_PLAIN_ROUND_FULL_WHIIITE = '3d model/3d sari/plain saree/whiite round neck full sleeves.glb';
const GLB_PLAIN_ROUND_SHORT_WHITE = '3d model/3d sari/plain saree/white round neck short sleeves.glb';
const GLB_PLAIN_V_FULL_WHITE = '3d model/3d sari/plain saree/white v neck full sleeves.glb';
const GLB_PLAIN_V_SHORT_WHITE = '3d model/3d sari/plain saree/white v neck short sleeves.glb';
const GLB_PLAIN_ROUND_FULL_BLACK = '3d model/3d sari/plain saree/black round neck full sleeves.glb';
const GLB_PLAIN_ROUND_SHORT_BLACK = '3d model/3d sari/plain saree/black round neck short sleeves.glb';
const GLB_PLAIN_V_FULL_BLACK = '3d model/3d sari/plain saree/black v neck full sleeves.glb';
const GLB_PLAIN_V_SHORT_BLACK = '3d model/3d sari/plain saree/black v neck short sleeves.glb';
const GLB_PLAIN_ROUND_FULL_BLUE = '3d model/3d sari/plain saree/blue round neck full sleeves.glb';
const GLB_PLAIN_ROUND_SHORT_BLUE = '3d model/3d sari/plain saree/blue round neck short sleeves.glb';
const GLB_PLAIN_V_FULL_BLUE = '3d model/3d sari/plain saree/blue v neck full sleeves.glb';
/** On disk the filename ends with `.glb.glb`. */
const GLB_PLAIN_V_SHORT_BLUE = '3d model/3d sari/plain saree/blue v neck short sleeves.glb.glb';
const GLB_PLAIN_ROUND_FULL_RED = '3d model/3d sari/plain saree/red round neck full sleeves.glb';
const GLB_PLAIN_ROUND_SHORT_RED = '3d model/3d sari/plain saree/red round neck short sleeves.glb';
const GLB_PLAIN_V_FULL_RED = '3d model/3d sari/plain saree/red v neck full sleeves.glb';
const GLB_PLAIN_V_SHORT_RED = '3d model/3d sari/plain saree/red v neck short sleeves.glb';

/** Party/Formal → Saree frill — `3d model/3d sari/frill saree/`. One red full file uses `flired` on disk. */
const GLB_FRILL_ROUND_FULL_WHITE = '3d model/3d sari/frill saree/white round neck full sleeves flirred.glb';
const GLB_FRILL_ROUND_SHORT_WHITE = '3d model/3d sari/frill saree/white round neck short sleeves flirred.glb';
const GLB_FRILL_V_FULL_WHITE = '3d model/3d sari/frill saree/white v neck full sleeves flirred.glb';
const GLB_FRILL_V_SHORT_WHITE = '3d model/3d sari/frill saree/white v neck short sleeves flirred.glb';
const GLB_FRILL_ROUND_FULL_BLACK = '3d model/3d sari/frill saree/black round neck full sleeves flirred.glb';
const GLB_FRILL_ROUND_SHORT_BLACK = '3d model/3d sari/frill saree/black round neck short sleeves flirred.glb';
const GLB_FRILL_V_FULL_BLACK = '3d model/3d sari/frill saree/black v neck full sleeves flirred.glb';
const GLB_FRILL_V_SHORT_BLACK = '3d model/3d sari/frill saree/black v neck short sleeves flirred.glb';
const GLB_FRILL_ROUND_FULL_BLUE = '3d model/3d sari/frill saree/blue round neck full sleeves flirred.glb';
const GLB_FRILL_ROUND_SHORT_BLUE = '3d model/3d sari/frill saree/blue round neck short sleeves flirred.glb';
const GLB_FRILL_V_FULL_BLUE = '3d model/3d sari/frill saree/blue v neck full sleeves flirred.glb';
const GLB_FRILL_V_SHORT_BLUE = '3d model/3d sari/frill saree/blue v neck short sleeves flirred.glb';
const GLB_FRILL_ROUND_FULL_RED = '3d model/3d sari/frill saree/red round neck full sleeves flired.glb';
const GLB_FRILL_ROUND_SHORT_RED = '3d model/3d sari/frill saree/red round neck short sleeves flirred.glb';
const GLB_FRILL_V_FULL_RED = '3d model/3d sari/frill saree/red v neck full sleeves flirred.glb';
const GLB_FRILL_V_SHORT_RED = '3d model/3d sari/frill saree/red v neck short sleeves flirred.glb';

/** Wedding → Grarah short shirt — `3d model/3d grarah/shirt/`. */
const GLB_WHITE_SHIRT_ROUND_BELL = '3d model/3d grarah/shirt/white round neck bell sleeves shirt.glb';
const GLB_WHITE_SHIRT_ROUND_FULL = '3d model/3d grarah/shirt/white round neck full sleeves shirt.glb';
const GLB_WHITE_SHIRT_V_BELL = '3d model/3d grarah/shirt/white v neck bell sleeves shirt.glb';
const GLB_WHITE_SHIRT_V_FULL = '3d model/3d grarah/shirt/white v neck full sleeves shirt.glb';
const GLB_RED_SHIRT_ROUND_BELL = '3d model/3d grarah/shirt/red round neck bell sleeves shirt.glb';
const GLB_RED_SHIRT_ROUND_FULL = '3d model/3d grarah/shirt/red round neck full sleeves shirt.glb';
const GLB_RED_SHIRT_V_BELL = '3d model/3d grarah/shirt/red v neck bell sleeves shirt.glb.glb';
const GLB_RED_SHIRT_V_FULL = '3d model/3d grarah/shirt/red v neck full sleeves shirt.glb';
const GLB_BLACK_SHIRT_ROUND_BELL = '3d model/3d grarah/shirt/black round neck bell sleeves shirt.glb';
const GLB_BLACK_SHIRT_ROUND_FULL = '3d model/3d grarah/shirt/black round neck full sleeves shirt.glb';
const GLB_BLACK_SHIRT_V_BELL = '3d model/3d grarah/shirt/black v neck bell sleeves shirt.glb';
const GLB_BLACK_SHIRT_V_FULL = '3d model/3d grarah/shirt/black v neck full sleeves shirt.glb';
const GLB_BLUE_SHIRT_ROUND_BELL = '3d model/3d grarah/shirt/blue round neck bell sleeves shirt.glb';
const GLB_BLUE_SHIRT_ROUND_FULL = '3d model/3d grarah/shirt/blue round neck full sleeves shirt.glb';
const GLB_BLUE_SHIRT_V_BELL = '3d model/3d grarah/shirt/blue v neck bell sleeves shirt.glb';
const GLB_BLUE_SHIRT_V_FULL = '3d model/3d grarah/shirt/blue v neck full sleeves shirt.glb';

/** Wedding → Grarah peplum — `3d model/3d grarah/peplum/`. */
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

const GRARAH_SHIRT_SETS: Record<string, GrarahComboSet> = {
  white: {
    roundBell: GLB_WHITE_SHIRT_ROUND_BELL,
    roundFull: GLB_WHITE_SHIRT_ROUND_FULL,
    vBell: GLB_WHITE_SHIRT_V_BELL,
    vFull: GLB_WHITE_SHIRT_V_FULL,
  },
  red: {
    roundBell: GLB_RED_SHIRT_ROUND_BELL,
    roundFull: GLB_RED_SHIRT_ROUND_FULL,
    vBell: GLB_RED_SHIRT_V_BELL,
    vFull: GLB_RED_SHIRT_V_FULL,
  },
  black: {
    roundBell: GLB_BLACK_SHIRT_ROUND_BELL,
    roundFull: GLB_BLACK_SHIRT_ROUND_FULL,
    vBell: GLB_BLACK_SHIRT_V_BELL,
    vFull: GLB_BLACK_SHIRT_V_FULL,
  },
  blue: {
    roundBell: GLB_BLUE_SHIRT_ROUND_BELL,
    roundFull: GLB_BLUE_SHIRT_ROUND_FULL,
    vBell: GLB_BLUE_SHIRT_V_BELL,
    vFull: GLB_BLUE_SHIRT_V_FULL,
  },
};

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

function resolveGrarahShortShirtGlb(s: Record<TabId, string | null>): string | null {
  return resolveGrarahByColor(s, GRARAH_SHIRT_SETS);
}

function resolveGrarahPeplumGlb(s: Record<TabId, string | null>): string | null {
  return resolveGrarahByColor(s, GRARAH_PEPLUM_SETS);
}

/** Wedding → Bridal lehnga — `3d model/3d lehnga/Bridal lehnga/` (filenames include spaces before `.glb`). */
const GLB_PEACH_BRIDAL_ROUND_FULL = '3d model/3d lehnga/Bridal lehnga/peach round neck full sleeves .glb';
const GLB_PEACH_BRIDAL_ROUND_SHORT = '3d model/3d lehnga/Bridal lehnga/peach round neck short sleeves .glb';
const GLB_PEACH_BRIDAL_SWEET_FULL = '3d model/3d lehnga/Bridal lehnga/peach sweet heart neck full sleeves .glb';
const GLB_PEACH_BRIDAL_SWEET_SHORT = '3d model/3d lehnga/Bridal lehnga/peach sweet heart neck short sleeves .glb';
const GLB_RED_BRIDAL_ROUND_FULL = '3d model/3d lehnga/Bridal lehnga/red round neck full sleeves .glb';
const GLB_RED_BRIDAL_ROUND_SHORT = '3d model/3d lehnga/Bridal lehnga/red round neck short sleeves .glb';
const GLB_RED_BRIDAL_SWEET_FULL = '3d model/3d lehnga/Bridal lehnga/red sweet heart neck full sleeves .glb';
const GLB_RED_BRIDAL_SWEET_SHORT = '3d model/3d lehnga/Bridal lehnga/red sweet heart neck short sleeves .glb';
const GLB_ICEBLUE_BRIDAL_ROUND_FULL = '3d model/3d lehnga/Bridal lehnga/ice blue round neck full sleeves .glb';
const GLB_ICEBLUE_BRIDAL_ROUND_SHORT = '3d model/3d lehnga/Bridal lehnga/ice blue round neck short sleeves .glb';
const GLB_ICEBLUE_BRIDAL_SWEET_FULL = '3d model/3d lehnga/Bridal lehnga/ice blue sweet heart neck full sleeves .glb';
const GLB_ICEBLUE_BRIDAL_SWEET_SHORT = '3d model/3d lehnga/Bridal lehnga/ice blue sweet heart neck short sleeves .glb';
const GLB_MAROON_BRIDAL_ROUND_FULL = '3d model/3d lehnga/Bridal lehnga/mahroon round neck full sleeves .glb';
const GLB_MAROON_BRIDAL_SWEET_FULL = '3d model/3d lehnga/Bridal lehnga/mahroon sweatheart full  sleeves.glb';
const GLB_MAROON_BRIDAL_SWEET_SHORT = '3d model/3d lehnga/Bridal lehnga/mahroon sweatheart short sleeves.glb';

/** Wedding → Circular lehnga — `3d model/3d lehnga/circular/`. */
const GLB_WHITE_CIRCULAR_ROUND_BELL = '3d model/3d lehnga/circular/white round neck bell sleeves circular.glb';
const GLB_WHITE_CIRCULAR_ROUND_FULL = '3d model/3d lehnga/circular/white round neck full sleeves circular.glb';
const GLB_WHITE_CIRCULAR_V_BELL = '3d model/3d lehnga/circular/white v neck bell sleeves circular.glb';
const GLB_WHITE_CIRCULAR_V_FULL = '3d model/3d lehnga/circular/white v neck full sleeves circular.glb';
const GLB_RED_CIRCULAR_ROUND_BELL = '3d model/3d lehnga/circular/red round neck bell sleeves circular.glb';
const GLB_RED_CIRCULAR_ROUND_FULL = '3d model/3d lehnga/circular/red round neck full sleeves circular.glb';
const GLB_RED_CIRCULAR_V_BELL = '3d model/3d lehnga/circular/red v neck bell sleeves circular.glb';
const GLB_RED_CIRCULAR_V_FULL = '3d model/3d lehnga/circular/red v neck full sleeves circular.glb';
const GLB_BLACK_CIRCULAR_ROUND_BELL = '3d model/3d lehnga/circular/black round neck bell sleeves circular.glb';
const GLB_BLACK_CIRCULAR_ROUND_FULL = '3d model/3d lehnga/circular/black round neck full sleeves circular.glb';
const GLB_BLACK_CIRCULAR_V_BELL = '3d model/3d lehnga/circular/black v neck bell sleeves circular.glb';
const GLB_BLACK_CIRCULAR_V_FULL = '3d model/3d lehnga/circular/black v neck full sleeves circular.glb';
const GLB_BLUE_CIRCULAR_ROUND_BELL = '3d model/3d lehnga/circular/blue round neck bell sleeves circular.glb';
const GLB_BLUE_CIRCULAR_ROUND_FULL = '3d model/3d lehnga/circular/blue round neck full sleeves circular.glb';
const GLB_BLUE_CIRCULAR_V_BELL = '3d model/3d lehnga/circular/blue v neck bell sleeves circular.glb';
const GLB_BLUE_CIRCULAR_V_FULL = '3d model/3d lehnga/circular/blue v neck full sleeves circular.glb';

type BridalComboSet = {
  roundFull: string;
  roundShort: string;
  sweetheartFull: string;
  sweetheartShort: string;
};

function resolveBridalCombo(s: Record<TabId, string | null>, set: BridalComboSet): string | null {
  const { neck, sleeves } = s;
  if (neck === 'round' && sleeves === 'full') return set.roundFull;
  if (neck === 'round' && sleeves === 'short') return set.roundShort;
  if (neck === 'sweetheart' && sleeves === 'full') return set.sweetheartFull;
  if (neck === 'sweetheart' && sleeves === 'short') return set.sweetheartShort;
  if (neck === 'round') return sleeves === 'short' ? set.roundShort : set.roundFull;
  if (neck === 'sweetheart') return sleeves === 'short' ? set.sweetheartShort : set.sweetheartFull;
  return null;
}

const BRIDAL_LEHNGA_SETS: Record<string, BridalComboSet> = {
  peach: {
    roundFull: GLB_PEACH_BRIDAL_ROUND_FULL,
    roundShort: GLB_PEACH_BRIDAL_ROUND_SHORT,
    sweetheartFull: GLB_PEACH_BRIDAL_SWEET_FULL,
    sweetheartShort: GLB_PEACH_BRIDAL_SWEET_SHORT,
  },
  red: {
    roundFull: GLB_RED_BRIDAL_ROUND_FULL,
    roundShort: GLB_RED_BRIDAL_ROUND_SHORT,
    sweetheartFull: GLB_RED_BRIDAL_SWEET_FULL,
    sweetheartShort: GLB_RED_BRIDAL_SWEET_SHORT,
  },
  iceblue: {
    roundFull: GLB_ICEBLUE_BRIDAL_ROUND_FULL,
    roundShort: GLB_ICEBLUE_BRIDAL_ROUND_SHORT,
    sweetheartFull: GLB_ICEBLUE_BRIDAL_SWEET_FULL,
    sweetheartShort: GLB_ICEBLUE_BRIDAL_SWEET_SHORT,
  },
  maroon: {
    roundFull: GLB_MAROON_BRIDAL_ROUND_FULL,
    roundShort: GLB_MAROON_BRIDAL_ROUND_FULL,
    sweetheartFull: GLB_MAROON_BRIDAL_SWEET_FULL,
    sweetheartShort: GLB_MAROON_BRIDAL_SWEET_SHORT,
  },
};

function resolveBridalLehngaGlb(s: Record<TabId, string | null>): string | null {
  const col = s.colors;
  if (col === 'red') return resolveBridalCombo(s, BRIDAL_LEHNGA_SETS.red);
  if (col === 'maroon') return resolveBridalCombo(s, BRIDAL_LEHNGA_SETS.maroon);
  if (col === 'iceblue') return resolveBridalCombo(s, BRIDAL_LEHNGA_SETS.iceblue);
  if (col === 'peach' || col == null) return resolveBridalCombo(s, BRIDAL_LEHNGA_SETS.peach);
  return null;
}

const CIRCULAR_LEHNGA_SETS: Record<string, GrarahComboSet> = {
  white: {
    roundBell: GLB_WHITE_CIRCULAR_ROUND_BELL,
    roundFull: GLB_WHITE_CIRCULAR_ROUND_FULL,
    vBell: GLB_WHITE_CIRCULAR_V_BELL,
    vFull: GLB_WHITE_CIRCULAR_V_FULL,
  },
  red: {
    roundBell: GLB_RED_CIRCULAR_ROUND_BELL,
    roundFull: GLB_RED_CIRCULAR_ROUND_FULL,
    vBell: GLB_RED_CIRCULAR_V_BELL,
    vFull: GLB_RED_CIRCULAR_V_FULL,
  },
  black: {
    roundBell: GLB_BLACK_CIRCULAR_ROUND_BELL,
    roundFull: GLB_BLACK_CIRCULAR_ROUND_FULL,
    vBell: GLB_BLACK_CIRCULAR_V_BELL,
    vFull: GLB_BLACK_CIRCULAR_V_FULL,
  },
  blue: {
    roundBell: GLB_BLUE_CIRCULAR_ROUND_BELL,
    roundFull: GLB_BLUE_CIRCULAR_ROUND_FULL,
    vBell: GLB_BLUE_CIRCULAR_V_BELL,
    vFull: GLB_BLUE_CIRCULAR_V_FULL,
  },
};

function resolveCircularLehngaGlb(s: Record<TabId, string | null>): string | null {
  return resolveGrarahByColor(s, CIRCULAR_LEHNGA_SETS);
}

import { resolveGlbModelId } from './dressGlbTypes';

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

/** Flared hem GLB from neck + sleeves (progressive preview while customer picks options). */
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

/** Front slit GLB — neck selects full-sleeves split model; bell uses bell split when picked. */
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

/**
 * Saree GLB: needs saree style + neck. Sleeves default to full until customer picks short (progressive preview).
 * White / unset color uses the white mesh set; plain round+full white uses the on-disk `whiite…` filename.
 */
function resolveSareeDressGlb(s: Record<TabId, string | null>): string | null {
  const sareeStyle = s['saree-style'];
  if (sareeStyle !== 'plain' && sareeStyle !== 'frill') return null;
  const neck = s.neck;
  if (neck !== 'round' && neck !== 'v-neck') return null;

  const sleeves = s.sleeves === 'short' ? 'short' : 'full';
  const col = s.colors;
  const useWhiteSet = col == null || col === 'white';

  if (!useWhiteSet && col !== 'red' && col !== 'blue' && col !== 'black') return null;

  const isPlain = sareeStyle === 'plain';

  if (isPlain) {
    if (useWhiteSet) {
      if (neck === 'round' && sleeves === 'full') return GLB_PLAIN_ROUND_FULL_WHIIITE;
      if (neck === 'round' && sleeves === 'short') return GLB_PLAIN_ROUND_SHORT_WHITE;
      if (neck === 'v-neck' && sleeves === 'full') return GLB_PLAIN_V_FULL_WHITE;
      return GLB_PLAIN_V_SHORT_WHITE;
    }
    if (col === 'black') {
      if (neck === 'round' && sleeves === 'full') return GLB_PLAIN_ROUND_FULL_BLACK;
      if (neck === 'round' && sleeves === 'short') return GLB_PLAIN_ROUND_SHORT_BLACK;
      if (neck === 'v-neck' && sleeves === 'full') return GLB_PLAIN_V_FULL_BLACK;
      return GLB_PLAIN_V_SHORT_BLACK;
    }
    if (col === 'blue') {
      if (neck === 'round' && sleeves === 'full') return GLB_PLAIN_ROUND_FULL_BLUE;
      if (neck === 'round' && sleeves === 'short') return GLB_PLAIN_ROUND_SHORT_BLUE;
      if (neck === 'v-neck' && sleeves === 'full') return GLB_PLAIN_V_FULL_BLUE;
      return GLB_PLAIN_V_SHORT_BLUE;
    }
    if (col === 'red') {
      if (neck === 'round' && sleeves === 'full') return GLB_PLAIN_ROUND_FULL_RED;
      if (neck === 'round' && sleeves === 'short') return GLB_PLAIN_ROUND_SHORT_RED;
      if (neck === 'v-neck' && sleeves === 'full') return GLB_PLAIN_V_FULL_RED;
      return GLB_PLAIN_V_SHORT_RED;
    }
    return null;
  }

  // frill
  if (useWhiteSet) {
    if (neck === 'round' && sleeves === 'full') return GLB_FRILL_ROUND_FULL_WHITE;
    if (neck === 'round' && sleeves === 'short') return GLB_FRILL_ROUND_SHORT_WHITE;
    if (neck === 'v-neck' && sleeves === 'full') return GLB_FRILL_V_FULL_WHITE;
    return GLB_FRILL_V_SHORT_WHITE;
  }
  if (col === 'black') {
    if (neck === 'round' && sleeves === 'full') return GLB_FRILL_ROUND_FULL_BLACK;
    if (neck === 'round' && sleeves === 'short') return GLB_FRILL_ROUND_SHORT_BLACK;
    if (neck === 'v-neck' && sleeves === 'full') return GLB_FRILL_V_FULL_BLACK;
    return GLB_FRILL_V_SHORT_BLACK;
  }
  if (col === 'blue') {
    if (neck === 'round' && sleeves === 'full') return GLB_FRILL_ROUND_FULL_BLUE;
    if (neck === 'round' && sleeves === 'short') return GLB_FRILL_ROUND_SHORT_BLUE;
    if (neck === 'v-neck' && sleeves === 'full') return GLB_FRILL_V_FULL_BLUE;
    return GLB_FRILL_V_SHORT_BLUE;
  }
  if (col === 'red') {
    if (neck === 'round' && sleeves === 'full') return GLB_FRILL_ROUND_FULL_RED;
    if (neck === 'round' && sleeves === 'short') return GLB_FRILL_ROUND_SHORT_RED;
    if (neck === 'v-neck' && sleeves === 'full') return GLB_FRILL_V_FULL_RED;
    return GLB_FRILL_V_SHORT_RED;
  }
  return null;
}

export function resolveBundledDressGlb(s: Record<TabId, string | null>, modelId: string): string | null {
  const mid = resolveGlbModelId(modelId);
  if (mid === 'lehnga-bridal') {
    const bridalGlb = resolveBridalLehngaGlb(s);
    if (bridalGlb != null) return bridalGlb;
  }

  if (mid === 'lehnga-circular') {
    const circularGlb = resolveCircularLehngaGlb(s);
    if (circularGlb != null) return circularGlb;
  }

  if (mid === 'grarah-short-shirt') {
    const shirtGlb = resolveGrarahShortShirtGlb(s);
    if (shirtGlb != null) return shirtGlb;
  }

  if (mid === 'grarah-peplum') {
    const peplumGlb = resolveGrarahPeplumGlb(s);
    if (peplumGlb != null) return peplumGlb;
  }

  if (mid === 'saree') {
    const sareeGlb = resolveSareeDressGlb(s);
    if (sareeGlb != null) return sareeGlb;
  }

  if (mid === 'long-frock') {
    const longFrockGlb = resolveLongFrockByColor(s);
    if (longFrockGlb != null) return longFrockGlb;
  }

  return null;
}
