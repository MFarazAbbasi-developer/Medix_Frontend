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
  TrendingDown,
  Info,
  Package,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import {
  purchaseReturnsApi,
  PurchaseReturn,
  ReturnableGrnResponse,
  PurchaseReturnReason,
  ReturnedStockCondition,
  PurchaseReturnStatus,
  purchasingApi,
  GoodsReceiveNote,
  warehousesApi,
  Warehouse,
} from '../api';

const REASON_LABELS: Record<PurchaseReturnReason, string> = {
  DAMAGED_IN_TRANSIT: 'Damaged in Transit',
  DEFECTIVE: 'Defective / Quality Issue',
  SHORT_EXPIRY: 'Short Expiry (< 6 Mos)',
  EXPIRED: 'Expired Product',
  EXCESS_STOCK: 'Excess / Overstock',
  WRONG_ITEM: 'Wrong Item Received',
  RECALLED_BATCH: 'Regulatory Recall',
  COMMERCIAL_RETURN: 'Commercial Return',
  OTHER: 'Other / Discrepancy',
};

export const PurchaseReturnsPage: React.FC = () => {
  const [returns, setReturns] = useState<PurchaseReturn[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [reasonFilter, setReasonFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Pagination & Aggregates
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalSum, setTotalSum] = useState<number>(0);

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
  const [grns, setGrns] = useState<GoodsReceiveNote[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  // Create Return Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [selectedGrnId, setSelectedGrnId] = useState<string>('');
  const [returnableData, setReturnableData] = useState<ReturnableGrnResponse | null>(null);
  const [loadingReturnable, setLoadingReturnable] = useState<boolean>(false);

  // Form State
  const [returnDate, setReturnDate] = useState<string>(
    new Date().toISOString().split('T')[0],
  );
  const [returnReason, setReturnReason] = useState<PurchaseReturnReason>('DAMAGED_IN_TRANSIT');
  const [notes, setNotes] = useState<string>('');
  const [itemRows, setItemRows] = useState<
    Record<
      string,
      {
        returnedQuantity: number;
        bonusReturnedQuantity: number;
        stockCondition: ReturnedStockCondition;
        sourceWarehouseId: string;
      }
    >
  >({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // View / Print Voucher Modal State
  const [viewingReturn, setViewingReturn] = useState<PurchaseReturn | null>(null);
  const [printLayout, setPrintLayout] = useState<'A4' | 'THERMAL'>('A4');

  // Cancel Modal State
  const [cancellingReturn, setCancellingReturn] = useState<PurchaseReturn | null>(null);
  const [cancellationReason, setCancellationReason] = useState<string>('');
  const [isCancelling, setIsCancelling] = useState<boolean>(false);

  // Load returns register
  const loadReturns = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await purchaseReturnsApi.getPurchaseReturns({
        search: search.trim() || undefined,
        reason: reasonFilter !== 'ALL' ? (reasonFilter as PurchaseReturnReason) : undefined,
        status: statusFilter !== 'ALL' ? (statusFilter as PurchaseReturnStatus) : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page: currentPage,
        limit: 20,
      });
      setReturns(res.items || []);
      setTotalRecords(res.total || 0);
      setTotalPages(res.totalPages || 1);
      setTotalSum(res.summary?.totalNetReturn || 0);
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || 'Failed to load purchase returns');
    } finally {
      setIsLoading(false);
    }
  }, [search, reasonFilter, statusFilter, startDate, endDate, currentPage]);

  // Load Initial directory data
  useEffect(() => {
    loadReturns();
  }, [loadReturns]);

  useEffect(() => {
    const fetchDirectories = async () => {
      try {
        const [grnRes, whRes] = await Promise.all([
          purchasingApi.getGoodsReceiveNotes({ status: 'POSTED', limit: 100 }),
          warehousesApi.getWarehouses(),
        ]);
        setGrns((grnRes as any).items || (grnRes as any).data || (Array.isArray(grnRes) ? grnRes : []));
        setWarehouses(Array.isArray(whRes) ? whRes : (whRes as any).items || (whRes as any).data || []);
      } catch (err) {
        console.error('Failed to load initial directories for returns', err);
      }
    };
    fetchDirectories();
  }, []);

  // Fetch returnable GRN details when selected in create modal
  useEffect(() => {
    if (!selectedGrnId) {
      setReturnableData(null);
      setItemRows({});
      return;
    }
    const fetchDetails = async () => {
      setLoadingReturnable(true);
      try {
        const data = await purchaseReturnsApi.getReturnableGrn(selectedGrnId);
        setReturnableData(data);

        // Find standard and quarantine warehouses
        const defaultStdWh = warehouses.find((w) => w.warehouseType === 'STANDARD') || warehouses[0];
        const defaultQuarWh = warehouses.find((w) => w.warehouseType === 'QUARANTINE') || warehouses[0];

        // Initialize item rows with 0 quantity
        const initialRows: Record<
          string,
          {
            returnedQuantity: number;
            bonusReturnedQuantity: number;
            stockCondition: ReturnedStockCondition;
            sourceWarehouseId: string;
          }
        > = {};

        data.items.forEach((item) => {
          const condition: ReturnedStockCondition = item.canReturnAsSaleable ? 'SALEABLE' : 'QUARANTINED';
          const whId = condition === 'QUARANTINED' ? defaultQuarWh?.id || '' : defaultStdWh?.id || '';

          initialRows[item.id] = {
            returnedQuantity: 0,
            bonusReturnedQuantity: 0,
            stockCondition: condition,
            sourceWarehouseId: whId,
          };
        });
        setItemRows(initialRows);
      } catch (err: any) {
        showFeedback('error', err.response?.data?.message || 'Failed to load returnable items for GRN');
      } finally {
        setLoadingReturnable(false);
      }
    };
    fetchDetails();
  }, [selectedGrnId, warehouses]);

  // Helper calculations for return creation
  const calculatedReturnTotals = () => {
    if (!returnableData) return { subtotal: 0, discount: 0, tax: 0, netTotal: 0, count: 0 };
    let subtotal = 0;
    let discount = 0;
    let tax = 0;
    let netTotal = 0;
    let count = 0;

    returnableData.items.forEach((item) => {
      const row = itemRows[item.id];
      if (!row) return;
      const billedQty = row.returnedQuantity || 0;
      const bonusQty = row.bonusReturnedQuantity || 0;

      if (billedQty > 0 || bonusQty > 0) {
        count++;
        const gross = billedQty * item.unitCost;
        const discAmt = (gross * item.discountPercentage) / 100;
        const taxable = gross - discAmt;
        const taxAmt = (taxable * item.taxPercentage) / 100;
        const lineTotal = taxable + taxAmt;

        subtotal += gross;
        discount += discAmt;
        tax += taxAmt;
        netTotal += lineTotal;
      }
    });

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      discount: Math.round(discount * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      netTotal: Math.round(netTotal * 100) / 100,
      count,
    };
  };

  const handleRowChange = (
    itemId: string,
    field: 'returnedQuantity' | 'bonusReturnedQuantity' | 'stockCondition' | 'sourceWarehouseId',
    value: any,
  ) => {
    setItemRows((prev) => {
      const current = prev[itemId] || {
        returnedQuantity: 0,
        bonusReturnedQuantity: 0,
        stockCondition: 'SALEABLE',
        sourceWarehouseId: '',
      };

      const updated = { ...current, [field]: value };

      // If condition changed to QUARANTINED, switch warehouse to quarantine if standard was chosen
      if (field === 'stockCondition') {
        const targetType = value === 'QUARANTINED' ? 'QUARANTINE' : 'STANDARD';
        const currentWh = warehouses.find((w) => w.id === updated.sourceWarehouseId);
        if (currentWh && currentWh.warehouseType !== targetType) {
          const matchingWh = warehouses.find((w) => w.warehouseType === targetType);
          if (matchingWh) updated.sourceWarehouseId = matchingWh.id;
        }
      }

      return {
        ...prev,
        [itemId]: updated,
      };
    });
  };

  const handleCreateReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGrnId) {
      showFeedback('error', 'Please select a posted GRN');
      return;
    }

    const { netTotal, count } = calculatedReturnTotals();
    if (count === 0 || netTotal <= 0) {
      showFeedback('error', 'Please specify at least one return quantity greater than 0');
      return;
    }

    // Build items payload
    const itemsPayload: Array<{
      grnItemId: string;
      sourceWarehouseId: string;
      returnedQuantity: number;
      bonusReturnedQuantity: number;
      stockCondition: ReturnedStockCondition;
    }> = [];

    for (const [itemId, row] of Object.entries(itemRows)) {
      if ((row.returnedQuantity || 0) > 0 || (row.bonusReturnedQuantity || 0) > 0) {
        if (!row.sourceWarehouseId) {
          showFeedback('error', 'Please select a source warehouse for all returning lines');
          return;
        }
        itemsPayload.push({
          grnItemId: itemId,
          sourceWarehouseId: row.sourceWarehouseId,
          returnedQuantity: Number(row.returnedQuantity) || 0,
          bonusReturnedQuantity: Number(row.bonusReturnedQuantity) || 0,
          stockCondition: row.stockCondition,
        });
      }
    }

    setIsSubmitting(true);
    try {
      const created = await purchaseReturnsApi.createPurchaseReturn({
        grnId: selectedGrnId,
        reason: returnReason,
        returnDate,
        notes: notes.trim() || undefined,
        items: itemsPayload,
      });

      showFeedback('success', `Purchase Return ${created.returnNumber} posted successfully!`);
      setIsCreateModalOpen(false);
      setSelectedGrnId('');
      setReturnableData(null);
      setItemRows({});
      setNotes('');
      loadReturns();
      setViewingReturn(created);
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || 'Failed to create purchase return');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingReturn) return;
    if (!cancellationReason.trim()) {
      showFeedback('error', 'Cancellation reason is required');
      return;
    }

    setIsCancelling(true);
    try {
      await purchaseReturnsApi.cancelPurchaseReturn(cancellingReturn.id, {
        cancellationReason: cancellationReason.trim(),
      });
      showFeedback(
        'success',
        `Purchase Return ${cancellingReturn.returnNumber} voided and stock re-entered successfully`,
      );
      setCancellingReturn(null);
      setCancellationReason('');
      loadReturns();
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || 'Failed to cancel purchase return');
    } finally {
      setIsCancelling(false);
    }
  };

  const totals = calculatedReturnTotals();

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl border text-sm font-medium transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-700/60 shadow-emerald-950/40'
              : 'bg-rose-950/90 text-rose-200 border-rose-700/60 shadow-rose-950/40'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span>{feedback.message}</span>
          <button
            onClick={() => setFeedback(null)}
            className="ml-2 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <RotateCcw className="w-7 h-7 text-indigo-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white">Purchase Returns & Debit Notes</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Supplier return processing, physical warehouse restocking reversal, and supplier ledger debit note reconciliation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={loadReturns}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30"
          >
            <Plus className="w-4 h-4" />
            New Purchase Return
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-slate-900/60 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Debit Note Value
            </span>
            <TrendingDown className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">
            Rs. {totalSum.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-xs text-slate-500 mt-1 block">Active supplier debit offsets</span>
        </Card>

        <Card className="p-4 bg-slate-900/60 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Returns Count
            </span>
            <RotateCcw className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">{totalRecords}</p>
          <span className="text-xs text-slate-500 mt-1 block">Registered return vouchers</span>
        </Card>

        <Card className="p-4 bg-slate-900/60 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Posted & Active
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-2">
            {returns.filter((r) => r.status === 'POSTED').length}
          </p>
          <span className="text-xs text-slate-500 mt-1 block">Active on supplier ledger</span>
        </Card>

        <Card className="p-4 bg-slate-900/60 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Cancelled / Reverted
            </span>
            <Ban className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-400 mt-2">
            {returns.filter((r) => r.status === 'CANCELLED').length}
          </p>
          <span className="text-xs text-slate-500 mt-1 block">Compensated stock re-entry</span>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 bg-slate-900/60 border-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <Input
              placeholder="Search Return #, Supplier, GRN #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-slate-950/70 border-slate-800"
            />
          </div>

          <div>
            <select
              value={reasonFilter}
              onChange={(e) => setReasonFilter(e.target.value)}
              className="w-full h-10 px-3 rounded-md bg-slate-950/70 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Return Reasons</option>
              {Object.entries(REASON_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-10 px-3 rounded-md bg-slate-950/70 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="POSTED">POSTED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-950/70 border-slate-800 text-xs"
              placeholder="Start"
            />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-950/70 border-slate-800 text-xs"
              placeholder="End"
            />
          </div>
        </div>
      </Card>

      {/* Returns Register Table */}
      <Card className="bg-slate-900/60 border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Return #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">GRN Ref</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4 text-right">Subtotal</th>
                <th className="py-3 px-4 text-right">Tax / Disc</th>
                <th className="py-3 px-4 text-right">Net Debit (PKR)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
                      <span>Loading purchase returns register...</span>
                    </div>
                  </td>
                </tr>
              ) : returns.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    <Package className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                    <p className="text-base font-medium text-slate-400">No purchase returns recorded</p>
                    <p className="text-xs text-slate-600 mt-1">
                      Issue a new purchase return against a posted GRN to debit vendor payable and deduct stock.
                    </p>
                  </td>
                </tr>
              ) : (
                returns.map((ret) => {
                  const isPosted = ret.status === 'POSTED';
                  return (
                    <tr key={ret.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-indigo-300">
                        {ret.returnNumber}
                      </td>
                      <td className="py-3 px-4 text-slate-300 text-xs">
                        {new Date(ret.returnDate).toLocaleDateString('en-GB')}
                      </td>
                      <td className="py-3 px-4 text-white font-medium">
                        {ret.supplier?.name || 'N/A'}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-400">
                        {ret.grn?.grnNumber || 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {REASON_LABELS[ret.reason] || ret.reason}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-400 text-xs">
                        Rs. {Number(ret.subtotal).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-500 text-xs">
                        {Number(ret.taxAmount) > 0 ? `+${Number(ret.taxAmount)}` : ''}
                        {Number(ret.discountAmount) > 0 ? ` -${Number(ret.discountAmount)}` : ''}
                        {Number(ret.taxAmount) === 0 && Number(ret.discountAmount) === 0 ? '-' : ''}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-rose-400">
                        Rs. {Number(ret.netTotal).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                            isPosted
                              ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700/60'
                              : 'bg-rose-950/70 text-rose-300 border-rose-700/60'
                          }`}
                        >
                          {ret.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setViewingReturn(ret)}
                            title="View / Print Voucher"
                            className="p-1.5 rounded-md hover:bg-slate-700 text-slate-300 hover:text-white transition"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          {isPosted && (
                            <button
                              onClick={() => {
                                setCancellingReturn(ret);
                                setCancellationReason('');
                              }}
                              title="Cancel / Void Return"
                              className="p-1.5 rounded-md hover:bg-rose-950/50 text-rose-400 hover:text-rose-300 transition"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
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

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              Showing page {currentPage} of {totalPages} ({totalRecords} total returns)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Modal 1: Create Purchase Return */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-5xl my-8 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-indigo-400" />
                <h2 className="text-lg font-bold text-white">Create Purchase Return & Debit Note</h2>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateReturn} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Step 1: Select GRN */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5 md:col-span-1">
                  <label htmlFor="select-grn-input" className="text-xs font-semibold uppercase text-slate-300">
                    Select Posted GRN *
                  </label>
                  <select
                    id="select-grn-input"
                    aria-label="Select Posted GRN"
                    value={selectedGrnId}
                    onChange={(e) => setSelectedGrnId(e.target.value)}
                    required
                    className="w-full h-10 px-3 rounded-md bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Choose Posted GRN --</option>
                    {grns.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.grnNumber} - {g.supplier?.name} (Rs. {Number(g.netTotal).toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-slate-300">
                    Return Date *
                  </label>
                  <Input
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    required
                    className="bg-slate-950 border-slate-700 text-white text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-slate-300">
                    Return Reason *
                  </label>
                  <select
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value as PurchaseReturnReason)}
                    required
                    className="w-full h-10 px-3 rounded-md bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    {Object.entries(REASON_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* GRN & Supplier Banner */}
              {returnableData && (
                <div className="p-4 rounded-lg bg-indigo-950/20 border border-indigo-800/40 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block">Supplier</span>
                    <span className="font-bold text-white text-sm">
                      {returnableData.grn.supplierName} ({returnableData.grn.supplierCode})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">GRN Total</span>
                    <span className="font-mono font-semibold text-slate-200 text-sm">
                      Rs. {returnableData.grn.netTotal.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Outstanding Balance</span>
                    <span className="font-mono font-bold text-amber-400 text-sm">
                      Rs. {returnableData.grn.balanceAmount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Settled / Paid Amount</span>
                    <span className="font-mono font-semibold text-emerald-400 text-sm">
                      Rs. {returnableData.grn.paidAmount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}

              {/* Step 2: Line Items Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide">
                    Returnable Line Items ({returnableData?.items.length || 0})
                  </h3>
                  <span className="text-xs text-slate-400">
                    Specify returning units. SALEABLE items deduct from Standard warehouse; QUARANTINED deduct from Quarantine warehouse.
                  </span>
                </div>

                {loadingReturnable ? (
                  <div className="py-12 text-center text-slate-500 border border-slate-800 rounded-lg">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-400 mb-2" />
                    <p>Loading GRN line item snapshots...</p>
                  </div>
                ) : !returnableData ? (
                  <div className="py-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-lg">
                    <Info className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    <p>Please select a GRN above to populate returnable batches.</p>
                  </div>
                ) : (
                  <div className="border border-slate-800 rounded-lg overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase">
                          <th className="py-2.5 px-3">Product & Batch</th>
                          <th className="py-2.5 px-3">Expiry</th>
                          <th className="py-2.5 px-3 text-right">Received / Max</th>
                          <th className="py-2.5 px-3 text-right">Unit Cost</th>
                          <th className="py-2.5 px-3">Return Billed Qty</th>
                          <th className="py-2.5 px-3">Return Bonus Qty</th>
                          <th className="py-2.5 px-3">Condition</th>
                          <th className="py-2.5 px-3">Source Warehouse</th>
                          <th className="py-2.5 px-3 text-right">Line Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {returnableData.items.map((item) => {
                          const row = itemRows[item.id] || {
                            returnedQuantity: 0,
                            bonusReturnedQuantity: 0,
                            stockCondition: 'SALEABLE',
                            sourceWarehouseId: '',
                          };

                          const billedQty = row.returnedQuantity || 0;
                          const gross = billedQty * item.unitCost;
                          const discAmt = (gross * item.discountPercentage) / 100;
                          const taxable = gross - discAmt;
                          const taxAmt = (taxable * item.taxPercentage) / 100;
                          const lineTotal = taxable + taxAmt;

                          const filteredWhs = warehouses.filter((w) =>
                            row.stockCondition === 'QUARANTINED'
                              ? w.warehouseType === 'QUARANTINE'
                              : w.warehouseType === 'STANDARD',
                          );

                          return (
                            <tr
                              key={item.id}
                              className={`hover:bg-slate-800/30 ${
                                billedQty > 0 || (row.bonusReturnedQuantity || 0) > 0
                                  ? 'bg-indigo-950/10'
                                  : ''
                              }`}
                            >
                              <td className="py-3 px-3">
                                <span className="font-semibold text-white block">{item.productName}</span>
                                <span className="text-[11px] font-mono text-slate-400">
                                  Batch: {item.batchNumber} | SKU: {item.productSku}
                                </span>
                              </td>
                              <td className="py-3 px-3 whitespace-nowrap">
                                <span
                                  className={`text-[11px] font-mono ${
                                    item.isExpired ? 'text-rose-400 font-bold' : 'text-slate-300'
                                  }`}
                                >
                                  {new Date(item.expiryDate).toLocaleDateString('en-GB')}
                                  {item.isExpired && ' (EXPIRED)'}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right font-mono text-slate-300 whitespace-nowrap">
                                <div>Billed: {item.availableBilled} / {item.receivedQuantity}</div>
                                {item.bonusQuantity > 0 && (
                                  <div className="text-slate-500 text-[10px]">
                                    Bonus: {item.availableBonus} / {item.bonusQuantity}
                                  </div>
                                )}
                              </td>
                              <td className="py-3 px-3 text-right font-mono text-slate-300 whitespace-nowrap">
                                Rs. {item.unitCost.toFixed(2)}
                              </td>
                              <td className="py-3 px-3 w-28">
                                <input
                                  type="number"
                                  min={0}
                                  max={item.availableBilled}
                                  value={row.returnedQuantity || ''}
                                  placeholder="0"
                                  onChange={(e) =>
                                    handleRowChange(
                                      item.id,
                                      'returnedQuantity',
                                      Math.min(item.availableBilled, Math.max(0, parseInt(e.target.value) || 0)),
                                    )
                                  }
                                  className="w-full h-8 px-2 rounded bg-slate-950 border border-slate-700 text-right text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                                />
                              </td>
                              <td className="py-3 px-3 w-28">
                                <input
                                  type="number"
                                  min={0}
                                  max={item.availableBonus}
                                  value={row.bonusReturnedQuantity || ''}
                                  placeholder="0"
                                  disabled={item.availableBonus <= 0}
                                  onChange={(e) =>
                                    handleRowChange(
                                      item.id,
                                      'bonusReturnedQuantity',
                                      Math.min(item.availableBonus, Math.max(0, parseInt(e.target.value) || 0)),
                                    )
                                  }
                                  className="w-full h-8 px-2 rounded bg-slate-950 border border-slate-700 text-right text-white font-mono text-xs focus:outline-none focus:border-indigo-500 disabled:opacity-40"
                                />
                              </td>
                              <td className="py-3 px-3 w-36">
                                <select
                                  value={row.stockCondition}
                                  disabled={!item.canReturnAsSaleable}
                                  onChange={(e) =>
                                    handleRowChange(item.id, 'stockCondition', e.target.value as ReturnedStockCondition)
                                  }
                                  className="w-full h-8 px-2 rounded bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                                >
                                  {item.canReturnAsSaleable && <option value="SALEABLE">SALEABLE</option>}
                                  <option value="QUARANTINED">QUARANTINED</option>
                                </select>
                              </td>
                              <td className="py-3 px-3 w-44">
                                <select
                                  value={row.sourceWarehouseId}
                                  onChange={(e) =>
                                    handleRowChange(item.id, 'sourceWarehouseId', e.target.value)
                                  }
                                  className="w-full h-8 px-2 rounded bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                                >
                                  {filteredWhs.map((w) => (
                                    <option key={w.id} value={w.id}>
                                      {w.name} ({w.code})
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="py-3 px-3 text-right font-mono font-bold text-rose-400 whitespace-nowrap">
                                Rs. {lineTotal.toFixed(2)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Step 3: Notes & Settlement Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-800">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-slate-300">
                    Return Notes / Discrepancy Details
                  </label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter return notes, supplier RMA reference, or reason details..."
                    className="w-full p-3 rounded-md bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Gross Subtotal:</span>
                    <span className="font-mono text-slate-200">Rs. {totals.subtotal.toFixed(2)}</span>
                  </div>
                  {totals.discount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Line Discounts:</span>
                      <span className="font-mono">-Rs. {totals.discount.toFixed(2)}</span>
                    </div>
                  )}
                  {totals.tax > 0 && (
                    <div className="flex justify-between text-amber-400">
                      <span>Taxes:</span>
                      <span className="font-mono">+Rs. {totals.tax.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-rose-400 pt-2 border-t border-slate-800">
                    <span>Net Debit Note Value:</span>
                    <span className="font-mono">Rs. {totals.netTotal.toFixed(2)}</span>
                  </div>

                  {returnableData && (
                    <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                      <div className="flex justify-between">
                        <span>New GRN Balance:</span>
                        <span className="font-mono font-semibold text-white">
                          Rs. {Math.max(0, returnableData.grn.balanceAmount - totals.netTotal).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-indigo-300 text-[10px] mt-1">
                        <ArrowRight className="w-3 h-3 shrink-0" />
                        <span>Vendor payable reduced by Rs. {totals.netTotal.toFixed(2)} in Supplier Ledger.</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting || !returnableData || totals.netTotal <= 0}
                  className="bg-indigo-600 hover:bg-indigo-500 flex items-center gap-2"
                >
                  {isSubmitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                  Confirm & Post Return
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: View / Print Debit Note Voucher */}
      {viewingReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-3xl my-8 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-indigo-400" />
                <h2 className="text-lg font-bold text-white">Purchase Return Voucher (Debit Note)</h2>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex rounded-md border border-slate-700 bg-slate-950 p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setPrintLayout('A4')}
                    className={`px-2.5 py-1 rounded ${
                      printLayout === 'A4' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400'
                    }`}
                  >
                    A4 Voucher
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrintLayout('THERMAL')}
                    className={`px-2.5 py-1 rounded ${
                      printLayout === 'THERMAL' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400'
                    }`}
                  >
                    80mm Thermal
                  </button>
                </div>
                <button
                  onClick={() => setViewingReturn(null)}
                  className="text-slate-400 hover:text-white ml-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Content */}
            <div className="p-6 overflow-y-auto max-h-[70vh] bg-slate-950 space-y-6">
              <div
                id="printable-return-voucher"
                className={`mx-auto bg-white text-slate-950 p-6 rounded-lg shadow font-sans ${
                  printLayout === 'THERMAL' ? 'max-w-sm text-xs' : 'max-w-2xl text-sm'
                }`}
              >
                {/* Header */}
                <div className="text-center border-b pb-4 mb-4">
                  <h1 className="text-xl font-black tracking-tight uppercase text-indigo-900">
                    MEDIX PHARMA DISTRIBUTION
                  </h1>
                  <p className="text-xs text-slate-600">PURCHASE RETURN / DEBIT NOTE VOUCHER</p>
                  <div className="mt-2 inline-block px-3 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-900 font-mono font-bold text-xs">
                    VOUCHER #: {viewingReturn.returnNumber}
                  </div>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                  <div>
                    <span className="text-slate-500 block">Supplier:</span>
                    <span className="font-bold text-slate-900">{viewingReturn.supplier?.name}</span>
                    <span className="text-slate-600 block">Code: {viewingReturn.supplier?.code}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 block">Return Date:</span>
                    <span className="font-bold text-slate-900">
                      {new Date(viewingReturn.returnDate).toLocaleDateString('en-GB')}
                    </span>
                    <span className="text-slate-600 block">GRN Ref: {viewingReturn.grn?.grnNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Reason:</span>
                    <span className="font-semibold text-slate-800">
                      {REASON_LABELS[viewingReturn.reason] || viewingReturn.reason}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 block">Status:</span>
                    <span
                      className={`font-bold ${
                        viewingReturn.status === 'POSTED' ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {viewingReturn.status}
                    </span>
                  </div>
                </div>

                {/* Items List */}
                <table className="w-full text-left text-xs border-collapse mb-4">
                  <thead>
                    <tr className="border-b-2 border-slate-900 bg-slate-100 font-bold">
                      <th className="py-2 px-1">Item / Batch</th>
                      <th className="py-2 px-1 text-right">Qty</th>
                      <th className="py-2 px-1 text-right">Rate</th>
                      <th className="py-2 px-1 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {viewingReturn.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-1">
                          <span className="font-semibold block">{item.product?.name || 'Product'}</span>
                          <span className="text-[10px] text-slate-600 block">
                            Batch: {item.batchNumber} | {item.stockCondition}
                          </span>
                        </td>
                        <td className="py-2 px-1 text-right font-mono">
                          {item.returnedQuantity}
                          {item.bonusReturnedQuantity > 0 && ` +${item.bonusReturnedQuantity}B`}
                        </td>
                        <td className="py-2 px-1 text-right font-mono">
                          Rs. {Number(item.unitCost).toFixed(2)}
                        </td>
                        <td className="py-2 px-1 text-right font-mono font-bold">
                          Rs. {Number(item.lineTotal).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals Summary */}
                <div className="border-t pt-2 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Subtotal:</span>
                    <span className="font-mono">Rs. {Number(viewingReturn.subtotal).toFixed(2)}</span>
                  </div>
                  {Number(viewingReturn.discountAmount) > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Discounts:</span>
                      <span className="font-mono">-Rs. {Number(viewingReturn.discountAmount).toFixed(2)}</span>
                    </div>
                  )}
                  {Number(viewingReturn.taxAmount) > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Taxes:</span>
                      <span className="font-mono">+Rs. {Number(viewingReturn.taxAmount).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-sm border-t pt-1 text-indigo-950">
                    <span>Net Debit Note Total:</span>
                    <span className="font-mono">Rs. {Number(viewingReturn.netTotal).toFixed(2)}</span>
                  </div>
                </div>

                {viewingReturn.notes && (
                  <div className="mt-3 p-2 rounded bg-slate-50 border text-[11px] text-slate-600">
                    <strong>Notes:</strong> {viewingReturn.notes}
                  </div>
                )}

                {/* Signatures */}
                <div className="mt-8 pt-4 border-t grid grid-cols-2 gap-4 text-center text-[10px] text-slate-500">
                  <div>
                    <div className="border-b border-dashed border-slate-400 mb-1 h-6"></div>
                    <span>Prepared By</span>
                  </div>
                  <div>
                    <div className="border-b border-dashed border-slate-400 mb-1 h-6"></div>
                    <span>Supplier Acknowledgement</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-950/60">
              <Button
                variant="secondary"
                onClick={() => setViewingReturn(null)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                onClick={() => window.print()}
                className="bg-indigo-600 hover:bg-indigo-500 flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print Voucher
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Cancel / Void Purchase Return */}
      {cancellingReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="text-lg font-bold text-white">Void Purchase Return</h3>
            </div>

            <p className="text-xs text-slate-300">
              Cancelling return <strong className="text-white font-mono">{cancellingReturn.returnNumber}</strong> will:
            </p>
            <ul className="list-disc list-inside text-xs text-slate-400 space-y-1">
              <li>Re-enter the returned stock back into inventory.</li>
              <li>Restore the payable amount on GRN {cancellingReturn.grn?.grnNumber}.</li>
              <li>Post an Adjustment credit note to the Supplier Ledger.</li>
            </ul>

            <form onSubmit={handleCancelReturn} className="space-y-4 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-slate-300">
                  Reason for Cancellation *
                </label>
                <Input
                  required
                  placeholder="e.g. Supplier rejected claim, wrong return items selected..."
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  className="bg-slate-950 border-slate-700 text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={isCancelling}
                  onClick={() => setCancellingReturn(null)}
                >
                  Keep Return
                </Button>
                <Button
                  type="submit"
                  disabled={isCancelling || !cancellationReason.trim()}
                  className="bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-2"
                >
                  {isCancelling && <RefreshCw className="w-4 h-4 animate-spin" />}
                  Confirm Cancellation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
