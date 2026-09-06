import { apiClient, ApiResponse } from './client';

export interface AuditLogItem {
  id: string;
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
  user?: {
    id: string;
    username: string;
    displayName: string;
  } | null;
}

export interface QueryAuditLogParams {
  entity?: string;
  entityId?: string;
  userId?: string;
  action?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedAuditResponse {
  items: AuditLogItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const auditApi = {
  getLogs: async (
    params?: QueryAuditLogParams,
  ): Promise<PaginatedAuditResponse> => {
    const response = (await apiClient.get('/audit/logs', {
      params,
    })) as unknown as ApiResponse<PaginatedAuditResponse>;
    return response.data;
  },
};
