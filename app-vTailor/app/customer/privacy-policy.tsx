import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AppBackButton from '@/components/AppBackButton';

export default function CustomerPrivacyPolicy() {
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
          <AppBackButton onPress={() => router.replace('/customer/settings')} variant="tint" />
          <ThemedText style={[styles.headerTitle, { color: '#fff' }]}>Privacy Policy</ThemedText>
          <View style={styles.headerButton} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Last Updated */}
          <View style={[styles.infoCard, { backgroundColor: cardBg }]}>
            <Text style={[styles.lastUpdated, { color: muted }]}>Last Updated: January 4, 2026</Text>
          </View>

          {/* Introduction */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Introduction</Text>
            <Text style={[styles.paragraph, { color: muted }]}>
              Welcome to vTailor. We respect your privacy and are committed to protecting your personal data. 
              This privacy policy will inform you about how we handle your personal data when you use our app 
              and tell you about your privacy rights.
            </Text>
          </View>

          {/* Information We Collect */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Information We Collect</Text>
            <Text style={[styles.paragraph, { color: muted }]}>
              We collect several types of information to provide and improve our service:
            </Text>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={[styles.bulletText, { color: muted }]}>
                <Text style={styles.bold}>Personal Information:</Text> Name, phone number, email address, 
                and physical address when you register or update your profile.
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={[styles.bulletText, { color: muted }]}>
                <Text style={styles.bold}>Order Information:</Text> Measurements, delivery preferences, 
                design customizations, and order history.
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={[styles.bulletText, { color: muted }]}>
                <Text style={styles.bold}>Communication Data:</Text> Chat messages with tailors, feedback, 
                and support inquiries.
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={[styles.bulletText, { color: muted }]}>
                <Text style={styles.bold}>Payment Information:</Text> Payment methods and transaction history 
                (processed securely).
              </Text>
            </View>
          </View>

          {/* How We Use Your Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
            <Text style={[styles.paragraph, { color: muted }]}>
              We use your information for the following purposes:
            </Text>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={[styles.bulletText, { color: muted }]}>To provide and maintain our service</Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={[styles.bulletText, { color: muted }]}>To connect you with tailors and facilitate orders</Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={[styles.bulletText, { color: muted }]}>To process payments and manage your wallet</Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={[styles.bulletText, { color: muted }]}>To send notifications about order updates</Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={[styles.bulletText, { color: muted }]}>To improve our app and develop new features</Text>
            </View>
          </View>

          {/* Data Sharing */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. Data Sharing and Disclosure</Text>
            <Text style={[styles.paragraph, { color: muted }]}>
              We do not sell your personal information. We may share your information only in the following circumstances:
            </Text>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={[styles.bulletText, { color: muted }]}>
                <Text style={styles.bold}>With Tailors:</Text> Your contact and measurement information 
                is shared with tailors you've hired to fulfill your order.
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={[styles.bulletText, { color: muted }]}>
                <Text style={styles.bold}>For Legal Compliance:</Text> When required by law or to protect 
                the rights and safety of our users.
              </Text>
            </View>
          </View>

          {/* Data Security */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Data Security</Text>
            <Text style={[styles.paragraph, { color: muted }]}>
              We implement appropriate technical and organizational measures to protect your personal data. 
              However, no method of transmission over the internet is 100% secure, and we cannot guarantee 
              absolute security.
            </Text>
          </View>

          {/* Your Rights */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. Your Rights</Text>
            <Text style={[styles.paragraph, { color: muted }]}>
              You have the following rights regarding your personal data:
            </Text>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={[styles.bulletText, { color: muted }]}>Access and review your personal information</Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={[styles.bulletText, { color: muted }]}>Update or correct your information</Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={[styles.bulletText, { color: muted }]}>Delete your account and associated data</Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={[styles.bulletText, { color: muted }]}>Control notification preferences</Text>
            </View>
          </View>

          {/* Data Retention */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. Data Retention</Text>
            <Text style={[styles.paragraph, { color: muted }]}>
              We retain your personal data only for as long as necessary to provide our services and fulfill 
              the purposes outlined in this privacy policy. When you delete your account, we will permanently 
              remove your personal information, except where we are required to retain it by law.
            </Text>
          </View>

          {/* Contact Us */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>7. Contact Us</Text>
            <Text style={[styles.paragraph, { color: muted }]}>
              If you have any questions about this Privacy Policy or our data practices, please contact us at:
            </Text>
            <View style={[styles.contactCard, { backgroundColor: cardBg }]}>
              <Text style={styles.contactText}>📧 Email: privacy@vtailor.com</Text>
              <Text style={styles.contactText}>📞 Phone: +92 300 1234567</Text>
              <Text style={styles.contactText}>📍 Address: Lahore, Pakistan</Text>
            </View>
          </View>

          {/* Changes to Policy */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>8. Changes to This Policy</Text>
            <Text style={[styles.paragraph, { color: muted }]}>
              We may update this privacy policy from time to time. We will notify you of any changes by 
              posting the new policy on this page and updating the "Last Updated" date.
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
  headerButton: { width: 84, height: 44, alignItems: 'center', justifyContent: 'center' },
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
});
