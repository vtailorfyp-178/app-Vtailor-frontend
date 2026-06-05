import type { ImageSourcePropType, StyleProp, ViewStyle } from 'react-native';
import type { FabricPatternMeta } from '@/services/glb/fabricPrintSelection';
import type { DressFramingContext, DressViewerFramingMode } from '@/services/glb/dressViewerFraming';
import { MobileGlbWebViewer } from '@/components/MobileGlbWebViewer';

type Props = {
  glbUrl: string;
  width: number;
  height: number;
  fabricColorHex?: string | null;
  fabricTextureUrl?: string | null;
  fabricPatternMeta?: FabricPatternMeta | null;
  weddingColorHex?: string | null;
  fallbackImage?: ImageSourcePropType | null;
  style?: StyleProp<ViewStyle>;
  isUpdating?: boolean;
  framing?: DressViewerFramingMode;
  modelId?: string | null;
  selections?: DressFramingContext['selections'];
};

/** Native / default: Google model-viewer inside WebView (full GLB materials). */
export function GlbHtmlModelViewer(props: Props) {
  return <MobileGlbWebViewer {...props} />;
}
