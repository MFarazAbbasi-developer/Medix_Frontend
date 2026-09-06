import { apiClient, ApiResponse } from './client';
import { Supplier } from './suppliers.api';

export type PurchaseOrderStatus =
  | 'DRAFT'
  | 'ISSUED'
  | 'PARTIALLY_RECEIVED'
  | 'RECEIVED'
  | 'CANCELLED';

export type GrnStatus = 'DRAFT' | 'POSTED' | 'CANCELLED';

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  productId: string;
  orderedQuantity: number;
  receivedQuantity: number;
  unitCost: string | number;
  discountPercentage: string | number;
  taxPercentage: string | number;
  lineTotal: string | number;
  remarks?: string | null;
  product?: {
    id: string;
    sku: string;
    name: string;
    genericName: string;
    packSize?: string | null;
    unit?: { id: string; name: string; symbol: string } | null;
  };
}

export interface PurchaseOrder {
  id: string;
  organizationId: string;
  branchId: string;
  supplierId: string;
  poNumber: string;
  orderDate: string;
  expectedDate?: string | null;
  status: PurchaseOrderStatus;
  subtotal: string | number;
  discountAmount: string | number;
  taxAmount: string | number;
  netTotal: string | number;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  branch?: { id: string; name: string; code: string };
  supplier?: Supplier;
  items?: PurchaseOrderItem[];
  goodsReceiveNotes?: Array<{
    id: string;
    grnNumber: string;
    receivedDate: string;
    status: GrnStatus;
    netTotal: string | number;
  }>;
  _count?: {
    items: number;
    goodsReceiveNotes: number;
  };
}

export interface GoodsReceiveNoteItem {
  id: string;
  grnId: string;
  poItemId?: string | null;
  productId: string;
  batchId?: string | null;
  batchNumber: string;
  mfgDate?: string | null;
  expiryDate: string;
  receivedQuantity: number;
  bonusQuantity: number;
  unitCost: string | number;
  tradePrice: string | number;
  retailPrice: string | number;
  discountPercentage: string | number;
  taxPercentage: string | number;
  lineTotal: string | number;
  remarks?: string | null;
  product?: {
    id: string;
    sku: string;
    name: string;
    genericName: string;
    packSize?: string | null;
    unit?: { id: string; name: string; symbol: string } | null;
  };
  batch?: {
    id: string;
    batchNumber: string;
    expiryDate: string;
    status: string;
  } | null;
}

export interface GoodsReceiveNote {
  id: string;
  organizationId: string;
  branchId: string;
  warehouseId: string;
  supplierId: string;
  purchaseOrderId?: string | null;
  grnNumber: string;
  supplierInvoiceNumber?: string | null;
  supplierInvoiceDate?: string | null;
  receivedDate: string;
  status: GrnStatus;
  subtotal: string | number;
  discountAmount: string | number;
  taxAmount: string | number;
  netTotal: string | number;
  notes?: string | null;
  postedAt?: string | null;
  postedByUserId?: string | null;
  createdAt: string;
  updatedAt: string;
  branch?: { id: string; name: string; code: string };
  warehouse?: { id: string; name: string; code: string };
  supplier?: Supplier;
  purchaseOrder?: PurchaseOrder | null;
  postedByUser?: { id: string; displayName: string; username: string } | null;
  items?: GoodsReceiveNoteItem[];
  _count?: {
    items: number;
  };
}

