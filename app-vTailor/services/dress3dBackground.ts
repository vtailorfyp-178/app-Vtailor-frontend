import type { ImageSourcePropType } from 'react-native';

/** 3D scene backdrops removed — models render on plain background only. */
export function resolveDress3dBackgroundImage(_modelId: string): ImageSourcePropType | null {
  return null;
}
