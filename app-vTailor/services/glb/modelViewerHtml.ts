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
    camera-orbit="0deg 75deg auto"
    field-of-view="auto"
    alt="Dress 3D preview"
  ></model-viewer>
  <div id="err">Could not load 3D model. Check Wi-Fi and that the API server is running.</div>
  <script>
    const MV_SOURCE = 'vtailor-mv';
    const mv = document.getElementById('mv');
    const err = document.getElementById('err');
    let loadBound = false;
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
        const center = mv.getBoundingBoxCenter && mv.getBoundingBoxCenter();
        const dim = mv.getDimensions && mv.getDimensions();
        if (center) {
          mv.cameraTarget = center.x.toFixed(3) + 'm ' + center.y.toFixed(3) + 'm ' + center.z.toFixed(3) + 'm';
        }
        if (dim && dim.y > 0.01) {
          var maxDim = Math.max(dim.x, dim.y, dim.z);
          mv.cameraOrbit = '0deg 75deg ' + Math.round(maxDim * 88) + '%';
          mv.fieldOfView = '18deg';
        }
        if (typeof mv.updateFraming === 'function') mv.updateFraming();
        if (center && typeof mv.zoom === 'function') mv.zoom(0.15);
      } catch (_) {}
    }
    function bindLoadOnce() {
      if (loadBound) return;
      loadBound = true;
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
    }
    bindLoadOnce();
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
      currentGlbUrl = url;
      err.style.display = 'none';
      post('loading');
      applyViewerLighting(url);
      if (mv.src === url) {
        frameDress();
        afterModelReady();
        post('loaded');
        return;
      }
      mv.src = url;
    };
    mv.addEventListener('load', function () {
      afterModelReady();
    });
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
    camera-orbit="0deg 75deg auto"
    field-of-view="auto"
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
        const center = mv.getBoundingBoxCenter && mv.getBoundingBoxCenter();
        const dim = mv.getDimensions && mv.getDimensions();
        if (center) {
          mv.cameraTarget = center.x.toFixed(3) + 'm ' + center.y.toFixed(3) + 'm ' + center.z.toFixed(3) + 'm';
        }
        if (dim && dim.y > 0.01) {
          var maxDim = Math.max(dim.x, dim.y, dim.z);
          mv.cameraOrbit = '0deg 75deg ' + Math.round(maxDim * 88) + '%';
          mv.fieldOfView = '18deg';
        }
        if (typeof mv.updateFraming === 'function') mv.updateFraming();
        if (center && typeof mv.zoom === 'function') mv.zoom(0.15);
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
