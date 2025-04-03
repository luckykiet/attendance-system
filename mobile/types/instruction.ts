
export type InstructionChild = string | { text: string; children?: InstructionChild[] };

export type InstructionSection = {
    title: string;
    listType?: 'numbered' | 'bulleted';
    children: InstructionChild[];
};
