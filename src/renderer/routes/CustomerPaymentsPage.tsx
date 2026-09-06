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
  customerPaymentsApi,
  CustomerPayment,
  UnpaidInvoiceSummary,
  CreateCustomerPaymentDto,
  PaymentMethod,
  CustomerPaymentStatus,
  getCustomers,
  organizationApi,
  settingsApi,
  Customer,
} from '../api';
import {
  DocumentPrintModal,
  CustomerPaymentReceiptTemplate,
  PrintableCompanyInfo,
  PrintableCustomerPayment,
} from '../components/printing';

export const CustomerPaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<CustomerPayment[]>([]);
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
    totalAmount: number;
    totalAllocated: number;
    totalUnallocated: number;
  }>({ totalAmount: 0, totalAllocated: 0, totalUnallocated: 0 });

  // Feedback Toast
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4500);
  };

  // Customers Directory for select dropdowns
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [unpaidInvoices, setUnpaidInvoices] = useState<UnpaidInvoiceSummary[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState<boolean>(false);

  // Form Fields
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split('T')[0],
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [amountReceived, setAmountReceived] = useState<string>('');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [bankName, setBankName] = useState<string>('');
  const [chequeDate, setChequeDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [allocations, setAllocations] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Details / Print Modal State
  const [viewingPayment, setViewingPayment] = useState<CustomerPayment | null>(null);
  const [company, setCompany] = useState<PrintableCompanyInfo>({
    name: 'MEDIX Pharmacy',
    legalName: 'MEDIX Pharma Distribution',
  });
  const [settingsMap, setSettingsMap] = useState<Record<string, string>>({});

  // Cancel Modal State
  const [cancellingPayment, setCancellingPayment] = useState<CustomerPayment | null>(null);
  const [cancellationReason, setCancellationReason] = useState<string>('');
  const [isCancelling, setIsCancelling] = useState<boolean>(false);

  // Load Payments list
  const loadPayments = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await customerPaymentsApi.getPayments({
        search: search.trim() || undefined,
        paymentMethod: methodFilter !== 'ALL' ? (methodFilter as PaymentMethod) : undefined,
        status: statusFilter !== 'ALL' ? (statusFilter as CustomerPaymentStatus) : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page: currentPage,
        limit: 20,
      });

      setPayments(res.items || []);
      setTotalRecords(res.total || 0);
      setTotalPages(res.totalPages || 1);
      setSummary({
        totalAmount: Number(res.summary?.totalAmount || 0),
        totalAllocated: Number(res.summary?.totalAllocated || 0),
        totalUnallocated: Number(res.summary?.totalUnallocated || 0),
      });
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || 'Failed to load payments register');
    } finally {
      setIsLoading(false);
    }
  }, [search, methodFilter, statusFilter, startDate, endDate, currentPage]);

  // Load Customers, Organization & Settings for dropdown and printing
  useEffect(() => {
    const fetchAuxData = async () => {
      try {
        const [res, orgRes, settingsRes] = await Promise.all([
          getCustomers({ limit: 100, isActive: true }),
          organizationApi.getOrganization().catch(() => null),
          settingsApi.getSettings().catch(() => ({ items: [], map: {} })),
        ]);
        setCustomers(res.items || []);

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
        console.error('Failed to load aux data', err);
      }
    };
    fetchAuxData();
  }, []);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  // When customer is selected in Create Modal, load unpaid invoices
  useEffect(() => {
    if (!selectedCustomerId) {
      setSelectedCustomer(null);
      setUnpaidInvoices([]);
      setAllocations({});
      return;
    }

    const found = customers.find((c) => c.id === selectedCustomerId) || null;
    setSelectedCustomer(found);

    const fetchInvoices = async () => {
      setLoadingInvoices(true);
      try {
        const invs = await customerPaymentsApi.getUnpaidInvoices(selectedCustomerId);
        setUnpaidInvoices(invs);
        setAllocations({});
      } catch (err: any) {
        showFeedback('error', err.response?.data?.message || 'Failed to fetch customer unpaid invoices');
      } finally {
        setLoadingInvoices(false);
      }
    };

    fetchInvoices();
  }, [selectedCustomerId, customers]);

  // Handle single invoice allocation change
  const handleAllocationChange = (invoiceId: string, val: string, maxBalance: number) => {
    const num = parseFloat(val);
    if (isNaN(num) || num <= 0) {
      const next = { ...allocations };
      delete next[invoiceId];
      setAllocations(next);
      return;
    }

    // Limit to max outstanding balance
    const clamped = Math.min(num, maxBalance);
    setAllocations({
      ...allocations,
      [invoiceId]: Math.round(clamped * 100) / 100,
    });
  };

  // FIFO Auto-Distribute
  const handleAutoDistribute = () => {
    const totalPay = parseFloat(amountReceived);
    if (isNaN(totalPay) || totalPay <= 0) {
      showFeedback('error', 'Please enter a valid received amount first to auto-distribute');
      return;
    }

    let remaining = totalPay;
    const nextAlloc: Record<string, number> = {};

    for (const inv of unpaidInvoices) {
      if (remaining <= 0) break;
      const bal = Number(inv.balanceAmount);
      if (bal <= 0) continue;

      const allocated = Math.min(bal, remaining);
      const rounded = Math.round(allocated * 100) / 100;
      nextAlloc[inv.id] = rounded;
      remaining = Math.round((remaining - rounded) * 100) / 100;
    }

    setAllocations(nextAlloc);
    showFeedback('success', 'Amount distributed across oldest unpaid invoices (FIFO)');
  };

  const handleClearAllocations = () => {
    setAllocations({});
  };

  // Derived calculation in modal
  const enteredAmount = parseFloat(amountReceived) || 0;
  const totalAllocatedInModal = Object.values(allocations).reduce((sum, v) => sum + v, 0);
  const roundedAllocated = Math.round(totalAllocatedInModal * 100) / 100;
  const unallocatedRemainder = Math.max(0, Math.round((enteredAmount - roundedAllocated) * 100) / 100);
  const isOverAllocated = roundedAllocated > enteredAmount + 0.001;

  // Submit Payment Receipt
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      showFeedback('error', 'Please select a customer');
      return;
    }

    if (enteredAmount <= 0) {
      showFeedback('error', 'Payment amount must be greater than zero');
      return;
    }

    if (isOverAllocated) {
      showFeedback(
        'error',
        `Total allocated (Rs. ${roundedAllocated.toFixed(2)}) cannot exceed received amount (Rs. ${enteredAmount.toFixed(2)})`,
      );
      return;
    }

    const payloadAllocations = Object.entries(allocations)
      .filter(([_, amt]) => amt > 0)
      .map(([salesInvoiceId, amountAllocated]) => ({
        salesInvoiceId,
        amountAllocated,
      }));

    const payload: CreateCustomerPaymentDto = {
      customerId: selectedCustomerId,
      paymentDate: paymentDate || undefined,
      paymentMethod,
      amount: enteredAmount,
      referenceNumber: referenceNumber.trim() || undefined,
      bankName: bankName.trim() || undefined,
      chequeDate: chequeDate || undefined,
      notes: notes.trim() || undefined,
      allocations: payloadAllocations.length > 0 ? payloadAllocations : undefined,
    };

    setIsSubmitting(true);
    try {
      const created = await customerPaymentsApi.createPayment(payload);
      showFeedback('success', `Payment receipt ${created.paymentNumber} posted successfully`);
      setIsCreateModalOpen(false);
      resetForm();
      loadPayments();
      // Open receipt voucher preview
      setViewingPayment(created);
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || 'Failed to post customer payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedCustomerId('');
    setSelectedCustomer(null);
    setUnpaidInvoices([]);
    setAllocations({});
    setAmountReceived('');
    setReferenceNumber('');
    setBankName('');
    setChequeDate('');
    setNotes('');
    setPaymentMethod('CASH');
    setPaymentDate(new Date().toISOString().split('T')[0]);
  };

  // Cancel / Void Payment
  const handleConfirmCancel = async () => {
    if (!cancellingPayment) return;
    if (!cancellationReason.trim() || cancellationReason.trim().length < 3) {
      showFeedback('error', 'Please provide a valid cancellation reason (min 3 characters)');
      return;
    }

    setIsCancelling(true);
    try {
      await customerPaymentsApi.cancelPayment(cancellingPayment.id, {
        cancellationReason: cancellationReason.trim(),
      });
      showFeedback(
        'success',
        `Payment ${cancellingPayment.paymentNumber} voided. Settlement and ledger balances restored.`,
      );
      setCancellingPayment(null);
      setCancellationReason('');
      loadPayments();
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || 'Failed to cancel payment');
    } finally {
      setIsCancelling(false);
    }
  };

  // View full payment details
  const handleViewPayment = async (payment: CustomerPayment) => {
    try {
      const full = await customerPaymentsApi.getPaymentById(payment.id);
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
            <div className="p-2 rounded-lg bg-brand-50 text-brand-600 border border-brand-100">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-charcoal-900">
                Customer Payments & Receipts
              </h1>
              <p className="text-xs text-charcoal-500 mt-0.5">
                Receivables collection, multi-invoice settlement, advance deposits, and cash drawer vouchers
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
            className="flex items-center gap-1.5 text-xs bg-brand-600 hover:bg-brand-700 text-white font-semibold shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Record Payment Receipt</span>
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border border-surface-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-charcoal-500">Total Collected</span>
            <span className="p-1.5 rounded-md bg-brand-50 text-brand-600">
              <Receipt className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-lg font-bold text-charcoal-900 tracking-tight">
            Rs. {summary.totalAmount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-charcoal-400 mt-0.5">
            {totalRecords} payment voucher{totalRecords !== 1 ? 's' : ''} in query
          </p>
        </Card>

        <Card className="p-4 bg-white border border-surface-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-600">Settled to Invoices</span>
            <span className="p-1.5 rounded-md bg-emerald-50 text-emerald-600">
              <TrendingDown className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-lg font-bold text-emerald-700 tracking-tight">
            Rs. {summary.totalAllocated.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-charcoal-400 mt-0.5">Applied directly against receivables</p>
        </Card>

        <Card className="p-4 bg-white border border-surface-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-600">Unallocated Advance</span>
            <span className="p-1.5 rounded-md bg-amber-50 text-amber-600">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-lg font-bold text-amber-700 tracking-tight">
            Rs. {summary.totalUnallocated.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-charcoal-400 mt-0.5">Held on account as customer credit</p>
        </Card>

        <Card className="p-4 bg-white border border-surface-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-charcoal-500">Allocation Rate</span>
            <span className="p-1.5 rounded-md bg-surface-muted text-charcoal-600">
              <FileText className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-lg font-bold text-charcoal-900 tracking-tight">
            {summary.totalAmount > 0
              ? `${Math.round((summary.totalAllocated / summary.totalAmount) * 100)}%`
              : '0%'}
          </div>
          <p className="text-[11px] text-charcoal-400 mt-0.5">Direct invoice coverage</p>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="p-3.5 bg-white border border-surface-border shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-center">
          {/* Search Box */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Search receipt #, customer, cheque #, reference..."
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
              className="w-full text-xs rounded-md border border-charcoal-200 bg-white px-2.5 py-2 text-charcoal-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="ALL">All Payment Methods</option>
              <option value="CASH">Cash</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CHEQUE">Cheque</option>
              <option value="ONLINE">Online / IBFT</option>
              <option value="CREDIT_CARD">Credit Card</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs rounded-md border border-charcoal-200 bg-white px-2.5 py-2 text-charcoal-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="POSTED">Posted (Valid)</option>
              <option value="CANCELLED">Cancelled / Voided</option>
            </select>
          </div>

          {/* Clear Filters */}
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-xs py-1.5"
              title="From Date"
            />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-xs py-1.5"
              title="To Date"
            />
          </div>
        </div>
      </Card>

      {/* Payments Register Table */}
      <Card className="overflow-hidden bg-white border border-surface-border shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-charcoal-700">
            <thead className="bg-surface-muted border-b border-surface-border text-charcoal-600 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-3.5">Receipt #</th>
                <th className="py-2.5 px-3.5">Date</th>
                <th className="py-2.5 px-3.5">Customer</th>
                <th className="py-2.5 px-3.5">Method</th>
                <th className="py-2.5 px-3.5 text-right">Total (PKR)</th>
                <th className="py-2.5 px-3.5 text-right">Allocated</th>
                <th className="py-2.5 px-3.5 text-right">Advance</th>
                <th className="py-2.5 px-3.5 text-center">Status</th>
                <th className="py-2.5 px-3.5">Reference / Cheque</th>
                <th className="py-2.5 px-3.5">Posted By</th>
                <th className="py-2.5 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {isLoading ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-charcoal-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-500" />
                    <span>Loading customer payments register...</span>
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-charcoal-400">
                    <Receipt className="w-8 h-8 mx-auto mb-2 text-charcoal-300 stroke-[1.5]" />
                    <p className="font-medium text-charcoal-600">No payment receipts found</p>
                    <p className="text-[11px] mt-0.5">
                      Record collections using the "+ Record Payment Receipt" button above
                    </p>
                  </td>
                </tr>
              ) : (
                payments.map((p) => {
                  const isCancelled = p.status === 'CANCELLED';
                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-surface-muted/60 transition-colors ${
                        isCancelled ? 'bg-rose-50/20 text-charcoal-400' : ''
                      }`}
                    >
                      <td className="py-3 px-3.5 font-semibold text-charcoal-900 whitespace-nowrap">
                        <span className="font-mono text-xs">{p.paymentNumber}</span>
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap text-charcoal-600">
                        {new Date(p.paymentDate).toLocaleDateString('en-PK', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="font-medium text-charcoal-900">
                          {p.customer?.name || 'Unknown Customer'}
                        </div>
                        <div className="text-[10px] font-mono text-charcoal-400">
                          {p.customer?.code}
                        </div>
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-charcoal-100 text-charcoal-700">
                          {p.paymentMethod.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-right font-bold text-charcoal-900 whitespace-nowrap">
                        Rs. {Number(p.amount).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3.5 text-right font-medium text-emerald-700 whitespace-nowrap">
                        Rs.{' '}
                        {Number(p.allocatedAmount).toLocaleString('en-PK', {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-3 px-3.5 text-right font-medium text-amber-700 whitespace-nowrap">
                        {Number(p.unallocatedAmount) > 0 ? (
                          <span>
                            Rs.{' '}
                            {Number(p.unallocatedAmount).toLocaleString('en-PK', {
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
                            p.status === 'POSTED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-charcoal-600 whitespace-nowrap">
                        {p.referenceNumber || p.bankName ? (
                          <div>
                            <span className="font-mono text-[11px] font-medium">
                              {p.referenceNumber || 'N/A'}
                            </span>
                            {p.bankName && (
                              <span className="text-[10px] text-charcoal-400 block">
                                {p.bankName}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-charcoal-300">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap text-charcoal-600 text-[11px]">
                        {p.postedByUser?.displayName || p.postedByUser?.username || 'System'}
                      </td>
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewPayment(p)}
                            title="View / Print Voucher"
                            className="p-1 h-7 w-7 text-charcoal-600 hover:text-brand-600"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </Button>

                          {p.status === 'POSTED' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setCancellingPayment(p);
                                setCancellationReason('');
                              }}
                              title="Void / Cancel Payment"
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

        {/* Pagination Bar */}
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
      {/* RECORD CUSTOMER PAYMENT RECEIPT MODAL */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-xl shadow-2xl border border-surface-border flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border bg-surface-muted/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-brand-50 text-brand-600 border border-brand-100">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-charcoal-900">
                    Record Customer Payment Receipt
                  </h2>
                  <p className="text-xs text-charcoal-500">
                    Collect outstanding receivables or accept customer advance deposits
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-charcoal-400 hover:text-charcoal-700 hover:bg-surface-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitPayment} className="flex flex-col flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">
                {/* 1. Header Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Customer Select */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-charcoal-800 mb-1.5">
                      Select Customer <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={selectedCustomerId}
                      onChange={(e) => setSelectedCustomerId(e.target.value)}
                      required
                      className="w-full text-xs rounded-md border border-charcoal-300 bg-white px-3 py-2 text-charcoal-900 font-medium focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    >
                      <option value="">-- Choose Customer --</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.code} - {c.name} (Balance: Rs.{' '}
                          {Number(c.currentBalance).toLocaleString('en-PK', {
                            minimumFractionDigits: 2,
                          })}
                          )
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Payment Date */}
                  <div>
                    <label className="block text-xs font-semibold text-charcoal-800 mb-1.5">
                      Receipt Date <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      required
                      className="text-xs"
                    />
                  </div>
                </div>

                {/* Customer Balance Banner */}
                {selectedCustomer && (
                  <div className="p-3.5 rounded-lg bg-surface-muted/60 border border-surface-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-charcoal-500" />
                      <div>
                        <span className="text-xs font-bold text-charcoal-900">
                          {selectedCustomer.name}
                        </span>
                        <span className="text-[11px] text-charcoal-500 ml-2">
                          ({selectedCustomer.customerType})
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-semibold text-charcoal-500 block">
                        Current Balance
                      </span>
                      <span
                        className={`text-xs font-bold ${
                          Number(selectedCustomer.currentBalance) > 0
                            ? 'text-amber-700'
                            : Number(selectedCustomer.currentBalance) < 0
                            ? 'text-emerald-700'
                            : 'text-charcoal-600'
                        }`}
                      >
                        {Number(selectedCustomer.currentBalance) > 0
                          ? `Rs. ${Number(selectedCustomer.currentBalance).toLocaleString('en-PK', {
                              minimumFractionDigits: 2,
                            })} (Receivable Debt)`
                          : Number(selectedCustomer.currentBalance) < 0
                          ? `Rs. ${Math.abs(Number(selectedCustomer.currentBalance)).toLocaleString(
                              'en-PK',
                              { minimumFractionDigits: 2 },
                            )} (Store Credit)`
                          : 'Rs. 0.00 (Settled)'}
                      </span>
                    </div>
                  </div>
                )}

                {/* 2. Payment Tender Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg bg-surface-muted/30 border border-surface-border">
                  <div>
                    <label className="block text-xs font-semibold text-charcoal-800 mb-1.5">
                      Payment Method <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="w-full text-xs rounded-md border border-charcoal-300 bg-white px-3 py-2 text-charcoal-900 font-medium focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    >
                      <option value="CASH">Cash Drawer</option>
                      <option value="BANK_TRANSFER">Bank Transfer / IBFT</option>
                      <option value="CHEQUE">Bank Cheque</option>
                      <option value="ONLINE">Online Portal</option>
                      <option value="CREDIT_CARD">Credit / Debit Card</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-charcoal-800 mb-1.5">
                      Amount Received (PKR) <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      value={amountReceived}
                      onChange={(e) => setAmountReceived(e.target.value)}
                      required
                      className="text-xs font-bold text-charcoal-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-charcoal-800 mb-1.5">
                      Reference / Cheque #
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g. CHQ-99081 / TXN-4412"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      className="text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-charcoal-800 mb-1.5">
                      Bank Name / Clearing Date
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <Input
                        type="text"
                        placeholder="Bank"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="text-xs"
                      />
                      <Input
                        type="date"
                        value={chequeDate}
                        onChange={(e) => setChequeDate(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Invoice Allocation Breakdown Desk */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal-800">
                        Invoice Settlement Allocation
                      </h3>
                      <p className="text-[11px] text-charcoal-500">
                        Allocate against specific outstanding invoices or leave as unallocated customer advance credit
                      </p>
                    </div>

                    {unpaidInvoices.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAutoDistribute}
                          className="text-[11px] py-1 px-2.5 bg-brand-50 border-brand-200 text-brand-700 font-semibold hover:bg-brand-100"
                        >
                          <Sparkles className="w-3.5 h-3.5 mr-1" />
                          Auto-Distribute (FIFO)
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleClearAllocations}
                          className="text-[11px] py-1 px-2 text-charcoal-500 hover:text-charcoal-800"
                        >
                          Clear
                        </Button>
                      </div>
                    )}
                  </div>

                  {loadingInvoices ? (
                    <div className="py-8 text-center text-charcoal-400 border rounded-lg border-dashed">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-1 text-brand-500" />
                      <span className="text-xs">Loading customer invoices...</span>
                    </div>
                  ) : unpaidInvoices.length === 0 ? (
                    <div className="p-4 rounded-lg bg-surface-muted/40 border border-surface-border text-center text-charcoal-500 text-xs">
                      <Info className="w-4 h-4 mx-auto mb-1 text-charcoal-400" />
                      {selectedCustomerId ? (
                        <span>
                          Customer has no outstanding unpaid invoices. Total payment of{' '}
                          <strong>Rs. {enteredAmount.toFixed(2)}</strong> will be credited as an{' '}
                          <strong>Unallocated Advance Deposit</strong>.
                        </span>
                      ) : (
                        <span>Please select a customer to view open invoices</span>
                      )}
                    </div>
                  ) : (
                    <div className="border border-surface-border rounded-lg overflow-hidden">
                      <table className="w-full text-left text-xs text-charcoal-700">
                        <thead className="bg-surface-muted text-charcoal-600 font-semibold uppercase tracking-wider text-[10px]">
                          <tr>
                            <th className="py-2 px-3">Invoice #</th>
                            <th className="py-2 px-3">Date</th>
                            <th className="py-2 px-3 text-right">Net Total</th>
                            <th className="py-2 px-3 text-right">Paid</th>
                            <th className="py-2 px-3 text-right">Balance Due</th>
                            <th className="py-2 px-3 text-right w-36">Allocate (PKR)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-border">
                          {unpaidInvoices.map((inv) => {
                            const bal = Number(inv.balanceAmount);
                            const currentAlloc = allocations[inv.id] || '';
                            return (
                              <tr key={inv.id} className="hover:bg-surface-muted/30">
                                <td className="py-2.5 px-3 font-mono font-medium text-charcoal-900">
                                  {inv.invoiceNumber}
                                </td>
                                <td className="py-2.5 px-3 text-charcoal-500">
                                  {new Date(inv.invoiceDate).toLocaleDateString()}
                                </td>
                                <td className="py-2.5 px-3 text-right font-medium">
                                  Rs. {Number(inv.netTotal).toFixed(2)}
                                </td>
                                <td className="py-2.5 px-3 text-right text-charcoal-500">
                                  Rs. {Number(inv.paidAmount).toFixed(2)}
                                </td>
                                <td className="py-2.5 px-3 text-right font-bold text-rose-700">
                                  Rs. {bal.toFixed(2)}
                                </td>
                                <td className="py-2.5 px-3 text-right">
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max={bal}
                                    placeholder="0.00"
                                    value={currentAlloc}
                                    onChange={(e) =>
                                      handleAllocationChange(inv.id, e.target.value, bal)
                                    }
                                    className="w-full text-right text-xs py-1 px-2 border rounded border-charcoal-300 font-bold text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-brand-500"
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Live Allocation Breakdown Tally */}
                  <div className="p-3.5 rounded-lg bg-surface-card border border-surface-border grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-charcoal-400 block">
                        Received Amount
                      </span>
                      <span className="text-sm font-bold text-charcoal-900">
                        Rs. {enteredAmount.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-emerald-600 block">
                        Applied to Invoices
                      </span>
                      <span
                        className={`text-sm font-bold ${
                          isOverAllocated ? 'text-rose-600' : 'text-emerald-700'
                        }`}
                      >
                        Rs. {roundedAllocated.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-amber-600 block">
                        Unallocated Advance
                      </span>
                      <span className="text-sm font-bold text-amber-700">
                        Rs. {unallocatedRemainder.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {isOverAllocated && (
                    <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>
                        Total allocated (Rs. {roundedAllocated.toFixed(2)}) exceeds received amount (Rs.{' '}
                        {enteredAmount.toFixed(2)})!
                      </span>
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold text-charcoal-800 mb-1.5">
                    Internal Notes / Memo
                  </label>
                  <Input
                    type="text"
                    placeholder="Optional remarks regarding this payment receipt"
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
                  disabled={isSubmitting || isOverAllocated || enteredAmount <= 0}
                  className="text-xs bg-brand-600 hover:bg-brand-700 text-white font-semibold"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      Posting Receipt...
                    </>
                  ) : (
                    'Post Payment Receipt'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VOUCHER / PRINT PREVIEW MODAL */}
      {/* ========================================================================= */}
      {viewingPayment && (
        <DocumentPrintModal
          isOpen={true}
          onClose={() => setViewingPayment(null)}
          title={`Payment Receipt Voucher — ${viewingPayment.paymentNumber}`}
          subtitle={`Customer: ${viewingPayment.customer?.name || 'Customer'} • Date: ${new Date(viewingPayment.paymentDate).toLocaleDateString('en-GB')}`}
          defaultLayout="A4"
          allowThermalToggle={true}
        >
          {(layout) => {
            const printableData: PrintableCustomerPayment = {
              voucherNumber: viewingPayment.paymentNumber,
              paymentDate: new Date(viewingPayment.paymentDate).toLocaleDateString('en-GB'),
              paymentMethod: viewingPayment.paymentMethod.replace('_', ' '),
              referenceNumber: viewingPayment.referenceNumber || null,
              bankName: viewingPayment.bankName || null,
              customer: {
                name: viewingPayment.customer?.name || 'Walk-in Customer',
                code: viewingPayment.customer?.code || null,
                address: viewingPayment.customer?.address || null,
                city: viewingPayment.customer?.city || null,
                phone: viewingPayment.customer?.phone || null,
              },
              amount: Number(viewingPayment.amount || 0),
              allocations: (viewingPayment.allocations || []).map((a) => ({
                documentNumber: a.salesInvoice?.invoiceNumber || a.salesInvoiceId,
                documentDate: a.salesInvoice?.invoiceDate
                  ? new Date(a.salesInvoice.invoiceDate).toLocaleDateString('en-GB')
                  : '',
                totalDocumentAmount: Number(a.salesInvoice?.netTotal || 0),
                previousBalance: Number(a.salesInvoice?.netTotal || 0),
                allocatedAmount: Number(a.amountAllocated || 0),
                remainingBalance: Math.max(0, Number(a.salesInvoice?.netTotal || 0) - Number(a.amountAllocated || 0)),
              })),
              notes: viewingPayment.notes || null,
              footerNotes: settingsMap['receipt_footer_notes'] || null,
            };

            return (
              <CustomerPaymentReceiptTemplate
                payment={printableData}
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
      {cancellingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-surface-border overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 text-rose-600 mb-3">
                <div className="p-2 rounded-lg bg-rose-50 border border-rose-100">
                  <Ban className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-charcoal-900">
                    Void Payment Receipt
                  </h3>
                  <p className="text-xs text-charcoal-500">
                    Receipt #{cancellingPayment.paymentNumber}
                  </p>
                </div>
              </div>

              <p className="text-xs text-charcoal-600 mb-4">
                Voiding this payment receipt will immediately recalculate all settled invoice balances and
                restore the customer's outstanding receivable balance in the financial ledger.
              </p>

              <div className="mb-4">
                <label className="block text-xs font-semibold text-charcoal-800 mb-1.5">
                  Cancellation Reason <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Dishonoured cheque, wrong party allocated"
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
                  onClick={() => setCancellingPayment(null)}
                  disabled={isCancelling}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
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
