import { apiClient, ApiResponse } from './client';

export interface Branch {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  address?: string | null;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  isHeadOffice: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  legalName?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country: string;
  postalCode?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  ntn?: string | null;
  strn?: string | null;
  drugSaleLicenseNo?: string | null;
  logoUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  branches?: Branch[];
}

export interface UpdateOrganizationDto {
  name?: string;
  legalName?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string;
  postalCode?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  ntn?: string | null;
  strn?: string | null;
  drugSaleLicenseNo?: string | null;
  logoUrl?: string | null;
}

export interface CreateBranchDto {
  name: string;
  code: string;
  address?: string | null;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  isHeadOffice?: boolean;
  isActive?: boolean;
}

export interface UpdateBranchDto {
  name?: string;
  code?: string;
  address?: string | null;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  isHeadOffice?: boolean;
  isActive?: boolean;
}

export const organizationApi = {
  getOrganization: async (): Promise<Organization> => {
    const response = (await apiClient.get('/organization')) as unknown as ApiResponse<Organization>;
    return response.data;
  },

  updateOrganization: async (
    data: UpdateOrganizationDto,
  ): Promise<Organization> => {
    const response = (await apiClient.patch('/organization', data)) as unknown as ApiResponse<Organization>;
    return response.data;
  },

  getBranches: async (): Promise<Branch[]> => {
    const response = (await apiClient.get('/organization/branches')) as unknown as ApiResponse<Branch[]>;
    return response.data;
  },

  getBranchById: async (id: string): Promise<Branch> => {
    const response = (await apiClient.get(`/organization/branches/${id}`)) as unknown as ApiResponse<Branch>;
    return response.data;
  },

  createBranch: async (data: CreateBranchDto): Promise<Branch> => {
    const response = (await apiClient.post('/organization/branches', data)) as unknown as ApiResponse<Branch>;
    return response.data;
  },

  updateBranch: async (
    id: string,
    data: UpdateBranchDto,
  ): Promise<Branch> => {
    const response = (await apiClient.patch(`/organization/branches/${id}`, data)) as unknown as ApiResponse<Branch>;
    return response.data;
  },

  deleteBranch: async (
    id: string,
  ): Promise<{ success: boolean; message: string }> => {
    const response = (await apiClient.delete(`/organization/branches/${id}`)) as unknown as ApiResponse<{
      success: boolean;
      message: string;
    }>;
    return response.data;
  },
};
