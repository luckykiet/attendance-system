import Constants from 'expo-constants';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DAYS_OF_WEEK, TIME_FORMAT } from '@/constants/Days';
import JWT from 'expo-jwt';
import { SupportedAlgorithms } from 'expo-jwt/dist/types/algorithms';
import dayjs, { Dayjs } from 'dayjs';
import { WorkingHour } from '@/types/working-hour';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import isBetween from 'dayjs/plugin/isBetween';
import { Shift } from '@/types/shift';
import { Attendance } from '@/types/attendance';
import { Platform } from 'react-native';

dayjs.extend(customParseFormat);
dayjs.extend(isBetween);

export const isAndroid = /^android$/i.test(Platform.OS);
export const isIOS = /^ios$/i.test(Platform.OS);

export const androidPackage = Constants.expoConfig?.android?.package || '';
export const iosAppStoreId = Constants.expoConfig?.ios && 'appStoreId' in Constants.expoConfig.ios ? Constants.expoConfig.ios.appStoreId : '';

export const capitalizeFirstLetterOfString = (str: string) => {
    if (!str || str.length === 0) return ''
    const firstLetter = str.charAt(0).toUpperCase()
    const restOfWord = str.slice(1)
    return firstLetter + restOfWord
}

export const isValidUrl = (string: string) => {
    try {
        new URL(string);
        return true;
    } catch {
        return false;
    }
}
interface AttendanceParams {
    domain?: string;
    tokenId?: string;
    path?: string;
    [key: string]: string | undefined;
}

export const parseAttendanceUrl = (url: string): { path: string; params: AttendanceParams } => {
    const urlObject = new URL(url.replace('attendance://', 'https://'));
    const path = urlObject.hostname;
    const params: Record<string, string> = {};
    urlObject.searchParams.forEach((value, key) => {
        params[key] = value;
    });

    return { path, params };
};

export const delay = (time: number) => {
    return new Promise((resolve) => {
        setTimeout(() => resolve(undefined), time);
    });
}

export const calculateHoursFromMinutes = (diffInMinutes: number) => {
    const absMin = Math.abs(diffInMinutes);
    const hours = Math.floor(absMin / 60);
    const minutes = absMin % 60;
    return { hours, minutes };
};

export const calculateKilometersFromMeters = (pureMeters: number) => {
    const absMeters = Math.abs(pureMeters);
    const kilometers = Math.floor(absMeters / 1000);
    const meters = absMeters % 1000;
    return { kilometers, meters };
};

export const authenticate = async (t: (text: string) => string) => {
    try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        if (!hasHardware) {
            return { success: false, msg: t('srv_no_biometric_hardware') };
        }
        const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (supportedTypes.length === 0) {
            return { success: false, msg: t('srv_no_biometric_supported') };
        }

        const result = await LocalAuthentication.authenticateAsync({
            promptMessage: t('misc_authenticate'),
            cancelLabel: t('misc_cancel'),
            fallbackLabel: t('misc_retry'),
        });

        return result;
    } catch (error) {
        return { success: false, msg: t(error instanceof Error ? error.message : 'srv_unknown_error') };
    }
};

export const setBiometricPreference = async (enabled: boolean) => {
    try {
        await SecureStore.setItemAsync('biometricEnabled', JSON.stringify(enabled));
    } catch (error) {
        console.error('Error saving biometric preference:', error);
    }
};

export const getBiometricPreference = async (): Promise<boolean> => {
    try {
        const value = await SecureStore.getItemAsync('biometricEnabled');
        return value ? JSON.parse(value) : false;
    } catch (error) {
        console.error('Error retrieving biometric preference:', error);
        return false;
    }
};

export const checkReinstallation = async () => {
    const isFreshInstall = await AsyncStorage.getItem('isFreshInstall');
    const keys = ['biometricEnabled', 'deviceKey'];
    if (!isFreshInstall) {
        await Promise.all(keys.map(async (key) => {
            try {
                await SecureStore.deleteItemAsync(key);
            } catch (e) {
                console.error(`Failed to delete SecureStore key: ${key}`, e);
            }
        }));
        await AsyncStorage.setItem('isFreshInstall', 'true');
    }
};

