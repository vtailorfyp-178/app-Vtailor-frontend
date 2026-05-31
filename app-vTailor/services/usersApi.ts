/**
 * usersApi.ts
 * -----------
 * Authenticated endpoints for user/profile discovery.
 * Used by the "New Chat" search modal and Find Tailors fallback search.
 */

import { fetchWithApiFallback } from '@/services/apiBase';

export type UserSearchResult = {
  user_id: string;
  name: string;
  email: string;
  phone: string;
  role: 'tailor' | 'customer';
  avatar: string | null;
  specialization: string[];
  experience: string;
  is_available: boolean;
};

export type UserSearchResponse = {
  results: UserSearchResult[];
  count: number;
};

/**
 * Search users from the database by name/email substring.
 * @param token   JWT access token
 * @param q       Search text (name or email)
 * @param role    Optional role filter: 'tailor' | 'customer'
 * @param limit   Max results (default 20)
 */
export async function searchUsers(
  token: string,
  q: string,
  role?: 'tailor' | 'customer',
  limit = 20
): Promise<UserSearchResult[]> {
  const params = new URLSearchParams();
  if (q.trim()) params.set('q', q.trim());
  if (role) params.set('role', role);
  params.set('limit', String(limit));

  const res = await fetchWithApiFallback(`/users/search?${params.toString()}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`User search failed [${res.status}]: ${text}`);
  }

  const data: UserSearchResponse = await res.json();
  return data.results ?? [];
}
