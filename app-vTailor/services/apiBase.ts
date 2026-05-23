import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules, Platform } from 'react-native';
import Constants from 'expo-constants';

export const API_PREFIX = '/app/api/v1';
const EMULATOR_ANDROID_HOST = '10.0.2.2';
const EXPO_API_BASE = (process.env.EXPO_PUBLIC_API_BASE_URL || '').trim();
/** Per-URL timeout; keep moderate so OTP does not hang 30s on unreachable hosts. */
export const REQUEST_TIMEOUT_MS = 15000;
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

function buildBaseUrl(host: string) {
  return `http://${host}:8000${API_PREFIX}`;
}

/** Prefer real Wi‑Fi LAN (e.g. 192.168.1.x); skip common VM/hotspot-only adapters. */
function hostPriority(host: string): number {
  if (host === 'localhost' || host === '127.0.0.1') return 0;
  if (host === EMULATOR_ANDROID_HOST) return 1;
  const m = host.match(/^192\.168\.(\d+)\./);
  if (!m) return 5;
  const second = Number(m[1]);
  if (second === 1) return 100;
  if (second >= 170 && second <= 200) return 15;
  if (second >= 130 && second <= 140) return 10;
  return 20;
}

function sortHosts(hosts: string[]): string[] {
  return [...new Set(hosts)].sort((a, b) => hostPriority(b) - hostPriority(a));
}

let cachedBaseUrl: string | null = normalizeApiBase(EXPO_API_BASE);
let storedBaseLoaded = false;

async function loadStoredBase(): Promise<void> {
  if (storedBaseLoaded) return;
  storedBaseLoaded = true;
  try {
    const stored = await AsyncStorage.getItem(STORED_API_BASE_KEY);
    const normalized = normalizeApiBase(stored || '');
    if (normalized) cachedBaseUrl = normalized;
  } catch {
    /* ignore */
  }
}

export async function rememberWorkingApiBase(base: string): Promise<void> {
  cachedBaseUrl = base;
  try {
    await AsyncStorage.setItem(STORED_API_BASE_KEY, base);
  } catch {
    /* ignore */
  }
}

/** Clear a previously saved API URL (e.g. after changing .env or PC IP). */
export async function clearStoredApiBaseUrl(): Promise<void> {
  cachedBaseUrl = normalizeApiBase(EXPO_API_BASE);
  storedBaseLoaded = true;
  try {
    await AsyncStorage.removeItem(STORED_API_BASE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * In Expo Go dev, the phone already reaches Metro (e.g. 192.168.1.6:8081).
 * metro.config.js proxies /app/api → 127.0.0.1:8000 so we avoid Windows blocking port 8000.
 */
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

export async function getCandidateBaseUrls(): Promise<string[]> {
  await loadStoredBase();

  const urls: string[] = [];
  const normalizedEnvBase = normalizeApiBase(EXPO_API_BASE);

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
    return Array.from(new Set(urls));
  }

  const metroDevBase = getMetroDevApiBase();
  if (metroDevBase) urls.push(metroDevBase);

  if (normalizedEnvBase) urls.push(normalizedEnvBase);
  if (cachedBaseUrl) urls.push(cachedBaseUrl);

  const hosts = sortHosts([
    extractHostFromScriptUrl(),
    ...expoHostCandidates,
  ].filter((h): h is string => Boolean(h)));

  for (const host of hosts) {
    const built = buildBaseUrl(host);
    if (!urls.includes(built)) urls.push(built);
  }

  if (Platform.OS === 'android') {
    const hasLanHost =
      urls.some((u) => /192\.168\.\d+\.\d+/.test(u)) ||
      hosts.some((h) => /^192\.168\.\d+\.\d+$/.test(h));
    if (!hasLanHost) {
      const emu = buildBaseUrl(EMULATOR_ANDROID_HOST);
      if (!urls.includes(emu)) urls.push(emu);
    }
  }

  return urls;
}

export async function fetchWithApiFallback(path: string, init?: RequestInit): Promise<Response> {
  const baseUrls = await getCandidateBaseUrls();
  let lastError: unknown = null;
  let lastResponse: Response | null = null;

  for (const base of baseUrls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      try {
        const response = await fetch(`${base}${path}`, {
          ...init,
          signal: controller.signal,
        });
        lastResponse = response;
        if (response.status === 404 || response.status === 502 || response.status === 503) {
          continue;
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

  if (lastResponse) {
    return lastResponse;
  }

  const reason = lastError instanceof Error ? lastError.message : 'Failed to fetch';
  const candidatePreview = baseUrls.slice(0, 4).join(', ');
  const hint =
    reason === 'Aborted' || /aborted|network request failed|failed to connect/i.test(reason)
      ? ' Phone cannot reach your PC: run app-Vtailor\\start-api.ps1 (host 0.0.0.0), allow firewall, same Wi‑Fi (not mobile data). On phone browser open http://YOUR_PC_IP:8000/health. Or USB: adb reverse tcp:8000 tcp:8000.'
      : '';
  throw new Error(
    `${reason}${hint} Tried: ${candidatePreview}${baseUrls.length > 4 ? ', ...' : ''}. ` +
      'PC: cd app-Vtailor && .\\start-api.ps1. .env: EXPO_PUBLIC_API_BASE_URL=http://YOUR_PC_IP:8000/app/api/v1 then npx expo start -c.',
  );
}
