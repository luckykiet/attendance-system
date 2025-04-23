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
import { DAYS_OF_WEEK, daysOfWeeksTranslations, TIME_FORMAT } from '@/constants/Days';
import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import useTranslation from '@/hooks/useTranslation';
import { Colors } from '@/constants/Colors';
import ThemedView from '@/components/theme/ThemedView';
import ThemedActivityIndicator from '@/components/theme/ThemedActivityIndicator';
import { calculateHoursFromMinutes, calculateKilometersFromMeters, getShiftHoursText, getStartEndTime, getWorkingHoursText } from '@/utils';
import { useColorScheme } from '@/hooks/useColorScheme';
import { PatternFormat } from 'react-number-format';
import { Shift } from '@/types/shift';
import { TodayWorkplace } from '@/types/workplaces';
import ShiftSelectModal from './ShiftSelectModal';
import { Attendance } from '@/types/attendance';
import { useNotificationScheduler } from '@/hooks/useNotificationScheduler';
import { SPECIFIC_BREAKS, specificBreakTranslations } from '@/constants/SpecificBreak';
import { cancelAllScheduledNotificationsAsync } from 'expo-notifications';
import ScrollToBottomButton from './ScrollToBottomButton';

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
  const now = dayjs();
  const todayKey = DAYS_OF_WEEK[now.day()];
  const yesterdayKey = DAYS_OF_WEEK[now.subtract(1, 'day').day()];
  const { scheduleNotificationIfNeeded } = useNotificationScheduler();
  const queryResults = useQueries({
    queries: urls.map((url) => ({
      queryKey: ['todayWorkplaces', location, appId, url],
      queryFn: () => getTodayWorkplaces(url, location),
      enabled: !!appId && urls.length > 0,
    })),
    combine: (results) => {
      const allWorkplaces = results
        .map((result) => result.data || [])
        .flat()
        .filter((workplace, index, self) => self.findIndex(c => c._id === workplace._id) === index);

      const duplicatedWorkplaces = allWorkplaces.flatMap((workplace) => {
        const yesterdayWorkingHours = workplace.workingHours[yesterdayKey];
        const todayWorkingHours = workplace.workingHours[todayKey];

        const yesterdayShifts = workplace.shifts[yesterdayKey] || [];
        const todayShifts = workplace.shifts[todayKey] || [];
        const hasTodayShift = todayShifts.length > 0;

        const activeYesterdayShifts = yesterdayShifts.filter((shift) => {
          const shiftTime = getStartEndTime({ start: shift.start, end: shift.end, isToday: false });

          if (!shiftTime) {
            return null;
          }
          const { startTime: start, endTime: end } = shiftTime

          const attendanceOfShift = workplace.attendances.find((attendance: Attendance) => attendance.shiftId === shift._id);

          // show unfinished shift
          if (attendanceOfShift?.checkInTime && !attendanceOfShift.checkOutTime) {
            return true;
          }

          return now.isBetween(start, end);
        });

        const entries = [];

        if (activeYesterdayShifts.length > 0) {
          const workingHoursText = getWorkingHoursText({
            workingHour: yesterdayWorkingHours,
            isToday: false,
            t,
          });

          if (!workingHoursText) {
            return null;
          }

          const { status, message } = workingHoursText;

          entries.push({
            ...workplace,
            shifts: activeYesterdayShifts.map((shift) => {
              const attendance = workplace.attendances.find((a) => a.shiftId === shift._id);

              let pendingStatus: 'none' | 'pause' | 'break' | 'attendance' = 'none';

              if (attendance) {
                if (attendance.breaks?.some(b => b.checkInTime && !b.checkOutTime)) {
                  pendingStatus = 'break';
                } else if (attendance.pauses?.some(p => p.checkInTime && !p.checkOutTime)) {
                  pendingStatus = 'pause';
                } else if (attendance.checkInTime && !attendance.checkOutTime) {
                  pendingStatus = 'attendance';
                }
              }

              return { ...shift, pendingStatus };
            }),
            isToday: false,
            distanceInMeters: workplace.distanceInMeters ? Math.round(workplace.distanceInMeters) : null,
            distanceLeft: workplace.distanceInMeters ? Math.round(workplace.location.allowedRadius - workplace.distanceInMeters) : null,
            openingHours: message,
            status,
          });
        }

        if (hasTodayShift) {
          const workingHourText = getWorkingHoursText({
            workingHour: todayWorkingHours,
            isToday: true,
            t,
          });

          if (!workingHourText) {
            return null;
          }

          const { status, message } = workingHourText

          entries.push({
            ...workplace,
            shifts: todayShifts.map((shift) => {
              const attendance = workplace.attendances.find((a) => a.shiftId === shift._id);

              let pendingStatus: 'none' | 'pause' | 'break' | 'attendance' = 'none';

              if (attendance) {
                if (attendance.breaks?.some(b => b.checkInTime && !b.checkOutTime)) {
                  pendingStatus = 'break';
                } else if (attendance.pauses?.some(p => p.checkInTime && !p.checkOutTime)) {
                  pendingStatus = 'pause';
                } else if (attendance.checkInTime && !attendance.checkOutTime) {
                  pendingStatus = 'attendance';
                }
              }

              return { ...shift, pendingStatus };
            }),
            isToday: true,
            distanceInMeters: workplace.distanceInMeters ? Math.round(workplace.distanceInMeters) : null,
            distanceLeft: workplace.distanceInMeters ? Math.round(workplace.location.allowedRadius - workplace.distanceInMeters) : null,
            openingHours: message,
            status,
          });
        }

        return entries;
      });
      cancelAllScheduledNotificationsAsync();
      return {
        isLoading: results.some((result) => result.isLoading),
        isFetching: results.some((result) => result.isFetching),
        data: duplicatedWorkplaces,
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

  const pendingShifts = queryResults.data.flatMap((workplace) => {
    if (!workplace) return [];
    return workplace.shifts.filter((shift) => {
      const attendance = workplace.attendances.find((a) => a.shiftId === shift._id);
      if (!attendance) return false;

      if (attendance.checkOutTime) return false;

      const shiftTime = getStartEndTime({ start: shift.start, end: shift.end });
      if (!shiftTime) return false;

      const { endTime: end } = shiftTime;

      const endTime = end.add(shift.allowedOverTime || 5, 'minute');
      const isShiftEnded = endTime && now.isAfter(endTime);

      if (isShiftEnded) {
        return false;
      }

      const pendingBreak = attendance.breaks.find((brk) => brk.checkInTime && !brk.checkOutTime);
      if (pendingBreak) {
        return true;
      }

      const pendingPause = attendance.pauses.find((pause) => pause.checkInTime && !pause.checkOutTime);
      if (pendingPause) {
        return true;
      }

      return attendance && attendance.checkInTime;
    }).map((shift) => ({
      shift,
      workplace,
    }))
  });

  useEffect(() => {
    pendingShifts.forEach(({ shift, workplace }) => {
      const shiftTime = getStartEndTime({ start: shift.start, end: shift.end, isToday: true });
      if (!shiftTime) return;

      const { endTime: end } = shiftTime;
      let endTime = end.clone();

      const attendance = workplace.attendances.find((a) => a.shiftId === shift._id);
      if (!attendance) return;

      let title = `${t('misc_shift_ending_soon_at')} ${workplace.name}`;
      let body = `${t('misc_do_not_forget_check_out_before')} ${endTime.format('HH:mm')}.`;

      const pendingBreak = attendance.breaks.find((brk) => brk.checkInTime && !brk.checkOutTime);

      if (pendingBreak) {
        endTime = dayjs(pendingBreak.checkInTime).add(pendingBreak.breakHours.duration, 'minute');
        const specificBreakType = SPECIFIC_BREAKS.find((specificBreak) => specificBreak === pendingBreak.type);
        if (specificBreakType) {
          title = `${t('misc_break_ending_soon_for')} ${t(specificBreakTranslations[specificBreakType].name)} - ${workplace.name}`;
        } else {
          title = `${t('misc_break_ending_soon_for')} ${t(pendingBreak.name)} - ${workplace.name}`;
        }
        body = `${t('misc_do_not_forget_finish_before')} ${endTime.format('HH:mm')}.`;
      }

      const pendingPause = attendance.pauses.find((pause) => pause.checkInTime && !pause.checkOutTime);

      if (pendingPause) {
        endTime = dayjs(pendingPause.checkInTime).add(60, 'minutes');
        title = `${t('misc_pending_pause')}: ${pendingPause.name} - ${workplace.name}`;
        body = `${t('misc_do_not_forget_finish_it')}!`;
      }

      scheduleNotificationIfNeeded({
        id: shift._id,
        title,
        body,
        scheduledTime: endTime,
        warningBeforeMinutes: 10,
      });
    });
  }, [pendingShifts]);

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
              renderItem={({ item: workplace, index }) => {
                const { kilometers, meters } = workplace.distanceInMeters ? calculateKilometersFromMeters(workplace.distanceInMeters) : { kilometers: 0, meters: 0 };
                const { kilometers: kmLeft, meters: mLeft } = workplace.distanceLeft ? calculateKilometersFromMeters(workplace.distanceLeft) : { kilometers: 0, meters: 0 };

                return <View key={index} style={styles.companyItem}>
                  {!workplace.isToday ? <ThemedText style={styles.companyDayText}>{t(daysOfWeeksTranslations[yesterdayKey].name)} - {now.subtract(1, 'day').format('DD.MM.')}</ThemedText> : <ThemedText style={styles.companyDayText}>{t('misc_today')} - {now.format('DD.MM.')}</ThemedText>}
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
                  <ThemedText style={styles.companyDetail}>
                    {t('misc_distance')}: {workplace.distanceInMeters ? `${kilometers > 0 ? `${kilometers} km ` : ''}${meters} m` : `${t('misc_getting_location')}...`}
                  </ThemedText>
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

                  {workplace.shifts
                    .sort((a: Shift, b: Shift) => dayjs(a.start, TIME_FORMAT).diff(dayjs(b.start, TIME_FORMAT)))
                    .map((shift: Shift, index: number) => {
                      const attendanceOfShift = workplace.attendances.find((attendance: Attendance) => attendance.shiftId === shift._id);
                      const shiftHoursText = getShiftHoursText({ shift, attendance: attendanceOfShift, isToday: workplace.isToday, t });
                      if (!shiftHoursText) {
                        return null;
                      }
                      const { status, message, duration, isCheckedIn } = shiftHoursText;
                      const { hours, minutes } = calculateHoursFromMinutes(Math.abs(duration));
                      const shiftTime = getStartEndTime({ start: shift.start, end: shift.end, isToday: workplace.isToday });
                      if (!shiftTime) {
                        return null;
                      }
                      const { endTime } = shiftTime
                      const isShiftEnded = endTime && now.isAfter(endTime.add(shift.allowedOverTime || 5, 'minute'));
                      const isShiftEndedWithoutCheckOut = isShiftEnded && !attendanceOfShift?.checkOutTime;
                      const finalStatus = isShiftEndedWithoutCheckOut ? 'out_of_time' : status;

                      return (
                        <TouchableOpacity
                          key={shift._id}
                          onPress={() => handleOpenShiftSelection({ shift, workplace })}
                          style={[
                            styles.shiftItem,
                            attendanceOfShift?.checkOutTime ? styles.finishedShift :
                              finalStatus === 'open'
                                ? { borderColor: Colors.success, backgroundColor: `${Colors.success}20` }
                                : finalStatus === 'warning'
                                  ? { borderColor: Colors.warning, backgroundColor: `${Colors.warning}20` }
                                  : { borderColor: Colors.error, backgroundColor: `${Colors.error}20` },
                          ]}
                        >
                          <ThemedText style={styles.shiftText}>
                            {t('misc_shift')} {index + 1}: {message}
                          </ThemedText>

                          {shift.pendingStatus !== 'none' && (
                            <MaterialIcons
                              name={
                                shift.pendingStatus === 'pause' ? 'pause-circle-outline'
                                  : shift.pendingStatus === 'break' ? 'free-breakfast'
                                    : 'schedule'
                              }
                              size={18}
                              color={
                                shift.pendingStatus === 'pause' ? Colors.warning
                                  : shift.pendingStatus === 'break' ? Colors.info
                                    : Colors.primary
                              }
                              style={{ position: 'absolute', top: 6, right: 6 }}
                            />
                          )}

                          {attendanceOfShift?.checkOutTime ? (
                            <ThemedText style={[styles.shiftDuration, styles.finishedText]}>
                              {t('misc_finished')}: {dayjs(attendanceOfShift.checkOutTime).format('DD/MM/YYYY HH:mm:ss')}
                            </ThemedText>
                          ) : (
                            <>
                              {isCheckedIn && (
                                <ThemedText style={styles.shiftDuration}>
                                  {t('misc_check_in')}: {dayjs(attendanceOfShift.checkInTime).format('DD/MM/YYYY HH:mm:ss')}
                                </ThemedText>
                              )}
                              {isShiftEndedWithoutCheckOut ? <ThemedText style={[styles.shiftDuration, { color: Colors.error }]}>
                                {t('srv_shift_already_ended')}: {dayjs(endTime).format('DD/MM/YYYY HH:mm:ss')}
                              </ThemedText> : <ThemedText style={styles.shiftDuration}>
                                {duration < 0
                                  ? isCheckedIn ? `${t('misc_until_the_end')}: ` : `${t('misc_starts_in')}: `
                                  : isCheckedIn
                                    ? `${t('misc_since_the_end')}: `
                                    : `${t('misc_delayed')}: `}
                                {hours > 0 ? `${hours} ${nonCap('misc_hour_short')} ` : ''}
                                {minutes} {nonCap('misc_min_short')}
                              </ThemedText>
                              }

                            </>
                          )}
                        </TouchableOpacity>
                      );
                    })}

                  <ShiftSelectModal />
                </View>
              }}
              keyExtractor={(workplace, index) => `${workplace._id}-${workplace.isToday ? 'y' : 't'}-${index}`}
              onScroll={handleScroll}
              scrollEventThrottle={16}
            />
            {showScrollArrow && <ScrollToBottomButton onPress={scrollToBottom} />}
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
    marginVertical: 5,
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
  companyDayText: {
    fontSize: 18,
    fontWeight: 'bold',
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
  finishedShift: {
    borderColor: Colors.secondary,
    backgroundColor: `${Colors.secondary}20`,
  },

  finishedText: {
    color: Colors.secondary,
    textDecorationLine: 'line-through',
  },
});

export default TodayCompanies;
