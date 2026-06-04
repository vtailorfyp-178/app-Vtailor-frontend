import React from 'react';
import { Image, StyleSheet, View, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';

const logoSource = require('../assets/images/vTailorlogo.jpeg');

type BrandLogoProps = {
  size?: number;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
};

/** Centered logo with padding so the mark is not cropped at the edges. */
export function BrandLogo({ size = 88, style, imageStyle }: BrandLogoProps) {
  const pad = Math.round(size * 0.12);
  const inner = size - pad * 2;

  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: size * 0.28 }, style]}>
      <Image
        source={logoSource}
        style={[
          styles.image,
          { width: inner, height: inner, margin: pad },
          imageStyle,
        ]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#fbcfe8',
    overflow: 'hidden',
  },
  image: {
    backgroundColor: 'transparent',
  },
});
