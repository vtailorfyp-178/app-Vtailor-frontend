import React from 'react';
import { View, ScrollView, TextInput, Text, Pressable, StyleSheet } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { ThemedText } from './themed-text';

const CustomerHome = () => {
  const { user } = useAuth();

  const quickActions = [
    { label: 'Customize', icon: '🎨' },
    { label: 'Measurements', icon: '📏' },
    { label: 'Find Tailors', icon: '🔍' },
  ];

  const currentOrders = [
    { id: 1, name: 'Formal Suit', tailor: 'Ahmad Tailor', status: 'In Progress', daysLeft: 5, price: 8500 },
    { id: 2, name: 'Wedding Sherwani', tailor: 'Master Tailors', status: 'Cutting', daysLeft: 12, price: 25000 },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <ThemedText style={styles.welcomeText}>Welcome back,</ThemedText>
          <ThemedText style={styles.userName}>{user?.name || 'Customer'}</ThemedText>
        </View>
        <ThemedText style={styles.notificationBell}>🔔</ThemedText>
      </View>

      <View style={styles.searchContainer}>
        <ThemedText style={styles.searchIcon}>🔍</ThemedText>
        <TextInput
          placeholder="Search tailors, styles..."
          placeholderTextColor="#9ca3af"
          style={styles.searchInput}
        />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Quick Actions</ThemedText>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <Pressable key={action.label} style={styles.actionButton}>
                <Text style={styles.actionIcon}>{action.icon}</Text>
                <ThemedText style={styles.actionLabel}>{action.label}</ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Current Orders</ThemedText>
            <ThemedText style={styles.viewAll}>View All →</ThemedText>
          </View>
          <View style={styles.ordersList}>
            {currentOrders.map((order) => (
              <View key={order.id} style={styles.orderCard}>
                <View style={styles.orderTop}>
                  <View>
                    <ThemedText style={styles.orderName}>{order.name}</ThemedText>
                    <ThemedText style={styles.orderTailor}>{order.tailor}</ThemedText>
                  </View>
                  <View style={styles.statusBadge}>
                    <ThemedText style={styles.statusText}>{order.status}</ThemedText>
                  </View>
                </View>
                <View style={styles.orderBottom}>
                  <ThemedText style={styles.daysLeft}>⏱️ {order.daysLeft} days left</ThemedText>
                  <ThemedText style={styles.price}>Rs. {order.price.toLocaleString()}</ThemedText>
                </View>
              </View>
            ))}
          </View>
        </View>

        <Pressable style={styles.aiCard}>
          <Text style={styles.aiIcon}>🤖</Text>
          <View style={styles.aiContent}>
            <ThemedText style={styles.aiTitle}>AI Style Assistant</ThemedText>
            <ThemedText style={styles.aiDesc}>Get personalized suggestions</ThemedText>
          </View>
          <ThemedText style={styles.arrow}>→</ThemedText>
        </Pressable>

        <View style={styles.tipsCard}>
          <Text style={styles.tipsIcon}>💬</Text>
          <View>
            <ThemedText style={styles.tipsTitle}>Need Assistance?</ThemedText>
            <ThemedText style={styles.tipsDesc}>Use direct chat with your tailor</ThemedText>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 40, paddingBottom: 16, backgroundColor: '#0ea5a4' },
  welcomeText: { color: '#ffffff', fontSize: 12, opacity: 0.8, marginBottom: 4 },
  userName: { color: '#ffffff', fontSize: 20, fontWeight: '600' },
  notificationBell: { fontSize: 20 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginVertical: 16, paddingHorizontal: 12, backgroundColor: '#f3f4f6', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, color: '#000000', fontSize: 14 },
  scrollView: { flex: 1, paddingHorizontal: 16 },
  section: { marginTop: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  viewAll: { fontSize: 12, color: '#0ea5a4', fontWeight: '500' },
  quickActionsGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  actionButton: { flex: 1, alignItems: 'center', padding: 16, backgroundColor: '#f3f4f6', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  actionIcon: { fontSize: 24, marginBottom: 8 },
  actionLabel: { fontSize: 11, textAlign: 'center', fontWeight: '500' },
  ordersList: { gap: 12 },
  orderCard: { padding: 14, backgroundColor: '#f9fafb', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 8 },
  orderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  orderName: { fontSize: 14, fontWeight: '600' },
  orderTailor: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#fef08a', borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: '500', color: '#92400e' },
  orderBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  daysLeft: { fontSize: 12, color: '#6b7280' },
  price: { fontSize: 12, fontWeight: '600' },
  aiCard: { flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: '#f0fdfa', borderRadius: 12, borderWidth: 1, borderColor: '#ccfbf1', marginTop: 20, marginBottom: 12 },
  aiIcon: { fontSize: 24, marginRight: 12 },
  aiContent: { flex: 1 },
  aiTitle: { fontSize: 14, fontWeight: '600' },
  aiDesc: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  arrow: { fontSize: 16, color: '#6b7280' },
  tipsCard: { flexDirection: 'row', padding: 14, backgroundColor: '#f3f4f6', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 12 },
  tipsIcon: { fontSize: 18, marginRight: 12 },
  tipsTitle: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  tipsDesc: { fontSize: 11, color: '#6b7280' },
  bottomPadding: { height: 100 },
});

export default CustomerHome;
