import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SalesmenPage } from './SalesmenPage';
import { salesOperationsApi } from '../api/sales-operations.api';
import { organizationApi } from '../api/organization.api';
import { ToastProvider } from '../components/ui/Toast';

describe('SalesmenPage Component', () => {
  const mockSalesman = {
    id: 'sm-1',
    organizationId: 'org-1',
    branchId: null,
    code: 'SM-001',
    name: 'Tariq Mehmood',
    phone: '0300-1234567',
    email: 'tariq@medix.pk',
    notes: 'Senior Field Executive',
    isActive: true,
    branch: null,
    assignedRoutes: [
      {
        id: 'rt-1',
        code: 'RT-KHI-01',
        name: 'Clifton & Defence',
        city: 'Karachi',
        area: 'South',
        isActive: true,
      },
    ],
    _count: {
      salesInvoices: 12,
      customers: 8,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(salesOperationsApi, 'getSalesmen').mockResolvedValue({
      items: [mockSalesman as any],
      meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
    });
    const mockRoutesResponse = {
      items: [
        {
          id: 'rt-1',
          organizationId: 'org-1',
          branchId: null,
          code: 'RT-KHI-01',
          name: 'Clifton & Defence',
          city: 'Karachi',
          area: 'South',
          notes: null,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as any,
      ],
      meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
    };
    vi.spyOn(salesOperationsApi, 'getRoutes').mockResolvedValue(mockRoutesResponse);
    vi.spyOn(salesOperationsApi, 'getSalesRoutes').mockResolvedValue(mockRoutesResponse);
    vi.spyOn(organizationApi, 'getBranches').mockResolvedValue([]);
  });

  it('renders salesmen directory and metrics', async () => {
    render(
      <ToastProvider>
        <SalesmenPage />
      </ToastProvider>,
    );

    expect(screen.getByText('Salesmen Directory')).toBeInTheDocument();
    expect(screen.getByText('Add Salesman')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Tariq Mehmood')).toBeInTheDocument();
      expect(screen.getByText('SM-001')).toBeInTheDocument();
      expect(screen.getByText('RT-KHI-01')).toBeInTheDocument();
    });
  });

  it('opens add salesman modal on click', async () => {
    render(
      <ToastProvider>
        <SalesmenPage />
      </ToastProvider>,
    );

    const addBtn = screen.getByText('Add Salesman');
    fireEvent.click(addBtn);

    expect(screen.getByText('Add New Salesman')).toBeInTheDocument();
    expect(screen.getByText('Create Salesman')).toBeInTheDocument();
  });
});
