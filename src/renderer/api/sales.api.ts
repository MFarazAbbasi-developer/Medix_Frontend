import { apiClient, ApiResponse } from './client';
import { Customer } from './customers.api';

export type SalesInvoiceStatus = 'DRAFT' | 'POSTED' | 'CANCELLED';

export type PaymentMethod =
  | 'CASH'
  | 'BANK_TRANSFER'
  | 'CREDIT_CARD'
  | 'CHEQUE'
  | 'ONLINE'
  | 'CREDIT_ACCOUNT';

export interface SalesInvoiceItem {
  id: string;
  salesInvoiceId: string;
  productId: string;
  batchId: string;
  batchNumber: string;
  expiryDate: string;
  billedQuantity: number;
  bonusQuantity: number;
  totalQuantity: number;
  unitCost: string | number;
  tradePrice: string | number;
  retailPrice: string | number;
  unitPrice: string | number;
  discountPercentage: string | number;
  discountAmount: string | number;
  taxPercentage: string | number;
  taxAmount: string | number;
  lineTotal: string | number;
  lineCost: string | number;
  lineProfit: string | number;
  product?: {
    id: string;
    sku: string;
    name: string;
    genericName: string;
    dosageForm?: string | null;
    packSize?: string | null;
  };
  batch?: {
    id: string;
    batchNumber: string;
    expiryDate: string;
    mfgDate?: string | null;
  };
}

export interface SalesInvoicePayment {
  id: string;
  salesInvoiceId: string;
  paymentMethod: PaymentMethod;
  amount: string | number;
  referenceNumber?: string | null;
  notes?: string | null;
  paidAt: string;
}

export interface SalesInvoice {
  id: string;
  organizationId: string;
  branchId: string;
  warehouseId: string;
  customerId: string;
  invoiceNumber?: string | null;
  draftNumber?: string | null;
  invoiceDate: string;
  status: SalesInvoiceStatus;
  paymentMethod: PaymentMethod;
  subtotal: string | number;
  discountAmount: string | number;
  taxAmount: string | number;
  netTotal: string | number;
  paidAmount: string | number;
  balanceAmount: string | number;
  totalCostPrice: string | number;
  grossProfit: string | number;
  notes?: string | null;
  postedAt?: string | null;
  postedByUserId?: string | null;
  cancelledAt?: string | null;
  cancelledByUserId?: string | null;
  cancellationReason?: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  branch?: { id: string; name: string; code: string };
  warehouse?: { id: string; name: string; code: string };
  postedByUser?: { id: string; displayName: string; username: string };
  cancelledByUser?: { id: string; displayName: string; username: string };
  items?: SalesInvoiceItem[];
  payments?: SalesInvoicePayment[];
  _count?: {
    items: number;
    payments: number;
  };
}

export interface PaginatedSalesInvoicesResponse {
  items: SalesInvoice[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface FefoBatchAllocation {
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

export interface FefoPreviewResponse {
  product: {
    id: string;
    sku: string;
    name: string;
    genericName: string;
    taxPercentage: number;
  };
  customerPricing: {
    customPrice: number | null;
    discountPercentage: number;
  };
  allocation: {
    productId: string;
    warehouseId: string;
    requestedQuantity: number;
    allocatedQuantity: number;
    shortfall: number;
    isFullyAllocated: boolean;
    allocations: FefoBatchAllocation[];
  };
}

export interface CreateSalesInvoiceItemPayload {
  productId: string;
  batchId?: string;
  billedQuantity: number;
  bonusQuantity?: number;
  unitPrice?: number;
  discountPercentage?: number;
  taxPercentage?: number;
  remarks?: string;
}

export interface SalesInvoicePaymentTenderPayload {
  paymentMethod: PaymentMethod;
  amount: number;
  referenceNumber?: string;
  notes?: string;
}

export interface CreateSalesInvoicePayload {
  customerId: string;
  warehouseId: string;
  paymentMethod?: PaymentMethod;
  invoiceDate?: string;
  items: CreateSalesInvoiceItemPayload[];
  payments?: SalesInvoicePaymentTenderPayload[];
  overallDiscountAmount?: number;
  notes?: string;
  isDraft?: boolean;
}

export interface SalesMetricsResponse {
  today: {
    invoiceCount: number;
    grossSales: number;
    cashCollected: number;
    creditReceivablesAdded: number;
    grossProfit: number;
  };
  allTime: {
    invoiceCount: number;
    grossSales: number;
    cashCollected: number;
    outstandingReceivables: number;
    grossProfit: number;
  };
  draftInvoicesCount: number;
}

export const salesApi = {
  previewFefo: async (payload: {
    warehouseId: string;
    productId: string;
    requestedQuantity: number;
    customerId?: string;
  }): Promise<FefoPreviewResponse> => {
    const response = (await apiClient.post(
      '/sales/fefo-preview',
      payload,
    )) as unknown as ApiResponse<FefoPreviewResponse>;
    return response.data;
  },

  getInvoices: async (params?: {
    search?: string;
    customerId?: string;
    branchId?: string;
    warehouseId?: string;
    status?: SalesInvoiceStatus;
    paymentMethod?: PaymentMethod;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedSalesInvoicesResponse> => {
    const response = (await apiClient.get('/sales/invoices', {
      params,
    })) as unknown as ApiResponse<PaginatedSalesInvoicesResponse>;
    return response.data;
  },

  getInvoiceById: async (id: string): Promise<SalesInvoice> => {
    const response = (await apiClient.get(
      `/sales/invoices/${id}`,
    )) as unknown as ApiResponse<SalesInvoice>;
    return response.data;
  },

  createInvoice: async (
    payload: CreateSalesInvoicePayload,
  ): Promise<SalesInvoice> => {
    const response = (await apiClient.post(
      '/sales/invoices',
      payload,
    )) as unknown as ApiResponse<SalesInvoice>;
    return response.data;
  },

  postDraftInvoice: async (id: string): Promise<SalesInvoice> => {
    const response = (await apiClient.post(
      `/sales/invoices/${id}/post`,
      {},
    )) as unknown as ApiResponse<SalesInvoice>;
    return response.data;
  },

  cancelInvoice: async (
    id: string,
    payload: { cancellationReason: string },
  ): Promise<SalesInvoice> => {
    const response = (await apiClient.post(
      `/sales/invoices/${id}/cancel`,
      payload,
    )) as unknown as ApiResponse<SalesInvoice>;
    return response.data;
  },

  getSalesMetrics: async (
    branchId?: string,
  ): Promise<SalesMetricsResponse> => {
    const response = (await apiClient.get('/sales/metrics', {
      params: { branchId },
    })) as unknown as ApiResponse<SalesMetricsResponse>;
    return response.data;
  },
};

export const previewFefo = (payload: Parameters<typeof salesApi.previewFefo>[0]) =>
  salesApi.previewFefo(payload);
export const getInvoices = (params?: Parameters<typeof salesApi.getInvoices>[0]) =>
  salesApi.getInvoices(params);
export const getInvoiceById = (id: string) => salesApi.getInvoiceById(id);
export const createInvoice = (payload: CreateSalesInvoicePayload) =>
  salesApi.createInvoice(payload);
export const postDraftInvoice = (id: string) => salesApi.postDraftInvoice(id);
export const cancelInvoice = (
  id: string,
  payload: { cancellationReason: string },
) => salesApi.cancelInvoice(id, payload);
export const getSalesMetrics = (branchId?: string) =>
  salesApi.getSalesMetrics(branchId);

