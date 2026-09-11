import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DashboardPage } from './DashboardPage';
import { reportsApi, salesApi, settingsApi } from '../api';
import { useAuthStore } from '../store/authStore';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('DashboardPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    useAuthStore.setState({
      user: {
        id: 'u1',
        username: 'admin',
        displayName: 'Administrator',
        roles: ['ADMIN'],
        permissions: ['*'],
      },
      accessToken: 'test-token',
      authStatus: 'authenticated',
    });

    vi.spyOn(settingsApi, 'getSettings').mockResolvedValue({
      items: [],
      map: {
        MIN_REMAINING_SHELF_LIFE_DAYS: '45',
      },
    });

    vi.spyOn(reportsApi, 'getDashboardMetrics').mockResolvedValue({
      today: {
        salesNet: 154000.5,
        purchasesNet: 82000,
        collections: 120000,
        grossProfit: 24500,
        invoiceCount: 18,
        grnCount: 3,
      },
      monthToDate: {
        salesNet: 1450000,
        grossProfit: 215000,
        marginPercentage: 14.8,
      },
      outstanding: {
        receivables: 485000,
        payables: 310000,
      },
      inventory: {
        quarantinedUnits: 120,
        inTransitUnits: 50,
        expiredBatches: 2,
        soonExpiringBatches: 5,
      },
    });

    vi.spyOn(salesApi, 'getInvoices').mockResolvedValue({
      items: [
        {
          id: 'inv-1',
          invoiceNumber: 'INV-2026-0001',
          invoiceDate: new Date().toISOString(),
          customer: { name: 'Al-Madina Medicos' },
          netTotal: 4500,
          status: 'POSTED',
        } as any,
      ],
      totalCount: 1,
    } as any);

    vi.spyOn(reportsApi, 'getCustomerAgingReport').mockResolvedValue({
      summary: {
        grandTotalDue: 485000,
        grandCurrent: 350000,
        grand1to30: 85000,
        grand31to60: 30000,
        grand61to90: 15000,
        grand90Plus: 5000,
      },
      data: [
        {
          customerId: 'c1',
          customerCode: 'CUST-001',
          customerName: 'Al-Madina Medicos',
          customerType: 'PHARMACY',
          creditDays: 30,
          creditLimit: 50000,
          currentBalance: 65000, // Over limit
          current: 40000,
          days1to30: 15000,
          days31to60: 10000,
          days61to90: 0,
          days90Plus: 0,
        },
      ],
    } as any);

    vi.spyOn(reportsApi, 'getSupplierAgingReport').mockResolvedValue({
      summary: {
        grandTotalPayable: 310000,
        grandCurrent: 250000,
        grand1to30: 40000,
        grand31to60: 20000,
        grand61to90: 0,
        grand90Plus: 0,
      },
      data: [],
    } as any);
  });

  it('renders page header with title, business overview, and date badge', async () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Business overview')).toBeInTheDocument();
  });

  it('renders four primary operational metric cards with loaded financial values', async () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Today's Sales")).toBeInTheDocument();
      expect(screen.getByText('Collections')).toBeInTheDocument();
      expect(screen.getByText('Receivables')).toBeInTheDocument();
      expect(screen.getByText('Payables')).toBeInTheDocument();

      expect(screen.getByText(/PKR 154,000.50/)).toBeInTheDocument();
      expect(screen.getByText(/PKR 120,000.00/)).toBeInTheDocument();
      expect(screen.getByText(/PKR 485,000.00/)).toBeInTheDocument();
      expect(screen.getByText(/PKR 310,000.00/)).toBeInTheDocument();
    });
  });

  it('renders Quick Actions and navigates to sales on New Sale click', async () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    });

    const newSaleBtn = screen.getByRole('button', { name: /new sale/i });
    fireEvent.click(newSaleBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/sales');
  });

  it('renders Today Activity and Attention Required sections with alert counts', async () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Today's Activity")).toBeInTheDocument();
      expect(screen.getByText('Attention Required')).toBeInTheDocument();

      // Recent invoice in table
      expect(screen.getByText('INV-2026-0001')).toBeInTheDocument();
      expect(screen.getByText('Al-Madina Medicos')).toBeInTheDocument();

      // Attention alerts
      expect(screen.getByText('Expiring & Expired Batches')).toBeInTheDocument();
      expect(screen.getByText('7 Batches')).toBeInTheDocument(); // 2 expired + 5 soon expiring
      expect(screen.getByText(/below minimum shelf life \(<45 days\)/i)).toBeInTheDocument();
      expect(screen.getByText('Customers Over Credit Limit')).toBeInTheDocument();
      expect(screen.getByText('1 Parties')).toBeInTheDocument();
      expect(screen.getByText('Past-Due Customer Receivables')).toBeInTheDocument();
      expect(screen.getByText('Past-Due Supplier Payables')).toBeInTheDocument();
    });
  });
});
