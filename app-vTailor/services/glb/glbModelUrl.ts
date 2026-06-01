import { Platform } from 'react-native';
import { getCandidateBaseUrls } from '@/services/apiBase';
import { apiBaseToOrigin, defaultApiOriginFromEnv } from '@/services/glb/glbApiOrigin';
import {
  ensureCloudinaryModelCatalog,
  getCloudinaryUrlForPath,
  useCloudinaryModels,
} from '@/services/glb/cloudinaryModelCatalog';

export { apiBaseToOrigin } from '@/services/glb/glbApiOrigin';

/** Relative path under backend `3dModels/` (e.g. `3d model/3d long frock/foo.glb`). */
export type GlbModelPath = string;

export const GLB_MODELS_MOUNT = '/3dModels';

/** Small Patiyala mobile GLB used when the selected variant fails to load. */
export const FALLBACK_GLB_PATH: GlbModelPath =
  '3d model/3d shalwar kameez/patiyala/white round neck full sleeves and patiyala shalwar.glb';

export {
  useFullQualityGlbPath,
  resolveGlbPathForPlatform,
  toMobileGlbPath,
} from './glbPathForDisplay';

/** Swap `/mobile/` segment in a built GLB URL (fallback when mobile asset missing). */
export function toFullQualityGlbUrl(url: string): string | null {
  if (!url.includes('/mobile/')) return null;
  return decodeURIComponent(url).replace('/mobile/', '/');
}

export function buildGlbModelUrl(relativePath: GlbModelPath, origin: string): string {
  const base = origin.replace(/\/$/, '');
  const encoded = relativePath
    .replace(/^\/+/, '')
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  return `${base}${GLB_MODELS_MOUNT}/${encoded}`;
}

/** Resolve host for static GLB URLs (Metro proxy on web dev, API host on native). */
export async function resolveGlbModelsOrigin(): Promise<string> {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

  const bases = await getCandidateBaseUrls();
  const first = bases[0];
  if (first) return apiBaseToOrigin(first);

  return defaultApiOriginFromEnv();
}

/**
 * Resolve GLB URL: bundled Cloudinary catalog first, then `/models` API, then local `/3dModels`.
 */
export async function resolveGlbModelUrl(relativePath: GlbModelPath): Promise<string> {
  if (useCloudinaryModels()) {
    const embeddedHit = getCloudinaryUrlForPath(relativePath);
    if (embeddedHit) return embeddedHit;

    try {
      await ensureCloudinaryModelCatalog();
      const cloudUrl = getCloudinaryUrlForPath(relativePath);
      if (cloudUrl) return cloudUrl;
    } catch (err) {
      console.warn('[glbModelUrl] Cloudinary catalog miss, using local API', err);
    }

    const norm = relativePath.replace(/\\/g, '/').toLowerCase();
    if (norm.includes('trouser shirt/bell-bottom') || norm.includes('bell-bottom/optimized')) {
      throw new Error(
        'Bell bottom 3D model is not on Cloudinary yet. Run compress:bell-bottom and upload:bell-bottom, then sync the catalog.',
      );
    }
    if (norm.includes('trouser shirt/tulip-trouser') || norm.includes('tulip-trouser/optimized')) {
      throw new Error(
        'Tulip trouser 3D model is not on Cloudinary yet. Run compress:tulip-trouser and upload:tulip-trouser, then sync the catalog.',
      );
    }

    if (Platform.OS !== 'web') {
      throw new Error(
        'This 3D dress variant is not in the Cloudinary catalog. Try another color or restart Expo after .env changes.',
      );
    }
  }

  const origin = await resolveGlbModelsOrigin();
  return buildGlbModelUrl(relativePath, origin);
}
