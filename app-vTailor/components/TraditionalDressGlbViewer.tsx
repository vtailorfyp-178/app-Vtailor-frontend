import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GLView, type ExpoWebGLRenderingContext } from 'expo-gl';
import * as THREE from 'three';
import { isGlbLoadSupersededError } from '@/services/glb/glbFetchErrors';
import {
  getCachedParsedScene,
  hasCachedParsedScene,
} from '@/services/glb/glbParsedSceneCache';
import { isCasualFabricDressGlbUrl, isFrillSareeGlbUrl } from '@/services/glb/casualFabricDress';
import {
  applyCasualFabricBaseMaterial,
  applyCasualFabricTextureToMesh,
  clearCasualFabricTextureFromMesh,
} from '@/services/glb/casualFabricMaterial';
import { loadFabricPrintTexture } from '@/services/glb/fabricTextureCache';
import { applyFabricPrintToScene } from '@/services/glb/fabricTextureApply';
import {
  fabricPrintTileUrl,
} from '@/services/glb/fabricPrintSelection';
import { glbNeedsEmbeddedTextures } from '@/services/glb/glbMaterialPolicy';
import { isNativeThreeParseError, loadGltfFromUrl } from '@/services/glb/loadGltfFromUrl';
import { GlbHtmlModelViewer } from '@/components/GlbHtmlModelViewer';
import { setActiveGlbLoadUrl } from '@/services/glb/glbModelCache';
import {
  applyCasualFabricTintToMesh,
  applyDressFabricMaterialsToScene,
  applyFabricColorTintToMesh,
  isFabricDressMesh,
  isPatiyalaTintMesh,
  toDisplayStandardMaterial,
} from '@/services/glb/gltfSceneDisplay';
import { getCachedGlbBuffer } from '@/services/glb/glbModelCache';
import {
  dressCameraFitMultiplier,
  type DressFramingContext,
  type DressViewerFramingMode,
} from '@/services/glb/dressViewerFraming';
import type { JSX } from 'react';
import {
  Image,
  PanResponder,
  PixelRatio,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

const PIVOT_Y_DEFAULT = 1.05;
const ZOOM_MIN = 2.2;
const ZOOM_MAX = 14;
const ZOOM_DEFAULT = 5.1;
const ZOOM_BUTTON_STEP = 0.78;
const LOOK_Y_MIN = -0.72;
const LOOK_Y_MAX = 1.05;
const ZOOM_DRAG_SENS = 0.0048;
const ROT_Y_SENS = 0.0132;
const ZOOM_BUTTON_STEP_DRAG = 0.075;

/** Frame full dress in viewport after centerAndScaleScene (normalized height ~2.45). */
function fitDressCamera(
  model: THREE.Object3D,
  camera: THREE.PerspectiveCamera,
  layoutW: number,
  layoutH: number,
  framing: DressViewerFramingMode = 'editor',
  framingCtx?: DressFramingContext | null,
): { pivotY: number; zoom: number } {
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z, 0.01);

  const aspect = layoutW / Math.max(layoutH, 1);
  const vFovRad = (camera.fov * Math.PI) / 180;
  const hFovRad = 2 * Math.atan(Math.tan(vFovRad / 2) * aspect);
  const fitFov = Math.min(vFovRad, hFovRad);
  const dist = (maxDim / 2) / Math.tan(fitFov / 2) * dressCameraFitMultiplier(framing, framingCtx);

  return {
    pivotY: center.y,
    zoom: THREE.MathUtils.clamp(dist, ZOOM_MIN, ZOOM_MAX),
  };
}

type FabricMaterialSlot = {
  mat: THREE.MeshStandardMaterial;
  mesh: THREE.Mesh;
  baseColor: THREE.Color;
  isDressFabric: boolean;
};

