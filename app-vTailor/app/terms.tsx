import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, Image, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ROLE_COLORS } from '@/constants/ui';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/contexts/AuthContext';

const logo = require('../assets/images/vTailorlogo.jpeg');

export default function Terms() {
  const router = useRouter();
  const { acceptTerms } = useAuth();
  const [agreed, setAgreed] = useState(false);

  const tint = useThemeColor({}, 'tint');
  const selectedPink = ROLE_COLORS.customer.primary;
  const muted = useThemeColor({}, 'muted');
  const screenPink = ROLE_COLORS.customer.soft;
  const iconBg = useThemeColor({}, 'iconBg');
  const buttonStart = useThemeColor({}, 'buttonStart');

  const sections = [
    {
      title: 'Service Agreement',
      content:
        'By using V Tailor, you agree to connect with tailors for custom clothing services. All orders are subject to availability and pricing set by individual tailors.',
      icon: '📄',
    },
    {
      title: 'Privacy & Data',
      content:
        'We collect and protect your personal information including measurements, contact details, and order history. Your data is encrypted and never shared without consent.',
      icon: '🔒',
    },
    {
      title: 'User Conduct',
      content:
        'Both customers and tailors must maintain respectful communication. Fraudulent activities, spam, or harassment will result in account termination.',
      icon: '👥',
    },
    {
      title: 'Payment & Penalties',
      content:
        'Tailors must maintain a wallet balance to accept orders. Late deliveries may incur penalties. Customers can request refunds for cancelled orders.',
      icon: '💳',
    },
  ];

  const handleAccept = () => {
    if (!agreed) return;
    if (acceptTerms) acceptTerms();
    router.replace('/auth');
  };

  return (
    <ThemedView style={[styles.screen, { backgroundColor: screenPink }]}>
      <ScrollView contentContainerStyle={styles.container} style={{ backgroundColor: screenPink }}>
        <View style={styles.header}>
          <Image source={logo} style={styles.logo} />
          <ThemedText type="title">Terms & Conditions</ThemedText>
          <ThemedText style={[styles.subtitle, { color: muted }]}>Please read and accept to continue</ThemedText>
        </View>

        {sections.map((s) => (
          <ThemedView key={s.title} style={styles.card}>
            <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
              <ThemedText style={[styles.icon, { color: tint }]}>{s.icon}</ThemedText>
            </View>
            <View style={styles.cardContent}>
              <ThemedText style={styles.cardTitle}>{s.title}</ThemedText>
              <ThemedText style={[styles.cardDesc, { color: muted }]}>{s.content}</ThemedText>
            </View>
          </ThemedView>
        ))}

        <ThemedView style={[styles.additionalBox, { backgroundColor: '#fff7f9', borderColor: '#fae3ea' }]}>
          <ThemedText type="defaultSemiBold" style={styles.additionalTitle}>Additional Terms</ThemedText>
          <ThemedText style={[styles.bullet, { color: muted }]}>• Orders cannot be cancelled after cutting begins</ThemedText>
          <ThemedText style={[styles.bullet, { color: muted }]}>• Measurements must be accurate; alterations may incur extra charges</ThemedText>
          <ThemedText style={[styles.bullet, { color: muted }]}>• Direct chat is for order-related communication only</ThemedText>
          <ThemedText style={[styles.bullet, { color: muted }]}>• Ratings and reviews must be honest and constructive</ThemedText>
          <ThemedText style={[styles.bullet, { color: muted }]}>• V Tailor reserves the right to update these terms</ThemedText>
        </ThemedView>

        <ThemedView style={styles.footerSpacer} />
      </ScrollView>

      <ThemedView style={styles.footer}>
        <View style={styles.checkboxRow as any}>
          <Pressable
            onPress={() => setAgreed((v) => !v)}
            style={[styles.checkbox, agreed && { backgroundColor: selectedPink, borderColor: selectedPink }]}
            accessibilityLabel="I agree to terms"
          />
          <ThemedText style={[styles.checkboxLabel, { color: muted }]}>I have read and agree to the <ThemedText style={{ color: tint }}>Terms & Conditions</ThemedText> and <ThemedText style={{ color: tint }}>Privacy Policy</ThemedText> of V Tailor.</ThemedText>
        </View>
        <Pressable
          onPress={handleAccept}
          style={[
            styles.button,
            { backgroundColor: agreed ? selectedPink : buttonStart, borderColor: agreed ? selectedPink : '#f6d6de' },
            !agreed && styles.buttonDisabled,
          ]}
          disabled={!agreed}
        >
          <ThemedText style={styles.buttonText}>Accept & Continue</ThemedText>
        </Pressable>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { padding: 20, paddingBottom: 120 },
  header: { paddingTop: 46, paddingBottom: 12, alignItems: 'center' },
  logo: { width: 80, height: 80, marginBottom: 8, resizeMode: 'contain' },
  subtitle: { fontSize: 14, marginTop: 6 },
  card: { flexDirection: 'row', padding: 16, borderRadius: 12, marginBottom: 14, borderWidth: 1, backgroundColor: '#f8fafc', borderColor: '#eef2f6' },
  iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  icon: { fontSize: 20 },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  cardDesc: { fontSize: 14, lineHeight: 20 },
  additional: { marginTop: 8, padding: 12, borderRadius: 12 },
  additionalBox: { marginTop: 8, padding: 18, borderRadius: 12, borderWidth: 1 },
  additionalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 10 },
  bullet: { fontSize: 14, lineHeight: 22, marginBottom: 8 },
  footerSpacer: { height: 8 },
  footer: { padding: 16, borderTopWidth: 1, borderColor: '#eef2f6', backgroundColor: '#f8fafc' },
  checkboxRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 1, borderColor: '#e6e7eb' },
  checkboxLabel: { flex: 1, marginLeft: 8 },
  button: { marginTop: 12, paddingVertical: 14, borderRadius: 10, alignItems: 'center', borderWidth: 1 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontWeight: '600' },
});
