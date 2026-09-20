import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
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
  Truck,
  FileText,
  Check,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Pagination } from '../components/ui/Pagination';
import { Combobox, ComboboxOption } from '../components/ui/Combobox';
import { toast } from '../components/ui/Toast';
import {
  purchaseReturnsApi,
  PurchaseReturn,
  ReturnableGrnResponse,
  ReturnableBatchItem,
  PurchaseReturnReason,
  ReturnedStockCondition,
  PurchaseReturnStatus,
  purchasingApi,
  GoodsReceiveNote,
  suppliersApi,
  Supplier,
  warehousesApi,
  organizationApi,
  settingsApi,
  Warehouse,
} from '../api';
import { formatApiErrorMessage } from '../utils';
import {
  DocumentPrintModal,
  PurchaseReturnPrintTemplate,
  SupplierReturnChallanPrintTemplate,
  PrintableCompanyInfo,
  PrintablePurchaseReturn,
  PrintableSupplierReturnChallan,
} from '../components/printing';

const REASON_LABELS: Record<PurchaseReturnReason, string> = {
  DAMAGED_GOODS: 'Damaged Goods',
  DEFECTIVE_BATCH: 'Defective / Quality Issue',
  NEAR_EXPIRY_RECALL: 'Near Expiry / Expired',
  OVER_DELIVERY: 'Excess / Overstock',
  WRONG_PRODUCT: 'Wrong Product Received',
  REGULATORY_RECALL: 'Regulatory Recall',
  OTHER: 'Other / Discrepancy',
};

