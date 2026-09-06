import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExpiryRecallPage } from './ExpiryRecallPage';
import { expiryApi, warehousesApi, productsApi, masterDataApi, batchesApi } from '../api';
import { useAuthStore } from '../store/authStore';

vi.mock('../api', async () => {
  const actual = await vi.importActual('../api');
  return {
    ...actual,
    expiryApi: {
      getMetrics: vi.fn(),
      getBatches: vi.fn(),
      getBatchBreakdown: vi.fn(),
      getQuarantineStock: vi.fn(),
      moveStockToQuarantine: vi.fn(),
      releaseQuarantineStock: vi.fn(),
      getRecalls: vi.fn(),
      getRecallById: vi.fn(),
      createRecall: vi.fn(),
      updateRecallStatus: vi.fn(),
      quarantineRecalledStock: vi.fn(),
    },
    warehousesApi: {
      getWarehouses: vi.fn(),
    },
    productsApi: {
      getProducts: vi.fn(),
    },
    masterDataApi: {
      getManufacturers: vi.fn(),
    },
    batchesApi: {
      getBatchesByProduct: vi.fn(),
    },
  };
});

describe('ExpiryRecallPage Component', () => {
  const mockWarehouseStd = {
    id: 'wh-1',
    organizationId: 'org-1',
    branchId: 'br-1',
    name: 'Main Dispensary',
    code: 'WH-MAIN',
    warehouseType: 'STANDARD' as const,
    isDefault: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockWarehouseQuar = {
    id: 'wh-quar',
    organizationId: 'org-1',
    branchId: 'br-1',
    name: 'Quarantine Section',
    code: 'WH-QUAR',
    warehouseType: 'QUARANTINE' as const,
    isDefault: false,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockProduct = {
    id: 'prod-1',
    organizationId: 'org-1',
    sku: 'AUG-625',
    name: 'Augmentin 625mg',
    genericName: 'Amoxicillin + Clavulanic Acid',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockExpiryMetrics = {
    asOfDate: new Date().toISOString(),
    expired: {
      batchCount: 2,
      totalQuantity: 80,
      totalValuation: 12000,
    },
    thresholds: [
      { thresholdDays: 30, batchCount: 1, totalQuantity: 40, totalValuation: 6000 },
      { thresholdDays: 60, batchCount: 3, totalQuantity: 120, totalValuation: 18000 },
      { thresholdDays: 90, batchCount: 5, totalQuantity: 200, totalValuation: 30000 },
      { thresholdDays: 180, batchCount: 8, totalQuantity: 350, totalValuation: 52000 },
    ],
    warehouseBreakdown: {
      standard: { quantity: 500, valuation: 75000 },
      quarantine: { quantity: 120, valuation: 18000 },
    },
  };

  const mockExpiringBatch = {
    id: 'batch-1',
    batchNumber: 'BN-AUG-01',
    mfgDate: '2025-01-01',
    expiryDate: new Date(Date.now() + 25 * 86400000).toISOString(),
    daysToExpiry: 25,
    isExpired: false,
    status: 'ACTIVE',
    purchaseCost: 150,
    tradePrice: 180,
    retailPrice: 200,
    totalQuantity: 60,
    standardQuantity: 50,
    quarantineQuantity: 10,
    totalValuation: 9000,
    retailValuation: 12000,
    product: {
      id: 'prod-1',
      sku: 'AUG-625',
      name: 'Augmentin 625mg',
      genericName: 'Amoxicillin + Clavulanic Acid',
      manufacturer: { id: 'man-1', name: 'GSK Pakistan' },
      unit: 'Box',
    },
    warehouses: [
      {
        warehouseId: 'wh-1',
        warehouseName: 'Main Dispensary',
        warehouseCode: 'WH-MAIN',
        warehouseType: 'STANDARD',
        quantity: 50,
      },
      {
        warehouseId: 'wh-quar',
        warehouseName: 'Quarantine Section',
        warehouseCode: 'WH-QUAR',
        warehouseType: 'QUARANTINE',
        quantity: 10,
      },
    ],
  };

  const mockQuarantineItem = {
    warehouseId: 'wh-quar',
    warehouseName: 'Quarantine Section',
    warehouseCode: 'WH-QUAR',
    batchId: 'batch-1',
    batchNumber: 'BN-AUG-01',
    mfgDate: '2025-01-01',
    expiryDate: new Date(Date.now() + 60 * 86400000).toISOString(),
    daysToExpiry: 60,
    isExpired: false,
    batchStatus: 'ACTIVE',
    productId: 'prod-1',
    productName: 'Augmentin 625mg',
    productSku: 'AUG-625',
    genericName: 'Amoxicillin + Clavulanic Acid',
    manufacturerName: 'GSK Pakistan',
    unitSymbol: 'Box',
    quantity: 15,
    purchaseCost: 150,
    tradePrice: 180,
    retailPrice: 200,
    totalValuation: 2250,
    latestMovementDate: new Date().toISOString(),
    latestReason: 'Suspected box damage hold',
  };

  const mockRecall = {
    id: 'recall-1',
    recallNumber: 'RCL-00001',
    reason: 'Packaging seal integrity test failure',
    severity: 'HIGH' as const,
    status: 'OPEN' as const,
    recallDate: new Date().toISOString(),
    notes: 'Immediate voluntary quarantine notice',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdByUser: { id: 'u-1', username: 'admin', displayName: 'System Admin' },
    product: {
      id: 'prod-1',
      sku: 'AUG-625',
      name: 'Augmentin 625mg',
      genericName: 'Amoxicillin',
      manufacturer: 'GSK',
      unit: 'Box',
    },
    batch: {
      id: 'batch-1',
      batchNumber: 'BN-AUG-01',
      mfgDate: '2025-01-01',
      expiryDate: new Date(Date.now() + 180 * 86400000).toISOString(),
      purchaseCost: 150,
      tradePrice: 180,
      retailPrice: 200,
      status: 'RECALLED',
    },
    stock: {
      totalQuantity: 40,
      standardQuantity: 30,
      quarantineQuantity: 10,
      valuation: 6000,
    },
    warehouses: [
      { warehouseId: 'wh-1', name: 'Main Dispensary', type: 'STANDARD', quantity: 30 },
      { warehouseId: 'wh-quar', name: 'Quarantine Section', type: 'QUARANTINE', quantity: 10 },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();

    useAuthStore.setState({
      user: {
        id: 'u-1',
        username: 'admin',
        displayName: 'System Admin',
        roles: ['ADMIN'],
        permissions: [
          'expiry.view',
          'expiry.manage',
          'quarantine.view',
          'quarantine.manage',
          'recalls.view',
          'recalls.manage',
        ],
      } as any,
      accessToken: 'mock-token',
      authStatus: 'authenticated',
    });

    vi.mocked(warehousesApi.getWarehouses).mockResolvedValue([mockWarehouseStd, mockWarehouseQuar]);
    vi.mocked(productsApi.getProducts).mockResolvedValue({ items: [mockProduct] } as any);
    vi.mocked(masterDataApi.getManufacturers).mockResolvedValue([] as any);
    vi.mocked(batchesApi.getBatchesByProduct).mockResolvedValue([] as any);

    vi.mocked(expiryApi.getMetrics).mockResolvedValue(mockExpiryMetrics);
    vi.mocked(expiryApi.getBatches).mockResolvedValue({
      data: [mockExpiringBatch],
      pagination: { page: 1, limit: 100, totalItems: 1, totalPages: 1, hasMore: false },
    });
    vi.mocked(expiryApi.getQuarantineStock).mockResolvedValue({
      data: [mockQuarantineItem],
      pagination: { page: 1, limit: 100, totalItems: 1, totalPages: 1, hasMore: false },
    });
    vi.mocked(expiryApi.getRecalls).mockResolvedValue({
      data: [mockRecall],
      pagination: { page: 1, limit: 100, totalItems: 1, totalPages: 1, hasMore: false },
    });
  });

  it('renders Expiry Management workspace with summary metrics cards and batch aging table', async () => {
    render(<ExpiryRecallPage />);

    expect(screen.getByText('Expiry Management & Recall Operations')).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText('Already Expired')).toBeDefined();
      expect(screen.getByText('BN-AUG-01')).toBeDefined();
      expect(screen.getAllByText(/Critical/i).length).toBeGreaterThan(0);
    });
  });

  it('switches to Quarantine Operations tab and shows quarantined stock', async () => {
    render(<ExpiryRecallPage />);

    const quarantineTabBtn = screen.getByRole('button', { name: /Quarantine Operations/i });
    fireEvent.click(quarantineTabBtn);

    await waitFor(() => {
      expect(expiryApi.getQuarantineStock).toHaveBeenCalled();
      expect(screen.getByText('Quarantine Section')).toBeDefined();
      expect(screen.getByText('Suspected box damage hold')).toBeDefined();
      expect(screen.getByRole('button', { name: /Release/i })).toBeDefined();
    });
  });

  it('switches to Product Recalls tab and shows recalls register', async () => {
    render(<ExpiryRecallPage />);

    const recallsTabBtn = screen.getByRole('button', { name: /Product Recalls/i });
    fireEvent.click(recallsTabBtn);

    expect(await screen.findByText('RCL-00001', {}, { timeout: 4000 })).toBeDefined();
    expect(screen.getByText('Packaging seal integrity test failure')).toBeDefined();
    expect(screen.getAllByText('HIGH').length).toBeGreaterThan(0);
    expect(screen.getAllByText('OPEN').length).toBeGreaterThan(0);
  });

  it('opens Quarantine Stock modal and triggers move API', async () => {
    vi.mocked(expiryApi.moveStockToQuarantine).mockResolvedValue({ success: true } as any);

    render(<ExpiryRecallPage />);

    const quarantineTabBtn = screen.getByRole('button', { name: /Quarantine Operations/i });
    fireEvent.click(quarantineTabBtn);

    await waitFor(
      () => {
        const btns = screen.getAllByRole('button', { name: /Quarantine Stock/i });
        expect(btns.length).toBeGreaterThan(0);
      },
      { timeout: 4000 },
    );

    const openModalBtn = screen.getAllByRole('button', { name: /Quarantine Stock/i })[0];
    fireEvent.click(openModalBtn);

    expect(await screen.findByText('Quarantine Physical Stock', {}, { timeout: 4000 })).toBeDefined();
  });
});
