export type AttendanceWorkingHour = {
    start: string;
    end: string;
    isOverNight: boolean;
};

export type WorkingHour = {
    isAvailable: boolean;
} & AttendanceWorkingHour;