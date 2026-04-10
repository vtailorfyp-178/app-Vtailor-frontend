import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { BackHandler, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const paymentOptions = [
  {
    key: 'easypaisa',
    name: 'EasyPaisa',
    description: 'Instant transfer',
    icon: 'card-outline' as const,
    color: '#10b981',
  },
  {
    key: 'jazzcash',
    name: 'JazzCash',
    description: 'Instant transfer',
    icon: 'cash-outline' as const,
    color: '#ef4444',
  },
];

const WalletPaymentMethodScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const transactionType = (params?.transactionType as string) || 'add';
  const role = (params?.role as string) || 'customer';
  const isTailor = role === 'tailor';
  const actionLabel = transactionType === 'withdraw'
    ? (isTailor ? 'withdraw earnings' : 'withdraw funds')
    : (isTailor ? 'add wallet funds' : 'add money');
  const screenTitle = isTailor ? 'Tailor Payment Method' : 'Customer Payment Method';
  const walletPath = role === 'tailor' ? '/tailor?tab=wallet' : '/customer?tab=wallet';

  const goBackToWallet = () => {
    router.replace(walletPath as any);
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        goBackToWallet();
        return true;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [walletPath])
  );

  const goToTransaction = (method: string) => {
    router.push({
      pathname: '/wallet-transaction',
      params: { paymentMethod: method, transactionType, role },
    } as any);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Pressable onPress={goBackToWallet} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{screenTitle}</Text>
            <Text style={styles.subtitle}>Choose how you want to {actionLabel} using a simulated JazzCash-style payment flow.</Text>
          </View>
        </View>

        <View style={styles.cardList}>
          {paymentOptions.map((option) => (
            <Pressable key={option.key} style={styles.methodCard} onPress={() => goToTransaction(option.name)}>
              <View style={[styles.iconBox, { backgroundColor: option.color + '20' }]}>
                <Ionicons name={option.icon} size={26} color={option.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.methodName}>{option.name}</Text>
                <Text style={styles.methodDesc}>{option.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

export default WalletPaymentMethodScreen;

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
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 16,
  },
  cardList: {
    gap: 12,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  methodName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  methodDesc: {
    fontSize: 12,
    color: '#6b7280',
  },
});
