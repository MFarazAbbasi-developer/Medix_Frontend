import { apiClient, ApiResponse } from './client';

export interface Manufacturer {
  id: string;
  organizationId: string;
  name: string;
  code?: string | null;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductCategory {
  id: string;
  organizationId: string;
  name: string;
  code?: string | null;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UnitOfMeasurement {
  id: string;
  organizationId: string;
  name: string;
  symbol: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateManufacturerDto {
  name: string;
  code?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  isActive?: boolean;
}

export interface UpdateManufacturerDto {
  name?: string;
  code?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  isActive?: boolean;
}

export interface CreateCategoryDto {
  name: string;
  code?: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateCategoryDto {
  name?: string;
  code?: string;
  description?: string;
  isActive?: boolean;
}

export interface CreateUnitDto {
  name: string;
  symbol: string;
  isActive?: boolean;
}

export interface UpdateUnitDto {
  name?: string;
  symbol?: string;
  isActive?: boolean;
}

export const masterDataApi = {
  getManufacturers: async (includeInactive = false): Promise<Manufacturer[]> => {
    const response = (await apiClient.get('/master-data/manufacturers', {
      params: { includeInactive },
    })) as unknown as ApiResponse<Manufacturer[]>;
    return response.data;
  },

  createManufacturer: async (data: CreateManufacturerDto): Promise<Manufacturer> => {
    const response = (await apiClient.post(
      '/master-data/manufacturers',
      data,
    )) as unknown as ApiResponse<Manufacturer>;
    return response.data;
  },

  updateManufacturer: async (
    id: string,
    data: UpdateManufacturerDto,
  ): Promise<Manufacturer> => {
    const response = (await apiClient.patch(
      `/master-data/manufacturers/${id}`,
      data,
    )) as unknown as ApiResponse<Manufacturer>;
    return response.data;
  },

  getCategories: async (includeInactive = false): Promise<ProductCategory[]> => {
    const response = (await apiClient.get('/master-data/categories', {
      params: { includeInactive },
    })) as unknown as ApiResponse<ProductCategory[]>;
    return response.data;
  },

  createCategory: async (data: CreateCategoryDto): Promise<ProductCategory> => {
    const response = (await apiClient.post(
      '/master-data/categories',
      data,
    )) as unknown as ApiResponse<ProductCategory>;
    return response.data;
  },

  updateCategory: async (
    id: string,
    data: UpdateCategoryDto,
  ): Promise<ProductCategory> => {
    const response = (await apiClient.patch(
      `/master-data/categories/${id}`,
      data,
    )) as unknown as ApiResponse<ProductCategory>;
    return response.data;
  },

  getUnits: async (includeInactive = false): Promise<UnitOfMeasurement[]> => {
    const response = (await apiClient.get('/master-data/units', {
      params: { includeInactive },
    })) as unknown as ApiResponse<UnitOfMeasurement[]>;
    return response.data;
  },

  createUnit: async (data: CreateUnitDto): Promise<UnitOfMeasurement> => {
    const response = (await apiClient.post(
      '/master-data/units',
      data,
    )) as unknown as ApiResponse<UnitOfMeasurement>;
    return response.data;
  },

  updateUnit: async (
    id: string,
    data: UpdateUnitDto,
  ): Promise<UnitOfMeasurement> => {
    const response = (await apiClient.patch(
      `/master-data/units/${id}`,
      data,
    )) as unknown as ApiResponse<UnitOfMeasurement>;
    return response.data;
  },
};
