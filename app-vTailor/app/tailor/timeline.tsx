import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from "react";
import { Alert, FlatList, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const STEPS = [
  "Order Accepted",
  "Cutting In Progress",
  "Cutting Completed",
  "Stitching In Progress",
  "Stitching Completed",
  "Detailing In Progress",
  "Dress Completed",
];

// Mock customer data - replace with actual data from API/params
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

export default function TailorTimelineScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();
  const ORDER_ID = MOCK_CUSTOMER.orderDetails.id; // Use order ID for storage key
  const STORAGE_KEY = `order_progress_${ORDER_ID}`;

  // Load saved progress when component mounts
  useEffect(() => {
    loadProgressFromStorage();
  }, []);

  // Reload progress every time screen is focused (when user comes back)
  useFocusEffect(
    useCallback(() => {
      loadProgressFromStorage();
    }, [])
  );

  // Save progress whenever currentStep changes
  useEffect(() => {
    if (currentStep > 0) {
      saveProgressToStorage(currentStep);
    }
  }, [currentStep]);

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

  const saveProgressToStorage = async (step: number) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, step.toString());
      Alert.alert("Progress Saved", `Step updated to: ${STEPS[step]}`);
    } catch (error) {
      console.log("Error saving progress:", error);
      Alert.alert("Error", "Failed to save progress");
    }
  };

  const updateNextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // When order is completed, go back
      router.back();
    }
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
          </View>
          {index !== STEPS.length - 1 && <View style={styles.line} />}
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
          {active && <Text style={styles.sub}>Currently In Progress</Text>}
          {completed && <Text style={styles.subCompleted}>Completed</Text>}
        </View>
      </View>
    );
  };

  return (
    <ProtectedRoute requiredRole="tailor">
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Header with Back Button */}
          <View style={styles.headerContainer}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#ef4444" />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.header}>Order Stitching Timeline</Text>
              <Text style={styles.subheader}>Track and update order progress</Text>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Customer Details Card */}
            <View style={styles.customerCard}>
              <View style={styles.customerHeader}>
                <View style={styles.customerAvatar}>
                  <Ionicons name="person" size={32} color="#fff" />
                </View>
                <View style={styles.customerInfo}>
                  <Text style={styles.customerName}>{MOCK_CUSTOMER.name}</Text>
                  <Text style={styles.customerPhone}>{MOCK_CUSTOMER.phone}</Text>
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

              {/* Measurements */}
              <View style={styles.measurementsSection}>
                <Text style={styles.sectionTitle}>Customer Measurements</Text>
                <View style={styles.measurementGrid}>
                  <View style={styles.measurementItem}>
                    <Text style={styles.measurementLabel}>Chest</Text>
                    <Text style={styles.measurementValue}>{MOCK_CUSTOMER.measurements.chest}</Text>
                  </View>
                  <View style={styles.measurementItem}>
                    <Text style={styles.measurementLabel}>Waist</Text>
                    <Text style={styles.measurementValue}>{MOCK_CUSTOMER.measurements.waist}</Text>
                  </View>
                  <View style={styles.measurementItem}>
                    <Text style={styles.measurementLabel}>Length</Text>
                    <Text style={styles.measurementValue}>{MOCK_CUSTOMER.measurements.length}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Timeline Section */}
            <View style={styles.timelineSection}>
              <Text style={styles.sectionTitle}>Progress Timeline</Text>
              <FlatList
                data={STEPS}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item, index }) => {
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
                        </View>
                        {index !== STEPS.length - 1 && <View style={styles.line} />}
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
                        {active && <Text style={styles.sub}>Currently In Progress</Text>}
                        {completed && <Text style={styles.subCompleted}>Completed</Text>}
                      </View>
                    </View>
                  );
                }}
                scrollEnabled={false}
              />
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.backActionButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backActionButtonText}>← Back</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.button,
                currentStep === STEPS.length - 1 && styles.buttonCompleted
              ]} 
              onPress={updateNextStep}
            >
              <Text style={styles.buttonText}>
                {currentStep === STEPS.length - 1 ? 'Order Completed - Go Back' : 'Mark Next Step Complete'}
              </Text>
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
    backgroundColor: "#f8f9fa",
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
  customerCard: {
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  customerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  customerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#ef4444",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  customerPhone: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2,
  },
  orderDetailsSection: {
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#d1d5db",
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
  measurementsSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#d1d5db",
  },
  measurementGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  measurementItem: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 4,
    alignItems: "center",
  },
  measurementLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
  },
  measurementValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ef4444",
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
    backgroundColor: "#ef4444",
    borderColor: "#dc2626",
  },
  line: {
    width: 3,
    flex: 1,
    backgroundColor: "#e5e7eb",
    marginTop: 6,
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
    color: "#ef4444",
    fontWeight: "700",
    fontSize: 16,
  },
  sub: {
    fontSize: 12,
    color: "#ef4444",
    marginTop: 4,
    fontWeight: "500",
  },
  subCompleted: {
    fontSize: 12,
    color: "#10b981",
    marginTop: 4,
  },
  buttonContainer: {
    padding: 16,
    paddingBottom: 20,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    gap: 10,
  },
  backActionButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: "#ef4444",
    borderRadius: 10,
    alignItems: "center",
  },
  backActionButtonText: {
    color: "#ef4444",
    fontSize: 16,
    fontWeight: "700",
  },
  button: {
    backgroundColor: "#ef4444",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonDisabled: {
    backgroundColor: "#9ca3af",
    shadowColor: "#000",
  },
  buttonCompleted: {
    backgroundColor: "#10b981",
    shadowColor: "#10b981",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
