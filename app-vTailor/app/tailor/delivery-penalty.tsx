import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from "react";
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Order {
  id: string;
  customerName: string;
  orderPrice: number;
  deliveryDate: Date;
  initialWallet: number;
  orderType: string;
  daysLeft?: number;
  lateDays?: number;
  penalty?: number;
  status?: string;
}

// Sample order data - Replace with actual API data
const SAMPLE_ORDERS: Order[] = [
  {
    id: "ORD-001",
    customerName: "Fatima Khan",
    orderPrice: 8000,
    deliveryDate: new Date("2026-01-04"),
    initialWallet: 15000,
    orderType: "Formal Suit",
  },
  {
    id: "ORD-002",
    customerName: "Ahmed Ali",
    orderPrice: 12000,
    deliveryDate: new Date("2026-01-03"),
    initialWallet: 15000,
    orderType: "Wedding Sherwani",
  },
];

const DeliveryPenaltyScreen = () => {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>(SAMPLE_ORDERS);
  const [totalPenalty, setTotalPenalty] = useState(0);
  const [walletBalance, setWalletBalance] = useState(15000);

  useEffect(() => {
    checkAllOrders();
    
    // Check every day at midnight for penalty updates
    const interval = setInterval(() => {
      checkAllOrders();
    }, 24 * 60 * 60 * 1000); // 24 hours

    return () => clearInterval(interval);
  }, []);

  const checkAllOrders = () => {
    let totalPenaltyAmount = 0;

    const updatedOrders = orders.map((order) => {
      const today = new Date();
      const diffTime = order.deliveryDate.getTime() - today.getTime();
      const remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // 🔔 LAST 2 DAYS NOTIFICATION
      if (remainingDays === 2 || remainingDays === 1) {
        Alert.alert(
          "⚠️ Delivery Reminder",
          `Only ${remainingDays} day(s) left for ${order.orderType} (${order.id})\nCustomer: ${order.customerName}`,
          [{ text: "OK" }]
        );
      }

      // ❌ DELIVERY LATE → PENALTY (1% PER DAY)
      let penalty = 0;
      let lateDays = 0;
      let status = "On Track";

      if (remainingDays < 0) {
        lateDays = Math.abs(remainingDays);
        const penaltyPercent = lateDays * 1; // 1% per day
        penalty = (order.orderPrice * penaltyPercent) / 100;
        totalPenaltyAmount += penalty;
        status = `${lateDays} Day(s) Late`;

        // Show penalty notification only once
        if (lateDays === 1) {
          Alert.alert(
            "⛔ Penalty Applied",
            `Order ${order.id} is ${lateDays} day(s) late\nPenalty: Rs ${penalty.toFixed(0)}\n\n1% deducted per late day`,
            [{ text: "Understood" }]
          );
        }
      } else if (remainingDays === 0) {
        status = "Due Today";
      }

      return {
        ...order,
        daysLeft: remainingDays,
        lateDays,
        penalty,
        status,
      };
    });

    setOrders(updatedOrders);
    setTotalPenalty(totalPenaltyAmount);
    setWalletBalance(SAMPLE_ORDERS[0].initialWallet - totalPenaltyAmount);
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
            <Text style={styles.heading}>Delivery & Penalty Panel</Text>
            <Text style={styles.subheading}>Track order deadlines and penalties</Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Wallet Balance Card */}
          <View style={styles.walletCard}>
            <View style={styles.walletHeader}>
              <Ionicons name="wallet" size={32} color="#10b981" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.walletLabel}>Current Wallet Balance</Text>
                <Text style={styles.walletAmount}>Rs {walletBalance.toLocaleString()}</Text>
              </View>
            </View>
            {totalPenalty > 0 && (
              <View style={styles.penaltyAlert}>
                <Ionicons name="alert-circle" size={20} color="#ef4444" />
                <Text style={styles.penaltyText}>
                  Total Penalty Deducted: Rs {totalPenalty.toFixed(0)}
                </Text>
              </View>
            )}
          </View>

          {/* Orders List */}
          <Text style={styles.sectionTitle}>Active Orders</Text>
          
          {orders.map((order) => (
            <View key={order.id} style={styles.orderCard}>
              {/* Order Header */}
              <View style={styles.orderHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.orderId}>{order.id}</Text>
                  <Text style={styles.orderType}>{order.orderType}</Text>
                  <Text style={styles.customerName}>👤 {order.customerName}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + "20" }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                    {order.status}
                  </Text>
                </View>
              </View>

              {/* Order Details */}
              <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Order Price</Text>
                  <Text style={styles.detailValue}>Rs {order.orderPrice.toLocaleString()}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Delivery Date</Text>
                  <Text style={styles.detailValue}>
                    {order.deliveryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
              </View>

              <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Days Left</Text>
                  <Text style={[styles.detailValue, { color: order.daysLeft < 0 ? "#ef4444" : "#10b981" }]}>
                    {order.daysLeft < 0 ? "Overdue" : `${order.daysLeft} days`}
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
                <View style={styles.penaltySection}>
                  <View style={styles.penaltyRow}>
                    <Ionicons name="warning" size={18} color="#ef4444" />
                    <Text style={styles.penaltyLabel}>Penalty Applied (1% per day)</Text>
                  </View>
                  <Text style={styles.penaltyAmount}>- Rs {order.penalty.toFixed(0)}</Text>
                  <Text style={styles.penaltyNote}>
                    {order.lateDays}% of Rs {order.orderPrice.toLocaleString()} = Rs {order.penalty.toFixed(0)}
                  </Text>
                </View>
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
            </View>
          ))}

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>📋 Penalty Policy</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoBullet}>•</Text>
              <Text style={styles.infoText}>
                Penalty: <Text style={{ fontWeight: "700" }}>1% per late day</Text> of order price
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoBullet}>•</Text>
              <Text style={styles.infoText}>
                Notifications sent <Text style={{ fontWeight: "700" }}>2 days</Text> before deadline
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoBullet}>•</Text>
              <Text style={styles.infoText}>
                Penalty automatically deducted from wallet
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoBullet}>•</Text>
              <Text style={styles.infoText}>
                Updates daily at midnight
              </Text>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </View>
    </ProtectedRoute>
  );
};

export default DeliveryPenaltyScreen;

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
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  walletHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  walletLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  walletAmount: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#10b981",
    marginTop: 4,
  },
  penaltyAlert: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    padding: 12,
    backgroundColor: "#fef2f2",
    borderRadius: 8,
    gap: 8,
  },
  penaltyText: {
    fontSize: 13,
    color: "#ef4444",
    fontWeight: "600",
    flex: 1,
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
    marginBottom: 16,
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
  detailsGrid: {
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
  penaltySection: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#fef2f2",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#ef4444",
  },
  penaltyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  penaltyLabel: {
    fontSize: 13,
    color: "#ef4444",
    fontWeight: "600",
  },
  penaltyAmount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ef4444",
    marginBottom: 4,
  },
  penaltyNote: {
    fontSize: 11,
    color: "#991b1b",
  },
  warningBox: {
    marginTop: 12,
    padding: 10,
    backgroundColor: "#fffbeb",
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  warningText: {
    fontSize: 12,
    color: "#92400e",
    flex: 1,
  },
  infoBox: {
    backgroundColor: "#eff6ff",
    margin: 16,
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
});
