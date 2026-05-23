/** AUTO-GENERATED native chunk — mobile GLB paths */

import type { DressSelections, TabId } from '../dressGlbTypes';

/** Party/Formal → Saree plain — folder `3d model/3d sari/plain saree/`. Typo `whiite` matches asset on disk. */
const GLB_PLAIN_ROUND_FULL_WHIIITE = '3d model/3d sari/plain saree/mobile/whiite round neck full sleeves.glb';
const GLB_PLAIN_ROUND_SHORT_WHITE = '3d model/3d sari/plain saree/mobile/white round neck short sleeves.glb';
const GLB_PLAIN_V_FULL_WHITE = '3d model/3d sari/plain saree/mobile/white v neck full sleeves.glb';
const GLB_PLAIN_V_SHORT_WHITE = '3d model/3d sari/plain saree/mobile/white v neck short sleeves.glb';
const GLB_PLAIN_ROUND_FULL_BLACK = '3d model/3d sari/plain saree/mobile/black round neck full sleeves.glb';
const GLB_PLAIN_ROUND_SHORT_BLACK = '3d model/3d sari/plain saree/mobile/black round neck short sleeves.glb';
const GLB_PLAIN_V_FULL_BLACK = '3d model/3d sari/plain saree/mobile/black v neck full sleeves.glb';
const GLB_PLAIN_V_SHORT_BLACK = '3d model/3d sari/plain saree/mobile/black v neck short sleeves.glb';
const GLB_PLAIN_ROUND_FULL_BLUE = '3d model/3d sari/plain saree/mobile/blue round neck full sleeves.glb';
const GLB_PLAIN_ROUND_SHORT_BLUE = '3d model/3d sari/plain saree/mobile/blue round neck short sleeves.glb';
const GLB_PLAIN_V_FULL_BLUE = '3d model/3d sari/plain saree/mobile/blue v neck full sleeves.glb';
/** On disk the filename ends with `.glb.glb`. */
const GLB_PLAIN_V_SHORT_BLUE = '3d model/3d sari/plain saree/mobile/blue v neck short sleeves.glb.glb';
const GLB_PLAIN_ROUND_FULL_RED = '3d model/3d sari/plain saree/mobile/red round neck full sleeves.glb';
const GLB_PLAIN_ROUND_SHORT_RED = '3d model/3d sari/plain saree/mobile/red round neck short sleeves.glb';
const GLB_PLAIN_V_FULL_RED = '3d model/3d sari/plain saree/mobile/red v neck full sleeves.glb';
const GLB_PLAIN_V_SHORT_RED = '3d model/3d sari/plain saree/mobile/red v neck short sleeves.glb';

/** Party/Formal → Saree frill — `3d model/3d sari/frill saree/`. One red full file uses `flired` on disk. */
const GLB_FRILL_ROUND_FULL_WHITE = '3d model/3d sari/frill saree/mobile/white round neck full sleeves flirred.glb';
const GLB_FRILL_ROUND_SHORT_WHITE = '3d model/3d sari/frill saree/mobile/white round neck short sleeves flirred.glb';
const GLB_FRILL_V_FULL_WHITE = '3d model/3d sari/frill saree/mobile/white v neck full sleeves flirred.glb';
const GLB_FRILL_V_SHORT_WHITE = '3d model/3d sari/frill saree/mobile/white v neck short sleeves flirred.glb';
const GLB_FRILL_ROUND_FULL_BLACK = '3d model/3d sari/frill saree/mobile/black round neck full sleeves flirred.glb';
const GLB_FRILL_ROUND_SHORT_BLACK = '3d model/3d sari/frill saree/mobile/black round neck short sleeves flirred.glb';
const GLB_FRILL_V_FULL_BLACK = '3d model/3d sari/frill saree/mobile/black v neck full sleeves flirred.glb';
const GLB_FRILL_V_SHORT_BLACK = '3d model/3d sari/frill saree/mobile/black v neck short sleeves flirred.glb';
const GLB_FRILL_ROUND_FULL_BLUE = '3d model/3d sari/frill saree/mobile/blue round neck full sleeves flirred.glb';
const GLB_FRILL_ROUND_SHORT_BLUE = '3d model/3d sari/frill saree/mobile/blue round neck short sleeves flirred.glb';
const GLB_FRILL_V_FULL_BLUE = '3d model/3d sari/frill saree/mobile/blue v neck full sleeves flirred.glb';
const GLB_FRILL_V_SHORT_BLUE = '3d model/3d sari/frill saree/mobile/blue v neck short sleeves flirred.glb';
const GLB_FRILL_ROUND_FULL_RED = '3d model/3d sari/frill saree/mobile/red round neck full sleeves flired.glb';
const GLB_FRILL_ROUND_SHORT_RED = '3d model/3d sari/frill saree/mobile/red round neck short sleeves flirred.glb';
const GLB_FRILL_V_FULL_RED = '3d model/3d sari/frill saree/mobile/red v neck full sleeves flirred.glb';
const GLB_FRILL_V_SHORT_RED = '3d model/3d sari/frill saree/mobile/red v neck short sleeves flirred.glb';





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

export function resolveBundledSareeGlb(s: DressSelections): string | null {
  return resolveSareeDressGlb(s);
}
