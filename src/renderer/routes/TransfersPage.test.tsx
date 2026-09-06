import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TransfersPage } from './TransfersPage';
import {
  transfersApi,
  warehousesApi,
  productsApi,
  batchesApi,
} from '../api';
import { useAuthStore } from '../store/authStore';

describe('TransfersPage Component', () => {
  const mockWarehouseSource = {
    id: 'wh-1',
    organizationId: 'org-1',
    branchId: 'br-1',
    name: 'Main Distribution Hub',
    code: 'WH-MAIN',
    warehouseType: 'STANDARD' as const,
    isDefault: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockWarehouseDest = {
    id: 'wh-2',
    organizationId: 'org-1',
    branchId: 'br-1',
    name: 'Dispensary Shelf',
    code: 'WH-DISP',
    warehouseType: 'STANDARD' as const,
    isDefault: false,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockProduct = {
    id: 'prod-1',
    organizationId: 'org-1',
    sku: 'PAN-500',
    name: 'Panadol 500mg',
    genericName: 'Paracetamol',
    taxPercentage: 0,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockBatch = {
    id: 'batch-1',
    productId: 'prod-1',
    batchNumber: 'BN-1001',
    expiryDate: '2028-12-31',
    mfgDate: '2025-01-01',
    purchaseCost: 40.0,
    tradePrice: 50.0,
    retailPrice: 60.0,
    status: 'ACTIVE' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockTransfer = {
    id: 'trf-1',
    organizationId: 'org-1',
    branchId: 'br-1',
    transferNumber: 'TRF-00001',
    sourceWarehouseId: 'wh-1',
    destinationWarehouseId: 'wh-2',
    transferDate: new Date().toISOString(),
    status: 'DRAFT' as const,
    notes: 'Urgent stock balancing',
    createdById: 'user-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sourceWarehouse: mockWarehouseSource,
    destinationWarehouse: mockWarehouseDest,
    branch: { id: 'br-1', name: 'Main Branch', code: 'BR01' },
    createdByUser: { id: 'user-1', username: 'admin', displayName: 'System Admin' },
    items: [
      {
        id: 'item-1',
        stockTransferId: 'trf-1',
        productId: 'prod-1',
        batchId: 'batch-1',
        batchNumber: 'BN-1001',
        expiryDate: '2028-12-31',
        requestedQuantity: 50,
        dispatchedQuantity: 0,
        receivedQuantity: 0,
        unitCost: 40.0,
        notes: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        product: mockProduct,
        batch: mockBatch,
      },
    ],
    _count: { items: 1 },
  };

  beforeEach(() => {
    useAuthStore.getState().setUser({
      id: 'user-1',
      username: 'admin',
      displayName: 'System Admin',
      roles: ['ADMIN'],
      permissions: [
        'transfers.view',
        'transfers.manage',
        'transfers.dispatch',
        'transfers.receive',
        'transfers.cancel',
      ],
    });

    vi.spyOn(warehousesApi, 'getWarehouses').mockResolvedValue([
      mockWarehouseSource,
      mockWarehouseDest,
    ]);

    vi.spyOn(productsApi, 'getProducts').mockResolvedValue({
      items: [mockProduct],
      meta: { page: 1, limit: 50, total: 1, totalPages: 1 },
    } as any);

    vi.spyOn(batchesApi, 'getAllBatches').mockResolvedValue({
      items: [mockBatch],
      meta: { page: 1, limit: 50, total: 1, totalPages: 1 },
    } as any);

    vi.spyOn(transfersApi, 'getTransfers').mockResolvedValue({
      items: [mockTransfer],
      meta: { page: 1, limit: 50, total: 1, totalPages: 1 },
    });

    vi.spyOn(transfersApi, 'getMetrics').mockResolvedValue({
      totalTransfers: 1,
      draftCount: 1,
      inTransitCount: 0,
      receivedCount: 0,
      cancelledCount: 0,
    });

    vi.spyOn(transfersApi, 'getTransferById').mockResolvedValue(mockTransfer);
  });

  it('renders transfers page header, KPI metrics, and register table', async () => {
    render(<TransfersPage />);

    expect(screen.getByText('Warehouse & Stock Transfers')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('TRF-00001')).toBeInTheDocument();
      expect(screen.getByText('DRAFT')).toBeInTheDocument();
      expect(screen.getByText('Main Distribution Hub')).toBeInTheDocument();
      expect(screen.getByText('Dispensary Shelf')).toBeInTheDocument();
    });
  });

  it('opens and submits New Stock Transfer draft modal', async () => {
    vi.spyOn(transfersApi, 'createDraft').mockResolvedValue({
      ...mockTransfer,
      id: 'trf-2',
      transferNumber: 'TRF-00002',
    });

    render(<TransfersPage />);

    await waitFor(() => {
      expect(warehousesApi.getWarehouses).toHaveBeenCalled();
    });

    const newTransferBtn = screen.getByRole('button', {
      name: /New Stock Transfer/i,
    });
    fireEvent.click(newTransferBtn);

    expect(
      screen.getByRole('heading', { name: 'New Stock Transfer' }),
    ).toBeInTheDocument();

    // Select Product and Batch
    const selects = screen.getAllByRole('combobox');
    // selects[0] = sourceFilter, selects[1] = destFilter, selects[2] = modal source, selects[3] = modal dest, selects[4] = modal product, selects[5] = modal batch
    const productSelect = selects.find((s) => s.innerHTML.includes('Select product...'))!;
    const batchSelect = selects.find((s) => s.innerHTML.includes('Choose batch...'))!;

    fireEvent.change(productSelect, { target: { value: 'prod-1' } });
    fireEvent.change(batchSelect, { target: { value: 'batch-1' } });

    const addBtn = screen.getByRole('button', { name: /^Add$/i });
    fireEvent.click(addBtn);

    await waitFor(() => {
      expect(screen.getByText('BN-1001')).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole('button', { name: /Create Draft/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(transfersApi.createDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          sourceWarehouseId: 'wh-1',
          destinationWarehouseId: 'wh-2',
          items: expect.arrayContaining([
            expect.objectContaining({
              productId: 'prod-1',
              batchId: 'batch-1',
            }),
          ]),
        }),
      );
    });
  });

  it('opens and executes dispatch workflow on a draft transfer', async () => {
    vi.spyOn(transfersApi, 'dispatchTransfer').mockResolvedValue({
      ...mockTransfer,
      status: 'DISPATCHED',
    });

    render(<TransfersPage />);

    await waitFor(() => {
      expect(screen.getByText('TRF-00001')).toBeInTheDocument();
    });

    const dispatchBtn = screen.getByTitle('Dispatch Transfer');
    fireEvent.click(dispatchBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/Dispatch Stock Transfer \(TRF-00001\)/i),
      ).toBeInTheDocument();
    });

    const confirmBtn = screen.getByRole('button', {
      name: /Confirm Dispatch/i,
    });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(transfersApi.dispatchTransfer).toHaveBeenCalledWith(
        'trf-1',
        expect.objectContaining({
          items: expect.arrayContaining([
            expect.objectContaining({
              itemId: 'item-1',
              dispatchedQuantity: 50,
            }),
          ]),
        }),
      );
    });
  });

  it('opens receive modal on dispatched transfer and executes receiving', async () => {
    const dispatchedTransfer = {
      ...mockTransfer,
      status: 'DISPATCHED' as const,
      items: [
        {
          ...mockTransfer.items[0],
          dispatchedQuantity: 50,
          receivedQuantity: 0,
        },
      ],
    };

    vi.spyOn(transfersApi, 'getTransfers').mockResolvedValue({
      items: [dispatchedTransfer],
      meta: { page: 1, limit: 50, total: 1, totalPages: 1 },
    });
    vi.spyOn(transfersApi, 'getTransferById').mockResolvedValue(dispatchedTransfer);
    vi.spyOn(transfersApi, 'receiveTransfer').mockResolvedValue({
      ...dispatchedTransfer,
      status: 'RECEIVED',
    });

    render(<TransfersPage />);

    await waitFor(() => {
      expect(screen.getByText('TRF-00001')).toBeInTheDocument();
    });

    const receiveBtn = screen.getByTitle('Receive Stock');
    fireEvent.click(receiveBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/Receive Stock Transfer \(TRF-00001\)/i),
      ).toBeInTheDocument();
    });

    const confirmReceiveBtn = screen.getByRole('button', {
      name: /Confirm Receipt/i,
    });
    fireEvent.click(confirmReceiveBtn);

    await waitFor(() => {
      expect(transfersApi.receiveTransfer).toHaveBeenCalledWith(
        'trf-1',
        expect.objectContaining({
          items: expect.arrayContaining([
            expect.objectContaining({
              itemId: 'item-1',
              receivedQuantity: 50,
            }),
          ]),
        }),
      );
    });
  });

  it('opens cancel modal and executes cancellation with reason', async () => {
    vi.spyOn(transfersApi, 'cancelTransfer').mockResolvedValue({
      ...mockTransfer,
      status: 'CANCELLED',
    });

    render(<TransfersPage />);

    await waitFor(() => {
      expect(screen.getByText('TRF-00001')).toBeInTheDocument();
    });

    const cancelBtn = screen.getByTitle('Cancel Transfer');
    fireEvent.click(cancelBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/Cancel Transfer \(TRF-00001\)/i),
      ).toBeInTheDocument();
    });

    const reasonInput = screen.getByPlaceholderText(
      /Specify why this transfer is being cancelled.../i,
    );
    fireEvent.change(reasonInput, {
      target: { value: 'Duplicate request created by mistake' },
    });

    const confirmCancelBtn = screen.getByRole('button', {
      name: /Confirm Cancellation/i,
    });
    fireEvent.click(confirmCancelBtn);

    await waitFor(() => {
      expect(transfersApi.cancelTransfer).toHaveBeenCalledWith('trf-1', {
        cancellationReason: 'Duplicate request created by mistake',
      });
    });
  });
});
