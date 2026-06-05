/**
 * ordersApi.ts
 * ------------
 * Frontend service for the /orders backend API.
 */

import { fetchWithApiFallback } from './apiBase';

// ── Types ─────────────────────────────────────────────────────────────────────

export type OrderStatus = 'pending' | 'accepted' | 'declined' | 'negotiating' | 'price_proposed' | 'confirmed';

export type Order = {
  id: string;
  customer_id: string;
  tailor_id: string;
  customer_name: string;
  tailor_name: string;
  description: string;
  budget: number;
  status: OrderStatus;
  proposed_price: number | null;
  delivery_days: number | null;
  note: string | null;
  created_at: string;
  updated_at: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function authHeaders(token: string) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

// ── API calls ─────────────────────────────────────────────────────────────────

/** Customer places a new order request to a tailor. */
export async function createOrder(
  token: string,
  params: {
    tailor_id: string;
    tailor_name: string;
    description: string;
    budget: number;
    delivery_days: number;
  }
): Promise<Order> {
  const res = await fetchWithApiFallback('/orders', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).detail || `createOrder failed [${res.status}]`);
  }
  return res.json();
}

/** List orders for the current user (customer → placed orders, tailor → received requests). */
export async function getOrders(token: string): Promise<Order[]> {
  const res = await fetchWithApiFallback('/orders', { headers: authHeaders(token) });
  if (!res.ok) throw new Error(`getOrders failed [${res.status}]`);
  return res.json();
}

/** Tailor accepts an order and proposes a price + delivery timeline. */
export async function acceptOrder(
  token: string,
  orderId: string,
  params: { proposed_price: number; delivery_days: number; note?: string }
): Promise<Order> {
  const res = await fetchWithApiFallback(`/orders/${orderId}/accept`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).detail || `acceptOrder failed [${res.status}]`);
  }
  return res.json();
}

/** Tailor declines an order. */
export async function declineOrder(
  token: string,
  orderId: string,
  note?: string
): Promise<Order> {
  const res = await fetchWithApiFallback(`/orders/${orderId}/decline`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ note: note || null }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).detail || `declineOrder failed [${res.status}]`);
  }
  return res.json();
}

/** Tailor proposes a custom price — customer must approve or reject. */
export async function proposePrice(
  token: string,
  orderId: string,
  params: { proposed_price: number; delivery_days: number; note?: string }
): Promise<Order> {
  const res = await fetchWithApiFallback(`/orders/${orderId}/propose-price`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).detail || `proposePrice failed [${res.status}]`);
  }
  return res.json();
}

/** Customer approves the tailor's proposed price → order confirmed. */
export async function confirmOrder(token: string, orderId: string): Promise<Order> {
  const res = await fetchWithApiFallback(`/orders/${orderId}/confirm`, {
    method: 'PATCH',
    headers: authHeaders(token),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).detail || `confirmOrder failed [${res.status}]`);
  }
  return res.json();
}

/** Customer rejects the tailor's proposed price → order declined. */
export async function rejectPrice(token: string, orderId: string): Promise<Order> {
  const res = await fetchWithApiFallback(`/orders/${orderId}/reject-price`, {
    method: 'PATCH',
    headers: authHeaders(token),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).detail || `rejectPrice failed [${res.status}]`);
  }
  return res.json();
}
