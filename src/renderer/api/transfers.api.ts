import { apiClient } from './client';
import { Warehouse } from './warehouses.api';
import { Product } from './products.api';
import { Batch } from './batches.api';

export type StockTransferStatus =
  | 'DRAFT'
  | 'DISPATCHED'
  | 'PARTIALLY_RECEIVED'
  | 'RECEIVED'
  | 'CANCELLED';

export interface StockTransferItem {
  id: string;
  stockTransferId: string;
  productId: string;
  batchId: string;
  batchNumber: string;
  expiryDate: string;
  requestedQuantity: number;
  dispatchedQuantity: number;
  receivedQuantity: number;
  unitCost: number | string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  product?: Product;
  batch?: Batch;
}

export interface StockTransfer {
  id: string;
  organizationId: string;
  branchId: string;
  transferNumber: string;
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  transferDate: string;
  status: StockTransferStatus;
  notes?: string | null;
  createdById?: string | null;
  dispatchedById?: string | null;
  dispatchedAt?: string | null;
  receivedById?: string | null;
  receivedAt?: string | null;
  cancelledById?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  createdAt: string;
  updatedAt: string;
  sourceWarehouse?: Warehouse;
  destinationWarehouse?: Warehouse;
  branch?: { id: string; name: string; code: string };
  createdByUser?: { id: string; username: string; displayName: string };
  dispatchedByUser?: { id: string; username: string; displayName: string };
  receivedByUser?: { id: string; username: string; displayName: string };
  cancelledByUser?: { id: string; username: string; displayName: string };
  items?: StockTransferItem[];
  _count?: { items: number };
}

export interface PaginatedStockTransfersResponse {
  items: StockTransfer[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface StockTransferMetricsResponse {
  totalTransfers: number;
  draftCount: number;
  inTransitCount: number;
  receivedCount: number;
  cancelledCount: number;
}

export interface CreateStockTransferItemPayload {
  productId: string;
  batchId: string;
  requestedQuantity: number;
  notes?: string;
}

export interface CreateStockTransferPayload {
  branchId?: string;
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  transferDate?: string;
  notes?: string;
  items: CreateStockTransferItemPayload[];
}

export interface UpdateStockTransferPayload {
  sourceWarehouseId?: string;
  destinationWarehouseId?: string;
  transferDate?: string;
  notes?: string;
  items?: CreateStockTransferItemPayload[];
}

export interface DispatchStockTransferPayload {
  items?: Array<{
    itemId: string;
    dispatchedQuantity: number;
  }>;
  notes?: string;
}

export interface ReceiveStockTransferPayload {
  items: Array<{
    itemId: string;
    receivedQuantity: number;
  }>;
  notes?: string;
}

export interface CancelStockTransferPayload {
  cancellationReason: string;
}

export interface PreviewTransferFefoPayload {
  sourceWarehouseId: string;
  productId: string;
  quantity: number;
}

export interface FefoPreviewAllocation {
  batchId: string;
  batchNumber: string;
  mfgDate: string | null;
  expiryDate: string;
  allocatedQuantity: number;
  availableQuantity: number;
  purchaseCost: number;
  tradePrice: number;
  retailPrice: number;
}

export interface FefoPreviewAllocationResult {
  productId: string;
  warehouseId: string;
  requestedQuantity: number;
  allocatedQuantity: number;
  shortfall: number;
  isFullyAllocated: boolean;
  allocations: FefoPreviewAllocation[];
}

export const transfersApi = {
  getTransfers: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: StockTransferStatus;
    sourceWarehouseId?: string;
    destinationWarehouseId?: string;
    branchId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PaginatedStockTransfersResponse> => {
    const res = await apiClient.get<PaginatedStockTransfersResponse>('/transfers', {
      params,
    });
    return res.data;
  },

  getMetrics: async (branchId?: string): Promise<StockTransferMetricsResponse> => {
    const res = await apiClient.get<StockTransferMetricsResponse>('/transfers/metrics', {
      params: { branchId },
    });
    return res.data;
  },

  getTransferById: async (id: string): Promise<StockTransfer> => {
    const res = await apiClient.get<StockTransfer>(`/transfers/${id}`);
    return res.data;
  },

  previewFefo: async (
    payload: PreviewTransferFefoPayload,
  ): Promise<FefoPreviewAllocationResult> => {
    const res = await apiClient.post<FefoPreviewAllocationResult>(
      '/transfers/preview-fefo',
      payload,
    );
    return res.data;
  },

  createDraft: async (payload: CreateStockTransferPayload): Promise<StockTransfer> => {
    const res = await apiClient.post<StockTransfer>('/transfers', payload);
    return res.data;
  },

  updateDraft: async (
    id: string,
    payload: UpdateStockTransferPayload,
  ): Promise<StockTransfer> => {
    const res = await apiClient.put<StockTransfer>(`/transfers/${id}`, payload);
    return res.data;
  },

  dispatchTransfer: async (
    id: string,
    payload: DispatchStockTransferPayload,
  ): Promise<StockTransfer> => {
    const res = await apiClient.post<StockTransfer>(`/transfers/${id}/dispatch`, payload);
    return res.data;
  },

  receiveTransfer: async (
    id: string,
    payload: ReceiveStockTransferPayload,
  ): Promise<StockTransfer> => {
    const res = await apiClient.post<StockTransfer>(`/transfers/${id}/receive`, payload);
    return res.data;
  },

  cancelTransfer: async (
    id: string,
    payload: CancelStockTransferPayload,
  ): Promise<StockTransfer> => {
    const res = await apiClient.post<StockTransfer>(`/transfers/${id}/cancel`, payload);
    return res.data;
  },
};
