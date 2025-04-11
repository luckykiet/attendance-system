import React, { useState } from 'react';
import { Modal, View, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import ThemedText from './theme/ThemedText';
import { Colors } from '@/constants/Colors';
import useTranslation from '@/hooks/useTranslation';
import { useAppStore } from '@/stores/useAppStore';
import { calculateHoursFromMinutes, getShiftHoursText, isBreakWithinShift } from '@/utils';
import ThemedView from './theme/ThemedView';
import dayjs from 'dayjs';
import { DAYS_OF_WEEK, daysOfWeeksTranslations, TIME_FORMAT } from '@/constants/Days';
import { SPECIFIC_BREAKS } from '@/constants/SpecificBreak';
import { Breaks } from '@/types/breaks';
import { ScrollView } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { AttendanceMutation } from '@/types/attendance';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAttendanceApi } from '@/api/useAttendanceApi';
import BLEScanModal from './BLEScanModal';

// type AttendanceStatus = { checkInTime: string | number | null; checkOutTime: string | number | null };

// const getAttendanceStatus = ({ checkInTime = null, checkOutTime = null, workingHours }: { checkInTime: string | null; checkOutTime: string | null, workingHours: WorkingHours }): AttendanceStatus => {
//   const result: AttendanceStatus = { checkInTime: null, checkOutTime: null };
//   if (!checkInTime && !checkOutTime) {
//     return result;
//   }
//   const todayIndex = dayjs().day();
//   const todayKey = DAYS_OF_WEEK[todayIndex];
//   const hours = workingHours[todayKey];

//   if (!hours?.isAvailable) {
//     return result;
//   }

//   const checkIn = dayjs(checkInTime);
//   const checkOut = dayjs(checkOutTime);

//   const openTime = dayjs(hours.start, TIME_FORMAT);
//   const closeTime = dayjs(hours.end, TIME_FORMAT);

//   if (checkIn.isValid()) {
//     if (checkIn.isBefore(openTime) || checkIn.isSame(openTime)) {
//       result.checkInTime = "misc_checked_in_on_time";
//     } else {
//       const lateDiff = checkIn.diff(openTime, 'minute');
//       result.checkInTime = lateDiff;
//     }
//   }

//   if (checkOut.isValid()) {
//     if (checkOut.isAfter(closeTime) || checkOut.isSame(closeTime)) {
//       result.checkOutTime = "misc_checked_out_on_time";
//     } else {
//       const earlyDiff = checkOut.diff(closeTime, 'minute');
//       result.checkOutTime = earlyDiff;
//     }
//   }
//   return result;
// };


