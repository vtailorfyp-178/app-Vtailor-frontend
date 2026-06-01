// ─────────────────────────────────────────────────────────────────────────────
// conversationApi.ts
//
// LEGACY NOTE: Custom WebSocket chat has been replaced by Stream Chat.
// Only the Calls API remains here — all chat functionality is now in
// streamChatService.ts and the Stream SDK.
// ─────────────────────────────────────────────────────────────────────────────

import { getCandidateBaseUrls, REQUEST_TIMEOUT_MS } from "@/services/apiBase";

let authToken: string | null = null;

/** `/app/api/v1/foo` → `/foo` when base already includes API_PREFIX. */
function relativeApiPath(endpoint: string): string {
  const path = endpoint.trim();
  if (path.startsWith("/app/api/v1")) {
    return path.slice("/app/api/v1".length) || "/";
  }
  return path.startsWith("/") ? path : `/${path}`;
}

// ── Auth token ────────────────────────────────────────────────────────────────

export function setAuthToken(token: string | null) {
  authToken = token;
}
export function getAuthToken(): string | null {
  return authToken;
}

// ── HTTP helper ───────────────────────────────────────────────────────────────

async function request<T>(
  method: string,
  endpoint: string,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const candidates = await getCandidateBaseUrls();
  const path = relativeApiPath(endpoint);


  let res: Response | null = null;
  let lastErr: unknown = null;
  for (const base of candidates) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      try {
        res = await fetch(`${base}${path}`, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });
        if (res.status === 404 || res.status === 502 || res.status === 503) {
          res = null;
          continue;
        }
        break;
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (err) {
      lastErr = err;
      res = null;
    }
  }
  if (!res) {
    throw new Error(lastErr instanceof Error ? lastErr.message : "Network request failed");
  }
  if (!res.ok) {
    const text = await res.text();
    let detail = text;
    try { detail = JSON.parse(text).detail ?? text; } catch {}
    throw new Error(`[${res.status}] ${detail}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type CallType = "voice" | "video";
export type CallStatus =
  | "initiated" | "ringing" | "answered"
  | "declined" | "missed" | "ended" | "failed";

export type CallRecord = {
  call_id: string;
  conversation_id: string;
  caller_id: string;
  callee_id: string;
  call_type: CallType;
  status: CallStatus;
  duration_seconds: number | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
};

// ── Calls ─────────────────────────────────────────────────────────────────────
// Call endpoints remain on the backend and are unchanged.

export const Calls = {
  initiate: (
    conversation_id: string,
    caller_id: string,
    callee_id: string,
    call_type: CallType
  ) =>
    request<CallRecord>("POST", "/app/api/v1/conversations/calls/initiate", {
      conversation_id,
      caller_id,
      callee_id,
      call_type,
    }),

  action: (call_id: string, user_id: string, action: CallStatus) =>
    request<CallRecord>("POST", "/app/api/v1/conversations/calls/action", {
      call_id,
      user_id,
      action,
    }),

  history: (conversation_id: string, user_id: string, limit = 20) =>
    request<CallRecord[]>(
      "GET",
      `/app/api/v1/conversations/calls/${conversation_id}?user_id=${user_id}&limit=${limit}`
    ),
};
