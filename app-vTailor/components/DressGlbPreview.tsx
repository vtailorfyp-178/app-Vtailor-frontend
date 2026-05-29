import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { Image, Platform, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import { TraditionalDressGlbViewer } from '@/components/TraditionalDressGlbViewer';
import { GlbHtmlModelViewer } from '@/components/GlbHtmlModelViewer';

type Props = {
  glbUrl: string;
  width: number;
  height: number;
  fabricColorHex?: string | null;
  /** @deprecated Grarah uses per-variant GLB files — no runtime wedding tint. */
  weddingColorHex?: string | null;
  backgroundImage?: ImageSourcePropType | null;
  fallbackImage?: ImageSourcePropType | null;
  loadError?: string | null;
  isUpdating?: boolean;
};

/** Web only — native uses WebView (model-viewer) because Draco/DRACOLoader breaks on RN. */
function useThreeJsDressPreview(glbUrl: string): boolean {
  if (Platform.OS === 'web') return true;
  void glbUrl;
  return false;
}

/**
 * Three.js for all dress GLBs — chiffon materials, front framing, touch rotate/pan.
 * WebView fallback only for non-HTTP local dev URLs.
 */
export function DressGlbPreview(props: Props): React.ReactElement {
  const useThreeJs = useThreeJsDressPreview(props.glbUrl);

  if (props.loadError || !props.glbUrl || props.glbUrl === 'about:blank') {
    return (
      <FallbackPanel
        message={props.loadError ?? 'Could not load 3D model.'}
        image={props.fallbackImage}
        width={props.width}
        height={props.height}
      />
    );
  }

  if (!useThreeJs) {
    return (
      <GlbHtmlModelViewer
        glbUrl={props.glbUrl}
        width={props.width}
        height={props.height}
        fabricColorHex={props.fabricColorHex}
        weddingColorHex={props.weddingColorHex}
        fallbackImage={props.fallbackImage ?? props.backgroundImage}
        isUpdating={props.isUpdating}
      />
    );
  }

  return (
    <ThreePreviewCrashBoundary {...props}>
      <TraditionalDressGlbViewer
        glbUrl={props.glbUrl}
        width={props.width}
        height={props.height}
        fabricColorHex={props.fabricColorHex}
        weddingColorHex={props.weddingColorHex}
        backgroundImage={props.backgroundImage}
        isUpdating={props.isUpdating}
      />
    </ThreePreviewCrashBoundary>
  );
}

type BoundaryState = { crashed: boolean };

class ThreePreviewCrashBoundary extends Component<Props & { children: ReactNode }, BoundaryState> {
  state: BoundaryState = { crashed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { crashed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.warn('[DressGlbPreview:three]', error.message, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.crashed) {
      if (Platform.OS !== 'web' && this.props.glbUrl && /^https?:\/\//i.test(this.props.glbUrl)) {
        return (
          <GlbHtmlModelViewer
            glbUrl={this.props.glbUrl}
            width={this.props.width}
            height={this.props.height}
            fabricColorHex={this.props.fabricColorHex}
            weddingColorHex={this.props.weddingColorHex}
            fallbackImage={this.props.fallbackImage ?? this.props.backgroundImage}
            isUpdating={this.props.isUpdating}
          />
        );
      }
      return (
        <FallbackPanel
          message="3D preview is unavailable."
          image={this.props.fallbackImage}
          width={this.props.width}
          height={this.props.height}
        />
      );
    }
    return this.props.children;
  }
}

function FallbackPanel({
  message,
  image,
  width,
  height,
}: {
  message: string;
  image?: ImageSourcePropType | null;
  width: number;
  height: number;
}) {
  return (
    <View style={[styles.wrap, { width, height }]}>
      {image ? <Image source={image} style={styles.image} resizeMode="contain" /> : null}
      <Text style={styles.msg}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: '#f4f6f8',
  },
  image: { width: '88%', height: '62%', marginBottom: 8 },
  msg: { fontSize: 13, color: '#64748b', textAlign: 'center', fontWeight: '600' },
});
