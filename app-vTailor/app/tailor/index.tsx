import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ThemedText } from '@/components/themed-text';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

type Order = {
  id: string;
  customer: string;
  status: 'pending' | 'in_progress' | 'ready' | 'delivered';
  price: number;
  timeLeft: string;
  measurementsTaken: boolean;
  stitchingStage: string;
  rating?: number;
  modelPreview?: string;
};

const sampleOrders: Order[] = [
  { id: 'ORD001', customer: 'Aisha Khan', status: 'in_progress', price: 1200, timeLeft: '2d 5h', measurementsTaken: true, stitchingStage: 'Cutting', rating: 4.5, modelPreview: '' },
  { id: 'ORD002', customer: 'Sara Ali', status: 'pending', price: 850, timeLeft: '5d 1h', measurementsTaken: false, stitchingStage: 'Not started', rating: undefined, modelPreview: '' },
  { id: 'ORD003', customer: 'Nadia Hussain', status: 'ready', price: 1500, timeLeft: '0d 12h', measurementsTaken: true, stitchingStage: 'Finishing', rating: 5, modelPreview: '' },
];

const TailorDashboard = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>(sampleOrders);
  const [notifications] = useState<string[]>(['New message from Aisha', 'Order ORD002 payment pending']);
  const [stitchingUpdates, setStitchingUpdates] = useState<Record<string, string[]>>({
    ORD001: ['Cutting started'],
    ORD002: [],
    ORD003: ['Finishing done'],
  });
  const router = useRouter();

  const addStitchingUpdate = (orderId: string) => {
    setStitchingUpdates((prev) => ({ ...prev, [orderId]: [...(prev[orderId] || []), `Updated at ${new Date().toLocaleTimeString()}`] }));
  };

  return (
    <ProtectedRoute requiredRole="tailor">
      <View style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.wrapper}>

          <View style={styles.headerCard}>
            <View>
              <Text style={styles.welcome}>Welcome,</Text>
              <Text style={styles.name}>{user?.name ?? 'Tailor'}</Text>
            </View>
            <Pressable style={styles.bell} onPress={() => router.push('/tailor/notifications')}>
              <Text style={styles.bellIcon}>🔔</Text>
              {notifications.length > 0 && <View style={styles.bellCount}><Text style={styles.bellCountText}>{notifications.length}</Text></View>}
            </Pressable>
          </View>

          <View style={styles.featureBoxesRow}>
            <Pressable style={styles.featureBox} onPress={() => router.push('/tailor/3d')}>
              <Text style={styles.featureTitle}>3D Review</Text>
              <Text style={styles.featureSub}>View customer 3D previews</Text>
            </Pressable>
            <Pressable style={styles.featureBox} onPress={() => router.push('/tailor/measurements')}>
              <Text style={styles.featureTitle}>Measurements</Text>
              <Text style={styles.featureSub}>View / edit measurement forms</Text>
            </Pressable>
            <Pressable style={styles.featureBox} onPress={() => router.push('/tailor/timeline')}>
              <Text style={styles.featureTitle}>Stitching Timeline</Text>
              <Text style={styles.featureSub}>Update stitching progress</Text>
            </Pressable>
          </View>

          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Current Customers</ThemedText>
            {orders.map((o) => (
              <View key={o.id} style={styles.card}>
                <View style={styles.cardRow}>
                  <ThemedText style={styles.cardTitle}>{o.customer}</ThemedText>
                  <ThemedText style={styles.small}>{o.id}</ThemedText>
                </View>
                <ThemedText style={styles.small}>Status: {o.status.replace('_', ' ')} • Rs {o.price} • {o.timeLeft} left</ThemedText>
                <View style={styles.cardRow}>
                  <Pressable style={styles.button} onPress={() => router.push('/tailor/orders')}>
                    <ThemedText style={styles.buttonText}>Open Orders</ThemedText>
                  </Pressable>
                  <Pressable style={styles.buttonOutline} onPress={() => router.push('/tailor/measurements')}>
                    <ThemedText style={styles.buttonOutlineText}>{o.measurementsTaken ? 'Measurements' : 'Take Measurements'}</ThemedText>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Penalty System</ThemedText>
            <View style={styles.card}>
              <Text style={styles.small}>Penalties are applied when delivery timelines are missed. Each missed deadline adds a percentage penalty to the tailor's payout and sends a notification to the customer. Repeated penalties may reduce visibility in tailor listings.</Text>
            </View>
          </View>

        </ScrollView>
      </View>
    </ProtectedRoute>
  );
};

const styles = StyleSheet.create({
  wrapper: { padding: 16, paddingBottom: 120 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 12 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  card: { padding: 12, borderRadius: 8, backgroundColor: '#fff', marginBottom: 8, borderWidth: 1, borderColor: '#e5e7eb' },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  badge: { fontSize: 12, color: '#065f46', backgroundColor: '#d1fae5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  small: { fontSize: 12, color: '#6b7280', marginBottom: 8 },
  button: { backgroundColor: '#111827', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  buttonText: { color: '#fff', fontWeight: '600' },
  buttonOutline: { borderColor: '#111827', borderWidth: 1, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  buttonOutlineText: { color: '#111827', fontWeight: '600' },
  headerCard: { backgroundColor: '#ffe4f0', padding: 16, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  welcome: { color: '#6b21a8', fontSize: 14 },
  name: { fontSize: 20, fontWeight: '700', color: '#6b21a8' },
  bell: { position: 'relative', padding: 8 },
  bellIcon: { fontSize: 20 },
  bellCount: { position: 'absolute', right: 2, top: 2, backgroundColor: '#ff2d55', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  bellCountText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  tabsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tab: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: '#f3f4f6' },
  tabActive: { backgroundColor: '#6b21a8' },
  tabText: { color: '#374151', fontWeight: '600' },
  tabTextActive: { color: '#fff', fontWeight: '700' },
  featureBoxesRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  featureBox: { flex: 1, padding: 12, borderRadius: 12, backgroundColor: '#fff', marginRight: 8, borderWidth: 1, borderColor: '#f3d1de' },
  featureTitle: { fontWeight: '700', color: '#6b21a8', marginBottom: 6 },
  featureSub: { color: '#6b7280', fontSize: 12 },
});

export default TailorDashboard;
