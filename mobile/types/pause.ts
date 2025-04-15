export type Pause = {
    _id?: string;
    name: string,
    checkInTime: Date;
    checkOutTime: Date;
}

export type AttendancePauseMutation = {
    registerId: string,
    retailId: string,
    shiftId: string,
    attendanceId: string | null,
    deviceKey: string,
    domain: string,
    longitude: number,
    latitude: number,
    localDeviceId?: string
    name: string,
    _id?: string,
};