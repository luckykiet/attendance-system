import { createStore } from "./utils";

const initialStates = {
    selectedSpecificBreak: null,
    selectedSpecificBreakKey: '',
    open: false,
}

const storeExports = createStore(initialStates);

export const {
    useSelectedSpecificBreak,
    useSelectedSpecificBreakKey,
    useOpen,
    useSetSelectedSpecificBreak,
    useSetSelectedSpecificBreakKey,
    useSetOpen,
} = storeExports;