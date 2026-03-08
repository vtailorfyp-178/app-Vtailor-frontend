import React, { useState } from 'react';
import { View, ScrollView, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, Image, Alert, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ProtectedRoute } from '@/components/ProtectedRoute';

interface Message {
  id: string;
  sender: 'tailor' | 'customer';
  text?: string;
  media?: { type: 'image' | 'video'; uri: string };
  time: string;
}

const SAMPLE_THREADS: Record<number, { customerName: string; avatar: string; phone: string; messages: Message[] }> = {
  1: {
    customerName: 'Ali Hassan',
    avatar: 'AH',
    phone: '+92 300 1111111',
    messages: [
      { id: '1', sender: 'customer', text: 'When will my suit be ready?', time: '9:10 AM' },
      { id: '2', sender: 'tailor', text: 'Cutting done, stitching in progress.', time: '9:12 AM' },
    ],
  },
  2: {
    customerName: 'Zara Khan',
    avatar: 'ZK',
    phone: '+92 300 2222222',
    messages: [
      { id: '1', sender: 'customer', text: 'Loved the design!', time: '8:30 AM' },
    ],
  },
};

export default function TailorChatConversation() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const customerId = parseInt(params.id as string) || 1;
  const returnTo = typeof params.returnTo === 'string' ? params.returnTo : undefined;
  const tint = useThemeColor({}, 'tint');
  const card = useThemeColor({}, 'card');
  const inputBorder = useThemeColor({}, 'inputBorder');
  const muted = useThemeColor({}, 'muted');

  const thread = SAMPLE_THREADS[customerId];
  const [messages, setMessages] = useState<Message[]>(thread?.messages ?? []);
  const [inputText, setInputText] = useState('');
  const [showAttach, setShowAttach] = useState(false);

  const handleBack = () => {
    if (returnTo) {
      router.replace(returnTo as any);
      return;
    }
    if (router.canGoBack()) {
      (router as any).back();
      return;
    } else {
      router.replace('/tailor?tab=chat');
    }
  };

  const handleSendMessage = () => {
    if (!thread || !inputText.trim()) return;
    const newMsg: Message = {
      id: String(messages.length + 1),
      sender: 'tailor',
      text: inputText,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
  };

  const handleCall = () => {
    if (!thread) return;
    const url = `tel:${thread.phone}`;
    Linking.openURL(url).catch(() => Alert.alert('Call Failed', 'Unable to initiate call on this device.'));
  };

  const handlePickImage = () => {
    setShowAttach(false);
    Alert.alert('Attachment', 'Pick image (placeholder)');
  };

  const handlePickVideo = () => {
    setShowAttach(false);
    Alert.alert('Attachment', 'Pick video (placeholder)');
  };

  if (!thread) {
    return (
      <ProtectedRoute requiredRole="tailor">
        <ThemedView style={styles.container}>
          <View style={[styles.header, { backgroundColor: tint }]}>
            <Pressable onPress={handleBack} style={styles.headerButton}>
              <Ionicons name="chevron-back" size={26} color="#fff" />
            </Pressable>
            <ThemedText style={[styles.headerTitle, { color: '#fff' }]}>Chat Not Found</ThemedText>
            <View style={styles.headerButton} />
          </View>
        </ThemedView>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="tailor">
      <ThemedView style={styles.container}>
        <View style={[styles.header, { backgroundColor: tint }]}>
          <Pressable onPress={handleBack} style={styles.headerButton}>
            <Ionicons name="chevron-back" size={26} color="#fff" />
          </Pressable>
          <View style={styles.headerCenter}>
            <View style={[styles.avatar, { backgroundColor: '#ffe4f0' }]}>
              <ThemedText style={styles.avatarText}>{thread.avatar}</ThemedText>
            </View>
            <View style={{ marginLeft: 10 }}>
              <ThemedText style={[styles.headerTitle, { color: '#fff' }]}>{thread.customerName}</ThemedText>
              <ThemedText style={{ color: '#e5e7eb', fontSize: 12 }}>Online</ThemedText>
            </View>
          </View>
          <Pressable onPress={handleCall} style={styles.headerButton} hitSlop={8}>
            <Ionicons name="call" size={22} color="#fff" />
          </Pressable>
        </View>

        <KeyboardAvoidingView
          behavior={'padding'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={40}
        >
          <ScrollView contentContainerStyle={styles.messages} showsVerticalScrollIndicator={false}>
            {messages.map((msg) => (
              <View
                key={msg.id}
                style={[
                  styles.messageWrapper,
                  msg.sender === 'tailor' ? styles.tailorWrapper : styles.customerWrapper,
                ]}
              >
                <View
                  style={[
                    styles.bubble,
                    msg.sender === 'tailor'
                      ? { backgroundColor: tint }
                      : { backgroundColor: card, borderColor: inputBorder, borderWidth: 1 },
                  ]}
                >
                  {msg.media ? (
                    msg.media.type === 'image' ? (
                      <Image source={{ uri: msg.media.uri }} style={styles.mediaImage} />
                    ) : (
                      <ThemedText style={{ color: msg.sender === 'tailor' ? '#fff' : '#000' }}>{msg.media.uri}</ThemedText>
                    )
                  ) : (
                    <ThemedText style={[styles.messageText, msg.sender === 'tailor' ? { color: '#fff' } : {}]}>
                      {msg.text}
                    </ThemedText>
                  )}
                </View>
                <ThemedText style={[styles.time, { color: muted }]}>{msg.time}</ThemedText>
              </View>
            ))}
          </ScrollView>

          <View style={[styles.inputBar, { backgroundColor: card, borderTopColor: inputBorder }]}>
            <View style={styles.attachRow}>
              <Pressable onPress={() => setShowAttach((v) => !v)} style={[styles.attachToggle, { borderColor: tint }]}>
                <Ionicons name={showAttach ? 'close' : 'add'} size={18} color={tint} />
              </Pressable>
              {showAttach && (
                <View style={styles.attachMenu}>
                  <Pressable onPress={handlePickImage} style={[styles.attachItem, { borderColor: tint }]}>
                    <Ionicons name="image" size={18} color={tint} />
                    <ThemedText style={styles.attachLabel}>Photo</ThemedText>
                  </Pressable>
                  <Pressable onPress={handlePickVideo} style={[styles.attachItem, { borderColor: tint }]}>
                    <Ionicons name="videocam" size={18} color={tint} />
                    <ThemedText style={styles.attachLabel}>Video</ThemedText>
                  </Pressable>
                </View>
              )}
            </View>
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a message"
              placeholderTextColor={muted}
              style={[styles.textInput, { color: useThemeColor({}, 'text') }]}
            />
            <Pressable onPress={handleSendMessage} style={[styles.sendButton, { backgroundColor: tint }]}>
              <Ionicons name="send" size={18} color="#fff" />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </ThemedView>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  headerButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontWeight: '700', color: '#111827' },
  messages: { padding: 16, paddingBottom: 16 },
  messageWrapper: { marginBottom: 12 },
  tailorWrapper: { alignItems: 'flex-end' },
  customerWrapper: { alignItems: 'flex-start' },
  bubble: { padding: 12, borderRadius: 12, maxWidth: '78%' },
  mediaImage: { width: 180, height: 180, borderRadius: 12 },
  messageText: { fontSize: 14 },
  time: { fontSize: 11, marginTop: 4 },
  inputBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1 },
  attachRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginRight: 6, position: 'relative' },
  attachToggle: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  attachMenu: { position: 'absolute', bottom: 50, left: 0, flexDirection: 'column-reverse', alignItems: 'flex-start', gap: 8 },
  attachItem: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  attachLabel: { fontSize: 12 },
  textInput: { flex: 1, paddingVertical: 10, paddingHorizontal: 12, fontSize: 14 },
  sendButton: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
});
