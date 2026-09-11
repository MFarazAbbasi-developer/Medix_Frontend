import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  CreditCard,
  Users,
  Building2,
  Calendar,
  RefreshCw,
  ShoppingBag,
  PackageCheck,
  ShoppingCart,
  ArrowUpRight,
  Layers,
  ShieldAlert,
  AlertTriangle,
  Clock,
  ArrowRight,
  Inbox,
  AlertCircle,
} from 'lucide-react';
import {
  reportsApi,
  salesApi,
  settingsApi,
  DashboardMetricsReport,
  SalesInvoice,
  CustomerAgingSummary,
  SupplierAgingSummary,
} from '../api';
import { PageHeader } from '../components/ui/PageHeader';
import { MetricCard } from '../components/ui/MetricCard';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Card } from '../components/ui/Card';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Business metrics and configuration from existing APIs
  const [metrics, setMetrics] = useState<DashboardMetricsReport | null>(null);
  const [recentInvoices, setRecentInvoices] = useState<SalesInvoice[]>([]);
  const [customerAging, setCustomerAging] = useState<CustomerAgingSummary | null>(null);
  const [supplierAging, setSupplierAging] = useState<SupplierAgingSummary | null>(null);
  const [overLimitCount, setOverLimitCount] = useState<number>(0);
  const [minShelfLifeDays, setMinShelfLifeDays] = useState<number>(30);

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [metricsData, invoicesRes, customerAgingRes, supplierAgingRes, settingsRes] =
        await Promise.allSettled([
          reportsApi.getDashboardMetrics().catch(() => null),
          salesApi.getInvoices({ limit: 5 }).catch(() => ({ items: [] })),
          reportsApi.getCustomerAgingReport().catch(() => null),
          reportsApi.getSupplierAgingReport().catch(() => null),
          settingsApi.getSettings().catch(() => ({ items: [], map: {} })),
        ]);

      if (metricsData.status === 'fulfilled' && metricsData.value) {
        setMetrics(metricsData.value);
      }

      if (invoicesRes.status === 'fulfilled' && invoicesRes.value) {
        setRecentInvoices(invoicesRes.value.items || []);
      }

      if (customerAgingRes.status === 'fulfilled' && customerAgingRes.value) {
        const val = customerAgingRes.value;
        if ('summary' in val) {
          setCustomerAging(val.summary);
          const overLimit = val.data?.filter(
            (c) => c.creditLimit > 0 && c.currentBalance > c.creditLimit,
          ).length;
          setOverLimitCount(overLimit || 0);
        }
      }

      if (supplierAgingRes.status === 'fulfilled' && supplierAgingRes.value) {
        const val = supplierAgingRes.value;
        if ('summary' in val) {
          setSupplierAging(val.summary);
        }
      }

      if (settingsRes.status === 'fulfilled' && settingsRes.value?.map) {
        const settingsMap = settingsRes.value.map as Record<string, string>;
        const configuredDays = Number(settingsMap['MIN_REMAINING_SHELF_LIFE_DAYS']);
        setMinShelfLifeDays(configuredDays > 0 ? configuredDays : 30);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load dashboard metrics');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Current formatted business date
  const todayFormatted = new Date().toLocaleDateString('en-PK', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  // Calculate past-due balances based on customer and supplier credit/payment terms
  const pastDueReceivablesAmount = customerAging
    ? (customerAging.grand1to30 || 0) +
      (customerAging.grand31to60 || 0) +
      (customerAging.grand61to90 || 0) +
      (customerAging.grand90Plus || 0)
    : 0;

  const pastDuePayablesAmount = supplierAging
    ? (supplierAging.grand1to30 || 0) +
      (supplierAging.grand31to60 || 0) +
      (supplierAging.grand61to90 || 0) +
      (supplierAging.grand90Plus || 0)
    : 0;

  const totalExpiringCount =
    (metrics?.inventory?.soonExpiringBatches || 0) +
    (metrics?.inventory?.expiredBatches || 0);

  return (
    <div className="space-y-4">
      {/* 1. Page Header */}
      <PageHeader
        title="Dashboard"
        description="Business overview"
        icon={LayoutDashboard}
        actions={
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-surface-border bg-surface-card text-xs font-semibold text-charcoal-700 shadow-2xs">
              <Calendar className="h-3.5 w-3.5 text-charcoal-500" />
              <span>{todayFormatted}</span>
            </span>

            <Button
              variant="secondary"
              size="sm"
              onClick={loadDashboardData}
              disabled={isLoading}
              title="Refresh Dashboard Data"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        }
      />

      {error && (
        <div className="flex items-center gap-2 rounded border border-red-200 bg-red-50 p-3 text-xs text-red-800">
          <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. Four Primary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Today's Sales */}
        <MetricCard
          title="Today's Sales"
          value={
            isLoading
              ? 'Loading...'
              : `PKR ${Number(metrics?.today?.salesNet || 0).toLocaleString('en-PK', {
                  minimumFractionDigits: 2,
                })}`
          }
          subtitle={
            metrics
              ? `${metrics.today?.invoiceCount || 0} invoices billed today`
              : 'Direct counter & credit invoices'
          }
          icon={Receipt}
          status="brand"
        />

        {/* Collections */}
        <MetricCard
          title="Collections"
          value={
            isLoading
              ? 'Loading...'
              : `PKR ${Number(metrics?.today?.collections || 0).toLocaleString('en-PK', {
                  minimumFractionDigits: 2,
                })}`
          }
          subtitle="Cash & bank settlements received"
          icon={CreditCard}
          status="success"
        />

        {/* Receivables */}
        <MetricCard
          title="Receivables"
          value={
            isLoading
              ? 'Loading...'
              : `PKR ${Number(metrics?.outstanding?.receivables || 0).toLocaleString('en-PK', {
                  minimumFractionDigits: 2,
                })}`
          }
          subtitle="Total outstanding customer balance"
          icon={Users}
          status="warning"
        />

        {/* Payables */}
        <MetricCard
          title="Payables"
          value={
            isLoading
              ? 'Loading...'
              : `PKR ${Number(metrics?.outstanding?.payables || 0).toLocaleString('en-PK', {
                  minimumFractionDigits: 2,
                })}`
          }
          subtitle="Outstanding vendor liabilities"
          icon={Building2}
          status="info"
        />
      </div>

      {/* 3. Quick Actions */}
      <Card className="p-3 bg-surface-card border border-surface-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal-400">
              Quick Actions
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* New Sale (Primary Action) */}
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/sales')}
              className="gap-1.5 font-semibold"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>New Sale</span>
              <kbd className="hidden sm:inline-block px-1 py-0.2 text-[9px] font-mono bg-brand-700/80 text-white rounded">
                F2
              </kbd>
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/purchasing')}
              className="gap-1.5"
            >
              <PackageCheck className="h-3.5 w-3.5 text-charcoal-600" />
              <span>Receive Stock</span>
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/purchasing')}
              className="gap-1.5"
            >
              <ShoppingCart className="h-3.5 w-3.5 text-charcoal-600" />
              <span>Purchase Order</span>
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/payments')}
              className="gap-1.5"
            >
              <CreditCard className="h-3.5 w-3.5 text-charcoal-600" />
              <span>Customer Payment</span>
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/supplier-payments')}
              className="gap-1.5"
            >
              <ArrowUpRight className="h-3.5 w-3.5 text-charcoal-600" />
              <span>Supplier Payment</span>
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/inventory')}
              className="gap-1.5"
            >
              <Layers className="h-3.5 w-3.5 text-charcoal-600" />
              <span>Stock Adjustment</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* 4. Main Operational Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Today's Activity (7 Cols) */}
        <div className="lg:col-span-7 space-y-3">
          <Card
            header={
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-bold text-charcoal-900 uppercase tracking-wider">
                    Today's Activity
                  </h2>
                  <p className="text-[11px] text-charcoal-500 font-normal">
                    Transactions and billing movements recorded today
                  </p>
                </div>
                <Link
                  to="/sales"
                  className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
                >
                  <span>View All Invoices</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            }
            className="p-0 overflow-hidden"
          >
            {/* Activity Summary Badges */}
            <div className="grid grid-cols-3 divide-x divide-surface-border border-b border-surface-border bg-surface-muted/30 p-2.5 text-center">
              <div>
                <p className="text-[10px] font-semibold uppercase text-charcoal-500">
                  Invoices Billed
                </p>
                <p className="text-sm font-bold text-charcoal-900 font-mono mt-0.5">
                  {metrics?.today?.invoiceCount || 0}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase text-charcoal-500">
                  Goods Received
                </p>
                <p className="text-sm font-bold text-charcoal-900 font-mono mt-0.5">
                  {metrics?.today?.grnCount || 0} GRNs
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase text-charcoal-500">
                  Purchases Net
                </p>
                <p className="text-sm font-bold text-charcoal-900 font-mono mt-0.5">
                  PKR {Number(metrics?.today?.purchasesNet || 0).toLocaleString('en-PK')}
                </p>
              </div>
            </div>

            {/* Recent Sales Invoices Mini-Table */}
            <div className="p-3">
              {recentInvoices.length === 0 ? (
                <div className="py-8 text-center text-charcoal-400 flex flex-col items-center justify-center gap-1.5">
                  <Inbox className="h-6 w-6 text-charcoal-300" />
                  <p className="text-xs text-charcoal-500">
                    No sales invoices recorded today yet.
                  </p>
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => navigate('/sales')}
                    className="mt-1"
                  >
                    Create First Bill
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto rounded border border-surface-border">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-muted/60 text-[11px] font-semibold text-charcoal-600 border-b border-surface-border select-none">
                      <tr>
                        <th className="px-3 py-1.5">Invoice #</th>
                        <th className="px-3 py-1.5">Customer / Party</th>
                        <th className="px-3 py-1.5 text-right">Net Total</th>
                        <th className="px-3 py-1.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border">
                      {recentInvoices.map((inv) => (
                        <tr
                          key={inv.id}
                          onClick={() => navigate('/sales')}
                          className="hover:bg-surface-muted/40 cursor-pointer transition-colors"
                        >
                          <td className="px-3 py-2 font-mono font-medium text-brand-700">
                            {inv.invoiceNumber}
                          </td>
                          <td className="px-3 py-2 font-medium text-charcoal-800 truncate max-w-[180px]">
                            {inv.customer?.name || 'Walk-in Customer'}
                          </td>
                          <td className="px-3 py-2 text-right font-mono font-bold tabular-nums text-charcoal-900">
                            PKR {Number(inv.netTotal).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <StatusBadge
                              variant={
                                inv.status === 'POSTED'
                                  ? 'success'
                                  : inv.status === 'DRAFT'
                                  ? 'warning'
                                  : 'error'
                              }
                            >
                              {inv.status}
                            </StatusBadge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Attention Required (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          <Card
            header={
              <div>
                <h2 className="text-xs font-bold text-charcoal-900 uppercase tracking-wider">
                  Attention Required
                </h2>
                <p className="text-[11px] text-charcoal-500 font-normal">
                  Operational alerts requiring inventory and accounting action
                </p>
              </div>
            }
            className="p-3 space-y-2.5"
          >
            {/* 1. Expiring Batches */}
            <Link
              to="/expiry-recalls"
              className="block p-2.5 rounded border border-surface-border bg-surface-card hover:bg-surface-muted/40 hover:border-surface-borderStrong transition-all group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 rounded bg-red-50 text-red-700 border border-red-200 shrink-0 mt-0.5">
                    <ShieldAlert className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-charcoal-900 group-hover:text-brand-600 transition-colors">
                      Expiring & Expired Batches
                    </p>
                    <p className="text-[11px] text-charcoal-500 mt-0.5">
                      Batches expired or below minimum shelf life (&lt;{minShelfLifeDays} days)
                    </p>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded text-[11px] font-bold font-mono bg-red-50 text-red-800 border border-red-200 shrink-0">
                  {totalExpiringCount} Batches
                </span>
              </div>
            </Link>

            {/* 2. Customers Over Credit Limit */}
            <Link
              to="/customers"
              className="block p-2.5 rounded border border-surface-border bg-surface-card hover:bg-surface-muted/40 hover:border-surface-borderStrong transition-all group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 rounded bg-amber-50 text-amber-700 border border-amber-200 shrink-0 mt-0.5">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-charcoal-900 group-hover:text-brand-600 transition-colors">
                      Customers Over Credit Limit
                    </p>
                    <p className="text-[11px] text-charcoal-500 mt-0.5">
                      Parties with outstanding exceeding sanctioned limits
                    </p>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded text-[11px] font-bold font-mono bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                  {overLimitCount} Parties
                </span>
              </div>
            </Link>

            {/* 3. Past-Due Customer Receivables */}
            <Link
              to="/reports"
              className="block p-2.5 rounded border border-surface-border bg-surface-card hover:bg-surface-muted/40 hover:border-surface-borderStrong transition-all group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 rounded bg-amber-50 text-amber-700 border border-amber-200 shrink-0 mt-0.5">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-charcoal-900 group-hover:text-brand-600 transition-colors">
                      Past-Due Customer Receivables
                    </p>
                    <p className="text-[11px] text-charcoal-500 mt-0.5">
                      Invoices past agreed customer credit terms
                    </p>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded text-[11px] font-bold font-mono bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                  PKR {Math.round(pastDueReceivablesAmount).toLocaleString('en-PK')}
                </span>
              </div>
            </Link>

            {/* 4. Past-Due Supplier Payables */}
            <Link
              to="/supplier-payments"
              className="block p-2.5 rounded border border-surface-border bg-surface-card hover:bg-surface-muted/40 hover:border-surface-borderStrong transition-all group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 rounded bg-blue-50 text-blue-700 border border-blue-200 shrink-0 mt-0.5">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-charcoal-900 group-hover:text-brand-600 transition-colors">
                      Past-Due Supplier Payables
                    </p>
                    <p className="text-[11px] text-charcoal-500 mt-0.5">
                      Purchase bills past vendor payment terms
                    </p>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded text-[11px] font-bold font-mono bg-blue-50 text-blue-800 border border-blue-200 shrink-0">
                  PKR {Math.round(pastDuePayablesAmount).toLocaleString('en-PK')}
                </span>
              </div>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
};
