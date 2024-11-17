import { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useMutation, useQueries } from '@tanstack/react-query';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import customParseFormat from 'dayjs/plugin/customParseFormat';

import { useAppStore } from '@/stores/useAppStore';
import { useCompaniesApi } from '@/api/useCompaniesApi';
import ThemedText from '@/components/theme/ThemedText';
import { DAYS_OF_WEEK, TIME_FORMAT } from '@/constants/Days';
import { WorkingHour } from '@/types/working-hour';
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

dayjs.extend(isBetween);
dayjs.extend(customParseFormat);

type WorkingHours = Record<string, WorkingHour>;

interface Company {
  _id: string;
  name: string;
  location: Location & { allowedRadius: number },
  workingHours: WorkingHours;
  employeeWorkingHours: WorkingHours;
  distanceInMeters: number;
  checkInTime: string | null;
  checkOutTime: string | null;
  domain: string;
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
    return { status: 'closed', message: 'misc_today_closed' };
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

const NearbyCompanies = () => {
  const { t } = useTranslation();
  const nonCap = useTranslation({ capitalize: false });
  const { location, appId, urls, isGettingLocation } = useAppStore();
  const { getNearbyCompanies } = useCompaniesApi();
  const { logAttendance } = useAttendanceApi();

  const scrollViewRef = useRef<FlatList>(null);
  const [showScrollArrow, setShowScrollArrow] = useState(false);

  const makeAttendanceMutation = useMutation(
    {
      mutationFn: (data: AttendanceMutation) => logAttendance(data),
      onSuccess: (data) => Alert.alert(t('misc_attendance_success'), t(data)),
      onError: (error) => Alert.alert(t('misc_attendance_failed'), t(typeof error === 'string' ? error : 'srv_failed_to_make_attendance')),
    }
  )

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
      const { message: employeeWorkingHourMessage } = getTodayWorkingHours(company.employeeWorkingHours);
      const attendanceStatus = getAttendanceStatus({ checkInTime: company.checkInTime, checkOutTime: company.checkOutTime, workingHours: company.employeeWorkingHours });
      return {
        ...company,
        openingHours: t(message),
        status,
        distanceInMeters: Math.round(company.distanceInMeters),
        distanceLeft: Math.round(company.location.allowedRadius - company.distanceInMeters),
        checkInTimeStatus: attendanceStatus.checkInTime,
        checkOutTimeStatus: attendanceStatus.checkOutTime,
        employeeWorkingHour: employeeWorkingHourMessage
      };
    });

  const handleAttendance = async (company: Company) => {
    const { _id: registerId, domain, checkInTime } = company;

    Alert.alert(
      t(_.isEmpty(checkInTime) ? 'misc_confirm_check_in' : 'misc_confirm_check_out'),
      `${t('misc_cannot_revert_action')}!`,
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
              Alert.alert(t('misc_error'), t('misc_location_not_found'));
              return;
            }
            makeAttendanceMutation.mutate({ registerId, deviceKey, domain, longitude: location.longitude, latitude: location.latitude });
          },
        },
      ],
      { cancelable: true }
    );
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
            renderItem={({ item: company }) => {
              return <TouchableOpacity onPress={() => handleAttendance({ ...company, registerId: company._id })}>
                <View key={company._id} style={styles.companyItem}>
                  <ThemedText style={styles.companyText}>{company.name}</ThemedText>
                  <ThemedText style={styles.companyDetail}>
                    {company.address.street}, {company.address.zip} {company.address.city}
                  </ThemedText>
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

                  <View style={styles.divider} />

                  <ThemedText style={styles.companyDetail}>
                    {t('misc_my_working_hours')}: {company.employeeWorkingHour}
                  </ThemedText>
                  {!_.isEmpty(company.checkInTime) && dayjs(company.checkInTime).isValid() && <ThemedText style={styles.companyDetail}>{t('misc_check_in')}: {dayjs(company.checkInTime).format('HH:mm:ss')} -&nbsp;
                    <ThemedText style={[
                      styles.companyDetail,
                      isNaN(company.checkInTimeStatus) ? { color: Colors.success } : { color: Colors.error },
                    ]}>
                      {isNaN(company.checkInTimeStatus) ? t(company.checkInTimeStatus) : `${company.checkInTimeStatus} ${nonCap.t('misc_min_short')} ${nonCap.t('misc_late')}`}
                    </ThemedText>
                  </ThemedText>}
                  {!_.isEmpty(company.checkOutTime) && dayjs(company.checkOutTime).isValid() && <ThemedText style={styles.companyDetail}>{t('misc_check_out')}: {dayjs(company.checkOutTime).format('HH:mm:ss')} -&nbsp;
                    <ThemedText style={[
                      styles.companyDetail,
                      isNaN(company.checkOutTimeStatus) ? { color: Colors.success } : { color: Colors.error },
                    ]}>
                      {isNaN(company.checkOutTimeStatus) ? t(company.checkOutTimeStatus) : `${Math.abs(company.checkOutTimeStatus)} ${nonCap.t('misc_min_short')} ${nonCap.t('misc_early')}`}
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
  divider: {
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: 8,
  },
});

export default NearbyCompanies;
