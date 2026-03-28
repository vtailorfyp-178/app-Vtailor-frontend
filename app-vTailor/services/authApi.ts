import { Platform } from 'react-native';

// Default host for development. Adjust `DEV_HOST` to your machine's LAN IP when
// testing on a physical device. For Android emulators use 10.0.2.2 (Android
// emulator) which maps to host machine's localhost.
const DEV_HOST = '192.168.100.4';
const EMULATOR_ANDROID_HOST = '10.0.2.2';
const EXPO_API_BASE = (process.env.EXPO_PUBLIC_API_BASE_URL || '').trim();

// Choose host based on platform:
// - Android emulator: use emulator host mapping
// - Web: use the page's hostname (works for `expo web` / local webserver)
// - Other (iOS device / simulator): use DEV_HOST (your machine LAN IP)
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

  return [
    `http://${EMULATOR_ANDROID_HOST}:8000/app/api/v1`,
    `http://${DEV_HOST}:8000/app/api/v1`,
    'http://127.0.0.1:8000/app/api/v1',
  ];
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