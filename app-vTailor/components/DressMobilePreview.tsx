import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

type Props = {
  width: number;
  height: number;
  previewImage: ImageSourcePropType;
  backgroundImage?: ImageSourcePropType | null;
  fabricColorHex?: string | null;
  style?: StyleProp<ViewStyle>;
};

/** Lightweight dress preview for phones (avoids 27MB+ GLB OOM in Expo Go). */
export function DressMobilePreview({
  width,
  height,
  previewImage,
  backgroundImage,
  fabricColorHex,
  style,
}: Props) {
  const w = Math.max(200, Math.floor(width));
  const h = Math.max(220, Math.floor(height));

  return (
    <View style={[{ width: w, height: h, overflow: 'hidden', backgroundColor: '#f4f6f8' }, style]}>
      {backgroundImage != null ? (
        <Image source={backgroundImage} style={styles.backdrop} resizeMode="cover" />
      ) : null}
      <Image source={previewImage} style={styles.dress} resizeMode="contain" />
      {fabricColorHex ? (
        <View
          style={[styles.fabricTint, { backgroundColor: fabricColorHex }]}
          pointerEvents="none"
        />
      ) : null}
      <View style={styles.badge} pointerEvents="none">
        <Text style={styles.badgeText}>Dress preview</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  dress: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  fabricTint: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.32,
  },
  badge: {
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
    backgroundColor: 'rgba(15,23,42,0.72)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: '#f8fafc',
    fontSize: 11,
    fontWeight: '600',
  },
});
