import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { SURFACE_MUTED, TEXT_DARK, UI } from "@/constants/ui";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useAuth } from "@/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
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
      tailor_id: isCustomer ? "sample-tailor-aliya-formal" : currentUserId,
      customer_id: isCustomer ? currentUserId : "customer-demo-1",
      tailor_name: "Aliya Formal Dresses",
      customer_name: "Sehrish Bhalu",
      tailor_avatar: null,
      customer_avatar: null,
      last_message: "Your formal long frock sample is ready for review.",
      last_message_type: "text",
      last_message_at: now.toISOString(),
      unread_count: 1,
      status: "active",
      created_at: now.toISOString(),
      isDemo: true,
    },
    {
      conversation_id: "demo-conversation-2",
      tailor_id: isCustomer ? "sample-tailor-zainab-bridal" : currentUserId,
      customer_id: isCustomer ? currentUserId : "customer-demo-2",
      tailor_name: "Zainab Bridal Couture",
      customer_name: "Ayesha Khan",
      tailor_avatar: null,
      customer_avatar: null,
      last_message: "Please confirm the dupatta border and sleeve style.",
      last_message_type: "text",
      last_message_at: new Date(now.getTime() - 1000 * 60 * 50).toISOString(),
      unread_count: 0,
      status: "active",
      created_at: now.toISOString(),
      isDemo: true,
    },
    {
      conversation_id: "demo-conversation-3",
      tailor_id: isCustomer ? "sample-tailor-noor-party" : currentUserId,
      customer_id: isCustomer ? currentUserId : "customer-demo-3",
      tailor_name: "Noor Party Wear Studio",
      customer_name: "Maham Raza",
      tailor_avatar: null,
      customer_avatar: null,
      last_message: "We can stitch the party maxi in pink organza.",
      last_message_type: "text",
      last_message_at: new Date(now.getTime() - 1000 * 60 * 140).toISOString(),
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
  const [searchQuery, setSearchQuery] = useState("");

  const tint = useThemeColor({}, "tint");
  const card = useThemeColor({}, "card");
  const muted = useThemeColor({}, "muted");
  const inputBorder = useThemeColor({}, "inputBorder");

  const filteredConversations = conversations.filter((conversation) => {
    const other = getOtherParticipant(conversation, userId || "");
    return other.name.toLowerCase().includes(searchQuery.trim().toLowerCase());
  });

  const loadConversations = useCallback(async () => {
    if (!userId || !userRole) return;

    try {
      setLoading(true);
      const data = await Conversations.list(userId, userRole as UserRole, 50);
      if (data.length > 0) {
        setConversations(data);
      } else {
        setConversations(buildSampleConversations(userId, userRole as UserRole));
      }
    } catch {
      setConversations(buildSampleConversations(userId, userRole as UserRole));
    } finally {
      setLoading(false);
    }
  }, [userId, userRole]);

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
  }, [userId, userRole, loadConversations]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  }, [loadConversations]);

  const handleConversationPress = (conv: Conversation) => {
    const other = getOtherParticipant(conv, userId || "");
    const pathname = userRole === "tailor" ? "/tailor/chat/[id]" : "/customer/chat-conversation";
    router.push({
      pathname,
      params: {
        conversation_id: conv.conversation_id,
        id: conv.conversation_id,
        otherUserId: other.id,
        otherUserName: other.name,
        otherUserAvatar: other.avatar || "👥",
        otherUserPhone:
          conv.tailor_id === "sample-tailor-aliya-formal"
            ? "+923215560190"
            : conv.tailor_id === "sample-tailor-zainab-bridal"
              ? "+923004102231"
              : conv.tailor_id === "sample-tailor-noor-party"
                ? "+923332198744"
                : "",
        demo: (conv as ConversationItem).isDemo ? "1" : "0",
      },
    });
  };

  const renderConversationItem = ({ item }: { item: Conversation }) => {
    const other = getOtherParticipant(item, userId || "");
    const preview = item.last_message || "(No messages yet)";
    const unreadBadge = item.unread_count > 0;
    const initials = other.name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "VT";

    return (
      <Pressable
        onPress={() => handleConversationPress(item)}
        style={({ pressed }) => [
          styles.convItem,
          {
            backgroundColor: pressed ? "#fff1f6" : card,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <View style={styles.convAvatar}>
          <ThemedText style={styles.avatarText}>{initials}</ThemedText>
        </View>

        <View style={styles.convContent}>
          <ThemedText numberOfLines={1} style={styles.convName}>{other.name}</ThemedText>
          <ThemedText
            numberOfLines={1}
            style={[
              styles.convPreview,
              {
                color: muted,
              },
            ]}
          >
            {preview}
          </ThemedText>
        </View>

        <View style={styles.convMeta}>
          <ThemedText style={[styles.convTime, { color: muted }]}>
            {formatConversationDate(item.last_message_at)}
          </ThemedText>
          {unreadBadge && (
            <View style={[styles.unreadBadge, { backgroundColor: tint }]}>
              <ThemedText style={styles.unreadCount}>
                {item.unread_count > 99 ? "99+" : item.unread_count}
              </ThemedText>
            </View>
          )}
        </View>
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
      <View style={[styles.header, { backgroundColor: tint }]}>
        <ThemedText style={styles.headerEyebrow}>Stay connected</ThemedText>
        <ThemedText style={styles.headerTitle}>Messages</ThemedText>
        <View style={[styles.searchRow, { borderColor: inputBorder }]}>
          <Ionicons name="search-outline" size={18} color={muted} style={styles.searchIcon} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={userRole === "tailor" ? "Search customers..." : "Search tailors..."}
            placeholderTextColor={muted}
            style={styles.searchInput}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={tint} />
        </View>
      ) : filteredConversations.length === 0 ? (
        <View style={styles.centerContent}>
          <ThemedText style={{ color: muted }}>
            {searchQuery ? "No matching conversations" : "No conversations yet"}
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
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
    backgroundColor: SURFACE_MUTED,
  },
  header: {
    margin: 16,
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 18,
    borderRadius: 24,
    ...UI.shadow,
  },
  headerEyebrow: {
    color: "#fff",
    opacity: 0.86,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#fff",
    marginBottom: 18,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
    borderWidth: 1,
    backgroundColor: "#fff",
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: TEXT_DARK,
    paddingVertical: 6,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingHorizontal: 14,
    paddingTop: 2,
    paddingBottom: 120,
  },
  convItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#f1dfe7",
    ...UI.softShadow,
  },
  convAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    backgroundColor: "#ffe4f0",
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "800",
    color: TEXT_DARK,
  },
  convContent: {
    flex: 1,
    paddingRight: 10,
  },
  convName: {
    fontSize: 16,
    fontWeight: "800",
    color: TEXT_DARK,
    marginBottom: 6,
  },
  convTime: {
    fontSize: 12,
    fontWeight: "500",
  },
  convPreview: {
    fontSize: 16,
    maxWidth: "100%",
    lineHeight: 21,
  },
  convMeta: {
    minWidth: 58,
    alignItems: "flex-end",
    alignSelf: "stretch",
    justifyContent: "space-between",
  },
  unreadBadge: {
    minWidth: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  unreadCount: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
});
