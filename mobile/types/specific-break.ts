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