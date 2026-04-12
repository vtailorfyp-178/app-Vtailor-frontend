import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useAuth } from "@/contexts/AuthContext";
import {
  Conversations,
  setAuthToken,
  formatConversationDate,
  getOtherParticipant,
  type Conversation,
  type UserRole,
} from "@/services/conversationApi";

type ConversationItem = Conversation & { isDemo?: boolean };

function buildSampleConversations(currentUserId: string, role: UserRole): ConversationItem[] {
  const now = new Date();
  const isCustomer = role === "customer";

  return [
    {
      conversation_id: "demo-conversation-1",
      tailor_id: isCustomer ? "tailor-demo-1" : currentUserId,
      customer_id: isCustomer ? currentUserId : "customer-demo-1",
      tailor_name: "Ahmad Master Tailor",
      customer_name: "Demo Customer",
      tailor_avatar: null,
      customer_avatar: null,
      last_message: "Your dress design is almost ready.",
      last_message_type: "text",
      last_message_at: now.toISOString(),
      unread_count: 1,
      status: "active",
      created_at: now.toISOString(),
      isDemo: true,
    },
    {
      conversation_id: "demo-conversation-2",
      tailor_id: isCustomer ? "tailor-demo-2" : currentUserId,
      customer_id: isCustomer ? currentUserId : "customer-demo-2",
      tailor_name: "Classic Stitch House",
      customer_name: "Demo Customer 2",
      tailor_avatar: null,
      customer_avatar: null,
      last_message: "Let's confirm neckline and sleeves.",
      last_message_type: "text",
      last_message_at: new Date(now.getTime() - 1000 * 60 * 50).toISOString(),
      unread_count: 0,
      status: "active",
      created_at: now.toISOString(),
      isDemo: true,
    },
  ];
}

export default function ConversationListScreen() {
  const router = useRouter();
  const { userId, token, userRole } = useAuth();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const tint = useThemeColor({}, "tint");
  const card = useThemeColor({}, "card");
  const muted = useThemeColor({}, "muted");
  const bgColor = useThemeColor({}, "background");

  // Setup auth token
  useEffect(() => {
    if (token) {
      setAuthToken(token);
    }
  }, [token]);

  // Load conversations
  useEffect(() => {
    if (!userId || !userRole) return;
    loadConversations();
  }, [userId, userRole]);

  const loadConversations = async () => {
    if (!userId || !userRole) return;

    try {
      setLoading(true);
      const data = await Conversations.list(userId, userRole as UserRole, 50);
      if (data.length > 0) {
        setConversations(data);
      } else {
        setConversations(buildSampleConversations(userId, userRole as UserRole));
      }
    } catch (err) {
      console.error("Error loading conversations:", err);
      setConversations(buildSampleConversations(userId, userRole as UserRole));
      Alert.alert("Chat Fallback", "Backend conversations unavailable, demo chats loaded for prototype.");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  }, [userId, userRole]);

  const handleConversationPress = (conv: Conversation) => {
    const other = getOtherParticipant(conv, userId || "");
    router.push({
      pathname: "/customer/chat-conversation",
      params: {
        conversation_id: conv.conversation_id,
        id: conv.conversation_id,
        otherUserId: other.id,
        otherUserName: other.name,
        otherUserAvatar: other.avatar || "👥",
        demo: (conv as ConversationItem).isDemo ? "1" : "0",
      },
    });
  };

  const renderConversationItem = ({ item }: { item: Conversation }) => {
    const other = getOtherParticipant(item, userId || "");
    const preview = item.last_message || "(No messages yet)";
    const unreadBadge = item.unread_count > 0;

    return (
      <Pressable
        onPress={() => handleConversationPress(item)}
        style={({ pressed }) => [
          styles.convItem,
          {
            backgroundColor: pressed ? muted : card,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <View style={styles.convAvatar}>
          <ThemedText style={styles.avatarEmoji}>
            {item.tailor_id === userId ? "👗" : "👨‍🔧"}
          </ThemedText>
        </View>

        <View style={styles.convContent}>
          <View style={styles.convHeader}>
            <ThemedText style={styles.convName}>{other.name}</ThemedText>
            <ThemedText style={[styles.convTime, { color: muted }]}>
              {formatConversationDate(item.last_message_at)}
            </ThemedText>
          </View>
          <ThemedText
            numberOfLines={1}
            style={[
              styles.convPreview,
              {
                color: unreadBadge ? tint : muted,
                fontWeight: unreadBadge ? "600" : "400",
              },
            ]}
          >
            {preview}
          </ThemedText>
        </View>

        {unreadBadge && (
          <View style={[styles.unreadBadge, { backgroundColor: tint }]}>
            <ThemedText style={styles.unreadCount}>
              {item.unread_count > 99 ? "99+" : item.unread_count}
            </ThemedText>
          </View>
        )}
      </Pressable>
    );
  };

  if (!userId) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.centerContent}>
          <ThemedText>Please log in to view conversations</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { backgroundColor: card }]}>
        <ThemedText style={styles.headerTitle}>Messages</ThemedText>
      </View>

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={tint} />
        </View>
      ) : conversations.length === 0 ? (
        <View style={styles.centerContent}>
          <ThemedText style={{ color: muted }}>No conversations yet</ThemedText>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversationItem}
          keyExtractor={(item) => item.conversation_id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tint} />
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 8,
  },
  convItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 4,
    borderRadius: 12,
  },
  convAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    backgroundColor: "#f5f5f5",
  },
  avatarEmoji: {
    fontSize: 28,
  },
  convContent: {
    flex: 1,
  },
  convHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  convName: {
    fontSize: 16,
    fontWeight: "600",
  },
  convTime: {
    fontSize: 12,
  },
  convPreview: {
    fontSize: 13,
    maxWidth: "90%",
  },
  unreadBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  unreadCount: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
});
