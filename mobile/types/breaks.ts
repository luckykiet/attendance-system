import { SpecificBreakTypes } from "./specific-break";

export type Breaks = {
    start: string,
    end: string,
    name: string,
    duration: number,
    isOverNight: boolean,
}

export type AttendanceBreak = {
    name: string;
    type: SpecificBreakTypes | 'other' | 'generic';
    reason: string;
    breakHours: {
        start: string;
        end: string;
        isOverNight: boolean;
    },
    checkInTime: Date;
    checkOutTime: Date;
}