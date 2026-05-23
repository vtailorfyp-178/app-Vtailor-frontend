import { fetchWithApiFallback } from '@/services/apiBase';

async function fetchWithFallback(path: string, init?: RequestInit) {
  return fetchWithApiFallback(path, init);
}

export type WalletTransactionType = 'add' | 'withdraw';

export type WalletTransaction = {
  id: string;
  transaction_type: WalletTransactionType;
  amount: number;
  payment_method: string;
  gateway_provider?: string | null;
  gateway_reference?: string | null;
  phone?: string | null;
  balance_before: number;
  balance_after: number;
  status: string;
  payment_url?: string | null;
  created_at: string;
};

export type WalletSummary = {
  user_id: string;
  balance: number;
  currency: string;
  updated_at: string;
  transactions: WalletTransaction[];
};

export async function getWalletSummary(token: string, limit = 20): Promise<WalletSummary> {
  const response = await fetchWithFallback(`/wallet/summary?limit=${limit}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.detail || 'Failed to load wallet summary');
  }
  return data;
}

export async function createWalletTransaction(
  token: string,
  payload: {
    transaction_type: WalletTransactionType;
    amount: number;
    payment_method: string;
    phone?: string;
  }
): Promise<{ status: string; message: string; wallet: WalletSummary; transaction: WalletTransaction; next_action_url?: string | null }> {
  const response = await fetchWithFallback('/wallet/transactions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.detail || 'Transaction failed');
  }
  return data;
}

export async function confirmWalletTransaction(
  token: string,
  transactionId: string
): Promise<{ status: string; message: string; wallet: WalletSummary; transaction: WalletTransaction; next_action_url?: string | null }> {
  const response = await fetchWithFallback(`/wallet/transactions/${transactionId}/confirm`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.detail || 'Failed to confirm transaction');
  }
  return data;
}

export async function failWalletTransaction(
  token: string,
  transactionId: string,
  reason?: string
): Promise<{ status: string; message: string; wallet: WalletSummary; transaction: WalletTransaction }> {
  const response = await fetchWithFallback(`/wallet/transactions/${transactionId}/fail`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ reason }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.detail || 'Failed to mark transaction as failed');
  }
  return data;
}
