// ─────────────────────────────────────────────────────────────────────────────
// conversationApi.ts
//
// LEGACY NOTE: Custom WebSocket chat has been replaced by Stream Chat.
// Only the Calls API remains here — all chat functionality is now in
// streamChatService.ts and the Stream SDK.
// ─────────────────────────────────────────────────────────────────────────────

import { Platform } from "react-native";
import Constants from "expo-constants";

// ── Config ────────────────────────────────────────────────────────────────────

const EXPO_API_BASE = (process.env.EXPO_PUBLIC_API_BASE_URL || "").trim();
const expoHostCandidates = [
  Constants.expoConfig?.hostUri,
  (Constants as any).expoGoConfig?.hostUri,
]
  .filter(Boolean)
  .map((value) => String(value).replace(/^.*?:\/\//, "").replace(/:\d+$/, "").trim())
  .filter(Boolean);
const EMULATOR_ANDROID_HOST = "10.0.2.2";
let authToken: string | null = null;

function normalizeApiRoot(value: string): string {
  return value.trim().replace(/\/$/, "").replace(/\/app\/api\/v1$/i, "");
}

function getCandidateApiBases(): string[] {
  const urls: string[] = [];
  if (EXPO_API_BASE) urls.push(normalizeApiRoot(EXPO_API_BASE));
  if (Platform.OS === "web") {
    const webHost =
      (typeof window !== "undefined" && window.location?.hostname) || "localhost";
    urls.push(`http://${webHost}:8000`, "http://127.0.0.1:8000", "http://localhost:8000");
    return Array.from(new Set(urls));
  }
  if (Platform.OS === "android") urls.push(`http://${EMULATOR_ANDROID_HOST}:8000`);
  urls.push(...expoHostCandidates.map((h) => `http://${h}:8000`));
  urls.push("http://127.0.0.1:8000", "http://localhost:8000");
  return Array.from(new Set(urls));
}

// ── Auth token ────────────────────────────────────────────────────────────────

export function setAuthToken(token: string | null) {
  authToken = token;
}
export function getAuthToken(): string | null {
  return authToken;
}

// ── HTTP helper ───────────────────────────────────────────────────────────────

async function request<T>(method: string, endpoint: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
  const candidates = getCandidateApiBases();
  let res: Response | null = null;
  let lastErr: unknown = null;
  for (const base of Array.from(new Set(candidates))) {
    try {
      res = await fetch(`${base}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
      break;
    } catch (err) {
      lastErr = err;
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
