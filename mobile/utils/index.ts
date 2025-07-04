import Constants from 'expo-constants';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DayKey, DAYS_OF_WEEK, TIME_FORMAT } from '@/constants/Days';
import JWT from 'expo-jwt';
import { SupportedAlgorithms } from 'expo-jwt/dist/types/algorithms';
import dayjs, { Dayjs } from 'dayjs';
import { WorkingHour } from '@/types/working-hour';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import isBetween from 'dayjs/plugin/isBetween';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { Shift } from '@/types/shift';
import { Attendance } from '@/types/attendance';
import { Platform } from 'react-native';

dayjs.extend(customParseFormat);
dayjs.extend(isBetween);
dayjs.extend(isSameOrBefore);

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

export const getDiffDurationText = (diffInMinutes: number, t: (key: string) => string) => {
    if (diffInMinutes < 1) {
        return `>1 ${t('misc_min_short')}`;
    }

    const { hours, minutes } = calculateHoursFromMinutes(diffInMinutes);
    return `${hours > 0 ? `${hours} ${t('misc_hour_short')}` : ''}${minutes > 0 ? ` ${minutes} ${t('misc_min_short')}` : ''}`.trim();
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
} | null => {
    const now = dayjs();

    const workingHourTime = getStartEndTime({ start: workingHour.start, end: workingHour.end, isToday });

    if (!workingHourTime) {
        return null
    }

    const { startTime: openTime, endTime: closeTime, isOverNight } = workingHourTime;

    const warningTime = openTime.subtract(1, 'hour');

    const inBeforeOneHourTime = now.isBefore(openTime) && now.isAfter(warningTime);
    const inShiftTime = now.isBetween(openTime, closeTime);

    const timeText = `${openTime.format(TIME_FORMAT)} - ${closeTime.format(TIME_FORMAT)}${isOverNight ? ` (${t('misc_over_night')})` : ''}`;

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
} | null => {
    if (!shift.start || !shift.end) {
        return null
    }
    const shiftTime = getStartEndTime({ start: shift.start, end: shift.end, isToday });

    if (!shiftTime) {
        return null
    }

    const { startTime: openTime, endTime: closeTime, isOverNight } = shiftTime;
    const currentTime = dayjs();

    const timeText = `${openTime.format(TIME_FORMAT)} - ${closeTime.format(TIME_FORMAT)}${isOverNight ? ` (${t('misc_over_night')})` : ''}`;

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
        timeFormat = TIME_FORMAT,
    }: {
        breakStart: string;
        breakEnd: string;
        shiftStart: string;
        shiftEnd: string;
        timeFormat?: string;
    }
): boolean => {

    const baseDay = dayjs();

    const shiftTime = getStartEndTime({
        start: shiftStart,
        end: shiftEnd,
        timeFormat,
        baseDay,
    });

    if (!shiftTime) return false;

    const { startTime: sStart, endTime: sEnd, isOverNight: shiftIsOvernight } = shiftTime;

    const breakTime = getStartEndTime({
        start: breakStart,
        end: breakEnd,
        timeFormat,
        baseDay,
    });

    if (!breakTime) return false;

    let { startTime: bStart, endTime: bEnd } = breakTime;

    if (shiftIsOvernight && bEnd.isBefore(sStart)) {
        bStart = bStart.add(1, 'day');
        bEnd = bEnd.add(1, 'day');
    }

    return bStart.isBefore(sEnd) && bEnd.isAfter(sStart);
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

export const getAttendanceStatus = ({
    checkInTime = null,
    checkOutTime = null,
    isToday = true,
    shift,
    t,
    noCapT,
    baseDay = dayjs(),
}: {
    checkInTime: Date | null;
    checkOutTime: Date | null;
    shift: { start?: string; end?: string };
    isToday?: boolean;
    t: (key: string) => string;
    noCapT: (key: string) => string;
    baseDay?: Dayjs;
}): AttendanceStatus => {
    const result: AttendanceStatus = { checkInTime: null, checkOutTime: null };

    if ((!shift.start || !shift.end) || (!checkInTime && !checkOutTime)) {
        return result;
    }

    const shiftTime = getStartEndTime({
        start: shift.start,
        end: shift.end,
        isToday,
        baseDay,
    });

    if (!shiftTime) {
        return result;
    }

    const { startTime: openTime, endTime: closeTime } = shiftTime;

    const checkIn = dayjs(checkInTime);
    const checkOut = dayjs(checkOutTime);

    if (checkIn.isValid()) {
        if (checkIn.isSameOrBefore(openTime)) {
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
            };
        } else {
            const earlyDiff = closeTime.diff(checkOut, 'minute');
            const { hours, minutes } = calculateHoursFromMinutes(earlyDiff);
            result.checkOutTime = {
                message: `${t("misc_early")} ${hours > 0 ? `${hours} ${noCapT("misc_hour_short")}` : ''}${minutes > 0 ? ` ${minutes} ${noCapT("misc_min_short")}` : ''}`,
                isSuccess: false,
            };
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

export const getStartEndTime = ({
    start,
    end,
    isToday = true,
    timeFormat = TIME_FORMAT,
    baseDay = dayjs(),
}: {
    start: string;
    end: string;
    isToday?: boolean;
    timeFormat?: string;
    baseDay?: Dayjs;
}): { startTime: Dayjs; endTime: Dayjs; isOverNight: boolean } | null => {
    const base = isToday ? dayjs(baseDay) : dayjs(baseDay).subtract(1, 'day');

    const startParsed = dayjs(start, timeFormat, true);
    const endParsed = dayjs(end, timeFormat, true);

    if (!startParsed.isValid() || !endParsed.isValid() || startParsed.isSame(endParsed)) {
        return null;
    }

    const startTime = base
        .hour(startParsed.hour())
        .minute(startParsed.minute())
        .second(0)
        .millisecond(0);

    let endTime = base
        .hour(endParsed.hour())
        .minute(endParsed.minute())
        .second(0)
        .millisecond(0);

    let isOverNight = false;
    if (endTime.isBefore(startTime)) {
        isOverNight = true;
        endTime = endTime.add(1, 'day');
    }

    return { startTime, endTime, isOverNight };
};

export const getNextWeekdayDate = (dayName: DayKey, fromDate = dayjs()) => {
    const dayIndex = shiftsMap[dayName];
    const todayIndex = fromDate.day();

    let daysUntil = (dayIndex - todayIndex + 7) % 7;
    if (daysUntil === 0) daysUntil = 7;

    return fromDate.add(daysUntil, 'day');
}

const shiftsMap: Record<DayKey, number> = {
    sun: 0,
    mon: 1,
    tue: 2,
    wed: 3,
    thu: 4,
    fri: 5,
    sat: 6,
};