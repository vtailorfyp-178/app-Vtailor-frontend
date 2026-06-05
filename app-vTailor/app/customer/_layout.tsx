import BottomTabBar, { TAB_BAR_HEIGHT } from '@/components/BottomTabBar';
import { customerTabFromParam } from '@/components/customer/customerTabConfig';
import { SURFACE_MUTED } from '@/constants/ui';
import { Slot, useGlobalSearchParams, usePathname } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Keyboard, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CustomerLayout() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { tab } = useGlobalSearchParams<{ tab?: string }>();
  const activeTab = getCustomerTab(pathname, typeof tab === 'string' ? tab : undefined);
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

  const showTabBar = !keyboardVisible && shouldShowCustomerTabBar(pathname);

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 6), backgroundColor: SURFACE_MUTED }]}>
      <View style={[styles.content, { paddingBottom: showTabBar ? TAB_BAR_HEIGHT : 0 }]}>
        <Slot />
      </View>
      {showTabBar ? (
        <>
          <View style={[styles.tabBarBackdrop, { height: TAB_BAR_HEIGHT + Math.max(insets.bottom, 10) + 12 }]} />
          <BottomTabBar basePath="customer" activeTab={activeTab} />
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

function shouldShowCustomerTabBar(pathname: string): boolean {
  if (pathname.includes('/customer/chat-conversation')) return false;
  if (pathname.includes('/customer/ai-assistant')) return false;
  if (pathname.includes('/customer/customize3d')) return false;
  if (pathname.includes('/customer/view-3d-model')) return false;
  if (pathname.includes('/customer/design-detail')) return false;
  if (pathname.includes('/customer/measurements')) return false;
  if (pathname.includes('/customer/order-timeline')) return false;
  if (pathname.includes('/customer/find-tailors')) return false;
  return true;
}

function getCustomerTab(pathname: string, tabParam?: string) {
  const fromQuery = customerTabFromParam(tabParam);
  if (pathname === '/customer' || pathname.endsWith('/customer')) {
    return fromQuery;
  }
  if (pathname.includes('/customer/orders') || pathname.includes('/customer/order-')) return 'orders';
  if (pathname.includes('/customer/chat')) return 'chat';
  if (pathname.includes('/customer/wallet')) return 'wallet';
  if (
    pathname.includes('/customer/profile') ||
    pathname.includes('/customer/settings') ||
    pathname.includes('/customer/help')
  ) {
    return 'profile';
  }
  return 'home';
}
