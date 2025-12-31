import React from 'react';
import { View, ScrollView, TextInput, Pressable, StyleSheet } from 'react-native';
import { ThemedText } from './themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

const CustomerChat = () => {
  const chats = [
    { id: 1, name: 'Ahmad Tailor', lastMessage: 'Your suit cutting is completed!', time: '2m ago', unread: 2, avatar: 'AT' },
    { id: 2, name: 'Master Tailors', lastMessage: 'Please confirm the sherwani design', time: '1h ago', unread: 1, avatar: 'MT' },
    { id: 3, name: 'Classic Stitches', lastMessage: 'Thank you for the feedback!', time: 'Yesterday', unread: 0, avatar: 'CS' },
  ];

  const background = useThemeColor({}, 'background');
  const card = useThemeColor({}, 'card');
  const inputBorder = useThemeColor({}, 'inputBorder');
  const muted = useThemeColor({}, 'muted');
  const tint = useThemeColor({}, 'tint');

  return (
    <View style={[styles.container, { backgroundColor: background }]}> 
      <View style={[styles.headerSection, { borderBottomColor: inputBorder }] }>
        <ThemedText style={styles.headerTitle}>Messages</ThemedText>
        <View style={[styles.searchContainer, { backgroundColor: card, borderColor: inputBorder }] }>
          <ThemedText style={styles.searchIcon}>🔍</ThemedText>
          <TextInput placeholder="Search conversations..." placeholderTextColor={muted} style={[styles.searchInput, { color: useThemeColor({}, 'text') }]} />
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.chatsList}>
          {chats.map((chat) => (
            <Pressable key={chat.id} style={[styles.chatCard, { backgroundColor: card, borderColor: inputBorder }] }>
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
  headerTitle: { fontSize: 22, fontWeight: '700', marginBottom: 16 },
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
