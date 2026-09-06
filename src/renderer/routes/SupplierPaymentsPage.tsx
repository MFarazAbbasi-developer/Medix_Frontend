import React, { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  Search,
  RefreshCw,
  Plus,
  Receipt,
  FileText,
  Printer,
  Ban,
  X,
  CheckCircle2,
  AlertCircle,
  Building2,
  TrendingDown,
  Sparkles,
  Info,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import {
  supplierPaymentsApi,
  SupplierPayment,
  UnpaidGrnSummary,
  CreateSupplierPaymentDto,
  PaymentMethod,
  SupplierPaymentStatus,
  suppliersApi,
  Supplier,
} from '../api';

export const SupplierPaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<SupplierPayment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Pagination & Aggregates
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [summary, setSummary] = useState<{
    totalPaidAmount: number;
    totalAllocatedAmount: number;
    totalUnallocatedAmount: number;
  }>({ totalPaidAmount: 0, totalAllocatedAmount: 0, totalUnallocatedAmount: 0 });

  // Feedback Toast
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4500);
  };

  // Suppliers Directory
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [unpaidGrns, setUnpaidGrns] = useState<UnpaidGrnSummary[]>([]);
  const [loadingGrns, setLoadingGrns] = useState<boolean>(false);

  // Form Fields
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split('T')[0],
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BANK_TRANSFER');
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [bankName, setBankName] = useState<string>('');
  const [chequeDate, setChequeDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [allocations, setAllocations] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Details / Print Modal State
  const [viewingPayment, setViewingPayment] = useState<SupplierPayment | null>(null);
  const [printLayout, setPrintLayout] = useState<'A4' | 'THERMAL'>('A4');

  // Cancel Modal State
  const [cancellingPayment, setCancellingPayment] = useState<SupplierPayment | null>(null);
  const [cancellationReason, setCancellationReason] = useState<string>('');
  const [isCancelling, setIsCancelling] = useState<boolean>(false);

  // Load Payments list
  const loadPayments = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await supplierPaymentsApi.getSupplierPayments({
        search: search.trim() || undefined,
        paymentMethod: methodFilter !== 'ALL' ? (methodFilter as PaymentMethod) : undefined,
        status: statusFilter !== 'ALL' ? (statusFilter as SupplierPaymentStatus) : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page: currentPage,
        limit: 20,
      });

      setPayments(res.items || []);
      setTotalRecords(res.total || 0);
      setTotalPages(res.totalPages || 1);
      setSummary({
        totalPaidAmount: Number(res.summary?.totalPaidAmount || 0),
        totalAllocatedAmount: Number(res.summary?.totalAllocatedAmount || 0),
        totalUnallocatedAmount: Number(res.summary?.totalUnallocatedAmount || 0),
      });
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || 'Failed to load supplier payments register');
    } finally {
      setIsLoading(false);
    }
  }, [search, methodFilter, statusFilter, startDate, endDate, currentPage]);

  // Load Suppliers list
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const data = await suppliersApi.getSuppliers();
        setSuppliers(data?.items || (Array.isArray(data) ? data : []));
      } catch (err) {
        console.error('Failed to load suppliers', err);
      }
    };
    fetchSuppliers();
  }, []);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  // When supplier is chosen in Create Modal, load their unpaid GRNs
  useEffect(() => {
    if (!selectedSupplierId) {
      setSelectedSupplier(null);
      setUnpaidGrns([]);
      setAllocations({});
      return;
    }

    const sup = suppliers.find((s) => s.id === selectedSupplierId) || null;
    setSelectedSupplier(sup);

    const fetchGrns = async () => {
      setLoadingGrns(true);
      try {
        const grns = await supplierPaymentsApi.getUnpaidGrns(selectedSupplierId);
        setUnpaidGrns(grns || []);
        setAllocations({});
      } catch (err: any) {
        showFeedback('error', err.response?.data?.message || 'Failed to load supplier outstanding GRNs');
      } finally {
        setLoadingGrns(false);
      }
    };

    fetchGrns();
  }, [selectedSupplierId, suppliers]);

  // Computed allocation totals
  const totalAllocated = Object.values(allocations).reduce(
    (sum, val) => sum + (Number(val) || 0),
    0,
  );
  const enteredAmount = parseFloat(amountPaid) || 0;
  const unallocatedAmount = Math.max(0, Math.round((enteredAmount - totalAllocated) * 100) / 100);

  // Auto Allocate FIFO algorithm
  const handleAutoAllocate = () => {
    let remaining = enteredAmount;
    if (remaining <= 0) {
      showFeedback('error', 'Please enter a valid disbursement amount first');
      return;
    }

    const nextAllocations: Record<string, number> = {};
    for (const grn of unpaidGrns) {
      if (remaining <= 0) break;
      const bal = Number(grn.balanceAmount);
      const alloc = Math.min(bal, remaining);
      if (alloc > 0) {
        nextAllocations[grn.id] = Math.round(alloc * 100) / 100;
        remaining = Math.round((remaining - alloc) * 100) / 100;
      }
    }

    setAllocations(nextAllocations);
  };

  // Reset form
  const resetForm = () => {
    setSelectedSupplierId('');
    setSelectedSupplier(null);
    setUnpaidGrns([]);
    setAllocations({});
    setAmountPaid('');
    setReferenceNumber('');
    setBankName('');
    setChequeDate('');
    setNotes('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('BANK_TRANSFER');
  };

  // Submit payment creation
  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSupplierId) {
      showFeedback('error', 'Please select a supplier');
      return;
    }

    if (enteredAmount <= 0) {
      showFeedback('error', 'Payment amount must be greater than 0');
      return;
    }

    if (totalAllocated > enteredAmount + 0.001) {
      showFeedback(
        'error',
        `Allocated amount (Rs. ${totalAllocated.toFixed(2)}) cannot exceed total payment amount (Rs. ${enteredAmount.toFixed(2)})`,
      );
      return;
    }

    // Format allocations array
    const allocArray = Object.entries(allocations)
      .filter(([_, amt]) => Number(amt) > 0)
      .map(([grnId, amountAllocated]) => ({
        grnId,
        amountAllocated: Number(amountAllocated),
      }));

    const payload: CreateSupplierPaymentDto = {
      supplierId: selectedSupplierId,
      paymentDate: paymentDate || undefined,
      paymentMethod,
      amount: enteredAmount,
      referenceNumber: referenceNumber.trim() || undefined,
      bankName: bankName.trim() || undefined,
      chequeDate: chequeDate || undefined,
      notes: notes.trim() || undefined,
      allocations: allocArray.length > 0 ? allocArray : undefined,
    };

    setIsSubmitting(true);
    try {
      const created = await supplierPaymentsApi.createSupplierPayment(payload);
      showFeedback('success', `Payment voucher ${created.paymentNumber} posted successfully`);
      setIsCreateModalOpen(false);
      resetForm();
      loadPayments();
      // Open details dialog
      setViewingPayment(created);
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || 'Failed to post supplier payment voucher');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancel payment submission
  const handleCancelPayment = async () => {
    if (!cancellingPayment) return;
    if (!cancellationReason.trim()) {
      showFeedback('error', 'Please enter a valid cancellation reason');
      return;
    }

    setIsCancelling(true);
    try {
      await supplierPaymentsApi.cancelSupplierPayment(cancellingPayment.id, {
        cancellationReason: cancellationReason.trim(),
      });
      showFeedback('success', `Payment voucher ${cancellingPayment.paymentNumber} cancelled successfully`);
      setCancellingPayment(null);
      setCancellationReason('');
      loadPayments();
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || 'Failed to cancel supplier payment voucher');
    } finally {
      setIsCancelling(false);
    }
  };

  // View full payment details
  const handleViewPayment = async (payment: SupplierPayment) => {
    try {
      const full = await supplierPaymentsApi.getSupplierPaymentById(payment.id);
      setViewingPayment(full);
    } catch {
      setViewingPayment(payment);
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
            <div className="p-2 rounded-lg bg-teal-50 text-teal-600 border border-teal-100">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-charcoal-900">
                Supplier Payments & Vouchers
              </h1>
              <p className="text-xs text-charcoal-500 mt-0.5">
                Vendor disbursements, multi-GRN settlement, supplier ledger reconciliation, and advance records
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={loadPayments}
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
            className="flex items-center gap-1.5 text-xs bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Disburse Payment</span>
          </Button>
        </div>
      </div>

      {/* KPI Aggregate Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border border-surface-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-charcoal-500">Total Disbursed</span>
            <span className="p-1.5 rounded-md bg-teal-50 text-teal-600">
              <Receipt className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-lg font-bold text-charcoal-900 tracking-tight">
            Rs. {summary.totalPaidAmount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-charcoal-400 mt-0.5">
            {totalRecords} payment voucher{totalRecords !== 1 ? 's' : ''} recorded
          </p>
        </Card>

        <Card className="p-4 bg-white border border-surface-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-600">Settled to GRNs</span>
            <span className="p-1.5 rounded-md bg-emerald-50 text-emerald-600">
              <TrendingDown className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-lg font-bold text-emerald-700 tracking-tight">
            Rs. {summary.totalAllocatedAmount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-charcoal-400 mt-0.5">Direct payable offset</p>
        </Card>

        <Card className="p-4 bg-white border border-surface-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-600">Vendor Advance / Credit</span>
            <span className="p-1.5 rounded-md bg-amber-50 text-amber-600">
              <Building2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-lg font-bold text-amber-700 tracking-tight">
            Rs. {summary.totalUnallocatedAmount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-charcoal-400 mt-0.5">Held on vendor credit balance</p>
        </Card>

        <Card className="p-4 bg-white border border-surface-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-indigo-600">Active Vouchers</span>
            <span className="p-1.5 rounded-md bg-indigo-50 text-indigo-600">
              <CreditCard className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-lg font-bold text-indigo-700 tracking-tight">
            {payments.filter((p) => p.status === 'POSTED').length} Posted
          </div>
          <p className="text-[11px] text-charcoal-400 mt-0.5">
            {payments.filter((p) => p.status === 'CANCELLED').length} voided/cancelled
          </p>
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
              placeholder="Search voucher #, ref #, vendor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          {/* Payment Method Filter */}
          <div>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="w-full text-xs rounded-md border border-charcoal-200 bg-white px-2.5 py-2 text-charcoal-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="ALL">All Payment Methods</option>
              <option value="CASH">Cash</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CHEQUE">Cheque</option>
              <option value="ONLINE">Online</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs rounded-md border border-charcoal-200 bg-white px-2.5 py-2 text-charcoal-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="POSTED">Posted</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Date Range Start */}
          <div>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-xs py-1.5"
            />
          </div>

          {/* Date Range End */}
          <div>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-xs py-1.5"
            />
          </div>
        </div>
      </Card>

      {/* Supplier Payments Table */}
      <Card className="overflow-hidden bg-white border border-surface-border shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-charcoal-700">
            <thead className="bg-surface-muted border-b border-surface-border text-charcoal-600 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-3.5">Voucher #</th>
                <th className="py-2.5 px-3.5">Date</th>
                <th className="py-2.5 px-3.5">Supplier / Vendor</th>
                <th className="py-2.5 px-3.5">Method</th>
                <th className="py-2.5 px-3.5 text-right">Amount Paid</th>
                <th className="py-2.5 px-3.5 text-right">Allocated</th>
                <th className="py-2.5 px-3.5 text-right">Advance / Credit</th>
                <th className="py-2.5 px-3.5 text-center">Status</th>
                <th className="py-2.5 px-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-charcoal-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-teal-600" />
                    <span>Loading supplier payments register...</span>
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-charcoal-400">
                    <Receipt className="w-8 h-8 mx-auto mb-2 text-charcoal-300 stroke-[1.5]" />
                    <p className="text-sm font-medium text-charcoal-600">No payment vouchers found</p>
                    <p className="text-xs text-charcoal-400 mt-0.5">
                      Disburse supplier payments against outstanding GRN bills or record advance payments
                    </p>
                  </td>
                </tr>
              ) : (
                payments.map((p) => {
                  const isCancelled = p.status === 'CANCELLED';
                  const allocCount = p._count?.allocations || p.allocations?.length || 0;
                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-surface-muted/50 transition-colors ${
                        isCancelled ? 'bg-rose-50/30 opacity-75' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3.5 font-semibold text-charcoal-900 whitespace-nowrap">
                        <span className="font-mono">{p.paymentNumber}</span>
                        {p.referenceNumber && (
                          <div className="text-[10px] text-charcoal-400 font-normal">
                            Ref: {p.referenceNumber}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3.5 text-charcoal-600 whitespace-nowrap">
                        {new Date(p.paymentDate).toLocaleDateString('en-PK', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-2.5 px-3.5">
                        <div className="font-medium text-charcoal-900">
                          {p.supplier?.name || 'Unknown Supplier'}
                        </div>
                        <div className="text-[10px] text-charcoal-400 font-mono">
                          {p.supplier?.code || ''}
                        </div>
                      </td>
                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-charcoal-100 text-charcoal-800">
                          {p.paymentMethod.replace('_', ' ')}
                        </span>
                        {p.bankName && (
                          <div className="text-[10px] text-charcoal-400 truncate max-w-[120px]">
                            {p.bankName}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-bold text-charcoal-900 whitespace-nowrap">
                        Rs. {Number(p.amount).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-medium text-emerald-700 whitespace-nowrap">
                        Rs. {Number(p.allocatedAmount).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                        <span className="text-[10px] text-charcoal-400 ml-1">
                          ({allocCount} GRN{allocCount !== 1 ? 's' : ''})
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-medium whitespace-nowrap">
                        {Number(p.unallocatedAmount) > 0 ? (
                          <span className="text-amber-700 font-semibold">
                            Rs. {Number(p.unallocatedAmount).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span className="text-charcoal-400">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            isCancelled
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleViewPayment(p)}
                            title="View / Print Voucher"
                            className="p-1 rounded text-charcoal-600 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                          {!isCancelled && (
                            <button
                              type="button"
                              onClick={() => {
                                setCancellingPayment(p);
                                setCancellationReason('');
                              }}
                              title="Cancel / Void Payment Voucher"
                              className="p-1 rounded text-charcoal-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            >
                              <Ban className="w-3.5 h-3.5" />
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
        {!isLoading && totalRecords > 0 && (
          <div className="p-3 border-t border-surface-border flex items-center justify-between text-xs text-charcoal-500">
            <div>
              Showing {payments.length} of {totalRecords} vouchers
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                className="text-xs h-7 px-2"
              >
                Previous
              </Button>
              <span className="px-2 font-medium text-charcoal-700">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                className="text-xs h-7 px-2"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* ========================================================= */}
      {/* MODAL: RECORD / DISBURSE SUPPLIER PAYMENT                  */}
      {/* ========================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-charcoal-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border bg-surface-muted/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-teal-50 text-teal-600 border border-teal-100">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-charcoal-900">
                    Disburse Supplier Payment
                  </h2>
                  <p className="text-xs text-charcoal-500">
                    Record payment disbursement, settle outstanding GRNs, or deposit vendor advance
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-charcoal-400 hover:text-charcoal-700 hover:bg-charcoal-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleCreatePayment} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Section 1: Supplier Selection & Balance */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="supplier-select" className="block text-xs font-semibold text-charcoal-700 mb-1">
                    Select Supplier / Vendor <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="supplier-select"
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    required
                    className="w-full text-xs rounded-md border border-charcoal-300 bg-white px-3 py-2 text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="">-- Choose Supplier --</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedSupplier && (
                  <div className="p-3 bg-teal-50/60 border border-teal-100 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-medium text-teal-800">
                        Current Outstanding Payable
                      </div>
                      <div className="text-base font-bold text-teal-950">
                        Rs. {Number(selectedSupplier.currentBalance || 0).toLocaleString('en-PK', {
                          minimumFractionDigits: 2,
                        })}
                      </div>
                      <div className="text-[10px] text-teal-700 mt-0.5">
                        {Number(selectedSupplier.currentBalance || 0) > 0
                          ? 'Distributor owes this supplier'
                          : Number(selectedSupplier.currentBalance || 0) < 0
                          ? 'Distributor has credit with supplier'
                          : 'Fully settled balance'}
                      </div>
                    </div>
                    <Building2 className="w-8 h-8 text-teal-400 opacity-60" />
                  </div>
                )}
              </div>

              {/* Section 2: Payment Details */}
              <div className="p-4 bg-surface-muted/30 border border-surface-border rounded-lg space-y-4">
                <h3 className="text-xs font-bold text-charcoal-800 uppercase tracking-wider">
                  Payment Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                      Payment Date
                    </label>
                    <Input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                      Payment Method <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="w-full text-xs rounded-md border border-charcoal-300 bg-white px-3 py-2 text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    >
                      <option value="BANK_TRANSFER">Bank Transfer / Online</option>
                      <option value="CASH">Cash</option>
                      <option value="CHEQUE">Cheque / Demand Draft</option>
                      <option value="ONLINE">Online Payment Gateway</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                      Amount to Disburse (Rs.) <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="e.g. 50000.00"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                      required
                      className="text-xs font-bold text-teal-700"
                    />
                  </div>
                </div>

                {/* Optional Banking / Cheque details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-medium text-charcoal-600 mb-1">
                      Reference / Transaction #
                    </label>
                    <Input
                      type="text"
                      placeholder="Cheque #, Slip #, FT Ref..."
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      className="text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-charcoal-600 mb-1">
                      Bank Name
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g. Meezan Bank, HBL"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-charcoal-600 mb-1">
                      Cheque Date
                    </label>
                    <Input
                      type="date"
                      value={chequeDate}
                      onChange={(e) => setChequeDate(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-charcoal-600 mb-1">
                    Notes / Remarks
                  </label>
                  <Input
                    type="text"
                    placeholder="Disbursement notes, batch settlement remarks..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              {/* Section 3: GRN Allocation Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-charcoal-800 uppercase tracking-wider">
                      Outstanding GRN Invoices Settlement
                    </h3>
                    {unpaidGrns.length > 0 && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-charcoal-100 text-charcoal-700">
                        {unpaidGrns.length} Unpaid GRN{unpaidGrns.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {unpaidGrns.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAutoAllocate}
                      className="flex items-center gap-1.5 text-xs text-teal-700 border-teal-200 hover:bg-teal-50"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                      <span>FIFO Auto-Allocate</span>
                    </Button>
                  )}
                </div>

                {loadingGrns ? (
                  <div className="py-6 text-center text-charcoal-400 text-xs">
                    <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-1 text-teal-600" />
                    <span>Loading supplier outstanding GRNs...</span>
                  </div>
                ) : !selectedSupplierId ? (
                  <div className="p-6 text-center text-charcoal-400 text-xs border border-dashed rounded-lg bg-surface-muted/30">
                    <Info className="w-5 h-5 mx-auto mb-1 text-charcoal-300" />
                    <span>Select a supplier above to load outstanding GRN invoices</span>
                  </div>
                ) : unpaidGrns.length === 0 ? (
                  <div className="p-6 text-center text-charcoal-500 text-xs border border-dashed rounded-lg bg-emerald-50/30 border-emerald-200">
                    <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
                    <span className="font-medium text-emerald-800">
                      No unpaid GRN invoices found for this supplier!
                    </span>
                    <p className="text-[11px] text-emerald-700 mt-0.5">
                      Any payment disbursed will be recorded as unallocated vendor credit / advance.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-hidden border border-surface-border rounded-lg">
                    <table className="w-full text-left text-xs text-charcoal-700">
                      <thead className="bg-surface-muted text-charcoal-600 font-semibold uppercase tracking-wider text-[10px] border-b border-surface-border">
                        <tr>
                          <th className="py-2 px-3">GRN #</th>
                          <th className="py-2 px-3">Received Date</th>
                          <th className="py-2 px-3">Vendor Bill #</th>
                          <th className="py-2 px-3 text-right">Net Total</th>
                          <th className="py-2 px-3 text-right">Paid</th>
                          <th className="py-2 px-3 text-right">Outstanding</th>
                          <th className="py-2 px-3 text-right w-36">Allocate (Rs.)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-border">
                        {unpaidGrns.map((grn) => {
                          const currentAlloc = allocations[grn.id] || '';
                          const outstanding = Number(grn.balanceAmount);

                          return (
                            <tr key={grn.id} className="hover:bg-surface-muted/40">
                              <td className="py-2 px-3 font-semibold text-charcoal-900 font-mono">
                                {grn.grnNumber}
                              </td>
                              <td className="py-2 px-3 text-charcoal-600">
                                {new Date(grn.receivedDate).toLocaleDateString('en-PK')}
                              </td>
                              <td className="py-2 px-3 text-charcoal-500">
                                {grn.supplierInvoiceNumber || '-'}
                              </td>
                              <td className="py-2 px-3 text-right font-medium text-charcoal-800">
                                Rs. {Number(grn.netTotal).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="py-2 px-3 text-right text-emerald-700">
                                Rs. {Number(grn.paidAmount).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="py-2 px-3 text-right font-bold text-rose-700">
                                Rs. {outstanding.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="py-2 px-3 text-right">
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  max={outstanding}
                                  placeholder="0.00"
                                  value={currentAlloc}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    const clamped = Math.max(0, Math.min(outstanding, val));
                                    setAllocations((prev) => ({
                                      ...prev,
                                      [grn.id]: clamped,
                                    }));
                                  }}
                                  className="text-right text-xs py-1 h-7 font-semibold"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Section 4: Allocation Reconciliation Summary */}
              <div className="p-4 rounded-lg bg-charcoal-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="grid grid-cols-3 gap-6 text-center sm:text-left">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-charcoal-400 font-semibold">
                      Total Disbursed
                    </div>
                    <div className="text-base font-bold text-white">
                      Rs. {enteredAmount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold">
                      Total Allocated
                    </div>
                    <div className="text-base font-bold text-emerald-400">
                      Rs. {totalAllocated.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-amber-400 font-semibold">
                      Advance Credit
                    </div>
                    <div className="text-base font-bold text-amber-400">
                      Rs. {unallocatedAmount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="text-xs bg-charcoal-800 hover:bg-charcoal-700 text-charcoal-200 border-charcoal-700"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || enteredAmount <= 0}
                    className="text-xs bg-teal-500 hover:bg-teal-600 text-charcoal-950 font-bold px-4"
                  >
                    {isSubmitting ? 'Posting Voucher...' : 'Confirm & Post Payment'}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: VIEW & PRINT PAYMENT VOUCHER                       */}
      {/* ========================================================= */}
      {viewingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-charcoal-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border bg-surface-muted/50">
              <div className="flex items-center gap-2.5">
                <Receipt className="w-5 h-5 text-teal-600" />
                <div>
                  <h2 className="text-base font-bold text-charcoal-900">
                    Payment Voucher: {viewingPayment.paymentNumber}
                  </h2>
                  <p className="text-xs text-charcoal-500">
                    Supplier disbursement receipt & settlement audit
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex rounded-md border border-charcoal-200 p-0.5 bg-charcoal-50 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setPrintLayout('A4')}
                    className={`px-2 py-0.5 rounded font-medium ${
                      printLayout === 'A4'
                        ? 'bg-white shadow-xs text-charcoal-900'
                        : 'text-charcoal-500'
                    }`}
                  >
                    A4 Voucher
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrintLayout('THERMAL')}
                    className={`px-2 py-0.5 rounded font-medium ${
                      printLayout === 'THERMAL'
                        ? 'bg-white shadow-xs text-charcoal-900'
                        : 'text-charcoal-500'
                    }`}
                  >
                    Thermal 80mm
                  </button>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 text-xs text-charcoal-700"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </Button>

                <button
                  type="button"
                  onClick={() => setViewingPayment(null)}
                  className="p-1 rounded-lg text-charcoal-400 hover:text-charcoal-700 hover:bg-charcoal-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Document Header Card */}
              <div className="p-4 rounded-lg bg-surface-muted/50 border border-surface-border grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <div className="text-charcoal-400 text-[10px] uppercase font-semibold">
                    Voucher Number
                  </div>
                  <div className="font-bold text-charcoal-900 font-mono text-sm mt-0.5">
                    {viewingPayment.paymentNumber}
                  </div>
                  <span
                    className={`inline-block mt-1 px-2 py-0.2 rounded-full text-[10px] font-semibold ${
                      viewingPayment.status === 'POSTED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {viewingPayment.status}
                  </span>
                </div>

                <div>
                  <div className="text-charcoal-400 text-[10px] uppercase font-semibold">
                    Payment Date
                  </div>
                  <div className="font-medium text-charcoal-900 mt-0.5">
                    {new Date(viewingPayment.paymentDate).toLocaleDateString('en-PK', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                </div>

                <div>
                  <div className="text-charcoal-400 text-[10px] uppercase font-semibold">
                    Supplier / Vendor
                  </div>
                  <div className="font-bold text-charcoal-900 mt-0.5">
                    {viewingPayment.supplier?.name}
                  </div>
                  <div className="text-[10px] text-charcoal-500 font-mono">
                    {viewingPayment.supplier?.code}
                  </div>
                </div>

                <div>
                  <div className="text-charcoal-400 text-[10px] uppercase font-semibold">
                    Method & Reference
                  </div>
                  <div className="font-medium text-charcoal-900 mt-0.5">
                    {viewingPayment.paymentMethod.replace('_', ' ')}
                  </div>
                  {viewingPayment.referenceNumber && (
                    <div className="text-[10px] text-charcoal-500 font-mono">
                      Ref: {viewingPayment.referenceNumber}
                    </div>
                  )}
                </div>
              </div>

              {/* Financial Totals */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="p-3 bg-teal-50/50 border-teal-100 text-center">
                  <div className="text-[10px] text-teal-700 uppercase font-semibold">
                    Total Amount Disbursed
                  </div>
                  <div className="text-base font-bold text-teal-950 mt-1">
                    Rs. {Number(viewingPayment.amount).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                  </div>
                </Card>

                <Card className="p-3 bg-emerald-50/50 border-emerald-100 text-center">
                  <div className="text-[10px] text-emerald-700 uppercase font-semibold">
                    Allocated to GRNs
                  </div>
                  <div className="text-base font-bold text-emerald-950 mt-1">
                    Rs. {Number(viewingPayment.allocatedAmount).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                  </div>
                </Card>

                <Card className="p-3 bg-amber-50/50 border-amber-100 text-center">
                  <div className="text-[10px] text-amber-700 uppercase font-semibold">
                    Supplier Advance Credit
                  </div>
                  <div className="text-base font-bold text-amber-950 mt-1">
                    Rs. {Number(viewingPayment.unallocatedAmount).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                  </div>
                </Card>
              </div>

              {/* Allocated GRNs Breakdown */}
              <div>
                <h3 className="text-xs font-bold text-charcoal-800 uppercase tracking-wider mb-2">
                  Itemized GRN Settlement Allocations
                </h3>
                {viewingPayment.allocations && viewingPayment.allocations.length > 0 ? (
                  <div className="overflow-hidden border border-surface-border rounded-lg">
                    <table className="w-full text-left text-xs text-charcoal-700">
                      <thead className="bg-surface-muted text-charcoal-600 font-semibold uppercase tracking-wider text-[10px] border-b border-surface-border">
                        <tr>
                          <th className="py-2 px-3">GRN #</th>
                          <th className="py-2 px-3">Vendor Bill #</th>
                          <th className="py-2 px-3 text-right">GRN Net Total</th>
                          <th className="py-2 px-3 text-right">Remaining Balance</th>
                          <th className="py-2 px-3 text-right">Amount Settled</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-border">
                        {viewingPayment.allocations.map((a) => (
                          <tr key={a.id}>
                            <td className="py-2 px-3 font-semibold text-charcoal-900 font-mono">
                              {a.grn?.grnNumber || 'N/A'}
                            </td>
                            <td className="py-2 px-3 text-charcoal-500">
                              {a.grn?.supplierInvoiceNumber || '-'}
                            </td>
                            <td className="py-2 px-3 text-right">
                              Rs. {Number(a.grn?.netTotal || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2 px-3 text-right font-medium text-rose-700">
                              Rs. {Number(a.grn?.balanceAmount || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-emerald-700">
                              Rs. {Number(a.amountAllocated).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-charcoal-400 italic">
                    No individual GRN allocations (entire amount recorded as unallocated vendor credit).
                  </p>
                )}
              </div>

              {/* Audit Trail */}
              <div className="p-3 bg-surface-muted/30 border border-surface-border rounded-lg text-[11px] text-charcoal-500 space-y-1">
                <div>
                  <span className="font-semibold text-charcoal-700">Posted At:</span>{' '}
                  {new Date(viewingPayment.postedAt).toLocaleString('en-PK')} by{' '}
                  {viewingPayment.postedByUser?.displayName || 'System'}
                </div>
                {viewingPayment.status === 'CANCELLED' && (
                  <div className="text-rose-700">
                    <span className="font-semibold">Cancelled At:</span>{' '}
                    {new Date(viewingPayment.cancelledAt!).toLocaleString('en-PK')} by{' '}
                    {viewingPayment.cancelledByUser?.displayName || 'System'} — Reason:{' '}
                    {viewingPayment.cancellationReason}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CANCEL / VOID PAYMENT VOUCHER                      */}
      {/* ========================================================= */}
      {cancellingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-charcoal-200 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 rounded-lg bg-rose-50 border border-rose-100">
                <Ban className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-charcoal-900">
                  Cancel Payment Voucher
                </h3>
                <p className="text-xs text-charcoal-500 font-mono">
                  {cancellingPayment.paymentNumber}
                </p>
              </div>
            </div>

            <div className="p-3 bg-rose-50/60 border border-rose-100 rounded-lg text-xs text-rose-800 space-y-1">
              <p className="font-semibold">Important Accounting Safeguard:</p>
              <p>
                Cancelling this voucher will restore all allocated GRN outstanding balances and
                increase the supplier's payable balance by{' '}
                <span className="font-bold">
                  Rs. {Number(cancellingPayment.amount).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                </span>
                .
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Reason for Cancellation <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="Enter mandatory reason for audit trail (e.g. incorrect amount, wrong supplier account)..."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                className="w-full text-xs rounded-md border border-charcoal-300 p-2.5 text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCancellingPayment(null)}
                className="text-xs"
              >
                Go Back
              </Button>
              <Button
                size="sm"
                disabled={isCancelling || !cancellationReason.trim()}
                onClick={handleCancelPayment}
                className="text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                {isCancelling ? 'Cancelling...' : 'Confirm Void / Cancellation'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default SupplierPaymentsPage;
