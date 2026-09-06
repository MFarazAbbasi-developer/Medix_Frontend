import React, { useState, useEffect, useCallback } from 'react';
import {
  RotateCcw,
  Search,
  RefreshCw,
  Plus,
  Printer,
  Ban,
  X,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Info,
  DollarSign,
  Package,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import {
  salesReturnsApi,
  SalesReturn,
  ReturnableInvoiceDetails,
  CreateSalesReturnDto,
  ReturnReason,
  ReturnedStockCondition,
  ReturnRefundMode,
  SalesReturnStatus,
  getInvoices,
  SalesInvoice,
  warehousesApi,
  organizationApi,
  settingsApi,
  Warehouse,
} from '../api';
import {
  DocumentPrintModal,
  SalesReturnPrintTemplate,
  PrintableCompanyInfo,
  PrintableSalesReturn,
} from '../components/printing';

export const SalesReturnsPage: React.FC = () => {
  const [returns, setReturns] = useState<SalesReturn[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [reasonFilter, setReasonFilter] = useState<string>('ALL');
  const [refundModeFilter, setRefundModeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Pagination & Aggregates
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [summary, setSummary] = useState<{
    totalNetReturn: number;
    totalRefundAmount: number;
    totalReversedCOGS: number;
    totalReversedProfit: number;
  }>({ totalNetReturn: 0, totalRefundAmount: 0, totalReversedCOGS: 0, totalReversedProfit: 0 });

  // Feedback Toast
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4500);
  };

  // Directory Data
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  // Create Return Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [returnableData, setReturnableData] = useState<ReturnableInvoiceDetails | null>(null);
  const [loadingReturnable, setLoadingReturnable] = useState<boolean>(false);

  // Form State
  const [returnDate, setReturnDate] = useState<string>(
    new Date().toISOString().split('T')[0],
  );
  const [returnReason, setReturnReason] = useState<ReturnReason>('CUSTOMER_RETURN');
  const [refundMode, setRefundMode] = useState<ReturnRefundMode>('CREDIT_ACCOUNT');
  const [refundAmountInput, setRefundAmountInput] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [itemRows, setItemRows] = useState<
    Record<
      string,
      {
        returnedQuantity: number;
        bonusReturnedQuantity: number;
        stockCondition: ReturnedStockCondition;
        destinationWarehouseId: string;
      }
    >
  >({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // View / Print Voucher Modal State
  const [viewingReturn, setViewingReturn] = useState<SalesReturn | null>(null);
  const [company, setCompany] = useState<PrintableCompanyInfo>({
    name: 'MEDIX Pharmacy',
    legalName: 'MEDIX Pharma Distribution',
  });
  const [settingsMap, setSettingsMap] = useState<Record<string, string>>({});

  // Cancel Modal State
  const [cancellingReturn, setCancellingReturn] = useState<SalesReturn | null>(null);
  const [cancellationReason, setCancellationReason] = useState<string>('');
  const [isCancelling, setIsCancelling] = useState<boolean>(false);

  // Load returns register
  const loadReturns = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await salesReturnsApi.getSalesReturns({
        search: search.trim() || undefined,
        reason: reasonFilter !== 'ALL' ? (reasonFilter as ReturnReason) : undefined,
        refundMode: refundModeFilter !== 'ALL' ? (refundModeFilter as ReturnRefundMode) : undefined,
        status: statusFilter !== 'ALL' ? (statusFilter as SalesReturnStatus) : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page: currentPage,
        limit: 20,
      });

      setReturns(res.items || []);
      setTotalRecords(res.total || 0);
      setTotalPages(res.totalPages || 1);
      setSummary({
        totalNetReturn: Number(res.summary?.totalNetReturn || 0),
        totalRefundAmount: Number(res.summary?.totalRefundAmount || 0),
        totalReversedCOGS: Number(res.summary?.totalReversedCOGS || 0),
        totalReversedProfit: Number(res.summary?.totalReversedProfit || 0),
      });
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || 'Failed to load sales returns');
    } finally {
      setIsLoading(false);
    }
  }, [search, reasonFilter, refundModeFilter, statusFilter, startDate, endDate, currentPage]);

  // Load Invoices, Warehouses, Organization & Settings
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [invData, whData, orgRes, settingsRes] = await Promise.all([
          getInvoices({ limit: 100, status: 'POSTED' }),
          warehousesApi.getWarehouses(),
          organizationApi.getOrganization().catch(() => null),
          settingsApi.getSettings().catch(() => ({ items: [], map: {} })),
        ]);
        setInvoices(invData?.items || []);
        setWarehouses(whData || []);

        if (orgRes) {
          setCompany({
            name: orgRes.name,
            legalName: orgRes.legalName || orgRes.name,
            address: orgRes.address,
            city: orgRes.city,
            phone: orgRes.phone,
            email: orgRes.email,
            ntn: orgRes.ntn,
            strn: orgRes.strn,
            drugSaleLicenseNo: orgRes.drugSaleLicenseNo,
          });
        }

        if (settingsRes?.map) {
          setSettingsMap(settingsRes.map);
        }
      } catch (err) {
        console.error('Failed to load auxiliary data', err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    loadReturns();
  }, [loadReturns]);

  // When invoice is selected in create modal, load returnable breakdown
  useEffect(() => {
    if (!selectedInvoiceId) {
      setReturnableData(null);
      setItemRows({});
      return;
    }

    const fetchReturnable = async () => {
      setLoadingReturnable(true);
      try {
        const data = await salesReturnsApi.getReturnableInvoice(selectedInvoiceId);
        setReturnableData(data);

        // Initialize item rows with default destination warehouse & condition
        const initialRows: Record<
          string,
          {
            returnedQuantity: number;
            bonusReturnedQuantity: number;
            stockCondition: ReturnedStockCondition;
            destinationWarehouseId: string;
          }
        > = {};

        const defaultStdWh = warehouses.find((w) => w.warehouseType === 'STANDARD') || warehouses[0];
        const defaultQuarWh = warehouses.find((w) => w.warehouseType === 'QUARANTINE') || warehouses[0];

        data.items.forEach((item) => {
          const condition: ReturnedStockCondition = item.canReturnAsSaleable ? 'SALEABLE' : 'QUARANTINED';
          const targetWh = condition === 'SALEABLE' ? defaultStdWh?.id : defaultQuarWh?.id;

          initialRows[item.id] = {
            returnedQuantity: 0,
            bonusReturnedQuantity: 0,
            stockCondition: condition,
            destinationWarehouseId: targetWh || '',
          };
        });

        setItemRows(initialRows);
      } catch (err: any) {
        showFeedback('error', err.response?.data?.message || 'Failed to fetch invoice return details');
      } finally {
        setLoadingReturnable(false);
      }
    };

    fetchReturnable();
  }, [selectedInvoiceId, warehouses]);

  // Handle line item condition change (switches default warehouse)
  const handleConditionChange = (itemId: string, cond: ReturnedStockCondition) => {
    const targetWhList = warehouses.filter((w) =>
      cond === 'SALEABLE' ? w.warehouseType === 'STANDARD' : w.warehouseType === 'QUARANTINE',
    );
    const defaultWh = targetWhList[0]?.id || '';

    setItemRows((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        stockCondition: cond,
        destinationWarehouseId: defaultWh,
      },
    }));
  };

  // Handle line item quantity change
  const handleQtyChange = (
    itemId: string,
    field: 'returnedQuantity' | 'bonusReturnedQuantity',
    val: string,
    maxVal: number,
  ) => {
    const num = parseInt(val, 10);
    const clamped = isNaN(num) || num < 0 ? 0 : Math.min(num, maxVal);

    setItemRows((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: clamped,
      },
    }));
  };

  // Handle line item destination warehouse change
  const handleWarehouseChange = (itemId: string, whId: string) => {
    setItemRows((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        destinationWarehouseId: whId,
      },
    }));
  };

  // Commercial Calculation in Return Modal
  let modalNetTotal = 0;
  let modalCostTotal = 0;
  let hasAnyReturnedQty = false;

  if (returnableData) {
    returnableData.items.forEach((item) => {
      const row = itemRows[item.id];
      if (row && (row.returnedQuantity > 0 || row.bonusReturnedQuantity > 0)) {
        hasAnyReturnedQty = true;
        const lineGross = row.returnedQuantity * item.unitPrice;
        const lineDisc = lineGross * (item.discountPercentage / 100);
        const lineTaxable = lineGross - lineDisc;
        const lineTax = lineTaxable * (item.taxPercentage / 100);
        const lineTotal = lineTaxable + lineTax;
        const lineCost = (row.returnedQuantity + row.bonusReturnedQuantity) * item.unitCost;

        modalNetTotal += lineTotal;
        modalCostTotal += lineCost;
      }
    });
  }

  modalNetTotal = Math.round(modalNetTotal * 100) / 100;
  modalCostTotal = Math.round(modalCostTotal * 100) / 100;
  const modalProfitReversed = Math.round((modalNetTotal - modalCostTotal) * 100) / 100;

  const maxRefundable = returnableData?.invoice.maxRefundableAmount || 0;
  const requestedRefund = parseFloat(refundAmountInput) || 0;
  const isRefundModeCashOrBank =
    refundMode === 'CASH_REFUND' || refundMode === 'BANK_TRANSFER';
  const isRefundExceedingPaid =
    isRefundModeCashOrBank && requestedRefund > maxRefundable + 0.001;
  const isRefundExceedingNet =
    isRefundModeCashOrBank && requestedRefund > modalNetTotal + 0.001;

  // Submit Sales Return
  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceId) {
      showFeedback('error', 'Please select a sales invoice');
      return;
    }

    if (!hasAnyReturnedQty) {
      showFeedback('error', 'Please enter returned quantity for at least one item');
      return;
    }

    if (isRefundExceedingPaid) {
      showFeedback(
        'error',
        `Refund payout (Rs. ${requestedRefund.toFixed(2)}) cannot exceed maximum paid refundable amount (Rs. ${maxRefundable.toFixed(2)}) for this invoice`,
      );
      return;
    }

    if (isRefundExceedingNet) {
      showFeedback(
        'error',
        `Refund payout (Rs. ${requestedRefund.toFixed(2)}) cannot exceed net return total (Rs. ${modalNetTotal.toFixed(2)})`,
      );
      return;
    }

    const payloadItems = Object.entries(itemRows)
      .filter(([_, row]) => row.returnedQuantity > 0 || row.bonusReturnedQuantity > 0)
      .map(([salesInvoiceItemId, row]) => ({
        salesInvoiceItemId,
        returnedQuantity: row.returnedQuantity,
        bonusReturnedQuantity: row.bonusReturnedQuantity || 0,
        stockCondition: row.stockCondition,
        destinationWarehouseId: row.destinationWarehouseId,
      }));

    const payload: CreateSalesReturnDto = {
      salesInvoiceId: selectedInvoiceId,
      returnDate: returnDate || undefined,
      reason: returnReason,
      refundMode,
      refundAmount: isRefundModeCashOrBank ? requestedRefund : undefined,
      notes: notes.trim() || undefined,
      items: payloadItems,
    };

    setIsSubmitting(true);
    try {
      const created = await salesReturnsApi.createSalesReturn(payload);
      showFeedback('success', `Sales return ${created.returnNumber} posted successfully`);
      setIsCreateModalOpen(false);
      resetForm();
      loadReturns();
      // View full voucher
      setViewingReturn(created);
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || 'Failed to post sales return');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedInvoiceId('');
    setReturnableData(null);
    setItemRows({});
    setReturnReason('CUSTOMER_RETURN');
    setRefundMode('CREDIT_ACCOUNT');
    setRefundAmountInput('');
    setNotes('');
    setReturnDate(new Date().toISOString().split('T')[0]);
  };

  // Cancel / Void Return
  const handleConfirmCancel = async () => {
    if (!cancellingReturn) return;
    if (!cancellationReason.trim() || cancellationReason.trim().length < 3) {
      showFeedback('error', 'Please provide a valid cancellation reason (min 3 characters)');
      return;
    }

    setIsCancelling(true);
    try {
      await salesReturnsApi.cancelSalesReturn(cancellingReturn.id, {
        cancellationReason: cancellationReason.trim(),
      });
      showFeedback(
        'success',
        `Sales return ${cancellingReturn.returnNumber} cancelled. Stock re-deducted and settlement restored.`,
      );
      setCancellingReturn(null);
      setCancellationReason('');
      loadReturns();
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || 'Failed to cancel sales return');
    } finally {
      setIsCancelling(false);
    }
  };

  // View full return details
  const handleViewReturn = async (ret: SalesReturn) => {
    try {
      const full = await salesReturnsApi.getSalesReturnById(ret.id);
      setViewingReturn(full);
    } catch {
      setViewingReturn(ret);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-lg border text-sm font-medium transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-950 border-emerald-800 text-emerald-100 shadow-emerald-950/40'
              : 'bg-rose-950 border-rose-800 text-rose-100 shadow-rose-950/40'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-charcoal-900">
                Sales Returns & Restocking
              </h1>
              <p className="text-xs text-charcoal-500 mt-0.5">
                Pharmaceutical return notes, quarantine routing, COGS margin reversal, and credit notes
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={loadReturns}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs text-charcoal-700 hover:text-charcoal-900"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>

          <Button
            size="sm"
            onClick={() => {
              resetForm();
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Record Sales Return</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border border-surface-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-charcoal-500">Total Returns Value</span>
            <span className="p-1.5 rounded-md bg-indigo-50 text-indigo-600">
              <RotateCcw className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-lg font-bold text-charcoal-900 tracking-tight">
            Rs. {summary.totalNetReturn.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-charcoal-400 mt-0.5">
            {totalRecords} return document{totalRecords !== 1 ? 's' : ''} recorded
          </p>
        </Card>

        <Card className="p-4 bg-white border border-surface-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-rose-600">Cash/Bank Refund Payouts</span>
            <span className="p-1.5 rounded-md bg-rose-50 text-rose-600">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-lg font-bold text-rose-700 tracking-tight">
            Rs. {summary.totalRefundAmount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-charcoal-400 mt-0.5">Disbursed cash refunds</p>
        </Card>

        <Card className="p-4 bg-white border border-surface-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-600">COGS Restored</span>
            <span className="p-1.5 rounded-md bg-emerald-50 text-emerald-600">
              <Package className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-lg font-bold text-emerald-700 tracking-tight">
            Rs. {summary.totalReversedCOGS.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-charcoal-400 mt-0.5">Physical cost restored to valuation</p>
        </Card>

        <Card className="p-4 bg-white border border-surface-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-600">Reversed Gross Margin</span>
            <span className="p-1.5 rounded-md bg-amber-50 text-amber-600">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-lg font-bold text-amber-700 tracking-tight">
            Rs. {summary.totalReversedProfit.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-charcoal-400 mt-0.5">Profit deduction adjustment</p>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="p-3.5 bg-white border border-surface-border shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 items-center">
          {/* Search Box */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Search return #, invoice #, customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs rounded-md border border-charcoal-200 bg-white px-2.5 py-2 text-charcoal-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="POSTED">Posted</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Reason Filter */}
          <div>
            <select
              value={reasonFilter}
              onChange={(e) => setReasonFilter(e.target.value)}
              className="w-full text-xs rounded-md border border-charcoal-200 bg-white px-2.5 py-2 text-charcoal-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Return Reasons</option>
              <option value="CUSTOMER_RETURN">Customer Return</option>
              <option value="DEFECTIVE_PRODUCT">Defective Product</option>
              <option value="DAMAGED_IN_TRANSIT">Damaged In Transit</option>
              <option value="EXPIRED_NEAR_EXPIRY">Expired / Near Expiry</option>
              <option value="WRONG_DISPENSATION">Wrong Dispensation</option>
              <option value="REGULATORY_RECALL">Regulatory Recall</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          {/* Refund Mode Filter */}
          <div>
            <select
              value={refundModeFilter}
              onChange={(e) => setRefundModeFilter(e.target.value)}
              className="w-full text-xs rounded-md border border-charcoal-200 bg-white px-2.5 py-2 text-charcoal-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Refund Modes</option>
              <option value="CREDIT_ACCOUNT">Credit Account (Receivable/Store Credit)</option>
              <option value="CASH_REFUND">Immediate Cash Refund</option>
              <option value="BANK_TRANSFER">Immediate Bank Transfer</option>
            </select>
          </div>

          {/* Date Range */}
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-xs py-1.5"
            />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-xs py-1.5"
            />
          </div>
        </div>
      </Card>

      {/* Sales Returns Table */}
      <Card className="overflow-hidden bg-white border border-surface-border shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-charcoal-700">
            <thead className="bg-surface-muted border-b border-surface-border text-charcoal-600 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-3.5">Return #</th>
                <th className="py-2.5 px-3.5">Date</th>
                <th className="py-2.5 px-3.5">Customer</th>
                <th className="py-2.5 px-3.5">Invoice Ref</th>
                <th className="py-2.5 px-3.5">Reason</th>
                <th className="py-2.5 px-3.5">Refund Mode</th>
                <th className="py-2.5 px-3.5 text-right">Net Return (PKR)</th>
                <th className="py-2.5 px-3.5 text-right">Refund Payout</th>
                <th className="py-2.5 px-3.5 text-center">Status</th>
                <th className="py-2.5 px-3.5">Posted By</th>
                <th className="py-2.5 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {isLoading ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-charcoal-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    <span>Loading sales returns register...</span>
                  </td>
                </tr>
              ) : returns.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-charcoal-400">
                    <RotateCcw className="w-8 h-8 mx-auto mb-2 text-charcoal-300 stroke-[1.5]" />
                    <p className="font-medium text-charcoal-600">No sales return documents found</p>
                    <p className="text-[11px] mt-0.5">
                      Process product returns and credit notes using "+ Record Sales Return" above
                    </p>
                  </td>
                </tr>
              ) : (
                returns.map((r) => {
                  const isCancelled = r.status === 'CANCELLED';
                  return (
                    <tr
                      key={r.id}
                      className={`hover:bg-surface-muted/60 transition-colors ${
                        isCancelled ? 'bg-rose-50/20 text-charcoal-400' : ''
                      }`}
                    >
                      <td className="py-3 px-3.5 font-semibold text-charcoal-900 whitespace-nowrap">
                        <span className="font-mono text-xs">{r.returnNumber}</span>
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap text-charcoal-600">
                        {new Date(r.returnDate).toLocaleDateString('en-PK', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="font-medium text-charcoal-900">
                          {r.customer?.name || 'Customer'}
                        </div>
                        <div className="text-[10px] font-mono text-charcoal-400">
                          {r.customer?.code}
                        </div>
                      </td>
                      <td className="py-3 px-3.5 font-mono text-charcoal-700 whitespace-nowrap">
                        {r.salesInvoice?.invoiceNumber || '-'}
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-charcoal-100 text-charcoal-700">
                          {r.reason.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap text-[11px]">
                        {r.refundMode === 'CREDIT_ACCOUNT' ? (
                          <span className="text-emerald-700 font-medium">Credit Account</span>
                        ) : (
                          <span className="text-rose-700 font-bold">
                            {r.refundMode.replace('_', ' ')}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-right font-bold text-charcoal-900 whitespace-nowrap">
                        Rs. {Number(r.netTotal).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3.5 text-right font-medium text-rose-700 whitespace-nowrap">
                        {Number(r.refundAmount) > 0 ? (
                          <span>
                            Rs.{' '}
                            {Number(r.refundAmount).toLocaleString('en-PK', {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        ) : (
                          <span className="text-charcoal-300">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            r.status === 'POSTED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap text-charcoal-600 text-[11px]">
                        {r.postedByUser?.displayName || r.postedByUser?.username || 'System'}
                      </td>
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewReturn(r)}
                            title="View / Print Credit Note"
                            className="p-1 h-7 w-7 text-charcoal-600 hover:text-indigo-600"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </Button>

                          {r.status === 'POSTED' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setCancellingReturn(r);
                                setCancellationReason('');
                              }}
                              title="Void / Cancel Return"
                              className="p-1 h-7 w-7 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-surface-border flex items-center justify-between text-xs text-charcoal-600">
            <div>
              Showing page <span className="font-semibold">{currentPage}</span> of{' '}
              <span className="font-semibold">{totalPages}</span> ({totalRecords} items)
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="text-xs"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* ========================================================================= */}
      {/* RECORD SALES RETURN MODAL */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-5xl max-h-[92vh] bg-white rounded-xl shadow-2xl border border-surface-border flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border bg-surface-muted/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-charcoal-900">
                    Record Sales Return / Credit Note
                  </h2>
                  <p className="text-xs text-charcoal-500">
                    Restock items into Standard or Quarantine warehouses and settle customer balance
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-charcoal-400 hover:text-charcoal-700 hover:bg-surface-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitReturn} className="flex flex-col flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">
                {/* 1. Select Invoice Header */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-charcoal-800 mb-1.5">
                      Select Sales Invoice <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={selectedInvoiceId}
                      onChange={(e) => setSelectedInvoiceId(e.target.value)}
                      required
                      className="w-full text-xs rounded-md border border-charcoal-300 bg-white px-3 py-2 text-charcoal-900 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                      <option value="">-- Choose Invoice to Return Against --</option>
                      {invoices.map((inv) => (
                        <option key={inv.id} value={inv.id}>
                          {inv.invoiceNumber} — {inv.customer?.name} (Net: Rs.{' '}
                          {Number(inv.netTotal).toFixed(2)}, Paid: Rs.{' '}
                          {Number(inv.paidAmount).toFixed(2)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-charcoal-800 mb-1.5">
                      Return Date <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      type="date"
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      required
                      className="text-xs"
                    />
                  </div>
                </div>

                {/* Invoice Settlement Snapshot Banner */}
                {returnableData && (
                  <div className="p-4 rounded-lg bg-surface-muted/60 border border-surface-border grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-charcoal-400 block">
                        Customer
                      </span>
                      <div className="font-bold text-charcoal-900">
                        {returnableData.invoice.customerName}
                      </div>
                      <span className="text-[11px] text-charcoal-500 font-mono">
                        {returnableData.invoice.customerCode}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-charcoal-400 block">
                        Invoice Total
                      </span>
                      <div className="font-bold text-charcoal-900">
                        Rs. {returnableData.invoice.netTotal.toFixed(2)}
                      </div>
                      <span className="text-[11px] text-emerald-700">
                        Paid: Rs. {returnableData.invoice.paidAmount.toFixed(2)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-charcoal-400 block">
                        Invoice Outstanding
                      </span>
                      <div className="font-bold text-rose-700">
                        Rs. {returnableData.invoice.balanceAmount.toFixed(2)}
                      </div>
                      <span className="text-[11px] text-charcoal-500">
                        Prior Refunds: Rs. {returnableData.invoice.priorRefunds.toFixed(2)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-indigo-600 block">
                        Max Refundable Cash
                      </span>
                      <div className="font-bold text-indigo-700">
                        Rs. {returnableData.invoice.maxRefundableAmount.toFixed(2)}
                      </div>
                      <span className="text-[10px] text-charcoal-400">
                        (Restricted to paid tender)
                      </span>
                    </div>
                  </div>
                )}

                {/* 2. Return Configuration (Reason & Refund Mode) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4 rounded-lg bg-surface-muted/30 border border-surface-border">
                  <div>
                    <label className="block text-xs font-semibold text-charcoal-800 mb-1.5">
                      Return Reason <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={returnReason}
                      onChange={(e) => setReturnReason(e.target.value as ReturnReason)}
                      className="w-full text-xs rounded-md border border-charcoal-300 bg-white px-3 py-2 text-charcoal-900 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                      <option value="CUSTOMER_RETURN">Customer Return</option>
                      <option value="DEFECTIVE_PRODUCT">Defective Product</option>
                      <option value="DAMAGED_IN_TRANSIT">Damaged In Transit</option>
                      <option value="EXPIRED_NEAR_EXPIRY">Expired / Near Expiry</option>
                      <option value="WRONG_DISPENSATION">Wrong Dispensation</option>
                      <option value="REGULATORY_RECALL">Regulatory Recall</option>
                      <option value="OTHER">Other Reason</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-charcoal-800 mb-1.5">
                      Refund Mode <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={refundMode}
                      onChange={(e) => setRefundMode(e.target.value as ReturnRefundMode)}
                      className="w-full text-xs rounded-md border border-charcoal-300 bg-white px-3 py-2 text-charcoal-900 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                      <option value="CREDIT_ACCOUNT">Credit Account (Invoice Offset / Store Credit)</option>
                      <option value="CASH_REFUND">Immediate Cash Refund Payout</option>
                      <option value="BANK_TRANSFER">Immediate Bank Transfer Payout</option>
                    </select>
                  </div>

                  {isRefundModeCashOrBank && (
                    <div>
                      <label className="block text-xs font-semibold text-charcoal-800 mb-1.5">
                        Refund Payout (PKR) <span className="text-rose-500">*</span>
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={maxRefundable}
                        placeholder={modalNetTotal > 0 ? modalNetTotal.toFixed(2) : '0.00'}
                        value={refundAmountInput}
                        onChange={(e) => setRefundAmountInput(e.target.value)}
                        required
                        className="text-xs font-bold text-rose-700"
                      />
                      <span className="text-[10px] text-charcoal-500 block mt-1">
                        Max allowable: <strong>Rs. {maxRefundable.toFixed(2)}</strong>
                      </span>
                    </div>
                  )}
                </div>

                {isRefundExceedingPaid && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>
                      Requested refund payout (Rs. {requestedRefund.toFixed(2)}) exceeds allowable cash
                      collected on invoice (Rs. {maxRefundable.toFixed(2)}). Unpaid balance cannot be
                      refunded in cash.
                    </span>
                  </div>
                )}

                {/* 3. Returnable Line Items Grid */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal-800">
                    Return Line Items & Restocking Locations
                  </h3>

                  {loadingReturnable ? (
                    <div className="py-12 text-center text-charcoal-400 border rounded-lg border-dashed">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                      <span className="text-xs">Loading returnable invoice lines...</span>
                    </div>
                  ) : !returnableData ? (
                    <div className="p-6 rounded-lg bg-surface-muted/40 border border-surface-border text-center text-charcoal-500 text-xs">
                      <Info className="w-5 h-5 mx-auto mb-1 text-charcoal-400" />
                      Please select a sales invoice above to view returnable product lines
                    </div>
                  ) : (
                    <div className="border border-surface-border rounded-lg overflow-x-auto">
                      <table className="w-full text-left text-xs text-charcoal-700 min-w-[750px]">
                        <thead className="bg-surface-muted text-charcoal-600 font-semibold uppercase tracking-wider text-[10px]">
                          <tr>
                            <th className="py-2.5 px-3">Product & Batch</th>
                            <th className="py-2.5 px-3 text-center">Billed / Bonus</th>
                            <th className="py-2.5 px-3 text-center">Available to Return</th>
                            <th className="py-2.5 px-3 text-right w-24">Return Billed</th>
                            <th className="py-2.5 px-3 text-right w-24">Return Bonus</th>
                            <th className="py-2.5 px-3 w-32">Condition</th>
                            <th className="py-2.5 px-3 w-40">Restock Warehouse</th>
                            <th className="py-2.5 px-3 text-right">Line Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-border">
                          {returnableData.items.map((item) => {
                            const row = itemRows[item.id] || {
                              returnedQuantity: 0,
                              bonusReturnedQuantity: 0,
                              stockCondition: 'SALEABLE' as ReturnedStockCondition,
                              destinationWarehouseId: '',
                            };

                            const availableWarehouses = warehouses.filter((w) =>
                              row.stockCondition === 'SALEABLE'
                                ? w.warehouseType === 'STANDARD'
                                : w.warehouseType === 'QUARANTINE',
                            );

                            const lineGross = row.returnedQuantity * item.unitPrice;
                            const lineDisc = lineGross * (item.discountPercentage / 100);
                            const lineTotal = lineGross - lineDisc;

                            return (
                              <tr key={item.id} className="hover:bg-surface-muted/30">
                                <td className="py-2.5 px-3">
                                  <div className="font-bold text-charcoal-900">
                                    {item.productName}
                                  </div>
                                  <div className="text-[10px] font-mono text-charcoal-500">
                                    Batch: {item.batchNumber} | Exp:{' '}
                                    {new Date(item.expiryDate).toLocaleDateString()}
                                    {item.isExpired && (
                                      <span className="text-rose-600 font-bold ml-1">
                                        (EXPIRED)
                                      </span>
                                    )}
                                  </div>
                                </td>

                                <td className="py-2.5 px-3 text-center font-mono text-charcoal-600">
                                  {item.billedQuantity} / +{item.bonusQuantity}
                                </td>

                                <td className="py-2.5 px-3 text-center font-mono font-bold text-indigo-700">
                                  {item.availableBilled} / +{item.availableBonus}
                                </td>

                                <td className="py-2.5 px-3 text-right">
                                  <input
                                    type="number"
                                    min="0"
                                    max={item.availableBilled}
                                    value={row.returnedQuantity || ''}
                                    onChange={(e) =>
                                      handleQtyChange(
                                        item.id,
                                        'returnedQuantity',
                                        e.target.value,
                                        item.availableBilled,
                                      )
                                    }
                                    placeholder="0"
                                    className="w-full text-right text-xs py-1 px-1.5 border rounded border-charcoal-300 font-bold text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                  />
                                </td>

                                <td className="py-2.5 px-3 text-right">
                                  <input
                                    type="number"
                                    min="0"
                                    max={item.availableBonus}
                                    value={row.bonusReturnedQuantity || ''}
                                    onChange={(e) =>
                                      handleQtyChange(
                                        item.id,
                                        'bonusReturnedQuantity',
                                        e.target.value,
                                        item.availableBonus,
                                      )
                                    }
                                    placeholder="0"
                                    className="w-full text-right text-xs py-1 px-1.5 border rounded border-charcoal-300 font-bold text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                  />
                                </td>

                                <td className="py-2.5 px-3">
                                  <select
                                    value={row.stockCondition}
                                    disabled={!item.canReturnAsSaleable}
                                    onChange={(e) =>
                                      handleConditionChange(
                                        item.id,
                                        e.target.value as ReturnedStockCondition,
                                      )
                                    }
                                    className="w-full text-[11px] rounded border border-charcoal-300 bg-white py-1 px-1.5 text-charcoal-900 font-medium disabled:bg-surface-muted disabled:text-charcoal-400"
                                  >
                                    {item.canReturnAsSaleable && (
                                      <option value="SALEABLE">SALEABLE (Resale)</option>
                                    )}
                                    <option value="QUARANTINED">QUARANTINED</option>
                                  </select>
                                </td>

                                <td className="py-2.5 px-3">
                                  <select
                                    value={row.destinationWarehouseId}
                                    onChange={(e) =>
                                      handleWarehouseChange(item.id, e.target.value)
                                    }
                                    required={row.returnedQuantity > 0 || row.bonusReturnedQuantity > 0}
                                    className="w-full text-[11px] rounded border border-charcoal-300 bg-white py-1 px-1.5 text-charcoal-900 font-medium"
                                  >
                                    <option value="">-- Warehouse --</option>
                                    {availableWarehouses.map((w) => (
                                      <option key={w.id} value={w.id}>
                                        {w.name} ({w.warehouseType})
                                      </option>
                                    ))}
                                  </select>
                                </td>

                                <td className="py-2.5 px-3 text-right font-bold text-charcoal-900">
                                  Rs. {lineTotal.toFixed(2)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Commercial Summary Banner */}
                  <div className="p-4 rounded-lg bg-surface-card border border-surface-border grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-charcoal-400 block">
                        Net Return Credit
                      </span>
                      <span className="text-base font-bold text-charcoal-900">
                        Rs. {modalNetTotal.toFixed(2)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-semibold text-emerald-600 block">
                        COGS Restored
                      </span>
                      <span className="text-base font-bold text-emerald-700">
                        Rs. {modalCostTotal.toFixed(2)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-semibold text-amber-600 block">
                        Gross Margin Reversed
                      </span>
                      <span className="text-base font-bold text-amber-700">
                        Rs. {modalProfitReversed.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold text-charcoal-800 mb-1.5">
                    Return Remarks / Quality Notes
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. Batch damaged during logistics shipment, sealed bottles quarantined"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-surface-border bg-surface-muted/40 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={isSubmitting}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={
                    isSubmitting ||
                    !hasAnyReturnedQty ||
                    isRefundExceedingPaid ||
                    isRefundExceedingNet
                  }
                  className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      Posting Return...
                    </>
                  ) : (
                    'Post Sales Return & Credit Note'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VOUCHER / CREDIT NOTE PRINT PREVIEW MODAL */}
      {/* ========================================================================= */}
      {viewingReturn && (
        <DocumentPrintModal
          isOpen={true}
          onClose={() => setViewingReturn(null)}
          title={`Sales Return Credit Note — ${viewingReturn.returnNumber}`}
          subtitle={`Customer: ${viewingReturn.customer?.name || 'Customer'} • Date: ${new Date(viewingReturn.returnDate).toLocaleDateString('en-GB')}`}
          defaultLayout="A4"
          allowThermalToggle={true}
        >
          {(layout) => {
            const printableData: PrintableSalesReturn = {
              returnNumber: viewingReturn.returnNumber,
              returnDate: new Date(viewingReturn.returnDate).toLocaleDateString('en-GB'),
              originalInvoiceNumber: viewingReturn.salesInvoice?.invoiceNumber || null,
              originalInvoiceDate: viewingReturn.salesInvoice?.invoiceDate
                ? new Date(viewingReturn.salesInvoice.invoiceDate).toLocaleDateString('en-GB')
                : null,
              status: viewingReturn.status,
              customer: {
                name: viewingReturn.customer?.name || 'Walk-in Customer',
                code: viewingReturn.customer?.code || null,
                address: viewingReturn.customer?.address || null,
                city: viewingReturn.customer?.city || null,
                phone: viewingReturn.customer?.phone || null,
              },
              lines: (viewingReturn.items || []).map((it, idx) => ({
                itemNumber: idx + 1,
                sku: it.product?.sku || '',
                productName: it.product?.name || 'Unknown Product',
                batchNumber: it.batchNumber || '',
                expiryDate: it.expiryDate
                  ? new Date(it.expiryDate).toLocaleDateString('en-GB')
                  : '',
                quantity: Number(it.returnedQuantity || 0),
                bonusQuantity: Number(it.bonusReturnedQuantity || 0),
                unitPrice: Number(it.unitPrice || 0),
                reason: viewingReturn.reason?.replace('_', ' ') || null,
                lineTotal: Number(it.lineTotal || 0),
              })),
              subtotal: Number(viewingReturn.subtotal || viewingReturn.netTotal || 0),
              totalTax: Number(viewingReturn.taxAmount || 0),
              totalCreditAmount: Number(viewingReturn.netTotal || 0),
              reason: viewingReturn.reason?.replace('_', ' ') || null,
              approvedBy: viewingReturn.postedByUser?.displayName || null,
              footerNotes: settingsMap['sales_return_footer_notes'] || null,
            };

            return (
              <SalesReturnPrintTemplate
                salesReturn={printableData}
                company={company}
                layout={layout}
              />
            );
          }}
        </DocumentPrintModal>
      )}

      {/* ========================================================================= */}
      {/* CANCELLATION / VOID MODAL */}
      {/* ========================================================================= */}
      {cancellingReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-surface-border overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 text-rose-600 mb-3">
                <div className="p-2 rounded-lg bg-rose-50 border border-rose-100">
                  <Ban className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-charcoal-900">
                    Void Sales Return Document
                  </h3>
                  <p className="text-xs text-charcoal-500">
                    Return #{cancellingReturn.returnNumber}
                  </p>
                </div>
              </div>

              <p className="text-xs text-charcoal-600 mb-4">
                Voiding this return will verify that returned stock is still physically present in the exact
                destination warehouse, deduct the stock, and recalculate customer invoice settlement balances.
              </p>

              <div className="mb-4">
                <label className="block text-xs font-semibold text-charcoal-800 mb-1.5">
                  Cancellation Reason <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Return rejected by quality head, invoice re-opened"
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  className="text-xs"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-surface-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCancellingReturn(null)}
                  disabled={isCancelling}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  onClick={handleConfirmCancel}
                  disabled={isCancelling || !cancellationReason.trim()}
                  className="text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold"
                >
                  {isCancelling ? 'Voiding...' : 'Confirm Void'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
