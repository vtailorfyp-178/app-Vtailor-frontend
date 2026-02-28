import React, { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ThemedText } from './themed-text';

interface BottomTabBarProps {
  basePath: 'customer' | 'tailor';
  onTabChange?: (tab: string) => void;
  activeTab?: string;
}

export const TAB_BAR_HEIGHT = Platform.select({
  ios: 90,
  android: 80,
  default: 80,
});

const TABS = [
  { label: 'Home', icon: '🏠', id: 'home' },
  { label: 'Orders', icon: '📦', id: 'orders' },
  { label: 'Chat', icon: '💬', id: 'chat' },
  { label: 'Wallet', icon: '💰', id: 'wallet' },
  { label: 'Profile', icon: '👤', id: 'profile' },
];

const BottomTabBar = ({ basePath, onTabChange, activeTab }: BottomTabBarProps) => {
  const router = useRouter();
  const [internalTab, setInternalTab] = useState(activeTab || 'home');

  // Theme colors (called once)
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'inputBorder');
  const iconBg = useThemeColor({}, 'iconBg');
  const tintColor = useThemeColor({}, 'tint');

  // Sync with controlled activeTab
  useEffect(() => {
    if (activeTab) {
      setInternalTab(activeTab);
    }
  }, [activeTab]);

  const handleNavigate = (tabId: string) => {
    setInternalTab(tabId);
    onTabChange?.(tabId);

    // Only navigate if parent is not controlling tabs
    if (!onTabChange) {
      const target =
        tabId === 'home'
          ? `/${basePath}`
          : `/${basePath}/${tabId}`;

      router.push(target as any);
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: cardColor,
          borderTopColor: borderColor,
        },
      ]}
    >
      {TABS.map((tab) => {
        const isActive = internalTab === tab.id;

        return (
          <Pressable
            key={tab.id}
            style={[
              styles.tab,
              isActive && {
                backgroundColor: iconBg,
                borderRadius: 12,
                marginHorizontal: 2,
              },
            ]}
            onPress={() => handleNavigate(tab.id)}
          >
            <ThemedText
              style={[
                styles.icon,
                isActive && styles.activeIcon,
              ]}
            >
              {tab.icon}
            </ThemedText>

            <ThemedText
              style={[
                styles.label,
                isActive && {
                  color: tintColor,
                  fontWeight: '600',
                },
              ]}
            >
              {tab.label}
            </ThemedText>
          </Pressable>
        );
      })}
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
    paddingBottom: Platform.select({
      ios: 20,
      android: 12,
      default: 12,
    }),
    zIndex: 50,
  },
  tab: {
    alignItems: 'center',
    padding: 8,
    flex: 1,
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
});

export default BottomTabBar;