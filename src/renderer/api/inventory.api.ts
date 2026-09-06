import { apiClient, ApiResponse } from './client';
import { Warehouse } from './warehouses.api';

export type StockMovementType =
  | 'OPENING_BALANCE'
  | 'STOCK_ADJUSTMENT_IN'
  | 'STOCK_ADJUSTMENT_OUT'
  | 'TRANSFER_IN'
  | 'TRANSFER_OUT'
  | 'PURCHASE_RECEIPT'
  | 'PURCHASE_RETURN'
  | 'SALES_ISSUE'
  | 'SALES_RETURN';

export type StockAdjustmentReason =
  | 'INITIAL_COUNT'
  | 'PHYSICAL_INVENTORY_VARIANCE'
  | 'DAMAGED_EXPIRED_DISPOSAL'
  | 'PILFERAGE_LOSS'
  | 'CORRECTION';

export type StockAdjustmentStatus = 'DRAFT' | 'POSTED' | 'CANCELLED';

export interface StockSummaryItem {
  id: string;
  sku: string;
  name: string;
  genericName: string;
  dosageForm?: string | null;
  strength?: string | null;
  packSize?: string | null;
  unit?: { id: string; name: string; symbol: string } | null;
  category?: { id: string; name: string } | null;
  manufacturer?: { id: string; name: string; code?: string | null } | null;
  isActive: boolean;
  physicalStock: number;
  saleableStock: number;
  quarantinedStock: number;
  recalledStock: number;
  expiredStock: number;
  totalCostValuation: number;
  totalTradeValuation: number;
  batchCount: number;
}

