import { Platform } from 'react-native';
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
let cachedBaseUrl: string | null = EXPO_API_BASE || null;

function buildBaseUrl(host: string) {
  return `http://${host}:8000/app/api/v1`;
}

function getCandidateBaseUrls() {
  if (cachedBaseUrl) return [cachedBaseUrl];
  if (EXPO_API_BASE) return [EXPO_API_BASE];

  if (Platform.OS === 'web') {
    const webHost = (typeof window !== 'undefined' && window.location && window.location.hostname) || 'localhost';
    return [
      `http://${webHost}:8000/app/api/v1`,
      'http://127.0.0.1:8000/app/api/v1',
      'http://localhost:8000/app/api/v1',
    ];
  }

  const urls: string[] = [];
  if (Platform.OS === 'android') urls.push(buildBaseUrl(EMULATOR_ANDROID_HOST));
  urls.push(...expoHostCandidates.map(buildBaseUrl));
  urls.push(buildBaseUrl('127.0.0.1'));
  urls.push(buildBaseUrl('localhost'));
  return urls;
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

  throw lastError || new Error('Failed to fetch');
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