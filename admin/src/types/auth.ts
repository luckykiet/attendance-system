import { ReactElement } from 'react';

// ==============================|| TYPES - AUTH  ||============================== //

export type GuardProps = {
  children: ReactElement | null;
};

export type UserProfile = {
  email?: string;
  name: string;
  registerId: string;
  resetedPassword?: boolean;
  role: string;
  username: string;
};

export interface AuthProps {
  isAuthenticated: boolean;
  isInitialized?: boolean;
  user?: UserProfile | null;
}

export type AuthStore = {
  logout: () => void;
  login: (user: UserProfile) => void;
} & AuthProps;

export interface AuthActionProps {
  type: string;
  payload?: AuthProps;
}

export interface InitialLoginContextProps {
  isAuthenticated: boolean;
  isInitialized?: boolean;
  user?: UserProfile | null | undefined;
}

export interface JWTDataProps {
  userId: string;
}
