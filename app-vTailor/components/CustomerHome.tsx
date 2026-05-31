import { useAuth } from '@/contexts/AuthContext';
import { SURFACE_MUTED, TEXT_DARK, UI } from '@/constants/ui';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { DEMO_CUSTOMER_ORDERS, dressPreviewFromOrderDescription } from '@/services/orderDressPreview';
import { ThemedText } from './themed-text';

const CustomerHome = () => {
  const router = useRouter();
  const { user } = useAuth();
  const tint = useThemeColor({}, 'tint');
  const muted = useThemeColor({}, 'muted');
  const card = useThemeColor({}, 'card');
  const inputBorder = useThemeColor({}, 'inputBorder');
  const iconBg = useThemeColor({}, 'iconBg');
  const textColor = useThemeColor({}, 'text');

  const quickActions = [
    { label: 'Customize', icon: 'color-palette-outline', route: '/customer/select2d' },
    { label: 'Measurements', icon: 'body-outline', route: '/customer/measurements' },
    { label: 'Find Tailors', icon: 'location-outline', route: '/customer/find-tailors' },
  ];

  const currentOrders = DEMO_CUSTOMER_ORDERS.filter(
    (o) => o.status === 'In Progress' || o.status === 'Cutting',
  );

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
      <View style={[styles.header, { backgroundColor: tint }]}>
        <View style={styles.welcomeBox}>
          <ThemedText style={styles.welcomeText}>Welcome back,</ThemedText>
          <ThemedText style={styles.userName}>{user?.name || 'Customer'}</ThemedText>
        </View>
        <Pressable onPress={() => (router as any).push('/customer/notifications')} style={styles.notificationPress}>
          <View style={[styles.notificationBtn, { backgroundColor: iconBg }]}>
            <Ionicons name="notifications-outline" size={21} color={tint} />
            <View style={styles.notificationBadge}>
              <ThemedText style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>3</ThemedText>
            </View>
          </View>
        </Pressable>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: card, borderColor: inputBorder }]}> 
        <Ionicons name="search-outline" size={18} color={muted} style={styles.searchIcon} />
        <TextInput
          placeholder="Search tailors, styles..."
          placeholderTextColor={muted}
          style={[styles.searchInput, { color: textColor }]}
        />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Quick Actions</ThemedText>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <Pressable key={action.label} style={[styles.actionButton, { backgroundColor: card, borderColor: inputBorder }]} onPress={() => (router as any).push(action.route)}>
                <View style={[styles.actionIconBox, { backgroundColor: iconBg }]}>
                  <Ionicons name={action.icon as any} size={23} color={tint} />
                </View>
                <ThemedText style={styles.actionLabel}>{action.label}</ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable onPress={() => (router as any).push('/customer/my-customizations')} style={[styles.myDesignsCard, { backgroundColor: card, borderColor: inputBorder }]}>
          <View style={[styles.myDesignsIcon, { backgroundColor: iconBg }]}>
            <Ionicons name="images-outline" size={23} color={tint} />
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.myDesignsTitle}>My Designs</ThemedText>
            <ThemedText style={[styles.myDesignsDesc, { color: muted }]}>View saved custom outfits and continue editing</ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={18} color={muted} />
        </Pressable>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Current Orders</ThemedText>
            <Pressable onPress={() => (router as any).push('/customer/orders')}>
              <ThemedText style={[styles.viewAll, { color: tint }]}>View All →</ThemedText>
            </Pressable>
          </View>
          <View style={styles.ordersList}>
            {currentOrders.map((order) => (
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

        <Pressable onPress={() => (router as any).push('/customer/ai-assistant')} style={[styles.aiCard, { backgroundColor: card, borderColor: inputBorder }]}> 
          <View style={[styles.sideIconBox, { backgroundColor: iconBg }]}>
            <Ionicons name="sparkles-outline" size={22} color={tint} />
          </View>
          <View style={styles.aiContent}>
            <ThemedText style={styles.aiTitle}>AI Style Assistant</ThemedText>
            <ThemedText style={[styles.aiDesc, { color: muted }]}>Get personalized suggestions</ThemedText>
          </View>
          <ThemedText style={styles.arrow}>→</ThemedText>
        </Pressable>

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

        <Pressable onPress={() => (router as any).push('/customer/chat')} style={[styles.tipsCard, { backgroundColor: card, borderColor: inputBorder }]}> 
          <View style={[styles.tipsIconBox, { backgroundColor: iconBg }]}>
            <Ionicons name="chatbubble-ellipses-outline" size={18} color={tint} />
          </View>
          <View>
            <ThemedText style={styles.tipsTitle}>Need Assistance?</ThemedText>
            <ThemedText style={[styles.tipsDesc, { color: muted }]}>Use direct chat with your tailor</ThemedText>
          </View>
        </Pressable>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 16, marginTop: 14, paddingHorizontal: 22, paddingTop: 26, paddingBottom: 24, borderRadius: 28, marginBottom: 2, ...UI.shadow },
  welcomeBox: { flex: 1, paddingRight: 14 },
  welcomeText: { fontSize: 13, opacity: 0.88, marginBottom: 5, color: '#fff' },
  userName: { fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: 0.2 },
  notificationPress: { marginLeft: 8, alignSelf: 'center' },
  notificationBtn: { width: 50, height: 50, borderRadius: 18, alignItems: 'center', justifyContent: 'center', ...UI.softShadow },
  notificationBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#be185d', borderRadius: 10, minWidth: 18, height: 18, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 16, marginBottom: 8, paddingHorizontal: 14, borderRadius: 18, borderWidth: 1, minHeight: 50, ...UI.softShadow },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, color: '#000000', fontSize: 14 },
  scrollView: { flex: 1, paddingHorizontal: 16 },
  section: { marginTop: 22 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '800', marginBottom: 12, color: TEXT_DARK },
  viewAll: { fontSize: 12, fontWeight: '500' },
  quickActionsGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  actionButton: { flex: 1, alignItems: 'center', paddingVertical: 16, paddingHorizontal: 8, borderRadius: 18, borderWidth: 1, ...UI.softShadow },
  actionIconBox: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 9 },
  actionLabel: { fontSize: 11, textAlign: 'center', fontWeight: '700', color: TEXT_DARK },
  myDesignsCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 18, borderWidth: 1, marginTop: 18, ...UI.softShadow },
  myDesignsIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  myDesignsTitle: { fontSize: 15, fontWeight: '900', color: TEXT_DARK },
  myDesignsDesc: { fontSize: 12, marginTop: 3, lineHeight: 17 },
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
  aiCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 18, borderWidth: 1, marginTop: 18, marginBottom: 12, ...UI.softShadow },
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
