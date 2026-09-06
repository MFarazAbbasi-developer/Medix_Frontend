import { create } from 'zustand';
import { authApi, AuthUser } from '../api/auth.api';
import { authStorage } from '../api/auth-storage';

export type AuthStatus =
  | 'idle'
  | 'checking'
  | 'authenticated'
  | 'unauthenticated';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  authStatus: AuthStatus;
  loginError: string | null;

  setAccessToken: (token: string | null) => void;
  setUser: (user: AuthUser | null) => void;
  setAuthStatus: (status: AuthStatus) => void;

  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  authStatus: 'idle',
  loginError: null,

  setAccessToken: (token) => set({ accessToken: token }),
  setUser: (user) => set({ user }),
  setAuthStatus: (authStatus) => set({ authStatus }),

  login: async (username: string, password: string): Promise<boolean> => {
    set({ loginError: null, authStatus: 'checking' });
    try {
      const data = await authApi.login(username, password);

      // Store refresh token in secure OS-protected storage (outside renderer)
      await authStorage.setRefreshToken(data.refreshToken);

      set({
        accessToken: data.accessToken,
        user: data.user,
        authStatus: 'authenticated',
        loginError: null,
      });

      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Invalid username or password.';
      set({
        accessToken: null,
        user: null,
        authStatus: 'unauthenticated',
        loginError: message,
      });
      return false;
    }
  },

  logout: async (): Promise<void> => {
    try {
      const refreshToken = await authStorage.getRefreshToken();
      if (refreshToken) {
        await authApi.logout(refreshToken).catch(() => {});
      }
    } finally {
      await authStorage.clearRefreshToken();
      set({
        user: null,
        accessToken: null,
        authStatus: 'unauthenticated',
        loginError: null,
      });
    }
  },

  restoreSession: async (): Promise<boolean> => {
    set({ authStatus: 'checking' });
    try {
      const refreshToken = await authStorage.getRefreshToken();
      if (!refreshToken) {
        set({ authStatus: 'unauthenticated', user: null, accessToken: null });
        return false;
      }

      // Rotate and get new token pair
      const refreshData = await authApi.refresh(refreshToken);
      await authStorage.setRefreshToken(refreshData.refreshToken);
      set({ accessToken: refreshData.accessToken });

      // Fetch user profile & permissions
      const userData = await authApi.getMe();
      set({
        user: {
          id: userData.id,
          username: userData.username,
          displayName: userData.displayName,
          roles: userData.roles,
          permissions: userData.permissions,
        },
        authStatus: 'authenticated',
      });

      return true;
    } catch {
      await authStorage.clearRefreshToken();
      set({
        user: null,
        accessToken: null,
        authStatus: 'unauthenticated',
      });
      return false;
    }
  },
}));
