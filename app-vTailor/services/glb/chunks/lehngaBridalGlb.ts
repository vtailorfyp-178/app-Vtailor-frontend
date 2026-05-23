import type { DressSelections, TabId } from '../dressGlbTypes';

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

export function resolveBundledBridalLehngaGlb(s: DressSelections): string | null {
  const col = s.colors;
  if (col === 'red') return resolveBridalCombo(s, BRIDAL_LEHNGA_SETS.red);
  if (col === 'maroon') return resolveBridalCombo(s, BRIDAL_LEHNGA_SETS.maroon);
  if (col === 'iceblue') return resolveBridalCombo(s, BRIDAL_LEHNGA_SETS.iceblue);
  if (col === 'peach' || col == null) return resolveBridalCombo(s, BRIDAL_LEHNGA_SETS.peach);
  return null;
}
