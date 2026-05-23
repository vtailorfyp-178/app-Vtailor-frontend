import type { PatiyalaGlbMap } from './patiyalaDressGlb.shared';

const PAT_OPT = '3d model/3d shalwar kameez/patiyala/optimized';

function patOpt(spaced: string): string {
  return `${PAT_OPT}/optimized-${spaced}.glb`;
}

export const PATIYALA_GLBS_WEB: PatiyalaGlbMap = {
  round: {
    full: patOpt('white round neck full sleeves and patiyala shalwar'),
    bell: patOpt('white round neck bell sleeves patiyala'),
    layered: patOpt('white round neck layered patiyala'),
    balloon: patOpt('white round neck cuff sleeves patiyala'),
  },
  'v-neck': {
    full: patOpt('white v neck full sleeves patiyala'),
    bell: patOpt('white v neck bell sleeves patiyala'),
    layered: patOpt('white v neck layered patiyala'),
    balloon: patOpt('white v neck cuff sleeves patiyala'),
  },
  square: {
    full: patOpt('white square neck full sleeves patiyala'),
    bell: patOpt('white square neck bell sleeves patiyala'),
    layered: patOpt('white square neck layered patiyala'),
    balloon: patOpt('white square neck cuff sleeves patiyala'),
  },
  'boat-neck': {
    full: patOpt('white boat neck full sleeves patiyala'),
    bell: patOpt('white boat neck bell sleeves patiyala'),
    layered: patOpt('white boat neck layered patiyala'),
    balloon: patOpt('white boat neck cuff sleeves patiyala'),
  },
};
