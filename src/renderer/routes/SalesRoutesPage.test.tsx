import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SalesRoutesPage } from './SalesRoutesPage';
import { salesOperationsApi } from '../api/sales-operations.api';
import { organizationApi } from '../api/organization.api';
import { ToastProvider } from '../components/ui/Toast';

describe('SalesRoutesPage Component', () => {
  const mockRoute = {
    id: 'rt-1',
    organizationId: 'org-1',
    branchId: null,
    code: 'RT-KHI-01',
    name: 'Clifton & Defence',
    city: 'Karachi',
    area: 'South',
    notes: 'Primary southern route',
    isActive: true,
    branch: null,
    assignedSalesmen: [
      {
        id: 'sm-1',
        code: 'SM-001',
        name: 'Tariq Mehmood',
        phone: '0300-1234567',
        isActive: true,
      },
    ],
    _count: {
      salesInvoices: 24,
      customers: 15,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(salesOperationsApi, 'getSalesRoutes').mockResolvedValue({
      items: [mockRoute as any],
      meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
    });
    vi.spyOn(salesOperationsApi, 'getRoutes').mockResolvedValue({
      items: [mockRoute as any],
      meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
    });
    vi.spyOn(salesOperationsApi, 'getSalesmen').mockResolvedValue({
      items: [
        {
          id: 'sm-1',
          organizationId: 'org-1',
          branchId: null,
          code: 'SM-001',
          name: 'Tariq Mehmood',
          phone: '0300-1234567',
          email: null,
          notes: null,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as any,
      ],
      meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
    });
    vi.spyOn(organizationApi, 'getBranches').mockResolvedValue([]);
  });

  it('renders routes directory and metrics', async () => {
    render(
      <ToastProvider>
        <SalesRoutesPage />
      </ToastProvider>,
    );

    expect(screen.getByText('Sales Routes & Territories')).toBeInTheDocument();
    expect(screen.getByText('Add Route')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Clifton & Defence')).toBeInTheDocument();
      expect(screen.getByText('RT-KHI-01')).toBeInTheDocument();
      expect(screen.getByText('Tariq Mehmood')).toBeInTheDocument();
    });
  });

  it('opens add route modal on click', async () => {
    render(
      <ToastProvider>
        <SalesRoutesPage />
      </ToastProvider>,
    );

    const addBtn = screen.getByText('Add Route');
    fireEvent.click(addBtn);

    expect(screen.getByText('Add New Sales Route')).toBeInTheDocument();
    expect(screen.getByText('Create Route')).toBeInTheDocument();
  });
});
