import { CustomerScreenHeader } from '@/components/customer/CustomerScreenHeader';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ROLE_COLORS } from '@/constants/ui';
import { useFocusEffect, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getWalletSummary, WalletSummary } from '@/services/walletApi';
import { Ionicons } from '@expo/vector-icons';
import { SURFACE_MUTED, TEXT_DARK, UI } from '@/constants/ui';

export default function TailorWallet() {
  const cardBg = useThemeColor({}, 'card');
  const router = useRouter();
  const { token } = useAuth();
  const [wallet, setWallet] = React.useState<WalletSummary | null>(null);

  const loadWallet = React.useCallback(async () => {
    if (!token) return;
    try {
      const data = await getWalletSummary(token, 30);
      setWallet(data);
    } catch {
      // keep existing UI when API call fails
    }
  }, [token]);

  React.useEffect(() => {
    loadWallet();
  }, [loadWallet]);

  useFocusEffect(
    React.useCallback(() => {
      loadWallet();
      const timer = setInterval(loadWallet, 10000);
      return () => clearInterval(timer);
    }, [loadWallet]),
  );

  const tailorTint = ROLE_COLORS.tailor.primary;

  return (
      <View style={styles.container}>
        <CustomerScreenHeader
          eyebrow="Earnings"
          title="My Wallet"
          tint={tailorTint}
          footer={
            <View style={[styles.balanceCard, { backgroundColor: cardBg, borderColor: '#f3d1de' }]}>
              <View style={styles.balanceRow}>
                <View style={[styles.iconBox, { backgroundColor: '#ffd9e6' }]}>
                  <Ionicons name="wallet-outline" size={22} color={tailorTint} />
                </View>
                <View>
                  <Text style={styles.balanceLabel}>Available Balance</Text>
                  <Text style={styles.balanceAmount}>Rs. {(wallet?.balance ?? 0).toLocaleString()}</Text>
                </View>
              </View>

              <View style={styles.warningBox}>
                <Ionicons name="alert-circle-outline" size={18} color={tailorTint} style={styles.warningIcon} />
                <Text style={styles.warningText} numberOfLines={3}>
                  Maintain minimum Rs. 5,000 to accept new orders
                </Text>
              </View>

              <View style={styles.actionsRow}>
                <Pressable
                  style={[styles.actionButton, styles.primaryButton]}
                  onPress={() => router.push({ pathname: '/wallet-payment-method', params: { transactionType: 'withdraw', role: 'tailor' } })}
                >
                  <Text style={styles.primaryButtonText}>Withdraw</Text>
                </Pressable>
                <Pressable
                  style={[styles.actionButton, styles.outlineButton]}
                  onPress={() => router.push({ pathname: '/wallet-payment-method', params: { transactionType: 'add', role: 'tailor' } })}
                >
                  <Text style={styles.outlineButtonText}>Add Money</Text>
                </Pressable>
              </View>
            </View>
          }
        />

        <ScrollView style={styles.listScroll} contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
          <View style={styles.listHeaderRow}>
            <ThemedText style={styles.sectionTitle}>Transaction History</ThemedText>
            <Ionicons name="time-outline" size={18} color="#6b7280" />
          </View>

          {(wallet?.transactions ?? []).map((tx) => (
            <View key={tx.id} style={[styles.txCard, { backgroundColor: cardBg }]}>
              <View style={[styles.txIcon, tx.transaction_type === 'add' ? { backgroundColor: '#ecfdf5' } : { backgroundColor: '#fff7ed' }]}>
                <Ionicons name={tx.transaction_type === 'add' ? 'arrow-down-outline' : 'arrow-up-outline'} size={18} color={tx.transaction_type === 'add' ? '#059669' : '#d97706'} />
              </View>
              <View style={{ flex: 1, marginHorizontal: 12 }}>
                <Text style={styles.txDesc}>{tx.transaction_type === 'add' ? `Wallet Top-up via ${tx.payment_method}` : `Withdrawal via ${tx.payment_method}`}</Text>
                <Text style={styles.txDate}>{new Date(tx.created_at).toLocaleString()}</Text>
                <Text style={styles.txDate}>Account: {tx.phone || 'Not provided'}</Text>
              </View>
              <Text style={[styles.txAmount, tx.transaction_type === 'add' ? { color: '#059669' } : { color: '#111827' }]}>
                {tx.transaction_type === 'add' ? '+' : '-'}Rs. {tx.amount.toLocaleString()}
              </Text>
            </View>
          ))}

          {(wallet?.transactions?.length ?? 0) === 0 && (
            <View style={[styles.txCard, { backgroundColor: cardBg }]}>
              <Text style={styles.txDate}>No transactions yet</Text>
            </View>
          )}
        </ScrollView>
      </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SURFACE_MUTED },
  balanceCard: { padding: 16, borderRadius: 20, borderWidth: 1, ...UI.softShadow },
  balanceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  iconBox: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  balanceLabel: { color: '#6b7280', fontSize: 12 },
  balanceAmount: { fontSize: 26, fontWeight: '900', color: TEXT_DARK },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#fff1f4',
    borderWidth: 1,
    borderColor: '#fdecef',
    marginBottom: 10,
  },
  warningIcon: { marginRight: 8, marginTop: 1 },
  warningText: { flex: 1, flexShrink: 1, color: '#6b7280', fontSize: 12, lineHeight: 17 },
  actionsRow: { flexDirection: 'row', gap: 8 },
  actionButton: { flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  primaryButton: { backgroundColor: '#ec4899' },
  primaryButtonText: { color: '#fff', fontWeight: '700' },
  outlineButton: { borderWidth: 1, borderColor: '#ec4899', backgroundColor: 'transparent' },
  outlineButtonText: { color: '#ec4899', fontWeight: '700' },
  listScroll: { flex: 1 },
  listHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4, marginBottom: 8 },
  sectionTitle: { fontSize: 17, fontWeight: '900', color: TEXT_DARK },
  muted: { color: '#6b7280' },
  txCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 18, marginBottom: 10, borderWidth: 1, borderColor: '#eaeaea', ...UI.softShadow },
  txIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  txDesc: { fontSize: 14, fontWeight: '600' },
  txDate: { fontSize: 12, color: '#6b7280' },
  txAmount: { fontWeight: '700' },
  txPenalty: { borderColor: '#fde8ea' },
});
