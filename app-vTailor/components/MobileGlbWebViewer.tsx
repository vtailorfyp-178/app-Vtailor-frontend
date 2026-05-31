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
import { glbAllowsCasualFabricRuntimeTint, glbAllowsRuntimeFabricTexture } from '@/services/glb/casualFabricDress';
import {
  fabricPrintPatternMeta,
  fabricPrintTileUrl,
  type FabricPatternMeta,
} from '@/services/glb/fabricPrintSelection';
import { glbNeedsEmbeddedTextures } from '@/services/glb/glbMaterialPolicy';
import {
  buildModelViewerShellHtml,
  injectModelViewerFabricColorScript,
  injectModelViewerFabricTextureScript,
  injectModelViewerGlbScript,
  injectModelViewerWeddingColorScript,
  modelViewerBaseUrl,
} from '@/services/glb/modelViewerHtml';

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
  /** Show spinner while a new GLB is loading (previous model may stay visible underneath). */
  isUpdating?: boolean;
};

type LoadState = 'loading' | 'ready' | 'error';

const SHELL_HTML = buildModelViewerShellHtml();
const INJECT_DEBOUNCE_MS = 48;

export const MobileGlbWebViewer = React.memo(function MobileGlbWebViewer({
  glbUrl,
  width,
  height,
  fabricColorHex = null,
  fabricTextureUrl = null,
  fabricPatternMeta = null,
  weddingColorHex = null,
  fallbackImage,
  style,
  isUpdating: _isUpdating = false,
}: Props): React.ReactElement {
  void _isUpdating;
  const webRef = useRef<WebView>(null);
  const shellReadyRef = useRef(false);
  const glbUrlRef = useRef(glbUrl);
  const injectGenRef = useRef(0);
  const injectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fabricColorRef = useRef(fabricColorHex);
  const fabricTextureRef = useRef(fabricTextureUrl);
  const fabricPatternMetaRef = useRef(fabricPatternMeta);
  const weddingColorRef = useRef(weddingColorHex);
  fabricColorRef.current = fabricColorHex ?? null;
  fabricTextureRef.current = fabricTextureUrl ?? null;
  fabricPatternMetaRef.current = fabricPatternMeta;
  weddingColorRef.current = weddingColorHex ?? null;
  const baseUrl = useMemo(() => modelViewerBaseUrl(glbUrl), [glbUrl]);
  const [state, setState] = useState<LoadState>('loading');

  glbUrlRef.current = glbUrl;

  const injectGlb = useCallback((url: string) => {
    if (!url || !webRef.current || !shellReadyRef.current) return;
    webRef.current.injectJavaScript(injectModelViewerGlbScript(url));
  }, []);

  const injectFabricColor = useCallback((hex: string | null, url: string) => {
    if (!webRef.current || !shellReadyRef.current) return;
    if (fabricTextureRef.current) return;
    const tintHex =
      hex && (glbAllowsCasualFabricRuntimeTint(url) || !glbNeedsEmbeddedTextures(url)) ? hex : null;
    webRef.current.injectJavaScript(injectModelViewerFabricColorScript(tintHex));
  }, []);

  const injectFabricTexture = useCallback((texRaw: string | null, url: string) => {
    if (!webRef.current || !shellReadyRef.current) return;
    const tileUrl = texRaw ? fabricPrintTileUrl(texRaw) ?? texRaw : null;
    const allowed = tileUrl && glbAllowsRuntimeFabricTexture(url);
    const meta = texRaw ? fabricPrintPatternMeta(texRaw) : fabricPatternMetaRef.current;
    webRef.current.injectJavaScript(
      injectModelViewerFabricTextureScript(allowed ? tileUrl : null, allowed ? meta : null),
    );
  }, []);

  const injectWeddingColor = useCallback((hex: string | null, url: string) => {
    if (!webRef.current || !shellReadyRef.current) return;
    const tintHex =
      hex && (glbAllowsCasualFabricRuntimeTint(url) || !glbNeedsEmbeddedTextures(url)) ? hex : null;
    webRef.current.injectJavaScript(injectModelViewerWeddingColorScript(tintHex));
  }, []);

  const scheduleGlbInject = useCallback(
    (url: string) => {
      if (!url) return;
      const gen = (injectGenRef.current += 1);
      if (injectTimerRef.current) clearTimeout(injectTimerRef.current);
      injectTimerRef.current = setTimeout(() => {
        if (gen !== injectGenRef.current || glbUrlRef.current !== url) return;
        if (!shellReadyRef.current) return;
        setState((s) => (s === 'error' ? 'loading' : s === 'ready' ? s : 'loading'));
        injectGlb(url);
        injectFabricTexture(fabricTextureRef.current, url);
        injectFabricColor(fabricColorRef.current, url);
        injectWeddingColor(weddingColorRef.current, url);
      }, INJECT_DEBOUNCE_MS);
    },
    [injectGlb, injectFabricColor, injectFabricTexture, injectWeddingColor],
  );

  useEffect(() => {
    if (!glbUrl) return;
    setState((s) => (s === 'error' ? 'loading' : s));
    scheduleGlbInject(glbUrl);
    return () => {
      if (injectTimerRef.current) clearTimeout(injectTimerRef.current);
    };
  }, [glbUrl, scheduleGlbInject]);

  useEffect(() => {
    if (!glbUrl || !shellReadyRef.current) return;
    injectFabricTexture(fabricTextureUrl ?? null, glbUrl);
    injectFabricColor(fabricColorHex ?? null, glbUrl);
    injectWeddingColor(weddingColorHex ?? null, glbUrl);
  }, [fabricColorHex, fabricTextureUrl, weddingColorHex, glbUrl, injectFabricColor, injectFabricTexture, injectWeddingColor]);

  const showOverlay = state === 'loading';

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
        overScrollMode="never"
        nestedScrollEnabled={false}
        scrollEnabled={false}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        setSupportMultipleWindows={false}
        mixedContentMode={Platform.OS === 'android' ? 'always' : 'compatibility'}
        allowsFullscreenVideo
        onLoadEnd={() => {
          shellReadyRef.current = true;
          scheduleGlbInject(glbUrlRef.current);
        }}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data) as { type?: string };
            const activeUrl = glbUrlRef.current;
            if (data.type === 'ready') {
              shellReadyRef.current = true;
              scheduleGlbInject(activeUrl);
            }
            if (data.type === 'loading') {
              setState((s) => (s === 'error' ? s : 'loading'));
            }
            if (data.type === 'loaded') {
              setState('ready');
              injectFabricTexture(fabricTextureUrl ?? null, activeUrl);
              injectFabricColor(fabricColorHex ?? null, activeUrl);
              injectWeddingColor(weddingColorHex ?? null, activeUrl);
            }
            if (data.type === 'error') {
              setTimeout(() => {
                if (glbUrlRef.current === activeUrl) {
                  setState((s) => (s === 'loading' ? 'error' : s));
                }
              }, 1800);
            }
          } catch {
            /* ignore */
          }
        }}
        onHttpError={() => {
          if (glbUrlRef.current === glbUrl) setState('error');
        }}
        onError={() => {
          if (glbUrlRef.current === glbUrl) setState('error');
        }}
      />
      {showOverlay ? (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color="#64748b" />
          <Text style={styles.loadingText}>Loading 3D dress…</Text>
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  webview: {
    flex: 1,
    backgroundColor: '#f4f6f8',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(244,246,248,0.55)',
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
