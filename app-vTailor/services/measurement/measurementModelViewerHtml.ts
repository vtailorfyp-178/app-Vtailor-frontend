import type { MeasurementLabelDef } from '@/services/measurement/measurementLabelConfig';

function escapeJsString(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Base URL for WebView origin (Cloudinary or API host). */
export function measurementViewerBaseUrl(glbUrl: string): string {
  try {
    const u = new URL(glbUrl);
    return `${u.protocol}//${u.host}/`;
  } catch {
    return 'https://res.cloudinary.com/';
  }
}

export function buildMeasurementViewerShellHtml(): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <style>
    html, body { margin: 0; height: 100%; background: #e8eaee; overflow: hidden; font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; }
    #canvas-wrap { position: absolute; inset: 0; }
    canvas { display: block; width: 100%; height: 100%; touch-action: none; }
    #label-layer { position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 2; }
    #connector-canvas { position: absolute; inset: 0; pointer-events: none; z-index: 1; width: 100%; height: 100%; }
    .m-label {
      position: absolute;
      display: none;
      flex-direction: column;
      gap: 1px;
      max-width: 46%;
      transition: opacity 0.2s ease;
      opacity: 1;
    }
    .m-label.visible { display: flex; }
    .m-label.dimmed { opacity: 0.32; }
    .m-label--left { align-items: flex-end; text-align: right; }
    .m-label--right { align-items: flex-start; text-align: left; }
    .m-label-box {
      padding: 4px 7px;
      border-radius: 3px;
      box-shadow: 0 1px 6px rgba(0,0,0,0.16);
      line-height: 1.1;
    }
    .m-label-title {
      color: #ffffff;
      font-size: 7.5px;
      font-weight: 800;
      letter-spacing: 0.03em;
      text-transform: uppercase;
    }
    .m-label-hint {
      color: #111827;
      font-size: 7px;
      font-weight: 500;
      opacity: 0.9;
    }
    .m-label-value {
      display: none;
      margin-top: 3px;
      padding: 3px 7px;
      background: #ffffff;
      border: 1.5px solid #cbd5e1;
      border-radius: 4px;
      font-size: 9px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: 0.02em;
      box-shadow: 0 1px 4px rgba(0,0,0,0.1);
    }
    .m-label--has-value .m-label-value { display: block; }
    .m-label--has-value.focused .m-label-value {
      background: #fffbeb;
      transform: scale(1.04);
    }
    .m-label.focused .m-label-box {
      box-shadow: 0 0 0 2px #fff, 0 3px 12px rgba(0,0,0,0.24);
    }
    #loading {
      position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
      color: #64748b; font-size: 13px; background: #e8eaee; z-index: 4;
    }
    #err {
      display: none; position: absolute; inset: 0; padding: 16px; align-items: center; justify-content: center;
      text-align: center; color: #64748b; font-size: 13px; z-index: 4;
    }
  </style>
  <script type="importmap">
  {
    "imports": {
      "three": "https://cdn.jsdelivr.net/npm/three@0.184.0/build/three.module.js",
      "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.184.0/examples/jsm/"
    }
  }
  </script>
