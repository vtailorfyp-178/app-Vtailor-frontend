import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  Keyboard,
  useWindowDimensions,
  Alert,
  type TextInput,
} from 'react-native';
import { useKeyboardInset } from '@/hooks/useKeyboardInset';
import { MeasurementModelViewer } from '@/components/MeasurementModelViewer';
import { buildBasicMeasurementValues } from '@/services/measurement/measurementLabelConfig';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/AuthContext';
import {
  clearCustomerOrderDraft,
  getCustomerOrderDraft,
  saveMeasurementProgress,
  type MeasurementStep,
} from '@/services/customerOrderDraft';
import { type TabId } from '@/services/dressGlbResolver';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ThemedTextInput } from '@/components/ThemedTextInput';
import AppBackButton from '@/components/AppBackButton';
import { TEXT_DARK } from '@/constants/ui';
import { useThemeColor } from '@/hooks/use-theme-color';

type Step = 'basic' | 'shirt' | 'trouser' | 'other';

type FieldDef = { id: string; label: string; subtitle?: string; unit: string; guidanceName: string };

const basicFields: FieldDef[] = [
  { id: 'shoulder', label: 'Shoulder Width', guidanceName: 'shoulder width', unit: 'in' },
  { id: 'biceps', label: 'Biceps', subtitle: 'Upper Arm Circumference', guidanceName: 'biceps', unit: 'in' },
  { id: 'arm', label: 'Arm Length', guidanceName: 'arm length', unit: 'in' },
  { id: 'thigh', label: 'Thigh', subtitle: 'Thigh Circumference', guidanceName: 'thigh', unit: 'in' },
  { id: 'armpit', label: 'Armpit', subtitle: 'Arm-Body Connection', guidanceName: 'armpit', unit: 'in' },
  { id: 'bust', label: 'Bust / Chest', guidanceName: 'bust / chest', unit: 'in' },
  { id: 'waist', label: 'Waist', subtitle: 'Waist Circumference', guidanceName: 'waist', unit: 'in' },
  { id: 'hip', label: 'Hips', subtitle: 'Hip Circumference', guidanceName: 'hips', unit: 'in' },
];

const shirtFields: FieldDef[] = [
  { id: 'neck', label: 'Neck', subtitle: 'Collar Base', guidanceName: 'neck', unit: 'in' },
  { id: 'length', label: 'Shirt Length', subtitle: 'Shoulder to Hem', guidanceName: 'shirt length', unit: 'in' },
  { id: 'chawk', label: 'Chawk', subtitle: 'Chest Width', guidanceName: 'chawk', unit: 'in' },
  { id: 'gherah', label: 'Gherah', subtitle: 'Hem Circumference', guidanceName: 'gherah', unit: 'in' },
];

const trouserFields: FieldDef[] = [
  { id: 'length', label: 'Trouser Length', subtitle: 'Waist to Ankle', guidanceName: 'trouser length', unit: 'in' },
  { id: 'phuncha', label: 'Phuncha / Bottom', subtitle: 'Leg Opening', guidanceName: 'phuncha / bottom', unit: 'in' },
  { id: 'inseam', label: 'Inseam', subtitle: 'Inner Leg Length', guidanceName: 'inseam', unit: 'in' },
];

