import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { useAppStore } from '@/stores/useAppStore';
import { TabView, TabBar } from 'react-native-tab-view';
import { MainScreenLayout } from '@/layouts/MainScreenLayout';
import ThemedView from '@/components/theme/ThemedView';
import ThemedText from '@/components/theme/ThemedText';
import MyAttendances from '@/components/MyAttendances';
import { useColorScheme } from '@/hooks/useColorScheme';
import useTranslation from '@/hooks/useTranslation';
import { MyRetail } from '@/types/retail';
import { MaterialIcons } from '@expo/vector-icons';

interface Route {
  key: string;
  title: string;
}

const AttendanceScreen: React.FC = () => {
  const { t } = useTranslation();
  const { myWorkplaces, setMyWorkplaces } = useAppStore();
  const colorScheme = useColorScheme();
  const [index, setIndex] = useState(0);
  const [routes, setRoutes] = useState<Route[]>([]);

  useEffect(() => {
    const workplaces = myWorkplaces ?? {};
    const newRoutes: Route[] = [];

    Object.entries(workplaces).forEach(([, workplace]) => {
      workplace.retails?.forEach((retail: MyRetail) => {
        newRoutes.push({
          key: retail._id,
          title: retail.name,
        });
      });
    });

    if (newRoutes.length > 0) {
      setRoutes(newRoutes);
      setIndex(0);
    }
  }, [myWorkplaces]);

  const renderScene = useCallback(
    ({ route }: { route: Route }) => {
      if (!myWorkplaces) return null;
      const workplace = Object.values(myWorkplaces).find((w) =>
        w.retails?.some((retail: MyRetail) => retail._id === route.key)
      );
      if (!workplace) return null;
      const retail = workplace.retails?.find((retail: MyRetail) => retail._id === route.key);
      if (!retail) return null;
      return <MyAttendances retailId={retail._id} domain={workplace.domain} />;
    },
    [myWorkplaces]
  );

  const combinedRetails: MyRetail[] = Object.entries(myWorkplaces || {}).flatMap(([, data]) => {
    const { retails } = data
    return retails
  });

  const handleRefresh = () => {
    setMyWorkplaces(null);
  }

  return (
    <MainScreenLayout>
      <ThemedView style={styles.container}>
        {combinedRetails.length > 0 ? (
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
                  styles.tabBar,
                  colorScheme === 'dark' ? styles.tabBarDark : styles.tabBarLight,
                ]}

                activeColor={colorScheme === 'dark' ? '#fff' : '#000'}
                inactiveColor={colorScheme === 'dark' ? '#aaa' : '#888'}
              />
            )}
          />
        ) : (
          <ThemedView style={styles.noDataContainer}>
            <ThemedText>{t('misc_no_attendance')}</ThemedText>
            <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
              <MaterialIcons
                name="refresh"
                size={24}
                color={colorScheme === 'light' ? 'black' : 'white'}
              />
            </TouchableOpacity>
          </ThemedView>
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
  refreshButton: {
    padding: 8
  },
  tabBar: {
    height: 50,
  },
  tabBarLight: {
    backgroundColor: '#f2f2f2',
  },
  tabBarDark: {
    backgroundColor: '#1f1f1f',
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
  },

  indicatorLight: {
    backgroundColor: '#000',
  },
  indicatorDark: {
    backgroundColor: '#fff',
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
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
});

export default AttendanceScreen;
