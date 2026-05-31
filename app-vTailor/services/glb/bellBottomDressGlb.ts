import {
  resolveBellBottomGlbFromMap,
  type BellBottomGlbMap,
} from './bellBottomDressGlb.shared';

const BELL_OPT = '3d model/3d trouser shirt/bell-bottom/optimized';

function bellPath(fileName: string): string {
  return `${BELL_OPT}/${fileName}`;
}

const BELL_BOTTOM_GLBS: BellBottomGlbMap = {
  round: {
    straight: bellPath('round-neck-straight-sleeve.glb'),
    puff: bellPath('round-neck-puff-sleeve.glb'),
    'flared-bell': bellPath('round-neck-flared-bell-sleeve.glb'),
  },
  collar: {
    straight: bellPath('collar-neck-straight-sleeve.glb'),
    puff: bellPath('collar-neck-puff-sleeve.glb'),
    'flared-bell': bellPath('collar-neck-flared-bell-sleeve.glb'),
  },
  keyhole: {
    straight: bellPath('keyhole-straight-sleeve.glb'),
    puff: bellPath('keyhole-puff-sleeve.glb'),
    'flared-bell': bellPath('keyhole-flared-bell-sleeve.glb'),
  },
};

export function resolveTrouserShirtBellBottomGlb(
  s: Parameters<typeof resolveBellBottomGlbFromMap>[1],
  modelId: string,
): string | null {
  return resolveBellBottomGlbFromMap(BELL_BOTTOM_GLBS, s, modelId);
}
