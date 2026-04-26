import { useThemeColor } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from './themed-text';

const ACCENT = '#E91E8C';

interface BottomTabBarProps {
  basePath: 'customer' | 'tailor';
  onTabChange?: (tab: string) => void;
  activeTab?: string; // optional controlled active tab
}

export const TAB_BAR_HEIGHT = Platform.select({ ios: 90, android: 80, default: 80 });

const BottomTabBar = ({ basePath, onTabChange, activeTab }: BottomTabBarProps) => {
  const [internalTab, setInternalTab] = useState(activeTab || 'home');
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
    <View style={[styles.container, { backgroundColor: cardColor, borderTopColor: inputBorderColor }]} pointerEvents="box-none">
      {tabs.map((tab) => {
        const isActive = internalTab === tab.id;
        return (
        <Pressable
          key={tab.id}
          style={[styles.tab, isActive && styles.activeTab]}
          onPress={() => handleNavigate(tab.id)}
        >
          <Ionicons
            name={tab.icon as any}
            size={24}
            color={isActive ? ACCENT : '#6b7280'}
            style={styles.icon}
          />
          <ThemedText style={[styles.label, isActive && styles.activeLabel]}>
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
    backgroundColor: '#FCE4F2',
    borderRadius: 14,
    marginHorizontal: 4,
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
  activeLabel: {
    color: ACCENT,
    fontWeight: '600',
  },
});

export default BottomTabBar;
