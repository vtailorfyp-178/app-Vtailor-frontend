import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface OrderRecord {
  id: string;
  customerName: string;
  orderAmount: number;
  deliveryDate: string | Date;
  orderType: string;
  status: string;
  completionDate?: string | Date;
  daysLeft?: number;
  lateDays?: number;
  penalty?: number;
}

const CustomerDeliveryPenaltyDetailScreen = () => {
  const router = useRouter();
  const { customerId, orderId } = useLocalSearchParams();
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [daysLeft, setDaysLeft] = useState(0);
  const [lateDays, setLateDays] = useState(0);
  const [penaltyAmount, setPenaltyAmount] = useState(0);

  useEffect(() => {
    loadOrderDetails();
  }, []);

  const loadOrderDetails = async () => {
    try {
      const data = await AsyncStorage.getItem('vtailor_penalty_orders');
      if (data) {
        const orders = JSON.parse(data);
        const selectedOrder = orders.find((o: any) => o.id === orderId);
        if (selectedOrder) {
          const deliveryDate = new Date(selectedOrder.deliveryDate);
          const today = new Date();
          const diff = deliveryDate.getTime() - today.getTime();
          const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

          setDaysLeft(days);
          if (days < 0) {
            setLateDays(Math.abs(days));
            setPenaltyAmount((selectedOrder.orderAmount || 0) * (Math.abs(days) * 0.01));
          }

          setOrder(selectedOrder);
        }
      }
    } catch (error) {
      // fail silently
    } finally {
      setLoading(false);
    }
  };

  if (!order) {
    return (
      <ProtectedRoute requiredRole="tailor">
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.heading}>Delivery Details</Text>
            </View>
          </View>
          <View style={styles.emptyState}>
            <Ionicons name="alert-circle" size={48} color="#ef4444" />
            <Text style={styles.emptyText}>Order Not Found</Text>
            <Text style={styles.emptySubtext}>This order could not be located</Text>
          </View>
        </View>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="tailor">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.heading}>Delivery Details</Text>
            <Text style={styles.subheading}>{order.customerName}</Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Order Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.cardSection}>
              <View style={styles.sectionLeft}>
                <Text style={styles.sectionLabel}>Order ID</Text>
                <Text style={styles.sectionValue}>{order.id}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.sectionRight}>
                <Text style={styles.sectionLabel}>Order Type</Text>
                <Text style={styles.sectionValue}>{order.orderType || 'Custom'}</Text>
              </View>
            </View>
          </View>

          {/* Customer & Amount Card */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <Ionicons name="person-circle" size={32} color="#3b82f6" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Customer Name</Text>
                <Text style={styles.infoValue}>{order.customerName}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <Ionicons name="cash" size={32} color="#10b981" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Order Amount</Text>
                <Text style={styles.infoValue}>Rs {(order.orderAmount || 0).toLocaleString()}</Text>
              </View>
            </View>
          </View>

          {/* Delivery Timeline */}
          <View style={styles.timelineCard}>
            <Text style={styles.cardTitle}>Delivery Timeline</Text>
            <View style={styles.timelineRow}>
              <View style={styles.timelineLeft}>
                <Ionicons name="calendar-outline" size={20} color="#6b7280" />
                <Text style={styles.timelineLabel}>Delivery Date</Text>
              </View>
              <Text style={styles.timelineValue}>
                {new Date(order.deliveryDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </View>
            <View style={styles.timelineRow}>
              <View style={styles.timelineLeft}>
                <Ionicons name="timer-outline" size={20} color="#6b7280" />
                <Text style={styles.timelineLabel}>Days Allocated</Text>
              </View>
              <Text style={styles.timelineValue}>14 days</Text>
            </View>
          </View>

          {/* Penalty Section */}
          {lateDays > 0 ? (
            <View style={styles.penaltyCard}>
              <View style={styles.penaltyHeader}>
                <Ionicons name="alert-circle" size={24} color="#ef4444" />
                <Text style={styles.penaltyTitle}>Late Delivery Penalty</Text>
              </View>
              <View style={styles.penaltyDetails}>
                <View style={styles.penaltyRow}>
                  <Text style={styles.penaltyLabel}>Days Late</Text>
                  <Text style={styles.penaltyValue}>{lateDays} day{lateDays !== 1 ? 's' : ''}</Text>
                </View>
                <View style={styles.dividerLine} />
                <View style={styles.penaltyRow}>
                  <Text style={styles.penaltyLabel}>Penalty Rate</Text>
                  <Text style={styles.penaltyValue}>1% per day</Text>
                </View>
                <View style={styles.dividerLine} />
                <View style={styles.penaltyRow}>
                  <Text style={styles.penaltyLabel}>Total Late Penalty</Text>
                  <Text style={[styles.penaltyValue, { fontWeight: '700', color: '#ef4444' }]}>
                    Rs {penaltyAmount.toFixed(2)}
                  </Text>
                </View>
              </View>
              <View style={styles.noteBox}>
                <Ionicons name="information-circle" size={16} color="#1e40af" />
                <Text style={styles.noteText}>
                  This penalty is deducted from your wallet. Ensure on-time deliveries to maintain good standing.
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.onTimeCard}>
              <Ionicons name="checkmark-done-circle" size={32} color="#10b981" />
              <Text style={styles.onTimeTitle}>Delivered On Time</Text>
              <Text style={styles.onTimeSubtext}>No penalties applied</Text>
            </View>
          )}

          {/* Status Info Card */}
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Current Status</Text>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      lateDays > 0 ? '#fecaca' : daysLeft >= 0 ? '#dcfce7' : '#fecaca',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    {
                      color: lateDays > 0 ? '#b91c1c' : daysLeft >= 0 ? '#15803d' : '#b91c1c',
                    },
                  ]}
                >
                  {lateDays > 0 ? `${lateDays} Days Late` : daysLeft >= 0 ? `${daysLeft} Days Left` : 'Completed'}
                </Text>
              </View>
            </View>
          </View>

          {/* Important Note */}
          <View style={styles.disclaimerBox}>
            <Ionicons name="warning" size={20} color="#d97706" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.disclaimerTitle}>Important</Text>
              <Text style={styles.disclaimerText}>
                This screen shows real-time penalty calculations. Ensure on-time deliveries to avoid penalties.
              </Text>
            </View>
          </View>

          <View style={{ height: 80 }} />
        </ScrollView>
      </View>
    </ProtectedRoute>
  );
};

export default CustomerDeliveryPenaltyDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.select({ ios: 64, android: 36, default: 36 }),
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
  },
  subheading: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 8,
  },
  summaryCard: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  cardSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  sectionLeft: {
    flex: 1,
  },
  sectionRight: {
    flex: 1,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 12,
  },
  sectionLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  infoCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoLeft: {
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  timelineCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  timelineLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timelineLabel: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  timelineValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  penaltyCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
    overflow: 'hidden',
  },
  penaltyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#fecaca',
    gap: 8,
  },
  penaltyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#991b1b',
  },
  penaltyDetails: {
    padding: 16,
  },
  penaltyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  penaltyLabel: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  penaltyValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  dividerLine: {
    height: 1,
    backgroundColor: '#fecaca',
    marginVertical: 8,
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    margin: 12,
    padding: 12,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    gap: 8,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    color: '#1e40af',
    fontWeight: '500',
  },
  onTimeCard: {
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 32,
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  onTimeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#15803d',
    marginTop: 12,
  },
  onTimeSubtext: {
    fontSize: 12,
    color: '#22c55e',
    marginTop: 4,
  },
  statusCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 14,
    backgroundColor: '#fffbeb',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#d97706',
    gap: 8,
  },
  disclaimerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#b45309',
    marginBottom: 2,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#92400e',
    lineHeight: 18,
  },
});
