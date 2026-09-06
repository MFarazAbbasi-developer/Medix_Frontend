import { apiClient } from './client';

export type RecallSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type RecallStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED';

export interface ExpiryThresholdMetric {
  thresholdDays: number;
  batchCount: number;
  totalQuantity: number;
  totalValuation: number;
}

export interface ExpiryMetrics {
  asOfDate: string;
  expired: {
    batchCount: number;
    totalQuantity: number;
    totalValuation: number;
  };
  thresholds: ExpiryThresholdMetric[];
  warehouseBreakdown: {
    standard: {
      quantity: number;
      valuation: number;
    };
    quarantine: {
      quantity: number;
      valuation: number;
    };
  };
}

export interface ExpiringBatchItem {
  id: string;
  batchNumber: string;
  mfgDate: string | null;
  expiryDate: string;
  daysToExpiry: number;
  isExpired: boolean;
  status: string;
  purchaseCost: number;
  tradePrice: number;
  retailPrice: number;
  totalQuantity: number;
  standardQuantity: number;
  quarantineQuantity: number;
  totalValuation: number;
  retailValuation: number;
  product: {
    id: string;
    sku: string;
    name: string;
    genericName: string;
    dosageForm?: string;
    strength?: string;
    packSize?: string;
    manufacturer: { id: string; name: string } | null;
    unit: string | null;
  };
  warehouses: Array<{
    warehouseId: string;
    warehouseName: string;
    warehouseCode: string;
    warehouseType: string;
    quantity: number;
  }>;
}

export interface QuarantineStockItem {
  warehouseId: string;
  warehouseName: string;
  warehouseCode: string;
  batchId: string;
  batchNumber: string;
  mfgDate: string | null;
  expiryDate: string;
  daysToExpiry: number;
  isExpired: boolean;
  batchStatus: string;
  productId: string;
  productName: string;
  productSku: string;
  genericName: string;
  manufacturerName: string | null;
  unitSymbol: string | null;
  quantity: number;
  purchaseCost: number;
  tradePrice: number;
  retailPrice: number;
  totalValuation: number;
  latestMovementDate: string;
  latestReason: string | null;
}

export interface ProductRecall {
  id: string;
  recallNumber: string;
  reason: string;
  severity: RecallSeverity;
  status: RecallStatus;
  recallDate: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  createdByUser?: { id: string; username: string; displayName: string };
  resolvedByUser?: { id: string; username: string; displayName: string };
  cancelledByUser?: { id: string; username: string; displayName: string };
  product: {
    id: string;
    sku: string;
    name: string;
    genericName: string;
    manufacturer: string | null;
    unit: string | null;
  };
  batch: {
    id: string;
    batchNumber: string;
    mfgDate: string | null;
    expiryDate: string;
    purchaseCost: number;
    tradePrice: number;
    retailPrice: number;
    status: string;
  };
  stock: {
    totalQuantity: number;
    standardQuantity: number;
    quarantineQuantity: number;
    valuation: number;
  };
  warehouses: Array<{
    warehouseId: string;
    name: string;
    code?: string;
    type: string;
    quantity: number;
  }>;
}

