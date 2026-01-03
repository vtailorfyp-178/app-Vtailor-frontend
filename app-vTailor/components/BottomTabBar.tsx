import { useThemeColor } from '@/hooks/use-theme-color';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from './themed-text';

interface BottomTabBarProps {
  basePath: 'customer' | 'tailor';
  onTabChange?: (tab: string) => void;
  activeTab?: string; // optional controlled active tab
}

export const TAB_BAR_HEIGHT = Platform.select({ ios: 90, android: 80, default: 80 });

const BottomTabBar = ({ basePath, onTabChange, activeTab }: BottomTabBarProps) => {
  const [internalTab, setInternalTab] = useState(activeTab || 'home');

  // sync internal state when a controlled activeTab is provided
  React.useEffect(() => {
    if (activeTab) {
      setInternalTab(activeTab);
    }
  }, [activeTab]);

  const customerTabs = [
    { label: 'Home', icon: '🏠', id: 'home' },
    { label: 'Orders', icon: '📦', id: 'orders' },
    { label: 'Chat', icon: '💬', id: 'chat' },
    { label: 'Wallet', icon: '💰', id: 'wallet' },
    { label: 'Profile', icon: '👤', id: 'profile' },
  ];

  const tailorTabs = [
    { label: 'Home', icon: '🏠', id: 'home' },
    { label: 'Wallet', icon: '💰', id: 'wallet' },
  ];

  const tabs = basePath === 'customer' ? customerTabs : tailorTabs;

  const handleTabPress = (tabId: string) => {
    setInternalTab(tabId);
    if (onTabChange) {
      onTabChange(tabId);
    }
  };

  const router = useRouter();

  const handleNavigate = (tabId: string) => {
    setInternalTab(tabId);
    if (onTabChange) onTabChange(tabId);
    try {
      // If a parent provided `onTabChange`, assume in-dashboard controlled tabs
      // and avoid router navigation so the BottomTabBar stays fixed.
      if (!onTabChange) {
        const target = tabId === 'home' ? `/${basePath}` : `/${basePath}/${tabId}`;
        (router as any).push(target);
      }
    } catch (e) {
      // fallback: no-op
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: useThemeColor({}, 'card'), borderTopColor: useThemeColor({}, 'inputBorder') }]} pointerEvents="box-none">
      {tabs.map((tab) => (
        <Pressable
          key={tab.id}
          style={[styles.tab, internalTab === tab.id && { backgroundColor: useThemeColor({}, 'iconBg'), borderRadius: 12, marginHorizontal: 2 }]}
          onPress={() => handleNavigate(tab.id)}
        >
          <ThemedText style={[styles.icon, internalTab === tab.id && styles.activeIcon]}>
            {tab.icon}
          </ThemedText>
          <ThemedText style={[styles.label, internalTab === tab.id && { color: useThemeColor({}, 'tint'), fontWeight: '600' }]}>
            {tab.label}
          </ThemedText>
        </Pressable>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: TAB_BAR_HEIGHT,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 8,
    paddingBottom: Platform.select({ ios: 20, android: 12, default: 12 }),
    zIndex: 50,
  },
  tab: {
    alignItems: 'center',
    padding: 8,
    flex: 1,
  },
  activeTab: {
    
  },
  icon: {
    fontSize: 24,
    marginBottom: 4,
  },
  activeIcon: {
    fontSize: 26,
  },
  label: {
    fontSize: 11,
    textAlign: 'center',
    color: '#6b7280',
    fontWeight: '500',
  },
  activeLabel: {
    fontWeight: '600',
  },
});

export default BottomTabBar;
