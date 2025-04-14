import { SpecificBreakTypes } from "./specific-break";

export type Breaks = {
    _id: string;
    start: string,
    end: string,
    name: string,
    duration: number,
    isOverNight: boolean,
}

export type BreakMutation = {
    _id?: string,
    breakId?: string | null,
    registerId: string,
    retailId: string,
    shiftId: string,
    attendanceId: string | null,
    deviceKey: string,
    domain: string,
    longitude: number,
    latitude: number,
    localDeviceId?: string,
    name: string,
};

export type AttendanceBreak = {
    _id: string;
    breakId: string | null;
    name: string;
    type: SpecificBreakTypes | 'other' | 'generic';
    breakHours: {
        start: string;
        end: string;
        duration: number;
        isOverNight: boolean;
    },
    checkInTime: Date;
    checkOutTime: Date;
}