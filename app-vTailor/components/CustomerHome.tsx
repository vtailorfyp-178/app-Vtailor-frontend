import { useAuth } from '@/contexts/AuthContext';
import { SURFACE_MUTED, TEXT_DARK, UI, ROLE_COLORS } from '@/constants/ui';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { CustomerScreenHeader } from '@/components/customer/CustomerScreenHeader';
import { DEMO_CUSTOMER_ORDERS, dressPreviewFromOrderDescription } from '@/services/orderDressPreview';
import { ThemedText } from './themed-text';
import { getUnreadCount } from '@/services/notificationsApi';
import { searchUsers, type UserSearchResult } from '@/services/usersApi';

type SearchShortcut = {
  label: string;
  subtitle: string;
  route: string;
  keywords: string[];
};

const SEARCH_SHORTCUTS: SearchShortcut[] = [
  { label: 'Find Tailors', subtitle: 'Browse tailors near you', route: '/customer/find-tailors', keywords: ['tailor', 'find', 'nearby', 'shop', 'darzi'] },
  { label: 'Customize outfit', subtitle: 'Pick a dress style', route: '/customer/select2d', keywords: ['custom', 'design', 'style', 'stitch', 'outfit'] },
  { label: 'Measurements', subtitle: 'Enter body measurements', route: '/customer/measurements', keywords: ['measure', 'size', 'body', 'inch'] },
  { label: 'Wedding dresses', subtitle: 'Bridal & traditional', route: '/customer/wedding-dresses', keywords: ['wedding', 'bridal', 'lehenga', 'traditional'] },
  { label: 'Formal dresses', subtitle: 'Party & formal wear', route: '/customer/formal-dresses', keywords: ['formal', 'party', 'frock', 'saree'] },
  { label: 'Casual dresses', subtitle: 'Everyday wear', route: '/customer/casual-dresses', keywords: ['casual', 'kurti', 'shalwar', 'daily'] },
];

