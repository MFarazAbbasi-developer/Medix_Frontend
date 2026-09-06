import { apiClient } from './client';

export type SchemeType =
  | 'BUY_X_GET_Y_FREE'
  | 'BUY_X_GET_DISCOUNT'
  | 'FLAT_DISCOUNT_PERCENT'
  | 'FLAT_PRICE_OVERRIDE';

import { CustomerType } from './customers.api';
export type { CustomerType };

export interface CustomerPricingRule {
  id: string;
  organizationId: string;
  customerId: string;
  productId: string;
  customPrice: number | string | null;
  discountPercentage: number | string | null;
  minQuantity: number;
  startDate: string | null;
  endDate: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    code: string;
    name: string;
    customerType?: CustomerType;
  };
  product?: {
    id: string;
    sku: string;
    name: string;
    genericName?: string;
    taxPercentage?: number | string;
  };
}

export interface PromotionalScheme {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  description: string | null;
  schemeType: SchemeType;
  productId: string;
  minQuantity: number;
  bonusQuantity: number;
  bonusProductId: string | null;
  discountPercentage: number | string | null;
  overridePrice: number | string | null;
  customerId: string | null;
  customerType: CustomerType | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  product?: {
    id: string;
    sku: string;
    name: string;
    genericName?: string;
  };
  bonusProduct?: {
    id: string;
    sku: string;
    name: string;
  } | null;
  customer?: {
    id: string;
    code: string;
    name: string;
    customerType?: CustomerType;
  } | null;
}

export interface CreatePricingRulePayload {
  customerId: string;
  productId: string;
  customPrice?: number;
  discountPercentage?: number;
  minQuantity?: number;
  startDate?: string;
  endDate?: string;
  notes?: string;
  isActive?: boolean;
}

export interface UpdatePricingRulePayload {
  customPrice?: number | null;
  discountPercentage?: number | null;
  minQuantity?: number;
  startDate?: string | null;
  endDate?: string | null;
  notes?: string | null;
  isActive?: boolean;
}

export interface CreateSchemePayload {
  name: string;
  code: string;
  description?: string;
  schemeType: SchemeType;
  productId: string;
  minQuantity?: number;
  bonusQuantity?: number;
  bonusProductId?: string;
  discountPercentage?: number;
  overridePrice?: number;
  customerId?: string;
  customerType?: CustomerType;
  startDate: string;
  endDate: string;
  isActive?: boolean;
}

export interface UpdateSchemePayload {
  name?: string;
  code?: string;
  description?: string;
  schemeType?: SchemeType;
  productId?: string;
  minQuantity?: number;
  bonusQuantity?: number;
  bonusProductId?: string;
  discountPercentage?: number;
  overridePrice?: number;
  customerId?: string;
  customerType?: CustomerType;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

export interface PricingSimulationPayload {
  customerId: string;
  productId: string;
  batchId?: string;
  quantity: number;
  manualUnitPrice?: number;
  manualDiscountPercentage?: number;
}

export interface PricingSimulationResponse {
  customer: {
    id: string;
    code: string;
    name: string;
    customerType: CustomerType;
    defaultDiscountPercentage: number;
    isTaxExempt: boolean;
  };
  product: {
    id: string;
    sku: string;
    name: string;
    genericName?: string;
    taxPercentage: number;
  };
  availableBatches: Array<{
    id: string;
    batchNumber: string;
    expiryDate: string;
    tradePrice: number;
    retailPrice: number;
    purchaseCost: number;
  }>;
  applicableSchemes: Array<{
    id: string;
    name: string;
    code: string;
    schemeType: SchemeType;
    minQuantity: number;
    bonusQuantity: number;
    discountPercentage?: number | null;
    overridePrice?: number | null;
  }>;
  resolution: {
    productId: string;
    batchId?: string | null;
    billedQuantity: number;
    bonusQuantity: number;
    bonusProductId?: string | null;
    totalQuantity: number;
    tradePrice: number;
    retailPrice: number;
    unitCost: number;
    baseUnitPrice: number;
    customPrice?: number | null;
    discountPercentage: number;
    discountAmount: number;
    effectiveUnitPrice: number;
    grossTotal: number;
    netLineTotal: number;
    taxPercentage: number;
    taxAmount: number;
    finalTotalWithTax: number;
    pricingSource: string;
    pricingRuleId?: string | null;
    schemeId?: string | null;
    schemeName?: string | null;
    reason: string;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const pricingApi = {
  // Pricing Rules
  getRules: async (params?: {
    search?: string;
    customerId?: string;
    productId?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<CustomerPricingRule>> => {
    const res = await apiClient.get<PaginatedResponse<CustomerPricingRule>>('/pricing/rules', {
      params,
    });
    return res.data;
  },

  getRuleById: async (id: string): Promise<CustomerPricingRule> => {
    const res = await apiClient.get<CustomerPricingRule>(`/pricing/rules/${id}`);
    return res.data;
  },

  createRule: async (payload: CreatePricingRulePayload): Promise<CustomerPricingRule> => {
    const res = await apiClient.post<CustomerPricingRule>('/pricing/rules', payload);
    return res.data;
  },

  updateRule: async (
    id: string,
    payload: UpdatePricingRulePayload,
  ): Promise<CustomerPricingRule> => {
    const res = await apiClient.put<CustomerPricingRule>(`/pricing/rules/${id}`, payload);
    return res.data;
  },

  deleteRule: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.delete<{ success: boolean; message: string }>(
      `/pricing/rules/${id}`,
    );
    return res.data;
  },

  // Promotional Schemes
  getSchemes: async (params?: {
    search?: string;
    schemeType?: SchemeType;
    productId?: string;
    customerId?: string;
    customerType?: CustomerType;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<PromotionalScheme>> => {
    const res = await apiClient.get<PaginatedResponse<PromotionalScheme>>('/pricing/schemes', {
      params,
    });
    return res.data;
  },

  getSchemeById: async (id: string): Promise<PromotionalScheme> => {
    const res = await apiClient.get<PromotionalScheme>(`/pricing/schemes/${id}`);
    return res.data;
  },

  createScheme: async (payload: CreateSchemePayload): Promise<PromotionalScheme> => {
    const res = await apiClient.post<PromotionalScheme>('/pricing/schemes', payload);
    return res.data;
  },

  updateScheme: async (
    id: string,
    payload: UpdateSchemePayload,
  ): Promise<PromotionalScheme> => {
    const res = await apiClient.put<PromotionalScheme>(`/pricing/schemes/${id}`, payload);
    return res.data;
  },

  deleteScheme: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.delete<{ success: boolean; message: string }>(
      `/pricing/schemes/${id}`,
    );
    return res.data;
  },

  // Pricing Simulator / Preview
  previewPricing: async (
    payload: PricingSimulationPayload,
  ): Promise<PricingSimulationResponse> => {
    const res = await apiClient.post<PricingSimulationResponse>(
      '/pricing/preview',
      payload,
    );
    return res.data;
  },
};
