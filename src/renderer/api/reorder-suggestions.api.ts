import { apiClient } from './client';

export type SuggestionHealthStatus = 'ALL' | 'REORDER_NEEDED' | 'WATCH' | 'HEALTHY' | 'OVERSTOCK';

export interface ProductSuggestionItem {
  productId: string;
  sku: string;
  name: string;
  genericName: string;
  dosageForm: string | null;
  strength: string | null;
  packSize: string | null;
  unitSymbol: string | null;
  categoryName: string | null;
  manufacturerName: string | null;
  isActive: boolean;

  // Live Stock Position (Base Inventory Units)
  physicalStock: number;
  saleableStock: number;
  shortExpiryStock: number;
  quarantinedStock: number;
  expiredStock: number;
  openPoQuantity: number;
  netPosition: number;

  // Sales Velocity & Demand
  lookbackDays: number;
  totalUnitsSold: number;
  averageDailySales: number;

  // Thresholds & Lead Times
  leadTimeDays: number;
  leadTimeDemand: number;
  safetyStockUnits: number;
  reorderPoint: number;
  reorderPointSource: 'CONFIGURED' | 'CALCULATED';
  targetStock: number;
  targetStockSource: 'CONFIGURED' | 'CALCULATED';
  minOrderQuantity: number;
  reorderQuantity: number | null;

  // Status & Recommendations
  healthStatus: SuggestionHealthStatus;
  isOverstocked: boolean;
  suggestedQuantity: number;
  estimatedUnitCost: number;
  estimatedPurchaseValue: number; // Informational only

  // Resolved Supplier
  supplier: {
    id: string;
    name: string;
    code: string;
    source: 'CONFIGURED' | 'LAST_PURCHASE' | 'UNASSIGNED';
  } | null;

  // Configuration metadata
  hasCustomConfig: boolean;
  configId: string | null;
}

export interface SuggestionsSummary {
  totalSkusAnalyzed: number;
  reorderNeededCount: number;
  watchCount: number;
  healthyCount: number;
  overstockCount: number;
  totalOpenPoUnits: number;
  totalEstimatedPurchaseValue: number;
  lookbackDays: number;
  excludeShortExpiry: boolean;
  shortExpiryDays: number;
  asOfDate: string;
}

export interface QuerySuggestionsParams {
  branchId?: string;
  warehouseId?: string;
  supplierId?: string;
  categoryId?: string;
  manufacturerId?: string;
  status?: SuggestionHealthStatus;
  lookbackDays?: number;
  excludeShortExpiry?: boolean;
  shortExpiryDays?: number;
  search?: string;
  page?: number;
  limit?: number;
}

export interface SuggestionsResponse {
  summary: SuggestionsSummary;
  items: ProductSuggestionItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UpsertReplenishmentConfigPayload {
  reorderPoint?: number | null;
  targetStock?: number | null;
  minOrderQuantity?: number;
  reorderQuantity?: number | null;
  leadTimeDays?: number | null;
  preferredSupplierId?: string | null;
  isActive?: boolean;
}

export interface SuggestionPoItemPayload {
  productId: string;
  supplierId?: string;
  quantity: number;
  unitCost?: number;
  remarks?: string;
}

export interface CreateDraftPosPayload {
  branchId: string;
  items: SuggestionPoItemPayload[];
  notes?: string;
}

export interface CreateDraftPosResponse {
  message: string;
  orders: {
    id: string;
    poNumber: string;
    supplier: { id: string; name: string; code: string };
    netTotal: string | number;
    items: any[];
  }[];
}

export const reorderSuggestionsApi = {
  getSuggestions: async (params?: QuerySuggestionsParams): Promise<SuggestionsResponse> => {
    const res = await apiClient.get<SuggestionsResponse>('/api/v1/purchasing/suggestions', { params });
    return res.data;
  },

  getSummary: async (branchId?: string): Promise<SuggestionsSummary> => {
    const res = await apiClient.get<SuggestionsSummary>('/api/v1/purchasing/suggestions/summary', {
      params: { branchId },
    });
    return res.data;
  },

  upsertConfig: async (
    productId: string,
    data: UpsertReplenishmentConfigPayload,
    branchId?: string,
  ): Promise<any> => {
    const res = await apiClient.put(
      `/api/v1/purchasing/suggestions/config/${productId}`,
      data,
      { params: { branchId } },
    );
    return res.data;
  },

  createDraftPos: async (payload: CreateDraftPosPayload): Promise<CreateDraftPosResponse> => {
    const res = await apiClient.post<CreateDraftPosResponse>(
      '/api/v1/purchasing/suggestions/create-po-draft',
      payload,
    );
    return res.data;
  },
};
