import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import {
  buildFindTailorsLeafletHtml,
  injectFindTailorsMapUpdate,
  type FindTailorsLeafletMarker,
  type FindTailorsLeafletRegion,
} from '@/services/maps/findTailorsLeafletHtml';

export type FindTailorsMapHandle = {
  animateToRegion: (region: FindTailorsLeafletRegion, durationMs?: number) => void;
};

type Props = {
  initialRegion: FindTailorsLeafletRegion;
  markers: FindTailorsLeafletMarker[];
  tint: string;
  userLocation?: { latitude: number; longitude: number } | null;
  onRegionChangeComplete: (region: FindTailorsLeafletRegion) => void;
  onMarkerPress: (tailorId: string) => void;
};

const MAP_HTML = buildFindTailorsLeafletHtml();

export const FindTailorsOsmMap = forwardRef<FindTailorsMapHandle, Props>(function FindTailorsOsmMap(
  {
    initialRegion,
    markers,
    tint,
    userLocation,
    onRegionChangeComplete,
    onMarkerPress,
  },
  ref,
) {
  const webRef = useRef<WebView>(null);
  const readyRef = useRef(false);
  const pendingFlyRef = useRef<{ region: FindTailorsLeafletRegion; durationMs: number } | null>(null);

  const pushUpdate = useCallback(
    (extra?: { flyTo?: FindTailorsLeafletRegion; flyDurationMs?: number }) => {
      if (!readyRef.current || !webRef.current) return;
      const script = injectFindTailorsMapUpdate({
        initialRegion,
        markers,
        userLocation: userLocation
          ? { lat: userLocation.latitude, lng: userLocation.longitude }
          : null,
        flyTo: extra?.flyTo,
        flyDurationMs: extra?.flyDurationMs,
      });
      webRef.current.injectJavaScript(script);
    },
    [initialRegion, markers, userLocation],
  );

  useImperativeHandle(ref, () => ({
    animateToRegion: (region, durationMs = 450) => {
      if (!readyRef.current) {
        pendingFlyRef.current = { region, durationMs };
        return;
      }
      pushUpdate({ flyTo: region, flyDurationMs: durationMs });
    },
  }));

  useEffect(() => {
    pushUpdate();
  }, [pushUpdate]);

  const onWebMessage = useCallback(
    (raw: string) => {
      try {
        const msg = JSON.parse(raw) as {
          type: string;
          region?: FindTailorsLeafletRegion;
          id?: string;
        };
        if (msg.type === 'ready') {
          readyRef.current = true;
          if (pendingFlyRef.current) {
            const pending = pendingFlyRef.current;
            pendingFlyRef.current = null;
            pushUpdate({ flyTo: pending.region, flyDurationMs: pending.durationMs });
          } else {
            pushUpdate();
          }
          return;
        }
        if (msg.type === 'regionChange' && msg.region) {
          onRegionChangeComplete(msg.region);
          return;
        }
        if (msg.type === 'markerPress' && msg.id) {
          onMarkerPress(msg.id);
        }
      } catch {
        // ignore malformed messages
      }
    },
    [onMarkerPress, onRegionChangeComplete, pushUpdate],
  );

  const recenterUser = useCallback(() => {
    if (!userLocation) return;
    pushUpdate({
      flyTo: {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: initialRegion.latitudeDelta,
        longitudeDelta: initialRegion.longitudeDelta,
      },
      flyDurationMs: 450,
    });
  }, [initialRegion.latitudeDelta, initialRegion.longitudeDelta, pushUpdate, userLocation]);

  const source = useMemo(() => ({ html: MAP_HTML, baseUrl: 'https://localhost/' }), []);

  return (
    <View style={styles.wrap}>
      <WebView
        ref={webRef}
        source={source}
        style={styles.webview}
        originWhitelist={['*']}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
        setSupportMultipleWindows={false}
        onMessage={(event) => onWebMessage(event.nativeEvent.data)}
      />
      {userLocation ? (
        <Pressable style={styles.locateBtn} onPress={recenterUser} accessibilityLabel="Show my location">
          <Ionicons name="locate" size={20} color="#111827" />
        </Pressable>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#eef2f7' },
  webview: { flex: 1, backgroundColor: 'transparent' },
  locateBtn: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0f172a',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
});
