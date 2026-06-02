import { fetchWithApiFallback } from '@/services/apiBase';

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
  'Garmi ke liye best fabric konsa hai?',
  'Shadi ke liye outfit suggest karo',
  'Which fabric is best for summer dresses?',
  'Meri skin tone ke liye konsa rang achha lagega?',
  'Suggest winter dress fabrics and colors',
  'Eid ke liye dress suggest karo',
  'Best colors for a formal dress',
  'Shalwar kameez ke liye neckline konsi best hai?',
];

export async function sendChatMessage(payload: {
  message: string;
  user_id: string;
  session_id?: string | null;
}): Promise<ChatReply> {
  const res = await fetchWithApiFallback('/chatbot/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => String(res.status));
    throw new Error(`Chat request failed (${res.status}): ${body}`);
  }

  return res.json() as Promise<ChatReply>;
}

export async function getSessionHistory(
  userId: string,
  sessionId: string,
): Promise<ChatMessage[]> {
  const res = await fetchWithApiFallback(
    `/chatbot/history/${encodeURIComponent(userId)}/${encodeURIComponent(sessionId)}`,
  );

  if (!res.ok) throw new Error(`Failed to load session history (${res.status})`);

  const data = (await res.json()) as { messages?: unknown[] };
  const messages = Array.isArray(data.messages) ? data.messages : [];

  return messages.map((m: any, i: number) => ({
    id: `${sessionId}-${i}`,
    sender: (m.sender === 'user' ? 'user' : 'ai') as 'user' | 'ai',
    text: String(m.text ?? ''),
    time: String(m.time ?? ''),
  }));
}