function prepareFabricMaterialSlots(
  model: THREE.Object3D,
  fabricColorHex?: string | null,
  options?: { tintAllDressMeshes?: boolean },
): FabricMaterialSlot[] {
  const slots: FabricMaterialSlot[] = [];
  const tint = Boolean(fabricColorHex);
  const patiyalaTint = options?.tintAllDressMeshes ?? false;

  model.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    const dressFabric = patiyalaTint
      ? isPatiyalaTintMesh(obj.name)
      : isFabricDressMesh(obj.name);
    const sourceMats = Array.isArray(obj.material) ? obj.material : [obj.material];
    const nextMats: THREE.Material[] = [];

    for (const source of sourceMats) {
      const mat = toDisplayStandardMaterial(source);
      const baseColor = mat.color.clone();
      if (dressFabric) {
        applyCasualFabricBaseMaterial(mat, true);
        if (tint && fabricColorHex) applyCasualFabricTintToMesh(mat, fabricColorHex);
      } else {
        applyCasualFabricBaseMaterial(mat, false);
      }
      if (dressFabric || (patiyalaTint && tint)) {
        slots.push({ mat, mesh: obj, baseColor, isDressFabric: true });
      }
      nextMats.push(mat);
    }

    obj.material = nextMats.length === 1 ? nextMats[0] : nextMats;
  });
  return slots;
}

function applyFabricColorTint(
  slots: FabricMaterialSlot[],
  hex: string | null | undefined,
  patiyalaTint: boolean,
): void {
  if (!slots.length) return;
  if (!hex) {
    for (const { mat, baseColor, isDressFabric } of slots) {
      if (!isDressFabric) continue;
      mat.color.copy(baseColor);
      mat.needsUpdate = true;
    }
    return;
  }
  for (const { mat, baseColor, isDressFabric } of slots) {
    if (!isDressFabric) continue;
    if (patiyalaTint) applyCasualFabricTintToMesh(mat, hex);
    else applyFabricColorTintToMesh(mat, hex, baseColor);
  }
}

async function applyFabricTextureToSlots(
  slots: FabricMaterialSlot[],
  fabricPrintRaw: string | null | undefined,
  modelRoot?: THREE.Object3D | null,
  tintAllDressMeshes = false,
): Promise<void> {
  if (!fabricPrintRaw?.trim()) {
    for (const { mat, baseColor, isDressFabric } of slots) {
      if (!isDressFabric) continue;
      clearCasualFabricTextureFromMesh(mat);
      mat.color.copy(baseColor);
      mat.needsUpdate = true;
    }
    return;
  }

  console.log('[DressGlbViewer] fabric print URL raw', fabricPrintRaw.slice(0, 160));
  console.log('[DressGlbViewer] tile URL', fabricPrintTileUrl(fabricPrintRaw)?.slice(0, 160));

  if (modelRoot) {
    const result = await applyFabricPrintToScene(modelRoot, fabricPrintRaw, { tintAllDressMeshes });
    if (result.applied > 0) return;

    console.warn('[DressGlbViewer] scene apply failed, trying slot fallback', result);
  }

  const texture = await loadFabricPrintTexture(fabricPrintRaw);
  if (!texture) {
    console.error('[DressGlbViewer] texture load failed — preserving base material colors');
    for (const { mat, baseColor, isDressFabric } of slots) {
      if (!isDressFabric) continue;
      if (!mat.map) {
        mat.color.copy(baseColor);
        mat.needsUpdate = true;
      }
    }
    return;
  }

  for (const { mat, isDressFabric } of slots) {
    if (!isDressFabric) continue;
    const ok = applyCasualFabricTextureToMesh(mat, texture);
    console.log('[DressGlbViewer] slot map assigned', { hasMap: Boolean(mat.map), ok });
  }
}

