import React, { useState } from 'react';
import { View, ScrollView, TextInput, Pressable, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

type Step = 'shirt' | 'trouser';

const shirtFields = [
  { id: 'arm', label: 'Arm', icon: '💪' },
  { id: 'chest', label: 'Chest', icon: '👕' },
  { id: 'neck', label: 'Neck', icon: '🧣' },
  { id: 'length', label: 'Length', icon: '📏' },
  { id: 'shoulder', label: 'Shoulder', icon: '🤵' },
  { id: 'waist', label: 'Waist', icon: '🎽' },
];

const trouserFields = [
  { id: 'waist', label: 'Waist', icon: '🎽' },
  { id: 'length', label: 'Length', icon: '📏' },
  { id: 'phuncha', label: 'Phuncha', icon: '🩳' },
];

export default function MeasurementForm() {
  const router = useRouter();
  const tint = useThemeColor({}, 'tint');
  const card = useThemeColor({}, 'card');
  const inputBorder = useThemeColor({}, 'inputBorder');
  const muted = useThemeColor({}, 'muted');

  const [step, setStep] = useState<Step>('shirt');
  const [shirt, setShirt] = useState<Record<string, string>>({});
  const [trouser, setTrouser] = useState<Record<string, string>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);
  // Use the static measurement image from the 2d model folder
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const measurementImg = require('../../2d model/measurment.jpg');

  const shirtProgress = Object.values(shirt).filter(Boolean).length;
  const trouserProgress = Object.values(trouser).filter(Boolean).length;
  const shirtComplete = shirtProgress === shirtFields.length;
  const trouserComplete = trouserProgress === trouserFields.length;

  // No picker: show static guidance image

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { backgroundColor: tint }]}> 
        <Pressable onPress={() => (router as any).back()}><ThemedText style={{ color: '#fff' }}>{'< Back'}</ThemedText></Pressable>
        <ThemedText style={styles.headerTitle}>Measurement Form</ThemedText>
        <View style={{ width: 56 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.previewBox, { backgroundColor: card, borderColor: inputBorder }]}> 
          <ThemedText style={{ fontWeight: '700', marginBottom: 8 }}>3D Model Guidance</ThemedText>
          <ThemedText style={{ marginBottom: 6, color: muted }}>{focusedField ? `Guidance: measure the ${focusedField}` : 'Tap a measurement field below to see guidance on the model.'}</ThemedText>
          <View style={[styles.modelPlaceholder, { borderColor: inputBorder }]}> 
            <Image source={measurementImg} style={styles.modelImage} resizeMode="contain" />
          </View>
        </View>

        <View style={[styles.infoCard, { borderColor: inputBorder, backgroundColor: card }]}> 
          <ThemedText style={{ fontWeight: '700' }}>Measurement Tips</ThemedText>
          <ThemedText style={{ color: muted }}>Use a flexible tape and measure over your undergarments.</ThemedText>
        </View>

        {step === 'shirt' ? (
          <View style={styles.formGroup}>
            <ThemedText style={styles.sectionTitle}>Shirt Measurements</ThemedText>
            {shirtFields.map((f) => (
              <View key={f.id} style={styles.fieldRow}>
                <ThemedText>{f.icon} {f.label}</ThemedText>
                <TextInput
                  keyboardType="numeric"
                  value={shirt[f.id] || ''}
                  onChangeText={(t) => setShirt((p) => ({ ...p, [f.id]: t }))}
                  placeholder="--"
                  style={[styles.input, { borderColor: inputBorder }]}
                  onFocus={() => setFocusedField(f.label)}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.formGroup}>
            <ThemedText style={styles.sectionTitle}>Trouser Measurements</ThemedText>
            {trouserFields.map((f) => (
              <View key={f.id} style={styles.fieldRow}>
                <ThemedText>{f.icon} {f.label}</ThemedText>
                <TextInput
                  keyboardType="numeric"
                  value={trouser[f.id] || ''}
                  onChangeText={(t) => setTrouser((p) => ({ ...p, [f.id]: t }))}
                  placeholder="--"
                  style={[styles.input, { borderColor: inputBorder }]}
                  onFocus={() => setFocusedField(f.label)}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: inputBorder, backgroundColor: card }]}> 
        {step === 'shirt' ? (
          <Pressable onPress={() => setStep('trouser')} disabled={!shirtComplete} style={[styles.proceed, { backgroundColor: shirtComplete ? tint : '#f3f4f6' }]}>
            <ThemedText style={{ color: shirtComplete ? '#fff' : '#999' }}>Continue to Trouser</ThemedText>
          </Pressable>
        ) : (
          <Pressable onPress={() => (router as any).replace('/customer')} disabled={!trouserComplete} style={[styles.proceed, { backgroundColor: trouserComplete ? tint : '#f3f4f6' }]}>
            <ThemedText style={{ color: trouserComplete ? '#fff' : '#999' }}>Save Measurements</ThemedText>
          </Pressable>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 40, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { color: '#fff', fontWeight: '700' },
  scroll: { padding: 12 },
  infoCard: { padding: 12, borderRadius: 12, borderWidth: 1 },
  formGroup: { marginTop: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  fieldRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  input: { minWidth: 120, borderWidth: 1, borderRadius: 10, padding: 8, height: 44 },
  footer: { padding: 12 },
  proceed: { padding: 14, borderRadius: 12, alignItems: 'center' },
  previewBox: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  modelPlaceholder: { height: 260, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  modelImage: { width: '100%', height: 260, borderRadius: 12 },
});
