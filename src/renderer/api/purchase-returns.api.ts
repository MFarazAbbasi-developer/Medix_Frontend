import { apiClient } from './client';
import { Supplier } from './suppliers.api';
import { GoodsReceiveNote } from './purchasing.api';
import { ReturnedStockCondition } from './sales-returns.api';

export type { ReturnedStockCondition };

export type PurchaseReturnStatus = 'POSTED' | 'CANCELLED';

export type PurchaseReturnReason =
  | 'DAMAGED_IN_TRANSIT'
  | 'DEFECTIVE'
  | 'SHORT_EXPIRY'
  | 'EXPIRED'
  | 'EXCESS_STOCK'
  | 'WRONG_ITEM'
  | 'RECALLED_BATCH'
  | 'COMMERCIAL_RETURN'
  | 'OTHER';

export interface PurchaseReturnItem {
  id: string;
  purchaseReturnId: string;
  grnItemId: string;
  productId: string;
  batchId: string;
  batchNumber: string;
  expiryDate: string;
  sourceWarehouseId: string;
  returnedQuantity: number;
  bonusReturnedQuantity: number;
  totalReturnedQuantity: number;
  stockCondition: ReturnedStockCondition;
  unitCost: string | number;
  discountPercentage: string | number;
  discountAmount: string | number;
  taxPercentage: string | number;
  taxAmount: string | number;
  lineTotal: string | number;
  product?: {
    id: string;
    sku: string;
    name: string;
    genericName?: string | null;
    packSize?: string | null;
  };
  batch?: {
    id: string;
    batchNumber: string;
    expiryDate: string;
    status: string;
  };
  sourceWarehouse?: {
    id: string;
    name: string;
    code: string;
    warehouseType: 'STANDARD' | 'QUARANTINE';
  };
}

export interface PurchaseReturn {
  id: string;
  organizationId: string;
  branchId: string;
  supplierId: string;
  grnId: string;
  returnNumber: string;
  returnDate: string;
  status: PurchaseReturnStatus;
  reason: PurchaseReturnReason;
  subtotal: string | number;
  discountAmount: string | number;
  taxAmount: string | number;
  netTotal: string | number;
  notes?: string | null;
  postedAt: string;
  postedByUserId?: string | null;
  cancelledAt?: string | null;
  cancelledByUserId?: string | null;
  cancellationReason?: string | null;
  createdAt: string;
  updatedAt: string;
  supplier?: Supplier;
  grn?: GoodsReceiveNote;
  branch?: {
    id: string;
    name: string;
    code: string;
  };
  postedByUser?: {
    id: string;
    displayName: string;
    username: string;
  } | null;
  cancelledByUser?: {
    id: string;
    displayName: string;
    username: string;
  } | null;
  items?: PurchaseReturnItem[];
}

export interface ReturnableGrnItem {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  batchId: string;
  batchNumber: string;
  expiryDate: string;
  receivedQuantity: number;
  bonusQuantity: number;
  totalQuantity: number;
  priorReturnedBilled: number;
  priorReturnedBonus: number;
  availableBilled: number;
  availableBonus: number;
  unitCost: number;
  discountPercentage: number;
  taxPercentage: number;
  tradePrice: number;
  retailPrice: number;
  canReturnAsSaleable: boolean;
  isExpired: boolean;
}

export interface ReturnableGrnResponse {
  grn: {
    id: string;
    grnNumber: string;
    supplierInvoiceNumber?: string;
    supplierInvoiceDate?: string;
    receivedDate: string;
    supplierId: string;
    supplierName: string;
    supplierCode: string;
    warehouseId: string;
    warehouseName: string;
    netTotal: number;
    paidAmount: number;
    balanceAmount: number;
    status: string;
  };
  items: ReturnableGrnItem[];
}

export interface CreatePurchaseReturnItemInput {
  grnItemId: string;
  sourceWarehouseId: string;
  returnedQuantity: number;
  bonusReturnedQuantity?: number;
  stockCondition: ReturnedStockCondition;
}

export interface CreatePurchaseReturnInput {
  grnId: string;
  reason: PurchaseReturnReason;
  returnDate?: string;
  notes?: string;
  items: CreatePurchaseReturnItemInput[];
}

export interface CancelPurchaseReturnInput {
  cancellationReason: string;
}

export interface QueryPurchaseReturnParams {
  search?: string;
  supplierId?: string;
  status?: PurchaseReturnStatus;
  reason?: PurchaseReturnReason;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface PurchaseReturnsListResponse {
  items: PurchaseReturn[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary: {
    totalNetReturn: number;
  };
}

export const purchaseReturnsApi = {
  getPurchaseReturns: async (params?: QueryPurchaseReturnParams): Promise<PurchaseReturnsListResponse> => {
    const response = await apiClient.get<PurchaseReturnsListResponse>('/purchase-returns', { params });
    return response.data;
  },

  getPurchaseReturnById: async (id: string): Promise<PurchaseReturn> => {
    const response = await apiClient.get<PurchaseReturn>(`/purchase-returns/${id}`);
    return response.data;
  },

  getReturnableGrn: async (grnId: string): Promise<ReturnableGrnResponse> => {
    const response = await apiClient.get<ReturnableGrnResponse>(`/purchase-returns/returnable-grn/${grnId}`);
    return response.data;
  },

  createPurchaseReturn: async (data: CreatePurchaseReturnInput): Promise<PurchaseReturn> => {
    const response = await apiClient.post<PurchaseReturn>('/purchase-returns', data);
    return response.data;
  },

  cancelPurchaseReturn: async (id: string, data: CancelPurchaseReturnInput): Promise<PurchaseReturn> => {
    const response = await apiClient.post<PurchaseReturn>(`/purchase-returns/${id}/cancel`, data);
    return response.data;
  },
};
