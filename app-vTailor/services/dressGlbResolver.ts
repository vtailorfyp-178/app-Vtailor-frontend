/**
 * Maps dress customization selections + model id to a bundled GLB asset module id.
 * Shared by customize3d and the post-customization 3D review screen.
 */

export type TabId = 'neck' | 'sleeves' | 'bottom' | 'frock-style' | 'colors';

const GLB_BEIGE_ETHNIC_GOWN_LONG_FROCK = require('../3d model/beige ethnic gown 3d model.glb');
const GLB_BEIGE_SHARARA_BELL = require('../3d model/beige dress 3d model.glb');
const GLB_BEIGE_ETHNIC_SHARARA_FULL = require('../3d model/beige ethnic dress 3d model.glb');
const GLB_BEIGE_TRADITIONAL_OUTFIT_SHARARA_ROUND_FULL = require('../3d model/beige traditional outfit 3d model.glb');
const GLB_PEACH_CAPE_SHALWAR_V_BELL_STRAIGHT = require('../3d model/peach cape dress 3d model.glb');
const GLB_PEACH_TUNIC_SHALWAR_V_FULL_STRAIGHT = require('../3d model/peach tunic 3d model.glb');
const GLB_PINK_ANARKALI_SHORT_FROCK_SHALWAR_ROUND_BELL_STRAIGHT = require('../3d model/pink anarkali dress 3d model.glb');
const GLB_PINK_SALWAR_KAMEEZ_SHORT_FROCK_V_BELL_STRAIGHT = require('../3d model/pink salwar kameez 3d model.glb');

/** Party/Formal → Long Frock, black — assets in `3d model/3d long frock/`. */
const GLB_BLACK_LONG_FROCK_ROUND_BELL_FLARED = require('../3d model/3d long frock/black round neck bell sleeves flarred.glb');
const GLB_BLACK_LONG_FROCK_ROUND_BELL_SPLIT = require('../3d model/3d long frock/black round neck bell sleeves split.glb');
const GLB_BLACK_LONG_FROCK_ROUND_FULL_FLARED = require('../3d model/3d long frock/black round neck full sleeves flarred.glb');
const GLB_BLACK_LONG_FROCK_ROUND_FULL_SPLIT = require('../3d model/3d long frock/black round neck full sleeves split.glb');
const GLB_BLACK_LONG_FROCK_V_BELL_SPLIT = require('../3d model/3d long frock/black v neck bell sleeeves split.glb');
const GLB_BLACK_LONG_FROCK_V_BELL_FLARED = require('../3d model/3d long frock/black v neck bell sleeves flarred.glb');
const GLB_BLACK_LONG_FROCK_V_FULL_FLARED = require('../3d model/3d long frock/black v neck full sleeves flarred.glb');
const GLB_BLACK_LONG_FROCK_V_FULL_SPLIT = require('../3d model/3d long frock/black v neck full sleeves split.glb');

/** Party/Formal → Long Frock, blue — filenames match files on disk (`3d model/3d long frock/`). */
const GLB_BLUE_LONG_FROCK_ROUND_BELL_FLARED = require('../3d model/3d long frock/blue round neck bell sleeves flarred.glb');
/** On disk the split variant is named without "split" suffix. */
const GLB_BLUE_LONG_FROCK_ROUND_BELL_SPLIT = require('../3d model/3d long frock/blue round neck bell sleeves.glb');
const GLB_BLUE_LONG_FROCK_ROUND_FULL_FLARED = require('../3d model/3d long frock/blue round neck full sleeves flarred.glb');
const GLB_BLUE_LONG_FROCK_ROUND_FULL_SPLIT = require('../3d model/3d long frock/blue round neck full sleeves split.glb');
const GLB_BLUE_LONG_FROCK_V_BELL_SPLIT = require('../3d model/3d long frock/blue v neck bell sleeves split.glb');
/** Trailing space before extension in the bundled asset filename. */
const GLB_BLUE_LONG_FROCK_V_BELL_FLARED = require('../3d model/3d long frock/blue v neck bell sleeves flarred .glb');
const GLB_BLUE_LONG_FROCK_V_FULL_FLARED = require('../3d model/3d long frock/blue v neck full sleeves flarred.glb');
const GLB_BLUE_LONG_FROCK_V_FULL_SPLIT = require('../3d model/3d long frock/blue v neck full sleeves split.glb');

