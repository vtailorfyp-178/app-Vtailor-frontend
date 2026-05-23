import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { glbNeedsEmbeddedTextures } from '@/services/glb/glbMaterialPolicy';
import {
  buildModelViewerShellHtml,
  injectModelViewerFabricColorScript,
  injectModelViewerGlbScript,
  injectModelViewerWeddingColorScript,
  modelViewerBaseUrl,
} from '@/services/glb/modelViewerHtml';

type Props = {
  glbUrl: string;
  width: number;
  height: number;
  fabricColorHex?: string | null;
  weddingColorHex?: string | null;
  fallbackImage?: ImageSourcePropType | null;
  style?: StyleProp<ViewStyle>;
  /** Show spinner while a new GLB is loading (previous model may stay visible underneath). */
  isUpdating?: boolean;
};

type LoadState = 'loading' | 'ready' | 'error';

const SHELL_HTML = buildModelViewerShellHtml();

export function MobileGlbWebViewer({
  glbUrl,
  width,
  height,
  fabricColorHex = null,
  weddingColorHex = null,
  fallbackImage,
  style,
  isUpdating = false,
}: Props): React.ReactElement {
  const webRef = useRef<WebView>(null);
  const shellReadyRef = useRef(false);
  const baseUrl = useMemo(() => modelViewerBaseUrl(glbUrl), [glbUrl]);
  const [state, setState] = useState<LoadState>('loading');

  const injectGlb = useCallback((url: string) => {
    if (!url || !webRef.current || !shellReadyRef.current) return;
    webRef.current.injectJavaScript(injectModelViewerGlbScript(url));
  }, []);

  const injectFabricColor = useCallback((hex: string | null, url: string) => {
    if (!webRef.current || !shellReadyRef.current) return;
    const tintHex = hex && !glbNeedsEmbeddedTextures(url) ? hex : null;
    webRef.current.injectJavaScript(injectModelViewerFabricColorScript(tintHex));
  }, []);

  const injectWeddingColor = useCallback((hex: string | null, url: string) => {
    if (!webRef.current || !shellReadyRef.current) return;
    const tintHex = hex && !glbNeedsEmbeddedTextures(url) ? hex : null;
    webRef.current.injectJavaScript(injectModelViewerWeddingColorScript(tintHex));
  }, []);

  useEffect(() => {
    if (!glbUrl) return;
    if (shellReadyRef.current) {
      setState((s) => (s === 'error' ? s : 'loading'));
      injectGlb(glbUrl);
      injectFabricColor(fabricColorHex ?? null, glbUrl);
      injectWeddingColor(weddingColorHex ?? null, glbUrl);
    }
  }, [glbUrl, fabricColorHex, weddingColorHex, injectGlb, injectFabricColor, injectWeddingColor]);

  const showOverlay = state === 'loading' || isUpdating;

  if (state === 'error') {
    return (
      <View style={[styles.wrap, { width, height }, style]}>
        {fallbackImage ? (
          <Image source={fallbackImage} style={styles.fallbackImage} resizeMode="contain" />
        ) : null}
        <Text style={styles.errText}>
          3D preview could not load. Check Wi‑Fi and that Cloudinary models are set in .env.
        </Text>
      </View>
    );
  }

  return (
    <View style={[{ width, height, overflow: 'hidden' }, style]}>
      <WebView
        ref={webRef}
        source={{ html: SHELL_HTML, baseUrl }}
        style={styles.webview}
        originWhitelist={['*']}
        cacheEnabled
        cacheMode="LOAD_CACHE_ELSE_NETWORK"
        androidLayerType="hardware"
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        setSupportMultipleWindows={false}
        mixedContentMode={Platform.OS === 'android' ? 'always' : 'compatibility'}
        allowsFullscreenVideo
        onLoadEnd={() => {
          shellReadyRef.current = true;
          injectGlb(glbUrl);
          injectFabricColor(fabricColorHex ?? null, glbUrl);
          injectWeddingColor(weddingColorHex ?? null, glbUrl);
        }}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data) as { type?: string };
            if (data.type === 'ready') {
              shellReadyRef.current = true;
              injectGlb(glbUrl);
              injectFabricColor(fabricColorHex ?? null, glbUrl);
              injectWeddingColor(weddingColorHex ?? null, glbUrl);
            }
            if (data.type === 'loading') setState('loading');
            if (data.type === 'loaded') {
              setState('ready');
              injectFabricColor(fabricColorHex ?? null, glbUrl);
              injectWeddingColor(weddingColorHex ?? null, glbUrl);
            }
            if (data.type === 'error') {
              setTimeout(() => setState((s) => (s === 'loading' ? 'error' : s)), 2000);
            }
          } catch {
            /* ignore */
          }
        }}
        onHttpError={() => setState('error')}
        onError={() => setState('error')}
      />
      {showOverlay ? (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color="#64748b" />
          <Text style={styles.loadingText}>Loading 3D dress…</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  webview: {
    flex: 1,
    backgroundColor: '#f4f6f8',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(244,246,248,0.75)',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: '#f4f6f8',
  },
  fallbackImage: { width: '88%', height: '62%', marginBottom: 8 },
  errText: { fontSize: 13, color: '#64748b', textAlign: 'center', fontWeight: '600' },
});
