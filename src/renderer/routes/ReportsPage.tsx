import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Receipt,
  ShoppingCart,
  Layers,
  Users,
  DollarSign,
  Download,
  Printer,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import {
  reportsApi,
  warehousesApi,
  Warehouse,
  customersApi,
  Customer,
  suppliersApi,
  Supplier,
  productsApi,
  Product,
  masterDataApi,
  Manufacturer,
  SalesSummaryReport,
  SalesRegisterItem,
  ProductWiseSalesItem,
  CustomerWiseSalesItem,
  SalesReturnReportItem,
  CollectionReportItem,
  PurchaseSummaryReport,
  PurchaseRegisterItem,
  SupplierWisePurchaseItem,
  StockValuationSummary,
  StockValuationItem,
  StockLedgerReportItem,
  CustomerAgingSummary,
  CustomerAgingItem,
  CustomerStatementReport,
  SupplierAgingSummary,
  SupplierAgingItem,
  SupplierStatementReport,
  ProfitabilitySummaryReport,
  DashboardMetricsReport,
} from '../api';
import { clsx } from 'clsx';

type ReportCategory = 'sales' | 'purchases' | 'inventory' | 'receivables_payables' | 'profitability' | 'dashboard';

type SalesSubReport = 'summary' | 'register' | 'product_sales' | 'customer_sales' | 'returns' | 'collections';
type PurchaseSubReport = 'summary' | 'register' | 'supplier_purchases';
type InventorySubReport = 'valuation' | 'ledger';
type RecPaySubReport = 'customer_aging' | 'customer_statement' | 'supplier_aging' | 'supplier_statement';

