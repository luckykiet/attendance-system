import { Address } from "./address";
import { Attendance } from "./attendance";
import { Breaks } from "./breaks";
import { Weekday } from "./day";
import { MyEmployee } from "./employee";
import { MyRetail } from "./retail";
import { Shift } from "./shift";
import { SpecificBreaksPerDay } from "./specific-break";
import { MyWorkingAt } from "./working-at";
import { WorkingHour } from "./working-hour";

export type TodayWorkplace = {
    _id: string;
    retailId: string;
    name: string;
    address: Address;
    attendances: Attendance[];
    shifts: Record<Weekday, Shift[]>;
    distanceInMeters: number | null;
    domain: string;
    location: {
        allowedRadius: number;
    }
    workingHours: Record<Weekday, WorkingHour>;
    specificBreaks: Record<Weekday, SpecificBreaksPerDay>;
    breaks: Record<Weekday, Breaks[]>;
    isToday: boolean;
}

export type MyWorkplace = {
    _id: string;
    name: string;
    workingHours: Record<Weekday, WorkingHour>;
    address: Address;
    retailId: string;
}

export type GetMyCompaniesResult = {
    registers: MyWorkplace[];
    workingAts: MyWorkingAt[];
    employees: MyEmployee[];
    retails: MyRetail[],
    domain: string;
};