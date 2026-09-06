import { apiClient, ApiResponse } from './client';

export type BatchStatus = 'ACTIVE' | 'QUARANTINED' | 'RECALLED';

export interface Batch {
  id: string;
  productId: string;
  batchNumber: string;
  mfgDate?: string | null;
  expiryDate: string;
  purchaseCost: string | number;
  tradePrice: string | number;
  retailPrice: string | number;
  status: BatchStatus;
  remarks?: string | null;
  createdAt: string;
  updatedAt: string;
  product?: {
    id: string;
    sku: string;
    name: string;
    genericName: string;
    dosageForm?: string | null;
    packSize?: string | null;
  };
}

export interface CreateBatchDto {
  batchNumber: string;
  mfgDate?: string;
  expiryDate: string;
  purchaseCost: number;
  tradePrice: number;
  retailPrice: number;
  status?: BatchStatus;
  remarks?: string;
}

export interface UpdateBatchDto {
  batchNumber?: string;
  mfgDate?: string;
  expiryDate?: string;
  purchaseCost?: number;
  tradePrice?: number;
  retailPrice?: number;
  status?: BatchStatus;
  remarks?: string;
}

export interface QueryBatchParams {
  productId?: string;
  status?: BatchStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedBatchResponse {
  items: Batch[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const batchesApi = {
  getBatchesByProduct: async (productId: string): Promise<Batch[]> => {
    const response = (await apiClient.get(
      `/products/${productId}/batches`,
    )) as unknown as ApiResponse<Batch[]>;
    return response.data;
  },

  getAllBatches: async (
    params?: QueryBatchParams,
  ): Promise<PaginatedBatchResponse> => {
    const response = (await apiClient.get('/batches', {
      params,
    })) as unknown as ApiResponse<PaginatedBatchResponse>;
    return response.data;
  },

  createBatch: async (
    productId: string,
    data: CreateBatchDto,
  ): Promise<Batch> => {
    const response = (await apiClient.post(
      `/products/${productId}/batches`,
      data,
    )) as unknown as ApiResponse<Batch>;
    return response.data;
  },

  updateBatch: async (
    id: string,
    data: UpdateBatchDto,
  ): Promise<Batch> => {
    const response = (await apiClient.patch(
      `/batches/${id}`,
      data,
    )) as unknown as ApiResponse<Batch>;
    return response.data;
  },
};
