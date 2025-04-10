import { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity } from 'react-native';
import { useQueries } from '@tanstack/react-query';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import utc from 'dayjs/plugin/utc';
import { useAppStore } from '@/stores/useAppStore';
import { useCompaniesApi } from '@/api/useCompaniesApi';
import ThemedText from '@/components/theme/ThemedText';
import { DAYS_OF_WEEK } from '@/constants/Days';
import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import useTranslation from '@/hooks/useTranslation';
import { Colors } from '@/constants/Colors';
import ThemedView from '@/components/theme/ThemedView';
import ThemedActivityIndicator from '@/components/theme/ThemedActivityIndicator';

import _ from 'lodash';
import { calculateHoursFromMinutes, calculateKilometersFromMeters, getShiftHoursText, getWorkingHoursText } from '@/utils';
import { useColorScheme } from '@/hooks/useColorScheme';
import { PatternFormat } from 'react-number-format';
import { Shift } from '@/types/shift';
import { TodayWorkplace } from '@/types/workplaces';
import ShiftSelectModal from './ShiftSelectModal';
import { Attendance } from '@/types/attendance';

dayjs.extend(isBetween);
dayjs.extend(utc);
dayjs.extend(customParseFormat);

const TodayCompanies = () => {
  const { t } = useTranslation();
  const { t: nonCap } = useTranslation({ capitalize: false });
  const { location, appId, urls, isGettingLocation, setSelectedShift } = useAppStore();
  const { getTodayWorkplaces } = useCompaniesApi();

  const colorScheme = useColorScheme();
  const scrollViewRef = useRef<FlatList>(null);
  const [showScrollArrow, setShowScrollArrow] = useState(false);

  const queryResults = useQueries({
    queries: urls.map((url) => ({
      queryKey: ['todayWorkplaces', location, appId, url],
      queryFn: () => getTodayWorkplaces(url, location),
      enabled: !!appId && urls.length > 0,
    })),
    combine: (results) => {
      return {
        isLoading: results.some((result) => result.isLoading),
        isFetching: results.some((result) => result.isFetching),
        data: results
          .map((result) => (result.data) || [])
          .flat()
          .filter((workplace, index, self) => self.findIndex(c => c._id === workplace._id) === index)
          .map((workplace) => {
            const now = dayjs();
            const todayKey = DAYS_OF_WEEK[now.day()];
            const yesterdayKey = DAYS_OF_WEEK[now.subtract(1, 'day').day()];

            const yesterdayWorkingHours = workplace.workingHours[yesterdayKey];
            const todayWorkingHours = workplace.workingHours[todayKey];

            const { status, message, isYesterday } = getWorkingHoursText({ todayWorkingHours, yesterdayWorkingHours, t });

            return {
              ...workplace,
              distanceInMeters: workplace.distanceInMeters ? Math.round(workplace.distanceInMeters) : null,
              distanceLeft: workplace.distanceInMeters ? Math.round(workplace.location.allowedRadius - workplace.distanceInMeters) : null,
              shifts: workplace.shifts[isYesterday ? yesterdayKey : todayKey],
              status,
              openingHours: workplace.workingHours[todayKey].isAvailable ? message : t('misc_closed'),
            };
          }),
        refetch: () => results.forEach((result) => result.refetch()),
      };
    }
  });

  const handleOpenShiftSelection = ({ shift, workplace }: { shift: Shift, workplace: TodayWorkplace }) => {
    setSelectedShift({ shift, workplace });
  }

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
      queryResults.refetch();
    }
  }, [location]);

  return (
    <ThemedView style={styles.nearbyContainer}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="subtitle" style={styles.nearbyLabel}>{t('misc_my_today_workplaces')}:</ThemedText>
        <TouchableOpacity onPress={() => queryResults.refetch()} style={styles.refreshButton}>
          <MaterialIcons name="refresh" size={24} color={colorScheme === 'light' ? "black" : "white"} />
        </TouchableOpacity>
      </ThemedView>
      {(queryResults.isLoading || queryResults.isFetching || isGettingLocation) && <ThemedActivityIndicator size={'large'} />}
      {
        queryResults.data.length > 0 ? (
          <>
            <FlatList
              ref={scrollViewRef}
              style={styles.scrollView}
              data={queryResults.data}
              renderItem={({ item: workplace }) => {
                const { kilometers, meters } = workplace.distanceInMeters ? calculateKilometersFromMeters(workplace.distanceInMeters) : { kilometers: 0, meters: 0 };
                const { kilometers: kmLeft, meters: mLeft } = workplace.distanceLeft ? calculateKilometersFromMeters(workplace.distanceLeft) : { kilometers: 0, meters: 0 };
                const { hours: checkOutH, minutes: checkOutM } = workplace.checkOutTimeStatus ? calculateHoursFromMinutes(workplace.checkOutTimeStatus) : { hours: 0, minutes: 0 };
                const { hours: checkInH, minutes: checkInM } = workplace.checkInTimeStatus ? calculateHoursFromMinutes(workplace.checkInTimeStatus) : { hours: 0, minutes: 0 };

                return <View key={workplace._id} style={styles.companyItem}>
                  <ThemedText style={styles.companyText}>{workplace.name}</ThemedText>
                  <ThemedText style={styles.companyDetail}>
                    {workplace.address.street}, <PatternFormat
                      value={workplace.address.zip}
                      displayType="text"
                      format="### ##"
                      renderText={(formattedValue) => (
                        <ThemedText style={styles.companyDetail}>{formattedValue}</ThemedText>
                      )}
                    /> {workplace.address.city}
                  </ThemedText>
                  {workplace.status !== 'closed' && <ThemedText style={styles.companyDetail}>
                    {t('misc_working_hours')}: {workplace.openingHours}
                  </ThemedText>}
                  <ThemedText
                    style={[
                      styles.companyDetail,
                      workplace.status === 'open'
                        ? { color: Colors.success }
                        : workplace.status === 'warning'
                          ? { color: Colors.warning }
                          : { color: Colors.error },
                    ]}
                  >
                    {t('misc_status')}: {workplace.status === 'open' ? t('misc_opening') : workplace.status === 'warning' ? t('misc_opening_soon') : t('misc_closed')}
                  </ThemedText>
                  {workplace.distanceInMeters && <ThemedText style={styles.companyDetail}>
                    {t('misc_distance')}: {kilometers > 0 ? `${kilometers} km` : ''} {`${meters} m`}
                  </ThemedText>}
                  {workplace.distanceInMeters && <ThemedText
                    style={[
                      styles.companyDetail,
                      workplace.distanceLeft > 0 ? { color: Colors.success } : { color: Colors.error },
                    ]}
                  >
                    {t('misc_distance_left')}: {workplace.distanceLeft > 0 ? '-' : ''}{kmLeft > 0 ? `${kmLeft} km ` : ''}{`${mLeft} m`}
                  </ThemedText>}

                  <View style={styles.divider} />

                  <ThemedText style={styles.companyDetail}>
                    {t('misc_my_working_hours')}:
                  </ThemedText>
                  {!_.isEmpty(workplace.checkInTime) && dayjs(workplace.checkInTime).isValid() && <ThemedText style={styles.companyDetail}>{t('misc_check_in')}: {dayjs(workplace.checkInTime).format('HH:mm:ss')} -&nbsp;
                    <ThemedText style={[
                      styles.companyDetail,
                      isNaN(workplace.checkInTimeStatus) ? { color: Colors.success } : { color: Colors.error },
                    ]}>
                      {isNaN(workplace.checkInTimeStatus) ? t(workplace.checkInTimeStatus) : `${checkInH > 0 ? `${checkInH} ${nonCap('misc_hour_short')} ` : ''}${checkInM} ${nonCap('misc_min_short')} ${nonCap('misc_late')}`}
                    </ThemedText>
                  </ThemedText>}
                  {!_.isEmpty(workplace.checkOutTime) && dayjs(workplace.checkOutTime).isValid() && <ThemedText style={styles.companyDetail}>{t('misc_check_out')}: {dayjs(workplace.checkOutTime).format('HH:mm:ss')} -&nbsp;
                    <ThemedText style={[
                      styles.companyDetail,
                      isNaN(workplace.checkOutTimeStatus) ? { color: Colors.success } : { color: Colors.error },
                    ]}>
                      {isNaN(workplace.checkOutTimeStatus) ? t(workplace.checkOutTimeStatus) : `${checkOutH > 0 ? `${checkOutH} ${nonCap('misc_hour_short')} ` : ''}${checkOutM} ${nonCap('misc_min_short')} ${nonCap('misc_early')}`}
                    </ThemedText>
                  </ThemedText>}
                  {workplace.shifts
                    .sort((a: Shift, b: Shift) => dayjs(a.start, 'HH:mm').diff(dayjs(b.start, 'HH:mm')))
                    .map((shift: Shift, index: number) => {
                      const { status, message, duration } = getShiftHoursText(shift, t);
                      const { hours, minutes } = calculateHoursFromMinutes(Math.abs(duration));
                      const attendanceOfShift = workplace.attendances.find(
                        (attendance: Attendance) => attendance.shiftId === shift._id
                      );

                      return (
                        <TouchableOpacity
                          key={shift._id}
                          onPress={() => handleOpenShiftSelection({ shift, workplace })}
                          style={[
                            styles.shiftItem,
                            status === 'open'
                              ? { borderColor: Colors.success, backgroundColor: `${Colors.success}20` }
                              : status === 'warning'
                                ? { borderColor: Colors.warning, backgroundColor: `${Colors.warning}20` }
                                : { borderColor: Colors.error, backgroundColor: `${Colors.error}20` },
                          ]}
                        >
                          <ThemedText style={styles.shiftText}>
                            {t('misc_shift')} {index + 1}: {message}
                          </ThemedText>

                          {attendanceOfShift?.checkOutTime ? (
                            <ThemedText style={styles.shiftDuration}>
                              {t('misc_finished')}: {dayjs(attendanceOfShift.checkOutTime).format('HH:mm:ss')}
                            </ThemedText>
                          ) : (
                            <ThemedText style={styles.shiftDuration}>
                              {duration < 0
                                ? `${t('misc_starts_in')}: `
                                : `${t('misc_delayed')}: `}
                              {hours > 0 ? `${hours} ${nonCap('misc_hour_short')} ` : ''}
                              {minutes} {nonCap('misc_min_short')}
                            </ThemedText>
                          )}
                        </TouchableOpacity>
                      );
                    })}

                  <ShiftSelectModal />
                </View>
              }}
              keyExtractor={(workplace) => workplace._id}
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
        )
      }
    </ThemedView >
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
    fontWeight: '600',
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
    fontSize: 16,
    fontWeight: '500',
  },
  companyDetail: {
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: 8,
  },
  shiftItem: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 6,
  },
  shiftText: {
    fontSize: 14,
    fontWeight: '500',
  },
  shiftDuration: {
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 2,
  },
});

export default TodayCompanies;
