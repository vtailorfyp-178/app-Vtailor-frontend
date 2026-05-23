import { Platform } from 'react-native';
import { isGlbArrayBuffer } from './glbBufferUtils';
import { getCachedGlbBuffer } from './glbModelCache';

const PROBE_TIMEOUT_MS = 8000;

function xhrHeadOk(uri: string): Promise<boolean> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    const timer = setTimeout(() => {
      xhr.abort();
      resolve(false);
    }, PROBE_TIMEOUT_MS);

    xhr.open('HEAD', uri, true);
    xhr.onload = () => {
      clearTimeout(timer);
      resolve(xhr.status >= 200 && xhr.status < 300);
    };
    xhr.onerror = () => {
      clearTimeout(timer);
      resolve(false);
    };
    xhr.send();
  });
}

/** Fast reachability check (HEAD). Skips full download — viewer loads the GLB once. */
export async function verifyAndPrimeGlbModelUrl(url: string): Promise<boolean> {
  const cached = getCachedGlbBuffer(url);
  if (cached && isGlbArrayBuffer(cached)) return true;

  if (Platform.OS === 'web') {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
      try {
        const res = await fetch(url, { method: 'HEAD', signal: controller.signal });
        return res.ok;
      } finally {
        clearTimeout(timer);
      }
    } catch {
      return true;
    }
  }

  const headOk = await xhrHeadOk(url);
  return headOk;
}
