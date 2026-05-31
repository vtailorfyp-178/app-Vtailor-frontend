import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { NativeModules, Platform } from 'react-native';
import { getCandidateBaseUrls } from '@/services/apiBase';
import { apiBaseToOrigin } from '@/services/glb/glbApiOrigin';

const STORED_MODELS_API_KEY = '@vtailor_models_api_url';
const REQUEST_TIMEOUT_MS = 20000;
const HEALTH_TIMEOUT_MS = 6000;

let cachedModelsApiUrl: string | null = null;
let storedLoaded = false;
let verifiedBasesCache: { urls: string[]; at: number } | null = null;
const VERIFIED_TTL_MS = 45_000;

function extractHostFromScriptUrl(): string | null {
  try {
    const scriptURL: string | undefined = (NativeModules as any)?.SourceCode?.scriptURL;
    if (!scriptURL) return null;
    const host = String(scriptURL)
      .replace(/^.*?:\/\//, '')
      .split('/')[0]
      .replace(/:\d+$/, '')
      .trim();
    return host || null;
  } catch {
    return null;
  }
}

/** Metro dev server proxies /models and /fabric-prints → models-service :3001 */
function getMetroModelsApiBase(): string | null {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/$/, '');
  }

  const rawHosts = [
    Constants.expoConfig?.hostUri,
    (Constants as any).expoGoConfig?.hostUri,
    (Constants as any).expoConfig?.debuggerHost,
  ].filter(Boolean) as string[];

  for (const raw of rawHosts) {
    const hostWithPort = String(raw)
      .replace(/^.*?:\/\//, '')
      .split('/')[0]
      .trim();
    if (hostWithPort && hostWithPort.includes(':')) {
      return `http://${hostWithPort}`.replace(/\/$/, '');
    }
  }
  return null;
}

function normalizeModelsApiUrl(raw: string): string | null {
  const value = String(raw || '').trim().replace(/\/$/, '');
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.includes(':')) return `http://${value}`;
  return `http://${value}:3001`;
}

async function loadStoredModelsApiUrl(): Promise<void> {
  if (storedLoaded) return;
  storedLoaded = true;
  try {
    const stored = await AsyncStorage.getItem(STORED_MODELS_API_KEY);
    cachedModelsApiUrl = normalizeModelsApiUrl(stored || '');
  } catch {
    /* ignore */
  }
}

export async function rememberWorkingModelsApiUrl(url: string): Promise<void> {
  cachedModelsApiUrl = url.replace(/\/$/, '');
  verifiedBasesCache = null;
  try {
    await AsyncStorage.setItem(STORED_MODELS_API_KEY, cachedModelsApiUrl);
  } catch {
    /* ignore */
  }
}

export async function clearStoredModelsApiUrl(): Promise<void> {
  cachedModelsApiUrl = null;
  verifiedBasesCache = null;
  storedLoaded = true;
  try {
    await AsyncStorage.removeItem(STORED_MODELS_API_KEY);
  } catch {
    /* ignore */
  }
}

export function modelsApiBaseSync(): string {
  const env = normalizeModelsApiUrl(process.env.EXPO_PUBLIC_MODELS_API_URL || '');
  if (env) return env;
  if (cachedModelsApiUrl) return cachedModelsApiUrl;
  const metro = getMetroModelsApiBase();
  if (metro) return metro;
  return 'http://localhost:3001';
}

export async function getModelsApiCandidateUrls(): Promise<string[]> {
  await loadStoredModelsApiUrl();

  const urls: string[] = [];
  const envUrl = normalizeModelsApiUrl(process.env.EXPO_PUBLIC_MODELS_API_URL || '');
  if (envUrl) urls.push(envUrl);

  const scriptHost = extractHostFromScriptUrl();
  if (scriptHost && scriptHost !== 'localhost' && scriptHost !== '127.0.0.1') {
    const lan = `http://${scriptHost}:3001`;
    urls.push(lan);
  }

  const extra = Constants.expoConfig?.extra as { modelsApiUrl?: string } | undefined;
  const extraUrl = normalizeModelsApiUrl(extra?.modelsApiUrl || '');
  if (extraUrl) urls.push(extraUrl);

  if (cachedModelsApiUrl) urls.push(cachedModelsApiUrl);

  const metro = getMetroModelsApiBase();
  if (metro) urls.push(metro);

  const apiBases = await getCandidateBaseUrls();
  for (const base of apiBases) {
    const origin = apiBaseToOrigin(base);
    const derived = origin.replace(/:8000(?=\/|$)/, ':3001');
    if (derived.includes(':3001')) urls.push(derived);
  }

  if (Platform.OS === 'android') {
    urls.push('http://10.0.2.2:3001');
  }

  urls.push('http://127.0.0.1:3001', 'http://localhost:3001');

  return [...new Set(urls.filter((u) => !u.includes('/app/api')))];
}

async function verifyModelsApiBase(base: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);
    try {
      const res = await fetch(`${base}/health`, { signal: controller.signal });
      if (!res.ok) return false;
      const data = (await res.json()) as { service?: string };
      return data?.service === 'vtailor-models-service';
    } finally {
      clearTimeout(timeoutId);
    }
  } catch {
    return false;
  }
}

export async function getVerifiedModelsApiCandidateUrls(): Promise<string[]> {
  if (verifiedBasesCache && Date.now() - verifiedBasesCache.at < VERIFIED_TTL_MS) {
    return verifiedBasesCache.urls;
  }

  const candidates = await getModelsApiCandidateUrls();
  const verified: string[] = [];
  for (const base of candidates) {
    if (await verifyModelsApiBase(base)) {
      verified.push(base);
    }
  }

  verifiedBasesCache = { urls: verified, at: Date.now() };
  return verified;
}

export async function fetchWithModelsApiFallback(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const bases = await getVerifiedModelsApiCandidateUrls();

  if (!bases.length) {
    throw new Error(
      'Models API not found. Run: cd app-Vtailor/models-service && npm start. ' +
        'Then set EXPO_PUBLIC_MODELS_API_URL=http://YOUR_PC_IP:3001 in .env and restart Expo (npx expo start --clear). ' +
        'Phone browser should open http://YOUR_PC_IP:3001/health',
    );
  }

  let lastError: unknown = null;
  let last404Base: string | null = null;

  for (const base of bases) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      try {
        const response = await fetch(`${base}${path}`, {
          ...init,
          signal: controller.signal,
        });

        if (response.status === 404) {
          last404Base = base;
          continue;
        }
        if (response.status === 502 || response.status === 503) {
          continue;
        }
        if (response.ok) {
          await rememberWorkingModelsApiUrl(base);
        }
        return response;
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      lastError = error;
    }
  }

  if (last404Base) {
    await clearStoredModelsApiUrl();
    throw new Error(
      `Upload endpoint not found (404) at ${last404Base}${path}. ` +
        'Restart models-service (npm start) so /fabric-prints/upload is registered, then npx expo start --clear.',
    );
  }

  const reason = lastError instanceof Error ? lastError.message : 'Network request failed';
  throw new Error(
    `${reason}. Tried ${bases.length} model API URL(s). ` +
      'Ensure models-service runs on port 3001 and EXPO_PUBLIC_MODELS_API_URL matches your PC Wi‑Fi IP.',
  );
}
