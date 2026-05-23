const MODEL_VIEWER_SCRIPT =
  'https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js';

let loadPromise: Promise<void> | null = null;

/** Load Google model-viewer once (web + WebView HTML). */
export function ensureModelViewerScript(): Promise<void> {
  if (typeof document === 'undefined') return Promise.resolve();
  if (customElements.get('model-viewer')) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-vtailor-mv="1"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('model-viewer script failed')), {
        once: true,
      });
      return;
    }

    const script = document.createElement('script');
    script.type = 'module';
    script.src = MODEL_VIEWER_SCRIPT;
    script.dataset.vtailorMv = '1';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Could not load model-viewer script'));
    document.head.appendChild(script);
  });

  return loadPromise;
}
