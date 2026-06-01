function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Stable shell — model-viewer script loads once; GLB swaps via `injectModelViewerGlbScript`. */
export function buildModelViewerShellHtml(): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js"></script>
  <style>
    html, body { margin: 0; height: 100%; background: #f4f6f8; overflow: hidden; }
    model-viewer {
      width: 100%;
      height: 100%;
      display: block;
      --poster-color: transparent;
      --progress-bar-color: transparent;
    }
    #controls {
      position: absolute;
      right: 10px;
      bottom: 12px;
      z-index: 5;
      display: flex;
      flex-direction: column;
      gap: 8px;
      align-items: center;
      user-select: none;
      -webkit-user-select: none;
      touch-action: none;
    }
    .control-pill {
      width: 48px;
      height: 48px;
      border: 0;
      border-radius: 999px;
      background: rgba(15, 23, 42, 0.82);
      color: #fff;
      font-size: 24px;
      font-weight: 700;
      box-shadow: 0 8px 20px rgba(15, 23, 42, 0.22);
    }
    .control-label {
      margin-top: 2px;
      font-family: system-ui, sans-serif;
      font-size: 11px;
      color: #334155;
      background: rgba(255, 255, 255, 0.88);
      padding: 4px 8px;
      border-radius: 999px;
    }
    #err {
      display: none;
      padding: 16px;
      font-family: system-ui, sans-serif;
      font-size: 13px;
      color: #64748b;
      text-align: center;
    }
  </style>
