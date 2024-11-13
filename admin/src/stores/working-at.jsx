import { createStore } from "./utils";

const initialStates = {
    registers: [],
}

const storeExports = createStore(initialStates);

export const {
    useStore,
    useRegisters,
    useSetRegisters,
    useReset,
} = storeExports;