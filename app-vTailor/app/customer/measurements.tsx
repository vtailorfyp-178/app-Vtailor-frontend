import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
  Keyboard,
  useWindowDimensions,
} from 'react-native';
import { useKeyboardInset } from '@/hooks/useKeyboardInset';
import { MeasurementModelViewer } from '@/components/MeasurementModelViewer';
import { buildBasicMeasurementValues } from '@/services/measurement/measurementLabelConfig';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import AppBackButton from '@/components/AppBackButton';

type Step = 'basic' | 'shirt' | 'trouser' | 'other';

type FieldDef = { id: string; label: string; subtitle?: string; unit: string };

const basicFields: FieldDef[] = [
  { id: 'shoulder', label: 'Shoulder Width', unit: 'in' },
  { id: 'biceps', label: 'Biceps', subtitle: 'Upper Arm Circumference', unit: 'in' },
  { id: 'arm', label: 'Arm Length', unit: 'in' },
  { id: 'thigh', label: 'Thigh', subtitle: 'Thigh Circumference', unit: 'in' },
  { id: 'armpit', label: 'Armpit', subtitle: 'Arm-Body Connection', unit: 'in' },
  { id: 'bust', label: 'Bust / Chest', unit: 'in' },
  { id: 'waist', label: 'Waist', subtitle: 'Waist Circumference', unit: 'in' },
  { id: 'hip', label: 'Hips', subtitle: 'Hip Circumference', unit: 'in' },
];

const shirtFields: FieldDef[] = [
  { id: 'neck', label: 'Neck', subtitle: 'Collar Base', unit: 'in' },
  { id: 'length', label: 'Shirt Length', subtitle: 'Shoulder to Hem', unit: 'in' },
  { id: 'chawk', label: 'Chawk', subtitle: 'Chest Width', unit: 'in' },
  { id: 'gherah', label: 'Gherah', subtitle: 'Hem Circumference', unit: 'in' },
];

const trouserFields: FieldDef[] = [
  { id: 'length', label: 'Trouser Length', subtitle: 'Waist to Ankle', unit: 'in' },
  { id: 'phuncha', label: 'Phuncha / Bottom', subtitle: 'Leg Opening', unit: 'in' },
  { id: 'inseam', label: 'Inseam', subtitle: 'Inner Leg Length', unit: 'in' },
];

/** Optional — not required to continue. */
const otherFields: FieldDef[] = [
  { id: 'frockFlare', label: 'Flared for Frock', subtitle: 'Frock Hem Flare', unit: 'in' },
  { id: 'sareePalu', label: 'Palu Length for Saree', subtitle: 'Saree Pallu Length', unit: 'in' },
  { id: 'ghararaThigh', label: 'Thigh for Gharara', subtitle: 'Gharara Thigh Circumference', unit: 'in' },
  { id: 'ghararaFlare', label: 'Flared for Gharara', subtitle: 'Gharara Flare Width', unit: 'in' },
  { id: 'lehengaLength', label: 'Shirt Length for Lehenga', subtitle: 'Lehenga Choli Length', unit: 'in' },
];

const STEP_TITLE: Record<Step, string> = {
  basic: 'Basic Measurements',
  shirt: 'Shirt Measurements',
  trouser: 'Trouser Measurements',
  other: 'Other Measurements (Optional)',
};

function isStepComplete(values: Record<string, string>, fields: FieldDef[]): boolean {
  return fields.every((f) => Boolean(values[f.id]?.trim()));
}

