import BottomTabBar, { TAB_BAR_HEIGHT } from '@/components/BottomTabBar';
import { adminTabFromParam } from '@/components/admin/adminTabConfig';
import { SURFACE_MUTED } from '@/constants/ui';
import { Slot, useGlobalSearchParams, usePathname } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Keyboard, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AdminLayout() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { tab } = useGlobalSearchParams<{ tab?: string }>();
  const activeTab = adminTabFromParam(typeof tab === 'string' ? tab : undefined);
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

  const showTabBar = !keyboardVisible && pathname.includes('/admin');

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 6), backgroundColor: SURFACE_MUTED }]}>
      <View style={[styles.content, { paddingBottom: showTabBar ? TAB_BAR_HEIGHT : 0 }]}>
        <Slot />
      </View>
      {showTabBar ? (
        <>
          <View style={[styles.tabBarBackdrop, { height: TAB_BAR_HEIGHT + Math.max(insets.bottom, 10) + 12 }]} />
          <BottomTabBar basePath="admin" activeTab={activeTab} />
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
