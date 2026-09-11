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
  TrendingDown,
  Sparkles,
  Clock,
  ShieldCheck,
  Landmark,
  Eye,
  Check,
  AlertTriangle,
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
  pdcApi,
  PostDatedCheque,
  PdcStatus,
  CreatePdcDto,
  PdcListMetrics,
} from '../api';
import {
  DocumentPrintModal,
  CustomerPaymentReceiptTemplate,
  PdcReceiptTemplate,
  PrintableCompanyInfo,
  PrintableCustomerPayment,
  PrintablePdcReceipt,
} from '../components/printing';

type PageTab = 'PAYMENTS' | 'PDC';

export const CustomerPaymentsPage: React.FC = () => {
  // Tab State
  const [activeTab, setActiveTab] = useState<PageTab>('PAYMENTS');

  // =========================================================================
  // REGULAR PAYMENTS STATE
  // =========================================================================
  const [payments, setPayments] = useState<CustomerPayment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [summary, setSummary] = useState<{
    totalAmount: number;
    totalAllocated: number;
    totalUnallocated: number;
  }>({ totalAmount: 0, totalAllocated: 0, totalUnallocated: 0 });

  // Create Regular Payment Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [unpaidInvoices, setUnpaidInvoices] = useState<UnpaidInvoiceSummary[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState<boolean>(false);

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

  // View / Print Regular Payment Modal State
  const [viewingPayment, setViewingPayment] = useState<CustomerPayment | null>(null);
  const [cancellingPayment, setCancellingPayment] = useState<CustomerPayment | null>(null);
  const [cancellationReason, setCancellationReason] = useState<string>('');
  const [isCancelling, setIsCancelling] = useState<boolean>(false);

  // =========================================================================
  // POST-DATED CHEQUES (PDC) STATE (Phase 20E)
  // =========================================================================
  const [pdcs, setPdcs] = useState<PostDatedCheque[]>([]);
  const [isLoadingPdcs, setIsLoadingPdcs] = useState<boolean>(false);
  const [pdcSearch, setPdcSearch] = useState<string>('');
  const [pdcStatusFilter, setPdcStatusFilter] = useState<string>('ALL');
  const [pdcCustomerFilter, setPdcCustomerFilter] = useState<string>('ALL');
  const [pdcStartDate, setPdcStartDate] = useState<string>('');
  const [pdcEndDate, setPdcEndDate] = useState<string>('');

  const [pdcCurrentPage, setPdcCurrentPage] = useState<number>(1);
  const [pdcTotalPages, setPdcTotalPages] = useState<number>(1);
  const [pdcMetrics, setPdcMetrics] = useState<PdcListMetrics>({
    receivedCount: 0,
    receivedAmount: 0,
    depositedCount: 0,
    depositedAmount: 0,
    clearedCount: 0,
    clearedAmount: 0,
    bouncedCount: 0,
    bouncedAmount: 0,
    cancelledCount: 0,
    cancelledAmount: 0,
    totalPendingAmount: 0,
  });

  // PDC Action Modals
  const [isCreatePdcModalOpen, setIsCreatePdcModalOpen] = useState<boolean>(false);
  const [pdcCustomerId, setPdcCustomerId] = useState<string>('');
  const [pdcCustomerObj, setPdcCustomerObj] = useState<Customer | null>(null);
  const [pdcChequeNumber, setPdcChequeNumber] = useState<string>('');
  const [pdcBankName, setPdcBankName] = useState<string>('');
  const [pdcChequeDate, setPdcChequeDate] = useState<string>('');
  const [pdcReceivedDate, setPdcReceivedDate] = useState<string>(
    new Date().toISOString().split('T')[0],
  );
  const [pdcAmount, setPdcAmount] = useState<string>('');
  const [pdcNotes, setPdcNotes] = useState<string>('');
  const [pdcAllocations, setPdcAllocations] = useState<Record<string, number>>({});
  const [isSubmittingPdc, setIsSubmittingPdc] = useState<boolean>(false);

  // Deposit PDC Modal
  const [depositingPdc, setDepositingPdc] = useState<PostDatedCheque | null>(null);
  const [depositBankName, setDepositBankName] = useState<string>('');
  const [depositReference, setDepositReference] = useState<string>('');
  const [depositedAtDate, setDepositedAtDate] = useState<string>(
    new Date().toISOString().split('T')[0],
  );
  const [isDepositing, setIsDepositing] = useState<boolean>(false);

  // Clear PDC Modal
  const [clearingPdc, setClearingPdc] = useState<PostDatedCheque | null>(null);
  const [clearedAtDate, setClearedAtDate] = useState<string>(
    new Date().toISOString().split('T')[0],
  );
  const [clearingNotes, setClearingNotes] = useState<string>('');
  const [isClearing, setIsClearing] = useState<boolean>(false);

  // Bounce PDC Modal
  const [bouncingPdc, setBouncingPdc] = useState<PostDatedCheque | null>(null);
  const [bounceReason, setBounceReason] = useState<string>('');
  const [bouncedAtDate, setBouncedAtDate] = useState<string>(
    new Date().toISOString().split('T')[0],
  );
  const [isBouncing, setIsBouncing] = useState<boolean>(false);

  // Cancel PDC Modal
  const [cancellingPdc, setCancellingPdc] = useState<PostDatedCheque | null>(null);
  const [pdcCancellationReason, setPdcCancellationReason] = useState<string>('');
  const [isCancellingPdc, setIsCancellingPdc] = useState<boolean>(false);

  // View Details PDC Modal
  const [viewingPdc, setViewingPdc] = useState<PostDatedCheque | null>(null);

  // Print Custody Receipt Modal
  const [printingPdc, setPrintingPdc] = useState<PostDatedCheque | null>(null);

  // Common Auxiliary State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [company, setCompany] = useState<PrintableCompanyInfo>({
    name: 'MEDIX Pharmacy',
    legalName: 'MEDIX Pharma Distribution',
  });
  const [settingsMap, setSettingsMap] = useState<Record<string, string>>({});

  // Toast Feedback
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4500);
  };

  // Load Customers & Aux Data
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

  // Load Regular Payments list
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

  // Load PDCs list
  const loadPdcs = useCallback(async () => {
    setIsLoadingPdcs(true);
    try {
      const res = await pdcApi.getPdcs({
        search: pdcSearch.trim() || undefined,
        status: pdcStatusFilter !== 'ALL' ? (pdcStatusFilter as PdcStatus) : undefined,
        customerId: pdcCustomerFilter !== 'ALL' ? pdcCustomerFilter : undefined,
        startDate: pdcStartDate || undefined,
        endDate: pdcEndDate || undefined,
        page: pdcCurrentPage,
        limit: 20,
      });

      setPdcs(res.items || []);
      setPdcTotalPages(res.pagination.totalPages || 1);
      setPdcMetrics(res.metrics);
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || 'Failed to load Post-Dated Cheques');
    } finally {
      setIsLoadingPdcs(false);
    }
  }, [pdcSearch, pdcStatusFilter, pdcCustomerFilter, pdcStartDate, pdcEndDate, pdcCurrentPage]);

  useEffect(() => {
    if (activeTab === 'PAYMENTS') {
      loadPayments();
    } else {
      loadPdcs();
    }
  }, [activeTab, loadPayments, loadPdcs]);

  // Customer unpaid invoices in Regular Payment modal
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

  // Customer unpaid invoices in PDC modal
  useEffect(() => {
    if (!pdcCustomerId) {
      setPdcCustomerObj(null);
      setUnpaidInvoices([]);
      setPdcAllocations({});
      return;
    }

    const found = customers.find((c) => c.id === pdcCustomerId) || null;
    setPdcCustomerObj(found);

    const fetchInvoices = async () => {
      setLoadingInvoices(true);
      try {
        const invs = await customerPaymentsApi.getUnpaidInvoices(pdcCustomerId);
        setUnpaidInvoices(invs);
        setPdcAllocations({});
      } catch (err: any) {
        showFeedback('error', err.response?.data?.message || 'Failed to fetch customer unpaid invoices');
      } finally {
        setLoadingInvoices(false);
      }
    };

    fetchInvoices();
  }, [pdcCustomerId, customers]);

  // Allocation handlers for Regular Payment
  const handleAllocationChange = (invoiceId: string, val: string, maxBalance: number) => {
    const num = parseFloat(val);
    if (isNaN(num) || num <= 0) {
      const next = { ...allocations };
      delete next[invoiceId];
      setAllocations(next);
      return;
    }
    const clamped = Math.min(num, maxBalance);
    setAllocations({
      ...allocations,
      [invoiceId]: Math.round(clamped * 100) / 100,
    });
  };

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

  // Allocation handlers for PDC
  const handlePdcAllocationChange = (invoiceId: string, val: string, maxBalance: number) => {
    const num = parseFloat(val);
    if (isNaN(num) || num <= 0) {
      const next = { ...pdcAllocations };
      delete next[invoiceId];
      setPdcAllocations(next);
      return;
    }
    const clamped = Math.min(num, maxBalance);
    setPdcAllocations({
      ...pdcAllocations,
      [invoiceId]: Math.round(clamped * 100) / 100,
    });
  };

  const handlePdcAutoDistribute = () => {
    const totalPay = parseFloat(pdcAmount);
    if (isNaN(totalPay) || totalPay <= 0) {
      showFeedback('error', 'Please enter a valid cheque amount first to auto-distribute');
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

    setPdcAllocations(nextAlloc);
    showFeedback('success', 'Cheque amount pre-allocated across oldest unpaid invoices (FIFO)');
  };

  // Derived amounts in Regular Payment modal
  const enteredAmount = parseFloat(amountReceived) || 0;
  const totalAllocatedInModal = Object.values(allocations).reduce((sum, v) => sum + v, 0);
  const roundedAllocated = Math.round(totalAllocatedInModal * 100) / 100;
  const unallocatedRemainder = Math.max(0, Math.round((enteredAmount - roundedAllocated) * 100) / 100);
  const isOverAllocated = roundedAllocated > enteredAmount + 0.001;

  // Derived amounts in PDC modal
  const enteredPdcAmount = parseFloat(pdcAmount) || 0;
  const totalPdcAllocated = Object.values(pdcAllocations).reduce((sum, v) => sum + v, 0);
  const roundedPdcAllocated = Math.round(totalPdcAllocated * 100) / 100;
  const unallocatedPdcRemainder = Math.max(0, Math.round((enteredPdcAmount - roundedPdcAllocated) * 100) / 100);
  const isPdcOverAllocated = roundedPdcAllocated > enteredPdcAmount + 0.001;

  // Submit Regular Payment
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
      resetRegularForm();
      loadPayments();
      setViewingPayment(created);
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || 'Failed to post customer payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetRegularForm = () => {
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

  // Submit PDC
  const handleSubmitPdc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdcCustomerId) {
      showFeedback('error', 'Please select a customer');
      return;
    }
    if (!pdcChequeNumber.trim()) {
      showFeedback('error', 'Please enter the cheque number');
      return;
    }
    if (!pdcBankName.trim()) {
      showFeedback('error', 'Please enter the bank name');
      return;
    }
    if (!pdcChequeDate) {
      showFeedback('error', 'Please select the cheque maturity date');
      return;
    }
    if (enteredPdcAmount <= 0) {
      showFeedback('error', 'Cheque face value must be greater than zero');
      return;
    }
    if (isPdcOverAllocated) {
      showFeedback(
        'error',
        `Total pre-allocated (Rs. ${roundedPdcAllocated.toFixed(2)}) cannot exceed cheque amount (Rs. ${enteredPdcAmount.toFixed(2)})`,
      );
      return;
    }

    const payloadAllocations = Object.entries(pdcAllocations)
      .filter(([_, amt]) => amt > 0)
      .map(([salesInvoiceId, amountAllocated]) => ({
        salesInvoiceId,
        amountAllocated,
      }));

    const payload: CreatePdcDto = {
      customerId: pdcCustomerId,
      chequeNumber: pdcChequeNumber.trim(),
      bankName: pdcBankName.trim(),
      chequeDate: pdcChequeDate,
      receivedDate: pdcReceivedDate || undefined,
      amount: enteredPdcAmount,
      notes: pdcNotes.trim() || undefined,
      allocations: payloadAllocations.length > 0 ? payloadAllocations : undefined,
    };

    setIsSubmittingPdc(true);
    try {
      const created = await pdcApi.createPdc(payload);
      showFeedback(
        'success',
        `PDC ${created.pdcNumber} registered in custody. Zero financial ledger impact until clearance.`,
      );
      setIsCreatePdcModalOpen(false);
      resetPdcForm();
      loadPdcs();
      setPrintingPdc(created);
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || 'Failed to register Post-Dated Cheque');
    } finally {
      setIsSubmittingPdc(false);
    }
  };

  const resetPdcForm = () => {
    setPdcCustomerId('');
    setPdcCustomerObj(null);
    setPdcChequeNumber('');
    setPdcBankName('');
    setPdcChequeDate('');
    setPdcReceivedDate(new Date().toISOString().split('T')[0]);
    setPdcAmount('');
    setPdcNotes('');
    setPdcAllocations({});
  };

  // Deposit PDC
  const handleConfirmDeposit = async () => {
    if (!depositingPdc) return;
    if (!depositBankName.trim()) {
      showFeedback('error', 'Please provide the deposit bank name');
      return;
    }

    setIsDepositing(true);
    try {
      await pdcApi.depositPdc(depositingPdc.id, {
        depositBankName: depositBankName.trim(),
        depositReference: depositReference.trim() || undefined,
        depositedAt: depositedAtDate || undefined,
      });
      showFeedback('success', `PDC ${depositingPdc.pdcNumber} recorded as deposited in ${depositBankName}`);
      setDepositingPdc(null);
      setDepositBankName('');
      setDepositReference('');
      loadPdcs();
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || 'Failed to deposit PDC');
    } finally {
      setIsDepositing(false);
    }
  };

  // Clear PDC
  const handleConfirmClear = async () => {
    if (!clearingPdc) return;

    setIsClearing(true);
    try {
      const cleared = await pdcApi.clearPdc(clearingPdc.id, {
        clearedAt: clearedAtDate || undefined,
        notes: clearingNotes.trim() || undefined,
      });
      showFeedback(
        'success',
        `PDC ${clearingPdc.pdcNumber} cleared! Payment voucher ${cleared.customerPayment?.paymentNumber || ''} created with authoritative ledger credit.`,
      );
      setClearingPdc(null);
      setClearingNotes('');
      loadPdcs();
      if (cleared.customerPayment) {
        setViewingPayment(cleared.customerPayment);
      }
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || 'Failed to clear Post-Dated Cheque');
    } finally {
      setIsClearing(false);
    }
  };

  // Bounce PDC
  const handleConfirmBounce = async () => {
    if (!bouncingPdc) return;
    if (!bounceReason.trim()) {
      showFeedback('error', 'Please enter the bounce/dishonor reason');
      return;
    }

    setIsBouncing(true);
    try {
      await pdcApi.bouncePdc(bouncingPdc.id, {
        bounceReason: bounceReason.trim(),
        bouncedAt: bouncedAtDate || undefined,
      });
      showFeedback('success', `PDC ${bouncingPdc.pdcNumber} marked as bounced`);
      setBouncingPdc(null);
      setBounceReason('');
      loadPdcs();
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || 'Failed to record bounced PDC');
    } finally {
      setIsBouncing(false);
    }
  };

  // Cancel PDC
  const handleConfirmCancelPdc = async () => {
    if (!cancellingPdc) return;
    if (!pdcCancellationReason.trim()) {
      showFeedback('error', 'Please enter the cancellation/return reason');
      return;
    }

    setIsCancellingPdc(true);
    try {
      await pdcApi.cancelPdc(cancellingPdc.id, {
        cancellationReason: pdcCancellationReason.trim(),
      });
      showFeedback('success', `PDC ${cancellingPdc.pdcNumber} cancelled & returned`);
      setCancellingPdc(null);
      setPdcCancellationReason('');
      loadPdcs();
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || 'Failed to cancel PDC');
    } finally {
      setIsCancellingPdc(false);
    }
  };

  // Cancel Regular Payment
  const handleConfirmCancelPayment = async () => {
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

  // Maturity calculations helper
  const getPdcMaturityStatus = (chequeDateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maturity = new Date(chequeDateStr);
    maturity.setHours(0, 0, 0, 0);

    const diffDays = Math.round((maturity.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: `Matured (${Math.abs(diffDays)}d ago)`, isMature: true, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    } else if (diffDays === 0) {
      return { label: 'Matures Today', isMature: true, color: 'text-amber-800 bg-amber-50 border-amber-300 font-bold animate-pulse' };
    } else {
      return { label: `Due in ${diffDays} day${diffDays !== 1 ? 's' : ''}`, isMature: false, color: 'text-indigo-700 bg-indigo-50 border-indigo-200' };
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
                Receivables collection, multi-invoice settlement, advance deposits, and post-dated cheque custody
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher & Header Buttons */}
        <div className="flex items-center gap-3">
          {/* Navigation Pill Switcher */}
          <div className="flex items-center bg-surface-muted p-1 rounded-lg border border-surface-border text-xs font-semibold">
            <button
              onClick={() => setActiveTab('PAYMENTS')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                activeTab === 'PAYMENTS'
                  ? 'bg-white text-charcoal-900 shadow-xs font-bold'
                  : 'text-charcoal-600 hover:text-charcoal-900'
              }`}
            >
              <Receipt className="w-3.5 h-3.5 text-brand-600" />
              <span>Regular Payments</span>
              {totalRecords > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-brand-50 text-brand-700">
                  {totalRecords}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('PDC')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                activeTab === 'PDC'
                  ? 'bg-white text-charcoal-900 shadow-xs font-bold'
                  : 'text-charcoal-600 hover:text-charcoal-900'
              }`}
            >
              <Landmark className="w-3.5 h-3.5 text-indigo-600" />
              <span>Post-Dated Cheques (PDC)</span>
              {(pdcMetrics.receivedCount + pdcMetrics.depositedCount) > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-50 text-indigo-700 font-bold">
                  {pdcMetrics.receivedCount + pdcMetrics.depositedCount} Pending
                </span>
              )}
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={activeTab === 'PAYMENTS' ? loadPayments : loadPdcs}
            disabled={isLoading || isLoadingPdcs}
            className="flex items-center gap-1.5 text-xs text-charcoal-700 hover:text-charcoal-900"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading || isLoadingPdcs ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>

          {activeTab === 'PAYMENTS' ? (
            <Button
              size="sm"
              onClick={() => {
                resetRegularForm();
                setIsCreateModalOpen(true);
              }}
              className="flex items-center gap-1.5 text-xs bg-brand-600 hover:bg-brand-700 text-white font-semibold shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Record Payment Receipt</span>
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => {
                resetPdcForm();
                setIsCreatePdcModalOpen(true);
              }}
              className="flex items-center gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Receive New PDC</span>
            </Button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: REGULAR PAYMENTS CONTENT */}
      {/* ========================================================================= */}
      {activeTab === 'PAYMENTS' && (
        <>
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

              <div>
                <select
                  value={methodFilter}
                  onChange={(e) => setMethodFilter(e.target.value)}
                  className="w-full text-xs h-9 rounded-md border border-surface-border bg-white px-3 py-1 text-charcoal-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="ALL">All Payment Modes</option>
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CHEQUE">Spot Cheque</option>
                  <option value="ONLINE">Online Portal</option>
                  <option value="CREDIT_CARD">Credit / Debit Card</option>
                </select>
              </div>

              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full text-xs h-9 rounded-md border border-surface-border bg-white px-3 py-1 text-charcoal-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="POSTED">Posted (Valid)</option>
                  <option value="CANCELLED">Voided / Cancelled</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="text-xs h-9"
                  title="From Date"
                />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="text-xs h-9"
                  title="To Date"
                />
              </div>
            </div>
          </Card>

          {/* Payments Table */}
          <Card className="bg-white border border-surface-border shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-surface-muted border-b border-surface-border text-charcoal-600 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Receipt #</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Method & Ref</th>
                    <th className="py-3 px-4 text-right">Amount (Rs.)</th>
                    <th className="py-3 px-4 text-right">Settled</th>
                    <th className="py-3 px-4 text-right">Advance</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border text-charcoal-800">
                  {isLoading ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-charcoal-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-600" />
                        <span>Loading payment receipts...</span>
                      </td>
                    </tr>
                  ) : payments.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-charcoal-400">
                        <Receipt className="w-8 h-8 mx-auto mb-2 text-charcoal-300 stroke-1" />
                        <p className="font-semibold text-charcoal-600">No payment receipts found</p>
                        <p className="text-xs mt-0.5">Try adjusting your filters or record a new customer receipt.</p>
                      </td>
                    </tr>
                  ) : (
                    payments.map((p) => {
                      const isCancelled = p.status === 'CANCELLED';
                      return (
                        <tr
                          key={p.id}
                          className={`hover:bg-surface-muted/50 transition-colors ${
                            isCancelled ? 'bg-rose-50/30 opacity-75' : ''
                          }`}
                        >
                          <td className="py-3 px-4 font-mono font-bold text-brand-700">
                            {p.paymentNumber}
                          </td>
                          <td className="py-3 px-4 text-charcoal-600 whitespace-nowrap">
                            {new Date(p.paymentDate).toLocaleDateString('en-GB')}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-charcoal-900">{p.customer?.name || 'Walk-in'}</div>
                            {p.customer?.code && (
                              <div className="text-[10px] text-charcoal-400 font-mono">{p.customer.code}</div>
                            )}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-medium">{p.paymentMethod.replace('_', ' ')}</span>
                            {p.referenceNumber && (
                              <div className="text-[10px] text-charcoal-500 font-mono">Ref: {p.referenceNumber}</div>
                            )}
                            {p.bankName && (
                              <div className="text-[10px] text-charcoal-400">{p.bankName}</div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-charcoal-900">
                            Rs. {Number(p.amount).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-emerald-700 font-medium">
                            Rs. {Number(p.allocatedAmount).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-amber-700 font-medium">
                            Rs. {Number(p.unallocatedAmount).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-4 text-center">
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
                          <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setViewingPayment(p)}
                              title="Print / View Voucher"
                              className="h-7 w-7 p-0 text-charcoal-600 hover:text-charcoal-900"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </Button>
                            {!isCancelled && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setCancellationReason('');
                                  setCancellingPayment(p);
                                }}
                                title="Void Payment"
                                className="h-7 w-7 p-0 text-rose-600 hover:text-rose-800 hover:bg-rose-50"
                              >
                                <Ban className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Regular Pagination */}
            {totalPages > 1 && (
              <div className="p-3 border-t border-surface-border flex items-center justify-between text-xs text-charcoal-600">
                <span>Page {currentPage} of {totalPages}</span>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="h-7 px-2.5 text-xs"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="h-7 px-2.5 text-xs"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: POST-DATED CHEQUES (PDC) CONTENT (Phase 20E) */}
      {/* ========================================================================= */}
      {activeTab === 'PDC' && (
        <>
          {/* PDC Custodial Banner */}
          <div className="bg-indigo-950 text-white rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm border border-indigo-900">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-indigo-900/80 text-indigo-200 shrink-0 mt-0.5">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-indigo-100 flex items-center gap-2">
                  Post-Dated Cheque (PDC) Custodial Vault
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-800 text-indigo-200 border border-indigo-700">
                    Pharma Receivables Rule
                  </span>
                </h3>
                <p className="text-xs text-indigo-200/80 mt-1 max-w-3xl leading-relaxed">
                  PDCs are custodial financial instruments. Receiving or depositing a cheque does <strong>not</strong> modify customer balances or ledger receivables until bank clearance occurs on or after maturity.
                </p>
              </div>
            </div>

            <Button
              size="sm"
              onClick={() => {
                resetPdcForm();
                setIsCreatePdcModalOpen(true);
              }}
              className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-xs shrink-0 shadow-sm"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              <span>Receive New PDC</span>
            </Button>
          </div>

          {/* PDC KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            <Card className="p-3.5 bg-white border border-surface-border shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-blue-700">In Custody (Vault)</span>
                <span className="p-1 rounded bg-blue-50 text-blue-600">
                  <Clock className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="mt-1.5 text-base font-bold text-blue-950 font-mono">
                Rs. {pdcMetrics.receivedAmount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[10.5px] text-charcoal-500 mt-0.5">
                {pdcMetrics.receivedCount} cheque{pdcMetrics.receivedCount !== 1 ? 's' : ''} awaiting deposit
              </p>
            </Card>

            <Card className="p-3.5 bg-white border border-surface-border shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-700">In Bank Clearing</span>
                <span className="p-1 rounded bg-amber-50 text-amber-600">
                  <Landmark className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="mt-1.5 text-base font-bold text-amber-950 font-mono">
                Rs. {pdcMetrics.depositedAmount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[10.5px] text-charcoal-500 mt-0.5">
                {pdcMetrics.depositedCount} cheque{pdcMetrics.depositedCount !== 1 ? 's' : ''} deposited
              </p>
            </Card>

            <Card className="p-3.5 bg-white border border-surface-border shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-700">Cleared & Settled</span>
                <span className="p-1 rounded bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="mt-1.5 text-base font-bold text-emerald-950 font-mono">
                Rs. {pdcMetrics.clearedAmount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[10.5px] text-charcoal-500 mt-0.5">
                {pdcMetrics.clearedCount} credited to ledger
              </p>
            </Card>

            <Card className="p-3.5 bg-white border border-surface-border shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-rose-700">Bounced / Dishonored</span>
                <span className="p-1 rounded bg-rose-50 text-rose-600">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="mt-1.5 text-base font-bold text-rose-950 font-mono">
                Rs. {pdcMetrics.bouncedAmount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[10.5px] text-charcoal-500 mt-0.5">
                {pdcMetrics.bouncedCount} returned by bank
              </p>
            </Card>

            <Card className="p-3.5 bg-indigo-50/50 border border-indigo-100 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-900">Total Pending Face Value</span>
                <span className="p-1 rounded bg-indigo-100 text-indigo-700 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="mt-1.5 text-base font-bold text-indigo-950 font-mono">
                Rs. {pdcMetrics.totalPendingAmount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[10.5px] text-indigo-700 mt-0.5">
                Custody + Deposited total
              </p>
            </Card>
          </div>

          {/* PDC Filter Bar */}
          <Card className="p-3.5 bg-white border border-surface-border shadow-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-center">
              <div className="relative md:col-span-2">
                <Search className="w-4 h-4 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="text"
                  placeholder="Search PDC #, cheque #, bank, customer..."
                  value={pdcSearch}
                  onChange={(e) => setPdcSearch(e.target.value)}
                  className="pl-9 text-xs"
                />
              </div>

              <div>
                <select
                  value={pdcStatusFilter}
                  onChange={(e) => setPdcStatusFilter(e.target.value)}
                  className="w-full text-xs h-9 rounded-md border border-surface-border bg-white px-3 py-1 text-charcoal-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="ALL">All PDC Statuses</option>
                  <option value="RECEIVED">Received (In Custody)</option>
                  <option value="DEPOSITED">Deposited (In Bank)</option>
                  <option value="CLEARED">Cleared (Settled)</option>
                  <option value="BOUNCED">Bounced</option>
                  <option value="CANCELLED">Cancelled / Returned</option>
                </select>
              </div>

              <div>
                <select
                  value={pdcCustomerFilter}
                  onChange={(e) => setPdcCustomerFilter(e.target.value)}
                  className="w-full text-xs h-9 rounded-md border border-surface-border bg-white px-3 py-1 text-charcoal-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="ALL">All Customers</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1">
                <Input
                  type="date"
                  value={pdcStartDate}
                  onChange={(e) => setPdcStartDate(e.target.value)}
                  className="text-xs h-9"
                  title="Cheque Maturity From"
                />
                <Input
                  type="date"
                  value={pdcEndDate}
                  onChange={(e) => setPdcEndDate(e.target.value)}
                  className="text-xs h-9"
                  title="Cheque Maturity To"
                />
              </div>
            </div>
          </Card>

          {/* PDC Table */}
          <Card className="bg-white border border-surface-border shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-surface-muted border-b border-surface-border text-charcoal-600 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">PDC #</th>
                    <th className="py-3 px-4">Cheque # & Bank</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Maturity (Cheque Date)</th>
                    <th className="py-3 px-4 text-right">Face Value (Rs.)</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4">Deposit / Settlement Ref</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border text-charcoal-800">
                  {isLoadingPdcs ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-charcoal-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                        <span>Loading post-dated cheques register...</span>
                      </td>
                    </tr>
                  ) : pdcs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-charcoal-400">
                        <Landmark className="w-8 h-8 mx-auto mb-2 text-charcoal-300 stroke-1" />
                        <p className="font-semibold text-charcoal-600">No Post-Dated Cheques in register</p>
                        <p className="text-xs mt-0.5">Click "Receive New PDC" to accept custody of a post-dated cheque.</p>
                      </td>
                    </tr>
                  ) : (
                    pdcs.map((pdc) => {
                      const maturityInfo = getPdcMaturityStatus(pdc.chequeDate);
                      const isReceived = pdc.status === 'RECEIVED';
                      const isDeposited = pdc.status === 'DEPOSITED';
                      const isCleared = pdc.status === 'CLEARED';
                      const isBounced = pdc.status === 'BOUNCED';
                      const isCancelled = pdc.status === 'CANCELLED';

                      return (
                        <tr
                          key={pdc.id}
                          className={`hover:bg-surface-muted/50 transition-colors ${
                            isBounced ? 'bg-rose-50/20' : isCancelled ? 'bg-charcoal-50/50 opacity-70' : ''
                          }`}
                        >
                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-indigo-900 block">
                              {pdc.pdcNumber}
                            </span>
                            <span className="text-[10px] text-charcoal-400 block">
                              Rec: {new Date(pdc.receivedDate).toLocaleDateString('en-GB')}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <div className="font-mono font-bold text-charcoal-900">{pdc.chequeNumber}</div>
                            <div className="text-[11px] text-charcoal-600">{pdc.bankName}</div>
                          </td>

                          <td className="py-3 px-4">
                            <div className="font-medium text-charcoal-900">{pdc.customer?.name || 'Customer'}</div>
                            <div className="text-[10px] text-charcoal-400 font-mono">{pdc.customer?.code}</div>
                          </td>

                          <td className="py-3 px-4">
                            <div className="font-medium text-charcoal-900 whitespace-nowrap">
                              {new Date(pdc.chequeDate).toLocaleDateString('en-GB')}
                            </div>
                            <span
                              className={`inline-block px-1.5 py-0.2 rounded text-[10px] border font-medium mt-0.5 ${maturityInfo.color}`}
                            >
                              {maturityInfo.label}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right font-mono font-bold text-charcoal-900">
                            Rs. {Number(pdc.amount).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                          </td>

                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                isReceived
                                  ? 'bg-blue-100 text-blue-800'
                                  : isDeposited
                                  ? 'bg-amber-100 text-amber-800'
                                  : isCleared
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : isBounced
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-gray-200 text-gray-800'
                              }`}
                            >
                              {pdc.status}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-xs text-charcoal-600">
                            {isCleared && pdc.customerPayment && (
                              <button
                                onClick={() => setViewingPayment(pdc.customerPayment!)}
                                className="text-emerald-700 hover:underline font-mono font-semibold flex items-center gap-1"
                              >
                                <Receipt className="w-3 h-3" />
                                {pdc.customerPayment.paymentNumber}
                              </button>
                            )}
                            {isDeposited && pdc.depositBankName && (
                              <div className="text-[11px] text-amber-800">
                                <strong>Dep:</strong> {pdc.depositBankName} {pdc.depositReference ? `(${pdc.depositReference})` : ''}
                              </div>
                            )}
                            {isBounced && (
                              <div className="text-[10px] text-rose-700 font-medium">
                                Reason: {pdc.bounceReason}
                              </div>
                            )}
                            {isCancelled && (
                              <div className="text-[10px] text-gray-500 font-medium">
                                Reason: {pdc.cancellationReason}
                              </div>
                            )}
                          </td>

                          <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                            {/* Deposit Button (if RECEIVED) */}
                            {isReceived && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setDepositBankName('');
                                  setDepositReference('');
                                  setDepositingPdc(pdc);
                                }}
                                className="h-7 px-2 text-[11px] bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 font-semibold"
                                title="Record bank deposit"
                              >
                                Deposit
                              </Button>
                            )}

                            {/* Clear Button (if RECEIVED or DEPOSITED) */}
                            {(isReceived || isDeposited) && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setClearingNotes('');
                                  setClearingPdc(pdc);
                                }}
                                disabled={!maturityInfo.isMature}
                                title={
                                  maturityInfo.isMature
                                    ? 'Execute bank clearance and generate customer payment receipt'
                                    : 'Early clearance is disallowed. Cheque must reach maturity date.'
                                }
                                className={`h-7 px-2 text-[11px] font-semibold text-white ${
                                  maturityInfo.isMature
                                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-xs'
                                    : 'bg-gray-300 cursor-not-allowed text-gray-600'
                                }`}
                              >
                                Clear
                              </Button>
                            )}

                            {/* Bounce Button */}
                            {(isReceived || isDeposited) && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setBounceReason('');
                                  setBouncingPdc(pdc);
                                }}
                                className="h-7 px-2 text-[11px] text-rose-700 border-rose-200 hover:bg-rose-50"
                                title="Mark as bounced/dishonored"
                              >
                                Bounce
                              </Button>
                            )}

                            {/* Cancel / Return Button */}
                            {(isReceived || isDeposited) && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setPdcCancellationReason('');
                                  setCancellingPdc(pdc);
                                }}
                                className="h-7 px-2 text-[11px] text-gray-600 border-gray-200 hover:bg-gray-100"
                                title="Cancel / return cheque to customer"
                              >
                                Cancel
                              </Button>
                            )}

                            {/* Print Custody Receipt */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setPrintingPdc(pdc)}
                              title="Print Custody Acknowledgment Receipt"
                              className="h-7 w-7 p-0 text-indigo-700 hover:bg-indigo-50"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </Button>

                            {/* View Full Info Drawer/Modal */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setViewingPdc(pdc)}
                              title="View Lifecycle Timeline"
                              className="h-7 w-7 p-0 text-charcoal-600 hover:text-charcoal-900"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* PDC Pagination */}
            {pdcTotalPages > 1 && (
              <div className="p-3 border-t border-surface-border flex items-center justify-between text-xs text-charcoal-600">
                <span>Page {pdcCurrentPage} of {pdcTotalPages}</span>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pdcCurrentPage <= 1}
                    onClick={() => setPdcCurrentPage((p) => Math.max(1, p - 1))}
                    className="h-7 px-2.5 text-xs"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pdcCurrentPage >= pdcTotalPages}
                    onClick={() => setPdcCurrentPage((p) => Math.min(pdcTotalPages, p + 1))}
                    className="h-7 px-2.5 text-xs"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </>
      )}

      {/* ========================================================================= */}
      {/* MODAL: RECEIVE NEW PDC */}
      {/* ========================================================================= */}
      {isCreatePdcModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-surface-border overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 bg-indigo-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Landmark className="w-5 h-5 text-indigo-300" />
                <div>
                  <h2 className="text-base font-bold">Receive Post-Dated Cheque (PDC)</h2>
                  <p className="text-[11px] text-indigo-200">
                    Safe custody registration with intended invoice settlement pre-allocation
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreatePdcModalOpen(false)}
                className="text-indigo-200 hover:text-white p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPdc} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="bg-amber-50 border-l-4 border-amber-500 p-2.5 text-[11px] text-amber-900 rounded">
                <strong>Custodial Vault Invariant:</strong> Registering a PDC does <strong>not</strong> affect customer ledger balance, invoice balances, or credit limit usage until bank clearance occurs at maturity.
              </div>

              {/* Customer Selector */}
              <div>
                <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                  Customer / Drawer <span className="text-rose-500">*</span>
                </label>
                <select
                  value={pdcCustomerId}
                  onChange={(e) => setPdcCustomerId(e.target.value)}
                  className="w-full text-xs h-9 rounded-md border border-surface-border bg-white px-3 py-1 text-charcoal-900 focus:ring-1 focus:ring-indigo-500"
                  required
                >
                  <option value="">Select customer...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code}) {c.city ? `— ${c.city}` : ''} [Balance: Rs. {Number(c.currentBalance).toFixed(2)}]
                    </option>
                  ))}
                </select>
                {pdcCustomerObj && (
                  <div className="mt-1 flex items-center gap-4 text-[11px] text-charcoal-500">
                    <span>Outstanding Receivable: <strong className="text-charcoal-900 font-mono">Rs. {Number(pdcCustomerObj.currentBalance).toFixed(2)}</strong></span>
                    {pdcCustomerObj.phone && <span>Phone: {pdcCustomerObj.phone}</span>}
                  </div>
                )}
              </div>

              {/* Cheque Banking Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                    Cheque Number <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. CHQ-998811"
                    value={pdcChequeNumber}
                    onChange={(e) => setPdcChequeNumber(e.target.value)}
                    className="text-xs font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                    Drawee Bank Name <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. Meezan Bank, HBL, MCB"
                    value={pdcBankName}
                    onChange={(e) => setPdcBankName(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>
              </div>

              {/* Dates and Face Value */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                    Cheque Maturity Date <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="date"
                    value={pdcChequeDate}
                    onChange={(e) => setPdcChequeDate(e.target.value)}
                    className="text-xs font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                    Received in Custody Date
                  </label>
                  <Input
                    type="date"
                    value={pdcReceivedDate}
                    onChange={(e) => setPdcReceivedDate(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                    Cheque Amount (Rs.) <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    value={pdcAmount}
                    onChange={(e) => setPdcAmount(e.target.value)}
                    className="text-xs font-mono font-bold text-indigo-900"
                    required
                  />
                </div>
              </div>

              {/* Pre-allocations Table against Unpaid Invoices */}
              {pdcCustomerId && (
                <div className="border border-surface-border rounded-lg p-3 bg-surface-muted/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-charcoal-900">
                      Pre-allocate Settlement Intent (Optional)
                    </span>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handlePdcAutoDistribute}
                        className="h-6 px-2 text-[10px]"
                      >
                        FIFO Auto-Distribute
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setPdcAllocations({})}
                        className="h-6 px-2 text-[10px] text-charcoal-500"
                      >
                        Clear
                      </Button>
                    </div>
                  </div>

                  {loadingInvoices ? (
                    <div className="py-4 text-center text-xs text-charcoal-500">Loading unpaid invoices...</div>
                  ) : unpaidInvoices.length === 0 ? (
                    <div className="py-2 text-center text-xs text-charcoal-500 italic">
                      No unpaid invoices. Cheque will be treated as 100% advance credit upon clearance.
                    </div>
                  ) : (
                    <div className="max-h-40 overflow-y-auto">
                      <table className="w-full text-left text-[11px]">
                        <thead>
                          <tr className="border-b text-charcoal-500">
                            <th className="py-1">Invoice</th>
                            <th className="py-1 text-right">Outstanding</th>
                            <th className="py-1 text-right">Pre-allocated Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-border">
                          {unpaidInvoices.map((inv) => (
                            <tr key={inv.id}>
                              <td className="py-1 font-mono font-medium">
                                {inv.invoiceNumber}
                                <span className="text-[10px] text-charcoal-400 block font-sans">
                                  {new Date(inv.invoiceDate).toLocaleDateString('en-GB')}
                                </span>
                              </td>
                              <td className="py-1 text-right font-mono text-charcoal-700">
                                Rs. {Number(inv.balanceAmount).toFixed(2)}
                              </td>
                              <td className="py-1 text-right">
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  max={Number(inv.balanceAmount)}
                                  placeholder="0.00"
                                  value={pdcAllocations[inv.id] || ''}
                                  onChange={(e) =>
                                    handlePdcAllocationChange(inv.id, e.target.value, Number(inv.balanceAmount))
                                  }
                                  className="text-[11px] h-7 w-28 text-right font-mono inline-block ml-auto"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Allocation Totals in PDC modal */}
                  <div className="pt-2 border-t flex justify-between text-xs font-semibold">
                    <span>Pre-allocated: Rs. {roundedPdcAllocated.toFixed(2)}</span>
                    <span className={unallocatedPdcRemainder > 0 ? 'text-amber-700' : 'text-emerald-700'}>
                      Unallocated Advance: Rs. {unallocatedPdcRemainder.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* Custody Notes */}
              <div>
                <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                  Custody Notes / Remarks
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Handed over by representative Mr. Tariq for September orders"
                  value={pdcNotes}
                  onChange={(e) => setPdcNotes(e.target.value)}
                  className="text-xs"
                />
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreatePdcModalOpen(false)}
                  disabled={isSubmittingPdc}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmittingPdc || isPdcOverAllocated}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                >
                  {isSubmittingPdc ? 'Registering...' : 'Register PDC in Custody'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DEPOSIT PDC IN BANK */}
      {/* ========================================================================= */}
      {depositingPdc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-surface-border overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 text-amber-600 mb-3">
                <div className="p-2 rounded-lg bg-amber-50 border border-amber-100">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-charcoal-900">Record Bank Deposit</h3>
                  <p className="text-xs text-charcoal-500">PDC #{depositingPdc.pdcNumber}</p>
                </div>
              </div>

              <div className="bg-surface-muted p-3 rounded-lg text-xs space-y-1 mb-4">
                <div className="flex justify-between">
                  <span className="text-charcoal-500">Cheque #:</span>
                  <span className="font-mono font-bold text-charcoal-900">{depositingPdc.chequeNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal-500">Drawee Bank:</span>
                  <span className="font-medium text-charcoal-900">{depositingPdc.bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal-500">Amount:</span>
                  <span className="font-mono font-bold text-indigo-900">Rs. {Number(depositingPdc.amount).toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                    Deposit Bank Name <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. Meezan Bank Main Branch"
                    value={depositBankName}
                    onChange={(e) => setDepositBankName(e.target.value)}
                    className="text-xs"
                    autoFocus
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                    Deposit Slip / Reference #
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. SLIP-100293"
                    value={depositReference}
                    onChange={(e) => setDepositReference(e.target.value)}
                    className="text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                    Deposited At Date
                  </label>
                  <Input
                    type="date"
                    value={depositedAtDate}
                    onChange={(e) => setDepositedAtDate(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDepositingPdc(null)}
                  disabled={isDepositing}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleConfirmDeposit}
                  disabled={isDepositing || !depositBankName.trim()}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs"
                >
                  {isDepositing ? 'Recording...' : 'Mark as Deposited'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CLEAR PDC (FINANCIAL SETTLEMENT) */}
      {/* ========================================================================= */}
      {clearingPdc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-surface-border overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 text-emerald-600 mb-3">
                <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-charcoal-900">Execute Bank Clearance</h3>
                  <p className="text-xs text-charcoal-500">PDC #{clearingPdc.pdcNumber} (Maturity: {new Date(clearingPdc.chequeDate).toLocaleDateString('en-GB')})</p>
                </div>
              </div>

              <div className="bg-emerald-50 border-l-4 border-emerald-500 p-3 text-xs text-emerald-950 rounded mb-4 space-y-1">
                <div className="font-bold">Authoritative Financial Action:</div>
                <p>
                  Executing clearance will transactionally generate a <strong>Customer Payment Receipt</strong>, credit the customer sub-ledger by <strong>Rs. {Number(clearingPdc.amount).toFixed(2)}</strong>, revalidate and settle invoice balances, and decrease the customer's outstanding balance.
                </p>
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                    Clearance Date
                  </label>
                  <Input
                    type="date"
                    value={clearedAtDate}
                    onChange={(e) => setClearedAtDate(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                    Clearance Notes
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. Bank credit advice confirmed"
                    value={clearingNotes}
                    onChange={(e) => setClearingNotes(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setClearingPdc(null)}
                  disabled={isClearing}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleConfirmClear}
                  disabled={isClearing}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs"
                >
                  {isClearing ? 'Processing Clearance...' : 'Confirm Clearance & Post Settlement'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: BOUNCE PDC */}
      {/* ========================================================================= */}
      {bouncingPdc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-surface-border overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 text-rose-600 mb-3">
                <div className="p-2 rounded-lg bg-rose-50 border border-rose-100">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-charcoal-900">Mark Cheque as Bounced</h3>
                  <p className="text-xs text-charcoal-500">PDC #{bouncingPdc.pdcNumber} ({bouncingPdc.chequeNumber})</p>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                    Dishonor / Bounce Reason <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. Insufficient funds, signature mismatch, account closed"
                    value={bounceReason}
                    onChange={(e) => setBounceReason(e.target.value)}
                    className="text-xs"
                    autoFocus
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                    Bounced At Date
                  </label>
                  <Input
                    type="date"
                    value={bouncedAtDate}
                    onChange={(e) => setBouncedAtDate(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setBouncingPdc(null)}
                  disabled={isBouncing}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleConfirmBounce}
                  disabled={isBouncing || !bounceReason.trim()}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs"
                >
                  {isBouncing ? 'Recording...' : 'Confirm Bounce'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CANCEL / RETURN PDC */}
      {/* ========================================================================= */}
      {cancellingPdc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-surface-border overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 text-gray-700 mb-3">
                <div className="p-2 rounded-lg bg-gray-100 border border-gray-200">
                  <Ban className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-charcoal-900">Cancel & Return PDC</h3>
                  <p className="text-xs text-charcoal-500">PDC #{cancellingPdc.pdcNumber}</p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                  Cancellation / Return Reason <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Cheque returned upon cash settlement"
                  value={pdcCancellationReason}
                  onChange={(e) => setPdcCancellationReason(e.target.value)}
                  className="text-xs"
                  autoFocus
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCancellingPdc(null)}
                  disabled={isCancellingPdc}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleConfirmCancelPdc}
                  disabled={isCancellingPdc || !pdcCancellationReason.trim()}
                  className="bg-gray-800 hover:bg-gray-900 text-white font-semibold text-xs"
                >
                  {isCancellingPdc ? 'Cancelling...' : 'Confirm Return'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: VIEW PDC DETAILS DRAWER */}
      {/* ========================================================================= */}
      {viewingPdc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-surface-border overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 bg-charcoal-900 text-white flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold">PDC Details & Lifecycle Timeline</h2>
                <p className="text-[11px] text-charcoal-300">
                  {viewingPdc.pdcNumber} — Cheque #{viewingPdc.chequeNumber}
                </p>
              </div>
              <button
                onClick={() => setViewingPdc(null)}
                className="text-charcoal-400 hover:text-white p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-surface-muted p-4 rounded-lg">
                <div>
                  <span className="text-charcoal-500 block">Customer:</span>
                  <strong className="text-charcoal-900 text-sm">{viewingPdc.customer?.name}</strong>
                  <div className="text-charcoal-500">{viewingPdc.customer?.code}</div>
                </div>
                <div className="text-right">
                  <span className="text-charcoal-500 block">Cheque Face Value:</span>
                  <strong className="text-indigo-900 text-base font-mono">
                    Rs. {Number(viewingPdc.amount).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                  </strong>
                </div>
              </div>

              {/* Lifecycle Events */}
              <div className="border border-surface-border rounded-lg p-4 space-y-3">
                <h4 className="font-bold text-charcoal-900 uppercase tracking-wider text-[11px]">
                  Lifecycle Milestones
                </h4>

                <div className="space-y-2 text-[11px]">
                  <div className="flex items-center justify-between py-1 border-b">
                    <span className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-blue-600" />
                      <strong>Received in Custody</strong>
                    </span>
                    <span className="text-charcoal-500 font-mono">
                      {new Date(viewingPdc.receivedDate).toLocaleDateString('en-GB')}
                    </span>
                  </div>

                  {viewingPdc.depositedAt && (
                    <div className="flex items-center justify-between py-1 border-b">
                      <span className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-amber-600" />
                        <strong>Deposited in {viewingPdc.depositBankName}</strong>
                        {viewingPdc.depositReference && (
                          <span className="text-charcoal-500 font-mono">({viewingPdc.depositReference})</span>
                        )}
                      </span>
                      <span className="text-charcoal-500 font-mono">
                        {new Date(viewingPdc.depositedAt).toLocaleDateString('en-GB')}
                      </span>
                    </div>
                  )}

                  {viewingPdc.clearedAt && (
                    <div className="flex items-center justify-between py-1 border-b text-emerald-800">
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <strong>Cleared & Settled</strong>
                        {viewingPdc.customerPayment && (
                          <span className="font-mono font-bold">[{viewingPdc.customerPayment.paymentNumber}]</span>
                        )}
                      </span>
                      <span className="font-mono">
                        {new Date(viewingPdc.clearedAt).toLocaleDateString('en-GB')}
                      </span>
                    </div>
                  )}

                  {viewingPdc.bouncedAt && (
                    <div className="flex items-center justify-between py-1 border-b text-rose-800">
                      <span className="flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        <strong>Bounced ({viewingPdc.bounceReason})</strong>
                      </span>
                      <span className="font-mono">
                        {new Date(viewingPdc.bouncedAt).toLocaleDateString('en-GB')}
                      </span>
                    </div>
                  )}

                  {viewingPdc.cancelledAt && (
                    <div className="flex items-center justify-between py-1 border-b text-gray-700">
                      <span className="flex items-center gap-2">
                        <Ban className="w-3.5 h-3.5 text-gray-500" />
                        <strong>Cancelled & Returned ({viewingPdc.cancellationReason})</strong>
                      </span>
                      <span className="font-mono">
                        {new Date(viewingPdc.cancelledAt).toLocaleDateString('en-GB')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Pre-allocations list */}
              {viewingPdc.allocations && viewingPdc.allocations.length > 0 && (
                <div className="border border-surface-border rounded-lg p-3">
                  <h4 className="font-bold text-charcoal-900 mb-2">Pre-allocated Invoices</h4>
                  <div className="space-y-1">
                    {viewingPdc.allocations.map((a, i) => (
                      <div key={i} className="flex justify-between text-[11px] py-0.5 border-b">
                        <span className="font-mono">{a.salesInvoice?.invoiceNumber || a.salesInvoiceId}</span>
                        <span className="font-mono font-bold">Rs. {Number(a.amountAllocated).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-3 bg-surface-muted border-t flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewingPdc(null)}
              >
                Close
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setPrintingPdc(viewingPdc);
                  setViewingPdc(null);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Printer className="w-3.5 h-3.5 mr-1" />
                <span>Print Receipt</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: RECORD REGULAR PAYMENT RECEIPT */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-surface-border overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 bg-brand-900 text-white flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold">Record Customer Payment Receipt</h2>
                <p className="text-[11px] text-brand-200">
                  Immediate settlement voucher & customer credit recording
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-brand-200 hover:text-white p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPayment} className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* Customer Selector */}
              <div>
                <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                  Customer <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full text-xs h-9 rounded-md border border-surface-border bg-white px-3 py-1 text-charcoal-900 focus:ring-1 focus:ring-brand-500"
                  required
                >
                  <option value="">Select customer...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code}) {c.city ? `— ${c.city}` : ''} [Balance: Rs. {Number(c.currentBalance).toFixed(2)}]
                    </option>
                  ))}
                </select>
                {selectedCustomer && (
                  <div className="mt-1 flex items-center gap-4 text-[11px] text-charcoal-500">
                    <span>Current Balance: <strong className="text-charcoal-900 font-mono">Rs. {Number(selectedCustomer.currentBalance).toFixed(2)}</strong></span>
                    {selectedCustomer.phone && <span>Phone: {selectedCustomer.phone}</span>}
                  </div>
                )}
              </div>

              {/* Payment Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                    Payment Date <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                    Payment Method <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full text-xs h-9 rounded-md border border-surface-border bg-white px-3 py-1 text-charcoal-900 focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CHEQUE">Spot Cheque</option>
                    <option value="ONLINE">Online Portal</option>
                    <option value="CREDIT_CARD">Credit / Debit Card</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                    Amount Received (Rs.) <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(e.target.value)}
                    className="text-xs font-mono font-bold text-charcoal-900"
                    required
                  />
                </div>
              </div>

              {/* Reference Number & Bank Name */}
              {(paymentMethod === 'BANK_TRANSFER' || paymentMethod === 'CHEQUE' || paymentMethod === 'CREDIT_CARD') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                      {paymentMethod === 'CHEQUE' ? 'Cheque #' : 'Transaction / Reference #'}
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g. TXN-102948 / Cheque 9948"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      className="text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-charcoal-800 mb-1">
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
                </div>
              )}

              {/* Unpaid Invoices Allocation Table */}
              {selectedCustomerId && (
                <div className="border border-surface-border rounded-lg p-3 bg-surface-muted/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-charcoal-900">
                      Settle Against Unpaid Invoices
                    </span>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAutoDistribute}
                        className="h-6 px-2 text-[10px]"
                      >
                        FIFO Auto-Distribute
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleClearAllocations}
                        className="h-6 px-2 text-[10px] text-charcoal-500"
                      >
                        Clear
                      </Button>
                    </div>
                  </div>

                  {loadingInvoices ? (
                    <div className="py-4 text-center text-xs text-charcoal-500">Loading unpaid invoices...</div>
                  ) : unpaidInvoices.length === 0 ? (
                    <div className="py-2 text-center text-xs text-charcoal-500 italic">
                      No unpaid invoices. Full amount will be recorded as unallocated customer advance.
                    </div>
                  ) : (
                    <div className="max-h-40 overflow-y-auto">
                      <table className="w-full text-left text-[11px]">
                        <thead>
                          <tr className="border-b text-charcoal-500">
                            <th className="py-1">Invoice</th>
                            <th className="py-1 text-right">Outstanding</th>
                            <th className="py-1 text-right">Allocate (Rs.)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-border">
                          {unpaidInvoices.map((inv) => (
                            <tr key={inv.id}>
                              <td className="py-1 font-mono font-medium">
                                {inv.invoiceNumber}
                                <span className="text-[10px] text-charcoal-400 block font-sans">
                                  {new Date(inv.invoiceDate).toLocaleDateString('en-GB')}
                                </span>
                              </td>
                              <td className="py-1 text-right font-mono text-charcoal-700">
                                Rs. {Number(inv.balanceAmount).toFixed(2)}
                              </td>
                              <td className="py-1 text-right">
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  max={Number(inv.balanceAmount)}
                                  placeholder="0.00"
                                  value={allocations[inv.id] || ''}
                                  onChange={(e) =>
                                    handleAllocationChange(inv.id, e.target.value, Number(inv.balanceAmount))
                                  }
                                  className="text-[11px] h-7 w-28 text-right font-mono inline-block ml-auto"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Summary Footer */}
                  <div className="pt-2 border-t flex justify-between text-xs font-semibold">
                    <span>Allocated: Rs. {roundedAllocated.toFixed(2)}</span>
                    <span className={unallocatedRemainder > 0 ? 'text-amber-700' : 'text-emerald-700'}>
                      Unallocated Advance: Rs. {unallocatedRemainder.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                  Payment Notes
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Cleared full month dues"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="text-xs"
                />
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting || isOverAllocated}
                  className="bg-brand-600 hover:bg-brand-700 text-white font-semibold"
                >
                  {isSubmitting ? 'Posting...' : 'Post Payment Receipt'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PRINT CUSTODIAL PDC RECEIPT */}
      {/* ========================================================================= */}
      {printingPdc && (
        <DocumentPrintModal
          isOpen={!!printingPdc}
          onClose={() => setPrintingPdc(null)}
          title={`Post-Dated Cheque Receipt — ${printingPdc.pdcNumber}`}
        >
          {(layout) => {
            const printablePdc: PrintablePdcReceipt = {
              company,
              branch: printingPdc.branch ? {
                name: printingPdc.branch.name,
                code: printingPdc.branch.code,
                address: printingPdc.branch.address || null,
                phone: printingPdc.branch.phone || null,
              } : null,
              pdcNumber: printingPdc.pdcNumber,
              chequeNumber: printingPdc.chequeNumber,
              bankName: printingPdc.bankName,
              chequeDate: printingPdc.chequeDate,
              receivedDate: printingPdc.receivedDate,
              amount: Number(printingPdc.amount || 0),
              allocatedAmount: Number(printingPdc.allocatedAmount || 0),
              unallocatedAmount: Number(printingPdc.unallocatedAmount || 0),
              status: printingPdc.status,
              notes: printingPdc.notes || null,
              depositBankName: printingPdc.depositBankName || null,
              depositReference: printingPdc.depositReference || null,
              depositedAt: printingPdc.depositedAt || null,
              clearedAt: printingPdc.clearedAt || null,
              bouncedAt: printingPdc.bouncedAt || null,
              bounceReason: printingPdc.bounceReason || null,
              cancelledAt: printingPdc.cancelledAt || null,
              cancellationReason: printingPdc.cancellationReason || null,
              customer: {
                name: printingPdc.customer?.name || 'Customer',
                code: printingPdc.customer?.code || null,
                phone: printingPdc.customer?.phone || null,
                address: printingPdc.customer?.address || null,
                city: printingPdc.customer?.city || null,
                currentBalance: Number(printingPdc.customer?.currentBalance || 0),
              },
              receivedBy: printingPdc.createdByUser?.displayName || 'Authorized Custody Officer',
              linkedPaymentNumber: printingPdc.customerPayment?.paymentNumber || null,
              allocations: (printingPdc.allocations || []).map((a) => ({
                invoiceNumber: a.salesInvoice?.invoiceNumber || a.salesInvoiceId,
                invoiceDate: a.salesInvoice?.invoiceDate,
                netTotal: Number(a.salesInvoice?.netTotal || 0),
                amountAllocated: Number(a.amountAllocated || 0),
              })),
            };

            return (
              <PdcReceiptTemplate
                pdcReceipt={printablePdc}
                company={company}
                layout={layout}
              />
            );
          }}
        </DocumentPrintModal>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PRINT REGULAR CUSTOMER PAYMENT RECEIPT */}
      {/* ========================================================================= */}
      {viewingPayment && (
        <DocumentPrintModal
          isOpen={!!viewingPayment}
          onClose={() => setViewingPayment(null)}
          title={`Payment Receipt — ${viewingPayment.paymentNumber}`}
        >
          {(layout) => {
            const printableData: PrintableCustomerPayment = {
              voucherNumber: viewingPayment.paymentNumber,
              paymentDate: new Date(viewingPayment.paymentDate).toLocaleDateString('en-GB'),
              paymentMethod: viewingPayment.paymentMethod,
              referenceNumber: viewingPayment.referenceNumber || null,
              chequeNumber: viewingPayment.paymentMethod === 'CHEQUE' ? viewingPayment.referenceNumber || null : null,
              bankName: viewingPayment.bankName || null,
              customer: {
                name: viewingPayment.customer?.name || 'Customer',
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
      {/* MODAL: VOID REGULAR PAYMENT */}
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
                  onClick={handleConfirmCancelPayment}
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
