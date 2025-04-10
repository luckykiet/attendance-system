import { AttendanceBreak } from "./breaks";

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
};

export type Attendance = {
    _id: string;
    workingAtId: string;
    dailyAttendanceId: string;
    checkInTime: Date;
    checkOutTime: Date;
    breaks: AttendanceBreak[];
    
    shiftId: string;
    start: string;
    end: string;
    isOverNight: boolean;
}