import React, { type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { UI } from '@/constants/ui';

type Props = {
  eyebrow: string;
  title: string;
  tint: string;
  rightSlot?: ReactNode;
  footer?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Shared hero header for customer dashboard tabs. */
export function CustomerScreenHeader({
  eyebrow,
  title,
  tint,
  rightSlot,
  footer,
  style,
}: Props) {
  return (
    <View style={[styles.wrap, { backgroundColor: tint }, style]}>
      <View style={styles.decorA} />
      <View style={styles.decorB} />
      <View style={styles.topRow}>
        <View style={styles.textCol}>
          <ThemedText style={styles.eyebrow}>{eyebrow}</ThemedText>
          <ThemedText style={styles.title}>{title}</ThemedText>
        </View>
        {rightSlot ? <View style={styles.rightSlot}>{rightSlot}</View> : null}
      </View>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 16,
    marginTop: 6,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 20,
    borderRadius: 26,
    overflow: 'hidden',
    ...UI.shadow,
  },
  decorA: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.12)',
    top: -36,
    right: -24,
  },
  decorB: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.08)',
    bottom: -20,
    left: -10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  textCol: { flex: 1, paddingRight: 12 },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.88)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.2,
  },
  rightSlot: { alignSelf: 'center' },
  footer: { marginTop: 16, marginBottom: 4, zIndex: 1 },
});
