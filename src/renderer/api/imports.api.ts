import { apiClient, ApiResponse } from './client';

export type ImportType =
  | 'PRODUCTS'
  | 'CUSTOMERS'
  | 'SUPPLIERS'
  | 'OPENING_STOCK'
  | 'CUSTOMER_OPENING_BALANCES'
  | 'SUPPLIER_OPENING_BALANCES';

export type ImportJobStatus =
  | 'UPLOADED'
  | 'VALIDATING'
  | 'READY'
  | 'IMPORTING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export interface ImportRowError {
  row: number;
  field: string;
  code: string;
  message: string;
  value?: unknown;
}

export interface ImportRowWarning {
  row: number;
  field: string;
  code: string;
  message: string;
  value?: unknown;
}

export interface ImportPreviewData {
  id?: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: ImportRowError[];
  warnings: ImportRowWarning[];
  summary: Record<string, unknown>;
  previewRows: Array<Record<string, unknown> & { _row: number; _valid: boolean; _errors?: string[] }>;
}

export interface ImportJob {
  id: string;
  type: ImportType;
  status: ImportJobStatus;
  originalFilename: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  importedRows: number;
  failedRows: number;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  createdByUser?: {
    id: string;
    username: string;
    displayName: string;
  } | null;
  branch?: {
    id: string;
    code: string;
    name: string;
  } | null;
}

export interface UploadImportResponse {
  job: ImportJob;
  preview: ImportPreviewData;
}

export interface QueryImportParams {
  type?: ImportType;
  status?: ImportJobStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedImportJobs {
  items: ImportJob[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const importsApi = {
  /**
   * Uploads file and returns parsing preview + job metadata.
   */
  async upload(file: File, type: ImportType, branchId?: string): Promise<UploadImportResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    if (branchId) {
      formData.append('branchId', branchId);
    }

    const response = await apiClient.post<ApiResponse<UploadImportResponse>>(
      '/imports/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );
    return response.data as unknown as UploadImportResponse;
  },

  /**
   * Lists past import jobs with pagination and filters.
   */
  async findAll(params?: QueryImportParams): Promise<PaginatedImportJobs> {
    const response = await apiClient.get<ApiResponse<PaginatedImportJobs>>('/imports', {
      params,
    });
    return response.data as unknown as PaginatedImportJobs;
  },

  /**
   * Retrieves single import job details.
   */
  async findOne(id: string): Promise<ImportJob> {
    const response = await apiClient.get<ApiResponse<ImportJob>>(`/imports/${id}`);
    return response.data as unknown as ImportJob;
  },

  /**
   * Retrieves preview for an import job.
   */
  async getPreview(id: string): Promise<ImportPreviewData & { id: string; type: ImportType; status: ImportJobStatus; originalFilename: string }> {
    const response = await apiClient.get<ApiResponse<ImportPreviewData & { id: string; type: ImportType; status: ImportJobStatus; originalFilename: string }>>(
      `/imports/${id}/preview`,
    );
    return response.data as unknown as (ImportPreviewData & { id: string; type: ImportType; status: ImportJobStatus; originalFilename: string });
  },

  /**
   * Confirms and executes an import job.
   */
  async confirm(id: string): Promise<ImportJob> {
    const response = await apiClient.post<ApiResponse<ImportJob>>(`/imports/${id}/confirm`);
    return response.data as unknown as ImportJob;
  },

  /**
   * Cancels an import job before completion.
   */
  async cancel(id: string): Promise<ImportJob> {
    const response = await apiClient.post<ApiResponse<ImportJob>>(`/imports/${id}/cancel`);
    return response.data as unknown as ImportJob;
  },

  /**
   * Downloads template CSV for an import type.
   */
  async downloadTemplate(type: ImportType): Promise<Blob> {
    const response = await apiClient.get(`/imports/templates/${type}`, {
      responseType: 'blob',
    });
    return response as unknown as Blob;
  },

  /**
   * Downloads error report CSV for a failed or validated job.
   */
  async downloadErrorsCsv(id: string): Promise<Blob> {
    const response = await apiClient.get(`/imports/${id}/errors/csv`, {
      responseType: 'blob',
    });
    return response as unknown as Blob;
  },
};
