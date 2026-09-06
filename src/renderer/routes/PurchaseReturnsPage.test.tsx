import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PurchaseReturnsPage } from './PurchaseReturnsPage';
import { purchaseReturnsApi } from '../api/purchase-returns.api';
import * as purchasingApiModule from '../api/purchasing.api';
import * as warehousesApiModule from '../api/warehouses.api';
import { organizationApi } from '../api/organization.api';
import { settingsApi } from '../api/settings.api';

describe('PurchaseReturnsPage Component', () => {
  const mockSupplier = {
    id: 'sup-1',
    organizationId: 'org-1',
    code: 'SUP-001',
    name: 'Getz Pharma Distribution',
    currentBalance: 50000,
    creditLimit: 200000,
    creditDays: 30,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockWarehouseStandard = {
    id: 'wh-std-1',
    organizationId: 'org-1',
    branchId: 'branch-1',
    name: 'Main Pharma Warehouse',
    code: 'WH-MAIN',
    warehouseType: 'STANDARD' as const,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockWarehouseQuarantine = {
    id: 'wh-quar-1',
    organizationId: 'org-1',
    branchId: 'branch-1',
    name: 'Quarantine Holding Area',
    code: 'WH-QUAR',
    warehouseType: 'QUARANTINE' as const,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockGrn = {
    id: 'grn-1',
    organizationId: 'org-1',
    branchId: 'branch-1',
    supplierId: 'sup-1',
    warehouseId: 'wh-std-1',
    grnNumber: 'GRN-00001',
    supplierInvoiceNumber: 'INV-99001',
    receivedDate: new Date().toISOString(),
    subtotal: 10000,
    discountAmount: 1000,
    taxAmount: 450,
    netTotal: 9450,
    paidAmount: 0,
    balanceAmount: 9450,
    status: 'POSTED' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    supplier: mockSupplier,
  };

  const mockReturnItem = {
    id: 'pret-item-1',
    purchaseReturnId: 'pret-1',
    grnItemId: 'grn-item-1',
    productId: 'prod-1',
    batchId: 'batch-1',
    batchNumber: 'BATCH-2026-A',
    expiryDate: new Date('2027-12-31').toISOString(),
    sourceWarehouseId: 'wh-std-1',
    returnedQuantity: 10,
    bonusReturnedQuantity: 0,
    totalReturnedQuantity: 10,
    stockCondition: 'SALEABLE' as const,
    unitCost: 100,
    discountPercentage: 10,
    discountAmount: 100,
    taxPercentage: 5,
    taxAmount: 45,
    lineTotal: 945,
    product: {
      id: 'prod-1',
      name: 'Augmentin 625mg Tablets',
      sku: 'AUG-625',
    },
    batch: {
      id: 'batch-1',
      batchNumber: 'BATCH-2026-A',
      expiryDate: new Date('2027-12-31').toISOString(),
      status: 'ACTIVE',
    },
  };

  const mockReturn = {
    id: 'pret-1',
    organizationId: 'org-1',
    branchId: 'branch-1',
    supplierId: 'sup-1',
    grnId: 'grn-1',
    returnNumber: 'PRET-00001',
    returnDate: new Date().toISOString(),
    status: 'POSTED' as const,
    reason: 'DAMAGED_IN_TRANSIT' as const,
    subtotal: 1000,
    discountAmount: 100,
    taxAmount: 45,
    netTotal: 945,
    notes: 'Damaged in transit packaging',
    postedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    supplier: mockSupplier,
    grn: mockGrn,
    items: [mockReturnItem],
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(purchaseReturnsApi, 'getPurchaseReturns').mockResolvedValue({
      items: [mockReturn as any],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
      summary: {
        totalNetReturn: 945,
      },
    });

    vi.spyOn(purchasingApiModule.purchasingApi, 'getGoodsReceiveNotes').mockResolvedValue({
      items: [mockGrn as any],
      total: 1,
      page: 1,
      limit: 100,
      totalPages: 1,
    } as any);

    vi.spyOn(warehousesApiModule.warehousesApi, 'getWarehouses').mockResolvedValue([
      mockWarehouseStandard,
      mockWarehouseQuarantine,
    ] as any);

    vi.spyOn(organizationApi, 'getOrganization').mockResolvedValue({
      id: 'org-1',
      name: 'Farmax Pharmaceuticals',
      legalName: 'Farmax Pharma Distribution (Pvt) Ltd',
    } as any);

    vi.spyOn(settingsApi, 'getSettings').mockResolvedValue([] as any);

    vi.spyOn(purchaseReturnsApi, 'getReturnableGrn').mockResolvedValue({
      grn: {
        id: 'grn-1',
        grnNumber: 'GRN-00001',
        supplierId: 'sup-1',
        supplierName: 'Getz Pharma Distribution',
        supplierCode: 'SUP-001',
        warehouseId: 'wh-std-1',
        warehouseName: 'Main Pharma Warehouse',
        netTotal: 9450,
        paidAmount: 0,
        balanceAmount: 9450,
        receivedDate: new Date().toISOString(),
        status: 'POSTED',
      },
      items: [
        {
          id: 'grn-item-1',
          productId: 'prod-1',
          productName: 'Augmentin 625mg Tablets',
          productSku: 'AUG-625',
          batchId: 'batch-1',
          batchNumber: 'BATCH-2026-A',
          expiryDate: new Date('2027-12-31').toISOString(),
          receivedQuantity: 100,
          bonusQuantity: 10,
          totalQuantity: 110,
          priorReturnedBilled: 0,
          priorReturnedBonus: 0,
          availableBilled: 100,
          availableBonus: 10,
          unitCost: 100,
          discountPercentage: 10,
          taxPercentage: 5,
          tradePrice: 110,
          retailPrice: 125,
          canReturnAsSaleable: true,
          isExpired: false,
        },
      ],
    });
  });

  it('renders purchase returns workspace with KPIs and register data', async () => {
    render(<PurchaseReturnsPage />);

    expect(screen.getByText('Purchase Returns & Debit Notes')).toBeInTheDocument();

    await waitFor(() => {
      expect(purchaseReturnsApi.getPurchaseReturns).toHaveBeenCalled();
      expect(screen.getByText('PRET-00001')).toBeInTheDocument();
      expect(screen.getByText('Getz Pharma Distribution')).toBeInTheDocument();
      expect(screen.getAllByText('Damaged in Transit').length).toBeGreaterThan(0);
    });
  });

  it('opens new purchase return modal and fetches returnable GRN lines', async () => {
    render(<PurchaseReturnsPage />);

    const openBtn = screen.getByText('New Purchase Return');
    fireEvent.click(openBtn);

    expect(await screen.findByText('Create Purchase Return & Debit Note')).toBeInTheDocument();

    const grnSelect = screen.getByLabelText(/Select Posted GRN/i, { selector: 'select' }) || screen.getByRole('combobox');
    fireEvent.change(grnSelect, { target: { value: 'grn-1' } });

    await waitFor(() => {
      expect(purchaseReturnsApi.getReturnableGrn).toHaveBeenCalledWith('grn-1');
      expect(screen.getByText('Augmentin 625mg Tablets')).toBeInTheDocument();
    });
  });
});
