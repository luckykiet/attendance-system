import { create } from 'zustand';

/**
 * Universal store creator function for Zustand.
 * Automatically generates state and setter hooks based on the provided initial state.
 * 
 * @param {Object} initialState - The initial state for the store.
 * @returns {Object} An object containing Zustand store hooks.
 */
export const createStore = (initialState) => {
    const store = create((set) => {
        // Create individual setter functions for each key in the initialState
        const setters = Object.keys(initialState).reduce((acc, key) => {
            acc[`set${key.charAt(0).toUpperCase() + key.slice(1)}`] = (value) => set((state) => ({
                ...state,
                [key]: value,
            }));
            return acc;
        }, {});

        return {
            ...initialState,
            ...setters,
            reset: () => set(() => initialState),
        };
    });

    // Automatically create hooks for accessing and setting each key
    const exports = { useStore: store };
    Object.keys(initialState).forEach((key) => {
        const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1);
        exports[`use${capitalizedKey}`] = () => store((state) => state[key]);
        exports[`useSet${capitalizedKey}`] = () => store((state) => state[`set${capitalizedKey}`]);
    });

    // Reset hook to reset the state to the initial values
    exports.useReset = () => store((state) => state.reset);

    return exports;
};
