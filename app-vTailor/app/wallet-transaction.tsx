import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { confirmWalletTransaction, createWalletTransaction, getWalletSummary } from '@/services/walletApi';

const WalletTransactionScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const transactionType = (params?.transactionType as string) || 'add';
  const paymentMethod = (params?.paymentMethod as string) || 'EasyPaisa';
  const role = (params?.role as string) || 'customer';
  const { token } = useAuth();

  const startingBalance = useMemo(() => (role === 'tailor' ? 45575 : 15500), [role]);

  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState((params?.phone as string) || '');
  const [balance, setBalance] = useState(startingBalance);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [pendingTxId, setPendingTxId] = useState('');
  const [pendingUrl, setPendingUrl] = useState('');

  React.useEffect(() => {
    let mounted = true;
    const loadWallet = async () => {
      if (!token) return;
      try {
        const summary = await getWalletSummary(token, 20);
        if (mounted) setBalance(summary.balance);
      } catch {
        // keep fallback balance
      }
    };
    loadWallet();
    return () => {
      mounted = false;
    };
  }, [token]);

  const onProceed = async () => {
    if (loading || !amount.trim()) return;
    const numericAmount = parseFloat(amount) || 0;
    if (numericAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (!token) {
      setError('Please login again');
      return;
    }

    setError('');
    setLoading(true);
    setSuccess(false);
    setPendingTxId('');
    setPendingUrl('');

    try {
      const result = await createWalletTransaction(token, {
        transaction_type: transactionType === 'withdraw' ? 'withdraw' : 'add',
        amount: numericAmount,
        payment_method: paymentMethod,
        phone,
      });

      if (result.status === 'pending' && result.transaction?.id) {
        setPendingTxId(result.transaction.id);
        const url = result.next_action_url || result.transaction.payment_url || '';
        setPendingUrl(url);
        const isInternalApiUrl =
          url.includes('/app/api/v1/wallet/transactions/') ||
          url.includes('/app/api/v1/wallet/gateway/callback/');
        if (url && !isInternalApiUrl) {
          Linking.openURL(url).catch(() => {
            setError('Could not open provider payment page. Use Verify Payment after completing it.');
          });
        }
      } else {
        setBalance(result.wallet.balance);
        setAmount('');
        setSuccess(true);
      }
    } catch (e: any) {
      setError(e?.message || 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  const onVerifyPayment = async () => {
    if (!token || !pendingTxId || loading) return;
    setLoading(true);
    setError('');
    try {
      const result = await confirmWalletTransaction(token, pendingTxId);
      setBalance(result.wallet.balance);
      setPendingTxId('');
      setPendingUrl('');
      setAmount('');
      setSuccess(true);
    } catch (e: any) {
      setError(e?.message || 'Verification failed. Please complete payment and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Wallet Transaction</Text>
            <Text style={styles.subtitle}>Complete your {transactionType === 'withdraw' ? 'withdrawal' : 'top-up'} via {paymentMethod}</Text>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.rowBetween}>
            <Text style={styles.label}>Transaction Type</Text>
            <Text style={styles.value}>{transactionType === 'withdraw' ? 'Withdraw' : 'Add Money'}</Text>
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.label}>Payment Method</Text>
            <Text style={styles.value}>{paymentMethod}</Text>
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.label}>Current Balance</Text>
            <Text style={styles.value}>Rs {balance.toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.inputLabel}>Amount</Text>
          <TextInput
            placeholder="Enter amount"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            style={styles.input}
          />

          <Text style={[styles.inputLabel, { marginTop: 16 }]}>Phone Number</Text>
          <TextInput
            placeholder="03XXXXXXXXX"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            style={styles.input}
          />
        </View>

        {success && (
          <View style={styles.successBox}>
            <Ionicons name="checkmark-circle" size={22} color="#10b981" />
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.successTitle}>Transaction Successful</Text>
              <Text style={styles.successText}>Updated Balance: Rs {balance.toLocaleString()}</Text>
            </View>
          </View>
        )}

        {!!error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={20} color="#b91c1c" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {!!pendingTxId && (
          <View style={styles.pendingBox}>
            <Ionicons name="time" size={20} color="#a16207" />
            <View style={{ flex: 1 }}>
              <Text style={styles.pendingTitle}>Payment Pending</Text>
              <Text style={styles.pendingText}>Complete payment on {paymentMethod}, then tap Verify Payment.</Text>
            </View>
            {!!pendingUrl && (
              <Pressable style={styles.pendingLinkBtn} onPress={() => Linking.openURL(pendingUrl)}>
                <Text style={styles.pendingLinkText}>Open</Text>
              </Pressable>
            )}
          </View>
        )}

        <Pressable
          style={[styles.proceedBtn, (!amount.trim() || loading) && { opacity: 0.6 }]}
          disabled={!amount.trim() || loading}
          onPress={onProceed}
        >
          <Text style={styles.proceedText}>{loading ? 'Processing...' : 'Proceed Payment'}</Text>
        </Pressable>

        {!!pendingTxId && (
          <Pressable
            style={[styles.verifyBtn, loading && { opacity: 0.6 }]}
            disabled={loading}
            onPress={onVerifyPayment}
          >
            <Text style={styles.verifyText}>{loading ? 'Verifying...' : 'Verify Payment'}</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
};

export default WalletTransactionScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingTop: Platform.select({ ios: 60, android: 28, default: 28 }),
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backBtn: {
    padding: 6,
    marginRight: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 16,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  label: {
    fontSize: 13,
    color: '#6b7280',
  },
  value: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#f9fafb',
    fontSize: 14,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf3',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#15803d',
  },
  successText: {
    fontSize: 12,
    color: '#166534',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 12,
    fontWeight: '600',
  },
  pendingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fefce8',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
    marginBottom: 16,
    gap: 8,
  },
  pendingTitle: {
    color: '#854d0e',
    fontSize: 13,
    fontWeight: '700',
  },
  pendingText: {
    color: '#92400e',
    fontSize: 11,
  },
  pendingLinkBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f59e0b',
  },
  pendingLinkText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  proceedBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  proceedText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  verifyBtn: {
    backgroundColor: '#0f766e',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  verifyText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
