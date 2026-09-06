import { apiClient, ApiResponse } from './client';

export interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  roles: string[];
  permissions: string[];
}

export interface LoginResponseData {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  tokenType: string;
  user: AuthUser;
}

export interface RefreshResponseData {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  tokenType: string;
}

export interface CurrentUserData extends AuthUser {
  status: string;
  lastLoginAt: string | null;
}

export const authApi = {
  login: async (username: string, password: string): Promise<LoginResponseData> => {
    const response = (await apiClient.post(
      '/auth/login',
      { username, password, deviceInfo: 'Medix Desktop Station' },
    )) as unknown as ApiResponse<LoginResponseData>;
    return response.data;
  },

  refresh: async (refreshToken: string): Promise<RefreshResponseData> => {
    const response = (await apiClient.post(
      '/auth/refresh',
      { refreshToken, deviceInfo: 'Medix Desktop Station' },
    )) as unknown as ApiResponse<RefreshResponseData>;
    return response.data;
  },

  logout: async (refreshToken: string): Promise<void> => {
    await apiClient.post('/auth/logout', { refreshToken });
  },

  getMe: async (): Promise<CurrentUserData> => {
    const response = (await apiClient.get(
      '/auth/me',
    )) as unknown as ApiResponse<CurrentUserData>;
    return response.data;
  },
};
