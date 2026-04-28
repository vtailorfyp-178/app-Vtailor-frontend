import { useThemeColor } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ThemedText } from './themed-text';
import { useAuth } from '@/contexts/AuthContext';
import { getWalletSummary, WalletSummary } from '@/services/walletApi';
import { SURFACE_MUTED, TEXT_DARK, UI } from '@/constants/ui';

type PenaltyOrder = {
  id: string;
  customerName: string;
  orderAmount: number;
  lateDays: number;
};

const toNumber = (value: unknown) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

const toText = (value: unknown, fallback = 'Unknown') => {
  if (typeof value === 'string' && value.trim()) return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return fallback;
};

const normalizePenaltyOrders = (value: unknown): PenaltyOrder[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((order, index) => {
      if (!order || typeof order !== 'object') return null;

      const item = order as Record<string, unknown>;
      const lateDays = toNumber(item.lateDays ?? item.daysLate);
      if (lateDays <= 0) return null;

      return {
        id: toText(item.id ?? item.orderId, `Order ${index + 1}`),
        customerName: toText(item.customerName ?? item.tailorName, 'Customer'),
        orderAmount: toNumber(item.orderAmount ?? item.orderPrice ?? item.amount),
        lateDays,
      };
    })
    .filter((order): order is PenaltyOrder => Boolean(order));
};

