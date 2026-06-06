import { useThemeColor } from '@/hooks/use-theme-color';
import { ROLE_COLORS, UI } from '@/constants/ui';
import { ADMIN_TABS, adminTabHref, type AdminTabId } from '@/components/admin/adminTabConfig';
import { CUSTOMER_TABS, customerTabHref, type CustomerTabId } from '@/components/customer/customerTabConfig';
import { TAILOR_TABS, tailorTabHref, type TailorTabId } from '@/components/tailor/tailorTabConfig';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from './themed-text';

interface BottomTabBarProps {
  basePath: 'customer' | 'tailor' | 'admin';
  onTabChange?: (tab: string) => void;
  activeTab?: string;
}

type TabItem = {
  id: string;
  label: string;
  icon: string;
  activeIcon: string;
};

export const TAB_BAR_HEIGHT = Platform.select({ ios: 88, android: 78, default: 78 });

const BottomTabBar = ({ basePath, onTabChange, activeTab }: BottomTabBarProps) => {
  const [internalTab, setInternalTab] = useState(activeTab || 'home');
  const insets = useSafeAreaInsets();

  React.useEffect(() => {
    if (activeTab) setInternalTab(activeTab);
  }, [activeTab]);

  const isTailor = basePath === 'tailor';
  const isAdmin = basePath === 'admin';
  const tabs: TabItem[] = isAdmin ? ADMIN_TABS : isTailor ? TAILOR_TABS : CUSTOMER_TABS;
  const accent = isAdmin
    ? ROLE_COLORS.admin.primary
    : isTailor
      ? ROLE_COLORS.tailor.primary
      : ROLE_COLORS.customer.primary;
  const activeBg = isAdmin
    ? ROLE_COLORS.admin.soft
    : isTailor
      ? ROLE_COLORS.tailor.soft
      : ROLE_COLORS.customer.soft;

  const router = useRouter();

  const handleNavigate = (tabId: string) => {
    setInternalTab(tabId);
    onTabChange?.(tabId);
    try {
      const target = (
        basePath === 'admin'
          ? adminTabHref(tabId as AdminTabId)
          : basePath === 'customer'
            ? customerTabHref(tabId as CustomerTabId)
            : tailorTabHref(tabId as TailorTabId)
      ) as Href;
      router.replace(target);
    } catch {
      /* no-op */
    }
  };

  return (
    <View style={[styles.barOuter, { bottom: Math.max(insets.bottom, 8) }]} pointerEvents="box-none">
      <View style={styles.bar}>
        {tabs.map((tab) => {
          const isActive = internalTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              style={styles.tab}
              onPress={() => handleNavigate(tab.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
            >
              <View style={[styles.iconWrap, isActive && { backgroundColor: activeBg }]}>
                <Ionicons
                  name={(isActive ? tab.activeIcon : tab.icon) as keyof typeof Ionicons.glyphMap}
                  size={isActive ? 22 : 21}
                  color={isActive ? accent : '#94a3b8'}
                />
                {isActive ? <View style={[styles.activeDot, { backgroundColor: accent }]} /> : null}
              </View>
              <ThemedText
                style={[styles.label, isActive && { color: accent, fontWeight: '800' }]}
                numberOfLines={1}
              >
                {tab.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  barOuter: {
    position: 'absolute',
    left: 14,
    right: 14,
    zIndex: 50,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 28,
    paddingHorizontal: 6,
    paddingVertical: 8,
    minHeight: Platform.select({ ios: 72, android: 66, default: 66 }),
    ...UI.shadow,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  iconWrap: {
    width: 44,
    height: 40,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  activeDot: {
    position: 'absolute',
    bottom: 4,
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94a3b8',
    textAlign: 'center',
  },
});

export default BottomTabBar;
