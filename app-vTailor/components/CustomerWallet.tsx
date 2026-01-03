import { useThemeColor } from '@/hooks/use-theme-color';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { ThemedText } from './themed-text';

const CustomerWallet = () => {
  const transactions = [
    { id: 1, type: 'debit', description: 'Payment to Ahmad Tailor', amount: 8500, date: '25 Dec' },
    { id: 2, type: 'credit', description: 'Wallet Top-up', amount: 20000, date: '20 Dec' },
    { id: 3, type: 'debit', description: 'Payment to Classic Stitches', amount: 3500, date: '15 Dec' },
    { id: 4, type: 'credit', description: 'Refund - Order Cancelled', amount: 5000, date: '10 Dec' },
  ];

  const [penalties, setPenalties] = useState<any[]>([]);

  // Load penalty data from AsyncStorage
  useEffect(() => {
    const loadPenalties = async () => {
      try {
        const data = await AsyncStorage.getItem('vtailor_penalty_orders');
        if (data) {
          const orders = JSON.parse(data);
          // Filter only late orders with penalties
          const penaltyOrders = orders.filter((o: any) => o.lateDays && o.lateDays > 0);
          setPenalties(penaltyOrders);
        }
      } catch (error) {
        // fail silently
      }
    };
    loadPenalties();
  }, []);

  const background = useThemeColor({}, 'background');
  const tint = useThemeColor({}, 'tint');
  const card = useThemeColor({}, 'card');
  const inputBorder = useThemeColor({}, 'inputBorder');

  const [mode, setMode] = useState<'add' | 'withdraw'>('add');

  return (
    <View style={[styles.container, { backgroundColor: background }]}> 
      <View style={[styles.headerSection, { backgroundColor: tint }] }>
        <ThemedText style={[styles.headerTitle, { color: '#fff' }]}>My Wallet</ThemedText>
        <View style={[styles.balanceCard, { backgroundColor: card }] }>
          <View style={styles.balanceTop}>
            <View style={[styles.walletIcon, { backgroundColor: '#fbbf24' }]}><ThemedText style={styles.walletEmoji}>💰</ThemedText></View>
            <View>
              <ThemedText style={styles.balanceLabel}>Available Balance</ThemedText>
              <ThemedText style={styles.balanceAmount}>Rs. 15,500</ThemedText>
            </View>
          </View>
          <View style={styles.actionRow}>
            <Pressable
              onPress={() => setMode('withdraw')}
              style={[
                styles.tabBtn,
                { backgroundColor: mode === 'withdraw' ? tint : 'transparent', borderWidth: mode === 'withdraw' ? 0 : 1, borderColor: inputBorder },
              ]}
            >
              <ThemedText style={[styles.tabBtnText, mode === 'withdraw' ? { color: '#fff' } : { color: tint }]}>- Withdraw</ThemedText>
            </Pressable>

            <Pressable
              onPress={() => setMode('add')}
              style={[
                styles.tabBtn,
                { backgroundColor: mode === 'add' ? tint : 'transparent', borderWidth: mode === 'add' ? 0 : 1, borderColor: inputBorder },
              ]}
            >
              <ThemedText style={[styles.tabBtnText, mode === 'add' ? { color: '#fff' } : { color: tint }]}>+ Add Money</ThemedText>
            </Pressable>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Penalty Module */}
        {penalties.length > 0 && (
          <View style={styles.penaltySection}>
            <View style={styles.penaltySectionHeader}>
              <ThemedText style={styles.penaltySectionTitle}>⏰ Tailor Penalty Updates</ThemedText>
              <ThemedText style={styles.penaltySubtitle}>2% deduction per day late</ThemedText>
            </View>
            
            {penalties.map((order: any) => (
              <View key={order.id} style={styles.penaltyCard}>
                {/* Order Info */}
                <View style={styles.penaltyCardHeader}>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={styles.penaltyOrderId}>{order.id}</ThemedText>
                    <ThemedText style={styles.penaltyTailorName}>{order.customerName}</ThemedText>
                  </View>
                  <View style={[styles.lateDaysBadge, { backgroundColor: '#fee2e2' }]}>
                    <ThemedText style={styles.lateDaysText}>{order.lateDays || 0} Days Late</ThemedText>
                  </View>
                </View>

                {/* Original Amount */}
                <View style={styles.penaltyDetailRow}>
                  <ThemedText style={styles.penaltyLabel}>Original Amount</ThemedText>
                  <ThemedText style={styles.penaltyAmount}>Rs {order.orderAmount?.toLocaleString() || 0}</ThemedText>
                </View>

                {/* Per Day Deduction */}
                <View style={styles.penaltyDetailRow}>
                  <ThemedText style={styles.penaltyLabel}>Deduction (2% × {order.lateDays || 0} days)</ThemedText>
                  <ThemedText style={[styles.penaltyAmount, { color: '#ef4444' }]}>
                    - Rs {((order.orderAmount || 0) * ((order.lateDays || 0) * 2)) / 100}
                  </ThemedText>
                </View>

                {/* Updated Amount (What tailor gets) */}
                <View style={styles.penaltyDivider} />
                <View style={styles.penaltyDetailRow}>
                  <ThemedText style={[styles.penaltyLabel, { fontWeight: '700', color: '#111827' }]}>Tailor Updated Amount</ThemedText>
                  <ThemedText style={[styles.penaltyAmount, { color: '#f59e0b', fontWeight: '700', fontSize: 16 }]}>
                    Rs {(order.orderAmount || 0) - (((order.orderAmount || 0) * ((order.lateDays || 0) * 2)) / 100)}
                  </ThemedText>
                </View>

                {/* Breakdown Info */}
                <View style={styles.penaltyBreakdown}>
                  <ThemedText style={styles.breakdownText}>
                    Per day rate: 2% × {order.lateDays || 0} = {(order.lateDays || 0) * 2}%
                  </ThemedText>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Transaction Section */}
        <View style={styles.transactionSection}>
          <View style={styles.transactionHeader}>
            <ThemedText style={styles.transactionTitle}>Transaction History</ThemedText>
            <ThemedText style={styles.historyIcon}>📜</ThemedText>
          </View>
          <View style={styles.transactionsList}>
            {transactions.map((tx) => (
              <View key={tx.id} style={styles.transactionCard}>
                <View style={[styles.txIcon, { backgroundColor: tx.type === 'credit' ? '#d1fae5' : '#fee2e2' }]}>
                  <ThemedText style={styles.txArrowIcon}>{tx.type === 'credit' ? '↓' : '↑'}</ThemedText>
                </View>
                <View style={styles.txContent}>
                  <ThemedText style={styles.txDescription}>{tx.description}</ThemedText>
                  <ThemedText style={styles.txDate}>{tx.date}</ThemedText>
                </View>
                <ThemedText style={[styles.txAmount, { color: tx.type === 'credit' ? '#14b8a6' : '#000000' }]}>
                  {tx.type === 'credit' ? '+' : '-'}Rs. {tx.amount.toLocaleString()}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  headerSection: { paddingHorizontal: 16, paddingTop: 40, paddingBottom: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTitle: { fontSize: 22, fontWeight: '700', marginBottom: 20 },
  balanceCard: { borderRadius: 16, padding: 16 },
  balanceTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  walletIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#fbbf24', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  walletEmoji: { fontSize: 24 },
  balanceLabel: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  balanceAmount: { fontSize: 24, fontWeight: '700', color: '#000000' },
  addMoneyBtn: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, alignItems: 'center' },
  addMoneyText: { color: '#ffffff', fontWeight: '600', fontSize: 14 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  tabBtn: { flex: 1, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, alignItems: 'center' },
  tabBtnText: { fontWeight: '600', fontSize: 14 },
  scrollView: { flex: 1 },
  transactionSection: { paddingHorizontal: 16, paddingTop: 24 },
  transactionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  transactionTitle: { fontSize: 16, fontWeight: '600' },
  historyIcon: { fontSize: 16 },
  transactionsList: { gap: 12 },
  transactionCard: { flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: '#f9fafb', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  txIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  txArrowIcon: { fontSize: 18, fontWeight: '600' },
  txContent: { flex: 1 },
  txDescription: { fontSize: 13, fontWeight: '500', marginBottom: 2 },
  txDate: { fontSize: 11, color: '#6b7280' },
  txAmount: { fontSize: 13, fontWeight: '600' },
  bottomPadding: { height: 100 },
  // Penalty Panel Styles
  penaltySection: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  penaltySectionHeader: { marginBottom: 16 },
  penaltySectionTitle: { fontSize: 16, fontWeight: '700', color: '#ef4444', marginBottom: 4 },
  penaltySubtitle: { fontSize: 12, color: '#6b7280' },
  penaltyCard: { 
    backgroundColor: '#fef2f2', 
    borderRadius: 12, 
    padding: 14, 
    marginBottom: 12, 
    borderLeftWidth: 4, 
    borderLeftColor: '#ef4444' 
  },
  penaltyCardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    marginBottom: 12 
  },
  penaltyOrderId: { 
    fontSize: 13, 
    fontWeight: '700', 
    color: '#111827' 
  },
  penaltyTailorName: { 
    fontSize: 12, 
    color: '#6b7280', 
    marginTop: 4 
  },
  lateDaysBadge: { 
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    borderRadius: 8, 
    backgroundColor: '#fee2e2' 
  },
  lateDaysText: { 
    fontSize: 11, 
    fontWeight: '700', 
    color: '#dc2626' 
  },
  penaltyDetailRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 10 
  },
  penaltyLabel: { 
    fontSize: 12, 
    color: '#6b7280', 
    fontWeight: '500' 
  },
  penaltyAmount: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: '#111827' 
  },
  penaltyDivider: { 
    height: 1, 
    backgroundColor: '#fecaca', 
    marginVertical: 10 
  },
  penaltyBreakdown: { 
    marginTop: 10, 
    paddingTop: 10, 
    borderTopWidth: 1, 
    borderTopColor: '#fecaca' 
  },
  breakdownText: { 
    fontSize: 11, 
    color: '#991b1b', 
    fontWeight: '500', 
    textAlign: 'center' 
  },
});

export default CustomerWallet;