export const ReportsPage: React.FC = () => {
  // Main Category & Sub-Report State
  const [activeCategory, setActiveCategory] = useState<ReportCategory>('sales');
  const [salesSubReport, setSalesSubReport] = useState<SalesSubReport>('summary');
  const [purchaseSubReport, setPurchaseSubReport] = useState<PurchaseSubReport>('summary');
  const [inventorySubReport, setInventorySubReport] = useState<InventorySubReport>('valuation');
  const [recPaySubReport, setRecPaySubReport] = useState<RecPaySubReport>('customer_aging');

  // Filters State
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(1); // 1st of current month
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [warehouseId, setWarehouseId] = useState<string>('ALL');
  const [customerId, setCustomerId] = useState<string>('ALL');
  const [supplierId, setSupplierId] = useState<string>('ALL');
  const [productId, setProductId] = useState<string>('ALL');
  const [manufacturerId, setManufacturerId] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Master Data State
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);

  // Loading & Notification State
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Report Data States
  const [dashboardData, setDashboardData] = useState<DashboardMetricsReport | null>(null);
  const [salesSummary, setSalesSummary] = useState<SalesSummaryReport | null>(null);
  const [salesRegister, setSalesRegister] = useState<SalesRegisterItem[]>([]);
  const [productSales, setProductSales] = useState<ProductWiseSalesItem[]>([]);
  const [customerSales, setCustomerSales] = useState<CustomerWiseSalesItem[]>([]);
  const [salesReturns, setSalesReturns] = useState<SalesReturnReportItem[]>([]);
  const [collections, setCollections] = useState<CollectionReportItem[]>([]);

  const [purchaseSummary, setPurchaseSummary] = useState<PurchaseSummaryReport | null>(null);
  const [purchaseRegister, setPurchaseRegister] = useState<PurchaseRegisterItem[]>([]);
  const [supplierPurchases, setSupplierPurchases] = useState<SupplierWisePurchaseItem[]>([]);

  const [stockValuationSummary, setStockValuationSummary] = useState<StockValuationSummary | null>(null);
  const [stockValuationItems, setStockValuationItems] = useState<StockValuationItem[]>([]);
  const [stockLedger, setStockLedger] = useState<StockLedgerReportItem[]>([]);

  const [customerAgingSummary, setCustomerAgingSummary] = useState<CustomerAgingSummary | null>(null);
  const [customerAgingItems, setCustomerAgingItems] = useState<CustomerAgingItem[]>([]);
  const [customerStatement, setCustomerStatement] = useState<CustomerStatementReport | null>(null);

  const [supplierAgingSummary, setSupplierAgingSummary] = useState<SupplierAgingSummary | null>(null);
  const [supplierAgingItems, setSupplierAgingItems] = useState<SupplierAgingItem[]>([]);
  const [supplierStatement, setSupplierStatement] = useState<SupplierStatementReport | null>(null);

  const [profitabilitySummary, setProfitabilitySummary] = useState<ProfitabilitySummaryReport | null>(null);

  // Load Master Data
  useEffect(() => {
    const loadMaster = async () => {
      try {
        const [whList, custRes, suppRes, prodRes, mfgList] = await Promise.all([
          warehousesApi.getWarehouses(),
          customersApi.getCustomers({ limit: 500 }),
          suppliersApi.getSuppliers({ limit: 500 }),
          productsApi.getProducts({ limit: 500 }),
          masterDataApi.getManufacturers(),
        ]);
        setWarehouses(whList || []);
        setCustomers(custRes?.items || []);
        setSuppliers(suppRes?.items || []);
        setProducts(prodRes?.items || []);
        setManufacturers(mfgList || []);
      } catch (err: any) {
        console.error('Failed to load master filters:', err);
      }
    };
    loadMaster();
  }, []);

  // Filter params generator
  const getFilterParams = useCallback(() => {
    const p: any = {};
    if (startDate) p.startDate = startDate;
    if (endDate) p.endDate = endDate;
    if (warehouseId !== 'ALL') p.warehouseId = warehouseId;
    if (customerId !== 'ALL') p.customerId = customerId;
    if (supplierId !== 'ALL') p.supplierId = supplierId;
    if (productId !== 'ALL') p.productId = productId;
    if (manufacturerId !== 'ALL') p.manufacturerId = manufacturerId;
    if (searchTerm.trim()) p.search = searchTerm.trim();
    return p;
  }, [startDate, endDate, warehouseId, customerId, supplierId, productId, manufacturerId, searchTerm]);

  // Load current report
  const loadReportData = useCallback(async () => {
    setLoading(true);
    const params = getFilterParams();

    try {
      if (activeCategory === 'dashboard') {
        const data = await reportsApi.getDashboardMetrics();
        setDashboardData(data);
      } else if (activeCategory === 'sales') {
        if (salesSubReport === 'summary') {
          const res = await reportsApi.getSalesSummary(params);
          setSalesSummary(res);
        } else if (salesSubReport === 'register') {
          const res = await reportsApi.getSalesRegister(params);
          if ('data' in res) setSalesRegister(res.data);
        } else if (salesSubReport === 'product_sales') {
          const res = await reportsApi.getProductWiseSales(params);
          if ('data' in res) setProductSales(res.data);
        } else if (salesSubReport === 'customer_sales') {
          const res = await reportsApi.getCustomerWiseSales(params);
          if ('data' in res) setCustomerSales(res.data);
        } else if (salesSubReport === 'returns') {
          const res = await reportsApi.getSalesReturnsReport(params);
          if ('data' in res) setSalesReturns(res.data);
        } else if (salesSubReport === 'collections') {
          const res = await reportsApi.getCollectionsReport(params);
          if ('data' in res) setCollections(res.data);
        }
      } else if (activeCategory === 'purchases') {
        if (purchaseSubReport === 'summary') {
          const res = await reportsApi.getPurchaseSummary(params);
          setPurchaseSummary(res);
        } else if (purchaseSubReport === 'register') {
          const res = await reportsApi.getPurchaseRegister(params);
          if ('data' in res) setPurchaseRegister(res.data);
        } else if (purchaseSubReport === 'supplier_purchases') {
          const res = await reportsApi.getSupplierWisePurchases(params);
          if ('data' in res) setSupplierPurchases(res.data);
        }
      } else if (activeCategory === 'inventory') {
        if (inventorySubReport === 'valuation') {
          const res = await reportsApi.getStockValuationReport(params);
          if ('summary' in res) {
            setStockValuationSummary(res.summary);
            setStockValuationItems(res.data);
          }
        } else if (inventorySubReport === 'ledger') {
          const res = await reportsApi.getStockLedgerReport(params);
          if ('data' in res) setStockLedger(res.data);
        }
      } else if (activeCategory === 'receivables_payables') {
        if (recPaySubReport === 'customer_aging') {
          const res = await reportsApi.getCustomerAgingReport(params);
          if ('summary' in res) {
            setCustomerAgingSummary(res.summary);
            setCustomerAgingItems(res.data);
          }
        } else if (recPaySubReport === 'customer_statement') {
          if (customerId !== 'ALL') {
            const res = await reportsApi.getCustomerStatement(customerId, {
              startDate: params.startDate,
              endDate: params.endDate,
            });
            if ('customer' in res) setCustomerStatement(res);
          } else if (customers.length > 0) {
            const defaultCustId = customers[0].id;
            setCustomerId(defaultCustId);
            const res = await reportsApi.getCustomerStatement(defaultCustId, {
              startDate: params.startDate,
              endDate: params.endDate,
            });
            if ('customer' in res) setCustomerStatement(res);
          }
        } else if (recPaySubReport === 'supplier_aging') {
          const res = await reportsApi.getSupplierAgingReport(params);
          if ('summary' in res) {
            setSupplierAgingSummary(res.summary);
            setSupplierAgingItems(res.data);
          }
        } else if (recPaySubReport === 'supplier_statement') {
          if (supplierId !== 'ALL') {
            const res = await reportsApi.getSupplierStatement(supplierId, {
              startDate: params.startDate,
              endDate: params.endDate,
            });
            if ('supplier' in res) setSupplierStatement(res);
          } else if (suppliers.length > 0) {
            const defaultSuppId = suppliers[0].id;
            setSupplierId(defaultSuppId);
            const res = await reportsApi.getSupplierStatement(defaultSuppId, {
              startDate: params.startDate,
              endDate: params.endDate,
            });
            if ('supplier' in res) setSupplierStatement(res);
          }
        }
      } else if (activeCategory === 'profitability') {
        const res = await reportsApi.getProfitabilitySummary(params);
        setProfitabilitySummary(res);
      }
    } catch (err: any) {
      console.error('Error fetching report:', err);
      showNotification('error', err?.response?.data?.message || 'Failed to fetch report data');
    } finally {
      setLoading(false);
    }
  }, [
    activeCategory,
    salesSubReport,
    purchaseSubReport,
    inventorySubReport,
    recPaySubReport,
    customerId,
    supplierId,
    customers,
    suppliers,
    getFilterParams,
  ]);

  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

  // Preset Date Range Handlers
  const handlePresetDate = (type: 'today' | 'month' | 'last30' | 'year' | 'clear') => {
    const now = new Date();
    if (type === 'today') {
      const todayStr = now.toISOString().split('T')[0];
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (type === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    } else if (type === 'last30') {
      const start = new Date(now.getTime() - 30 * 86400000);
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    } else if (type === 'year') {
      const start = new Date(now.getFullYear(), 0, 1);
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    } else if (type === 'clear') {
      setStartDate('');
      setEndDate('');
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    const d = new Date();
    d.setDate(1);
    setStartDate(d.toISOString().split('T')[0]);
    setEndDate(new Date().toISOString().split('T')[0]);
    setWarehouseId('ALL');
    setCustomerId('ALL');
    setSupplierId('ALL');
    setProductId('ALL');
    setManufacturerId('ALL');
    setSearchTerm('');
  };

  // Export CSV Handler
  const handleExportCsv = async () => {
    try {
      const params = { ...getFilterParams(), format: 'csv' as const };
      let csvContent = '';

      if (activeCategory === 'sales') {
        if (salesSubReport === 'register') {
          const res = await reportsApi.getSalesRegister(params);
          if ('csv' in res) csvContent = res.csv;
        } else if (salesSubReport === 'product_sales') {
          const res = await reportsApi.getProductWiseSales(params);
          if ('csv' in res) csvContent = res.csv;
        } else if (salesSubReport === 'customer_sales') {
          const res = await reportsApi.getCustomerWiseSales(params);
          if ('csv' in res) csvContent = res.csv;
        } else if (salesSubReport === 'returns') {
          const res = await reportsApi.getSalesReturnsReport(params);
          if ('csv' in res) csvContent = res.csv;
        } else if (salesSubReport === 'collections') {
          const res = await reportsApi.getCollectionsReport(params);
          if ('csv' in res) csvContent = res.csv;
        }
      } else if (activeCategory === 'purchases') {
        if (purchaseSubReport === 'register') {
          const res = await reportsApi.getPurchaseRegister(params);
          if ('csv' in res) csvContent = res.csv;
        } else if (purchaseSubReport === 'supplier_purchases') {
          const res = await reportsApi.getSupplierWisePurchases(params);
          if ('csv' in res) csvContent = res.csv;
        }
      } else if (activeCategory === 'inventory') {
        if (inventorySubReport === 'valuation') {
          const res = await reportsApi.getStockValuationReport(params);
          if ('csv' in res) csvContent = res.csv;
        } else if (inventorySubReport === 'ledger') {
          const res = await reportsApi.getStockLedgerReport(params);
          if ('csv' in res) csvContent = res.csv;
        }
      } else if (activeCategory === 'receivables_payables') {
        if (recPaySubReport === 'customer_aging') {
          const res = await reportsApi.getCustomerAgingReport(params);
          if ('csv' in res) csvContent = res.csv;
        } else if (recPaySubReport === 'customer_statement' && customerId !== 'ALL') {
          const res = await reportsApi.getCustomerStatement(customerId, { ...params, format: 'csv' });
          if ('csv' in res) csvContent = res.csv;
        } else if (recPaySubReport === 'supplier_aging') {
          const res = await reportsApi.getSupplierAgingReport(params);
          if ('csv' in res) csvContent = res.csv;
        } else if (recPaySubReport === 'supplier_statement' && supplierId !== 'ALL') {
          const res = await reportsApi.getSupplierStatement(supplierId, { ...params, format: 'csv' });
          if ('csv' in res) csvContent = res.csv;
        }
      }

      if (csvContent) {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Medix_${activeCategory}_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showNotification('success', 'CSV export generated successfully');
      } else {
        showNotification('error', 'CSV export not supported for this view or no data found');
      }
    } catch (err: any) {
      console.error('CSV Export error:', err);
      showNotification('error', 'Failed to generate CSV export');
    }
  };

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  // Report Title string
  const currentReportTitle = useMemo(() => {
    if (activeCategory === 'dashboard') return 'Operational Dashboard & Analytics';
    if (activeCategory === 'sales') {
      if (salesSubReport === 'summary') return 'Sales Performance Summary';
      if (salesSubReport === 'register') return 'Sales Invoice Register';
      if (salesSubReport === 'product_sales') return 'Product-Wise Sales & Margin Report';
      if (salesSubReport === 'customer_sales') return 'Customer-Wise Sales Analysis';
      if (salesSubReport === 'returns') return 'Sales Return Register';
      if (salesSubReport === 'collections') return 'Customer Collections & Payment Receipts';
    }
    if (activeCategory === 'purchases') {
      if (purchaseSubReport === 'summary') return 'Purchase Performance Summary';
      if (purchaseSubReport === 'register') return 'Goods Receive Note (GRN) Register';
      if (purchaseSubReport === 'supplier_purchases') return 'Supplier-Wise Purchase Analysis';
    }
    if (activeCategory === 'inventory') {
      if (inventorySubReport === 'valuation') return 'Stock Valuation & Physical Inventory';
      if (inventorySubReport === 'ledger') return 'Stock Movement Ledger (Audit Trail)';
    }
    if (activeCategory === 'receivables_payables') {
      if (recPaySubReport === 'customer_aging') return 'Customer Accounts Receivable Aging Analysis';
      if (recPaySubReport === 'customer_statement') return 'Customer Statement of Account';
      if (recPaySubReport === 'supplier_aging') return 'Supplier Accounts Payable Aging Analysis';
      if (recPaySubReport === 'supplier_statement') return 'Supplier Statement of Account';
    }
    if (activeCategory === 'profitability') return 'Gross Profit & Commercial Margin Report';
    return 'Operational Report';
  }, [activeCategory, salesSubReport, purchaseSubReport, inventorySubReport, recPaySubReport]);

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {notification && (
        <div
          className={clsx(
            'fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-lg border text-sm font-medium transition-all animate-in fade-in slide-in-from-bottom-5',
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800',
          )}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          ) : (
            <XCircle className="h-5 w-5 text-rose-600" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Printable Header (Visible only in @media print) */}
      <div className="hidden print:block mb-6 border-b pb-4">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">MEDIX BY FARMAX - OPERATIONAL REPORT</h1>
        <div className="flex justify-between items-center text-xs text-gray-600 mt-1">
          <p className="font-semibold text-gray-800">{currentReportTitle}</p>
          <p>Generated: {new Date().toLocaleString()}</p>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          <span>Date Scope: {startDate || 'Earliest'} to {endDate || 'Latest'}</span>
          {warehouseId !== 'ALL' && <span className="ml-4">Warehouse Filter: Active</span>}
        </div>
      </div>

      {/* Workspace Header & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-card p-4 rounded-xl border border-surface-border print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-brand-50 rounded-lg text-brand-700">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-charcoal-900 leading-tight">
                Reports & Operational Analytics
              </h1>
              <p className="text-xs text-charcoal-500">
                Pharmaceutical audit trails, sub-ledger aging, valuation & margin intelligence
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface-muted text-charcoal-700 hover:bg-surface-border transition-colors border border-surface-border shadow-sm"
          >
            <Download className="h-3.5 w-3.5 text-charcoal-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface-muted text-charcoal-700 hover:bg-surface-border transition-colors border border-surface-border shadow-sm"
          >
            <Printer className="h-3.5 w-3.5 text-charcoal-500" />
            <span>Print A4</span>
          </button>
          <button
            onClick={loadReportData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={clsx('h-3.5 w-3.5', loading && 'animate-spin')} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Category Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-surface-border pb-2 overflow-x-auto print:hidden">
        {[
          { id: 'sales', label: 'Sales Reports', icon: Receipt },
          { id: 'purchases', label: 'Purchase Reports', icon: ShoppingCart },
          { id: 'inventory', label: 'Inventory & Stock', icon: Layers },
          { id: 'receivables_payables', label: 'Receivables / Payables', icon: Users },
          { id: 'profitability', label: 'Profitability & Margins', icon: TrendingUp },
          { id: 'dashboard', label: 'Operational KPIs', icon: BarChart3 },
        ].map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as ReportCategory)}
              className={clsx(
                'flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all',
                isActive
                  ? 'bg-brand-50 text-brand-700 border border-brand-200/80 shadow-sm'
                  : 'text-charcoal-600 hover:bg-surface-card hover:text-charcoal-900 border border-transparent',
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Sub-Report Selector Tabs (Where Applicable) */}
      {activeCategory === 'sales' && (
        <div className="flex items-center gap-1 bg-surface-card p-1.5 rounded-lg border border-surface-border text-xs font-medium print:hidden">
          {[
            { id: 'summary', label: 'Summary' },
            { id: 'register', label: 'Invoice Register' },
            { id: 'product_sales', label: 'Product-Wise' },
            { id: 'customer_sales', label: 'Customer-Wise' },
            { id: 'returns', label: 'Sales Returns' },
            { id: 'collections', label: 'Collections' },
          ].map((sub) => (
            <button
              key={sub.id}
              onClick={() => setSalesSubReport(sub.id as SalesSubReport)}
              className={clsx(
                'px-3 py-1.5 rounded text-xs transition-colors',
                salesSubReport === sub.id
                  ? 'bg-brand-600 text-white font-semibold shadow-xs'
                  : 'text-charcoal-600 hover:text-charcoal-900 hover:bg-surface-muted',
              )}
            >
              {sub.label}
            </button>
          ))}
        </div>
      )}

      {activeCategory === 'purchases' && (
        <div className="flex items-center gap-1 bg-surface-card p-1.5 rounded-lg border border-surface-border text-xs font-medium print:hidden">
          {[
            { id: 'summary', label: 'Purchase Summary' },
            { id: 'register', label: 'GRN Register' },
            { id: 'supplier_purchases', label: 'Supplier-Wise' },
          ].map((sub) => (
            <button
              key={sub.id}
              onClick={() => setPurchaseSubReport(sub.id as PurchaseSubReport)}
              className={clsx(
                'px-3 py-1.5 rounded text-xs transition-colors',
                purchaseSubReport === sub.id
                  ? 'bg-brand-600 text-white font-semibold shadow-xs'
                  : 'text-charcoal-600 hover:text-charcoal-900 hover:bg-surface-muted',
              )}
            >
              {sub.label}
            </button>
          ))}
        </div>
      )}

      {activeCategory === 'inventory' && (
        <div className="flex items-center gap-1 bg-surface-card p-1.5 rounded-lg border border-surface-border text-xs font-medium print:hidden">
          {[
            { id: 'valuation', label: 'Stock Valuation' },
            { id: 'ledger', label: 'Movement Ledger' },
          ].map((sub) => (
            <button
              key={sub.id}
              onClick={() => setInventorySubReport(sub.id as InventorySubReport)}
              className={clsx(
                'px-3 py-1.5 rounded text-xs transition-colors',
                inventorySubReport === sub.id
                  ? 'bg-brand-600 text-white font-semibold shadow-xs'
                  : 'text-charcoal-600 hover:text-charcoal-900 hover:bg-surface-muted',
              )}
            >
              {sub.label}
            </button>
          ))}
        </div>
      )}

      {activeCategory === 'receivables_payables' && (
        <div className="flex items-center gap-1 bg-surface-card p-1.5 rounded-lg border border-surface-border text-xs font-medium print:hidden">
          {[
            { id: 'customer_aging', label: 'Customer Aging' },
            { id: 'customer_statement', label: 'Customer Statement' },
            { id: 'supplier_aging', label: 'Supplier Aging' },
            { id: 'supplier_statement', label: 'Supplier Statement' },
          ].map((sub) => (
            <button
              key={sub.id}
              onClick={() => setRecPaySubReport(sub.id as RecPaySubReport)}
              className={clsx(
                'px-3 py-1.5 rounded text-xs transition-colors',
                recPaySubReport === sub.id
                  ? 'bg-brand-600 text-white font-semibold shadow-xs'
                  : 'text-charcoal-600 hover:text-charcoal-900 hover:bg-surface-muted',
              )}
            >
              {sub.label}
            </button>
          ))}
        </div>
      )}

      {/* Global Filter Bar (Print-hidden) */}
      {activeCategory !== 'dashboard' && (
        <div className="bg-surface-card p-3 rounded-xl border border-surface-border space-y-3 print:hidden">
          <div className="flex flex-wrap items-center gap-3">
            {/* Date range pickers */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-charcoal-500 font-medium">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1 text-xs border border-surface-border rounded-lg bg-surface focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-charcoal-500 font-medium">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1 text-xs border border-surface-border rounded-lg bg-surface focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            {/* Quick date presets */}
            <div className="flex items-center gap-1 border-l border-surface-border pl-3">
              <button
                onClick={() => handlePresetDate('today')}
                className="px-2 py-0.5 text-[11px] rounded bg-surface-muted hover:bg-surface-border text-charcoal-600"
              >
                Today
              </button>
              <button
                onClick={() => handlePresetDate('month')}
                className="px-2 py-0.5 text-[11px] rounded bg-surface-muted hover:bg-surface-border text-charcoal-600"
              >
                MTD
              </button>
              <button
                onClick={() => handlePresetDate('last30')}
                className="px-2 py-0.5 text-[11px] rounded bg-surface-muted hover:bg-surface-border text-charcoal-600"
              >
                30 Days
              </button>
              <button
                onClick={() => handlePresetDate('year')}
                className="px-2 py-0.5 text-[11px] rounded bg-surface-muted hover:bg-surface-border text-charcoal-600"
              >
                YTD
              </button>
            </div>

            {/* Warehouse Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-charcoal-500 font-medium">Warehouse:</span>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="px-2 py-1 text-xs border border-surface-border rounded-lg bg-surface focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="ALL">All Warehouses</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.warehouseType})
                  </option>
                ))}
              </select>
            </div>

            {/* Customer Filter (for customer reports) */}
            {(activeCategory === 'sales' || recPaySubReport.includes('customer')) && (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-charcoal-500 font-medium">Customer:</span>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="px-2 py-1 text-xs border border-surface-border rounded-lg bg-surface focus:outline-none focus:ring-1 focus:ring-brand-500 max-w-[160px] truncate"
                >
                  <option value="ALL">All Customers</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Supplier Filter (for purchase reports) */}
            {(activeCategory === 'purchases' || recPaySubReport.includes('supplier')) && (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-charcoal-500 font-medium">Supplier:</span>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="px-2 py-1 text-xs border border-surface-border rounded-lg bg-surface focus:outline-none focus:ring-1 focus:ring-brand-500 max-w-[160px] truncate"
                >
                  <option value="ALL">All Suppliers</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Product Filter (for inventory / product sales) */}
            {(activeCategory === 'inventory' || salesSubReport === 'product_sales') && (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-charcoal-500 font-medium">Product:</span>
                <select
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="px-2 py-1 text-xs border border-surface-border rounded-lg bg-surface focus:outline-none focus:ring-1 focus:ring-brand-500 max-w-[160px] truncate"
                >
                  <option value="ALL">All Products</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Manufacturer Filter */}
            {(activeCategory === 'inventory' || salesSubReport === 'product_sales') && (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-charcoal-500 font-medium">Manufacturer:</span>
                <select
                  value={manufacturerId}
                  onChange={(e) => setManufacturerId(e.target.value)}
                  className="px-2 py-1 text-xs border border-surface-border rounded-lg bg-surface focus:outline-none focus:ring-1 focus:ring-brand-500 max-w-[160px] truncate"
                >
                  <option value="ALL">All Manufacturers</option>
                  {manufacturers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={loadReportData}
                className="px-3 py-1 text-xs font-semibold rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-colors shadow-xs"
              >
                Apply
              </button>
              <button
                onClick={handleResetFilters}
                className="px-2.5 py-1 text-xs text-charcoal-600 hover:text-charcoal-900 hover:bg-surface-muted rounded-lg transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REPORT CONTENT AREA */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 bg-surface-card rounded-xl border border-surface-border">
          <RefreshCw className="h-8 w-8 text-brand-600 animate-spin mb-3" />
          <p className="text-sm font-medium text-charcoal-700">Aggregating operational report data...</p>
          <p className="text-xs text-charcoal-400 mt-1">Extracting source-of-truth balances and immutable ledger entries</p>
        </div>
      ) : (
        <div>
          {/* ============================================================ */}
          {/* 1. OPERATIONAL DASHBOARD VIEW                                */}
          {/* ============================================================ */}
          {activeCategory === 'dashboard' && dashboardData && (
            <div className="space-y-6">
              {/* Top Row: Today's Metrics */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal-500 mb-3">
                  Today's Operational Activity
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-surface-card p-4 rounded-xl border border-surface-border shadow-xs">
                    <div className="flex items-center justify-between text-xs text-charcoal-500 mb-1">
                      <span>Today Net Sales</span>
                      <Receipt className="h-4 w-4 text-emerald-600" />
                    </div>
                    <p className="text-xl font-bold text-charcoal-900">
                      PKR {dashboardData.today.salesNet.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-charcoal-500 mt-2">
                      <span>{dashboardData.today.invoiceCount} Invoices</span>
                      <span>•</span>
                      <span className="text-emerald-600 font-medium">
                        GP: PKR {dashboardData.today.grossProfit.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="bg-surface-card p-4 rounded-xl border border-surface-border shadow-xs">
                    <div className="flex items-center justify-between text-xs text-charcoal-500 mb-1">
                      <span>Today Net Purchases</span>
                      <ShoppingCart className="h-4 w-4 text-blue-600" />
                    </div>
                    <p className="text-xl font-bold text-charcoal-900">
                      PKR {dashboardData.today.purchasesNet.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-charcoal-500 mt-2">{dashboardData.today.grnCount} GRNs Received</p>
                  </div>

                  <div className="bg-surface-card p-4 rounded-xl border border-surface-border shadow-xs">
                    <div className="flex items-center justify-between text-xs text-charcoal-500 mb-1">
                      <span>Today's Collections</span>
                      <DollarSign className="h-4 w-4 text-purple-600" />
                    </div>
                    <p className="text-xl font-bold text-purple-700">
                      PKR {dashboardData.today.collections.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-charcoal-500 mt-2">Receipts deposited today</p>
                  </div>

                  <div className="bg-surface-card p-4 rounded-xl border border-surface-border shadow-xs">
                    <div className="flex items-center justify-between text-xs text-charcoal-500 mb-1">
                      <span>MTD Revenue & Margin</span>
                      <TrendingUp className="h-4 w-4 text-indigo-600" />
                    </div>
                    <p className="text-xl font-bold text-charcoal-900">
                      PKR {dashboardData.monthToDate.salesNet.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-indigo-600 font-medium mt-2">
                      Margin: {dashboardData.monthToDate.marginPercentage}% (GP: PKR {dashboardData.monthToDate.grossProfit.toLocaleString()})
                    </p>
                  </div>
                </div>
              </div>

              {/* Second Row: Balances & Holds */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-surface-card p-4 rounded-xl border border-surface-border shadow-xs">
                  <span className="text-xs text-charcoal-500">Customer Receivables</span>
                  <p className="text-lg font-bold text-amber-600 mt-1">
                    PKR {dashboardData.outstanding.receivables.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-charcoal-400 mt-1">Total open customer balance</p>
                </div>

                <div className="bg-surface-card p-4 rounded-xl border border-surface-border shadow-xs">
                  <span className="text-xs text-charcoal-500">Supplier Payables</span>
                  <p className="text-lg font-bold text-rose-600 mt-1">
                    PKR {dashboardData.outstanding.payables.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-charcoal-400 mt-1">Total open vendor payables</p>
                </div>

                <div className="bg-surface-card p-4 rounded-xl border border-surface-border shadow-xs">
                  <span className="text-xs text-charcoal-500">Quarantine & In-Transit Units</span>
                  <p className="text-lg font-bold text-charcoal-800 mt-1">
                    {dashboardData.inventory.quarantinedUnits + dashboardData.inventory.inTransitUnits} Units
                  </p>
                  <p className="text-xs text-charcoal-400 mt-1">
                    {dashboardData.inventory.quarantinedUnits} Quarantine • {dashboardData.inventory.inTransitUnits} In-Transit
                  </p>
                </div>

                <div className="bg-surface-card p-4 rounded-xl border border-surface-border shadow-xs">
                  <span className="text-xs text-charcoal-500">Expiry Exposure</span>
                  <p className="text-lg font-bold text-rose-700 mt-1">
                    {dashboardData.inventory.expiredBatches} Expired
                  </p>
                  <p className="text-xs text-amber-600 font-medium mt-1">
                    {dashboardData.inventory.soonExpiringBatches} Batches expiring ≤ 90 days
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* 2. SALES REPORTS                                             */}
          {/* ============================================================ */}
          {activeCategory === 'sales' && (
            <div className="space-y-4">
              {/* Sales Summary Cards */}
              {salesSubReport === 'summary' && salesSummary && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-surface-card p-3.5 rounded-xl border border-surface-border">
                      <span className="text-xs text-charcoal-500">Gross Sales</span>
                      <p className="text-base font-bold text-charcoal-900 mt-1">
                        PKR {salesSummary.grossSales.toLocaleString()}
                      </p>
                      <p className="text-[11px] text-charcoal-400 mt-0.5">{salesSummary.invoiceCount} Posted Invoices</p>
                    </div>
                    <div className="bg-surface-card p-3.5 rounded-xl border border-surface-border">
                      <span className="text-xs text-charcoal-500">Discounts & Tax</span>
                      <p className="text-base font-bold text-charcoal-700 mt-1">
                        -PKR {salesSummary.discountAmount.toLocaleString()} / +PKR {salesSummary.taxAmount.toLocaleString()}
                      </p>
                      <p className="text-[11px] text-charcoal-400 mt-0.5">Line & bill deductions</p>
                    </div>
                    <div className="bg-surface-card p-3.5 rounded-xl border border-surface-border">
                      <span className="text-xs text-charcoal-500">Net Sales Revenue</span>
                      <p className="text-base font-bold text-brand-700 mt-1">
                        PKR {salesSummary.netSales.toLocaleString()}
                      </p>
                      <p className="text-[11px] text-emerald-600 font-medium mt-0.5">
                        Margin: {salesSummary.marginPercentage}%
                      </p>
                    </div>
                    <div className="bg-surface-card p-3.5 rounded-xl border border-surface-border">
                      <span className="text-xs text-charcoal-500">Gross Profit (Historical COGS)</span>
                      <p className="text-base font-bold text-emerald-700 mt-1">
                        PKR {salesSummary.grossProfit.toLocaleString()}
                      </p>
                      <p className="text-[11px] text-charcoal-400 mt-0.5">
                        COGS: PKR {salesSummary.totalCogs.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="bg-surface-card p-4 rounded-xl border border-surface-border flex flex-col sm:flex-row justify-between items-center text-xs text-charcoal-600 gap-2">
                    <div>
                      <span>Settlement Breakdown: </span>
                      <span className="font-semibold text-emerald-700">
                        Paid: PKR {salesSummary.paidAmount.toLocaleString()}
                      </span>
                      <span> • </span>
                      <span className="font-semibold text-amber-700">
                        Outstanding: PKR {salesSummary.outstandingAmount.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span>Physical Units Sold: </span>
                      <span className="font-semibold text-charcoal-900">{salesSummary.totalQuantity} Units</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Sales Register Table */}
              {salesSubReport === 'register' && (
                <div className="bg-surface-card rounded-xl border border-surface-border overflow-hidden">
                  <div className="overflow-x-auto max-h-[600px]">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-surface-muted text-charcoal-600 font-semibold sticky top-0 z-10 border-b border-surface-border">
                        <tr>
                          <th className="p-2.5">Invoice #</th>
                          <th className="p-2.5">Date</th>
                          <th className="p-2.5">Customer</th>
                          <th className="p-2.5">Warehouse</th>
                          <th className="p-2.5 text-right">Gross</th>
                          <th className="p-2.5 text-right">Discount</th>
                          <th className="p-2.5 text-right">Net Sales</th>
                          <th className="p-2.5 text-right">Paid</th>
                          <th className="p-2.5 text-right">Balance</th>
                          <th className="p-2.5 text-right">COGS</th>
                          <th className="p-2.5 text-right">GP</th>
                          <th className="p-2.5 text-right">Margin %</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-border text-charcoal-700">
                        {salesRegister.length === 0 ? (
                          <tr>
                            <td colSpan={12} className="text-center py-8 text-charcoal-400">
                              No sales invoice records found matching the filter criteria.
                            </td>
                          </tr>
                        ) : (
                          salesRegister.map((inv) => (
                            <tr key={inv.id} className="hover:bg-surface-muted/50 transition-colors">
                              <td className="p-2.5 font-semibold text-brand-700">{inv.invoiceNumber}</td>
                              <td className="p-2.5">{new Date(inv.invoiceDate).toLocaleDateString()}</td>
                              <td className="p-2.5 font-medium text-charcoal-900">{inv.customerName}</td>
                              <td className="p-2.5 text-charcoal-500">{inv.warehouseName}</td>
                              <td className="p-2.5 text-right">{inv.subtotal.toFixed(2)}</td>
                              <td className="p-2.5 text-right text-rose-600">{inv.discountAmount.toFixed(2)}</td>
                              <td className="p-2.5 text-right font-semibold text-charcoal-900">{inv.netTotal.toFixed(2)}</td>
                              <td className="p-2.5 text-right text-emerald-600">{inv.paidAmount.toFixed(2)}</td>
                              <td className="p-2.5 text-right font-medium text-amber-600">{inv.balanceDue.toFixed(2)}</td>
                              <td className="p-2.5 text-right text-charcoal-500">{inv.totalCogs.toFixed(2)}</td>
                              <td className="p-2.5 text-right font-semibold text-emerald-700">{inv.grossProfit.toFixed(2)}</td>
                              <td className="p-2.5 text-right">{inv.marginPercentage.toFixed(1)}%</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      {salesRegister.length > 0 && (
                        <tfoot className="bg-surface-muted font-bold text-charcoal-900 border-t border-surface-border">
                          <tr>
                            <td colSpan={4} className="p-2.5">Totals ({salesRegister.length} Invoices)</td>
                            <td className="p-2.5 text-right">
                              {salesRegister.reduce((sum, r) => sum + r.subtotal, 0).toFixed(2)}
                            </td>
                            <td className="p-2.5 text-right text-rose-600">
                              {salesRegister.reduce((sum, r) => sum + r.discountAmount, 0).toFixed(2)}
                            </td>
                            <td className="p-2.5 text-right">
                              {salesRegister.reduce((sum, r) => sum + r.netTotal, 0).toFixed(2)}
                            </td>
                            <td className="p-2.5 text-right text-emerald-600">
                              {salesRegister.reduce((sum, r) => sum + r.paidAmount, 0).toFixed(2)}
                            </td>
                            <td className="p-2.5 text-right text-amber-600">
                              {salesRegister.reduce((sum, r) => sum + r.balanceDue, 0).toFixed(2)}
                            </td>
                            <td className="p-2.5 text-right">
                              {salesRegister.reduce((sum, r) => sum + r.totalCogs, 0).toFixed(2)}
                            </td>
                            <td className="p-2.5 text-right text-emerald-700">
                              {salesRegister.reduce((sum, r) => sum + r.grossProfit, 0).toFixed(2)}
                            </td>
                            <td className="p-2.5 text-right">-</td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>
              )}

              {/* Product-Wise Sales Table */}
              {salesSubReport === 'product_sales' && (
                <div className="bg-surface-card rounded-xl border border-surface-border overflow-hidden">
                  <div className="overflow-x-auto max-h-[600px]">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-surface-muted text-charcoal-600 font-semibold sticky top-0 z-10 border-b border-surface-border">
                        <tr>
                          <th className="p-2.5">SKU</th>
                          <th className="p-2.5">Product Name</th>
                          <th className="p-2.5">Manufacturer</th>
                          <th className="p-2.5 text-right">Billed Qty</th>
                          <th className="p-2.5 text-right">Bonus Qty</th>
                          <th className="p-2.5 text-right">Total Units</th>
                          <th className="p-2.5 text-right">Gross</th>
                          <th className="p-2.5 text-right">Net Sales</th>
                          <th className="p-2.5 text-right">COGS</th>
                          <th className="p-2.5 text-right">Gross Profit</th>
                          <th className="p-2.5 text-right">Margin %</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-border text-charcoal-700">
                        {productSales.length === 0 ? (
                          <tr>
                            <td colSpan={11} className="text-center py-8 text-charcoal-400">
                              No product sales found for selected filter criteria.
                            </td>
                          </tr>
                        ) : (
                          productSales.map((p) => (
                            <tr key={p.productId} className="hover:bg-surface-muted/50 transition-colors">
                              <td className="p-2.5 font-mono text-charcoal-500">{p.sku}</td>
                              <td className="p-2.5 font-medium text-charcoal-900">{p.name}</td>
                              <td className="p-2.5 text-charcoal-500">{p.manufacturerName || 'N/A'}</td>
                              <td className="p-2.5 text-right font-medium">{p.billedQuantity}</td>
                              <td className="p-2.5 text-right text-emerald-600">{p.bonusQuantity}</td>
                              <td className="p-2.5 text-right font-semibold">{p.totalQuantity}</td>
                              <td className="p-2.5 text-right">{p.grossAmount.toFixed(2)}</td>
                              <td className="p-2.5 text-right font-semibold text-charcoal-900">{p.netSales.toFixed(2)}</td>
                              <td className="p-2.5 text-right text-charcoal-500">{p.historicalCost.toFixed(2)}</td>
                              <td className="p-2.5 text-right font-semibold text-emerald-700">{p.grossProfit.toFixed(2)}</td>
                              <td className="p-2.5 text-right">{p.marginPercentage.toFixed(1)}%</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      {productSales.length > 0 && (
                        <tfoot className="bg-surface-muted font-bold text-charcoal-900 border-t border-surface-border">
                          <tr>
                            <td colSpan={3} className="p-2.5">Total Products ({productSales.length})</td>
                            <td className="p-2.5 text-right">{productSales.reduce((s, r) => s + r.billedQuantity, 0)}</td>
                            <td className="p-2.5 text-right text-emerald-600">{productSales.reduce((s, r) => s + r.bonusQuantity, 0)}</td>
                            <td className="p-2.5 text-right">{productSales.reduce((s, r) => s + r.totalQuantity, 0)}</td>
                            <td className="p-2.5 text-right">{productSales.reduce((s, r) => s + r.grossAmount, 0).toFixed(2)}</td>
                            <td className="p-2.5 text-right">{productSales.reduce((s, r) => s + r.netSales, 0).toFixed(2)}</td>
                            <td className="p-2.5 text-right">{productSales.reduce((s, r) => s + r.historicalCost, 0).toFixed(2)}</td>
                            <td className="p-2.5 text-right text-emerald-700">{productSales.reduce((s, r) => s + r.grossProfit, 0).toFixed(2)}</td>
                            <td className="p-2.5 text-right">-</td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>
              )}

              {/* Customer-Wise Sales Table */}
              {salesSubReport === 'customer_sales' && (
                <div className="bg-surface-card rounded-xl border border-surface-border overflow-hidden">
                  <div className="overflow-x-auto max-h-[600px]">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-surface-muted text-charcoal-600 font-semibold sticky top-0 z-10 border-b border-surface-border">
                        <tr>
                          <th className="p-2.5">Customer Code</th>
                          <th className="p-2.5">Customer Name</th>
                          <th className="p-2.5">Type</th>
                          <th className="p-2.5 text-right">Invoices</th>
                          <th className="p-2.5 text-right">Gross Sales</th>
                          <th className="p-2.5 text-right">Net Sales</th>
                          <th className="p-2.5 text-right">Paid</th>
                          <th className="p-2.5 text-right">Outstanding</th>
                          <th className="p-2.5 text-right">Gross Profit</th>
                          <th className="p-2.5 text-right">Margin %</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-border text-charcoal-700">
                        {customerSales.length === 0 ? (
                          <tr>
                            <td colSpan={10} className="text-center py-8 text-charcoal-400">
                              No customer sales records found.
                            </td>
                          </tr>
                        ) : (
                          customerSales.map((c) => (
                            <tr key={c.customerId} className="hover:bg-surface-muted/50 transition-colors">
                              <td className="p-2.5 font-mono text-charcoal-500">{c.customerCode}</td>
                              <td className="p-2.5 font-semibold text-charcoal-900">{c.customerName}</td>
                              <td className="p-2.5 text-charcoal-500">{c.customerType}</td>
                              <td className="p-2.5 text-right font-medium">{c.invoiceCount}</td>
                              <td className="p-2.5 text-right">{c.grossSales.toFixed(2)}</td>
                              <td className="p-2.5 text-right font-bold text-charcoal-900">{c.netSales.toFixed(2)}</td>
                              <td className="p-2.5 text-right text-emerald-600">{c.paidAmount.toFixed(2)}</td>
                              <td className="p-2.5 text-right text-amber-600 font-medium">{c.outstandingAmount.toFixed(2)}</td>
                              <td className="p-2.5 text-right font-semibold text-emerald-700">{c.grossProfit.toFixed(2)}</td>
                              <td className="p-2.5 text-right">{c.marginPercentage.toFixed(1)}%</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Sales Returns Table */}
              {salesSubReport === 'returns' && (
                <div className="bg-surface-card rounded-xl border border-surface-border overflow-hidden">
                  <div className="overflow-x-auto max-h-[600px]">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-surface-muted text-charcoal-600 font-semibold sticky top-0 z-10 border-b border-surface-border">
                        <tr>
                          <th className="p-2.5">Return #</th>
                          <th className="p-2.5">Date</th>
                          <th className="p-2.5">Customer</th>
                          <th className="p-2.5">Reason</th>
                          <th className="p-2.5">Refund Mode</th>
                          <th className="p-2.5 text-right">Units</th>
                          <th className="p-2.5 text-right">Net Return Value</th>
                          <th className="p-2.5 text-right">Refund Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-border text-charcoal-700">
                        {salesReturns.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="text-center py-8 text-charcoal-400">
                              No sales return records found.
                            </td>
                          </tr>
                        ) : (
                          salesReturns.map((r) => (
                            <tr key={r.id} className="hover:bg-surface-muted/50 transition-colors">
                              <td className="p-2.5 font-semibold text-brand-700">{r.returnNumber}</td>
                              <td className="p-2.5">{new Date(r.returnDate).toLocaleDateString()}</td>
                              <td className="p-2.5 font-medium text-charcoal-900">{r.customerName}</td>
                              <td className="p-2.5 text-charcoal-600">{r.reason}</td>
                              <td className="p-2.5 text-charcoal-500">{r.refundMode}</td>
                              <td className="p-2.5 text-right font-medium">{r.totalQuantity}</td>
                              <td className="p-2.5 text-right font-bold text-rose-700">{r.netTotal.toFixed(2)}</td>
                              <td className="p-2.5 text-right text-charcoal-900">{r.refundAmount.toFixed(2)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Collections Table */}
              {salesSubReport === 'collections' && (
                <div className="bg-surface-card rounded-xl border border-surface-border overflow-hidden">
                  <div className="overflow-x-auto max-h-[600px]">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-surface-muted text-charcoal-600 font-semibold sticky top-0 z-10 border-b border-surface-border">
                        <tr>
                          <th className="p-2.5">Receipt #</th>
                          <th className="p-2.5">Date</th>
                          <th className="p-2.5">Customer</th>
                          <th className="p-2.5">Method</th>
                          <th className="p-2.5">Reference / Bank</th>
                          <th className="p-2.5 text-right">Total Amount</th>
                          <th className="p-2.5 text-right">Allocated</th>
                          <th className="p-2.5 text-right">Unallocated / Adv</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-border text-charcoal-700">
                        {collections.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="text-center py-8 text-charcoal-400">
                              No collection receipt records found.
                            </td>
                          </tr>
                        ) : (
                          collections.map((p) => (
                            <tr key={p.id} className="hover:bg-surface-muted/50 transition-colors">
                              <td className="p-2.5 font-semibold text-brand-700">{p.paymentNumber}</td>
                              <td className="p-2.5">{new Date(p.paymentDate).toLocaleDateString()}</td>
                              <td className="p-2.5 font-medium text-charcoal-900">{p.customerName}</td>
                              <td className="p-2.5 text-charcoal-600 font-medium">{p.paymentMethod}</td>
                              <td className="p-2.5 text-charcoal-500">{p.referenceNumber || p.bankName || 'N/A'}</td>
                              <td className="p-2.5 text-right font-bold text-emerald-700">{p.amount.toFixed(2)}</td>
                              <td className="p-2.5 text-right text-charcoal-700">{p.allocatedAmount.toFixed(2)}</td>
                              <td className="p-2.5 text-right text-amber-600">{p.unallocatedAmount.toFixed(2)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* 3. PURCHASE REPORTS                                          */}
          {/* ============================================================ */}
          {activeCategory === 'purchases' && (
            <div className="space-y-4">
              {purchaseSubReport === 'summary' && purchaseSummary && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-surface-card p-3.5 rounded-xl border border-surface-border">
                    <span className="text-xs text-charcoal-500">Gross Purchases</span>
                    <p className="text-base font-bold text-charcoal-900 mt-1">
                      PKR {purchaseSummary.grossPurchases.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-charcoal-400 mt-0.5">{purchaseSummary.grnCount} Received GRNs</p>
                  </div>
                  <div className="bg-surface-card p-3.5 rounded-xl border border-surface-border">
                    <span className="text-xs text-charcoal-500">Net Purchases</span>
                    <p className="text-base font-bold text-blue-700 mt-1">
                      PKR {purchaseSummary.netPurchases.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-charcoal-400 mt-0.5">
                      Disc: PKR {purchaseSummary.discountAmount.toLocaleString()} • Tax: PKR {purchaseSummary.taxAmount.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-surface-card p-3.5 rounded-xl border border-surface-border">
                    <span className="text-xs text-charcoal-500">Disbursed / Paid</span>
                    <p className="text-base font-bold text-emerald-700 mt-1">
                      PKR {purchaseSummary.paidAmount.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-charcoal-400 mt-0.5">Vendor payments</p>
                  </div>
                  <div className="bg-surface-card p-3.5 rounded-xl border border-surface-border">
                    <span className="text-xs text-charcoal-500">Payable Balance</span>
                    <p className="text-base font-bold text-rose-700 mt-1">
                      PKR {purchaseSummary.outstandingAmount.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-charcoal-400 mt-0.5">
                      {purchaseSummary.totalUnits} Total Units ({purchaseSummary.totalBonusQuantity} Free)
                    </p>
                  </div>
                </div>
              )}

              {purchaseSubReport === 'register' && (
                <div className="bg-surface-card rounded-xl border border-surface-border overflow-hidden">
                  <div className="overflow-x-auto max-h-[600px]">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-surface-muted text-charcoal-600 font-semibold sticky top-0 z-10 border-b border-surface-border">
                        <tr>
                          <th className="p-2.5">GRN #</th>
                          <th className="p-2.5">Vendor Inv #</th>
                          <th className="p-2.5">Date</th>
                          <th className="p-2.5">Supplier</th>
                          <th className="p-2.5">Warehouse</th>
                          <th className="p-2.5 text-right">Billed Qty</th>
                          <th className="p-2.5 text-right">Bonus Qty</th>
                          <th className="p-2.5 text-right">Gross</th>
                          <th className="p-2.5 text-right">Net Purchase</th>
                          <th className="p-2.5 text-right">Paid</th>
                          <th className="p-2.5 text-right">Payable Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-border text-charcoal-700">
                        {purchaseRegister.length === 0 ? (
                          <tr>
                            <td colSpan={11} className="text-center py-8 text-charcoal-400">
                              No purchase GRN records found.
                            </td>
                          </tr>
                        ) : (
                          purchaseRegister.map((g) => (
                            <tr key={g.id} className="hover:bg-surface-muted/50 transition-colors">
                              <td className="p-2.5 font-semibold text-brand-700">{g.grnNumber}</td>
                              <td className="p-2.5 font-mono text-charcoal-500">{g.supplierInvoiceNumber || 'N/A'}</td>
                              <td className="p-2.5">{new Date(g.receivedDate).toLocaleDateString()}</td>
                              <td className="p-2.5 font-medium text-charcoal-900">{g.supplierName}</td>
                              <td className="p-2.5 text-charcoal-500">{g.warehouseName}</td>
                              <td className="p-2.5 text-right">{g.billedQuantity}</td>
                              <td className="p-2.5 text-right text-emerald-600">{g.bonusQuantity}</td>
                              <td className="p-2.5 text-right">{g.subtotal.toFixed(2)}</td>
                              <td className="p-2.5 text-right font-bold text-charcoal-900">{g.netTotal.toFixed(2)}</td>
                              <td className="p-2.5 text-right text-emerald-600">{g.paidAmount.toFixed(2)}</td>
                              <td className="p-2.5 text-right font-medium text-rose-600">{g.balanceDue.toFixed(2)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {purchaseSubReport === 'supplier_purchases' && (
                <div className="bg-surface-card rounded-xl border border-surface-border overflow-hidden">
                  <div className="overflow-x-auto max-h-[600px]">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-surface-muted text-charcoal-600 font-semibold sticky top-0 z-10 border-b border-surface-border">
                        <tr>
                          <th className="p-2.5">Supplier Code</th>
                          <th className="p-2.5">Supplier Name</th>
                          <th className="p-2.5 text-right">GRN Count</th>
                          <th className="p-2.5 text-right">Billed Units</th>
                          <th className="p-2.5 text-right">Bonus Units</th>
                          <th className="p-2.5 text-right">Net Purchases</th>
                          <th className="p-2.5 text-right">Paid</th>
                          <th className="p-2.5 text-right">Outstanding Payable</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-border text-charcoal-700">
                        {supplierPurchases.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="text-center py-8 text-charcoal-400">
                              No supplier purchase records found.
                            </td>
                          </tr>
                        ) : (
                          supplierPurchases.map((s) => (
                            <tr key={s.supplierId} className="hover:bg-surface-muted/50 transition-colors">
                              <td className="p-2.5 font-mono text-charcoal-500">{s.supplierCode}</td>
                              <td className="p-2.5 font-semibold text-charcoal-900">{s.supplierName}</td>
                              <td className="p-2.5 text-right font-medium">{s.grnCount}</td>
                              <td className="p-2.5 text-right">{s.billedQuantity}</td>
                              <td className="p-2.5 text-right text-emerald-600">{s.bonusQuantity}</td>
                              <td className="p-2.5 text-right font-bold text-charcoal-900">{s.netPurchases.toFixed(2)}</td>
                              <td className="p-2.5 text-right text-emerald-600">{s.paidAmount.toFixed(2)}</td>
                              <td className="p-2.5 text-right font-semibold text-rose-600">{s.outstandingAmount.toFixed(2)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* 4. INVENTORY REPORTS                                         */}
          {/* ============================================================ */}
          {activeCategory === 'inventory' && (
            <div className="space-y-4">
              {inventorySubReport === 'valuation' && stockValuationSummary && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-surface-card p-3.5 rounded-xl border border-surface-border">
                      <span className="text-xs text-charcoal-500">Total Stock (Physical)</span>
                      <p className="text-base font-bold text-charcoal-900 mt-1">
                        {stockValuationSummary.totalQuantity.toLocaleString()} Units
                      </p>
                      <p className="text-[11px] text-charcoal-400 mt-0.5">{stockValuationSummary.batchCount} Active Batches</p>
                    </div>
                    <div className="bg-surface-card p-3.5 rounded-xl border border-surface-border">
                      <span className="text-xs text-charcoal-500">Saleable Standard Qty</span>
                      <p className="text-base font-bold text-emerald-700 mt-1">
                        {stockValuationSummary.standardQuantity.toLocaleString()} Units
                      </p>
                      <p className="text-[11px] text-charcoal-400 mt-0.5">Dispensable stock</p>
                    </div>
                    <div className="bg-surface-card p-3.5 rounded-xl border border-surface-border">
                      <span className="text-xs text-charcoal-500">Quarantine Hold Qty</span>
                      <p className="text-base font-bold text-amber-700 mt-1">
                        {stockValuationSummary.quarantineQuantity.toLocaleString()} Units
                      </p>
                      <p className="text-[11px] text-charcoal-400 mt-0.5">Isolated from sale</p>
                    </div>
                    <div className="bg-surface-card p-3.5 rounded-xl border border-surface-border">
                      <span className="text-xs text-charcoal-500">Valuation (Purchase Cost)</span>
                      <p className="text-base font-bold text-brand-700 mt-1">
                        PKR {stockValuationSummary.purchaseValuation.toLocaleString()}
                      </p>
                      <p className="text-[11px] text-charcoal-400 mt-0.5">
                        Retail (MRP): PKR {stockValuationSummary.retailValuation.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="bg-surface-card rounded-xl border border-surface-border overflow-hidden">
                    <div className="overflow-x-auto max-h-[600px]">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead className="bg-surface-muted text-charcoal-600 font-semibold sticky top-0 z-10 border-b border-surface-border">
                          <tr>
                            <th className="p-2.5">SKU</th>
                            <th className="p-2.5">Product Name</th>
                            <th className="p-2.5">Batch</th>
                            <th className="p-2.5">Expiry</th>
                            <th className="p-2.5 text-right">Standard</th>
                            <th className="p-2.5 text-right">Quarantine</th>
                            <th className="p-2.5 text-right">Total Qty</th>
                            <th className="p-2.5 text-right">Cost Price</th>
                            <th className="p-2.5 text-right">Retail Price</th>
                            <th className="p-2.5 text-right">Cost Valuation</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-border text-charcoal-700">
                          {stockValuationItems.length === 0 ? (
                            <tr>
                              <td colSpan={10} className="text-center py-8 text-charcoal-400">
                                No stock valuation items found.
                              </td>
                            </tr>
                          ) : (
                            stockValuationItems.map((b) => (
                              <tr key={b.batchId} className="hover:bg-surface-muted/50 transition-colors">
                                <td className="p-2.5 font-mono text-charcoal-500">{b.productSku}</td>
                                <td className="p-2.5 font-medium text-charcoal-900">{b.productName}</td>
                                <td className="p-2.5 font-semibold text-brand-700">{b.batchNumber}</td>
                                <td className="p-2.5">
                                  <span className={clsx(b.isExpired ? 'text-rose-700 font-bold' : 'text-charcoal-700')}>
                                    {new Date(b.expiryDate).toLocaleDateString()}
                                  </span>
                                </td>
                                <td className="p-2.5 text-right font-medium">{b.standardQuantity}</td>
                                <td className="p-2.5 text-right text-amber-600">{b.quarantineQuantity}</td>
                                <td className="p-2.5 text-right font-bold text-charcoal-900">{b.totalQuantity}</td>
                                <td className="p-2.5 text-right">{b.unitCost.toFixed(2)}</td>
                                <td className="p-2.5 text-right">{b.retailPrice.toFixed(2)}</td>
                                <td className="p-2.5 text-right font-semibold text-brand-700">{b.purchaseValuation.toFixed(2)}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {inventorySubReport === 'ledger' && (
                <div className="bg-surface-card rounded-xl border border-surface-border overflow-hidden">
                  <div className="overflow-x-auto max-h-[600px]">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-surface-muted text-charcoal-600 font-semibold sticky top-0 z-10 border-b border-surface-border">
                        <tr>
                          <th className="p-2.5">Timestamp</th>
                          <th className="p-2.5">Warehouse</th>
                          <th className="p-2.5">Product</th>
                          <th className="p-2.5">Batch</th>
                          <th className="p-2.5">Movement Type</th>
                          <th className="p-2.5 text-right">Quantity</th>
                          <th className="p-2.5">Reference</th>
                          <th className="p-2.5">User</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-border text-charcoal-700">
                        {stockLedger.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="text-center py-8 text-charcoal-400">
                              No stock movement ledger records found.
                            </td>
                          </tr>
                        ) : (
                          stockLedger.map((m) => (
                            <tr key={m.id} className="hover:bg-surface-muted/50 transition-colors">
                              <td className="p-2.5">{new Date(m.movementDate).toLocaleString()}</td>
                              <td className="p-2.5 text-charcoal-500">{m.warehouseName}</td>
                              <td className="p-2.5 font-medium text-charcoal-900">{m.productName}</td>
                              <td className="p-2.5 font-mono text-brand-700">{m.batchNumber}</td>
                              <td className="p-2.5 font-semibold text-charcoal-700">{m.movementType}</td>
                              <td className={clsx('p-2.5 text-right font-bold', m.quantity >= 0 ? 'text-emerald-700' : 'text-rose-700')}>
                                {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                              </td>
                              <td className="p-2.5 font-mono text-charcoal-500">{m.referenceType || 'N/A'}</td>
                              <td className="p-2.5 text-charcoal-600">{m.performedBy}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* 5. RECEIVABLES & PAYABLES (AGING & STATEMENTS)               */}
          {/* ============================================================ */}
          {activeCategory === 'receivables_payables' && (
            <div className="space-y-4">
              {/* Customer Aging Analysis */}
              {recPaySubReport === 'customer_aging' && customerAgingSummary && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
                    <div className="bg-surface-card p-3 rounded-xl border border-surface-border">
                      <span className="text-[11px] text-charcoal-500">Total Receivables</span>
                      <p className="text-sm font-bold text-charcoal-900 mt-0.5">
                        PKR {customerAgingSummary.grandTotalDue.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-surface-card p-3 rounded-xl border border-surface-border">
                      <span className="text-[11px] text-emerald-600 font-semibold">Current (In Term)</span>
                      <p className="text-sm font-bold text-emerald-700 mt-0.5">
                        PKR {customerAgingSummary.grandCurrent.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-surface-card p-3 rounded-xl border border-surface-border">
                      <span className="text-[11px] text-amber-600 font-semibold">1–30 Days</span>
                      <p className="text-sm font-bold text-amber-700 mt-0.5">
                        PKR {customerAgingSummary.grand1to30.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-surface-card p-3 rounded-xl border border-surface-border">
                      <span className="text-[11px] text-orange-600 font-semibold">31–60 Days</span>
                      <p className="text-sm font-bold text-orange-700 mt-0.5">
                        PKR {customerAgingSummary.grand31to60.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-surface-card p-3 rounded-xl border border-surface-border">
                      <span className="text-[11px] text-rose-600 font-semibold">61–90 Days</span>
                      <p className="text-sm font-bold text-rose-700 mt-0.5">
                        PKR {customerAgingSummary.grand61to90.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-surface-card p-3 rounded-xl border border-surface-border">
                      <span className="text-[11px] text-red-700 font-bold">90+ Days (High Risk)</span>
                      <p className="text-sm font-bold text-red-800 mt-0.5">
                        PKR {customerAgingSummary.grand90Plus.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="bg-surface-card rounded-xl border border-surface-border overflow-hidden">
                    <div className="overflow-x-auto max-h-[600px]">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead className="bg-surface-muted text-charcoal-600 font-semibold sticky top-0 z-10 border-b border-surface-border">
                          <tr>
                            <th className="p-2.5">Customer Code</th>
                            <th className="p-2.5">Customer Name</th>
                            <th className="p-2.5">Credit Days</th>
                            <th className="p-2.5 text-right">Balance Due</th>
                            <th className="p-2.5 text-right text-emerald-700">Current</th>
                            <th className="p-2.5 text-right text-amber-700">1–30d</th>
                            <th className="p-2.5 text-right text-orange-700">31–60d</th>
                            <th className="p-2.5 text-right text-rose-700">61–90d</th>
                            <th className="p-2.5 text-right text-red-800 font-bold">90+d</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-border text-charcoal-700">
                          {customerAgingItems.length === 0 ? (
                            <tr>
                              <td colSpan={9} className="text-center py-8 text-charcoal-400">
                                No customer accounts with overdue balances found.
                              </td>
                            </tr>
                          ) : (
                            customerAgingItems.map((c) => (
                              <tr key={c.customerId} className="hover:bg-surface-muted/50 transition-colors">
                                <td className="p-2.5 font-mono text-charcoal-500">{c.customerCode}</td>
                                <td className="p-2.5 font-semibold text-charcoal-900">{c.customerName}</td>
                                <td className="p-2.5 text-charcoal-500">{c.creditDays} days</td>
                                <td className="p-2.5 text-right font-bold text-charcoal-900">{c.currentBalance.toFixed(2)}</td>
                                <td className="p-2.5 text-right text-emerald-600">{c.current.toFixed(2)}</td>
                                <td className="p-2.5 text-right text-amber-600">{c.days1to30.toFixed(2)}</td>
                                <td className="p-2.5 text-right text-orange-600">{c.days31to60.toFixed(2)}</td>
                                <td className="p-2.5 text-right text-rose-600">{c.days61to90.toFixed(2)}</td>
                                <td className="p-2.5 text-right font-bold text-red-700">{c.days90Plus.toFixed(2)}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Customer Statement */}
              {recPaySubReport === 'customer_statement' && customerStatement && (
                <div className="space-y-4">
                  <div className="bg-surface-card p-4 rounded-xl border border-surface-border flex flex-col sm:flex-row justify-between items-center gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-charcoal-900">{customerStatement.customer.name}</h4>
                      <p className="text-xs text-charcoal-500">Account Code: {customerStatement.customer.code}</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-semibold">
                      <span>Opening: PKR {customerStatement.openingBalance.toFixed(2)}</span>
                      <span className="text-brand-700 font-bold">
                        Closing Balance: PKR {customerStatement.closingBalance.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="bg-surface-card rounded-xl border border-surface-border overflow-hidden">
                    <div className="overflow-x-auto max-h-[600px]">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead className="bg-surface-muted text-charcoal-600 font-semibold sticky top-0 z-10 border-b border-surface-border">
                          <tr>
                            <th className="p-2.5">Date</th>
                            <th className="p-2.5">Transaction Type</th>
                            <th className="p-2.5">Reference #</th>
                            <th className="p-2.5">Notes</th>
                            <th className="p-2.5 text-right">Debit (Due)</th>
                            <th className="p-2.5 text-right">Credit (Paid)</th>
                            <th className="p-2.5 text-right font-bold">Balance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-border text-charcoal-700">
                          {customerStatement.data.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="text-center py-8 text-charcoal-400">
                                No ledger transactions in selected date range.
                              </td>
                            </tr>
                          ) : (
                            customerStatement.data.map((row) => (
                              <tr key={row.id} className="hover:bg-surface-muted/50 transition-colors">
                                <td className="p-2.5">{new Date(row.transactionDate).toLocaleDateString()}</td>
                                <td className="p-2.5 font-medium">{row.entryType}</td>
                                <td className="p-2.5 font-mono text-brand-700">{row.referenceNumber}</td>
                                <td className="p-2.5 text-charcoal-500">{row.notes || '-'}</td>
                                <td className="p-2.5 text-right font-semibold text-rose-600">{row.debit > 0 ? row.debit.toFixed(2) : '-'}</td>
                                <td className="p-2.5 text-right font-semibold text-emerald-600">{row.credit > 0 ? row.credit.toFixed(2) : '-'}</td>
                                <td className="p-2.5 text-right font-bold text-charcoal-900">{row.runningBalance.toFixed(2)}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Supplier Aging Analysis */}
              {recPaySubReport === 'supplier_aging' && supplierAgingSummary && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
                    <div className="bg-surface-card p-3 rounded-xl border border-surface-border">
                      <span className="text-[11px] text-charcoal-500">Total Payables</span>
                      <p className="text-sm font-bold text-charcoal-900 mt-0.5">
                        PKR {supplierAgingSummary.grandTotalPayable.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-surface-card p-3 rounded-xl border border-surface-border">
                      <span className="text-[11px] text-emerald-600 font-semibold">Current (In Term)</span>
                      <p className="text-sm font-bold text-emerald-700 mt-0.5">
                        PKR {supplierAgingSummary.grandCurrent.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-surface-card p-3 rounded-xl border border-surface-border">
                      <span className="text-[11px] text-amber-600 font-semibold">1–30 Days</span>
                      <p className="text-sm font-bold text-amber-700 mt-0.5">
                        PKR {supplierAgingSummary.grand1to30.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-surface-card p-3 rounded-xl border border-surface-border">
                      <span className="text-[11px] text-orange-600 font-semibold">31–60 Days</span>
                      <p className="text-sm font-bold text-orange-700 mt-0.5">
                        PKR {supplierAgingSummary.grand31to60.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-surface-card p-3 rounded-xl border border-surface-border">
                      <span className="text-[11px] text-rose-600 font-semibold">61–90 Days</span>
                      <p className="text-sm font-bold text-rose-700 mt-0.5">
                        PKR {supplierAgingSummary.grand61to90.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-surface-card p-3 rounded-xl border border-surface-border">
                      <span className="text-[11px] text-red-700 font-bold">90+ Days</span>
                      <p className="text-sm font-bold text-red-800 mt-0.5">
                        PKR {supplierAgingSummary.grand90Plus.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="bg-surface-card rounded-xl border border-surface-border overflow-hidden">
                    <div className="overflow-x-auto max-h-[600px]">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead className="bg-surface-muted text-charcoal-600 font-semibold sticky top-0 z-10 border-b border-surface-border">
                          <tr>
                            <th className="p-2.5">Supplier Code</th>
                            <th className="p-2.5">Supplier Name</th>
                            <th className="p-2.5">Credit Days</th>
                            <th className="p-2.5 text-right">Payable Due</th>
                            <th className="p-2.5 text-right text-emerald-700">Current</th>
                            <th className="p-2.5 text-right text-amber-700">1–30d</th>
                            <th className="p-2.5 text-right text-orange-700">31–60d</th>
                            <th className="p-2.5 text-right text-rose-700">61–90d</th>
                            <th className="p-2.5 text-right text-red-800 font-bold">90+d</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-border text-charcoal-700">
                          {supplierAgingItems.length === 0 ? (
                            <tr>
                              <td colSpan={9} className="text-center py-8 text-charcoal-400">
                                No supplier accounts with overdue payables found.
                              </td>
                            </tr>
                          ) : (
                            supplierAgingItems.map((s) => (
                              <tr key={s.supplierId} className="hover:bg-surface-muted/50 transition-colors">
                                <td className="p-2.5 font-mono text-charcoal-500">{s.supplierCode}</td>
                                <td className="p-2.5 font-semibold text-charcoal-900">{s.supplierName}</td>
                                <td className="p-2.5 text-charcoal-500">{s.creditDays} days</td>
                                <td className="p-2.5 text-right font-bold text-rose-700">{s.currentBalance.toFixed(2)}</td>
                                <td className="p-2.5 text-right text-emerald-600">{s.current.toFixed(2)}</td>
                                <td className="p-2.5 text-right text-amber-600">{s.days1to30.toFixed(2)}</td>
                                <td className="p-2.5 text-right text-orange-600">{s.days31to60.toFixed(2)}</td>
                                <td className="p-2.5 text-right text-rose-600">{s.days61to90.toFixed(2)}</td>
                                <td className="p-2.5 text-right font-bold text-red-700">{s.days90Plus.toFixed(2)}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Supplier Statement */}
              {recPaySubReport === 'supplier_statement' && supplierStatement && (
                <div className="space-y-4">
                  <div className="bg-surface-card p-4 rounded-xl border border-surface-border flex flex-col sm:flex-row justify-between items-center gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-charcoal-900">{supplierStatement.supplier.name}</h4>
                      <p className="text-xs text-charcoal-500">Supplier Code: {supplierStatement.supplier.code}</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-semibold">
                      <span>Opening: PKR {supplierStatement.openingBalance.toFixed(2)}</span>
                      <span className="text-rose-700 font-bold">
                        Closing Payable: PKR {supplierStatement.closingBalance.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="bg-surface-card rounded-xl border border-surface-border overflow-hidden">
                    <div className="overflow-x-auto max-h-[600px]">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead className="bg-surface-muted text-charcoal-600 font-semibold sticky top-0 z-10 border-b border-surface-border">
                          <tr>
                            <th className="p-2.5">Date</th>
                            <th className="p-2.5">Transaction Type</th>
                            <th className="p-2.5">Reference #</th>
                            <th className="p-2.5">Notes</th>
                            <th className="p-2.5 text-right">Credit (Purchase)</th>
                            <th className="p-2.5 text-right">Debit (Payment)</th>
                            <th className="p-2.5 text-right font-bold">Balance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-border text-charcoal-700">
                          {supplierStatement.data.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="text-center py-8 text-charcoal-400">
                                No supplier ledger transactions in selected date range.
                              </td>
                            </tr>
                          ) : (
                            supplierStatement.data.map((row) => (
                              <tr key={row.id} className="hover:bg-surface-muted/50 transition-colors">
                                <td className="p-2.5">{new Date(row.transactionDate).toLocaleDateString()}</td>
                                <td className="p-2.5 font-medium">{row.entryType}</td>
                                <td className="p-2.5 font-mono text-brand-700">{row.referenceNumber}</td>
                                <td className="p-2.5 text-charcoal-500">{row.notes || '-'}</td>
                                <td className="p-2.5 text-right font-semibold text-rose-600">{row.credit > 0 ? row.credit.toFixed(2) : '-'}</td>
                                <td className="p-2.5 text-right font-semibold text-emerald-600">{row.debit > 0 ? row.debit.toFixed(2) : '-'}</td>
                                <td className="p-2.5 text-right font-bold text-charcoal-900">{row.runningBalance.toFixed(2)}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* 6. PROFITABILITY & MARGINS                                   */}
          {/* ============================================================ */}
          {activeCategory === 'profitability' && profitabilitySummary && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-surface-card p-4 rounded-xl border border-surface-border">
                  <span className="text-xs text-charcoal-500">Net Sales Revenue</span>
                  <p className="text-xl font-bold text-charcoal-900 mt-1">
                    PKR {profitabilitySummary.netRevenue.toLocaleString()}
                  </p>
                  <p className="text-xs text-charcoal-400 mt-1">{profitabilitySummary.invoiceCount} Posted Invoices</p>
                </div>

                <div className="bg-surface-card p-4 rounded-xl border border-surface-border">
                  <span className="text-xs text-charcoal-500">Historical COGS</span>
                  <p className="text-xl font-bold text-charcoal-700 mt-1">
                    PKR {profitabilitySummary.totalCogs.toLocaleString()}
                  </p>
                  <p className="text-xs text-charcoal-400 mt-1">Captured at sale posting</p>
                </div>

                <div className="bg-surface-card p-4 rounded-xl border border-surface-border">
                  <span className="text-xs text-charcoal-500">Gross Profit (GP)</span>
                  <p className="text-xl font-bold text-emerald-700 mt-1">
                    PKR {profitabilitySummary.grossProfit.toLocaleString()}
                  </p>
                  <p className="text-xs text-emerald-600 font-medium mt-1">Net Sales - Historical COGS</p>
                </div>

                <div className="bg-surface-card p-4 rounded-xl border border-surface-border">
                  <span className="text-xs text-charcoal-500">Overall Margin %</span>
                  <p className="text-xl font-bold text-indigo-700 mt-1">
                    {profitabilitySummary.marginPercentage}%
                  </p>
                  <p className="text-xs text-charcoal-400 mt-1">Commercial gross margin</p>
                </div>
              </div>

              <div className="bg-surface-card p-4 rounded-xl border border-surface-border">
                <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-500 mb-2">
                  Accounting & Data Invariants
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-charcoal-600">
                  <div className="p-3 bg-surface rounded-lg border border-surface-border">
                    <p className="font-semibold text-charcoal-900">Historical Snapshot</p>
                    <p className="text-[11px] text-charcoal-500 mt-1">
                      COGS calculations strictly reuse the immutable snapshot unitCost saved at invoice creation time.
                    </p>
                  </div>
                  <div className="p-3 bg-surface rounded-lg border border-surface-border">
                    <p className="font-semibold text-charcoal-900">Zero-Sales Safety</p>
                    <p className="text-[11px] text-charcoal-500 mt-1">
                      Zero revenue periods default safely to 0.00% without division-by-zero exceptions.
                    </p>
                  </div>
                  <div className="p-3 bg-surface rounded-lg border border-surface-border">
                    <p className="font-semibold text-charcoal-900">Scope Scrutiny</p>
                    <p className="text-[11px] text-charcoal-500 mt-1">
                      Draft transactions and cancelled invoices are strictly excluded from profitability metrics.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
