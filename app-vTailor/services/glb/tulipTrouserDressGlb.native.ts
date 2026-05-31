import {
  resolveTulipTrouserGlbFromMap,
  type TulipTrouserGlbMap,
} from './tulipTrouserDressGlb.shared';

const TULIP_OPT = '3d model/3d trouser shirt/tulip-trouser/optimized';

function tulipPath(fileName: string): string {
  return `${TULIP_OPT}/${fileName}`;
}

const TULIP_TROUSER_GLBS: TulipTrouserGlbMap = {
  round: {
    full: tulipPath('round-neck-full-sleeve.glb'),
    bell: tulipPath('round-neck-bell-sleeve.glb'),
    puff: tulipPath('round-neck-puff-sleeve.glb'),
  },
  collar: {
    full: tulipPath('collar-neck-full-sleeve.glb'),
    bell: tulipPath('collar-neck-bell-sleeve.glb'),
    puff: tulipPath('collar-neck-puff-sleeve.glb'),
  },
  keyhole: {
    full: tulipPath('keyhole-neck-full-sleeve.glb'),
    bell: tulipPath('keyhole-neck-bell-sleeve.glb'),
    puff: tulipPath('keyhole-neck-puff-sleeve.glb'),
  },
};

export function resolveTrouserShirtTulipTrouserGlb(
  s: Parameters<typeof resolveTulipTrouserGlbFromMap>[1],
  modelId: string,
): string | null {
  return resolveTulipTrouserGlbFromMap(TULIP_TROUSER_GLBS, s, modelId);
}
