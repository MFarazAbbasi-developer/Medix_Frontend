import { apiClient } from './client';
import { Customer } from './customers.api';
import { PaymentMethod } from './sales.api';

export type CustomerPaymentStatus = 'POSTED' | 'CANCELLED';

export interface CustomerPaymentAllocation {
  id: string;
  customerPaymentId: string;
  salesInvoiceId: string;
  amountAllocated: string | number;
  createdAt: string;
  salesInvoice?: {
    id: string;
    invoiceNumber: string;
    invoiceDate?: string;
    netTotal: string | number;
    paidAmount?: string | number;
    balanceAmount: string | number;
    status?: string;
  };
}

export interface CustomerPayment {
  id: string;
  organizationId: string;
  branchId: string;
  customerId: string;
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
  status: CustomerPaymentStatus;
  postedAt: string;
  postedByUserId?: string | null;
  cancelledAt?: string | null;
  cancelledByUserId?: string | null;
  cancellationReason?: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
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
  allocations?: CustomerPaymentAllocation[];
  ledgerEntries?: any[];
}

export interface UnpaidInvoiceSummary {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
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

export interface PaymentAllocationItem {
  salesInvoiceId: string;
  amountAllocated: number;
}

export interface CreateCustomerPaymentDto {
  customerId: string;
  paymentDate?: string;
  paymentMethod: PaymentMethod;
  amount: number;
  referenceNumber?: string;
  bankName?: string;
  chequeDate?: string;
  notes?: string;
  allocations?: PaymentAllocationItem[];
}

export interface QueryCustomerPaymentDto {
  search?: string;
  customerId?: string;
  paymentMethod?: PaymentMethod;
  status?: CustomerPaymentStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface CancelCustomerPaymentDto {
  cancellationReason: string;
}

export interface CustomerPaymentsListResponse {
  items: CustomerPayment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary: {
    totalAmount: string | number;
    totalAllocated: string | number;
    totalUnallocated: string | number;
  };
}

export const customerPaymentsApi = {
  getPayments: async (query?: QueryCustomerPaymentDto): Promise<CustomerPaymentsListResponse> => {
    const res = await apiClient.get<CustomerPaymentsListResponse>('/customer-payments', { params: query });
    return res.data;
  },

  getPaymentById: async (id: string): Promise<CustomerPayment> => {
    const res = await apiClient.get<CustomerPayment>(`/customer-payments/${id}`);
    return res.data;
  },

  getUnpaidInvoices: async (customerId: string): Promise<UnpaidInvoiceSummary[]> => {
    const res = await apiClient.get<UnpaidInvoiceSummary[]>(`/customer-payments/unpaid-invoices/${customerId}`);
    return res.data;
  },

  createPayment: async (dto: CreateCustomerPaymentDto): Promise<CustomerPayment> => {
    const res = await apiClient.post<CustomerPayment>('/customer-payments', dto);
    return res.data;
  },

  cancelPayment: async (id: string, dto: CancelCustomerPaymentDto): Promise<CustomerPayment> => {
    const res = await apiClient.post<CustomerPayment>(`/customer-payments/${id}/cancel`, dto);
    return res.data;
  },
};
