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
  fabricPrintMegatileUrl,
  fabricPrintTileUrl,
  type FabricPatternMeta,
} from '@/services/glb/fabricPrintSelection';
import { glbNeedsEmbeddedTextures } from '@/services/glb/glbMaterialPolicy';
import type { DressFramingContext, DressViewerFramingMode } from '@/services/glb/dressViewerFraming';
import { dressFramingContext } from '@/services/glb/dressViewerFraming';
import {
  buildModelViewerShellHtml,
  injectModelViewerFabricColorScript,
  injectModelViewerFabricTextureScript,
  injectModelViewerFramingScript,
  injectModelViewerGlbScript,
  injectModelViewerWeddingColorScript,
  modelViewerBaseUrl,
} from '@/services/glb/modelViewerHtml';
import {
  clearDiskCacheForUrl,
  getDiskCachedGlbFileUrl,
  waitForDiskCachedGlbFileUrl,
  warmGlbDiskCache,
} from '@/services/glb/glbDiskCache';

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
  framing?: DressViewerFramingMode;
  modelId?: string | null;
  selections?: DressFramingContext['selections'];
};

type LoadState = 'loading' | 'ready' | 'error';

const SHELL_HTML = buildModelViewerShellHtml();
const INJECT_DEBOUNCE_MS = 0;
const MAX_LOAD_RETRIES = 2;

