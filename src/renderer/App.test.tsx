import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { App } from './App';
import { healthApi } from './api';
import { useAuthStore } from './store/authStore';

describe('App Root', () => {
  beforeEach(() => {
    vi.spyOn(healthApi, 'getHealth').mockResolvedValue({
      status: 'ok',
      appName: 'Medix by FARMAX',
      appVersion: '0.1.0',
      environment: 'test',
      uptimeSeconds: 100,
      timestamp: new Date().toISOString(),
      database: {
        status: 'connected',
        type: 'postgresql',
      },
    });
  });

  it('renders station login screen when unauthenticated', async () => {
    useAuthStore.setState({
      authStatus: 'unauthenticated',
      user: null,
      accessToken: null,
      restoreSession: vi.fn().mockResolvedValue(false),
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Station Authentication')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /sign in to station/i }),
      ).toBeInTheDocument();
    });
  });

  it('renders dashboard when authenticated', async () => {
    useAuthStore.setState({
      authStatus: 'authenticated',
      user: {
        id: 'u1',
        username: 'admin',
        displayName: 'Administrator',
        roles: ['ADMIN'],
        permissions: ['dashboard.view'],
      },
      accessToken: 'mock_token',
      restoreSession: vi.fn().mockResolvedValue(true),
    });

    render(<App />);

    await waitFor(() => {
      expect(
        screen.getByText('System Overview & Foundation Status'),
      ).toBeInTheDocument();
    });
  });
});
