/** Shared dress 3D camera framing — editor panel vs full-screen presentation. */

import type { TabId } from '@/services/glb/dressGlbTypes';
import { normalizeDressSelectionsForGlb } from '@/services/glb/threePreviewReadiness';

export type DressViewerFramingMode = 'editor' | 'presentation';

export type DressFramingContext = {
  modelId?: string | null;
  selections?: Partial<Record<TabId, string | null>> | null;
};

/** Per-profile zoom-out scale (1 = default). Higher = farther camera = smaller dress in frame. */
export type DressFramingProfile = {
  fitScale: number;
  orbitScale: number;
  fovDeg?: number;
};

/** Three.js fitDressCamera distance multiplier — higher = farther camera = smaller dress in frame. */
export const DRESS_CAMERA_FIT_MULTIPLIER: Record<DressViewerFramingMode, number> = {
  editor: 2.08,
  presentation: 1.88,
};

/** Google model-viewer orbit radius scale (× maxDim for % suffix). Higher = farther = smaller dress. */
export const DRESS_MODEL_VIEWER_ORBIT_SCALE: Record<DressViewerFramingMode, number> = {
  editor: 168,
  presentation: 148,
};

export const DRESS_CAMERA_FOV_DEFAULT = '24deg';

const DEFAULT_PROFILE: DressFramingProfile = { fitScale: 1.14, orbitScale: 1.12, fovDeg: 24 };

const MODEL_PROFILES: Record<string, DressFramingProfile> = {
  'long-frock': { fitScale: 1.22, orbitScale: 1.18, fovDeg: 25 },
  saree: { fitScale: 1.38, orbitScale: 1.32, fovDeg: 26 },
  'grarah-short-shirt': { fitScale: 1.26, orbitScale: 1.22, fovDeg: 25 },
  'grarah-peplum': { fitScale: 1.28, orbitScale: 1.24, fovDeg: 25 },
  sharara: { fitScale: 1.26, orbitScale: 1.22, fovDeg: 25 },
  'shalwar-kameez': { fitScale: 1.36, orbitScale: 1.3, fovDeg: 26 },
  'shalwar-kameez-long': { fitScale: 1.38, orbitScale: 1.32, fovDeg: 26 },
  'shalwar-kameez-short': { fitScale: 1.36, orbitScale: 1.3, fovDeg: 26 },
  'short-frock-shalwar': { fitScale: 1.36, orbitScale: 1.3, fovDeg: 26 },
  'short-frock': { fitScale: 1.2, orbitScale: 1.16, fovDeg: 25 },
  gown: { fitScale: 1.24, orbitScale: 1.2, fovDeg: 25 },
  kurti: { fitScale: 1.18, orbitScale: 1.14, fovDeg: 25 },
  'kurti-trouser': { fitScale: 1.22, orbitScale: 1.18, fovDeg: 25 },
  'trouser-shirt-bell-bottom': { fitScale: 1.34, orbitScale: 1.28, fovDeg: 26 },
  'trouser-shirt-tulip-trouser': { fitScale: 1.32, orbitScale: 1.26, fovDeg: 26 },
  'lehnga-bridal': { fitScale: 1.38, orbitScale: 1.32, fovDeg: 26 },
  'lehnga-circular': { fitScale: 1.36, orbitScale: 1.3, fovDeg: 26 },
  lehnga: { fitScale: 1.36, orbitScale: 1.3, fovDeg: 26 },
};

type FramingRule = {
  match: (ctx: Required<Pick<DressFramingContext, 'modelId'>> & DressFramingContext) => boolean;
  profile: DressFramingProfile;
};