export interface QueryExpiryParams {
  branchId?: string;
  warehouseId?: string;
  productId?: string;
  manufacturerId?: string;
  batchNumber?: string;
  search?: string;
  status?: 'ALL' | 'EXPIRED' | 'EXPIRING_SOON' | 'ALL_AFFECTED';
  thresholdDays?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface QueryQuarantineParams {
  branchId?: string;
  warehouseId?: string;
  productId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface QueryRecallParams {
  productId?: string;
  batchId?: string;
  status?: RecallStatus;
  severity?: RecallSeverity;
  search?: string;
  page?: number;
  limit?: number;
}

export interface QuarantineMovePayload {
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  batchId: string;
  quantity: number;
  reason: string;
  notes?: string;
}

export interface QuarantineReleasePayload {
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  batchId: string;
  quantity: number;
  reason: string;
  notes?: string;
}

export interface CreateRecallPayload {
  productId: string;
  batchId: string;
  reason: string;
  severity?: RecallSeverity;
  recallDate?: string;
  notes?: string;
  autoQuarantine?: boolean;
  quarantineWarehouseId?: string;
}

export interface UpdateRecallStatusPayload {
  status: RecallStatus;
  notes?: string;
  cancellationReason?: string;
}

export const expiryApi = {
  // 1. Expiry Management
  getMetrics: async (branchId?: string, thresholds?: string): Promise<ExpiryMetrics> => {
    const params = new URLSearchParams();
    if (branchId) params.append('branchId', branchId);
    if (thresholds) params.append('thresholds', thresholds);
    const res = await apiClient.get<ExpiryMetrics>(`/expiry/metrics?${params.toString()}`);
    return res.data;
  },

  getBatches: async (params?: QueryExpiryParams): Promise<{
    data: ExpiringBatchItem[];
    pagination: { page: number; limit: number; totalItems: number; totalPages: number; hasMore: boolean };
  }> => {
    const searchParams = new URLSearchParams();
    if (params?.branchId) searchParams.append('branchId', params.branchId);
    if (params?.warehouseId) searchParams.append('warehouseId', params.warehouseId);
    if (params?.productId) searchParams.append('productId', params.productId);
    if (params?.manufacturerId) searchParams.append('manufacturerId', params.manufacturerId);
    if (params?.batchNumber) searchParams.append('batchNumber', params.batchNumber);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.thresholdDays) searchParams.append('thresholdDays', params.thresholdDays.toString());
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) searchParams.append('sortOrder', params.sortOrder);
    const res = await apiClient.get<{
      data: ExpiringBatchItem[];
      pagination: { page: number; limit: number; totalItems: number; totalPages: number; hasMore: boolean };
    }>(`/expiry/batches?${searchParams.toString()}`);
    return res.data;
  },

  getBatchBreakdown: async (batchId: string, branchId?: string) => {
    const query = branchId ? `?branchId=${branchId}` : '';
    const res = await apiClient.get(`/expiry/batches/${batchId}/breakdown${query}`);
    return res.data;
  },

  // 2. Quarantine Operations
  getQuarantineStock: async (params?: QueryQuarantineParams): Promise<{
    data: QuarantineStockItem[];
    pagination: { page: number; limit: number; totalItems: number; totalPages: number; hasMore: boolean };
  }> => {
    const searchParams = new URLSearchParams();
    if (params?.branchId) searchParams.append('branchId', params.branchId);
    if (params?.warehouseId) searchParams.append('warehouseId', params.warehouseId);
    if (params?.productId) searchParams.append('productId', params.productId);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    const res = await apiClient.get<{
      data: QuarantineStockItem[];
      pagination: { page: number; limit: number; totalItems: number; totalPages: number; hasMore: boolean };
    }>(`/expiry/quarantine/stock?${searchParams.toString()}`);
    return res.data;
  },

  moveStockToQuarantine: async (payload: QuarantineMovePayload) => {
    const res = await apiClient.post('/expiry/quarantine/move', payload);
    return res.data;
  },

  releaseQuarantineStock: async (payload: QuarantineReleasePayload) => {
    const res = await apiClient.post('/expiry/quarantine/release', payload);
    return res.data;
  },

  // 3. Product Recalls
  getRecalls: async (params?: QueryRecallParams): Promise<{
    data: ProductRecall[];
    pagination: { page: number; limit: number; totalItems: number; totalPages: number; hasMore: boolean };
  }> => {
    const searchParams = new URLSearchParams();
    if (params?.productId) searchParams.append('productId', params.productId);
    if (params?.batchId) searchParams.append('batchId', params.batchId);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.severity) searchParams.append('severity', params.severity);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    const res = await apiClient.get<{
      data: ProductRecall[];
      pagination: { page: number; limit: number; totalItems: number; totalPages: number; hasMore: boolean };
    }>(`/expiry/recalls?${searchParams.toString()}`);
    return res.data;
  },

  getRecallById: async (id: string): Promise<ProductRecall> => {
    const res = await apiClient.get<ProductRecall>(`/expiry/recalls/${id}`);
    return res.data;
  },

  createRecall: async (payload: CreateRecallPayload): Promise<ProductRecall> => {
    const res = await apiClient.post<ProductRecall>('/expiry/recalls', payload);
    return res.data;
  },

  updateRecallStatus: async (id: string, payload: UpdateRecallStatusPayload): Promise<ProductRecall> => {
    const res = await apiClient.patch<ProductRecall>(`/expiry/recalls/${id}/status`, payload);
    return res.data;
  },

  quarantineRecalledStock: async (id: string, quarantineWarehouseId?: string) => {
    const res = await apiClient.post(`/expiry/recalls/${id}/quarantine-stock`, { quarantineWarehouseId });
    return res.data;
  },
};
