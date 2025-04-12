import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DAYS_OF_WEEK, TIME_FORMAT } from '@/constants/Days';
import JWT from 'expo-jwt';
import { SupportedAlgorithms } from 'expo-jwt/dist/types/algorithms';
import dayjs from 'dayjs';
import { WorkingHour } from '@/types/working-hour';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import isBetween from 'dayjs/plugin/isBetween';
import { Shift } from '@/types/shift';
import { Attendance } from '@/types/attendance';

dayjs.extend(customParseFormat);
dayjs.extend(isBetween);

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
    todayWorkingHours,
    yesterdayWorkingHours,
    t,
}: {
    todayWorkingHours: WorkingHour;
    yesterdayWorkingHours?: WorkingHour;
    t: (key: string) => string;
}): {
    status: string;
    message: string;
    isYesterday: boolean;
} => {
    const now = dayjs();

    if (yesterdayWorkingHours?.isOverNight) {
        const openY = dayjs().subtract(1, 'day').hour(Number(yesterdayWorkingHours.start.split(':')[0])).minute(Number(yesterdayWorkingHours.start.split(':')[1]));
        let closeY = dayjs().hour(Number(yesterdayWorkingHours.end.split(':')[0])).minute(Number(yesterdayWorkingHours.end.split(':')[1]));
        if (closeY.isBefore(openY)) {
            closeY = closeY.add(1, 'day');
        }

        if (now.isBetween(openY, closeY, null, '[)')) {
            const message = `${yesterdayWorkingHours.start} - ${yesterdayWorkingHours.end} (${t('misc_over_night')})`;
            return {
                message,
                status: 'open',
                isYesterday: true,
            };
        }
    }

    const shift = todayWorkingHours;
    const openTime = dayjs(`${dayjs().format('YYYY-MM-DD')} ${shift.start}`, 'YYYY-MM-DD HH:mm');
    let closeTime = dayjs(`${dayjs().format('YYYY-MM-DD')} ${shift.end}`, 'YYYY-MM-DD HH:mm');

    if (shift.isOverNight && closeTime.isBefore(openTime)) {
        closeTime = closeTime.add(1, 'day');
    }

    const warningTime = openTime.subtract(1, 'hour');

    const inBeforeOneHourTime = now.isBefore(openTime) && now.isAfter(warningTime);
    const inShiftTime = now.isBetween(openTime, closeTime, null, '[)');

    const timeText = `${shift.start} - ${shift.end}${shift.isOverNight ? ` (${t('misc_over_night')})` : ''}`;

    return {
        message: timeText,
        status: inShiftTime ? 'open' : inBeforeOneHourTime ? 'warning' : 'out_of_time',
        isYesterday: false,
    };
};

export const getShiftHoursText = ({
    shift,
    isYesterday,
    attendance,
    t,
}: {
    shift: Shift;
    isYesterday: boolean;
    attendance?: Attendance;
    t: (key: string) => string;
}): {
    status: string;
    message: string;
    duration: number;
    isCheckedIn: boolean;
} => {
    const currentTime = dayjs();
    let openTime = dayjs(shift.start, TIME_FORMAT);
    let closeTime = dayjs(shift.end, TIME_FORMAT);

    if (isYesterday) {
        openTime = openTime.subtract(1, 'day');
    }

    if (shift.isOverNight && closeTime.isBefore(openTime)) {
        closeTime = closeTime.add(1, 'day');
    }

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
    breakStart: string,
    breakEnd: string,
    shiftStart: string,
    shiftEnd: string,
    isOverNight: boolean
): boolean => {
    const format = TIME_FORMAT;
    const start = dayjs(breakStart, format);
    const end = dayjs(breakEnd, format);
    const shiftStartTime = dayjs(shiftStart, format);
    let shiftEndTime = dayjs(shiftEnd, format);

    if (isOverNight || shiftEndTime.isBefore(shiftStartTime)) {
        shiftEndTime = shiftEndTime.add(1, 'day');
    }

    if (end.isBefore(start)) {
        return (
            start.isBetween(shiftStartTime, shiftEndTime, null, '[)') ||
            end.add(1, 'day').isBetween(shiftStartTime, shiftEndTime, null, '[)')
        );
    }

    return (
        start.isBetween(shiftStartTime, shiftEndTime, null, '[)') &&
        end.isBetween(shiftStartTime, shiftEndTime, null, '(]')
    );
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

export const getAttendanceStatus = ({ checkInTime = null, checkOutTime = null, shift, t, noCapT }: { checkInTime: string | null; checkOutTime: string | null, shift: Shift, t: (key: string) => string; noCapT: (key: string) => string; }): AttendanceStatus => {
    const result: AttendanceStatus = { checkInTime: null, checkOutTime: null };
    if (!checkInTime && !checkOutTime) {
        return result;
    }

    const checkIn = dayjs(checkInTime);
    const checkOut = dayjs(checkOutTime);

    const openTime = dayjs(shift.start, TIME_FORMAT);
    let closeTime = dayjs(shift.end, TIME_FORMAT);

    if (shift.isOverNight || closeTime.isBefore(openTime)) {
        closeTime = closeTime.add(1, 'day');
    }

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