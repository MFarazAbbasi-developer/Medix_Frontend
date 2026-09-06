import { apiClient } from './client';
import { Supplier } from './suppliers.api';
import { PaymentMethod } from './sales.api';

export type SupplierPaymentStatus = 'POSTED' | 'CANCELLED';

export interface SupplierPaymentAllocation {
  id: string;
  supplierPaymentId: string;
  grnId: string;
  amountAllocated: string | number;
  createdAt: string;
  grn?: {
    id: string;
    grnNumber: string;
    supplierInvoiceNumber?: string | null;
    receivedDate?: string;
    netTotal: string | number;
    paidAmount?: string | number;
    balanceAmount: string | number;
    status?: string;
  };
}

export interface SupplierPayment {
  id: string;
  organizationId: string;
  branchId: string;
  supplierId: string;
  paymentNumber: string;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  amount: string | number;
  allocatedAmount: string | number;
  unallocatedAmount: string | number;
  referenceNumber?: string | null;
  bankName?: string | null;
  chequeDate?: string | null;
  notes?: string | null;
  status: SupplierPaymentStatus;
  postedAt: string;
  postedByUserId?: string | null;
  cancelledAt?: string | null;
  cancelledByUserId?: string | null;
  cancellationReason?: string | null;
  createdAt: string;
  updatedAt: string;
  supplier?: Supplier;
  branch?: {
    id: string;
    name: string;
    code: string;
    city?: string | null;
    phone?: string | null;
    address?: string | null;
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
  allocations?: SupplierPaymentAllocation[];
  ledgerEntries?: any[];
  _count?: {
    allocations: number;
  };
}

export interface UnpaidGrnSummary {
  id: string;
  grnNumber: string;
  supplierInvoiceNumber?: string | null;
  supplierInvoiceDate?: string | null;
  receivedDate: string;
  subtotal: string | number;
  discountAmount: string | number;
  taxAmount: string | number;
  netTotal: string | number;
  paidAmount: string | number;
  balanceAmount: string | number;
  status: string;
  _count?: {
    items: number;
  };
}

export interface SupplierPaymentAllocationItem {
  grnId: string;
  amountAllocated: number;
}

export interface CreateSupplierPaymentDto {
  supplierId: string;
  paymentDate?: string;
  paymentMethod: PaymentMethod;
  amount: number;
  referenceNumber?: string;
  bankName?: string;
  chequeDate?: string;
  notes?: string;
  allocations?: SupplierPaymentAllocationItem[];
}

export interface CancelSupplierPaymentDto {
  cancellationReason: string;
}

export interface QuerySupplierPaymentsParams {
  search?: string;
  supplierId?: string;
  paymentMethod?: PaymentMethod;
  status?: SupplierPaymentStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedSupplierPaymentsResponse {
  items: SupplierPayment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary: {
    totalPaidAmount: number;
    totalAllocatedAmount: number;
    totalUnallocatedAmount: number;
  };
}

export const supplierPaymentsApi = {
  getSupplierPayments: async (
    params?: QuerySupplierPaymentsParams,
  ): Promise<PaginatedSupplierPaymentsResponse> => {
    const response = await apiClient.get<PaginatedSupplierPaymentsResponse>(
      '/supplier-payments',
      { params },
    );
    return response.data;
  },

  getSupplierPaymentById: async (id: string): Promise<SupplierPayment> => {
    const response = await apiClient.get<SupplierPayment>(`/supplier-payments/${id}`);
    return response.data;
  },

  getUnpaidGrns: async (supplierId: string): Promise<UnpaidGrnSummary[]> => {
    const response = await apiClient.get<UnpaidGrnSummary[]>(
      `/supplier-payments/unpaid-grns/${supplierId}`,
    );
    return response.data;
  },

  createSupplierPayment: async (
    dto: CreateSupplierPaymentDto,
  ): Promise<SupplierPayment> => {
    const response = await apiClient.post<SupplierPayment>('/supplier-payments', dto);
    return response.data;
  },

  cancelSupplierPayment: async (
    id: string,
    dto: CancelSupplierPaymentDto,
  ): Promise<SupplierPayment> => {
    const response = await apiClient.post<SupplierPayment>(
      `/supplier-payments/${id}/cancel`,
      dto,
    );
    return response.data;
  },
};

export const getSupplierPayments = supplierPaymentsApi.getSupplierPayments;
export const getSupplierPaymentById = supplierPaymentsApi.getSupplierPaymentById;
export const getUnpaidGrns = supplierPaymentsApi.getUnpaidGrns;
export const createSupplierPayment = supplierPaymentsApi.createSupplierPayment;
export const cancelSupplierPayment = supplierPaymentsApi.cancelSupplierPayment;
