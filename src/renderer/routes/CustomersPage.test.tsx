import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CustomersPage } from './CustomersPage';
import { customersApi, customerAddressesApi } from '../api/customers.api';
import { productsApi } from '../api/products.api';
import { salesOperationsApi } from '../api/sales-operations.api';

describe('CustomersPage Component', () => {
  const mockCustomer = {
    id: 'cust-1',
    organizationId: 'org-1',
    code: 'CUST-001',
    name: 'Al-Shifa Pharmacy',
    customerType: 'RETAIL_PHARMACY' as const,
    phone: '+92 300 1234567',
    city: 'Karachi',
    creditDays: 15,
    creditLimit: 50000,
    currentBalance: 12500,
    defaultDiscountPercentage: 2.5,
    drugSaleLicenseNo: 'DL-KHI-9921',
    isTaxExempt: false,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    _count: {
      salesInvoices: 5,
      ledgerEntries: 10,
    },
  };

  const mockDeliveryAddress = {
    id: 'addr-1',
    organizationId: 'org-1',
    customerId: 'cust-1',
    title: 'Main Warehouse Depot',
    recipientName: 'Dr. Tariq',
    phone: '+92 300 7654321',
    address: 'Plot 45, Sector 12-A, Korangi Industrial Area',
    city: 'Karachi',
    routeId: 'rt-1',
    deliveryInstructions: 'Ring bell at Gate 2',
    isDefault: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    route: {
      id: 'rt-1',
      code: 'RT-001',
      name: 'South Route',
      city: 'Karachi',
      area: 'Korangi',
    },
  };

  const mockLedgerResponse = {
    customer: {
      id: 'cust-1',
      code: 'CUST-001',
      name: 'Al-Shifa Pharmacy',
      currentBalance: 12500,
      creditLimit: 50000,
      creditDays: 15,
    },
    summary: {
      totalDebit: 25000,
      totalCredit: 12500,
      netBalance: 12500,
    },
    items: [
      {
        id: 'entry-1',
        organizationId: 'org-1',
        branchId: 'branch-1',
        customerId: 'cust-1',
        entryType: 'SALES_INVOICE' as const,
        referenceNumber: 'INV-2026-0001',
        debit: 12500,
        credit: 0,
        runningBalance: 12500,
        transactionDate: new Date().toISOString(),
        notes: 'Sales Invoice INV-2026-0001',
        createdAt: new Date().toISOString(),
      },
    ],
    meta: {
      page: 1,
      limit: 50,
      total: 1,
      totalPages: 1,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(customersApi, 'getCustomers').mockResolvedValue({
      items: [mockCustomer as any],
      meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
    } as any);

    vi.spyOn(customersApi, 'getCustomerLedger').mockResolvedValue(mockLedgerResponse as any);
    vi.spyOn(customerAddressesApi, 'list').mockResolvedValue([mockDeliveryAddress as any]);
    vi.spyOn(customerAddressesApi, 'create').mockResolvedValue(mockDeliveryAddress as any);
    vi.spyOn(customerAddressesApi, 'update').mockResolvedValue(mockDeliveryAddress as any);
    vi.spyOn(customerAddressesApi, 'setDefault').mockResolvedValue({ ...mockDeliveryAddress, isDefault: true } as any);
    vi.spyOn(customerAddressesApi, 'delete').mockResolvedValue({ message: 'Deleted', softDeactivated: false } as any);

    vi.spyOn(productsApi, 'getProducts').mockResolvedValue({
      items: [],
      meta: { page: 1, limit: 100, total: 0, totalPages: 0 },
    } as any);
    vi.spyOn(salesOperationsApi, 'getSalesmen').mockResolvedValue({
      items: [],
      meta: { page: 1, limit: 100, total: 0, totalPages: 0 },
    } as any);
    vi.spyOn(salesOperationsApi, 'getRoutes').mockResolvedValue({
      items: [{ id: 'rt-1', code: 'RT-001', name: 'South Route', isActive: true } as any],
      meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
    } as any);
  });

  it('renders customer management directory and stats', async () => {
    render(<CustomersPage />);

    expect(screen.getByText('Customers & Parties')).toBeInTheDocument();
    expect(screen.getByText('Add Customer')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Al-Shifa Pharmacy')).toBeInTheDocument();
      expect(screen.getByText('CUST-001')).toBeInTheDocument();
    });
  });

  it('opens add customer modal on click', async () => {
    render(<CustomersPage />);

    const addBtn = screen.getByText('Add Customer');
    fireEvent.click(addBtn);

    expect(screen.getByText('Add New Customer / Party')).toBeInTheDocument();
    expect(screen.getByText('Create Customer')).toBeInTheDocument();
  });

  it('opens statement drawer when clicking view statement', async () => {
    render(<CustomersPage />);

    await waitFor(() => {
      expect(screen.getByText('Al-Shifa Pharmacy')).toBeInTheDocument();
    });

    const statementBtn = screen.getByTitle('View Sub-Ledger Statement');
    fireEvent.click(statementBtn);

    await waitFor(() => {
      expect(screen.getByText('Customer Statement: Al-Shifa Pharmacy')).toBeInTheDocument();
      expect(screen.getByText('INV-2026-0001')).toBeInTheDocument();
    });
  });

  it('opens delivery addresses modal and lists addresses', async () => {
    render(<CustomersPage />);

    await waitFor(() => {
      expect(screen.getByText('Al-Shifa Pharmacy')).toBeInTheDocument();
    });

    const addressesBtn = screen.getByTitle('Customer Delivery Addresses');
    fireEvent.click(addressesBtn);

    await waitFor(() => {
      expect(screen.getByText('Main Warehouse Depot')).toBeInTheDocument();
      expect(screen.getByText(/Plot 45, Sector 12-A/i)).toBeInTheDocument();
      expect(screen.getAllByText(/DEFAULT/i).length).toBeGreaterThanOrEqual(1);
    });
  });
});
