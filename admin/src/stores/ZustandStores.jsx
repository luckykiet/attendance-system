import { create } from 'zustand'

const initialState = {
  theme: localStorage.getItem('theme') || '',
  language: localStorage.getItem('i18n-lang') || 'cs',
  drawerOpen: false,
  alertMessage: {},
}
const useStore = create((set) => ({
  ...initialState,

  setTheme: (theme) => {
    localStorage.setItem('theme', theme)
    set({ theme })
  },
  setLanguage: (language) => {
    localStorage.setItem('i18n-lang', language)
    set({ language })
  },
  setDrawerOpen: (drawerOpen) => set({ drawerOpen }),
  setAlertMessage: (alertMessage) => set({ alertMessage }),
}))

export const useTheme = () => useStore((state) => state.theme)
export const useSetTheme = () => useStore((state) => state.setTheme)

export const useLanguage = () => useStore((state) => state.language)
export const useSetLanguage = () => useStore((state) => state.setLanguage)

export const useDrawerOpen = () => useStore((state) => state.drawerOpen)
export const useSetDrawerOpen = () => useStore((state) => state.setDrawerOpen)

export const useAlertMessage = () => useStore((state) => state.alertMessage)
export const useSetAlertMessage = () => useStore((state) => state.setAlertMessage)
