import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Auto-detect the dev machine's IP from Expo's debugger host.
// This removes the need to hardcode your LAN IP — it updates automatically.
const expoHost = Constants.expoConfig?.hostUri?.split(':')[0];
const EMULATOR_ANDROID_HOST = '10.0.2.2';
const EXPO_API_BASE = (process.env.EXPO_PUBLIC_API_BASE_URL || '').trim();

function getCandidateBaseUrls() {
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
  if (Platform.OS === 'android') urls.push(`http://${EMULATOR_ANDROID_HOST}:8000/app/api/v1`);
  if (expoHost) urls.push(`http://${expoHost}:8000/app/api/v1`);
  urls.push('http://127.0.0.1:8000/app/api/v1');
  return urls;
}

async function fetchWithFallback(path: string, init?: RequestInit) {
  const baseUrls = getCandidateBaseUrls();
  let lastError: any = null;

  for (const base of baseUrls) {
    try {
      return await fetch(`${base}${path}`, init);
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

  return response.json();
}

// `methodId` is the value returned by sendEmailOtp (otp/start) as `method_id`.
// The backend otp/verify endpoint only accepts { method_id, code }.
export async function verifyEmailOtp(methodId: string, code: string) {
  const response = await fetchWithFallback('/auth/otp/verify', {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      method_id: methodId,
      code,
    }),
  });

  return response.json();
}

export async function getProfile(token: string) {
  const response = await fetchWithFallback('/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.json();
}