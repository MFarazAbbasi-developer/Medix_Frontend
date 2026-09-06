import { apiClient, ApiResponse } from './client';

export interface Supplier {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  ntn?: string | null;
  strn?: string | null;
  drugLicenseNo?: string | null;
  creditDays: number;
  creditLimit: string | number;
  currentBalance: string | number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    purchaseOrders: number;
    goodsReceiveNotes: number;
    ledgerEntries?: number;
  };
}

export type SupplierLedgerEntryType =
  | 'OPENING_BALANCE'
  | 'GRN_INVOICE'
  | 'PAYMENT'
  | 'DEBIT_NOTE'
  | 'ADJUSTMENT';

export interface SupplierLedgerEntry {
  id: string;
  organizationId: string;
  branchId: string;
  supplierId: string;
  grnId?: string | null;
  entryType: SupplierLedgerEntryType;
  referenceNumber: string;
  debit: string | number;
  credit: string | number;
  runningBalance: string | number;
  transactionDate: string;
  notes?: string | null;
  createdAt: string;
  branch?: { id: string; name: string; code: string };
  createdByUser?: { id: string; displayName: string; username: string };
  grn?: { id: string; grnNumber: string; supplierInvoiceNumber?: string | null };
}

export interface PaginatedSuppliersResponse {
  items: Supplier[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SupplierLedgerResponse {
  supplier: {
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
  items: SupplierLedgerEntry[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateSupplierPayload {
  code: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  ntn?: string;
  strn?: string;
  drugLicenseNo?: string;
  creditDays?: number;
  creditLimit?: number;
  openingBalance?: number;
  isActive?: boolean;
}

export interface UpdateSupplierPayload {
  code?: string;
  name?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  ntn?: string;
  strn?: string;
  drugLicenseNo?: string;
  creditDays?: number;
  creditLimit?: number;
  isActive?: boolean;
}

export const suppliersApi = {
  getSuppliers: async (params?: {
    search?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<PaginatedSuppliersResponse> => {
    const response = (await apiClient.get('/suppliers', {
      params,
    })) as unknown as ApiResponse<PaginatedSuppliersResponse>;
    return response.data;
  },

  getSupplierById: async (id: string): Promise<Supplier> => {
    const response = (await apiClient.get(
      `/suppliers/${id}`,
    )) as unknown as ApiResponse<Supplier>;
    return response.data;
  },

  createSupplier: async (
    payload: CreateSupplierPayload,
  ): Promise<Supplier> => {
    const response = (await apiClient.post(
      '/suppliers',
      payload,
    )) as unknown as ApiResponse<Supplier>;
    return response.data;
  },

  updateSupplier: async (
    id: string,
    payload: UpdateSupplierPayload,
  ): Promise<Supplier> => {
    const response = (await apiClient.put(
      `/suppliers/${id}`,
      payload,
    )) as unknown as ApiResponse<Supplier>;
    return response.data;
  },

  getSupplierLedger: async (
    supplierId: string,
    params?: {
      startDate?: string;
      endDate?: string;
      entryType?: SupplierLedgerEntryType;
      branchId?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<SupplierLedgerResponse> => {
    const response = (await apiClient.get(
      `/suppliers/${supplierId}/ledger`,
      { params },
    )) as unknown as ApiResponse<SupplierLedgerResponse>;
    return response.data;
  },
};

export const getSuppliers = suppliersApi.getSuppliers;
export const getSupplierById = suppliersApi.getSupplierById;
export const createSupplier = suppliersApi.createSupplier;
export const updateSupplier = suppliersApi.updateSupplier;
export const getSupplierLedger = suppliersApi.getSupplierLedger;