</head>
<body>
  <div id="loading">Loading measurement model…</div>
  <div id="err">Could not load 3D measurement model.</div>
  <div id="canvas-wrap"><canvas id="c"></canvas></div>
  <canvas id="connector-canvas"></canvas>
  <div id="label-layer"></div>
  <script type="module">
    import * as THREE from 'three';
    import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
    import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

    const loading = document.getElementById('loading');
    const errEl = document.getElementById('err');
    const canvas = document.getElementById('c');
    const labelLayer = document.getElementById('label-layer');
    const connectorCanvas = document.getElementById('connector-canvas');
    const connectorCtx = connectorCanvas.getContext('2d');

    let scene, camera, renderer, controls, modelRoot;
    let labelItems = [];
    let focusedLabelId = null;
    let measurementValues = {};
    let glbUrl = '';
    let loadGen = 0;
    let layoutW = window.innerWidth;
    let layoutH = window.innerHeight;
    let modelLocalBox = null;
    const proj = new THREE.Vector3();
    const localAnchor = new THREE.Vector3();
    const orbitOffset = new THREE.Vector3();
    const orbitSpherical = new THREE.Spherical();
    const sampleVert = new THREE.Vector3();

    function post(type, payload) {
      const msg = JSON.stringify({ source: 'vtailor-measurement', type, ...payload });
      if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(msg);
    }

    function lerp(min, max, t) { return min + (max - min) * t; }

    function calibrateModelLocalBox() {
      if (!modelRoot) return;
      modelRoot.updateMatrixWorld(true);
      const box = new THREE.Box3();
      modelRoot.traverse((obj) => {
        if (!obj.isMesh || !obj.geometry?.attributes?.position) return;
        const pos = obj.geometry.attributes.position;
        const step = Math.max(1, Math.floor(pos.count / 8000));
        for (let i = 0; i < pos.count; i += step) {
          sampleVert.fromBufferAttribute(pos, i);
          obj.localToWorld(sampleVert);
          modelRoot.worldToLocal(sampleVert);
          box.expandByPoint(sampleVert);
        }
      });
      modelLocalBox = box;
    }

    function anchorToWorld(anchor) {
      if (!modelRoot || !modelLocalBox) return new THREE.Vector3();
      const size = new THREE.Vector3();
      modelLocalBox.getSize(size);
      const min = modelLocalBox.min;
      localAnchor.set(
        lerp(min.x, min.x + size.x, anchor.x),
        lerp(min.y, min.y + size.y, anchor.y),
        lerp(min.z, min.z + size.z, anchor.z),
      );
      return localAnchor.clone().applyMatrix4(modelRoot.matrixWorld);
    }

    function createLabelDom(def) {
      const wrap = document.createElement('div');
      wrap.className = 'm-label m-label--' + def.side;
      wrap.dataset.labelId = def.id;

      const boxEl = document.createElement('div');
      boxEl.className = 'm-label-box';
      boxEl.style.backgroundColor = def.color;

      const title = document.createElement('div');
      title.className = 'm-label-title';
      title.textContent = String(def.text || '').toUpperCase();

      const hint = document.createElement('div');
      hint.className = 'm-label-hint';
      hint.textContent = def.hint || '';

      boxEl.appendChild(title);
      wrap.appendChild(boxEl);
      if (def.hint) wrap.appendChild(hint);

      const valueEl = document.createElement('div');
      valueEl.className = 'm-label-value';
      wrap.appendChild(valueEl);

      return wrap;
    }

    function updateLabelValues() {
      for (const item of labelItems) {
        const el = item.el;
        const valueEl = el.querySelector('.m-label-value');
        if (!valueEl) continue;
        const raw = measurementValues[item.def.id];
        const trimmed = raw != null ? String(raw).trim() : '';
        if (trimmed) {
          valueEl.textContent = trimmed + ' in';
          valueEl.style.borderColor = item.def.color;
          el.classList.add('m-label--has-value');
        } else {
          valueEl.textContent = '';
          el.classList.remove('m-label--has-value');
        }
      }
      updateLabelFocus();
    }

    function updateLabelFocus() {
      const hasFocus = Boolean(focusedLabelId);
      for (const item of labelItems) {
        const el = item.el;
        const isFocused = focusedLabelId && item.def.id === focusedLabelId;
        const hasValue = el.classList.contains('m-label--has-value');
        el.classList.toggle('focused', Boolean(isFocused));
        el.classList.toggle('dimmed', hasFocus && !isFocused && !hasValue);
      }
    }

    function updateGuidePoints() {
      if (!modelRoot || !modelLocalBox) return;
      modelRoot.updateMatrixWorld(true);
      for (const item of labelItems) {
        item.guidePoint.copy(anchorToWorld(item.def.anchor));
      }
    }

    function projectGuide(item) {
      proj.copy(item.guidePoint).project(camera);
      if (proj.z > 1) return null;
      return {
        x: (proj.x * 0.5 + 0.5) * layoutW,
        y: (-proj.y * 0.5 + 0.5) * layoutH,
      };
    }

    function layoutSideColumn(side) {
      const items = labelItems.filter((i) => i.def.side === side);
      const padX = 4;
      const padY = 6;
      const minGap = Math.max(38, Math.floor(layoutH / (items.length + 1.5)));

      const slots = items
        .map((item) => {
          const p = projectGuide(item);
          if (!p) return null;
          return { item, idealY: p.y, guideX: p.x, guideY: p.y };
        })
        .filter(Boolean)
        .sort((a, b) => a.idealY - b.idealY);

      let cursorY = padY + 14;
      for (const slot of slots) {
        let y = Math.max(slot.idealY, cursorY);
        y = Math.min(y, layoutH - padY - 28);
        cursorY = y + minGap;

        const el = slot.item.el;
        el.classList.add('visible');
        el.style.top = y + 'px';
        if (side === 'left') {
          el.style.left = padX + 'px';
          el.style.right = 'auto';
        } else {
          el.style.right = padX + 'px';
          el.style.left = 'auto';
        }

        slot.item.labelY = y;
        slot.item.side = side;
      }

      for (const item of items) {
        if (!slots.find((s) => s.item === item)) {
          item.el.classList.remove('visible');
        }
      }
    }

    function layoutLabelsScreen() {
      for (const item of labelItems) {
        item.el.classList.remove('visible');
        item.labelY = null;
      }
      if (!modelRoot || !camera) return;
      updateGuidePoints();
      layoutSideColumn('left');
      layoutSideColumn('right');
      updateLabelFocus();
    }

    function drawConnectors() {
      if (!connectorCtx) return;
      connectorCtx.clearRect(0, 0, layoutW, layoutH);
      if (!labelItems.length) return;

      connectorCtx.lineWidth = 1;
      connectorCtx.setLineDash([3, 3]);

      for (const item of labelItems) {
        if (!item.el.classList.contains('visible')) continue;
        if (item.labelY == null) continue;

        const guide = projectGuide(item);
        if (!guide) continue;

        const rect = item.el.getBoundingClientRect();
        const layerRect = labelLayer.getBoundingClientRect();
        const labelMidY = rect.top - layerRect.top + rect.height * 0.5;
        const isLeft = item.def.side === 'left';
        const lx = isLeft
          ? rect.right - layerRect.left + 2
          : rect.left - layerRect.left - 2;
        const gx = guide.x;
        const gy = guide.y;

        connectorCtx.strokeStyle = item.def.color;
        connectorCtx.beginPath();
        connectorCtx.moveTo(lx, labelMidY);
        const elbowX = isLeft ? lx + 14 : lx - 14;
        connectorCtx.lineTo(elbowX, labelMidY);
        connectorCtx.lineTo(gx, gy);
        connectorCtx.stroke();
      }
    }

    function lockHorizontalOrbit() {
      if (!camera || !controls) return;
      orbitOffset.copy(camera.position).sub(controls.target);
      orbitSpherical.setFromVector3(orbitOffset);
      controls.minPolarAngle = orbitSpherical.phi;
      controls.maxPolarAngle = orbitSpherical.phi;
      controls.minAzimuthAngle = -Infinity;
      controls.maxAzimuthAngle = Infinity;
    }

    function fitCamera() {
      if (!modelRoot) return;
      const box = new THREE.Box3().setFromObject(modelRoot);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z, 0.01);
      const aspect = layoutW / Math.max(layoutH, 1);
      const distMul = aspect < 0.75 ? 2.55 : aspect < 1.1 ? 2.35 : 2.15;
      const dist = maxDim * distMul;
      camera.position.set(center.x, center.y, center.z + dist);
      controls.target.copy(center);
      controls.minDistance = maxDim * 0.7;
      controls.maxDistance = maxDim * 3.2;
      lockHorizontalOrbit();
      controls.update();
      layoutLabelsScreen();
    }

    function initScene() {
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0xe8eaee);

      layoutW = window.innerWidth;
      layoutH = window.innerHeight;
      camera = new THREE.PerspectiveCamera(36, layoutW / layoutH, 0.01, 200);
      camera.position.set(0, 1.1, 2.6);

      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(layoutW, layoutH, false);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;

      connectorCanvas.width = layoutW;
      connectorCanvas.height = layoutH;

      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.enablePan = false;
      controls.rotateSpeed = 0.78;
      controls.zoomSpeed = 1.0;
      controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY };

      const hemi = new THREE.HemisphereLight(0xffffff, 0xb8bcc4, 1.05);
      scene.add(hemi);
      const key = new THREE.DirectionalLight(0xffffff, 1.2);
      key.position.set(2, 4, 3);
      scene.add(key);
      const fill = new THREE.DirectionalLight(0xdde8ff, 0.45);
      fill.position.set(-2.5, 1.5, -2);
      scene.add(fill);

      window.addEventListener('resize', onResize);
      animate();
    }

    function onResize() {
      layoutW = window.innerWidth;
      layoutH = window.innerHeight;
      camera.aspect = layoutW / layoutH;
      camera.updateProjectionMatrix();
      renderer.setSize(layoutW, layoutH, false);
      connectorCanvas.width = layoutW;
      connectorCanvas.height = layoutH;
      if (modelRoot) fitCamera();
    }

    function animate() {
      requestAnimationFrame(animate);
      controls?.update();
      renderer?.render(scene, camera);
      layoutLabelsScreen();
      drawConnectors();
    }

    function clearLabels() {
      labelLayer.innerHTML = '';
      labelItems = [];
      connectorCtx?.clearRect(0, 0, layoutW, layoutH);
    }

    function attachLabels(config) {
      clearLabels();
      for (const def of config || []) {
        const el = createLabelDom(def);
        labelLayer.appendChild(el);
        labelItems.push({
          el,
          def,
          guidePoint: new THREE.Vector3(),
          labelY: null,
          guideX: null,
          guideY: null,
        });
      }
      layoutLabelsScreen();
      updateLabelFocus();
      updateLabelValues();
    }

    async function loadModel(url) {
      const gen = ++loadGen;
      loading.style.display = 'flex';
      errEl.style.display = 'none';
      if (modelRoot) {
        scene.remove(modelRoot);
        modelRoot = null;
        modelLocalBox = null;
      }

      const loader = new GLTFLoader();
      try {
        const gltf = await loader.loadAsync(url);
        if (gen !== loadGen) return;
        modelRoot = gltf.scene;
        scene.add(modelRoot);
        calibrateModelLocalBox();
        fitCamera();
        loading.style.display = 'none';
        post('ready', {});
      } catch (e) {
        if (gen !== loadGen) return;
        loading.style.display = 'none';
        errEl.style.display = 'flex';
        post('error', { message: String(e?.message || e) });
      }
    }

    window.__vtailorMeasurement = {
      setModelUrl(url) {
        glbUrl = url || '';
        if (glbUrl) loadModel(glbUrl);
      },
      setLabels(config) {
        attachLabels(config);
      },
      setFocusedLabel(id) {
        focusedLabelId = id || null;
        updateLabelFocus();
      },
      setMeasurementValues(values) {
        measurementValues = values && typeof values === 'object' ? values : {};
        updateLabelValues();
      },
    };

    initScene();
    post('shellReady', {});
  </script>
