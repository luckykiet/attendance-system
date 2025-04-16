import { AttendanceBreak } from "./breaks";
import { MyEmployee } from "./employee";
import { Pause } from "./pause";
import { MyRetail } from "./retail";
import { MyWorkingAt } from "./working-at";
import { WorkingHour } from "./working-hour";
import { MyWorkplace } from "./workplaces";

export type AttendanceMutation = {
    registerId: string,
    retailId: string,
    shiftId: string,
    attendanceId: string | null,
    deviceKey: string,
    domain: string,
    longitude: number,
    latitude: number,
    localDeviceId?: string
    reason?: string,
    name?: string,
};

export type Attendance = {
    _id: string;
    workingAtId: string;
    dailyAttendanceId: string;
    checkInTime: Date;
    checkOutTime: Date;
    breaks: AttendanceBreak[];
    pauses: Pause[];
    reason?: string;

    shiftId: string;
    start: string;
    end: string;
    isOverNight: boolean;
}

export type DailyAttendance = {
    _id: string;
    date: number;
    workingHour: WorkingHour;
    registerId: string;
}

export type GetMyAttendancesResult = {
    registers: MyWorkplace[];
    workingAts: MyWorkingAt[];
    employees: MyEmployee[];
    retails: MyRetail[],
    attendances: Attendance[];
    dailyAttendances: DailyAttendance[];
    domain: string;
    hasMore: boolean;
};


export type GetMyRetailAttendancesResult = {
    registers: MyWorkplace[];
    workingAts: MyWorkingAt[];
    employees: MyEmployee[];
    retail: MyRetail,
    attendances: Attendance[];
    dailyAttendances: DailyAttendance[];
    domain: string;
    hasMore: boolean;
};