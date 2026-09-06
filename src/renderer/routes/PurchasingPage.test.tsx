import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PurchasingPage } from './PurchasingPage';
import * as purchasingApi from '../api/purchasing.api';
import * as suppliersApi from '../api/suppliers.api';
import { warehousesApi } from '../api/warehouses.api';
import { productsApi } from '../api/products.api';

describe('PurchasingPage Component', () => {
  const mockWarehouse = {
    id: 'wh-1',
    branchId: 'branch-1',
    organizationId: 'org-1',
    name: 'Main Storage',
    code: 'WH-MAIN',
    isDefault: true,
    isActive: true,
  };

  const mockSupplier = {
    id: 'sup-1',
    organizationId: 'org-1',
    code: 'SUP-001',
    name: 'Getz Pharma',
    creditDays: 30,
    creditLimit: 100000,
    currentBalance: 0,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockProduct = {
    id: 'prod-1',
    organizationId: 'org-1',
    name: 'Panadol 500mg',
    sku: 'MED-PAN-500',
    genericName: 'Paracetamol',
    taxPercentage: '0',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockGrn = {
    id: 'grn-1',
    organizationId: 'org-1',
    branchId: 'branch-1',
    warehouseId: 'wh-1',
    supplierId: 'sup-1',
    grnNumber: 'GRN-00042',
    supplierInvoiceNumber: 'INV-9921',
    receivedDate: new Date().toISOString(),
    status: 'POSTED' as const,
    subtotal: 4000,
    discountAmount: 0,
    taxAmount: 0,
    netTotal: 4000,
    supplier: mockSupplier,
    warehouse: mockWarehouse,
    _count: { items: 2 },
  };

  const mockPo = {
    id: 'po-1',
    organizationId: 'org-1',
    branchId: 'branch-1',
    supplierId: 'sup-1',
    poNumber: 'PO-00005',
    orderDate: new Date().toISOString(),
    status: 'ISSUED' as const,
    subtotal: 5000,
    discountAmount: 0,
    taxAmount: 0,
    netTotal: 5000,
    supplier: mockSupplier,
    _count: { items: 1, goodsReceiveNotes: 0 },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(warehousesApi, 'getWarehouses').mockResolvedValue([mockWarehouse as any]);
    vi.spyOn(suppliersApi, 'getSuppliers').mockResolvedValue({
      items: [mockSupplier as any],
      meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
    } as any);
    vi.spyOn(productsApi, 'getProducts').mockResolvedValue({
      items: [mockProduct as any],
      meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
    } as any);

    vi.spyOn(purchasingApi, 'getGoodsReceiveNotes').mockResolvedValue({
      items: [mockGrn as any],
      meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
    } as any);

    vi.spyOn(purchasingApi, 'getPurchaseOrders').mockResolvedValue({
      items: [mockPo as any],
      meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
    } as any);
  });

  it('renders GRN tab by default and displays receiving records', async () => {
    render(<PurchasingPage />);

    expect(screen.getByText('Purchasing & Goods Receiving')).toBeInTheDocument();
    expect(screen.getByText('Goods Receive Notes (GRN)')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('GRN-00042')).toBeInTheDocument();
      expect(screen.getByText('Getz Pharma')).toBeInTheDocument();
    });
  });

  it('switches between GRN and Purchase Orders tab', async () => {
    render(<PurchasingPage />);

    const poTab = screen.getByText('Purchase Orders');
    fireEvent.click(poTab);

    await waitFor(() => {
      expect(screen.getByText('PO-00005')).toBeInTheDocument();
      expect(screen.getByText('New Purchase Order')).toBeInTheDocument();
    });
  });

  it('opens New GRN Receiving entry dock modal', async () => {
    render(<PurchasingPage />);

    const receiveBtn = screen.getByText('Receive Goods (GRN)');
    fireEvent.click(receiveBtn);

    expect(screen.getByText('Goods Receiving Note (GRN) Entry Dock')).toBeInTheDocument();
    expect(screen.getByText(/Capture batches, regulatory expiry/i)).toBeInTheDocument();
    expect(screen.getByText('Post & Receive into Stock')).toBeInTheDocument();
  });
});
