import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { InventoryPage } from './InventoryPage';
import { inventoryApi } from '../api/inventory.api';
import { warehousesApi } from '../api/warehouses.api';
import { productsApi } from '../api/products.api';
import { batchesApi } from '../api/batches.api';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

describe('InventoryPage Component', () => {
  const mockWarehouse = {
    id: 'wh-1',
    organizationId: 'org-1',
    branchId: 'branch-1',
    name: 'Main Warehouse',
    code: 'WH-MAIN',
    isDefault: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockProduct = {
    id: 'prod-1',
    organizationId: 'org-1',
    sku: 'MED-PAN-001',
    name: 'Panadol Extra 500mg/65mg',
    genericName: 'Paracetamol + Caffeine',
    dosageForm: 'Tablet',
    strength: '500mg / 65mg',
    packSize: '200',
    taxPercentage: '0',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    unit: { id: 'u-1', organizationId: 'org-1', name: 'Box', symbol: 'Box', isActive: true, createdAt: '', updatedAt: '' },
    batches: [],
  };

  const mockBatch = {
    id: 'batch-1',
    productId: 'prod-1',
    batchNumber: 'BN-2026-001',
    expiryDate: '2028-01-01T00:00:00.000Z',
    purchaseCost: 450,
    tradePrice: 500,
    retailPrice: 575,
    status: 'ACTIVE' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(warehousesApi, 'getWarehouses').mockResolvedValue([mockWarehouse]);

    vi.spyOn(inventoryApi, 'getInventorySummary').mockResolvedValue({
      items: [
        {
          id: 'prod-1',
          sku: 'MED-PAN-001',
          name: 'Panadol Extra 500mg/65mg',
          genericName: 'Paracetamol + Caffeine',
          dosageForm: 'Tablet',
          strength: '500mg / 65mg',
          packSize: '200',
          unit: { id: 'u-1', name: 'Box', symbol: 'Box' },
          isActive: true,
          physicalStock: 120,
          saleableStock: 120,
          quarantinedStock: 0,
          recalledStock: 0,
          expiredStock: 0,
          totalCostValuation: 54000,
          totalTradeValuation: 60000,
          batchCount: 1,
        },
      ],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });

    vi.spyOn(inventoryApi, 'getStockLedger').mockResolvedValue({
      items: [
        {
          id: 'move-1',
          organizationId: 'org-1',
          branchId: 'branch-1',
          warehouseId: 'wh-1',
          productId: 'prod-1',
          batchId: 'batch-1',
          movementType: 'OPENING_BALANCE',
          quantity: 120,
          unitCost: 450,
          referenceType: 'OPENING_BALANCE',
          movementDate: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          warehouse: mockWarehouse,
          product: { id: 'prod-1', name: 'Panadol Extra', sku: 'MED-PAN-001', genericName: 'Paracetamol' },
          batch: { id: 'batch-1', batchNumber: 'BN-2026-001', expiryDate: '2028-01-01', status: 'ACTIVE' },
          createdByUser: { id: 'u-1', username: 'admin', displayName: 'System Admin' },
        },
      ],
      meta: { page: 1, limit: 30, total: 1, totalPages: 1 },
    });

    vi.spyOn(inventoryApi, 'getStockAdjustments').mockResolvedValue({
      items: [
        {
          id: 'adj-1',
          organizationId: 'org-1',
          branchId: 'branch-1',
          warehouseId: 'wh-1',
          adjustmentNumber: 'ADJ-00001',
          reason: 'PHYSICAL_INVENTORY_VARIANCE',
          status: 'POSTED',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          warehouse: mockWarehouse,
          postedByUser: { id: 'u-1', username: 'admin', displayName: 'Admin' },
          items: [
            {
              id: 'item-1',
              adjustmentId: 'adj-1',
              productId: 'prod-1',
              batchId: 'batch-1',
              quantity: 10,
              unitCost: 450,
            },
          ],
        },
      ],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });

    vi.spyOn(inventoryApi, 'getProductStockDetails').mockResolvedValue({
      product: {
        id: 'prod-1',
        sku: 'MED-PAN-001',
        name: 'Panadol Extra 500mg/65mg',
        genericName: 'Paracetamol + Caffeine',
        dosageForm: 'Tablet',
      },
      batches: [
        {
          id: 'batch-1',
          batchNumber: 'BN-2026-001',
          expiryDate: '2028-01-01T00:00:00.000Z',
          status: 'ACTIVE',
          purchaseCost: 450,
          tradePrice: 500,
          retailPrice: 575,
          totalQuantity: 120,
          isExpired: false,
          isSaleable: true,
          warehouses: [{ warehouse: mockWarehouse, quantity: 120 }],
        },
      ],
    });

    vi.spyOn(inventoryApi, 'previewFefo').mockResolvedValue({
      productId: 'prod-1',
      warehouseId: 'wh-1',
      requestedQuantity: 50,
      allocatedQuantity: 50,
      shortfall: 0,
      isFullyAllocated: true,
      allocations: [
        {
          batchId: 'batch-1',
          batchNumber: 'BN-2026-001',
          mfgDate: null,
          expiryDate: '2028-01-01T00:00:00.000Z',
          allocatedQuantity: 50,
          availableQuantity: 120,
          purchaseCost: 450,
          tradePrice: 500,
          retailPrice: 575,
        },
      ],
    });

    vi.spyOn(productsApi, 'getProducts').mockResolvedValue({
      items: [mockProduct],
      meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
    });

    vi.spyOn(batchesApi, 'getBatchesByProduct').mockResolvedValue([mockBatch]);
  });

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <InventoryPage />
      </QueryClientProvider>,
    );

  it('renders inventory workspace and displays product stock summary', async () => {
    renderComponent();

    expect(screen.getByText('Inventory & Stock Movement Ledger')).toBeInTheDocument();
    expect(await screen.findByText('Panadol Extra 500mg/65mg')).toBeInTheDocument();
    expect(screen.getByText('MED-PAN-001')).toBeInTheDocument();
    expect(screen.getByText('Paracetamol + Caffeine')).toBeInTheDocument();
    expect(screen.getAllByText('120').length).toBeGreaterThanOrEqual(1);
  });

  it('switches to Movement Ledger tab and displays chronological stock movements', async () => {
    renderComponent();

    expect(await screen.findByText('Panadol Extra 500mg/65mg')).toBeInTheDocument();

    const ledgerTab = screen.getByTestId('tab-ledger');
    fireEvent.click(ledgerTab);

    expect(await screen.findByText('System Admin')).toBeInTheDocument();
    expect(screen.getByText('BN-2026-001')).toBeInTheDocument();
    expect(screen.getByText('+120')).toBeInTheDocument();
    expect(screen.getByText(/Stock Movement Audit Ledger/i)).toBeInTheDocument();
  });

  it('switches to Stock Adjustments tab and displays posted adjustments', async () => {
    renderComponent();

    expect(await screen.findByText('Panadol Extra 500mg/65mg')).toBeInTheDocument();

    const adjTab = screen.getByTestId('tab-adjustments');
    fireEvent.click(adjTab);

    expect(await screen.findByText('ADJ-00001')).toBeInTheDocument();
    expect(screen.getByText('PHYSICAL_INVENTORY_VARIANCE')).toBeInTheDocument();
    expect(screen.getByText('POSTED')).toBeInTheDocument();
  });

  it('opens New Stock Adjustment modal and renders variance calculator', async () => {
    renderComponent();

    const adjustBtn = screen.getByRole('button', { name: /^Adjust Stock/i });
    fireEvent.click(adjustBtn);

    expect(await screen.findByText('Record Physical Stock Adjustment')).toBeInTheDocument();
    expect(screen.getByText(/Add Stock Count \/ Variance Line/i)).toBeInTheDocument();
    expect(screen.getByText('Commit & Post Adjustment')).toBeInTheDocument();
  });

  it('switches to FEFO Allocation tab and executes simulation', async () => {
    renderComponent();

    expect(await screen.findByText('Panadol Extra 500mg/65mg')).toBeInTheDocument();

    const fefoTab = screen.getByTestId('tab-fefo');
    fireEvent.click(fefoTab);

    expect(await screen.findByText('FEFO Allocation Parameters')).toBeInTheDocument();

    // Wait for catalog products to be populated in dropdown
    expect(await screen.findByText(/Panadol Extra 500mg\/65mg \(MED-PAN-001\)/i)).toBeInTheDocument();

    const productSelect = screen.getByLabelText(/Target Product \*/i);
    fireEvent.change(productSelect, { target: { value: 'prod-1' } });

    const simulateBtn = screen.getByRole('button', { name: /Run FEFO Allocation Engine/i });
    fireEvent.click(simulateBtn);

    expect(await screen.findByText('100% Fulfilled')).toBeInTheDocument();
    expect(screen.getByText('BN-2026-001')).toBeInTheDocument();
  });
});
