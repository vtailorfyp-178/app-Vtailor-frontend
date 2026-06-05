import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/contexts/AuthContext';
import { SURFACE_MUTED, TEXT_DARK, UI } from '@/constants/ui';
import { createOrder } from '@/services/ordersApi';
import { finalizePlacedOrder } from '@/services/savedDesign';
import { getCustomerOrderDraft } from '@/services/customerOrderDraft';

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() || '').join('');
}

export default function PlaceOrder() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { token, userId } = useAuth();
  const params  = useLocalSearchParams<{
    tailorId: string;
    tailorName: string;
    specialization: string;
    rating: string;
    priceFrom: string;
    priceTo: string;
  }>();

  const tint        = useThemeColor({}, 'tint');
  const card        = useThemeColor({}, 'card');
  const muted       = useThemeColor({}, 'muted');
  const inputBorder = useThemeColor({}, 'inputBorder');
  const text        = useThemeColor({}, 'text');

  const [description, setDescription] = useState('');
  const [budget, setBudget]           = useState('');
  const [days, setDays]               = useState('');
  const [submitting, setSubmitting]   = useState(false);

  useEffect(() => {
    getCustomerOrderDraft(userId).then((draft) => {
      if (!draft?.modelName) return;
      setDescription((prev) => (prev.trim() ? prev : draft.modelName));
    }).catch(() => {});
  }, [userId]);

  const tailorName    = params.tailorName     || 'Tailor';
  const spec          = params.specialization || '';
  const rating        = params.rating         || '';
  const priceFrom     = params.priceFrom      || '';
  const priceTo       = params.priceTo        || '';

  const canSubmit =
    description.trim().length >= 3 &&
    Number(budget) > 0 &&
    Number(days) > 0 &&
    !submitting;

  const handleSubmit = async () => {
    if (!canSubmit || !token || !params.tailorId) return;
    setSubmitting(true);
    try {
      const created = await createOrder(token, {
        tailor_id:     params.tailorId,
        tailor_name:   tailorName,
        description:   description.trim(),
        budget:        Number(budget),
        delivery_days: Number(days),
      });
      await finalizePlacedOrder(
        userId,
        {
          tailorId: params.tailorId,
          tailorName,
          specialization: spec || undefined,
          rating: rating || undefined,
          priceFrom: priceFrom || undefined,
          priceTo: priceTo || undefined,
        },
        {
          description: description.trim(),
          budget: Number(budget),
          deliveryDays: Number(days),
        },
        created,
      );
      router.replace('/customer');
      Alert.alert(
        'Request Sent! 🎉',
        `Your order has been sent to ${tailorName} and saved in My Designs.`,
      );
    } catch (err: any) {
      Alert.alert('Failed to Send', err?.message || 'Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: tint, paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <ThemedText style={styles.headerTitle}>Place an Order</ThemedText>
          <ThemedText style={styles.headerSub}>Send a stitch request to this tailor</ThemedText>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]} keyboardShouldPersistTaps="handled">

          {/* Tailor preview card */}
          <View style={[styles.tailorCard, { backgroundColor: card, borderColor: inputBorder }]}>
            <View style={[styles.avatar, { backgroundColor: tint + '33' }]}>
              <ThemedText style={[styles.avatarText, { color: tint }]}>{initials(tailorName)}</ThemedText>
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.tailorName}>{tailorName}</ThemedText>
              {!!spec && (
                <ThemedText style={[styles.tailorMeta, { color: muted }]}>{spec.replace(/,/g, ' • ')}</ThemedText>
              )}
              <View style={styles.tailorStats}>
                {!!rating && (
                  <ThemedText style={[styles.chip, { color: '#92400e', backgroundColor: '#fef3c7' }]}>
                    ⭐ {rating}
                  </ThemedText>
                )}
                {!!(priceFrom && priceTo) && (
                  <ThemedText style={[styles.chip, { color: '#1e40af', backgroundColor: '#dbeafe' }]}>
                    Rs {priceFrom}–{priceTo}
                  </ThemedText>
                )}
              </View>
            </View>
          </View>

          {/* Form */}
          <ThemedText style={styles.sectionLabel}>What would you like stitched?</ThemedText>
          <View style={[styles.inputBox, { borderColor: inputBorder, backgroundColor: card }]}>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="e.g. Long frock with flared bottom, party wear lehenga…"
              placeholderTextColor={muted}
              style={[styles.textArea, { color: text }]}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={300}
            />
            <ThemedText style={[styles.charCount, { color: muted }]}>{description.length}/300</ThemedText>
          </View>

          <ThemedText style={styles.sectionLabel}>Your Budget (Rs)</ThemedText>
          <View style={[styles.inputBox, styles.inputRow, { borderColor: inputBorder, backgroundColor: card }]}>
            <ThemedText style={[styles.currencyLabel, { color: muted }]}>Rs</ThemedText>
            <TextInput
              value={budget}
              onChangeText={(v) => setBudget(v.replace(/[^0-9]/g, ''))}
              placeholder="e.g. 5000"
              placeholderTextColor={muted}
              keyboardType="numeric"
              style={[styles.budgetInput, { color: text }]}
            />
          </View>

          <ThemedText style={styles.sectionLabel}>Expected Delivery (days)</ThemedText>
          <View style={[styles.inputBox, styles.inputRow, { borderColor: inputBorder, backgroundColor: card }]}>
            <Ionicons name="calendar-outline" size={18} color={muted} style={{ marginRight: 8 }} />
            <TextInput
              value={days}
              onChangeText={(v) => setDays(v.replace(/[^0-9]/g, ''))}
              placeholder="e.g. 7"
              placeholderTextColor={muted}
              keyboardType="numeric"
              style={[styles.budgetInput, { color: text }]}
            />
            <ThemedText style={[styles.daysSuffix, { color: muted }]}>days</ThemedText>
          </View>

          <View style={[styles.infoBox, { backgroundColor: tint + '12', borderColor: tint + '33' }]}>
            <Ionicons name="information-circle-outline" size={16} color={tint} style={{ marginTop: 1 }} />
            <ThemedText style={[styles.infoText, { color: muted }]}>
              Include your budget and how soon you need the order. The tailor may confirm or propose a different price and timeline.
            </ThemedText>
          </View>

          {/* Submit */}
          <Pressable
            style={[styles.submitBtn, { backgroundColor: canSubmit ? tint : muted, opacity: canSubmit ? 1 : 0.5 }]}
            onPress={handleSubmit}
            disabled={!canSubmit}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="send-outline" size={18} color="#fff" />
                <ThemedText style={styles.submitText}>Send Order Request</ThemedText>
              </>
            )}
          </Pressable>

        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: SURFACE_MUTED },
  header:        { paddingHorizontal: 16, paddingBottom: 16, flexDirection: 'row', alignItems: 'center' },
  backBtn:       { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  headerTitle:   { fontSize: 20, fontWeight: '900', color: '#fff' },
  headerSub:     { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  scroll:        { padding: 16 },
  tailorCard:    { flexDirection: 'row', padding: 14, borderRadius: UI.radius.lg, borderWidth: 1, marginBottom: 20, gap: 12, ...UI.softShadow },
  avatar:        { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarText:    { fontSize: 18, fontWeight: '800' },
  tailorName:    { fontSize: 16, fontWeight: '800', color: TEXT_DARK, marginBottom: 2 },
  tailorMeta:    { fontSize: 12, marginBottom: 6 },
  tailorStats:   { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  chip:          { fontSize: 11, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  sectionLabel:  { fontSize: 14, fontWeight: '700', color: TEXT_DARK, marginBottom: 8, marginTop: 4 },
  inputBox:      { borderWidth: 1, borderRadius: UI.radius.md, padding: 12, marginBottom: 16 },
  inputRow:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  textArea:      { fontSize: 14, lineHeight: 20, minHeight: 90 },
  charCount:     { fontSize: 11, textAlign: 'right', marginTop: 6 },
  currencyLabel: { fontSize: 16, fontWeight: '700', marginRight: 8 },
  budgetInput:   { flex: 1, fontSize: 16, fontWeight: '600' },
  daysSuffix:    { fontSize: 14, fontWeight: '600', marginLeft: 4 },
  infoBox:       { flexDirection: 'row', gap: 8, padding: 12, borderRadius: UI.radius.md, borderWidth: 1, marginBottom: 20 },
  infoText:      { flex: 1, fontSize: 12, lineHeight: 17 },
  submitBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: UI.radius.lg },
  submitText:    { color: '#fff', fontSize: 16, fontWeight: '800' },
});