export interface PaginatedInventorySummaryResponse {
  items: StockSummaryItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface BatchStockWarehouseItem {
  warehouse: { id: string; name: string; code: string };
  quantity: number;
}

export interface BatchStockItem {
  id: string;
  batchNumber: string;
  mfgDate?: string | null;
  expiryDate: string;
  status: 'ACTIVE' | 'QUARANTINED' | 'RECALLED';
  purchaseCost: number;
  tradePrice: number;
  retailPrice: number;
  remarks?: string | null;
  totalQuantity: number;
  isExpired: boolean;
  isSaleable: boolean;
  warehouses: BatchStockWarehouseItem[];
}

export interface ProductStockDetailsResponse {
  product: {
    id: string;
    sku: string;
    name: string;
    genericName: string;
    dosageForm?: string | null;
    strength?: string | null;
    packSize?: string | null;
    unit?: { id: string; name: string; symbol: string } | null;
    manufacturer?: { id: string; name: string } | null;
    category?: { id: string; name: string } | null;
  };
  batches: BatchStockItem[];
}

export interface StockMovementItem {
  id: string;
  organizationId: string;
  branchId: string;
  warehouseId: string;
  productId: string;
  batchId: string;
  movementType: StockMovementType;
  quantity: number;
  unitCost: string | number;
  referenceType: string;
  referenceId?: string | null;
  movementDate: string;
  notes?: string | null;
  createdAt: string;
  warehouse?: Warehouse;
  product?: { id: string; name: string; sku: string; genericName: string };
  batch?: { id: string; batchNumber: string; expiryDate: string; status: string };
  createdByUser?: { id: string; username: string; displayName: string } | null;
}

export interface PaginatedStockLedgerResponse {
  items: StockMovementItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface FefoAllocationItem {
  batchId: string;
  batchNumber: string;
  mfgDate?: string | null;
  expiryDate: string;
  allocatedQuantity: number;
  availableQuantity: number;
  purchaseCost: number;
  tradePrice: number;
  retailPrice: number;
}

export interface FefoAllocationResult {
  productId: string;
  warehouseId: string;
  requestedQuantity: number;
  allocatedQuantity: number;
  shortfall: number;
  isFullyAllocated: boolean;
  allocations: FefoAllocationItem[];
}

export interface StockAdjustmentItem {
  id: string;
  adjustmentId: string;
  productId: string;
  batchId: string;
  quantity: number;
  unitCost: string | number;
  remarks?: string | null;
  product?: { id: string; name: string; sku: string };
  batch?: { id: string; batchNumber: string; expiryDate: string };
}

export interface StockAdjustment {
  id: string;
  organizationId: string;
  branchId: string;
  warehouseId: string;
  adjustmentNumber: string;
  reason: StockAdjustmentReason;
  status: StockAdjustmentStatus;
  notes?: string | null;
  postedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  warehouse?: Warehouse;
  postedByUser?: { id: string; username: string; displayName: string } | null;
  items: StockAdjustmentItem[];
}

export interface PaginatedStockAdjustmentsResponse {
  items: StockAdjustment[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateAdjustmentItemDto {
  productId: string;
  batchId: string;
  varianceQuantity: number;
  remarks?: string;
}

export interface CreateStockAdjustmentDto {
  warehouseId: string;
  reason: StockAdjustmentReason;
  notes?: string;
  items: CreateAdjustmentItemDto[];
}

export interface CreateOpeningBalanceDto {
  warehouseId: string;
  productId: string;
  batchId: string;
  quantity: number;
  unitCost?: number;
  notes?: string;
}

export interface QueryInventorySummaryParams {
  search?: string;
  warehouseId?: string;
  categoryId?: string;
  manufacturerId?: string;
  page?: number;
  limit?: number;
}

export interface QueryStockLedgerParams {
  productId?: string;
  batchId?: string;
  warehouseId?: string;
  movementType?: StockMovementType;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export const inventoryApi = {
  getInventorySummary: async (
    params?: QueryInventorySummaryParams,
  ): Promise<PaginatedInventorySummaryResponse> => {
    const response = (await apiClient.get('/inventory/summary', {
      params,
    })) as unknown as ApiResponse<PaginatedInventorySummaryResponse>;
    return response.data;
  },

  getProductStockDetails: async (
    productId: string,
    warehouseId?: string,
  ): Promise<ProductStockDetailsResponse> => {
    const response = (await apiClient.get(
      `/inventory/product/${productId}`,
      { params: { warehouseId } },
    )) as unknown as ApiResponse<ProductStockDetailsResponse>;
    return response.data;
  },

  getStockLedger: async (
    params?: QueryStockLedgerParams,
  ): Promise<PaginatedStockLedgerResponse> => {
    const response = (await apiClient.get('/inventory/ledger', {
      params,
    })) as unknown as ApiResponse<PaginatedStockLedgerResponse>;
    return response.data;
  },

  previewFefo: async (data: {
    warehouseId: string;
    productId: string;
    quantity: number;
  }): Promise<FefoAllocationResult> => {
    const response = (await apiClient.post(
      '/inventory/fefo-preview',
      data,
    )) as unknown as ApiResponse<FefoAllocationResult>;
    return response.data;
  },

  createOpeningBalance: async (
    data: CreateOpeningBalanceDto,
  ): Promise<StockMovementItem> => {
    const response = (await apiClient.post(
      '/inventory/opening-balance',
      data,
    )) as unknown as ApiResponse<StockMovementItem>;
    return response.data;
  },

  getStockAdjustments: async (params?: {
    warehouseId?: string;
    status?: StockAdjustmentStatus;
    page?: number;
    limit?: number;
  }): Promise<PaginatedStockAdjustmentsResponse> => {
    const response = (await apiClient.get('/inventory/adjustments', {
      params,
    })) as unknown as ApiResponse<PaginatedStockAdjustmentsResponse>;
    return response.data;
  },

  createStockAdjustment: async (
    data: CreateStockAdjustmentDto,
  ): Promise<StockAdjustment> => {
    const response = (await apiClient.post(
      '/inventory/adjustments',
      data,
    )) as unknown as ApiResponse<StockAdjustment>;
    return response.data;
  },

  postStockAdjustment: async (id: string): Promise<StockAdjustment> => {
    const response = (await apiClient.post(
      `/inventory/adjustments/${id}/post`,
    )) as unknown as ApiResponse<StockAdjustment>;
    return response.data;
  },

  reverseStockAdjustment: async (id: string): Promise<StockAdjustment> => {
    const response = (await apiClient.post(
      `/inventory/adjustments/${id}/reverse`,
    )) as unknown as ApiResponse<StockAdjustment>;
    return response.data;
  },
};
