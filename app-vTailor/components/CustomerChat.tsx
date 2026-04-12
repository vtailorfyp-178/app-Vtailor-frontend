import React, { useMemo } from 'react';
import { View, ScrollView, TextInput, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import ConversationListScreen from './ConversationList';

interface CustomerChatProps {
  tailorId?: number;
  tailorName?: string;
}

const CustomerChat = ({ tailorId, tailorName }: CustomerChatProps) => {
  const router = useRouter();
  const chats = [
    { id: 1, name: 'Ahmad Tailor', lastMessage: 'Your suit cutting is completed!', time: '2m ago', unread: 2, avatar: 'AT' },
    { id: 2, name: 'Master Tailors', lastMessage: 'Please confirm the sherwani design', time: '1h ago', unread: 1, avatar: 'MT' },
    { id: 3, name: 'Classic Stitches', lastMessage: 'Thank you for the feedback!', time: 'Yesterday', unread: 0, avatar: 'CS' },
  ];

  const filteredChats = useMemo(() => {
    if (tailorId) {
      const existing = chats.find((c) => c.id === tailorId);
      if (existing) return [existing];
      const placeholderName = tailorName || 'Tailor';
      const initials = placeholderName
        .split(' ')
        .map((p) => p[0])
        .join('')
        .toUpperCase();
      return [{ id: tailorId, name: placeholderName, lastMessage: 'Start chatting...', time: 'Now', unread: 0, avatar: initials }];
    }
    return chats;
  }, [tailorId, tailorName]);

  const background = useThemeColor({}, 'background');
  const card = useThemeColor({}, 'card');
  const inputBorder = useThemeColor({}, 'inputBorder');
  const muted = useThemeColor({}, 'muted');
  const tint = useThemeColor({}, 'tint');

  if (!tailorId) {
    return <ConversationListScreen />;
  }

  return (
    <View style={[styles.container, { backgroundColor: background }]}> 
      <View style={[styles.headerSection, { borderBottomColor: inputBorder }] }>
        <View style={styles.headerTop}>
          <Pressable onPress={() => (router as any).back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={useThemeColor({}, 'text')} />
          </Pressable>
          <ThemedText style={styles.headerTitle}>Messages</ThemedText>
          <View style={styles.headerSpacer} />
        </View>
        <View style={[styles.searchContainer, { backgroundColor: card, borderColor: inputBorder }] }>
          <ThemedText style={styles.searchIcon}>🔍</ThemedText>
          <TextInput placeholder="Search conversations..." placeholderTextColor={muted} style={[styles.searchInput, { color: useThemeColor({}, 'text') }]} />
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.chatsList}>
          {filteredChats.map((chat) => (
            <Pressable 
              key={chat.id} 
              onPress={() =>
                (router as any).push({
                  pathname: '/customer/chat-conversation',
                  params: {
                    tailorId: chat.id,
                    otherUserId: String(chat.id),
                    otherUserName: chat.name,
                    otherUserAvatar: chat.avatar,
                  },
                })
              }
              style={[styles.chatCard, { backgroundColor: card, borderColor: inputBorder }] }>
              <View style={[styles.avatar, { backgroundColor: useThemeColor({}, 'iconBg') }]}>
                <ThemedText style={[styles.avatarText, { color: tint }]}>{chat.avatar}</ThemedText>
              </View>
              <View style={styles.chatContent}>
                <View style={styles.chatHeader}>
                  <ThemedText style={styles.chatName}>{chat.name}</ThemedText>
                  <ThemedText style={styles.chatTime}>{chat.time}</ThemedText>
                </View>
                <ThemedText style={styles.lastMessage} numberOfLines={1}>{chat.lastMessage}</ThemedText>
              </View>
              {chat.unread > 0 && (
                <View style={[styles.unreadBadge, { backgroundColor: tint }]}>
                  <ThemedText style={[styles.unreadText, { color: '#fff' }]}>{chat.unread}</ThemedText>
                </View>
              )}
            </Pressable>
          ))}
        </View>
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  headerSection: { paddingHorizontal: 16, paddingTop: 40, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginLeft: -8 },
  headerSpacer: { width: 44 },
  headerTitle: { fontSize: 22, fontWeight: '700', flex: 1, textAlign: 'center' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, borderRadius: 12, borderWidth: 2 },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, color: '#000000', fontSize: 14 },
  scrollView: { flex: 1 },
  chatsList: { paddingHorizontal: 16, paddingTop: 8, gap: 8 },
  chatCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, marginVertical: 4 },
  avatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontWeight: '600', fontSize: 14 },
  chatContent: { flex: 1 },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  chatName: { fontSize: 14, fontWeight: '600' },
  chatTime: { fontSize: 11, color: '#6b7280' },
  lastMessage: { fontSize: 12, color: '#6b7280' },
  unreadBadge: { width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  unreadText: { fontSize: 10, fontWeight: '700' },
  bottomPadding: { height: 100 },
});

export default CustomerChat;
