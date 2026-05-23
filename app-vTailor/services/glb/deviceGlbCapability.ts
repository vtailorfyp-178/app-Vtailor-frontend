import { Platform } from 'react-native';

/** Full 27MB GLBs only on web; native Patiyala uses compressed `mobile/` assets (~2.5MB). */
export function canLoadHeavyDressGlb(): boolean {
  return true;
}



export function usesMobileOptimizedGlb(): boolean {

  return Platform.OS !== 'web';

}


