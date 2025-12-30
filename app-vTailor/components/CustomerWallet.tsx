import React from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { ThemedText } from './themed-text';

const CustomerWallet = () => {
  const transactions = [
    { id: 1, type: 'debit', description: 'Payment to Ahmad Tailor', amount: 8500, date: '25 Dec' },
    { id: 2, type: 'credit', description: 'Wallet Top-up', amount: 20000, date: '20 Dec' },
    { id: 3, type: 'debit', description: 'Payment to Classic Stitches', amount: 3500, date: '15 Dec' },
    { id: 4, type: 'credit', description: 'Refund - Order Cancelled', amount: 5000, date: '10 Dec' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.headerSection}>
        <ThemedText style={styles.headerTitle}>My Wallet</ThemedText>
        <View style={styles.balanceCard}>
          <View style={styles.balanceTop}>
            <View style={styles.walletIcon}><ThemedText style={styles.walletEmoji}>💰</ThemedText></View>
            <View>
              <ThemedText style={styles.balanceLabel}>Available Balance</ThemedText>
              <ThemedText style={styles.balanceAmount}>Rs. 15,500</ThemedText>
            </View>
          </View>
          <Pressable style={styles.addMoneyBtn}>
            <ThemedText style={styles.addMoneyText}>+ Add Money</ThemedText>
          </Pressable>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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
  headerSection: { paddingHorizontal: 16, paddingTop: 40, paddingBottom: 20, backgroundColor: '#0ea5a4', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#ffffff', marginBottom: 20 },
  balanceCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16 },
  balanceTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  walletIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#fbbf24', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  walletEmoji: { fontSize: 24 },
  balanceLabel: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  balanceAmount: { fontSize: 24, fontWeight: '700', color: '#000000' },
  addMoneyBtn: { paddingVertical: 12, paddingHorizontal: 16, backgroundColor: '#0ea5a4', borderRadius: 12, alignItems: 'center' },
  addMoneyText: { color: '#ffffff', fontWeight: '600', fontSize: 14 },
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
});

export default CustomerWallet;
