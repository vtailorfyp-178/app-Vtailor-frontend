import BottomTabBar, { TAB_BAR_HEIGHT } from '@/components/BottomTabBar';
import { tailorTabFromParam } from '@/components/tailor/tailorTabConfig';
import { SURFACE_MUTED } from '@/constants/ui';
import { Slot, useGlobalSearchParams, usePathname } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Keyboard, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TailorLayout() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { tab } = useGlobalSearchParams<{ tab?: string }>();
  const activeTab = getTailorTab(pathname, typeof tab === 'string' ? tab : undefined);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const showTabBar = !keyboardVisible && shouldShowTailorTabBar(pathname);

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 6), backgroundColor: SURFACE_MUTED }]}>
      <View style={[styles.content, { paddingBottom: showTabBar ? TAB_BAR_HEIGHT : 0 }]}>
        <Slot />
      </View>
      {showTabBar ? (
        <>
          <View style={[styles.tabBarBackdrop, { height: TAB_BAR_HEIGHT + Math.max(insets.bottom, 10) + 12 }]} />
          <BottomTabBar basePath="tailor" activeTab={activeTab} />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  tabBarBackdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: SURFACE_MUTED,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e2e8f0',
  },
});

function shouldShowTailorTabBar(pathname: string): boolean {
  if (pathname.includes('/tailor/chat/')) return false;
  if (pathname.includes('/tailor/ai-assistant')) return false;
  if (pathname.includes('/tailor/order-detail')) return false;
  if (pathname.includes('/tailor/3d-view')) return false;
  if (pathname.includes('/tailor/measurement-detail')) return false;
  if (pathname.includes('/tailor/customize')) return false;
  return true;
}

function getTailorTab(pathname: string, tabParam?: string) {
  const fromQuery = tailorTabFromParam(tabParam);
  if (pathname === '/tailor' || pathname.endsWith('/tailor')) {
    return fromQuery;
  }
  if (pathname.includes('/tailor/orders') || pathname.includes('/tailor/order-') || pathname.includes('/tailor/requests')) {
    return 'orders';
  }
  if (pathname.includes('/tailor/chat')) return 'chat';
  if (pathname.includes('/tailor/wallet')) return 'wallet';
  if (
    pathname.includes('/tailor/profile') ||
    pathname.includes('/tailor/settings') ||
    pathname.includes('/tailor/help')
  ) {
    return 'profile';
  }
  return 'home';
}
