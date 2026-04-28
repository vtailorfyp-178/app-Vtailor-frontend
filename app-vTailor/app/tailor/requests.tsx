import React, { useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import AppBackButton from '@/components/AppBackButton';
import { SURFACE_MUTED, TEXT_DARK, UI } from '@/constants/ui';

interface CustomerRequest {
  id: string;
  customerName: string;
  dressType: string;
  budget: number;
  submittedDate: string;
  status: 'pending' | 'accepted' | 'declined';
  initials: string;
}

const PENDING_REQUESTS: CustomerRequest[] = [
  {
    id: 'REQ-001',
    customerName: 'Fatima Khan',
    dressType: 'Long Frock',
    budget: 8500,
    submittedDate: '03 Jan 2026 • 2:30 PM',
    status: 'pending',
    initials: 'FK',
  },
  {
    id: 'REQ-002',
    customerName: 'Aisha Ahmed',
    dressType: 'Shalwar Kameez',
    budget: 6000,
    submittedDate: '02 Jan 2026 • 11:15 AM',
    status: 'pending',
    initials: 'AA',
  },
];

export default function TailorRequests() {
  const router = useRouter();
  const tint = useThemeColor({}, 'tint');
  const card = useThemeColor({}, 'card');
  const inputBorder = useThemeColor({}, 'inputBorder');
  const muted = useThemeColor({}, 'muted');

  const [requests, setRequests] = useState<CustomerRequest[]>(PENDING_REQUESTS);

  const handleAccept = (reqId: string) => {
    const acceptedReq = requests.find((r) => r.id === reqId);
    if (acceptedReq) {
      // Navigate tailor to decide price page for this request
      (router as any).push({ pathname: '/tailor/decided-price', params: { orderId: acceptedReq.id, customerName: acceptedReq.customerName, price: String(acceptedReq.budget) } });
      setRequests((prev) => prev.map((req) => (req.id === reqId ? { ...req, status: 'accepted' } : req)));
    }
  };

  const handleDecline = (reqId: string) => {
    setRequests((prev) =>
      prev.map((req) =>
        req.id === reqId ? { ...req, status: 'declined' } : req
      )
    );
  };

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const processedRequests = requests.filter((r) => r.status !== 'pending');

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { backgroundColor: tint }]}>
        <AppBackButton onPress={() => (router as any).back()} variant="tint" />
        <ThemedText style={styles.headerTitle}>Customer Requests</ThemedText>
        <ThemedText style={styles.headerSub}>Review new orders and respond quickly</ThemedText>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Pending Requests Section */}
        <View>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Pending Requests</ThemedText>
            <View style={[styles.badge, { backgroundColor: tint }]}>
              <ThemedText style={styles.badgeText}>{pendingRequests.length}</ThemedText>
            </View>
          </View>

          {pendingRequests.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: card }]}>
              <View style={[styles.emptyIcon, { backgroundColor: '#FCE4F2' }]}>
                <Ionicons name="file-tray-outline" size={26} color={tint} />
              </View>
              <ThemedText style={{ fontWeight: '600', marginBottom: 4 }}>No Pending Requests</ThemedText>
              <ThemedText style={[styles.emptyText, { color: muted }]}>
                You'll get notifications when customers send requests
              </ThemedText>
            </View>
          ) : (
            pendingRequests.map((request) => (
              <View
                key={request.id}
                style={[styles.requestCard, { backgroundColor: card, borderColor: inputBorder }]}
              >
                <View style={styles.requestHeader}>
                  <View style={styles.customerInfo}>
                    <View style={[styles.customerAvatar, { backgroundColor: '#FCE4F2' }]}>
                      <ThemedText style={[styles.customerAvatarText, { color: tint }]}>{request.initials}</ThemedText>
                    </View>
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <ThemedText style={styles.customerName}>{request.customerName}</ThemedText>
                      <ThemedText style={[styles.small, { color: muted }]}>
                        {request.dressType}
                      </ThemedText>
                    </View>
                  </View>
                </View>

                <View style={styles.detailsRow}>
                  <View style={styles.detailItem}>
                    <ThemedText style={[styles.label, { color: muted }]}>Budget</ThemedText>
                    <View style={styles.detailValueRow}>
                      <Ionicons name="cash-outline" size={16} color={tint} />
                      <ThemedText style={styles.value}>Rs {request.budget.toLocaleString()}</ThemedText>
                    </View>
                  </View>
                  <View style={styles.detailItem}>
                    <ThemedText style={[styles.label, { color: muted }]}>Requested</ThemedText>
                    <View style={styles.detailValueRow}>
                      <Ionicons name="time-outline" size={15} color={muted} />
                      <ThemedText style={[styles.small, { color: muted, flex: 1 }]}>{request.submittedDate}</ThemedText>
                    </View>
                  </View>
                </View>

                <View style={[styles.actionButtons, { borderTopColor: inputBorder }]}>
                  <Pressable
                    onPress={() => handleDecline(request.id)}
                    style={[styles.declineBtn, { borderColor: '#dc2626' }]}
                  >
                    <Ionicons name="close" size={18} color="#dc2626" />
                    <ThemedText style={[styles.btnText, { color: '#dc2626' }]}>Decline</ThemedText>
                  </Pressable>

                  <Pressable
                    onPress={() => handleAccept(request.id)}
                    style={[styles.acceptBtn, { backgroundColor: tint }]}
                  >
                    <Ionicons name="checkmark" size={18} color="#fff" />
                    <ThemedText style={[styles.btnText, { color: '#fff' }]}>Accept</ThemedText>
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Processed Requests Section */}
        {processedRequests.length > 0 && (
          <View style={{ marginTop: 20 }}>
            <ThemedText style={styles.sectionTitle}>Processed Requests</ThemedText>

            {processedRequests.map((request) => (
              <View
                key={request.id}
                style={[
                  styles.requestCard,
                  styles.processedCard,
                  {
                    backgroundColor: request.status === 'accepted' ? '#ecfdf5' : '#fff1f2',
                    borderColor: request.status === 'accepted' ? '#059669' : '#dc2626',
                  },
                ]}
              >
                <View style={styles.requestHeader}>
                  <View style={styles.customerInfo}>
                    <View style={[styles.customerAvatar, { backgroundColor: '#FCE4F2' }]}>
                      <ThemedText style={[styles.customerAvatarText, { color: tint }]}>{request.initials}</ThemedText>
                    </View>
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <ThemedText style={styles.customerName}>{request.customerName}</ThemedText>
                      <ThemedText style={[styles.small, { color: muted }]}>
                        {request.dressType}
                      </ThemedText>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          request.status === 'accepted' ? '#ecfdf5' : '#fff1f2',
                      },
                    ]}
                  >
                    <Ionicons
                      name={request.status === 'accepted' ? 'checkmark-circle' : 'close-circle'}
                      size={20}
                      color={request.status === 'accepted' ? '#059669' : '#dc2626'}
                    />
                    <ThemedText
                      style={[
                        styles.statusText,
                        {
                          color: request.status === 'accepted' ? '#059669' : '#dc2626',
                        },
                      ]}
                    >
                      {request.status === 'accepted' ? 'Accepted' : 'Declined'}
                    </ThemedText>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SURFACE_MUTED },
  header: {
    paddingTop: 40,
    paddingHorizontal: 16,
    paddingBottom: 18,
    gap: 10,
  },
  headerTitle: { color: '#fff', fontWeight: '900', fontSize: 22 },
  headerSub: { color: '#fff', opacity: 0.88, fontSize: 13, fontWeight: '600' },
  scroll: { padding: 16, paddingBottom: 120 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: '900', color: TEXT_DARK },
  badge: { marginLeft: 12, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: '#fff', fontWeight: '600', fontSize: 12 },
  emptyState: {
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
    ...UI.softShadow,
  },
  emptyIcon: { width: 58, height: 58, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyText: { fontSize: 12, textAlign: 'center' },
  requestCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    ...UI.softShadow,
  },
  processedCard: { opacity: 0.7 },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerInfo: { flexDirection: 'row', flex: 1, alignItems: 'center' },
  customerAvatar: { width: 48, height: 48, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  customerAvatarText: { fontSize: 15, fontWeight: '900' },
  customerName: { fontSize: 15, fontWeight: '900', color: TEXT_DARK },
  small: { fontSize: 12, marginTop: 2 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: { marginLeft: 6, fontWeight: '600', fontSize: 12 },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  detailItem: { flex: 1 },
  label: { fontSize: 11 },
  detailValueRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 },
  value: { fontSize: 14, fontWeight: '900', color: TEXT_DARK },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  declineBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderWidth: 1.5,
    borderRadius: 14,
    marginRight: 8,
  },
  acceptBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 14,
  },
  btnText: { marginLeft: 6, fontWeight: '600', fontSize: 12 },
});
