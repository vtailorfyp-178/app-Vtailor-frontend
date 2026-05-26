/** Shared Google model-viewer settings for full-length dress GLBs. */

export type ModelViewerElement = HTMLElement & {
  updateFraming?: () => void;
  getDimensions?: () => { x: number; y: number; z: number };
  getBoundingBoxCenter?: () => { x: number; y: number; z: number };
  cameraTarget?: string;
  cameraOrbit?: string;
  fieldOfView?: string;
  zoom?: (delta: number) => void;
};

/** Eye-level front view (polar ~88°), not top-down. */
export const DRESS_CAMERA_ORBIT_DEFAULT = '0deg 88deg auto';
export const DRESS_CAMERA_FOV_DEFAULT = '22deg';

export function dressCameraOrbitRadius(maxDim: number): string {
  return `${Math.round(maxDim * 102)}%`;
}

export const DRESS_MODEL_VIEWER_ATTRS: Record<string, string> = {
  'camera-controls': '',
  'touch-action': 'none',
  'auto-rotate': 'false',
  'min-camera-orbit': 'auto 88deg auto',
  'max-camera-orbit': 'auto 88deg auto',
  'shadow-intensity': '1',
  exposure: '1.35',
  'tone-mapping': 'aces',
  'environment-image': 'neutral',
  'interaction-prompt': 'none',
  'camera-orbit': DRESS_CAMERA_ORBIT_DEFAULT,
  'field-of-view': DRESS_CAMERA_FOV_DEFAULT,
  alt: 'Dress 3D preview',
};

export function applyModelViewerAttrs(el: HTMLElement, attrs = DRESS_MODEL_VIEWER_ATTRS): void {
  Object.entries(attrs).forEach(([name, value]) => {
    if (value === '') el.setAttribute(name, '');
    else el.setAttribute(name, value);
  });
}

/** Center on real bbox center (GLB origin is often off — fixes tiny/corner dress). */
export function frameDressModelViewer(mv: ModelViewerElement): void {
  try {
    const center = mv.getBoundingBoxCenter?.();
    const dim = mv.getDimensions?.();

    if (center) {
      mv.cameraTarget = `${center.x.toFixed(3)}m ${center.y.toFixed(3)}m ${center.z.toFixed(3)}m`;
    }

    if (dim && dim.y > 0.01) {
      const maxDim = Math.max(dim.x, dim.y, dim.z);
      mv.cameraOrbit = `0deg 88deg ${dressCameraOrbitRadius(maxDim)}`;
      mv.fieldOfView = DRESS_CAMERA_FOV_DEFAULT;
    }

    if (typeof mv.updateFraming === 'function') {
      mv.updateFraming();
    }
  } catch {
    try {
      mv.updateFraming?.();
    } catch {
      /* ignore */
    }
  }
}

export function scheduleDressModelFraming(mv: ModelViewerElement, onReady?: () => void): void {
  const run = () => {
    frameDressModelViewer(mv);
    onReady?.();
  };
  run();
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(run);
  }
  for (const ms of [80, 200, 450, 900]) {
    setTimeout(run, ms);
  }
}
