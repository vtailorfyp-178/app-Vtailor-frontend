/**
 * Resolves GLB paths per dress. Chunk imports use Metro `.native.ts` on phone (mobile/)
 * and `.ts` on web (full quality).
 */

import type { DressSelections } from './glb/dressGlbTypes';
import { isCasualShortShirtModelId } from './glb/dressGlbTypes';

export type { TabId, DressSelections } from './glb/dressGlbTypes';
export type { GlbModelPath } from './glb/glbModelUrl';

async function resolveDressGlbPath(s: DressSelections, modelId: string): Promise<string | null> {
  if (isCasualShortShirtModelId(modelId)) {
    const { resolveCasualPatiyalaShortShirtGlb } = await import('./glb/patiyalaDressGlb');
    const patiyalaModelId =
      modelId === 'short-frock-shalwar' ? 'shalwar-kameez-short' : modelId;
    return resolveCasualPatiyalaShortShirtGlb(s, patiyalaModelId);
  }

  if (modelId === 'long-frock') {
    const { resolveBundledLongFrockGlb } = await import('./glb/chunks/longFrockGlb');
    return resolveBundledLongFrockGlb(s);
  }

  if (modelId === 'saree') {
    const { resolveBundledSareeGlb } = await import('./glb/chunks/sareeGlb');
    return resolveBundledSareeGlb(s);
  }

  if (modelId === 'lehnga-bridal') {
    const { resolveBundledBridalLehngaGlb } = await import('./glb/chunks/lehngaBridalGlb');
    return resolveBundledBridalLehngaGlb(s);
  }

  if (modelId === 'lehnga-circular') {
    const { resolveBundledCircularLehngaGlb } = await import('./glb/chunks/lehngaCircularGlb');
    return resolveBundledCircularLehngaGlb(s);
  }

  if (modelId === 'grarah-short-shirt') {
    const { resolveBundledGrarahShirtGlb } = await import('./glb/chunks/grarahShirtGlb');
    return resolveBundledGrarahShirtGlb(s);
  }

  if (modelId === 'grarah-peplum') {
    const { resolveBundledGrarahPeplumGlb } = await import('./glb/chunks/grarahPeplumGlb');
    return resolveBundledGrarahPeplumGlb(s);
  }

  return null;
}

export async function resolveBundledDressGlbAsync(
  s: DressSelections,
  mid: string,
): Promise<string | null> {
  if (!mid) return null;
  return resolveDressGlbPath(s, mid);
}
