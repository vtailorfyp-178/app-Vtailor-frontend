import React, { useState } from 'react';
import { View, ScrollView, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Image, Alert, Linking, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import * as ImagePicker from 'expo-image-picker';
import { ResizeMode, Video } from 'expo-av';

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
  const textColor = useThemeColor({}, 'text');

  const thread = SAMPLE_THREADS[customerId];
  const [messages, setMessages] = useState<Message[]>(thread?.messages ?? []);
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
    const url = `tel:${thread.phone.replace(/\s+/g, '')}`;
    Linking.openURL(url).catch(() => Alert.alert('Call Failed', 'Unable to initiate call on this device.'));
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
      quality: 0.8,
    });
    if (!result.canceled) {
      const newMsg: Message = {
        id: String(Date.now()),
        sender: 'tailor',
        media: { type: 'image', uri: result.assets[0].uri },
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, newMsg]);
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
      const newMsg: Message = {
        id: String(Date.now()),
        sender: 'tailor',
        media: { type: 'video', uri: result.assets[0].uri },
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, newMsg]);
    }
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
                      <Pressable onPress={() => openImageViewer(msg.media!.uri)}>
                        <Image source={{ uri: msg.media.uri }} style={styles.mediaImage} />
                      </Pressable>
                    ) : (
                      <Pressable onPress={() => openVideo(msg.media!.uri)}>
                        <View style={styles.videoPlaceholder}>
                          <Ionicons name="play-circle" size={30} color={msg.sender === 'tailor' ? '#fff' : '#111827'} />
                          <ThemedText style={{ color: msg.sender === 'tailor' ? '#fff' : '#111827', marginTop: 8, fontSize: 12, textAlign: 'center' }}>
                            {getMediaLabel(msg.media.uri)}
                          </ThemedText>
                        </View>
                      </Pressable>
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
              style={[styles.textInput, { color: textColor }]}
            />
            <Pressable onPress={handleSendMessage} style={[styles.sendButton, { backgroundColor: tint }]}>
              <Ionicons name="send" size={18} color="#fff" />
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
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 54, paddingBottom: 14 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  headerButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontWeight: '700', color: '#111827' },
  messages: { paddingHorizontal: 16, paddingTop: 22, paddingBottom: 16 },
  messageWrapper: { marginBottom: 12 },
  tailorWrapper: { alignItems: 'flex-end' },
  customerWrapper: { alignItems: 'flex-start' },
  bubble: { padding: 12, borderRadius: 12, maxWidth: '78%' },
  mediaImage: { width: 180, height: 180, borderRadius: 12 },
  videoPlaceholder: { width: 180, minHeight: 120, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  viewerBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  viewerImage: { width: '100%', height: '85%' },
  viewerVideo: { width: '100%', height: '60%' },
  viewerClose: { position: 'absolute', top: 44, right: 18, zIndex: 10, padding: 6 },
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
