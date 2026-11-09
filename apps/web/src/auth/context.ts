import { createContext } from 'react';
import type {
  LoginRequest,
  RegisterRequest,
  UserResponse,
} from '../services/apiClient';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export type AuthContextValue = {
  status: AuthStatus;
  user: UserResponse | null;
  login: (credentials: LoginRequest) => Promise<UserResponse>;
  register: (payload: RegisterRequest) => Promise<UserResponse>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
