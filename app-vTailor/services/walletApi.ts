import { Platform } from 'react-native';
import Constants from 'expo-constants';

const expoHost = Constants.expoConfig?.hostUri?.split(':')[0];
const EMULATOR_ANDROID_HOST = '10.0.2.2';
const EXPO_API_BASE = (process.env.EXPO_PUBLIC_API_BASE_URL || '').trim();

function getCandidateBaseUrls() {
  if (EXPO_API_BASE) return [EXPO_API_BASE];

  if (Platform.OS === 'web') {
    const webHost = (typeof window !== 'undefined' && window.location && window.location.hostname) || 'localhost';
    return [
      `http://${webHost}:8000/app/api/v1`,
      'http://127.0.0.1:8000/app/api/v1',
      'http://localhost:8000/app/api/v1',
    ];
  }

  const urls: string[] = [];
  if (Platform.OS === 'android') urls.push(`http://${EMULATOR_ANDROID_HOST}:8000/app/api/v1`);
  if (expoHost) urls.push(`http://${expoHost}:8000/app/api/v1`);
  urls.push('http://127.0.0.1:8000/app/api/v1');
  return urls;
}

async function fetchWithFallback(path: string, init?: RequestInit) {
  const baseUrls = getCandidateBaseUrls();
  let lastError: any = null;

  for (const base of baseUrls) {
    try {
      return await fetch(`${base}${path}`, init);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('Failed to fetch');
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