/** Party/Formal → Long Frock, red — `3d model/3d long frock/`. */
const GLB_RED_LONG_FROCK_ROUND_BELL_FLARED = require('../3d model/3d long frock/red round neck bell sleeves flarred.glb');
const GLB_RED_LONG_FROCK_ROUND_BELL_SPLIT = require('../3d model/3d long frock/red round neck bell sleeves split.glb');
const GLB_RED_LONG_FROCK_ROUND_FULL_FLARED = require('../3d model/3d long frock/red round neck full sleeves flarred.glb');
const GLB_RED_LONG_FROCK_ROUND_FULL_SPLIT = require('../3d model/3d long frock/red round neck full sleeves split.glb');
const GLB_RED_LONG_FROCK_V_BELL_SPLIT = require('../3d model/3d long frock/red v neck bell sleeves split.glb');
const GLB_RED_LONG_FROCK_V_BELL_FLARED = require('../3d model/3d long frock/red v neck bell sleeves flarred.glb');
const GLB_RED_LONG_FROCK_V_FULL_FLARED = require('../3d model/3d long frock/red v neck full sleeves flarred.glb');
const GLB_RED_LONG_FROCK_V_FULL_SPLIT = require('../3d model/3d long frock/red v neck full sleeves split.glb');

/** Party/Formal → Long Frock, white — `3d model/3d long frock/`. */
const GLB_WHITE_LONG_FROCK_ROUND_BELL_FLARED = require('../3d model/3d long frock/white round neck bell sleeves flarred.glb');
const GLB_WHITE_LONG_FROCK_ROUND_BELL_SPLIT = require('../3d model/3d long frock/white round neck bell sleeves split.glb');
const GLB_WHITE_LONG_FROCK_ROUND_FULL_FLARED = require('../3d model/3d long frock/white round neck full sleeves flarred.glb');
const GLB_WHITE_LONG_FROCK_ROUND_FULL_SPLIT = require('../3d model/3d long frock/white round neck full sleeves split.glb');
const GLB_WHITE_LONG_FROCK_V_BELL_SPLIT = require('../3d model/3d long frock/white v neck bell sleeves split.glb');
const GLB_WHITE_LONG_FROCK_V_BELL_FLARED = require('../3d model/3d long frock/white v neck bell sleeves flarred.glb');
/** Filename on disk has two spaces before `.glb`. */
const GLB_WHITE_LONG_FROCK_V_FULL_FLARED = require('../3d model/3d long frock/white v neck full sleeves flarred  .glb');
const GLB_WHITE_LONG_FROCK_V_FULL_SPLIT = require('../3d model/3d long frock/white v neck full sleeves split.glb');

function shouldShowBeigeEthnicGownLongFrockGlbCombo(s: Record<TabId, string | null>, mid: string) {
  if (mid !== 'long-frock') return false;
  if (s.neck !== 'v-neck' || s.sleeves !== 'full') return false;
  const col = s.colors;
  if (col != null && col !== 'beige') return false;
  return true;
}

function shouldShowPinkAnarkaliShortFrockShalwarRoundBellStraightGlbCombo(s: Record<TabId, string | null>, mid: string) {
  if (mid !== 'short-frock-shalwar') return false;
  if (s.neck !== 'round' || s.sleeves !== 'bell') return false;
  const col = s.colors;
  if (col != null && col !== 'beige') return false;
  if (s.bottom != null && s.bottom !== 'straight') return false;
  return true;
}

function shouldShowPinkSalwarKameezShortFrockShalwarVNeckBellStraightGlbCombo(s: Record<TabId, string | null>, mid: string) {
  if (mid !== 'short-frock-shalwar') return false;
  if (s.neck !== 'v-neck' || s.sleeves !== 'bell') return false;
  const col = s.colors;
  if (col != null && col !== 'beige') return false;
  if (s.bottom != null && s.bottom !== 'straight') return false;
  return true;
}

function shouldShowPeachCapeShalwarKameezVNeckBellStraightGlbCombo(s: Record<TabId, string | null>, mid: string) {
  if (mid !== 'shalwar-kameez') return false;
  if (s.neck !== 'v-neck' || s.sleeves !== 'bell') return false;
  const col = s.colors;
  if (col != null && col !== 'beige') return false;
  if (s.bottom != null && s.bottom !== 'straight') return false;
  return true;
}

function shouldShowPeachTunicShalwarKameezVNeckFullStraightGlbCombo(s: Record<TabId, string | null>, mid: string) {
  if (mid !== 'shalwar-kameez') return false;
  if (s.neck !== 'v-neck') return false;
  const col = s.colors;
  if (col != null && col !== 'beige') return false;
  if (s.bottom != null && s.bottom !== 'straight') return false;
  return true;
}

function shouldShowBeigeTraditionalOutfitShararaProgressiveGlbCombo(s: Record<TabId, string | null>, mid: string) {
  if (mid !== 'sharara') return false;
  if (s.neck == null && s.sleeves == null) return false;
  const col = s.colors;
  if (col != null && col !== 'beige') return false;
  if (s.neck === 'v-neck') return false;
  if (s.neck === 'round' && s.sleeves === 'bell') return false;
  return true;
}

