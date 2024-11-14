import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import 'react-native-reanimated';
import '@/i18n';
import { useColorScheme } from '@/hooks/useColorScheme';
import SpaceMono from '@/assets/fonts/SpaceMono-Regular.ttf';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAppStore } from '@/stores/useAppStore';

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

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono,
  });
  const { appId, loadAppId, loadUrls } = useAppStore();

  useEffect(() => {
    loadAppId()
    loadUrls()
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
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <QueryClientProvider client={queryClient}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
