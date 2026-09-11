import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';
import { AppLayout } from './AppLayout';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderWithProviders = (component: React.ReactNode) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{component}</MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('Application Shell Layout Suite', () => {
  beforeEach(() => {
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
      backendStatus: 'connected',
      apiBaseUrl: 'http://localhost:3000/api/v1',
      serverInfo: {
        appName: 'Medix Backend',
        appVersion: '1.0.0',
        databaseStatus: 'connected',
      },
      isSidebarCollapsed: false,
    });
  });

  describe('AppHeader Component', () => {
    it('renders MEDIX by FARMAX branding and pharma title', () => {
      renderWithProviders(<AppHeader />);

      expect(screen.getByText('MEDIX')).toBeInTheDocument();
      expect(screen.getByText('by FARMAX')).toBeInTheDocument();
      expect(screen.getByText('Pharma Distribution System')).toBeInTheDocument();
    });

    it('renders global quick search input with Ctrl+K shortcut hint', () => {
      renderWithProviders(<AppHeader />);

      expect(
        screen.getByPlaceholderText(/quick search products, customers/i),
      ).toBeInTheDocument();
      expect(screen.getByText('Ctrl+K')).toBeInTheDocument();
    });

    it('renders server status badge and user profile information', () => {
      renderWithProviders(<AppHeader />);

      expect(screen.getByText(/checking api|api online/i)).toBeInTheDocument();
      expect(screen.getByText('Administrator')).toBeInTheDocument();
      expect(screen.getByText('ADMIN')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
    });
  });

  describe('AppSidebar Component', () => {
    it('renders all 8 categorized navigation groups and links', () => {
      renderWithProviders(<AppSidebar />);

      // Section labels
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Sales')).toBeInTheDocument();
      expect(screen.getByText('Purchasing')).toBeInTheDocument();
      expect(screen.getByText('Inventory')).toBeInTheDocument();
      expect(screen.getByText('Parties')).toBeInTheDocument();
      expect(screen.getByText('Catalog')).toBeInTheDocument();
      expect(screen.getByText('Reports')).toBeInTheDocument();
      expect(screen.getByText('System')).toBeInTheDocument();

      // Navigation Items
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('POS Billing')).toBeInTheDocument();
      expect(screen.getByText('Receiving & PO')).toBeInTheDocument();
      expect(screen.getByText('Stock Ledger')).toBeInTheDocument();
      expect(screen.getByText('Customers')).toBeInTheDocument();
      expect(screen.getByText('Suppliers')).toBeInTheDocument();
      expect(screen.getByText('Products')).toBeInTheDocument();
      expect(screen.getByText('Pricing & Schemes')).toBeInTheDocument();
      expect(screen.getByText('Data Imports')).toBeInTheDocument();
      expect(screen.getByText('Administration')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('toggles sidebar collapse state on footer button click', () => {
      renderWithProviders(<AppSidebar />);

      const toggleButton = screen.getByRole('button', { name: /collapse sidebar/i });
      fireEvent.click(toggleButton);

      expect(useAppStore.getState().isSidebarCollapsed).toBe(true);
    });
  });

  describe('AppLayout Component', () => {
    it('renders application header, sidebar, and main workspace', () => {
      renderWithProviders(<AppLayout />);

      expect(screen.getByText('MEDIX')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(document.querySelector('main')).toBeInTheDocument();
    });
  });
});
