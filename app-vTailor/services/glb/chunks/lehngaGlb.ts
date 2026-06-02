import type { DressSelections, TabId } from '../dressGlbTypes';

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

export function resolveBundledLehngaGlb(
  s: DressSelections,
  modelId: string,
): string | null {
  if (modelId === 'lehnga-bridal') return resolveBridalLehngaGlb(s);
  if (modelId === 'lehnga-circular') return resolveCircularLehngaGlb(s);
  return null;
}
