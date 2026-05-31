/**
 * notificationsApi.ts
 * -------------------
 * Frontend service for the /notifications backend API.
 *
 * All calls require the user's JWT which is passed as a parameter
 * (matching the pattern used by authApi.ts, walletApi.ts, etc.).
 */

import { fetchWithApiFallback } from './apiBase';

// ── Types ─────────────────────────────────────────────────────────────────────

export type AppNotification = {
  id: string;
  user_id: string;
  type:
    | 'chat_message'
    | 'chat_started'
    | 'wallet_pending'
    | 'wallet_confirmed'
    | 'wallet_failed'
    | string;
  title: string;
  message: string;
  data: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function authHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

// ── API calls ─────────────────────────────────────────────────────────────────

/** Fetch all notifications for the current user, newest first. */
export async function getNotifications(
  token: string,
  limit = 50
): Promise<AppNotification[]> {
  const res = await fetchWithApiFallback(`/notifications?limit=${limit}`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(`getNotifications failed [${res.status}]`);
  return res.json();
}

/** Return the number of unread notifications. */
export async function getUnreadCount(token: string): Promise<number> {
  const res = await fetchWithApiFallback('/notifications/unread-count', {
    headers: authHeaders(token),
  });
  if (!res.ok) return 0;
  const body = await res.json();
  return (body as { count: number }).count ?? 0;
}

/** Create a notification (used by the frontend for client-side events). */
export async function createNotification(
  token: string,
  type: string,
  title: string,
  message: string,
  data: Record<string, unknown> = {}
): Promise<AppNotification | null> {
  try {
    const res = await fetchWithApiFallback('/notifications', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ type, title, message, data }),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

/** Mark a single notification as read. */
export async function markNotificationRead(
  token: string,
  notificationId: string
): Promise<void> {
  try {
    await fetchWithApiFallback(`/notifications/${notificationId}/read`, {
      method: 'PATCH',
      headers: authHeaders(token),
    });
  } catch {
    // best-effort
  }
}

/** Mark all notifications as read. */
export async function markAllNotificationsRead(token: string): Promise<void> {
  try {
    await fetchWithApiFallback('/notifications/read-all', {
      method: 'PATCH',
      headers: authHeaders(token),
    });
  } catch {
    // best-effort
  }
}
