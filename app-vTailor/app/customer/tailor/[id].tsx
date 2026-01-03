import React, { useState, useEffect } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';

type TailorData = {
  id: number;
  name: string;
  rating: number;
  reviews: number;
  experience: number;
  distance: string;
  specialization: string[];
  avatar: string;
  isAvailable: boolean;
};

type RequestStatus = 'idle' | 'sending' | 'accepted' | 'declined';

const TAILORS: Record<number, TailorData> = {
  1: { id: 1, name: 'Ahmad Master Tailor', rating: 4.9, reviews: 156, experience: 15, distance: '0.8 km', specialization: ['Formal', 'Wedding'], avatar: '👨‍🔧', isAvailable: true },
  2: { id: 2, name: 'Karachi Tailoring House', rating: 4.7, reviews: 89, experience: 10, distance: '1.2 km', specialization: ['Casual'], avatar: '🧵', isAvailable: true },
  3: { id: 3, name: 'Classic Stitchers', rating: 4.8, reviews: 210, experience: 20, distance: '2.5 km', specialization: ['Traditional'], avatar: '✂️', isAvailable: false },
};

export default function TailorDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const tint = useThemeColor({}, 'tint');
  const card = useThemeColor({}, 'card');
  const inputBorder = useThemeColor({}, 'inputBorder');
  const muted = useThemeColor({}, 'muted');

  const tailorId = parseInt(id as string);
  const tailor = TAILORS[tailorId];
  const [requestStatus, setRequestStatus] = useState<RequestStatus>('idle');

  const handleSendRequest = () => {
    setRequestStatus('sending');
    // Simulate random tailor response (70% accept, 30% decline)
    setTimeout(() => {
      const accepted = Math.random() > 0.3;
      setRequestStatus(accepted ? 'accepted' : 'declined');
    }, 3000);
  };

  useEffect(() => {
    if (requestStatus === 'accepted') {
      // Show notification after acceptance
      const timer = setTimeout(() => {
        // Could integrate with notification system here
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [requestStatus]);

  if (!tailor) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.header, { backgroundColor: tint }]}>
          <Pressable onPress={() => (router as any).back()}>
            <ThemedText style={{ color: '#fff' }}>{'< Back'}</ThemedText>
          </Pressable>
          <ThemedText style={styles.headerTitle}>Tailor Not Found</ThemedText>
          <View style={{ width: 56 }} />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { backgroundColor: tint }]}>
        <Pressable onPress={() => (router as any).back()}>
          <ThemedText style={{ color: '#fff' }}>{'< Back'}</ThemedText>
        </Pressable>
        <ThemedText style={styles.headerTitle}>Tailor Profile</ThemedText>
        <View style={{ width: 56 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Sending Request Status */}
        {requestStatus === 'sending' && (
          <View style={[styles.statusCard, { backgroundColor: '#fffbeb', borderColor: '#b45309' }]}>
            <ThemedText style={{ fontSize: 40, marginBottom: 12 }}>⏳</ThemedText>
            <ThemedText style={{ fontSize: 18, fontWeight: '700', marginBottom: 8, textAlign: 'center' }}>
              Request Sending...
            </ThemedText>
            <ThemedText style={[styles.statusText, { color: '#b45309' }]}>
              Waiting for {tailor.name} to accept your request
            </ThemedText>
          </View>
        )}

        {/* Accepted Status */}
        {requestStatus === 'accepted' && (
          <View style={[styles.statusCard, { backgroundColor: '#ecfdf5', borderColor: '#059669' }]}>
            <ThemedText style={{ fontSize: 40, marginBottom: 12 }}>✅</ThemedText>
            <ThemedText style={{ fontSize: 18, fontWeight: '700', marginBottom: 8, textAlign: 'center' }}>
              Request Accepted!
            </ThemedText>
            <ThemedText style={[styles.statusText, { color: '#059669' }]}>
              {tailor.name} has accepted your request and will contact you soon.
            </ThemedText>
            <Pressable
              onPress={() => (router as any).replace('/customer')}
              style={[styles.proceedBtn, { backgroundColor: tint }]}
            >
              <ThemedText style={{ color: '#fff', fontWeight: '600' }}>Back to Dashboard</ThemedText>
            </Pressable>
          </View>
        )}

        {/* Declined Status */}
        {requestStatus === 'declined' && (
          <View style={[styles.statusCard, { backgroundColor: '#fff1f2', borderColor: '#dc2626' }]}>
            <ThemedText style={{ fontSize: 40, marginBottom: 12 }}>❌</ThemedText>
            <ThemedText style={{ fontSize: 18, fontWeight: '700', marginBottom: 8, textAlign: 'center' }}>
              Request Declined
            </ThemedText>
            <ThemedText style={[styles.statusText, { color: '#dc2626' }]}>
              {tailor.name} cannot take this order at the moment. Try finding another tailor.
            </ThemedText>
            <Pressable
              onPress={() => (router as any).replace('/customer/find-tailors')}
              style={[styles.proceedBtn, { backgroundColor: tint }]}
            >
              <ThemedText style={{ color: '#fff', fontWeight: '600' }}>Find Another Tailor</ThemedText>
            </Pressable>
          </View>
        )}

        {/* Tailor Details */}
        {requestStatus === 'idle' && (
          <>
            <View style={[styles.profileCard, { backgroundColor: card, borderColor: inputBorder }]}>
              <ThemedText style={styles.avatarLarge}>{tailor.avatar}</ThemedText>
              <ThemedText style={styles.tailorName}>{tailor.name}</ThemedText>

              <View style={styles.ratingRow}>
                <ThemedText style={styles.ratingText}>⭐ {tailor.rating.toFixed(1)}</ThemedText>
                <ThemedText style={[styles.reviewsText, { color: muted }]}>({tailor.reviews} reviews)</ThemedText>
              </View>

              <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                  <ThemedText style={[styles.detailLabel, { color: muted }]}>Experience</ThemedText>
                  <ThemedText style={styles.detailValue}>{tailor.experience}+ years</ThemedText>
                </View>
                <View style={styles.detailItem}>
                  <ThemedText style={[styles.detailLabel, { color: muted }]}>Distance</ThemedText>
                  <ThemedText style={styles.detailValue}>{tailor.distance}</ThemedText>
                </View>
              </View>

              <View style={styles.availabilityBadge}>
                <Ionicons
                  name={tailor.isAvailable ? 'checkmark-circle' : 'close-circle'}
                  size={20}
                  color={tailor.isAvailable ? '#059669' : '#dc2626'}
                />
                <ThemedText style={{ marginLeft: 8 }}>
                  {tailor.isAvailable ? 'Available Now' : 'Not Available'}
                </ThemedText>
              </View>
            </View>

            <View style={[styles.sectionCard, { backgroundColor: card, borderColor: inputBorder }]}>
              <ThemedText style={styles.sectionTitle}>Specialization</ThemedText>
              <View style={styles.tagsContainer}>
                {tailor.specialization.map((spec, idx) => (
                  <View key={idx} style={[styles.tag, { backgroundColor: tint }]}>
                    <ThemedText style={{ color: '#fff', fontSize: 12 }}>{spec}</ThemedText>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.footer}>
              <Pressable
                onPress={handleSendRequest}
                disabled={!tailor.isAvailable}
                style={[
                  styles.sendRequestBtn,
                  { backgroundColor: tailor.isAvailable ? tint : '#d1d5db' },
                ]}
              >
                <ThemedText style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>
                  Send Request
                </ThemedText>
              </Pressable>
            </View>
          </>
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
  scroll: { padding: 12, paddingBottom: 100 },
  statusCard: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    marginBottom: 16,
  },
  statusText: { fontSize: 14, textAlign: 'center', marginBottom: 12 },
  proceedBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 16,
    alignItems: 'center',
  },
  profileCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarLarge: { fontSize: 60, marginBottom: 12 },
  tailorName: { fontSize: 20, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  ratingText: { fontSize: 14, fontWeight: '600' },
  reviewsText: { fontSize: 12, marginLeft: 8 },
  detailsGrid: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: 16 },
  detailItem: { alignItems: 'center' },
  detailLabel: { fontSize: 12, marginBottom: 4 },
  detailValue: { fontSize: 14, fontWeight: '600' },
  availabilityBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  sectionCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  tag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginRight: 8, marginBottom: 8 },
  footer: { paddingHorizontal: 12, paddingBottom: 20 },
  sendRequestBtn: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
});
