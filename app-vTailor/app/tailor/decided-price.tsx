import React from 'react';
import { View, ScrollView, StyleSheet, Pressable, Text, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Ionicons } from '@expo/vector-icons';

export default function TailorDecidedPrice() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const orderId = (params.orderId as string) || 'ORD-UNKNOWN';
  const price = params.price ? Number(params.price) : 0;
  const days = params.days ? Number(params.days) : 0;
  const customerName = (params.customerName as string) || '';

  const card = useThemeColor({}, 'card');
  const tint = useThemeColor({}, 'tint');
  const insets = useSafeAreaInsets();

  const [priceInput, setPriceInput] = React.useState<string>(price ? String(price) : '');
  const [daysInput, setDaysInput] = React.useState<string>(days ? String(days) : '');

  const changeMsg = (params.changeMsg as string) || '';
  const fromChange = params.fromChange === 'true';

  const handleSendToCustomer = () => {
    if (!priceInput || !daysInput) {
      Alert.alert('Missing', 'Please enter both price and estimated days.');
      return;
    }
    (router as any).push({ pathname: '/customer/decided-price', params: { orderId, customerName, price: priceInput, days: daysInput } });
    Alert.alert('Sent', 'Decided price sent to customer.');
  };

  const handleAcceptChange = () => {
    // Accept customer's change request: send updated price/days (here we reuse inputs)
    (router as any).push({ pathname: '/customer/decided-price', params: { orderId, customerName, price: priceInput || '0', days: daysInput || '0', status: 'change_accepted' } });
    Alert.alert('Accepted', 'You accepted the requested change.');
  };

  const handleDeclineChange = () => {
    (router as any).push({ pathname: '/customer/decided-price', params: { orderId, customerName, price: String(price), days: String(days), status: 'change_declined' } });
    Alert.alert('Declined', 'You declined the requested change.');
  };

  return (
    <ProtectedRoute requiredRole="tailor">
      <View style={[styles.container, { backgroundColor: card }]}> 
        <View style={[styles.header, { backgroundColor: tint }]}> 
          <Pressable onPress={() => router.back()} style={styles.headerBtn}><Ionicons name="chevron-back" size={24} color="#fff"/></Pressable>
          <ThemedText style={[styles.title, { color: '#fff' }]}>Decided Price</ThemedText>
          <View style={styles.headerBtn} />
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }} keyboardVerticalOffset={0}>
          <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom + 16, 24) }]} keyboardShouldPersistTaps="handled">
          <ThemedText style={styles.label}>Order ID</ThemedText>
          <ThemedText style={styles.value}>{orderId}</ThemedText>

          {customerName ? (
            <>
              <ThemedText style={styles.label}>Customer</ThemedText>
              <ThemedText style={styles.value}>{customerName}</ThemedText>
            </>
          ) : null}

          <ThemedText style={styles.label}>Set Price (Rs)</ThemedText>
          <TextInput value={priceInput} onChangeText={setPriceInput} keyboardType="numeric" style={styles.input} placeholder="e.g., 1200" />

          <ThemedText style={styles.label}>Estimated Completion (days)</ThemedText>
          <TextInput value={daysInput} onChangeText={setDaysInput} keyboardType="numeric" style={styles.input} placeholder="e.g., 5" />

          {fromChange && changeMsg ? (
            <View style={{ marginTop: 12 }}>
              <ThemedText style={styles.label}>Customer Requested Change</ThemedText>
              <ThemedText style={[styles.value, { fontWeight: '600' }]}>{changeMsg}</ThemedText>
              <View style={{ height: 12 }} />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable style={[styles.button, { backgroundColor: tint, flex: 1 }]} onPress={handleAcceptChange}>
                  <Text style={{ color: '#fff', fontWeight: '700' }}>Accept Change</Text>
                </Pressable>
                <Pressable style={[styles.buttonOutline, { flex: 1 }]} onPress={handleDeclineChange}>
                  <Text style={{ color: '#111827', fontWeight: '700' }}>Decline</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <>
              <View style={{ height: 16 }} />
              <Pressable style={[styles.button, { backgroundColor: tint }]} onPress={handleSendToCustomer}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Send to Customer</Text>
              </Pressable>
            </>
          )}
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 44, paddingBottom: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' },
  headerBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, textAlign: 'center', fontWeight: '800', fontSize: 18 },
  content: { padding: 16 },
  label: { color: '#6b7280', fontSize: 13, fontWeight: '700', marginTop: 12 },
  value: { fontSize: 16, fontWeight: '800', color: '#111827', marginTop: 6 },
  price: { fontSize: 24, fontWeight: '900', color: '#111827', marginTop: 6 },
  button: { padding: 14, borderRadius: 12, alignItems: 'center' },
  buttonOutline: { padding: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#d1d5db' },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 10, marginTop: 8 },
});
