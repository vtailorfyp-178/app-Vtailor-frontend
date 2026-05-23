import BottomTabBar, { TAB_BAR_HEIGHT } from '@/components/BottomTabBar';
import { Slot, usePathname } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Keyboard, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CustomerLayout() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const activeTab = getCustomerTab(pathname);
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

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top + 8, 20) }]}>
      <View style={[styles.content, { paddingBottom: keyboardVisible ? 0 : TAB_BAR_HEIGHT }]}>
        <Slot />
      </View>
      {!keyboardVisible ? <BottomTabBar basePath="customer" activeTab={activeTab} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
});

function getCustomerTab(pathname: string) {
  if (pathname.includes('/customer/orders') || pathname.includes('/customer/order-')) return 'orders';
  if (pathname.includes('/customer/chat')) return 'chat';
  if (pathname.includes('/customer/wallet')) return 'wallet';
  if (pathname.includes('/customer/profile') || pathname.includes('/customer/settings') || pathname.includes('/customer/help')) return 'profile';
  return 'home';
}
