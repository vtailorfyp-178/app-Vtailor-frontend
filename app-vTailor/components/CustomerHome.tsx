import { useAuth } from '@/contexts/AuthContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ThemedText } from './themed-text';

const CustomerHome = () => {
  const router = useRouter();
  const { user } = useAuth();
  const background = useThemeColor({}, 'background');
  const tint = useThemeColor({}, 'tint');
  const muted = useThemeColor({}, 'muted');
  const card = useThemeColor({}, 'card');
  const inputBorder = useThemeColor({}, 'inputBorder');
  const iconBg = useThemeColor({}, 'iconBg');
  const textColor = useThemeColor({}, 'text');

  const quickActions = [
    { label: 'Customize', icon: '🎨', route: '/customer/select2d' },
    { label: 'My Designs', icon: '🖼️', route: '/customer/my-customizations' },
    { label: 'Measurements', icon: '📏', route: '/customer/measurements' },
    { label: 'Find Tailors', icon: '🔍', route: '/customer/find-tailors' },
  ];

  const currentOrders = [
    { id: 1, name: 'Long Frock', tailor: 'Ahmad Tailor', status: 'In Progress', daysLeft: 5, price: 8500 },
    { id: 2, name: 'Shalwar Kameez', tailor: 'Master Tailors', status: 'Cutting', daysLeft: 12, price: 25000 },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <ThemedText style={[styles.welcomeText, { color: muted }]}>Welcome back,</ThemedText>
          <ThemedText style={[styles.userName, { color: tint }]}>{user?.name || 'Customer'}</ThemedText>
        </View>
        <Pressable onPress={() => (router as any).push('/customer/notifications')} style={{ marginLeft: 8 }}>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: iconBg, alignItems: 'center', justifyContent: 'center' }}>
            <ThemedText style={styles.notificationBell}>🔔</ThemedText>
            <View style={{ position: 'absolute', top: -6, right: -6, backgroundColor: tint, borderRadius: 10, minWidth: 18, height: 18, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center' }}>
              <ThemedText style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>3</ThemedText>
            </View>
          </View>
        </Pressable>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: card, borderColor: inputBorder }]}> 
        <ThemedText style={styles.searchIcon}>🔍</ThemedText>
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
              <Pressable key={action.label} style={styles.actionButton} onPress={() => (router as any).push(action.route)}>
                <Text style={styles.actionIcon}>{action.icon}</Text>
                <ThemedText style={styles.actionLabel}>{action.label}</ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

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
                onPress={() => router.push(`/customer/tailor-details?tailorId=${order.id}&from=home`)}
              > 
                <View style={styles.orderTop}>
                  <View>
                    <ThemedText style={styles.orderName}>{order.name}</ThemedText>
                    <Pressable onPress={() => router.push(`/customer/tailor-details?tailorId=${order.id}&from=home`)}>
                      <ThemedText style={[styles.orderTailor, { color: '#3b82f6', fontWeight: '600' }]}>{order.tailor}</ThemedText>
                    </Pressable>
                  </View>
                  <View style={styles.statusBadge}>
                    <ThemedText style={styles.statusText}>{order.status}</ThemedText>
                  </View>
                </View>
                <View style={styles.orderBottom}>
                  <ThemedText style={styles.daysLeft}>⏱️ {order.daysLeft} days left</ThemedText>
                  <ThemedText style={styles.price}>Rs. {order.price.toLocaleString()}</ThemedText>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable onPress={() => (router as any).push('/customer/ai-assistant')} style={[styles.aiCard, { backgroundColor: card, borderColor: inputBorder }]}> 
          <Text style={styles.aiIcon}>🤖</Text>
          <View style={styles.aiContent}>
            <ThemedText style={styles.aiTitle}>AI Style Assistant</ThemedText>
            <ThemedText style={[styles.aiDesc, { color: muted }]}>Get personalized suggestions</ThemedText>
          </View>
          <ThemedText style={styles.arrow}>→</ThemedText>
        </Pressable>

        <Pressable onPress={() => (router as any).push('/customer/order-timeline')} style={[styles.aiCard, { backgroundColor: card, borderColor: inputBorder }]}> 
          <Text style={styles.aiIcon}>📊</Text>
          <View style={styles.aiContent}>
            <ThemedText style={styles.aiTitle}>Order Timeline</ThemedText>
            <ThemedText style={[styles.aiDesc, { color: muted }]}>Track your order progress</ThemedText>
          </View>
          <ThemedText style={styles.arrow}>→</ThemedText>
        </Pressable>

        <Pressable onPress={() => (router as any).push('/customer/chat')} style={[styles.tipsCard, { backgroundColor: card, borderColor: inputBorder }]}> 
          <Text style={styles.tipsIcon}>💬</Text>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 40, paddingBottom: 16 },
  welcomeText: { fontSize: 12, opacity: 0.8, marginBottom: 4 },
  userName: { fontSize: 20, fontWeight: '600' },
  notificationBell: { fontSize: 20 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginVertical: 16, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1 },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, color: '#000000', fontSize: 14 },
  scrollView: { flex: 1, paddingHorizontal: 16 },
  section: { marginTop: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  viewAll: { fontSize: 12, fontWeight: '500' },
  quickActionsGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  actionButton: { flex: 1, alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1 },
  actionIcon: { fontSize: 24, marginBottom: 8 },
  actionLabel: { fontSize: 11, textAlign: 'center', fontWeight: '500' },
  ordersList: { gap: 12 },
  orderCard: { padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  orderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  orderName: { fontSize: 14, fontWeight: '600' },
  orderTailor: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#fef08a', borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: '500', color: '#92400e' },
  orderBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  daysLeft: { fontSize: 12, color: '#6b7280' },
  price: { fontSize: 12, fontWeight: '600' },
  aiCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, marginTop: 20, marginBottom: 12 },
  aiIcon: { fontSize: 24, marginRight: 12 },
  aiContent: { flex: 1 },
  aiTitle: { fontSize: 14, fontWeight: '600' },
  aiDesc: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  arrow: { fontSize: 16, color: '#6b7280' },
  tipsCard: { flexDirection: 'row', padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  tipsIcon: { fontSize: 18, marginRight: 12 },
  tipsTitle: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  tipsDesc: { fontSize: 11, color: '#6b7280' },
  bottomPadding: { height: 100 },
});

export default CustomerHome;
