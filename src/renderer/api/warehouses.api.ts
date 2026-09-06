import { apiClient, ApiResponse } from './client';

export interface Warehouse {
  id: string;
  organizationId: string;
  branchId: string;
  name: string;
  code: string;
  address?: string | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  branch?: {
    id: string;
    name: string;
    code: string;
  };
}

export interface CreateWarehouseDto {
  branchId: string;
  name: string;
  code: string;
  address?: string;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface UpdateWarehouseDto {
  name?: string;
  code?: string;
  address?: string;
  isDefault?: boolean;
  isActive?: boolean;
}

export const warehousesApi = {
  getWarehouses: async (
    branchId?: string,
    includeInactive = false,
  ): Promise<Warehouse[]> => {
    const response = (await apiClient.get('/warehouses', {
      params: { branchId, includeInactive },
    })) as unknown as ApiResponse<Warehouse[]>;
    return response.data;
  },

  getWarehouseById: async (id: string): Promise<Warehouse> => {
    const response = (await apiClient.get(
      `/warehouses/${id}`,
    )) as unknown as ApiResponse<Warehouse>;
    return response.data;
  },

  createWarehouse: async (data: CreateWarehouseDto): Promise<Warehouse> => {
    const response = (await apiClient.post(
      '/warehouses',
      data,
    )) as unknown as ApiResponse<Warehouse>;
    return response.data;
  },

  updateWarehouse: async (
    id: string,
    data: UpdateWarehouseDto,
  ): Promise<Warehouse> => {
    const response = (await apiClient.patch(
      `/warehouses/${id}`,
      data,
    )) as unknown as ApiResponse<Warehouse>;
    return response.data;
  },
};
