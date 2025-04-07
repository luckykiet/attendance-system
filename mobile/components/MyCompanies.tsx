import { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useMutation, useQueries } from '@tanstack/react-query';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

import { useAppStore } from '@/stores/useAppStore';
import { useCompaniesApi } from '@/api/useCompaniesApi';
import ThemedText from '@/components/theme/ThemedText';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import useTranslation from '@/hooks/useTranslation';
import ThemedView from '@/components/theme/ThemedView';
import ThemedActivityIndicator from '@/components/theme/ThemedActivityIndicator';
import { DayKey, DAYS_OF_WEEK, daysOfWeeksTranslations } from '@/constants/Days';
import { useColorScheme } from '@/hooks/useColorScheme';
import { GetMyCompaniesResult } from '@/types/workplaces';
import { useEmployeeApi } from '@/api/useEmployeeApi';
import * as SecureStore from 'expo-secure-store';
import { Shift } from '@/types/shift';

dayjs.extend(customParseFormat);

type CombinedRegister = GetMyCompaniesResult['registers'][number] & {
  employee?: GetMyCompaniesResult['employees'][number];
  workingAt?: GetMyCompaniesResult['workingAts'][number];
};

type CombinedRetail = GetMyCompaniesResult['retails'][number] & {
  registers: CombinedRegister[];
  domain: string;
}

export type CancelDevicePairingMutation = { domain: string, retailId: string, deviceKey: string }

const isShiftsEmpty = (shifts: Record<DayKey, Shift[]>): boolean => {
  return Object.values(shifts).every((shiftArray) => shiftArray.length === 0);
};

