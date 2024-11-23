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