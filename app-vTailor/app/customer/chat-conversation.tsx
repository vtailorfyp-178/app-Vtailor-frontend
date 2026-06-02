import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AppBackButton from '@/components/AppBackButton';
import { useKeyboardInset } from '@/hooks/useKeyboardInset';
import {
  getStreamClient,
  getOrCreateChannel,
  fetchOrCreateStreamChannel,
} from '@/services/streamChatService';
import { setCurrentOpenChannel } from '@/services/notificationService';
import type { Channel, MessageResponse, Event } from 'stream-chat';

// â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type ChatMessage = {
  id: string;
  text: string;
  userId: string;
  userName: string;
  createdAt: Date;
  status?: string;
  imageUrl?: string;
  videoUrl?: string;
};

// â”€â”€ Demo seed messages  (only used when the route explicitly requests demo) â”€â”€

function buildDemoMessages(
  myUserId: string,
  myRole: string | null,
  otherName: string,
  channelId: string
): ChatMessage[] {
  const now = Date.now();
  const isCustomer = myRole !== 'tailor';
  const otherId = `demo-other-${channelId}`;

  const tailorLines = [
    `Assalam o Alaikum! I'm ${otherName}. How can I help you today?`,
    'We specialise in formal and bridal wear with fine hand embroidery.',
    'Your measurements are noted. I will prepare a sample within 5 days.',
  ];
  const customerLines = [
    'Wa Alaikum Salam! I need a formal long frock for a wedding.',
    'I prefer pastel shades â€” blush pink or powder blue.',
    'Great! Please keep the fitting elegant and comfortable.',
  ];

  const lines = isCustomer
    ? [
        { sender: otherId, text: tailorLines[0], offset: 25 },
        { sender: myUserId, text: customerLines[0], offset: 22 },
        { sender: otherId, text: tailorLines[1], offset: 18 },
        { sender: myUserId, text: customerLines[1], offset: 14 },
        { sender: otherId, text: tailorLines[2], offset: 10 },
        { sender: myUserId, text: customerLines[2], offset: 5 },
      ]
    : [
        { sender: myUserId, text: tailorLines[0], offset: 25 },
        { sender: otherId, text: customerLines[0], offset: 22 },
        { sender: myUserId, text: tailorLines[1], offset: 18 },
        { sender: otherId, text: customerLines[1], offset: 14 },
        { sender: myUserId, text: tailorLines[2], offset: 10 },
        { sender: otherId, text: customerLines[2], offset: 5 },
      ];

  return lines.map((l, i) => ({
    id: `demo-seed-${channelId}-${i}`,
    text: l.text,
    userId: l.sender,
    userName: l.sender === myUserId ? 'You' : otherName,
    createdAt: new Date(now - 1000 * 60 * l.offset),
    status: l.sender === myUserId ? 'read' : undefined,
  }));
}

// â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function mapStreamMessage(msg: MessageResponse, myUserId: string): ChatMessage {
  const readBy = (msg as MessageResponse & { readBy?: Record<string, unknown> }).readBy;
  const readByOthers = readBy
    ? Object.keys(readBy).some((uid) => uid !== myUserId)
    : false;

  const imageAttachment = msg.attachments?.find((a) => a.type === 'image');
  const videoAttachment = msg.attachments?.find((a) => a.type === 'video');
  const videoAssetUrl = videoAttachment?.asset_url
    ?? (videoAttachment as { file?: string } | undefined)?.file;

  return {
    id: msg.id,
    text: msg.text ?? '',
    userId: msg.user?.id ?? '',
    userName: (msg.user?.name as string) ?? 'User',
    createdAt: new Date(msg.created_at ?? Date.now()),
    status: msg.user?.id === myUserId
      ? (readByOthers ? 'read' : (msg.status ?? 'sent'))
      : undefined,
    imageUrl: (imageAttachment?.image_url ?? imageAttachment?.asset_url) as string | undefined,
    videoUrl: videoAssetUrl as string | undefined,
  };
}

function formatMessageTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function initials(name: string): string {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() || '')
      .join('') || 'T'
  );
}

