import React, { useEffect, useRef, useState } from 'react';
import { View, ScrollView, TextInput, Pressable, StyleSheet, Image, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import AppBackButton from '@/components/AppBackButton';

type Step = 'shirt' | 'trouser';

const shirtFields = [
  { id: 'arm', label: 'Arm / Sleeve', unit: 'in' },
  { id: 'chest', label: 'Chest / Bust', unit: 'in' },
  { id: 'neck', label: 'Neck', unit: 'in' },
  { id: 'length', label: 'Shirt Length', unit: 'in' },
  { id: 'shoulder', label: 'Shoulder', unit: 'in' },
  { id: 'waist', label: 'Waist', unit: 'in' },
];

const trouserFields = [
  { id: 'waist', label: 'Waist', unit: 'in' },
  { id: 'length', label: 'Trouser Length', unit: 'in' },
  { id: 'phuncha', label: 'Phuncha / Bottom', unit: 'in' },
];

export default function MeasurementForm() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView | null>(null);
  const inputRefs = useRef<Record<string, TextInput | null>>({});
  const fieldOffsets = useRef<Record<string, number>>({});
  const tint = useThemeColor({}, 'tint');
  const card = useThemeColor({}, 'card');
  const inputBorder = useThemeColor({}, 'inputBorder');
  const muted = useThemeColor({}, 'muted');

  const [step, setStep] = useState<Step>('shirt');
  const [shirt, setShirt] = useState<Record<string, string>>({});
  const [trouser, setTrouser] = useState<Record<string, string>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  // Use the static measurement image from the 2d model folder
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const measurementImg = require('../../2d model/measurment.jpg');

  const shirtProgress = Object.values(shirt).filter(Boolean).length;
  const trouserProgress = Object.values(trouser).filter(Boolean).length;
  const shirtComplete = shirtProgress === shirtFields.length;
  const trouserComplete = trouserProgress === trouserFields.length;
  const activeFields = step === 'shirt' ? shirtFields : trouserFields;

  const saveMeasurements = async () => {
    const payload = {
      shirt,
      trouser,
      updatedAt: new Date().toISOString(),
    };

    const listRaw = await AsyncStorage.getItem('CUSTOMER_MEASUREMENTS');
    const list = listRaw ? JSON.parse(listRaw) : [];
    list.unshift(payload);
    await AsyncStorage.setItem('CUSTOMER_MEASUREMENTS', JSON.stringify(list));
  };

  // No picker: show static guidance image
  const getFieldKey = (fieldId: string, fieldStep = step) => `${fieldStep}-${fieldId}`;

  const scrollToField = (fieldKey: string) => {
    setTimeout(() => {
      const y = fieldOffsets.current[fieldKey] ?? 0;
      scrollRef.current?.scrollTo({ y: Math.max(0, y - 220), animated: true });
    }, 120);
  };

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const focusNextField = (index: number) => {
    const next = activeFields[index + 1];
    if (next) {
      const nextKey = getFieldKey(next.id);
      inputRefs.current[nextKey]?.focus();
      scrollToField(nextKey);
      return;
    }

    if (step === 'shirt') {
      setStep('trouser');
      setTimeout(() => {
        const firstTrouserKey = getFieldKey(trouserFields[0].id, 'trouser');
        inputRefs.current[firstTrouserKey]?.focus();
        scrollToField(firstTrouserKey);
      }, 180);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { backgroundColor: tint }]}> 
        <AppBackButton onPress={() => (router as any).back()} variant="tint" />
        <ThemedText style={styles.headerTitle}>Measurement Form</ThemedText>
      </View>

      <KeyboardAvoidingView behavior="padding" style={styles.keyboardArea} keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.scroll, { paddingBottom: keyboardVisible ? 360 : 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.previewBox, { backgroundColor: card, borderColor: inputBorder }]}> 
          <ThemedText style={{ fontWeight: '700', marginBottom: 8 }}>3D Model Guidance</ThemedText>
          <ThemedText style={{ marginBottom: 6, color: muted }}>{focusedField ? `Guidance: measure the ${focusedField}` : 'Tap a measurement field below to see guidance on the model.'}</ThemedText>
          <View style={[styles.modelPlaceholder, { borderColor: inputBorder }]}> 
            <Image source={measurementImg} style={styles.modelImage} resizeMode="contain" />
          </View>
        </View>

        <View style={[styles.infoCard, { borderColor: inputBorder, backgroundColor: card }]}> 
          <ThemedText style={{ fontWeight: '700' }}>Measurement Tips</ThemedText>
          <ThemedText style={{ color: muted }}>Use a flexible tailor tape. Enter all values in inches (in), the standard unit used by most tailors for dress measurements.</ThemedText>
        </View>

        {step === 'shirt' ? (
          <View style={styles.formGroup}>
            <ThemedText style={styles.sectionTitle}>Shirt Measurements</ThemedText>
            {shirtFields.map((f, index) => (
              <View
                key={f.id}
                style={styles.fieldRow}
                onLayout={(event) => { fieldOffsets.current[getFieldKey(f.id, 'shirt')] = event.nativeEvent.layout.y; }}
              >
                <View style={styles.fieldLabelWrap}>
                  <ThemedText style={styles.fieldLabel}>{f.label}</ThemedText>
                  <ThemedText style={[styles.unitHint, { color: muted }]}>Unit: inches ({f.unit})</ThemedText>
                </View>
                <View style={[styles.inputWrap, { borderColor: inputBorder }]}>
                  <TextInput
                    ref={(ref) => { inputRefs.current[getFieldKey(f.id, 'shirt')] = ref; }}
                    keyboardType="decimal-pad"
                    value={shirt[f.id] || ''}
                    onChangeText={(t) => setShirt((p) => ({ ...p, [f.id]: t.replace(/[^0-9.]/g, '') }))}
                    placeholder="0"
                    style={styles.input}
                    returnKeyType={index === shirtFields.length - 1 ? 'next' : 'next'}
                    blurOnSubmit={false}
                    onSubmitEditing={() => focusNextField(index)}
                    onFocus={() => {
                      setFocusedField(f.label);
                      scrollToField(getFieldKey(f.id, 'shirt'));
                    }}
                    onBlur={() => setFocusedField(null)}
                  />
                  <ThemedText style={[styles.unitText, { color: muted }]}>{f.unit}</ThemedText>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.formGroup}>
            <ThemedText style={styles.sectionTitle}>Trouser Measurements</ThemedText>
            {trouserFields.map((f, index) => (
              <View
                key={f.id}
                style={styles.fieldRow}
                onLayout={(event) => { fieldOffsets.current[getFieldKey(f.id, 'trouser')] = event.nativeEvent.layout.y; }}
              >
                <View style={styles.fieldLabelWrap}>
                  <ThemedText style={styles.fieldLabel}>{f.label}</ThemedText>
                  <ThemedText style={[styles.unitHint, { color: muted }]}>Unit: inches ({f.unit})</ThemedText>
                </View>
                <View style={[styles.inputWrap, { borderColor: inputBorder }]}>
                  <TextInput
                    ref={(ref) => { inputRefs.current[getFieldKey(f.id, 'trouser')] = ref; }}
                    keyboardType="decimal-pad"
                    value={trouser[f.id] || ''}
                    onChangeText={(t) => setTrouser((p) => ({ ...p, [f.id]: t.replace(/[^0-9.]/g, '') }))}
                    placeholder="0"
                    style={styles.input}
                    returnKeyType={index === trouserFields.length - 1 ? 'done' : 'next'}
                    blurOnSubmit={index !== trouserFields.length - 1}
                    onSubmitEditing={() => focusNextField(index)}
                    onFocus={() => {
                      setFocusedField(f.label);
                      scrollToField(getFieldKey(f.id, 'trouser'));
                    }}
                    onBlur={() => setFocusedField(null)}
                  />
                  <ThemedText style={[styles.unitText, { color: muted }]}>{f.unit}</ThemedText>
                </View>
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
          <Pressable
            onPress={async () => {
              if (!trouserComplete) return;
              await saveMeasurements();
              (router as any).replace('/customer/find-tailors');
            }}
            disabled={!trouserComplete}
            style={[styles.proceed, { backgroundColor: trouserComplete ? tint : '#f3f4f6' }]}
          >
            <ThemedText style={{ color: trouserComplete ? '#fff' : '#999' }}>Continue to Tailors</ThemedText>
          </Pressable>
        )}
      </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardArea: { flex: 1 },
  header: { paddingTop: 40, padding: 16, gap: 12 },
  headerTitle: { color: '#fff', fontWeight: '800', fontSize: 18 },
  scroll: { padding: 12, paddingBottom: 24 },
  infoCard: { padding: 12, borderRadius: 12, borderWidth: 1 },
  formGroup: { marginTop: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  fieldRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 12 },
  fieldLabelWrap: { flex: 1 },
  fieldLabel: { fontWeight: '700' },
  unitHint: { fontSize: 11, marginTop: 3 },
  inputWrap: { minWidth: 128, height: 46, borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff' },
  input: { flex: 1, paddingVertical: 8, fontSize: 15 },
  unitText: { fontSize: 12, fontWeight: '800', marginLeft: 6 },
  footer: { padding: 12 },
  proceed: { padding: 14, borderRadius: 12, alignItems: 'center' },
  previewBox: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  modelPlaceholder: { height: 260, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  modelImage: { width: '100%', height: 260, borderRadius: 12 },
});
