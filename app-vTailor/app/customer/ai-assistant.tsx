import React, { useEffect, useRef, useState } from 'react';
import { View, ScrollView, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/contexts/AuthContext';
import AppBackButton from '@/components/AppBackButton';
import { SURFACE_MUTED, TEXT_DARK, UI } from '@/constants/ui';
import {
  FASHION_QUICK_PROMPTS,
  getSessionHistory,
  sendChatMessage,
  type ChatMessage,
} from '@/services/fashionChatbotApi';
import { Ionicons } from '@expo/vector-icons';

type Message = {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
};

const welcomeMessage: Message = {
  id: 'welcome-1',
  sender: 'ai',
  text: "Hello! Main hoon Vogue, aapki AI Style Assistant.\n\nMain in sab mein aapki madad kar sakti hoon:\n• Design suggestions aur outfit ideas\n• Measurement guidance\n• Fabric recommendations\n• Style advice for any occasion\n\nAap mujhse English ya Roman Urdu mein poochh sakte hain — dono samajhti hoon!\n\nKya poochh na chahenge?",
  timestamp: 'Just now',
};

type StoredAiChat = {
  id: string;
  title: string;
  sessionId: string | null;
  messages: Message[];
  updatedAt: string;
};

const createChatId = () => `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const getChatTitle = (messages: Message[]) => {
  const firstUserMessage = messages.find((item) => item.sender === 'user' && item.text.trim());
  if (!firstUserMessage) return 'New chat';
  return firstUserMessage.text.trim().slice(0, 42);
};

export default function AIStyleAssistant() {
  const router = useRouter();
  const params = useLocalSearchParams<{ sessionId?: string }>();
  const { user, loginEmail } = useAuth();
  const insets = useSafeAreaInsets();
  const tint = useThemeColor({}, 'tint');
  const muted = useThemeColor({}, 'muted');
  const card = useThemeColor({}, 'card');
  const text = useThemeColor({}, 'text');
  const iconBg = useThemeColor({}, 'iconBg');

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([welcomeMessage]);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(
    typeof params.sessionId === 'string' ? params.sessionId : null
  );
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [localHistoryLoaded, setLocalHistoryLoaded] = useState(false);
  const [hasLocalHistory, setHasLocalHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeChatId, setActiveChatId] = useState(createChatId);
  const [savedChats, setSavedChats] = useState<StoredAiChat[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);

  const scrollRef = useRef<ScrollView | null>(null);
  const userId = (user?.email || loginEmail || 'guest').trim().toLowerCase();
  const localChatKey = `vtailor_ai_chats_${userId || 'guest'}`;

  useEffect(() => {
    // scroll to bottom when messages change
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
  }, [messages]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, () => {
      setKeyboardVisible(true);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadLocalChat = async () => {
      setLocalHistoryLoaded(false);
      setHasLocalHistory(false);
      try {
        const raw = await AsyncStorage.getItem(localChatKey);
        if (!raw || !active) {
          setMessages([welcomeMessage]);
          return;
        }

        const parsed = JSON.parse(raw) as Partial<StoredAiChat> | StoredAiChat[];
        const singleChat = parsed as Partial<StoredAiChat>;
        const chatList = Array.isArray(parsed)
          ? parsed
          : singleChat.messages
            ? [{
                id: createChatId(),
                title: getChatTitle(singleChat.messages as Message[]),
                sessionId: singleChat.sessionId ?? null,
                messages: singleChat.messages as Message[],
                updatedAt: singleChat.updatedAt ?? new Date().toISOString(),
              }]
            : [];

        const normalizedChats = chatList
          .map((chat) => ({
            ...chat,
            id: chat.id || createChatId(),
            title: chat.title || getChatTitle(chat.messages || []),
            messages: Array.isArray(chat.messages) ? chat.messages : [],
            updatedAt: chat.updatedAt || new Date().toISOString(),
          }))
          .filter((chat) => chat.messages.length > 0)
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

        const selectedChat = normalizedChats[0];
        const storedMessages = Array.isArray(selectedChat?.messages)
          ? selectedChat.messages.filter((m): m is Message => (
              Boolean(m)
              && (m.sender === 'user' || m.sender === 'ai')
              && typeof m.text === 'string'
            ))
          : [];

        if (storedMessages.length > 0 && selectedChat) {
          setSavedChats(normalizedChats);
          setActiveChatId(selectedChat.id);
          setMessages(storedMessages);
          setHasLocalHistory(true);
          if (!sessionId && typeof selectedChat.sessionId === 'string') {
            setSessionId(selectedChat.sessionId);
          }
        } else {
          setSavedChats([]);
          setMessages([welcomeMessage]);
        }
      } catch {
        if (active) setMessages([welcomeMessage]);
      } finally {
        if (active) setLocalHistoryLoaded(true);
      }
    };

    loadLocalChat();

    return () => {
      active = false;
    };
  }, [localChatKey]);

  useEffect(() => {
    if (!localHistoryLoaded) return;

    const updatedChat: StoredAiChat = {
      id: activeChatId,
      title: getChatTitle(messages),
      sessionId,
      messages,
      updatedAt: new Date().toISOString(),
    };
    setSavedChats((currentChats) => {
      const nextChats = [
        updatedChat,
        ...currentChats.filter((chat) => chat.id !== activeChatId),
      ].slice(0, 20);

      AsyncStorage.setItem(localChatKey, JSON.stringify(nextChats)).catch(() => {
        // Local persistence is best-effort; chat still works if storage fails.
      });

      return nextChats;
    });
  }, [activeChatId, localChatKey, localHistoryLoaded, messages, sessionId]);

  useEffect(() => {
    if (!localHistoryLoaded || hasLocalHistory || !sessionId) return;
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
  }, [hasLocalHistory, localHistoryLoaded, sessionId, userId]);

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

  const resetChat = async () => {
    const nextChatId = createChatId();
    setActiveChatId(nextChatId);
    setMessages([welcomeMessage]);
    setSessionId(null);
    setMessage('');
    setError(null);
    setHasLocalHistory(false);
    setMenuOpen(false);
  };

  const handleNewChat = () => {
    if (messages.length <= 1) {
      resetChat();
      return;
    }

    Alert.alert(
      'Start New Chat?',
      'This will clear the current AI chat for this account and start fresh.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'New Chat', onPress: () => { resetChat(); } },
      ]
    );
  };

  const handleDeleteChat = () => {
    Alert.alert(
      'Delete Chat?',
      'This will permanently delete the saved AI chat from this device for this account.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const remainingChats = savedChats.filter((chat) => chat.id !== activeChatId);
            await AsyncStorage.setItem(localChatKey, JSON.stringify(remainingChats));
            const nextChat = remainingChats[0];
            setSavedChats(remainingChats);
            setActiveChatId(nextChat?.id || createChatId());
            setMessages(nextChat?.messages || [welcomeMessage]);
            setSessionId(nextChat?.sessionId || null);
            setMessage('');
            setError(null);
            setHasLocalHistory(Boolean(nextChat));
            setMenuOpen(false);
          },
        },
      ]
    );
  };

  const openSavedChat = (chat: StoredAiChat) => {
    setActiveChatId(chat.id);
    setMessages(chat.messages);
    setSessionId(chat.sessionId);
    setHasLocalHistory(true);
    setMessage('');
    setError(null);
    setMenuOpen(false);
  };

  const showQuickPrompts = messages.length <= 1 && !historyLoading;
  const hasConversation = messages.length > 1;

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { backgroundColor: tint }]}> 
        <View style={styles.headerTopRow}>
          <AppBackButton onPress={() => (router as any).back()} variant="tint" />
          <View style={styles.menuWrap}>
            <Pressable onPress={() => setMenuOpen((current) => !current)} style={styles.moreButton}>
              <Ionicons name="ellipsis-vertical" size={19} color="#fff" />
            </Pressable>
            {menuOpen ? (
              <View style={[styles.menuPanel, { backgroundColor: card }]}>
                <Pressable onPress={handleNewChat} style={styles.menuItem}>
                  <Ionicons name="add-circle-outline" size={18} color={tint} />
                  <ThemedText style={styles.menuText}>New Chat</ThemedText>
                </Pressable>
                <Pressable onPress={handleDeleteChat} disabled={!hasConversation} style={[styles.menuItem, !hasConversation && styles.menuItemDisabled]}>
                  <Ionicons name="trash-outline" size={18} color="#dc2626" />
                  <ThemedText style={[styles.menuText, { color: '#dc2626' }]}>Delete Chat</ThemedText>
                </Pressable>
                <View style={styles.menuDivider} />
                <ThemedText style={[styles.menuLabel, { color: muted }]}>Recent chats</ThemedText>
                {savedChats.length === 0 ? (
                  <ThemedText style={[styles.emptyMenuText, { color: muted }]}>No other chats yet</ThemedText>
                ) : (
                  savedChats.slice(0, 5).map((chat) => (
                    <Pressable key={chat.id} onPress={() => openSavedChat(chat)} style={[styles.chatMenuItem, chat.id === activeChatId && styles.chatMenuItemActive]}>
                      <Ionicons name="chatbubble-ellipses-outline" size={16} color={chat.id === activeChatId ? tint : muted} />
                      <ThemedText numberOfLines={1} style={styles.chatMenuText}>{chat.title}</ThemedText>
                    </Pressable>
                  ))
                )}
              </View>
            ) : null}
          </View>
        </View>
        <View style={styles.headerCenter}>
          <View style={[styles.botIcon, { backgroundColor: iconBg }]}>
            <Ionicons name="sparkles-outline" size={24} color={tint} />
          </View>
          <View style={styles.headerTextWrap}>
            <ThemedText style={styles.title}>AI Style Assistant</ThemedText>
            <ThemedText style={[styles.online, { color: '#fff' }]}>Online</ThemedText>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardArea}
        keyboardVerticalOffset={0}
      >
        {historyLoading ? (
          <View style={[styles.messages, styles.loaderWrap]}>
            <ActivityIndicator color={tint} />
          </View>
        ) : (
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.messages}
            style={{ flex: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            {messages.map((m) => (
              <View key={m.id} style={[styles.messageRow, m.sender === 'user' ? styles.messageRowUser : styles.messageRowAi]}>
                {m.sender === 'ai' && <View style={[styles.avatar, { backgroundColor: iconBg }]}><Ionicons name="sparkles-outline" size={17} color={tint} /></View>}
                <View style={[styles.bubble, { backgroundColor: m.sender === 'user' ? tint : card, borderColor: m.sender === 'ai' ? '#e6e7eb' : tint }]}> 
                  <ThemedText style={{ color: m.sender === 'user' ? '#fff' : text }}>{m.text}</ThemedText>
                  <ThemedText style={styles.ts}>{m.timestamp}</ThemedText>
                </View>
                {m.sender === 'user' && <View style={[styles.avatar, { backgroundColor: '#f3f4f6' }]}><Ionicons name="person-outline" size={17} color={muted} /></View>}
              </View>
            ))}
            {loading && (
              <View style={[styles.messageRow, styles.messageRowAi]}>
                <View style={[styles.avatar, { backgroundColor: iconBg }]}><Ionicons name="sparkles-outline" size={17} color={tint} /></View>
                <View style={[styles.bubble, { backgroundColor: card, borderColor: '#e6e7eb' }]}>
                  <ThemedText style={{ color: muted }}>Typing...</ThemedText>
                </View>
              </View>
            )}
          </ScrollView>
        )}

        {showQuickPrompts && (
          <View style={styles.quickWrap}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12 }} keyboardShouldPersistTaps="handled">
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

        <View style={[styles.inputShell, { backgroundColor: card, marginBottom: keyboardVisible ? 10 : Math.max(insets.bottom, 10) }]}> 
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Kuch bhi poochhein... (English ya Urdu)"
            placeholderTextColor={muted}
            style={[styles.input, { color: text }]}
            onSubmitEditing={() => handleSend()}
            returnKeyType="send"
            blurOnSubmit={false}
            editable={!loading}
            onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120)}
          />
          <Pressable onPress={() => handleSend()} disabled={loading || !message.trim()} style={[styles.sendBtn, { backgroundColor: tint, opacity: loading || !message.trim() ? 0.6 : 1 }]}>
            <Ionicons name="send" size={18} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SURFACE_MUTED },
  keyboardArea: { flex: 1 },
  header: { paddingTop: Platform.select({ ios: 64, android: 28, default: 28 }), paddingHorizontal: 16, paddingBottom: 18, gap: 14, borderBottomLeftRadius: 26, borderBottomRightRadius: 26 },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 30 },
  headerCenter: { alignItems: 'center', justifyContent: 'center' },
  headerTextWrap: { alignItems: 'center' },
  botIcon: { width: 56, height: 56, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 10, ...UI.softShadow },
  title: { color: '#fff', fontWeight: '900', fontSize: 22, textAlign: 'center' },
  online: { fontSize: 12, opacity: 0.9, marginTop: 3, fontWeight: '700', textAlign: 'center' },
  menuWrap: { alignItems: 'flex-end', zIndex: 40 },
  moreButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.2)' },
  menuPanel: { position: 'absolute', top: 48, right: 0, width: 260, borderRadius: 18, padding: 10, borderWidth: 1, borderColor: '#f1d6e2', ...UI.shadow },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11, paddingHorizontal: 10, borderRadius: 12 },
  menuItemDisabled: { opacity: 0.45 },
  menuText: { fontSize: 14, fontWeight: '800', color: TEXT_DARK },
  menuDivider: { height: 1, backgroundColor: '#f1d6e2', marginVertical: 6 },
  menuLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginHorizontal: 8, marginBottom: 6 },
  emptyMenuText: { fontSize: 12, paddingHorizontal: 8, paddingBottom: 8 },
  chatMenuItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 10, borderRadius: 12 },
  chatMenuItemActive: { backgroundColor: '#FCE4F2' },
  chatMenuText: { flex: 1, fontSize: 13, fontWeight: '700', color: TEXT_DARK },
  messages: { padding: 12, paddingBottom: 24, paddingTop: 16 },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12 },
  messageRowAi: { justifyContent: 'flex-start' },
  messageRowUser: { justifyContent: 'flex-end' },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginHorizontal: 6 },
  bubble: { maxWidth: '80%', padding: 12, borderRadius: 16, borderWidth: 1 },
  ts: { fontSize: 10, marginTop: 6, opacity: 0.8 },
  loaderWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  quickWrap: { paddingVertical: 8, borderTopWidth: 1, borderColor: '#e6e7eb', backgroundColor: SURFACE_MUTED },
  suggestion: { paddingHorizontal: 14, paddingVertical: 8, marginHorizontal: 6, borderRadius: 999, borderWidth: 1 },
  errorWrap: { paddingHorizontal: 12, paddingVertical: 6, borderTopWidth: 1, borderColor: '#fee2e2', backgroundColor: '#fef2f2' },
  inputShell: { flexDirection: 'row', alignItems: 'center', padding: 10, marginHorizontal: 12, borderRadius: 22, borderWidth: 1, borderColor: '#f1d6e2', ...UI.shadow },
  input: { flex: 1, minHeight: 44, paddingHorizontal: 14, borderRadius: 16, backgroundColor: '#f8fafc', fontSize: 15, color: TEXT_DARK },
  sendBtn: { width: 44, height: 44, borderRadius: 16, marginLeft: 8, alignItems: 'center', justifyContent: 'center' },
});
