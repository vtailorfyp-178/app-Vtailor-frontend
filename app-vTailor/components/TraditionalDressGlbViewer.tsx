import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Asset } from 'expo-asset';
import { GLView, type ExpoWebGLRenderingContext } from 'expo-gl';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as FS from 'expo-file-system/legacy';
import type { JSX } from 'react';
import {
  PixelRatio,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';

const PIVOT_Y = 1.05;
const ZOOM_MIN = 2.35;
const ZOOM_MAX = 13.5;
const ZOOM_DEFAULT = 5.25;
const ZOOM_BUTTON_STEP = 0.78;

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const clean = base64.replace(/\s/g, '');
  const chars = typeof atob === 'function' ? atob(clean) : '';
  const len = chars.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i += 1) {
    bytes[i] = chars.charCodeAt(i);
  }
  return bytes.buffer.byteLength === bytes.byteLength ? bytes.buffer : bytes.slice().buffer;
}

async function loadBundledGlbBuffer(assetModule: number): Promise<ArrayBuffer> {
  await Asset.loadAsync(assetModule as never);
  const asset = Asset.fromModule(assetModule);
  await asset.downloadAsync();
  const uri = asset.localUri;
  if (!uri) {
    throw new Error('Model asset not available on disk yet.');
  }

  if (Platform.OS === 'web') {
    const res = await fetch(uri);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = await res.arrayBuffer();
    if (buf.byteLength < 80) throw new Error('Downloaded GLB appears empty.');
    return buf;
  }

  try {
    const res = await fetch(uri);
    if (res.ok) {
      const buf = await res.arrayBuffer();
      if (buf.byteLength >= 80) return buf;
    }
  } catch {
    /* file:// fetch often unreliable on native */
  }

  const b64 = await FS.readAsStringAsync(uri, { encoding: FS.EncodingType.Base64 });
  const buf = base64ToArrayBuffer(b64);
  if (buf.byteLength < 80) throw new Error('Could not read model bytes from device.');
  return buf;
}

function createRenderer(gl: ExpoWebGLRenderingContext, width: number, height: number): THREE.WebGLRenderer {
  const noop = (): void => {};
  const styleStub = {} as unknown as CSSStyleDeclaration;
  const canvasStub = {
    width,
    height,
    style: styleStub,
    addEventListener: noop as typeof HTMLElement.prototype.addEventListener,
    removeEventListener: noop as typeof HTMLElement.prototype.removeEventListener,
    clientHeight: height,
    clientWidth: width,
  } as unknown as HTMLCanvasElement;
  return new THREE.WebGLRenderer({
    canvas: canvasStub,
    context: gl as unknown as WebGLRenderingContext,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  });
}

type Props = {
  /** Metro asset id from `require('…/*.glb')`. */
  glbModule: number;
  width: number;
  height: number;
  style?: StyleProp<ViewStyle>;
};