export default function MeasurementForm() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView | null>(null);
  const inputRefs = useRef<Record<string, TextInput | null>>({});
  const fieldOffsets = useRef<Record<string, number>>({});
  const tint = useThemeColor({}, 'tint');
  const card = useThemeColor({}, 'card');
  const inputBorder = useThemeColor({}, 'inputBorder');
  const muted = useThemeColor({}, 'muted');
  const { keyboardHeight, keyboardVisible, bottomInset, inputPaddingBottom } = useKeyboardInset({ extraOffset: 8 });

  const [step, setStep] = useState<Step>('basic');
  const [basic, setBasic] = useState<Record<string, string>>({});
  const [shirt, setShirt] = useState<Record<string, string>>({});
  const [trouser, setTrouser] = useState<Record<string, string>>({});
  const [other, setOther] = useState<Record<string, string>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const { width: windowWidth } = useWindowDimensions();
  const viewerWidth = Math.max(280, windowWidth - 56);
  const viewerHeight = 420;

  const modelMeasurementValues = useMemo(() => buildBasicMeasurementValues(basic), [basic]);

  const basicComplete = isStepComplete(basic, basicFields);
  const shirtComplete = isStepComplete(shirt, shirtFields);
  const trouserComplete = isStepComplete(trouser, trouserFields);

  const activeFields =
    step === 'basic'
      ? basicFields
      : step === 'shirt'
        ? shirtFields
        : step === 'trouser'
          ? trouserFields
          : otherFields;

  const saveMeasurements = async () => {
    const payload = {
      basic,
      shirt,
      trouser,
      other,
      updatedAt: new Date().toISOString(),
    };

    const listRaw = await AsyncStorage.getItem('CUSTOMER_MEASUREMENTS');
    const list = listRaw ? JSON.parse(listRaw) : [];
    list.unshift(payload);
    await AsyncStorage.setItem('CUSTOMER_MEASUREMENTS', JSON.stringify(list));
  };

  const goToTailors = async () => {
    await saveMeasurements();
    (router as any).replace('/customer/find-tailors');
  };

  const getFieldKey = (fieldId: string, fieldStep: Step = step) => `${fieldStep}-${fieldId}`;

  const scrollToField = (fieldKey: string) => {
    setTimeout(() => {
      const y = fieldOffsets.current[fieldKey] ?? 0;
      const scrollOffset = keyboardHeight > 0 ? keyboardHeight + 120 : 220;
      scrollRef.current?.scrollTo({ y: Math.max(0, y - scrollOffset), animated: true });
    }, Platform.OS === 'ios' ? 80 : 120);
  };

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const showSub = Keyboard.addListener(showEvent, () => {
      if (focusedField) {
        const active = activeFields.find((f) => f.label === focusedField);
        if (active) scrollToField(getFieldKey(active.id, step));
      }
    });
    return () => {
      showSub.remove();
    };
  }, [focusedField, step, keyboardHeight, activeFields]);

  const focusNextField = (index: number) => {
    const next = activeFields[index + 1];
    if (next) {
      const nextKey = getFieldKey(next.id);
      inputRefs.current[nextKey]?.focus();
      scrollToField(nextKey);
      return;
    }

    if (step === 'basic' && basicComplete) {
      setStep('shirt');
      setFocusedField(null);
      setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: true }), 180);
    } else if (step === 'shirt' && shirtComplete) {
      setStep('trouser');
      setFocusedField(null);
      setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: true }), 180);
    } else if (step === 'trouser' && trouserComplete) {
      setStep('other');
      setFocusedField(null);
      setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: true }), 180);
    }
  };

  const renderFields = (
    fields: FieldDef[],
    fieldStep: Step,
    values: Record<string, string>,
    onChange: (id: string, text: string) => void,
  ) =>
    fields.map((f, index) => (
      <View
        key={f.id}
        style={styles.fieldRow}
        onLayout={(event) => {
          fieldOffsets.current[getFieldKey(f.id, fieldStep)] = event.nativeEvent.layout.y;
        }}
      >
        <View style={styles.fieldLabelWrap}>
          <ThemedText style={styles.fieldLabel}>{f.label}</ThemedText>
          {f.subtitle ? (
            <ThemedText style={[styles.fieldSubtitle, { color: muted }]}>{f.subtitle}</ThemedText>
          ) : null}
          <ThemedText style={[styles.unitHint, { color: muted }]}>Unit: inches ({f.unit})</ThemedText>
        </View>
        <View style={[styles.inputWrap, { borderColor: inputBorder }]}>
          <TextInput
            ref={(ref) => {
              inputRefs.current[getFieldKey(f.id, fieldStep)] = ref;
            }}
            keyboardType="decimal-pad"
            value={values[f.id] || ''}
            onChangeText={(t) => onChange(f.id, t.replace(/[^0-9.]/g, ''))}
            placeholder="0"
            style={styles.input}
            returnKeyType={index === fields.length - 1 ? 'done' : 'next'}
            blurOnSubmit={index === fields.length - 1}
            onSubmitEditing={() => focusNextField(index)}
            onFocus={() => {
              if (fieldStep === 'basic') setFocusedField(f.label);
              else setFocusedField(null);
              scrollToField(getFieldKey(f.id, fieldStep));
            }}
            onBlur={() => setFocusedField(null)}
          />
          <ThemedText style={[styles.unitText, { color: muted }]}>{f.unit}</ThemedText>
        </View>
      </View>
    ));

  const handleBack = () => {
    if (step === 'other') setStep('trouser');
    else if (step === 'trouser') setStep('shirt');
    else if (step === 'shirt') setStep('basic');
    else (router as any).back();
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { backgroundColor: tint }]}>
        <View style={styles.headerRow}>
          <AppBackButton onPress={handleBack} variant="tint" />
          <ThemedText style={styles.headerTitle} numberOfLines={2}>
            {STEP_TITLE[step]}
          </ThemedText>
        </View>
      </View>

      <View style={styles.keyboardArea}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[styles.scroll, { paddingBottom: keyboardVisible ? bottomInset + 88 : 16 }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          bounces={false}
          alwaysBounceVertical={false}
          overScrollMode="never"
        >
          <View style={[styles.previewBox, { backgroundColor: card, borderColor: inputBorder }]}>
            <ThemedText style={{ fontWeight: '700', marginBottom: 8 }}>3D Model Guidance</ThemedText>
            <ThemedText style={{ marginBottom: 6, color: muted }}>
              {step === 'basic'
                ? focusedField
                  ? `Guidance: measure ${focusedField}`
                  : 'Enter basic measurements below — values appear on the model.'
                : 'Basic measurements are saved on the model above.'}
            </ThemedText>
            <View style={[styles.modelPlaceholder, { borderColor: inputBorder }]}>
              <MeasurementModelViewer
                width={viewerWidth}
                height={viewerHeight}
                focusedField={step === 'basic' ? focusedField : null}
                measurementValues={modelMeasurementValues}
              />
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.stepPillsScroll}
            contentContainerStyle={[styles.stepPills, { borderColor: inputBorder, backgroundColor: card }]}
          >
            <ThemedText style={[styles.stepPill, step === 'basic' && styles.stepPillActive]}>1 Basic</ThemedText>
            <ThemedText style={{ color: muted }}>→</ThemedText>
            <ThemedText style={[styles.stepPill, step === 'shirt' && styles.stepPillActive]}>2 Shirt</ThemedText>
            <ThemedText style={{ color: muted }}>→</ThemedText>
            <ThemedText style={[styles.stepPill, step === 'trouser' && styles.stepPillActive]}>3 Trouser</ThemedText>
            <ThemedText style={{ color: muted }}>→</ThemedText>
            <ThemedText style={[styles.stepPill, step === 'other' && styles.stepPillActive]}>4 Other</ThemedText>
          </ScrollView>

          <View style={[styles.infoCard, { borderColor: inputBorder, backgroundColor: card }]}>
            <ThemedText style={{ fontWeight: '700' }}>Measurement Tips</ThemedText>
            <ThemedText style={{ color: muted }}>
              {step === 'other'
                ? 'These fields are optional — fill only what applies to your outfit (frock, saree, gharara, lehenga).'
                : 'Use a flexible tailor tape. Enter all values in inches (in). Basic body measurements update the 3D model.'}
            </ThemedText>
          </View>

          <View style={styles.formGroup}>
            <ThemedText style={styles.sectionTitle}>{STEP_TITLE[step]}</ThemedText>
            {step === 'other' ? (
              <ThemedText style={[styles.optionalBadge, { color: muted }]}>Optional — skip if not needed</ThemedText>
            ) : null}
            {step === 'basic' &&
              renderFields(basicFields, 'basic', basic, (id, text) => setBasic((p) => ({ ...p, [id]: text })))}
            {step === 'shirt' &&
              renderFields(shirtFields, 'shirt', shirt, (id, text) => setShirt((p) => ({ ...p, [id]: text })))}
            {step === 'trouser' &&
              renderFields(trouserFields, 'trouser', trouser, (id, text) => setTrouser((p) => ({ ...p, [id]: text })))}
            {step === 'other' &&
              renderFields(otherFields, 'other', other, (id, text) => setOther((p) => ({ ...p, [id]: text })))}
          </View>
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: inputBorder, backgroundColor: card, paddingBottom: inputPaddingBottom }]}>
          {step === 'basic' ? (
            <Pressable
              onPress={() => basicComplete && setStep('shirt')}
              disabled={!basicComplete}
              style={[styles.proceed, { backgroundColor: basicComplete ? tint : '#f3f4f6' }]}
            >
              <ThemedText style={{ color: basicComplete ? '#fff' : '#999' }}>Continue to Shirt Measurement</ThemedText>
            </Pressable>
          ) : step === 'shirt' ? (
            <Pressable
              onPress={() => shirtComplete && setStep('trouser')}
              disabled={!shirtComplete}
              style={[styles.proceed, { backgroundColor: shirtComplete ? tint : '#f3f4f6' }]}
            >
              <ThemedText style={{ color: shirtComplete ? '#fff' : '#999' }}>Continue to Trouser</ThemedText>
            </Pressable>
          ) : step === 'trouser' ? (
            <Pressable
              onPress={() => trouserComplete && setStep('other')}
              disabled={!trouserComplete}
              style={[styles.proceed, { backgroundColor: trouserComplete ? tint : '#f3f4f6' }]}
            >
              <ThemedText style={{ color: trouserComplete ? '#fff' : '#999' }}>
                Continue to Other (Optional)
              </ThemedText>
            </Pressable>
          ) : (
            <View style={styles.footerStack}>
              <Pressable onPress={goToTailors} style={[styles.proceed, { backgroundColor: tint }]}>
                <ThemedText style={{ color: '#fff' }}>Continue to Tailors</ThemedText>
              </Pressable>
              <Pressable onPress={goToTailors} style={styles.skipBtn}>
                <ThemedText style={{ color: muted, fontWeight: '600' }}>Skip — no other measurements</ThemedText>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardArea: { flex: 1 },
  header: { paddingTop: 40, paddingHorizontal: 16, paddingBottom: 14 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: { flex: 1, color: '#fff', fontWeight: '800', fontSize: 18 },
  scroll: { padding: 12, flexGrow: 0 },
  infoCard: { padding: 12, borderRadius: 12, borderWidth: 1, marginTop: 12 },
  stepPillsScroll: { marginTop: 12, flexGrow: 0 },
  stepPills: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  stepPill: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  stepPillActive: { color: '#0f172a', fontWeight: '800' },
  formGroup: { marginTop: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  optionalBadge: { fontSize: 12, fontWeight: '600', marginBottom: 10, fontStyle: 'italic' },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  fieldLabelWrap: { flex: 1 },
  fieldLabel: { fontWeight: '700' },
  fieldSubtitle: { fontSize: 11, marginTop: 2, fontWeight: '500' },
  unitHint: { fontSize: 11, marginTop: 3 },
  inputWrap: {
    minWidth: 128,
    height: 46,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  input: { flex: 1, paddingVertical: 8, fontSize: 15 },
  unitText: { fontSize: 12, fontWeight: '800', marginLeft: 6 },
  footer: { paddingTop: 12, paddingHorizontal: 12 },
  footerStack: { gap: 8 },
  proceed: { padding: 14, borderRadius: 12, alignItems: 'center' },
  skipBtn: { padding: 10, alignItems: 'center' },
  previewBox: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 0 },
  modelPlaceholder: {
    minHeight: 420,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
