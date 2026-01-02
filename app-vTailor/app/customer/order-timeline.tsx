import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from "react";
import { FlatList, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const STEPS = [
  "Order Accepted",
  "Cutting In Progress",
  "Cutting Completed",
  "Stitching In Progress",
  "Stitching Completed",
  "Detailing In Progress",
  "Dress Completed",
];

// Mock customer data
const MOCK_CUSTOMER = {
  id: "1",
  name: "Fatima Khan",
  email: "fatima@example.com",
  phone: "+92 300 1234567",
  address: "123 Main Street, Karachi",
  measurements: {
    chest: "38 inches",
    waist: "32 inches",
    length: "60 inches",
  },
  orderDetails: {
    id: "ORD-001",
    date: "2025-12-28",
    description: "Formal Dress",
    color: "Red",
    fabric: "Silk",
  }
};

export default function CustomerOrderTimelineScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();
  const ORDER_ID = MOCK_CUSTOMER.orderDetails.id;
  const STORAGE_KEY = `order_progress_${ORDER_ID}`;

  // Load saved progress when component mounts
  useEffect(() => {
    loadProgressFromStorage();
  }, []);

  // Reload progress every time screen is focused
  useFocusEffect(
    useCallback(() => {
      loadProgressFromStorage();
    }, [])
  );

  const loadProgressFromStorage = async () => {
    try {
      const savedProgress = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedProgress !== null) {
        setCurrentStep(parseInt(savedProgress));
      }
    } catch (error) {
      console.log("Error loading progress:", error);
    }
  };

  const getEstimatedDate = (stepIndex: number) => {
    const daysPerStep = 2;
    const startDate = new Date(MOCK_CUSTOMER.orderDetails.date);
    const estimatedDate = new Date(startDate.getTime() + (stepIndex * daysPerStep * 24 * 60 * 60 * 1000));
    return estimatedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderItem = ({ item, index }: { item: string; index: number }) => {
    const completed = index < currentStep;
    const active = index === currentStep;

    return (
      <View style={styles.row}>
        <View style={styles.left}>
          <View
            style={[
              styles.circle,
              completed && styles.completed,
              active && styles.active,
            ]}
          >
            {completed && (
              <Ionicons name="checkmark" size={16} color="#fff" />
            )}
            {active && (
              <Ionicons name="ellipsis-horizontal" size={16} color="#fff" />
            )}
          </View>
          {index !== STEPS.length - 1 && (
            <View style={[styles.line, completed && styles.lineCompleted]} />
          )}
        </View>

        <View style={styles.right}>
          <Text
            style={[
              styles.title,
              completed && styles.completedText,
              active && styles.activeText,
            ]}
          >
            {item}
          </Text>
          {active && (
            <Text style={styles.sub}>Currently working on this step</Text>
          )}
          {completed && (
            <Text style={styles.subCompleted}>✓ Completed</Text>
          )}
          {!completed && !active && (
            <Text style={styles.subPending}>Pending</Text>
          )}
          <Text style={styles.estimatedDate}>Est: {getEstimatedDate(index)}</Text>
        </View>
      </View>
    );
  };

  return (
    <ProtectedRoute requiredRole="customer">
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Header with Back Button */}
          <View style={styles.headerContainer}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#3b82f6" />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.header}>Order Progress</Text>
              <Text style={styles.subheader}>Track your order status</Text>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Tailor Details Card */}
            <View style={styles.tailorCard}>
              <View style={styles.tailorHeader}>
                <View style={styles.tailorAvatar}>
                  <Ionicons name="storefront" size={32} color="#fff" />
                </View>
                <View style={styles.tailorInfo}>
                  <Text style={styles.tailorName}>Ahmad Tailor Store</Text>
                  <Text style={styles.tailorRating}>⭐ 4.8 (245 reviews)</Text>
                </View>
              </View>

              {/* Order Details */}
              <View style={styles.orderDetailsSection}>
                <Text style={styles.sectionTitle}>Order Details</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Order ID:</Text>
                  <Text style={styles.detailValue}>{MOCK_CUSTOMER.orderDetails.id}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Description:</Text>
                  <Text style={styles.detailValue}>{MOCK_CUSTOMER.orderDetails.description}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Color:</Text>
                  <Text style={styles.detailValue}>{MOCK_CUSTOMER.orderDetails.color}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Fabric:</Text>
                  <Text style={styles.detailValue}>{MOCK_CUSTOMER.orderDetails.fabric}</Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressSection}>
                <Text style={styles.sectionTitle}>Overall Progress</Text>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${(currentStep / (STEPS.length - 1)) * 100}%` }
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {currentStep + 1} of {STEPS.length} steps completed
                </Text>
              </View>
            </View>

            {/* Timeline Section */}
            <View style={styles.timelineSection}>
              <Text style={styles.sectionTitle}>Timeline</Text>
              <FlatList
                data={STEPS}
                keyExtractor={(item, index) => index.toString()}
                renderItem={renderItem}
                scrollEnabled={false}
              />
            </View>

            {/* Status Message */}
            <View style={styles.statusMessageCard}>
              {currentStep === STEPS.length - 1 ? (
                <>
                  <Ionicons name="checkmark-circle" size={40} color="#10b981" />
                  <Text style={styles.statusTitle}>Order Complete!</Text>
                  <Text style={styles.statusMessage}>
                    Your dress is ready for pickup. Contact the tailor for delivery details.
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="time-outline" size={40} color="#f59e0b" />
                  <Text style={styles.statusTitle}>In Progress</Text>
                  <Text style={styles.statusMessage}>
                    Your tailor is working on: {STEPS[currentStep]}
                  </Text>
                </>
              )}
            </View>
          </ScrollView>

          {/* Action Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.contactButton}
              onPress={() => {}}
            >
              <Ionicons name="call" size={20} color="#3b82f6" />
              <Text style={styles.contactButtonText}>Contact Tailor</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    marginRight: 12,
    padding: 8,
  },
  headerContent: {
    flex: 1,
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 2,
  },
  subheader: {
    fontSize: 13,
    color: "#6b7280",
  },
  scrollContent: {
    padding: 16,
  },
  tailorCard: {
    backgroundColor: "#f0f9ff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  tailorHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  tailorAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  tailorInfo: {
    flex: 1,
  },
  tailorName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  tailorRating: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2,
  },
  orderDetailsSection: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#bfdbfe",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 13,
    color: "#111827",
    fontWeight: "600",
  },
  progressSection: {
    paddingTop: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#dbeafe",
    borderRadius: 4,
    marginBottom: 8,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#3b82f6",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
  },
  timelineSection: {
    marginTop: 8,
  },
  row: {
    flexDirection: "row",
    marginBottom: 24,
  },
  left: {
    width: 40,
    alignItems: "center",
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#e5e7eb",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#d1d5db",
  },
  completed: {
    backgroundColor: "#10b981",
    borderColor: "#059669",
  },
  active: {
    backgroundColor: "#f59e0b",
    borderColor: "#d97706",
  },
  line: {
    width: 3,
    flex: 1,
    backgroundColor: "#e5e7eb",
    marginTop: 6,
  },
  lineCompleted: {
    backgroundColor: "#10b981",
  },
  right: {
    flex: 1,
    marginLeft: 16,
    paddingTop: 2,
  },
  title: {
    fontSize: 15,
    color: "#6b7280",
    fontWeight: "500",
  },
  completedText: {
    color: "#10b981",
    fontWeight: "600",
  },
  activeText: {
    color: "#f59e0b",
    fontWeight: "700",
    fontSize: 16,
  },
  sub: {
    fontSize: 12,
    color: "#f59e0b",
    marginTop: 4,
    fontWeight: "500",
  },
  subCompleted: {
    fontSize: 12,
    color: "#10b981",
    marginTop: 4,
    fontWeight: "500",
  },
  subPending: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 4,
  },
  estimatedDate: {
    fontSize: 11,
    color: "#d1d5db",
    marginTop: 6,
    fontStyle: "italic",
  },
  statusMessageCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 20,
    marginVertical: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginTop: 12,
  },
  statusMessage: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 8,
    textAlign: "center",
  },
  buttonContainer: {
    padding: 16,
    paddingBottom: 20,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  contactButton: {
    flexDirection: "row",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: "#3b82f6",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  contactButtonText: {
    color: "#3b82f6",
    fontSize: 16,
    fontWeight: "700",
  },
});
