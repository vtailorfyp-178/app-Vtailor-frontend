import type { ImageSourcePropType } from 'react-native';
import type { DressSelections } from '@/services/dressGlbResolver';
import { resolveCustomizePreviewImage } from '@/services/dressCustomizePreview';

const imgShortShirtShalwar = require('../dress_assets/short-shirt-shalwar.png');
const imgPatiyala = require('../dress_assets/variations/patiyala-shalwar.png');
const imgLongFrock = require('../dress_assets/long frock 2.png');
const imgCasualDress = require('../dress_assets/casual dresses.jpg');
const imgPlainSaree = require('../dress_assets/variations/plain saree.png');
const imgFrillSaree = require('../dress_assets/variations/frill saree.png');
const imgSaree = require('../dress_assets/variations/saree.png');

const variationByOptionId: Record<string, ImageSourcePropType> = {
  round: require('../dress_assets/variations/round-neck.png'),
  'v-neck': require('../dress_assets/variations/v-neck.png'),
  square: require('../dress_assets/variations/square neck.png'),
  'boat-neck': require('../dress_assets/variations/boat neck.png'),
  balloon: require('../dress_assets/variations/balloon-sleeves.png'),
  layered: require('../dress_assets/variations/layered-sleeves.png'),
  full: require('../dress_assets/variations/full-sleeves.png'),
  bell: require('../dress_assets/variations/bell-sleeves.png'),
  patiyala: imgPatiyala,
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
  if (modelId === 'sharara') return require('../dress_assets/shrara.png');
  if (modelId === 'grarah-short-shirt') {
    return require('../dress_assets/variations/short-shirt-grarah.png');
  }
  if (modelId === 'grarah-peplum') {
    return require('../dress_assets/variations/peplum-grarah.png');
  }
  if (modelId === 'lehnga-circular') return require('../dress_assets/variations/circular.png');
  if (modelId === 'lehnga-bridal' || modelId === 'lehnga') {
    return require('../dress_assets/bridal-lehnga.png');
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
