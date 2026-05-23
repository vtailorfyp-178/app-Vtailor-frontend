import { Platform } from 'react-native';
import type { GlbModelPath } from './glbModelUrl';

/** Web / full-quality: never use compressed mobile folder. */
export function useFullQualityGlbPath(path: GlbModelPath): GlbModelPath {
  if (!path.includes('/mobile/')) return path;
  return path.replace(/\/mobile\//g, '/');
}

/** Insert `mobile/` before filename (matches on-disk layout for party/wedding GLBs). */
export function toMobileGlbPath(path: GlbModelPath): GlbModelPath {
  if (path.includes('/mobile/')) return path;
  const lastSlash = path.lastIndexOf('/');
  if (lastSlash < 0) return path;
  return `${path.slice(0, lastSlash)}/mobile/${path.slice(lastSlash + 1)}`;
}

/** Native: smaller mobile GLBs (faster, less RAM). Web: full-quality files. */
export function resolveGlbPathForPlatform(path: GlbModelPath): GlbModelPath {
  if (Platform.OS === 'web') return useFullQualityGlbPath(path);
  return toMobileGlbPath(path);
}

export function isMobileGlbPath(path: GlbModelPath): boolean {
  return path.includes('/mobile/');
}
