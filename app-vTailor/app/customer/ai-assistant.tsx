import React, { useEffect, useRef, useState } from 'react';
import { View, ScrollView, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

type Message = {
  id: number;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
};

export default function AIStyleAssistant() {
  const router = useRouter();
  const tint = useThemeColor({}, 'tint');
  const muted = useThemeColor({}, 'muted');
  const card = useThemeColor({}, 'card');
  const text = useThemeColor({}, 'text');
  const iconBg = useThemeColor({}, 'iconBg');

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([{
    id: 1,
    sender: 'ai',
    text: "Hello! 👋 I'm your V Tailor AI assistant. I can help you with:\n\n• Design suggestions\n• Measurement guidance\n• Fabric recommendations\n• Style advice\n\nHow can I assist you today?",
    timestamp: 'Just now',
  }]);

  const quickSuggestions = [
    'Suggest formal wear designs',
    'Help with measurements',
    'Best fabric for summer',
    'Wedding outfit ideas',
  ];

  const scrollRef = useRef<ScrollView | null>(null);

  useEffect(() => {
    // scroll to bottom when messages change
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
  }, [messages]);

  const handleSend = (textToSend?: string) => {
    const txt = (textToSend ?? message).trim();
    if (!txt) return;

    const userMsg: Message = {
      id: messages.length + 1,
      sender: 'user',
      text: txt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((p) => [...p, userMsg]);
    setMessage('');

    // simulate AI response
    setTimeout(() => {
      const aiMap: Record<string, string> = {
        'Suggest formal wear designs': "For formal wear, I recommend:\n\n👔 Classic 3-piece suits with slim fit\n👔 Mandarin collar sherwanis for events\n👔 Navy or charcoal colors for versatility\n\nWould you like specific design details?",
        'Help with measurements': "I'll guide you through measurements:\n\n📏 Chest: Measure around the fullest part\n📏 Waist: Measure at your natural waistline\n📏 Length: From shoulder to desired hem\n\nNeed help with specific measurements?",
        'Best fabric for summer': "For summer comfort:\n\n🌿 Cotton - Breathable and comfortable\n🌿 Linen - Light and airy\n🌿 Cotton-Linen blend - Best of both\n\nAvoid polyester as it traps heat!",
        'Wedding outfit ideas': "For weddings, consider:\n\n✨ Sherwani with gold embroidery\n✨ Waistcoat with churidar\n✨ Prince coat in rich colors\n\nWant to see design templates?",
      };

      const aiMsg: Message = {
        id: messages.length + 2,
        sender: 'ai',
        text: aiMap[txt] ?? "That's a great question! I suggest exploring customization options; would you like a step-by-step guide?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((p) => [...p, aiMsg]);
    }, 900);
  };

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
      </ScrollView>

      {messages.length <= 2 && (
        <View style={styles.quickWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12 }}>
            {quickSuggestions.map((q) => (
              <Pressable key={q} onPress={() => handleSend(q)} style={[styles.suggestion, { borderColor: tint }]}> 
                <ThemedText style={{ color: tint }}>{q}</ThemedText>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} keyboardVerticalOffset={90}>
        <View style={[styles.inputRow, { backgroundColor: card }]}> 
          <TextInput value={message} onChangeText={setMessage} placeholder="Ask me anything..." placeholderTextColor={muted} style={styles.input} onSubmitEditing={() => handleSend()} />
          <Pressable onPress={() => handleSend()} style={[styles.sendBtn, { backgroundColor: tint }]}>
            <ThemedText style={{ color: '#fff' }}>Send</ThemedText>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: Platform.select({ ios: 44, android: 24, default: 24 }), padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: 56 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  botIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  title: { color: '#fff', fontWeight: '700', fontSize: 16 },
  online: { fontSize: 12, opacity: 0.9 },
  messages: { padding: 12, paddingBottom: 24 },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12 },
  messageRowAi: { justifyContent: 'flex-start' },
  messageRowUser: { justifyContent: 'flex-end' },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginHorizontal: 6 },
  bubble: { maxWidth: '80%', padding: 12, borderRadius: 14, borderWidth: 1 },
  ts: { fontSize: 10, marginTop: 6, opacity: 0.8 },
  quickWrap: { paddingVertical: 8, borderTopWidth: 1, borderColor: '#e6e7eb' },
  suggestion: { paddingHorizontal: 14, paddingVertical: 8, marginHorizontal: 6, borderRadius: 999, borderWidth: 1 },
  inputRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderTopWidth: 1, borderColor: '#e6e7eb' },
  input: { flex: 1, height: 44, paddingHorizontal: 12, borderRadius: 10, backgroundColor: 'transparent' },
  sendBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, marginLeft: 8 },
});
