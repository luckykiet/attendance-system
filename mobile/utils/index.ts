import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
