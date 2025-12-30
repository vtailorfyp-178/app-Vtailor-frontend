import React, { useState } from 'react';
import { View, StyleSheet, Image, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/AuthContext';

const logo = require('../assets/images/vTailorlogo.jpeg');

const sections = [
  {
    title: 'Service Agreement',
    content:
      'By using V Tailor, you agree to connect with tailors for custom clothing services. All orders are subject to availability and pricing set by individual tailors.',
  },
  {
    title: 'Privacy & Data',
    content:
      'We collect and protect your personal information including measurements, contact details, and order history. Your data is encrypted and never shared without consent.',
  },
  {
    title: 'User Conduct',
    content:
      'Both customers and tailors must maintain respectful communication. Fraudulent activities, spam, or harassment will result in account termination.',
  },
  {
    title: 'Payment & Penalties',
    content:
      'Tailors must maintain a wallet balance to accept orders. Late deliveries incur a 5% daily penalty. Customers can request refunds for cancelled orders.',
  },
];

export default function TermsPage() {
  const router = useRouter();
  const { acceptTerms } = useAuth();
  const [agreed, setAgreed] = useState(false);

  const handleAccept = () => {
    if (agreed) {
      acceptTerms();
      router.replace('/auth');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <Image source={logo} style={styles.logo} />
        <ThemedText type="title">Terms & Conditions</ThemedText>
        <ThemedText style={styles.subtitle}>Please read and accept to continue</ThemedText>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {sections.map((s) => (
          <View key={s.title} style={styles.section}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              {s.title}
            </ThemedText>
            <ThemedText style={styles.sectionBody}>{s.content}</ThemedText>
          </View>
        ))}

        <View style={styles.additional}>
          <ThemedText type="defaultSemiBold" style={{ marginBottom: 8 }}>
            Additional Terms
          </ThemedText>
          <ThemedText>• Orders cannot be cancelled after cutting begins</ThemedText>
          <ThemedText>• Measurements must be accurate; alterations may incur extra charges</ThemedText>
          <ThemedText>• Direct chat is for order-related communication only</ThemedText>
          <ThemedText>• Ratings and reviews must be honest and constructive</ThemedText>
          <ThemedText>• V Tailor reserves the right to update these terms</ThemedText>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.checkboxRow}>
          <Pressable
            onPress={() => setAgreed((v) => !v)}
            style={[styles.checkbox, agreed && styles.checkboxChecked]}
            accessibilityLabel="I agree to terms"
          />
          <ThemedText style={styles.checkboxLabel}>
            I have read and agree to the <ThemedText style={{ color: '#0ea5a4' }}>Terms & Conditions</ThemedText> and <ThemedText style={{ color: '#0ea5a4' }}>Privacy Policy</ThemedText> of V Tailor.
          </ThemedText>
        </View>

        <Pressable
          onPress={handleAccept}
          style={[styles.button, !agreed && styles.buttonDisabled]}
          disabled={!agreed}
        >
          <ThemedText style={styles.buttonText}>Accept & Continue</ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 32, paddingHorizontal: 24, alignItems: 'center' },
  logo: { width: 80, height: 80, marginBottom: 8 },
  subtitle: { fontSize: 14, marginTop: 6, color: '#6b7280' },
  scroll: { flex: 1, marginTop: 12 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 20 },
  section: { marginBottom: 14, padding: 12, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.03)' },
  sectionTitle: { marginBottom: 6 },
  sectionBody: { color: '#6b7280' },
  additional: { marginTop: 8, padding: 12, borderRadius: 12, backgroundColor: 'rgba(245,158,11,0.08)' },
  footer: { padding: 20, borderTopWidth: 1, borderColor: 'rgba(0,0,0,0.06)' },
  checkboxRow: { flexDirection: 'row', gap: 12, alignItems: 'center' } as any,
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 1, borderColor: '#cbd5e1' },
  checkboxChecked: { backgroundColor: '#0ea5a4', borderColor: '#0ea5a4' },
  checkboxLabel: { flex: 1, marginLeft: 8, color: '#6b7280' },
  button: { marginTop: 12, backgroundColor: '#0ea5a4', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  buttonDisabled: { backgroundColor: 'rgba(0,0,0,0.1)' },
  buttonText: { color: '#fff', fontWeight: '600' },
});
