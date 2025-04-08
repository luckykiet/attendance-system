import { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useMutation, useQueries } from '@tanstack/react-query';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import utc from 'dayjs/plugin/utc';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAppStore } from '@/stores/useAppStore';
import { useCompaniesApi } from '@/api/useCompaniesApi';
import ThemedText from '@/components/theme/ThemedText';
import { DAYS_OF_WEEK, TIME_FORMAT } from '@/constants/Days';
import * as SecureStore from 'expo-secure-store';
import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import useTranslation from '@/hooks/useTranslation';
import { Colors } from '@/constants/Colors';
import ThemedView from '@/components/theme/ThemedView';
import ThemedActivityIndicator from '@/components/theme/ThemedActivityIndicator';
import { useAttendanceApi } from '@/api/useAttendanceApi';
import { AttendanceMutation } from '@/types/attendance';
import _ from 'lodash';
import { calculateHoursFromMinutes, calculateKilometersFromMeters } from '@/utils';
import { useColorScheme } from '@/hooks/useColorScheme';
import BLEScanModal from '@/components/BLEScanModal';
import { Shift } from '@/types/shift';

dayjs.extend(isBetween);
dayjs.extend(utc);
dayjs.extend(customParseFormat);

const getShiftsText = (shift: Shift): { status: string; message: string } => {
  const currentTime = dayjs.utc();
  const openTime = dayjs.utc(shift.start, TIME_FORMAT);
  let closeTime = dayjs.utc(shift.end, TIME_FORMAT);

  if (shift.isOverNight && closeTime.isBefore(openTime)) {
    closeTime = closeTime.add(1, 'day');
  }

  const warningTime = openTime.subtract(1, 'hour');

  const inShiftTime = currentTime.isAfter(openTime) && currentTime.isBefore(closeTime);
  const inWarningTime = currentTime.isAfter(warningTime) && currentTime.isBefore(openTime);

  if (inShiftTime) {
    return { status: 'open', message: `${shift.start} - ${shift.end}` };
  } else if (inWarningTime) {
    return { status: 'warning', message: `${shift.start} - ${shift.end}` };
  }

  return { status: 'out_of_time', message: `${shift.start} - ${shift.end}` };
};


type AttendanceStatus = { checkInTime: string | number | null; checkOutTime: string | number | null };

const getAttendanceStatus = ({ checkInTime = null, checkOutTime = null, workingHours }: { checkInTime: string | null; checkOutTime: string | null, workingHours: WorkingHours }): AttendanceStatus => {
  const result: AttendanceStatus = { checkInTime: null, checkOutTime: null };
  if (!checkInTime && !checkOutTime) {
    return result;
  }
  const todayIndex = dayjs().day();
  const todayKey = DAYS_OF_WEEK[todayIndex];
  const hours = workingHours[todayKey];

  if (!hours?.isAvailable) {
    return result;
  }

  const checkIn = dayjs(checkInTime);
  const checkOut = dayjs(checkOutTime);

  const openTime = dayjs(hours.start, TIME_FORMAT);
  const closeTime = dayjs(hours.end, TIME_FORMAT);

  if (checkIn.isValid()) {
    if (checkIn.isBefore(openTime) || checkIn.isSame(openTime)) {
      result.checkInTime = "misc_checked_in_on_time";
    } else {
      const lateDiff = checkIn.diff(openTime, 'minute');
      result.checkInTime = lateDiff;
    }
  }

  if (checkOut.isValid()) {
    if (checkOut.isAfter(closeTime) || checkOut.isSame(closeTime)) {
      result.checkOutTime = "misc_checked_out_on_time";
    } else {
      const earlyDiff = checkOut.diff(closeTime, 'minute');
      result.checkOutTime = earlyDiff;
    }
  }
  return result;
};

