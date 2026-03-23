import { Platform } from 'react-native';

// Default host for development. Adjust `DEV_HOST` to your machine's LAN IP when
// testing on a physical device. For Android emulators use 10.0.2.2 (Android
// emulator) which maps to host machine's localhost.
const DEV_HOST = '192.168.100.4';
const EMULATOR_ANDROID_HOST = '10.0.2.2';

// Choose host based on platform:
// - Android emulator: use emulator host mapping
// - Web: use the page's hostname (works for `expo web` / local webserver)
// - Other (iOS device / simulator): use DEV_HOST (your machine LAN IP)
const host = Platform.OS === 'android'
  ? EMULATOR_ANDROID_HOST
  : Platform.OS === 'web'
  ? (typeof window !== 'undefined' && window.location && window.location.hostname) || 'localhost'
  : DEV_HOST;

const API_BASE_URL = `http://${host}:8000/app/api/v1`;

export async function sendEmailOtp(email: string) {
  // Backend exposes endpoints at `/auth/otp/start` and `/auth/otp/verify`
  const response = await fetch(`${API_BASE_URL}/auth/otp/start`, {
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
  const response = await fetch(`${API_BASE_URL}/auth/otp/verify`, {
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
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.json();
}