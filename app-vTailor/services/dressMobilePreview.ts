import type { ImageSourcePropType } from 'react-native';
import type { DressSelections } from '@/services/dressGlbResolver';
import { resolveCustomizePreviewImage } from '@/services/dressCustomizePreview';

const imgShortShirtShalwar = require('../2d model/short-shirt-shalwar.png');
const imgPatiyala = require('../2d model/variations/patiyala-shalwar.png');
const imgLongFrock = require('../2d model/long frock 2.png');
const imgCasualDress = require('../2d model/casual dresses.jpg');
const imgPlainSaree = require('../2d model/variations/plain saree.png');
const imgFrillSaree = require('../2d model/variations/frill saree.png');
const imgSaree = require('../2d model/variations/saree.png');

const variationByOptionId: Record<string, ImageSourcePropType> = {
  round: require('../2d model/variations/round-neck.png'),
  'v-neck': require('../2d model/variations/v-neck.png'),
  square: require('../2d model/variations/square neck.png'),
  'boat-neck': require('../2d model/variations/boat neck.png'),
  balloon: require('../2d model/variations/balloon-sleeves.png'),
  layered: require('../2d model/variations/layered-sleeves.png'),
  full: require('../2d model/variations/full-sleeves.png'),
  bell: require('../2d model/variations/bell-sleeves.png'),
  patiyala: imgPatiyala,
  straight: require('../2d model/variations/straight-style.png'),
  plain: imgPlainSaree,
  frill: imgFrillSaree,
};

function modelFallback(modelId: string, selections: DressSelections): ImageSourcePropType | null {
  if (modelId === 'kurti' || modelId === 'kurti-trouser') return imgCasualDress;
  if (
    modelId === 'short-frock' ||
    modelId === 'short-frock-shalwar' ||
    modelId === 'shalwar-kameez' ||
    modelId === 'shalwar-kameez-short'
  ) {
    return imgShortShirtShalwar;
  }
  if (modelId === 'long-frock') return imgLongFrock;
  if (modelId === 'saree') {
    if (selections['saree-style'] === 'frill') return imgFrillSaree;
    if (selections['saree-style'] === 'plain') return imgPlainSaree;
    return imgSaree;
  }
  if (modelId === 'sharara') return require('../2d model/shrara.jpg');
  if (modelId === 'grarah-short-shirt') {
    return require('../2d model/variations/short-shirt-grarah.png');
  }
  if (modelId === 'grarah-peplum') {
    return require('../2d model/variations/peplum-grarah.png');
  }
  if (modelId === 'lehnga-circular') return require('../2d model/variations/circular.png');
  if (modelId === 'lehnga-bridal' || modelId === 'lehnga') {
    return require('../2d model/bridal-lehnga.png');
  }
  return null;
}

/** Best 2D preview for native when GLB is too heavy (same selections as 3D resolver). */
export function resolveDressMobilePreviewImage(
  modelId: string,
  selections: DressSelections,
): ImageSourcePropType | null {
  if (!modelId) return null;

  const styled = resolveCustomizePreviewImage(modelId, selections);
  if (styled) return styled;

  if (modelId === 'shalwar-kameez-short') {
    if (selections.bottom === 'patiyala') {
      return imgPatiyala;
    }
    if (selections.bottom === 'straight') {
      return variationByOptionId.straight ?? imgShortShirtShalwar;
    }
  }

  const neck = selections.neck;
  const sleeves = selections.sleeves;
  if (neck && variationByOptionId[neck]) {
    return variationByOptionId[neck];
  }
  if (sleeves && variationByOptionId[sleeves]) {
    return variationByOptionId[sleeves];
  }

  return modelFallback(modelId, selections);
}
