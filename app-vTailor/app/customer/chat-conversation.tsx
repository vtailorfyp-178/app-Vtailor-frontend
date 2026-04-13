import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';
import {
  Conversations,
  Messages,
  Media,
  Calls,
  ConversationSocket,
  setAuthToken,
  formatMessageTime,
  type ChatMessage,
  type CallType,
} from '@/services/conversationApi';

function buildDemoMessages(currentUserId: string): ChatMessage[] {
  const now = Date.now();
  return [
    {
      message_id: 'demo-1',
      conversation_id: 'demo-conversation',
      sender_id: 'tailor-demo',
      sender_role: 'tailor',
      content: 'Assalam o Alaikum! Please share your preferred design details.',
      message_type: 'text',
      status: 'read',
      media_url: null,
      media_mime: null,
      media_size: null,
      media_duration: null,
      thumbnail_url: null,
      reply_to_id: null,
      reply_to_preview: null,
      is_deleted: false,
      created_at: new Date(now - 1000 * 60 * 20).toISOString(),
      updated_at: new Date(now - 1000 * 60 * 20).toISOString(),
    },
    {
      message_id: 'demo-2',
      conversation_id: 'demo-conversation',
      sender_id: currentUserId,
      sender_role: 'customer',
      content: 'Wa Alaikum Salam, I need a formal long frock with A-line style.',
      message_type: 'text',
      status: 'read',
      media_url: null,
      media_mime: null,
      media_size: null,
      media_duration: null,
      thumbnail_url: null,
      reply_to_id: null,
      reply_to_preview: null,
      is_deleted: false,
      created_at: new Date(now - 1000 * 60 * 18).toISOString(),
      updated_at: new Date(now - 1000 * 60 * 18).toISOString(),
    },
  ];
}

