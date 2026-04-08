import React, { useEffect, useRef, useState } from 'react';
import { View, ScrollView, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/contexts/AuthContext';
import {
  FASHION_QUICK_PROMPTS,
  getSessionHistory,
  sendChatMessage,
  type ChatMessage,
} from '@/services/fashionChatbotApi';

type Message = {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
};

export default function AIStyleAssistant() {
  const router = useRouter();
  const params = useLocalSearchParams<{ sessionId?: string }>();
  const { user, loginEmail } = useAuth();
  const tint = useThemeColor({}, 'tint');
  const muted = useThemeColor({}, 'muted');
  const card = useThemeColor({}, 'card');
  const text = useThemeColor({}, 'text');
  const iconBg = useThemeColor({}, 'iconBg');

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([{ 
    id: 'welcome-1',
    sender: 'ai',
    text: "Hello! 👋 I'm your V Tailor AI assistant. I can help you with:\n\n• Design suggestions\n• Measurement guidance\n• Fabric recommendations\n• Style advice\n\nHow can I assist you today?",
    timestamp: 'Just now',
  }]);
  const [sessionId, setSessionId] = useState<string | null>(
    typeof params.sessionId === 'string' ? params.sessionId : null
  );
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<ScrollView | null>(null);
  const userId = (user?.email || loginEmail || 'guest').trim().toLowerCase();

  useEffect(() => {
    // scroll to bottom when messages change
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
  }, [messages]);

  useEffect(() => {
    if (!sessionId) return;
    setHistoryLoading(true);
    getSessionHistory(userId, sessionId)
      .then((history: ChatMessage[]) => {
        if (history.length === 0) return;
        setMessages(
          history.map((m, i) => ({
            id: m.id || `${sessionId}-${i}`,
            sender: m.sender,
            text: m.text,
            timestamp: m.time,
          }))
        );
      })
      .catch(() => setError('Could not load chat history.'))
      .finally(() => setHistoryLoading(false));
  }, [sessionId, userId]);

  const handleSend = async (textToSend?: string) => {
    const txt = (textToSend ?? message).trim();
    if (!txt || loading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: txt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((p) => [...p, userMsg]);
    setMessage('');
    setError(null);
    setLoading(true);

    try {
      const res = await sendChatMessage({
        message: txt,
        user_id: userId,
        session_id: sessionId,
      });

      if (!sessionId) setSessionId(res.session_id);

      const aiMsg: Message = {
        id: `a-${Date.now()}`,
        sender: 'ai',
        text: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((p) => [...p, aiMsg]);
    } catch (e: any) {
      setError(e?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const showQuickPrompts = messages.length <= 1 && !historyLoading;

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { backgroundColor: tint }]}> 
        <Pressable onPress={() => (router as any).back()} style={styles.backBtn}><ThemedText style={{ color: '#fff' }}>{'< Back'}</ThemedText></Pressable>
        <View style={styles.headerCenter}>
          <View style={[styles.botIcon, { backgroundColor: iconBg }]}>
            <ThemedText style={{ color: tint }}>🤖</ThemedText>
          </View>
          <View>
            <ThemedText style={styles.title}>AI Style Assistant</ThemedText>
            <ThemedText style={[styles.online, { color: '#fff' }]}>Online</ThemedText>
          </View>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {historyLoading ? (
        <View style={[styles.messages, styles.loaderWrap]}>
          <ActivityIndicator color={tint} />
        </View>
      ) : (
        <ScrollView ref={scrollRef} contentContainerStyle={styles.messages} style={{ flex: 1 }}>
          {messages.map((m) => (
            <View key={m.id} style={[styles.messageRow, m.sender === 'user' ? styles.messageRowUser : styles.messageRowAi]}>
              {m.sender === 'ai' && <View style={[styles.avatar, { backgroundColor: iconBg }]}><ThemedText style={{ color: tint }}>🤖</ThemedText></View>}
              <View style={[styles.bubble, { backgroundColor: m.sender === 'user' ? tint : card, borderColor: m.sender === 'ai' ? '#e6e7eb' : tint }]}> 
                <ThemedText style={{ color: m.sender === 'user' ? '#fff' : text }}>{m.text}</ThemedText>
                <ThemedText style={styles.ts}>{m.timestamp}</ThemedText>
              </View>
              {m.sender === 'user' && <View style={[styles.avatar, { backgroundColor: '#f3f4f6' }]}><ThemedText style={{ color: muted }}>👤</ThemedText></View>}
            </View>
          ))}
          {loading && (
            <View style={[styles.messageRow, styles.messageRowAi]}>
              <View style={[styles.avatar, { backgroundColor: iconBg }]}><ThemedText style={{ color: tint }}>🤖</ThemedText></View>
              <View style={[styles.bubble, { backgroundColor: card, borderColor: '#e6e7eb' }]}>
                <ThemedText style={{ color: muted }}>Typing...</ThemedText>
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {showQuickPrompts && (
        <View style={styles.quickWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12 }}>
            {FASHION_QUICK_PROMPTS.map((q) => (
              <Pressable key={q} onPress={() => handleSend(q)} style={[styles.suggestion, { borderColor: tint }]}> 
                <ThemedText style={{ color: tint }}>{q}</ThemedText>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {error && (
        <View style={styles.errorWrap}>
          <ThemedText style={{ color: '#b91c1c', fontSize: 12 }}>{error}</ThemedText>
        </View>
      )}

      <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} keyboardVerticalOffset={90}>
        <View style={[styles.inputRow, { backgroundColor: card }]}> 
          <TextInput value={message} onChangeText={setMessage} placeholder="Ask me anything..." placeholderTextColor={muted} style={styles.input} onSubmitEditing={() => handleSend()} editable={!loading} />
          <Pressable onPress={() => handleSend()} disabled={loading || !message.trim()} style={[styles.sendBtn, { backgroundColor: tint, opacity: loading || !message.trim() ? 0.6 : 1 }]}>
            <ThemedText style={{ color: '#fff' }}>Send</ThemedText>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: Platform.select({ ios: 84, android: 48, default: 48 }), padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: 56 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  botIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  title: { color: '#fff', fontWeight: '700', fontSize: 16 },
  online: { fontSize: 12, opacity: 0.9 },
  messages: { padding: 12, paddingBottom: 24, paddingTop: 16 },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12 },
  messageRowAi: { justifyContent: 'flex-start' },
  messageRowUser: { justifyContent: 'flex-end' },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginHorizontal: 6 },
  bubble: { maxWidth: '80%', padding: 12, borderRadius: 14, borderWidth: 1 },
  ts: { fontSize: 10, marginTop: 6, opacity: 0.8 },
  loaderWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  quickWrap: { paddingVertical: 8, borderTopWidth: 1, borderColor: '#e6e7eb' },
  suggestion: { paddingHorizontal: 14, paddingVertical: 8, marginHorizontal: 6, borderRadius: 999, borderWidth: 1 },
  errorWrap: { paddingHorizontal: 12, paddingVertical: 6, borderTopWidth: 1, borderColor: '#fee2e2', backgroundColor: '#fef2f2' },
  inputRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderTopWidth: 1, borderColor: '#e6e7eb' },
  input: { flex: 1, height: 44, paddingHorizontal: 12, borderRadius: 10, backgroundColor: 'transparent' },
  sendBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, marginLeft: 8 },
});
