import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { TAILOR, tailorStyles } from '@/components/tailor/tailorUi';
import { firstInitial } from '@/utils/safeDisplay';
import { formatSelectionLines, type TailorOrderRecord } from '@/services/tailor/tailorOrderCatalog';

type Props = {
  order: TailorOrderRecord;
  onPress: () => void;
  badge?: string;
  badgeColor?: string;
  badgeTextColor?: string;
};

function statusTone(status: string): { bg: string; text: string } {
  const s = status.toLowerCase();
  if (s === 'ready' || s === 'confirmed') return { bg: TAILOR.successSoft, text: TAILOR.successText };
  if (s === 'pending' || s === 'price_proposed') return { bg: TAILOR.warningSoft, text: TAILOR.warningText };
  if (s === 'in progress' || s === 'accepted' || s === 'processing') return { bg: '#e0f2fe', text: '#075985' };
  return { bg: TAILOR.chipBg, text: TAILOR.chipText };
}

export function TailorOrderSummaryCard({
  order,
  onPress,
  badge,
  badgeColor,
  badgeTextColor,
}: Props) {
  const lines = order.customization ? formatSelectionLines(order.customization.selections).slice(0, 3) : [];
  const badgeStyle = badge && !badgeColor ? statusTone(badge) : null;

  return (
    <Pressable style={[tailorStyles.card, styles.cardPress]} onPress={onPress}>
      <View style={styles.topRow}>
        <View style={[styles.avatar, { backgroundColor: TAILOR.primary }]}>
          <ThemedText style={styles.avatarText}>{firstInitial(order.customerName, 'C')}</ThemedText>
        </View>
        <View style={styles.main}>
          <ThemedText style={styles.name}>{order.customerName}</ThemedText>
          <ThemedText style={styles.meta}>
            {order.orderId} • {order.garment}
          </ThemedText>
          {order.color ? (
            <ThemedText style={styles.meta}>
              {order.color}
              {order.fabric ? ` • ${order.fabric}` : ''}
            </ThemedText>
          ) : null}
        </View>
        {badge ? (
          <View
            style={[
              styles.badge,
              {
                backgroundColor: badgeColor ?? badgeStyle?.bg ?? TAILOR.soft,
              },
            ]}
          >
            <ThemedText
              style={[
                styles.badgeText,
                { color: badgeTextColor ?? badgeStyle?.text ?? TAILOR.primaryDark },
              ]}
            >
              {badge}
            </ThemedText>
          </View>
        ) : null}
      </View>

      {lines.length > 0 ? (
        <View style={styles.chips}>
          {lines.map((line) => (
            <View key={line} style={styles.chip}>
              <ThemedText style={styles.chipText}>{line}</ThemedText>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.footer}>
        <ThemedText style={styles.delivery}>{order.deliveryLabel}</ThemedText>
        <View style={styles.chevronWrap}>
          <Ionicons name="chevron-forward" size={16} color={TAILOR.primary} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cardPress: {
    padding: 16,
  },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 18 },
  main: { flex: 1 },
  name: { fontSize: 16, fontWeight: '800', marginBottom: 2, color: TAILOR.text },
  meta: { fontSize: 12, marginTop: 2, color: TAILOR.textMuted },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: '800', textTransform: 'capitalize' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  chip: {
    backgroundColor: TAILOR.chipBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: TAILOR.border,
  },
  chipText: { fontSize: 11, fontWeight: '700', color: TAILOR.chipText },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: TAILOR.border,
  },
  delivery: { fontSize: 12, color: TAILOR.textMuted, fontWeight: '600' },
  chevronWrap: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: TAILOR.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