const dayOrderMap = DAYS_OF_WEEK.reduce((acc, day, index) => {
    acc[day] = index;
    return acc;
}, {} as Record<string, number>);

export const sortByDayOfWeek = <T extends { day: string }>(array: T[]): T[] => {
    return array.slice().sort((a, b) => {
        const aOrder = dayOrderMap[a.day as keyof typeof dayOrderMap] ?? 0;
        const bOrder = dayOrderMap[b.day as keyof typeof dayOrderMap] ?? 0;
        return aOrder - bOrder;
    });
};

export const signJwt = (payload: Record<string, unknown>, secret: string) => {
    if (!payload || !secret) {
        return null;
    }
    return JWT.encode({ ...payload, timestamp: dayjs().unix() }, secret, { algorithm: SupportedAlgorithms.HS512 });
}

export const getWorkingHoursText = ({
    workingHour,
    isToday,
    t,
}: {
    workingHour: WorkingHour;
    isToday: boolean;
    t: (key: string) => string;
}): {
    status: string;
    message: string;
    isToday: boolean;
} => {
    const now = dayjs();

    const { startTime: openTime, endTime: closeTime } = getStartEndTime({ start: workingHour.start, end: workingHour.end, isToday });

    const warningTime = openTime.subtract(1, 'hour');

    const inBeforeOneHourTime = now.isBefore(openTime) && now.isAfter(warningTime);
    const inShiftTime = now.isBetween(openTime, closeTime, null, '[)');

    const timeText = `${workingHour.start} - ${workingHour.end}${workingHour.isOverNight ? ` (${t('misc_over_night')})` : ''}`;

    return {
        message: timeText,
        status: inShiftTime ? 'open' : inBeforeOneHourTime ? 'warning' : 'out_of_time',
        isToday,
    };
};

export const getShiftHoursText = ({
    shift,
    isToday,
    attendance,
    t,
}: {
    shift: Shift;
    isToday: boolean;
    attendance?: Attendance;
    t: (key: string) => string;
}): {
    status: string;
    message: string;
    duration: number;
    isCheckedIn: boolean;
} => {
    const currentTime = dayjs();
    const { startTime: openTime, endTime: closeTime } = getStartEndTime({ start: shift.start, end: shift.end, isToday });

    const timeText = `${shift.start} - ${shift.end}${shift.isOverNight ? ` (${t('misc_over_night')})` : ''}`;

    const isInShiftTime = currentTime.isBetween(openTime, closeTime);
    const isCheckedIn = !!attendance?.checkInTime && dayjs(attendance.checkInTime).isValid();

    let status: 'open' | 'warning' | 'out_of_time' = 'out_of_time';
    let duration: number;

    if (isCheckedIn) {
        if (isInShiftTime) {
            status = 'open';
            duration = currentTime.diff(closeTime, 'minutes');
        } else if (currentTime.isAfter(closeTime)) {
            status = 'warning';
            duration = currentTime.diff(closeTime, 'minutes');
        } else {
            status = 'out_of_time';
            duration = openTime.diff(currentTime, 'minutes');
        }
    } else {
        if (currentTime.isBefore(openTime)) {
            status = 'open';
            duration = currentTime.diff(openTime, 'minutes');
        } else if (isInShiftTime) {
            status = 'warning';
            duration = currentTime.diff(openTime, 'minutes');
        } else {
            status = 'out_of_time';
            duration = currentTime.diff(openTime, 'minutes');
        }
    }

    return {
        status,
        message: timeText,
        duration,
        isCheckedIn,
    };
};

export const isBreakWithinShift = (
    {
        breakStart,
        breakEnd,
        shiftStart,
        shiftEnd,
        isToday,
    }: {
        breakStart: string;
        breakEnd: string;
        shiftStart: string;
        shiftEnd: string;
        isToday: boolean;
    }
): boolean => {
    const { startTime: breakStartTime, endTime: breakEndTime } = getStartEndTime({ start: breakStart, end: breakEnd, isToday });
    const { startTime: shiftStartTime, endTime: shiftEndTime } = getStartEndTime({ start: shiftStart, end: shiftEnd, isToday });

    return breakStartTime.isBefore(shiftEndTime) && breakEndTime.isAfter(shiftStartTime);
};


