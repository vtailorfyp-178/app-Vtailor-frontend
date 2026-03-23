import React, { useState } from 'react';
import { View, ScrollView, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, Image, Alert, Linking, Modal } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ResizeMode, Video } from 'expo-av';

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
  const [showAttach, setShowAttach] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [videoViewerVisible, setVideoViewerVisible] = useState(false);
  const [selectedVideoUri, setSelectedVideoUri] = useState<string | null>(null);

  const getMediaLabel = (uri: string) => uri.split('/').pop() || 'Selected media';

  const openImageViewer = (uri: string) => {
    setSelectedImageUri(uri);
    setImageViewerVisible(true);
  };

  const openVideo = (uri: string) => {
    setSelectedVideoUri(uri);
    setVideoViewerVisible(true);
  };

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

  const handlePickImage = async () => {
    setShowAttach(false);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Gallery access is needed to select images.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as any,
      allowsEditing: false,
      quality: 0.8,
    });
    if (!result.canceled) {
      const newMessage: Message = {
        id: String(messages.length + 1),
        sender: 'customer',
        media: {
          type: 'image',
          uri: result.assets[0].uri,
        },
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, newMessage]);

      // Simulate tailor response
      setTimeout(() => {
        const tailorResponse: Message = {
          id: String(Date.now()),
          sender: 'tailor',
          text: 'Nice design! I can definitely make this for you.',
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages(prev => [...prev, tailorResponse]);
      }, 2000);
    }
  };

  const handlePickVideo = async () => {
    setShowAttach(false);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Gallery access is needed to select videos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'] as any,
      quality: 1,
    });
    if (!result.canceled) {
      const newMessage: Message = {
        id: String(messages.length + 1),
        sender: 'customer',
        media: {
          type: 'video',
          uri: result.assets[0].uri,
        },
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, newMessage]);
    }
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

  const handleCall = () => {
    const phone = '+92 300 1234567';
    const url = `tel:${phone}`;
    Linking.openURL(url).catch(() => Alert.alert('Call Failed', 'Unable to initiate call on this device.'));
  };

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
        <Pressable onPress={handleCall} style={styles.callButton} hitSlop={8}>
          <Ionicons name="call" size={22} color="#fff" />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
        keyboardVerticalOffset={Platform.select({ ios: 0, android: 0, default: 0 })}
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
                      <Pressable onPress={() => openImageViewer(msg.media!.uri)}>
                        <Image
                          source={{ uri: msg.media.uri }}
                          style={styles.mediaImage}
                        />
                      </Pressable>
                    ) : (
                      <Pressable onPress={() => openVideo(msg.media!.uri)}>
                        <View style={styles.videoPlaceholder}>
                          <ThemedText style={{ fontSize: 32, marginBottom: 8 }}>🎥</ThemedText>
                          <ThemedText style={{ fontSize: 12, textAlign: 'center', color: msg.sender === 'customer' ? '#fff' : '#000' }}>
                            {getMediaLabel(msg.media.uri)}
                          </ThemedText>
                        </View>
                      </Pressable>
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
              onPress={() => setShowAttach((v) => !v)}
              style={[styles.mediaButton, { borderColor: tint }]}
            >
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

      <Modal visible={imageViewerVisible} transparent animationType="fade" onRequestClose={() => setImageViewerVisible(false)}>
        <View style={styles.viewerBackdrop}>
          <Pressable style={styles.viewerClose} onPress={() => setImageViewerVisible(false)}>
            <Ionicons name="close" size={28} color="#fff" />
          </Pressable>
          {selectedImageUri ? <Image source={{ uri: selectedImageUri }} style={styles.viewerImage} resizeMode="contain" /> : null}
        </View>
      </Modal>

      <Modal visible={videoViewerVisible} transparent animationType="fade" onRequestClose={() => setVideoViewerVisible(false)}>
        <View style={styles.viewerBackdrop}>
          <Pressable style={styles.viewerClose} onPress={() => setVideoViewerVisible(false)}>
            <Ionicons name="close" size={28} color="#fff" />
          </Pressable>
          {selectedVideoUri ? (
            <Video
              source={{ uri: selectedVideoUri }}
              style={styles.viewerVideo}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay
            />
          ) : null}
        </View>
      </Modal>
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
  mediaButtonsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, position: 'relative' },
  mediaButton: { width: 40, height: 40, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' },
  attachMenu: { position: 'absolute', bottom: 50, left: 0, flexDirection: 'column-reverse', alignItems: 'flex-start', gap: 8 },
  attachItem: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  attachLabel: { fontSize: 12 },
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
  viewerBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  viewerImage: { width: '100%', height: '85%' },
  viewerVideo: { width: '100%', height: '60%' },
  viewerClose: { position: 'absolute', top: 44, right: 18, zIndex: 10, padding: 6 },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
