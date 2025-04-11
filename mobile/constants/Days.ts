import { Weekday } from "@/types/day";
export const getDaysOfWeek = (startWithMonday: boolean = false): Weekday[] => {
    return startWithMonday ? ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] : ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
}
export const DAYS_OF_WEEK = getDaysOfWeek();

export type DayKey = typeof DAYS_OF_WEEK[number];

export const daysOfWeeksTranslations: Record<DayKey, { shortcut: string; name: string }> = {
    sun: {
        shortcut: 'day_sunday_shortcut',
        name: 'day_sunday_name',
    },
    mon: {
        shortcut: 'day_monday_shortcut',
        name: 'day_monday_name',
    },
    tue: {
        shortcut: 'day_tuesday_shortcut',
        name: 'day_tuesday_name',
    },
    wed: {
        shortcut: 'day_wednesday_shortcut',
        name: 'day_wednesday_name',
    },
    thu: {
        shortcut: 'day_thursday_shortcut',
        name: 'day_thursday_name',
    },
    fri: {
        shortcut: 'day_friday_shortcut',
        name: 'day_friday_name',
    },
    sat: {
        shortcut: 'day_saturday_shortcut',
        name: 'day_saturday_name',
    },
}
export const TIME_FORMAT = 'HH:mm'; 