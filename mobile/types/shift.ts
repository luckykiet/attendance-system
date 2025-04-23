export type Shift = {
    _id: string;
    start: string;
    end: string;
    isOverNight: boolean;
    isAvailable: boolean;
    allowedOverTime: number;
    pendingStatus?: 'none' | 'pause' | 'break' | 'attendance';
}