export const PurchaseReturnsPage: React.FC = () => {
  const location = useLocation();

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

  const showFeedback = (type: 'success' | 'error', message: string | unknown) => {
    const formatted = typeof message === 'string' ? formatApiErrorMessage(message) : formatApiErrorMessage(message);
    setFeedback({ type, message: formatted });
    if (type === 'error') {
      toast.error(formatted);
    } else {
      toast.success(formatted);
    }
    setTimeout(() => setFeedback(null), 4500);
  };

  // Directory Data
  const [grns, setGrns] = useState<GoodsReceiveNote[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [company, setCompany] = useState<PrintableCompanyInfo>({
    name: 'MEDIX Pharmacy',
    legalName: 'MEDIX Pharma Distribution',
  });
  const [settingsMap, setSettingsMap] = useState<Record<string, string>>({});

  // Create Return Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [createMode, setCreateMode] = useState<'FROM_GRN' | 'DIRECT_BATCH'>('FROM_GRN');

  // GRN Mode State
  const [selectedGrnId, setSelectedGrnId] = useState<string>('');
  const [returnableData, setReturnableData] = useState<ReturnableGrnResponse | null>(null);
  const [loadingReturnable, setLoadingReturnable] = useState<boolean>(false);
  const [grnItemRows, setGrnItemRows] = useState<
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

  // Direct Batch Mode State
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [selectedDirectWarehouseId, setSelectedDirectWarehouseId] = useState<string>('');
  const [directBatchSearch, setDirectBatchSearch] = useState<string>('');
  const [returnableBatches, setReturnableBatches] = useState<ReturnableBatchItem[]>([]);
  const [loadingDirectBatches, setLoadingDirectBatches] = useState<boolean>(false);
  const [directItemRows, setDirectItemRows] = useState<
    Record<
      string, // batchId
      {
        productId: string;
        warehouseId: string;
        warehouseType: string;
        returnedQuantity: number;
        bonusReturnedQuantity: number;
        purchaseCost: number;
      }
    >
  >({});

  // Common Return Form State
  const [returnDate, setReturnDate] = useState<string>(
    new Date().toISOString().split('T')[0],
  );
  const [returnReason, setReturnReason] = useState<PurchaseReturnReason>('DAMAGED_GOODS');
  const [rgaNumber, setRgaNumber] = useState<string>('');
  const [rgaDate, setRgaDate] = useState<string>('');
  const [vendorCreditNoteNumber, setVendorCreditNoteNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Dispatch / Complete / Cancel Dialogs
  const [dispatchingReturn, setDispatchingReturn] = useState<PurchaseReturn | null>(null);
  const [dispatchRgaNumber, setDispatchRgaNumber] = useState<string>('');
  const [dispatchRgaDate, setDispatchRgaDate] = useState<string>('');
  const [dispatchNotes, setDispatchNotes] = useState<string>('');
  const [isDispatching, setIsDispatching] = useState<boolean>(false);

  const [completingReturn, setCompletingReturn] = useState<PurchaseReturn | null>(null);
  const [completeVendorCreditNote, setCompleteVendorCreditNote] = useState<string>('');
  const [completeNotes, setCompleteNotes] = useState<string>('');
  const [isCompleting, setIsCompleting] = useState<boolean>(false);

  const [cancellingReturn, setCancellingReturn] = useState<PurchaseReturn | null>(null);
  const [cancellationReason, setCancellationReason] = useState<string>('');
  const [isCancelling, setIsCancelling] = useState<boolean>(false);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Printing & Document Preview Modals
  const [viewingDebitNote, setViewingDebitNote] = useState<PurchaseReturn | null>(null);
  const [viewingChallan, setViewingChallan] = useState<PurchaseReturn | null>(null);

  // Load Purchase Returns Register
  const loadReturns = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await purchaseReturnsApi.getPurchaseReturns({
        page: currentPage,
        limit: 20,
        search: search.trim() || undefined,
        reason: reasonFilter !== 'ALL' ? (reasonFilter as PurchaseReturnReason) : undefined,
        status: statusFilter !== 'ALL' ? (statusFilter as PurchaseReturnStatus) : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });

      setReturns(res.items || []);
      setTotalRecords(res.total || 0);
      setTotalPages(res.totalPages || 1);
      const sum =
        res.summary?.totalNetReturn ??
        (Number(res.summary?.totalCompletedReturn || 0) + Number(res.summary?.totalDispatchedReturn || 0));
      setTotalSum(sum);
    } catch (err: any) {
      showFeedback('error', formatApiErrorMessage(err, 'Failed to load purchase returns'));
    } finally {
      setIsLoading(false);
    }
  }, [search, reasonFilter, statusFilter, startDate, endDate, currentPage]);

  // Load Initial directory data
  useEffect(() => {
    loadReturns();
  }, [loadReturns]);

  // Combobox options & debounced server searches
  const grnOptions: ComboboxOption[] = useMemo(() => {
    return grns.map((g) => ({
      value: g.id,
      label: `${g.grnNumber} — ${g.supplier?.name || 'Supplier'}`,
      sublabel: `Rs. ${Number(g.netTotal).toLocaleString()} • Rec: ${new Date(g.receivedDate).toLocaleDateString()}`,
    }));
  }, [grns]);

  const supplierOptions: ComboboxOption[] = useMemo(() => {
    return suppliers.map((s) => ({
      value: s.id,
      label: `${s.name} (${s.code})`,
      sublabel: s.city ? `City: ${s.city}` : undefined,
    }));
  }, [suppliers]);

  const handleGrnSearch = useCallback(async (query: string) => {
    if (!query || !query.trim()) return;
    try {
      const res = await purchasingApi.getGoodsReceiveNotes({ search: query.trim(), status: 'POSTED', limit: 50 });
      const items = (res as any)?.items || (Array.isArray(res) ? res : []);
      if (items.length > 0) {
        setGrns((prev) => {
          const existingIds = new Set(prev.map((g) => g.id));
          const newItems = items.filter((g: GoodsReceiveNote) => !existingIds.has(g.id));
          return [...prev, ...newItems];
        });
      }
    } catch {
      // Silently ignore
    }
  }, []);

  const handleSupplierSearch = useCallback(async (query: string) => {
    if (!query || !query.trim()) return;
    try {
      const res = await suppliersApi.getSuppliers({ search: query.trim(), isActive: true, limit: 50 });
      if (res?.items) {
        setSuppliers((prev) => {
          const existingIds = new Set(prev.map((s) => s.id));
          const newItems = res.items.filter((s) => !existingIds.has(s.id));
          return [...prev, ...newItems];
        });
      }
    } catch {
      // Silently ignore
    }
  }, []);

  useEffect(() => {
    const fetchDirectories = async () => {
      try {
        const [grnRes, supRes, whRes, orgRes, setRes] = await Promise.all([
          purchasingApi.getGoodsReceiveNotes({ status: 'POSTED', limit: 50 }),
          suppliersApi.getSuppliers({ isActive: true, limit: 50 }).catch(() => ({ items: [] })),
          warehousesApi.getWarehouses(),
          organizationApi.getOrganization().catch(() => null),
          settingsApi.getSettings().catch(() => null),
        ]);
        setGrns((grnRes as any).items || (grnRes as any).data || (Array.isArray(grnRes) ? grnRes : []));
        setSuppliers(supRes.items || []);
        setWarehouses(Array.isArray(whRes) ? whRes : (whRes as any).items || (whRes as any).data || []);
        if (orgRes) {
          setCompany({
            name: orgRes.name || 'MEDIX Pharmacy',
            legalName: orgRes.legalName || orgRes.name,
            ntn: orgRes.ntn || undefined,
            strn: orgRes.strn || undefined,
            drugSaleLicenseNo: orgRes.drugSaleLicenseNo || undefined,
            address: orgRes.address || undefined,
            city: orgRes.city || undefined,
            phone: orgRes.phone || undefined,
            email: orgRes.email || undefined,
          });
        }
        if (setRes && Array.isArray(setRes)) {
          const map: Record<string, string> = {};
          setRes.forEach((s: any) => {
            if (s.key && s.value !== undefined) {
              map[s.key] = s.value;
            }
          });
          setSettingsMap(map);
        }
      } catch (err) {
        console.error('Failed to load initial directories for returns', err);
      }
    };
    fetchDirectories();
  }, []);

  // Handle cross-module link (e.g. from Expiry / Recall Page)
  useEffect(() => {
    const state = location.state as { initiateBatchId?: string; initiateWarehouseId?: string } | null;
    if (state?.initiateBatchId) {
      setCreateMode('DIRECT_BATCH');
      if (state.initiateWarehouseId) {
        setSelectedDirectWarehouseId(state.initiateWarehouseId);
      }
      setIsCreateModalOpen(true);
    }
  }, [location.state]);

  // Fetch returnable GRN details when selected in create modal
  useEffect(() => {
    if (!selectedGrnId || createMode !== 'FROM_GRN') {
      setReturnableData(null);
      setGrnItemRows({});
      return;
    }
    const fetchDetails = async () => {
      setLoadingReturnable(true);
      try {
        const data = await purchaseReturnsApi.getReturnableGrn(selectedGrnId);
        setReturnableData(data);

        const defaultStdWh = warehouses.find((w) => w.warehouseType === 'STANDARD') || warehouses[0];
        const defaultQuarWh = warehouses.find((w) => w.warehouseType === 'QUARANTINE') || warehouses[0];

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
        setGrnItemRows(initialRows);
      } catch (err: any) {
        showFeedback('error', formatApiErrorMessage(err, 'Failed to load returnable items for GRN'));
      } finally {
        setLoadingReturnable(false);
      }
    };
    fetchDetails();
  }, [selectedGrnId, createMode, warehouses]);

  // Fetch direct returnable batches when in Direct Mode
  const loadDirectBatches = useCallback(async () => {
    if (createMode !== 'DIRECT_BATCH') return;
    setLoadingDirectBatches(true);
    try {
      const data = await purchaseReturnsApi.getReturnableBatches({
        supplierId: selectedSupplierId || undefined,
        warehouseId: selectedDirectWarehouseId || undefined,
        search: directBatchSearch.trim() || undefined,
      });
      setReturnableBatches(data);
    } catch (err: any) {
      showFeedback('error', formatApiErrorMessage(err, 'Failed to search returnable batches'));
    } finally {
      setLoadingDirectBatches(false);
    }
  }, [createMode, selectedSupplierId, selectedDirectWarehouseId, directBatchSearch]);

  useEffect(() => {
    if (isCreateModalOpen && createMode === 'DIRECT_BATCH') {
      loadDirectBatches();
    }
  }, [isCreateModalOpen, createMode, selectedSupplierId, selectedDirectWarehouseId, loadDirectBatches]);

  // Calculations for GRN Mode
  const calculatedGrnTotals = () => {
    if (!returnableData) return { subtotal: 0, discount: 0, tax: 0, netTotal: 0, count: 0 };
    let subtotal = 0;
    let discount = 0;
    let tax = 0;
    let netTotal = 0;
    let count = 0;

    returnableData.items.forEach((item) => {
      const row = grnItemRows[item.id];
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

  // Calculations for Direct Batch Mode
  const calculatedDirectTotals = () => {
    let subtotal = 0;
    let count = 0;

    Object.values(directItemRows).forEach((row) => {
      const billedQty = row.returnedQuantity || 0;
      const bonusQty = row.bonusReturnedQuantity || 0;
      if (billedQty > 0 || bonusQty > 0) {
        count++;
        subtotal += billedQty * row.purchaseCost;
      }
    });

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      discount: 0,
      tax: 0,
      netTotal: Math.round(subtotal * 100) / 100,
      count,
    };
  };

  const handleGrnRowChange = (
    itemId: string,
    field: 'returnedQuantity' | 'bonusReturnedQuantity' | 'stockCondition' | 'sourceWarehouseId',
    value: any,
  ) => {
    setGrnItemRows((prev) => {
      const current = prev[itemId] || {
        returnedQuantity: 0,
        bonusReturnedQuantity: 0,
        stockCondition: 'SALEABLE',
        sourceWarehouseId: '',
      };

      const updated = { ...current, [field]: value };

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

  const handleDirectRowChange = (
    batchItem: ReturnableBatchItem,
    field: 'returnedQuantity' | 'bonusReturnedQuantity',
    value: number,
  ) => {
    setDirectItemRows((prev) => {
      const current = prev[batchItem.batchId] || {
        productId: batchItem.productId,
        warehouseId: batchItem.warehouseId,
        warehouseType: batchItem.warehouseType,
        returnedQuantity: 0,
        bonusReturnedQuantity: 0,
        purchaseCost: batchItem.purchaseCost,
      };

      return {
        ...prev,
        [batchItem.batchId]: {
          ...current,
          [field]: value,
        },
      };
    });
  };

  // Create Purchase Return (DRAFT only)
  const handleCreateReturn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (createMode === 'FROM_GRN') {
      if (!selectedGrnId) {
        showFeedback('error', 'Please select a posted GRN');
        return;
      }

      const { count } = calculatedGrnTotals();
      if (count === 0) {
        showFeedback('error', 'Please specify at least one return quantity greater than 0');
        return;
      }

      const itemsPayload: Array<{
        grnItemId: string;
        sourceWarehouseId: string;
        returnedQuantity: number;
        bonusReturnedQuantity: number;
        stockCondition: ReturnedStockCondition;
      }> = [];

      for (const [itemId, row] of Object.entries(grnItemRows)) {
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
          rgaNumber: rgaNumber.trim() || undefined,
          rgaDate: rgaDate || undefined,
          vendorCreditNoteNumber: vendorCreditNoteNumber.trim() || undefined,
          notes: notes.trim() || undefined,
          items: itemsPayload,
        });

        showFeedback('success', `Purchase Return Draft ${created.returnNumber} created successfully!`);
        setIsCreateModalOpen(false);
        resetCreateForm();
        loadReturns();
      } catch (err: any) {
        showFeedback('error', formatApiErrorMessage(err, 'Failed to create purchase return'));
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Direct Batch Mode
      if (!selectedSupplierId) {
        showFeedback('error', 'Please select a supplier for direct batch return');
        return;
      }

      const { count } = calculatedDirectTotals();
      if (count === 0) {
        showFeedback('error', 'Please specify at least one return quantity greater than 0');
        return;
      }

      const directPayloadItems: Array<{
        productId: string;
        batchId: string;
        sourceWarehouseId: string;
        returnedQuantity: number;
        bonusReturnedQuantity: number;
        stockCondition: ReturnedStockCondition;
      }> = [];

      for (const [batchId, row] of Object.entries(directItemRows)) {
        if ((row.returnedQuantity || 0) > 0 || (row.bonusReturnedQuantity || 0) > 0) {
          directPayloadItems.push({
            productId: row.productId,
            batchId,
            sourceWarehouseId: row.warehouseId,
            returnedQuantity: Number(row.returnedQuantity) || 0,
            bonusReturnedQuantity: Number(row.bonusReturnedQuantity) || 0,
            stockCondition: row.warehouseType === 'QUARANTINE' ? 'QUARANTINED' : 'SALEABLE',
          });
        }
      }

      setIsSubmitting(true);
      try {
        const created = await purchaseReturnsApi.createPurchaseReturn({
          supplierId: selectedSupplierId,
          reason: returnReason,
          returnDate,
          rgaNumber: rgaNumber.trim() || undefined,
          rgaDate: rgaDate || undefined,
          vendorCreditNoteNumber: vendorCreditNoteNumber.trim() || undefined,
          notes: notes.trim() || undefined,
          items: directPayloadItems,
        });

        showFeedback('success', `Direct Purchase Return Draft ${created.returnNumber} created successfully!`);
        setIsCreateModalOpen(false);
        resetCreateForm();
        loadReturns();
      } catch (err: any) {
        showFeedback('error', formatApiErrorMessage(err, 'Failed to create purchase return'));
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const resetCreateForm = () => {
    setSelectedGrnId('');
    setSelectedSupplierId('');
    setSelectedDirectWarehouseId('');
    setReturnableData(null);
    setGrnItemRows({});
    setDirectItemRows({});
    setRgaNumber('');
    setRgaDate('');
    setVendorCreditNoteNumber('');
    setNotes('');
  };

  // Dispatch Return (Stock Deduction + Challan Generation)
  const handleConfirmDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchingReturn) return;

    setIsDispatching(true);
    try {
      const dispatched = await purchaseReturnsApi.dispatchPurchaseReturn(dispatchingReturn.id, {
        rgaNumber: dispatchRgaNumber.trim() || undefined,
        rgaDate: dispatchRgaDate || undefined,
        notes: dispatchNotes.trim() || undefined,
      });

      showFeedback(
        'success',
        `Return ${dispatched.returnNumber} dispatched. Stock deducted and Challan ${dispatched.challanNumber || ''} generated!`,
      );
      setDispatchingReturn(null);
      setDispatchRgaNumber('');
      setDispatchRgaDate('');
      setDispatchNotes('');
      loadReturns();
      setViewingChallan(dispatched);
    } catch (err: any) {
      showFeedback('error', formatApiErrorMessage(err, 'Failed to dispatch purchase return'));
    } finally {
      setIsDispatching(false);
    }
  };

  // Complete Return (Supplier Ledger Posting)
  const handleConfirmComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingReturn) return;

    setIsCompleting(true);
    try {
      const completed = await purchaseReturnsApi.completePurchaseReturn(completingReturn.id, {
        vendorCreditNoteNumber: completeVendorCreditNote.trim() || undefined,
        notes: completeNotes.trim() || undefined,
      });

      showFeedback(
        'success',
        `Return ${completed.returnNumber} completed! Debit note posted to Supplier Ledger.`,
      );
      setCompletingReturn(null);
      setCompleteVendorCreditNote('');
      setCompleteNotes('');
      loadReturns();
      setViewingDebitNote(completed);
    } catch (err: any) {
      showFeedback('error', formatApiErrorMessage(err, 'Failed to complete purchase return'));
    } finally {
      setIsCompleting(false);
    }
  };

  // Cancel / Void Purchase Return
  const handleCancelReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingReturn) return;
    if (!cancellationReason.trim() || cancellationReason.trim().length < 3) {
      showFeedback('error', 'Cancellation reason is required (min 3 chars)');
      return;
    }

    setIsCancelling(true);
    try {
      await purchaseReturnsApi.cancelPurchaseReturn(cancellingReturn.id, {
        cancellationReason: cancellationReason.trim(),
      });
      showFeedback(
        'success',
        `Purchase Return ${cancellingReturn.returnNumber} cancelled successfully`,
      );
      setCancellingReturn(null);
      setCancellationReason('');
      loadReturns();
    } catch (err: any) {
      showFeedback('error', formatApiErrorMessage(err, 'Failed to cancel purchase return'));
    } finally {
      setIsCancelling(false);
    }
  };

  const currentTotals = createMode === 'FROM_GRN' ? calculatedGrnTotals() : calculatedDirectTotals();

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`fixed top-5 right-5 z-[9999] flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl border text-sm font-medium transition-all ${
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
            <div className="p-2 rounded-lg bg-brand-50 text-brand-600 border border-brand-100">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-charcoal-900">Purchase Returns & Supplier Challans</h1>
              <p className="text-xs text-charcoal-500 mt-0.5">
                Purchase return and supplier return processing with RGA tracking, physical dispatch challans, and completed debit note reconciliation.
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
            className="flex items-center gap-1.5 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              resetCreateForm();
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-1.5 text-xs bg-brand-600 hover:bg-brand-700 text-white font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>New Purchase Return</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-3.5 bg-white border border-surface-border">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-500">
              Total Debit Value
            </span>
            <TrendingDown className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-bold text-charcoal-900 mt-1">
            Rs. {totalSum.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-charcoal-400 mt-0.5 block">Active supplier debit offsets (Supplier Return Balance)</span>
        </Card>

        <Card className="p-3.5 bg-white border border-surface-border">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-500">
              Draft Returns
            </span>
            <RotateCcw className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-600 mt-1">
            {returns.filter((r) => r.status === 'DRAFT').length}
          </p>
          <span className="text-[11px] text-charcoal-400 mt-0.5 block">Awaiting physical dispatch</span>
        </Card>

        <Card className="p-3.5 bg-white border border-surface-border">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-500">
              Dispatched (In Transit)
            </span>
            <Truck className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {returns.filter((r) => r.status === 'DISPATCHED').length}
          </p>
          <span className="text-[11px] text-charcoal-400 mt-0.5 block">Stock deducted, challan issued</span>
        </Card>

        <Card className="p-3.5 bg-white border border-surface-border">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-500">
              Completed (Reconciled)
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {returns.filter((r) => r.status === 'COMPLETED').length}
          </p>
          <span className="text-[11px] text-charcoal-400 mt-0.5 block">Debit note posted to ledger</span>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="p-3 bg-white border border-surface-border">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-charcoal-400" />
            <Input
              placeholder="Search Return #, Challan #, Supplier, RGA #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white border-surface-border text-xs h-9"
            />
          </div>

          <div>
            <select
              value={reasonFilter}
              onChange={(e) => setReasonFilter(e.target.value)}
              className="w-full h-9 px-3 rounded-md bg-white border border-surface-border text-xs text-charcoal-800 focus:outline-none focus:border-brand-500"
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
              className="w-full h-9 px-3 rounded-md bg-white border border-surface-border text-xs text-charcoal-800 focus:outline-none focus:border-brand-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">DRAFT</option>
              <option value="DISPATCHED">DISPATCHED</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-white border-surface-border text-xs h-9"
              placeholder="Start"
            />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-white border-surface-border text-xs h-9"
              placeholder="End"
            />
          </div>
        </div>
      </Card>

      {/* Returns Register Table */}
      <Card className="bg-white border border-surface-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-surface-border bg-surface-muted/60 text-charcoal-600 font-semibold uppercase">
                <th className="py-2.5 px-3">Return #</th>
                <th className="py-2.5 px-3">Challan / RGA</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Supplier</th>
                <th className="py-2.5 px-3">Origin</th>
                <th className="py-2.5 px-3">Reason</th>
                <th className="py-2.5 px-3 text-right">Net Value</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-charcoal-500">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-brand-600" />
                      <span>Loading purchase returns register...</span>
                    </div>
                  </td>
                </tr>
              ) : returns.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-charcoal-500">
                    <Package className="w-10 h-10 mx-auto text-charcoal-400 mb-2" />
                    <p className="text-sm font-semibold text-charcoal-700">No purchase returns recorded</p>
                    <p className="text-xs text-charcoal-500 mt-1">
                      Issue a new purchase return against a GRN or direct warehouse batch to generate dispatch challans and debit notes.
                    </p>
                  </td>
                </tr>
              ) : (
                returns.map((ret) => {
                  const isDraft = ret.status === 'DRAFT';
                  const isDispatched = ret.status === 'DISPATCHED';
                  const isCompleted = ret.status === 'COMPLETED';
                  const isCancelled = ret.status === 'CANCELLED';

                  return (
                    <tr key={ret.id} className="hover:bg-surface-muted/40 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-brand-700">
                        {ret.returnNumber}
                      </td>
                      <td className="py-2.5 px-3 text-xs font-mono">
                        {ret.challanNumber && (
                          <div className="text-blue-700 font-bold">{ret.challanNumber}</div>
                        )}
                        {ret.rgaNumber && (
                          <div className="text-charcoal-500 text-[11px]">RGA: {ret.rgaNumber}</div>
                        )}
                        {!ret.challanNumber && !ret.rgaNumber && <span className="text-charcoal-400">-</span>}
                      </td>
                      <td className="py-2.5 px-3 text-charcoal-600 text-xs">
                        {new Date(ret.returnDate).toLocaleDateString('en-GB')}
                      </td>
                      <td className="py-2.5 px-3 text-charcoal-900 font-semibold">
                        {ret.supplier?.name || 'N/A'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-xs text-charcoal-600">
                        {ret.grn ? (
                          <span title="Linked GRN" className="font-semibold text-charcoal-700">GRN: {ret.grn.grnNumber}</span>
                        ) : (
                          <span className="text-brand-600 text-[11px] font-medium">Direct Batch</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-xs px-2 py-0.5 rounded bg-surface-muted text-charcoal-700 border border-surface-border">
                          {REASON_LABELS[ret.reason] || ret.reason}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600">
                        Rs. {Number(ret.netTotal).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                            isDraft
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : isDispatched
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : isCompleted
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-rose-50 text-rose-800 border-rose-200'
                          }`}
                        >
                          {ret.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* DRAFT: Dispatch Action */}
                          {isDraft && (
                            <button
                              onClick={() => {
                                setDispatchingReturn(ret);
                                setDispatchRgaNumber(ret.rgaNumber || '');
                                setDispatchRgaDate(ret.rgaDate ? ret.rgaDate.split('T')[0] : '');
                                setDispatchNotes('');
                              }}
                              title="Dispatch & Generate Challan"
                              className="px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition flex items-center gap-1 text-xs font-semibold"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              <span>Dispatch</span>
                            </button>
                          )}

                          {/* DISPATCHED: Complete Action */}
                          {isDispatched && (
                            <button
                              onClick={() => {
                                setCompletingReturn(ret);
                                setCompleteVendorCreditNote(ret.vendorCreditNoteNumber || '');
                                setCompleteNotes('');
                              }}
                              title="Complete & Post Debit Note"
                              className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition flex items-center gap-1 text-xs font-semibold"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Complete</span>
                            </button>
                          )}

                          {/* Print Challan (Dispatched or Completed) */}
                          {(isDispatched || isCompleted) && (
                            <button
                              onClick={() => setViewingChallan(ret)}
                              title="Print Supplier Return Challan"
                              className="p-1.5 rounded hover:bg-surface-muted text-blue-600 transition"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          )}

                          {/* Print Debit Note (Completed) */}
                          {isCompleted && (
                            <button
                              onClick={() => setViewingDebitNote(ret)}
                              title="Print Debit Note Voucher"
                              className="p-1.5 rounded hover:bg-surface-muted text-emerald-600 transition"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          )}

                          {/* Void / Cancel */}
                          {!isCancelled && (
                            <button
                              onClick={() => {
                                setCancellingReturn(ret);
                                setCancellationReason('');
                              }}
                              title="Cancel / Void Return"
                              className="p-1.5 rounded hover:bg-rose-50 text-rose-500 transition"
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
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalRecords}
            pageSize={20}
            onPageChange={setCurrentPage}
            showPageSizeSelector={false}
          />
        )}
      </Card>

      {/* ===================================================================== */}
      {/* MODAL 1: Create Purchase Return (DRAFT only) */}
      {/* ===================================================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-5xl my-8 rounded-xl bg-white border border-surface-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border bg-surface-muted/60">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-brand-600" />
                <div>
                  <h2 className="text-base font-bold text-charcoal-900">Create Purchase Return (Draft)</h2>
                  <p className="text-xs text-charcoal-500">
                    Draft return does not alter stock or supplier ledger until explicitly dispatched and completed.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-charcoal-400 hover:text-charcoal-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex border-b border-surface-border bg-surface-muted/30 px-6 pt-3 gap-4">
              <button
                type="button"
                onClick={() => setCreateMode('FROM_GRN')}
                className={`pb-2.5 px-2 text-xs font-bold transition-colors border-b-2 ${
                  createMode === 'FROM_GRN'
                    ? 'border-brand-600 text-brand-700'
                    : 'border-transparent text-charcoal-500 hover:text-charcoal-800'
                }`}
              >
                Link to Posted GRN
              </button>
              <button
                type="button"
                onClick={() => setCreateMode('DIRECT_BATCH')}
                className={`pb-2.5 px-2 text-xs font-bold transition-colors border-b-2 ${
                  createMode === 'DIRECT_BATCH'
                    ? 'border-brand-600 text-brand-700'
                    : 'border-transparent text-charcoal-500 hover:text-charcoal-800'
                }`}
              >
                Direct from Warehouse / Batch
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateReturn} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              {/* Common Header Fields */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {createMode === 'FROM_GRN' ? (
                  <div className="space-y-1.5 md:col-span-2">
                    <label htmlFor="select-grn-input" className="text-xs font-semibold uppercase text-charcoal-700">
                      Select Posted GRN *
                    </label>
                    <Combobox
                      id="select-grn-input"
                      options={grnOptions}
                      value={selectedGrnId}
                      onChange={(val) => setSelectedGrnId(val)}
                      onSearchChange={handleGrnSearch}
                      placeholder="Search and choose posted GRN (GRN #, supplier)..."
                      className="w-full text-xs"
                    />
                  </div>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <label htmlFor="target-supplier-input" className="text-xs font-semibold uppercase text-charcoal-700">
                        Target Supplier *
                      </label>
                      <Combobox
                        id="target-supplier-input"
                        options={supplierOptions}
                        value={selectedSupplierId}
                        onChange={(val) => setSelectedSupplierId(val)}
                        onSearchChange={handleSupplierSearch}
                        placeholder="Search supplier..."
                        className="w-full text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase text-charcoal-700">
                        Source Warehouse (Filter)
                      </label>
                      <select
                        value={selectedDirectWarehouseId}
                        onChange={(e) => setSelectedDirectWarehouseId(e.target.value)}
                        className="w-full h-9 px-3 rounded-md bg-white border border-surface-border text-xs text-charcoal-800 focus:outline-none focus:border-brand-500"
                      >
                        <option value="">-- All Warehouses --</option>
                        {warehouses.map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.name} ({w.warehouseType})
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-charcoal-700">
                    Return Date *
                  </label>
                  <Input
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    required
                    className="bg-white border-surface-border text-charcoal-800 text-xs h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-charcoal-700">
                    Return Reason *
                  </label>
                  <select
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value as PurchaseReturnReason)}
                    required
                    className="w-full h-9 px-3 rounded-md bg-white border border-surface-border text-xs text-charcoal-800 focus:outline-none focus:border-brand-500"
                  >
                    {Object.entries(REASON_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Optional RGA & Reference Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3.5 rounded-lg bg-surface-muted/50 border border-surface-border">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold uppercase text-charcoal-600">
                    Vendor RGA / RMA # (Optional)
                  </label>
                  <Input
                    placeholder="e.g. RGA-2026-9921"
                    value={rgaNumber}
                    onChange={(e) => setRgaNumber(e.target.value)}
                    className="bg-white border-surface-border text-xs h-8 text-charcoal-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold uppercase text-charcoal-600">
                    RGA Auth Date (Optional)
                  </label>
                  <Input
                    type="date"
                    value={rgaDate}
                    onChange={(e) => setRgaDate(e.target.value)}
                    className="bg-white border-surface-border text-xs h-8 text-charcoal-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold uppercase text-charcoal-600">
                    Vendor Credit Note Ref (Optional)
                  </label>
                  <Input
                    placeholder="e.g. VCN-8812"
                    value={vendorCreditNoteNumber}
                    onChange={(e) => setVendorCreditNoteNumber(e.target.value)}
                    className="bg-white border-surface-border text-xs h-8 text-charcoal-800"
                  />
                </div>
              </div>

              {/* GRN Banner (GRN mode only) */}
              {createMode === 'FROM_GRN' && returnableData && (
                <div className="p-3.5 rounded-lg bg-brand-50/50 border border-brand-200/60 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-charcoal-500 block text-[11px]">Supplier</span>
                    <span className="font-bold text-charcoal-900 text-sm">
                      {returnableData.grn.supplierName} ({returnableData.grn.supplierCode})
                    </span>
                  </div>
                  <div>
                    <span className="text-charcoal-500 block text-[11px]">GRN Total</span>
                    <span className="font-mono font-semibold text-charcoal-800 text-sm">
                      Rs. {returnableData.grn.netTotal.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div>
                    <span className="text-charcoal-500 block text-[11px]">Outstanding Balance</span>
                    <span className="font-mono font-bold text-amber-700 text-sm">
                      Rs. {returnableData.grn.balanceAmount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div>
                    <span className="text-charcoal-500 block text-[11px]">Settled / Paid Amount</span>
                    <span className="font-mono font-semibold text-emerald-700 text-sm">
                      Rs. {returnableData.grn.paidAmount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}

              {/* Items Selection Table */}
              {createMode === 'FROM_GRN' ? (
                /* Mode A: GRN Line Items */
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-charcoal-800 uppercase tracking-wide">
                      GRN Returnable Line Items ({returnableData?.items.length || 0})
                    </h3>
                  </div>

                  {loadingReturnable ? (
                    <div className="py-10 text-center text-charcoal-500 border border-surface-border rounded-lg bg-surface-muted/20">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto text-brand-600 mb-2" />
                      <p>Loading GRN line item snapshots...</p>
                    </div>
                  ) : !returnableData ? (
                    <div className="py-10 text-center text-charcoal-500 border border-dashed border-surface-border rounded-lg bg-surface-muted/20">
                      <Info className="w-6 h-6 mx-auto text-charcoal-400 mb-2" />
                      <p>Please select a GRN above to populate returnable batches.</p>
                    </div>
                  ) : (
                    <div className="border border-surface-border rounded-lg overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-surface-muted/70 border-b border-surface-border text-charcoal-600 font-semibold uppercase">
                            <th className="py-2 px-3">Product & Batch</th>
                            <th className="py-2 px-3">Expiry</th>
                            <th className="py-2 px-3 text-right">Received / Max</th>
                            <th className="py-2 px-3 text-right">Unit Cost</th>
                            <th className="py-2 px-3">Return Billed Qty</th>
                            <th className="py-2 px-3">Return Bonus Qty</th>
                            <th className="py-2 px-3">Condition</th>
                            <th className="py-2 px-3">Source Warehouse</th>
                            <th className="py-2 px-3 text-right">Line Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-border">
                          {returnableData.items.map((item) => {
                            const row = grnItemRows[item.id] || {
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
                                className={`hover:bg-surface-muted/40 ${
                                  billedQty > 0 || (row.bonusReturnedQuantity || 0) > 0
                                    ? 'bg-brand-50/20'
                                    : ''
                                }`}
                              >
                                <td className="py-2.5 px-3">
                                  <span className="font-semibold text-charcoal-900 block">{item.productName}</span>
                                  <span className="text-[11px] font-mono text-charcoal-500">
                                    Batch: {item.batchNumber} | SKU: {item.productSku}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 whitespace-nowrap">
                                  <span
                                    className={`text-[11px] font-mono ${
                                      item.isExpired ? 'text-rose-600 font-bold' : 'text-charcoal-700'
                                    }`}
                                  >
                                    {new Date(item.expiryDate).toLocaleDateString('en-GB')}
                                    {item.isExpired && ' (EXPIRED)'}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono text-charcoal-700 whitespace-nowrap">
                                  <div>Billed: {item.availableBilled} / {item.receivedQuantity}</div>
                                  {item.bonusQuantity > 0 && (
                                    <div className="text-charcoal-400 text-[10px]">
                                      Bonus: {item.availableBonus} / {item.bonusQuantity}
                                    </div>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono text-charcoal-700 whitespace-nowrap">
                                  Rs. {item.unitCost.toFixed(2)}
                                </td>
                                <td className="py-2.5 px-3 w-28">
                                  <input
                                    type="number"
                                    min={0}
                                    max={item.availableBilled}
                                    value={row.returnedQuantity || ''}
                                    placeholder="0"
                                    onChange={(e) =>
                                      handleGrnRowChange(
                                        item.id,
                                        'returnedQuantity',
                                        Math.min(item.availableBilled, Math.max(0, parseInt(e.target.value) || 0)),
                                      )
                                    }
                                    className="w-full h-7 px-2 rounded bg-white border border-surface-border text-right text-charcoal-900 font-mono text-xs focus:outline-none focus:border-brand-500"
                                  />
                                </td>
                                <td className="py-2.5 px-3 w-28">
                                  <input
                                    type="number"
                                    min={0}
                                    max={item.availableBonus}
                                    value={row.bonusReturnedQuantity || ''}
                                    placeholder="0"
                                    disabled={item.availableBonus <= 0}
                                    onChange={(e) =>
                                      handleGrnRowChange(
                                        item.id,
                                        'bonusReturnedQuantity',
                                        Math.min(item.availableBonus, Math.max(0, parseInt(e.target.value) || 0)),
                                      )
                                    }
                                    className="w-full h-7 px-2 rounded bg-white border border-surface-border text-right text-charcoal-900 font-mono text-xs focus:outline-none focus:border-brand-500 disabled:opacity-40"
                                  />
                                </td>
                                <td className="py-2.5 px-3 w-36">
                                  <select
                                    value={row.stockCondition}
                                    disabled={!item.canReturnAsSaleable}
                                    onChange={(e) =>
                                      handleGrnRowChange(item.id, 'stockCondition', e.target.value as ReturnedStockCondition)
                                    }
                                    className="w-full h-7 px-2 rounded bg-white border border-surface-border text-xs text-charcoal-800 focus:outline-none focus:border-brand-500 disabled:opacity-60"
                                  >
                                    {item.canReturnAsSaleable && <option value="SALEABLE">SALEABLE</option>}
                                    <option value="QUARANTINED">QUARANTINED</option>
                                  </select>
                                </td>
                                <td className="py-2.5 px-3 w-44">
                                  <select
                                    value={row.sourceWarehouseId}
                                    onChange={(e) =>
                                      handleGrnRowChange(item.id, 'sourceWarehouseId', e.target.value)
                                    }
                                    className="w-full h-7 px-2 rounded bg-white border border-surface-border text-xs text-charcoal-800 focus:outline-none focus:border-brand-500"
                                  >
                                    {filteredWhs.map((w) => (
                                      <option key={w.id} value={w.id}>
                                        {w.name} ({w.code})
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600 whitespace-nowrap">
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
              ) : (
                /* Mode B: Direct Warehouse / Batch */
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h3 className="text-xs font-bold text-charcoal-800 uppercase tracking-wide">
                      Select Returnable Batches from Physical Stock ({returnableBatches.length})
                    </h3>
                    <div className="relative w-72">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-charcoal-400" />
                      <Input
                        placeholder="Filter batches by SKU / name..."
                        value={directBatchSearch}
                        onChange={(e) => setDirectBatchSearch(e.target.value)}
                        className="pl-8 bg-white border-surface-border text-xs h-7"
                      />
                    </div>
                  </div>

                  {loadingDirectBatches ? (
                    <div className="py-10 text-center text-charcoal-500 border border-surface-border rounded-lg bg-surface-muted/20">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto text-brand-600 mb-2" />
                      <p>Searching physical warehouse inventory...</p>
                    </div>
                  ) : returnableBatches.length === 0 ? (
                    <div className="py-10 text-center text-charcoal-500 border border-dashed border-surface-border rounded-lg bg-surface-muted/20">
                      <Info className="w-6 h-6 mx-auto text-charcoal-400 mb-2" />
                      <p>No inventory batches match your supplier / warehouse criteria.</p>
                    </div>
                  ) : (
                    <div className="border border-surface-border rounded-lg overflow-x-auto max-h-72">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="sticky top-0 bg-surface-muted border-b border-surface-border text-charcoal-600 font-semibold uppercase">
                          <tr>
                            <th className="py-2 px-3">Product & Batch</th>
                            <th className="py-2 px-3">Warehouse</th>
                            <th className="py-2 px-3 text-right">Available Stock</th>
                            <th className="py-2 px-3 text-right">Cost Price</th>
                            <th className="py-2 px-3">Return Billed Qty</th>
                            <th className="py-2 px-3">Return Bonus Qty</th>
                            <th className="py-2 px-3 text-right">Line Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-border">
                          {returnableBatches.map((item) => {
                            const row = directItemRows[item.batchId] || {
                              productId: item.productId,
                              warehouseId: item.warehouseId,
                              warehouseType: item.warehouseType,
                              returnedQuantity: 0,
                              bonusReturnedQuantity: 0,
                              purchaseCost: item.purchaseCost,
                            };
                            const billedQty = row.returnedQuantity || 0;
                            const lineTotal = billedQty * item.purchaseCost;

                            return (
                              <tr
                                key={`${item.batchId}-${item.warehouseId}`}
                                className={`hover:bg-surface-muted/40 ${
                                  billedQty > 0 || row.bonusReturnedQuantity > 0
                                    ? 'bg-brand-50/20'
                                    : ''
                                }`}
                              >
                                <td className="py-2.5 px-3">
                                  <div className="font-semibold text-charcoal-900">{item.productName}</div>
                                  <div className="text-[10px] font-mono text-charcoal-500">
                                    Batch: {item.batchNumber} | Exp: {new Date(item.expiryDate).toLocaleDateString('en-GB')}
                                    {item.isExpired && <span className="text-rose-600 font-bold ml-1">(EXPIRED)</span>}
                                    {item.warehouseType === 'QUARANTINE' && <span className="text-amber-600 font-bold ml-1">(QUARANTINED)</span>}
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 text-charcoal-700">
                                  {item.warehouseName}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-bold text-brand-700">
                                  {item.availableQuantity} units
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono text-charcoal-700">
                                  Rs. {Number(item.purchaseCost).toFixed(2)}
                                </td>
                                <td className="py-2.5 px-3 w-28">
                                  <input
                                    type="number"
                                    min={0}
                                    max={item.availableQuantity}
                                    value={row.returnedQuantity || ''}
                                    placeholder="0"
                                    onChange={(e) =>
                                      handleDirectRowChange(
                                        item,
                                        'returnedQuantity',
                                        Math.min(item.availableQuantity, Math.max(0, parseInt(e.target.value) || 0)),
                                      )
                                    }
                                    className="w-full h-7 px-2 rounded bg-white border border-surface-border text-right text-charcoal-900 font-mono text-xs focus:outline-none focus:border-brand-500"
                                  />
                                </td>
                                <td className="py-2.5 px-3 w-28">
                                  <input
                                    type="number"
                                    min={0}
                                    value={row.bonusReturnedQuantity || ''}
                                    placeholder="0"
                                    onChange={(e) =>
                                      handleDirectRowChange(
                                        item,
                                        'bonusReturnedQuantity',
                                        Math.max(0, parseInt(e.target.value) || 0),
                                      )
                                    }
                                    className="w-full h-7 px-2 rounded bg-white border border-surface-border text-right text-charcoal-900 font-mono text-xs focus:outline-none focus:border-brand-500"
                                  />
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600">
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
              )}

              {/* Step 3: Notes & Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-surface-border">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-charcoal-700">
                    Return Remarks / Reason Notes
                  </label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter return remarks, logistics carrier details, or inspection observations..."
                    className="w-full p-2.5 rounded-md bg-white border border-surface-border text-xs text-charcoal-900 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="p-3.5 rounded-lg bg-surface-muted/60 border border-surface-border space-y-1.5 text-xs">
                  <div className="flex justify-between text-charcoal-600">
                    <span>Estimated Subtotal:</span>
                    <span className="font-mono text-charcoal-900">Rs. {currentTotals.subtotal.toFixed(2)}</span>
                  </div>
                  {currentTotals.discount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Discounts:</span>
                      <span className="font-mono">-Rs. {currentTotals.discount.toFixed(2)}</span>
                    </div>
                  )}
                  {currentTotals.tax > 0 && (
                    <div className="flex justify-between text-amber-700">
                      <span>Taxes:</span>
                      <span className="font-mono">+Rs. {currentTotals.tax.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-rose-600 pt-2 border-t border-surface-border">
                    <span>Total Return Value:</span>
                    <span className="font-mono">Rs. {currentTotals.netTotal.toFixed(2)}</span>
                  </div>
                  <div className="pt-2 border-t border-surface-border text-[11px] text-amber-800 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 shrink-0" />
                    <span>Saved as DRAFT. Stock is deducted only upon physical dispatch.</span>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-border">
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
                  variant="primary"
                  size="sm"
                  disabled={isSubmitting || currentTotals.count === 0}
                  className="bg-brand-600 hover:bg-brand-700 text-white flex items-center gap-1.5 font-bold"
                >
                  {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Save Return Draft
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: Dispatch Return Confirmation */}
      {/* ===================================================================== */}
      {dispatchingReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl bg-white border border-surface-border shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-blue-600">
              <Truck className="w-6 h-6" />
              <div>
                <h3 className="text-base font-bold text-charcoal-900">Dispatch Return & Generate Challan</h3>
                <p className="text-xs text-charcoal-500">Return #{dispatchingReturn.returnNumber}</p>
              </div>
            </div>

            <p className="text-xs text-charcoal-700 leading-relaxed">
              Dispatching this return will <strong>permanently deduct physical stock</strong> from inventory and issue an official Supplier Return Transport Challan (SRCH-xxxxx).
            </p>

            <form onSubmit={handleConfirmDispatch} className="space-y-4 pt-1">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-charcoal-700">
                    Vendor RGA #
                  </label>
                  <Input
                    placeholder="e.g. RGA-1234"
                    value={dispatchRgaNumber}
                    onChange={(e) => setDispatchRgaNumber(e.target.value)}
                    className="bg-white border-surface-border text-xs h-8 text-charcoal-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-charcoal-700">
                    RGA Auth Date
                  </label>
                  <Input
                    type="date"
                    value={dispatchRgaDate}
                    onChange={(e) => setDispatchRgaDate(e.target.value)}
                    className="bg-white border-surface-border text-xs h-8 text-charcoal-800"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-charcoal-700">
                  Dispatch Remarks / Gate Pass Notes
                </label>
                <Input
                  placeholder="e.g. Handed over to courier / vendor representative"
                  value={dispatchNotes}
                  onChange={(e) => setDispatchNotes(e.target.value)}
                  className="bg-white border-surface-border text-xs h-8 text-charcoal-800"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isDispatching}
                  onClick={() => setDispatchingReturn(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isDispatching}
                  className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 font-bold"
                >
                  {isDispatching && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Confirm Dispatch & Challan
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 3: Complete Return & Post Debit Note */}
      {/* ===================================================================== */}
      {completingReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl bg-white border border-surface-border shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
              <div>
                <h3 className="text-base font-bold text-charcoal-900">Complete & Post Debit Note</h3>
                <p className="text-xs text-charcoal-500">Return #{completingReturn.returnNumber}</p>
              </div>
            </div>

            <p className="text-xs text-charcoal-700 leading-relaxed">
              Completing this return acknowledges vendor acceptance and <strong>posts a Debit Note to the Supplier Ledger</strong>, reducing vendor payable balance by Rs. {Number(completingReturn.netTotal).toFixed(2)}.
            </p>

            <form onSubmit={handleConfirmComplete} className="space-y-4 pt-1">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-charcoal-700">
                  Vendor Credit Note / Acknowledgement #
                </label>
                <Input
                  placeholder="e.g. VCN-998811"
                  value={completeVendorCreditNote}
                  onChange={(e) => setCompleteVendorCreditNote(e.target.value)}
                  className="bg-white border-surface-border text-xs h-8 text-charcoal-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-charcoal-700">
                  Reconciliation Remarks
                </label>
                <Input
                  placeholder="e.g. Credit verified by accounts department"
                  value={completeNotes}
                  onChange={(e) => setCompleteNotes(e.target.value)}
                  className="bg-white border-surface-border text-xs h-8 text-charcoal-800"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isCompleting}
                  onClick={() => setCompletingReturn(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isCompleting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 font-bold"
                >
                  {isCompleting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Post Debit Note to Ledger
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 4: DocumentPrintModal for Supplier Return Challan */}
      {/* ===================================================================== */}
      {viewingChallan && (
        <DocumentPrintModal
          isOpen={!!viewingChallan}
          onClose={() => setViewingChallan(null)}
          title={`Supplier Return Transport Challan — ${viewingChallan.challanNumber || viewingChallan.returnNumber}`}
          subtitle={`Supplier: ${viewingChallan.supplier?.name || 'Supplier'} • Date: ${new Date(viewingChallan.returnDate).toLocaleDateString('en-GB')}`}
          defaultLayout="A4"
          allowThermalToggle={true}
        >
          {(layout) => {
            const billedSum = (viewingChallan.items || []).reduce(
              (sum, it) => sum + Number(it.returnedQuantity || 0),
              0,
            );
            const bonusSum = (viewingChallan.items || []).reduce(
              (sum, it) => sum + Number(it.bonusReturnedQuantity || 0),
              0,
            );
            const printableChallanData: PrintableSupplierReturnChallan = {
              challanNumber: viewingChallan.challanNumber || viewingChallan.returnNumber,
              returnNumber: viewingChallan.returnNumber,
              returnDate: new Date(viewingChallan.returnDate).toLocaleDateString('en-GB'),
              dispatchedAt: viewingChallan.dispatchedAt ? new Date(viewingChallan.dispatchedAt).toLocaleDateString('en-GB') : null,
              rgaNumber: viewingChallan.rgaNumber || null,
              rgaDate: viewingChallan.rgaDate ? new Date(viewingChallan.rgaDate).toLocaleDateString('en-GB') : null,
              originalGrnNumber: viewingChallan.grn?.grnNumber || null,
              reason: REASON_LABELS[viewingChallan.reason] || viewingChallan.reason || null,
              status: viewingChallan.status,
              supplier: {
                name: viewingChallan.supplier?.name || 'Supplier',
                code: viewingChallan.supplier?.code || null,
                address: viewingChallan.supplier?.address || null,
                city: viewingChallan.supplier?.city || null,
                phone: viewingChallan.supplier?.phone || null,
                ntn: viewingChallan.supplier?.ntn || null,
              },
              lines: (viewingChallan.items || []).map((it, idx) => ({
                itemNumber: idx + 1,
                productSku: it.product?.sku || '',
                productName: it.product?.name || 'Unknown Product',
                batchNumber: it.batchNumber || '',
                expiryDate: it.expiryDate
                  ? new Date(it.expiryDate).toLocaleDateString('en-GB')
                  : '',
                returnedQuantity: Number(it.returnedQuantity || 0),
                bonusReturnedQuantity: Number(it.bonusReturnedQuantity || 0),
                totalQuantity: Number(it.totalReturnedQuantity || (Number(it.returnedQuantity || 0) + Number(it.bonusReturnedQuantity || 0))),
                stockCondition: it.stockCondition || 'QUARANTINED',
                sourceWarehouseName: it.sourceWarehouse?.name || null,
              })),
              summary: {
                totalBilledQuantity: billedSum,
                totalBonusQuantity: bonusSum,
                totalReturnedQuantity: billedSum + bonusSum,
                totalLinesCount: (viewingChallan.items || []).length,
              },
              dispatchedByUser: (viewingChallan as any).dispatchedByUser ? {
                displayName: (viewingChallan as any).dispatchedByUser.displayName || '',
                username: (viewingChallan as any).dispatchedByUser.username || '',
              } : null,
              footerNotes: settingsMap['supplier_challan_footer_notes'] || null,
            };

            return (
              <SupplierReturnChallanPrintTemplate
                challan={printableChallanData}
                company={company}
                layout={layout}
              />
            );
          }}
        </DocumentPrintModal>
      )}

      {/* ===================================================================== */}
      {/* MODAL 5: DocumentPrintModal for Purchase Return Debit Note */}
      {/* ===================================================================== */}
      {viewingDebitNote && (
        <DocumentPrintModal
          isOpen={!!viewingDebitNote}
          onClose={() => setViewingDebitNote(null)}
          title={`Purchase Return Debit Note — ${viewingDebitNote.returnNumber}`}
          subtitle={`Supplier: ${viewingDebitNote.supplier?.name || 'Supplier'} • Date: ${new Date(viewingDebitNote.returnDate).toLocaleDateString('en-GB')}`}
          defaultLayout="A4"
          allowThermalToggle={true}
        >
          {(layout) => {
            const printableData: PrintablePurchaseReturn = {
              returnNumber: viewingDebitNote.returnNumber,
              returnDate: new Date(viewingDebitNote.returnDate).toLocaleDateString('en-GB'),
              challanNumber: viewingDebitNote.challanNumber || null,
              rgaNumber: viewingDebitNote.rgaNumber || null,
              rgaDate: viewingDebitNote.rgaDate
                ? new Date(viewingDebitNote.rgaDate).toLocaleDateString('en-GB')
                : null,
              vendorCreditNoteNumber: viewingDebitNote.vendorCreditNoteNumber || null,
              originalGrnNumber: viewingDebitNote.grn?.grnNumber || null,
              originalGrnDate: viewingDebitNote.grn?.receivedDate
                ? new Date(viewingDebitNote.grn.receivedDate).toLocaleDateString('en-GB')
                : null,
              status: viewingDebitNote.status,
              supplier: {
                name: viewingDebitNote.supplier?.name || 'Supplier',
                code: viewingDebitNote.supplier?.code || null,
                address: viewingDebitNote.supplier?.address || null,
                city: viewingDebitNote.supplier?.city || null,
                phone: viewingDebitNote.supplier?.phone || null,
                ntn: viewingDebitNote.supplier?.ntn || null,
              },
              lines: (viewingDebitNote.items || []).map((it, idx) => ({
                itemNumber: idx + 1,
                sku: it.product?.sku || '',
                productName: it.product?.name || 'Unknown Product',
                batchNumber: it.batchNumber || '',
                expiryDate: it.expiryDate
                  ? new Date(it.expiryDate).toLocaleDateString('en-GB')
                  : '',
                quantity: Number(it.returnedQuantity || 0),
                bonusQuantity: Number(it.bonusReturnedQuantity || 0),
                unitPrice: Number(it.unitCost || 0),
                reason: REASON_LABELS[viewingDebitNote.reason] || viewingDebitNote.reason || null,
                lineTotal: Number(it.lineTotal || 0),
              })),
              subtotal: Number(viewingDebitNote.subtotal || viewingDebitNote.netTotal || 0),
              totalDiscount: Number(viewingDebitNote.discountAmount || 0),
              totalTax: Number(viewingDebitNote.taxAmount || 0),
              totalDebitAmount: Number(viewingDebitNote.netTotal || 0),
              reason: REASON_LABELS[viewingDebitNote.reason] || viewingDebitNote.reason || null,
              approvedBy: (viewingDebitNote as any).completedByUser?.displayName || (viewingDebitNote as any).postedByUser?.displayName || null,
              footerNotes: settingsMap['purchase_return_footer_notes'] || null,
            };

            return (
              <PurchaseReturnPrintTemplate
                purchaseReturn={printableData}
                company={company}
                layout={layout}
              />
            );
          }}
        </DocumentPrintModal>
      )}

      {/* ===================================================================== */}
      {/* MODAL 6: Cancel / Void Purchase Return */}
      {/* ===================================================================== */}
      {cancellingReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-white border border-surface-border shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="text-base font-bold text-charcoal-900">Void Purchase Return</h3>
            </div>

            <p className="text-xs text-charcoal-700">
              Cancelling return <strong className="text-charcoal-900 font-mono">{cancellingReturn.returnNumber}</strong> ({cancellingReturn.status}) will:
            </p>
            <ul className="list-disc list-inside text-xs text-charcoal-500 space-y-1">
              {cancellingReturn.status === 'DISPATCHED' || cancellingReturn.status === 'COMPLETED' ? (
                <>
                  <li>Re-enter the dispatched stock back into inventory.</li>
                  {cancellingReturn.grnId && <li>Restore the payable amount on GRN {cancellingReturn.grn?.grnNumber}.</li>}
                  {cancellingReturn.status === 'COMPLETED' && <li>Post an Adjustment credit note to the Supplier Ledger.</li>}
                </>
              ) : (
                <li>Mark the draft return as void with zero inventory or financial changes.</li>
              )}
            </ul>

            <form onSubmit={handleCancelReturn} className="space-y-4 pt-1">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-charcoal-700">
                  Reason for Cancellation *
                </label>
                <Input
                  required
                  placeholder="e.g. Supplier rejected claim, wrong return items selected..."
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  className="bg-white border-surface-border text-xs h-9 text-charcoal-800"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-surface-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isCancelling}
                  onClick={() => setCancellingReturn(null)}
                >
                  Keep Return
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isCancelling || !cancellationReason.trim()}
                  className="bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 font-bold"
                >
                  {isCancelling && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
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

