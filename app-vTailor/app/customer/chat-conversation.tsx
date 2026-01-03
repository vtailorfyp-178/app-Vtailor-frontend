import React, { useState } from 'react';
import { View, ScrollView, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';

interface Message {
  id: string;
  sender: 'customer' | 'tailor';
  text?: string;
  media?: {
    type: 'image' | 'video';
    uri: string;
  };
  time: string;
}

interface ChatConversation {
  tailorId: number;
  tailorName: string;
  tailorAvatar: string;
  messages: Message[];
}

const SAMPLE_CONVERSATIONS: Record<number, ChatConversation> = {
  1: {
    tailorId: 1,
    tailorName: 'Ahmad Master Tailor',
    tailorAvatar: '👨‍🔧',
    messages: [
      { id: '1', sender: 'tailor', text: 'Hello! Thanks for reaching out. How can I help you?', time: '10:30 AM' },
      { id: '2', sender: 'customer', text: 'Hi! I want to order a Long Frock. Can you do it?', time: '10:32 AM' },
      { id: '3', sender: 'tailor', text: 'Yes, absolutely! I specialize in formal wear. When do you need it?', time: '10:35 AM' },
      { id: '4', sender: 'customer', text: 'By January 15th. Is that possible?', time: '10:36 AM' },
      { id: '5', sender: 'tailor', text: 'Yes, that is definitely possible. Rs. 8,500 for a quality Long Frock.', time: '10:38 AM' },
    ],
  },
  2: {
    tailorId: 2,
    tailorName: 'Karachi Tailoring House',
    tailorAvatar: '🧵',
    messages: [
      { id: '1', sender: 'customer', text: 'Hi, I need a Kurti stitched', time: '9:15 AM' },
      { id: '2', sender: 'tailor', text: 'Sure! We have great experience with Kurtas. What style do you prefer?', time: '9:20 AM' },
    ],
  },
  3: {
    tailorId: 3,
    tailorName: 'Classic Stitchers',
    tailorAvatar: '✂️',
    messages: [
      { id: '1', sender: 'tailor', text: 'Welcome! How can I assist you today?', time: '8:00 AM' },
    ],
  },
};

export default function ChatConversation() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const tailorId = parseInt(params.tailorId as string) || 1;
  const tint = useThemeColor({}, 'tint');
  const card = useThemeColor({}, 'card');
  const inputBorder = useThemeColor({}, 'inputBorder');
  const muted = useThemeColor({}, 'muted');

  const conversation = SAMPLE_CONVERSATIONS[tailorId];
  const [messages, setMessages] = useState<Message[]>(conversation.messages);
  const [inputText, setInputText] = useState('');

  const handleSendMessage = () => {
    if (inputText.trim()) {
      const newMessage: Message = {
        id: String(messages.length + 1),
        sender: 'customer',
        text: inputText,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([...messages, newMessage]);
      setInputText('');

      // Simulate tailor response after 2 seconds
      setTimeout(() => {
        const tailorResponse: Message = {
          id: String(messages.length + 2),
          sender: 'tailor',
          text: 'Thanks for the message! I will get back to you shortly.',
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, tailorResponse]);
      }, 2000);
    }
  };

  const handlePickImage = () => {
    // Mock image selection
    const mockImageUri = 'https://via.placeholder.com/300x300/FF6B6B/FFFFFF?text=Dress+Design';
    const newMessage: Message = {
      id: String(messages.length + 1),
      sender: 'customer',
      media: {
        type: 'image',
        uri: mockImageUri,
      },
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages([...messages, newMessage]);

    // Simulate tailor response with image
    setTimeout(() => {
      const tailorResponse: Message = {
        id: String(messages.length + 2),
        sender: 'tailor',
        text: 'Nice design! I can definitely make this for you.',
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, tailorResponse]);
    }, 2000);
  };

  const handlePickVideo = () => {
    // Mock video selection
    const mockVideoUri = '📹 Video_Design_Reference.mp4';
    const newMessage: Message = {
      id: String(messages.length + 1),
      sender: 'customer',
      media: {
        type: 'video',
        uri: mockVideoUri,
      },
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages([...messages, newMessage]);
  };

  if (!conversation) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.header, { backgroundColor: tint }]}>
          <Pressable onPress={() => (router as any).back()}>
            <ThemedText style={{ color: '#fff' }}>{'< Back'}</ThemedText>
          </Pressable>
          <ThemedText style={styles.headerTitle}>Chat Not Found</ThemedText>
          <View style={{ width: 56 }} />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: tint }]}>
        <Pressable onPress={() => (router as any).back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </Pressable>
        <View style={styles.headerCenter}>
          <ThemedText style={styles.tailorAvatar}>{conversation.tailorAvatar}</ThemedText>
          <View style={{ marginLeft: 12 }}>
            <ThemedText style={[styles.headerTitle, { color: '#fff' }]}>{conversation.tailorName}</ThemedText>
            <ThemedText style={{ color: '#e5e7eb', fontSize: 12 }}>Online</ThemedText>
          </View>
        </View>
        <View style={{ width: 56 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
        keyboardVerticalOffset={100}
      >
        {/* Messages */}
        <ScrollView
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.messageWrapper,
                msg.sender === 'customer' ? styles.customerMessageWrapper : styles.tailorMessageWrapper,
              ]}
            >
              <View
                style={[
                  styles.messageBubble,
                  msg.sender === 'customer'
                    ? { backgroundColor: tint }
                    : { backgroundColor: card, borderColor: inputBorder, borderWidth: 1 },
                ]}
              >
                {msg.media ? (
                  <View>
                    {msg.media.type === 'image' ? (
                      <Image
                        source={{ uri: msg.media.uri }}
                        style={styles.mediaImage}
                      />
                    ) : (
                      <View style={styles.videoPlaceholder}>
                        <ThemedText style={{ fontSize: 32, marginBottom: 8 }}>🎥</ThemedText>
                        <ThemedText style={{ fontSize: 12, textAlign: 'center', color: msg.sender === 'customer' ? '#fff' : '#000' }}>
                          {msg.media.uri}
                        </ThemedText>
                      </View>
                    )}
                  </View>
                ) : (
                  <ThemedText
                    style={[
                      styles.messageText,
                      msg.sender === 'customer' ? { color: '#fff' } : {},
                    ]}
                  >
                    {msg.text}
                  </ThemedText>
                )}
              </View>
              <ThemedText style={[styles.messageTime, { color: muted }]}>{msg.time}</ThemedText>
            </View>
          ))}
        </ScrollView>

        {/* Input Area */}
        <View style={[styles.inputContainer, { backgroundColor: card, borderTopColor: inputBorder }]}>
          <View style={styles.mediaButtonsRow}>
            <Pressable
              onPress={handlePickImage}
              style={[styles.mediaButton, { borderColor: tint }]}
            >
              <Ionicons name="image" size={18} color={tint} />
            </Pressable>
            <Pressable
              onPress={handlePickVideo}
              style={[styles.mediaButton, { borderColor: tint }]}
            >
              <Ionicons name="videocam" size={18} color={tint} />
            </Pressable>
          </View>
          <TextInput
            style={[styles.messageInput, { borderColor: inputBorder, color: 'inherit' }]}
            placeholder="Type a message..."
            value={inputText}
            onChangeText={setInputText}
            placeholderTextColor={muted}
            multiline
          />
          <Pressable
            onPress={handleSendMessage}
            disabled={!inputText.trim()}
            style={[
              styles.sendButton,
              { backgroundColor: inputText.trim() ? tint : '#d1d5db' },
            ]}
          >
            <Ionicons name="send" size={20} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 40,
    paddingBottom: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 12,
  },
  tailorAvatar: {
    fontSize: 32,
  },
  headerTitle: {
    fontWeight: '700',
    fontSize: 16,
  },
  keyboardAvoid: {
    flex: 1,
  },
  messagesContainer: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    paddingBottom: 20,
  },
  messageWrapper: {
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  customerMessageWrapper: {
    justifyContent: 'flex-end',
  },
  tailorMessageWrapper: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 11,
    marginHorizontal: 8,
    marginTop: 4,
  },
  inputContainer: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  mediaButtonsRow: {
    flexDirection: 'column',
    gap: 8,
  },
  mediaButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 14,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
  },
  videoPlaceholder: {
    width: 200,
    height: 120,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
