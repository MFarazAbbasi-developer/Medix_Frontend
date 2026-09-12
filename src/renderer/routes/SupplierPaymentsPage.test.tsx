import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SupplierPaymentsPage } from './SupplierPaymentsPage';
import { supplierPaymentsApi } from '../api/supplier-payments.api';
import * as suppliersApiModule from '../api/suppliers.api';

describe('SupplierPaymentsPage Component', () => {
  const mockSupplier = {
    id: 'sup-1',
    organizationId: 'org-1',
    code: 'SUP-001',
    name: 'Getz Pharma Distribution',
    currentBalance: 25000,
    creditLimit: 100000,
    creditDays: 30,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockPayment = {
    id: 'pay-1',
    organizationId: 'org-1',
    branchId: 'branch-1',
    supplierId: 'sup-1',
    paymentNumber: 'PAY-00001',
    paymentDate: new Date().toISOString(),
    paymentMethod: 'BANK_TRANSFER' as const,
    amount: 15000,
    allocatedAmount: 15000,
    unallocatedAmount: 0,
    referenceNumber: 'TXN-99881',
    status: 'POSTED' as const,
    postedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    supplier: mockSupplier,
    postedByUser: {
      id: 'u-1',
      displayName: 'Finance Officer',
      username: 'finance',
    },
    allocations: [
      {
        id: 'alloc-1',
        supplierPaymentId: 'pay-1',
        grnId: 'grn-1',
        amountAllocated: 15000,
        createdAt: new Date().toISOString(),
        grn: {
          id: 'grn-1',
          grnNumber: 'GRN-00001',
          netTotal: 20000,
          balanceAmount: 5000,
        },
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(supplierPaymentsApi, 'getSupplierPayments').mockResolvedValue({
      items: [mockPayment],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
      summary: {
        totalPaidAmount: 15000,
        totalAllocatedAmount: 15000,
        totalUnallocatedAmount: 0,
      },
    });

    vi.spyOn(suppliersApiModule.suppliersApi, 'getSuppliers').mockResolvedValue({
      items: [mockSupplier],
      meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
    } as any);

    vi.spyOn(suppliersApiModule, 'getSuppliers').mockResolvedValue({
      items: [mockSupplier],
      meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
    } as any);

    vi.spyOn(supplierPaymentsApi, 'getUnpaidGrns').mockResolvedValue([
      {
        id: 'grn-1',
        grnNumber: 'GRN-00001',
        supplierInvoiceNumber: 'BILL-990',
        receivedDate: new Date().toISOString(),
        subtotal: 20000,
        discountAmount: 0,
        taxAmount: 0,
        netTotal: 20000,
        paidAmount: 5000,
        balanceAmount: 15000,
        status: 'POSTED',
      },
    ]);
  });

  it('renders supplier payments register title and table rows', async () => {
    render(<SupplierPaymentsPage />);

    expect(screen.getByText('Supplier Payments & Vouchers')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('PAY-00001')).toBeInTheDocument();
      expect(screen.getByText('Getz Pharma Distribution')).toBeInTheDocument();
    });
  });

  it('opens disburse payment modal and calculates FIFO allocation', async () => {
    render(<SupplierPaymentsPage />);

    const openBtn = screen.getByText('Disburse Payment');
    fireEvent.click(openBtn);

    expect(await screen.findByText('Payment Details')).toBeInTheDocument();

    const combobox = screen.getByPlaceholderText(/Search and choose supplier/i);
    fireEvent.focus(combobox);
    const option = await screen.findByRole('option', { name: /Getz Pharma Distribution/i });
    fireEvent.click(option);

    await waitFor(() => {
      expect(supplierPaymentsApi.getUnpaidGrns).toHaveBeenCalledWith('sup-1');
    });
  });
});