export interface PaginatedPurchaseOrdersResponse {
  items: PurchaseOrder[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginatedGrnResponse {
  items: GoodsReceiveNote[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreatePoPayload {
  branchId: string;
  supplierId: string;
  orderDate?: string;
  expectedDate?: string;
  notes?: string;
  items: Array<{
    productId: string;
    orderedQuantity: number;
    unitCost: number;
    discountPercentage?: number;
    taxPercentage?: number;
    remarks?: string;
  }>;
}

export interface CreateGrnPayload {
  branchId: string;
  warehouseId: string;
  supplierId: string;
  purchaseOrderId?: string;
  supplierInvoiceNumber?: string;
  supplierInvoiceDate?: string;
  receivedDate?: string;
  notes?: string;
  items: Array<{
    poItemId?: string;
    productId: string;
    batchId?: string;
    batchNumber: string;
    mfgDate?: string;
    expiryDate: string;
    receivedQuantity: number;
    bonusQuantity?: number;
    unitCost: number;
    tradePrice: number;
    retailPrice: number;
    discountPercentage?: number;
    taxPercentage?: number;
    remarks?: string;
  }>;
}

export const purchasingApi = {
  getPurchaseOrders: async (params?: {
    search?: string;
    status?: PurchaseOrderStatus;
    supplierId?: string;
    branchId?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedPurchaseOrdersResponse> => {
    const response = (await apiClient.get('/purchases/orders', {
      params,
    })) as unknown as ApiResponse<PaginatedPurchaseOrdersResponse>;
    return response.data;
  },

  getPurchaseOrderById: async (id: string): Promise<PurchaseOrder> => {
    const response = (await apiClient.get(
      `/purchases/orders/${id}`,
    )) as unknown as ApiResponse<PurchaseOrder>;
    return response.data;
  },

  createPurchaseOrder: async (
    payload: CreatePoPayload,
  ): Promise<PurchaseOrder> => {
    const response = (await apiClient.post(
      '/purchases/orders',
      payload,
    )) as unknown as ApiResponse<PurchaseOrder>;
    return response.data;
  },

  updatePurchaseOrder: async (
    id: string,
    payload: Partial<CreatePoPayload>,
  ): Promise<PurchaseOrder> => {
    const response = (await apiClient.put(
      `/purchases/orders/${id}`,
      payload,
    )) as unknown as ApiResponse<PurchaseOrder>;
    return response.data;
  },

  issuePurchaseOrder: async (id: string): Promise<PurchaseOrder> => {
    const response = (await apiClient.post(
      `/purchases/orders/${id}/issue`,
    )) as unknown as ApiResponse<PurchaseOrder>;
    return response.data;
  },

  cancelPurchaseOrder: async (id: string): Promise<PurchaseOrder> => {
    const response = (await apiClient.post(
      `/purchases/orders/${id}/cancel`,
    )) as unknown as ApiResponse<PurchaseOrder>;
    return response.data;
  },

  getGoodsReceiveNotes: async (params?: {
    search?: string;
    status?: GrnStatus;
    supplierId?: string;
    branchId?: string;
    warehouseId?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedGrnResponse> => {
    const response = (await apiClient.get('/purchases/grn', {
      params,
    })) as unknown as ApiResponse<PaginatedGrnResponse>;
    return response.data;
  },

  getGoodsReceiveNoteById: async (id: string): Promise<GoodsReceiveNote> => {
    const response = (await apiClient.get(
      `/purchases/grn/${id}`,
    )) as unknown as ApiResponse<GoodsReceiveNote>;
    return response.data;
  },

  createGoodsReceiveNote: async (
    payload: CreateGrnPayload,
  ): Promise<GoodsReceiveNote> => {
    const response = (await apiClient.post(
      '/purchases/grn',
      payload,
    )) as unknown as ApiResponse<GoodsReceiveNote>;
    return response.data;
  },

  updateGoodsReceiveNote: async (
    id: string,
    payload: Partial<CreateGrnPayload>,
  ): Promise<GoodsReceiveNote> => {
    const response = (await apiClient.put(
      `/purchases/grn/${id}`,
      payload,
    )) as unknown as ApiResponse<GoodsReceiveNote>;
    return response.data;
  },

  postGoodsReceiveNote: async (id: string): Promise<GoodsReceiveNote> => {
    const response = (await apiClient.post(
      `/purchases/grn/${id}/post`,
    )) as unknown as ApiResponse<GoodsReceiveNote>;
    return response.data;
  },

  deleteDraftGoodsReceiveNote: async (
    id: string,
  ): Promise<{ success: boolean; message: string }> => {
    const response = (await apiClient.delete(
      `/purchases/grn/${id}`,
    )) as unknown as ApiResponse<{ success: boolean; message: string }>;
    return response.data;
  },
};

export const getPurchaseOrders = purchasingApi.getPurchaseOrders;
export const getPurchaseOrderById = purchasingApi.getPurchaseOrderById;
export const createPurchaseOrder = purchasingApi.createPurchaseOrder;
export const updatePurchaseOrder = purchasingApi.updatePurchaseOrder;
export const issuePurchaseOrder = purchasingApi.issuePurchaseOrder;
export const cancelPurchaseOrder = purchasingApi.cancelPurchaseOrder;

export const getGoodsReceiveNotes = purchasingApi.getGoodsReceiveNotes;
export const getGoodsReceiveNoteById = purchasingApi.getGoodsReceiveNoteById;
export const createGoodsReceiveNote = purchasingApi.createGoodsReceiveNote;
export const updateGoodsReceiveNote = purchasingApi.updateGoodsReceiveNote;
export const postGoodsReceiveNote = purchasingApi.postGoodsReceiveNote;
export const deleteDraftGoodsReceiveNote = purchasingApi.deleteDraftGoodsReceiveNote;
