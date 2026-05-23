import { fetchWithApiFallback } from '@/services/apiBase';

export type TabId = 'neck' | 'sleeves' | 'bottom' | 'frock-style' | 'colors' | 'saree-style';

async function fetchWithFallback(path: string, init?: RequestInit) {
  return fetchWithApiFallback(path, init);
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