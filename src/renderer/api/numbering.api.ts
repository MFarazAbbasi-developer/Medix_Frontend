import { apiClient, ApiResponse } from './client';

export type DocumentType =
  | 'SALES_INVOICE'
  | 'PURCHASE_INVOICE'
  | 'SALES_RETURN'
  | 'PURCHASE_RETURN'
  | 'PAYMENT_RECEIPT'
  | 'GOODS_RECEIVE_NOTE'
  | 'STOCK_ADJUSTMENT';

export interface NumberingSeries {
  id: string;
  organizationId: string;
  branchId?: string | null;
  documentType: DocumentType;
  prefix: string;
  suffix?: string | null;
  nextNumber: number;
  padding: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  branch?: {
    id: string;
    name: string;
    code: string;
  } | null;
}

export interface UpdateNumberingSeriesDto {
  prefix?: string;
  suffix?: string | null;
  nextNumber?: number;
  padding?: number;
  isActive?: boolean;
}

export interface NumberPreviewResult {
  documentNumber: string;
  seriesId: string;
  sequence: number;
}

export const numberingApi = {
  getSeriesList: async (branchId?: string): Promise<NumberingSeries[]> => {
    const config = branchId ? { params: { branchId } } : undefined;
    const response = (await apiClient.get(
      '/numbering-series',
      config,
    )) as unknown as ApiResponse<NumberingSeries[]>;
    return response.data;
  },

  updateSeries: async (
    id: string,
    data: UpdateNumberingSeriesDto,
  ): Promise<NumberingSeries> => {
    const response = (await apiClient.patch(
      `/numbering-series/${id}`,
      data,
    )) as unknown as ApiResponse<NumberingSeries>;
    return response.data;
  },

  previewNextNumber: async (
    documentType: DocumentType,
    branchId?: string,
  ): Promise<NumberPreviewResult> => {
    const response = (await apiClient.post(
      '/numbering-series/preview',
      {
        documentType,
        branchId,
      },
    )) as unknown as ApiResponse<NumberPreviewResult>;
    return response.data;
  },
};
