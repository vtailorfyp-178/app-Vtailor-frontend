import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { SURFACE_MUTED, TEXT_DARK, UI } from "@/constants/ui";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useAuth } from "@/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { getStreamClient } from "@/services/streamChatService";
import { searchUsers, type UserSearchResult } from "@/services/usersApi";
import { fetchOrCreateStreamChannel } from "@/services/streamChatService";
import type { Channel, ChannelMemberResponse } from "stream-chat";

// ── Types ─────────────────────────────────────────────────────────────────────

type ChannelItem = {
  cid: string;
  channel_id: string;
  otherUserId: string;
  otherUserName: string;
  otherUserEmail?: string;
  otherUserPhone?: string;
  lastMessage: string;
  lastMessageAt: string | null;
  unreadCount: number;
  isDemo?: boolean;
  channel?: Channel;
};

// ── Demo data (shown when Stream is not configured / no real conversations) ───

function buildDemoChannels(userId: string, role: "tailor" | "customer" | null): ChannelItem[] {
  const now = new Date();
  const isCustomer = role !== "tailor";
  return [
    {
      cid: "demo:demo-tailor-1",
      channel_id: "demo-tailor-1",
      otherUserId: isCustomer ? "demo-tailor-aliya" : "demo-customer-sara",
      otherUserName: isCustomer ? "Aliya Formal Dresses" : "Sara Ahmed",
      lastMessage: isCustomer
        ? "Your formal long frock sample is ready for review."
        : "Please keep the fitting elegant and comfortable.",
      lastMessageAt: new Date(now.getTime() - 1000 * 60 * 5).toISOString(),
      unreadCount: 2,
      isDemo: true,
    },
    {
      cid: "demo:demo-tailor-2",
      channel_id: "demo-tailor-2",
      otherUserId: isCustomer ? "demo-tailor-zainab" : "demo-customer-ayesha",
      otherUserName: isCustomer ? "Zainab Bridal Couture" : "Ayesha Khan",
      lastMessage: isCustomer
        ? "Please confirm the dupatta border and sleeve style."
        : "Can we adjust the neckline a bit lower?",
      lastMessageAt: new Date(now.getTime() - 1000 * 60 * 50).toISOString(),
      unreadCount: 0,
      isDemo: true,
    },
    {
      cid: "demo:demo-tailor-3",
      channel_id: "demo-tailor-3",
      otherUserId: isCustomer ? "demo-tailor-noor" : "demo-customer-maham",
      otherUserName: isCustomer ? "Noor Party Wear Studio" : "Maham Raza",
      lastMessage: isCustomer
        ? "We can stitch the party maxi in pink organza."
        : "What fabric options do you have for the lehenga?",
      lastMessageAt: new Date(now.getTime() - 1000 * 60 * 140).toISOString(),
      unreadCount: 0,
      isDemo: true,
    },
  ];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatConversationDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diff < 7 * 86400)
    return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function avatarLetters(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "VT"
  );
}

function cleanDisplayName(raw: string): string {
  if (!raw || raw === "Unknown") return raw;
  if (raw.includes("@")) {
    const local = raw.split("@")[0];
    return local.replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).trim();
  }
  return raw;
}

function getOtherMember(channel: Channel, myUserId: string) {
  const members = Object.values(channel.state.members) as ChannelMemberResponse[];
  const other = members.find((m) => m.user?.id !== myUserId);
  return {
    id: other?.user?.id ?? "",
    name: cleanDisplayName((other?.user?.name as string) ?? "Unknown"),
    email: (other?.user?.email as string) ?? "",
    phone: (other?.user?.phone as string) ?? "",
  };
}

// ── New-Chat Search Modal ──────────────────────────────────────────────────────

