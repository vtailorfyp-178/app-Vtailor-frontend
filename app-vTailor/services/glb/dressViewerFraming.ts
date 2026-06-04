/** Shared dress 3D camera framing — editor panel vs full-screen presentation. */

export type DressViewerFramingMode = 'editor' | 'presentation';

/** Three.js fitDressCamera distance multiplier — lower = closer (more zoom). */
export const DRESS_CAMERA_FIT_MULTIPLIER: Record<DressViewerFramingMode, number> = {
  editor: 1.26,
  presentation: 1.12,
};

/** Google model-viewer orbit radius scale (× maxDim for % suffix). Lower = closer. */
export const DRESS_MODEL_VIEWER_ORBIT_SCALE: Record<DressViewerFramingMode, number> = {
  editor: 102,
  presentation: 90,
};

export function dressCameraFitMultiplier(mode: DressViewerFramingMode = 'editor'): number {
  return DRESS_CAMERA_FIT_MULTIPLIER[mode];
}

export function dressCameraOrbitRadius(maxDim: number, mode: DressViewerFramingMode = 'editor'): string {
  return `${Math.round(maxDim * DRESS_MODEL_VIEWER_ORBIT_SCALE[mode])}%`;
}
