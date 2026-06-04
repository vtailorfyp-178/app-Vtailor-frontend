import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { BrandLogo } from '@/components/BrandLogo';
import { useRouter } from 'expo-router';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ROLE_COLORS, TEXT_DARK, UI } from '@/constants/ui';

export default function SplashScreen() {
  const router = useRouter();
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const tint = useThemeColor({}, 'tint');
  const bg = useThemeColor({}, 'background');

  useEffect(() => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 1.08,
        duration: 2200,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1.15,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      // router.replace navigates without back history
      try {
        (router as any).replace('/terms');
      } catch (e) {
        // fallback to push
        (router as any).push('/terms');
      }
    });
  }, [router, scale, opacity]);

  return (
    <View style={[styles.container, { backgroundColor: bg }]}> 
      <Animated.View style={[styles.brandCard, { transform: [{ scale }], opacity }]}>
        <View style={styles.glowOne} />
        <View style={styles.glowTwo} />
        <BrandLogo size={120} />
      </Animated.View>

      <Animated.View style={[styles.taglineWrap, { opacity }]}>
        <Text style={styles.appName}>V Tailor</Text>
        <Text style={styles.tagline}>Stitching style with intelligence</Text>
        <View style={styles.featurePill}>
          <Text style={styles.featureText}>Custom fits · Real tailors · Smart assistance</Text>
        </View>
        <View style={styles.dots}>
          <Animated.View style={[styles.dot, { backgroundColor: ROLE_COLORS.customer.primary }]} />
          <Animated.View style={[styles.dot, { backgroundColor: ROLE_COLORS.tailor.primary }]} />
          <Animated.View style={[styles.dot, { backgroundColor: tint }]} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Platform.select({ web: '#F7FBFF', default: '#fff7fb' }),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 24,
  },
  brandCard: {
    width: 254,
    height: 254,
    borderRadius: 58,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 26,
    overflow: 'hidden',
    ...UI.shadow,
  },
  glowOne: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#fce7f3',
    top: -24,
    right: -18,
  },
  glowTwo: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fff1f7',
    bottom: -28,
    left: -18,
  },
  logo: {
    width: 205,
    height: 205,
  },
  taglineWrap: {
    alignItems: 'center',
    marginTop: 8,
  },
  appName: {
    color: TEXT_DARK,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  tagline: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
    marginBottom: 8,
  },
  featurePill: {
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#fbcfe8',
    marginTop: 8,
    marginBottom: 12,
    ...UI.softShadow,
  },
  featureText: {
    color: '#be185d',
    fontSize: 11,
    fontWeight: '800',
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
  } as any,
  dot: {
    width: 8,
    height: 8,
    borderRadius: 8,
    marginHorizontal: 6,
  },
});