type AttendanceStatus = {
    checkInTime: {
        message: string;
        isSuccess: boolean;
    } | null;
    checkOutTime: {
        message: string;
        isSuccess: boolean;
    } | null;
};

export const getAttendanceStatus = ({ checkInTime = null, checkOutTime = null, isToday = true, shift, t, noCapT }: { checkInTime: string | null; checkOutTime: string | null, shift: Shift, isToday: boolean, t: (key: string) => string; noCapT: (key: string) => string; }): AttendanceStatus => {
    const result: AttendanceStatus = { checkInTime: null, checkOutTime: null };
    if (!checkInTime && !checkOutTime) {
        return result;
    }

    const checkIn = dayjs(checkInTime);
    const checkOut = dayjs(checkOutTime);

    const { startTime: openTime, endTime: closeTime } = getStartEndTime({ start: shift.start, end: shift.end, isToday });

    if (checkIn.isValid()) {
        if (checkIn.isBefore(openTime) || checkIn.isSame(openTime)) {
            result.checkInTime = {
                message: t("misc_checked_in_on_time"),
                isSuccess: true,
            };
        } else {
            const lateDiff = checkIn.diff(openTime, 'minute');
            const { hours, minutes } = calculateHoursFromMinutes(lateDiff);
            result.checkInTime = {
                message: `${t("misc_late")} ${hours > 0 ? `${hours} ${noCapT("misc_hour_short")}` : ''}${minutes > 0 ? ` ${minutes} ${noCapT("misc_min_short")}` : ''}`,
                isSuccess: false,
            };
        }
    }

    if (checkOut.isValid()) {
        if (checkOut.isAfter(closeTime) || checkOut.isSame(closeTime)) {
            result.checkOutTime = {
                message: t("misc_checked_out_on_time"),
                isSuccess: true,
            }
        } else {
            const earlyDiff = checkOut.diff(closeTime, 'minute');
            const { hours, minutes } = calculateHoursFromMinutes(earlyDiff);
            result.checkOutTime = {
                message: `${t("misc_early")} ${hours > 0 ? `${hours} ${noCapT("misc_hour_short")}` : ''}${minutes > 0 ? ` ${minutes} ${noCapT("misc_min_short")}` : ''}`,
                isSuccess: false,
            }
        }
    }
    return result;
};

type BiometricResult =
    | { success: true; msg: string | { title: string; message: string } }
    | { success: false; msg: { title: string; message: string } };

export const checkBiometric = async (t: (key: string) => string): Promise<BiometricResult> => {
    const biometricEnabled = await SecureStore.getItemAsync('biometricEnabled');

    if (!biometricEnabled) {
        return {
            success: true,
            msg: {
                title: 'misc_error',
                message: 'srv_biometric_permissions_disabled',
            },
        };
    }

    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (!hasHardware || !isEnrolled) {
        return {
            success: false,
            msg: {
                title: 'misc_error',
                message: 'srv_biometric_permissions_disabled',
            },
        };
    }

    const biometricResult = await LocalAuthentication.authenticateAsync({
        promptMessage: t('misc_authenticate_to_continue'),
        cancelLabel: t('misc_cancel'),
    });

    if (!biometricResult.success) {
        return {
            success: false,
            msg: {
                title: 'srv_authentication_failed',
                message: 'srv_please_try_again',
            },
        };
    }

    return {
        success: true,
        msg: 'misc_authorized',
    };
};

export const getStartEndTime = ({ start, end, isToday = true, timeFormat = TIME_FORMAT }: { start: string, end: string, isToday?: boolean, timeFormat?: string }): { startTime: Dayjs, endTime: Dayjs, isOverNight: boolean } => {
    const startTime = isToday ? dayjs(start, timeFormat) : dayjs(start, timeFormat).subtract(1, 'day');
    let endTime = isToday ? dayjs(end, timeFormat) : dayjs(end, timeFormat).subtract(1, 'day');
    let isOverNight = false;
    if (endTime.isBefore(startTime)) {
        isOverNight = true;
        endTime = endTime.add(1, 'day');
    }

    return { startTime, endTime, isOverNight };
}