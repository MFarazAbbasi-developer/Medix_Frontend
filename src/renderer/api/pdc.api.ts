import { apiClient } from './client';
import { Customer } from './customers.api';
import { CustomerPayment } from './customer-payments.api';

export type PdcStatus = 'RECEIVED' | 'DEPOSITED' | 'CLEARED' | 'BOUNCED' | 'CANCELLED';

export interface PdcAllocation {
  id: string;
  pdcId: string;
  salesInvoiceId: string;
  amountAllocated: string | number;
  createdAt: string;
  salesInvoice?: {
    id: string;
    invoiceNumber: string;
    invoiceDate?: string;
    netTotal: string | number;
    balanceAmount: string | number;
  };
}

export interface PostDatedCheque {
  id: string;
  organizationId: string;
  branchId: string;
  customerId: string;
  pdcNumber: string;
  chequeNumber: string;
  bankName: string;
  chequeDate: string;
  receivedDate: string;
  amount: string | number;
  allocatedAmount: string | number;
  unallocatedAmount: string | number;
  status: PdcStatus;
  notes?: string | null;

  depositBankName?: string | null;
  depositReference?: string | null;
  depositedAt?: string | null;
  depositedByUserId?: string | null;

  clearedAt?: string | null;
  clearedByUserId?: string | null;
  customerPaymentId?: string | null;

  bouncedAt?: string | null;
  bouncedByUserId?: string | null;
  bounceReason?: string | null;

  cancelledAt?: string | null;
  cancelledByUserId?: string | null;
  cancellationReason?: string | null;

  createdById?: string | null;
  createdAt: string;
  updatedAt: string;

  customer?: Customer;
  branch?: {
    id: string;
    name: string;
    code: string;
    address?: string | null;
    phone?: string | null;
  };
  customerPayment?: CustomerPayment | null;
  createdByUser?: {
    id: string;
    displayName: string;
    username: string;
  } | null;
  depositedByUser?: {
    id: string;
    displayName: string;
    username: string;
  } | null;
  clearedByUser?: {
    id: string;
    displayName: string;
    username: string;
  } | null;
  bouncedByUser?: {
    id: string;
    displayName: string;
    username: string;
  } | null;
  cancelledByUser?: {
    id: string;
    displayName: string;
    username: string;
  } | null;
  allocations?: PdcAllocation[];
}

export interface PdcAllocationItem {
  salesInvoiceId: string;
  amountAllocated: number;
}

export interface CreatePdcDto {
  customerId: string;
  chequeNumber: string;
  bankName: string;
  chequeDate: string;
  receivedDate?: string;
  amount: number;
  notes?: string;
  allocations?: PdcAllocationItem[];
}

export interface DepositPdcDto {
  depositBankName: string;
  depositReference?: string;
  depositedAt?: string;
}

export interface ClearPdcDto {
  clearedAt?: string;
  notes?: string;
}

export interface BouncePdcDto {
  bounceReason: string;
  bouncedAt?: string;
}

export interface CancelPdcDto {
  cancellationReason: string;
}

export interface QueryPdcDto {
  page?: number;
  limit?: number;
  search?: string;
  customerId?: string;
  status?: PdcStatus;
  startDate?: string;
  endDate?: string;
  branchId?: string;
}

export interface PdcListMetrics {
  receivedCount: number;
  receivedAmount: number;
  depositedCount: number;
  depositedAmount: number;
  clearedCount: number;
  clearedAmount: number;
  bouncedCount: number;
  bouncedAmount: number;
  cancelledCount: number;
  cancelledAmount: number;
  totalPendingAmount: number;
}

export interface PdcListResponse {
  items: PostDatedCheque[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  metrics: PdcListMetrics;
}

export interface PrintablePdcReceiptPayload {
  organization: {
    name: string;
    legalName?: string | null;
    address?: string | null;
    city?: string | null;
    phone?: string | null;
    email?: string | null;
    ntn?: string | null;
    strn?: string | null;
    drugSaleLicenseNo?: string | null;
    logoUrl?: string | null;
  };
  branch: {
    name: string;
    code: string;
    address?: string | null;
    phone?: string | null;
  };
  customer: {
    name: string;
    code?: string | null;
    phone?: string | null;
    address?: string | null;
    city?: string | null;
    ntn?: string | null;
    currentBalance: number;
  };
  pdc: {
    id: string;
    pdcNumber: string;
    chequeNumber: string;
    bankName: string;
    chequeDate: string;
    receivedDate: string;
    amount: number;
    allocatedAmount: number;
    unallocatedAmount: number;
    status: PdcStatus;
    notes?: string | null;
    depositBankName?: string | null;
    depositReference?: string | null;
    depositedAt?: string | null;
    clearedAt?: string | null;
    bouncedAt?: string | null;
    bounceReason?: string | null;
    cancelledAt?: string | null;
    cancellationReason?: string | null;
    receivedBy: string;
    linkedPaymentNumber?: string | null;
    allocations: Array<{
      invoiceNumber: string;
      invoiceDate?: string;
      netTotal: number;
      amountAllocated: number;
    }>;
  };
}

export const pdcApi = {
  getPdcs: async (query?: QueryPdcDto): Promise<PdcListResponse> => {
    const res = await apiClient.get<PdcListResponse>('/pdc', { params: query });
    return res.data;
  },

  getPdcById: async (id: string): Promise<PostDatedCheque> => {
    const res = await apiClient.get<PostDatedCheque>(`/pdc/${id}`);
    return res.data;
  },

  getPrintablePdcReceipt: async (id: string): Promise<PrintablePdcReceiptPayload> => {
    const res = await apiClient.get<PrintablePdcReceiptPayload>(`/pdc/${id}/receipt`);
    return res.data;
  },

  createPdc: async (dto: CreatePdcDto): Promise<PostDatedCheque> => {
    const res = await apiClient.post<PostDatedCheque>('/pdc', dto);
    return res.data;
  },

  depositPdc: async (id: string, dto: DepositPdcDto): Promise<PostDatedCheque> => {
    const res = await apiClient.post<PostDatedCheque>(`/pdc/${id}/deposit`, dto);
    return res.data;
  },

  clearPdc: async (id: string, dto: ClearPdcDto): Promise<PostDatedCheque> => {
    const res = await apiClient.post<PostDatedCheque>(`/pdc/${id}/clear`, dto);
    return res.data;
  },

  bouncePdc: async (id: string, dto: BouncePdcDto): Promise<PostDatedCheque> => {
    const res = await apiClient.post<PostDatedCheque>(`/pdc/${id}/bounce`, dto);
    return res.data;
  },

  cancelPdc: async (id: string, dto: CancelPdcDto): Promise<PostDatedCheque> => {
    const res = await apiClient.post<PostDatedCheque>(`/pdc/${id}/cancel`, dto);
    return res.data;
  },
};
