import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Order {
  id: string;
  customerName: string;
  orderAmount: number;
  deliveryDate: Date;
  orderType: string;
  status: string;
}

interface OrderRecord extends Order {
  daysLeft?: number;
  lateDays?: number;
  penalty?: number;
  receivableAmount?: number;
  notifiedReminder?: boolean;
  notifiedLate?: boolean;
}

const STORAGE_KEY = 'vtailor_penalty_orders';

// Sample order data - Backend se ayega
const SAMPLE_ORDERS: Order[] = [
  {
    id: "ORD-001",
    customerName: "Fatima Khan",
    orderAmount: 12000,
    deliveryDate: new Date("2026-01-04"),
    orderType: "Formal Suit",
    status: "Pending",
  },
  {
    id: "ORD-002",
    customerName: "Ahmed Ali",
    orderAmount: 8000,
    deliveryDate: new Date("2026-01-03"),
    orderType: "Casual Kurta",
    status: "Pending",
  },
];

const TailorWalletPenaltyScreen = () => {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [totalPenalty, setTotalPenalty] = useState(0);
  const [walletBalance, setWalletBalance] = useState(20000);
  const [totalOriginal, setTotalOriginal] = useState(0);
  const initialWallet = 20000;

  useEffect(() => {
    initializeData();
  }, []);

  useEffect(() => {
    if (!orders.length) return;

    // Daily check at midnight
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

    let totalPenaltyAmount = 0;
    let totalOriginalSum = 0;

    const updatedOrders = currentOrders.map((order) => {
      const today = new Date();
      const diffTime = order.deliveryDate.getTime() - today.getTime();
      const remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // 🔔 LAST 2 DAYS - SET FLAG
      if ((remainingDays === 2 || remainingDays === 1) && !order.notifiedReminder) {
        notifiedReminder = true;
      }

      // ❌ DELIVERY LATE → PENALTY (1% PER DAY)
      let penalty = 0;
      let lateDays = 0;
      let status = "On Time";
      let receivableAmount = order.orderAmount;
      let notifiedLate = order.notifiedLate;
      let notifiedReminder = order.notifiedReminder || false;

      if (remainingDays < 0) {
        lateDays = Math.abs(remainingDays);
        const penaltyPercent = lateDays * 1;
        penalty = (order.orderAmount * penaltyPercent) / 100;
        receivableAmount = order.orderAmount - penalty;
        totalPenaltyAmount += penalty;
        status = `${lateDays} Day(s) Late`;

        if (lateDays === 1 && !notifiedLate) {
          notifiedLate = true;
        }
      } else if (remainingDays === 0) {
        status = "Due Today";
      } else if (remainingDays > 2) {
        notifiedReminder = false;
      }

      totalOriginalSum += order.orderAmount;

      return {
        ...order,
        daysLeft: remainingDays,
        lateDays,
        penalty,
        receivableAmount,
        status,
        notifiedReminder,
        notifiedLate,
      };
    });

    persistOrders(updatedOrders);
    setOrders(updatedOrders as any);
    setTotalPenalty(totalPenaltyAmount);
    setWalletBalance(initialWallet - totalPenaltyAmount);
    setTotalOriginal(totalOriginalSum);
  };

  const persistOrders = async (data: OrderRecord[]) => {
    try {
      const toSave = data.map((o) => ({
        ...o,
        deliveryDate: o.deliveryDate.toISOString(),
      }));
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (error) {
      // fail silently
    }
  };

  const getStatusColor = (status: string) => {
    if (status.includes("Late")) return "#ef4444";
    if (status === "Due Today") return "#f59e0b";
    return "#10b981";
  };

  return (
    <ProtectedRoute requiredRole="tailor">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#ef4444" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.heading}>Wallet & Penalty</Text>
            <Text style={styles.subheading}>Track your wallet balance & penalties</Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Wallet Balance Card */}
          <View style={styles.walletCard}>
            <View style={styles.walletHeader}>
              <Ionicons name="wallet" size={40} color="#10b981" />
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={styles.walletLabel}>Current Wallet Balance</Text>
                <Text style={styles.walletAmount}>Rs {walletBalance.toLocaleString()}</Text>
              </View>
            </View>
            
            {totalPenalty > 0 && (
              <View style={styles.penaltyAlert}>
                <Ionicons name="alert-circle" size={20} color="#ef4444" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.penaltyAlertText}>
                    Total Penalty Deducted: Rs {totalPenalty.toFixed(0)}
                  </Text>
                  <Text style={styles.penaltyAlertSubtext}>
                    Auto-updated from stitching timeline & delivery status
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.walletStats}>
              <View style={styles.walletStatItem}>
                <Text style={styles.walletStatLabel}>Initial Balance</Text>
                <Text style={styles.walletStatValue}>Rs {initialWallet.toLocaleString()}</Text>
              </View>
              <View style={styles.walletStatDivider} />
              <View style={styles.walletStatItem}>
                <Text style={styles.walletStatLabel}>Penalties</Text>
                <Text style={[styles.walletStatValue, { color: "#ef4444" }]}>
                  - Rs {totalPenalty.toFixed(0)}
                </Text>
              </View>
            </View>

            <View style={styles.walletStatsAlt}>
              <View style={styles.walletStatItemAlt}>
                <Text style={styles.walletStatLabel}>Original Stitching Total</Text>
                <Text style={styles.walletStatValue}>Rs {totalOriginal.toLocaleString()}</Text>
              </View>
              <View style={styles.walletStatItemAlt}>
                <Text style={[styles.walletStatLabel, { color: "#ef4444" }]}>Total Penalty Deducted</Text>
                <Text style={[styles.walletStatValue, { color: "#ef4444", fontWeight: "700" }]}>
                  Rs {totalPenalty.toFixed(0)}
                </Text>
              </View>
              <View style={styles.walletStatItemAlt}>
                <Text style={[styles.walletStatLabel, { color: "#10b981", fontWeight: "700" }]}>Final Credited</Text>
                <Text style={[styles.walletStatValue, { color: "#10b981", fontWeight: "700" }]}>
                  Rs {(initialWallet - totalPenalty).toFixed(0)}
                </Text>
              </View>
            </View>
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>📋 Penalty Policy</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoBullet}>•</Text>
              <Text style={styles.infoText}>
                Reminder sent <Text style={{ fontWeight: "700" }}>2 days</Text> before delivery deadline
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoBullet}>•</Text>
              <Text style={styles.infoText}>
                Penalty: <Text style={{ fontWeight: "700" }}>1% per late day</Text> of order amount
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoBullet}>•</Text>
              <Text style={styles.infoText}>
                Penalty automatically deducted from wallet balance
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoBullet}>•</Text>
              <Text style={styles.infoText}>
                Updates calculated daily at midnight
              </Text>
            </View>
          </View>

          {/* Orders List */}
          <Text style={styles.sectionTitle}>Active Orders</Text>

          {orders.map((order: any) => {
            const isLate = order.daysLeft < 0;
            const isDueToday = order.daysLeft === 0;

            return (
              <View key={order.id} style={styles.orderCard}>
                {/* Order Header */}
                <View style={styles.orderHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.orderId}>{order.id}</Text>
                    <Text style={styles.orderType}>{order.orderType}</Text>
                    <Text style={styles.customerName}>👤 {order.customerName}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(order.status) + "20" },
                    ]}
                  >
                    <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
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

                <View style={styles.detailsRow}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Days Left</Text>
                    <Text
                      style={[
                        styles.detailValue,
                        {
                          color: isLate ? "#ef4444" : isDueToday ? "#f59e0b" : "#10b981",
                        },
                      ]}
                    >
                      {isLate ? "Overdue" : isDueToday ? "Due Today" : `${order.daysLeft} days`}
                    </Text>
                  </View>
                  {order.lateDays > 0 && (
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Late Days</Text>
                      <Text style={[styles.detailValue, { color: "#ef4444" }]}>
                        {order.lateDays} day(s)
                      </Text>
                    </View>
                  )}
                </View>

                {/* Penalty Section */}
                {order.penalty > 0 && (
                  <>
                    <View style={styles.divider} />
                    <View style={styles.penaltySection}>
                      <View style={styles.penaltyHeader}>
                        <Ionicons name="warning" size={18} color="#ef4444" />
                        <Text style={styles.penaltyTitle}>Penalty Deducted</Text>
                      </View>

                      <View style={styles.penaltyDetailRow}>
                        <Text style={styles.penaltyLabel}>Penalty Per Day</Text>
                        <Text style={[styles.penaltyValue, { color: "#ef4444", fontWeight: "700" }]}>
                          1% (Rs {Math.round(order.orderAmount * 0.01).toLocaleString()})
                        </Text>
                      </View>

                      <View style={styles.penaltyDetailRow}>
                        <Text style={styles.penaltyLabel}>Total Penalty</Text>
                        <Text style={[styles.penaltyValue, { color: "#ef4444", fontWeight: "700" }]}>
                          {order.lateDays}% = Rs {order.penalty.toFixed(0)}
                        </Text>
                      </View>

                      <View style={styles.calculationBox}>
                        <Text style={styles.calculationText}>
                          Rs {order.orderAmount.toLocaleString()} × {order.lateDays}% = Rs{" "}
                          {order.penalty.toFixed(0)}
                        </Text>
                      </View>

                      <View style={styles.divider} />

                      <View style={styles.receivableRow}>
                        <Text style={styles.receivableLabel}>You'll Receive</Text>
                        <Text style={styles.receivableAmount}>
                          Rs {order.receivableAmount.toFixed(0)}
                        </Text>
                      </View>
                      <Text style={styles.autoNote}>Auto-updates daily from stitching timeline and delivery status.</Text>
                    </View>
                  </>
                )}

                {/* Warning for upcoming deadline */}
                {order.daysLeft > 0 && order.daysLeft <= 2 && (
                  <View style={styles.warningBox}>
                    <Ionicons name="time-outline" size={18} color="#f59e0b" />
                    <Text style={styles.warningText}>
                      ⚠️ Only {order.daysLeft} day(s) left! Complete soon to avoid penalty
                    </Text>
                  </View>
                )}

                {/* On Time Orders */}
                {!isLate && !isDueToday && order.daysLeft > 2 && (
                  <View style={styles.onTimeBox}>
                    <Ionicons name="checkmark-circle" size={18} color="#10b981" />
                    <Text style={styles.onTimeText}>
                      ✅ On track. {order.daysLeft} day(s) until delivery.
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

export default TailorWalletPenaltyScreen;

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
  walletCard: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 20,
    borderRadius: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  walletHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  walletLabel: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "600",
  },
  walletAmount: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#10b981",
    marginTop: 4,
  },
  penaltyAlert: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 14,
    backgroundColor: "#fef2f2",
    borderRadius: 10,
    marginBottom: 16,
    gap: 10,
  },
  penaltyAlertText: {
    fontSize: 13,
    color: "#ef4444",
    fontWeight: "700",
  },
  penaltyAlertSubtext: {
    fontSize: 11,
    color: "#991b1b",
    marginTop: 2,
  },
  walletStats: {
    flexDirection: "row",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  walletStatItem: {
    flex: 1,
    alignItems: "center",
  },
  walletStatLabel: {
    fontSize: 12,
    color: "#9ca3af",
    marginBottom: 4,
  },
  walletStatValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  walletStatDivider: {
    width: 1,
    backgroundColor: "#e5e7eb",
    marginHorizontal: 16,
  },
  infoBox: {
    backgroundColor: "#eff6ff",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1e40af",
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  infoBullet: {
    fontSize: 14,
    color: "#3b82f6",
    marginRight: 8,
    fontWeight: "bold",
  },
  infoText: {
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
  customerName: {
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
    marginVertical: 12,
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
  penaltyDetailRow: {
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
    fontWeight: "600",
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
  receivableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  receivableLabel: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "600",
  },
  receivableAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: "#f59e0b",
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    padding: 12,
    backgroundColor: "#fffbeb",
    borderRadius: 8,
  },
  warningText: {
    fontSize: 12,
    color: "#92400e",
    flex: 1,
  },
  onTimeBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    padding: 12,
    backgroundColor: "#ecfdf5",
    borderRadius: 8,
  },
  onTimeText: {
    fontSize: 12,
    color: "#047857",
    flex: 1,
  },
});
