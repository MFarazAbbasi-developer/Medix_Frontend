import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from './authStore';
import { authApi } from '../api/auth.api';
import { authStorage } from '../api/auth-storage';

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      accessToken: null,
      authStatus: 'idle',
      loginError: null,
    });
    vi.clearAllMocks();
  });

  it('should initialize with default unauthenticated state', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.authStatus).toBe('idle');
  });

  it('should perform successful login and store refresh token securely', async () => {
    const mockLoginResponse = {
      accessToken: 'access_jwt_123',
      refreshToken: 'refresh_token_456',
      expiresIn: '15m',
      tokenType: 'Bearer',
      user: {
        id: 'u1',
        username: 'admin',
        displayName: 'Admin User',
        roles: ['ADMIN'],
        permissions: ['dashboard.view', 'sales.create'],
      },
    };

    vi.spyOn(authApi, 'login').mockResolvedValue(mockLoginResponse);
    const setStorageSpy = vi.spyOn(authStorage, 'setRefreshToken').mockResolvedValue(true);

    const success = await useAuthStore.getState().login('admin', 'password123');

    expect(success).toBe(true);
    const state = useAuthStore.getState();
    expect(state.authStatus).toBe('authenticated');
    expect(state.accessToken).toBe('access_jwt_123');
    expect(state.user?.username).toBe('admin');
    expect(setStorageSpy).toHaveBeenCalledWith('refresh_token_456');
  });

  it('should handle login failure with generic error', async () => {
    vi.spyOn(authApi, 'login').mockRejectedValue(new Error('Invalid username or password.'));

    const success = await useAuthStore.getState().login('admin', 'wrong_password');

    expect(success).toBe(false);
    const state = useAuthStore.getState();
    expect(state.authStatus).toBe('unauthenticated');
    expect(state.accessToken).toBeNull();
    expect(state.loginError).toBe('Invalid username or password.');
  });

  it('should logout and clear state and secure storage', async () => {
    vi.spyOn(authStorage, 'getRefreshToken').mockResolvedValue('token_to_revoke');
    const logoutApiSpy = vi.spyOn(authApi, 'logout').mockResolvedValue();
    const clearStorageSpy = vi.spyOn(authStorage, 'clearRefreshToken').mockResolvedValue(true);

    useAuthStore.setState({
      user: { id: 'u1', username: 'admin', displayName: 'Admin', roles: [], permissions: [] },
      accessToken: 'token_123',
      authStatus: 'authenticated',
    });

    await useAuthStore.getState().logout();

    expect(logoutApiSpy).toHaveBeenCalledWith('token_to_revoke');
    expect(clearStorageSpy).toHaveBeenCalled();
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.authStatus).toBe('unauthenticated');
  });
});
