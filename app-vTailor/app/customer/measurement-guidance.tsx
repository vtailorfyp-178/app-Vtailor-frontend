import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

interface Measurement {
  id: string;
  name: string;
  unit: string;
  guidance: string;
  placeholder: string;
  icon: string;
}

const MEASUREMENTS: Measurement[] = [
  {
    id: "chest",
    name: "Chest",
    unit: "inches",
    guidance: "Measure around your full chest at the widest point, keeping the tape level and snug but not tight.",
    placeholder: "e.g., 38",
    icon: "body",
  },
  {
    id: "waist",
    name: "Waist",
    unit: "inches",
    guidance: "Measure around your natural waist where you normally wear your pants, keeping tape parallel to ground.",
    placeholder: "e.g., 32",
    icon: "body",
  },
  {
    id: "shoulder",
    name: "Shoulder Width",
    unit: "inches",
    guidance: "Measure from the edge of one shoulder to the edge of the other, across your back.",
    placeholder: "e.g., 18",
    icon: "body",
  },
  {
    id: "sleeve",
    name: "Sleeve Length",
    unit: "inches",
    guidance: "Extend your arm and measure from the center back neck, across shoulder, down to wrist bone.",
    placeholder: "e.g., 32",
    icon: "body",
  },
  {
    id: "length",
    name: "Garment Length",
    unit: "inches",
    guidance: "Measure from shoulder point down to your desired garment hem length.",
    placeholder: "e.g., 28",
    icon: "body",
  },
  {
    id: "inseam",
    name: "Inseam",
    unit: "inches",
    guidance: "Measure from inner thigh down to ankle, keeping tape snug against your leg.",
    placeholder: "e.g., 30",
    icon: "body",
  },
  {
    id: "neck",
    name: "Neck",
    unit: "inches",
    guidance: "Measure around your neck where you normally wear a collar, keeping one finger's space for comfort.",
    placeholder: "e.g., 16",
    icon: "body",
  },
];

