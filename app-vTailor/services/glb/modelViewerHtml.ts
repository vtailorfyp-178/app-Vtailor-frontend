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
    shadow-intensity="1"
    exposure="1.35"
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
    let loadGen = 0;
    let loadWatchTimer = null;
    function stripReloadParam(u) {
      return String(u || '')
        .replace(/[?&]vt_reload=\\d+/g, '')
        .replace(/[?&]$/, '');
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
      [80, 200, 450].forEach(function (ms) { setTimeout(function () {
        if (gen === loadGen) frameDress();
      }, ms); });
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
      }, 14000);
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
    function applyViewerLighting(url) {
      try {
        if (urlIsGrarah(url) && grarahHasEmbeddedTextures(url)) {
          mv.exposure = '1.35';
          mv.setAttribute('shadow-intensity', '1');
        } else if (urlIsGrarah(url)) {
          mv.exposure = '1.02';
          mv.setAttribute('shadow-intensity', '0.9');
        } else {
          mv.exposure = '1.35';
          mv.setAttribute('shadow-intensity', '1');
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
          if (pbr.setMetallicFactor) pbr.setMetallicFactor(0.06);
          if (pbr.setRoughnessFactor) pbr.setRoughnessFactor(0.78);
          if (pbr.setBaseColorFactor) pbr.setBaseColorFactor(factor);
        });
      } catch (_) {}
    }
    /** Patiyala runtime tint only. */
    function applyFabricColor(hex) {
      if (!hex || !mv.model || !mv.model.materials) return;
      if (urlPreservesEmbeddedMaterials(currentGlbUrl) || urlIsGrarah(currentGlbUrl)) return;
      var factor = hexToFactor(hex);
      if (!factor) return;
      try {
        mv.model.materials.forEach(function (mat) {
          if (!isDressFabricMaterial(mat.name)) return;
          var pbr = mat.pbrMetallicRoughness;
          if (!pbr) return;
          if (pbr.baseColorTexture && pbr.baseColorTexture.setTexture) {
            try { pbr.baseColorTexture.setTexture(null); } catch (_) {}
          }
          if (pbr.setMetallicFactor) pbr.setMetallicFactor(0);
          if (pbr.setRoughnessFactor) pbr.setRoughnessFactor(0.82);
          if (pbr.setBaseColorFactor) pbr.setBaseColorFactor(factor);
        });
      } catch (_) {}
    }
    function afterModelReady() {
      applyViewerLighting(currentGlbUrl);
      applyWeddingDressColor(window.__vtailorWeddingHex);
      applyFabricColor(window.__vtailorFabricHex);
    }
    window.__vtailorSetFabricColor = applyFabricColor;
    window.__vtailorSetWeddingColor = applyWeddingDressColor;
    window.__vtailorSetGlb = function (url) {
      if (!url) return;
      var gen = ++loadGen;
      currentGlbUrl = url;
      err.style.display = 'none';
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
    shadow-intensity="1"
    exposure="1.35"
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
    return u.origin;
  } catch {
    return 'http://localhost';
  }
}
