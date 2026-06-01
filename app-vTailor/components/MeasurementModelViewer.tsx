import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { WebView } from 'react-native-webview';
import {
  MEASUREMENT_LABELS,
  type MeasurementValueMap,
  resolveFocusedLabelId,
} from '@/services/measurement/measurementLabelConfig';
import {
  fetchMeasurementModel,
  getCachedMeasurementModel,
  getMeasurementModelUrlCandidates,
  prefetchMeasurementModelAsset,
} from '@/services/measurement/measurementModelApi';
import {
  buildMeasurementViewerShellHtml,
  injectMeasurementFocusScript,
  injectMeasurementLabelsScript,
  injectMeasurementModelScript,
  injectMeasurementValuesScript,
  measurementViewerBaseUrl,
} from '@/services/measurement/measurementModelViewerHtml';

type Props = {
  width: number;
  height: number;
  focusedField?: string | null;
  measurementValues?: MeasurementValueMap;
  style?: StyleProp<ViewStyle>;
};

type LoadState = 'loading' | 'ready' | 'error';

const SHELL_HTML = buildMeasurementViewerShellHtml();
const DEFAULT_BASE_URL = 'https://res.cloudinary.com/';

function httpsViewerUrl(url: string | null | undefined): string | null {
  if (!url || !/^https?:\/\//i.test(url)) return null;
  return url;
}

export function MeasurementModelViewer({
  width,
  height,
  focusedField = null,
  measurementValues = {},
  style,
}: Props): React.ReactElement {
  const webRef = useRef<WebView>(null);
  const shellReadyRef = useRef(false);
  const urlCandidatesRef = useRef<string[]>(getMeasurementModelUrlCandidates());
  const candidateIndexRef = useRef(0);

  const cachedUrl = httpsViewerUrl(getCachedMeasurementModel()?.modelUrl);
  const [modelUrl, setModelUrl] = useState<string | null>(cachedUrl);
  const [state, setState] = useState<LoadState>('loading');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const focusedLabelId = useMemo(() => resolveFocusedLabelId(focusedField), [focusedField]);
  const baseUrl = useMemo(
    () => measurementViewerBaseUrl(modelUrl || DEFAULT_BASE_URL),
    [modelUrl],
  );

  const tryNextCandidate = useCallback(() => {
    const candidates = urlCandidatesRef.current;
    const next = candidateIndexRef.current + 1;
    if (next >= candidates.length || !webRef.current || !shellReadyRef.current) {
      return false;
    }
    candidateIndexRef.current = next;
    const url = candidates[next];
    setModelUrl(url);
    setState('loading');
    setErrorMsg(null);
    webRef.current.injectJavaScript(injectMeasurementModelScript(url));
    return true;
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const record = cachedUrl ? await prefetchMeasurementModelAsset() : await fetchMeasurementModel();
        if (cancelled) return;

        const httpsUrl = httpsViewerUrl(record.modelUrl);
        if (!httpsUrl) {
          throw new Error('Measurement model needs an HTTPS URL');
        }

        const candidates = getMeasurementModelUrlCandidates();
        if (!candidates.includes(httpsUrl)) {
          candidates.unshift(httpsUrl);
        }
        urlCandidatesRef.current = candidates;
        candidateIndexRef.current = Math.max(0, candidates.indexOf(httpsUrl));

        setModelUrl(httpsUrl);
      } catch (err) {
        if (cancelled) return;
        const fallback = urlCandidatesRef.current[0];
        if (fallback) {
          setModelUrl(fallback);
          candidateIndexRef.current = 0;
        } else {
          setErrorMsg(err instanceof Error ? err.message : 'Failed to load model URL');
          setState('error');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [cachedUrl]);

  const injectAll = useCallback(() => {
    const url = httpsViewerUrl(modelUrl);
    if (!webRef.current || !shellReadyRef.current || !url) return;
    webRef.current.injectJavaScript(injectMeasurementLabelsScript(MEASUREMENT_LABELS));
    webRef.current.injectJavaScript(injectMeasurementModelScript(url));
    webRef.current.injectJavaScript(injectMeasurementFocusScript(focusedLabelId));
    webRef.current.injectJavaScript(injectMeasurementValuesScript(measurementValues));
  }, [modelUrl, focusedLabelId, measurementValues]);

  useEffect(() => {
    injectAll();
  }, [injectAll]);

  const onMessage = useCallback(
    (event: { nativeEvent: { data: string } }) => {
      try {
        const data = JSON.parse(event.nativeEvent.data) as {
          source?: string;
          type?: string;
          message?: string;
        };
        if (data.source !== 'vtailor-measurement') return;
        if (data.type === 'shellReady') {
          shellReadyRef.current = true;
          injectAll();
        } else if (data.type === 'ready') {
          setState('ready');
          setErrorMsg(null);
        } else if (data.type === 'error') {
          const msg = data.message || 'Model failed to load';
          if (/failed to fetch|network|load/i.test(msg) && tryNextCandidate()) {
            return;
          }
          setErrorMsg(msg);
          setState('error');
        }
      } catch {
        /* ignore */
      }
    },
    [injectAll, tryNextCandidate],
  );

  if (state === 'error' && !modelUrl) {
    return (
      <View style={[styles.box, { width, height }, style]}>
        <Text style={styles.errText}>{errorMsg || 'Measurement model unavailable'}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.box, { width, height }, style]}>
      <WebView
        ref={webRef}
        originWhitelist={['*']}
        source={{ html: SHELL_HTML, baseUrl }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        cacheEnabled
        allowFileAccess={false}
        androidLayerType={Platform.OS === 'android' ? 'hardware' : undefined}
        onMessage={onMessage}
        onError={() => {
          if (!tryNextCandidate()) {
            setState('error');
            setErrorMsg('WebView failed to initialize');
          }
        }}
      />
      {state !== 'ready' && state !== 'error' ? (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="small" color="#64748b" />
          <Text style={styles.loadingText}>Loading 3D model…</Text>
        </View>
      ) : null}
      {state === 'error' ? (
        <View style={styles.loadingOverlay}>
          <Text style={styles.errText}>{errorMsg}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#eef1f5',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(238, 241, 245, 0.82)',
    gap: 8,
    zIndex: 2,
  },
  loadingText: {
    fontSize: 12,
    color: '#64748b',
  },
  errText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
});
