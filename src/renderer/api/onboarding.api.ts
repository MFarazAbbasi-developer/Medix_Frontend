import { apiClient, ApiResponse } from './client';

export interface OnboardingStepStatus {
  completed: boolean;
  [key: string]: unknown;
}

export interface OnboardingStatusResult {
  isInitialized: boolean;
  appVersion: string;
  systemName: string;
  overallProgress: number; // 0 to 100
  steps: {
    businessProfile: {
      completed: boolean;
      organizationId?: string;
      name?: string;
      legalName?: string | null;
      city?: string | null;
      ntn?: string | null;
      drugSaleLicenseNo?: string | null;
    };
    branchAndWarehouse: {
      completed: boolean;
      branchCount: number;
      warehouseCount: number;
      hasHeadOffice: boolean;
      hasQuarantineWarehouse: boolean;
    };
    users: {
      completed: boolean;
      userCount: number;
      adminConfigured: boolean;
    };
    masterData: {
      completed: boolean;
      productsCount: number;
      customersCount: number;
      suppliersCount: number;
      categoriesCount: number;
      manufacturersCount: number;
      unitsCount: number;
    };
    openingBalances: {
      completed: boolean;
      customerBalancesCount: number;
      totalReceivable: number;
      supplierBalancesCount: number;
      totalPayable: number;
    };
    openingStock: {
      completed: boolean;
      batchesCount: number;
      stockMovementsCount: number;
      totalUnitsInStock: number;
      totalStockValuation: number;
    };
    systemReadiness: {
      completed: boolean;
      settingsCount: number;
      numberingSeriesCount: number;
    };
  };
  summary: {
    totalSteps: number;
    completedSteps: number;
    canComplete: boolean;
  };
}

export const onboardingApi = {
  /**
   * Retrieves live setup and initialization status.
   */
  async getStatus(): Promise<OnboardingStatusResult> {
    const response = await apiClient.get<ApiResponse<OnboardingStatusResult>>('/onboarding/status');
    return response.data as unknown as OnboardingStatusResult;
  },

  /**
   * Completes system initialization and marks onboarding as finished.
   */
  async complete(): Promise<OnboardingStatusResult> {
    const response = await apiClient.post<ApiResponse<OnboardingStatusResult>>('/onboarding/complete');
    return response.data as unknown as OnboardingStatusResult;
  },

  /**
   * Reopens onboarding mode.
   */
  async reset(): Promise<OnboardingStatusResult> {
    const response = await apiClient.post<ApiResponse<OnboardingStatusResult>>('/onboarding/reset');
    return response.data as unknown as OnboardingStatusResult;
  },
};