</body>
</html>`;
}

export function injectMeasurementModelScript(glbUrl: string): string {
  return `(function(){try{window.__vtailorMeasurement&&window.__vtailorMeasurement.setModelUrl('${escapeJsString(glbUrl)}');}catch(e){}})();true;`;
}

export function injectMeasurementLabelsScript(labels: MeasurementLabelDef[]): string {
  const json = JSON.stringify(labels).replace(/</g, '\\u003c');
  return `(function(){try{window.__vtailorMeasurement&&window.__vtailorMeasurement.setLabels(${json});}catch(e){}})();true;`;
}

export function injectMeasurementFocusScript(focusedLabelId: string | null): string {
  const id = focusedLabelId ? `'${escapeJsString(focusedLabelId)}'` : 'null';
  return `(function(){try{window.__vtailorMeasurement&&window.__vtailorMeasurement.setFocusedLabel(${id});}catch(e){}})();true;`;
}

export function injectMeasurementValuesScript(values: Record<string, string | undefined>): string {
  const json = JSON.stringify(values).replace(/</g, '\\u003c');
  return `(function(){try{window.__vtailorMeasurement&&window.__vtailorMeasurement.setMeasurementValues(${json});}catch(e){}})();true;`;
}

export function buildMeasurementViewerHtml(
  glbUrl: string,
  labels: MeasurementLabelDef[],
  focusedLabelId?: string | null,
): string {
  const shell = buildMeasurementViewerShellHtml();
  const labelsJson = JSON.stringify(labels).replace(/</g, '\\u003c');
  const focus = focusedLabelId ? `'${escapeJsString(focusedLabelId)}'` : 'null';
  const inject = `
<script>
(function(){
  function boot(){
    if(!window.__vtailorMeasurement){ setTimeout(boot, 40); return; }
    window.__vtailorMeasurement.setLabels(${labelsJson});
    window.__vtailorMeasurement.setFocusedLabel(${focus});
    window.__vtailorMeasurement.setModelUrl('${escapeJsString(glbUrl)}');
  }
  boot();
})();
</script>`;
  return shell.replace('</body>', `${inject}</body>`);
}

export function measurementViewerContainerId(): string {
  return 'vtailor-measurement-viewer-root';
}

export { escapeHtml };
