export type SpecificBreakTypes = 'breakfast' | 'lunch' | 'dinner';

export type SpecificBreaksPerDay = {
    [K in SpecificBreakTypes]: SpecificBreak;
};

export type SpecificBreak = {
    start: string;
    end: string;
    duration: number;
    isOverNight: boolean;
    isAvailable: boolean;
}

export type SpecificBreakMutation = {
    _id?: string,
    registerId: string,
    retailId: string,
    shiftId: string,
    attendanceId: string | null,
    deviceKey: string,
    domain: string,
    longitude: number,
    latitude: number,
    localDeviceId?: string,
    breakKey: SpecificBreakTypes,
};