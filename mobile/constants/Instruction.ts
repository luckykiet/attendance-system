import { InstructionSection } from "@/types/instruction";

export const INSTRUCTION: InstructionSection[] = [
    {
        title: 'misc_initial_instructions',
        listType: 'numbered',
        children: Array.from({ length: 4 }, (_, i) => ({
            text: `misc_initial_instruction_${i + 1}`,
        })),
    },
    {
        title: 'misc_home_page_instructions',
        listType: 'numbered',
        children: Array.from({ length: 9 }, (_, i) => ({
            text: `misc_home_page_instructions_${i + 1}`,
        })),
    },
    {
        title: 'misc_history_instructions',
        listType: 'numbered',
        children: Array.from({ length: 2 }, (_, i) => ({
            text: `misc_history_instructions_${i + 1}`,
        })),
    },
    {
        title: 'misc_workplaces_list_instructions',
        listType: 'numbered',
        children: Array.from({ length: 3 }, (_, i) => ({
            text: `misc_workplaces_list_instructions_${i + 1}`,
        })),
    },
    {
        title: 'misc_registration_instructions',
        listType: 'numbered',
        children: Array.from({ length: 4 }, (_, i) => ({
            text: `misc_registration_instructions_${i + 1}`,
        })),
    },
    {
        title: 'misc_settings_instructions',
        listType: 'numbered',
        children: Array.from({ length: 4 }, (_, i) => ({
            text: `misc_settings_instructions_${i + 1}`,
        })),
    },
];