// â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function ChatConversation() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { bottomInset } = useKeyboardInset({ extraOffset: 12 });

  const streamChannelId = params.stream_channel_id as string | undefined;
  const demoChannelId = params.demo_channel_id as string | undefined;
  // Only treat as demo if the route explicitly says so (demo=1 or demo_channel_id)
  // Real-user chats NEVER pass demo=1 â€” they will try Stream and show an error if unavailable
  const isExplicitDemo = params.demo === '1' || !!demoChannelId;
  const tailorId = params.tailorId ? String(params.tailorId) : undefined;
  const otherUserPhone = ((params.otherUserPhone as string) || (params.phone as string) || '').trim();
  const otherUserEmail = ((params.otherUserEmail as string) || '').trim();
  const [otherUserName, setOtherUserName] = useState(
    (params.otherUserName as string) || (params.tailorName as string) || 'Tailor'
  );

  // If Stream stored an email as the user's name, extract the human-readable part
  const cleanName = (raw: string) => {
    if (raw.includes('@')) {
      const local = raw.split('@')[0];
      // Convert dots/underscores/hyphens to spaces, then title-case
      return local.replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).trim();
    }
    return raw;
  };
  const otherUserFirstName = cleanName(otherUserName).split(' ')[0] || cleanName(otherUserName);

  const { userId, userRole, token } = useAuth();
  const tint = useThemeColor({}, 'tint');
  const card = useThemeColor({}, 'card');
  const text = useThemeColor({}, 'text');
  const muted = useThemeColor({}, 'muted');



  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [imageViewerUri, setImageViewerUri] = useState<string | null>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  // demoMode = true ONLY for explicit demo sessions
  const [demoMode, setDemoMode] = useState(isExplicitDemo);
  // streamError = message shown when Stream is not configured for a real chat
  const [streamError, setStreamError] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const channelRef = useRef<Channel | null>(null);
  const listenersRef = useRef<Array<() => void>>([]);
  const activeChannelId = streamChannelId || (isExplicitDemo ? demoChannelId : null);

  // â”€â”€ Track which channel is open (for notification suppression) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  useEffect(() => {
    if (activeChannelId) setCurrentOpenChannel(activeChannelId);
    return () => setCurrentOpenChannel(null);
  }, [activeChannelId]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const showSub = Keyboard.addListener(showEvent, () => {
      setShowAttachMenu(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 150);
    });
    return () => {
      showSub.remove();
    };
  }, []);

  // â”€â”€ Initialise â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  useEffect(() => {
    if (!userId) return;

    const init = async () => {
      setLoading(true);
      setStreamError(null);
      try {
        // â”€â”€ Explicit demo path (demo=1 or demo_channel_id) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        if (isExplicitDemo) {
          const channelKey = demoChannelId || 'demo-channel';
          setDemoMode(true);
          setMessages(buildDemoMessages(userId, userRole, otherUserName, channelKey));
          setLoading(false);
          return;
        }

        // â”€â”€ Real Stream path â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        let channel: Channel | null = null;

        if (streamChannelId) {
          const client = getStreamClient();
          if (client) {
            channel = client.channel('messaging', streamChannelId);
            await channel.watch();
          } else {
            setStreamError(
              'Stream Chat is not connected. Please add your STREAM_API_KEY and STREAM_API_SECRET to the backend .env file, then restart the backend and app.'
            );
            setLoading(false);
            return;
          }
        } else if (tailorId && token) {
          channel = await getOrCreateChannel(token, tailorId, userId);
          if (!channel) {
            setStreamError(
              'Could not create Stream channel. Make sure STREAM_API_KEY and STREAM_API_SECRET are set in the backend .env file.'
            );
            setLoading(false);
            return;
          }
          const members = Object.values(channel.state.members);
          const other = members.find((m: any) => m.user?.id !== userId);
          if (other && (other as any).user?.name) {
            setOtherUserName((other as any).user.name);
          }
        } else {
          setStreamError('No channel identifier provided. Please navigate here from a conversation or tailor profile.');
          setLoading(false);
          return;
        }

        if (!channel) {
          setStreamError('Stream Chat not configured on the server. Add STREAM_API_KEY / STREAM_API_SECRET to the backend .env to enable real chat.');
          setLoading(false);
          return;
        }

        channelRef.current = channel;
        setDemoMode(false);

        // Load all existing messages
        const existing = channel.state.messages.map((m) =>
          mapStreamMessage(m as unknown as MessageResponse, userId)
        );
        setMessages(existing);

        // Real-time: new message arrives
        const unsubNew = channel.on('message.new', (event: Event) => {
          if (event.message) {
            // Skip own messages — handled by optimistic update in handleSendMessage
            if (event.message.user?.id === userId) return;
            const newMsg = mapStreamMessage(event.message as MessageResponse, userId);
            setMessages((prev) => {
              // avoid duplicates
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
            // scroll to bottom
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
            // mark as read immediately
            channel!.markRead().catch(() => {});
          }
        }).unsubscribe;

        // Real-time: message edited/deleted
        const unsubUpdate = channel.on('message.updated', (event: Event) => {
          if (event.message) {
            const updated = mapStreamMessage(event.message as MessageResponse, userId);
            setMessages((prev) =>
              prev.map((m) => (m.id === updated.id ? updated : m))
            );
          }
        }).unsubscribe;

        // Real-time: other user reads → update tick
        const unsubRead = channel.on('message.read', () => {
          setMessages((prev) =>
            prev.map((m) =>
              m.userId === userId && m.status === 'sent'
                ? { ...m, status: 'read' }
                : m
            )
          );
        }).unsubscribe;

        listenersRef.current = [unsubNew, unsubUpdate, unsubRead];
        await channel.markRead().catch(() => {});
        // scroll to last message after load
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 150);
      } catch (err) {
        console.error('[ChatConversation] init error:', err);
        setStreamError(
          `Could not connect to Stream Chat: ${err instanceof Error ? err.message : String(err)}`
        );
      } finally {
        setLoading(false);
      }
    };

    init();

    return () => {
      listenersRef.current.forEach((unsub) => unsub());
      listenersRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, streamChannelId, tailorId, token, isExplicitDemo, demoChannelId]);

  // â”€â”€ Send text â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const handleSendMessage = async () => {
    if (!inputText.trim() || !userId || sending) return;
    if (!demoMode && !channelRef.current) return;

    setSending(true);
    const textToSend = inputText.trim();
    setInputText('');

    if (demoMode) {
      const msg: ChatMessage = {
        id: `demo-local-${Date.now()}`,
        text: textToSend,
        userId,
        userName: 'You',
        createdAt: new Date(),
        status: 'sent',
      };
      setMessages((prev) => [...prev, msg]);

      setTimeout(() => {
        const replies = [
          "Sure! I'll note that down.",
          'Absolutely, that can be arranged.',
          'Great choice! It will look wonderful.',
          'Understood. I will prepare the sample accordingly.',
          'Let me check with our stitching team and get back to you.',
        ];
        const reply: ChatMessage = {
          id: `demo-reply-${Date.now()}`,
          text: replies[Math.floor(Math.random() * replies.length)],
          userId: `demo-other`,
          userName: otherUserName,
          createdAt: new Date(),
        };
        setMessages((prev) => [...prev, reply]);
      }, 1000 + Math.random() * 1000);

      setSending(false);
      return;
    }

    // Real Stream send
    const tempId = `local-${Date.now()}`;
    const optimistic: ChatMessage = {
      id: tempId,
      text: textToSend,
      userId,
      userName: 'You',
      createdAt: new Date(),
      status: 'sending',
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const sent = await channelRef.current!.sendMessage({ text: textToSend });
      const confirmed = mapStreamMessage(sent.message as MessageResponse, userId);
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? confirmed : m))
      );
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
    } catch (err) {
      console.error('[ChatConversation] sendMessage error:', err);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // â”€â”€ Send image â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const handleSendImage = async () => {
    setShowAttachMenu(false);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Please grant gallery access');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as any,
      quality: 0.7,
    });

    if (!result.canceled && userId) {
      setSending(true);
      const asset = result.assets[0];
      const tempId = `local-img-${Date.now()}`;

      const optimistic: ChatMessage = {
        id: tempId,
        text: '',
        userId,
        userName: 'You',
        createdAt: new Date(),
        status: 'sending',
        imageUrl: asset.uri,
      };
      setMessages((prev) => [...prev, optimistic]);

      if (demoMode) {
        setTimeout(() => {
          setMessages((prev) =>
            prev.map((m) => (m.id === tempId ? { ...m, status: 'read' } : m))
          );
        }, 800);
        setSending(false);
        return;
      }

      try {
        const uploadResponse = await channelRef.current!.sendImage(asset.uri);
        const sent = await channelRef.current!.sendMessage({
          text: '',
          attachments: [
            {
              type: 'image',
              image_url: uploadResponse.file,
              asset_url: uploadResponse.file,
            },
          ],
        });
        const confirmed = mapStreamMessage(sent.message as MessageResponse, userId);
        confirmed.imageUrl = uploadResponse.file;
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? confirmed : m))
        );
      } catch (err) {
        console.error('[ChatConversation] image send error:', err);
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        Alert.alert('Error', 'Failed to send image');
      } finally {
        setSending(false);
      }
    }
  };

  const handleSendVideo = async () => {
    setShowAttachMenu(false);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Please grant gallery access');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'] as any,
      videoMaxDuration: 120,
    });

    if (!result.canceled && userId) {
      setSending(true);
      const asset = result.assets[0];
      const tempId = `local-vid-${Date.now()}`;

      const optimistic: ChatMessage = {
        id: tempId,
        text: '',
        userId,
        userName: 'You',
        createdAt: new Date(),
        status: 'sending',
        videoUrl: asset.uri,
      };
      setMessages((prev) => [...prev, optimistic]);

      if (demoMode) {
        setTimeout(() => {
          setMessages((prev) =>
            prev.map((m) => (m.id === tempId ? { ...m, status: 'read' } : m))
          );
        }, 800);
        setSending(false);
        return;
      }

      try {
        const ext = asset.uri.split('.').pop()?.toLowerCase() || 'mp4';
        const mimeType = ext === 'mov' ? 'video/quicktime' : 'video/mp4';
        const filename = asset.uri.split('/').pop() || `video_${Date.now()}.${ext}`;
        const uploadResponse = await (channelRef.current! as any).sendFile(
          asset.uri,
          filename,
          mimeType
        );
        const sent = await channelRef.current!.sendMessage({
          text: '',
          attachments: [
            {
              type: 'video',
              asset_url: uploadResponse.file,
              title: filename,
              mime_type: mimeType,
            },
          ],
        });
        const confirmed = mapStreamMessage(sent.message as MessageResponse, userId);
        confirmed.videoUrl = uploadResponse.file;
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? confirmed : m))
        );
      } catch (err) {
        console.error('[ChatConversation] video send error:', err);
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        Alert.alert('Error', 'Failed to send video. Try a shorter clip (under 2 minutes).');
      } finally {
        setSending(false);
      }
    }
  };

  // â”€â”€ Call â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const handleStartCall = () => {
    if (!otherUserPhone) {
      Alert.alert('Phone number unavailable', 'This user has not shared a phone number yet.');
      return;
    }
    const dialNumber = otherUserPhone.replace(/\s+/g, '');
    Linking.openURL(`tel:${dialNumber}`).catch(() => {
      Alert.alert('Call Failed', `Unable to open dialer for ${otherUserPhone}.`);
    });
  };

  // â”€â”€ Render message â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isOwn = item.userId === userId;
    const timestamp = formatMessageTime(item.createdAt);

    return (
      <View
        style={[
          styles.messageRow,
          isOwn ? styles.ownMessageRow : styles.otherMessageRow,
        ]}
      >
        {!isOwn && (
          <View style={[styles.messageAvatar, { backgroundColor: `${tint}22` }]}>
            <ThemedText style={[styles.messageAvatarText, { color: tint }]}>
              {initials(item.userName)}
            </ThemedText>
          </View>
        )}
        <View
          style={[
            styles.messageBubble,
            isOwn
              ? { backgroundColor: tint }
              : { backgroundColor: card, borderWidth: 1, borderColor: '#e5e7eb' },
          ]}
        >
          {!isOwn && (
            <ThemedText style={[styles.senderLabel, { color: muted }]}>
              {item.userName}
            </ThemedText>
          )}
          {item.imageUrl ? (
            <Pressable onPress={() => setImageViewerUri(item.imageUrl!)}>
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.mediaPreview}
                resizeMode="cover"
              />
            </Pressable>
          ) : item.videoUrl ? (
            <Pressable
              onPress={() => Linking.openURL(item.videoUrl!).catch(() =>
                Alert.alert('Error', 'Could not open video.')
              )}
              style={styles.videoBubble}
            >
              <View style={styles.videoThumb}>
                <Ionicons name="play-circle" size={44} color="#fff" />
              </View>
              <ThemedText style={[styles.videoLabel, isOwn ? { color: '#dbeafe' } : { color: muted }]}>
                Tap to play video
              </ThemedText>
            </Pressable>
          ) : (
            <ThemedText
              style={[styles.messageText, isOwn ? { color: '#fff' } : { color: text }]}
            >
              {item.text}
            </ThemedText>
          )}
          <ThemedText
            style={[
              styles.timestamp,
              isOwn ? { color: '#dbeafe' } : { color: muted },
            ]}
          >
            {timestamp}
            {isOwn && item.status === 'sending' ? ' ...' : ''}
            {isOwn && item.status === 'sent' ? ' ✓' : ''}
            {isOwn && item.status === 'delivered' ? ' ✓✓' : ''}
            {isOwn && item.status === 'read' ? ' ✓✓' : ''}
          </ThemedText>
        </View>
      </View>
    );
  };

  // â”€â”€ Loading â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.header, { backgroundColor: tint }]}>
          <AppBackButton onPress={() => router.back()} variant="tint" />
          <View style={styles.headerTitle}>
            <ThemedText style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
              {otherUserFirstName}
            </ThemedText>
          </View>
          <View style={styles.headerActions} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={tint} />
          <ThemedText style={{ color: muted, marginTop: 12, fontSize: 13 }}>
            Connecting to Stream Chatâ€¦
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  // â”€â”€ Main render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: tint }]}>
        <AppBackButton onPress={() => router.back()} variant="tint" />
        <View style={styles.headerTitle}>
          <View style={styles.headerProfileRow}>
            <View style={styles.headerAvatar}>
              <ThemedText style={styles.headerAvatarText}>
                {initials(otherUserName)}
              </ThemedText>
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
                {otherUserFirstName}
              </ThemedText>
              <ThemedText style={{ color: '#e5e7eb', fontSize: 12 }}>
                {demoMode ? 'Demo conversation' : streamError ? 'Stream not configured' : otherUserEmail || otherUserPhone || ''}
              </ThemedText>
            </View>
          </View>
        </View>
        <View style={styles.headerActions}>
          <Pressable onPress={handleStartCall} style={styles.headerActionBtn}>
            <Ionicons name="call-outline" size={20} color="#fff" />
          </Pressable>
        </View>
      </View>

      {/* Demo banner â€” only for explicit demo sessions */}
      {demoMode && (
        <View style={[styles.infoBanner, { backgroundColor: `${tint}18` }]}>
          <Ionicons name="flask-outline" size={14} color={tint} />
          <ThemedText style={[styles.infoBannerText, { color: tint }]}>
            Demo mode â€” messages are local only. Select a real profile to start live chat.
          </ThemedText>
        </View>
      )}

      {/* Stream error banner â€” for real users when Stream keys are missing */}
      {streamError && !demoMode && (
        <View style={[styles.infoBanner, { backgroundColor: '#FEF3C7' }]}>
          <Ionicons name="warning-outline" size={14} color="#D97706" />
          <ThemedText style={[styles.infoBannerText, { color: '#92400E' }]} numberOfLines={4}>
            {streamError}
          </ThemedText>
        </View>
      )}

      <View style={{ flex: 1 }}>
        {/* Empty state for real chats with no messages yet */}
        {!demoMode && !streamError && messages.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={48} color={muted} style={{ marginBottom: 12 }} />
            <ThemedText style={[styles.emptyStateTitle, { color: muted }]}>
              No messages yet
            </ThemedText>
            <ThemedText style={[styles.emptyStateSubtitle, { color: muted }]}>
              Send the first message to start the conversation with {otherUserName}
            </ThemedText>
          </View>
        )}

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
        />

        {/* Input â€” disabled when Stream error for real users */}
        <View style={[styles.inputArea, { backgroundColor: card, borderTopColor: muted, paddingBottom: bottomInset }]}>
          {/* Attach menu popup */}
          {showAttachMenu && (
            <View style={[styles.attachMenu, { backgroundColor: card }]}>
              <Pressable onPress={handleSendImage} style={styles.attachOption}>
                <Ionicons name="image-outline" size={22} color={tint} />
                <ThemedText style={[styles.attachOptionText, { color: tint }]}>Photo</ThemedText>
              </Pressable>
              <Pressable onPress={handleSendVideo} style={styles.attachOption}>
                <Ionicons name="videocam-outline" size={22} color={tint} />
                <ThemedText style={[styles.attachOptionText, { color: tint }]}>Video</ThemedText>
              </Pressable>
            </View>
          )}
          <Pressable
            onPress={() => setShowAttachMenu((v) => !v)}
            disabled={sending || (!!streamError && !demoMode)}
          >
            <Ionicons
              name={showAttachMenu ? "close-circle-outline" : "add-circle-outline"}
              size={26}
              color={sending || (!!streamError && !demoMode) ? muted : tint}
              style={styles.inputIcon}
            />
          </Pressable>
          <TextInput
            style={[styles.input, { color: text, borderColor: muted }]}
            placeholder={
              streamError && !demoMode
                ? 'Stream Chat not configuredâ€¦'
                : demoMode
                ? 'Type a message (demo)â€¦'
                : 'Messageâ€¦'
            }
            placeholderTextColor={muted}
            value={inputText}
            onChangeText={setInputText}
            editable={!sending && !(!!streamError && !demoMode)}
            multiline
            onFocus={() =>
              setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 120)
            }
          />
          <Pressable
            onPress={handleSendMessage}
            disabled={!inputText.trim() || sending || (!!streamError && !demoMode)}
            style={styles.sendButton}
          >
            {sending ? (
              <ActivityIndicator size="small" color={tint} />
            ) : (
              <Ionicons
                name="send"
                size={20}
                color={inputText.trim() && !(!!streamError && !demoMode) ? tint : muted}
              />
            )}
          </Pressable>
        </View>
      </View>

      {/* Full-screen image viewer */}
      <Modal
        visible={!!imageViewerUri}
        transparent
        animationType="fade"
        onRequestClose={() => setImageViewerUri(null)}
      >
        <View style={[styles.lightboxBackdrop, { paddingTop: insets.top }]}>
          <Pressable
            style={[styles.lightboxClose, { top: insets.top + 6 }]}
            onPress={() => setImageViewerUri(null)}
            hitSlop={12}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </Pressable>
          {imageViewerUri && (
            <Image
              source={{ uri: imageViewerUri }}
              style={styles.lightboxImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </ThemedView>
  );
}

// â”€â”€ Styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 54,
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { flex: 1, justifyContent: 'center', alignItems: 'flex-start' },
  headerProfileRow: { flexDirection: 'row', alignItems: 'center', maxWidth: '100%' },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
    marginRight: 10,
  },
  headerAvatarText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  headerActions: { width: 44, flexDirection: 'row', justifyContent: 'flex-end', gap: 6 },
  headerActionBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  infoBannerText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 17,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
  },
  emptyStateTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptyStateSubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  messagesList: { paddingHorizontal: 12, paddingTop: 22, paddingBottom: 18 },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 10 },
  ownMessageRow: { justifyContent: 'flex-end' },
  otherMessageRow: { justifyContent: 'flex-start' },
  messageAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
    marginBottom: 15,
  },
  messageAvatarText: { fontSize: 11, fontWeight: '800' },
  messageBubble: {
    maxWidth: '78%',
    paddingHorizontal: 12,
    paddingTop: 9,
    paddingBottom: 7,
    borderRadius: 18,
  },
  senderLabel: { fontSize: 11, fontWeight: '600', marginBottom: 4 },
  messageText: { fontSize: 14, lineHeight: 20 },
  mediaPreview: {
    width: 180,
    height: 140,
    borderRadius: 10,
    backgroundColor: '#e5e7eb',
  },
  videoBubble: {
    width: 180,
    borderRadius: 10,
    overflow: 'hidden',
  },
  videoThumb: {
    width: 180,
    height: 130,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoLabel: {
    fontSize: 11,
    paddingVertical: 5,
    paddingHorizontal: 8,
    textAlign: 'center',
    opacity: 0.75,
  },
  attachMenu: {
    position: 'absolute',
    bottom: '100%',
    left: 8,
    flexDirection: 'row',
    gap: 6,
    padding: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f1d6e2',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 10,
  },
  attachOption: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#fdf2f8',
    gap: 4,
  },
  attachOptionText: {
    fontSize: 11,
    fontWeight: '700',
  },
  timestamp: { fontSize: 10, marginTop: 5, alignSelf: 'flex-end' },
  inputArea: {
    paddingHorizontal: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  inputIcon: { marginBottom: 6 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 14,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  lightboxBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  lightboxClose: { position: 'absolute', right: 14, zIndex: 10, padding: 8 },
  lightboxImage: { width: '100%', height: '88%' },
});
