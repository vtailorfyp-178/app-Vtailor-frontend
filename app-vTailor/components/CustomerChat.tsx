import React from 'react';
import { View, ScrollView, TextInput, Pressable, StyleSheet } from 'react-native';
import { ThemedText } from './themed-text';

const CustomerChat = () => {
  const chats = [
    { id: 1, name: 'Ahmad Tailor', lastMessage: 'Your suit cutting is completed!', time: '2m ago', unread: 2, avatar: 'AT' },
    { id: 2, name: 'Master Tailors', lastMessage: 'Please confirm the sherwani design', time: '1h ago', unread: 1, avatar: 'MT' },
    { id: 3, name: 'Classic Stitches', lastMessage: 'Thank you for the feedback!', time: 'Yesterday', unread: 0, avatar: 'CS' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.headerSection}>
        <ThemedText style={styles.headerTitle}>Messages</ThemedText>
        <View style={styles.searchContainer}>
          <ThemedText style={styles.searchIcon}>🔍</ThemedText>
          <TextInput placeholder="Search conversations..." placeholderTextColor="#9ca3af" style={styles.searchInput} />
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.chatsList}>
          {chats.map((chat) => (
            <Pressable key={chat.id} style={styles.chatCard}>
              <View style={styles.avatar}>
                <ThemedText style={styles.avatarText}>{chat.avatar}</ThemedText>
              </View>
              <View style={styles.chatContent}>
                <View style={styles.chatHeader}>
                  <ThemedText style={styles.chatName}>{chat.name}</ThemedText>
                  <ThemedText style={styles.chatTime}>{chat.time}</ThemedText>
                </View>
                <ThemedText style={styles.lastMessage} numberOfLines={1}>{chat.lastMessage}</ThemedText>
              </View>
              {chat.unread > 0 && (
                <View style={styles.unreadBadge}>
                  <ThemedText style={styles.unreadText}>{chat.unread}</ThemedText>
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
  searchContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, backgroundColor: '#f3f4f6', borderRadius: 12, borderWidth: 2, borderColor: '#e5e7eb' },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, color: '#000000', fontSize: 14 },
  scrollView: { flex: 1 },
  chatsList: { paddingHorizontal: 16, paddingTop: 8, gap: 8 },
  chatCard: { flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: '#f9fafb', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', marginVertical: 4 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#0ea5a4', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: '#ffffff', fontWeight: '600', fontSize: 14 },
  chatContent: { flex: 1 },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  chatName: { fontSize: 14, fontWeight: '600' },
  chatTime: { fontSize: 11, color: '#6b7280' },
  lastMessage: { fontSize: 12, color: '#6b7280' },
  unreadBadge: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#0ea5a4', justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  unreadText: { color: '#ffffff', fontSize: 10, fontWeight: '700' },
  bottomPadding: { height: 100 },
});

export default CustomerChat;
