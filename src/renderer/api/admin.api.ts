import { apiClient, ApiResponse } from './client';

export interface AdminRoleSummary {
  id: string;
  name: string;
  description?: string | null;
}

export interface AdminUser {
  id: string;
  username: string;
  displayName: string;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
  roles: AdminRoleSummary[];
  permissions?: string[];
}

export interface QueryUserParams {
  page?: number;
  limit?: number;
  search?: string;
  roleId?: string;
  isActive?: boolean;
}

export interface PaginatedUsersResponse {
  items: AdminUser[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateUserData {
  username: string;
  password: string;
  displayName: string;
  roleIds?: string[];
}

export interface UpdateUserData {
  displayName?: string;
  roleIds?: string[];
}

export interface AdminRole {
  id: string;
  name: string;
  description?: string | null;
  isSystem: boolean;
  usersCount: number;
  permissionsCount?: number;
  permissions: { id: string; code: string; description: string }[] | string[];
}

export interface PermissionGroup {
  module: string;
  permissions: {
    code: string;
    description: string;
  }[];
}

export interface PermissionsMatrixResponse {
  groups: PermissionGroup[];
  roles: {
    id: string;
    name: string;
    description?: string | null;
    isSystem: boolean;
    usersCount: number;
    permissionsCount: number;
    permissions: string[];
  }[];
}

export interface CreateRoleData {
  name: string;
  description?: string;
  permissionCodes: string[];
}

export interface UpdateRoleData {
  name?: string;
  description?: string;
  permissionCodes?: string[];
}

export interface BackupRecord {
  id: string;
  filename: string;
  filePath: string;
  sizeBytes: number;
  createdAt: string;
  createdBy: string;
  status: 'SUCCESS' | 'FAILED' | 'RESTORED' | 'IMPORTED';
  notes?: string;
  errorReason?: string;
  checksum?: string;
}

export interface ListBackupsResponse {
  backupDirectory: string;
  items: BackupRecord[];
  total: number;
}

export interface BackupValidationResult {
  filename: string;
  filePath: string;
  sizeBytes: number;
  checksum: string;
  isValid: boolean;
  lastModified: string;
}

export interface RestoreBackupResult {
  success: boolean;
  message: string;
  restoredFile: string;
  safetyBackup: string;
  restoredAt: string;
}

export interface ExportDatasetParams {
  dataset:
    | 'products'
    | 'batches'
    | 'customers'
    | 'suppliers'
    | 'sales_invoices'
    | 'purchases'
    | 'payments'
    | 'returns'
    | 'stock'
    | 'stock_movements';
  startDate?: string;
  endDate?: string;
  branchId?: string;
  warehouseId?: string;
}

export interface SystemInfoResponse {
  application: {
    name: string;
    version: string;
    environment: string;
    nodeVersion: string;
    platform: string;
    arch: string;
  };
  server: {
    uptimeSeconds: number;
    serverTime: string;
    memoryUsageMb: {
      heapUsed: number;
      heapTotal: number;
      rss: number;
    };
  };
  database: {
    status: string;
    engine: string;
    stats: {
      usersCount: number;
      rolesCount: number;
      productsCount: number;
      batchesCount: number;
      customersCount: number;
      suppliersCount: number;
      invoicesCount: number;
      auditLogsCount: number;
    };
  };
  deployment: {
    organization: {
      id: string;
      name: string;
      legalName?: string | null;
      drugLicense?: string | null;
      ntn?: string | null;
      strn?: string | null;
    } | null;
    branches: {
      id: string;
      name: string;
      code: string;
      isHeadOffice: boolean;
      isActive: boolean;
    }[];
  };
}

export const adminApi = {
  // Users
  listUsers: async (params?: QueryUserParams): Promise<PaginatedUsersResponse> => {
    const response = (await apiClient.get('/admin/users', {
      params,
    })) as unknown as ApiResponse<PaginatedUsersResponse>;
    return response.data;
  },

  getUserById: async (id: string): Promise<AdminUser> => {
    const response = (await apiClient.get(
      `/admin/users/${id}`,
    )) as unknown as ApiResponse<AdminUser>;
    return response.data;
  },

  createUser: async (data: CreateUserData): Promise<AdminUser> => {
    const response = (await apiClient.post(
      '/admin/users',
      data,
    )) as unknown as ApiResponse<AdminUser>;
    return response.data;
  },

  updateUser: async (id: string, data: UpdateUserData): Promise<AdminUser> => {
    const response = (await apiClient.put(
      `/admin/users/${id}`,
      data,
    )) as unknown as ApiResponse<AdminUser>;
    return response.data;
  },

  setUserStatus: async (id: string, isActive: boolean): Promise<AdminUser> => {
    const response = (await apiClient.patch(`/admin/users/${id}/status`, {
      isActive,
    })) as unknown as ApiResponse<AdminUser>;
    return response.data;
  },

  resetPassword: async (
    id: string,
    newPassword: string,
  ): Promise<{ message: string }> => {
    const response = (await apiClient.post(
      `/admin/users/${id}/reset-password`,
      { newPassword },
    )) as unknown as ApiResponse<{ message: string }>;
    return response.data;
  },

  // Roles & Permissions
  listRoles: async (): Promise<
    {
      id: string;
      name: string;
      description?: string | null;
      isSystem: boolean;
      usersCount: number;
      permissionsCount: number;
      permissions: string[];
    }[]
  > => {
    const response = (await apiClient.get(
      '/admin/roles',
    )) as unknown as ApiResponse<
      {
        id: string;
        name: string;
        description?: string | null;
        isSystem: boolean;
        usersCount: number;
        permissionsCount: number;
        permissions: string[];
      }[]
    >;
    return response.data;
  },

  getPermissionsMatrix: async (): Promise<PermissionsMatrixResponse> => {
    const response = (await apiClient.get(
      '/admin/roles/matrix',
    )) as unknown as ApiResponse<PermissionsMatrixResponse>;
    return response.data;
  },

  getRoleById: async (id: string): Promise<AdminRole> => {
    const response = (await apiClient.get(
      `/admin/roles/${id}`,
    )) as unknown as ApiResponse<AdminRole>;
    return response.data;
  },

  createRole: async (data: CreateRoleData): Promise<AdminRole> => {
    const response = (await apiClient.post(
      '/admin/roles',
      data,
    )) as unknown as ApiResponse<AdminRole>;
    return response.data;
  },

  updateRole: async (id: string, data: UpdateRoleData): Promise<AdminRole> => {
    const response = (await apiClient.put(
      `/admin/roles/${id}`,
      data,
    )) as unknown as ApiResponse<AdminRole>;
    return response.data;
  },

  deleteRole: async (id: string): Promise<{ message: string }> => {
    const response = (await apiClient.delete(
      `/admin/roles/${id}`,
    )) as unknown as ApiResponse<{ message: string }>;
    return response.data;
  },

  // Database Backup & Restore
  listBackups: async (): Promise<ListBackupsResponse> => {
    const response = (await apiClient.get(
      '/admin/backup',
    )) as unknown as ApiResponse<ListBackupsResponse>;
    return response.data;
  },

  validateBackup: async (filename: string): Promise<BackupValidationResult> => {
    const response = (await apiClient.get(
      `/admin/backup/validate/${encodeURIComponent(filename)}`,
    )) as unknown as ApiResponse<BackupValidationResult>;
    return response.data;
  },

  createBackup: async (data?: {
    targetDirectory?: string;
    label?: string;
  }): Promise<BackupRecord> => {
    const response = (await apiClient.post(
      '/admin/backup/create',
      data || {},
    )) as unknown as ApiResponse<BackupRecord>;
    return response.data;
  },

  restoreBackup: async (
    filename: string,
    confirmationToken: string,
  ): Promise<RestoreBackupResult> => {
    const response = (await apiClient.post('/admin/backup/restore', {
      filename,
      confirmationToken,
    })) as unknown as ApiResponse<RestoreBackupResult>;
    return response.data;
  },

  // Data Export
  exportDataset: async (params: ExportDatasetParams): Promise<string> => {
    const response = await apiClient.post('/admin/export/csv', params, {
      responseType: 'text',
    });
    return response.data as unknown as string;
  },

  // System Information
  getSystemInfo: async (): Promise<SystemInfoResponse> => {
    const response = (await apiClient.get(
      '/admin/system-info',
    )) as unknown as ApiResponse<SystemInfoResponse>;
    return response.data;
  },
};
