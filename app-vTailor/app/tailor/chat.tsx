import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable } from 'react-native';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { usePathname, useRouter } from 'expo-router';

const sampleChats = [
  { id: 1, name: 'Ali Hassan', lastMessage: 'When will my suit be ready?', time: '5m ago', unread: 1, avatar: 'AH' },
  { id: 2, name: 'Zara Khan', lastMessage: 'I loved the dress design!', time: '30m ago', unread: 0, avatar: 'ZK' },
  { id: 3, name: 'Ahmed Ali', lastMessage: 'Please share the progress', time: '2h ago', unread: 2, avatar: 'AA' },
  { id: 4, name: 'Fatima Bibi', lastMessage: 'Thank you for the great work!', time: 'Yesterday', unread: 0, avatar: 'FB' },
];

export default function TailorChat() {
  const [query, setQuery] = useState('');
  const bg = useThemeColor({}, 'background');
  const card = useThemeColor({}, 'card');
  const router = useRouter();
  const pathname = usePathname();
  const returnTo = pathname === '/tailor/chat' ? '/tailor/chat' : '/tailor?tab=chat';

  const chats = sampleChats.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <ProtectedRoute requiredRole="tailor">
      <View style={[styles.container, { backgroundColor: bg }]}> 
        <View style={styles.header}>
          <ThemedText style={styles.title}>Messages</ThemedText>
          <View style={styles.searchWrap}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput placeholder="Search customers..." value={query} onChangeText={setQuery} style={[styles.searchInput, { backgroundColor: card }]} />
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
              style={[styles.chatCard, { backgroundColor: card }]}
              onPress={() =>
                router.push({
                  pathname: '/tailor/chat/[id]',
                  params: { id: String(chat.id), returnTo },
                })
              }
            >
              <View style={[styles.avatar, { backgroundColor: '#ffe4f0' }]}>
                <Text style={styles.avatarText}>{chat.avatar}</Text>
              </View>
              <View style={styles.chatBody}>
                <View style={styles.chatRow}>
                  <Text style={styles.chatName}>{chat.name}</Text>
                  <Text style={styles.chatTime}>{chat.time}</Text>
                </View>
                <Text style={styles.chatLast} numberOfLines={1}>{chat.lastMessage}</Text>
              </View>
              {chat.unread > 0 && <View style={styles.unread}><Text style={styles.unreadText}>{chat.unread}</Text></View>}
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#f3d1de' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  searchWrap: { position: 'relative', marginBottom: 8 },
  searchIcon: { position: 'absolute', left: 12, top: 12, fontSize: 16, zIndex: 2 },
  searchInput: { height: 44, borderRadius: 12, paddingLeft: 40, paddingRight: 12 },
  list: { padding: 12, paddingBottom: 120 },
  chatCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#eaeaea' },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: '700' },
  chatBody: { flex: 1, marginLeft: 12 },
  chatRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chatName: { fontWeight: '700' },
  chatTime: { color: '#6b7280', fontSize: 12 },
  chatLast: { color: '#6b7280', marginTop: 4 },
  unread: { marginLeft: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: '#ff2d55', alignItems: 'center', justifyContent: 'center' },
  unreadText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  empty: { alignItems: 'center', padding: 32 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyTitle: { fontWeight: '700', fontSize: 16, marginBottom: 4 },
  emptySub: { color: '#6b7280' },
});