const MyCompanies = () => {
  const { t } = useTranslation();
  const { appId, urls, isGettingLocation, location } = useAppStore();
  const { getMyCompanies } = useCompaniesApi();
  const { cancelDevicePairing } = useEmployeeApi();
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
    combine: (results) => {
      const combinedData: CombinedRetail[] = results
        .map((result) => result.data)
        .filter((data): data is GetMyCompaniesResult => !!data)
        .flatMap((data) => {
          const { registers, workingAts, employees, domain, retails } = data;

          if (!retails) return [];

          return retails.map((retail) => {
            const combinedRegisters: CombinedRegister[] = registers
              .filter((reg) => reg.retailId === retail._id)
              .map((register) => ({
                ...register,
                workingAt: workingAts.find((wa) => wa.registerId === register._id),
                employee: employees.find((emp) => emp.retailId === retail._id),
              }));

            return {
              ...retail,
              registers: combinedRegisters,
              domain,
            };
          });
        });

      return {
        isLoading: results.some((r) => r.isLoading),
        isFetching: results.some((r) => r.isFetching),
        data: combinedData,
        refetch: () => results.forEach((r) => r.refetch()),
      };
    }
  });

  const cancelPairingMutation = useMutation<string, Error, CancelDevicePairingMutation>({
    mutationFn: (formData) => cancelDevicePairing(formData),
    onSuccess: (data) => {
      Alert.alert(t('misc_cancel_pairing_succeed'), t(data))
      queryResults.refetch();
    },
    onError: (error) => Alert.alert(t('misc_device_pairing_failed'), t(typeof error === 'string' ? error : 'srv_failed_to_cancel_pairing')),
  });

  const handleScroll = (event: { nativeEvent: { contentSize: { height: number; width: number }; layoutMeasurement: { height: number; width: number }; contentOffset: { x: number; y: number } } }) => {
    const { contentSize, layoutMeasurement, contentOffset } = event.nativeEvent;
    const isScrolledToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;

    setShowScrollArrow(!isScrolledToBottom);
  };

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  const handleCancelPairing = (formData: { domain: string, retailId: string, name: string }) => {
    const text = `${t('misc_cannot_revert_action')}!`;

    Alert.alert(
      t('misc_confirm_cancel_device_pairing'),
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

            const form = {
              ...formData,
              deviceKey
            }

            cancelPairingMutation.mutate(form);
          },
        },
      ],
      { cancelable: true }
    );
  }

  useEffect(() => {
    if (location) {
      queryResults.refetch();
    }
  }, [location]);

  return (
    <ThemedView style={styles.nearbyContainer}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="subtitle" style={styles.nearbyLabel}>{t('misc_workplaces')}:</ThemedText>
        <TouchableOpacity onPress={() => queryResults.refetch()} style={styles.refreshButton}>
          <MaterialIcons name="refresh" size={24} color={colorScheme === 'light' ? "black" : "white"} />
        </TouchableOpacity>
      </ThemedView>
      {(queryResults.isLoading || queryResults.isFetching || isGettingLocation) && <ThemedActivityIndicator size={'large'} />}
      {queryResults.data.length > 0 ? (
        <>
          <FlatList
            ref={scrollViewRef}
            style={styles.scrollView}
            data={queryResults.data}
            keyExtractor={(retail) => retail._id}
            renderItem={({ item, index }: { item: CombinedRetail, index: number }) => {
              const isLastItem = index === queryResults.data.length - 1;
              return (
                <View key={item._id} style={styles.retailContainer}>
                  <View style={styles.retailHeader}>
                    <ThemedText style={styles.companyText}>{item.name}</ThemedText>
                    {item.tin && <ThemedText style={styles.companyDetail}>{t('misc_tin')}: {item.tin}</ThemedText>}
                    {item.vin && <ThemedText style={styles.companyDetail}>{t('misc_vin')}: {item.vin}</ThemedText>}
                    <ThemedText style={styles.companyDetail}>{item.address.street}</ThemedText>
                    <ThemedText style={styles.companyDetail}>
                      {item.address.zip} {item.address.city}
                    </ThemedText>
                    <TouchableOpacity
                      style={styles.unpairButton}
                      onPress={() =>
                        handleCancelPairing({
                          domain: item.domain,
                          retailId: item._id,
                          name: item.name,
                        })
                      }
                    >
                      <Ionicons name="unlink" size={20} color="red" />
                    </TouchableOpacity>
                  </View>
                  {item.registers.map((register) => {
                    const { employee, workingAt } = register;
                    return (
                      <View key={register._id} style={styles.companyItem}>
                        <ThemedText style={styles.companyText}>{register.name}</ThemedText>
                        <ThemedText style={styles.companyDetail}>{register.address.street}</ThemedText>
                        <ThemedText style={styles.companyDetail}>
                          {register.address.zip} {register.address.city}
                        </ThemedText>

                        <ThemedText style={styles.nearbyLabel}>{t('misc_working_hours')}:</ThemedText>
                        {DAYS_OF_WEEK.map((day) => {
                          const dayOfWeek = daysOfWeeksTranslations[day];
                          const workingHour = register.workingHours[day];
                          const isToday = day === todayKey;

                          return (
                            <View
                              key={day}
                              style={[styles.row]}
                            >
                              <ThemedText style={[styles.dayLabel, isToday && styles.today]}>
                                {dayOfWeek?.name ? t(dayOfWeek.name) : day}
                              </ThemedText>
                              <ThemedText style={[styles.hoursText, isToday && styles.today]}>
                                {workingHour?.isAvailable
                                  ? `${workingHour.start} - ${workingHour.end}${workingHour.isOverNight ? ` (${t('misc_over_night')})` : ''}`
                                  : t('misc_closed')}
                              </ThemedText>
                            </View>
                          );
                        })}

                        {employee && (
                          <>
                            <View style={styles.divider} />
                            <ThemedText style={styles.nearbyLabel}>{t('misc_my_profile')}</ThemedText>
                            <View style={styles.employeeContainer}>
                              <ThemedText style={styles.employeeName}>
                                {t('misc_full_name')}: {employee.name}
                              </ThemedText>
                              {workingAt?.position && (
                                <ThemedText style={styles.employeeDetail}>
                                  {t('misc_position')}: {workingAt.position}
                                </ThemedText>
                              )}
                              <ThemedText style={styles.employeeDetail}>
                                {t('misc_email')}: {employee.email}
                              </ThemedText>
                              <ThemedText style={styles.employeeDetail}>
                                {t('misc_telephone')}: {employee.phone}
                              </ThemedText>
                            </View>
                          </>
                        )}

                        <View style={styles.divider} />
                        <ThemedText style={styles.nearbyLabel}>{t('misc_my_working_hours')}:</ThemedText>
                        {workingAt?.shifts && !isShiftsEmpty(workingAt.shifts) ? (
                          Object.entries(workingAt.shifts).flatMap(([day, shifts]) => {
                            const dayKey = day as DayKey;
                            const sortedShifts = [...shifts].sort((a, b) =>
                              dayjs(a.start, 'HH:mm').unix() - dayjs(b.start, 'HH:mm').unix()
                            );

                            return sortedShifts.map((shift, index) => {
                              const { start, end, isOverNight } = shift;
                              const dayOfWeek = daysOfWeeksTranslations[dayKey];
                              const isToday = dayKey === todayKey;

                              return (
                                <View
                                  key={`${dayKey}-${index}-${start}-${end}`}
                                  style={[styles.row]}
                                >
                                  <ThemedText style={[styles.dayLabel, isToday && styles.today]}>
                                    {dayOfWeek?.name ? t(dayOfWeek.name) : dayKey}
                                  </ThemedText>
                                  <ThemedText style={[styles.hoursText, isToday && styles.today]}>
                                    {`${start} - ${end}${isOverNight ? ` (${t('misc_over_night')})` : ''}`}
                                  </ThemedText>
                                </View>
                              );
                            });
                          })
                        ) : (
                          <ThemedText style={styles.companyDetail}>
                            {t('misc_you_have_no_shift_assigned')}
                          </ThemedText>
                        )}

                      </View>
                    );
                  })}
                  {!isLastItem && <View style={styles.divider} />}
                </View>
              );
            }}
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
  retailContainer: {

  },
  employeeContainer: {
    marginVertical: 8,
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
    marginTop: 10,
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
  },
  employeeName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  employeeDetail: {
    fontSize: 14,
  },
  unpairButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    zIndex: 1,
    padding: 4,
  },
  retailHeader: {
    padding: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dayLabel: {
    width: 100,
    fontWeight: 'bold',
  },
  hoursText: {
    flex: 1,
  },
});

export default MyCompanies;
