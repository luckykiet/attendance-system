import { create } from 'zustand';

const initialStates = {
    title: '',
    mainText: '',
    subText: '',
    showConfirmBox: false,
    onConfirm: () => { },
    onCancel: () => { },
};

const useStore = create((set) => ({
    ...initialStates,
    setTitle: (title) => set({ title }),
    setMainText: (mainText) => set({ mainText }),
    setSubText: (subText) => set({ subText }),
    setShowConfirmBox: (showConfirmBox) => set({ showConfirmBox }),
    setOnConfirm: (onConfirm) => set({ onConfirm }),
    setOnCancel: (onCancel) => set({ onCancel }),
    setConfirmBox: ({ title, mainText, subText, onConfirm, onCancel }) =>
        set({ title, mainText, subText, showConfirmBox: true, onConfirm, onCancel }),
    resetConfirmBox: () => set({ ...initialStates }),
}));

export const useSetConfirmBox = () => useStore((state) => state.setConfirmBox);
export const useResetConfirmBox = () => useStore((state) => state.resetConfirmBox);
export const useConfirmBox = () => {
    const title = useStore((state) => state.title);
    const mainText = useStore((state) => state.mainText);
    const subText = useStore((state) => state.subText);
    const showConfirmBox = useStore((state) => state.showConfirmBox);
    const onConfirm = useStore((state) => state.onConfirm);
    const onCancel = useStore((state) => state.onCancel);
    return { title, mainText, subText, showConfirmBox, onConfirm, onCancel };
};