function shouldShowBeigeDressShararaGlbCombo(s: Record<TabId, string | null>, mid: string) {
  if (mid !== 'sharara') return false;
  if (s.neck !== 'v-neck' || s.sleeves !== 'bell') return false;
  const col = s.colors;
  if (col != null && col !== 'beige') return false;
  return true;
}

function shouldShowBeigeEthnicShararaGlbCombo(s: Record<TabId, string | null>, mid: string) {
  if (mid !== 'sharara') return false;
  if (s.neck !== 'v-neck') return false;
  const col = s.colors;
  if (col != null && col !== 'beige') return false;
  if (s.sleeves === 'bell') return false;
  return true;
}

/** Black long frock: UI uses `flared-bottom` / `front-slit` under tab `frock-style`. */
function blackLongFrockBase(s: Record<TabId, string | null>, mid: string): boolean {
  return mid === 'long-frock' && s.colors === 'black';
}

function blueLongFrockBase(s: Record<TabId, string | null>, mid: string): boolean {
  return mid === 'long-frock' && s.colors === 'blue';
}

function redLongFrockBase(s: Record<TabId, string | null>, mid: string): boolean {
  return mid === 'long-frock' && s.colors === 'red';
}

/** White long frock preview: White selected or not yet picked (still on neck/sleeves/frock tabs). */
function whiteLongFrockBase(s: Record<TabId, string | null>, mid: string): boolean {
  return mid === 'long-frock' && (s.colors === 'white' || s.colors == null);
}

