import React, { Fragment, useState } from 'react';
import { Modal, View, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import ThemedText from './theme/ThemedText';
import { Colors } from '@/constants/Colors';
import useTranslation from '@/hooks/useTranslation';
import { useAppStore } from '@/stores/useAppStore';
import { calculateHoursFromMinutes, checkBiometric, getAttendanceStatus, getShiftHoursText, getStartEndTime, isBreakWithinShift } from '@/utils';
import ThemedView from './theme/ThemedView';
import dayjs from 'dayjs';
import { DAYS_OF_WEEK, daysOfWeeksTranslations, TIME_FORMAT } from '@/constants/Days';
import { SPECIFIC_BREAKS, specificBreakTranslations } from '@/constants/SpecificBreak';
import { BreakMutation, Breaks } from '@/types/breaks';
import { ScrollView } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { AttendanceMutation } from '@/types/attendance';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAttendanceApi } from '@/api/useAttendanceApi';
import BLEScanModal from './BLEScanModal';
import _ from 'lodash';
import { SpecificBreakMutation, SpecificBreakTypes } from '@/types/specific-break';
import { useSpecificBreakApi } from '@/api/useSpecificBreakApi';
import { useBreakApi } from '@/api/useBreakApi';

const ShiftSelectModal = () => {
    const queryClient = useQueryClient();
    const { t } = useTranslation();
    const { t: noCapT } = useTranslation({ capitalize: false });
    const { selectedShift, setSelectedShift, location, setLocalDevices } = useAppStore();
    const { logAttendance } = useAttendanceApi();
    const { applySpecificBreak } = useSpecificBreakApi();
    const { applyBreak } = useBreakApi();
    const [pendingAttendance, setPendingAttendance] = useState<AttendanceMutation | null>(null);

    const makeAttendanceMutation = useMutation(
        {
            mutationFn: (data: AttendanceMutation) => logAttendance(data),
            onSuccess: (data) => {
                if (data.localDevices) {
                    setLocalDevices(data.localDevices);
                } else {
                    queryClient.invalidateQueries({ queryKey: ['todayWorkplaces'] });
                    Alert.alert(t('misc_attendance_success'), t(data.msg))
                    setPendingAttendance(null);
                    setSelectedShift(null);
                }
            },
            onError: (error) => {
                setPendingAttendance(null);
                Alert.alert(t('misc_attendance_failed'), t(typeof error === 'string' ? error : 'srv_failed_to_make_attendance'))
            },
        }
    )

    const applySpecificBreakMutation = useMutation(
        {
            mutationFn: (data: SpecificBreakMutation) => applySpecificBreak(data),
            onSuccess: (data) => {
                if (data.localDevices) {
                    setLocalDevices(data.localDevices);
                } else {
                    queryClient.invalidateQueries({ queryKey: ['todayWorkplaces'] });
                    Alert.alert(t('misc_break_submitted'), t(data.msg))
                    setPendingAttendance(null);
                    setSelectedShift(null);
                }
            },
            onError: (error) => {
                setPendingAttendance(null);
                Alert.alert(t('misc_break_submission_failed'), t(typeof error === 'string' ? error : 'srv_failed_to_submit_break'))
            },
        }
    )

    const applyBreakMutation = useMutation(
        {
            mutationFn: (data: BreakMutation) => applyBreak(data),
            onSuccess: (data) => {
                if (data.localDevices) {
                    setLocalDevices(data.localDevices);
                } else {
                    queryClient.invalidateQueries({ queryKey: ['todayWorkplaces'] });
                    Alert.alert(t('misc_break_submitted'), t(data.msg))
                    setPendingAttendance(null);
                    setSelectedShift(null);
                }
            },
            onError: (error) => {
                setPendingAttendance(null);
                Alert.alert(t('misc_break_submission_failed'), t(typeof error === 'string' ? error : 'srv_failed_to_submit_break'))
            },
        }
    )

    if (!selectedShift) return null;

    const workplace = selectedShift.workplace;
    const shift = selectedShift.shift;
    const attendance = workplace.attendances.find(att => att.shiftId === shift._id);

    const attendanceStatus = attendance ? getAttendanceStatus({
        checkInTime: attendance.checkInTime?.toString(),
        checkOutTime: attendance.checkOutTime?.toString(),
        shift: shift,
        isToday: workplace.isToday,
        t,
        noCapT,
    }) : null;

    const { startTime: shiftStartTime, endTime: shiftEndTime } = getStartEndTime({ start: shift.start, end: shift.end, isToday: workplace.isToday });

    const handleCheckIn = async () => {
        if (selectedShift) {
            const { _id: registerId, retailId, domain, attendances } = workplace;
            const { _id: shiftId } = shift;

            const attendance = attendances.find(att => att.shiftId === shiftId);
            if (attendance && attendance.checkInTime && attendance.checkOutTime) {
                Alert.alert(t('srv_already_checked_out'), t('misc_cannot_revert_action'));
                return;
            }

            const biometricEnabled = await SecureStore.getItemAsync('biometricEnabled');

            if (biometricEnabled === 'true') {
                const result = await checkBiometric(t);

                if (!result.success) {
                    if (_.isObject(result.msg)) {
                        Alert.alert(t(result.msg.title), t(result.msg.message));
                        return;
                    }
                    Alert.alert(t('srv_authentication_failed'), t('srv_please_try_again'));
                    return;
                }
            }

            const currentTime = dayjs();
            const { startTime: openTime, endTime: closeTime } = getStartEndTime({ start: shift.start, end: shift.end, isToday: workplace.isToday });

            let diff = 0;
            let text = `${t('misc_cannot_revert_action')}!`;
            const checkInTime = attendance?.checkInTime;

            if (!checkInTime) {
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
            text += `${hours} ${noCapT('misc_hour_short')} ${minutes} ${noCapT('misc_min_short')}`;

            Alert.alert(
                t(!checkInTime ? 'misc_confirm_check_in' : 'misc_confirm_check_out'),
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
                            const form: AttendanceMutation = { registerId, retailId, deviceKey, domain, longitude: location.longitude, latitude: location.latitude, shiftId, attendanceId: attendance ? attendance._id : null, };

                            setPendingAttendance(form);
                            makeAttendanceMutation.mutate(form);
                        },
                    },
                ],
                { cancelable: true }
            );
        }
    };

    const handleSpecificBreakSubmit = async ({ breakKey, _id }: { breakKey: SpecificBreakTypes, _id?: string }) => {
        if (selectedShift) {
            const { _id: registerId, retailId, domain, attendances, specificBreaks, isToday } = workplace;
            const { _id: shiftId } = shift;

            const attendance = attendances.find(att => att.shiftId === shiftId);

            if (!attendance) {
                Alert.alert(t('misc_error'), t('misc_must_have_attendance'));
                return;
            }

            if (attendance.checkOutTime) {
                Alert.alert(t('srv_already_checked_out'));
                return;
            }

            const attendanceBreak = _id ? attendance.breaks.find(b => b._id === _id) : null;

            if (attendanceBreak && attendanceBreak.checkOutTime) {
                Alert.alert(t('srv_already_checked_out'));
                return;
            }

            const now = dayjs();
            const todayKey = DAYS_OF_WEEK[now.day()];
            const yesterdayKey = DAYS_OF_WEEK[now.subtract(1, 'day').day()];

            const dayKey = !isToday ? yesterdayKey : todayKey;
            if (!specificBreaks[dayKey] || !specificBreaks[dayKey][breakKey] || !specificBreaks[dayKey][breakKey].isAvailable) {
                Alert.alert(t('misc_error'), t('misc_break_not_available'));
                return;
            }

            const specificBreak = specificBreaks[dayKey][breakKey];

            const biometricEnabled = await SecureStore.getItemAsync('biometricEnabled');

            if (biometricEnabled === 'true') {
                const result = await checkBiometric(t);

                if (!result.success) {
                    if (_.isObject(result.msg)) {
                        Alert.alert(t(result.msg.title), t(result.msg.message));
                        return;
                    }
                    Alert.alert(t('srv_authentication_failed'), t('srv_please_try_again'));
                    return;
                }
            }

            let text = `${t('misc_cannot_revert_action')}!`;
            text += `\n${t(specificBreakTranslations[breakKey].name)}: ${specificBreak.start} - ${specificBreak.end}${specificBreak.isOverNight ? ` (${t('misc_over_night')})` : ''}`;

            const duration = attendanceBreak?.checkInTime ? dayjs(attendanceBreak.checkInTime).diff(now, 'minutes') : specificBreak.duration;

            const { hours, minutes } = calculateHoursFromMinutes(duration);

            text += `\n${t('misc_duration')}: ${hours > 0 ? `${hours} ${noCapT('misc_hour_short')}` : ''}${minutes > 0 ? ` ${minutes} ${noCapT('misc_min_short')}` : ''}`;

            Alert.alert(
                t('misc_submit_break'),
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
                                Alert.alert(t('misc_error'), t('srv_location_required_to_submit_break'));
                                return;
                            }
                            const form: SpecificBreakMutation = { _id, breakKey, registerId, retailId, deviceKey, domain, longitude: location.longitude, latitude: location.latitude, shiftId, attendanceId: attendance ? attendance._id : null, };

                            setPendingAttendance(form);
                            applySpecificBreakMutation.mutate(form);
                        },
                    },
                ],
                { cancelable: true }
            );
        }
    };

    // _id is the id of the break, breakId is the id from workplace.breaks
    const handleBreakSubmit = async (data: { _id?: string, breakId?: string | null, name: string }) => {
        if (selectedShift) {
            const { _id: registerId, retailId, domain, attendances, breaks, isToday } = workplace;
            const { _id: shiftId } = shift;
            const { _id, name } = data;
            const breakId = data.breakId || null;

            const attendance = attendances.find(att => att.shiftId === shiftId);

            if (!attendance) {
                Alert.alert(t('misc_error'), t('misc_must_have_attendance'));
                return;
            }

            if (attendance.checkOutTime) {
                Alert.alert(t('srv_already_checked_out'));
                return;
            }

            const attendanceBreak = _id ? attendance.breaks.find(b => b._id === _id) : null;

            if (attendanceBreak && attendanceBreak.checkOutTime) {
                Alert.alert(t('srv_already_checked_out'));
                return;
            }

            const dayKey = !isToday ? yesterdayKey : todayKey;

            let foundBreakTemplate = null;

            if (breakId) {
                foundBreakTemplate = breaks[dayKey].find(b => b._id === breakId);
                if (!foundBreakTemplate) {
                    Alert.alert(t('misc_error'), t('misc_break_not_available'));
                    return;
                }
            }

            const biometricEnabled = await SecureStore.getItemAsync('biometricEnabled');

            if (biometricEnabled === 'true') {
                const result = await checkBiometric(t);

                if (!result.success) {
                    if (_.isObject(result.msg)) {
                        Alert.alert(t(result.msg.title), t(result.msg.message));
                        return;
                    }
                    Alert.alert(t('srv_authentication_failed'), t('srv_please_try_again'));
                    return;
                }
            }
            const currentTime = dayjs();
            let text = `${t('misc_cannot_revert_action')}!`;
            text += `\n${t(name)}`
            if (foundBreakTemplate) {
                text += `: ${foundBreakTemplate.start} - ${foundBreakTemplate.end}${foundBreakTemplate.isOverNight ? ` (${t('misc_over_night')})` : ''}`;

                const duration = attendanceBreak?.checkInTime ? dayjs(attendanceBreak.checkInTime).diff(currentTime, 'minutes') : foundBreakTemplate.duration;

                const { hours, minutes } = calculateHoursFromMinutes(duration);

                text += `\n${t('misc_duration')}: ${hours > 0 ? `${hours} ${noCapT('misc_hour_short')}` : ''}${minutes > 0 ? ` ${minutes} ${noCapT('misc_min_short')}` : ''}`;
            }

            Alert.alert(
                t('misc_submit_break'),
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
                                Alert.alert(t('misc_error'), t('srv_location_required_to_submit_break'));
                                return;
                            }
                            const form: BreakMutation = { _id, registerId, retailId, deviceKey, domain, longitude: location.longitude, latitude: location.latitude, shiftId, attendanceId: attendance ? attendance._id : null, breakId, name };

                            setPendingAttendance(form);
                            applyBreakMutation.mutate(form);
                        },
                    },
                ],
                { cancelable: true }
            );
        }
    };

    const handleScanResult = (result: boolean, foundDevices: string[]) => {
        if (result && pendingAttendance) {
            makeAttendanceMutation.mutate({ ...pendingAttendance, localDeviceId: foundDevices[0] });
        }
    };

    const now = dayjs();
    const todayKey = DAYS_OF_WEEK[now.day()];
    const yesterdayKey = DAYS_OF_WEEK[now.subtract(1, 'day').day()];

    const statusInfo = selectedShift.shift
        ? getShiftHoursText({ shift: selectedShift.shift, t, isToday: workplace.isToday })
        : { status: '', message: '' };

    const specificBreaks = selectedShift.workplace.specificBreaks?.[!workplace.isToday ? yesterdayKey : todayKey];
    const breaks = selectedShift.workplace.breaks?.[!workplace.isToday ? yesterdayKey : todayKey];
    const allowedOverTime = shift.allowedOverTime || 5;

    const runningBreak = attendance?.breaks.find(b => b.checkInTime && !b.checkOutTime);

    return (
        <Modal
            visible={!!selectedShift}
            animationType="slide"
            transparent
            onRequestClose={() => setSelectedShift(null)}
        >
            <ThemedView style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <BLEScanModal onResult={handleScanResult} />
                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        <ThemedText style={styles.modalTitle}>{t('misc_shift_details')}</ThemedText>
                        <ThemedText>
                            {t('misc_workplace')}: {workplace.name ?? '-'}
                        </ThemedText>
                        <ThemedText>
                            {t('misc_shift_time')}: {!workplace.isToday ? `${t(daysOfWeeksTranslations[yesterdayKey].name)} ` : ''}{statusInfo.message || '-'}
                        </ThemedText>
                        <ThemedText style={{ color: Colors.warning }}>{t('misc_earliest_check_in_time')}: {shiftStartTime.subtract(allowedOverTime, 'minutes').format(TIME_FORMAT)}</ThemedText>
                        <ThemedText style={{ color: Colors.warning }}>{t('misc_latest_check_out_time')}: {shiftEndTime.add(allowedOverTime, 'minutes').format(TIME_FORMAT)}</ThemedText>
                        <ThemedText style={styles.groupHeader}>{t('misc_specific_breaks')}</ThemedText>
                        {specificBreaks && SPECIFIC_BREAKS.some(type =>
                            specificBreaks[type]?.isAvailable
                        ) ? (
                            SPECIFIC_BREAKS.filter((type) => {
                                const brk = specificBreaks[type];
                                return brk && brk.isAvailable
                            }).map((type, idx, arr) => {
                                const brk = specificBreaks[type];

                                const { hours, minutes } = calculateHoursFromMinutes(brk.duration);

                                const { startTime, endTime } = getStartEndTime({ start: brk.start, end: brk.end, isToday: workplace.isToday });

                                const attendanceBreak = attendance?.breaks.find(b => b.type === type);

                                const isBreakPending = attendanceBreak && !_.isEmpty(attendanceBreak.checkInTime) && _.isEmpty(attendanceBreak.checkOutTime);

                                const isBreakNotAvailable = (!isBreakPending && !now.isBetween(startTime, endTime, null, '[]')) || !_.isEmpty(attendanceBreak?.checkOutTime);

                                const realDuration = attendanceBreak && attendanceBreak?.checkInTime && attendanceBreak?.checkOutTime ? dayjs(attendanceBreak.checkOutTime).diff(attendanceBreak.checkInTime, 'minutes') : null;

                                const realDurationCalculated = realDuration ? calculateHoursFromMinutes(realDuration) : { hours: 0, minutes: 0 };

                                const isExceededTime = realDuration && realDuration > brk.duration;

                                return (
                                    <Fragment key={type}>
                                        <View style={styles.breakRow}>
                                            <View style={styles.breakInfo}>
                                                <ThemedText style={styles.breakText}>
                                                    {t(`misc_${type}`)}: {brk.start} - {brk.end}
                                                    {brk.isOverNight ? ` (${t('misc_over_night')})` : ''}
                                                </ThemedText>
                                                <ThemedText style={styles.breakDurationText}>
                                                    {t('misc_max_duration')}: {hours > 0 ? `${hours} ${noCapT('misc_hour_short')}` : ''}{minutes > 0 ? ` ${minutes} ${noCapT('misc_min_short')}` : ''}
                                                </ThemedText>
                                                {attendanceBreak?.checkInTime &&
                                                    <ThemedText style={styles.breakTimeText}>
                                                        {t('msg_from')}: {dayjs(attendanceBreak.checkInTime).format('DD/MM/YYYY HH:mm:ss')}
                                                    </ThemedText>}
                                                {attendanceBreak?.checkOutTime &&
                                                    <ThemedText style={styles.breakTimeText}>
                                                        {t('msg_to')}: {dayjs(attendanceBreak.checkOutTime).format('DD/MM/YYYY HH:mm:ss')}
                                                    </ThemedText>}
                                                {realDuration && realDuration > 0 && <ThemedText style={[styles.breakTimeText, isExceededTime ? { color: Colors.error } : {}]}>
                                                    {t('misc_duration')}: {realDurationCalculated.hours > 0 ? `${realDurationCalculated.hours} ${noCapT('misc_hour_short')}` : ''}{realDurationCalculated.minutes > 0 ? ` ${realDurationCalculated.minutes} ${noCapT('misc_min_short')}` : ''} {isExceededTime ? `(${t('misc_exceeded_time')})` : ''}
                                                </ThemedText>}
                                            </View>
                                            <TouchableOpacity
                                                style={[
                                                    styles.breakButton,
                                                    isBreakNotAvailable ? styles.buttonDisabled : isBreakPending && styles.buttonPending,
                                                ]}
                                                disabled={isBreakNotAvailable}
                                                activeOpacity={!isBreakNotAvailable ? 0.7 : 1}
                                                onPress={() => handleSpecificBreakSubmit({ breakKey: type, _id: attendanceBreak?._id })}
                                            >
                                                <ThemedText style={[
                                                    styles.breakButtonText,
                                                    isBreakNotAvailable ? styles.buttonTextDisabled : isBreakPending && styles.buttonTextPending,

                                                ]}>{t(isBreakNotAvailable ? 'misc_outside_time' : isBreakPending ? 'misc_finish' : 'misc_to_start')}</ThemedText>
                                            </TouchableOpacity>
                                        </View>
                                        {idx < arr.length - 1 && <View style={styles.breakDivider} />}
                                    </Fragment>
                                );
                            })
                        ) : (
                            <ThemedText style={styles.breakText}>{t('misc_no_breaks')}</ThemedText>
                        )}

                        <ThemedText style={styles.groupHeader}>{t('misc_generic_breaks')}</ThemedText>
                        {breaks?.some(b => isBreakWithinShift({ breakStart: b.start, breakEnd: b.end, shiftStart: shift.start, shiftEnd: shift.end, isToday: workplace.isToday })) ? (
                            breaks
                                .filter((b) => isBreakWithinShift({ breakStart: b.start, breakEnd: b.end, shiftStart: shift.start, shiftEnd: shift.end, isToday: workplace.isToday }))
                                .map((b: Breaks, idx: number, arr) => {
                                    const { hours, minutes } = calculateHoursFromMinutes(b.duration);
                                    const { startTime, endTime } = getStartEndTime({ start: b.start, end: b.end, isToday: workplace.isToday });
                                    const attendanceBreak = attendance?.breaks.find(brk => brk.breakId && b._id === brk.breakId);

                                    const isBreakPending = attendanceBreak && !_.isEmpty(attendanceBreak.checkInTime) && _.isEmpty(attendanceBreak.checkOutTime);

                                    const isBreakNotAvailable = (!isBreakPending && !now.isBetween(startTime, endTime, null, '[]')) || !_.isEmpty(attendanceBreak?.checkOutTime);

                                    const realDuration = attendanceBreak && attendanceBreak?.checkInTime && attendanceBreak?.checkOutTime ? dayjs(attendanceBreak.checkOutTime).diff(attendanceBreak.checkInTime, 'minutes') : null;

                                    const realDurationCalculated = realDuration ? calculateHoursFromMinutes(realDuration) : { hours: 0, minutes: 0 };

                                    const isExceededTime = realDuration && realDuration > b.duration;
                                    return (
                                        <Fragment key={b._id}>
                                            <View style={styles.breakRow}>
                                                <View style={styles.breakInfo}>
                                                    <ThemedText style={styles.breakText}>
                                                        {b.name ? `${t(b.name)}: ` : ''}{b.start} - {b.end}
                                                        {b.isOverNight ? ` (${t('misc_over_night')})` : ''}
                                                    </ThemedText>
                                                    <ThemedText style={styles.breakDurationText}>
                                                        {t('misc_max_duration')}: {hours > 0 ? `${hours} ${noCapT('misc_hour_short')}` : ''}{minutes > 0 ? ` ${minutes} ${noCapT('misc_min_short')}` : ''}
                                                    </ThemedText>
                                                    {attendanceBreak?.checkInTime &&
                                                        <ThemedText style={styles.breakTimeText}>
                                                            {t('msg_from')}: {dayjs(attendanceBreak.checkInTime).format('DD/MM/YYYY HH:mm:ss')}
                                                        </ThemedText>}
                                                    {attendanceBreak?.checkOutTime &&
                                                        <ThemedText style={styles.breakTimeText}>
                                                            {t('msg_to')}: {dayjs(attendanceBreak.checkOutTime).format('DD/MM/YYYY HH:mm:ss')}
                                                        </ThemedText>}
                                                    {_.isNumber(realDuration) && realDuration > 0 && (() => {
                                                        const { hours, minutes } = realDurationCalculated;

                                                        const durationStr = (hours || minutes)
                                                            ? [
                                                                hours > 0 ? `${hours} ${noCapT('misc_hour_short')}` : '',
                                                                minutes > 0 ? `${minutes} ${noCapT('misc_min_short')}` : ''
                                                            ].filter(Boolean).join(' ')
                                                            : `0 ${noCapT('misc_min_short')}`;

                                                        const exceededText = isExceededTime ? ` (${t('misc_exceeded_time')})` : '';

                                                        return (
                                                            <ThemedText
                                                                style={[
                                                                    styles.breakTimeText,
                                                                    isExceededTime ? { color: Colors.error } : null
                                                                ]}
                                                            >
                                                                {`${t('misc_duration')}: ${durationStr}${exceededText}`}
                                                            </ThemedText>
                                                        );
                                                    })()}
                                                </View>
                                                <TouchableOpacity
                                                    style={[
                                                        styles.breakButton,
                                                        isBreakNotAvailable ? styles.buttonDisabled : isBreakPending && styles.buttonPending,
                                                    ]}
                                                    disabled={isBreakNotAvailable}
                                                    activeOpacity={!isBreakNotAvailable ? 0.7 : 1}
                                                    onPress={() => handleBreakSubmit({ _id: attendanceBreak?._id, breakId: b._id, name: b.name })}
                                                >
                                                    <ThemedText style={[
                                                        styles.breakButtonText,
                                                        isBreakNotAvailable ? styles.buttonTextDisabled : isBreakPending && styles.buttonTextPending,

                                                    ]}>{t(isBreakNotAvailable ? 'misc_outside_time' : isBreakPending ? 'misc_finish' : 'misc_to_start')}</ThemedText>
                                                </TouchableOpacity>
                                            </View>
                                            {idx < arr.length - 1 && <View style={styles.breakDivider} />}
                                        </Fragment>
                                    );
                                })
                        ) : (
                            <ThemedText style={styles.breakText}>{t('misc_no_breaks')}</ThemedText>
                        )}

                        <View style={styles.attendanceInfo}>
                            <ThemedText style={styles.groupHeader}>{t('misc_attendance')}</ThemedText>
                        </View>
                        <View style={styles.attendanceStatusContainer}>
                            {attendance?.checkInTime ? <>
                                <ThemedText>
                                    {t('misc_check_in')}: {dayjs(attendance.checkInTime).format('DD/MM/YYYY HH:mm:ss')}
                                </ThemedText>
                                {attendanceStatus && !_.isEmpty(attendanceStatus.checkInTime) && <ThemedText style={attendanceStatus.checkInTime.isSuccess ? { color: Colors.success } : { color: Colors.error }}>
                                    {t(attendanceStatus.checkInTime.message)}
                                </ThemedText>}
                            </> : <ThemedText>
                                {t('misc_not_checked_in')}
                            </ThemedText>}
                        </View>
                        <View style={styles.attendanceStatusContainer}>
                            {attendance?.checkOutTime ? <>
                                <ThemedText>
                                    {t('misc_check_out')}: {dayjs(attendance.checkOutTime).format('DD/MM/YYYY HH:mm:ss')}
                                </ThemedText>
                                {attendanceStatus && !_.isEmpty(attendanceStatus.checkOutTime) && <ThemedText style={attendanceStatus.checkOutTime.isSuccess ? { color: Colors.success } : { color: Colors.error }}>
                                    {t(attendanceStatus.checkOutTime.message)}
                                </ThemedText>}
                            </> : <ThemedText>
                                {t('misc_not_checked_out')}
                            </ThemedText>}
                        </View>
                        {!_.isEmpty(runningBreak) ?
                            (() => {
                                const startTime = dayjs(runningBreak.checkInTime);
                                const expectedEndTime = startTime.add(runningBreak.breakHours.duration, 'minutes');
                                const timeLeft = expectedEndTime.diff(now, 'minute');

                                const { hours, minutes } = calculateHoursFromMinutes(timeLeft);
                                const timeLeftText = `${hours > 0 ? `${hours} ${noCapT('misc_hour_short')}` : ''}${minutes > 0 ? ` ${minutes} ${noCapT('misc_min_short')}` : ''}`;

                                return <>
                                    <ThemedText style={styles.groupHeader}>{t('misc_running_break')}: {t(runningBreak.name)}</ThemedText>
                                    {expectedEndTime.isAfter(now) ? <ThemedText style={styles.breakDurationText}>
                                        {t('misc_expected_end_time')}: {expectedEndTime.format('DD/MM/YYYY HH:mm:ss')}
                                    </ThemedText> : <ThemedText style={{ color: Colors.error }}>
                                        {t('misc_break_overdue')}: {expectedEndTime.format('DD/MM/YYYY HH:mm:ss')}
                                    </ThemedText>}
                                    {expectedEndTime.isAfter(now) && <ThemedText style={styles.breakDurationText}>
                                        {t('misc_time_left')}: {timeLeftText}
                                    </ThemedText>}
                                    <TouchableOpacity style={[styles.modalButton, { backgroundColor: Colors.warning }]} onPress={() => {
                                        if (typeof runningBreak.type === 'string' && SPECIFIC_BREAKS.includes(runningBreak.type as SpecificBreakTypes)) {
                                            if (SPECIFIC_BREAKS.includes(runningBreak.type as SpecificBreakTypes)) {
                                                handleSpecificBreakSubmit({ breakKey: runningBreak.type as SpecificBreakTypes, _id: runningBreak._id });
                                            }
                                        } else {
                                            handleBreakSubmit({ _id: runningBreak._id, breakId: runningBreak.breakId, name: runningBreak.name })
                                        }
                                    }}>
                                        <ThemedText style={styles.modalButtonText}>{t('misc_finish')}</ThemedText>
                                    </TouchableOpacity>
                                </>
                            })()
                            : !attendance?.checkOutTime && <TouchableOpacity style={styles.modalButton} onPress={handleCheckIn}>
                                <ThemedText style={styles.modalButtonText}>{t(attendance?.checkInTime ? 'misc_check_out' : 'misc_check_in')}</ThemedText>
                            </TouchableOpacity>}
                        { }
                    </ScrollView>

                    <View style={styles.fixedFooter}>
                        <TouchableOpacity
                            style={[styles.modalButton, styles.cancelButton]}
                            onPress={() => setSelectedShift(null)}
                        >
                            <ThemedText style={styles.modalButtonText}>{t('misc_close')}</ThemedText>
                        </TouchableOpacity>
                    </View>
                </View>
            </ThemedView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    modalContent: {
        flex: 1,
        borderRadius: 10,
        padding: 20,
        width: '90%',
        maxHeight: '90%',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    modalButton: {
        marginTop: 15,
        backgroundColor: Colors.primary,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignSelf: 'center',
    },
    cancelButton: {
        backgroundColor: Colors.error,
    },
    modalButtonText: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    groupHeader: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 20,
        marginBottom: 8,
    },
    breakText: {
        fontSize: 14,
        marginLeft: 10,
    },
    breakTimeText: {
        fontSize: 12,
        marginLeft: 10,
        fontStyle: 'italic',
    },
    breakRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    breakButton: {
        backgroundColor: Colors.primary,
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 6,
    },
    breakButtonText: {
        color: 'white',
        fontSize: 13,
        fontWeight: '500',
    },
    breakInfo: {
        flexShrink: 1,
        marginRight: 10,
    },
    breakDurationText: {
        fontSize: 13,
        color: '#888',
        marginTop: 2,
        marginLeft: 10,
    },
    scrollContent: {
        paddingBottom: 20,
    },
    fixedFooter: {
        borderTopWidth: 1,
        borderTopColor: '#ccc',
        paddingTop: 10,
        marginTop: 10,
    },
    attendanceInfo: {
        flexShrink: 1,
        marginRight: 10,
    },
    attendanceStatusContainer: {
        flexShrink: 1,
        marginTop: 10,
    },
    buttonDisabled: {
        backgroundColor: Colors.secondary,
    },
    buttonPending: {
        backgroundColor: Colors.warning,
    },
    buttonTextDisabled: {
        color: 'white',
    },
    buttonTextPending: {
        color: 'white',
    },
    breakDivider: {
        height: 1,
        backgroundColor: '#ccc',
        marginVertical: 8,
    }
});

export default ShiftSelectModal;
