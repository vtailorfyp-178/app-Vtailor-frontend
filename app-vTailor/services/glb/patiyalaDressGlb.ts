/**

 * Patiyala GLBs (web) — full quality.

 */

import { resolveCasualPatiyalaShortShirtGlbFromMap } from './patiyalaDressGlb.shared';
import { PATIYALA_GLBS_WEB } from './patiyalaDressGlb.paths';



export function resolveCasualPatiyalaShortShirtGlb(

  s: Parameters<typeof resolveCasualPatiyalaShortShirtGlbFromMap>[1],

  modelId: string,

): string | null {

  return resolveCasualPatiyalaShortShirtGlbFromMap(PATIYALA_GLBS_WEB, s, modelId);

}


