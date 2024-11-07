import { AuthProps, AuthStore } from '@/types/auth';

import { create } from 'zustand';

export const initialState: AuthProps = {
  isAuthenticated: false,
  isInitialized: false,
  user: null
};

const useStore = create<AuthStore>((set) => ({
  ...initialState,
  login: (user) =>
    set((state) => ({
      ...state,
      isAuthenticated: true,
      isInitialized: true,
      user
    })),

  logout: () =>
    set((state) => ({
      ...state,
      isInitialized: true,
      isAuthenticated: false,
      user: null
    }))
}));

export const useAuthStore = () => {
  const isAuthenticated = useStore((state) => state.isAuthenticated);
  const isInitialized = useStore((state) => state.isInitialized);
  const user = useStore((state) => state.user);
  return { isAuthenticated, isInitialized, user };
};

export const useAuthStoreActions = () => {
  const login = useStore((state) => state.login);
  const logout = useStore((state) => state.logout);

  return { login, logout };
};
