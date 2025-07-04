import { ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-reanimated';
import '@/i18n';
import SpaceMono from '@/assets/fonts/SpaceMono-Regular.ttf';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAppStore } from '@/stores/useAppStore';
import { Appearance, Platform } from 'react-native';
import AppLock from '@/layouts/AppLock';
import { checkReinstallation, isAndroid } from '@/utils';
import VersionCheck from '@/components/VersionCheck';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import AppDarkTheme from '@/theme/appDarkTheme';
import AppLightTheme from '@/theme/appLightTheme';
import * as Notifications from 'expo-notifications';

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

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const registerForNotifications = async () => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'A channel is needed for the permissions prompt to appear',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }
}

export default function RootLayout() {
  const { theme, setTheme } = useAppStore()
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
      await registerForNotifications();
    };

    initializeApp();
  }, []);

  useEffect(() => {
    const requestPermissions = async () => {
      await Notifications.requestPermissionsAsync();
    };
    requestPermissions();
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
    <ThemeProvider value={theme === 'dark' ? AppDarkTheme : AppLightTheme}>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <AppLock>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="(hidden)/registration" options={{ headerShown: false }} />
            </Stack>
          </AppLock>
          <StatusBar style={'auto'} translucent={isAndroid} />
        </GestureHandlerRootView>
        <VersionCheck />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
