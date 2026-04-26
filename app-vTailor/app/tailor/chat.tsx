import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable } from 'react-native';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ThemedText } from '@/components/themed-text';
import { usePathname, useRouter } from 'expo-router';

const ACCENT = '#E91E8C';
const BORDER = '#E0E0E0';

const sampleChats = [
  { id: 1, name: 'Ali Hassan', lastMessage: 'When will my suit be ready?', time: '5m ago', unread: 1, avatar: 'AH' },
  { id: 2, name: 'Zara Khan', lastMessage: 'I loved the dress design!', time: '30m ago', unread: 0, avatar: 'ZK' },
  { id: 3, name: 'Ahmed Ali', lastMessage: 'Please share the progress', time: '2h ago', unread: 2, avatar: 'AA' },
  { id: 4, name: 'Fatima Bibi', lastMessage: 'Thank you for the great work!', time: 'Yesterday', unread: 0, avatar: 'FB' },
];

export default function TailorChat() {
  const [query, setQuery] = useState('');
  const router = useRouter();
  const pathname = usePathname();
  const returnTo = pathname === '/tailor/chat' ? '/tailor/chat' : '/tailor?tab=chat';

  const chats = sampleChats.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <ProtectedRoute requiredRole="tailor">
      <View style={styles.container}> 
        <View style={styles.header}>
          <ThemedText style={styles.title}>Messages</ThemedText>
          <View style={styles.searchWrap}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              placeholder="Search customers..."
              placeholderTextColor="#8A8A8A"
              value={query}
              onChangeText={setQuery}
              style={styles.searchInput}
            />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.list}>
          {chats.length === 0 && (
            <View style={styles.empty}> 
              <View style={[styles.emptyIcon, { backgroundColor: '#f3f4f6' }]}><Text style={{fontSize:24}}>💬</Text></View>
              <Text style={styles.emptyTitle}>No Messages Yet</Text>
              <Text style={styles.emptySub}>Customer messages will appear here</Text>
            </View>
          )}

          {chats.map((chat) => (
            <Pressable
              key={chat.id}
              style={styles.chatRowItem}
              onPress={() =>
                router.push({
                  pathname: '/tailor/chat/[id]',
                  params: { id: String(chat.id), returnTo },
                })
              }
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{chat.avatar}</Text>
              </View>
              <View style={styles.chatBody}>
                <Text style={styles.chatName}>{chat.name}</Text>
                <Text style={styles.chatLast} numberOfLines={1}>{chat.lastMessage}</Text>
              </View>
              <View style={styles.chatMeta}>
                <Text style={styles.chatTime}>{chat.time}</Text>
                {chat.unread > 0 && <View style={styles.unread}><Text style={styles.unreadText}>{chat.unread}</Text></View>}
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: '600', marginBottom: 16, color: '#111827' },
  searchWrap: { position: 'relative', marginBottom: 6 },
  searchIcon: { position: 'absolute', left: 16, top: 13, fontSize: 16, zIndex: 2 },
  searchInput: {
    height: 46,
    borderRadius: 23,
    paddingLeft: 46,
    paddingRight: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: BORDER,
    fontSize: 15,
    fontWeight: '400',
    color: '#111827',
  },
  list: { paddingHorizontal: 20, paddingBottom: 120 },
  chatRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    backgroundColor: '#fff',
  },
  avatar: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFE1F0' },
  avatarText: { fontWeight: '600', color: ACCENT },
  chatBody: { flex: 1, marginLeft: 12 },
  chatName: { fontWeight: '600', fontSize: 16, color: '#111827', marginBottom: 5 },
  chatTime: { color: '#6b7280', fontSize: 12, fontWeight: '400', marginBottom: 10 },
  chatLast: { color: '#6b7280', fontWeight: '400', fontSize: 14 },
  chatMeta: { alignItems: 'flex-end', alignSelf: 'stretch', justifyContent: 'flex-start', minWidth: 70 },
  unread: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#E91E63', alignItems: 'center', justifyContent: 'center' },
  unreadText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  empty: { alignItems: 'center', padding: 32 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyTitle: { fontWeight: '600', fontSize: 16, marginBottom: 4 },
  emptySub: { color: '#6b7280' },
});

