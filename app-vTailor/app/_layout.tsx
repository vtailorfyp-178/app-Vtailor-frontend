import 'react-native-gesture-handler';
import 'react-native-reanimated';
import { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/contexts/AuthContext';
import { prefetchCloudinaryModelCatalog } from '@/services/glb/cloudinaryModelCatalog';
import { pruneStaleApiBaseUrl } from '@/services/apiBase';

// No anchor routes; root shows `app/index.tsx` (Splash) by default.

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
              <Slot />
              <StatusBar style="auto" />
            </AuthProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
