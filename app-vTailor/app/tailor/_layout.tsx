import BottomTabBar, { TAB_BAR_HEIGHT } from '@/components/BottomTabBar';
import { Slot, useLocalSearchParams, usePathname } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SURFACE_MUTED } from '@/constants/ui';

export default function TailorLayout() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const params = useLocalSearchParams();
  const activeTab = getTailorTab(pathname, typeof params?.tab === 'string' ? params.tab : undefined);

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top + 8, 20), backgroundColor: SURFACE_MUTED }]}>
      <View style={styles.content}>
        <Slot />
      </View>
      <BottomTabBar basePath="tailor" activeTab={activeTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingBottom: TAB_BAR_HEIGHT },
});

function getTailorTab(pathname: string, tabParam?: string) {
  if (pathname === '/tailor' && tabParam) return tabParam;
  if (pathname.includes('/tailor/orders') || pathname.includes('/tailor/order-') || pathname.includes('/tailor/requests')) return 'orders';
  if (pathname.includes('/tailor/chat')) return 'chat';
  if (pathname.includes('/tailor/wallet')) return 'wallet';
  if (pathname.includes('/tailor/profile') || pathname.includes('/tailor/settings') || pathname.includes('/tailor/help')) return 'profile';
  return 'home';
}
