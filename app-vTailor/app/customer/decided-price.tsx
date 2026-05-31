import React from 'react';
import { View, ScrollView, StyleSheet, Pressable, Text, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Ionicons } from '@expo/vector-icons';
import AppBackButton from '@/components/AppBackButton';

export default function CustomerDecidedPrice() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const orderId = (params.orderId as string) || 'ORD-UNKNOWN';
  const price = params.price ? Number(params.price) : 0;
  const days = params.days ? Number(params.days) : 0;
  const customerName = (params.customerName as string) || '';

  const card = useThemeColor({}, 'card');
  const tint = useThemeColor({}, 'tint');
  const muted = useThemeColor({}, 'muted');
  const insets = useSafeAreaInsets();

  const [mode, setMode] = React.useState<'idle' | 'requesting' | 'submitted' | 'accepted'>('idle');
  const [changeMsg, setChangeMsg] = React.useState('');

  return (
    <ProtectedRoute requiredRole="customer">
      <View style={[styles.container, { backgroundColor: card }]}> 
        <View style={[styles.header, { backgroundColor: tint }]}> 
          <AppBackButton onPress={() => router.back()} variant="tint" />
          <ThemedText style={[styles.title, { color: '#fff' }]}>Decided Price</ThemedText>
          <View style={styles.headerBtn} />
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }} keyboardVerticalOffset={0}>
          <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom + 16, 24) }]} keyboardShouldPersistTaps="handled">
          <ThemedText style={styles.label}>Order ID</ThemedText>
          <ThemedText style={styles.value}>{orderId}</ThemedText>

          {customerName ? (
            <>
              <ThemedText style={styles.label}>Tailor</ThemedText>
              <ThemedText style={styles.value}>{customerName}</ThemedText>
            </>
          ) : null}

          <ThemedText style={styles.label}>Decided Price</ThemedText>
          <ThemedText style={[styles.price]}>Rs {price.toLocaleString()}</ThemedText>

          <ThemedText style={styles.label}>Estimated Completion</ThemedText>
          <ThemedText style={styles.value}>{days} day{days === 1 ? '' : 's'}</ThemedText>

          <View style={{ height: 18 }} />

          {mode === 'idle' && (
            <View>
              <Pressable
                style={[styles.button, { backgroundColor: tint, marginBottom: 10 }]}
                onPress={() => {
                  Alert.alert('Confirm', 'Do you accept this price and estimated time?', [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Accept',
                      onPress: () => {
                        setMode('accepted');
                        Alert.alert('Accepted', 'You have accepted the decided price.');
                        (router as any).replace('/customer/orders');
                      },
                    },
                  ]);
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>Accept</Text>
              </Pressable>

              <Pressable
                style={[styles.buttonOutline]}
                onPress={() => setMode('requesting')}
              >
                <Text style={{ color: '#111827', fontWeight: '700' }}>Request Changes</Text>
              </Pressable>
            </View>
          )}

          {mode === 'requesting' && (
            <View>
              <Text style={[styles.label, { marginTop: 12 }]}>Change Request</Text>
              <TextInput
                value={changeMsg}
                onChangeText={setChangeMsg}
                placeholder="Describe the changes you want (price/days or details)"
                style={styles.changeInput}
                multiline
                numberOfLines={4}
              />
              <View style={{ height: 8 }} />
              <Pressable
                style={[styles.button, { backgroundColor: tint, marginBottom: 10 }]}
                onPress={() => {
                  if (!changeMsg.trim()) {
                    Alert.alert('Enter a message', 'Please describe what you want changed.');
                    return;
                  }
                  // Simulate sending change request
                  setMode('submitted');
                  Alert.alert('Request sent', 'Your change request has been sent to the tailor.');
                  (router as any).replace('/customer');
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>Submit Change Request</Text>
              </Pressable>

              <Pressable style={styles.buttonOutline} onPress={() => setMode('idle')}>
                <Text style={{ color: '#111827', fontWeight: '700' }}>Cancel</Text>
              </Pressable>
            </View>
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
  headerBtn: { width: 84, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, textAlign: 'center', fontWeight: '800', fontSize: 18 },
  content: { padding: 16 },
  label: { color: '#6b7280', fontSize: 13, fontWeight: '700', marginTop: 12 },
  value: { fontSize: 16, fontWeight: '800', color: '#111827', marginTop: 6 },
  price: { fontSize: 24, fontWeight: '900', color: '#111827', marginTop: 6 },
  button: { padding: 14, borderRadius: 12, alignItems: 'center' },
  buttonOutline: { padding: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#d1d5db' },
  changeInput: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 10, minHeight: 80, marginTop: 8, textAlignVertical: 'top' },
});
