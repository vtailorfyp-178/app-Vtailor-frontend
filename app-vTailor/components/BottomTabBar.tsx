import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import { ThemedText } from './themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useRouter } from 'expo-router';

interface BottomTabBarProps {
  basePath: 'customer' | 'tailor';
  onTabChange?: (tab: string) => void;
}

export const TAB_BAR_HEIGHT = Platform.select({ ios: 90, android: 80, default: 80 });

const BottomTabBar = ({ basePath, onTabChange }: BottomTabBarProps) => {
  const [activeTab, setActiveTab] = useState('home');

  const customerTabs = [
    { label: 'Home', icon: '🏠', id: 'home' },
    { label: 'Orders', icon: '📦', id: 'orders' },
    { label: 'Chat', icon: '💬', id: 'chat' },
    { label: 'Wallet', icon: '💰', id: 'wallet' },
    { label: 'Profile', icon: '👤', id: 'profile' },
  ];

  const tailorTabs = [
    { label: 'Home', icon: '🏠', id: 'home' },
    { label: 'Orders', icon: '📦', id: 'orders' },
    { label: 'Chat', icon: '💬', id: 'chat' },
    { label: 'Wallet', icon: '💰', id: 'wallet' },
    { label: 'Profile', icon: '👤', id: 'profile' },
  ];

  const tabs = basePath === 'customer' ? customerTabs : tailorTabs;

  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    if (onTabChange) {
      onTabChange(tabId);
    }
  };

  const router = useRouter();

  const handleNavigate = (tabId: string) => {
    setActiveTab(tabId);
    if (onTabChange) onTabChange(tabId);
    try {
      const target = tabId === 'home' ? `/${basePath}` : `/${basePath}/${tabId}`;
      (router as any).push(target);
    } catch (e) {
      // fallback: no-op
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: useThemeColor({}, 'card'), borderTopColor: useThemeColor({}, 'inputBorder') }]} pointerEvents="box-none">
      {tabs.map((tab) => (
        <Pressable
          key={tab.id}
          style={[styles.tab, activeTab === tab.id && { backgroundColor: useThemeColor({}, 'iconBg'), borderRadius: 12, marginHorizontal: 2 }]}
          onPress={() => handleNavigate(tab.id)}
        >
          <ThemedText style={[styles.icon, activeTab === tab.id && styles.activeIcon]}>
            {tab.icon}
          </ThemedText>
          <ThemedText style={[styles.label, activeTab === tab.id && { color: useThemeColor({}, 'tint'), fontWeight: '600' }]}>
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
