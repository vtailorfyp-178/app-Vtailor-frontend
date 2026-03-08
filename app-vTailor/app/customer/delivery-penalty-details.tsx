import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface OrderRecord {
  id: string;
  customerName: string;
  orderAmount: number;
  deliveryDate: string | Date;
  orderType: string;
  status: string;
  daysLeft?: number;
  lateDays?: number;
  penalty?: number;
}

const CustomerDeliveryPenaltyDetailsScreen = () => {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const data = await AsyncStorage.getItem('vtailor_penalty_orders');
        if (data) {
          const parsedOrders = JSON.parse(data).map((o: any) => ({
            ...o,
            deliveryDate: o.deliveryDate ? new Date(o.deliveryDate) : new Date(),
          }));
          setOrders(parsedOrders);
        }
      } catch (error) {
        // fail silently
      } finally {
        setLoading(false);
      }
    };
    loadOrders();
  }, []);

  const getTotalAllocatedDays = (order: OrderRecord): number => {
    const deliveryDate = new Date(order.deliveryDate);
    const today = new Date();
    
    // Assuming order created ~7 days before delivery as standard
    const daysAllocated = Math.ceil((deliveryDate.getTime() - (deliveryDate.getTime() - 7 * 24 * 60 * 60 * 1000)) / (1000 * 60 * 60 * 24));
    return 7; // Standard allocation
  };

  const getStatusColor = (status: string | undefined): string => {
    if (!status) return '#10b981';
    if (status.includes('Late')) return '#ef4444';
    if (status === 'Due Today') return '#f59e0b';
    return '#10b981';
  };

  return (
    <ProtectedRoute requiredRole="customer">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#3b82f6" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.heading}>Delivery & Penalty Details</Text>
            <Text style={styles.subheading}>Order tracking and penalty information</Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Info Banner */}
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle" size={20} color="#3b82f6" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.bannerTitle}>Important Information</Text>
              <Text style={styles.bannerText}>
                Penalties are applied to the tailor only. No charges are deducted from your account.
              </Text>
            </View>
          </View>

          {/* Orders List */}
          {orders.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-done-circle" size={48} color="#10b981" />
              <Text style={styles.emptyText}>No late deliveries</Text>
              <Text style={styles.emptySubtext}>All your orders are on track or completed on time!</Text>
            </View>
          ) : (
            orders.map((order) => {
              const totalAllocatedDays = getTotalAllocatedDays(order);
              const lateDays = order.lateDays || 0;
              const penaltyRate = lateDays > 0 ? lateDays * 1 : 0; // 1% per day
              const penalty = order.penalty || 0;
              const isLate = lateDays > 0;

              return (
                <View key={order.id} style={styles.orderCard}>
                  {/* Order Header */}
                  <View style={styles.orderHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.orderId}>{order.id}</Text>
                      <Text style={styles.orderType}>{order.orderType}</Text>
                      <Text style={styles.tailorName}>👤 {order.customerName}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                        {order.status}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  {/* Order Details Grid */}
                  <View style={styles.detailsGrid}>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Order Price</Text>
                      <Text style={styles.detailValue}>Rs {order.orderAmount?.toLocaleString() || 0}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Expected Delivery</Text>
                      <Text style={styles.detailValue}>
                        {new Date(order.deliveryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailsGrid}>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Total Days Allocated</Text>
                      <Text style={styles.detailValue}>{totalAllocatedDays} days</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Status</Text>
                      <Text style={[styles.detailValue, { color: isLate ? '#ef4444' : '#10b981' }]}>
                        {isLate ? 'Late Delivery' : 'On Time'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  {/* Penalty Information Section */}
                  {isLate ? (
                    <View style={styles.penaltySection}>
                      <Text style={styles.sectionTitle}>Penalty Applied to Tailor</Text>

                      <View style={styles.penaltyRow}>
                        <Text style={styles.penaltyLabel}>Number of Late Days</Text>
                        <Text style={[styles.penaltyValue, { color: '#ef4444' }]}>{lateDays} day(s)</Text>
                      </View>

                      <View style={styles.penaltyRow}>
                        <Text style={styles.penaltyLabel}>Penalty Rate</Text>
                        <Text style={styles.penaltyValue}>1% per day</Text>
                      </View>

                      <View style={styles.penaltyRow}>
                        <Text style={styles.penaltyLabel}>Total Penalty Calculation</Text>
                        <Text style={styles.penaltyValue}>{penaltyRate}% of Rs {order.orderAmount?.toLocaleString() || 0}</Text>
                      </View>

                      <View style={styles.penaltyDivider} />

                      <View style={styles.penaltyRow}>
                        <Text style={[styles.penaltyLabel, { fontWeight: '700' }]}>Total Penalty Amount</Text>
                        <Text style={[styles.penaltyValue, { color: '#ef4444', fontWeight: '700', fontSize: 16 }]}>
                          - Rs {penalty.toFixed(0)}
                        </Text>
                      </View>

                      <View style={styles.penaltyNote}>
                        <Text style={styles.noteText}>
                          This amount is deducted from the tailor's earnings only. Your payment remains unchanged.
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.onTimeSection}>
                      <Ionicons name="checkmark-circle" size={32} color="#10b981" />
                      <Text style={styles.onTimeText}>Delivered On Time</Text>
                      <Text style={styles.onTimeSubtext}>No penalties applied. Order completed within the delivery window.</Text>
                    </View>
                  )}

                  {/* Disclaimer */}
                  <View style={styles.disclaimerBox}>
                    <Ionicons name="shield-checkmark" size={18} color="#3b82f6" />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.disclaimerTitle}>Penalty Policy</Text>
                      <Text style={styles.disclaimerText}>
                        Tailor penalties: 1% per day late • Customer not charged • View-only information
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}

          <View style={{ height: 80 }} />
        </ScrollView>
      </View>
    </ProtectedRoute>
  );
};

export default CustomerDeliveryPenaltyDetailsScreen;

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
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    margin: 16,
    padding: 14,
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  bannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e40af',
    marginBottom: 2,
  },
  bannerText: {
    fontSize: 12,
    color: '#1e3a8a',
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
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
    textAlign: 'center',
  },
  orderCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 14,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  orderType: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  tailorName: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    height: 32,
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 12,
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  penaltySection: {
    backgroundColor: '#fef2f2',
    padding: 14,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ef4444',
    marginBottom: 12,
  },
  penaltyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  penaltyLabel: {
    fontSize: 13,
    color: '#991b1b',
    fontWeight: '500',
  },
  penaltyValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  penaltyDivider: {
    height: 1,
    backgroundColor: '#fecaca',
    marginVertical: 10,
  },
  penaltyNote: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#fecaca',
  },
  noteText: {
    fontSize: 12,
    color: '#991b1b',
    fontWeight: '500',
    lineHeight: 18,
  },
  onTimeSection: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#ecfdf5',
    borderRadius: 10,
    marginBottom: 12,
  },
  onTimeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#047857',
    marginTop: 12,
  },
  onTimeSubtext: {
    fontSize: 12,
    color: '#059669',
    marginTop: 4,
    textAlign: 'center',
  },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    backgroundColor: '#f0f9ff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  disclaimerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e40af',
    marginBottom: 2,
  },
  disclaimerText: {
    fontSize: 11,
    color: '#1e3a8a',
    lineHeight: 16,
  },
});
