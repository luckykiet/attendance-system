import { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity } from 'react-native';
import { useQueries } from '@tanstack/react-query';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import customParseFormat from 'dayjs/plugin/customParseFormat';

import { useAppStore } from '@/stores/useAppStore';
import { useCompaniesApi } from '@/api/useCompaniesApi';
import ThemedText from '@/components/theme/ThemedText';
import { DAYS_OF_WEEK, TIME_FORMAT } from '@/constants/Days';
import { WorkingHour } from '@/types/working-hour';

import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import useTranslation from '@/hooks/useTranslation';
import { Colors } from '@/constants/Colors';
import ThemedView from '@/components/theme/ThemedView';
import ThemedActivityIndicator from '@/components/theme/ThemedActivityIndicator';

dayjs.extend(isBetween);
dayjs.extend(customParseFormat);

type WorkingHours = Record<string, WorkingHour>;

interface Company {
  _id: string;
  name: string;
  location: Location & { allowedRadius: number },
  workingHours: WorkingHours;
  distanceInMeters: number;
}

interface CompanyWithStatus extends Company {
  openingHours: string;
  status: string;
}

const getTodayWorkingHours = (workingHours: WorkingHours): { status: string; message: string } => {
  const todayIndex = dayjs().day();
  const todayKey = DAYS_OF_WEEK[todayIndex];
  const hours = workingHours[todayKey];

  if (!hours?.isAvailable) {
    return { status: 'closed', message: 'misc_closed' };
  }

  const currentTime = dayjs();
  const openTime = dayjs(hours.start, TIME_FORMAT);
  const closeTime = dayjs(hours.end, TIME_FORMAT);
  const warningTime = openTime.subtract(1, 'hour');

  if (currentTime.isBetween(openTime, closeTime)) {
    return { status: 'open', message: `${hours.start} - ${hours.end}` };
  } else if (currentTime.isBetween(warningTime, openTime)) {
    return { status: 'warning', message: `${hours.start} - ${hours.end}` };
  }
  return { status: 'out_of_time', message: `${hours.start} - ${hours.end}` };
};

const NearbyCompanies = () => {
  const { t } = useTranslation();
  const { location, appId, urls, isGettingLocation } = useAppStore();
  const { getNearbyCompanies } = useCompaniesApi();

  const scrollViewRef = useRef<FlatList>(null);
  const [showScrollArrow, setShowScrollArrow] = useState(false);

  const queryResults = useQueries({
    queries: urls.map((url) => ({
      queryKey: ['nearbyCompanies', location, appId, url],
      queryFn: () => getNearbyCompanies(url, location),
      enabled: !!location && !!appId && urls.length > 0,
    })),
  });

  const isLoading = queryResults.some((result) => result.isLoading);

  const nearbyCompanies: CompanyWithStatus[] = queryResults
    .map((result) => (result.data as Company[]) || [])
    .flat()
    .filter((company, index, self) => self.findIndex(c => c._id === company._id) === index)
    .map((company) => {
      const { status, message } = getTodayWorkingHours(company.workingHours);
      return {
        ...company,
        openingHours: message,
        status,
        distanceInMeters: Math.round(company.distanceInMeters),
        distanceLeft: Math.round(company.location.allowedRadius - company.distanceInMeters),
      };
    });

  const handleScroll = (event: { nativeEvent: { contentSize: { height: number; width: number }; layoutMeasurement: { height: number; width: number }; contentOffset: { x: number; y: number } } }) => {
    const { contentSize, layoutMeasurement, contentOffset } = event.nativeEvent;
    const isScrolledToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;

    setShowScrollArrow(!isScrolledToBottom);
  };

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  useEffect(() => {
    if (location) {
      queryResults.forEach((result) => {
        result.refetch();
      });
    }
  }, [location]);

  return (
    <View style={styles.nearbyContainer}>
      <ThemedText type="subtitle" style={styles.nearbyLabel}>{t('misc_nearby_workplaces')}:</ThemedText>
      {(isLoading || isGettingLocation) && <ThemedActivityIndicator size={'large'} />}
      {nearbyCompanies.length > 0 ? (
        <>
          <FlatList
            ref={scrollViewRef}
            style={styles.scrollView}
            data={nearbyCompanies}
            renderItem={({ item: company }) => (
              <View key={company._id} style={styles.companyItem}>
                <ThemedText style={styles.companyText}>{company.name}</ThemedText>
                <ThemedText style={styles.companyDetail}>
                  {t('misc_working_hours')}: {company.openingHours}
                </ThemedText>
                <ThemedText
                  style={[
                    styles.companyDetail,
                    company.status === 'open'
                      ? { color: Colors.success }
                      : company.status === 'warning'
                        ? { color: Colors.warning }
                        : { color: Colors.error },
                  ]}
                >
                  {t('misc_status')}: {company.status === 'open' ? t('misc_opening') : company.status === 'warning' ? t('misc_opening_soon') : t('misc_closed')}
                </ThemedText>
                <ThemedText style={styles.companyDetail}>
                  {t('misc_distance')}: {company.distanceInMeters} m
                </ThemedText>
                <ThemedText
                  style={[
                    styles.companyDetail,
                    company.distanceLeft > 0 ? { color: Colors.success } : { color: Colors.error },
                  ]}
                >
                  {t('misc_distance_left')}: {company.distanceLeft} m
                </ThemedText>
              </View>
            )}
            keyExtractor={(company) => company._id}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          />
          {showScrollArrow && (
            <TouchableOpacity style={styles.arrowContainer} onPress={scrollToBottom}>
              <MaterialIcons name="keyboard-arrow-down" size={24} color="black" />
            </TouchableOpacity>
          )}
        </>
      ) : (
        <ThemedView>
          <ThemedText>{t('misc_no_nearby_workplace')}.</ThemedText>
          <ThemedText>{t('misc_must_be_registered_by_employer')}.</ThemedText>
        </ThemedView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  nearbyContainer: {
    paddingHorizontal: 10,
    flex: 1,
    justifyContent: 'center',
  },
  scrollView: {
    marginVertical: 10,
  },
  arrowContainer: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 5,
  },
  nearbyLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  companyItem: {
    marginVertical: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
  },
  companyText: {
    fontSize: 16,
    fontWeight: '500',
  },
  companyDetail: {
    fontSize: 14,
  },
});

export default NearbyCompanies;
