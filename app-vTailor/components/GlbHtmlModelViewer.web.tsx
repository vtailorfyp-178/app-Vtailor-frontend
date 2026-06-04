import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { ensureModelViewerScript } from '@/services/glb/modelViewerScript';
import {
  applyModelViewerAttrs,
  scheduleDressModelFraming,
  type DressViewerFramingMode,
  type ModelViewerElement,
} from '@/services/glb/modelViewerFraming';

type Props = {
  glbUrl: string;
  width: number;
  height: number;
  fallbackImage?: ImageSourcePropType | null;
  style?: StyleProp<ViewStyle>;
  framing?: DressViewerFramingMode;
};

type LoadState = 'loading' | 'ready' | 'error';

/**
 * Web: mount <model-viewer> with auto-framing so dress fills the preview (centered, zoomed).
 */
export function GlbHtmlModelViewer({
  glbUrl,
  width,
  height,
  fallbackImage,
  style,
  framing = 'editor',
}: Props): React.ReactElement {
  const domRef = useRef<HTMLDivElement | null>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [state, setState] = useState<LoadState>('loading');

  const clearErrorTimer = () => {
    if (errorTimerRef.current) {
      clearTimeout(errorTimerRef.current);
      errorTimerRef.current = null;
    }
  };

  const scheduleError = () => {
    clearErrorTimer();
    errorTimerRef.current = setTimeout(() => {
      setState((s) => (s === 'loading' ? 'error' : s));
    }, 2500);
  };

  useEffect(() => {
    setState('loading');
    clearErrorTimer();
  }, [glbUrl]);

  useEffect(() => {
    if (!glbUrl || glbUrl === 'about:blank') return undefined;

    let cancelled = false;
    const host = domRef.current;
    if (!host) return undefined;

    const mount = async () => {
      try {
        await ensureModelViewerScript();
        if (cancelled) return;

        host.replaceChildren();
        const mv = document.createElement('model-viewer') as ModelViewerElement;
        applyModelViewerAttrs(mv);
        mv.style.width = '100%';
        mv.style.height = '100%';
        mv.style.display = 'block';
        mv.style.background = '#f4f6f8';
        mv.style.setProperty('--poster-color', 'transparent');
        mv.setAttribute('src', glbUrl);

        const onLoad = () => {
          clearErrorTimer();
          if (cancelled) return;
          scheduleDressModelFraming(mv, () => {
            if (!cancelled) setState('ready');
          }, framing);
        };
        const onError = () => {
          if (!cancelled) scheduleError();
        };

        mv.addEventListener('load', onLoad);
        mv.addEventListener('error', onError);
        host.appendChild(mv);
      } catch {
        if (!cancelled) setState('error');
      }
    };

    const t = window.setTimeout(() => void mount(), 0);

    return () => {
      cancelled = true;
      clearTimeout(t);
      clearErrorTimer();
      host.replaceChildren();
    };
  }, [glbUrl, framing]);

  if (!glbUrl || glbUrl === 'about:blank') {
    return (
      <View style={[styles.wrap, { width, height }, style]}>
        <Text style={styles.errText}>No 3D model URL for this dress combination.</Text>
      </View>
    );
  }

  if (state === 'error') {
    const isCloudinary = /res\.cloudinary\.com/i.test(glbUrl);
    return (
      <View style={[styles.wrap, { width, height }, style]}>
        {fallbackImage ? (
          <Image source={fallbackImage} style={styles.fallbackImage} resizeMode="contain" />
        ) : null}
        <Text style={styles.errText}>
          {isCloudinary
            ? '3D file failed to load from Cloudinary. Check internet connection and try another color/style.'
            : '3D file not found on server. Run models-service (port 3001) or sync /3dModels on API port 8000.'}
        </Text>
      </View>
    );
  }

  return (
    <View style={[{ width, height, overflow: 'hidden' }, style]}>
      {React.createElement('div', {
        ref: domRef,
        style: {
          width: '100%',
          height: '100%',
          minHeight: height,
          backgroundColor: '#f4f6f8',
          position: 'relative',
        },
      })}
      {state === 'loading' ? (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color="#64748b" />
          <Text style={styles.loadingText}>Loading 3D dress…</Text>
        </View>
      ) : null}
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
  fallbackImage: { width: '88%', height: '62%', marginBottom: 8 },
  errText: { fontSize: 13, color: '#64748b', textAlign: 'center', fontWeight: '600' },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(244,246,248,0.92)',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
});
