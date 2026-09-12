import { apiClient } from './client';
import { Customer } from './customers.api';
import { SalesInvoice } from './sales.api';

export type SalesReturnStatus = 'POSTED' | 'CANCELLED';

export type ReturnReason =
  | 'CUSTOMER_RETURN'
  | 'DAMAGED_IN_TRANSIT'
  | 'DEFECTIVE_PRODUCT'
  | 'EXPIRED_NEAR_EXPIRY'
  | 'WRONG_DISPENSATION'
  | 'REGULATORY_RECALL'
  | 'OTHER';

export type ReturnedStockCondition = 'SALEABLE' | 'QUARANTINED';

export type ReturnStockDisposition = 'RESTOCK_SALEABLE' | 'QUARANTINE' | 'RETURN_TO_SUPPLIER';

export type ReturnRefundMode = 'CREDIT_ACCOUNT' | 'CASH_REFUND' | 'BANK_TRANSFER';

export interface SalesReturnItem {
  id: string;
  salesReturnId: string;
  salesInvoiceItemId: string;
  productId: string;
  batchId: string;
  batchNumber: string;
  expiryDate: string;
  destinationWarehouseId: string;
  returnedQuantity: number;
  bonusReturnedQuantity: number;
  totalReturnedQuantity: number;
  stockCondition: ReturnedStockCondition;
  disposition: ReturnStockDisposition;
  unitCost: string | number;
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
    genericName?: string | null;
    packSize?: string | null;
    dosageForm?: string | null;
  };
  batch?: {
    id: string;
    batchNumber: string;
    expiryDate: string;
    mfgDate?: string | null;
  };
  destinationWarehouse?: {
    id: string;
    name: string;
    code: string;
    warehouseType: 'STANDARD' | 'QUARANTINE';
  };
}

export interface SalesReturn {
  id: string;
  organizationId: string;
  branchId: string;
  customerId: string;
  salesInvoiceId: string;
  returnNumber: string;
  returnDate: string;
  status: SalesReturnStatus;
  reason: ReturnReason;
  refundMode: ReturnRefundMode;
  refundAmount: string | number;
  subtotal: string | number;
  discountAmount: string | number;
  taxAmount: string | number;
  netTotal: string | number;
  totalCostPrice: string | number;
  grossProfit: string | number;
  notes?: string | null;
  postedAt: string;
  postedByUserId?: string | null;
  cancelledAt?: string | null;
  cancelledByUserId?: string | null;
  cancellationReason?: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  salesInvoice?: SalesInvoice;
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
  items?: SalesReturnItem[];
  ledgerEntries?: any[];
}

export interface ReturnableInvoiceItem {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  batchId: string;
  batchNumber: string;
  expiryDate: string;
  billedQuantity: number;
  bonusQuantity: number;
  totalQuantity: number;
  priorReturnedBilled: number;
  priorReturnedBonus: number;
  availableBilled: number;
  availableBonus: number;
  unitPrice: number;
  discountPercentage: number;
  taxPercentage: number;
  unitCost: number;
  canReturnAsSaleable: boolean;
  isExpired: boolean;
}

export interface ReturnableInvoiceDetails {
  invoice: {
    id: string;
    invoiceNumber: string;
    invoiceDate: string;
    customerId: string;
    customerName: string;
    customerCode: string;
    customerBalance: number;
    branchId: string;
    warehouseId: string;
    netTotal: number;
    paidAmount: number;
    balanceAmount: number;
    priorRefunds: number;
    maxRefundableAmount: number;
  };
  items: ReturnableInvoiceItem[];
}

export interface CreateSalesReturnItemPayload {
  salesInvoiceItemId: string;
  returnedQuantity: number;
  bonusReturnedQuantity?: number;
  stockCondition?: ReturnedStockCondition;
  disposition?: ReturnStockDisposition;
  destinationWarehouseId: string;
}

export interface CreateSalesReturnDto {
  salesInvoiceId: string;
  returnDate?: string;
  reason: ReturnReason;
  refundMode: ReturnRefundMode;
  refundAmount?: number;
  notes?: string;
  items: CreateSalesReturnItemPayload[];
}

export interface QuerySalesReturnDto {
  search?: string;
  customerId?: string;
  salesInvoiceId?: string;
  status?: SalesReturnStatus;
  reason?: ReturnReason;
  refundMode?: ReturnRefundMode;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface CancelSalesReturnDto {
  cancellationReason: string;
}

export interface SalesReturnsListResponse {
  items: SalesReturn[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary: {
    totalNetReturn: string | number;
    totalRefundAmount: string | number;
    totalReversedCOGS: string | number;
    totalReversedProfit: string | number;
  };
}

export const salesReturnsApi = {
  getSalesReturns: async (query?: QuerySalesReturnDto): Promise<SalesReturnsListResponse> => {
    const res = await apiClient.get<SalesReturnsListResponse>('/sales-returns', { params: query });
    return res.data;
  },

  getSalesReturnById: async (id: string): Promise<SalesReturn> => {
    const res = await apiClient.get<SalesReturn>(`/sales-returns/${id}`);
    return res.data;
  },

  getReturnableInvoice: async (invoiceId: string): Promise<ReturnableInvoiceDetails> => {
    const res = await apiClient.get<ReturnableInvoiceDetails>(`/sales-returns/returnable-invoice/${invoiceId}`);
    return res.data;
  },

  createSalesReturn: async (dto: CreateSalesReturnDto): Promise<SalesReturn> => {
    const res = await apiClient.post<SalesReturn>('/sales-returns', dto);
    return res.data;
  },

  cancelSalesReturn: async (id: string, dto: CancelSalesReturnDto): Promise<SalesReturn> => {
    const res = await apiClient.post<SalesReturn>(`/sales-returns/${id}/cancel`, dto);
    return res.data;
  },
};
