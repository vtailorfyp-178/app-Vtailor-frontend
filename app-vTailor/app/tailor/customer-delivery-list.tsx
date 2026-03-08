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
}

const CustomerDeliveryListScreen = () => {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const data = await AsyncStorage.getItem('vtailor_penalty_orders');
      if (data) {
        const parsedOrders = JSON.parse(data).map((o: any) => ({
          ...o,
          deliveryDate: o.deliveryDate ? new Date(o.deliveryDate) : new Date(),
        }));
        // Filter orders that are still active (not completed long ago)
        const activeOrders = parsedOrders.filter((o: any) => {
          const today = new Date();
          const daysLeft = Math.ceil((new Date(o.deliveryDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          return daysLeft > -30; // Show orders within 30 days of delivery
        });
        setOrders(activeOrders);
      }
    } catch (error) {
      // fail silently
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (daysLeft: number | undefined): string => {
    if (!daysLeft) return '#10b981';
    if (daysLeft < 0) return '#ef4444';
    if (daysLeft <= 2) return '#f59e0b';
    return '#10b981';
  };

  const getStatusLabel = (daysLeft: number | undefined): string => {
    if (!daysLeft) return 'On Track';
    if (daysLeft < 0) return `${Math.abs(daysLeft)} Days Late`;
    if (daysLeft === 0) return 'Due Today';
    return `${daysLeft} Days Left`;
  };

  return (
    <ProtectedRoute requiredRole="tailor">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.heading}>Customer Deliveries</Text>
            <Text style={styles.subheading}>Active orders & delivery tracking</Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Info Card */}
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={20} color="#3b82f6" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.infoTitle}>Active Customers</Text>
              <Text style={styles.infoText}>Click on a customer to view detailed penalty information</Text>
            </View>
          </View>

          {/* Customer List */}
          {orders.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-done-circle" size={48} color="#10b981" />
              <Text style={styles.emptyText}>No Active Deliveries</Text>
              <Text style={styles.emptySubtext}>All orders are completed or on track</Text>
            </View>
          ) : (
            <View style={styles.ordersList}>
              {orders.map((order) => {
                const today = new Date();
                const daysLeft = Math.ceil((new Date(order.deliveryDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                const statusColor = getStatusColor(daysLeft);
                const statusLabel = getStatusLabel(daysLeft);

                return (
                  <TouchableOpacity
                    key={order.id}
                    style={styles.customerCard}
                    onPress={() => {
                      router.push({
                        pathname: '/tailor/customer-delivery-penalty-detail',
                        params: { customerId: order.customerName, orderId: order.id }
                      } as any);
                    }}
                  >
                    <View style={styles.customerInfo}>
                      <View style={styles.customerHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.customerName}>{order.customerName}</Text>
                          <Text style={styles.orderId}>{order.id}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                          <Text style={[styles.statusLabel, { color: statusColor }]}>
                            {statusLabel}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.deliveryInfo}>
                        <View style={styles.deliveryRow}>
                          <Ionicons name="calendar-outline" size={16} color="#6b7280" />
                          <Text style={styles.deliveryDate}>
                            {new Date(order.deliveryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </Text>
                        </View>
                        <View style={styles.deliveryRow}>
                          <Ionicons name="pricetag-outline" size={16} color="#6b7280" />
                          <Text style={styles.orderAmount}>Rs {order.orderAmount?.toLocaleString() || 0}</Text>
                        </View>
                      </View>
                    </View>

                    <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <View style={{ height: 80 }} />
        </ScrollView>
      </View>
    </ProtectedRoute>
  );
};

export default CustomerDeliveryListScreen;

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
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    margin: 16,
    padding: 14,
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e40af',
    marginBottom: 2,
  },
  infoText: {
    fontSize: 12,
    color: '#1e3a8a',
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
  ordersList: {
    paddingHorizontal: 16,
  },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  customerInfo: {
    flex: 1,
  },
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  orderId: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  deliveryInfo: {
    gap: 8,
  },
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deliveryDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  orderAmount: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
});
