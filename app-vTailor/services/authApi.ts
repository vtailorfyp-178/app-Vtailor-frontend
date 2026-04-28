import { NativeModules, Platform } from 'react-native';
import Constants from 'expo-constants';

const expoHostCandidates = [
  Constants.expoConfig?.hostUri,
  (Constants as any).expoGoConfig?.hostUri,
  (Constants as any).expoConfig?.debuggerHost,
  (Constants as any).expoGoConfig?.debuggerHost,
]
  .filter(Boolean)
  .map((value) => String(value).replace(/^.*?:\/\//, '').replace(/:\d+$/, '').trim())
  .filter(Boolean);
const EMULATOR_ANDROID_HOST = '10.0.2.2';
const EXPO_API_BASE = (process.env.EXPO_PUBLIC_API_BASE_URL || '').trim();
const REQUEST_TIMEOUT_MS = 15000;
const API_PREFIX = '/app/api/v1';

function normalizeApiBase(raw: string) {
  const value = String(raw || '').trim().replace(/\/$/, '');
  if (!value) return null;

  // Accept bare hosts like 192.168.1.10 or localhost and default to :8000.
  if (!/^https?:\/\//i.test(value)) {
    if (value.includes(':')) {
      return `http://${value}${API_PREFIX}`;
    }
    return `http://${value}:8000${API_PREFIX}`;
  }

  // If user provided only host[:port], append API prefix.
  if (!/\/app\/api\/v1(?:\/|$)/i.test(value)) {
    return `${value}${API_PREFIX}`;
  }

  return value;
}

let cachedBaseUrl: string | null = normalizeApiBase(EXPO_API_BASE);

function extractHostFromScriptUrl() {
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

function getCandidateBaseUrls() {
  const urls: string[] = [];
  if (cachedBaseUrl) urls.push(cachedBaseUrl);

  const normalizedEnvBase = normalizeApiBase(EXPO_API_BASE);
  if (normalizedEnvBase) urls.push(normalizedEnvBase);

  if (Platform.OS === 'web') {
    const webHost = (typeof window !== 'undefined' && window.location && window.location.hostname) || 'localhost';
    urls.push(
      `http://${webHost}:8000${API_PREFIX}`,
      `http://127.0.0.1:8000${API_PREFIX}`,
      `http://localhost:8000${API_PREFIX}`,
    );
    return Array.from(new Set(urls));
  }

  const scriptHost = extractHostFromScriptUrl();
  if (scriptHost) urls.push(buildBaseUrl(scriptHost));
  if (Platform.OS === 'android') urls.push(buildBaseUrl(EMULATOR_ANDROID_HOST));
  urls.push(...expoHostCandidates.map(buildBaseUrl));
  urls.push(buildBaseUrl('127.0.0.1'));
  urls.push(buildBaseUrl('localhost'));
  return Array.from(new Set(urls));
}

async function fetchWithFallback(path: string, init?: RequestInit) {
  const baseUrls = getCandidateBaseUrls();
  let lastError: any = null;

  for (const base of baseUrls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      try {
        const response = await fetch(`${base}${path}`, {
          ...init,
          signal: controller.signal,
        });
        cachedBaseUrl = base;
        return response;
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      lastError = error;
    }
  }

  const reason = lastError instanceof Error ? lastError.message : 'Failed to fetch';
  const candidatePreview = baseUrls.slice(0, 3).join(', ');
  throw new Error(
    `${reason}. Tried: ${candidatePreview}${baseUrls.length > 3 ? ', ...' : ''}. If using Expo Go on phone, run backend on 0.0.0.0 and set EXPO_PUBLIC_API_BASE_URL to your PC LAN IP, e.g. http://192.168.x.x:8000/app/api/v1`
  );
}

export async function sendEmailOtp(email: string) {
  // Backend exposes endpoints at `/auth/otp/start` and `/auth/otp/verify`
  const response = await fetchWithFallback('/auth/otp/start', {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.detail || data?.message || `Failed to send OTP (${response.status})`);
  }

  return data;
}

// `methodId` is the value returned by sendEmailOtp (otp/start) as `method_id`.
// The backend otp/verify endpoint only accepts { method_id, code }.
export async function verifyEmailOtp(methodId: string, code: string, role: 'customer' | 'tailor') {
  const response = await fetchWithFallback('/auth/otp/verify', {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      method_id: methodId,
      code,
      role,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.detail || data?.message || `Failed to verify OTP (${response.status})`);
  }

  return data;
}

export async function getProfile(token: string) {
  const response = await fetchWithFallback('/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.detail || `Failed to load profile (${response.status})`);
  }

  return data;
}

export async function updateProfile(token: string, userId: string, profile: Record<string, unknown>) {
  const response = await fetchWithFallback(`/users/${userId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(profile),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.detail || data?.message || `Failed to update profile (${response.status})`);
  }

  return data;
}

export async function deleteAccount(token: string, userId: string) {
  const response = await fetchWithFallback(`/users/${userId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.detail || data?.message || `Failed to delete account (${response.status})`);
  }

  return data;
}