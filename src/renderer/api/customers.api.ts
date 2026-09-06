import { apiClient, ApiResponse } from './client';

export type CustomerType =
  | 'RETAIL_PHARMACY'
  | 'HOSPITAL'
  | 'DISTRIBUTOR'
  | 'WALK_IN'
  | 'INSTITUTIONAL';

export interface Customer {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  customerType: CustomerType;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  ntn?: string | null;
  strn?: string | null;
  drugSaleLicenseNo?: string | null;
  creditDays: number;
  creditLimit: string | number;
  currentBalance: string | number;
  defaultDiscountPercentage: string | number;
  isTaxExempt: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    salesInvoices: number;
    ledgerEntries: number;
    pricingRules?: number;
  };
}

export type CustomerLedgerEntryType =
  | 'OPENING_BALANCE'
  | 'SALES_INVOICE'
  | 'PAYMENT'
  | 'CREDIT_NOTE'
  | 'REFUND'
  | 'ADJUSTMENT';

export interface CustomerLedgerEntry {
  id: string;
  organizationId: string;
  branchId: string;
  customerId: string;
  salesInvoiceId?: string | null;
  entryType: CustomerLedgerEntryType;
  referenceNumber: string;
  debit: string | number;
  credit: string | number;
  runningBalance: string | number;
  transactionDate: string;
  notes?: string | null;
  createdAt: string;
  branch?: { id: string; name: string; code: string };
  createdByUser?: { id: string; displayName: string; username: string };
  salesInvoice?: { id: string; invoiceNumber: string; netTotal: string | number };
}

export interface PaginatedCustomersResponse {
  items: Customer[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CustomerLedgerResponse {
  customer: {
    id: string;
    code: string;
    name: string;
    currentBalance: string | number;
    creditLimit: string | number;
    creditDays: number;
  };
  summary: {
    totalDebit: string | number;
    totalCredit: string | number;
    netBalance: string | number;
  };
  items: CustomerLedgerEntry[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateCustomerPayload {
  code: string;
  name: string;
  customerType?: CustomerType;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  ntn?: string;
  strn?: string;
  drugSaleLicenseNo?: string;
  creditDays?: number;
  creditLimit?: number;
  defaultDiscountPercentage?: number;
  isTaxExempt?: boolean;
  openingBalance?: number;
  isActive?: boolean;
}

export interface UpdateCustomerPayload {
  code?: string;
  name?: string;
  customerType?: CustomerType;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  ntn?: string;
  strn?: string;
  drugSaleLicenseNo?: string;
  creditDays?: number;
  creditLimit?: number;
  defaultDiscountPercentage?: number;
  isTaxExempt?: boolean;
  isActive?: boolean;
}

export interface CustomerPricingRule {
  id: string;
  customerId: string;
  productId: string;
  customPrice?: string | number | null;
  discountPercentage?: string | number | null;
  isActive: boolean;
  product?: {
    id: string;
    sku: string;
    name: string;
    genericName: string;
    taxPercentage: string | number;
  };
}

export interface UpsertCustomerPricingPayload {
  productId: string;
  customPrice?: number;
  discountPercentage?: number;
  isActive?: boolean;
}

export const customersApi = {
  getCustomers: async (params?: {
    search?: string;
    customerType?: CustomerType;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<PaginatedCustomersResponse> => {
    const response = (await apiClient.get('/customers', {
      params,
    })) as unknown as ApiResponse<PaginatedCustomersResponse>;
    return response.data;
  },

  getCustomerById: async (id: string): Promise<Customer> => {
    const response = (await apiClient.get(
      `/customers/${id}`,
    )) as unknown as ApiResponse<Customer>;
    return response.data;
  },

  createCustomer: async (
    payload: CreateCustomerPayload,
  ): Promise<Customer> => {
    const response = (await apiClient.post(
      '/customers',
      payload,
    )) as unknown as ApiResponse<Customer>;
    return response.data;
  },

  updateCustomer: async (
    id: string,
    payload: UpdateCustomerPayload,
  ): Promise<Customer> => {
    const response = (await apiClient.put(
      `/customers/${id}`,
      payload,
    )) as unknown as ApiResponse<Customer>;
    return response.data;
  },

  getCustomerLedger: async (
    customerId: string,
    params?: {
      startDate?: string;
      endDate?: string;
      entryType?: CustomerLedgerEntryType;
      branchId?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<CustomerLedgerResponse> => {
    const response = (await apiClient.get(
      `/customers/${customerId}/ledger`,
      { params },
    )) as unknown as ApiResponse<CustomerLedgerResponse>;
    return response.data;
  },

  getCustomerPricing: async (
    customerId: string,
  ): Promise<CustomerPricingRule[]> => {
    const response = (await apiClient.get(
      `/customers/${customerId}/pricing`,
    )) as unknown as ApiResponse<CustomerPricingRule[]>;
    return response.data;
  },

  upsertCustomerPricing: async (
    customerId: string,
    payload: UpsertCustomerPricingPayload,
  ): Promise<CustomerPricingRule> => {
    const response = (await apiClient.put(
      `/customers/${customerId}/pricing`,
      payload,
    )) as unknown as ApiResponse<CustomerPricingRule>;
    return response.data;
  },
};

export const getCustomers = (params?: Parameters<typeof customersApi.getCustomers>[0]) =>
  customersApi.getCustomers(params);
export const getCustomerById = (id: string) =>
  customersApi.getCustomerById(id);
export const createCustomer = (payload: CreateCustomerPayload) =>
  customersApi.createCustomer(payload);
export const updateCustomer = (id: string, payload: UpdateCustomerPayload) =>
  customersApi.updateCustomer(id, payload);
export const getCustomerLedger = (
  customerId: string,
  params?: Parameters<typeof customersApi.getCustomerLedger>[1],
) => customersApi.getCustomerLedger(customerId, params);
export const getCustomerPricing = (customerId: string) =>
  customersApi.getCustomerPricing(customerId);
export const upsertCustomerPricing = (
  customerId: string,
  payload: UpsertCustomerPricingPayload,
) => customersApi.upsertCustomerPricing(customerId, payload);