const MeasurementGuidanceScreen = () => {
  const router = useRouter();
  const [selectedMeasurement, setSelectedMeasurement] = useState<string | null>(MEASUREMENTS[0].id);
  const [measurements, setMeasurements] = useState<Record<string, string>>({});

  const currentMeasurement = MEASUREMENTS.find((m) => m.id === selectedMeasurement);

  const handleMeasurementChange = (id: string, value: string) => {
    setMeasurements((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSave = () => {
    // Save measurements to storage or send to backend
    router.back();
  };

  return (
    <ProtectedRoute requiredRole="customer">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.heading}>Measurement Guide</Text>
            <Text style={styles.subheading}>Take accurate measurements for perfect fit</Text>
          </View>
        </View>

        {/* Static 3D Model Area - Fixed */}
        <View style={styles.modelContainer} pointerEvents="none">
            <View style={styles.modelPlaceholder}>
              <Ionicons name="body" size={120} color="#d1d5db" />
              <Text style={styles.modelText}>Male Standard Size</Text>
              <Text style={styles.modelSubtext}>Reference Guide</Text>
            </View>
            <Text style={styles.modelNote}>
              This 3D model is a static reference guide. Select measurements below and follow the guidance to measure yourself accurately.
            </Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
          {/* Guidance Section */}
          {currentMeasurement && (
            <View style={styles.guidanceCard}>
              <View style={styles.guidanceHeader}>
                <View style={styles.guidanceIconBox}>
                  <Ionicons name={currentMeasurement.icon as any} size={28} color="#3b82f6" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.guidanceName}>{currentMeasurement.name}</Text>
                  <Text style={styles.guidanceUnit}>in {currentMeasurement.unit}</Text>
                </View>
              </View>
              <Text style={styles.guidanceText}>{currentMeasurement.guidance}</Text>
              <View style={styles.inputSection}>
                <TextInput
                  style={styles.input}
                  placeholder={currentMeasurement.placeholder}
                  placeholderTextColor="#9ca3af"
                  value={measurements[currentMeasurement.id] || ""}
                  onChangeText={(value) =>
                    handleMeasurementChange(currentMeasurement.id, value)
                  }
                  keyboardType="decimal-pad"
                />
                <Text style={styles.unitLabel}>{currentMeasurement.unit}</Text>
              </View>
            </View>
          )}

          {/* All Measurements */}
          <Text style={styles.sectionTitle}>All Measurements</Text>
          <View style={styles.measurementsList}>
            {MEASUREMENTS.map((measurement) => {
              const isSelected = selectedMeasurement === measurement.id;
              const isFilled = measurements[measurement.id];

              return (
                <TouchableOpacity
                  key={measurement.id}
                  style={[
                    styles.measurementItem,
                    isSelected && styles.measurementItemSelected,
                  ]}
                  onPress={() => setSelectedMeasurement(measurement.id)}
                >
                  <View style={styles.measurementItemLeft}>
                    <View
                      style={[
                        styles.measurementItemIcon,
                        isSelected && styles.measurementItemIconSelected,
                      ]}
                    >
                      <Ionicons
                        name={measurement.icon as any}
                        size={20}
                        color={isSelected ? "#fff" : "#3b82f6"}
                      />
                    </View>
                    <View>
                      <Text
                        style={[
                          styles.measurementItemName,
                          isSelected && styles.measurementItemNameSelected,
                        ]}
                      >
                        {measurement.name}
                      </Text>
                      <Text style={styles.measurementItemUnit}>{measurement.unit}</Text>
                    </View>
                  </View>
                  <View style={styles.measurementItemRight}>
                    {isFilled && (
                      <Text style={styles.measurementItemValue}>
                        {measurements[measurement.id]}
                      </Text>
                    )}
                    <Ionicons
                      name={
                        isFilled
                          ? "checkmark-circle"
                          : isSelected
                          ? "chevron-forward"
                          : "chevron-forward"
                      }
                      size={20}
                      color={
                        isFilled ? "#10b981" : isSelected ? "#3b82f6" : "#d1d5db"
                      }
                    />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Instructions */}
          <View style={styles.instructionsCard}>
            <View style={styles.instructionsHeader}>
              <Ionicons name="information-circle" size={20} color="#3b82f6" />
              <Text style={styles.instructionsTitle}>Measurement Tips</Text>
            </View>
            <View style={styles.instructionItem}>
              <Text style={styles.instructionBullet}>•</Text>
              <Text style={styles.instructionText}>
                Use a soft measuring tape, not a ruler
              </Text>
            </View>
            <View style={styles.instructionItem}>
              <Text style={styles.instructionBullet}>•</Text>
              <Text style={styles.instructionText}>
                Wear light, fitted clothing when measuring
              </Text>
            </View>
            <View style={styles.instructionItem}>
              <Text style={styles.instructionBullet}>•</Text>
              <Text style={styles.instructionText}>
                Keep tape parallel to the ground
              </Text>
            </View>
            <View style={styles.instructionItem}>
              <Text style={styles.instructionBullet}>•</Text>
              <Text style={styles.instructionText}>
                Don't pull tape too tight or too loose
              </Text>
            </View>
            <View style={styles.instructionItem}>
              <Text style={styles.instructionBullet}>•</Text>
              <Text style={styles.instructionText}>
                Measure twice to ensure accuracy
              </Text>
            </View>
          </View>

          <View style={{ height: 30 }} />
        </ScrollView>

        {/* Footer Buttons */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.buttonSecondary}
            onPress={() => {
              setMeasurements({});
              setSelectedMeasurement(MEASUREMENTS[0].id);
            }}
          >
            <Text style={styles.buttonSecondaryText}>Clear All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buttonPrimary} onPress={handleSave}>
            <Ionicons name="checkmark" size={20} color="#fff" />
            <Text style={styles.buttonPrimaryText}>Save Measurements</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ProtectedRoute>
  );
};

export default MeasurementGuidanceScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
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
  content: {
    flex: 1,
  },
  modelContainer: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
  },
  modelPlaceholder: {
    width: "100%",
    height: 280,
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#e5e7eb",
  },
  modelText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#6b7280",
    marginTop: 12,
  },
  modelSubtext: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 4,
  },
  modelNote: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 18,
    marginTop: 12,
  },
  guidanceCard: {
    backgroundColor: "#eff6ff",
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#3b82f6",
  },
  guidanceHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  guidanceIconBox: {
    width: 48,
    height: 48,
    backgroundColor: "#dbeafe",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  guidanceName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e40af",
  },
  guidanceUnit: {
    fontSize: 12,
    color: "#3b82f6",
    marginTop: 2,
  },
  guidanceText: {
    fontSize: 14,
    color: "#1e3a8a",
    lineHeight: 22,
    marginBottom: 16,
  },
  inputSection: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#3b82f6",
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  unitLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#3b82f6",
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginHorizontal: 16,
    marginBottom: 12,
    marginTop: 8,
  },
  measurementsList: {
    marginHorizontal: 16,
  },
  measurementItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  measurementItemSelected: {
    backgroundColor: "#eff6ff",
    borderColor: "#3b82f6",
  },
  measurementItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  measurementItemIcon: {
    width: 40,
    height: 40,
    backgroundColor: "#dbeafe",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  measurementItemIconSelected: {
    backgroundColor: "#3b82f6",
  },
  measurementItemName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  measurementItemNameSelected: {
    color: "#3b82f6",
  },
  measurementItemUnit: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 2,
  },
  measurementItemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  measurementItemValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#10b981",
  },
  instructionsCard: {
    backgroundColor: "#f0fdf4",
    marginHorizontal: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#10b981",
  },
  instructionsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  instructionsTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#166534",
    marginLeft: 8,
  },
  instructionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  instructionBullet: {
    fontSize: 13,
    color: "#10b981",
    fontWeight: "bold",
    marginRight: 8,
  },
  instructionText: {
    fontSize: 13,
    color: "#166534",
    flex: 1,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.select({ ios: 32, android: 16, default: 16 }),
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    flexDirection: "row",
    gap: 12,
  },
  buttonSecondary: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  buttonSecondaryText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  buttonPrimary: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  buttonPrimaryText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
});
