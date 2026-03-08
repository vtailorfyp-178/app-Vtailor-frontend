import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Linking, Alert } from 'react-native';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function CustomerHelp() {
  const router = useRouter();
  const bg = useThemeColor({}, 'background');
  const cardBg = useThemeColor({}, 'card');
  const tint = useThemeColor({}, 'tint');
  const muted = useThemeColor({}, 'muted');

  const handleContactSupport = () => {
    Alert.alert('Contact Support', 'Choose how you want to reach us', [
      { text: 'Email', onPress: () => Linking.openURL('mailto:support@vtailor.com') },
      { text: 'Call', onPress: () => Linking.openURL('tel:+923001234567') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleReportIssue = () => {
    Alert.alert('Report Issue', 'This will open our issue reporting form', [{ text: 'OK' }]);
  };

  const handleFAQ = (question: string) => {
    Alert.alert('FAQ', question, [{ text: 'OK' }]);
  };

  return (
    <ProtectedRoute requiredRole="customer">
      <View style={[styles.container, { backgroundColor: bg }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: tint }]}>
          <Pressable onPress={() => router.replace('/customer?tab=profile')} style={styles.headerButton}>
            <Ionicons name="chevron-back" size={26} color="#fff" />
          </Pressable>
          <ThemedText style={[styles.headerTitle, { color: '#fff' }]}>Help & Support</ThemedText>
          <View style={styles.headerButton} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* About vTailor */}
          <View style={[styles.card, { backgroundColor: cardBg }]}>
            <View style={styles.iconHeader}>
              <Text style={styles.iconLarge}>📱</Text>
              <Text style={styles.appTitle}>vTailor</Text>
              <Text style={[styles.version, { color: muted }]}>Version 1.0.0</Text>
            </View>
            <Text style={[styles.description, { color: muted }]}>
              vTailor connects you with professional tailors for custom-made clothing. Browse tailors, 
              customize designs in 3D, communicate in real-time, and track your orders from measurement 
              to delivery.
            </Text>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: muted }]}>QUICK ACTIONS</Text>
            <Pressable style={[styles.actionCard, { backgroundColor: cardBg }]} onPress={handleContactSupport}>
              <View style={styles.actionLeft}>
                <View style={[styles.iconCircle, { backgroundColor: '#dbeafe' }]}>
                  <Ionicons name="mail" size={22} color="#2563eb" />
                </View>
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={styles.actionTitle}>Contact Support</Text>
                  <Text style={[styles.actionSubtitle, { color: muted }]}>Get help from our team</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={muted} />
            </Pressable>

            <Pressable style={[styles.actionCard, { backgroundColor: cardBg }]} onPress={handleReportIssue}>
              <View style={styles.actionLeft}>
                <View style={[styles.iconCircle, { backgroundColor: '#fee2e2' }]}>
                  <Ionicons name="warning" size={22} color="#dc2626" />
                </View>
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={styles.actionTitle}>Report an Issue</Text>
                  <Text style={[styles.actionSubtitle, { color: muted }]}>Let us know about problems</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={muted} />
            </Pressable>
          </View>

          {/* Key Features */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: muted }]}>KEY FEATURES</Text>
            <View style={[styles.card, { backgroundColor: cardBg }]}>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>🔍</Text>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.featureTitle}>Find Tailors</Text>
                  <Text style={[styles.featureDesc, { color: muted }]}>
                    Browse professional tailors, view their portfolios, ratings, and specializations
                  </Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>🧵</Text>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.featureTitle}>3D Customization</Text>
                  <Text style={[styles.featureDesc, { color: muted }]}>
                    Design your garment in 3D before ordering to visualize the final product
                  </Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>📏</Text>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.featureTitle}>Measurement Guidance</Text>
                  <Text style={[styles.featureDesc, { color: muted }]}>
                    Get step-by-step measurement instructions with visual guides
                  </Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>💬</Text>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.featureTitle}>Real-Time Chat</Text>
                  <Text style={[styles.featureDesc, { color: muted }]}>
                    Communicate directly with tailors, share photos and requirements
                  </Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>📦</Text>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.featureTitle}>Order Tracking</Text>
                  <Text style={[styles.featureDesc, { color: muted }]}>
                    Track your order status from measurement to delivery with timeline
                  </Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>💰</Text>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.featureTitle}>Secure Payments</Text>
                  <Text style={[styles.featureDesc, { color: muted }]}>
                    Manage payments through your wallet with transaction history
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* FAQs */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: muted }]}>FREQUENTLY ASKED QUESTIONS</Text>
            
            <Pressable 
              style={[styles.faqCard, { backgroundColor: cardBg }]} 
              onPress={() => handleFAQ('Browse the Find Tailors tab to view available tailors. Check their profiles, ratings, sample work, and specializations. Once you find a tailor, you can place an order directly from their profile.')}
            >
              <Text style={styles.faqQuestion}>How do I find and choose a tailor?</Text>
              <Ionicons name="chevron-forward" size={18} color={muted} />
            </Pressable>

            <Pressable 
              style={[styles.faqCard, { backgroundColor: cardBg }]} 
              onPress={() => handleFAQ('The 3D Customize feature lets you design your garment virtually. Choose style, colors, patterns, and accessories. Share this 3D template with your tailor who will review and approve before starting work.')}
            >
              <Text style={styles.faqQuestion}>What is 3D Customization?</Text>
              <Ionicons name="chevron-forward" size={18} color={muted} />
            </Pressable>

            <Pressable 
              style={[styles.faqCard, { backgroundColor: cardBg }]} 
              onPress={() => handleFAQ('Navigate to Measurement Guidance from your profile or orders. Follow step-by-step instructions with visual guides to take accurate measurements. You can also have your tailor take measurements in person.')}
            >
              <Text style={styles.faqQuestion}>How do I provide measurements?</Text>
              <Ionicons name="chevron-forward" size={18} color={muted} />
            </Pressable>

            <Pressable 
              style={[styles.faqCard, { backgroundColor: cardBg }]} 
              onPress={() => handleFAQ('Use the Chat tab or the Open Chat button on order details to message your tailor. You can send text messages, share photos, and make phone calls directly from the chat screen.')}
            >
              <Text style={styles.faqQuestion}>How do I communicate with my tailor?</Text>
              <Ionicons name="chevron-forward" size={18} color={muted} />
            </Pressable>

            <Pressable 
              style={[styles.faqCard, { backgroundColor: cardBg }]} 
              onPress={() => handleFAQ('Go to the Orders tab to view all your orders. Click on any order to see detailed status, timeline, measurements, and delivery information. You\'ll receive notifications for important updates.')}
            >
              <Text style={styles.faqQuestion}>How do I track my order?</Text>
              <Ionicons name="chevron-forward" size={18} color={muted} />
            </Pressable>

            <Pressable 
              style={[styles.faqCard, { backgroundColor: cardBg }]} 
              onPress={() => handleFAQ('Navigate to the Wallet tab to view your balance, transaction history, and payment methods. You can add funds, make payments, and track all financial transactions.')}
            >
              <Text style={styles.faqQuestion}>How do payments work?</Text>
              <Ionicons name="chevron-forward" size={18} color={muted} />
            </Pressable>
          </View>

          {/* Contact Information */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: muted }]}>CONTACT INFORMATION</Text>
            <View style={[styles.card, { backgroundColor: cardBg }]}>
              <View style={styles.contactRow}>
                <Ionicons name="mail" size={20} color={tint} />
                <Text style={styles.contactText}>support@vtailor.com</Text>
              </View>
              <View style={styles.contactRow}>
                <Ionicons name="call" size={20} color={tint} />
                <Text style={styles.contactText}>+92 300 1234567</Text>
              </View>
              <View style={styles.contactRow}>
                <Ionicons name="location" size={20} color={tint} />
                <Text style={styles.contactText}>Lahore, Pakistan</Text>
              </View>
              <View style={styles.contactRow}>
                <Ionicons name="time" size={20} color={tint} />
                <Text style={styles.contactText}>Mon-Sat: 9 AM - 6 PM</Text>
              </View>
            </View>
          </View>

          {/* Tips */}
          <View style={[styles.tipCard, { backgroundColor: '#dbeafe' }]}>
            <Text style={styles.tipIcon}>💡</Text>
            <Text style={styles.tipTitle}>Pro Tips</Text>
            <Text style={[styles.tipText, { color: '#1e3a8a' }]}>
              • Check tailor ratings and reviews before ordering{'\n'}
              • Use 3D customization to visualize your design{'\n'}
              • Provide accurate measurements for best results{'\n'}
              • Communicate clearly with your tailor{'\n'}
              • Track your order regularly for updates
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
  card: { padding: 16, borderRadius: 12, marginBottom: 16 },
  iconHeader: { alignItems: 'center', marginBottom: 16 },
  iconLarge: { fontSize: 48, marginBottom: 8 },
  appTitle: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 4 },
  version: { fontSize: 13, fontWeight: '600' },
  description: { fontSize: 14, lineHeight: 22, textAlign: 'center' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 12, fontWeight: '700', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  actionCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 12, marginBottom: 12 },
  actionLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  actionTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  actionSubtitle: { fontSize: 12, marginTop: 2 },
  featureItem: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  featureIcon: { fontSize: 24 },
  featureTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 4 },
  featureDesc: { fontSize: 12, lineHeight: 18 },
  faqCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 12, marginBottom: 8 },
  faqQuestion: { fontSize: 14, fontWeight: '600', color: '#111827', flex: 1, marginRight: 8 },
  contactRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  contactText: { fontSize: 14, fontWeight: '600', color: '#111827', marginLeft: 12 },
  tipCard: { padding: 16, borderRadius: 12, marginBottom: 16 },
  tipIcon: { fontSize: 32, marginBottom: 8 },
  tipTitle: { fontSize: 16, fontWeight: '800', color: '#1e3a8a', marginBottom: 8 },
  tipText: { fontSize: 13, lineHeight: 22, fontWeight: '600' },
});
