/** Safe display helpers — avoid crashes on empty/null user-facing strings. */

export function firstInitial(name?: string | null, fallback = '?'): string {
  const trimmed = (name || '').trim();
  if (!trimmed) return fallback;
  return trimmed.charAt(0).toUpperCase();
}

export function safeLocaleString(iso?: string | null, fallback = '—'): string {
  if (!iso) return fallback;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleString();
}

export function safeLocaleDate(iso?: string | null, fallback = '—'): string {
  if (!iso) return fallback;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw || !String(raw).trim()) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
