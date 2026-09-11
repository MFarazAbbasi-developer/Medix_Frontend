import { apiClient, ApiResponse } from './client';

export type CustomerType =
  | 'RETAIL_PHARMACY'
  | 'HOSPITAL'
  | 'CLINIC'
  | 'WHOLESALER'
  | 'DISTRIBUTOR'
  | 'INSTITUTION'
  | 'WALK_IN';

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
  defaultSalesmanId?: string | null;
  routeId?: string | null;
  defaultSalesman?: { id: string; name: string; code: string; phone?: string | null } | null;
  route?: { id: string; name: string; code: string; city?: string | null; area?: string | null } | null;
  deliveryAddresses?: CustomerDeliveryAddress[];
  isTaxExempt: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    salesInvoices: number;
    ledgerEntries: number;
    pricingRules?: number;
    deliveryAddresses?: number;
  };
}

export interface CustomerDeliveryAddress {
  id: string;
  organizationId: string;
  customerId: string;
  title: string;
  recipientName?: string | null;
  phone?: string | null;
  address: string;
  city?: string | null;
  routeId?: string | null;
  route?: { id: string; name: string; code: string; city?: string | null; area?: string | null } | null;
  deliveryInstructions?: string | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerAddressPayload {
  title: string;
  recipientName?: string;
  phone?: string;
  address: string;
  city?: string;
  routeId?: string;
  deliveryInstructions?: string;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface UpdateCustomerAddressPayload {
  title?: string;
  recipientName?: string;
  phone?: string;
  address?: string;
  city?: string;
  routeId?: string;
  deliveryInstructions?: string;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface QueryCustomerAddressParams {
  search?: string;
  isActive?: boolean;
  city?: string;
  routeId?: string;
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
  defaultSalesmanId?: string;
  routeId?: string;
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
  defaultSalesmanId?: string;
  routeId?: string;
  isTaxExempt?: boolean;
  isActive?: boolean;
}

import type { CustomerPricingRule } from './pricing.api';
export type { CustomerPricingRule };

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
    salesmanId?: string;
    routeId?: string;
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

export const customerAddressesApi = {
  list: async (
    customerId: string,
    params?: QueryCustomerAddressParams,
  ): Promise<CustomerDeliveryAddress[]> => {
    const response = (await apiClient.get(
      `/customers/${customerId}/addresses`,
      { params },
    )) as unknown as ApiResponse<CustomerDeliveryAddress[]>;
    return response.data;
  },

  get: async (
    customerId: string,
    addressId: string,
  ): Promise<CustomerDeliveryAddress> => {
    const response = (await apiClient.get(
      `/customers/${customerId}/addresses/${addressId}`,
    )) as unknown as ApiResponse<CustomerDeliveryAddress>;
    return response.data;
  },

  create: async (
    customerId: string,
    payload: CreateCustomerAddressPayload,
  ): Promise<CustomerDeliveryAddress> => {
    const response = (await apiClient.post(
      `/customers/${customerId}/addresses`,
      payload,
    )) as unknown as ApiResponse<CustomerDeliveryAddress>;
    return response.data;
  },

  update: async (
    customerId: string,
    addressId: string,
    payload: UpdateCustomerAddressPayload,
  ): Promise<CustomerDeliveryAddress> => {
    const response = (await apiClient.put(
      `/customers/${customerId}/addresses/${addressId}`,
      payload,
    )) as unknown as ApiResponse<CustomerDeliveryAddress>;
    return response.data;
  },

  setDefault: async (
    customerId: string,
    addressId: string,
  ): Promise<CustomerDeliveryAddress> => {
    const response = (await apiClient.patch(
      `/customers/${customerId}/addresses/${addressId}/default`,
    )) as unknown as ApiResponse<CustomerDeliveryAddress>;
    return response.data;
  },

  delete: async (
    customerId: string,
    addressId: string,
  ): Promise<{ message: string; softDeleted: boolean; address?: CustomerDeliveryAddress }> => {
    const response = (await apiClient.delete(
      `/customers/${customerId}/addresses/${addressId}`,
    )) as unknown as ApiResponse<{ message: string; softDeleted: boolean; address?: CustomerDeliveryAddress }>;
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


