import React from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { TAILOR, tailorStyles } from '@/components/tailor/tailorUi';

type Props = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
};

export function TailorScreenShell({
  title,
  subtitle,
  onBack,
  rightSlot,
  children,
  style,
  contentStyle,
}: Props): React.ReactElement {
  return (
    <View style={[tailorStyles.screen, style]}>
      <View style={tailorStyles.headerPanel}>
        <View style={tailorStyles.headerGlow} />
        <View style={tailorStyles.headerGlowSmall} />
        <View style={styles.headerTop}>
          {onBack ? (
            <Pressable onPress={onBack} style={tailorStyles.backBtn} hitSlop={8}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </Pressable>
          ) : (
            <View style={styles.spacer42} />
          )}
          <View style={styles.titleBlock}>
            <ThemedText style={tailorStyles.headerTitle} numberOfLines={1}>
              {title}
            </ThemedText>
            {subtitle ? (
              <ThemedText style={tailorStyles.headerSubtitle} numberOfLines={1}>
                {subtitle}
              </ThemedText>
            ) : null}
          </View>
          {rightSlot ?? <View style={styles.spacer42} />}
        </View>
      </View>
      <View style={[tailorStyles.content, contentStyle]}>{children}</View>
    </View>
  );
}

export function TailorInfoBanner({
  text,
  icon = 'information-circle-outline',
}: {
  text: string;
  icon?: keyof typeof Ionicons.glyphMap;
}): React.ReactElement {
  return (
    <View style={tailorStyles.infoBanner}>
      <Ionicons name={icon} size={20} color={TAILOR.primaryDark} />
      <ThemedText style={tailorStyles.infoBannerText}>{text}</ThemedText>
    </View>
  );
}

export function TailorEmptyState({
  title,
  message,
  icon = 'folder-open-outline',
}: {
  title: string;
  message: string;
  icon?: keyof typeof Ionicons.glyphMap;
}): React.ReactElement {
  return (
    <View style={tailorStyles.emptyWrap}>
      <View style={tailorStyles.emptyIcon}>
        <Ionicons name={icon} size={28} color={TAILOR.primary} />
      </View>
      <ThemedText style={tailorStyles.emptyTitle}>{title}</ThemedText>
      <ThemedText style={tailorStyles.emptyText}>{message}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  spacer42: { width: 42, height: 42 },
});