export function resolveBundledDressGlb(s: Record<TabId, string | null>, mid: string): number | null {
  if (blackLongFrockBase(s, mid)) {
    const fs = s['frock-style'];
    if (s.neck === 'round' && s.sleeves === 'bell' && fs === 'flared-bottom')
      return GLB_BLACK_LONG_FROCK_ROUND_BELL_FLARED as number;
    if (s.neck === 'round' && s.sleeves === 'bell' && fs === 'front-slit')
      return GLB_BLACK_LONG_FROCK_ROUND_BELL_SPLIT as number;
    if (s.neck === 'round' && s.sleeves === 'full' && fs === 'flared-bottom')
      return GLB_BLACK_LONG_FROCK_ROUND_FULL_FLARED as number;
    if (s.neck === 'round' && s.sleeves === 'full' && fs === 'front-slit')
      return GLB_BLACK_LONG_FROCK_ROUND_FULL_SPLIT as number;
    if (s.neck === 'v-neck' && s.sleeves === 'bell' && fs === 'front-slit')
      return GLB_BLACK_LONG_FROCK_V_BELL_SPLIT as number;
    if (s.neck === 'v-neck' && s.sleeves === 'bell' && fs === 'flared-bottom')
      return GLB_BLACK_LONG_FROCK_V_BELL_FLARED as number;
    if (s.neck === 'v-neck' && s.sleeves === 'full' && fs === 'flared-bottom')
      return GLB_BLACK_LONG_FROCK_V_FULL_FLARED as number;
    if (s.neck === 'v-neck' && s.sleeves === 'full' && fs === 'front-slit')
      return GLB_BLACK_LONG_FROCK_V_FULL_SPLIT as number;
  }

  if (blueLongFrockBase(s, mid)) {
    const fs = s['frock-style'];
    if (s.neck === 'round' && s.sleeves === 'bell' && fs === 'flared-bottom')
      return GLB_BLUE_LONG_FROCK_ROUND_BELL_FLARED as number;
    if (s.neck === 'round' && s.sleeves === 'bell' && fs === 'front-slit')
      return GLB_BLUE_LONG_FROCK_ROUND_BELL_SPLIT as number;
    if (s.neck === 'round' && s.sleeves === 'full' && fs === 'flared-bottom')
      return GLB_BLUE_LONG_FROCK_ROUND_FULL_FLARED as number;
    if (s.neck === 'round' && s.sleeves === 'full' && fs === 'front-slit')
      return GLB_BLUE_LONG_FROCK_ROUND_FULL_SPLIT as number;
    if (s.neck === 'v-neck' && s.sleeves === 'bell' && fs === 'front-slit')
      return GLB_BLUE_LONG_FROCK_V_BELL_SPLIT as number;
    if (s.neck === 'v-neck' && s.sleeves === 'bell' && fs === 'flared-bottom')
      return GLB_BLUE_LONG_FROCK_V_BELL_FLARED as number;
    if (s.neck === 'v-neck' && s.sleeves === 'full' && fs === 'flared-bottom')
      return GLB_BLUE_LONG_FROCK_V_FULL_FLARED as number;
    if (s.neck === 'v-neck' && s.sleeves === 'full' && fs === 'front-slit')
      return GLB_BLUE_LONG_FROCK_V_FULL_SPLIT as number;
  }

  if (redLongFrockBase(s, mid)) {
    const fs = s['frock-style'];
    if (s.neck === 'round' && s.sleeves === 'bell' && fs === 'flared-bottom')
      return GLB_RED_LONG_FROCK_ROUND_BELL_FLARED as number;
    if (s.neck === 'round' && s.sleeves === 'bell' && fs === 'front-slit')
      return GLB_RED_LONG_FROCK_ROUND_BELL_SPLIT as number;
    if (s.neck === 'round' && s.sleeves === 'full' && fs === 'flared-bottom')
      return GLB_RED_LONG_FROCK_ROUND_FULL_FLARED as number;
    if (s.neck === 'round' && s.sleeves === 'full' && fs === 'front-slit')
      return GLB_RED_LONG_FROCK_ROUND_FULL_SPLIT as number;
    if (s.neck === 'v-neck' && s.sleeves === 'bell' && fs === 'front-slit')
      return GLB_RED_LONG_FROCK_V_BELL_SPLIT as number;
    if (s.neck === 'v-neck' && s.sleeves === 'bell' && fs === 'flared-bottom')
      return GLB_RED_LONG_FROCK_V_BELL_FLARED as number;
    if (s.neck === 'v-neck' && s.sleeves === 'full' && fs === 'flared-bottom')
      return GLB_RED_LONG_FROCK_V_FULL_FLARED as number;
    if (s.neck === 'v-neck' && s.sleeves === 'full' && fs === 'front-slit')
      return GLB_RED_LONG_FROCK_V_FULL_SPLIT as number;
  }

  if (whiteLongFrockBase(s, mid)) {
    const fs = s['frock-style'];

    /** Front slit / split hem — requires neck + sleeves + front-slit picked. */
    if (fs === 'front-slit') {
      if (s.neck === 'round' && s.sleeves === 'bell') return GLB_WHITE_LONG_FROCK_ROUND_BELL_SPLIT as number;
      if (s.neck === 'round' && s.sleeves === 'full') return GLB_WHITE_LONG_FROCK_ROUND_FULL_SPLIT as number;
      if (s.neck === 'v-neck' && s.sleeves === 'bell') return GLB_WHITE_LONG_FROCK_V_BELL_SPLIT as number;
      if (s.neck === 'v-neck' && s.sleeves === 'full') return GLB_WHITE_LONG_FROCK_V_FULL_SPLIT as number;
    }

    /**
     * Flared previews: frock-style not front-slit (null / flared-bottom).
     * Round neck alone → assume full sleeves flared preview; V-neck alone → full sleeves flared (file has two spaces before `.glb`).
     */
    if (fs !== 'front-slit') {
      if (s.neck === 'round') {
        if (s.sleeves === 'bell')
          return GLB_WHITE_LONG_FROCK_ROUND_BELL_FLARED as number;
        if (s.sleeves == null || s.sleeves === 'full')
          return GLB_WHITE_LONG_FROCK_ROUND_FULL_FLARED as number;
      }
      if (s.neck === 'v-neck') {
        if (s.sleeves === 'bell')
          return GLB_WHITE_LONG_FROCK_V_BELL_FLARED as number;
        if (s.sleeves == null || s.sleeves === 'full')
          return GLB_WHITE_LONG_FROCK_V_FULL_FLARED as number;
      }
    }
  }

  if (shouldShowBeigeEthnicGownLongFrockGlbCombo(s, mid)) return GLB_BEIGE_ETHNIC_GOWN_LONG_FROCK as number;
  if (shouldShowPinkAnarkaliShortFrockShalwarRoundBellStraightGlbCombo(s, mid))
    return GLB_PINK_ANARKALI_SHORT_FROCK_SHALWAR_ROUND_BELL_STRAIGHT as number;
  if (shouldShowPinkSalwarKameezShortFrockShalwarVNeckBellStraightGlbCombo(s, mid))
    return GLB_PINK_SALWAR_KAMEEZ_SHORT_FROCK_V_BELL_STRAIGHT as number;
  if (shouldShowPeachCapeShalwarKameezVNeckBellStraightGlbCombo(s, mid))
    return GLB_PEACH_CAPE_SHALWAR_V_BELL_STRAIGHT as number;
  if (shouldShowPeachTunicShalwarKameezVNeckFullStraightGlbCombo(s, mid))
    return GLB_PEACH_TUNIC_SHALWAR_V_FULL_STRAIGHT as number;
  if (shouldShowBeigeTraditionalOutfitShararaProgressiveGlbCombo(s, mid))
    return GLB_BEIGE_TRADITIONAL_OUTFIT_SHARARA_ROUND_FULL as number;
  if (shouldShowBeigeEthnicShararaGlbCombo(s, mid)) return GLB_BEIGE_ETHNIC_SHARARA_FULL as number;
  if (shouldShowBeigeDressShararaGlbCombo(s, mid)) return GLB_BEIGE_SHARARA_BELL as number;
  return null;
}
