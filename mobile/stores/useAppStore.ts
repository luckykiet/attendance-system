import { Location } from '@/types/location';
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UUID from 'react-native-uuid';

const UNIQUE_APP_ID_KEY = 'unique_app_id';
const URLS_KEY = 'urls';

type AppState = {
    appId: string | null;
    urls: string[];
    location: Location | null;
    isGettingLocation: boolean;
    setAppId: (appId: string) => void;
    setLocation: (location: Location) => void;
    loadAppId: () => Promise<void>;
    loadUrls: () => Promise<void>;
    addUrl: (url: string) => Promise<void>;
    deleteUrl: (url: string) => Promise<void>;
    setIsGettingLocation: (isGettingLocation: boolean) => void;
    refreshLocation: () => void;
};

const initStates = {
    appId: null,
    urls: [],
    location: null as Location | null,
    isGettingLocation: false,
};

export const useAppStore = create<AppState>((set, get) => ({
    ...initStates,

    setAppId: (appId) => set({ appId }),

    setLocation: (location) => set({ location }),

    setIsGettingLocation: (isGettingLocation) => set({ isGettingLocation }),

    loadAppId: async () => {
        try {
            const storedAppId = await AsyncStorage.getItem(UNIQUE_APP_ID_KEY);
            if (storedAppId) {
                set({ appId: storedAppId });
            } else {
                const newAppId = UUID.v4() as string;
                await AsyncStorage.setItem(UNIQUE_APP_ID_KEY, newAppId);
                set({ appId: newAppId });
            }
        } catch (error) {
            console.error('Failed to load App ID:', error);
        }
    },

    loadUrls: async () => {
        try {
            const savedUrls = await AsyncStorage.getItem(URLS_KEY);
            if (savedUrls) {
                set({ urls: JSON.parse(savedUrls) });
            } else {
                set({ urls: [] });
            }
        } catch (error) {
            console.error('Failed to load URLs:', error);
        }
    },

    addUrl: async (url) => {
        const { urls } = get();
        if (!urls.includes(url)) {
            const updatedUrls = [...urls, url];
            set({ urls: updatedUrls });
            await AsyncStorage.setItem(URLS_KEY, JSON.stringify(updatedUrls));
        }
    },

    deleteUrl: async (url) => {
        const { urls } = get();
        const updatedUrls = urls.filter((item) => item !== url);
        set({ urls: updatedUrls });
        await AsyncStorage.setItem(URLS_KEY, JSON.stringify(updatedUrls));
    },

    refreshLocation: () => set({ location: null }),
}));