import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const transactions = [
  { id: 1, type: 'credit', description: 'Payment from Ali Hassan', amount: 8500, date: '25 Dec' },
  { id: 2, type: 'debit', description: 'Late Delivery Penalty', amount: 425, date: '24 Dec', isPenalty: true },
  { id: 3, type: 'credit', description: 'Payment from Zara Khan', amount: 12000, date: '22 Dec' },
  { id: 4, type: 'credit', description: 'Payment from Fatima Bibi', amount: 6000, date: '18 Dec' },
  { id: 5, type: 'debit', description: 'Withdrawal to Bank', amount: 50000, date: '15 Dec' },
];

export default function TailorWallet() {
  const bg = useThemeColor({}, 'background');
  const cardBg = useThemeColor({}, 'card');
  const tint = useThemeColor({}, 'tint');
  const router = useRouter();

  return (
    <ProtectedRoute requiredRole="tailor">
      <View style={[styles.container, { backgroundColor: bg }]}> 
        <View style={styles.headerGradient}>
          <ThemedText style={styles.headerTitle}>My Wallet</ThemedText>

          <View style={[styles.balanceCard, { backgroundColor: cardBg, borderColor: '#f3d1de' }]}> 
            <View style={styles.balanceRow}>
              <View style={[styles.iconBox, { backgroundColor: '#ffd9e6' }]}>
                <Text style={{ fontSize: 18, color: tint }}>💳</Text>
              </View>
              <View>
                <Text style={styles.balanceLabel}>Available Balance</Text>
                <Text style={styles.balanceAmount}>Rs. 45,575</Text>
              </View>
            </View>

            <View style={styles.warningBox}>
              <Text style={styles.warningIcon}>⚠️</Text>
              <Text style={styles.warningText}>Maintain minimum Rs. 5,000 to accept new orders</Text>
            </View>

            <View style={styles.actionsRow}>
              <Pressable style={[styles.actionButton, styles.primaryButton]} onPress={() => {}}>
                <Text style={styles.primaryButtonText}>Withdraw</Text>
              </Pressable>
              <Pressable style={[styles.actionButton, styles.outlineButton]} onPress={() => {}}>
                <Text style={styles.outlineButtonText}>Add Money</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <ScrollView style={styles.listScroll} contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
          {/* Delivery & Penalty Section */}
          <Pressable 
            style={[styles.deliveryPenaltyCard, { backgroundColor: cardBg }]}
            onPress={() => router.push('/tailor/delivery-penalty')}
          >
            <View style={styles.deliveryPenaltyIcon}>
              <Ionicons name="time-outline" size={24} color="#ef4444" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.deliveryPenaltyTitle}>Delivery & Penalty</Text>
              <Text style={styles.deliveryPenaltySubtitle}>Track orders, deadlines & penalties</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </Pressable>

          <View style={styles.listHeaderRow}>
            <ThemedText style={styles.sectionTitle}>Transaction History</ThemedText>
            <Text style={styles.muted}>🕘</Text>
          </View>

          {transactions.map((tx) => (
            <View key={tx.id} style={[styles.txCard, tx.isPenalty ? styles.txPenalty : null, { backgroundColor: cardBg }]}> 
              <View style={[styles.txIcon, tx.isPenalty ? { backgroundColor: '#fde8ea' } : tx.type === 'credit' ? { backgroundColor: '#ecfdf5' } : { backgroundColor: '#fff7ed' }]}>
                <Text>{tx.isPenalty ? '⚠️' : tx.type === 'credit' ? '⬇️' : '⬆️'}</Text>
              </View>
              <View style={{ flex: 1, marginHorizontal: 12 }}>
                <Text style={styles.txDesc}>{tx.description}</Text>
                <Text style={styles.txDate}>{tx.date}</Text>
              </View>
              <Text style={[styles.txAmount, tx.isPenalty ? { color: '#ef4444' } : tx.type === 'credit' ? { color: '#059669' } : { color: '#111827' }]}>
                {tx.type === 'credit' ? '+' : '-'}Rs. {tx.amount.toLocaleString()}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 12, backgroundColor: '#fff0f6', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#6b21a8', marginBottom: 12 },
  balanceCard: { padding: 14, borderRadius: 12, borderWidth: 1 },
  balanceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  iconBox: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  balanceLabel: { color: '#6b7280', fontSize: 12 },
  balanceAmount: { fontSize: 24, fontWeight: '800', color: '#111827' },
  warningBox: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 10, backgroundColor: '#fff1f4', borderWidth: 1, borderColor: '#fdecef', marginBottom: 10 },
  warningIcon: { marginRight: 8 },
  warningText: { color: '#6b7280', fontSize: 12 },
  actionsRow: { flexDirection: 'row', gap: 8 },
  actionButton: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  primaryButton: { backgroundColor: '#ec4899' },
  primaryButtonText: { color: '#fff', fontWeight: '700' },
  outlineButton: { borderWidth: 1, borderColor: '#ec4899', backgroundColor: 'transparent' },
  outlineButtonText: { color: '#ec4899', fontWeight: '700' },
  listScroll: { flex: 1 },
  listHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4, marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  muted: { color: '#6b7280' },
  txCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#eaeaea' },
  txIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  txDesc: { fontSize: 14, fontWeight: '600' },
  txDate: { fontSize: 12, color: '#6b7280' },
  txAmount: { fontWeight: '700' },
  txPenalty: { borderColor: '#fde8ea' },
  deliveryPenaltyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#fee2e2',
    backgroundColor: '#fef2f2',
  },
  deliveryPenaltyIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deliveryPenaltyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  deliveryPenaltySubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
});

