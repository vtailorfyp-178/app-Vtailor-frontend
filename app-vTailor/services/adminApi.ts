import { fetchWithApiFallback } from '@/services/apiBase';

export type AdminStats = {
  users_total: number;
  customers: number;
  tailors: number;
  admins: number;
  users_inactive: number;
  orders_total: number;
  orders_pending: number;
  orders_confirmed: number;
  orders_declined: number;
};

export type AdminUser = {
  user_id: string;
  email?: string | null;
  name?: string | null;
  role: string;
  is_active: boolean;
  phone?: string | null;
};

export type AdminOrder = {
  id: string;
  customer_name: string;
  tailor_name: string;
  description: string;
  budget: number;
  status: string;
  proposed_price?: number | null;
  delivery_days?: number | null;
};

async function adminFetch(path: string, token: string, init?: RequestInit) {
  const res = await fetchWithApiFallback(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
  });
  const text = await res.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(text || `Request failed (${res.status})`);
  }
  if (!res.ok) {
    const detail =
      typeof data === 'object' && data && 'detail' in data
        ? String((data as { detail: unknown }).detail)
        : `Request failed (${res.status})`;
    throw new Error(detail);
  }
  return data;
}

export async function getAdminStats(token: string): Promise<AdminStats> {
  return adminFetch('/admin/stats', token) as Promise<AdminStats>;
}

export async function getAdminUsers(
  token: string,
  opts?: { role?: string; limit?: number },
): Promise<{ users: AdminUser[]; total: number }> {
  const q = new URLSearchParams();
  q.set('limit', String(opts?.limit ?? 100));
  if (opts?.role) q.set('role', opts.role);
  return adminFetch(`/admin/users?${q}`, token) as Promise<{ users: AdminUser[]; total: number }>;
}

export async function getAdminOrders(
  token: string,
  opts?: { status?: string; limit?: number },
): Promise<AdminOrder[]> {
  const q = new URLSearchParams();
  q.set('limit', String(opts?.limit ?? 100));
  if (opts?.status) q.set('status', opts.status);
  return adminFetch(`/admin/orders?${q}`, token) as Promise<AdminOrder[]>;
}

export async function setUserActive(token: string, userId: string, isActive: boolean): Promise<void> {
  await adminFetch(`/users/${userId}`, token, {
    method: 'PUT',
    body: JSON.stringify({ is_active: isActive }),
  });
}
