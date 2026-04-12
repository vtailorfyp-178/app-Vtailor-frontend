import { Platform } from 'react-native';
import Constants from 'expo-constants';

export type ChatMessage = {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  time: string;
};

export type ChatReply = {
  reply: string;
  session_id: string;
};

export const FASHION_QUICK_PROMPTS: string[] = [
  'What should I wear to a job interview?',
  'Best fabrics for summer?',
  'How to build a capsule wardrobe?',
  'Colors that suit warm skin tones?',
  'Outfit ideas for a first date',
  "What's trending this season?",
];

const expoHostCandidates = [
  Constants.expoConfig?.hostUri,
  (Constants as any).expoGoConfig?.hostUri,
  (Constants as any).expoConfig?.debuggerHost,
  (Constants as any).expoGoConfig?.debuggerHost,
]
  .filter(Boolean)
  .map((value) => String(value).replace(/^.*?:\/\//, '').replace(/:\d+$/, '').trim())
  .filter(Boolean);
const EMULATOR_ANDROID_HOST = '10.0.2.2';
const EXPO_API_BASE = (process.env.EXPO_PUBLIC_API_BASE_URL || '').trim();

function buildBaseUrl(host: string) {
  return `http://${host}:8000/app/api/v1`;
}

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
  if (Platform.OS === 'android') urls.push(buildBaseUrl(EMULATOR_ANDROID_HOST));
  urls.push(...expoHostCandidates.map(buildBaseUrl));
  urls.push(buildBaseUrl('127.0.0.1'));
  urls.push(buildBaseUrl('localhost'));
  return urls;
}

async function fetchWithFallback(path: string, init?: RequestInit) {
  const baseUrls = getCandidateBaseUrls();
  let lastError: unknown = null;

  for (const base of baseUrls) {
    try {
      return await fetch(`${base}${path}`, init);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('Failed to fetch');
}

export async function sendChatMessage(payload: {
  message: string;
  user_id: string;
  session_id?: string | null;
}): Promise<ChatReply> {
  const res = await fetchWithFallback('/chatbot/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Chat request failed (${res.status}): ${body}`);
  }

  return res.json();
}

export async function getSessionHistory(userId: string, sessionId: string): Promise<ChatMessage[]> {
  const res = await fetchWithFallback(`/chatbot/history/${encodeURIComponent(userId)}/${encodeURIComponent(sessionId)}`);
  if (!res.ok) throw new Error(`Failed to load session history (${res.status})`);

  const data = await res.json();
  const messages = Array.isArray(data.messages) ? data.messages : [];

  return messages.map((m: any, i: number) => ({
    id: `${sessionId}-${i}`,
    sender: m.sender === 'user' ? 'user' : 'ai',
    text: String(m.text ?? ''),
    time: String(m.time ?? ''),
  }));
}
