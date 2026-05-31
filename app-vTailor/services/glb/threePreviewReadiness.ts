import type { DressSelections } from './dressGlbTypes';
import {
  isCasualShortShirtModelId,
  isTrouserShirtBellBottomModelId,
  isTrouserShirtTulipTrouserModelId,
  isTrouserShirtVariationModelId,
} from './dressGlbTypes';

const LONG_FROCK_COLORS = new Set(['red', 'blue', 'white', 'black']);
const SAREE_COLORS = new Set(['red', 'blue', 'white', 'black']);

/** UI / legacy ids → resolver ids (e.g. "open slit" screens). */
export function normalizeDressSelectionsForGlb(modelId: string, s: DressSelections): DressSelections {
  const next = { ...s };
  if (modelId === 'long-frock' && next['frock-style'] === 'open-slit') {
    next['frock-style'] = 'front-slit';
  }
  return next;
}

/** Defaults for GLB resolver (fills sleeves/color so URL can resolve early). */
export function with3dPreviewDefaults(modelId: string, s: DressSelections): DressSelections {
  const next = normalizeDressSelectionsForGlb(modelId, { ...s });
  if (!next.sleeves) next.sleeves = 'full';
  if (modelId === 'long-frock' && !next['frock-style']) next['frock-style'] = 'flared-bottom';
  if (modelId === 'saree' && !next['saree-style']) next['saree-style'] = 'plain';
  if ((modelId === 'lehnga-bridal' || modelId === 'lehnga-circular') && !next.colors) {
    next.colors = modelId === 'lehnga-bridal' ? 'peach' : 'white';
  }
  if (
    (modelId === 'long-frock' ||
      modelId === 'saree' ||
      modelId === 'grarah-short-shirt' ||
      modelId === 'grarah-peplum') &&
    !next.colors
  ) {
    next.colors = 'white';
  }
  if (isCasualShortShirtModelId(modelId) && !next.bottom) {
    next.bottom = 'patiyala';
  }
  if (isTrouserShirtBellBottomModelId(modelId) && !next.sleeves) {
    next.sleeves = 'straight';
  }
  if (isTrouserShirtTulipTrouserModelId(modelId) && !next.sleeves) {
    next.sleeves = 'full';
  }
  return next;
}

/**
 * Show 3D as soon as neck (and dress style) are chosen.
 * Sleeves/color use defaults until the customer picks them — then URL updates live.
 */
export function canShowGlbPreview(modelId: string, s: DressSelections): boolean {
  if (!modelId) return false;

  if (isTrouserShirtVariationModelId(modelId)) {
    return Boolean(s.neck);
  }
  if (isCasualShortShirtModelId(modelId)) {
    if (s.bottom === 'straight') return false;
    return Boolean(s.neck);
  }
  if (modelId === 'long-frock') {
    return Boolean(s['frock-style'] && s.neck);
  }
  if (modelId === 'saree') {
    return Boolean(s['saree-style'] && s.neck);
  }
  if (modelId === 'grarah-short-shirt' || modelId === 'grarah-peplum') {
    return Boolean(s.neck);
  }
  if (modelId === 'lehnga-bridal' || modelId === 'lehnga-circular') {
    return Boolean(s.neck);
  }

  return false;
}

/** All tabs filled — required before opening full-screen 3D view / measurements. */
export function isReadyFor3dPreview(modelId: string, s: DressSelections): boolean {
  if (!modelId) return false;

  if (isTrouserShirtVariationModelId(modelId)) {
    return Boolean(s.neck && s.sleeves);
  }
  if (isCasualShortShirtModelId(modelId)) {
    if (s.bottom === 'straight') return false;
    return Boolean(s.neck && s.sleeves && (s.bottom === 'patiyala' || s.bottom == null));
  }
  if (modelId === 'long-frock') {
    return Boolean(
      s['frock-style'] &&
        s.neck &&
        s.sleeves &&
        s.colors &&
        LONG_FROCK_COLORS.has(s.colors),
    );
  }
  if (modelId === 'saree') {
    return Boolean(
      s['saree-style'] && s.neck && s.sleeves && s.colors && SAREE_COLORS.has(s.colors),
    );
  }
  if (modelId === 'grarah-short-shirt' || modelId === 'grarah-peplum') {
    return Boolean(s.neck && s.sleeves && s.colors && SAREE_COLORS.has(s.colors));
  }
  if (modelId === 'lehnga-bridal' || modelId === 'lehnga-circular') {
    return Boolean(s.neck && s.sleeves && s.colors);
  }

  return false;
}
