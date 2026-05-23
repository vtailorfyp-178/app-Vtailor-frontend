import type { ImageSourcePropType, StyleProp, ViewStyle } from 'react-native';
import { MobileGlbWebViewer } from '@/components/MobileGlbWebViewer';

type Props = {
  glbUrl: string;
  width: number;
  height: number;
  fabricColorHex?: string | null;
  weddingColorHex?: string | null;
  fallbackImage?: ImageSourcePropType | null;
  style?: StyleProp<ViewStyle>;
  isUpdating?: boolean;
};

/** Native / default: Google model-viewer inside WebView (full GLB materials). */
export function GlbHtmlModelViewer(props: Props) {
  return <MobileGlbWebViewer {...props} />;
}
