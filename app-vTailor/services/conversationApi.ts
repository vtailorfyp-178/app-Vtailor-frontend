// ─────────────────────────────────────────────────────────────────────────────
// conversationApi.ts
// Complete React Native API client for the Tailor-Customer conversation system
// ─────────────────────────────────────────────────────────────────────────────

import { Platform } from "react-native";
import Constants from "expo-constants";
import * as FileSystem from "expo-file-system/legacy";

// ── Config ────────────────────────────────────────────────────────────────────
const EXPO_API_BASE = (process.env.EXPO_PUBLIC_API_BASE_URL || "").trim();
const expoHostCandidates = [
  Constants.expoConfig?.hostUri,
  (Constants as any).expoGoConfig?.hostUri,
  (Constants as any).expoConfig?.debuggerHost,
  (Constants as any).expoGoConfig?.debuggerHost,
]
  .filter(Boolean)
  .map((value) => String(value).replace(/^.*?:\/\//, "").replace(/:\d+$/, "").trim())
  .filter(Boolean);
const EMULATOR_ANDROID_HOST = "10.0.2.2";
let authToken: string | null = null;

function normalizeApiRoot(value: string): string {
  return value
    .trim()
    .replace(/\/$/, "")
    .replace(/\/app\/api\/v1$/i, "");
}

function getCandidateApiBases(): string[] {
  const urls: string[] = [];
  if (EXPO_API_BASE) urls.push(normalizeApiRoot(EXPO_API_BASE));

  if (Platform.OS === "web") {
    const webHost = (typeof window !== "undefined" && window.location && window.location.hostname) || "localhost";
    urls.push(
      `http://${webHost}:8000`,
      "http://127.0.0.1:8000",
      "http://localhost:8000",
    );
    return Array.from(new Set(urls));
  }

  if (Platform.OS === "android") urls.push(`http://${EMULATOR_ANDROID_HOST}:8000`);
  urls.push(...expoHostCandidates.map((h) => `http://${h}:8000`));
  urls.push("http://127.0.0.1:8000");
  urls.push("http://localhost:8000");
  return Array.from(new Set(urls));
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type UserRole = "tailor" | "customer";

export type MessageType = "text" | "image" | "video" | "audio" | "call_log" | "system";
export type MessageStatus = "sent" | "delivered" | "read" | "failed";
export type CallType = "voice" | "video";
export type CallStatus =
  | "initiated" | "ringing" | "answered"
  | "declined" | "missed" | "ended" | "failed";

export type ChatMessage = {
  message_id: string;
  conversation_id: string;
  sender_id: string;
  sender_role: UserRole;
  content: string;
  message_type: MessageType;
  status: MessageStatus;
  media_url: string | null;
  media_mime: string | null;
  media_size: number | null;
  media_duration: number | null;
  thumbnail_url: string | null;
  reply_to_id: string | null;
  reply_to_preview: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
};

export type Conversation = {
  conversation_id: string;
  tailor_id: string;
  customer_id: string;
  tailor_name: string;
  customer_name: string;
  tailor_avatar: string | null;
  customer_avatar: string | null;
  last_message: string | null;
  last_message_type: MessageType | null;
  last_message_at: string | null;
  unread_count: number;
  status: "active" | "archived" | "blocked";
  created_at: string;
};

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

export type PresignedUpload = {
  upload_url: string;
  media_key: string;
  expires_in: number;
};

// WebSocket event types
export type WSEvent =
  | { event: "new_message"; data: ChatMessage }
  | {
      event: "message_status";
      data: {
        conversation_id?: string;
        message_id?: string;
        read_by?: string;
        status: MessageStatus;
      };
    }
  | {
      event: "typing";
      data: { conversation_id: string; user_id: string; is_typing: boolean };
    }
  | { event: "call_incoming"; data: CallRecord }
  | { event: "call_status"; data: CallRecord }
  | { event: "online_status"; data: { user_id: string; online: boolean } }
  | { event: "ping"; data: object }
  | { event: "pong"; data: object }
  | { event: "error"; data: { code: string; message: string } };


// ── Auth Token Management ──────────────────────────────────────────────────────

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}


// ── HTTP Request Helper ────────────────────────────────────────────────────────

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
    try {
      detail = JSON.parse(text).detail ?? text;
    } catch {}
    throw new Error(`[${res.status}] ${detail}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}


// ── Conversations ──────────────────────────────────────────────────────────────

export const Conversations = {
  getOrCreate: (tailor_id: string, customer_id: string) =>
    request<Conversation>("POST", "/app/api/v1/conversations", {
      tailor_id,
      customer_id,
    }),

  list: (user_id: string, role: UserRole, limit = 50) =>
    request<Conversation[]>(
      "GET",
      `/app/api/v1/conversations/${user_id}?role=${role}&limit=${limit}`
    ),
};


// ── Messages ───────────────────────────────────────────────────────────────────

export const Messages = {
  sendText: (payload: {
    conversation_id: string;
    sender_id: string;
    content: string;
    reply_to_id?: string;
  }) =>
    request<ChatMessage>("POST", "/app/api/v1/conversations/messages/send", {
      conversation_id: payload.conversation_id,
      sender_id: payload.sender_id,
      content: payload.content,
      message_type: "text",
      reply_to_id: payload.reply_to_id ?? null,
    }),

  sendMedia: (params: {
    conversation_id: string;
    sender_id: string;
    message_type: "image" | "video" | "audio";
    media_url: string;
    media_key: string;
    media_mime: string;
    media_size: number;
    media_duration?: number;
    thumbnail_url?: string;
    content?: string;
  }) =>
    request<ChatMessage>(
      "POST",
      "/app/api/v1/conversations/messages/send",
      params
    ),

  list: (
    conversation_id: string,
    user_id: string,
    before_id?: string,
    limit = 40
  ) =>
    request<ChatMessage[]>(
      "GET",
      `/app/api/v1/conversations/messages/${conversation_id}?user_id=${user_id}&limit=${limit}${
        before_id ? `&before_id=${before_id}` : ""
      }`
    ),

  markRead: (
    conversation_id: string,
    user_id: string,
    up_to_message_id?: string
  ) =>
    request<{ marked_read: number }>(
      "POST",
      "/app/api/v1/conversations/messages/read",
      {
        conversation_id,
        user_id,
        up_to_message_id: up_to_message_id ?? null,
      }
    ),

  delete: (message_id: string, user_id: string) =>
    request<{ deleted: boolean }>(
      "DELETE",
      `/app/api/v1/conversations/messages/${message_id}?user_id=${user_id}`
    ),
};


// ── Media Upload ───────────────────────────────────────────────────────────────

export const Media = {
  getPresignedUrl: (params: {
    conversation_id: string;
    sender_id: string;
    filename: string;
    content_type: string;
    file_size: number;
  }) =>
    request<PresignedUpload>(
      "POST",
      "/app/api/v1/conversations/media/presign",
      params
    ),

  uploadToS3: async (
    upload_url: string,
    fileUri: string,
    content_type: string
  ): Promise<void> => {
    const res = await FileSystem.uploadAsync(upload_url, fileUri, {
      httpMethod: "PUT",
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      headers: { "Content-Type": content_type },
    });

    if (res.status < 200 || res.status >= 300) {
      throw new Error(`S3 upload failed: ${res.status}`);
    }
  },

  getDownloadUrl: (media_key: string) =>
    request<{ url: string }>(
      "GET",
      `/app/api/v1/conversations/media/url/${encodeURIComponent(media_key)}`
    ),

  upload: async (params: {
    conversation_id: string;
    sender_id: string;
    fileUri: string;
    filename: string;
    content_type: string;
    file_size: number;
  }): Promise<{ media_key: string; media_url: string }> => {
    const { upload_url, media_key } = await Media.getPresignedUrl({
      conversation_id: params.conversation_id,
      sender_id: params.sender_id,
      filename: params.filename,
      content_type: params.content_type,
      file_size: params.file_size,
    });

    await Media.uploadToS3(upload_url, params.fileUri, params.content_type);

    const { url: media_url } = await Media.getDownloadUrl(media_key);
    return { media_key, media_url };
  },
};


// ── Calls ──────────────────────────────────────────────────────────────────────

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


// ── Typing Indicator ───────────────────────────────────────────────────────────

export const Typing = {
  send: (conversation_id: string, user_id: string, is_typing: boolean) =>
    request<void>("POST", "/app/api/v1/conversations/typing", {
      conversation_id,
      user_id,
      is_typing,
    }),
};


// ── WebSocket Manager ──────────────────────────────────────────────────────────

type WSHandler = (event: WSEvent) => void;

export class ConversationSocket {
  private ws: WebSocket | null = null;
  private userId: string;
  private handlers: WSHandler[] = [];
  private namedHandlers: Partial<Record<WSEvent["event"], WSHandler[]>> = {};
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay = 2000;
  private maxDelay = 30000;
  private shouldReconnect = true;
  private typingTimers: Record<string, ReturnType<typeof setTimeout>> = {};
  private messageQueue: unknown[] = [];
  private isConnected = false;
  private wsBaseIndex = 0;

  constructor(userId: string) {
    this.userId = userId;
  }

  connect(): void {
    this.shouldReconnect = true;
    this._connect();
  }

  private _connect(): void {
    try {
      const apiBases = getCandidateApiBases();
      const selectedBase = apiBases[this.wsBaseIndex % apiBases.length] || apiBases[0] || "http://localhost:8000";
      const protocol = selectedBase.startsWith("https") ? "wss" : "ws";
      const baseHost = selectedBase.replace(/^https?:\/\//, "");
      const token = authToken ?? "no-token";
      const url = `${protocol}://${baseHost}/app/api/v1/conversations/ws/${this.userId}?token=${token}`;

      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log("[WS] Connected");
        this.isConnected = true;
        this.reconnectDelay = 2000;
        // Flush queued messages
        this._flushQueue();
      };

      this.ws.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data) as WSEvent;
          this.handlers.forEach((h) => h(event));
          const specific = this.namedHandlers[event.event];
          if (specific?.length) specific.forEach((h) => h(event));
        } catch (err) {
          console.warn("[WS] Parse error:", err);
        }
      };

      this.ws.onerror = (e) => console.warn("[WS] Error", e);

      this.ws.onclose = () => {
        console.log("[WS] Disconnected");
        this.isConnected = false;
        if (this.shouldReconnect) {
          this.reconnectTimer = setTimeout(() => {
            this.wsBaseIndex = this.wsBaseIndex + 1;
            this.reconnectDelay = Math.min(
              this.reconnectDelay * 2,
              this.maxDelay
            );
            this._connect();
          }, this.reconnectDelay);
        }
      };
    } catch (err) {
      console.error("[WS] Connection failed:", err);
      if (this.shouldReconnect) {
        this.reconnectTimer = setTimeout(() => {
          this.wsBaseIndex = this.wsBaseIndex + 1;
          this.reconnectDelay = Math.min(
            this.reconnectDelay * 2,
            this.maxDelay
          );
          this._connect();
        }, this.reconnectDelay);
      }
    }
  }

  disconnect(): void {
    this.shouldReconnect = false;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
    this.isConnected = false;
  }

  onEvent(handler: WSHandler): () => void;
  onEvent(eventName: WSEvent["event"], handler: WSHandler): () => void;
  onEvent(arg1: WSEvent["event"] | WSHandler, arg2?: WSHandler): () => void {
    if (typeof arg1 === "function") {
      const handler = arg1;
      this.handlers.push(handler);
      return () => {
        this.handlers = this.handlers.filter((h) => h !== handler);
      };
    }

    const eventName = arg1;
    const handler = arg2;
    if (!handler) return () => {};
    const current = this.namedHandlers[eventName] || [];
    this.namedHandlers[eventName] = [...current, handler];
    return () => {
      this.namedHandlers[eventName] = (this.namedHandlers[eventName] || []).filter((h) => h !== handler);
    };
  }

  sendTyping(conversation_id: string, is_typing: boolean): void {
    this._send({ event: "typing", data: { conversation_id, is_typing } });

    if (is_typing) {
      if (this.typingTimers[conversation_id]) {
        clearTimeout(this.typingTimers[conversation_id]);
      }
      this.typingTimers[conversation_id] = setTimeout(() => {
        this.sendTyping(conversation_id, false);
      }, 3000);
    }
  }

  markRead(conversation_id: string, up_to_message_id?: string): void {
    this._send({
      event: "mark_read",
      data: { conversation_id, up_to_message_id },
    });
  }

  ping(): void {
    this._send({ event: "ping", data: {} });
  }

  private _send(payload: unknown): void {
    if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(payload));
      } catch (err) {
        console.warn("[WS] Send error:", err);
        this.messageQueue.push(payload);
      }
    } else {
      this.messageQueue.push(payload);
    }
  }

  private _flushQueue(): void {
    while (this.messageQueue.length > 0 && this.isConnected) {
      const msg = this.messageQueue.shift();
      try {
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify(msg));
        } else {
          this.messageQueue.unshift(msg);
          break;
        }
      } catch (err) {
        console.warn("[WS] Flush error:", err);
        this.messageQueue.unshift(msg);
        break;
      }
    }
  }

  get connected(): boolean {
    return this.isConnected;
  }
}


// ── Utility Functions ──────────────────────────────────────────────────────────

export function formatMessageTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function formatConversationDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diff < 7 * 86400)
    return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function getOtherParticipant(
  conv: Conversation,
  myUserId: string
): { id: string; name: string; avatar: string | null } {
  if (conv.tailor_id === myUserId) {
    return {
      id: conv.customer_id,
      name: conv.customer_name,
      avatar: conv.customer_avatar,
    };
  }
  return {
    id: conv.tailor_id,
    name: conv.tailor_name,
    avatar: conv.tailor_avatar,
  };
}

export function mediaTypeFromMime(
  mime: string
): "image" | "video" | "audio" {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  return "audio";
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function getStatusEmoji(status: MessageStatus): string {
  switch (status) {
    case "sent":
      return "✓";
    case "delivered":
      return "✓✓";
    case "read":
      return "✓✓";
    default:
      return "";
  }
}