const ShiftSelectModal = () => {
    const queryClient = useQueryClient();
    const { t } = useTranslation();
    const { t: nonCapT } = useTranslation({ capitalize: false });
    const { selectedShift, setSelectedShift, location, setLocalDevices } = useAppStore();
    const { logAttendance } = useAttendanceApi();
    const [pendingAttendance, setPendingAttendance] = useState<AttendanceMutation | null>(null);

    const makeAttendanceMutation = useMutation(
        {
            mutationFn: (data: AttendanceMutation) => logAttendance(data),
            onSuccess: (data) => {
                if (data.localDevices) {
                    setLocalDevices(data.localDevices);
                } else {
                    Alert.alert(t('misc_attendance_success'), t(data.msg))
                    setPendingAttendance(null);
                    queryClient.invalidateQueries({ queryKey: ['todayWorkplaces'] });
                }
            },
            onError: (error) => Alert.alert(t('misc_attendance_failed'), t(typeof error === 'string' ? error : 'srv_failed_to_make_attendance')),
        }
    )

    if (!selectedShift) return null;

    const workplace = selectedShift.workplace;
    const shift = selectedShift.shift;
    const attendance = workplace.attendances.find(att => att.shiftId === shift._id);

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

            const currentTime = dayjs();
            const openTime = dayjs(shift.start, TIME_FORMAT);
            const closeTime = dayjs(shift.end, TIME_FORMAT);

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
            text += `${hours} ${nonCapT('misc_hour_short')} ${minutes} ${nonCapT('misc_min_short')}`;

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
        setSelectedShift(null);
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
        ? getShiftHoursText({ shift: selectedShift.shift, t, isYesterday: workplace.isYesterday })
        : { status: '', message: '' };

    const specificBreaks = selectedShift.workplace.specificBreaks?.[workplace.isYesterday ? yesterdayKey : todayKey];
    const breaks = selectedShift.workplace.breaks?.[workplace.isYesterday ? yesterdayKey : todayKey];
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
                            {t('misc_shift_time')}: {workplace.isYesterday ? `${t(daysOfWeeksTranslations[yesterdayKey].name)} ` : ''}{statusInfo.message || '-'}
                        </ThemedText>
                        {attendance?.checkInTime && (
                            <ThemedText>
                                {t('misc_check_in_time')}: {dayjs(attendance.checkInTime).format('DD/MM/YYYY HH:mm:ss')}
                            </ThemedText>)}
                        {attendance?.checkOutTime && (
                            <ThemedText>
                                {t('misc_check_out_time')}: {dayjs(attendance.checkOutTime).format('HH:mm')}
                            </ThemedText>)}
                        <ThemedText style={styles.groupHeader}>{t('misc_specific_breaks')}</ThemedText>
                        {specificBreaks && SPECIFIC_BREAKS.some(type =>
                            specificBreaks[type]?.isAvailable &&
                            isBreakWithinShift(
                                specificBreaks[type].start,
                                specificBreaks[type].end,
                                shift.start,
                                shift.end,
                                shift.isOverNight
                            )
                        ) ? (
                            SPECIFIC_BREAKS.map((type) => {
                                const brk = specificBreaks[type];
                                if (!brk || !brk.isAvailable) return null;

                                const isInShift = isBreakWithinShift(brk.start, brk.end, shift.start, shift.end, shift.isOverNight);
                                if (!isInShift) return null;

                                const { hours, minutes } = calculateHoursFromMinutes(brk.duration);
                                return (
                                    <View key={type} style={styles.breakRow}>
                                        <View style={styles.breakInfo}>
                                            <ThemedText style={styles.breakText}>
                                                {t(`misc_${type}`)}: {brk.start} - {brk.end}
                                                {brk.isOverNight ? ` (${t('misc_over_night')})` : ''}
                                            </ThemedText>
                                            <ThemedText style={styles.breakDurationText}>
                                                {t('misc_duration')}: {hours > 0 ? `${hours} ${nonCapT('misc_hour_short')}` : ''}{minutes > 0 ? ` ${minutes} ${nonCapT('misc_min_short', { capitalize: false })}` : ''}
                                            </ThemedText>
                                        </View>
                                        <TouchableOpacity
                                            style={styles.breakButton}
                                            onPress={() => console.log(`Begin specific break: ${type}`)}
                                        >
                                            <ThemedText style={styles.breakButtonText}>{t('misc_to_start')}</ThemedText>
                                        </TouchableOpacity>
                                    </View>
                                );
                            })
                        ) : (
                            <ThemedText style={styles.breakText}>{t('misc_no_breaks')}</ThemedText>
                        )}

                        <ThemedText style={styles.groupHeader}>{t('misc_generic_breaks')}</ThemedText>
                        {breaks?.some(b => isBreakWithinShift(b.start, b.end, shift.start, shift.end, shift.isOverNight)) ? (
                            breaks
                                .filter((b) => isBreakWithinShift(b.start, b.end, shift.start, shift.end, shift.isOverNight))
                                .map((b: Breaks, idx: number) => {
                                    const { hours, minutes } = calculateHoursFromMinutes(b.duration);
                                    return (
                                        <View key={idx} style={styles.breakRow}>
                                            <View style={styles.breakInfo}>
                                                <ThemedText style={styles.breakText}>
                                                    {b.name ? `${t(b.name)}: ` : ''}{b.start} - {b.end}
                                                    {b.isOverNight ? ` (${t('misc_over_night')})` : ''}
                                                </ThemedText>
                                                <ThemedText style={styles.breakDurationText}>
                                                    {t('misc_duration')}: {hours > 0 ? `${hours} ${nonCapT('misc_hour_short')}` : ''}{minutes > 0 ? ` ${minutes} ${nonCapT('misc_min_short', { capitalize: false })}` : ''}
                                                </ThemedText>
                                            </View>
                                            <TouchableOpacity
                                                style={styles.breakButton}
                                                onPress={() => console.log(`Begin generic break: ${b.name}`)}
                                            >
                                                <ThemedText style={styles.breakButtonText}>{t('misc_to_start')}</ThemedText>
                                            </TouchableOpacity>
                                        </View>
                                    );
                                })
                        ) : (
                            <ThemedText style={styles.breakText}>{t('misc_no_breaks')}</ThemedText>
                        )}

                        <View style={styles.attendanceInfo}>
                            <ThemedText style={styles.groupHeader}>{t('misc_attendance')}</ThemedText>
                        </View>
                        <ThemedText>
                            {t('misc_check_in')}: {attendance?.checkInTime ? dayjs(attendance.checkInTime).format('DD/MM/YYYY HH:mm:ss') : t('misc_not_checked_in')}
                        </ThemedText>
                        <ThemedText>
                            {t('misc_check_out')}: {attendance?.checkOutTime ? dayjs(attendance.checkOutTime).format('DD/MM/YYYY HH:mm:ss') : t('misc_not_checked_out')}
                        </ThemedText>
                        {!attendance?.checkOutTime && <TouchableOpacity style={styles.modalButton} onPress={handleCheckIn}>
                            <ThemedText style={styles.modalButtonText}>{t(attendance?.checkInTime ? 'misc_check_out' : 'misc_check_in')}</ThemedText>
                        </TouchableOpacity>}
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
        borderRadius: 10,
        padding: 20,
        width: '85%',
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
});

export default ShiftSelectModal;
