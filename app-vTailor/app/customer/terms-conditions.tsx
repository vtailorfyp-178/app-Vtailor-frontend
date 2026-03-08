import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function CustomerTermsConditions() {
  const router = useRouter();
  const bg = useThemeColor({}, 'background');
  const cardBg = useThemeColor({}, 'card');
  const tint = useThemeColor({}, 'tint');
  const muted = useThemeColor({}, 'muted');

  return (
    <ProtectedRoute requiredRole="customer">
      <View style={[styles.container, { backgroundColor: bg }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: tint }]}>
          <Pressable onPress={() => router.replace('/customer/settings')} style={styles.headerButton}>
            <Ionicons name="chevron-back" size={26} color="#fff" />
          </Pressable>
          <ThemedText style={[styles.headerTitle, { color: '#fff' }]}>Terms & Conditions</ThemedText>
          <View style={styles.headerButton} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Last Updated */}
          <View style={[styles.infoCard, { backgroundColor: cardBg }]}>
            <Text style={[styles.lastUpdated, { color: muted }]}>Last Updated: January 4, 2026</Text>
          </View>

          {/* Introduction */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Agreement to Terms</Text>
            <Text style={[styles.paragraph, { color: muted }]}>
              By accessing and using vTailor, you agree to be bound by these Terms and Conditions. 
              If you do not agree with any part of these terms, you must not use our service.
            </Text>
          </View>

          {/* Account Registration */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Account Registration</Text>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={[styles.bulletText, { color: muted }]}>
                You must be at least 18 years old to use this service.
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={[styles.bulletText, { color: muted }]}>
                You must provide accurate and complete information during registration.
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={[styles.bulletText, { color: muted }]}>
                You are responsible for maintaining the confidentiality of your account.
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={[styles.bulletText, { color: muted }]}>
                You agree to notify us immediately of any unauthorized use of your account.
              </Text>
            </View>
          </View>

          {/* Customer Responsibilities */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Customer Responsibilities</Text>
            <Text style={[styles.paragraph, { color: muted }]}>
              As a customer of vTailor, you agree to:
            </Text>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={[styles.bulletText, { color: muted }]}>
                Provide accurate measurements and specifications for your orders.
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={[styles.bulletText, { color: muted }]}>
                Communicate respectfully with tailors and other users.
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={[styles.bulletText, { color: muted }]}>
                Make payments as agreed upon with the tailor.
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={[styles.bulletText, { color: muted }]}>
                Not use the service for any illegal or unauthorized purpose.
              </Text>
            </View>
          </View>

          {/* Payment Terms */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. Payment and Fees</Text>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={[styles.bulletText, { color: muted }]}>
                Prices are agreed upon between customers and tailors before order confirmation.
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={[styles.bulletText, { color: muted }]}>
                Payment methods must be valid and in your name.
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={[styles.bulletText, { color: muted }]}>
                You are responsible for all charges and fees associated with your account.
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={[styles.bulletText, { color: muted }]}>
                Refunds are subject to the refund policy and order status.
              </Text>
            </View>
          </View>

          {/* Order Cancellation */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Order Cancellation and Refunds</Text>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={[styles.bulletText, { color: muted }]}>
                <Text style={styles.bold}>Cancellation Window:</Text> Orders can be cancelled within 24 hours 
                of placement for a full refund.
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={[styles.bulletText, { color: muted }]}>
                <Text style={styles.bold}>Tailor Cancellation:</Text> If a tailor cancels after confirmation, 
                you will receive a full refund and may leave a review.
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={[styles.bulletText, { color: muted }]}>
                <Text style={styles.bold}>Disputes:</Text> Any disputes regarding quality or delivery 
                will be reviewed by vTailor support.
              </Text>
            </View>
          </View>

          {/* Intellectual Property */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. Intellectual Property</Text>
            <Text style={[styles.paragraph, { color: muted }]}>
              All content on vTailor, including designs, logos, text, and graphics, is owned by vTailor 
              or licensed to us. You may not use, copy, or distribute any content without permission.
            </Text>
            <Text style={[styles.paragraph, { color: muted }]}>
              Your 3D designs and customizations are your intellectual property, and you grant vTailor 
              permission to display them for order fulfillment.
            </Text>
          </View>

          {/* Limitation of Liability */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. Limitation of Liability</Text>
            <Text style={[styles.paragraph, { color: muted }]}>
              vTailor acts as a platform connecting customers and tailors. We are not responsible for:
            </Text>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={[styles.bulletText, { color: muted }]}>
                The quality of work performed by tailors
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={[styles.bulletText, { color: muted }]}>
                Disputes between customers and tailors beyond our mediation
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={[styles.bulletText, { color: muted }]}>
                Lost or damaged items during delivery
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={[styles.bulletText, { color: muted }]}>
                Any indirect or consequential damages arising from use of the service
              </Text>
            </View>
          </View>

          {/* Termination */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>7. Account Termination</Text>
            <Text style={[styles.paragraph, { color: muted }]}>
              We reserve the right to suspend or terminate your account if you:
            </Text>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={[styles.bulletText, { color: muted }]}>Violate these Terms and Conditions</Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={[styles.bulletText, { color: muted }]}>Engage in fraudulent activity</Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={[styles.bulletText, { color: muted }]}>File multiple false disputes</Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={[styles.bulletText, { color: muted }]}>Use the service inappropriately</Text>
            </View>
          </View>

          {/* Changes to Terms */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>8. Changes to Terms</Text>
            <Text style={[styles.paragraph, { color: muted }]}>
              We may modify these terms at any time. Continued use of the service after changes 
              constitutes acceptance of the modified terms. We will notify you of significant changes 
              via email or in-app notification.
            </Text>
          </View>

          {/* Contact Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>9. Contact Us</Text>
            <Text style={[styles.paragraph, { color: muted }]}>
              For questions about these Terms and Conditions, please contact us:
            </Text>
            <View style={[styles.contactCard, { backgroundColor: cardBg }]}>
              <Text style={styles.contactText}>📧 Email: support@vtailor.com</Text>
              <Text style={styles.contactText}>📞 Phone: +92 300 1234567</Text>
              <Text style={styles.contactText}>📍 Address: Lahore, Pakistan</Text>
            </View>
          </View>

          {/* Acceptance */}
          <View style={[styles.acceptanceBox, { backgroundColor: tint }]}>
            <Text style={styles.acceptanceText}>
              By using vTailor, you acknowledge that you have read, understood, and agree to be 
              bound by these Terms and Conditions.
            </Text>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, paddingTop: 40 },
  headerButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '700' },
  content: { padding: 16 },
  infoCard: { padding: 16, borderRadius: 12, marginBottom: 16 },
  lastUpdated: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 12 },
  paragraph: { fontSize: 14, lineHeight: 22, marginBottom: 12 },
  bulletPoint: { flexDirection: 'row', marginBottom: 8, paddingLeft: 8 },
  bullet: { fontSize: 16, fontWeight: '700', color: '#6b7280', marginRight: 8 },
  bulletText: { flex: 1, fontSize: 14, lineHeight: 22 },
  bold: { fontWeight: '700', color: '#111827' },
  contactCard: { padding: 16, borderRadius: 12, marginTop: 12 },
  contactText: { fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 8 },
  acceptanceBox: { padding: 16, borderRadius: 12, marginTop: 16 },
  acceptanceText: { fontSize: 14, lineHeight: 22, color: '#fff', fontWeight: '600', textAlign: 'center' },
});
