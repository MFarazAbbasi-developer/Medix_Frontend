import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OnboardingPage } from './OnboardingPage';
import { onboardingApi, OnboardingStatusResult } from '../api/onboarding.api';
import { useAuthStore } from '../store/authStore';

const mockOnboardingStatus: OnboardingStatusResult = {
  isInitialized: false,
  appVersion: '1.0.0',
  systemName: 'Medix Pharma Distribution',
  overallProgress: 71,
  steps: {
    businessProfile: {
      completed: true,
      name: 'FARMAX Pharma Dist',
      legalName: 'FARMAX Pharma Distributors (Pvt) Ltd',
      city: 'Karachi',
      ntn: 'NTN-12345',
      drugSaleLicenseNo: 'DSL-9988',
    },
    branchAndWarehouse: {
      completed: true,
      branchCount: 1,
      warehouseCount: 2,
      hasHeadOffice: true,
      hasQuarantineWarehouse: true,
    },
    users: {
      completed: true,
      userCount: 3,
      adminConfigured: true,
    },
    masterData: {
      completed: true,
      productsCount: 120,
      customersCount: 45,
      suppliersCount: 10,
      categoriesCount: 5,
      manufacturersCount: 8,
      unitsCount: 4,
    },
    openingBalances: {
      completed: false,
      customerBalancesCount: 0,
      totalReceivable: 0,
      supplierBalancesCount: 0,
      totalPayable: 0,
    },
    openingStock: {
      completed: false,
      batchesCount: 0,
      stockMovementsCount: 0,
      totalUnitsInStock: 0,
      totalStockValuation: 0,
    },
    systemReadiness: {
      completed: false,
      settingsCount: 15,
      numberingSeriesCount: 8,
    },
  },
  summary: {
    totalSteps: 7,
    completedSteps: 5,
    canComplete: false,
  },
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

describe('OnboardingPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: {
        id: 'user-1',
        username: 'admin',
        displayName: 'Administrator',
        roles: ['ADMIN'],
        permissions: ['system.admin', 'imports.manage'],
      },
    });

    vi.spyOn(onboardingApi, 'getStatus').mockResolvedValue(mockOnboardingStatus);
    vi.spyOn(onboardingApi, 'complete').mockResolvedValue({
      ...mockOnboardingStatus,
      isInitialized: true,
    });
    vi.spyOn(onboardingApi, 'reset').mockResolvedValue({
      ...mockOnboardingStatus,
      isInitialized: false,
    });
  });

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <OnboardingPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

  it('renders onboarding header, overall progress, and milestone stepper', async () => {
    renderComponent();

    expect(await screen.findByText('Distributor Onboarding & Setup Wizard')).toBeInTheDocument();
    expect(screen.getByText('71% Complete')).toBeInTheDocument();

    expect(screen.getByText(/1\. Business Identity/i)).toBeInTheDocument();
    expect(screen.getByText(/2\. Branch & Warehouses/i)).toBeInTheDocument();
    expect(screen.getByText(/3\. Users & Staff Access/i)).toBeInTheDocument();
    expect(screen.getByText(/4\. Catalog & Master Data/i)).toBeInTheDocument();
    expect(screen.getByText(/5\. Opening Balances/i)).toBeInTheDocument();
    expect(screen.getByText(/6\. Batch Opening Stock/i)).toBeInTheDocument();
    expect(screen.getByText(/7\. Verification & Launch/i)).toBeInTheDocument();
  });

  it('navigates through wizard steps using Next and Previous buttons', async () => {
    renderComponent();

    expect(await screen.findByText('Distributor Onboarding & Setup Wizard')).toBeInTheDocument();
    expect(screen.getByText('Step 1: Business Identity & Drug Act Compliance')).toBeInTheDocument();

    const nextBtn = screen.getByRole('button', { name: /next step/i });
    fireEvent.click(nextBtn);

    expect(screen.getByText('Step 2: Branches & Warehouse Locations')).toBeInTheDocument();

    const prevBtn = screen.getByRole('button', { name: /previous step/i });
    fireEvent.click(prevBtn);

    expect(screen.getByText('Step 1: Business Identity & Drug Act Compliance')).toBeInTheDocument();
  });

  it('displays master data counters and direct links to Import Center', async () => {
    renderComponent();

    expect(await screen.findByText('Distributor Onboarding & Setup Wizard')).toBeInTheDocument();

    const masterDataStep = screen.getByText(/4\. Catalog & Master Data/i);
    fireEvent.click(masterDataStep);

    expect(screen.getByText('Step 4: Master Catalog & Parties Setup')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument(); // products
    expect(screen.getByText('45')).toBeInTheDocument(); // customers
    expect(screen.getByText('10')).toBeInTheDocument(); // suppliers
  });

  it('explains positive balance ledger conventions in opening balances step', async () => {
    renderComponent();

    expect(await screen.findByText('Distributor Onboarding & Setup Wizard')).toBeInTheDocument();

    const balancesStep = screen.getByText(/5\. Opening Balances/i);
    fireEvent.click(balancesStep);

    expect(screen.getByText('Step 5: Customer & Supplier Opening Balances')).toBeInTheDocument();
    expect(screen.getByText(/financial ledger note:/i)).toBeInTheDocument();
    expect(screen.getByText(/customer positive balance: money owed to you/i)).toBeInTheDocument();
  });

  it('shows verification checklist and completes onboarding setup', async () => {
    renderComponent();

    expect(await screen.findByText('Distributor Onboarding & Setup Wizard')).toBeInTheDocument();

    const launchStep = screen.getByText(/7\. Verification & Launch/i);
    fireEvent.click(launchStep);

    expect(screen.getByText('Step 7: Final System Verification & Station Launch')).toBeInTheDocument();
    expect(screen.getByText(/business & tax compliance profile/i)).toBeInTheDocument();

    const completeBtn = screen.getByRole('button', { name: /complete setup & finalize system onboarding/i });
    fireEvent.click(completeBtn);

    const confirmModalBtn = await screen.findByRole('button', { name: /yes, complete setup/i });
    fireEvent.click(confirmModalBtn);

    await waitFor(() => {
      expect(onboardingApi.complete).toHaveBeenCalled();
    });
  });

  it('handles reset onboarding state trigger when already initialized', async () => {
    vi.spyOn(onboardingApi, 'getStatus').mockResolvedValue({
      ...mockOnboardingStatus,
      isInitialized: true,
    });
    renderComponent();

    expect(await screen.findByText('Distributor Onboarding & Setup Wizard')).toBeInTheDocument();

    const launchStep = screen.getByText(/7\. Verification & Launch/i);
    fireEvent.click(launchStep);

    const reopenBtn = await screen.findByRole('button', { name: /reopen setup mode/i });
    fireEvent.click(reopenBtn);

    await waitFor(() => {
      expect(onboardingApi.reset).toHaveBeenCalled();
    });
  });
});
