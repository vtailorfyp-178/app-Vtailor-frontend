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
import { fetchMeasurementModel } from '@/services/measurement/measurementModelApi';
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

export function MeasurementModelViewer({
  width,
  height,
  focusedField = null,
  measurementValues = {},
  style,
}: Props): React.ReactElement {
  const webRef = useRef<WebView>(null);
  const shellReadyRef = useRef(false);
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [state, setState] = useState<LoadState>('loading');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const focusedLabelId = useMemo(() => resolveFocusedLabelId(focusedField), [focusedField]);
  const baseUrl = useMemo(
    () => (modelUrl ? measurementViewerBaseUrl(modelUrl) : 'https://res.cloudinary.com/'),
    [modelUrl],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setState('loading');
        const record = await fetchMeasurementModel();
        if (cancelled) return;
        setModelUrl(record.modelUrl);
      } catch (err) {
        if (cancelled) return;
        setErrorMsg(err instanceof Error ? err.message : 'Failed to load model URL');
        setState('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const injectAll = useCallback(() => {
    if (!webRef.current || !shellReadyRef.current || !modelUrl) return;
    webRef.current.injectJavaScript(injectMeasurementLabelsScript(MEASUREMENT_LABELS));
    webRef.current.injectJavaScript(injectMeasurementModelScript(modelUrl));
    webRef.current.injectJavaScript(injectMeasurementFocusScript(focusedLabelId));
    webRef.current.injectJavaScript(injectMeasurementValuesScript(measurementValues));
  }, [modelUrl, focusedLabelId, measurementValues]);

  useEffect(() => {
    injectAll();
  }, [injectAll]);

  const onMessage = useCallback((event: { nativeEvent: { data: string } }) => {
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
      } else if (data.type === 'error') {
        setErrorMsg(data.message || 'Model failed to load');
        setState('error');
      }
    } catch {
      /* ignore */
    }
  }, [injectAll]);

  if (state === 'error' && !modelUrl) {
    return (
      <View style={[styles.box, { width, height }, style]}>
        <Text style={styles.errText}>{errorMsg || 'Measurement model unavailable'}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.box, { width, height }, style]}>
      {state === 'loading' ? (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="small" color="#64748b" />
          <Text style={styles.loadingText}>Loading 3D model…</Text>
        </View>
      ) : null}
      {modelUrl ? (
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
          androidLayerType={Platform.OS === 'android' ? 'hardware' : undefined}
          onMessage={onMessage}
          onError={() => {
            setState('error');
            setErrorMsg('WebView failed to initialize');
          }}
        />
      ) : null}
      {state === 'error' && modelUrl ? (
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