function remoteGlbUrl(url: string): string | null {
  return /^https?:\/\//i.test(url) ? url : null;
}

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
  isUpdating = false,
  framing = 'editor',
  modelId = null,
  selections = null,
}: Props): React.ReactElement {
  const framingCtx = useMemo(
    () => dressFramingContext(modelId, selections),
    [modelId, selections],
  );
  const webRef = useRef<WebView>(null);
  const shellReadyRef = useRef(false);
  const glbUrlRef = useRef(glbUrl);
  const displayedUrlRef = useRef<string | null>(null);
  const retryCountRef = useRef(0);
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

  const remoteUrl = useMemo(() => remoteGlbUrl(glbUrl), [glbUrl]);
  const baseUrl = useMemo(
    () => (remoteUrl ? modelViewerBaseUrl(remoteUrl) : 'https://res.cloudinary.com'),
    [remoteUrl],
  );
  const [state, setState] = useState<LoadState>('loading');
  const [shownCatalogUrl, setShownCatalogUrl] = useState<string | null>(null);

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
    const megatileUrl = texRaw ? fabricPrintMegatileUrl(texRaw) : null;
    const allowed = tileUrl && glbAllowsRuntimeFabricTexture(url);
    const meta = texRaw ? fabricPrintPatternMeta(texRaw) : fabricPatternMetaRef.current;
    webRef.current.injectJavaScript(
      injectModelViewerFabricTextureScript(
        allowed ? tileUrl : null,
        allowed ? meta : null,
        allowed ? megatileUrl : null,
      ),
    );
  }, []);

  const injectFraming = useCallback(
    (mode: DressViewerFramingMode) => {
      webRef.current?.injectJavaScript(injectModelViewerFramingScript(mode, framingCtx));
    },
    [framingCtx],
  );

  const injectWeddingColor = useCallback((hex: string | null, url: string) => {
    if (!webRef.current || !shellReadyRef.current) return;
    const tintHex =
      hex && (glbAllowsCasualFabricRuntimeTint(url) || !glbNeedsEmbeddedTextures(url)) ? hex : null;
    webRef.current.injectJavaScript(injectModelViewerWeddingColorScript(tintHex));
  }, []);

  const scheduleGlbInject = useCallback(
    (catalogUrl: string, injectSrc?: string) => {
      const httpsUrl = remoteGlbUrl(catalogUrl);
      if (!httpsUrl) return;
      const src = injectSrc ?? httpsUrl;
      const gen = (injectGenRef.current += 1);
      if (injectTimerRef.current) clearTimeout(injectTimerRef.current);
      injectTimerRef.current = setTimeout(() => {
        if (gen !== injectGenRef.current || glbUrlRef.current !== catalogUrl) return;
        if (!shellReadyRef.current) return;
        const firstPaint = displayedUrlRef.current == null;
        if (firstPaint || !isUpdating) {
          setState((s) => (s === 'error' ? 'loading' : s === 'ready' ? s : 'loading'));
        }
        injectGlb(src);
        injectFabricTexture(fabricTextureRef.current, httpsUrl);
        injectFabricColor(fabricColorRef.current, httpsUrl);
        injectWeddingColor(weddingColorRef.current, httpsUrl);
        injectFraming(framing);
      }, INJECT_DEBOUNCE_MS);
    },
    [injectGlb, injectFabricColor, injectFabricTexture, injectWeddingColor, injectFraming, framing, isUpdating],
  );

  const resolveAndInject = useCallback(
    async (catalogUrl: string) => {
      const httpsUrl = remoteGlbUrl(catalogUrl);
      if (!httpsUrl) {
        setState('error');
        return;
      }

      const cachedFile = await getDiskCachedGlbFileUrl(httpsUrl);
      if (cachedFile) {
        scheduleGlbInject(catalogUrl, cachedFile);
        return;
      }

      warmGlbDiskCache(httpsUrl);
      scheduleGlbInject(catalogUrl, httpsUrl);

      void waitForDiskCachedGlbFileUrl(httpsUrl, 15_000).then((fileUrl) => {
        if (!fileUrl || glbUrlRef.current !== catalogUrl) return;
        if (displayedUrlRef.current === catalogUrl) return;
        scheduleGlbInject(catalogUrl, fileUrl);
      });
    },
    [scheduleGlbInject],
  );

  useEffect(() => {
    retryCountRef.current = 0;
    if (!remoteUrl) {
      setState('error');
      return;
    }
    if (!displayedUrlRef.current) {
      setState('loading');
    }
    void resolveAndInject(remoteUrl);
    return () => {
      if (injectTimerRef.current) clearTimeout(injectTimerRef.current);
    };
  }, [remoteUrl, resolveAndInject]);

  useEffect(() => {
    if (!remoteUrl || !shellReadyRef.current) return;
    injectFabricTexture(fabricTextureUrl ?? null, remoteUrl);
    injectFabricColor(fabricColorHex ?? null, remoteUrl);
    injectWeddingColor(weddingColorHex ?? null, remoteUrl);
  }, [fabricColorHex, fabricTextureUrl, weddingColorHex, remoteUrl, injectFabricColor, injectFabricTexture, injectWeddingColor]);

  const showOverlay = state === 'loading' && displayedUrlRef.current == null;

  return (
    <View style={[{ width, height, overflow: 'hidden' }, style]}>
      {!remoteUrl || state === 'error' ? (
        <View style={[styles.wrap, StyleSheet.absoluteFill]}>
          {fallbackImage ? (
            <Image source={fallbackImage} style={styles.fallbackImage} resizeMode="contain" />
          ) : null}
          <Text style={styles.errText}>
            {!remoteUrl
              ? '3D model URL is missing. Ensure EXPO_PUBLIC_USE_CLOUDINARY_MODELS=true in .env and restart Expo.'
              : '3D preview could not load. Check Wi‑Fi (same network as PC) and wait — large models can take up to 45 seconds.'}
          </Text>
        </View>
      ) : null}
      {remoteUrl && state !== 'error' ? (
      <WebView
        ref={webRef}
        source={{ html: SHELL_HTML, baseUrl }}
        style={styles.webview}
        originWhitelist={['*', 'file://*', 'content://*']}
        allowFileAccess
        allowFileAccessFromFileURLs={Platform.OS === 'android'}
        allowUniversalAccessFromFileURLs={Platform.OS === 'android'}
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
          injectFraming(framing);
          void resolveAndInject(glbUrlRef.current);
        }}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data) as { type?: string };
            const activeUrl = glbUrlRef.current;
            const activeHttps = remoteGlbUrl(activeUrl);
            if (data.type === 'ready') {
              shellReadyRef.current = true;
              injectFraming(framing);
              if (activeHttps) void resolveAndInject(activeHttps);
            }
            if (data.type === 'loading') {
              setState((s) => (s === 'error' ? s : 'loading'));
            }
            if (data.type === 'loaded') {
              retryCountRef.current = 0;
              displayedUrlRef.current = activeUrl;
              setShownCatalogUrl(activeUrl);
              setState('ready');
              if (activeHttps) {
                injectFabricTexture(fabricTextureUrl ?? null, activeHttps);
                injectFabricColor(fabricColorHex ?? null, activeHttps);
                injectWeddingColor(weddingColorHex ?? null, activeHttps);
                injectFraming(framing);
              }
            }
            if (data.type === 'error' && activeHttps) {
              if (retryCountRef.current < MAX_LOAD_RETRIES) {
                retryCountRef.current += 1;
                void clearDiskCacheForUrl(activeHttps).finally(() => {
                  setTimeout(() => {
                    if (glbUrlRef.current === activeUrl) {
                      scheduleGlbInject(activeUrl, activeHttps);
                    }
                  }, 400);
                });
                return;
              }
              setState('error');
            }
          } catch {
            /* ignore */
          }
        }}
      />
      ) : null}
      {showOverlay ? (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color="#64748b" />
          <Text style={styles.loadingText}>Loading 3D dress…</Text>
        </View>
      ) : null}
      {isUpdating && shownCatalogUrl != null && shownCatalogUrl !== glbUrl ? (
        <View style={styles.updatingBadge} pointerEvents="none">
          <ActivityIndicator size="small" color="#64748b" />
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
  updatingBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 999,
    padding: 8,
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
