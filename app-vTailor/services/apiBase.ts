import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules, Platform } from 'react-native';
import Constants from 'expo-constants';

export const API_PREFIX = '/app/api/v1';
const EMULATOR_ANDROID_HOST = '10.0.2.2';
const EXPO_API_BASE = (process.env.EXPO_PUBLIC_API_BASE_URL || '').trim();
/** Per-URL timeout; keep moderate so OTP does not hang on unreachable hosts. */
export const REQUEST_TIMEOUT_MS = 12000;
/** OTP/Stytch can be slow — allow longer on auth endpoints. */
export const AUTH_REQUEST_TIMEOUT_MS = 25000;
/** Render free tier cold start can exceed 25s — use on remote HTTPS in standalone builds. */
export const CLOUD_AUTH_REQUEST_TIMEOUT_MS = 60000;
export const CLOUD_REQUEST_TIMEOUT_MS = 45000;
/** Quick fail when direct :8000 is blocked by firewall (Metro proxy is tried next). */
export const DIRECT_API_PROBE_TIMEOUT_MS = 5000;
const STORED_API_BASE_KEY = '@vtailor_api_base_url';

const expoHostCandidates = [
  Constants.expoConfig?.hostUri,
  (Constants as any).expoGoConfig?.hostUri,
  (Constants as any).expoConfig?.debuggerHost,
  (Constants as any).expoGoConfig?.debuggerHost,
]
  .filter(Boolean)
  .map((value) => String(value).replace(/^.*?:\/\//, '').replace(/:\d+$/, '').trim())
  .filter(Boolean);

export function normalizeApiBase(raw: string): string | null {
  const value = String(raw || '').trim().replace(/\/$/, '');
  if (!value) return null;

  if (!/^https?:\/\//i.test(value)) {
    if (value.includes(':')) {
      return `http://${value}${API_PREFIX}`;
    }
    return `http://${value}:8000${API_PREFIX}`;
  }

  if (!/\/app\/api\/v1(?:\/|$)/i.test(value)) {
    return `${value}${API_PREFIX}`;
  }

  return value;
}

function getConfiguredApiBaseRaw(): string {
  const extraBase = String((Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined)?.apiBaseUrl || '').trim();
  return EXPO_API_BASE || extraBase;
}

export function getConfiguredApiBase(): string | null {
  return normalizeApiBase(getConfiguredApiBaseRaw());
}

function isStandaloneApp(): boolean {
  return (
    Constants.executionEnvironment === 'standalone' ||
    Constants.executionEnvironment === 'storeClient'
  );
}

function isRemoteCloudBase(url: string): boolean {
  if (!/^https:\/\//i.test(url)) return false;
  return !/(?:^|\/)localhost(?:[:/]|$)|127\.0\.0\.1|10\.0\.2\.2|192\.168\.|10\.\d+\.\d+\.\d+/i.test(url);
}

function isLocalDevBase(url: string): boolean {
  return /(?:^|\/)localhost(?:[:/]|$)|127\.0\.0\.1|10\.0\.2\.2|192\.168\.|10\.\d+\.\d+\.\d+|:8081(?:\/|$)|:8000(?:\/|$)/i.test(url);
}

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

function extractLanIp(url: string): string | null {
  const m = String(url).match(/^https?:\/\/(\d{1,3}(?:\.\d{1,3}){3})/);
  return m ? m[1] : null;
}

function buildBaseUrl(host: string, port = 8000) {
  return `http://${host}:${port}${API_PREFIX}`;
}

function getPreferredLanHost(): string | null {
  if (isStandaloneApp()) return null;
  const host = extractHostFromScriptUrl() || expoHostCandidates[0] || null;
  if (!host || !/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)) return null;
  return host;
}

/** In Expo Go dev, the phone already reaches Metro (e.g. 192.168.100.46:8081). */
function getMetroDevApiBase(): string | null {
  if (Platform.OS === 'web') return null;
  const rawHosts = [
    Constants.expoConfig?.hostUri,
    (Constants as any).expoGoConfig?.hostUri,
    (Constants as any).expoConfig?.debuggerHost,
    (Constants as any).expoGoConfig?.debuggerHost,
  ].filter(Boolean) as string[];

  for (const raw of rawHosts) {
    const hostWithPort = String(raw)
      .replace(/^.*?:\/\//, '')
      .split('/')[0]
      .trim();
    if (hostWithPort && hostWithPort.includes(':')) {
      return `http://${hostWithPort}${API_PREFIX}`;
    }
  }
  return null;
}

function isStaleApiBase(url: string, preferredHost: string | null): boolean {
  if (!preferredHost) return false;
  const ip = extractLanIp(url);
  if (!ip) return false;
  return ip !== preferredHost;
}

let cachedBaseUrl: string | null = getConfiguredApiBase();
let storedBaseLoaded = false;

async function loadStoredBase(): Promise<void> {
  if (storedBaseLoaded) return;
  storedBaseLoaded = true;

  const envBase = getConfiguredApiBase();
  const cloudBase = envBase && isRemoteCloudBase(envBase) ? envBase : null;

  if (isStandaloneApp() && cloudBase) {
    cachedBaseUrl = cloudBase;
    try {
      await AsyncStorage.removeItem(STORED_API_BASE_KEY);
    } catch {
      /* ignore */
    }
    return;
  }

  const preferredHost = getPreferredLanHost();

  try {
    const stored = await AsyncStorage.getItem(STORED_API_BASE_KEY);
    const normalized = normalizeApiBase(stored || '');
    if (!normalized) return;

    if (cloudBase && isLocalDevBase(normalized)) {
      await AsyncStorage.removeItem(STORED_API_BASE_KEY);
      cachedBaseUrl = cloudBase;
      return;
    }

    if (isStaleApiBase(normalized, preferredHost)) {
      await AsyncStorage.removeItem(STORED_API_BASE_KEY);
      cachedBaseUrl = envBase;
      return;
    }

    cachedBaseUrl = normalized;
  } catch {
    /* ignore */
  }
}

/** Drop saved API URL when PC Wi‑Fi IP changes (e.g. 192.168.1.8 → 192.168.100.46). */
export async function pruneStaleApiBaseUrl(): Promise<void> {
  storedBaseLoaded = false;
  const preferredHost = getPreferredLanHost();
  const envBase = getConfiguredApiBase();
  const cloudBase = envBase && isRemoteCloudBase(envBase) ? envBase : null;

  try {
    const stored = await AsyncStorage.getItem(STORED_API_BASE_KEY);
    const normalized = normalizeApiBase(stored || '');
    if (
      normalized &&
      (isStaleApiBase(normalized, preferredHost) || (cloudBase && isLocalDevBase(normalized)))
    ) {
      await AsyncStorage.removeItem(STORED_API_BASE_KEY);
    }
  } catch {
    /* ignore */
  }

  cachedBaseUrl = cloudBase || envBase;
  storedBaseLoaded = true;
}

export async function rememberWorkingApiBase(base: string): Promise<void> {
  const envBase = getConfiguredApiBase();
  if (envBase && isRemoteCloudBase(envBase) && isStandaloneApp() && !isRemoteCloudBase(base)) {
    return;
  }
  cachedBaseUrl = base;
  try {
    await AsyncStorage.setItem(STORED_API_BASE_KEY, base);
  } catch {
    /* ignore */
  }
}

/** Clear a previously saved API URL (e.g. after changing .env or PC IP). */
export async function clearStoredApiBaseUrl(): Promise<void> {
  cachedBaseUrl = getConfiguredApiBase();
  storedBaseLoaded = true;
  try {
    await AsyncStorage.removeItem(STORED_API_BASE_KEY);
  } catch {
    /* ignore */
  }
}

export async function getCandidateBaseUrls(): Promise<string[]> {
  await loadStoredBase();

  const normalizedEnvBase = getConfiguredApiBase();
  const cloudBase = normalizedEnvBase && isRemoteCloudBase(normalizedEnvBase) ? normalizedEnvBase : null;

  // Installed APK / TestFlight: always use the deployed backend, never LAN fallbacks.
  if (isStandaloneApp()) {
    if (cloudBase) return [cloudBase];
    if (normalizedEnvBase) return [normalizedEnvBase];
  }

  const urls: string[] = [];
  const preferredHost = getPreferredLanHost();
  const metroDevBase = getMetroDevApiBase();

  if (Platform.OS === 'web') {
    const webHost =
      (typeof window !== 'undefined' && window.location && window.location.hostname) || 'localhost';
    urls.push(
      `http://${webHost}:8000${API_PREFIX}`,
      `http://127.0.0.1:8000${API_PREFIX}`,
      `http://localhost:8000${API_PREFIX}`,
    );
    if (normalizedEnvBase) urls.push(normalizedEnvBase);
    if (cachedBaseUrl) urls.push(cachedBaseUrl);
    return [...new Set(urls)];
  }

  // 1) Metro proxy — phone → Expo :8081 → PC localhost:8000 (works when backend is 127.0.0.1 only)
  if (metroDevBase) urls.push(metroDevBase);

  // 2) Direct API on LAN (requires start-api.ps1 / --host 0.0.0.0)
  if (preferredHost) {
    const direct = buildBaseUrl(preferredHost, 8000);
    urls.push(direct);
  }

  // 3) Explicit .env
  if (normalizedEnvBase && !isStaleApiBase(normalizedEnvBase, preferredHost)) {
    urls.push(normalizedEnvBase);
  }

  // 4) Last working URL only if same LAN host
  if (cachedBaseUrl && !isStaleApiBase(cachedBaseUrl, preferredHost)) {
    urls.push(cachedBaseUrl);
  }

  if (Platform.OS === 'android' && !preferredHost && !isStandaloneApp()) {
    urls.push(buildBaseUrl(EMULATOR_ANDROID_HOST, 8000));
  }

  return [...new Set(urls)];
}

function timeoutForBase(base: string, overrideMs?: number): number {
  if (overrideMs != null) {
    if (isRemoteCloudBase(base) && overrideMs < CLOUD_AUTH_REQUEST_TIMEOUT_MS) {
      return CLOUD_AUTH_REQUEST_TIMEOUT_MS;
    }
    return overrideMs;
  }
  if (isRemoteCloudBase(base)) return CLOUD_REQUEST_TIMEOUT_MS;
  if (/:8081(?:\/|$)/.test(base)) return AUTH_REQUEST_TIMEOUT_MS;
  if (/:8000(?:\/|$)/.test(base)) return DIRECT_API_PROBE_TIMEOUT_MS;
  return REQUEST_TIMEOUT_MS;
}

/** App-level JSON errors should not trigger trying another host (avoids false 401 from Metro proxy). */
async function isAppLevelErrorResponse(response: Response): Promise<boolean> {
  const ct = response.headers.get('content-type') || '';
  if (!ct.includes('application/json')) return false;
  try {
    const clone = response.clone();
    const data = (await clone.json()) as Record<string, unknown>;
    return typeof data.detail === 'string' || data.configured === false;
  } catch {
    return false;
  }
}

async function shouldTryNextBase(response: Response): Promise<boolean> {
  if (response.status !== 404 && response.status !== 502 && response.status !== 503) {
    return false;
  }
  if (await isAppLevelErrorResponse(response)) {
    return false;
  }
  return true;
}

export async function fetchWithApiFallback(
  path: string,
  init?: RequestInit,
  options?: { timeoutMs?: number },
): Promise<Response> {
  const baseUrls = await getCandidateBaseUrls();
  let lastError: unknown = null;
  let lastResponse: Response | null = null;

  for (const base of baseUrls) {
    try {
      const controller = new AbortController();
      const timeoutMs = timeoutForBase(base, options?.timeoutMs);
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetch(`${base}${path}`, {
          ...init,
          signal: controller.signal,
        });
        lastResponse = response;
        if (await shouldTryNextBase(response)) {
          continue;
        }
        if (response.status === 424) {
          return response;
        }
        if (response.ok) {
          await rememberWorkingApiBase(base);
        }
        return response;
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      lastError = error;
    }
  }

  // All failed — clear stale saved URL so next request retries fresh candidates
  await clearStoredApiBaseUrl();

  if (lastResponse) {
    return lastResponse;
  }

  const reason = lastError instanceof Error ? lastError.message : 'Failed to fetch';
  const candidatePreview = baseUrls.join(', ');
  const cloudConfigured = baseUrls.some(isRemoteCloudBase);
  const hint =
    reason === 'Aborted' || /aborted|network request failed|failed to connect/i.test(reason)
      ? cloudConfigured
        ? ' Check mobile data/Wi‑Fi and wait ~1 minute — the cloud server may be waking up (Render free tier).'
        : ' Backend must be running. Use: cd backend\\app-Vtailor && .\\start-api.ps1 (binds 0.0.0.0:8000). Same Wi‑Fi, not mobile data.'
      : '';
  throw new Error(
    `${reason}${hint} Tried: ${candidatePreview}.` +
      (cloudConfigured ? '' : ' Phone test: open http://YOUR_PC_IP:8000/health in mobile browser.'),
  );
}
