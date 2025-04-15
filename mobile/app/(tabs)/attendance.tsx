import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import { useAppStore } from '@/stores/useAppStore';
import { TabView, TabBar } from 'react-native-tab-view';
import { MainScreenLayout } from '@/layouts/MainScreenLayout';
import ThemedView from '@/components/theme/ThemedView';
import ThemedText from '@/components/theme/ThemedText';
import MyAttendances from '@/components/MyAttendances';
import { useColorScheme } from '@/hooks/useColorScheme';
import useTranslation from '@/hooks/useTranslation';
import { MyRetail } from '@/types/retail';
import { useQueries } from '@tanstack/react-query';
import { useCompaniesApi } from '@/api/useCompaniesApi';
import { GetMyCompaniesResult } from '@/types/workplaces';

interface Route {
  key: string;
  title: string;
}

const AttendanceScreen: React.FC = () => {
  const { t } = useTranslation();
  const { myWorkplaces, urls, appId, setMyWorkplaces } = useAppStore();
  const colorScheme = useColorScheme();
  const [index, setIndex] = useState(0);
  const [routes, setRoutes] = useState<Route[]>([]);
  const { getMyCompanies } = useCompaniesApi();

  const queryResults = useQueries({
    queries: urls.map((url) => ({
      queryKey: ['myCompanies', appId, url],
      queryFn: () => getMyCompanies(url),
      enabled: !!appId && urls.length > 0 && !!myWorkplaces,
    })),
    combine: (results) => {
      const dataByDomain: Record<string, GetMyCompaniesResult> = {};
      results.forEach((result, i) => {
        const url = urls[i];
        if (result.data) {
          dataByDomain[url] = result.data;
        }
      });

      return {
        isLoading: results.some((r) => r.isLoading),
        isFetching: results.some((r) => r.isFetching),
        data: dataByDomain,
        refetch: () => results.forEach((r) => r.refetch()),
      };
    },
  });

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

  useEffect(() => {
    const allSuccess = !queryResults.isFetching && !queryResults.isLoading;
    if (allSuccess && queryResults.data) {
      setMyWorkplaces(queryResults.data);
    }
  }, [queryResults.data, queryResults.isFetching, queryResults.isLoading]);

  return (
    <MainScreenLayout>
      <ThemedView style={styles.container}>
        {myWorkplaces && Object.keys(myWorkplaces).length > 0 ? (
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
    alignItems: 'center'
  },
});

export default AttendanceScreen;
