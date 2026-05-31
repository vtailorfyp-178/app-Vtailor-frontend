/**
 * streamChatService.ts
 * --------------------
 * Singleton Stream Chat client for the Vtailor app.
 * Uses stream-chat core SDK (no UI kit).
 *
 * Lifecycle:
 *   1. After JWT login → call connectStreamUser(token, userId, name, role)
 *   2. On logout       → call disconnectStreamUser()
 *   3. Anywhere        → use getStreamClient() to access the client directly
 */

import { StreamChat, Channel, Event } from "stream-chat";
import { fetchWithApiFallback } from "./apiBase";
import { scheduleMessageNotification } from "./notificationService";
import { createNotification } from "./notificationsApi";

// JWT token held in memory so the global listener can call the backend
let _jwtToken: string | null = null;

// ── Stream token endpoint ──────────────────────────────────────────────────────

export type StreamTokenResult = {
  token: string;
  api_key: string;
  user_id: string;
};

export async function fetchStreamToken(jwtToken: string): Promise<StreamTokenResult> {
  const res = await fetchWithApiFallback("/stream/token", {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwtToken}`,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Stream token request failed [${res.status}]: ${text}`);
  }
  return (await res.json()) as StreamTokenResult;
}

export type StreamChannelResult = {
  channel_id: string;
  channel_type: string;
  cid: string;
  members: string[];
};

export async function fetchOrCreateStreamChannel(
  jwtToken: string,
  tailorId: string,
  customerId: string
): Promise<StreamChannelResult> {
  const res = await fetchWithApiFallback("/stream/channel", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwtToken}`,
    },
    body: JSON.stringify({ tailor_id: tailorId, customer_id: customerId }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Stream channel request failed [${res.status}]: ${text}`);
  }
  return (await res.json()) as StreamChannelResult;
}

// ── Singleton client ───────────────────────────────────────────────────────────

let _client: StreamChat | null = null;
let _connectedUserId: string | null = null;
let _globalListenerUnsub: (() => void) | null = null;

// ── Global message.new listener (fires local notifications) ──────────────────

function _attachGlobalListener(client: StreamChat, myUserId: string, myRole?: string) {
  _globalListenerUnsub?.();
  const { unsubscribe } = client.on("message.new", (event) => {
    if (!event.message || event.user?.id === myUserId) return;
    const channelId = event.channel_id ?? "";
    const channelCid = event.cid ?? "";
    const senderName = (event.user?.name as string) || "New message";
    const messageText = event.message.text ?? "";
    const otherUserId = event.user?.id ?? "";

    // 1. Fire local Expo notification (existing behaviour)
    scheduleMessageNotification({
      senderName,
      messageText,
      channelId,
      channelCid,
      otherUserId,
      otherUserName: senderName,
      role: myRole,
    });

    // 2. Persist to backend so it appears in the in-app notification list
    if (_jwtToken) {
      const preview = messageText.length > 60 ? messageText.slice(0, 57) + "…" : messageText;
      createNotification(
        _jwtToken,
        "chat_message",
        senderName,
        preview || "📷 Sent an image",
        { channelId, channelCid, otherUserId, otherUserName: senderName, role: myRole ?? "customer" }
      ).catch(() => {});
    }
  });
  _globalListenerUnsub = unsubscribe;
}

/**
 * Get the singleton StreamChat client instance.
 * Returns null if not yet configured (no api_key).
 */
export function getStreamClient(): StreamChat | null {
  return _client;
}

/**
 * Connect (or reconnect) the current user to Stream Chat.
 * Safe to call multiple times; re-uses the connection if userId matches.
 */
export async function connectStreamUser(
  jwtToken: string,
  userId: string,
  displayName: string,
  role?: string,
  phone?: string,
  email?: string
): Promise<StreamChat | null> {
  try {
    const { token, api_key } = await fetchStreamToken(jwtToken);
    _jwtToken = jwtToken; // store so global listener can call backend

    if (!api_key) {
      console.warn("[Stream] api_key not returned — Stream not configured on server");
      return null;
    }

    // Re-use existing client if same api_key
    if (!_client || _client.key !== api_key) {
      if (_client) {
        await _client.disconnectUser().catch(() => {});
      }
      _client = StreamChat.getInstance(api_key);
    }

    // Already connected as the same user — skip
    if (_connectedUserId === userId && _client.user) {
      return _client;
    }

    // Disconnect previous user first
    if (_client.user && _client.user.id !== userId) {
      await _client.disconnectUser().catch(() => {});
      _connectedUserId = null;
    }

    await _client.connectUser(
      {
        id: userId,
        name: displayName,
        ...(role ? { role } : {}),
        ...(phone ? { phone } : {}),
        ...(email ? { email } : {}),
      },
      token
    );
    _connectedUserId = userId;
    _attachGlobalListener(_client, userId, role);
    console.log(`[Stream] Connected as ${userId}`);
    return _client;
  } catch (err) {
    console.error("[Stream] connectStreamUser failed:", err);
    return null;
  }
}

/**
 * Disconnect the current user from Stream Chat on logout.
 */
export async function disconnectStreamUser(): Promise<void> {
  _globalListenerUnsub?.();
  _globalListenerUnsub = null;
  _jwtToken = null;
  if (_client) {
    try {
      await _client.disconnectUser();
      console.log("[Stream] Disconnected");
    } catch (err) {
      console.warn("[Stream] disconnect error:", err);
    }
    _connectedUserId = null;
  }
}

/**
 * Get (or create) a 1-to-1 Stream channel.
 * Returns a connected Channel object ready to watch.
 */
export async function getOrCreateChannel(
  jwtToken: string,
  tailorId: string,
  customerId: string
): Promise<Channel | null> {
  if (!_client) {
    console.warn("[Stream] client not connected — call connectStreamUser first");
    return null;
  }
  try {
    const result = await fetchOrCreateStreamChannel(jwtToken, tailorId, customerId);
    const channel = _client.channel(result.channel_type, result.channel_id);
    await channel.watch();
    return channel;
  } catch (err) {
    console.error("[Stream] getOrCreateChannel failed:", err);
    return null;
  }
}

// ── Convenience re-exports ─────────────────────────────────────────────────────

export type { Channel, Event };