function glBufferDimensions(layoutW: number, layoutH: number, gl: ExpoWebGLRenderingContext) {
  const maxScale = Platform.OS === 'android' ? 1 : Platform.OS === 'ios' ? 1.1 : 1.55;
  const scale = Math.min(PixelRatio.get(), maxScale);
  const pxW = Math.max(2, Math.floor(layoutW * scale));
  const pxH = Math.max(2, Math.floor(layoutH * scale));
  let w = Math.max(2, gl.drawingBufferWidth || pxW);
  let h = Math.max(2, gl.drawingBufferHeight || pxH);
  if (Math.abs(w - pxW) > 8 || Math.abs(h - pxH) > 8) {
    w = Math.max(w, pxW);
    h = Math.max(h, pxH);
  }
  return { w, h };
}

function disposeObject3DTree(obj: THREE.Object3D): void {
  obj.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return;
    node.geometry?.dispose();
    const m = node.material;
    if (Array.isArray(m)) m.forEach((mat) => mat.dispose());
    else m?.dispose?.();
  });
}

function createRenderer(
  gl: ExpoWebGLRenderingContext,
  width: number,
  height: number,
  transparent: boolean,
): THREE.WebGLRenderer {
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
    antialias: false,
    alpha: transparent,
    powerPreference: Platform.OS === 'android' ? 'default' : 'high-performance',
  });
}

type Props = {
  /** Full backend URL to the GLB (`…/3dModels/…`). */
  glbUrl: string;
  width: number;
  height: number;
  fabricColorHex?: string | null;
  fabricTextureUrl?: string | null;
  /** @deprecated Grarah uses per-variant GLB — do not pass runtime tint. */
  weddingColorHex?: string | null;
  backgroundImage?: ImageSourcePropType | null;
  style?: StyleProp<ViewStyle>;
  isUpdating?: boolean;
  /** `presentation` — full-screen view / My Designs. */
  framing?: DressViewerFramingMode;
  modelId?: string | null;
  selections?: DressFramingContext['selections'];
};

