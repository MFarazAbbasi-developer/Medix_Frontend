import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from './LoginPage';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/auth.api';

describe('LoginPage Component', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      accessToken: null,
      authStatus: 'unauthenticated',
      loginError: null,
    });
    vi.clearAllMocks();
  });

  it('renders login form with username and password fields', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Station Authentication')).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /sign in to station/i }),
    ).toBeInTheDocument();
  });

  it('displays validation errors when submitting empty form', async () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    const submitBtn = screen.getByRole('button', { name: /sign in to station/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/username is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  it('displays error banner on login failure', async () => {
    vi.spyOn(authApi, 'login').mockRejectedValue(
      new Error('Invalid username or password.'),
    );

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitBtn = screen.getByRole('button', { name: /sign in to station/i });

    fireEvent.change(usernameInput, { target: { value: 'admin' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText('Invalid username or password.'),
      ).toBeInTheDocument();
    });
  });
});
