import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { useAppStore } from '@/stores/useAppStore';
import { TabView, TabBar } from 'react-native-tab-view';
import { Link } from 'expo-router';
import { MainScreenLayout } from '@/layouts/MainScreenLayout';
import ThemedView from '@/components/theme/ThemedView';
import ThemedText from '@/components/theme/ThemedText';
import MyAttendances from '@/components/MyAttendances';
import { useColorScheme } from '@/hooks/useColorScheme';
import useTranslation from '@/hooks/useTranslation';

interface Route {
  key: string;
  title: string;
}

const AttendanceScreen: React.FC = () => {
  const { t } = useTranslation();
  const { urls } = useAppStore();
  const colorScheme = useColorScheme();
  const [index, setIndex] = useState(0);
  const [routes, setRoutes] = useState<Route[]>([]);

  useEffect(() => {
    if (urls.length > 0) {
      const newRoutes = urls.map((url, idx) => ({ key: url, title: `Tab ${idx + 1}` }));
      setRoutes(newRoutes);
      setIndex(0);
    }
  }, [urls]);

  const renderScene = useCallback(
    ({ route }: { route: Route }) => {
      return <MyAttendances url={route.key} />;
    },
    []
  );

  return (
    <MainScreenLayout>
      <ThemedView style={styles.container}>
        {urls.length > 0 ? (
          <TabView
            navigationState={{ index, routes }}
            renderScene={renderScene}
            onIndexChange={setIndex}
            initialLayout={{ width: Dimensions.get('window').width }}
            renderTabBar={(props) => (
              <TabBar
                {...props}
                indicatorStyle={colorScheme === 'dark' ? styles.indicatorDark : styles.indicatorLight}
                style={[
                  styles.tabBar, colorScheme === 'dark' ? styles.tabBarDark : styles.tabBarLight,
                ]}
                labelStyle={colorScheme === 'dark' ? styles.tabLabelDark : styles.tabLabelLight}
              />
            )}
          />
        ) : (
          <Link href="/(tabs)/settings" asChild>
            <TouchableOpacity style={styles.setupButton}>
              <ThemedText type="link" style={styles.setupButtonText}>{t('misc_setup_urls')}</ThemedText>
            </TouchableOpacity>
          </Link>
        )}
      </ThemedView>
    </MainScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 20,
    justifyContent: 'space-between',
    paddingBottom: 20,
    height: '100%',
  },
  tabBar: {
    height: 50,
  },
  tabBarLight: {
    backgroundColor: '#1f1f1f',
  },
  tabBarDark: {
    backgroundColor: '#1f1f1f',
  },
  tabLabelLight: {
    color: 'black',
    fontWeight: 'bold',
  },
  tabLabelDark: {
    color: 'lightgray',
    fontWeight: 'bold',
  },
  indicatorLight: {
    backgroundColor: 'black',
  },
  indicatorDark: {
    backgroundColor: 'white',
  },
  setupButton: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#457b9d',
    borderRadius: 5,
    marginBottom: 15,
  },
  setupButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default AttendanceScreen;
