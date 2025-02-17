import { defaultAppName, hostname } from '@/configs'
import { create } from 'zustand'

export const initialState = {
    appName: defaultAppName,
    companyName: hostname.toUpperCase(),
    webPublicUrl: hostname,
    grecaptchaSiteKey: '',
    googleMapsApiKey: '',
}

const useStore = create((set) => ({
    ...initialState,
    setConfig: (config) =>
        set((state) => ({
            ...state,
            ...config,
        })),
}))

export const useConfigStore = () => useStore()

export const useConfigStoreActions = () => {
    return useStore((state) => state.setConfig)
}
