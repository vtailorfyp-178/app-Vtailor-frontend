import { Ionicons } from '@expo/vector-icons';
import { SURFACE_MUTED, TEXT_DARK, UI } from '@/constants/ui';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { BackHandler, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const insets = useSafeAreaInsets();
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
    <View style={[styles.container, { paddingTop: Math.max(insets.top + 10, 28) }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Pressable onPress={goBackToWallet} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={TEXT_DARK} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{screenTitle}</Text>
          </View>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Ionicons name={isTailor ? 'wallet-outline' : 'card-outline'} size={28} color="#fff" />
          </View>
          <Text style={styles.heroTitle}>Secure wallet payment</Text>
          <Text style={styles.heroSubtitle}>Choose how you want to {actionLabel}. Transactions are recorded in your wallet history.</Text>
          <View style={styles.heroMeta}>
            <Ionicons name="shield-checkmark-outline" size={14} color="#be185d" />
            <Text style={styles.heroMetaText}>Protected payment simulation</Text>
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
                <Text style={styles.methodDesc}>{option.description} for wallet {transactionType === 'withdraw' ? 'withdrawal' : 'top-up'}</Text>
                <View style={styles.methodPill}>
                  <Ionicons name="flash-outline" size={12} color="#be185d" />
                  <Text style={styles.methodPillText}>Fast processing</Text>
                </View>
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
    backgroundColor: SURFACE_MUTED,
  },
  content: {
    paddingHorizontal: UI.screenPadding,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
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
    marginBottom: 6,
  },
  heroCard: {
    backgroundColor: '#ec4899',
    borderRadius: UI.radius.xl,
    padding: 18,
    marginBottom: 18,
    ...UI.shadow,
  },
  heroIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 6,
  },
  heroSubtitle: {
    color: '#ffe4f0',
    fontSize: 13,
    lineHeight: 20,
  },
  heroMeta: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    marginTop: 14,
  },
  heroMetaText: {
    color: '#be185d',
    fontSize: 11,
    fontWeight: '800',
  },
  cardList: {
    gap: 12,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: UI.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fbcfe8',
    ...UI.softShadow,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  methodName: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_DARK,
    marginBottom: 4,
  },
  methodDesc: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 17,
  },
  methodPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fdf2f8',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 8,
  },
  methodPillText: {
    color: '#be185d',
    fontSize: 10,
    fontWeight: '800',
  },
});