/** Specific combinations called out for oversized GLBs — extra pull-back. */
const VARIATION_RULES: FramingRule[] = [
  {
    match: (c) => c.modelId === 'long-frock' && c.selections?.['frock-style'] === 'front-slit',
    profile: { fitScale: 1.42, orbitScale: 1.36, fovDeg: 26 },
  },
  {
    match: (c) => c.modelId === 'long-frock' && c.selections?.['frock-style'] === 'flared-bottom',
    profile: { fitScale: 1.3, orbitScale: 1.26, fovDeg: 25 },
  },
  {
    match: (c) => c.modelId === 'saree' && c.selections?.['saree-style'] === 'plain',
    profile: { fitScale: 1.44, orbitScale: 1.36, fovDeg: 27 },
  },
  {
    match: (c) => c.modelId === 'saree' && c.selections?.['saree-style'] === 'frill',
    profile: { fitScale: 1.5, orbitScale: 1.4, fovDeg: 27 },
  },
  {
    match: (c) => c.modelId === 'grarah-peplum',
    profile: { fitScale: 1.34, orbitScale: 1.28, fovDeg: 26 },
  },
  {
    match: (c) => c.modelId === 'grarah-short-shirt',
    profile: { fitScale: 1.3, orbitScale: 1.26, fovDeg: 25 },
  },
  {
    match: (c) =>
      c.modelId === 'shalwar-kameez-short' ||
      c.modelId === 'short-frock-shalwar',
    profile: { fitScale: 1.44, orbitScale: 1.36, fovDeg: 27 },
  },
  {
    match: (c) => c.modelId === 'shalwar-kameez' || c.modelId === 'shalwar-kameez-long',
    profile: { fitScale: 1.42, orbitScale: 1.34, fovDeg: 27 },
  },
  {
    match: (c) => c.modelId === 'trouser-shirt-bell-bottom',
    profile: { fitScale: 1.42, orbitScale: 1.34, fovDeg: 27 },
  },
  {
    match: (c) => c.modelId === 'trouser-shirt-tulip-trouser',
    profile: { fitScale: 1.4, orbitScale: 1.32, fovDeg: 27 },
  },
];

export function dressFramingContext(
  modelId?: string | null,
  selections?: Partial<Record<TabId, string | null>> | null,
): DressFramingContext {
  if (!modelId) return {};
  const base: Record<TabId, string | null> = {
    neck: selections?.neck ?? null,
    sleeves: selections?.sleeves ?? null,
    bottom: selections?.bottom ?? null,
    'frock-style': selections?.['frock-style'] ?? null,
    colors: selections?.colors ?? null,
    'saree-style': selections?.['saree-style'] ?? null,
    'fabric-print': selections?.['fabric-print'] ?? null,
  };
  return {
    modelId,
    selections: normalizeDressSelectionsForGlb(modelId, base),
  };
}

export function resolveDressFramingProfile(ctx?: DressFramingContext | null): DressFramingProfile {
  if (!ctx?.modelId) return DEFAULT_PROFILE;

  const normalized = dressFramingContext(ctx.modelId, ctx.selections);
  const withId = { ...normalized, modelId: normalized.modelId! };

  for (const rule of VARIATION_RULES) {
    if (rule.match(withId)) return rule.profile;
  }

  const modelProfile = MODEL_PROFILES[withId.modelId];
  return modelProfile ?? DEFAULT_PROFILE;
}

export function dressCameraFitMultiplier(
  mode: DressViewerFramingMode = 'editor',
  ctx?: DressFramingContext | null,
): number {
  const profile = resolveDressFramingProfile(ctx);
  return DRESS_CAMERA_FIT_MULTIPLIER[mode] * profile.fitScale;
}

export function dressCameraOrbitRadius(
  maxDim: number,
  mode: DressViewerFramingMode = 'editor',
  ctx?: DressFramingContext | null,
): string {
  const profile = resolveDressFramingProfile(ctx);
  return `${Math.round(maxDim * DRESS_MODEL_VIEWER_ORBIT_SCALE[mode] * profile.orbitScale)}%`;
}

export function dressCameraFieldOfView(ctx?: DressFramingContext | null): string {
  const deg = resolveDressFramingProfile(ctx).fovDeg ?? 24;
  return `${deg}deg`;
}

export function dressModelViewerOrbitScaleNumber(
  mode: DressViewerFramingMode = 'editor',
  ctx?: DressFramingContext | null,
): number {
  const profile = resolveDressFramingProfile(ctx);
  return DRESS_MODEL_VIEWER_ORBIT_SCALE[mode] * profile.orbitScale;
}
