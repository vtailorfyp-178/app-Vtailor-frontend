import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Platform } from 'react-native';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import AppBackButton from '@/components/AppBackButton';
import { ROLE_COLORS, UI } from '@/constants/ui';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useRouter } from 'expo-router';

const logo = require('../../assets/images/vTailorlogo.jpeg');

const MUTED_ON_WHITE = '#64748b';

export default function TermsConditions() {
  const router = useRouter();
  const tint = useThemeColor({}, 'tint');

  return (
    <ProtectedRoute requiredRole="tailor">
      <View style={[styles.screen, { backgroundColor: tint }]}>
        <View style={styles.topNav}>
          <AppBackButton onPress={() => router.replace('/tailor/settings')} variant="light" />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.heroCard}>
            <View style={styles.logoWrap}>
              <Image source={logo} style={styles.logo} />
            </View>
            <Text style={styles.heroTitle}>Terms & Conditions</Text>
            <Text style={styles.heroSubtitle}>Legal information for using vTailor</Text>
          </View>

          <View style={styles.paper}>
            <Text style={styles.lastUpdated}>Last Updated: January 4, 2026</Text>
          </View>

          {/* Introduction */}
          <View style={[styles.section, styles.paper]}>
            <Text style={styles.sectionTitle}>Agreement to Terms</Text>
            <Text style={[styles.paragraph, { color: MUTED_ON_WHITE }]}>
              By accessing and using vTailor, you agree to be bound by these Terms and Conditions. 
              If you do not agree with any part of these terms, you must not use our service.
            </Text>
          </View>

          {/* Account Registration */}
          <View style={[styles.section, styles.paper]}>
            <Text style={styles.sectionTitle}>1. Account Registration</Text>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={[styles.bulletText, { color: MUTED_ON_WHITE }]}>
                You must be at least 18 years old to use this service.
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={[styles.bulletText, { color: MUTED_ON_WHITE }]}>
                You must provide accurate and complete information during registration.
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={[styles.bulletText, { color: MUTED_ON_WHITE }]}>
                You are responsible for maintaining the confidentiality of your account.
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={[styles.bulletText, { color: MUTED_ON_WHITE }]}>
                You agree to notify us immediately of any unauthorized use of your account.
              </Text>
            </View>
          </View>

          {/* User Responsibilities */}
          <View style={[styles.section, styles.paper]}>
            <Text style={styles.sectionTitle}>2. User Responsibilities</Text>
            <Text style={[styles.paragraph, { color: MUTED_ON_WHITE }]}>
              As a user of vTailor, you agree to:
            </Text>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={[styles.bulletText, { color: MUTED_ON_WHITE }]}>
                Provide accurate measurements and order details.
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={[styles.bulletText, { color: MUTED_ON_WHITE }]}>
                Communicate professionally with tailors and customers.
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={[styles.bulletText, { color: MUTED_ON_WHITE }]}>
                Honor commitments made for orders and deliveries.
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={[styles.bulletText, { color: MUTED_ON_WHITE }]}>
                Not use the service for any illegal or unauthorized purpose.
              </Text>
            </View>
          </View>

          {/* Tailor-Specific Terms */}
          <View style={[styles.section, styles.paper]}>
            <Text style={styles.sectionTitle}>3. Tailor-Specific Terms</Text>
            <Text style={[styles.paragraph, { color: MUTED_ON_WHITE }]}>
              If you are registered as a tailor, you additionally agree to:
            </Text>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={[styles.bulletText, { color: MUTED_ON_WHITE }]}>
                <Text style={styles.bold}>Quality Standards:</Text> Deliver high-quality work that meets 
                industry standards and customer expectations.
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={[styles.bulletText, { color: MUTED_ON_WHITE }]}>
                <Text style={styles.bold}>Delivery Timelines:</Text> Complete orders within the agreed 
                timeframe or communicate delays promptly.
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={[styles.bulletText, { color: MUTED_ON_WHITE }]}>
                <Text style={styles.bold}>Penalties:</Text> Accept responsibility for late deliveries 
                and associated penalty charges as per the order agreement.
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={[styles.bulletText, { color: MUTED_ON_WHITE }]}>
                <Text style={styles.bold}>Sample Work:</Text> Ensure that portfolio samples accurately 
                represent your work and capabilities.
              </Text>
            </View>
          </View>

          {/* Payment Terms */}
          <View style={[styles.section, styles.paper]}>
            <Text style={styles.sectionTitle}>4. Payment and Fees</Text>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={[styles.bulletText, { color: MUTED_ON_WHITE }]}>
                Prices are agreed upon between customers and tailors before order confirmation.
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={[styles.bulletText, { color: MUTED_ON_WHITE }]}>
                vTailor may charge service fees for facilitating transactions.
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={[styles.bulletText, { color: MUTED_ON_WHITE }]}>
                Refunds are subject to the refund policy and order status.
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={[styles.bulletText, { color: MUTED_ON_WHITE }]}>
                Penalty charges for late deliveries will be deducted as per agreement.
              </Text>
            </View>
          </View>

          {/* Order Cancellation */}
          <View style={[styles.section, styles.paper]}>
            <Text style={styles.sectionTitle}>5. Order Cancellation and Refunds</Text>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={[styles.bulletText, { color: MUTED_ON_WHITE }]}>
                <Text style={styles.bold}>Customer Cancellation:</Text> Orders can be cancelled within 
                24 hours of placement for a full refund.
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={[styles.bulletText, { color: MUTED_ON_WHITE }]}>
                <Text style={styles.bold}>Tailor Cancellation:</Text> If a tailor cancels after 
                confirmation, they may be subject to penalties and rating impact.
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={[styles.bulletText, { color: MUTED_ON_WHITE }]}>
                <Text style={styles.bold}>Disputes:</Text> Any disputes regarding quality or delivery 
                will be reviewed by vTailor support.
              </Text>
            </View>
          </View>

          {/* Intellectual Property */}
          <View style={[styles.section, styles.paper]}>
            <Text style={styles.sectionTitle}>6. Intellectual Property</Text>
            <Text style={[styles.paragraph, { color: MUTED_ON_WHITE }]}>
              All content on vTailor, including designs, logos, text, and graphics, is owned by vTailor 
              or licensed to us. You may not use, copy, or distribute any content without permission.
            </Text>
            <Text style={[styles.paragraph, { color: MUTED_ON_WHITE }]}>
              Tailors retain rights to their sample work and designs, but grant vTailor permission to 
              display them on the platform.
            </Text>
          </View>

          {/* Limitation of Liability */}
          <View style={[styles.section, styles.paper]}>
            <Text style={styles.sectionTitle}>7. Limitation of Liability</Text>
            <Text style={[styles.paragraph, { color: MUTED_ON_WHITE }]}>
              vTailor acts as a platform connecting customers and tailors. We are not responsible for:
            </Text>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={[styles.bulletText, { color: MUTED_ON_WHITE }]}>
                The quality of work performed by tailors
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={[styles.bulletText, { color: MUTED_ON_WHITE }]}>
                Disputes between customers and tailors
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={[styles.bulletText, { color: MUTED_ON_WHITE }]}>
                Lost or damaged items during delivery
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={[styles.bulletText, { color: MUTED_ON_WHITE }]}>
                Any indirect or consequential damages arising from use of the service
              </Text>
            </View>
          </View>

          {/* Termination */}
          <View style={[styles.section, styles.paper]}>
            <Text style={styles.sectionTitle}>8. Account Termination</Text>
            <Text style={[styles.paragraph, { color: MUTED_ON_WHITE }]}>
              We reserve the right to suspend or terminate your account if you:
            </Text>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={[styles.bulletText, { color: MUTED_ON_WHITE }]}>Violate these Terms and Conditions</Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={[styles.bulletText, { color: MUTED_ON_WHITE }]}>Engage in fraudulent activity</Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={[styles.bulletText, { color: MUTED_ON_WHITE }]}>Receive multiple customer complaints</Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={[styles.bulletText, { color: MUTED_ON_WHITE }]}>Use the service inappropriately</Text>
            </View>
          </View>

          {/* Changes to Terms */}
          <View style={[styles.section, styles.paper]}>
            <Text style={styles.sectionTitle}>9. Changes to Terms</Text>
            <Text style={[styles.paragraph, { color: MUTED_ON_WHITE }]}>
              We may modify these terms at any time. Continued use of the service after changes 
              constitutes acceptance of the modified terms. We will notify you of significant changes 
              via email or in-app notification.
            </Text>
          </View>

          {/* Contact Information */}
          <View style={[styles.section, styles.paper]}>
            <Text style={styles.sectionTitle}>10. Contact Us</Text>
            <Text style={[styles.paragraph, { color: MUTED_ON_WHITE }]}>
              For questions about these Terms and Conditions, please contact us:
            </Text>
            <View style={styles.contactCard}>
              <Text style={styles.contactText}>📧 Email: support@vtailor.com</Text>
              <Text style={styles.contactText}>📞 Phone: +92 300 1234567</Text>
              <Text style={styles.contactText}>📍 Address: Lahore, Pakistan</Text>
            </View>
          </View>

          {/* Acceptance */}
          <View style={styles.acceptanceBox}>
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
  screen: { flex: 1 },
  topNav: {
    paddingHorizontal: 16,
    paddingTop: Platform.select({ ios: 56, android: 16, default: 16 }),
    paddingBottom: 8,
  },
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  heroCard: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 24,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: ROLE_COLORS.customer.border,
    ...UI.shadow,
  },
  logoWrap: {
    width: 104,
    height: 104,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ROLE_COLORS.customer.soft,
    borderWidth: 1,
    borderColor: ROLE_COLORS.customer.border,
    marginBottom: 14,
  },
  logo: { width: 86, height: 86, resizeMode: 'contain' },
  heroTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: ROLE_COLORS.customer.primaryDark,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: MUTED_ON_WHITE,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  paper: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#fce7f3',
    ...UI.softShadow,
  },
  lastUpdated: { fontSize: 13, fontWeight: '700', textAlign: 'center', color: MUTED_ON_WHITE },
  section: { marginBottom: 0 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#0f172a', marginBottom: 12 },
  paragraph: { fontSize: 14, lineHeight: 22, marginBottom: 12, color: MUTED_ON_WHITE },
  bulletPoint: { flexDirection: 'row', marginBottom: 8, paddingLeft: 4 },
  bullet: { fontSize: 16, fontWeight: '700', color: ROLE_COLORS.customer.primary, marginRight: 8 },
  bulletText: { flex: 1, fontSize: 14, lineHeight: 22, color: MUTED_ON_WHITE },
  bold: { fontWeight: '700', color: '#0f172a' },
  contactCard: {
    padding: 14,
    borderRadius: 14,
    marginTop: 12,
    backgroundColor: ROLE_COLORS.customer.soft,
    borderWidth: 1,
    borderColor: ROLE_COLORS.customer.border,
  },
  contactText: { fontSize: 14, fontWeight: '600', color: '#0f172a', marginBottom: 8 },
  acceptanceBox: {
    padding: 18,
    borderRadius: 16,
    marginTop: 8,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: ROLE_COLORS.customer.primary,
  },
  acceptanceText: {
    fontSize: 14,
    lineHeight: 22,
    color: ROLE_COLORS.customer.primaryDark,
    fontWeight: '700',
    textAlign: 'center',
  },
});