</head>
<body>
  <model-viewer
    id="mv"
    camera-controls
    touch-action="none"
    auto-rotate="false"
    min-camera-orbit="auto 88deg auto"
    max-camera-orbit="auto 88deg auto"
    shadow-intensity="1.18"
    exposure="1.38"
    tone-mapping="aces"
    environment-image="neutral"
    interaction-prompt="none"
    camera-orbit="0deg 88deg auto"
    field-of-view="22deg"
    alt="Dress 3D preview"
  ></model-viewer>
  <div id="err">Could not load 3D model. Check Wi-Fi and that the API server is running.</div>
  <div id="controls" aria-label="Move model up or down">
    <button id="upBtn" class="control-pill" type="button" aria-label="Move model up">↑</button>
    <button id="downBtn" class="control-pill" type="button" aria-label="Move model down">↓</button>
    <div class="control-label">Drag up / down</div>
  </div>
  <script>
    const MV_SOURCE = 'vtailor-mv';
    const mv = document.getElementById('mv');
    const err = document.getElementById('err');
    const upBtn = document.getElementById('upBtn');
    const downBtn = document.getElementById('downBtn');
    let loadGen = 0;
    let loadWatchTimer = null;
    let baseTarget = null;
    let targetYOffset = 0;
    let targetStep = 0.04;
    let dragStartY = null;
    let dragStartOffset = 0;
    function stripReloadParam(u) {
      return String(u || '')
        .replace(/[?&]vt_reload=\\d+/g, '')
        .replace(/[?&]$/, '');
    }
    function clamp(value, min, max) {
      return Math.min(max, Math.max(min, value));
    }
    function applyCameraTarget() {
      if (!baseTarget) return;
      const nextY = baseTarget.y + targetYOffset;
      mv.cameraTarget = baseTarget.x.toFixed(3) + 'm ' + nextY.toFixed(3) + 'm ' + baseTarget.z.toFixed(3) + 'm';
    }
    function setTargetFromModel() {
      const center = mv.getBoundingBoxCenter && mv.getBoundingBoxCenter();
      const dim = mv.getDimensions && mv.getDimensions();
      if (center) {
        baseTarget = { x: center.x, y: center.y, z: center.z };
        if (dim && dim.y > 0.01) {
          const maxDim = Math.max(dim.x, dim.y, dim.z);
          targetStep = Math.max(0.02, maxDim * 0.04);
          targetYOffset = clamp(targetYOffset, -maxDim * 0.25, maxDim * 0.25);
        }
        applyCameraTarget();
      }
    }
    function post(type, detail) {
      const msg = { source: MV_SOURCE, type, detail };
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(msg));
      }
      try {
        window.parent.postMessage(msg, '*');
      } catch (_) {}
    }
    function frameDress() {
      try {
        mv.autoRotate = false;
        mv.removeAttribute('auto-rotate');
        mv.setAttribute('auto-rotate', 'false');
        const dim = mv.getDimensions && mv.getDimensions();
        if (dim && dim.y > 0.01) {
          var maxDim = Math.max(dim.x, dim.y, dim.z);
          mv.cameraOrbit = '0deg 88deg ' + Math.round(maxDim * 102) + '%';
          mv.fieldOfView = '22deg';
        }
        setTargetFromModel();
        if (typeof mv.updateFraming === 'function') mv.updateFraming();
      } catch (_) {}
    }
    function nudgeTarget(delta) {
      if (!baseTarget) return;
      targetYOffset = clamp(targetYOffset + delta, -3, 3);
      applyCameraTarget();
    }
    function attachDragControl(btn, direction) {
      btn.addEventListener('pointerdown', function (event) {
        event.preventDefault();
        dragStartY = event.clientY;
        dragStartOffset = targetYOffset;
        btn.setPointerCapture && btn.setPointerCapture(event.pointerId);
      });
      btn.addEventListener('pointermove', function (event) {
        if (dragStartY == null || !btn.hasPointerCapture || !btn.hasPointerCapture(event.pointerId)) return;
        const delta = (dragStartY - event.clientY) * 0.0025;
        targetYOffset = clamp(dragStartOffset + delta * direction, -3, 3);
        applyCameraTarget();
      });
      btn.addEventListener('pointerup', function (event) {
        dragStartY = null;
        try { btn.releasePointerCapture && btn.releasePointerCapture(event.pointerId); } catch (_) {}
      });
      btn.addEventListener('pointercancel', function () {
        dragStartY = null;
      });
      btn.addEventListener('click', function () {
        nudgeTarget(targetStep * direction);
      });
    }
    attachDragControl(upBtn, 1);
    attachDragControl(downBtn, -1);
    function clearLoadWatch() {
      if (loadWatchTimer) {
        clearTimeout(loadWatchTimer);
        loadWatchTimer = null;
      }
    }
    function finishLoad(gen) {
      if (gen !== loadGen) return;
      clearLoadWatch();
      frameDress();
      requestAnimationFrame(frameDress);
      setTimeout(function () {
        if (gen === loadGen) frameDress();
      }, 120);
      afterModelReady();
      post('loaded');
    }
    function failLoad(gen) {
      if (gen !== loadGen) return;
      clearLoadWatch();
      err.style.display = 'block';
      post('error');
    }
    function armLoadWatch(gen) {
      clearLoadWatch();
      loadWatchTimer = setTimeout(function () {
        if (gen !== loadGen) return;
        if (mv.model) finishLoad(gen);
        else failLoad(gen);
      }, 45000);
    }
    mv.addEventListener('load', function () {
      finishLoad(loadGen);
    });
    mv.addEventListener('error', function () {
      failLoad(loadGen);
    });
    function srgbByteToLinear(byte) {
      var c = byte / 255;
      return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    }
    function hexToFactor(hex) {
      var h = String(hex || '').replace('#', '');
      if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
      if (h.length !== 6) return null;
      var r = parseInt(h.slice(0, 2), 16);
      var g = parseInt(h.slice(2, 4), 16);
      var b = parseInt(h.slice(4, 6), 16);
      return [srgbByteToLinear(r), srgbByteToLinear(g), srgbByteToLinear(b), 1];
    }
    var currentGlbUrl = '';
    function urlIsGrarah(url) {
      return /grarah|3d-grarah/i.test(String(url || ''));
    }
    function grarahHasEmbeddedTextures(url) {
      return /\\/optimized\\/optimized-|grarah\\/[^/]+-optimized\\/optimized-/i.test(String(url || ''));
    }
    function urlPreservesEmbeddedMaterials(url) {
      if (urlIsGrarah(url) && grarahHasEmbeddedTextures(url)) return true;
      if (urlIsGrarah(url)) return false;
      return /saree|lehnga|bridal|embroid|long[\\s-]?frock/i.test(String(url || ''));
    }
    function urlIsTexturedBridalOrLehnga(url) {
      return /lehnga|bridal/i.test(String(url || ''));
    }
    function urlIsCasualFabricDress(url) {
      return /patiyala|bell-bottom|tulip-trouser|trouser-shirt|trouser shirt/i.test(String(url || ''));
    }
    function urlIsFrillSaree(url) {
      return /frill[\s_-]?saree|sari\\/frill|frill sari|flirred|flired/i.test(String(url || ''));
    }
    function fabricRoughnessForUrl(url) {
      return urlIsFrillSaree(url) ? 0.54 : 0.68;
    }
    function applyViewerLighting(url) {
      try {
        mv.setAttribute('environment-image', 'neutral');
        mv.setAttribute('tone-mapping', 'aces');
        if (urlIsCasualFabricDress(url)) {
          mv.exposure = '1.35';
          mv.setAttribute('shadow-intensity', '1.15');
        } else if (urlIsFrillSaree(url)) {
          mv.exposure = '1.4';
          mv.setAttribute('shadow-intensity', '1.18');
        } else if (urlIsTexturedBridalOrLehnga(url)) {
          mv.exposure = '1.42';
          mv.setAttribute('shadow-intensity', '1.2');
        } else if (urlIsGrarah(url) && grarahHasEmbeddedTextures(url)) {
          mv.exposure = '1.38';
          mv.setAttribute('shadow-intensity', '1.18');
        } else if (urlIsGrarah(url)) {
          mv.exposure = '1.28';
          mv.setAttribute('shadow-intensity', '1.08');
        } else if (urlPreservesEmbeddedMaterials(url)) {
          mv.exposure = '1.36';
          mv.setAttribute('shadow-intensity', '1.15');
        } else {
          mv.exposure = '1.32';
          mv.setAttribute('shadow-intensity', '1.12');
        }
      } catch (_) {}
    }
    function isDressFabricMaterial(name) {
      return !/mannequin|mannicun|human|skin|hair|face|hand|foot|shoe|eye|lash/i.test(name || '');
    }
    function applyWeddingDressColor(hex) {
      if (!hex || !mv.model || !mv.model.materials || !urlIsGrarah(currentGlbUrl)) return;
      if (grarahHasEmbeddedTextures(currentGlbUrl)) return;
      var factor = hexToFactor(hex);
      if (!factor) return;
      try {
        mv.model.materials.forEach(function (mat) {
          var pbr = mat.pbrMetallicRoughness;
          if (!pbr) return;
          if (pbr.baseColorTexture && pbr.baseColorTexture.setTexture) {
            try { pbr.baseColorTexture.setTexture(null); } catch (_) {}
          }
          if (pbr.setMetallicFactor) pbr.setMetallicFactor(0);
          if (pbr.setRoughnessFactor) pbr.setRoughnessFactor(0.68);
          if (pbr.setBaseColorFactor) pbr.setBaseColorFactor(factor);
        });
      } catch (_) {}
    }
    function applyDressFabricMaterials() {
      if (!mv.model || !mv.model.materials) return;
      var rough = fabricRoughnessForUrl(currentGlbUrl);
      try {
        mv.model.materials.forEach(function (mat) {
          if (!isDressFabricMaterial(mat.name)) return;
          var pbr = mat.pbrMetallicRoughness;
          if (!pbr) return;
          if (pbr.setMetallicFactor) pbr.setMetallicFactor(0);
          if (pbr.setRoughnessFactor) pbr.setRoughnessFactor(rough);
        });
      } catch (_) {}
    }
    /** All dress models: fabric shade (keeps embroidery maps on textured GLBs). */
    function applyFabricColor(hex) {
      if (!hex || !mv.model || !mv.model.materials) return;
      if (window.__vtailorFabricTexUrl) return;
      if (urlIsGrarah(currentGlbUrl) && grarahHasEmbeddedTextures(currentGlbUrl)) return;
      if (urlPreservesEmbeddedMaterials(currentGlbUrl)) return;
      var factor = hexToFactor(hex);
      if (!factor) return;
      var keepMaps = urlIsCasualFabricDress(currentGlbUrl);
      var rough = fabricRoughnessForUrl(currentGlbUrl);
      try {
        mv.model.materials.forEach(function (mat) {
          if (!isDressFabricMaterial(mat.name)) return;
          var pbr = mat.pbrMetallicRoughness;
          if (!pbr) return;
          if (!keepMaps && pbr.baseColorTexture && pbr.baseColorTexture.setTexture) {
            try { pbr.baseColorTexture.setTexture(null); } catch (_) {}
          }
          if (pbr.setMetallicFactor) pbr.setMetallicFactor(0);
          if (pbr.setRoughnessFactor) pbr.setRoughnessFactor(rough);
          if (pbr.setBaseColorFactor) pbr.setBaseColorFactor(factor);
        });
      } catch (_) {}
    }
    async function applyFabricTexture(texUrl) {
      if (!texUrl || !mv.model || !mv.model.materials) return;
      if (!urlIsCasualFabricDress(currentGlbUrl) && !/patiyala|trouser-shirt|bell-bottom|tulip-trouser/i.test(String(currentGlbUrl || ''))) return;
      try {
        var meta = window.__vtailorFabricPatternMeta || {};
        var megatileUrl = window.__vtailorFabricMegatileUrl || '';
        var useMega = megatileUrl && megatileUrl !== texUrl;
        var sampleUrl = useMega ? megatileUrl : texUrl;
        var motifCm = Math.max(meta.motifSizeCm || 8, 2.5);
        var garmentW = 0.48;
        var garmentH = 0.72;
        var motifsU = garmentW / (motifCm / 100);
        var motifsV = garmentH / (motifCm / 100);
        var scaleU, scaleV;
        if (useMega) {
          var grid = 6;
          scaleU = Math.max(0.35, Math.min(5, motifsU / grid));
          scaleV = Math.max(0.35, Math.min(5, motifsV / grid));
        } else {
          scaleU = Math.max(2, Math.min(28, motifsU));
          var tileAspect = (meta.tileWidth && meta.tileHeight) ? meta.tileWidth / meta.tileHeight : 1;
          scaleV = Math.max(2, Math.min(28, motifsV / Math.max(tileAspect, 0.01)));
        }
        var texture = await mv.createTexture(sampleUrl);
        var rough = fabricRoughnessForUrl(currentGlbUrl);
        mv.model.materials.forEach(function (mat) {
          if (!isDressFabricMaterial(mat.name)) return;
          var pbr = mat.pbrMetallicRoughness;
          if (!pbr || !pbr.baseColorTexture) return;
          pbr.baseColorTexture.setTexture(texture);
          if (pbr.baseColorTexture.setTransform) {
            pbr.baseColorTexture.setTransform({
              scale: [scaleU, scaleV],
              offset: [0, 0],
              rotation: 0
            });
          }
          if (pbr.setMetallicFactor) pbr.setMetallicFactor(0);
          if (pbr.setRoughnessFactor) pbr.setRoughnessFactor(rough);
          if (pbr.setBaseColorFactor) pbr.setBaseColorFactor([1, 1, 1, 1]);
        });
      } catch (_) {}
    }
    function afterModelReady() {
      applyViewerLighting(currentGlbUrl);
      applyDressFabricMaterials();
      applyWeddingDressColor(window.__vtailorWeddingHex);
      applyFabricTexture(window.__vtailorFabricTexUrl);
      applyFabricColor(window.__vtailorFabricHex);
    }
    window.__vtailorSetFabricTexture = applyFabricTexture;
    window.__vtailorSetFabricColor = applyFabricColor;
    window.__vtailorSetWeddingColor = applyWeddingDressColor;
    window.__vtailorSetGlb = function (url) {
      if (!url) return;
      var gen = ++loadGen;
      currentGlbUrl = url;
      err.style.display = 'none';
      baseTarget = null;
      targetYOffset = 0;
      post('loading');
      applyViewerLighting(url);
      var base = stripReloadParam(url);
      var currentBase = stripReloadParam(mv.src || '');
      if (currentBase === base && mv.model) {
        finishLoad(gen);
        return;
      }
      var loadUrl = url;
      if (currentBase === base) {
        loadUrl = url + (url.indexOf('?') >= 0 ? '&' : '?') + 'vt_reload=' + Date.now();
      }
      armLoadWatch(gen);
      try { mv.dismissPoster && mv.dismissPoster(); } catch (_) {}
      mv.src = loadUrl;
    };
    post('ready');
  </script>
