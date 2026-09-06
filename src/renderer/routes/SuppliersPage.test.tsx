import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SuppliersPage } from './SuppliersPage';
import * as suppliersApi from '../api/suppliers.api';

describe('SuppliersPage Component', () => {
  const mockSuppliers = [
    {
      id: 'sup-1',
      organizationId: 'org-1',
      code: 'SUP-001',
      name: 'Getz Pharma Distribution',
      contactPerson: 'Ali Khan',
      phone: '0300-1234567',
      email: 'orders@getz.pk',
      address: 'Plot 45-B Korangi',
      city: 'Karachi',
      ntn: '1234567-8',
      strn: '11-22-3333-444',
      drugLicenseNo: 'DSL-9981',
      creditDays: 30,
      creditLimit: 500000,
      currentBalance: 45000,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      _count: { purchaseOrders: 5, goodsReceiveNotes: 3 },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(suppliersApi, 'getSuppliers').mockResolvedValue({
      items: mockSuppliers,
      meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
    } as any);
  });

  it('renders suppliers page header and metrics', async () => {
    render(<SuppliersPage />);

    expect(screen.getByText('Suppliers & Vendors')).toBeInTheDocument();
    expect(screen.getByText('Outstanding Payables')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Getz Pharma Distribution')).toBeInTheDocument();
      expect(screen.getByText('SUP-001')).toBeInTheDocument();
      expect(screen.getAllByText('PKR 45,000.00').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('opens add supplier modal when clicking Add Supplier button', async () => {
    render(<SuppliersPage />);

    const addBtn = screen.getByText('Add Supplier');
    fireEvent.click(addBtn);

    expect(screen.getByText('Add New Supplier / Vendor')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. Getz Pharma Distribution')).toBeInTheDocument();
  });

  it('opens supplier statement modal on statement action click', async () => {
    vi.spyOn(suppliersApi, 'getSupplierLedger').mockResolvedValue({
      supplier: {
        id: 'sup-1',
        code: 'SUP-001',
        name: 'Getz Pharma Distribution',
        currentBalance: 45000,
        creditLimit: 500000,
        creditDays: 30,
      },
      summary: {
        totalDebit: 10000,
        totalCredit: 55000,
        netBalance: 45000,
      },
      items: [
        {
          id: 'entry-1',
          organizationId: 'org-1',
          branchId: 'branch-1',
          supplierId: 'sup-1',
          entryType: 'GRN_INVOICE',
          referenceNumber: 'GRN-00001',
          debit: 0,
          credit: 45000,
          runningBalance: 45000,
          transactionDate: new Date().toISOString(),
          notes: 'Test GRN invoice',
          createdAt: new Date().toISOString(),
        },
      ],
      meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
    } as any);

    render(<SuppliersPage />);

    await waitFor(() => {
      expect(screen.getByText('Getz Pharma Distribution')).toBeInTheDocument();
    });

    const statementBtn = screen.getByTitle('View Sub-Ledger Statement');
    fireEvent.click(statementBtn);

    await waitFor(() => {
      expect(screen.getByText(/Supplier Statement: Getz Pharma Distribution/i)).toBeInTheDocument();
      expect(screen.getByText('GRN-00001')).toBeInTheDocument();
    });
  });
});
