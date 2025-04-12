import { SpecificBreakTypes } from "@/types/specific-break";

export const SPECIFIC_BREAKS: SpecificBreakTypes[] = ['breakfast', 'lunch', 'dinner'];

export const specificBreakTranslations: Record<SpecificBreakTypes, { name: string }> = {
    breakfast: {
        name: 'misc_breakfast',
    },
    lunch: {
        name: 'misc_lunch',
    },
    dinner: {
        name: 'misc_dinner',
    },
}