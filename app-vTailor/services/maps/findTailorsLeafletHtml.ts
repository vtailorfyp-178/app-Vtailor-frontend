/** Inline Leaflet + OpenStreetMap shell for Find Tailors (no Google API key). */
export function buildFindTailorsLeafletHtml(): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; margin: 0; padding: 0; background: #eef2f7; }
    .leaflet-control-attribution { font-size: 9px; }
    .ftm-marker-wrap { background: transparent; border: none; }
    .ftm-marker {
      width: 44px;
      height: 44px;
      border-radius: 22px;
      border: 2px solid #d1d5db;
      background: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.12);
      font-weight: 800;
      font-size: 13px;
      color: #111827;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      overflow: hidden;
    }
    .ftm-marker img {
      width: 40px;
      height: 40px;
      border-radius: 20px;
      object-fit: cover;
    }
    .ftm-marker .dot {
      width: 10px;
      height: 10px;
      border-radius: 5px;
      border: 2px solid #fff;
      position: absolute;
      right: 1px;
      bottom: 1px;
    }
    .ftm-user-dot {
      width: 14px;
      height: 14px;
      border-radius: 7px;
      background: #2563eb;
      border: 2px solid #fff;
      box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.35);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    (function () {
      var map = null;
      var markerLayer = null;
      var userMarker = null;
      var suppressMoveEnd = false;
      var moveEndTimer = null;

      function post(msg) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify(msg));
        }
      }

      function regionFromMap() {
        var c = map.getCenter();
        var b = map.getBounds();
        return {
          latitude: c.lat,
          longitude: c.lng,
          latitudeDelta: Math.max(0.002, b.getNorth() - b.getSouth()),
          longitudeDelta: Math.max(0.002, b.getEast() - b.getWest()),
        };
      }

      function markerHtml(m) {
        var inner = m.avatarUrl
          ? '<img src="' + m.avatarUrl.replace(/"/g, '') + '" alt="" />'
          : '<span>' + (m.initials || '?') + '</span>';
        var border = m.selected ? (m.tint || '#ec4899') : '#d1d5db';
        var dotColor = m.available ? '#16a34a' : '#9ca3af';
        return (
          '<div class="ftm-marker" style="border-color:' + border + '">' +
          inner +
          '<div class="dot" style="background:' + dotColor + '"></div></div>'
        );
      }

      function zoomFromDelta(latDelta) {
        var d = latDelta || 0.035;
        var z = Math.round(Math.log2(360 / d)) - 1;
        return Math.max(8, Math.min(16, z));
      }

      function ensureMap(initial) {
        if (map) return;
        map = L.map('map', { zoomControl: true, attributionControl: true });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap',
        }).addTo(map);
        markerLayer = L.layerGroup().addTo(map);

        var lat = initial.latitude;
        var lng = initial.longitude;
        map.setView([lat, lng], zoomFromDelta(initial.latitudeDelta));

        map.on('moveend', function () {
          if (suppressMoveEnd) return;
          clearTimeout(moveEndTimer);
          moveEndTimer = setTimeout(function () {
            post({ type: 'regionChange', region: regionFromMap() });
          }, 120);
        });
      }

      window.__ftmApply = function (payload) {
        if (!payload) return;
        ensureMap(payload.initialRegion || { latitude: 31.5204, longitude: 74.3587, latitudeDelta: 0.035, longitudeDelta: 0.025 });

        if (payload.flyTo) {
          suppressMoveEnd = true;
          var r = payload.flyTo;
          var z = zoomFromDelta(r.latitudeDelta);
          map.flyTo([r.latitude, r.longitude], z, { duration: (payload.flyDurationMs || 450) / 1000 });
          setTimeout(function () { suppressMoveEnd = false; }, (payload.flyDurationMs || 450) + 80);
        }

        markerLayer.clearLayers();
        (payload.markers || []).forEach(function (m) {
          var icon = L.divIcon({
            className: 'ftm-marker-wrap',
            html: markerHtml(m),
            iconSize: [44, 44],
            iconAnchor: [22, 22],
          });
          var lm = L.marker([m.lat, m.lng], { icon: icon });
          lm.on('click', function () {
            post({ type: 'markerPress', id: m.id });
          });
          markerLayer.addLayer(lm);
        });

        if (payload.userLocation && typeof payload.userLocation.lat === 'number') {
          if (!userMarker) {
            var uIcon = L.divIcon({
              className: 'ftm-marker-wrap',
              html: '<div class="ftm-user-dot"></div>',
              iconSize: [14, 14],
              iconAnchor: [7, 7],
            });
            userMarker = L.marker([payload.userLocation.lat, payload.userLocation.lng], { icon: uIcon, zIndexOffset: 1000 });
            userMarker.addTo(map);
          } else {
            userMarker.setLatLng([payload.userLocation.lat, payload.userLocation.lng]);
          }
        } else if (userMarker) {
          map.removeLayer(userMarker);
          userMarker = null;
        }
      };

      post({ type: 'ready' });
    })();
  </script>
</body>
</html>`;
}

export type FindTailorsLeafletMarker = {
  id: string;
  lat: number;
  lng: number;
  initials: string;
  avatarUrl?: string;
  available: boolean;
  selected: boolean;
  tint: string;
};

export type FindTailorsLeafletRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

export function injectFindTailorsMapUpdate(payload: {
  initialRegion: FindTailorsLeafletRegion;
  markers: FindTailorsLeafletMarker[];
  userLocation?: { lat: number; lng: number } | null;
  flyTo?: FindTailorsLeafletRegion;
  flyDurationMs?: number;
}): string {
  return `(function(){try{if(window.__ftmApply)window.__ftmApply(${JSON.stringify(payload)});}catch(e){}})();true;`;
}