/** Optional — not required to continue. */
const otherFields: FieldDef[] = [
  { id: 'frockFlare', label: 'Flared for Frock', subtitle: 'Frock Hem Flare', guidanceName: 'frock flare', unit: 'in' },
  { id: 'sareePalu', label: 'Palu Length for Saree', subtitle: 'Saree Pallu Length', guidanceName: 'saree palu length', unit: 'in' },
  { id: 'ghararaThigh', label: 'Thigh for Gharara', subtitle: 'Gharara Thigh Circumference', guidanceName: 'gharara thigh', unit: 'in' },
  { id: 'ghararaFlare', label: 'Flared for Gharara', subtitle: 'Gharara Flare Width', guidanceName: 'gharara flare', unit: 'in' },
  { id: 'lehengaLength', label: 'Shirt Length for Lehenga', subtitle: 'Lehenga Choli Length', guidanceName: 'lehenga shirt length', unit: 'in' },
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

function fieldsForStep(step: Step): FieldDef[] {
  if (step === 'basic') return basicFields;
  if (step === 'shirt') return shirtFields;
  if (step === 'trouser') return trouserFields;
  return otherFields;
}

function resolveFocusedField(
  fieldKey: string | null,
  valuesByStep: Record<Step, Record<string, string>>,
): (FieldDef & { step: Step; value: string }) | null {
  if (!fieldKey) return null;
  const steps: Step[] = ['basic', 'shirt', 'trouser', 'other'];
  for (const fieldStep of steps) {
    const fieldId = fieldKey.startsWith(`${fieldStep}-`) ? fieldKey.slice(fieldStep.length + 1) : null;
    if (!fieldId) continue;
    const field = fieldsForStep(fieldStep).find((item) => item.id === fieldId);
    if (field) {
      return { ...field, step: fieldStep, value: valuesByStep[fieldStep][fieldId] || '' };
    }
  }
  return null;
}

export default function MeasurementForm() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    modelId?: string;
    modelName?: string;
    dressLine?: string;
    selections?: string;
    restoreDraft?: string;
  }>();
  const { userId } = useAuth();
  const scrollRef = useRef<ScrollView | null>(null);
  const inputRefs = useRef<Record<string, TextInput | null>>({});
  const fieldOffsets = useRef<Record<string, number>>({});
  const tint = useThemeColor({}, 'tint');
  const card = useThemeColor({}, 'card');
  const text = useThemeColor({}, 'text');
  const inputBorder = useThemeColor({}, 'inputBorder');
  const muted = useThemeColor({}, 'muted');
  const { keyboardHeight, keyboardVisible, bottomInset, inputPaddingBottom } = useKeyboardInset({ extraOffset: 8 });

  const [step, setStep] = useState<Step>('basic');
  const [basic, setBasic] = useState<Record<string, string>>({});
  const [shirt, setShirt] = useState<Record<string, string>>({});
  const [trouser, setTrouser] = useState<Record<string, string>>({});
  const [other, setOther] = useState<Record<string, string>>({});
  const [focusedFieldKey, setFocusedFieldKey] = useState<string | null>(null);
  const [savingDraft, setSavingDraft] = useState(false);
  const modelId = (params.modelId as string) || '';
  const modelName = (params.modelName as string) || 'Your dress';
  const dressLine = (params.dressLine as string) || '';
  const linkedSelections = useMemo(() => {
    try {
      return params.selections ? JSON.parse(params.selections as string) : {};
    } catch {
      return {};
    }
  }, [params.selections]);
  const { width: windowWidth } = useWindowDimensions();
  const viewerWidth = Math.max(280, windowWidth - 56);
  const viewerHeight = 420;

  const modelMeasurementValues = useMemo(() => buildBasicMeasurementValues(basic), [basic]);

  const basicComplete = isStepComplete(basic, basicFields);
  const shirtComplete = isStepComplete(shirt, shirtFields);
  const trouserComplete = isStepComplete(trouser, trouserFields);

  useEffect(() => {
    if (params.restoreDraft !== '1') return;
    getCustomerOrderDraft(userId).then((draft) => {
      if (!draft?.measurements) return;
      setBasic(draft.measurements.basic || {});
      setShirt(draft.measurements.shirt || {});
      setTrouser(draft.measurements.trouser || {});
      setOther(draft.measurements.other || {});
      setStep(draft.measurements.step || 'basic');
    });
  }, [params.restoreDraft, userId]);

  const buildMeasurementPayload = () => ({
    basic,
    shirt,
    trouser,
    other,
    updatedAt: new Date().toISOString(),
  });

  const activeFields =
    step === 'basic'
      ? basicFields
      : step === 'shirt'
        ? shirtFields
        : step === 'trouser'
          ? trouserFields
          : otherFields;

  const valuesByStep = useMemo(
    () => ({ basic, shirt, trouser, other }),
    [basic, shirt, trouser, other],
  );

  const focusedFieldMeta = useMemo(
    () => resolveFocusedField(focusedFieldKey, valuesByStep),
    [focusedFieldKey, valuesByStep],
  );

  const saveMeasurements = async () => {
    const payload = buildMeasurementPayload();

    const listRaw = await AsyncStorage.getItem('CUSTOMER_MEASUREMENTS');
    const list = listRaw ? JSON.parse(listRaw) : [];
    list.unshift(payload);
    await AsyncStorage.setItem('CUSTOMER_MEASUREMENTS', JSON.stringify(list));
  };

  const saveAndGoDashboard = async () => {
    setSavingDraft(true);
    try {
      await saveMeasurementProgress({
        userId,
        modelId,
        modelName,
        dressLine,
        selections: linkedSelections as Record<TabId, string | null>,
        basic,
        shirt,
        trouser,
        other,
        step: step as MeasurementStep,
      });
      Alert.alert('Saved', 'Your measurements are saved. Continue anytime from the dashboard.');
      (router as any).replace('/customer');
    } catch {
      Alert.alert('Save failed', 'Could not save your progress. Please try again.');
    } finally {
      setSavingDraft(false);
    }
  };

  const goToTailors = async () => {
    await saveMeasurements();
    await clearCustomerOrderDraft(userId);
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
      if (focusedFieldKey) scrollToField(focusedFieldKey);
    });
    return () => {
      showSub.remove();
    };
  }, [focusedFieldKey, keyboardHeight]);

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
      setFocusedFieldKey(null);
      setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: true }), 180);
    } else if (step === 'shirt' && shirtComplete) {
      setStep('trouser');
      setFocusedFieldKey(null);
      setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: true }), 180);
    } else if (step === 'trouser' && trouserComplete) {
      setStep('other');
      setFocusedFieldKey(null);
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
          <ThemedText style={[styles.fieldLabel, { color: text || TEXT_DARK }]}>{f.label}</ThemedText>
          {f.subtitle ? (
            <ThemedText style={[styles.fieldSubtitle, { color: muted }]}>{f.subtitle}</ThemedText>
          ) : null}
          <ThemedText style={[styles.unitHint, { color: muted }]}>Unit: inches ({f.unit})</ThemedText>
        </View>
        <View style={[styles.inputWrap, { borderColor: inputBorder, backgroundColor: '#fff' }]}>
          <ThemedTextInput
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
              setFocusedFieldKey(getFieldKey(f.id, fieldStep));
              scrollToField(getFieldKey(f.id, fieldStep));
            }}
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
            <ThemedText style={{ fontWeight: '700', marginBottom: 8, color: text || TEXT_DARK }}>3D Model Guidance</ThemedText>
            {focusedFieldMeta ? (
              <View style={[styles.guidanceBanner, { borderColor: inputBorder, backgroundColor: '#fff' }]}>
                <ThemedText style={[styles.guidancePartName, { color: text || TEXT_DARK }]}>
                  {focusedFieldMeta.label}
                </ThemedText>
                <ThemedText
                  style={[
                    focusedFieldMeta.value.trim() ? styles.guidanceValue : styles.guidanceValuePlaceholder,
                    { color: tint },
                  ]}
                >
                  {focusedFieldMeta.value.trim() ? `${focusedFieldMeta.value} in` : 'Enter value below'}
                </ThemedText>
              </View>
            ) : (
              <ThemedText style={{ marginBottom: 10, color: muted }}>
                {step === 'basic'
                  ? 'Tap a measurement field below — the part name and value appear here above the model.'
                  : 'Tap a field below — guidance and your value appear here above the model.'}
              </ThemedText>
            )}
            <View style={[styles.modelPlaceholder, { borderColor: inputBorder }]}>
              <MeasurementModelViewer
                width={viewerWidth}
                height={viewerHeight}
                focusedField={
                  step === 'basic' && focusedFieldMeta?.step === 'basic' ? focusedFieldMeta.label : null
                }
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
            <ThemedText style={[styles.stepPill, step === 'basic' && styles.stepPillActive, { color: step === 'basic' ? TEXT_DARK : '#64748b' }]}>1 Basic</ThemedText>
            <ThemedText style={{ color: muted }}>→</ThemedText>
            <ThemedText style={[styles.stepPill, step === 'shirt' && styles.stepPillActive, { color: step === 'shirt' ? TEXT_DARK : '#64748b' }]}>2 Shirt</ThemedText>
            <ThemedText style={{ color: muted }}>→</ThemedText>
            <ThemedText style={[styles.stepPill, step === 'trouser' && styles.stepPillActive, { color: step === 'trouser' ? TEXT_DARK : '#64748b' }]}>3 Trouser</ThemedText>
            <ThemedText style={{ color: muted }}>→</ThemedText>
            <ThemedText style={[styles.stepPill, step === 'other' && styles.stepPillActive, { color: step === 'other' ? TEXT_DARK : '#64748b' }]}>4 Other</ThemedText>
          </ScrollView>

          <View style={[styles.infoCard, { borderColor: inputBorder, backgroundColor: card }]}>
            <ThemedText style={{ fontWeight: '700', color: text || TEXT_DARK }}>Measurement Tips</ThemedText>
            <ThemedText style={{ color: muted }}>
              {step === 'other'
                ? 'These fields are optional — fill only what applies to your outfit (frock, saree, gharara, lehenga).'
                : 'Use a flexible tailor tape. Enter all values in inches (in). Basic body measurements update the 3D model.'}
            </ThemedText>
          </View>

          <View style={styles.formGroup}>
            <ThemedText style={[styles.sectionTitle, { color: text || TEXT_DARK }]}>{STEP_TITLE[step]}</ThemedText>
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
            <View style={styles.footerStack}>
              <Pressable
                onPress={() => basicComplete && setStep('shirt')}
                disabled={!basicComplete}
                style={[styles.proceed, { backgroundColor: basicComplete ? tint : '#f3f4f6' }]}
              >
                <ThemedText style={{ color: basicComplete ? '#fff' : '#999' }}>Continue to Shirt Measurement</ThemedText>
              </Pressable>
              <Pressable onPress={saveAndGoDashboard} disabled={savingDraft} style={styles.saveDashboardBtn}>
                <ThemedText style={[styles.saveDashboardText, { color: tint }]}>
                  {savingDraft ? 'Saving…' : 'Save & back to Dashboard'}
                </ThemedText>
              </Pressable>
            </View>
          ) : step === 'shirt' ? (
            <View style={styles.footerStack}>
              <Pressable
                onPress={() => shirtComplete && setStep('trouser')}
                disabled={!shirtComplete}
                style={[styles.proceed, { backgroundColor: shirtComplete ? tint : '#f3f4f6' }]}
              >
                <ThemedText style={{ color: shirtComplete ? '#fff' : '#999' }}>Continue to Trouser</ThemedText>
              </Pressable>
              <Pressable onPress={saveAndGoDashboard} disabled={savingDraft} style={styles.saveDashboardBtn}>
                <ThemedText style={[styles.saveDashboardText, { color: tint }]}>
                  {savingDraft ? 'Saving…' : 'Save & back to Dashboard'}
                </ThemedText>
              </Pressable>
            </View>
          ) : step === 'trouser' ? (
            <View style={styles.footerStack}>
              <Pressable
                onPress={() => trouserComplete && setStep('other')}
                disabled={!trouserComplete}
                style={[styles.proceed, { backgroundColor: trouserComplete ? tint : '#f3f4f6' }]}
              >
                <ThemedText style={{ color: trouserComplete ? '#fff' : '#999' }}>
                  Continue to Other (Optional)
                </ThemedText>
              </Pressable>
              <Pressable onPress={saveAndGoDashboard} disabled={savingDraft} style={styles.saveDashboardBtn}>
                <ThemedText style={[styles.saveDashboardText, { color: tint }]}>
                  {savingDraft ? 'Saving…' : 'Save & back to Dashboard'}
                </ThemedText>
              </Pressable>
            </View>
          ) : (
            <View style={styles.footerStack}>
              <Pressable onPress={goToTailors} style={[styles.proceed, { backgroundColor: tint }]}>
                <ThemedText style={{ color: '#fff' }}>Continue to Tailors</ThemedText>
              </Pressable>
              <Pressable onPress={goToTailors} style={styles.skipBtn}>
                <ThemedText style={{ color: muted, fontWeight: '600' }}>Skip — no other measurements</ThemedText>
              </Pressable>
              <Pressable onPress={saveAndGoDashboard} disabled={savingDraft} style={styles.saveDashboardBtn}>
                <ThemedText style={[styles.saveDashboardText, { color: tint }]}>
                  {savingDraft ? 'Saving…' : 'Save & back to Dashboard'}
                </ThemedText>
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
  input: { flex: 1, paddingVertical: 8, fontSize: 15, borderWidth: 0, backgroundColor: 'transparent' },
  unitText: { fontSize: 12, fontWeight: '800', marginLeft: 6 },
  footer: { paddingTop: 12, paddingHorizontal: 12 },
  footerStack: { gap: 8 },
  proceed: { padding: 14, borderRadius: 12, alignItems: 'center' },
  skipBtn: { padding: 10, alignItems: 'center' },
  saveDashboardBtn: { padding: 12, alignItems: 'center' },
  saveDashboardText: { fontWeight: '700', fontSize: 14 },
  previewBox: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 0 },
  guidanceBanner: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  guidancePartName: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  guidanceValue: {
    fontSize: 22,
    fontWeight: '900',
    marginTop: 4,
    textAlign: 'center',
  },
  guidanceValuePlaceholder: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  modelPlaceholder: {
    minHeight: 420,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
