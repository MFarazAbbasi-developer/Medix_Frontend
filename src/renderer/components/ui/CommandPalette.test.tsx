import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CommandPalette } from './CommandPalette';
import { useAppStore } from '../../store/appStore';
import { useAuthStore } from '../../store/authStore';

const mockedNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
  };
});

describe('CommandPalette Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: {
        id: 'usr-1',
        username: 'admin',
        displayName: 'Administrator',
        roles: ['ADMIN'],
        permissions: ['*'],
      },
      accessToken: 'mock-token',
      authStatus: 'authenticated',
    });
    useAppStore.setState({
      isCommandPaletteOpen: true,
    });
  });

  it('renders command palette with search input and navigable actions when open', () => {
    render(
      <MemoryRouter>
        <CommandPalette />
      </MemoryRouter>,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/type a command or navigate to page/i),
    ).toBeInTheDocument();
    expect(screen.getByText('Dashboard & Overview')).toBeInTheDocument();
    expect(screen.getByText('New Sale / POS Billing')).toBeInTheDocument();
    expect(screen.getByText('Receive Stock (GRN & Purchasing)')).toBeInTheDocument();
    expect(screen.getByText('Stock Ledger & Balances')).toBeInTheDocument();
  });

  it('filters commands according to search query', () => {
    render(
      <MemoryRouter>
        <CommandPalette />
      </MemoryRouter>,
    );

    const input = screen.getByPlaceholderText(/type a command or navigate to page/i);
    fireEvent.change(input, { target: { value: 'challan' } });

    expect(screen.getByText('Delivery Orders & Challans')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard & Overview')).not.toBeInTheDocument();
  });

  it('executes navigation on enter key press', () => {
    render(
      <MemoryRouter>
        <CommandPalette />
      </MemoryRouter>,
    );

    const input = screen.getByPlaceholderText(/type a command or navigate to page/i);
    fireEvent.change(input, { target: { value: 'POS' } });

    fireEvent.keyDown(input, { key: 'Enter' });

    expect(mockedNavigate).toHaveBeenCalledWith('/sales');
    expect(useAppStore.getState().isCommandPaletteOpen).toBe(false);
  });

  it('navigates with keyboard arrows and executes selected command', () => {
    render(
      <MemoryRouter>
        <CommandPalette />
      </MemoryRouter>,
    );

    const input = screen.getByPlaceholderText(/type a command or navigate to page/i);
    // Press down to select second item
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(mockedNavigate).toHaveBeenCalledWith('/sales');
    expect(useAppStore.getState().isCommandPaletteOpen).toBe(false);
  });

  it('closes on Escape key press', () => {
    render(
      <MemoryRouter>
        <CommandPalette />
      </MemoryRouter>,
    );

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(useAppStore.getState().isCommandPaletteOpen).toBe(false);
  });

  it('navigates when an item is clicked directly', () => {
    render(
      <MemoryRouter>
        <CommandPalette />
      </MemoryRouter>,
    );

    const reportsOption = screen.getByText('Reports & Operational Analytics');
    fireEvent.click(reportsOption);

    expect(mockedNavigate).toHaveBeenCalledWith('/reports');
    expect(useAppStore.getState().isCommandPaletteOpen).toBe(false);
  });

  it('respects user permissions for restricted items', () => {
    useAuthStore.setState({
      user: {
        id: 'usr-cashier',
        username: 'cashier',
        displayName: 'Cashier',
        roles: ['CASHIER'],
        permissions: ['sales.create', 'sales.view'],
      },
      accessToken: 'cashier-token',
      authStatus: 'authenticated',
    });

    render(
      <MemoryRouter>
        <CommandPalette />
      </MemoryRouter>,
    );

    expect(screen.getByText('Dashboard & Overview')).toBeInTheDocument();
    expect(screen.getByText('New Sale / POS Billing')).toBeInTheDocument();
    // System Administration requires users.view / admin which cashier lacks
    expect(screen.queryByText('System Administration & Security')).not.toBeInTheDocument();
  });
});
