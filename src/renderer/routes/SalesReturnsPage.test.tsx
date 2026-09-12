import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SalesReturnsPage } from './SalesReturnsPage';
import { salesReturnsApi, salesApi, warehousesApi } from '../api';

describe('SalesReturnsPage Component', () => {
  const mockReturn = {
    id: 'sret-1',
    organizationId: 'org-1',
    branchId: 'branch-1',
    customerId: 'cust-1',
    salesInvoiceId: 'inv-1',
    returnNumber: 'SRET-00001',
    returnDate: new Date().toISOString(),
    status: 'POSTED' as const,
    reason: 'CUSTOMER_RETURN' as const,
    refundMode: 'CREDIT_ACCOUNT' as const,
    refundAmount: 0,
    subtotal: 1800,
    discountAmount: 0,
    taxAmount: 0,
    netTotal: 1800,
    totalCostPrice: 1400,
    grossProfit: 400,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    postedAt: new Date().toISOString(),
    customer: {
      id: 'cust-1',
      code: 'CUST-001',
      name: 'Al-Shifa Pharmacy',
    },
    salesInvoice: {
      id: 'inv-1',
      invoiceNumber: 'INV-00001',
      netTotal: 10000,
    },
    postedByUser: {
      id: 'u-1',
      displayName: 'Pharmacist Bilal',
      username: 'bilal',
    },
    items: [
      {
        id: 'sret-item-1',
        salesReturnId: 'sret-1',
        salesInvoiceItemId: 'inv-item-1',
        productId: 'prod-1',
        batchId: 'batch-1',
        batchNumber: 'BAT-2026-001',
        expiryDate: new Date('2028-12-31').toISOString(),
        destinationWarehouseId: 'wh-std',
        returnedQuantity: 20,
        bonusReturnedQuantity: 0,
        totalReturnedQuantity: 20,
        stockCondition: 'SALEABLE' as const,
        unitCost: 70,
        unitPrice: 90,
        discountPercentage: 0,
        discountAmount: 0,
        taxPercentage: 0,
        taxAmount: 0,
        lineTotal: 1800,
        lineCost: 1400,
        lineProfit: 400,
        product: {
          id: 'prod-1',
          name: 'Amoxicillin 500mg',
          sku: 'AMOX-500',
        },
        destinationWarehouse: {
          id: 'wh-std',
          name: 'Main Warehouse',
          code: 'WH-MAIN',
          warehouseType: 'STANDARD' as const,
        },
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(salesReturnsApi, 'getSalesReturns').mockResolvedValue({
      items: [mockReturn as any],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
      summary: {
        totalNetReturn: 1800,
        totalRefundAmount: 0,
        totalReversedCOGS: 1400,
        totalReversedProfit: 400,
      },
    });

    const mockInvoicesRes = {
      items: [
        {
          id: 'inv-1',
          invoiceNumber: 'INV-00001',
          netTotal: 10000,
          paidAmount: 6000,
          balanceAmount: 4000,
          customer: { name: 'Al-Shifa Pharmacy' },
        } as any,
      ],
      meta: {
        page: 1,
        limit: 100,
        total: 1,
        totalPages: 1,
      },
    };

    vi.spyOn(salesApi, 'getInvoices').mockResolvedValue(mockInvoicesRes as any);

    vi.spyOn(warehousesApi, 'getWarehouses').mockResolvedValue([
      {
        id: 'wh-std',
        name: 'Main Warehouse',
        code: 'WH-MAIN',
        warehouseType: 'STANDARD',
        organizationId: 'org-1',
        branchId: 'branch-1',
        isDefault: true,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'wh-quar',
        name: 'Quarantine Warehouse',
        code: 'WH-QUAR',
        warehouseType: 'QUARANTINE',
        organizationId: 'org-1',
        branchId: 'branch-1',
        isDefault: false,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ] as any);

    vi.spyOn(salesReturnsApi, 'getReturnableInvoice').mockResolvedValue({
      invoice: {
        id: 'inv-1',
        invoiceNumber: 'INV-00001',
        invoiceDate: new Date().toISOString(),
        customerId: 'cust-1',
        customerName: 'Al-Shifa Pharmacy',
        customerCode: 'CUST-001',
        customerBalance: 4000,
        branchId: 'branch-1',
        warehouseId: 'wh-std',
        netTotal: 10000,
        paidAmount: 6000,
        balanceAmount: 4000,
        priorRefunds: 0,
        maxRefundableAmount: 6000,
      },
      items: [
        {
          id: 'inv-item-1',
          productId: 'prod-1',
          productName: 'Amoxicillin 500mg',
          productSku: 'AMOX-500',
          batchId: 'batch-1',
          batchNumber: 'BAT-2026-001',
          expiryDate: new Date('2028-12-31').toISOString(),
          billedQuantity: 100,
          bonusQuantity: 10,
          totalQuantity: 110,
          priorReturnedBilled: 0,
          priorReturnedBonus: 0,
          availableBilled: 100,
          availableBonus: 10,
          unitPrice: 90,
          discountPercentage: 0,
          taxPercentage: 0,
          unitCost: 70,
          canReturnAsSaleable: true,
          isExpired: false,
        },
      ],
    });
  });

  it('renders sales returns register header and table rows', async () => {
    render(<SalesReturnsPage />);

    expect(screen.getByText('Sales Returns & Restocking')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('SRET-00001')).toBeInTheDocument();
      expect(screen.getByText('Al-Shifa Pharmacy')).toBeInTheDocument();
      expect(screen.getByText('CUSTOMER RETURN')).toBeInTheDocument();
    });
  });

  it('opens record sales return modal, loads returnable items, and displays physical disposition options', async () => {
    render(<SalesReturnsPage />);

    await waitFor(() => {
      expect(screen.getByText('SRET-00001')).toBeInTheDocument();
    });

    const openBtn = screen.getByText('Record Sales Return');
    fireEvent.click(openBtn);

    expect(await screen.findByText('Record Sales Return / Credit Note')).toBeInTheDocument();
    const invoiceCombobox = screen.getByPlaceholderText(/Search and choose invoice/i);
    fireEvent.focus(invoiceCombobox);
    const invoiceOption = await screen.findByRole('option', { name: /INV-00001/i });
    fireEvent.click(invoiceOption);

    await waitFor(() => {
      expect(salesReturnsApi.getReturnableInvoice).toHaveBeenCalledWith('inv-1');
      expect(screen.getByText('Amoxicillin 500mg')).toBeInTheDocument();
      expect(screen.getByText('Disposition')).toBeInTheDocument();
      expect(screen.getByText('Restock Warehouse')).toBeInTheDocument();
      expect(screen.getByText('RESTOCK SALEABLE (Standard WH)')).toBeInTheDocument();
    });
  });
});