function NewChatModal({
  visible,
  onClose,
  onSelectUser,
  myRole,
  token,
  tint,
  card,
  muted,
  inputBorder,
}: {
  visible: boolean;
  onClose: () => void;
  onSelectUser: (user: UserSearchResult) => void;
  myRole: "tailor" | "customer" | null;
  token: string | null;
  tint: string;
  card: string;
  muted: string;
  inputBorder: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Role to search: customers search tailors, tailors search customers
  const targetRole: "tailor" | "customer" = myRole === "tailor" ? "customer" : "tailor";
  const placeholder =
    myRole === "tailor"
      ? "Search customers by name or email…"
      : "Search tailors by name or email…";

  // Load all users in target role on open
  useEffect(() => {
    if (visible && token) {
      doSearch("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const doSearch = useCallback(
    async (q: string) => {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const data = await searchUsers(token, q, targetRole, 30);
        setResults(data);
      } catch (err) {
        setError("Could not reach server. Check backend is running.");
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [token, targetRole]
  );

  const onChangeQuery = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(text), 350);
  };

  const handleClose = () => {
    setQuery("");
    setResults([]);
    setError(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <View style={[styles.modalSheet, { backgroundColor: card }]}>
          {/* Modal header */}
          <View style={[styles.modalHeader, { backgroundColor: tint }]}>
            <ThemedText style={styles.modalTitle}>
              {myRole === "tailor" ? "Start chat with a customer" : "Start chat with a tailor"}
            </ThemedText>
            <Pressable onPress={handleClose} hitSlop={12}>
              <Ionicons name="close" size={22} color="#fff" />
            </Pressable>
          </View>

          {/* Search box */}
          <View style={[styles.modalSearchRow, { borderColor: inputBorder, backgroundColor: "#f9f0f4" }]}>
            <Ionicons name="search-outline" size={18} color={muted} style={{ marginRight: 8 }} />
            <TextInput
              autoFocus
              value={query}
              onChangeText={onChangeQuery}
              placeholder={placeholder}
              placeholderTextColor={muted}
              style={[styles.modalSearchInput, { color: TEXT_DARK }]}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <Pressable onPress={() => { setQuery(""); doSearch(""); }} hitSlop={10}>
                <Ionicons name="close-circle" size={16} color={muted} />
              </Pressable>
            )}
          </View>

          {/* Results */}
          {loading ? (
            <View style={styles.modalCenter}>
              <ActivityIndicator color={tint} />
            </View>
          ) : error ? (
            <View style={styles.modalCenter}>
              <Ionicons name="cloud-offline-outline" size={32} color={muted} style={{ marginBottom: 8 }} />
              <ThemedText style={[styles.modalEmptyText, { color: muted }]}>{error}</ThemedText>
            </View>
          ) : results.length === 0 ? (
            <View style={styles.modalCenter}>
              <Ionicons name="people-outline" size={36} color={muted} style={{ marginBottom: 8 }} />
              <ThemedText style={[styles.modalEmptyText, { color: muted }]}>
                {query
                  ? `No ${targetRole}s matching "${query}"`
                  : `No ${targetRole} accounts found in the database`}
              </ThemedText>
              <ThemedText style={[styles.modalEmptySubtext, { color: muted }]}>
                Register a {targetRole} account to test real chat
              </ThemedText>
            </View>
          ) : (
            <FlatList
              data={results}
              keyExtractor={(item) => item.user_id}
              contentContainerStyle={{ paddingBottom: 24 }}
              renderItem={({ item }) => (
                <Pressable
                  style={({ pressed }) => [
                    styles.userRow,
                    { backgroundColor: pressed ? `${tint}14` : "transparent" },
                  ]}
                  onPress={() => { handleClose(); onSelectUser(item); }}
                >
                  <View style={[styles.userAvatar, { backgroundColor: `${tint}22` }]}>
                    <ThemedText style={[styles.userAvatarText, { color: tint }]}>
                      {avatarLetters(item.name || item.email || "?")}
                    </ThemedText>
                  </View>
                  <View style={styles.userInfo}>
                    <ThemedText style={styles.userName}>
                      {item.name || "(No name set)"}
                    </ThemedText>
                    <ThemedText style={[styles.userEmail, { color: muted }]} numberOfLines={1}>
                      {item.email || item.phone || item.user_id}
                    </ThemedText>
                    {item.specialization.length > 0 && (
                      <ThemedText style={[styles.userSpec, { color: tint }]} numberOfLines={1}>
                        {item.specialization.join(", ")}
                      </ThemedText>
                    )}
                  </View>
                  <View style={[styles.roleBadge, { backgroundColor: `${tint}18` }]}>
                    <ThemedText style={[styles.roleBadgeText, { color: tint }]}>
                      {item.role}
                    </ThemedText>
                  </View>
                </Pressable>
              )}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ConversationListScreen() {
  const router = useRouter();
  const { userId, userRole, token } = useAuth();
  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [openingChat, setOpeningChat] = useState(false);
  const listenerRef = useRef<(() => void) | null>(null);

  const tint = useThemeColor({}, "tint");
  const card = useThemeColor({}, "card");
  const muted = useThemeColor({}, "muted");
  const inputBorder = useThemeColor({}, "inputBorder");

  const mapChannels = useCallback(
    (rawChannels: Channel[]): ChannelItem[] => {
      return rawChannels.map((ch) => {
        const other = getOtherMember(ch, userId ?? "");
        const lastMsg = ch.state.messages[ch.state.messages.length - 1];
        return {
          cid: ch.cid,
          channel_id: ch.id ?? "",
          otherUserId: other.id,
          otherUserName: other.name,
          otherUserEmail: other.email,
          otherUserPhone: other.phone,
          lastMessage: lastMsg?.text ?? "",
          lastMessageAt: lastMsg?.created_at
            ? new Date(lastMsg.created_at).toISOString()
            : null,
          unreadCount: ch.countUnread(),
          channel: ch,
        };
      });
    },
    [userId]
  );

  const loadChannels = useCallback(async () => {
    const client = getStreamClient();
    if (!client || !userId) {
      setIsDemoMode(true);
      setChannels(buildDemoChannels(userId ?? "", userRole));
      setLoading(false);
      setRefreshing(false);
      return;
    }
      setIsDemoMode(false);
      try {
        const filter = { type: "messaging", members: { $in: [userId] } };
        const sort = [{ last_message_at: -1 as const }];
        const rawChannels = await client.queryChannels(filter, sort, {
          watch: true,
          state: true,
          presence: true,
          limit: 50,
        });

        if (rawChannels.length === 0) {
          // Real Stream connected but no conversations yet — show demo to give a feel
          setIsDemoMode(false);
          setChannels(buildDemoChannels(userId ?? "", userRole));
        } else {
          setIsDemoMode(false);
          // Merge real channels first, then demo channels at the bottom
          const realMapped = mapChannels(rawChannels);
          const demos = buildDemoChannels(userId ?? "", userRole);
          setChannels([...realMapped, ...demos]);
          listenerRef.current?.();
          // Re-query when new messages arrive so list stays sorted by last_message_at
          listenerRef.current = client.on("message.new", async () => {
            try {
              const refreshed = await client.queryChannels(filter, sort, {
                watch: false,
                state: true,
                limit: 50,
              });
              setChannels([...mapChannels(refreshed), ...buildDemoChannels(userId ?? "", userRole)]);
            } catch {
              setChannels([...mapChannels(rawChannels), ...buildDemoChannels(userId ?? "", userRole)]);
            }
          }).unsubscribe;
        }
    } catch (err) {
      console.error("[ConversationList] Stream queryChannels failed:", err);
      setIsDemoMode(true);
      setChannels(buildDemoChannels(userId, userRole));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, userRole, mapChannels]);

  useEffect(() => {
    if (!userId) return;
    loadChannels();
    return () => { listenerRef.current?.(); };
  }, [userId, loadChannels]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadChannels();
  }, [loadChannels]);

  // ── Open a new chat from the search modal ──────────────────────────────────

  const handleSelectUser = useCallback(
    async (user: UserSearchResult) => {
      if (!userId || !token) return;
      setOpeningChat(true);

      const pathname = userRole === "tailor" ? "/tailor/chat/[id]" : "/customer/chat-conversation";
      const tailorId = user.role === "tailor" ? user.user_id : userId;
      const customerId = user.role === "customer" ? user.user_id : userId;

      try {
        // Try to create a real Stream channel
        const ch = await fetchOrCreateStreamChannel(token, tailorId, customerId);
        router.push({
          pathname,
          params: {
            stream_channel_id: ch.channel_id,
            stream_cid: ch.cid,
            id: ch.channel_id,
            otherUserId: user.user_id,
            otherUserName: user.name || "User",
            otherUserEmail: user.email || "",
            otherUserPhone: user.phone || "",
          },
        });
      } catch {
        // Stream not configured — navigate to real chat screen with tailorId fallback
        // chat-conversation will show a clear error banner (no demo messages)
        const tailorIdForNav = user.role === "tailor" ? user.user_id : userId;
        router.push({
          pathname,
          params: {
            tailorId: tailorIdForNav,
            id: `real-${user.user_id}`,
            otherUserId: user.user_id,
            otherUserName: user.name || "User",
            otherUserEmail: user.email || "",
            otherUserPhone: user.phone || "",
          },
        });
      } finally {
        setOpeningChat(false);
      }
    },
    [userId, userRole, token, router]
  );

  // ── Existing channel press ─────────────────────────────────────────────────

  const handleChannelPress = (item: ChannelItem) => {
    const pathname = userRole === "tailor" ? "/tailor/chat/[id]" : "/customer/chat-conversation";
    if (item.isDemo) {
      router.push({
        pathname,
        params: {
          demo_channel_id: item.channel_id,
          id: item.channel_id,
          otherUserId: item.otherUserId,
          otherUserName: item.otherUserName,
          demo: "1",
        },
      });
    } else {
      router.push({
        pathname,
        params: {
          stream_channel_id: item.channel_id,
          stream_cid: item.cid,
          id: item.channel_id,
          otherUserId: item.otherUserId,
          otherUserName: item.otherUserName,
          otherUserEmail: item.otherUserEmail || "",
          otherUserPhone: item.otherUserPhone || "",
        },
      });
    }
  };

  const filteredChannels = channels.filter((item) =>
    item.otherUserName.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  const renderItem = ({ item, index }: { item: ChannelItem; index: number }) => {
    const preview = item.lastMessage || "(No messages yet)";
    const unreadBadge = item.unreadCount > 0;

    // Insert a "Sample Chats" divider before the first demo item when there are also real items
    const realCount = channels.filter((c) => !c.isDemo).length;
    const showDivider = item.isDemo && index === realCount && realCount > 0;

    return (
      <>
        {showDivider && (
          <View style={styles.demoDivider}>
            <View style={[styles.demoDividerPill, { backgroundColor: '#f3e8ff' }]}>
              <ThemedText style={styles.demoDividerText}>Sample Chats</ThemedText>
            </View>
          </View>
        )}
        <Pressable
          onPress={() => handleChannelPress(item)}
          style={({ pressed }) => [
            styles.convItem,
            {
              backgroundColor: pressed ? "#fff1f6" : card,
              opacity: pressed ? 0.7 : (item.isDemo ? 0.75 : 1),
            },
          ]}
        >
          <View style={styles.convAvatar}>
            <ThemedText style={styles.avatarText}>
              {avatarLetters(item.otherUserName)}
            </ThemedText>
          </View>

          <View style={styles.convContent}>
            <ThemedText numberOfLines={1} style={styles.convName}>
              {item.otherUserName}
            </ThemedText>
            <ThemedText numberOfLines={1} style={[styles.convPreview, { color: muted }]}>
              {preview}
            </ThemedText>
          </View>

          <View style={styles.convMeta}>
            <ThemedText style={[styles.convTime, { color: muted }]}>
              {formatConversationDate(item.lastMessageAt)}
            </ThemedText>
            {unreadBadge && (
              <View style={[styles.unreadBadge, { backgroundColor: tint }]}>
                <ThemedText style={styles.unreadCount}>
                  {item.unreadCount > 99 ? "99+" : item.unreadCount}
                </ThemedText>
              </View>
            )}
          </View>
        </Pressable>
      </>
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
      {/* Header */}
      <View style={[styles.header, { backgroundColor: tint }]}>
        <View style={styles.headerTopRow}>
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.headerEyebrow}>Stay connected</ThemedText>
            <ThemedText style={styles.headerTitle}>Messages</ThemedText>
          </View>
          {/* New Chat compose button */}
          <Pressable
            style={[styles.newChatBtn, { backgroundColor: "rgba(255,255,255,0.22)" }]}
            onPress={() => setShowNewChat(true)}
            disabled={openingChat}
          >
            {openingChat ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="create-outline" size={20} color="#fff" />
            )}
          </Pressable>
        </View>

        {isDemoMode && (
          <View style={styles.demoBanner}>
            <Ionicons name="information-circle-outline" size={13} color="#fff" />
            <ThemedText style={styles.demoBannerText}>
              Demo mode — tap{" "}
              <Ionicons name="create-outline" size={12} color="#fff" />{" "}
              to search real profiles from the database
            </ThemedText>
          </View>
        )}

        <View style={[styles.searchRow, { borderColor: inputBorder }]}>
          <Ionicons name="search-outline" size={18} color={muted} style={styles.searchIcon} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={userRole === "tailor" ? "Filter conversations…" : "Filter conversations…"}
            placeholderTextColor={muted}
            style={styles.searchInput}
          />
        </View>
      </View>

      {/* Conversation list */}
      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={tint} />
        </View>
      ) : filteredChannels.length === 0 ? (
        <View style={styles.centerContent}>
          <Ionicons name="chatbubbles-outline" size={44} color={muted} style={{ marginBottom: 12 }} />
          <ThemedText style={{ color: muted, fontWeight: "700", fontSize: 16, marginBottom: 6 }}>
            {searchQuery ? "No matching conversations" : isDemoMode ? "No conversations yet" : "No chats started yet"}
          </ThemedText>
          <ThemedText style={{ color: muted, fontSize: 13, textAlign: "center", paddingHorizontal: 32 }}>
            {isDemoMode
              ? "Tap the compose icon to search and start a chat with a real profile"
              : userRole === "tailor"
              ? "Customers will appear here when they start a chat with you"
              : "Tap the compose icon to search for a tailor and start chatting"}
          </ThemedText>
          <Pressable
            style={[styles.startChatBtn, { backgroundColor: tint }]}
            onPress={() => setShowNewChat(true)}
          >
            <Ionicons name="create-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
            <ThemedText style={{ color: "#fff", fontWeight: "700" }}>
              {userRole === "tailor" ? "Search Customers" : "Find a Tailor"}
            </ThemedText>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filteredChannels}
          renderItem={renderItem}
          keyExtractor={(item) => item.cid}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tint} />
          }
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* New Chat Modal */}
      <NewChatModal
        visible={showNewChat}
        onClose={() => setShowNewChat(false)}
        onSelectUser={handleSelectUser}
        myRole={userRole}
        token={token}
        tint={tint}
        card={card}
        muted={muted}
        inputBorder={inputBorder}
      />
    </ThemedView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SURFACE_MUTED },
  header: {
    margin: 16,
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 18,
    borderRadius: 24,
    ...UI.shadow,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
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
  },
  newChatBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  demoBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 10,
    backgroundColor: "rgba(0,0,0,0.18)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  demoBannerText: { color: "#fff", fontSize: 11, opacity: 0.92 },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
    borderWidth: 1,
    backgroundColor: "#fff",
    marginTop: 10,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16, color: TEXT_DARK, paddingVertical: 6 },
  centerContent: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 20 },
  listContent: { paddingHorizontal: 14, paddingTop: 2, paddingBottom: 120 },
  startChatBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 20,
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
  avatarText: { fontSize: 16, fontWeight: "800", color: TEXT_DARK },
  convContent: { flex: 1, paddingRight: 10 },
  convName: { fontSize: 16, fontWeight: "800", color: TEXT_DARK, marginBottom: 6 },
  convTime: { fontSize: 12, fontWeight: "500" },
  convPreview: { fontSize: 16, maxWidth: "100%", lineHeight: 21 },
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
  unreadCount: { color: "#fff", fontSize: 14, fontWeight: "800" },

  demoDivider:     { paddingHorizontal: 16, paddingVertical: 8, alignItems: 'flex-start' },
  demoDividerPill: { flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 14 },
  demoDividerText: { fontSize: 11, fontWeight: '700', color: '#7c3aed' },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "88%",
    minHeight: "55%",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
  },
  modalTitle: { color: "#fff", fontSize: 17, fontWeight: "800" },
  modalSearchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
  },
  modalSearchInput: { flex: 1, fontSize: 15, paddingVertical: 2 },
  modalCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    minHeight: 180,
  },
  modalEmptyText: { fontSize: 15, fontWeight: "600", textAlign: "center", marginBottom: 6 },
  modalEmptySubtext: { fontSize: 13, textAlign: "center", opacity: 0.8 },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  userAvatarText: { fontSize: 16, fontWeight: "800" },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: "700", marginBottom: 2 },
  userEmail: { fontSize: 13, marginBottom: 2 },
  userSpec: { fontSize: 12, fontWeight: "600" },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  roleBadgeText: { fontSize: 11, fontWeight: "700", textTransform: "capitalize" },
});