</body>
</html>`;
}

/** JS injected from React Native to swap GLB without remounting the WebView. */
export function injectModelViewerGlbScript(glbUrl: string): string {
  return `(function(){try{window.__vtailorSetGlb&&window.__vtailorSetGlb(${JSON.stringify(glbUrl)});}catch(e){}})();true;`;
}

export function injectModelViewerFabricColorScript(hex: string | null): string {
  const payload = hex ? JSON.stringify(hex) : 'null';
  return `(function(){try{window.__vtailorFabricHex=${payload};window.__vtailorSetFabricColor&&window.__vtailorSetFabricColor(window.__vtailorFabricHex);}catch(e){}})();true;`;
}

export function injectModelViewerFabricTextureScript(
  url: string | null,
  meta?: Record<string, unknown> | null,
  megatileUrl?: string | null,
): string {
  const payload = url ? JSON.stringify(url) : 'null';
  const metaPayload = meta ? JSON.stringify(meta) : 'null';
  const megaPayload = megatileUrl ? JSON.stringify(megatileUrl) : 'null';
  return `(function(){try{window.__vtailorFabricTexUrl=${payload};window.__vtailorFabricPatternMeta=${metaPayload};window.__vtailorFabricMegatileUrl=${megaPayload};window.__vtailorSetFabricTexture&&window.__vtailorSetFabricTexture(window.__vtailorFabricTexUrl);}catch(e){}})();true;`;
}

export function injectModelViewerWeddingColorScript(hex: string | null): string {
  const payload = hex ? JSON.stringify(hex) : 'null';
  return `(function(){try{window.__vtailorWeddingHex=${payload};window.__vtailorSetWeddingColor&&window.__vtailorSetWeddingColor(window.__vtailorWeddingHex);}catch(e){}})();true;`;
}

/** Inline HTML for WebView fallback — preserves GLB materials via model-viewer. */
export function buildModelViewerHtml(glbUrl: string): string {
  const src = escapeAttr(glbUrl);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js"></script>
  <style>
    html, body { margin: 0; height: 100%; background: #f4f6f8; overflow: hidden; }
    model-viewer {
      width: 100%;
      height: 100%;
      display: block;
      --poster-color: transparent;
      --progress-bar-color: transparent;
    }
    #err {
      display: none;
      padding: 16px;
      font-family: system-ui, sans-serif;
      font-size: 13px;
      color: #64748b;
      text-align: center;
    }
  </style>
</head>
<body>
  <model-viewer
    id="mv"
    src="${src}"
    camera-controls
    touch-action="none"
    auto-rotate="false"
    min-camera-orbit="auto 88deg auto"
    max-camera-orbit="auto 88deg auto"
    shadow-intensity="1.18"
    exposure="1.38"
    tone-mapping="aces"
    environment-image="neutral"
    interaction-prompt="none"
    camera-orbit="0deg 88deg auto"
    field-of-view="22deg"
    alt="Dress 3D preview"
  ></model-viewer>
  <div id="err">Could not load 3D model. Check Wi-Fi and that the API server is running.</div>
  <script>
    const MV_SOURCE = 'vtailor-mv';
    const mv = document.getElementById('mv');
    const err = document.getElementById('err');
    function post(type, detail) {
      const msg = { source: MV_SOURCE, type, detail };
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(msg));
      }
      try {
        window.parent.postMessage(msg, '*');
      } catch (_) {}
    }
    function frameDress() {
      try {
        mv.autoRotate = false;
        mv.setAttribute('auto-rotate', 'false');
        const center = mv.getBoundingBoxCenter && mv.getBoundingBoxCenter();
        const dim = mv.getDimensions && mv.getDimensions();
        if (center) {
          mv.cameraTarget = center.x.toFixed(3) + 'm ' + center.y.toFixed(3) + 'm ' + center.z.toFixed(3) + 'm';
        }
        if (dim && dim.y > 0.01) {
          var maxDim = Math.max(dim.x, dim.y, dim.z);
          mv.cameraOrbit = '0deg 88deg ' + Math.round(maxDim * 102) + '%';
          mv.fieldOfView = '22deg';
        }
        if (typeof mv.updateFraming === 'function') mv.updateFraming();
      } catch (_) {}
    }
    mv.addEventListener('load', () => {
      frameDress();
      requestAnimationFrame(frameDress);
      [80, 200, 450, 900].forEach(function (ms) { setTimeout(frameDress, ms); });
      post('loaded');
    });
    mv.addEventListener('error', () => {
      err.style.display = 'block';
      post('error');
    });
  </script>
</body>
</html>`;
}

export function modelViewerBaseUrl(glbUrl: string): string {
  try {
    const u = new URL(glbUrl);
    if (/^https?:$/i.test(u.protocol)) return u.origin;
  } catch {
    /* fall through */
  }
  return 'https://res.cloudinary.com';
}