export function TraditionalDressGlbViewer({ glbModule, width, height, style }: Props): JSX.Element {
  const rotY = useRef(-0.38);
  /** Camera distance along Z toward pivot (smaller = closer / zoom in). */
  const zoomRef = useRef(ZOOM_DEFAULT);
  const pinchStartZoom = useRef(ZOOM_DEFAULT);
  const panStartY = useRef(0);

  const layoutRef = useRef({ width: Math.floor(width), height: Math.floor(height) });
  layoutRef.current = { width: Math.floor(width), height: Math.floor(height) };

  const ctxRef = useRef<ExpoWebGLRenderingContext | null>(null);
  const frameIdRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);
  const rootGroupRef = useRef<THREE.Group | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const disposedRef = useRef(false);

  const [banner, setBanner] = useState<string | null>('Loading 3D dress…');

  const applyZoomIn = useCallback(() => {
    zoomRef.current = THREE.MathUtils.clamp(zoomRef.current * ZOOM_BUTTON_STEP, ZOOM_MIN, ZOOM_MAX);
  }, []);

  const applyZoomOut = useCallback(() => {
    zoomRef.current = THREE.MathUtils.clamp(zoomRef.current / ZOOM_BUTTON_STEP, ZOOM_MIN, ZOOM_MAX);
  }, []);

  useEffect(() => {
    disposedRef.current = false;
    return () => {
      disposedRef.current = true;
      if (frameIdRef.current !== null) {
        cancelAnimationFrame(frameIdRef.current);
        frameIdRef.current = null;
      }
      const grp = rootGroupRef.current;
      grp?.traverse((obj: THREE.Object3D) => {
        if (!(obj instanceof THREE.Mesh)) return;
        obj.geometry.dispose();
        const m = obj.material;
        if (Array.isArray(m)) m.forEach((mat) => mat.dispose());
        else m.dispose?.();
      });
      rootGroupRef.current = null;
      sceneRef.current?.clear();
      sceneRef.current = null;
      cameraRef.current = null;
      rendererRef.current?.dispose?.();
      rendererRef.current = null;
      ctxRef.current = null;
    };
  }, []);

  const tick = () => {
    const gl = ctxRef.current;
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const cam = cameraRef.current;
    const root = rootGroupRef.current;

    if (disposedRef.current || !gl || !renderer || !scene || !cam || !root) {
      return;
    }

    const z = THREE.MathUtils.clamp(zoomRef.current, ZOOM_MIN, ZOOM_MAX);
    cam.position.set(0, PIVOT_Y, z);
    cam.lookAt(0, PIVOT_Y, 0);

    root.rotation.order = 'YXZ';
    root.rotation.y = rotY.current;
    root.rotation.x = 0;

    renderer.render(scene, cam);
    gl.endFrameEXP?.();
    frameIdRef.current = requestAnimationFrame(tick);
  };

  const onContextCreate = useCallback(async (gl: ExpoWebGLRenderingContext) => {
    disposedRef.current = false;
    ctxRef.current = gl;

    const lw = layoutRef.current.width;
    const lh = layoutRef.current.height;
    const pxW = PixelRatio.roundToNearestPixel(lw);
    const pxH = PixelRatio.roundToNearestPixel(lh);
    let w = Math.max(2, gl.drawingBufferWidth || pxW);
    let h = Math.max(2, gl.drawingBufferHeight || pxH);

    if (Math.abs(w - pxW) > 8 || Math.abs(h - pxH) > 8) {
      w = Math.max(w, pxW);
      h = Math.max(h, pxH);
    }

    try {
      setBanner('Loading 3D dress…');
      zoomRef.current = ZOOM_DEFAULT;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xfeffff);
      sceneRef.current = scene;

      const camera = new THREE.PerspectiveCamera(40, w / h, 0.08, 500);
      camera.position.set(0, PIVOT_Y, zoomRef.current);
      camera.lookAt(0, PIVOT_Y, 0);
      cameraRef.current = camera;

      const renderer = createRenderer(gl, w, h);
      renderer.setSize(w, h, false);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.56;
      rendererRef.current = renderer;

      THREE.ColorManagement.enabled = true;

      scene.add(new THREE.AmbientLight(0xffffff, 0.96));
      scene.add(new THREE.HemisphereLight(0xfff8fb, 0x5c6478, 1.09));
      const key = new THREE.DirectionalLight(0xffffff, 1.58);
      key.position.set(5, 10, 6);
      scene.add(key);
      const fill = new THREE.DirectionalLight(0xfff9fc, 0.74);
      fill.position.set(-4, 6, 8);
      scene.add(fill);
      const rim = new THREE.DirectionalLight(0xe8f0ff, 0.72);
      rim.position.set(-6, 4, -5);
      scene.add(rim);
      const bounce = new THREE.PointLight(0xffffff, 0.56, 30, 1.85);
      bounce.position.set(0, 1.45, 4.2);
      scene.add(bounce);
      const warm = new THREE.PointLight(0xfff4eb, 0.34, 20, 2);
      warm.position.set(2.2, 1.2, 3.6);
      scene.add(warm);

      const rootGroup = new THREE.Group();
      rootGroupRef.current = rootGroup;
      scene.add(rootGroup);

      const buf = await loadBundledGlbBuffer(glbModule);
      if (disposedRef.current) return;

      const loader = new GLTFLoader();
      const gltf = await loader.parseAsync(buf, '');

      if (disposedRef.current || !rootGroupRef.current) return;

      const model = gltf.scene;
      model.traverse((obj) => {
        if (!(obj instanceof THREE.Mesh)) return;
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        for (const m of mats) {
          const mat = m as THREE.MeshStandardMaterial;
          mat.side = THREE.DoubleSide;
          mat.needsUpdate = true;
          if ('envMapIntensity' in mat) {
            mat.envMapIntensity = Math.max(Number(mat.envMapIntensity) || 0, 1.98);
          }
          if (mat.isMeshStandardMaterial) {
            if (typeof mat.roughness === 'number') {
              mat.roughness = THREE.MathUtils.clamp(mat.roughness * 0.78, 0.022, 1);
            }
          }
        }
      });

      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxSide = Math.max(size.x, size.y, size.z, 1e-6);

      if (!Number.isFinite(maxSide) || box.isEmpty()) {
        throw new Error('Model has invalid bounds.');
      }

      model.position.sub(center);

      model.updateMatrixWorld(true);
      const box2 = new THREE.Box3().setFromObject(model);
      const minY = box2.min.y;
      model.position.sub(new THREE.Vector3(0, minY, 0));

      const targetHeight = 2.62;
      model.scale.setScalar(targetHeight / maxSide);
      rootGroup.add(model);

      setBanner(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[DressGlbViewer]', msg);
      if (!disposedRef.current) {
        setBanner(msg || 'Could not load dress model.');
      }
    }

    if (frameIdRef.current !== null) {
      cancelAnimationFrame(frameIdRef.current);
    }
    frameIdRef.current = requestAnimationFrame(tick);
  }, [glbModule]);

  const composedGesture = useMemo(() => {
    const panGesture = Gesture.Pan()
      .activeOffsetX([-10, 10])
      .failOffsetY([-28, 28])
      .onStart(() => {
        panStartY.current = rotY.current;
      })
      .onUpdate((e) => {
        const sens = 0.0112;
        rotY.current = panStartY.current + e.translationX * sens;
      });

    const pinchGesture = Gesture.Pinch()
      .onStart(() => {
        pinchStartZoom.current = zoomRef.current;
      })
      .onUpdate((e) => {
        zoomRef.current = THREE.MathUtils.clamp(pinchStartZoom.current / e.scale, ZOOM_MIN, ZOOM_MAX);
      });

    return Gesture.Simultaneous(pinchGesture, panGesture);
  }, []);

  const w = Math.max(200, layoutRef.current.width);
  const h = Math.max(220, layoutRef.current.height);

  const viewport = (
    <View style={{ width: w, height: h }} collapsable={false}>
      <GLView style={{ width: w, height: h }} onContextCreate={onContextCreate as never} />
      {banner != null && (
        <View style={styles.statusOverlay} pointerEvents="none">
          <Text style={styles.statusText}>{banner}</Text>
        </View>
      )}
      {banner == null && (
        <>
          <View style={styles.zoomBar} pointerEvents="box-none">
            <Pressable
              onPress={applyZoomIn}
              style={({ pressed }) => [styles.zoomBtn, styles.zoomBtnSpacing, pressed && styles.zoomBtnPressed]}
              accessibilityLabel="Zoom in"
            >
              <Text style={styles.zoomBtnText}>＋</Text>
            </Pressable>
            <Pressable
              onPress={applyZoomOut}
              style={({ pressed }) => [styles.zoomBtn, pressed && styles.zoomBtnPressed]}
              accessibilityLabel="Zoom out"
            >
              <Text style={styles.zoomBtnText}>−</Text>
            </Pressable>
          </View>
          <View style={styles.hintOverlay} pointerEvents="none">
            <Text style={styles.hintText}>Drag left/right to rotate · pinch or ± to zoom</Text>
          </View>
        </>
      )}
    </View>
  );

  return (
    <GestureHandlerRootView style={[{ width: w, height: h, overflow: 'hidden', backgroundColor: '#f4f6f8' }, style]}>
      <GestureDetector gesture={composedGesture}>{viewport}</GestureDetector>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  zoomBar: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'column',
    zIndex: 20,
  },
  zoomBtnSpacing: { marginBottom: 8 },
  zoomBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(15,23,42,0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  zoomBtnPressed: { backgroundColor: 'rgba(241,245,249,0.98)' },
  zoomBtnText: { fontSize: 22, fontWeight: '700', color: '#334155', lineHeight: 24, marginTop: -2 },
  hintOverlay: {
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.82)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.08)',
    maxWidth: '92%',
  },
  hintText: { fontSize: 10, color: '#475569', fontWeight: '600', textAlign: 'center' },
  statusOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: 'rgba(244,246,248,0.94)',
  },
  statusText: { fontSize: 13, color: '#64748b', textAlign: 'center', fontWeight: '600' },
});

export default TraditionalDressGlbViewer;
