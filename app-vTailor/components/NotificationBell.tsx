import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  count?: number;
  basePath?: string;
};

export default function NotificationBell({ count = 0, basePath = 'customer' }: Props) {
  const router = useRouter();
  const iconBg = useThemeColor({}, 'iconBg');
  const tint = useThemeColor({}, 'tint');

  const onPress = () => {
    (router as any).push(`/${basePath}/notifications`);
  };

  return (
    <Pressable onPress={onPress} style={{ marginLeft: 8 }}>
      <View style={[styles.container, { backgroundColor: iconBg }]}>
        <Ionicons name="notifications-outline" size={20} color={tint} />
        {count > 0 && (
          <View style={[styles.badge, { backgroundColor: tint }]}>
            <Text style={styles.badgeText}>{count}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: -6, right: -6, borderRadius: 10, minWidth: 18, height: 18, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
});
