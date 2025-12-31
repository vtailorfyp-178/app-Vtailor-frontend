import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { ThemedText } from './themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

interface BottomTabBarProps {
  basePath: 'customer' | 'tailor';
  onTabChange?: (tab: string) => void;
}

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

  return (
    <View style={[styles.container, { backgroundColor: useThemeColor({}, 'card'), borderTopColor: useThemeColor({}, 'inputBorder') }]}>
      {tabs.map((tab) => (
        <Pressable
          key={tab.id}
          style={[styles.tab, activeTab === tab.id && { backgroundColor: useThemeColor({}, 'iconBg'), borderRadius: 12, marginHorizontal: 2 }]}
          onPress={() => handleTabPress(tab.id)}
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
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    
    paddingVertical: 8,
    
    paddingBottom: 24,
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
