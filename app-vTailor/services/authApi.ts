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
  const normalizedEnvBase = normalizeApiBase(EXPO_API_BASE);

  if (Platform.OS === 'web') {
    const webHost = (typeof window !== 'undefined' && window.location && window.location.hostname) || 'localhost';
    urls.push(
      `http://${webHost}:8000${API_PREFIX}`,
      `http://127.0.0.1:8000${API_PREFIX}`,
      `http://localhost:8000${API_PREFIX}`,
    );
    if (normalizedEnvBase) urls.push(normalizedEnvBase);
    if (cachedBaseUrl) urls.push(cachedBaseUrl);
    return Array.from(new Set(urls));
  }

  // On real devices, prefer Expo/Metro host-derived LAN IP first.
  const scriptHost = extractHostFromScriptUrl();
  if (scriptHost) urls.push(buildBaseUrl(scriptHost));
  urls.push(...expoHostCandidates.map(buildBaseUrl));
  if (cachedBaseUrl) urls.push(cachedBaseUrl);
  if (normalizedEnvBase) urls.push(normalizedEnvBase);

  // Keep emulator-localhost fallback only for Android emulator-like cases.
  if (Platform.OS === 'android') {
    urls.push(buildBaseUrl(EMULATOR_ANDROID_HOST));
  }

  return Array.from(new Set(urls));
}

async function fetchWithFallback(path: string, init?: RequestInit) {
  const baseUrls = getCandidateBaseUrls();
  let lastError: any = null;
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
        // Wrong host / proxy often returns 404 Not Found or gateway errors — try next candidate.
        if (response.status === 404 || response.status === 502 || response.status === 503) {
          continue;
        }
        if (response.ok) {
          cachedBaseUrl = base;
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
  const candidatePreview = baseUrls.slice(0, 3).join(', ');
  throw new Error(
    `${reason}. Tried: ${candidatePreview}${baseUrls.length > 3 ? ', ...' : ''}. If using Expo Go on phone, run backend on 0.0.0.0 and set EXPO_PUBLIC_API_BASE_URL to your PC LAN IP, e.g. http://192.168.x.x:8000/app/api/v1`
  );
}

function extractErrorDetail(data: unknown): string {
  if (data == null || typeof data !== 'object') {
    return '';
  }
  const anyData = data as Record<string, unknown>;
  const d = anyData.detail ?? anyData.message;
  if (Array.isArray(d)) {
    return d
      .map((e) =>
        typeof e === 'object' && e != null && 'msg' in e ? String((e as { msg: unknown }).msg) : String(e),
      )
      .join('; ');
  }
  if (typeof d === 'object' && d != null) {
    try {
      return JSON.stringify(d);
    } catch {
      return String(d);
    }
  }
  return d != null ? String(d) : '';
}

async function parseResponseBody(response: Response): Promise<Record<string, unknown>> {
  const text = await response.text();
  if (!text || !text.trim()) {
    return {};
  }
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error(
      `Invalid response from server (${response.status}). Check EXPO_PUBLIC_API_BASE_URL points to your API (…/app/api/v1).`,
    );
  }
}

function extractMethodId(data: Record<string, unknown>): string | null {
  const top = data.method_id ?? data.methodId;
  if (typeof top === 'string' && top.trim() !== '') return top.trim();
  const nested = data.data;
  if (nested != null && typeof nested === 'object' && !Array.isArray(nested)) {
    const inner = (nested as Record<string, unknown>).method_id;
    if (typeof inner === 'string' && inner.trim() !== '') return inner.trim();
  }
  return null;
}

/** Successful POST /auth/otp/start (normalized for the app UI). */
export type EmailOtpStartResult = {
  status: 'success';
  method_id: string;
  message: string;
  email: string;
};

/** Successful POST /auth/otp/verify */
export type VerifyOtpResult = {
  access_token: string;
  token_type?: string;
  user_id?: string;
  role?: string;
  email?: string | null;
  phone?: string | null;
};

/** GET /auth/me */
export type MeProfile = {
  user_id?: string;
  email?: string | null;
  phone?: string | null;
  name?: string | null;
  address?: string | null;
  experience?: string | null;
  specialization?: string[] | null;
  description?: string | null;
  avatar?: string | null;
  role?: string | null;
};

export async function sendEmailOtp(email: string): Promise<EmailOtpStartResult> {
  const response = await fetchWithFallback('/auth/otp/start', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  const data = await parseResponseBody(response);
  if (!response.ok) {
    throw new Error(extractErrorDetail(data) || `Failed to send OTP (${response.status})`);
  }

  const methodId = extractMethodId(data);

  if (!methodId) {
    throw new Error(
      extractErrorDetail(data) ||
        'OTP could not be started (no session id from server). Check API URL and backend logs.',
    );
  }

  return {
    status: 'success',
    method_id: methodId,
    message: (typeof data.message === 'string' && data.message ? data.message : `OTP sent to ${email}`),
    email: (typeof data.email === 'string' && data.email ? data.email : email),
  };
}

// `methodId` is the value returned by sendEmailOtp (otp/start) as `method_id`.
// The backend otp/verify endpoint only accepts { method_id, code }.
export async function verifyEmailOtp(methodId: string, code: string, role: 'customer' | 'tailor'): Promise<VerifyOtpResult> {
  const response = await fetchWithFallback('/auth/otp/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      method_id: methodId,
      code,
      role,
    }),
  });

  const data = await parseResponseBody(response);
  if (!response.ok) {
    throw new Error(extractErrorDetail(data) || `Failed to verify OTP (${response.status})`);
  }

  return data as VerifyOtpResult;
}

export async function getProfile(token: string): Promise<MeProfile> {
  const response = await fetchWithFallback('/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await parseResponseBody(response);
  if (!response.ok) {
    throw new Error(extractErrorDetail(data) || `Failed to load profile (${response.status})`);
  }

  return data as MeProfile;
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

  const data = await parseResponseBody(response);
  if (!response.ok) {
    throw new Error(extractErrorDetail(data) || `Failed to update profile (${response.status})`);
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

  const data = await parseResponseBody(response);
  if (!response.ok) {
    throw new Error(extractErrorDetail(data) || `Failed to delete account (${response.status})`);
  }

  return data;
}