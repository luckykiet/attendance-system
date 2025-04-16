import React, { Fragment, useState } from 'react';
import { Modal, View, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import ThemedText from './theme/ThemedText';
import { Colors } from '@/constants/Colors';
import useTranslation from '@/hooks/useTranslation';
import { useAppStore } from '@/stores/useAppStore';
import { calculateHoursFromMinutes, checkBiometric, getAttendanceStatus, getDiffDurationText, getShiftHoursText, getStartEndTime, isBreakWithinShift } from '@/utils';
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
import ReasonPromptModal, { ReasonData } from './ReasonPromptModal';
import { AttendancePauseMutation } from '@/types/pause';
import { usePauseApi } from '@/api/usePauseApi';

const ShiftSelectModal = () => {
    const queryClient = useQueryClient();
    const { t } = useTranslation();
    const { t: noCapT } = useTranslation({ capitalize: false });
    const { selectedShift, setSelectedShift, location, setLocalDevices } = useAppStore();
    const { logAttendance } = useAttendanceApi();
    const { applySpecificBreak } = useSpecificBreakApi();
    const { applyBreak } = useBreakApi();
    const { applyPause } = usePauseApi();
    const [pendingAttendance, setPendingAttendance] = useState<AttendanceMutation | AttendancePauseMutation | null>(null);
    const [showReasonModal, setShowReasonModal] = useState(false);
    const [checkoutForm, setCheckoutForm] = useState<AttendanceMutation | null>(null);
    const [isSubmittingType, setIsSubmittingType] = useState<'attendance' | 'specific-break' | 'break' | 'pause' | null>(null);

    const [diff, setDiff] = useState<number>(0);
    const [reasonModalTitle, setReasonModalTitle] = useState<string>('misc_reason_for_early_check_out');

    const submitPauseMutation = useMutation(
        {
            mutationFn: (data: AttendancePauseMutation) => applyPause(data),
            onSuccess: (data) => {
                if (data.localDevices) {
                    setLocalDevices(data.localDevices);
                } else {
                    queryClient.invalidateQueries({ queryKey: ['todayWorkplaces'] });
                    Alert.alert(t('misc_shift_pause_successfully'), t(data.msg))
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
        checkInTime: attendance.checkInTime,
        checkOutTime: attendance.checkOutTime,
        shift: shift,
        isToday: workplace.isToday,
        t,
        noCapT,
    }) : null;

    const handleSubmitPause = async ({ _id }: { _id?: string }) => {
        if (selectedShift) {
            const { _id: registerId, retailId, domain, attendances } = workplace;
            const { _id: shiftId } = shift;

            const attendance = attendances.find(att => att.shiftId === shiftId);

            if (!attendance) {
                Alert.alert(t('misc_error'), t('misc_must_have_attendance'));
                return;
            }

            if (attendance && attendance.checkOutTime) {
                Alert.alert(t('srv_already_checked_out'), t('misc_cannot_revert_action'));
                return;
            }

            let pause = null;

            if (_id) {
                pause = attendance?.pauses.find(p => p._id === _id);
                if (!pause) {
                    Alert.alert(t('misc_error'), t('misc_pause_not_found'));
                    return;
                }

                if (pause && pause.checkOutTime) {
                    Alert.alert(t('srv_already_checked_out'), t('misc_cannot_revert_action'));
                    return;
                }
            }

            const deviceKey = await SecureStore.getItemAsync('deviceKey');

            if (!deviceKey) {
                Alert.alert(t('misc_error'), t('misc_you_must_register_device'));
                return;
            }

            if (!location || isNaN(location.longitude) || isNaN(location.latitude)) {
                Alert.alert(t('misc_error'), t('srv_location_required_to_make_attendance'));
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

            const form: AttendancePauseMutation = {
                registerId,
                retailId,
                deviceKey,
                domain,
                longitude: location.longitude,
                latitude: location.latitude,
                shiftId,
                attendanceId: attendance._id,
                _id: pause?._id,
                name: pause?.name || t('misc_pause'),
            };

            if (!_id) {
                const shiftTime = getStartEndTime({ start: shift.start, end: shift.end, isToday: workplace.isToday });
                if (!shiftTime) {
                    Alert.alert(t('misc_error'), t('srv_invalid_time'));
                    return;
                }
                const { endTime: closeTime } = shiftTime
                const difference = closeTime.diff(currentTime, 'minute');

                setReasonModalTitle('misc_reason_for_pause');
                setDiff(difference);
                setCheckoutForm(form);
                setShowReasonModal(true);
                setIsSubmittingType('pause');
                return;
            }

            const difference = currentTime.diff(pause?.checkInTime, 'minute');
            const durationText = getDiffDurationText(difference, noCapT);
            let text = `${t('misc_cannot_revert_action')}!`;
            text += `\n${t('misc_duration')}: ${durationText}`;

            Alert.alert(
                t('misc_finish_pause'),
                text,
                [
                    {
                        text: t('misc_cancel'),
                        style: 'cancel',
                    },
                    {
                        text: t('misc_confirm'),
                        onPress: async () => {
                            setPendingAttendance(form);
                            setIsSubmittingType('pause');
                            submitPauseMutation.mutate(form);
                        },
                    },
                ],
                { cancelable: true }
            );
        }

    };

    const handleCheckIn = async () => {
        if (selectedShift) {
            const { _id: registerId, retailId, domain, attendances } = workplace;
            const { _id: shiftId } = shift;

            const attendance = attendances.find(att => att.shiftId === shiftId);
            if (attendance && attendance.checkOutTime) {
                Alert.alert(t('srv_already_checked_out'), t('misc_cannot_revert_action'));
                return;
            }

            const currentTime = dayjs();
            const shiftTime = getStartEndTime({ start: shift.start, end: shift.end, isToday: workplace.isToday });
            if (!shiftTime) {
                Alert.alert(t('misc_error'), t('srv_invalid_time'));
                return;
            }
            const { startTime: openTime, endTime: closeTime } = shiftTime

            let diff = 0;
            let text = `${t('misc_cannot_revert_action')}!`;
            const checkInTime = attendance?.checkInTime;
            let isEarlyCheckOut = false;
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
                    isEarlyCheckOut = true;
                    text += `\n${t('misc_early')}: `;
                } else {
                    text += `\n${t('misc_late')}: `;
                }
            }

            const deviceKey = await SecureStore.getItemAsync('deviceKey');
            if (!deviceKey) {
                Alert.alert(t('misc_error'), t('misc_you_must_register_device'));
                return;
            }

            if (!location || isNaN(location.longitude) || isNaN(location.latitude)) {
                Alert.alert(t('misc_error'), t('srv_location_required_to_make_attendance'));
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

            if (isEarlyCheckOut) {
                const form: AttendanceMutation = {
                    registerId,
                    retailId,
                    deviceKey,
                    domain,
                    longitude: location.longitude,
                    latitude: location.latitude,
                    shiftId,
                    attendanceId: attendance ? attendance._id : null,
                };
                const difference = currentTime.diff(closeTime, 'minute');

                setReasonModalTitle('misc_reason_for_early_check_out');
                setDiff(difference);
                setCheckoutForm(form);
                setShowReasonModal(true);
                setIsSubmittingType('attendance');
                return;
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
                            const form: AttendanceMutation = { registerId, retailId, deviceKey, domain, longitude: location.longitude, latitude: location.latitude, shiftId, attendanceId: attendance ? attendance._id : null, };

                            setPendingAttendance(form);
                            setIsSubmittingType('attendance');
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

            let text = `${t('misc_cannot_revert_action')}!`;
            text += `\n${t(specificBreakTranslations[breakKey].name)}: ${specificBreak.start} - ${specificBreak.end}${specificBreak.isOverNight ? ` (${t('misc_over_night')})` : ''}`;

            const duration = attendanceBreak?.checkInTime ? dayjs(attendanceBreak.checkInTime).diff(now, 'minutes') : specificBreak.duration;

            const durationText = getDiffDurationText(duration, noCapT);

            text += `\n${t('misc_duration')}: ${durationText}`;

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
                            setIsSubmittingType('specific-break');
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
            const currentTime = dayjs();
            let text = `${t('misc_cannot_revert_action')}!`;
            text += `\n${t(name)}`
            if (foundBreakTemplate) {
                text += `: ${foundBreakTemplate.start} - ${foundBreakTemplate.end}${foundBreakTemplate.isOverNight ? ` (${t('misc_over_night')})` : ''}`;

                const duration = attendanceBreak?.checkInTime ? dayjs(attendanceBreak.checkInTime).diff(currentTime, 'minutes') : foundBreakTemplate.duration;

                const durationText = getDiffDurationText(duration, noCapT);

                text += `\n${t('misc_duration')}: ${durationText}`;
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
                            setIsSubmittingType('break');
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
            if (isSubmittingType === 'attendance') {
                const body = { ...pendingAttendance, localDeviceId: foundDevices[0] } as AttendanceMutation;
                makeAttendanceMutation.mutate(body);
            } else if (isSubmittingType === 'specific-break') {
                const body = { ...pendingAttendance, localDeviceId: foundDevices[0] } as SpecificBreakMutation;
                applySpecificBreakMutation.mutate(body);
            } else if (isSubmittingType === 'break') {
                const body = { ...pendingAttendance, localDeviceId: foundDevices[0] } as BreakMutation;
                applyBreakMutation.mutate(body);
            } else {
                const body = { ...pendingAttendance, localDeviceId: foundDevices[0] } as AttendancePauseMutation;
                submitPauseMutation.mutate(body);
            }
        }
    };

    const now = dayjs();
    const todayKey = DAYS_OF_WEEK[now.day()];
    const yesterdayKey = DAYS_OF_WEEK[now.subtract(1, 'day').day()];

    const statusInfo = selectedShift.shift
        ? getShiftHoursText({ shift: selectedShift.shift, t, isToday: workplace.isToday }) || { status: '', message: '' }
        : { status: '', message: '' };

    const specificBreaks = selectedShift.workplace.specificBreaks?.[!workplace.isToday ? yesterdayKey : todayKey];
    const breaks = selectedShift.workplace.breaks?.[!workplace.isToday ? yesterdayKey : todayKey];
    const allowedOverTime = shift.allowedOverTime || 5;

    const runningBreak = attendance?.breaks.find(b => b.checkInTime && !b.checkOutTime);
    const lastestPause = attendance?.pauses?.find(p => p.checkInTime && !p.checkOutTime);

    const shiftTime = getStartEndTime({ start: shift.start, end: shift.end, isToday: workplace.isToday });

    if (!shiftTime) {
        return null;
    }
    const { startTime: shiftStartTime, endTime: shiftEndTime } = shiftTime
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
                                const maxDurationText = getDiffDurationText(brk.duration, noCapT);
                                const brkTime = getStartEndTime({ start: brk.start, end: brk.end, isToday: workplace.isToday });

                                if (!brkTime) return null;

                                const { startTime, endTime } = brkTime;
                                const attendanceBreak = attendance?.breaks.find(b => b.type === type);

                                const isBreakPending = attendanceBreak && !_.isEmpty(attendanceBreak.checkInTime) && _.isEmpty(attendanceBreak.checkOutTime);

                                const isBreakNotAvailable = (!isBreakPending && !now.isBetween(startTime, endTime, null, '[]')) || !_.isEmpty(attendanceBreak?.checkOutTime);

                                const realDuration = attendanceBreak && attendanceBreak?.checkInTime && attendanceBreak?.checkOutTime ? dayjs(attendanceBreak.checkOutTime).diff(attendanceBreak.checkInTime, 'minutes') : null;


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
                                                    {t('misc_max_duration')}: {maxDurationText ? maxDurationText : '-'}
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
                                                    const durationText = getDiffDurationText(realDuration, noCapT);

                                                    const durationStr = realDuration
                                                        ? durationText
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
                        {breaks?.some(b => isBreakWithinShift({ breakStart: b.start, breakEnd: b.end, shiftStart: shift.start, shiftEnd: shift.end })) ? (
                            breaks
                                .filter((b) => isBreakWithinShift({ breakStart: b.start, breakEnd: b.end, shiftStart: shift.start, shiftEnd: shift.end }))
                                .map((b: Breaks, idx: number, arr) => {

                                    const maxDurationText = getDiffDurationText(b.duration, noCapT);
                                    const brkTime = getStartEndTime({ start: b.start, end: b.end, isToday: workplace.isToday });

                                    if (!brkTime) {
                                        return null
                                    }

                                    const { startTime, endTime } = brkTime;
                                    const attendanceBreak = attendance?.breaks.find(brk => brk.breakId && b._id === brk.breakId);

                                    const isBreakPending = attendanceBreak && !_.isEmpty(attendanceBreak.checkInTime) && _.isEmpty(attendanceBreak.checkOutTime);

                                    const isBreakNotAvailable = (!isBreakPending && !now.isBetween(startTime, endTime, null, '[]')) || !_.isEmpty(attendanceBreak?.checkOutTime);

                                    const realDuration = attendanceBreak && attendanceBreak?.checkInTime && attendanceBreak?.checkOutTime ? dayjs(attendanceBreak.checkOutTime).diff(attendanceBreak.checkInTime, 'minutes') : null;

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
                                                        {t('misc_max_duration')}: {maxDurationText ? maxDurationText : '-'}
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
                                                        const durationText = getDiffDurationText(realDuration, noCapT);

                                                        const durationStr = realDuration
                                                            ? durationText : `0 ${noCapT('misc_min_short')}`;

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

                        {!_.isEmpty(attendance?.pauses ?? []) && (attendance?.pauses?.length ?? 0) > 0 && <>
                            <ThemedText style={styles.groupHeader}>{t('misc_pauses')}</ThemedText>
                            {attendance?.pauses.map((p, idx, arr) => {
                                const isPending = p.checkInTime && !p.checkOutTime;
                                return (
                                    <Fragment key={p._id}>
                                        <View style={styles.breakRow}>
                                            <View style={styles.breakInfo}>
                                                <ThemedText style={styles.breakText}>
                                                    {t(p.name)}
                                                </ThemedText>
                                                <ThemedText style={styles.breakTimeText}>
                                                    {t('msg_from')}: {dayjs(p.checkInTime).format('DD/MM/YYYY HH:mm:ss')}
                                                </ThemedText>
                                                {p.checkOutTime &&
                                                    <ThemedText style={styles.breakTimeText}>
                                                        {t('msg_to')}: {dayjs(p.checkOutTime).format('DD/MM/YYYY HH:mm:ss')}
                                                    </ThemedText>}
                                            </View>
                                            {isPending && <TouchableOpacity
                                                style={[styles.breakButton, styles.buttonPending]}
                                                onPress={() => handleSubmitPause({ _id: p._id })}
                                            >
                                                <ThemedText style={[styles.breakButtonText]}>{t('misc_finish')}</ThemedText>
                                            </TouchableOpacity>}
                                        </View>
                                        {idx < arr.length - 1 && <View style={styles.breakDivider} />}
                                    </Fragment>
                                );
                            })}
                        </>}

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

                                const timeLeftText = getDiffDurationText(timeLeft, noCapT);

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
                            : lastestPause ?
                                <>
                                    <ThemedText style={styles.groupHeader}>{t('misc_running_pause')}: {t(lastestPause.name)}</ThemedText>
                                    <ThemedText>{t('msg_from')}: {dayjs(lastestPause.checkInTime).format('DD/MM/YYYY HH:mm:ss')}</ThemedText>
                                    <View style={styles.buttonGroup}>
                                        <TouchableOpacity style={[styles.modalButton, styles.buttonPending]} onPress={() => {
                                            handleSubmitPause({
                                                _id: lastestPause._id
                                            })
                                        }}>
                                            <ThemedText style={[styles.modalButtonText]}>{t('misc_finish')}</ThemedText>
                                        </TouchableOpacity>
                                    </View>
                                </>
                                : !attendance?.checkOutTime && <>
                                    <View style={styles.buttonGroup}>
                                        {attendance?.checkInTime && <TouchableOpacity style={[styles.modalButton, styles.buttonPending]} onPress={() => {
                                            handleSubmitPause({
                                                _id: undefined
                                            })
                                        }}>
                                            <ThemedText style={[styles.modalButtonText]}>{t('misc_pause_shift')}</ThemedText>
                                        </TouchableOpacity>}
                                        <TouchableOpacity style={styles.modalButton} onPress={handleCheckIn}>
                                            <ThemedText style={styles.modalButtonText}>{t(attendance?.checkInTime ? 'misc_check_out' : 'misc_check_in')}</ThemedText>
                                        </TouchableOpacity>
                                    </View>
                                </>}
                    </ScrollView>

                    <View style={styles.fixedFooter}>
                        <TouchableOpacity
                            style={[styles.modalButton, styles.cancelButton]}
                            onPress={() => setSelectedShift(null)}
                        >
                            <ThemedText style={styles.modalButtonText}>{t('misc_close')}</ThemedText>
                        </TouchableOpacity>
                    </View>
                    <ReasonPromptModal
                        title={reasonModalTitle}
                        diff={diff}
                        visible={showReasonModal}
                        onCancel={() => {
                            setShowReasonModal(false);
                            setCheckoutForm(null);
                        }}
                        onConfirm={(data: ReasonData) => {
                            if (isSubmittingType === 'attendance') {
                                if (checkoutForm) {
                                    const formWithReason = { ...checkoutForm, ...data };
                                    setPendingAttendance(formWithReason);
                                    makeAttendanceMutation.mutate(formWithReason);
                                }
                            } else {
                                if (checkoutForm) {
                                    const formWithReason = { ...checkoutForm, name: data.reason };
                                    setPendingAttendance(formWithReason);
                                    submitPauseMutation.mutate(formWithReason);
                                }
                            }
                            setShowReasonModal(false);
                            setCheckoutForm(null);
                        }}
                    />

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
    buttonGroup: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
        marginTop: 10,
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
