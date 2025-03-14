import { createStore } from "./utils";

const initialStates = {
    selectedBreak: null,
    selectedBreakKey: '',
    open: false,
}

const storeExports = createStore(initialStates);

export const {
    useSelectedBreak,
    useSelectedBreakKey,
    useOpen,
    useSetSelectedBreak,
    useSetSelectedBreakKey,
    useSetOpen,
} = storeExports;