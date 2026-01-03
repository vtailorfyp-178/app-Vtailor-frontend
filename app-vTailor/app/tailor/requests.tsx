import React, { useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';

interface CustomerRequest {
  id: string;
  customerName: string;
  dressType: string;
  budget: number;
  submittedDate: string;
  status: 'pending' | 'accepted' | 'declined';
  customerImage?: string;
}

const PENDING_REQUESTS: CustomerRequest[] = [
  {
    id: 'REQ-001',
    customerName: 'Fatima Khan',
    dressType: 'Long Frock',
    budget: 8500,
    submittedDate: '03 Jan 2026 • 2:30 PM',
    status: 'pending',
    customerImage: '👩',
  },
  {
    id: 'REQ-002',
    customerName: 'Aisha Ahmed',
    dressType: 'Shalwar Kameez',
    budget: 6000,
    submittedDate: '02 Jan 2026 • 11:15 AM',
    status: 'pending',
    customerImage: '👩‍🦱',
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
    setRequests((prev) =>
      prev.map((req) =>
        req.id === reqId ? { ...req, status: 'accepted' } : req
      )
    );
    // Show success notification
    setTimeout(() => {
      // Could add toast notification here
    }, 500);
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
        <Pressable onPress={() => (router as any).back()}>
          <ThemedText style={{ color: '#fff' }}>{'< Back'}</ThemedText>
        </Pressable>
        <ThemedText style={styles.headerTitle}>Customer Requests</ThemedText>
        <View style={{ width: 56 }} />
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
              <ThemedText style={{ fontSize: 40, marginBottom: 8 }}>📭</ThemedText>
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
                    <ThemedText style={styles.customerAvatar}>{request.customerImage}</ThemedText>
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
                    <ThemedText style={styles.value}>Rs {request.budget.toLocaleString()}</ThemedText>
                  </View>
                  <View style={styles.detailItem}>
                    <ThemedText style={[styles.label, { color: muted }]}>Requested</ThemedText>
                    <ThemedText style={[styles.small, { color: muted }]}>{request.submittedDate}</ThemedText>
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
                    <ThemedText style={styles.customerAvatar}>{request.customerImage}</ThemedText>
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
  container: { flex: 1 },
  header: {
    paddingTop: 40,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { color: '#fff', fontWeight: '700', fontSize: 16 },
  scroll: { padding: 12, paddingBottom: 20 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  badge: { marginLeft: 12, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: '#fff', fontWeight: '600', fontSize: 12 },
  emptyState: {
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: { fontSize: 12, textAlign: 'center' },
  requestCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  processedCard: { opacity: 0.7 },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerInfo: { flexDirection: 'row', flex: 1 },
  customerAvatar: { fontSize: 36 },
  customerName: { fontSize: 14, fontWeight: '600' },
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
  },
  detailItem: { flex: 1 },
  label: { fontSize: 11 },
  value: { fontSize: 14, fontWeight: '600', marginTop: 4 },
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
    borderRadius: 8,
    marginRight: 8,
  },
  acceptBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  btnText: { marginLeft: 6, fontWeight: '600', fontSize: 12 },
});
