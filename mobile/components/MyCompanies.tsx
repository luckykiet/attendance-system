import { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity } from 'react-native';
import { useQueries } from '@tanstack/react-query';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

import { useAppStore } from '@/stores/useAppStore';
import { useCompaniesApi } from '@/api/useCompaniesApi';
import ThemedText from '@/components/theme/ThemedText';
import { WorkingHour } from '@/types/working-hour';
import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import useTranslation from '@/hooks/useTranslation';
import { Colors } from '@/constants/Colors';
import ThemedView from '@/components/theme/ThemedView';
import ThemedActivityIndicator from '@/components/theme/ThemedActivityIndicator';
import _ from 'lodash';
import { DAYS_OF_WEEK, daysOfWeeksTranslations, TIME_FORMAT } from '@/constants/Days';
import { useColorScheme } from '@/hooks/useColorScheme';

dayjs.extend(customParseFormat);

type WorkingHours = Record<string, WorkingHour>;

interface Company {
  _id: string;
  name: string;
  location: Location & { allowedRadius: number },
  workingHours: WorkingHours;
  employeeWorkingHours: WorkingHours;
  checkInTime: string | null;
  checkOutTime: string | null;
  domain: string;
}

interface WorkingAt {
  _id: string;
  registerId: string;
  workingHours: WorkingHours;
}

const MyCompanies = () => {
  const { t } = useTranslation();
  const { appId, urls, isGettingLocation, location } = useAppStore();
  const { getMyCompanies } = useCompaniesApi();
  const colorScheme = useColorScheme();
  const scrollViewRef = useRef<FlatList>(null);
  const [showScrollArrow, setShowScrollArrow] = useState(false);
  const todayIndex = dayjs().day();
  const todayKey = DAYS_OF_WEEK[todayIndex];

  const queryResults = useQueries({
    queries: urls.map((url) => ({
      queryKey: ['myCompanies', appId, url],
      queryFn: () => getMyCompanies(url),
      enabled: !!appId && urls.length > 0,
    })),
  });

  const isLoading = queryResults.some((result) => result.isLoading);
  const isFetching = queryResults.some((result) => result.isFetching);

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

  const companies = queryResults
    .map((result) => result.data)
    .filter((data) => !!data)
    .map((data) => {
      const { registers, workingAts } = data;
      return registers.map((company: Company) => {
        const workingAt = workingAts.find((wa: WorkingAt) => wa.registerId === company._id);
        return { ...company, employeeWorkingHour: workingAt?.workingHours };
      });
    }).flat();

  return (
    <ThemedView style={styles.nearbyContainer}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="subtitle" style={styles.nearbyLabel}>{t('misc_workplaces')}:</ThemedText>
        <TouchableOpacity onPress={() => queryResults.forEach((result) => result.refetch())} style={styles.refreshButton}>
          <MaterialIcons name="refresh" size={24} color={colorScheme === 'light' ? "black" : "white"} />
        </TouchableOpacity>
      </ThemedView>
      {(isLoading || isFetching || isGettingLocation) && <ThemedActivityIndicator size={'large'} />}
      {companies.length > 0 ? (
        <>
          <FlatList
            ref={scrollViewRef}
            style={styles.scrollView}
            data={companies}
            renderItem={({ item: company }) => {
              return <View key={company._id} style={styles.companyItem}>
                <ThemedText style={styles.companyText}>{company.name}</ThemedText>
                <ThemedText style={styles.companyDetail}>
                  {company.address.street}, {company.address.zip} {company.address.city}
                </ThemedText>
                <ThemedText style={styles.nearbyLabel}>
                  {t('misc_working_hours')}:
                </ThemedText>
                {DAYS_OF_WEEK.map((day) => (
                  <ThemedText key={day} style={
                    [styles.companyDetail, day === todayKey ? styles.today : null]
                  }>
                    {daysOfWeeksTranslations[day] && daysOfWeeksTranslations[day].name
                      ? t(daysOfWeeksTranslations[day].name)
                      : day}: {company.workingHours[day]?.isAvailable
                        ? `${company.workingHours[day].start} - ${company.workingHours[day].end}`
                        : t('misc_closed')}
                  </ThemedText>
                ))}
                <View style={styles.divider} />
                <ThemedText style={styles.nearbyLabel}>
                  {t('misc_my_working_hours')}:
                </ThemedText>
                {DAYS_OF_WEEK.map((day) => (
                  <ThemedText key={day} style={
                    [styles.companyDetail, day === todayKey ? styles.today : null]
                  }>
                    {daysOfWeeksTranslations[day] && daysOfWeeksTranslations[day].name
                      ? t(daysOfWeeksTranslations[day].name)
                      : day}: {company.employeeWorkingHour[day]?.isAvailable
                        ? `${company.employeeWorkingHour[day].start} - ${company.employeeWorkingHour[day].end}`
                        : t('misc_closed')}
                  </ThemedText>
                ))}
              </View>
            }}
            keyExtractor={(company) => company._id}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          />
          {showScrollArrow && (
            <TouchableOpacity style={[styles.arrowContainer, { backgroundColor: colorScheme === 'dark' ? '#979998' : '#e3e6e4' },]} onPress={scrollToBottom}>
              <MaterialIcons name="keyboard-arrow-down" size={24} color={colorScheme === 'light' ? "black" : "white"} />
            </TouchableOpacity>
          )}
        </>
      ) : (
        <ThemedView>
          <ThemedText>{t('misc_no_nearby_workplace')}.</ThemedText>
          <ThemedText>{t('misc_must_be_registered_by_employer')}.</ThemedText>
        </ThemedView>
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  nearbyContainer: {
    paddingHorizontal: 10,
    flex: 1,
    justifyContent: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  nearbyLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  refreshButton: {
    padding: 8,
  },
  scrollView: {
    marginVertical: 10,
  },
  arrowContainer: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    borderRadius: 15,
    padding: 5,
  },
  companyItem: {
    marginVertical: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
  },
  companyText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  companyDetail: {
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: 8,
  },
  today: {
    fontSize: 16,
    fontWeight: 'bold',
  }
});

export default MyCompanies;
