import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

const WalletTransactionScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const transactionType = (params?.transactionType as string) || 'add';
  const paymentMethod = (params?.paymentMethod as string) || 'EasyPaisa';
  const role = (params?.role as string) || 'customer';

  const startingBalance = useMemo(() => (role === 'tailor' ? 45575 : 15500), [role]);

  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState((params?.phone as string) || '03XXXXXXXXX');
  const [balance, setBalance] = useState(startingBalance);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const onProceed = () => {
    if (loading || !amount.trim()) return;
    setLoading(true);
    setSuccess(false);

    setTimeout(() => {
      const numericAmount = parseFloat(amount) || 0;
      const updatedBalance = transactionType === 'withdraw' ? balance - numericAmount : balance + numericAmount;
      setBalance(updatedBalance);
      setLoading(false);
      setSuccess(true);
    }, 1000);
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

        <Pressable
          style={[styles.proceedBtn, (!amount.trim() || loading) && { opacity: 0.6 }]}
          disabled={!amount.trim() || loading}
          onPress={onProceed}
        >
          <Text style={styles.proceedText}>{loading ? 'Processing...' : 'Proceed Payment'}</Text>
        </Pressable>
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
});
