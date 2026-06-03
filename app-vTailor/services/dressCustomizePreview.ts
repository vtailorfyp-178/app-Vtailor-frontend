import type { ImageSourcePropType } from 'react-native';
import type { DressSelections } from '@/services/dressGlbResolver';
import { isCasualShortShirtModelId } from '@/services/glb/dressGlbTypes';
import { canShowGlbPreview } from '@/services/glb/threePreviewReadiness';

const IMG_BRIDAL_LEHNGA = require('../dress_assets/bridal-lehnga.png');
const IMG_FLARED_FROCK = require('../dress_assets/variations/flared-bottom.png');
const IMG_FRONT_SLIT_FROCK = require('../dress_assets/variations/front-slit-frock.png');
const IMG_PATIYALA = require('../dress_assets/variations/patiyala-shalwar.png');
const IMG_LONG_FROCK = require('../dress_assets/long frock 2.png');
const IMG_SAREE = require('../dress_assets/variations/saree.png');
const IMG_PLAIN_SAREE = require('../dress_assets/variations/plain saree.png');
const IMG_FRILL_SAREE = require('../dress_assets/variations/frill saree.png');
const IMG_ROUND_NECK = require('../dress_assets/variations/round-neck.png');
const IMG_V_NECK = require('../dress_assets/variations/v-neck.png');
const IMG_SHORT_SHIRT = require('../dress_assets/short-shirt-shalwar.png');
const IMG_GRARAH_SHIRT = require('../dress_assets/variations/short-shirt-grarah.png');
const IMG_GRARAH_PEPLUM = require('../dress_assets/variations/peplum-grarah.png');
const IMG_LEHNGA_CIRCULAR = require('../dress_assets/variations/circular.png');

function neckStyleImage(neck: string | null | undefined): ImageSourcePropType | null {
  if (neck === 'v-neck') return IMG_V_NECK;
  if (neck === 'round') return IMG_ROUND_NECK;
  return null;
}

function longFrockStyleImage(frockStyle: string | null | undefined): ImageSourcePropType {
  if (frockStyle === 'front-slit') return IMG_FRONT_SLIT_FROCK;
  return IMG_FLARED_FROCK;
}

/** 2D hero image in the customize preview panel (before / while 3D loads). */
export function resolveCustomizePreviewImage(
  modelId: string,
  selections: DressSelections,
): ImageSourcePropType | null {
  if (!modelId) return null;

  const showing3d = canShowGlbPreview(modelId, selections);

  if (modelId === 'long-frock') {
    if (!showing3d) {
      return longFrockStyleImage(selections['frock-style']);
    }
    if (!selections.neck) {
      return longFrockStyleImage(selections['frock-style']);
    }
    return IMG_LONG_FROCK;
  }

  if (modelId === 'saree') {
    if (!showing3d) {
      if (selections['saree-style'] === 'frill') return IMG_FRILL_SAREE;
      if (selections['saree-style'] === 'plain') return IMG_PLAIN_SAREE;
      return IMG_SAREE;
    }
    if (selections['saree-style'] === 'frill') return IMG_FRILL_SAREE;
    if (selections['saree-style'] === 'plain') return IMG_PLAIN_SAREE;
    return IMG_SAREE;
  }

  if (isCasualShortShirtModelId(modelId) && selections.bottom === 'patiyala' && !showing3d) {
    return IMG_PATIYALA;
  }

  if (modelId === 'lehnga-bridal') return IMG_BRIDAL_LEHNGA;
  if (modelId === 'grarah-short-shirt') return IMG_GRARAH_SHIRT;
  if (modelId === 'grarah-peplum') return IMG_GRARAH_PEPLUM;
  if (modelId === 'lehnga-circular') return IMG_LEHNGA_CIRCULAR;
  if (isCasualShortShirtModelId(modelId)) return IMG_SHORT_SHIRT;

  return null;
}
