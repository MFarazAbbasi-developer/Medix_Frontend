import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CustomerPaymentsPage } from './CustomerPaymentsPage';
import { customerPaymentsApi } from '../api/customer-payments.api';
import { pdcApi, PostDatedCheque } from '../api/pdc.api';
import * as customersApiModule from '../api/customers.api';

describe('CustomerPaymentsPage Component', () => {
  const mockCustomer = {
    id: 'cust-1',
    organizationId: 'org-1',
    code: 'CUST-001',
    name: 'Al-Shifa Pharmacy',
    customerType: 'RETAIL_PHARMACY' as const,
    currentBalance: 15000,
    creditLimit: 50000,
    creditDays: 30,
    defaultDiscountPercentage: 0,
    isTaxExempt: false,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockPayment = {
    id: 'pay-1',
    organizationId: 'org-1',
    branchId: 'branch-1',
    customerId: 'cust-1',
    paymentNumber: 'REC-00001',
    paymentDate: new Date().toISOString(),
    paymentMethod: 'CASH' as const,
    amount: 5000,
    allocatedAmount: 5000,
    unallocatedAmount: 0,
    referenceNumber: 'REF-12345',
    status: 'POSTED' as const,
    postedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    customer: mockCustomer,
    postedByUser: {
      id: 'u-1',
      displayName: 'Cashier Farhan',
      username: 'farhan',
    },
    allocations: [
      {
        id: 'alloc-1',
        customerPaymentId: 'pay-1',
        salesInvoiceId: 'inv-1',
        amountAllocated: 5000,
        createdAt: new Date().toISOString(),
        salesInvoice: {
          id: 'inv-1',
          invoiceNumber: 'INV-00001',
          netTotal: 10000,
          balanceAmount: 0,
        },
      },
    ],
  };

  const mockPdc: PostDatedCheque = {
    id: 'pdc-1',
    organizationId: 'org-1',
    branchId: 'branch-1',
    customerId: 'cust-1',
    pdcNumber: 'PDC-00001',
    chequeNumber: 'CHQ-998811',
    bankName: 'Meezan Bank Ltd',
    chequeDate: new Date(Date.now() + 86400000 * 10).toISOString(),
    receivedDate: new Date().toISOString(),
    amount: 25000,
    allocatedAmount: 25000,
    unallocatedAmount: 0,
    status: 'RECEIVED',
    notes: 'Advance cheque',
    customer: mockCustomer,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    allocations: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(customerPaymentsApi, 'getPayments').mockResolvedValue({
      items: [mockPayment],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
      summary: {
        totalAmount: 5000,
        totalAllocated: 5000,
        totalUnallocated: 0,
      },
    });

    vi.spyOn(pdcApi, 'getPdcs').mockResolvedValue({
      items: [mockPdc],
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      },
      metrics: {
        receivedCount: 1,
        receivedAmount: 25000,
        depositedCount: 0,
        depositedAmount: 0,
        clearedCount: 0,
        clearedAmount: 0,
        bouncedCount: 0,
        bouncedAmount: 0,
        cancelledCount: 0,
        cancelledAmount: 0,
        totalPendingAmount: 25000,
      },
    });

    vi.spyOn(customersApiModule, 'getCustomers').mockResolvedValue({
      items: [mockCustomer],
      meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
    } as any);

    vi.spyOn(customerPaymentsApi, 'getUnpaidInvoices').mockResolvedValue([
      {
        id: 'inv-1',
        invoiceNumber: 'INV-00001',
        invoiceDate: new Date().toISOString(),
        subtotal: 10000,
        discountAmount: 0,
        taxAmount: 0,
        netTotal: 10000,
        paidAmount: 5000,
        balanceAmount: 5000,
        status: 'POSTED',
      },
    ]);
  });

  it('renders payment register title and loaded payment vouchers in Tab 1', async () => {
    render(<CustomerPaymentsPage />);

    expect(screen.getByText('Customer Payments & Receipts')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('REC-00001')).toBeInTheDocument();
      expect(screen.getByText('Al-Shifa Pharmacy')).toBeInTheDocument();
      expect(screen.getByText('POSTED')).toBeInTheDocument();
    });
  });

  it('switches to Post-Dated Cheques tab and displays PDC register', async () => {
    render(<CustomerPaymentsPage />);

    const pdcTabBtn = screen.getByRole('button', { name: /Post-Dated Cheques \(PDC\)/i });
    fireEvent.click(pdcTabBtn);

    await waitFor(() => {
      expect(screen.getByText('Post-Dated Cheque (PDC) Custodial Vault')).toBeInTheDocument();
      expect(screen.getByText('PDC-00001')).toBeInTheDocument();
      expect(screen.getByText('CHQ-998811')).toBeInTheDocument();
      expect(screen.getByText('Meezan Bank Ltd')).toBeInTheDocument();
      expect(screen.getByText('RECEIVED')).toBeInTheDocument();
    });
  });

  it('opens Receive New PDC modal from the PDC workspace', async () => {
    render(<CustomerPaymentsPage />);

    const pdcTabBtn = screen.getByRole('button', { name: /Post-Dated Cheques \(PDC\)/i });
    fireEvent.click(pdcTabBtn);

    await waitFor(() => {
      expect(screen.getByText('PDC-00001')).toBeInTheDocument();
    });

    const receiveBtn = screen.getAllByRole('button', { name: /Receive New PDC/i })[0];
    fireEvent.click(receiveBtn);

    expect(screen.getByText('Receive Post-Dated Cheque (PDC)')).toBeInTheDocument();
    expect(screen.getByText(/Custodial Vault Invariant:/i)).toBeInTheDocument();
  });
});