const CustomerHome = () => {
  const router = useRouter();
  const { user, token } = useAuth();
  const tint = useThemeColor({}, 'tint');
  const muted = useThemeColor({}, 'muted');
  const card = useThemeColor({}, 'card');
  const inputBorder = useThemeColor({}, 'inputBorder');
  const iconBg = useThemeColor({}, 'iconBg');
  const textColor = useThemeColor({}, 'text');
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [tailorHits, setTailorHits] = useState<UserSearchResult[]>([]);
  const [searchingTailors, setSearchingTailors] = useState(false);
  const customerSoft = ROLE_COLORS.customer.soft;
  const customerBorder = ROLE_COLORS.customer.border;
  const customerDark = ROLE_COLORS.customer.primaryDark;

  useEffect(() => {
    if (!token) return;
    getUnreadCount(token).then(setUnreadCount).catch(() => {});
  }, [token]);

  useEffect(() => {
    const q = searchQuery.trim();
    if (!token || q.length < 2) {
      setTailorHits([]);
      setSearchingTailors(false);
      return;
    }

    setSearchingTailors(true);
    const timer = setTimeout(() => {
      searchUsers(token, q, 'tailor', 8)
        .then(setTailorHits)
        .catch(() => setTailorHits([]))
        .finally(() => setSearchingTailors(false));
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery, token]);

  const quickActions = [
    { label: 'Customize', icon: 'color-palette-outline', route: '/customer/select2d', desc: 'Pick style', accent: '#ec4899' },
    { label: 'Measurements', icon: 'body-outline', route: '/customer/measurements', desc: 'Your sizes', accent: '#0ea5e9' },
    { label: 'Find Tailors', icon: 'location-outline', route: '/customer/find-tailors', desc: 'Nearby', accent: '#8b5cf6' },
    { label: 'My Designs', icon: 'images-outline', route: '/customer/my-customizations', desc: 'Saved outfits', accent: '#db2777' },
  ];

  const currentOrders = DEMO_CUSTOMER_ORDERS.filter(
    (o) => o.status === 'In Progress' || o.status === 'Cutting',
  );

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const shortcutHits = useMemo(() => {
    if (!normalizedQuery) return [];
    return SEARCH_SHORTCUTS.filter(
      (item) =>
        item.label.toLowerCase().includes(normalizedQuery) ||
        item.keywords.some((kw) => kw.includes(normalizedQuery) || normalizedQuery.includes(kw)),
    ).slice(0, 4);
  }, [normalizedQuery]);

  const filteredOrders = useMemo(() => {
    if (!normalizedQuery) return currentOrders;
    return currentOrders.filter(
      (order) =>
        order.name.toLowerCase().includes(normalizedQuery) ||
        order.tailor.toLowerCase().includes(normalizedQuery),
    );
  }, [normalizedQuery, currentOrders]);

  const openFindTailors = (q?: string) => {
    const text = (q ?? searchQuery).trim();
    if (!text) {
      (router as any).push('/customer/find-tailors');
      return;
    }
    (router as any).push({
      pathname: '/customer/find-tailors',
      params: { q: text },
    });
  };

  const openTailorProfile = (tailor: UserSearchResult) => {
    (router as any).push({
      pathname: '/customer/tailor/[id]',
      params: {
        id: tailor.user_id,
        name: tailor.name || 'Tailor',
        specialization: (tailor.specialization || []).join(','),
      },
    });
  };

  const showSearchPanel = normalizedQuery.length >= 2;

  const openOrderTimeline = (order: (typeof currentOrders)[number]) => {
    const preview = dressPreviewFromOrderDescription(order.name);
    router.push({
      pathname: '/customer/order-timeline',
      params: {
        orderId: `ORD-${String(order.id).padStart(3, '0')}`,
        demo: '1',
        orderDescription: order.name,
        orderDate: order.date,
        orderPrice: String(order.price),
        tailorName: order.tailor,
        tailorId: order.tailorId,
        tailorPhone: order.tailorPhone,
        tailorAvatar: order.tailorAvatar,
        tailorRating: order.rating,
        statusLabel: order.status,
        sampleNeck: order.sample.neck,
        sampleSleeves: order.sample.sleeves,
        sampleStyle: order.sample.style,
        sampleColor: order.sample.color,
        ...(preview
          ? {
              modelId: preview.modelId,
              selections: JSON.stringify(preview.selections),
            }
          : {}),
      },
    } as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: SURFACE_MUTED }]}>
      <CustomerScreenHeader
        eyebrow="Welcome back"
        title={user?.name || 'Customer'}
        tint={tint}
        rightSlot={
          <Pressable onPress={() => (router as any).push('/customer/notifications')} style={styles.notificationPress}>
            <View style={[styles.notificationBtn, { backgroundColor: 'rgba(255,255,255,0.22)' }]}>
              <Ionicons name="notifications-outline" size={22} color="#fff" />
              {unreadCount > 0 ? (
                <View style={styles.notificationBadge}>
                  <ThemedText style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>
                    {unreadCount > 99 ? '99+' : String(unreadCount)}
                  </ThemedText>
                </View>
              ) : null}
            </View>
          </Pressable>
        }
      />

      <View style={[styles.searchContainer, { backgroundColor: card, borderColor: inputBorder }]}>
        <Ionicons name="search-outline" size={18} color={muted} style={styles.searchIcon} />
        <TextInput
          placeholder="Search tailors, styles..."
          placeholderTextColor={muted}
          style={[styles.searchInput, { color: textColor }]}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          onSubmitEditing={() => openFindTailors()}
        />
        {searchQuery.length > 0 ? (
          <Pressable onPress={() => setSearchQuery('')} hitSlop={8} style={styles.clearSearchBtn}>
            <Ionicons name="close-circle" size={20} color={muted} />
          </Pressable>
        ) : null}
        <Pressable onPress={() => openFindTailors()} style={[styles.searchGoBtn, { backgroundColor: tint }]}>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </Pressable>
      </View>

      {showSearchPanel ? (
        <View style={[styles.searchResultsPanel, { backgroundColor: card, borderColor: inputBorder }]}>
          {searchingTailors ? (
            <View style={styles.searchLoadingRow}>
              <ActivityIndicator size="small" color={tint} />
              <ThemedText style={{ color: muted, marginLeft: 8, fontSize: 12 }}>Searching...</ThemedText>
            </View>
          ) : null}

          {shortcutHits.map((item) => (
            <Pressable
              key={item.route}
              style={styles.searchResultRow}
              onPress={() => (router as any).push(item.route)}
            >
              <Ionicons name="flash-outline" size={18} color={tint} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <ThemedText style={styles.searchResultTitle}>{item.label}</ThemedText>
                <ThemedText style={{ color: muted, fontSize: 11 }}>{item.subtitle}</ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={16} color={muted} />
            </Pressable>
          ))}

          {tailorHits.map((tailor) => (
            <Pressable
              key={tailor.user_id}
              style={styles.searchResultRow}
              onPress={() => openTailorProfile(tailor)}
            >
              <Ionicons name="person-outline" size={18} color={tint} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <ThemedText style={styles.searchResultTitle} numberOfLines={1}>
                  {tailor.name || 'Tailor'}
                </ThemedText>
                <ThemedText style={{ color: muted, fontSize: 11 }} numberOfLines={1}>
                  {(tailor.specialization || []).join(' • ') || tailor.email || 'View profile'}
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={16} color={muted} />
            </Pressable>
          ))}

          {!searchingTailors && shortcutHits.length === 0 && tailorHits.length === 0 ? (
            <ThemedText style={{ color: muted, fontSize: 12, paddingVertical: 6 }}>
              No quick matches. Tap the arrow to search all tailors.
            </ThemedText>
          ) : null}

          <Pressable style={[styles.searchAllBtn, { borderColor: inputBorder }]} onPress={() => openFindTailors()}>
            <ThemedText style={{ color: tint, fontWeight: '800', fontSize: 13 }}>See all results on map</ThemedText>
          </Pressable>
        </View>
      ) : null}

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Quick actions</ThemedText>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <Pressable
                key={action.label}
                style={[styles.actionTile, { backgroundColor: card, borderColor: inputBorder }]}
                onPress={() => (router as any).push(action.route)}
              >
                <View style={[styles.actionIconBox, { backgroundColor: `${action.accent}18` }]}>
                  <Ionicons name={action.icon as any} size={22} color={action.accent} />
                </View>
                <View style={styles.actionTextCol}>
                  <ThemedText style={styles.actionLabel} numberOfLines={1}>
                    {action.label}
                  </ThemedText>
                  <ThemedText style={[styles.actionDesc, { color: muted }]} numberOfLines={1}>
                    {action.desc}
                  </ThemedText>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Pressable
            onPress={() => (router as any).push('/customer/ai-assistant')}
            style={[styles.aiAssistantCard, { backgroundColor: customerSoft, borderColor: customerBorder }]}
          >
            <View style={[styles.aiAssistantIcon, { backgroundColor: tint }]}>
              <Ionicons name="sparkles" size={22} color="#fff" />
            </View>
            <View style={styles.aiContent}>
              <ThemedText style={[styles.aiAssistantTitle, { color: customerDark }]}>AI Assistant</ThemedText>
              <ThemedText style={[styles.aiDesc, { color: muted }]}>Get personalized suggestions</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={tint} />
          </Pressable>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={[styles.sectionTitle, styles.sectionTitleInHeader]}>Current orders</ThemedText>
            <Pressable onPress={() => (router as any).replace('/customer?tab=orders')}>
              <ThemedText style={[styles.viewAll, { color: tint }]}>View All →</ThemedText>
            </Pressable>
          </View>
          <View style={styles.ordersList}>
            {normalizedQuery && filteredOrders.length === 0 ? (
              <View style={[styles.orderCard, { backgroundColor: card, borderColor: inputBorder }]}>
                <ThemedText style={{ color: muted, fontSize: 13 }}>No current orders match your search.</ThemedText>
              </View>
            ) : null}
            {filteredOrders.map((order) => (
              <Pressable 
                key={order.id} 
                style={[styles.orderCard, { backgroundColor: card, borderColor: inputBorder }]}
                  onPress={() => openOrderTimeline(order)}
              > 
                <View style={styles.orderTop}>
                  <View>
                    <ThemedText style={styles.orderName}>{order.name}</ThemedText>
                      <Pressable onPress={() => openOrderTimeline(order)} hitSlop={6}>
                      <ThemedText style={[styles.orderTailor, { color: tint }]}>{order.tailor}</ThemedText>
                    </Pressable>
                  </View>
                  <View style={styles.statusBadge}>
                    <ThemedText style={styles.statusText}>{order.status}</ThemedText>
                  </View>
                </View>
                <View style={styles.orderBottom}>
                  <View style={styles.metaRow}>
                    <Ionicons name="time-outline" size={14} color="#6b7280" />
                    <ThemedText style={styles.daysLeft}>{order.daysLeft} days left</ThemedText>
                  </View>
                  <ThemedText style={styles.price}>Rs. {order.price.toLocaleString()}</ThemedText>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
        <Pressable onPress={() => (router as any).push('/customer/order-timeline')} style={[styles.aiCard, { backgroundColor: card, borderColor: inputBorder }]}> 
          <View style={[styles.sideIconBox, { backgroundColor: iconBg }]}>
            <Ionicons name="analytics-outline" size={22} color={tint} />
          </View>
          <View style={styles.aiContent}>
            <ThemedText style={styles.aiTitle}>Order Timeline</ThemedText>
            <ThemedText style={[styles.aiDesc, { color: muted }]}>Track your order progress</ThemedText>
          </View>
          <ThemedText style={styles.arrow}>→</ThemedText>
        </Pressable>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  notificationPress: { alignSelf: 'center' },
  notificationBtn: { width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  notificationBadge: { position: 'absolute', top: -3, right: -3, backgroundColor: '#be185d', borderRadius: 10, minWidth: 17, height: 17, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 12, marginBottom: 8, paddingHorizontal: 14, borderRadius: 18, borderWidth: 1, minHeight: 52, ...UI.shadow },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 14 },
  clearSearchBtn: { marginRight: 6 },
  searchGoBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchResultsPanel: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    ...UI.softShadow,
  },
  searchLoadingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  searchResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  searchResultTitle: { fontSize: 14, fontWeight: '700', color: TEXT_DARK },
  searchAllBtn: {
    marginTop: 6,
    marginBottom: 4,
    paddingVertical: 10,
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e7eb',
  },
  scrollView: { flex: 1 },
  section: { marginTop: 20, paddingHorizontal: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '800', marginBottom: 12, color: TEXT_DARK },
  sectionTitleInHeader: { marginBottom: 0 },
  viewAll: { fontSize: 12, fontWeight: '700' },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionTile: {
    width: '48%',
    flexGrow: 1,
    flexBasis: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    ...UI.softShadow,
  },
  actionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  actionTextCol: { flex: 1, minWidth: 0 },
  actionLabel: { fontSize: 13, fontWeight: '800', color: TEXT_DARK },
  actionDesc: { fontSize: 10, marginTop: 2, fontWeight: '600' },
  ordersList: { gap: 12 },
  orderCard: { padding: 16, borderRadius: 18, borderWidth: 1, marginBottom: 8, ...UI.softShadow },
  orderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  orderName: { fontSize: 15, fontWeight: '800', color: TEXT_DARK },
  orderTailor: { fontSize: 12, marginTop: 3, fontWeight: '700' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#fef3c7', borderRadius: 999 },
  statusText: { fontSize: 11, fontWeight: '800', color: '#92400e' },
  orderBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  daysLeft: { fontSize: 12, color: '#6b7280' },
  price: { fontSize: 12, fontWeight: '600' },
  aiAssistantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    ...UI.shadow,
  },
  aiAssistantIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  aiAssistantTitle: { fontSize: 15, fontWeight: '800' },
  aiCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 18, borderWidth: 1, ...UI.softShadow },
  sideIconBox: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  aiContent: { flex: 1 },
  aiTitle: { fontSize: 15, fontWeight: '800', color: TEXT_DARK },
  aiDesc: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  arrow: { fontSize: 16, color: '#6b7280' },
  tipsCard: { flexDirection: 'row', padding: 16, borderRadius: 18, borderWidth: 1, marginBottom: 12, ...UI.softShadow },
  tipsIconBox: { width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  tipsTitle: { fontSize: 14, fontWeight: '800', marginBottom: 4, color: TEXT_DARK },
  tipsDesc: { fontSize: 11, color: '#6b7280' },
  bottomPadding: { height: 100 },
});

export default CustomerHome;
