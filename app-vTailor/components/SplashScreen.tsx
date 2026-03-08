import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeColor } from '@/hooks/use-theme-color';

const logo = require('../assets/images/vTailorlogo.jpeg');

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
      <Animated.Image
        source={logo}
        style={[styles.logo, { transform: [{ scale }], opacity }]}
        resizeMode="contain"
      />

      <Animated.View style={[styles.taglineWrap, { opacity }]}>
        <Text style={styles.tagline}>Stitching Style with Intelligence</Text>
        <View style={styles.dots}>
          <Animated.View style={[styles.dot, { backgroundColor: tint }]} />
          <Animated.View style={[styles.dot, { backgroundColor: '#f59e0b' }]} />
          <Animated.View style={[styles.dot, { backgroundColor: tint }]} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Platform.select({ web: '#F7FBFF', default: '#ffffff' }),
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logo: {
    width: 220,
    height: 220,
    marginBottom: 16,
  },
  taglineWrap: {
    alignItems: 'center',
    marginTop: 8,
  },
  tagline: {
    color: '#6b7280',
    fontSize: 16,
    letterSpacing: 0.6,
    marginBottom: 8,
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
