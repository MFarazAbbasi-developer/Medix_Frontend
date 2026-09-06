import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SalesPage } from './SalesPage';
import { salesApi } from '../api/sales.api';
import { customersApi } from '../api/customers.api';
import { warehousesApi } from '../api/warehouses.api';
import { productsApi } from '../api/products.api';
import { settingsApi } from '../api/settings.api';

describe('SalesPage Component', () => {
  const mockWarehouse = {
    id: 'wh-1',
    branchId: 'branch-1',
    organizationId: 'org-1',
    name: 'Main Dispensary',
    code: 'WH-MAIN',
    isDefault: true,
    isActive: true,
  };

  const mockCustomer = {
    id: 'cust-walkin',
    organizationId: 'org-1',
    code: 'CUST-WALKIN',
    name: 'Walk-in Customer (Cash)',
    customerType: 'WALK_IN' as const,
    creditDays: 0,
    creditLimit: 0,
    currentBalance: 0,
    defaultDiscountPercentage: 0,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockProduct = {
    id: 'prod-1',
    organizationId: 'org-1',
    name: 'Panadol 500mg Tab',
    sku: 'MED-PAN-500',
    genericName: 'Paracetamol',
    unit: 'Box',
    tradePrice: 400,
    retailPrice: 500,
    taxPercentage: 0,
    isActive: true,
    batches: [
      {
        id: 'batch-1',
        batchNumber: 'BT-PAN-01',
        expiryDate: '2027-12-31T00:00:00.000Z',
        quantity: 50,
        tradePrice: 400,
        retailPrice: 500,
      },
    ],
  };

  const mockFefoResponse = {
    product: {
      id: 'prod-1',
      sku: 'MED-PAN-500',
      name: 'Panadol 500mg Tab',
      genericName: 'Paracetamol',
      taxPercentage: 0,
    },
    customerPricing: {
      customPrice: null,
      discountPercentage: 0,
    },
    allocation: {
      productId: 'prod-1',
      warehouseId: 'wh-1',
      requestedQuantity: 2,
      allocatedQuantity: 2,
      shortfall: 0,
      isFullyAllocated: true,
      allocations: [
        {
          batchId: 'batch-1',
          batchNumber: 'BT-PAN-01',
          mfgDate: null,
          expiryDate: '2027-12-31T00:00:00.000Z',
          allocatedQuantity: 2,
          availableQuantity: 50,
          purchaseCost: 350,
          tradePrice: 400,
          retailPrice: 500,
        },
      ],
    },
  };

  const mockInvoice = {
    id: 'inv-1',
    organizationId: 'org-1',
    branchId: 'branch-1',
    warehouseId: 'wh-1',
    customerId: 'cust-walkin',
    invoiceNumber: 'INV-2026-0001',
    invoiceDate: new Date().toISOString(),
    status: 'POSTED' as const,
    paymentMethod: 'CASH' as const,
    subtotal: 800,
    discountAmount: 0,
    taxAmount: 0,
    netTotal: 800,
    paidAmount: 800,
    balanceAmount: 0,
    totalCostPrice: 700,
    grossProfit: 100,
    customer: mockCustomer,
    warehouse: mockWarehouse,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    items: [
      {
        id: 'item-1',
        salesInvoiceId: 'inv-1',
        productId: 'prod-1',
        batchId: 'batch-1',
        batchNumber: 'BT-PAN-01',
        expiryDate: '2027-12-31T00:00:00.000Z',
        billedQuantity: 2,
        bonusQuantity: 0,
        totalQuantity: 2,
        unitCost: 350,
        tradePrice: 400,
        retailPrice: 500,
        unitPrice: 400,
        discountPercentage: 0,
        discountAmount: 0,
        taxPercentage: 0,
        taxAmount: 0,
        lineTotal: 800,
        lineCost: 700,
        lineProfit: 100,
        product: mockProduct,
      },
    ],
    payments: [
      {
        id: 'pay-1',
        salesInvoiceId: 'inv-1',
        paymentMethod: 'CASH' as const,
        amount: 800,
        paidAt: new Date().toISOString(),
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(warehousesApi, 'getWarehouses').mockResolvedValue([mockWarehouse as any]);
    vi.spyOn(customersApi, 'getCustomers').mockResolvedValue({
      items: [mockCustomer as any],
      meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
    } as any);

    vi.spyOn(productsApi, 'getProducts').mockResolvedValue({
      items: [mockProduct as any],
      meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
    } as any);

    vi.spyOn(salesApi, 'getInvoices').mockResolvedValue({
      items: [mockInvoice as any],
      meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
    } as any);

    vi.spyOn(salesApi, 'previewFefo').mockResolvedValue(mockFefoResponse as any);
    vi.spyOn(salesApi, 'getSalesMetrics').mockResolvedValue({
      today: { invoiceCount: 1, grossSales: 800, cashCollected: 800, creditReceivablesAdded: 0, grossProfit: 100 },
      allTime: { invoiceCount: 1, grossSales: 800, cashCollected: 800, outstandingReceivables: 0, grossProfit: 100 },
      draftInvoicesCount: 0,
    });
    vi.spyOn(settingsApi, 'getSettings').mockResolvedValue({ items: [], map: {} } as any);
  });

  it('renders POS Terminal interface with customer and warehouse controls', async () => {
    render(<SalesPage />);

    expect(screen.getByText('Sales & Invoicing Terminal')).toBeInTheDocument();
    expect(screen.getByText('POS / Billing Counter')).toBeInTheDocument();
    expect(screen.getByText('Invoices History')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole('option', { name: /Walk-in Customer/i })).toBeInTheDocument();
    });
  });

  it('switches to Invoice History tab and displays invoice list', async () => {
    render(<SalesPage />);

    await waitFor(() => {
      expect(screen.getByRole('option', { name: /Walk-in Customer/i })).toBeInTheDocument();
    });

    const historyTab = screen.getByText('Invoices History');
    fireEvent.click(historyTab);

    await waitFor(() => {
      expect(screen.getByText('INV-2026-0001')).toBeInTheDocument();
    });
  });

  it('allows searching product and shows product search result', async () => {
    render(<SalesPage />);

    await waitFor(() => {
      expect(screen.getByRole('option', { name: /Walk-in Customer/i })).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Scan Barcode or type SKU/i);
    fireEvent.change(searchInput, { target: { value: 'Panadol' } });

    await waitFor(() => {
      expect(screen.getByText('Panadol 500mg Tab')).toBeInTheDocument();
    });
  });
});
