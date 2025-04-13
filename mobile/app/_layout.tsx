import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-reanimated';
import '@/i18n';
import SpaceMono from '@/assets/fonts/SpaceMono-Regular.ttf';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAppStore } from '@/stores/useAppStore';
import { Appearance } from 'react-native';
import AppLock from '@/layouts/AppLock';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
      retryOnMount: false,
      retryDelay: 3000,
      staleTime: Infinity,
    },
  },
});

import { checkReinstallation } from '@/utils';
import VersionCheck from '@/components/VersionCheck';

export default function RootLayout() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [loaded] = useFonts({
    SpaceMono,
  });
  const { appId, loadAppId, loadUrls } = useAppStore();

  useEffect(() => {
    const loadInitialSettings = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem('theme');
        Appearance.setColorScheme(storedTheme === 'dark' ? 'dark' : 'light');
        setTheme(storedTheme === 'dark' ? 'dark' : 'light');
      } catch (e) {
        console.error('Failed to load theme from storage', e);
      }

      loadAppId();
      loadUrls();
    };

    const initializeApp = async () => {
      await checkReinstallation();
      await loadInitialSettings();
    };

    initializeApp();
  }, []);

  useEffect(() => {
    if (loaded && appId) {
      SplashScreen.hideAsync();
    }
  }, [loaded, appId]);

  if (!loaded || !appId) {
    return null;
  }

  return (
    <ThemeProvider value={theme === 'dark' ? DarkTheme : DefaultTheme}>
      <QueryClientProvider client={queryClient}>
        <AppLock>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(hidden)/registration" options={{ headerShown: false }} />
          </Stack>
        </AppLock>
        <VersionCheck />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
