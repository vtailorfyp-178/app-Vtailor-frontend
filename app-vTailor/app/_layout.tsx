import 'react-native-gesture-handler';
import 'react-native-reanimated';
import { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppState, AppStateStatus } from 'react-native';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/contexts/AuthContext';
import { prefetchCloudinaryModelCatalog } from '@/services/glb/cloudinaryModelCatalog';
import {
  requestNotificationPermissions,
  setupNotificationTapHandler,
  clearBadgeCount,
} from '@/services/notificationService';
import { pruneStaleApiBaseUrl } from '@/services/apiBase';

// No anchor routes; root shows `app/index.tsx` (Splash) by default.

function NotificationBootstrap() {
  useEffect(() => {
    // Request permission once on mount
    requestNotificationPermissions().catch(() => {});

    // Handle tapping a notification to open the correct chat
    const cleanup = setupNotificationTapHandler();

    // Clear badge whenever the app comes to foreground
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') clearBadgeCount().catch(() => {});
    });

    return () => {
      cleanup();
      sub.remove();
    };
  }, []);

  return null;
}

export default function RootLayout() {
  prefetchCloudinaryModelCatalog();
  const colorScheme = useColorScheme();

  useEffect(() => {
    void pruneStaleApiBaseUrl();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <AuthProvider>
              <NotificationBootstrap />
              <Slot />
              <StatusBar style="auto" />
            </AuthProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
