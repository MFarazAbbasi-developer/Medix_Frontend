import { apiClient, ApiResponse } from './client';

export interface SalesRoute {
  id: string;
  organizationId: string;
  branchId?: string | null;
  code: string;
  name: string;
  city?: string | null;
  area?: string | null;
  notes?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  branch?: { id: string; name: string; code: string } | null;
  assignedSalesmen?: {
    id: string;
    code: string;
    name: string;
    phone?: string | null;
    email?: string | null;
    isActive: boolean;
  }[];
  customerCount?: number;
  invoiceCount?: number;
}

export interface Salesman {
  id: string;
  organizationId: string;
  branchId?: string | null;
  code: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  branch?: { id: string; name: string; code: string } | null;
  assignedRoutes?: {
    id: string;
    code: string;
    name: string;
    city?: string | null;
    area?: string | null;
    isActive: boolean;
  }[];
  customerCount?: number;
  invoiceCount?: number;
}

export interface CreateSalesmanPayload {
  code: string;
  name: string;
  phone?: string;
  email?: string;
  branchId?: string;
  routeIds?: string[];
  notes?: string;
  isActive?: boolean;
}

export interface UpdateSalesmanPayload {
  code?: string;
  name?: string;
  phone?: string;
  email?: string;
  branchId?: string;
  routeIds?: string[];
  notes?: string;
  isActive?: boolean;
}

export interface QuerySalesmanParams {
  search?: string;
  branchId?: string;
  routeId?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedSalesmenResponse {
  items: Salesman[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateSalesRoutePayload {
  code: string;
  name: string;
  city?: string;
  area?: string;
  branchId?: string;
  salesmanIds?: string[];
  notes?: string;
  isActive?: boolean;
}

export interface UpdateSalesRoutePayload {
  code?: string;
  name?: string;
  city?: string;
  area?: string;
  branchId?: string;
  salesmanIds?: string[];
  notes?: string;
  isActive?: boolean;
}

export interface QuerySalesRouteParams {
  search?: string;
  city?: string;
  area?: string;
  branchId?: string;
  salesmanId?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedSalesRoutesResponse {
  items: SalesRoute[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const salesOperationsApi = {
  // Salesmen APIs
  getSalesmen: async (params?: QuerySalesmanParams): Promise<PaginatedSalesmenResponse> => {
    const response = (await apiClient.get('/sales-operations/salesmen', {
      params,
    })) as unknown as ApiResponse<PaginatedSalesmenResponse>;
    return response.data;
  },

  getSalesmanById: async (id: string): Promise<Salesman> => {
    const response = (await apiClient.get(
      `/sales-operations/salesmen/${id}`,
    )) as unknown as ApiResponse<Salesman>;
    return response.data;
  },

  createSalesman: async (payload: CreateSalesmanPayload): Promise<Salesman> => {
    const response = (await apiClient.post(
      '/sales-operations/salesmen',
      payload,
    )) as unknown as ApiResponse<Salesman>;
    return response.data;
  },

  updateSalesman: async (id: string, payload: UpdateSalesmanPayload): Promise<Salesman> => {
    const response = (await apiClient.put(
      `/sales-operations/salesmen/${id}`,
      payload,
    )) as unknown as ApiResponse<Salesman>;
    return response.data;
  },

  deleteSalesman: async (
    id: string,
  ): Promise<{ success: boolean; message: string; deactivated?: boolean }> => {
    const response = (await apiClient.delete(
      `/sales-operations/salesmen/${id}`,
    )) as unknown as ApiResponse<{ success: boolean; message: string; deactivated?: boolean }>;
    return response.data;
  },

  // Sales Routes APIs
  getSalesRoutes: async (params?: QuerySalesRouteParams): Promise<PaginatedSalesRoutesResponse> => {
    const response = (await apiClient.get('/sales-operations/routes', {
      params,
    })) as unknown as ApiResponse<PaginatedSalesRoutesResponse>;
    return response.data;
  },

  getRoutes: async (params?: QuerySalesRouteParams): Promise<PaginatedSalesRoutesResponse> => {
    const response = (await apiClient.get('/sales-operations/routes', {
      params,
    })) as unknown as ApiResponse<PaginatedSalesRoutesResponse>;
    return response.data;
  },

  getSalesRouteById: async (id: string): Promise<SalesRoute> => {
    const response = (await apiClient.get(
      `/sales-operations/routes/${id}`,
    )) as unknown as ApiResponse<SalesRoute>;
    return response.data;
  },

  getRouteById: async (id: string): Promise<SalesRoute> => {
    const response = (await apiClient.get(
      `/sales-operations/routes/${id}`,
    )) as unknown as ApiResponse<SalesRoute>;
    return response.data;
  },

  createSalesRoute: async (payload: CreateSalesRoutePayload): Promise<SalesRoute> => {
    const response = (await apiClient.post(
      '/sales-operations/routes',
      payload,
    )) as unknown as ApiResponse<SalesRoute>;
    return response.data;
  },

  createRoute: async (payload: CreateSalesRoutePayload): Promise<SalesRoute> => {
    const response = (await apiClient.post(
      '/sales-operations/routes',
      payload,
    )) as unknown as ApiResponse<SalesRoute>;
    return response.data;
  },

  updateSalesRoute: async (id: string, payload: UpdateSalesRoutePayload): Promise<SalesRoute> => {
    const response = (await apiClient.put(
      `/sales-operations/routes/${id}`,
      payload,
    )) as unknown as ApiResponse<SalesRoute>;
    return response.data;
  },

  updateRoute: async (id: string, payload: UpdateSalesRoutePayload): Promise<SalesRoute> => {
    const response = (await apiClient.put(
      `/sales-operations/routes/${id}`,
      payload,
    )) as unknown as ApiResponse<SalesRoute>;
    return response.data;
  },

  deleteSalesRoute: async (
    id: string,
  ): Promise<{ success: boolean; message: string; deactivated?: boolean }> => {
    const response = (await apiClient.delete(
      `/sales-operations/routes/${id}`,
    )) as unknown as ApiResponse<{ success: boolean; message: string; deactivated?: boolean }>;
    return response.data;
  },

  deleteRoute: async (
    id: string,
  ): Promise<{ success: boolean; message: string; deactivated?: boolean }> => {
    const response = (await apiClient.delete(
      `/sales-operations/routes/${id}`,
    )) as unknown as ApiResponse<{ success: boolean; message: string; deactivated?: boolean }>;
    return response.data;
  },
};
