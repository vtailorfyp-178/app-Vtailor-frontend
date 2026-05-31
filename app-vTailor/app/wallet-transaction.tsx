import { Ionicons } from '@expo/vector-icons';
import { SURFACE_MUTED, TEXT_DARK, UI } from '@/constants/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { confirmWalletTransaction, createWalletTransaction, failWalletTransaction, getWalletSummary } from '@/services/walletApi';

type SimulationStep = 'idle' | 'connecting' | 'processing' | 'verifying' | 'success' | 'failed';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isValidPakMobile = (phone: string) => /^(03\d{9}|\+923\d{9})$/.test(phone.replace(/\s+/g, ''));

const WalletTransactionScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const transactionType = (params?.transactionType as string) || 'add';
  const paymentMethod = (params?.paymentMethod as string) || 'EasyPaisa';
  const role = (params?.role as string) || 'customer';
  const { token } = useAuth();
  const walletPath = role === 'tailor' ? '/tailor?tab=wallet' : '/customer?tab=wallet';

  const startingBalance = useMemo(() => (role === 'tailor' ? 45575 : 15500), [role]);
  const isTailor = role === 'tailor';
  const isWithdraw = transactionType === 'withdraw';
  const providerLabel = paymentMethod.trim();
  const screenTitle = isTailor ? 'Tailor Wallet Transaction' : 'Customer Wallet Transaction';
  const screenSubtitle = isTailor
    ? (isWithdraw ? 'Withdraw tailor earnings through a simulated JazzCash-style flow' : 'Add wallet funds through a simulated JazzCash-style flow')
    : (isWithdraw ? 'Withdraw customer funds through a simulated JazzCash-style flow' : 'Add money through a simulated JazzCash-style flow');
  const actionLabel = isWithdraw ? 'withdrawal' : 'top-up';

  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState((params?.phone as string) || '');
  const [balance, setBalance] = useState(startingBalance);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [pendingTxId, setPendingTxId] = useState('');
  const [receiptTxId, setReceiptTxId] = useState('');
  const [pendingUrl, setPendingUrl] = useState('');
  const [simulationStep, setSimulationStep] = useState<SimulationStep>('idle');
  const [statusText, setStatusText] = useState('');

  React.useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => {
      router.replace(walletPath as any);
    }, 900);

    return () => clearTimeout(timer);
  }, [router, success, walletPath]);

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
    if (!phone.trim()) {
      setError('Please enter a JazzCash phone number');
      return;
    }
    if (!isValidPakMobile(phone)) {
      setError('Enter a valid JazzCash phone number like 03XXXXXXXXX');
      return;
    }
    if (isWithdraw && numericAmount > balance) {
      setError('Insufficient wallet balance for withdrawal');
      return;
    }

    setError('');
    setLoading(true);
    setSuccess(false);
    setPendingTxId('');
    setReceiptTxId('');
    setPendingUrl('');
    setSimulationStep('connecting');
    setStatusText(`Connecting to ${providerLabel}...`);

    try {
      await delay(900);
      setSimulationStep('processing');
      setStatusText('Processing payment...');

      const result = await createWalletTransaction(token, {
        transaction_type: isWithdraw ? 'withdraw' : 'add',
        amount: numericAmount,
        payment_method: paymentMethod,
        phone,
      });

      if (result.status === 'pending' && result.transaction?.id) {
        setPendingTxId(result.transaction.id);
        setReceiptTxId(result.transaction.id);
        const url = result.next_action_url || result.transaction.payment_url || '';
        setPendingUrl(url);
        setSimulationStep('verifying');
        setStatusText('Verifying payment response...');

        await delay(1100);
        const confirmed = await confirmWalletTransaction(token, result.transaction.id);
        setBalance(confirmed.wallet.balance);
        setAmount('');
        setPhone('');
        setPendingTxId('');
        setPendingUrl('');
        setSuccess(true);
        setSimulationStep('success');
        setStatusText('Payment Successful');

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
        setReceiptTxId(result.transaction?.id || '');
        setSuccess(true);
        setSimulationStep('success');
        setStatusText('Payment Successful');
      }
    } catch (e: any) {
      const txIdToFail = pendingTxId || receiptTxId;
      if (txIdToFail) {
        try {
          await failWalletTransaction(token, txIdToFail, e?.message || 'JazzCash simulation failed');
        } catch {
          // ignore cleanup failure
        }
      }
      setSimulationStep('failed');
      setStatusText('Payment Failed');
      setError(e?.message || 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  const onVerifyPayment = async () => {
    if (!token || !pendingTxId || loading) return;
    setLoading(true);
    setError('');
    setSimulationStep('verifying');
    setStatusText('Verifying payment response...');
    try {
      const result = await confirmWalletTransaction(token, pendingTxId);
      setBalance(result.wallet.balance);
      setPendingTxId('');
      setPendingUrl('');
      setAmount('');
      setReceiptTxId(result.transaction?.id || pendingTxId);
      setSuccess(true);
      setSimulationStep('success');
      setStatusText('Payment Successful');
    } catch (e: any) {
      setSimulationStep('failed');
      setStatusText('Payment Failed');
      setError(e?.message || 'Verification failed. Please complete payment and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top + 10, 28) }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }} keyboardVerticalOffset={0}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.replace(walletPath as any)} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={TEXT_DARK} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{screenTitle}</Text>
          </View>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.heroIcon}>
              <Ionicons name={isWithdraw ? 'arrow-up-circle-outline' : 'add-circle-outline'} size={30} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroLabel}>{providerLabel}</Text>
              <Text style={styles.heroTitle}>{isWithdraw ? 'Withdraw funds' : 'Add wallet money'}</Text>
            </View>
          </View>
          <Text style={styles.heroSubtitle}>{screenSubtitle}</Text>
          <View style={styles.balancePill}>
            <Text style={styles.balancePillLabel}>Available Balance</Text>
            <Text style={styles.balancePillValue}>Rs {balance.toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.flowCard}>
          <View style={styles.flowRow}>
            <View style={[styles.flowDot, simulationStep !== 'idle' && styles.flowDotActive]} />
            <Text style={styles.flowText}>{statusText || `Ready to start ${actionLabel}`}</Text>
          </View>
          <Text style={styles.flowMeta}>Provider: {providerLabel} · Role: {role}</Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.rowBetween}>
            <Text style={styles.label}>Transaction Type</Text>
            <Text style={styles.value}>{isWithdraw ? 'Withdraw' : 'Add Money'}</Text>
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
          <View style={styles.inputWrap}>
            <Text style={styles.currencyPrefix}>Rs</Text>
            <TextInput
              placeholder="Enter amount"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              style={styles.input}
            />
          </View>

          <Text style={[styles.inputLabel, { marginTop: 16 }]}>Phone Number</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="call-outline" size={18} color="#9ca3af" />
            <TextInput
              placeholder="03XXXXXXXXX"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              style={styles.input}
            />
          </View>
        </View>

        {simulationStep === 'connecting' && (
          <View style={styles.statusBox}>
            <Ionicons name="phone-portrait-outline" size={20} color="#0f766e" />
            <Text style={styles.statusText}>Connecting to {providerLabel}...</Text>
          </View>
        )}

        {simulationStep === 'processing' && (
          <View style={styles.statusBox}>
            <Ionicons name="sync-outline" size={20} color="#0f766e" />
            <Text style={styles.statusText}>Processing payment...</Text>
          </View>
        )}

        {simulationStep === 'verifying' && (
          <View style={styles.statusBox}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#0f766e" />
            <Text style={styles.statusText}>Verifying payment response...</Text>
          </View>
        )}

        {success && (
          <View style={styles.successBox}>
            <Ionicons name="checkmark-circle" size={22} color="#10b981" />
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.successTitle}>Transaction Successful</Text>
              <Text style={styles.successText}>Updated Balance: Rs {balance.toLocaleString()}</Text>
              {!!receiptTxId && <Text style={styles.successText}>Transaction ID: {receiptTxId}</Text>}
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
              <Text style={styles.pendingText}>Complete payment on {paymentMethod}, then tap Verify Payment if needed.</Text>
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
          <Text style={styles.proceedText}>{loading ? 'Processing...' : `Proceed ${isWithdraw ? 'Withdrawal' : 'Payment'}`}</Text>
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
      </KeyboardAvoidingView>
    </View>
  );
};

export default WalletTransactionScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SURFACE_MUTED,
  },
  content: {
    paddingHorizontal: UI.screenPadding,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginRight: 10,
    ...UI.softShadow,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: TEXT_DARK,
  },
  heroCard: {
    backgroundColor: '#ec4899',
    borderRadius: UI.radius.xl,
    padding: 18,
    marginBottom: 16,
    ...UI.shadow,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLabel: {
    color: '#ffe4f0',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
  },
  heroSubtitle: {
    color: '#ffe4f0',
    fontSize: 13,
    lineHeight: 19,
  },
  balancePill: {
    marginTop: 14,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 12,
  },
  balancePillLabel: {
    color: '#9f1239',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 2,
  },
  balancePillValue: {
    color: TEXT_DARK,
    fontSize: 20,
    fontWeight: '900',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: UI.radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: '#fbcfe8',
    marginBottom: 16,
    ...UI.softShadow,
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
    color: TEXT_DARK,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: UI.radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: '#fbcfe8',
    marginBottom: 16,
    ...UI.softShadow,
  },
  inputLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 6,
    fontWeight: '600',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    paddingHorizontal: 12,
    backgroundColor: '#f9fafb',
  },
  currencyPrefix: {
    color: '#9ca3af',
    fontSize: 14,
    fontWeight: '900',
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 14,
    color: TEXT_DARK,
  },
  flowCard: {
    backgroundColor: '#ecfeff',
    borderRadius: UI.radius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: '#a5f3fc',
    marginBottom: 16,
  },
  flowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flowDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#67e8f9',
  },
  flowDotActive: {
    backgroundColor: '#0f766e',
  },
  flowText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  flowMeta: {
    marginTop: 6,
    fontSize: 11,
    color: '#0f766e',
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfeff',
    borderRadius: UI.radius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: '#a5f3fc',
    marginBottom: 16,
    gap: 8,
  },
  statusText: {
    color: '#0f766e',
    fontSize: 13,
    fontWeight: '600',
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf3',
    borderRadius: UI.radius.lg,
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
    borderRadius: UI.radius.lg,
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
    borderRadius: UI.radius.lg,
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
    backgroundColor: '#ec4899',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    ...UI.softShadow,
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