export function TraditionalDressGlbViewer({
  glbUrl,
  width,
  height,
  fabricColorHex,
  fabricTextureUrl = null,
  weddingColorHex: _weddingColorHex,
  backgroundImage,
  style,
  isUpdating = false,
  framing = 'editor',
  modelId = null,
  selections = null,
}: Props): JSX.Element {
  const framingCtx = useMemo(
    () => (modelId ? { modelId, selections } : null),
    [modelId, selections],
  );
  const hasBackdrop = backgroundImage != null;
  const rotY = useRef(0);
  const zoomRef = useRef(ZOOM_DEFAULT);
  const pivotYRef = useRef(PIVOT_Y_DEFAULT);
  const zoomOffsetRef = useRef(0);
  const panStartRotY = useRef(0);
  const panStartZoom = useRef(0);
  const panAxis = useRef<'rotate' | 'zoom' | null>(null);

  const layoutRef = useRef({ width: Math.floor(width), height: Math.floor(height) });
  layoutRef.current = { width: Math.floor(width), height: Math.floor(height) };

  const ctxRef = useRef<ExpoWebGLRenderingContext | null>(null);
  const frameIdRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);
  const draggingRef = useRef(false);
  const rootGroupRef = useRef<THREE.Group | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const disposedRef = useRef(false);
  const loadGenRef = useRef(0);
  const fabricSlotsRef = useRef<FabricMaterialSlot[]>([]);
  const preloadedModelRef = useRef<THREE.Object3D | null>(null);

  const [displayModel, setDisplayModel] = useState<THREE.Object3D | null>(null);
  const [glReady, setGlReady] = useState(false);
  const [glViewMounted, setGlViewMounted] = useState(false);
  const [banner, setBanner] = useState<string | null>('Loading 3D dress…');
  const [useWebViewFallback, setUseWebViewFallback] = useState(false);
  const displayedUrlRef = useRef<string | null>(null);
  const fabricColorHexRef = useRef(fabricColorHex);
  const fabricTextureUrlRef = useRef(fabricTextureUrl);
  fabricColorHexRef.current = fabricColorHex;
  fabricTextureUrlRef.current = fabricTextureUrl ?? null;

  const tickRef = useRef<() => void>(() => {});

  tickRef.current = () => {
    frameIdRef.current = null;
    const gl = ctxRef.current;
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const cam = cameraRef.current;
    const root = rootGroupRef.current;

    if (disposedRef.current || !gl || !renderer || !scene || !cam || !root) return;

    const z = THREE.MathUtils.clamp(zoomRef.current, ZOOM_MIN, ZOOM_MAX);
    const pivotY =
      pivotYRef.current + THREE.MathUtils.clamp(zoomOffsetRef.current, LOOK_Y_MIN, LOOK_Y_MAX);
    cam.position.set(0, pivotY, z);
    cam.lookAt(0, pivotY, 0);
    root.rotation.order = 'YXZ';
    root.rotation.y = rotY.current;
    root.rotation.x = 0;
    renderer.render(scene, cam);
    gl.endFrameEXP?.();
    if (draggingRef.current) {
      frameIdRef.current = requestAnimationFrame(() => tickRef.current());
    }
  };

  const requestRender = useCallback(() => {
    if (disposedRef.current || frameIdRef.current !== null) return;
    frameIdRef.current = requestAnimationFrame(() => tickRef.current());
  }, []);

  const clearDressFromScene = useCallback(() => {
    const root = rootGroupRef.current;
    if (!root) return;
    const children = [...root.children];
    for (const child of children) {
      root.remove(child);
      disposeObject3DTree(child);
    }
    fabricSlotsRef.current = [];
  }, []);

  const mountModelInScene = useCallback(
    (model: THREE.Object3D, usedFallback: boolean) => {
      const root = rootGroupRef.current;
      if (!root || disposedRef.current) {
        disposeObject3DTree(model);
        return;
      }

      const previous = root.children[0] as THREE.Object3D | undefined;
      clearDressFromScene();
      if (previous && previous !== model) disposeObject3DTree(previous);

      root.add(model);
      const casualFabric = isCasualFabricDressGlbUrl(glbUrl);
      const chiffon = isFrillSareeGlbUrl(glbUrl);
      applyDressFabricMaterialsToScene(model, {
        fabricColorHex: null,
        tintAllDressPanels: casualFabric,
        chiffon,
      });
      fabricSlotsRef.current = prepareFabricMaterialSlots(model, null, {
        tintAllDressMeshes: casualFabric,
      });
      applyFabricColorTint(fabricSlotsRef.current, fabricColorHexRef.current, casualFabric);
      void applyFabricTextureToSlots(
        fabricSlotsRef.current,
        fabricTextureUrlRef.current,
        model,
        casualFabric,
      ).then(() => {
        requestRender();
      });

      const cam = cameraRef.current;
      if (cam) {
        const { pivotY, zoom } = fitDressCamera(
          model,
          cam,
          layoutRef.current.width,
          layoutRef.current.height,
          framing,
          framingCtx,
        );
        pivotYRef.current = pivotY;
        zoomRef.current = zoom;
        zoomOffsetRef.current = 0;
      }

      preloadedModelRef.current = model;
      setDisplayModel(model);
      displayedUrlRef.current = glbUrl;
      setBanner(
        usedFallback ? 'Showing default preview (selected model unavailable).' : null,
      );
      requestRender();
    },
    [clearDressFromScene, glbUrl, requestRender, framing, framingCtx],
  );

  const mountModelInSceneRef = useRef(mountModelInScene);
  mountModelInSceneRef.current = mountModelInScene;

  const tryInstantFromCache = useCallback((): boolean => {
    const template = getCachedParsedScene(glbUrl);
    if (!template) return false;
    const model = template.clone(true);
    mountModelInScene(model, false);
    return true;
  }, [glbUrl, mountModelInScene]);

  useEffect(() => {
    setGlViewMounted(true);
  }, []);

  useEffect(() => {
    disposedRef.current = false;
    let cancelled = false;
    const gen = (loadGenRef.current += 1);

    setActiveGlbLoadUrl(glbUrl);

    if (displayedUrlRef.current === glbUrl && preloadedModelRef.current) {
      return () => {
        cancelled = true;
      };
    }

    if (!tryInstantFromCache()) {
      if (!preloadedModelRef.current) setBanner('Loading 3D dress…');
    }

    const cachedBuf = getCachedGlbBuffer(glbUrl);
    const startDelay =
      Platform.OS === 'web' ? 0 : hasCachedParsedScene(glbUrl) || cachedBuf ? 0 : 16;

    const startTimer = setTimeout(() => {
      if (cancelled || gen !== loadGenRef.current) return;
      if (tryInstantFromCache()) return;

      loadGltfFromUrl(glbUrl, null, {
        allowFallback: false,
      })
        .then(({ model, usedFallback }) => {
          if (cancelled || disposedRef.current || gen !== loadGenRef.current) {
            disposeObject3DTree(model);
            return;
          }
          mountModelInSceneRef.current(model, usedFallback);
        })
        .catch((err) => {
          if (isGlbLoadSupersededError(err)) return;
          const msg = err instanceof Error ? err.message : String(err);
          console.warn('[DressGlbViewer:preload]', msg);
          if (!cancelled && !disposedRef.current && gen === loadGenRef.current) {
            if (Platform.OS !== 'web' && isNativeThreeParseError(err)) {
              setUseWebViewFallback(true);
              setBanner(null);
              return;
            }
            const oom = /allocate|OOM|memory|footprint|too large/i.test(msg);
            setBanner(
              oom
                ? '3D model is too large for this device. Try another style or check your connection.'
                : msg || 'Could not load dress model.',
            );
          }
        });
    }, startDelay);

    return () => {
      cancelled = true;
      clearTimeout(startTimer);
      if (displayedUrlRef.current !== glbUrl) {
        preloadedModelRef.current = null;
        displayedUrlRef.current = null;
      }
    };
  }, [glbUrl, tryInstantFromCache]);

  useEffect(() => {
    if (!glReady || !displayModel) return;
    const root = rootGroupRef.current;
    if (!root?.children.length) {
      mountModelInScene(displayModel, false);
    }
  }, [glReady, displayModel, mountModelInScene]);

  useEffect(() => {
    disposedRef.current = false;
    return () => {
      disposedRef.current = true;
      setGlReady(false);
      loadGenRef.current += 1;
      if (frameIdRef.current !== null) {
        cancelAnimationFrame(frameIdRef.current);
        frameIdRef.current = null;
      }
      clearDressFromScene();
      rootGroupRef.current = null;
      sceneRef.current?.clear();
      sceneRef.current = null;
      cameraRef.current = null;
      rendererRef.current?.dispose?.();
      rendererRef.current = null;
      ctxRef.current = null;
    };
  }, [clearDressFromScene]);

  useEffect(() => {
    if (!fabricSlotsRef.current.length || !glReady) return;
    const casualFabric = isCasualFabricDressGlbUrl(glbUrl);
    const apply = async () => {
      if (fabricTextureUrl) {
        await applyFabricTextureToSlots(
          fabricSlotsRef.current,
          fabricTextureUrl,
          rootGroupRef.current?.children[0] ?? null,
          casualFabric,
        );
      } else {
        await applyFabricTextureToSlots(fabricSlotsRef.current, null, null, casualFabric);
        applyFabricColorTint(fabricSlotsRef.current, fabricColorHex, casualFabric);
      }
      requestRender();
    };
    void apply();
  }, [fabricColorHex, fabricTextureUrl, glReady, glbUrl, requestRender]);

  const onContextCreate = useCallback(
    async (gl: ExpoWebGLRenderingContext) => {
      disposedRef.current = false;
      ctxRef.current = gl;

      const lw = layoutRef.current.width;
      const lh = layoutRef.current.height;
      const { w, h } = glBufferDimensions(lw, lh, gl);

      try {
        zoomRef.current = ZOOM_DEFAULT;
        zoomOffsetRef.current = 0;

        const scene = new THREE.Scene();
        scene.background = hasBackdrop ? null : new THREE.Color(0xfeffff);
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(36, w / h, 0.08, 500);
        pivotYRef.current = PIVOT_Y_DEFAULT;
        camera.position.set(0, pivotYRef.current, zoomRef.current);
        camera.lookAt(0, pivotYRef.current, 0);
        cameraRef.current = camera;

        const casualFabric = isCasualFabricDressGlbUrl(glbUrl);
        const texturedDress = glbNeedsEmbeddedTextures(glbUrl) || casualFabric;
        const renderer = createRenderer(gl, w, h, hasBackdrop);
        renderer.setSize(w, h, false);
        if (hasBackdrop) renderer.setClearColor(0x000000, 0);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = texturedDress ? 1.28 : 1.2;
        rendererRef.current = renderer;

        THREE.ColorManagement.enabled = true;

        const ambientIntensity = texturedDress ? 0.78 : 1.0;
        const hemiIntensity = texturedDress ? 0.85 : 0.95;
        const keyIntensity = texturedDress ? 1.42 : 1.32;
        scene.add(new THREE.AmbientLight(0xffffff, ambientIntensity));
        scene.add(new THREE.HemisphereLight(0xfff8fc, 0x8898b8, hemiIntensity));
        const key = new THREE.DirectionalLight(0xfff5f8, keyIntensity);
        key.position.set(5, 10, 6);
        scene.add(key);
        const fill = new THREE.DirectionalLight(0xfff9fc, texturedDress ? 0.58 : 0.52);
        fill.position.set(-4, 6, 8);
        scene.add(fill);
        const rim = new THREE.DirectionalLight(0xe8f0ff, texturedDress ? 0.42 : 0.36);
        rim.position.set(-6, 4, -5);
        scene.add(rim);
        const frontFill = new THREE.DirectionalLight(0xffffff, texturedDress ? 0.32 : 0.24);
        frontFill.position.set(0, 3, 9);
        scene.add(frontFill);
        if (!texturedDress) {
          const bounce = new THREE.PointLight(0xffffff, 0.32, 30, 1.85);
          bounce.position.set(0, 1.45, 4.2);
          scene.add(bounce);
        }

        const rootGroup = new THREE.Group();
        rootGroupRef.current = rootGroup;
        scene.add(rootGroup);

        setGlReady(true);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn('[DressGlbViewer:init]', msg);
        if (!disposedRef.current) setBanner(msg || 'Could not start 3D viewer.');
      }

      if (frameIdRef.current !== null) cancelAnimationFrame(frameIdRef.current);
      requestRender();
    },
    [glbUrl, hasBackdrop, requestRender],
  );

  const applyZoomIn = useCallback(() => {
    zoomRef.current = THREE.MathUtils.clamp(zoomRef.current * ZOOM_BUTTON_STEP, ZOOM_MIN, ZOOM_MAX);
    requestRender();
  }, [requestRender]);

  const applyZoomOut = useCallback(() => {
    zoomRef.current = THREE.MathUtils.clamp(zoomRef.current / ZOOM_BUTTON_STEP, ZOOM_MIN, ZOOM_MAX);
    requestRender();
  }, [requestRender]);

  const applyLookUp = useCallback(() => {
    zoomOffsetRef.current = THREE.MathUtils.clamp(
      zoomOffsetRef.current - ZOOM_BUTTON_STEP_DRAG,
      LOOK_Y_MIN,
      LOOK_Y_MAX,
    );
    requestRender();
  }, [requestRender]);

  const applyLookDown = useCallback(() => {
    zoomOffsetRef.current = THREE.MathUtils.clamp(
      zoomOffsetRef.current + ZOOM_BUTTON_STEP_DRAG,
      LOOK_Y_MIN,
      LOOK_Y_MAX,
    );
    requestRender();
  }, [requestRender]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4,
        onPanResponderGrant: () => {
          draggingRef.current = true;
          panStartRotY.current = rotY.current;
          panStartZoom.current = zoomRef.current;
          panAxis.current = null;
          requestRender();
        },
        onPanResponderMove: (_, g) => {
          if (!panAxis.current) {
            if (Math.abs(g.dx) < 4 && Math.abs(g.dy) < 4) return;
            panAxis.current = Math.abs(g.dx) >= Math.abs(g.dy) ? 'rotate' : 'zoom';
          }
          if (panAxis.current === 'rotate') {
            rotY.current = panStartRotY.current + g.dx * ROT_Y_SENS;
            requestRender();
            return;
          }
          zoomRef.current = THREE.MathUtils.clamp(
            panStartZoom.current * Math.exp(g.dy * ZOOM_DRAG_SENS),
            ZOOM_MIN,
            ZOOM_MAX,
          );
          requestRender();
        },
        onPanResponderRelease: () => {
          draggingRef.current = false;
        },
        onPanResponderTerminate: () => {
          draggingRef.current = false;
        },
      }),
    [requestRender],
  );

  const w = Math.max(200, layoutRef.current.width);
  const h = Math.max(220, layoutRef.current.height);

  if (useWebViewFallback && glbUrl) {
    return (
      <GlbHtmlModelViewer
        glbUrl={glbUrl}
        width={w}
        height={h}
        fabricColorHex={fabricColorHex}
        fabricTextureUrl={fabricTextureUrl}
        style={style}
        isUpdating={isUpdating}
        framing={framing}
        modelId={modelId}
        selections={selections}
      />
    );
  }

  const showControls = displayModel != null && banner == null;
  const showLoadingOverlay = (banner != null && displayModel == null) || isUpdating;

  const viewport = (
    <View style={{ width: w, height: h }} collapsable={false}>
      {hasBackdrop ? (
        <Image
          source={backgroundImage!}
          style={styles.backdropImage}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
      ) : null}
      {glViewMounted ? (
        <GLView
          style={[styles.glView, hasBackdrop && styles.glViewTransparent]}
          onContextCreate={onContextCreate as never}
        />
      ) : null}
      {showLoadingOverlay && (
        <View style={styles.statusOverlay} pointerEvents="none">
          <Text style={styles.statusText}>{banner ?? 'Updating dress…'}</Text>
        </View>
      )}
      {showControls && (
        <>
          <View style={styles.panBar} pointerEvents="box-none">
            <Pressable
              onPress={applyLookUp}
              style={({ pressed }) => [styles.zoomBtn, styles.zoomBtnSpacing, pressed && styles.zoomBtnPressed]}
              accessibilityLabel="Zoom in"
            >
              <Text style={styles.panBtnText}>↑</Text>
            </Pressable>
            <Pressable
              onPress={applyLookDown}
              style={({ pressed }) => [styles.zoomBtn, pressed && styles.zoomBtnPressed]}
              accessibilityLabel="Zoom out"
            >
              <Text style={styles.panBtnText}>↓</Text>
            </Pressable>
          </View>
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
            <Text style={styles.hintText}>Drag horizontally to rotate · drag vertically to zoom · ± zoom</Text>
          </View>
        </>
      )}
    </View>
  );

  return (
    <View
      style={[
        { width: w, height: h, overflow: 'hidden', backgroundColor: hasBackdrop ? 'transparent' : '#f4f6f8' },
        style,
      ]}
      {...panResponder.panHandlers}
    >
      {viewport}
    </View>
  );
}

const styles = StyleSheet.create({
  backdropImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  glView: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  glViewTransparent: {
    backgroundColor: 'transparent',
  },
  panBar: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'column',
    zIndex: 20,
  },
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
  panBtnText: { fontSize: 20, fontWeight: '700', color: '#334155', lineHeight: 22, marginTop: -2 },
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
