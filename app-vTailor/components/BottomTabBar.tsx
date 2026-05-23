import { useThemeColor } from '@/hooks/use-theme-color';
import { ROLE_COLORS, UI } from '@/constants/ui';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from './themed-text';

interface BottomTabBarProps {
  basePath: 'customer' | 'tailor';
  onTabChange?: (tab: string) => void;
  activeTab?: string; // optional controlled active tab
}

export const TAB_BAR_HEIGHT = Platform.select({ ios: 90, android: 80, default: 80 });

const BottomTabBar = ({ basePath, onTabChange, activeTab }: BottomTabBarProps) => {
  const [internalTab, setInternalTab] = useState(activeTab || 'home');
  const insets = useSafeAreaInsets();
  const cardColor = useThemeColor({}, 'card');
  const inputBorderColor = useThemeColor({}, 'inputBorder');

  // sync internal state when a controlled activeTab is provided
  React.useEffect(() => {
    if (activeTab) {
      setInternalTab(activeTab);
    }
  }, [activeTab]);

  const customerTabs = [
    { label: 'Home', icon: 'home-outline', id: 'home' },
    { label: 'Orders', icon: 'cube-outline', id: 'orders' },
    { label: 'Chat', icon: 'chatbubble-ellipses-outline', id: 'chat' },
    { label: 'Wallet', icon: 'wallet-outline', id: 'wallet' },
    { label: 'Profile', icon: 'person-outline', id: 'profile' },
  ];

  const tailorTabs = [
    { label: 'Home', icon: 'home-outline', id: 'home' },
    { label: 'Orders', icon: 'cube-outline', id: 'orders' },
    { label: 'Chat', icon: 'chatbubble-ellipses-outline', id: 'chat' },
    { label: 'Wallet', icon: 'wallet-outline', id: 'wallet' },
    { label: 'Profile', icon: 'person-outline', id: 'profile' },
  ];

  const tabs = basePath === 'customer' ? customerTabs : tailorTabs;
  const accent = basePath === 'tailor' ? ROLE_COLORS.tailor.primary : ROLE_COLORS.customer.primary;
  const activeBg = basePath === 'tailor' ? ROLE_COLORS.tailor.soft : ROLE_COLORS.customer.soft;

  const router = useRouter();

  const handleNavigate = (tabId: string) => {
    setInternalTab(tabId);
    if (onTabChange) onTabChange(tabId);
    try {
      // In dashboard-controlled mode, keep URL in sync with selected tab
      // so back navigation restores the same tab.
      if (onTabChange) {
        const target = `/${basePath}?tab=${tabId}`;
        (router as any).replace(target);
      } else {
        const target = tabId === 'home' ? `/${basePath}` : `/${basePath}/${tabId}`;
        (router as any).push(target);
      }
    } catch {
      // fallback: no-op
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: cardColor, borderColor: inputBorderColor, bottom: Math.max(insets.bottom, 10) }]} pointerEvents="box-none">
      {tabs.map((tab) => {
        const isActive = internalTab === tab.id;
        return (
        <Pressable
          key={tab.id}
          style={[styles.tab, isActive && { backgroundColor: activeBg, marginHorizontal: 4 }]}
          onPress={() => handleNavigate(tab.id)}
        >
          <Ionicons
            name={tab.icon as any}
            size={24}
            color={isActive ? accent : '#6b7280'}
            style={styles.icon}
          />
          <ThemedText style={[styles.label, isActive && { color: accent, fontWeight: '600' }]}>
            {tab.label}
          </ThemedText>
        </Pressable>
      )})}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 12,
    right: 12,
    height: Platform.select({ ios: 74, android: 68, default: 68 }),
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 6,
    paddingVertical: 6,
    zIndex: 50,
    ...UI.shadow,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 18,
    flex: 1,
  },
  icon: {
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    textAlign: 'center',
    color: '#6b7280',
    fontWeight: '400',
  },
});

export default BottomTabBar;