const TodayCompanies = () => {
  const { t } = useTranslation();
  const nonCap = useTranslation({ capitalize: false });
  const { location, appId, urls, isGettingLocation, setLocalDevices } = useAppStore();
  const { getTodayWorkplaces } = useCompaniesApi();
  const { logAttendance } = useAttendanceApi();
  const colorScheme = useColorScheme();
  const [pendingAttendance, setPendingAttendance] = useState<AttendanceMutation | null>(null);
  const scrollViewRef = useRef<FlatList>(null);
  const [showScrollArrow, setShowScrollArrow] = useState(false);

  const makeAttendanceMutation = useMutation(
    {
      mutationFn: (data: AttendanceMutation) => logAttendance(data),
      onSuccess: (data) => {
        if (data.localDevices) {
          setLocalDevices(data.localDevices);
        } else {
          Alert.alert(t('misc_attendance_success'), t(data.msg))
          setPendingAttendance(null);
          queryResults.refetch();
        }
      },
      onError: (error) => Alert.alert(t('misc_attendance_failed'), t(typeof error === 'string' ? error : 'srv_failed_to_make_attendance')),
    }
  )

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
          .filter((company, index, self) => self.findIndex(c => c._id === company._id) === index)
          .map((company) => {
            const shiftTexts = Object.values(company.shifts).map((shifts) => shifts.map((shift)=>{
              const { status, message } = getShiftsText(shift);
              return { status, message, _id: shift._id };
            })).flat();
            // const { message: employeeWorkingHourMessage } = getTodayWorkingHours(company.employeeWorkingHours);
            // const attendanceStatus = getAttendanceStatus({ checkInTime: company.checkInTime, checkOutTime: company.checkOutTime, workingHours: company.employeeWorkingHours });
            return {
              ...company,
              distanceInMeters: company.distanceInMeters ? Math.round(company.distanceInMeters) : null,
              distanceLeft: company.distanceInMeters ? Math.round(company.location.allowedRadius - company.distanceInMeters) : null,
            };
          }),
        refetch: () => results.forEach((result) => result.refetch()),
      };
    }
  });

  const handleAttendance = async (company: Company) => {
    const { _id: registerId, domain, checkInTime, checkOutTime, employeeWorkingHours } = company;

    // Proceed with attendance
    if (checkInTime && checkOutTime) {
      Alert.alert(t('srv_already_checked_out'), t('misc_cannot_revert_action'));
      return;
    }

    const biometricEnabled = await SecureStore.getItemAsync('biometricEnabled');
    if (biometricEnabled === 'true') {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        Alert.alert(t('misc_error'), t('srv_biometric_permissions_disabled'));
        return;
      }

      const biometricResult = await LocalAuthentication.authenticateAsync({
        promptMessage: t('misc_authenticate_to_continue'),
        cancelLabel: t('misc_cancel'),
      });

      if (!biometricResult.success) {
        Alert.alert(t('srv_authentication_failed'), t('srv_please_try_again'));
        return;
      }
    }

    const todayIndex = dayjs().day();
    const todayKey = DAYS_OF_WEEK[todayIndex];
    const wh = employeeWorkingHours[todayKey];

    const currentTime = dayjs();
    const openTime = dayjs(wh.start, TIME_FORMAT);
    const closeTime = dayjs(wh.end, TIME_FORMAT);

    let diff = 0;
    let text = `${t('misc_cannot_revert_action')}!`;

    if (_.isEmpty(checkInTime)) {
      diff = currentTime.diff(openTime, 'minute');
      if (currentTime.isBefore(openTime)) {
        text += `\n${t('misc_early')}: `;
      } else {
        text += `\n${t('misc_late')}: `;
      }
    } else {
      diff = currentTime.diff(closeTime, 'minute');
      if (currentTime.isBefore(closeTime)) {
        text += `\n${t('misc_early')}: `;
      } else {
        text += `\n${t('misc_late')}: `;
      }
    }

    const { hours, minutes } = calculateHoursFromMinutes(diff);
    text += `${hours} ${nonCap.t('misc_hour_short')} ${minutes} ${nonCap.t('misc_min_short')}`;

    Alert.alert(
      t(_.isEmpty(checkInTime) ? 'misc_confirm_check_in' : 'misc_confirm_check_out'),
      text,
      [
        {
          text: t('misc_cancel'),
          style: 'cancel',
        },
        {
          text: t('misc_confirm'),
          onPress: async () => {
            const deviceKey = await SecureStore.getItemAsync('deviceKey');
            if (!deviceKey) {
              Alert.alert(t('misc_error'), t('misc_you_must_register_device'));
              return;
            }
            if (!location || isNaN(location.longitude) || isNaN(location.latitude)) {
              Alert.alert(t('misc_error'), t('srv_location_required_to_make_attendance'));
              return;
            }
            const attendance: AttendanceMutation = { registerId, deviceKey, domain, longitude: location.longitude, latitude: location.latitude };
            setPendingAttendance(attendance);
            makeAttendanceMutation.mutate(attendance);
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleScanResult = (result: boolean, foundDevices: string[]) => {
    if (result && pendingAttendance) {
      makeAttendanceMutation.mutate({ ...pendingAttendance, localDeviceId: foundDevices[0] });
    }
  };

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
      <BLEScanModal onResult={handleScanResult} />
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
              renderItem={({ item: company }) => {
                const { kilometers, meters } = company.distanceInMeters ? calculateKilometersFromMeters(company.distanceInMeters) : { kilometers: 0, meters: 0 };
                const { kilometers: kmLeft, meters: mLeft } = company.distanceLeft ? calculateKilometersFromMeters(company.distanceLeft) : { kilometers: 0, meters: 0 };
                const { hours: checkOutH, minutes: checkOutM } = company.checkOutTimeStatus ? calculateHoursFromMinutes(company.checkOutTimeStatus) : { hours: 0, minutes: 0 };
                const { hours: checkInH, minutes: checkInM } = company.checkInTimeStatus ? calculateHoursFromMinutes(company.checkInTimeStatus) : { hours: 0, minutes: 0 };

                return <TouchableOpacity onPress={() => handleAttendance({ ...company, registerId: company._id })}>
                  <View key={company._id} style={styles.companyItem}>
                    <ThemedText style={styles.companyText}>{company.name}</ThemedText>
                    <ThemedText style={styles.companyDetail}>
                      {company.address.street}, {company.address.zip} {company.address.city}
                    </ThemedText>
                    {company.status !== 'closed' && <ThemedText style={styles.companyDetail}>
                      {t('misc_working_hours')}: {company.openingHours}
                    </ThemedText>}
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
                    {company.distanceInMeters && <ThemedText style={styles.companyDetail}>
                      {t('misc_distance')}: {kilometers > 0 ? `${kilometers} km` : ''} {`${meters} m`}
                    </ThemedText>}
                    {company.distanceInMeters && <ThemedText
                      style={[
                        styles.companyDetail,
                        company.distanceLeft > 0 ? { color: Colors.success } : { color: Colors.error },
                      ]}
                    >
                      {t('misc_distance_left')}: {company.distanceLeft > 0 ? '-' : ''}{kmLeft > 0 ? `${kmLeft} km ` : ''}{`${mLeft} m`}
                    </ThemedText>}

                    <View style={styles.divider} />

                    <ThemedText style={styles.companyDetail}>
                      {t('misc_my_working_hours')}: {company.employeeWorkingHour}
                    </ThemedText>
                    {!_.isEmpty(company.checkInTime) && dayjs(company.checkInTime).isValid() && <ThemedText style={styles.companyDetail}>{t('misc_check_in')}: {dayjs(company.checkInTime).format('HH:mm:ss')} -&nbsp;
                      <ThemedText style={[
                        styles.companyDetail,
                        isNaN(company.checkInTimeStatus) ? { color: Colors.success } : { color: Colors.error },
                      ]}>
                        {isNaN(company.checkInTimeStatus) ? t(company.checkInTimeStatus) : `${checkInH > 0 ? `${checkInH} ${nonCap.t('misc_hour_short')} ` : ''}${checkInM} ${nonCap.t('misc_min_short')} ${nonCap.t('misc_late')}`}
                      </ThemedText>
                    </ThemedText>}
                    {!_.isEmpty(company.checkOutTime) && dayjs(company.checkOutTime).isValid() && <ThemedText style={styles.companyDetail}>{t('misc_check_out')}: {dayjs(company.checkOutTime).format('HH:mm:ss')} -&nbsp;
                      <ThemedText style={[
                        styles.companyDetail,
                        isNaN(company.checkOutTimeStatus) ? { color: Colors.success } : { color: Colors.error },
                      ]}>
                        {isNaN(company.checkOutTimeStatus) ? t(company.checkOutTimeStatus) : `${checkOutH > 0 ? `${checkOutH} ${nonCap.t('misc_hour_short')} ` : ''}${checkOutM} ${nonCap.t('misc_min_short')} ${nonCap.t('misc_early')}`}
                      </ThemedText>
                    </ThemedText>}
                  </View>
                </TouchableOpacity>
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
});

export default TodayCompanies;