const CustomerWallet = () => {
  const [penalties, setPenalties] = useState<PenaltyOrder[]>([]);
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const { token } = useAuth();

  // Load penalty data from AsyncStorage
  useEffect(() => {
    const loadPenalties = async () => {
      try {
        const data = await AsyncStorage.getItem('vtailor_penalty_orders');
        if (data) {
          const orders = JSON.parse(data);
          setPenalties(normalizePenaltyOrders(orders));
        } else {
          setPenalties([]);
        }
      } catch {
        setPenalties([]);
      }
    };
    loadPenalties();
  }, []);

  const tint = useThemeColor({}, 'tint');
  const card = useThemeColor({}, 'card');
  const inputBorder = useThemeColor({}, 'inputBorder');
  const router = useRouter();

  const [mode, setMode] = useState<'add' | 'withdraw'>('add');

  const loadWallet = React.useCallback(async () => {
    if (!token) return;
    try {
      const data = await getWalletSummary(token, 30);
      setWallet(data);
    } catch {
      // keep existing UI state on transient API failures
    }
  }, [token]);

  useEffect(() => {
    loadWallet();
  }, [loadWallet]);

  useFocusEffect(
    React.useCallback(() => {
      loadWallet();
      const timer = setInterval(loadWallet, 10000);
      return () => clearInterval(timer);
    }, [loadWallet])
  );

  return (
    <View style={styles.container}> 
      <View style={[styles.headerSection, { backgroundColor: tint }] }>
        <ThemedText style={[styles.headerTitle, { color: '#fff' }]}>My Wallet</ThemedText>
        <View style={[styles.balanceCard, { backgroundColor: card }] }>
          <View style={styles.balanceTop}>
            <View style={[styles.walletIcon, { backgroundColor: '#fef3c7' }]}>
              <Ionicons name="wallet-outline" size={25} color="#d97706" />
            </View>
            <View>
              <ThemedText style={styles.balanceLabel}>Available Balance</ThemedText>
              <ThemedText style={styles.balanceAmount}>Rs. {(wallet?.balance ?? 0).toLocaleString()}</ThemedText>
            </View>
          </View>
          <View style={styles.actionRow}>
            <Pressable
              onPress={() => {
                setMode('withdraw');
                router.push({ pathname: '/wallet-payment-method', params: { transactionType: 'withdraw', role: 'customer' } });
              }}
              style={[
                styles.tabBtn,
                { backgroundColor: mode === 'withdraw' ? tint : 'transparent', borderWidth: mode === 'withdraw' ? 0 : 1, borderColor: inputBorder },
              ]}
            >
              <ThemedText style={[styles.tabBtnText, mode === 'withdraw' ? { color: '#fff' } : { color: tint }]}>- Withdraw</ThemedText>
            </Pressable>

            <Pressable
              onPress={() => {
                setMode('add');
                router.push({ pathname: '/wallet-payment-method', params: { transactionType: 'add', role: 'customer' } });
              }}
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
        {/* Delivery Status & Penalty Information Section */}
        <View style={styles.deliverySection}>
          <Pressable 
            style={[styles.deliveryStatusCard, { backgroundColor: card, borderColor: inputBorder }]}
            onPress={() => router.push('/customer/delivery-penalty-details')}
          >
            <View style={styles.deliveryStatusIcon}>
              <Ionicons name="cube-outline" size={26} color="#3b82f6" />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.deliveryStatusTitle}>Delivery Status & Penalty Information</Text>
              <Text style={styles.deliveryStatusSubtitle}>Track orders, delivery dates & penalty details</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </Pressable>
        </View>

        {/* Penalty Module */}
        {penalties.length > 0 && (
          <View style={styles.penaltySection}>
            <View style={styles.penaltySectionHeader}>
              <ThemedText style={styles.penaltySectionTitle}>⏰ Tailor Penalty Updates</ThemedText>
              <ThemedText style={styles.penaltySubtitle}>2% deduction per day late</ThemedText>
            </View>
            
            {penalties.map((order) => {
              const penaltyPercent = order.lateDays * 2;
              const penaltyAmount = (order.orderAmount * penaltyPercent) / 100;
              const updatedAmount = order.orderAmount - penaltyAmount;

              return (
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
                  <ThemedText style={styles.penaltyAmount}>Rs {order.orderAmount.toLocaleString()}</ThemedText>
                </View>

                {/* Per Day Deduction */}
                <View style={styles.penaltyDetailRow}>
                  <ThemedText style={styles.penaltyLabel}>Deduction (2% × {order.lateDays} days)</ThemedText>
                  <ThemedText style={[styles.penaltyAmount, { color: '#ef4444' }]}>
                    - Rs {penaltyAmount.toLocaleString()}
                  </ThemedText>
                </View>

                {/* Updated Amount (What tailor gets) */}
                <View style={styles.penaltyDivider} />
                <View style={styles.penaltyDetailRow}>
                  <ThemedText style={[styles.penaltyLabel, { fontWeight: '700', color: '#111827' }]}>Tailor Updated Amount</ThemedText>
                  <ThemedText style={[styles.penaltyAmount, { color: '#f59e0b', fontWeight: '700', fontSize: 16 }]}>
                    Rs {updatedAmount.toLocaleString()}
                  </ThemedText>
                </View>

                {/* Breakdown Info */}
                <View style={styles.penaltyBreakdown}>
                  <ThemedText style={styles.breakdownText}>
                    Per day rate: 2% × {order.lateDays} = {penaltyPercent}%
                  </ThemedText>
                </View>
              </View>
              );
            })}
          </View>
        )}

        {/* Transaction Section */}
        <View style={styles.transactionSection}>
          <View style={styles.transactionHeader}>
            <ThemedText style={styles.transactionTitle}>Transaction History</ThemedText>
            <Ionicons name="receipt-outline" size={18} color={tint} />
          </View>
          <View style={styles.transactionsList}>
            {(wallet?.transactions ?? []).map((tx) => (
              <View key={tx.id} style={[styles.transactionCard, { borderColor: inputBorder }]}>
                <View style={[styles.txIcon, { backgroundColor: tx.transaction_type === 'add' ? '#d1fae5' : '#fee2e2' }]}>
                  <Ionicons name={tx.transaction_type === 'add' ? 'arrow-down-outline' : 'arrow-up-outline'} size={18} color={tx.transaction_type === 'add' ? '#059669' : '#dc2626'} />
                </View>
                <View style={styles.txContent}>
                  <ThemedText style={styles.txDescription}>{tx.transaction_type === 'add' ? `Wallet Top-up via ${tx.payment_method}` : `Withdrawal via ${tx.payment_method}`}</ThemedText>
                  <ThemedText style={styles.txDate}>{new Date(tx.created_at).toLocaleString()}</ThemedText>
                  <ThemedText style={styles.txDate}>Account: {tx.phone || 'Not provided'}</ThemedText>
                </View>
                <ThemedText style={[styles.txAmount, { color: tx.transaction_type === 'add' ? '#14b8a6' : '#000000' }]}>
                  {tx.transaction_type === 'add' ? '+' : '-'}Rs. {tx.amount.toLocaleString()}
                </ThemedText>
              </View>
            ))}
            {(wallet?.transactions?.length ?? 0) === 0 && (
              <View style={[styles.transactionCard, { borderColor: inputBorder }]}>
                <ThemedText style={styles.txDate}>No transactions yet</ThemedText>
              </View>
            )}
          </View>
        </View>
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SURFACE_MUTED },
  headerSection: { margin: 16, paddingHorizontal: 18, paddingTop: 24, paddingBottom: 18, borderRadius: 24, ...UI.shadow },
  headerTitle: { fontSize: 24, fontWeight: '900', marginBottom: 20 },
  balanceCard: { borderRadius: 20, padding: 16, ...UI.softShadow },
  balanceTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  walletIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#fbbf24', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  balanceLabel: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  balanceAmount: { fontSize: 26, fontWeight: '900', color: TEXT_DARK },
  addMoneyBtn: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, alignItems: 'center' },
  addMoneyText: { color: '#ffffff', fontWeight: '600', fontSize: 14 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  tabBtn: { flex: 1, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 14, alignItems: 'center' },
  tabBtnText: { fontWeight: '800', fontSize: 14 },
  scrollView: { flex: 1 },
  transactionSection: { paddingHorizontal: 16, paddingTop: 24 },
  transactionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  transactionTitle: { fontSize: 17, fontWeight: '900', color: TEXT_DARK },
  transactionsList: { gap: 12 },
  transactionCard: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, ...UI.softShadow },
  txIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
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
    borderRadius: 18, 
    padding: 14, 
    marginBottom: 12, 
    borderLeftWidth: 4, 
    borderLeftColor: '#ef4444',
    ...UI.softShadow,
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
    borderRadius: 999, 
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
  // Delivery Status & Penalty Information Styles
  deliverySection: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 0 },
  deliveryStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 1,
    backgroundColor: '#eff6ff',
    ...UI.softShadow,
  },
  deliveryStatusIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deliveryStatusTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  deliveryStatusSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
});

export default CustomerWallet;
