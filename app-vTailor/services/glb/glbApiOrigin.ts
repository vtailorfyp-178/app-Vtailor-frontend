import { API_PREFIX } from '@/services/apiBase';

/** Strip `/app/api/v1` from API base URL to get origin for static `/3dModels` paths. */
export function apiBaseToOrigin(apiBase: string): string {
  const trimmed = apiBase.replace(/\/$/, '');
  if (/\/app\/api\/v1$/i.test(trimmed)) {
    return trimmed.replace(/\/app\/api\/v1$/i, '');
  }
  return trimmed;
}

export function defaultApiOriginFromEnv(): string {
  const env = (process.env.EXPO_PUBLIC_API_BASE_URL || '').trim();
  if (env) {
    return apiBaseToOrigin(env.includes('://') ? env : `http://${env}:8000${API_PREFIX}`);
  }
  return 'http://127.0.0.1:8000';
}
