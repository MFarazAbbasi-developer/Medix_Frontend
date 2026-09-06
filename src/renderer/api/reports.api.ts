import { apiClient, ApiResponse } from './client';

export interface QueryReportParams {
  startDate?: string;
  endDate?: string;
  branchId?: string;
  warehouseId?: string;
  customerId?: string;
  supplierId?: string;
  productId?: string;
  manufacturerId?: string;
  batchId?: string;
  paymentMethod?: string;
  search?: string;
  format?: 'json' | 'csv';
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SalesSummaryReport {
  invoiceCount: number;
  totalQuantity: number;
  grossSales: number;
  discountAmount: number;
  taxAmount: number;
  netSales: number;
  paidAmount: number;
  outstandingAmount: number;
  totalCogs: number;
  grossProfit: number;
  marginPercentage: number;
}

export interface SalesRegisterItem {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  customerCode: string;
  customerName: string;
  warehouseName: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  netTotal: number;
  paidAmount: number;
  balanceDue: number;
  paymentStatus: string;
  itemCount: number;
  totalUnits: number;
  totalCogs: number;
  grossProfit: number;
  marginPercentage: number;
}

export interface ProductWiseSalesItem {
  productId: string;
  sku: string;
  name: string;
  genericName: string;
  manufacturerName: string | null;
  unitSymbol: string | null;
  billedQuantity: number;
  bonusQuantity: number;
  totalQuantity: number;
  grossAmount: number;
  discountAmount: number;
  taxAmount: number;
  netSales: number;
  historicalCost: number;
  grossProfit: number;
  marginPercentage: number;
}

export interface CustomerWiseSalesItem {
  customerId: string;
  customerCode: string;
  customerName: string;
  customerType: string;
  invoiceCount: number;
  grossSales: number;
  discountAmount: number;
  taxAmount: number;
  netSales: number;
  paidAmount: number;
  outstandingAmount: number;
  historicalCost: number;
  grossProfit: number;
  marginPercentage: number;
}

export interface SalesReturnReportItem {
  id: string;
  returnNumber: string;
  returnDate: string;
  customerCode: string;
  customerName: string;
  reason: string;
  refundMode: string;
  refundAmount: number;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  netTotal: number;
  itemCount: number;
  totalQuantity: number;
}

export interface CollectionReportItem {
  id: string;
  paymentNumber: string;
  paymentDate: string;
  customerCode: string;
  customerName: string;
  paymentMethod: string;
  amount: number;
  allocatedAmount: number;
  unallocatedAmount: number;
  referenceNumber: string;
  bankName: string;
}

export interface PurchaseSummaryReport {
  grnCount: number;
  totalBilledQuantity: number;
  totalBonusQuantity: number;
  totalUnits: number;
  grossPurchases: number;
  discountAmount: number;
  taxAmount: number;
  netPurchases: number;
  paidAmount: number;
  outstandingAmount: number;
}

export interface PurchaseRegisterItem {
  id: string;
  grnNumber: string;
  supplierInvoiceNumber: string;
  receivedDate: string;
  supplierCode: string;
  supplierName: string;
  warehouseName: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  netTotal: number;
  paidAmount: number;
  balanceDue: number;
  paymentStatus: string;
  billedQuantity: number;
  bonusQuantity: number;
  totalUnits: number;
  itemCount: number;
}

export interface SupplierWisePurchaseItem {
  supplierId: string;
  supplierCode: string;
  supplierName: string;
  grnCount: number;
  billedQuantity: number;
  bonusQuantity: number;
  totalUnits: number;
  grossPurchases: number;
  discountAmount: number;
  taxAmount: number;
  netPurchases: number;
  paidAmount: number;
  outstandingAmount: number;
}

export interface StockValuationSummary {
  batchCount: number;
  totalQuantity: number;
  standardQuantity: number;
  quarantineQuantity: number;
  purchaseValuation: number;
  retailValuation: number;
}

export interface StockValuationItem {
  batchId: string;
  batchNumber: string;
  mfgDate: string | null;
  expiryDate: string;
  isExpired: boolean;
  daysToExpiry: number;
  status: string;
  productSku: string;
  productName: string;
  genericName: string;
  manufacturerName: string | null;
  unitSymbol: string | null;
  standardQuantity: number;
  quarantineQuantity: number;
  totalQuantity: number;
  unitCost: number;
  retailPrice: number;
  purchaseValuation: number;
  retailValuation: number;
}

export interface StockLedgerReportItem {
  id: string;
  movementDate: string;
  warehouseName: string;
  warehouseType: string;
  productSku: string;
  productName: string;
  batchNumber: string;
  expiryDate: string;
  movementType: string;
  quantity: number;
  unitCost: number;
  referenceType: string;
  referenceId: string;
  notes: string;
  performedBy: string;
}

export interface CustomerAgingSummary {
  grandTotalDue: number;
  grandCurrent: number;
  grand1to30: number;
  grand31to60: number;
  grand61to90: number;
  grand90Plus: number;
}

export interface CustomerAgingItem {
  customerId: string;
  customerCode: string;
  customerName: string;
  customerType: string;
  creditDays: number;
  creditLimit: number;
  currentBalance: number;
  current: number;
  days1to30: number;
  days31to60: number;
  days61to90: number;
  days90Plus: number;
}

export interface CustomerStatementReport {
  customer: {
    id: string;
    code: string;
    name: string;
    currentBalance: number;
  };
  openingBalance: number;
  closingBalance: number;
  data: Array<{
    id: string;
    transactionDate: string;
    entryType: string;
    referenceNumber: string;
    notes: string;
    debit: number;
    credit: number;
    runningBalance: number;
  }>;
}

export interface SupplierAgingSummary {
  grandTotalPayable: number;
  grandCurrent: number;
  grand1to30: number;
  grand31to60: number;
  grand61to90: number;
  grand90Plus: number;
}

export interface SupplierAgingItem {
  supplierId: string;
  supplierCode: string;
  supplierName: string;
  creditDays: number;
  creditLimit: number;
  currentBalance: number;
  current: number;
  days1to30: number;
  days31to60: number;
  days61to90: number;
  days90Plus: number;
}

export interface SupplierStatementReport {
  supplier: {
    id: string;
    code: string;
    name: string;
    currentBalance: number;
  };
  openingBalance: number;
  closingBalance: number;
  data: Array<{
    id: string;
    transactionDate: string;
    entryType: string;
    referenceNumber: string;
    notes: string;
    credit: number;
    debit: number;
    runningBalance: number;
  }>;
}

export interface ProfitabilitySummaryReport {
  invoiceCount: number;
  netRevenue: number;
  totalCogs: number;
  grossProfit: number;
  marginPercentage: number;
  totalDiscount: number;
  totalTax: number;
}

export interface DashboardMetricsReport {
  today: {
    salesNet: number;
    purchasesNet: number;
    collections: number;
    grossProfit: number;
    invoiceCount: number;
    grnCount: number;
  };
  monthToDate: {
    salesNet: number;
    grossProfit: number;
    marginPercentage: number;
  };
  outstanding: {
    receivables: number;
    payables: number;
  };
  inventory: {
    quarantinedUnits: number;
    inTransitUnits: number;
    expiredBatches: number;
    soonExpiringBatches: number;
  };
}

export const reportsApi = {
  // Sales
  getSalesSummary: async (params?: QueryReportParams): Promise<SalesSummaryReport> => {
    const res = (await apiClient.get('/reports/sales/summary', { params })) as unknown as ApiResponse<SalesSummaryReport>;
    return res.data;
  },

  getSalesRegister: async (
    params?: QueryReportParams,
  ): Promise<{ data: SalesRegisterItem[]; totalCount: number } | { csv: string }> => {
    const res = (await apiClient.get('/reports/sales/register', { params })) as unknown as ApiResponse<{ data: SalesRegisterItem[]; totalCount: number } | { csv: string }>;
    return res.data;
  },

  getProductWiseSales: async (
    params?: QueryReportParams,
  ): Promise<{ data: ProductWiseSalesItem[]; totalCount: number } | { csv: string }> => {
    const res = (await apiClient.get('/reports/sales/product-wise', { params })) as unknown as ApiResponse<{ data: ProductWiseSalesItem[]; totalCount: number } | { csv: string }>;
    return res.data;
  },

  getCustomerWiseSales: async (
    params?: QueryReportParams,
  ): Promise<{ data: CustomerWiseSalesItem[]; totalCount: number } | { csv: string }> => {
    const res = (await apiClient.get('/reports/sales/customer-wise', { params })) as unknown as ApiResponse<{ data: CustomerWiseSalesItem[]; totalCount: number } | { csv: string }>;
    return res.data;
  },

  getSalesReturnsReport: async (
    params?: QueryReportParams,
  ): Promise<{ data: SalesReturnReportItem[]; totalCount: number } | { csv: string }> => {
    const res = (await apiClient.get('/reports/sales/returns', { params })) as unknown as ApiResponse<{ data: SalesReturnReportItem[]; totalCount: number } | { csv: string }>;
    return res.data;
  },

  getCollectionsReport: async (
    params?: QueryReportParams,
  ): Promise<{ data: CollectionReportItem[]; totalCount: number } | { csv: string }> => {
    const res = (await apiClient.get('/reports/sales/collections', { params })) as unknown as ApiResponse<{ data: CollectionReportItem[]; totalCount: number } | { csv: string }>;
    return res.data;
  },

  // Purchases
  getPurchaseSummary: async (params?: QueryReportParams): Promise<PurchaseSummaryReport> => {
    const res = (await apiClient.get('/reports/purchases/summary', { params })) as unknown as ApiResponse<PurchaseSummaryReport>;
    return res.data;
  },

  getPurchaseRegister: async (
    params?: QueryReportParams,
  ): Promise<{ data: PurchaseRegisterItem[]; totalCount: number } | { csv: string }> => {
    const res = (await apiClient.get('/reports/purchases/register', { params })) as unknown as ApiResponse<{ data: PurchaseRegisterItem[]; totalCount: number } | { csv: string }>;
    return res.data;
  },

  getSupplierWisePurchases: async (
    params?: QueryReportParams,
  ): Promise<{ data: SupplierWisePurchaseItem[]; totalCount: number } | { csv: string }> => {
    const res = (await apiClient.get('/reports/purchases/supplier-wise', { params })) as unknown as ApiResponse<{ data: SupplierWisePurchaseItem[]; totalCount: number } | { csv: string }>;
    return res.data;
  },

  // Inventory
  getStockValuationReport: async (
    params?: QueryReportParams,
  ): Promise<{ summary: StockValuationSummary; data: StockValuationItem[] } | { csv: string }> => {
    const res = (await apiClient.get('/reports/inventory/valuation', { params })) as unknown as ApiResponse<{ summary: StockValuationSummary; data: StockValuationItem[] } | { csv: string }>;
    return res.data;
  },

  getStockLedgerReport: async (
    params?: QueryReportParams,
  ): Promise<{ data: StockLedgerReportItem[]; totalCount: number } | { csv: string }> => {
    const res = (await apiClient.get('/reports/inventory/ledger', { params })) as unknown as ApiResponse<{ data: StockLedgerReportItem[]; totalCount: number } | { csv: string }>;
    return res.data;
  },

  // Receivables & Payables
  getCustomerAgingReport: async (
    params?: QueryReportParams,
  ): Promise<{ summary: CustomerAgingSummary; data: CustomerAgingItem[] } | { csv: string }> => {
    const res = (await apiClient.get('/reports/customers/aging', { params })) as unknown as ApiResponse<{ summary: CustomerAgingSummary; data: CustomerAgingItem[] } | { csv: string }>;
    return res.data;
  },

  getCustomerStatement: async (
    customerId: string,
    params?: { startDate?: string; endDate?: string; branchId?: string; format?: 'json' | 'csv' },
  ): Promise<CustomerStatementReport | { csv: string }> => {
    const res = (await apiClient.get(`/reports/customers/${customerId}/statement`, { params })) as unknown as ApiResponse<CustomerStatementReport | { csv: string }>;
    return res.data;
  },

  getSupplierAgingReport: async (
    params?: QueryReportParams,
  ): Promise<{ summary: SupplierAgingSummary; data: SupplierAgingItem[] } | { csv: string }> => {
    const res = (await apiClient.get('/reports/suppliers/aging', { params })) as unknown as ApiResponse<{ summary: SupplierAgingSummary; data: SupplierAgingItem[] } | { csv: string }>;
    return res.data;
  },

  getSupplierStatement: async (
    supplierId: string,
    params?: { startDate?: string; endDate?: string; branchId?: string; format?: 'json' | 'csv' },
  ): Promise<SupplierStatementReport | { csv: string }> => {
    const res = (await apiClient.get(`/reports/suppliers/${supplierId}/statement`, { params })) as unknown as ApiResponse<SupplierStatementReport | { csv: string }>;
    return res.data;
  },

  // Profitability
  getProfitabilitySummary: async (params?: QueryReportParams): Promise<ProfitabilitySummaryReport> => {
    const res = (await apiClient.get('/reports/profitability/summary', { params })) as unknown as ApiResponse<ProfitabilitySummaryReport>;
    return res.data;
  },

  // Dashboard Metrics
  getDashboardMetrics: async (branchId?: string): Promise<DashboardMetricsReport> => {
    const res = (await apiClient.get('/reports/dashboard/metrics', { params: { branchId } })) as unknown as ApiResponse<DashboardMetricsReport>;
    return res.data;
  },
};