export default function ChatConversation() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const conversationId = (params.conversation_id as string) || (params.id as string);
  const tailorId = params.tailorId ? String(params.tailorId) : null;
  const tailorNameFromParams =
    (params.tailorName as string) ||
    (params.otherUserName as string) ||
    '';
  const otherUserIdFromParams = (params.otherUserId as string) || tailorId;
  const [otherUserName, setOtherUserName] = useState(tailorNameFromParams || 'Tailor');
  const otherUserAvatar = (params.otherUserAvatar as string) || '👥';
  const demoModeParam = (params.demo as string) === '1';

  const { userId, userRole, token } = useAuth();
  const tint = useThemeColor({}, 'tint');
  const card = useThemeColor({}, 'card');
  const text = useThemeColor({}, 'text');
  const muted = useThemeColor({}, 'muted');

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showMediaOptions, setShowMediaOptions] = useState(false);
  const [demoMode, setDemoMode] = useState(demoModeParam);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    demoModeParam ? 'demo-conversation' : conversationId || null
  );
  const flatListRef = useRef<FlatList>(null);
  const socketRef = useRef<ConversationSocket | null>(null);

  // Initialize WebSocket and load messages
  useEffect(() => {
    if (!userId) {
      router.back();
      return;
    }

    if (token) setAuthToken(token);

    const initializeSocket = async () => {
      try {
        setLoading(true);

        if (demoModeParam) {
          setMessages(buildDemoMessages(userId));
          setLoading(false);
          setDemoMode(true);
          return;
        }

        let resolvedConversationId = conversationId;
        if (!activeConversationId && tailorId && userRole === 'customer') {
          const created = await Conversations.getOrCreate(tailorId, userId);
          resolvedConversationId = created.conversation_id;
          setOtherUserName(created.tailor_name || tailorNameFromParams || 'Tailor');
        }

        if (!resolvedConversationId) {
          Alert.alert('Missing conversation', 'This conversation could not be opened.');
          router.back();
          return;
        }

        setActiveConversationId(resolvedConversationId);
        setDemoMode(false);

        // Load initial messages
        const loaded = await Messages.list(resolvedConversationId, userId, undefined, 40);
        setMessages(loaded);

        // Connect WebSocket
        socketRef.current = new ConversationSocket(userId);
        socketRef.current.onEvent('new_message', (event: any) => {
          const data = event?.data;
          if (data?.conversation_id === resolvedConversationId) {
            setMessages((prev) =>
              prev.some((m) => m.message_id === data?.message_id) ? prev : [...prev, data]
            );
          }
        });

        socketRef.current.onEvent('message_status', (event: any) => {
          const data = event?.data;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.message_id === data?.message_id ? { ...msg, status: data.status } : msg
            )
          );
        });

        socketRef.current.connect();
        setLoading(false);
      } catch (error) {
        console.error('Failed to initialize chat:', error);
        setMessages(buildDemoMessages(userId));
        setDemoMode(true);
        setActiveConversationId('demo-conversation');
        setLoading(false);
        Alert.alert('Chat Fallback', 'Backend chat was unavailable, demo conversation loaded for prototype.');
      }
    };

    initializeSocket();

    return () => {
      socketRef.current?.disconnect();
    };
  }, [userId, conversationId, tailorId, userRole, token]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || !userId || sending || !activeConversationId) return;

    setSending(true);
    let optimisticId: string | null = null;
    try {
      if (demoMode) {
        const msg: ChatMessage = {
          message_id: `demo-${Date.now()}`,
          conversation_id: activeConversationId,
          sender_id: userId,
          sender_role: userRole === 'tailor' ? 'tailor' : 'customer',
          content: inputText.trim(),
          message_type: 'text',
          status: 'read',
          media_url: null,
          media_mime: null,
          media_size: null,
          media_duration: null,
          thumbnail_url: null,
          reply_to_id: null,
          reply_to_preview: null,
          is_deleted: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, msg]);
        setInputText('');
        setShowMediaOptions(false);
        return;
      }

      optimisticId = `local-${Date.now()}`;
      const optimisticMsg: ChatMessage = {
        message_id: optimisticId,
        conversation_id: activeConversationId,
        sender_id: userId,
        sender_role: userRole === 'tailor' ? 'tailor' : 'customer',
        content: inputText.trim(),
        message_type: 'text',
        status: 'sent',
        media_url: null,
        media_mime: null,
        media_size: null,
        media_duration: null,
        thumbnail_url: null,
        reply_to_id: null,
        reply_to_preview: null,
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimisticMsg]);
      const textToSend = inputText.trim();
      setInputText('');
      setShowMediaOptions(false);

      const sentMessage = await Messages.sendText({
        conversation_id: activeConversationId,
        sender_id: userId,
        content: textToSend,
      });
      setMessages((prev) => prev.map((m) => (m.message_id === optimisticId ? sentMessage : m)));
    } catch (error) {
      console.error('Failed to send message:', error);
      if (optimisticId) {
        setMessages((prev) => prev.filter((m) => m.message_id !== optimisticId));
      }
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const sendPickedMedia = async (kind: 'image' | 'video') => {
    setShowMediaOptions(false);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Please grant gallery access');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes:
        kind === 'image'
          ? ImagePicker.MediaTypeOptions.Images
          : ImagePicker.MediaTypeOptions.Videos,
      quality: 0.7,
    });

    if (!result.canceled && userId && activeConversationId) {
      setSending(true);
      let tempId: string | null = null;
      try {
        const asset = result.assets[0];
        const mime = asset.mimeType || (kind === 'image' ? 'image/jpeg' : 'video/mp4');
        tempId = `local-${Date.now()}`;

        const optimisticMedia: ChatMessage = {
          message_id: tempId,
          conversation_id: activeConversationId,
          sender_id: userId,
          sender_role: userRole === 'tailor' ? 'tailor' : 'customer',
          content: kind === 'image' ? 'Image sent' : 'Video sent',
          message_type: kind,
          status: 'sent',
          media_url: asset.uri,
          media_mime: mime,
          media_size: asset.fileSize || 0,
          media_duration: null,
          thumbnail_url: null,
          reply_to_id: null,
          reply_to_preview: null,
          is_deleted: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, optimisticMedia]);

        if (demoMode) {
          setMessages((prev) =>
            prev.map((m) => (m.message_id === tempId ? { ...m, status: 'read' } : m))
          );
          return;
        }

        const uploaded = await Media.upload({
          conversation_id: activeConversationId,
          sender_id: userId,
          fileUri: asset.uri,
          filename: asset.fileName || (kind === 'image' ? 'image.jpg' : 'video.mp4'),
          content_type: mime,
          file_size: asset.fileSize || 0,
        });

        const sentMedia = await Messages.sendMedia({
          conversation_id: activeConversationId,
          sender_id: userId,
          message_type: kind,
          media_url: uploaded.media_url,
          media_key: uploaded.media_key,
          media_mime: mime,
          media_size: asset.fileSize || 0,
        });

        setMessages((prev) => prev.map((m) => (m.message_id === tempId ? sentMedia : m)));
      } catch (error) {
        console.error(`Failed to send ${kind}:`, error);
        Alert.alert('Error', `Failed to send ${kind}`);
        if (tempId) {
          setMessages((prev) => prev.filter((m) => m.message_id !== tempId));
        }
      } finally {
        setSending(false);
      }
    }
  };

  const handleSendImage = () => sendPickedMedia('image');
  const handleSendVideo = () => sendPickedMedia('video');

  const handleStartCall = async (callType: CallType) => {
    if (!userId) return;

    try {
      if (demoMode || !activeConversationId || !otherUserIdFromParams) {
        const demoCallMessage: ChatMessage = {
          message_id: `demo-call-${Date.now()}`,
          conversation_id: activeConversationId || 'demo-conversation',
          sender_id: userId,
          sender_role: userRole === 'tailor' ? 'tailor' : 'customer',
          content: `📞 ${callType === 'video' ? 'Video' : 'Voice'} call initiated`,
          message_type: 'call_log',
          status: 'read',
          media_url: null,
          media_mime: null,
          media_size: null,
          media_duration: null,
          thumbnail_url: null,
          reply_to_id: null,
          reply_to_preview: null,
          is_deleted: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, demoCallMessage]);
        return;
      }

      await Calls.initiate(activeConversationId, userId, otherUserIdFromParams, callType);
      Alert.alert('Call', `${callType === 'video' ? 'Video' : 'Voice'} call initiated.`);
    } catch (error) {
      console.error('Failed to initiate call:', error);
      Alert.alert('Call Error', 'Failed to initiate call');
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isOwn = item.sender_id === userId;
    const senderLabel = isOwn ? 'You' : otherUserName;
    const timestamp = formatMessageTime(item.created_at);

    return (
      <View
        style={[
          styles.messageRow,
          isOwn ? styles.ownMessageRow : styles.otherMessageRow,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isOwn
              ? { backgroundColor: tint }
              : { backgroundColor: card, borderWidth: 1, borderColor: muted },
          ]}
        >
          <ThemedText
            style={[
              styles.senderLabel,
              isOwn ? { color: '#e5e7eb' } : { color: muted },
            ]}
          >
            {senderLabel}
          </ThemedText>
          {item.message_type === 'text' && (
            <ThemedText
              style={[
                styles.messageText,
                isOwn ? { color: '#fff' } : { color: text },
              ]}
            >
              {item.content}
            </ThemedText>
          )}
          {item.message_type === 'image' && (
            <View style={styles.mediaWrap}>
              {item.media_url ? (
                <Image source={{ uri: item.media_url }} style={styles.mediaPreview} resizeMode="cover" />
              ) : (
                <ThemedText style={{ fontSize: 14, color: isOwn ? '#fff' : text }}>
                  📷 Image
                </ThemedText>
              )}
              {item.content ? (
                <ThemedText style={[styles.mediaCaption, { color: isOwn ? '#fff' : text }]}>{item.content}</ThemedText>
              ) : null}
            </View>
          )}
          {item.message_type === 'video' && (
            <View style={styles.mediaWrap}>
              {item.media_url ? (
                <Video
                  source={{ uri: item.media_url }}
                  style={styles.mediaPreview}
                  useNativeControls
                  resizeMode={ResizeMode.COVER}
                  isLooping={false}
                />
              ) : (
                <ThemedText style={{ fontSize: 14, color: isOwn ? '#fff' : text }}>
                  🎥 Video
                </ThemedText>
              )}
              {item.content ? (
                <ThemedText style={[styles.mediaCaption, { color: isOwn ? '#fff' : text }]}>{item.content}</ThemedText>
              ) : null}
            </View>
          )}
          {item.message_type === 'audio' && (
            <ThemedText style={{ fontSize: 14, color: isOwn ? '#fff' : text }}>
              🎙️ Audio
            </ThemedText>
          )}
          {item.message_type === 'call_log' && (
            <ThemedText style={{ fontSize: 14, color: isOwn ? '#fff' : text }}>
              {item.content || '📞 Call event'}
            </ThemedText>
          )}
        </View>
        <ThemedText style={[styles.timestamp, { color: muted }]}>
          {timestamp} {isOwn && item.status === 'read' && '✓✓'}
          {isOwn && item.status === 'delivered' && '✓'}
        </ThemedText>
      </View>
    );
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color={tint} style={{ marginTop: 50 }} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: tint }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </Pressable>
        <View style={styles.headerTitle}>
          <ThemedText style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
            {otherUserName}
          </ThemedText>
          <ThemedText style={{ color: '#e5e7eb', fontSize: 12 }}>
            {otherUserAvatar}
          </ThemedText>
        </View>
        <View style={styles.headerActions}>
          <Pressable onPress={() => handleStartCall('voice')} style={styles.headerActionBtn}>
            <Ionicons name="call-outline" size={20} color="#fff" />
          </Pressable>
          <Pressable onPress={() => handleStartCall('video')} style={styles.headerActionBtn}>
            <Ionicons name="videocam-outline" size={20} color="#fff" />
          </Pressable>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.message_id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
        />

        {/* Input Area */}
        <View style={[styles.inputArea, { backgroundColor: card, borderTopColor: muted }]}>
          <Pressable onPress={() => setShowMediaOptions((prev) => !prev)} disabled={sending}>
            <Ionicons
              name={showMediaOptions ? 'close' : 'add'}
              size={24}
              color={sending ? muted : tint}
              style={styles.inputIcon}
            />
          </Pressable>
          {showMediaOptions ? (
            <View style={[styles.mediaOptionsMenu, { backgroundColor: card, borderColor: muted }]}>
              <Pressable style={styles.mediaOptionBtn} onPress={handleSendImage} disabled={sending}>
                <Ionicons name="image" size={18} color={tint} />
                <ThemedText style={styles.mediaOptionText}>Image</ThemedText>
              </Pressable>
              <Pressable style={styles.mediaOptionBtn} onPress={handleSendVideo} disabled={sending}>
                <Ionicons name="videocam" size={18} color={tint} />
                <ThemedText style={styles.mediaOptionText}>Video</ThemedText>
              </Pressable>
            </View>
          ) : null}
          <TextInput
            style={[
              styles.input,
              { color: text, borderColor: muted },
            ]}
            placeholder="Message..."
            placeholderTextColor={muted}
            value={inputText}
            onChangeText={setInputText}
            editable={!sending}
            multiline
          />
          <Pressable
            onPress={handleSendMessage}
            disabled={!inputText.trim() || sending}
            style={styles.sendButton}
          >
            {sending ? (
              <ActivityIndicator size="small" color={tint} />
            ) : (
              <Ionicons
                name="send"
                size={20}
                color={inputText.trim() ? tint : muted}
              />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 40,
    paddingBottom: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    width: 72,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 6,
  },
  headerActionBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesList: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  messageRow: {
    marginBottom: 12,
    flexDirection: 'row',
  },
  ownMessageRow: {
    justifyContent: 'flex-end',
  },
  otherMessageRow: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  senderLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  mediaWrap: {
    minWidth: 180,
  },
  mediaPreview: {
    width: 180,
    height: 140,
    borderRadius: 10,
    backgroundColor: '#e5e7eb',
  },
  mediaCaption: {
    marginTop: 6,
    fontSize: 13,
  },
  timestamp: {
    fontSize: 11,
    marginHorizontal: 8,
    marginTop: 4,
  },
  inputArea: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  inputIcon: {
    marginBottom: 6,
  },
  mediaOptionsMenu: {
    position: 'absolute',
    left: 12,
    bottom: 62,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 6,
    minWidth: 130,
    zIndex: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  mediaOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  mediaOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
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
    marginBottom: 4,
  },
});
