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