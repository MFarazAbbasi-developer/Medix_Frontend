import { apiClient, ApiResponse } from './client';
import { Manufacturer, ProductCategory, UnitOfMeasurement } from './master-data.api';
import { Batch } from './batches.api';

export interface Product {
  id: string;
  organizationId: string;
  sku: string;
  name: string;
  genericName: string;
  manufacturerId?: string | null;
  categoryId?: string | null;
  unitId?: string | null;
  dosageForm?: string | null;
  strength?: string | null;
  packSize?: string | null;
  barcode?: string | null;
  taxPercentage: string | number;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  manufacturer?: Manufacturer | null;
  category?: ProductCategory | null;
  unit?: UnitOfMeasurement | null;
  batches?: Batch[];
  _count?: {
    batches: number;
  };
}

export interface CreateProductDto {
  sku: string;
  name: string;
  genericName: string;
  manufacturerId?: string;
  categoryId?: string;
  unitId?: string;
  dosageForm?: string;
  strength?: string;
  packSize?: string;
  barcode?: string;
  taxPercentage?: number;
  description?: string;
  isActive?: boolean;
}

export interface UpdateProductDto {
  sku?: string;
  name?: string;
  genericName?: string;
  manufacturerId?: string;
  categoryId?: string;
  unitId?: string;
  dosageForm?: string;
  strength?: string;
  packSize?: string;
  barcode?: string;
  taxPercentage?: number;
  description?: string;
  isActive?: boolean;
}

export interface QueryProductParams {
  search?: string;
  categoryId?: string;
  manufacturerId?: string;
  isActive?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedProductResponse {
  items: Product[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const productsApi = {
  getProducts: async (
    params?: QueryProductParams,
  ): Promise<PaginatedProductResponse> => {
    const response = (await apiClient.get('/products', {
      params,
    })) as unknown as ApiResponse<PaginatedProductResponse>;
    return response.data;
  },

  getProductById: async (id: string): Promise<Product> => {
    const response = (await apiClient.get(
      `/products/${id}`,
    )) as unknown as ApiResponse<Product>;
    return response.data;
  },

  createProduct: async (data: CreateProductDto): Promise<Product> => {
    const response = (await apiClient.post(
      '/products',
      data,
    )) as unknown as ApiResponse<Product>;
    return response.data;
  },

  updateProduct: async (
    id: string,
    data: UpdateProductDto,
  ): Promise<Product> => {
    const response = (await apiClient.patch(
      `/products/${id}`,
      data,
    )) as unknown as ApiResponse<Product>;
    return response.data;
  },

  toggleProductStatus: async (
    id: string,
    isActive: boolean,
  ): Promise<Product> => {
    const response = (await apiClient.patch(`/products/${id}/status`, {
      isActive,
    })) as unknown as ApiResponse<Product>;
    return response.data;
  },
};
