import { ProtectedRoute } from '@/components/ProtectedRoute';
import AppBackButton from '@/components/AppBackButton';
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Order {
  id: string;
  tailorName: string;
  orderAmount: number;
  deliveryDate: Date;
  orderType: string;
  status: string;
}

interface OrderRecord extends Order {
  daysLate?: number;
  penaltyPercent?: number;
  penalty?: number;
  tailorFinalAmount?: number;
  notifiedReminder?: boolean;
  notifiedLate?: boolean;
}

const STORAGE_KEY = 'vtailor_penalty_orders';

const SAMPLE_ORDERS: Order[] = [
  {
    id: "ORD-001",
    tailorName: "Ahmad Tailor",
    orderAmount: 10000,
    deliveryDate: new Date("2026-01-03"),
    orderType: "Long Frock",
    status: "Late",
  },
  {
    id: "ORD-002",
    tailorName: "Master Tailors",
    orderAmount: 15000,
    deliveryDate: new Date("2026-01-05"),
    orderType: "Shalwar Kameez",
    status: "On Track",
  },
];

const CustomerWalletPenaltyScreen = () => {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [totalSavings, setTotalSavings] = useState(0);
  const [totalPayable, setTotalPayable] = useState(0);
  const [totalOriginal, setTotalOriginal] = useState(0);

  useEffect(() => {
    initializeData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      initializeData();
      return () => {};
    }, [])
  );

  useEffect(() => {
    if (!orders.length) return;

    const interval = setInterval(() => {
      calculateAllPenalties();
    }, 24 * 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [orders.length]);

  const initializeData = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: OrderRecord[] = JSON.parse(stored).map((o: any) => ({
          ...o,
          deliveryDate: new Date(o.deliveryDate),
        }));
        setOrders(parsed);
        calculateAllPenalties(parsed);
      } else {
        setOrders(SAMPLE_ORDERS);
        calculateAllPenalties(SAMPLE_ORDERS);
      }
    } catch (error) {
      setOrders(SAMPLE_ORDERS);
      calculateAllPenalties(SAMPLE_ORDERS);
    }
  };

  const calculateAllPenalties = (sourceOrders?: OrderRecord[]) => {
    const currentOrders = sourceOrders || orders;
    if (!currentOrders.length) return;

    let totalCustomerSavings = 0;
    let totalPayableSum = 0;
    let totalOriginalSum = 0;

    const updatedOrders = currentOrders.map((order) => {
      const today = new Date();
      const diffTime = today.getTime() - order.deliveryDate.getTime();
      const daysLate = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const daysLeft = Math.ceil((order.deliveryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      let penalty = 0;
      let penaltyPercent = 0;
      let tailorFinalAmount = order.orderAmount;
      let status = daysLeft < 0 ? "Late" : order.status || "On Track";
      let notifiedReminder = order.notifiedReminder || false;
      let notifiedLate = order.notifiedLate || false;

      if ((daysLeft === 2 || daysLeft === 1) && !notifiedReminder) {
        notifiedReminder = true;
      }

      if (daysLate > 0) {
penaltyPercent = daysLate * 2;
        penalty = (order.orderAmount * penaltyPercent) / 100;
        tailorFinalAmount = order.orderAmount - penalty;
        totalCustomerSavings += penalty;
        status = `${daysLate} Day(s) Late`;

        if (!notifiedLate) {
          notifiedLate = true;
        }
      }

      totalPayableSum += tailorFinalAmount;
      totalOriginalSum += order.orderAmount;

      return {
        ...order,
        daysLate,
        penaltyPercent,
        penalty,
        tailorFinalAmount,
        status,
        notifiedLate,
        notifiedReminder,
      };
    });

    setOrders(updatedOrders as any);
    setTotalSavings(totalCustomerSavings);
    setTotalPayable(totalPayableSum);
    setTotalOriginal(totalOriginalSum);
  };

  const getDaysLeft = (deliveryDate: Date) => {
    const today = new Date();
    const diffTime = deliveryDate.getTime() - today.getTime();
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return daysLeft;
  };

  return (
    <ProtectedRoute requiredRole="customer">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <AppBackButton onPress={() => router.back()} />
          <View style={{ flex: 1 }}>
            <Text style={styles.heading}>Wallet Penalty Details</Text>
            <Text style={styles.subheading}>Track tailor penalties & your savings</Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Total Savings Card */}
          <View style={styles.savingsCard}>
            <View style={styles.savingsHeader}>
              <Ionicons name="wallet" size={36} color="#10b981" />
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={styles.savingsLabel}>Your Total Savings</Text>
                <Text style={styles.savingsAmount}>Rs {totalSavings.toFixed(0)}</Text>
              </View>
            </View>
            <View style={styles.savingsNote}>
              <Ionicons name="information-circle" size={18} color="#3b82f6" />
              <Text style={styles.savingsNoteText}>
                Auto-updated based on delivery status. Penalties are deducted from tailor payout and shown as your savings.
              </Text>
            </View>
          </View>

          {/* Total Payable Card */}
          <View style={[styles.savingsCard, { marginBottom: 16 }]}>
            <View style={[styles.savingsHeader, { marginBottom: 16 }]}>
              <Text style={styles.paymentLabel}>Original Stitching Total</Text>
              <Text style={styles.tailorAmount}>Rs {totalOriginal.toLocaleString()}</Text>
            </View>
            <View style={[styles.savingsHeader, { marginBottom: 16 }]}>
              <Text style={[styles.paymentLabel, { color: "#ef4444" }]}>Late Penalties (Savings)</Text>
              <Text style={[styles.tailorAmount, { color: "#ef4444" }]}>- Rs {totalSavings.toFixed(0)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={[styles.savingsHeader, { marginTop: 16 }]}>
              <Text style={[styles.paymentLabel, { color: "#10b981", fontWeight: "700" }]}>Final Amount You Pay</Text>
              <Text style={[styles.customerSaving]}>Rs {totalPayable.toFixed(0)}</Text>
            </View>
            <Text style={[styles.savingsNoteText, { marginTop: 12 }]}>Values refresh automatically from stitching timeline & delivery status.</Text>
          </View>

          {/* Penalty Policy */}
          <View style={styles.policyCard}>
            <Text style={styles.policyTitle}>📋 Penalty Policy</Text>
            <View style={styles.policyRow}>
              <Ionicons name="checkmark-circle" size={18} color="#10b981" />
              <Text style={styles.policyText}>
                Tailor pays <Text style={{ fontWeight: "700" }}>2% per day</Text> for late delivery
              </Text>
            </View>
            <View style={styles.policyRow}>
              <Ionicons name="checkmark-circle" size={18} color="#10b981" />
              <Text style={styles.policyText}>
                Penalty automatically deducted from tailor payment
              </Text>
            </View>
            <View style={styles.policyRow}>
              <Ionicons name="checkmark-circle" size={18} color="#10b981" />
              <Text style={styles.policyText}>
                You get discount equal to penalty amount
              </Text>
            </View>
          </View>

          {/* Orders with Penalties */}
          <Text style={styles.sectionTitle}>Order Details</Text>

          {orders.map((order: any) => {
            const daysLeft = getDaysLeft(order.deliveryDate);
            const isLate = daysLeft < 0;

            return (
              <View key={order.id} style={styles.orderCard}>
                {/* Order Header */}
                <View style={styles.orderHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.orderId}>{order.id}</Text>
                    <Text style={styles.orderType}>{order.orderType}</Text>
                    <Text style={styles.tailorName}>🏪 {order.tailorName}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: isLate ? "#fef2f2" : "#ecfdf5" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: isLate ? "#ef4444" : "#10b981" },
                      ]}
                    >
                      {order.status}
                    </Text>
                  </View>
                </View>

                {/* Order Details */}
                <View style={styles.detailsRow}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Original Price</Text>
                    <Text style={styles.detailValue}>Rs {order.orderAmount.toLocaleString()}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Delivery Due</Text>
                    <Text style={styles.detailValue}>
                      {order.deliveryDate.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>
                </View>

                {/* Late Details */}
                {order.daysLate > 0 && (
                  <>
                    <View style={styles.divider} />
                    
                    <View style={styles.penaltySection}>
                      <View style={styles.penaltyHeader}>
                        <Ionicons name="alert-circle" size={20} color="#ef4444" />
                        <Text style={styles.penaltyTitle}>Penalty Applied</Text>
                      </View>

                      <View style={styles.penaltyRow}>
                        <Text style={styles.penaltyLabel}>Late Days</Text>
                        <Text style={styles.penaltyValue}>{order.daysLate} day(s)</Text>
                      </View>

                      <View style={styles.penaltyRow}>
                        <Text style={styles.penaltyLabel}>Penalty Per Day</Text>
                        <Text style={[styles.penaltyValue, { color: "#ef4444" }]}>
                          2% (Rs {Math.round(order.orderAmount * 0.02).toLocaleString()})
                        </Text>
                      </View>

                      <View style={styles.penaltyRow}>
                        <Text style={styles.penaltyLabel}>Total Penalty</Text>
                        <Text style={[styles.penaltyValue, { color: "#ef4444" }]}>
                          {order.penaltyPercent}% = Rs {order.penalty.toFixed(0)}
                        </Text>
                      </View>

                      <View style={styles.calculationBox}>
                        <Text style={styles.calculationText}>
                          Calculation: Rs {order.orderAmount.toLocaleString()} × {order.penaltyPercent}% = Rs{" "}
                          {order.penalty.toFixed(0)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Final Payment */}
                    <View style={styles.finalPaymentSection}>
                      <View style={styles.paymentRow}>
                        <Text style={styles.paymentLabel}>Tailor Receives</Text>
                        <Text style={styles.tailorAmount}>
                          Rs {order.tailorFinalAmount.toFixed(0)}
                        </Text>
                      </View>
                      <View style={styles.paymentRow}>
                        <Text style={styles.paymentLabel}>You Save</Text>
                        <Text style={styles.customerSaving}>
                          Rs {order.penalty.toFixed(0)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.successBox}>
                      <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                      <Text style={styles.successText}>
                        💰 Discount automatically applied to your payment!
                      </Text>
                    </View>
                  </>
                )}

                {/* On Track Orders */}
                {!isLate && daysLeft >= 0 && (
                  <View style={styles.onTrackBox}>
                    <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                    <Text style={styles.onTrackText}>
                      ✅ Order is on track. {daysLeft} day(s) until delivery.
                    </Text>
                  </View>
                )}
              </View>
            );
          })}

          <View style={{ height: 100 }} />
        </ScrollView>
      </View>
    </ProtectedRoute>
  );
};

export default CustomerWalletPenaltyScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.select({ ios: 64, android: 36, default: 36 }),
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  heading: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#111827",
  },
  subheading: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },
  savingsCard: {
    backgroundColor: "#ecfdf5",
    margin: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#10b981",
  },
  savingsHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  savingsLabel: {
    fontSize: 14,
    color: "#059669",
    fontWeight: "600",
  },
  savingsAmount: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#10b981",
    marginTop: 4,
  },
  savingsNote: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    padding: 12,
    backgroundColor: "#dbeafe",
    borderRadius: 8,
    gap: 8,
  },
  savingsNoteText: {
    fontSize: 12,
    color: "#1e40af",
    flex: 1,
    lineHeight: 18,
  },
  policyCard: {
    backgroundColor: "#eff6ff",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  policyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1e40af",
    marginBottom: 12,
  },
  policyRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
    gap: 8,
  },
  policyText: {
    fontSize: 13,
    color: "#1e3a8a",
    flex: 1,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginLeft: 16,
    marginBottom: 12,
  },
  orderCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 14,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  orderType: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2,
  },
  tailorName: {
    fontSize: 13,
    color: "#9ca3af",
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    height: 32,
    justifyContent: "center",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: "#9ca3af",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 16,
  },
  penaltySection: {
    backgroundColor: "#fef2f2",
    padding: 14,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#ef4444",
  },
  penaltyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  penaltyTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ef4444",
  },
  penaltyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  penaltyLabel: {
    fontSize: 13,
    color: "#991b1b",
  },
  penaltyValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },
  calculationBox: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 6,
    marginTop: 8,
  },
  calculationText: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
  },
  finalPaymentSection: {
    gap: 10,
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  paymentLabel: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  tailorAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#f59e0b",
  },
  customerSaving: {
    fontSize: 18,
    fontWeight: "700",
    color: "#10b981",
  },
  successBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    padding: 12,
    backgroundColor: "#ecfdf5",
    borderRadius: 8,
  },
  successText: {
    fontSize: 13,
    color: "#047857",
    flex: 1,
    fontWeight: "600",
  },
  onTrackBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    backgroundColor: "#ecfdf5",
    borderRadius: 8,
  },
  onTrackText: {
    fontSize: 13,
    color: "#047857",
    flex: 1,
  },
});
