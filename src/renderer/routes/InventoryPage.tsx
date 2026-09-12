import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Layers,
  Search,
  RefreshCw,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  Boxes,
  RotateCcw,
  Sparkles,
  PackageCheck,
  Building2,
  Trash2,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Pagination } from '../components/ui/Pagination';
import { Combobox, ComboboxOption } from '../components/ui/Combobox';
import { toast } from '../components/ui/Toast';
import {
  inventoryApi,
  StockSummaryItem,
  StockMovementItem,
  StockMovementType,
  StockAdjustment,
  StockAdjustmentReason,
  FefoAllocationResult,
  ProductStockDetailsResponse,
  warehousesApi,
  Warehouse,
  productsApi,
  Product,
  batchesApi,
  Batch,
} from '../api';

export const InventoryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'summary' | 'ledger' | 'adjustments' | 'fefo'>('summary');

  // --- Warehouses State ---
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');

  // --- Feedback Toast State ---
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: React.ReactNode;
    confirmText?: string;
    variant?: 'primary' | 'danger' | 'warning';
    onConfirm: () => Promise<void> | void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    if (type === 'error') {
      toast.error(message);
    } else {
      toast.success(message);
    }
    setTimeout(() => setFeedback(null), 4500);
  };

  // Load Warehouses
  const loadWarehouses = useCallback(async () => {
    try {
      const data = await warehousesApi.getWarehouses();
      setWarehouses(data);
      if (data.length > 0 && !selectedWarehouseId) {
        const defaultWh = data.find((w) => w.isDefault) || data[0];
        setSelectedWarehouseId(defaultWh.id);
      }
    } catch {
      // Ignore
    }
  }, [selectedWarehouseId]);

  useEffect(() => {
    loadWarehouses();
    const loadCatalog = async () => {
      try {
        const prods = await productsApi.getProducts({ limit: 100 });
        setCatalogProducts(prods.items);
      } catch {
        // Ignore
      }
    };
    loadCatalog();
  }, [loadWarehouses]);

  // =========================================================
  // TAB 1: STOCK SUMMARY & BALANCES
  // =========================================================
  const [summaryItems, setSummaryItems] = useState<StockSummaryItem[]>([]);
  const [summaryTotal, setSummaryTotal] = useState(0);
  const [summaryPage, setSummaryPage] = useState(1);
  const [summarySearch, setSummarySearch] = useState('');
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  // Selected Product Drawer
  const [selectedProductStock, setSelectedProductStock] = useState<ProductStockDetailsResponse | null>(null);

  const loadSummary = useCallback(async () => {
    try {
      setIsLoadingSummary(true);
      const res = await inventoryApi.getInventorySummary({
        warehouseId: selectedWarehouseId || undefined,
        search: summarySearch.trim() || undefined,
        page: summaryPage,
        limit: 20,
      });
      setSummaryItems(res.items);
      setSummaryTotal(res.meta.total);
    } catch (err: unknown) {
      showFeedback('error', (err as Error)?.message || 'Failed to load inventory summary');
    } finally {
      setIsLoadingSummary(false);
    }
  }, [selectedWarehouseId, summarySearch, summaryPage]);

  useEffect(() => {
    if (activeTab === 'summary') {
      loadSummary();
    }
  }, [activeTab, loadSummary]);

  const handleOpenProductDrawer = async (item: StockSummaryItem) => {
    try {
      const details = await inventoryApi.getProductStockDetails(item.id, selectedWarehouseId || undefined);
      setSelectedProductStock(details);
    } catch (err: unknown) {
      showFeedback('error', (err as Error)?.message || 'Failed to load batch stock details');
    }
  };

  // =========================================================
  // TAB 2: STOCK LEDGER (AUDIT TRAIL)
  // =========================================================
  const [ledgerItems, setLedgerItems] = useState<StockMovementItem[]>([]);
  const [ledgerTotal, setLedgerTotal] = useState(0);
  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerMovementType, setLedgerMovementType] = useState<string>('');
  const [isLoadingLedger, setIsLoadingLedger] = useState(false);

  const loadLedger = useCallback(async () => {
    try {
      setIsLoadingLedger(true);
      const res = await inventoryApi.getStockLedger({
        warehouseId: selectedWarehouseId || undefined,
        movementType: (ledgerMovementType as StockMovementType) || undefined,
        page: ledgerPage,
        limit: 30,
      });
      setLedgerItems(res.items);
      setLedgerTotal(res.meta.total);
    } catch (err: unknown) {
      showFeedback('error', (err as Error)?.message || 'Failed to load stock ledger');
    } finally {
      setIsLoadingLedger(false);
    }
  }, [selectedWarehouseId, ledgerMovementType, ledgerPage]);

  useEffect(() => {
    if (activeTab === 'ledger') {
      loadLedger();
    }
  }, [activeTab, loadLedger]);

  // =========================================================
  // TAB 3: STOCK ADJUSTMENTS WORKFLOW
  // =========================================================
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [adjustmentsTotal, setAdjustmentsTotal] = useState(0);
  const [adjustmentsPage, setAdjustmentsPage] = useState(1);
  const [adjustmentsStatusFilter, setAdjustmentsStatusFilter] = useState<'ALL' | 'DRAFT' | 'POSTED' | 'CANCELLED'>('ALL');
  const [isLoadingAdjustments, setIsLoadingAdjustments] = useState(false);

  // New Adjustment Modal State
  const [isAdjModalOpen, setIsAdjModalOpen] = useState(false);
  const [adjWarehouseId, setAdjWarehouseId] = useState('');
  const [adjReason, setAdjReason] = useState<StockAdjustmentReason>('PHYSICAL_INVENTORY_VARIANCE');
  const [adjNotes, setAdjNotes] = useState('');
  const [adjItems, setAdjItems] = useState<
    Array<{
      productId: string;
      productName: string;
      sku: string;
      batchId: string;
      batchNumber: string;
      currentQuantity: number;
      countedQuantity: number;
      varianceQuantity: number;
      remarks: string;
    }>
  >([]);

  // Product / Batch selector for adjustment line
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [selectedAdjProduct, setSelectedAdjProduct] = useState<Product | null>(null);
  const [productBatches, setProductBatches] = useState<Batch[]>([]);
  const [selectedAdjBatch, setSelectedAdjBatch] = useState<Batch | null>(null);
  const [currentBatchBalance, setCurrentBatchBalance] = useState<number>(0);
  const [countedQtyInput, setCountedQtyInput] = useState<number>(0);
  const [lineRemarks, setLineRemarks] = useState('');
  const [isSavingAdjustment, setIsSavingAdjustment] = useState(false);

  // Combobox options for adjustment line product search
  const productComboboxOptions: ComboboxOption[] = useMemo(() => {
    return catalogProducts.map((p) => ({
      value: p.id,
      label: `${p.name} (${p.sku})`,
      sublabel: p.genericName || undefined,
    }));
  }, [catalogProducts]);

  const handleProductSearch = useCallback(async (query: string) => {
    if (!query || query.trim().length === 0) return;
    try {
      const res = await productsApi.getProducts({ search: query.trim(), limit: 50 });
      if (res?.items) {
        setCatalogProducts((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const newItems = res.items.filter((p) => !existingIds.has(p.id));
          return [...prev, ...newItems];
        });
      }
    } catch {
      // Ignore search error
    }
  }, []);

  const loadAdjustments = useCallback(async () => {
    try {
      setIsLoadingAdjustments(true);
      const res = await inventoryApi.getStockAdjustments({
        warehouseId: selectedWarehouseId || undefined,
        status: adjustmentsStatusFilter === 'ALL' ? undefined : adjustmentsStatusFilter,
        page: adjustmentsPage,
        limit: 20,
      });
      setAdjustments(res.items);
      setAdjustmentsTotal(res.meta.total);
    } catch (err: unknown) {
      showFeedback('error', (err as Error)?.message || 'Failed to load stock adjustments');
    } finally {
      setIsLoadingAdjustments(false);
    }
  }, [selectedWarehouseId, adjustmentsStatusFilter, adjustmentsPage]);

  useEffect(() => {
    if (activeTab === 'adjustments') {
      loadAdjustments();
    }
  }, [activeTab, loadAdjustments]);

  const handleOpenNewAdjustmentModal = async () => {
    setAdjWarehouseId(selectedWarehouseId || (warehouses[0]?.id ?? ''));
    setAdjReason('PHYSICAL_INVENTORY_VARIANCE');
    setAdjNotes('');
    setAdjItems([]);
    setSelectedAdjProduct(null);
    setSelectedAdjBatch(null);
    setCurrentBatchBalance(0);
    setCountedQtyInput(0);
    setLineRemarks('');

    try {
      const prods = await productsApi.getProducts({ limit: 100 });
      setCatalogProducts(prods.items);
    } catch {
      // Ignored
    }

    setIsAdjModalOpen(true);
  };

  const handleSelectAdjProduct = async (prodId: string) => {
    const prod = catalogProducts.find((p) => p.id === prodId) || null;
    setSelectedAdjProduct(prod);
    setSelectedAdjBatch(null);
    setCurrentBatchBalance(0);

    if (prod) {
      try {
        const batches = await batchesApi.getBatchesByProduct(prod.id);
        setProductBatches(batches);
      } catch {
        setProductBatches([]);
      }
    } else {
      setProductBatches([]);
    }
  };

  const handleSelectAdjBatch = async (batchId: string) => {
    const batch = productBatches.find((b) => b.id === batchId) || null;
    setSelectedAdjBatch(batch);

    if (batch && selectedAdjProduct && adjWarehouseId) {
      try {
        const details = await inventoryApi.getProductStockDetails(selectedAdjProduct.id, adjWarehouseId);
        const match = details.batches.find((b) => b.id === batch.id);
        const currentQty = match?.totalQuantity || 0;
        setCurrentBatchBalance(currentQty);
        setCountedQtyInput(currentQty);
      } catch {
        setCurrentBatchBalance(0);
        setCountedQtyInput(0);
      }
    }
  };

  const handleAddAdjustmentLine = () => {
    if (!selectedAdjProduct || !selectedAdjBatch) {
      showFeedback('error', 'Please select both product and batch.');
      return;
    }

    const variance = countedQtyInput - currentBatchBalance;
    if (variance === 0) {
      showFeedback('error', 'Counted quantity equals current balance (0 variance). No adjustment required.');
      return;
    }

    // Check if line already added
    if (adjItems.some((i) => i.batchId === selectedAdjBatch.id)) {
      showFeedback('error', `Batch "${selectedAdjBatch.batchNumber}" is already added to this adjustment.`);
      return;
    }

    setAdjItems([
      ...adjItems,
      {
        productId: selectedAdjProduct.id,
        productName: selectedAdjProduct.name,
        sku: selectedAdjProduct.sku,
        batchId: selectedAdjBatch.id,
        batchNumber: selectedAdjBatch.batchNumber,
        currentQuantity: currentBatchBalance,
        countedQuantity: countedQtyInput,
        varianceQuantity: variance,
        remarks: lineRemarks.trim(),
      },
    ]);

    // Reset line pickers
    setSelectedAdjProduct(null);
    setSelectedAdjBatch(null);
    setCurrentBatchBalance(0);
    setCountedQtyInput(0);
    setLineRemarks('');
  };

  const handleRemoveAdjustmentLine = (index: number) => {
    setAdjItems(adjItems.filter((_, i) => i !== index));
  };

  const handleSaveAndPostAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjWarehouseId) {
      showFeedback('error', 'Please select a warehouse.');
      return;
    }

    if (adjItems.length === 0) {
      showFeedback('error', 'Please add at least one line item to the adjustment.');
      return;
    }

    try {
      setIsSavingAdjustment(true);
      // 1. Create draft adjustment
      const draft = await inventoryApi.createStockAdjustment({
        warehouseId: adjWarehouseId,
        reason: adjReason,
        notes: adjNotes || undefined,
        items: adjItems.map((item) => ({
          productId: item.productId,
          batchId: item.batchId,
          varianceQuantity: item.varianceQuantity,
          remarks: item.remarks || undefined,
        })),
      });

      // 2. Post adjustment
      const posted = await inventoryApi.postStockAdjustment(draft.id);
      showFeedback('success', `Stock Adjustment ${posted.adjustmentNumber} posted successfully!`);
      setIsAdjModalOpen(false);
      loadAdjustments();
      loadSummary();
    } catch (err: unknown) {
      showFeedback('error', (err as Error)?.message || 'Failed to post stock adjustment.');
    } finally {
      setIsSavingAdjustment(false);
    }
  };

  const handleReverseAdjustment = (adj: StockAdjustment) => {
    setConfirmConfig({
      isOpen: true,
      title: `Reverse Stock Adjustment ${adj.adjustmentNumber}`,
      description: `Are you sure you want to reverse Stock Adjustment "${adj.adjustmentNumber}"? This will create compensating ledger entries.`,
      confirmText: 'Reverse Adjustment',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        try {
          const reversed = await inventoryApi.reverseStockAdjustment(adj.id);
          showFeedback('success', `Adjustment reversed. Compensating document: ${reversed.adjustmentNumber}`);
          loadAdjustments();
          loadSummary();
        } catch (err: unknown) {
          showFeedback('error', (err as Error)?.message || 'Failed to reverse adjustment.');
        }
      },
    });
  };

  // =========================================================
  // TAB 4: FEFO ALLOCATION SIMULATOR
  // =========================================================
  const [fefoProductId, setFefoProductId] = useState('');
  const [fefoQuantity, setFefoQuantity] = useState<number>(10);
  const [fefoResult, setFefoResult] = useState<FefoAllocationResult | null>(null);
  const [isSimulatingFefo, setIsSimulatingFefo] = useState(false);

  const handleSimulateFefo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fefoProductId || !selectedWarehouseId || fefoQuantity <= 0) {
      showFeedback('error', 'Please select product, warehouse, and valid quantity.');
      return;
    }

    try {
      setIsSimulatingFefo(true);
      const res = await inventoryApi.previewFefo({
        warehouseId: selectedWarehouseId,
        productId: fefoProductId,
        quantity: Number(fefoQuantity),
      });
      setFefoResult(res);
    } catch (err: unknown) {
      showFeedback('error', (err as Error)?.message || 'Failed to simulate FEFO allocation.');
    } finally {
      setIsSimulatingFefo(false);
    }
  };

  // =========================================================
  // OPENING BALANCE MODAL STATE
  // =========================================================
  const [isOpeningModalOpen, setIsOpeningModalOpen] = useState(false);
  const [openingWarehouseId, setOpeningWarehouseId] = useState('');
  const [openingProductId, setOpeningProductId] = useState('');
  const [openingBatchId, setOpeningBatchId] = useState('');
  const [openingQuantity, setOpeningQuantity] = useState<number>(100);
  const [openingUnitCost, setOpeningUnitCost] = useState<number>(0);
  const [openingNotes, setOpeningNotes] = useState('');
  const [isSavingOpening, setIsSavingOpening] = useState(false);
  const [openingProductBatches, setOpeningProductBatches] = useState<Batch[]>([]);

  const handleOpenOpeningModal = async () => {
    setOpeningWarehouseId(selectedWarehouseId || (warehouses[0]?.id ?? ''));
    setOpeningProductId('');
    setOpeningBatchId('');
    setOpeningQuantity(100);
    setOpeningUnitCost(0);
    setOpeningNotes('Initial opening balance setup');

    try {
      const prods = await productsApi.getProducts({ limit: 100 });
      setCatalogProducts(prods.items);
    } catch {
      // Ignored
    }

    setIsOpeningModalOpen(true);
  };

  const handleSelectOpeningProduct = async (prodId: string) => {
    setOpeningProductId(prodId);
    setOpeningBatchId('');
    if (prodId) {
      try {
        const batches = await batchesApi.getBatchesByProduct(prodId);
        setOpeningProductBatches(batches);
        if (batches.length > 0) {
          setOpeningBatchId(batches[0].id);
          setOpeningUnitCost(Number(batches[0].purchaseCost));
        }
      } catch {
        setOpeningProductBatches([]);
      }
    } else {
      setOpeningProductBatches([]);
    }
  };

  const handleSaveOpeningBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!openingWarehouseId || !openingProductId || !openingBatchId || openingQuantity <= 0) {
      showFeedback('error', 'All fields are required with positive quantity.');
      return;
    }

    try {
      setIsSavingOpening(true);
      await inventoryApi.createOpeningBalance({
        warehouseId: openingWarehouseId,
        productId: openingProductId,
        batchId: openingBatchId,
        quantity: Number(openingQuantity),
        unitCost: Number(openingUnitCost),
        notes: openingNotes.trim() || undefined,
      });

      showFeedback('success', 'Opening balance committed to ledger.');
      setIsOpeningModalOpen(false);
      loadSummary();
    } catch (err: unknown) {
      showFeedback('error', (err as Error)?.message || 'Failed to post opening balance.');
    } finally {
      setIsSavingOpening(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`p-3 rounded text-xs flex items-center justify-between shadow-md transition-all ${
            feedback.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            )}
            <span className="font-medium">{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-charcoal-400 hover:text-charcoal-700 p-0.5"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Header & Warehouse Filter Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-surface-border pb-3 gap-3">
        <div>
          <h1 className="text-base font-bold text-charcoal-900 tracking-tight flex items-center gap-2">
            <Layers className="h-4 w-4 text-brand-500" />
            <span>Inventory & Stock Movement Ledger</span>
          </h1>
          <p className="text-xs text-charcoal-500 mt-0.5">
            Real-time batch-level tracking, auditable stock movements, FEFO allocation, and physical adjustments
          </p>
        </div>

        {/* Global Warehouse Selector & Actions */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-surface-card border border-surface-border rounded px-2.5 py-1 text-xs">
            <Building2 className="h-3.5 w-3.5 text-charcoal-500" />
            <span className="font-semibold text-charcoal-700">Location:</span>
            <select
              value={selectedWarehouseId}
              onChange={(e) => setSelectedWarehouseId(e.target.value)}
              className="bg-transparent text-charcoal-900 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="">All Warehouses</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.code})
                </option>
              ))}
            </select>
          </div>

          <Button
            variant="outline"
            size="xs"
            onClick={handleOpenOpeningModal}
            title="Setup Initial / Opening Stock for a Batch"
          >
            <Plus className="h-3 w-3 mr-1" />
            Opening Stock
          </Button>

          <Button
            variant="primary"
            size="xs"
            onClick={handleOpenNewAdjustmentModal}
            title="Record Stock Variance / Adjustment"
          >
            <Plus className="h-3 w-3 mr-1" />
            Adjust Stock
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-surface-border space-x-2 text-xs">
        <button
          type="button"
          data-testid="tab-summary"
          onClick={() => setActiveTab('summary')}
          className={`pb-2 px-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'summary'
              ? 'border-brand-500 text-brand-600'
              : 'border-transparent text-charcoal-500 hover:text-charcoal-800'
          }`}
        >
          <Boxes className="h-3.5 w-3.5" />
          <span>Stock Summary & Balances</span>
        </button>

        <button
          type="button"
          data-testid="tab-ledger"
          onClick={() => setActiveTab('ledger')}
          className={`pb-2 px-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'ledger'
              ? 'border-brand-500 text-brand-600'
              : 'border-transparent text-charcoal-500 hover:text-charcoal-800'
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          <span>Movement Ledger (Audit Trail)</span>
        </button>

        <button
          type="button"
          data-testid="tab-adjustments"
          onClick={() => setActiveTab('adjustments')}
          className={`pb-2 px-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'adjustments'
              ? 'border-brand-500 text-brand-600'
              : 'border-transparent text-charcoal-500 hover:text-charcoal-800'
          }`}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Stock Adjustments</span>
        </button>

        <button
          type="button"
          data-testid="tab-fefo"
          onClick={() => setActiveTab('fefo')}
          className={`pb-2 px-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'fefo'
              ? 'border-brand-500 text-brand-600'
              : 'border-transparent text-charcoal-500 hover:text-charcoal-800'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>FEFO Allocation Simulator</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: STOCK SUMMARY VIEW                                 */}
      {/* ========================================================= */}
      {activeTab === 'summary' && (
        <div className="space-y-4">
          {/* Search & Refresh Toolbar */}
          <Card className="p-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-charcoal-400" />
                <input
                  type="text"
                  placeholder="Search by Product Name, Generic, SKU, or Barcode..."
                  value={summarySearch}
                  onChange={(e) => {
                    setSummarySearch(e.target.value);
                    setSummaryPage(1);
                  }}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-surface-card border border-surface-border rounded text-charcoal-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="xs"
                  onClick={loadSummary}
                  disabled={isLoadingSummary}
                >
                  <RefreshCw className={`h-3 w-3 mr-1 ${isLoadingSummary ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </Card>

          {/* Product Stock Table */}
          <Card
            header={
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-charcoal-900 text-xs uppercase tracking-wider">
                    Product Stock Master
                  </span>
                  <span className="text-[11px] font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                    {summaryTotal} SKUs
                  </span>
                </div>
                <span className="text-[11px] text-charcoal-500">
                  Page {summaryPage} of {Math.ceil(summaryTotal / 20) || 1}
                </span>
              </div>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-surface-border text-charcoal-500 bg-surface-muted">
                    <th className="py-2.5 px-3 font-semibold">SKU / Code</th>
                    <th className="py-2.5 px-3 font-semibold">Product Name</th>
                    <th className="py-2.5 px-3 font-semibold">Generic Composition</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Physical Units</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Saleable Stock</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Quarantined / Recalled</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Expired</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Stock Valuation (Cost)</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {summaryItems.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-surface-muted/60 transition-colors cursor-pointer"
                      onClick={() => handleOpenProductDrawer(item)}
                    >
                      <td className="py-2 px-3 font-mono font-bold text-charcoal-900">
                        {item.sku}
                      </td>
                      <td className="py-2 px-3 font-semibold text-charcoal-900">
                        {item.name}
                        {item.dosageForm && (
                          <span className="ml-1.5 text-[10px] font-normal text-charcoal-500">
                            ({item.dosageForm})
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-charcoal-600 italic">
                        {item.genericName}
                      </td>
                      <td className="py-2 px-3 font-mono font-bold text-right text-charcoal-800">
                        {item.physicalStock}{' '}
                        <span className="text-[10px] text-charcoal-500">
                          {item.unit?.symbol || 'Units'}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-mono font-bold text-right text-green-600">
                        {item.saleableStock}
                      </td>
                      <td className="py-2 px-3 font-mono text-right text-amber-600">
                        {item.quarantinedStock + item.recalledStock > 0 ? (
                          <span className="px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200">
                            {item.quarantinedStock + item.recalledStock}
                          </span>
                        ) : (
                          '0'
                        )}
                      </td>
                      <td className="py-2 px-3 font-mono text-right text-red-600">
                        {item.expiredStock > 0 ? (
                          <span className="px-1.5 py-0.5 rounded bg-red-50 border border-red-200">
                            {item.expiredStock}
                          </span>
                        ) : (
                          '0'
                        )}
                      </td>
                      <td className="py-2 px-3 font-mono text-right text-charcoal-800">
                        Rs. {item.totalCostValuation.toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => handleOpenProductDrawer(item)}
                        >
                          <Layers className="h-3 w-3 mr-1" />
                          Lots ({item.batchCount})
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {summaryItems.length === 0 && !isLoadingSummary && (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-charcoal-400">
                        No inventory balances found. Use &quot;Opening Stock&quot; or &quot;Adjust Stock&quot; to initialize batch quantities.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {summaryTotal > 20 && (
              <Pagination
                currentPage={summaryPage}
                totalPages={Math.ceil(summaryTotal / 20)}
                totalItems={summaryTotal}
                pageSize={20}
                onPageChange={setSummaryPage}
                showPageSizeSelector={false}
              />
            )}
          </Card>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: STOCK LEDGER VIEW                                  */}
      {/* ========================================================= */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          <Card className="p-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <select
                  value={ledgerMovementType}
                  onChange={(e) => {
                    setLedgerMovementType(e.target.value);
                    setLedgerPage(1);
                  }}
                  className="px-2.5 py-1.5 text-xs bg-surface-card border border-surface-border rounded text-charcoal-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="">All Movement Types</option>
                  <option value="OPENING_BALANCE">Opening Balance (+)</option>
                  <option value="STOCK_ADJUSTMENT_IN">Stock Adjustment In (+)</option>
                  <option value="STOCK_ADJUSTMENT_OUT">Stock Adjustment Out (-)</option>
                  <option value="TRANSFER_IN">Transfer In (+)</option>
                  <option value="TRANSFER_OUT">Transfer Out (-)</option>
                  <option value="PURCHASE_RECEIPT">Purchase Receipt (+)</option>
                  <option value="PURCHASE_RETURN">Purchase Return (-)</option>
                  <option value="SALES_ISSUE">Sales Issue (-)</option>
                  <option value="SALES_RETURN">Sales Return (+)</option>
                </select>

                <Button
                  variant="outline"
                  size="xs"
                  onClick={loadLedger}
                  disabled={isLoadingLedger}
                >
                  <RefreshCw className={`h-3 w-3 mr-1 ${isLoadingLedger ? 'animate-spin' : ''}`} />
                  Refresh Ledger
                </Button>
              </div>

              <span className="text-xs text-charcoal-500 font-medium">
                Showing immutable, signed movement transactions
              </span>
            </div>
          </Card>

          <Card
            header={
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-charcoal-900 text-xs uppercase tracking-wider">
                    Stock Movement Audit Ledger
                  </span>
                  <span className="text-[11px] font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                    {ledgerTotal} Transactions
                  </span>
                </div>
                <span className="text-[11px] text-charcoal-500">
                  Page {ledgerPage} of {Math.ceil(ledgerTotal / 30) || 1}
                </span>
              </div>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-surface-border text-charcoal-500 bg-surface-muted">
                    <th className="py-2.5 px-3 font-semibold">Timestamp</th>
                    <th className="py-2.5 px-3 font-semibold">Movement Type</th>
                    <th className="py-2.5 px-3 font-semibold">Product SKU & Name</th>
                    <th className="py-2.5 px-3 font-semibold">Batch / Lot</th>
                    <th className="py-2.5 px-3 font-semibold">Location</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Quantity</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Unit Cost</th>
                    <th className="py-2.5 px-3 font-semibold">Reference</th>
                    <th className="py-2.5 px-3 font-semibold">User</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {ledgerItems.map((m) => (
                    <tr key={m.id} className="hover:bg-surface-muted/50">
                      <td className="py-2.5 px-3 text-charcoal-600 font-mono text-[11px]">
                        {new Date(m.movementDate).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono font-semibold text-[11px] ${
                            m.quantity > 0
                              ? 'bg-green-50 text-green-700 border border-green-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {m.quantity > 0 ? (
                            <ArrowUpRight className="h-3 w-3" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3" />
                          )}
                          {m.movementType}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-mono font-bold text-charcoal-900 block">
                          {m.product?.sku}
                        </span>
                        <span className="text-charcoal-700 text-[11px]">
                          {m.product?.name}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-charcoal-800">
                        {m.batch?.batchNumber}
                      </td>
                      <td className="py-2.5 px-3 text-charcoal-700">
                        {m.warehouse?.name}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-right text-xs">
                        <span className={m.quantity > 0 ? 'text-green-600' : 'text-red-600'}>
                          {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-right text-charcoal-700">
                        Rs. {Number(m.unitCost).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-charcoal-600 text-[11px]">
                        <span className="font-semibold text-charcoal-800 block">
                          {m.referenceType}
                        </span>
                        {m.notes && <span className="text-charcoal-500">{m.notes}</span>}
                      </td>
                      <td className="py-2.5 px-3 text-charcoal-600 text-[11px]">
                        {m.createdByUser?.displayName || m.createdByUser?.username || 'System'}
                      </td>
                    </tr>
                  ))}
                  {ledgerItems.length === 0 && !isLoadingLedger && (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-charcoal-400">
                        No ledger movements recorded matching criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {ledgerTotal > 30 && (
              <Pagination
                currentPage={ledgerPage}
                totalPages={Math.ceil(ledgerTotal / 30)}
                totalItems={ledgerTotal}
                pageSize={30}
                onPageChange={setLedgerPage}
                showPageSizeSelector={false}
              />
            )}
          </Card>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: STOCK ADJUSTMENTS VIEW                             */}
      {/* ========================================================= */}
      {activeTab === 'adjustments' && (
        <div className="space-y-4">
          <Card className="p-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="xs"
                  onClick={handleOpenNewAdjustmentModal}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  New Stock Adjustment
                </Button>

                <select
                  value={adjustmentsStatusFilter}
                  onChange={(e) => {
                    setAdjustmentsStatusFilter(e.target.value as any);
                    setAdjustmentsPage(1);
                  }}
                  className="px-2.5 py-1 text-xs bg-surface-card border border-surface-border rounded text-charcoal-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="POSTED">Posted Only</option>
                  <option value="DRAFT">Draft Only</option>
                  <option value="CANCELLED">Cancelled Only</option>
                </select>

                <Button
                  variant="outline"
                  size="xs"
                  onClick={loadAdjustments}
                  disabled={isLoadingAdjustments}
                >
                  <RefreshCw className={`h-3 w-3 mr-1 ${isLoadingAdjustments ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
              <span className="text-xs text-charcoal-500">
                Auditable physical inventory variance documents
              </span>
            </div>
          </Card>

          <Card
            header={
              <div className="flex items-center justify-between">
                <span className="font-bold text-charcoal-900 text-xs uppercase tracking-wider">
                  Stock Adjustment Documents
                </span>
                <span className="text-[11px] text-charcoal-500">
                  Total {adjustmentsTotal} records
                </span>
              </div>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-surface-border text-charcoal-500 bg-surface-muted">
                    <th className="py-2.5 px-3 font-semibold">Adjustment #</th>
                    <th className="py-2.5 px-3 font-semibold">Warehouse</th>
                    <th className="py-2.5 px-3 font-semibold">Reason</th>
                    <th className="py-2.5 px-3 font-semibold">Status</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Lines</th>
                    <th className="py-2.5 px-3 font-semibold">Posted By</th>
                    <th className="py-2.5 px-3 font-semibold">Date</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {adjustments.map((adj) => (
                    <tr key={adj.id} className="hover:bg-surface-muted/50">
                      <td className="py-2.5 px-3 font-mono font-bold text-charcoal-900">
                        {adj.adjustmentNumber}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-charcoal-800">
                        {adj.warehouse?.name}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-surface-muted border border-surface-border text-charcoal-700">
                          {adj.reason}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <StatusBadge
                          variant={
                            adj.status === 'POSTED'
                              ? 'success'
                              : adj.status === 'DRAFT'
                              ? 'warning'
                              : 'neutral'
                          }
                        >
                          {adj.status}
                        </StatusBadge>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-charcoal-700">
                        {adj.items?.length || 0}
                      </td>
                      <td className="py-2.5 px-3 text-charcoal-600">
                        {adj.postedByUser?.displayName || adj.postedByUser?.username || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-charcoal-600 font-mono text-[11px]">
                        {adj.postedAt ? new Date(adj.postedAt).toLocaleDateString() : new Date(adj.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 px-3 text-right space-x-1">
                        {adj.status === 'POSTED' && (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => handleReverseAdjustment(adj)}
                            title="Reverse adjustment with compensating movements"
                          >
                            <RotateCcw className="h-3 w-3 mr-1 text-red-600" />
                            Reverse
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {adjustments.length === 0 && !isLoadingAdjustments && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-charcoal-400">
                        No stock adjustment records found. Click &quot;New Stock Adjustment&quot; to begin.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {adjustmentsTotal > 20 && (
              <Pagination
                currentPage={adjustmentsPage}
                totalPages={Math.ceil(adjustmentsTotal / 20)}
                totalItems={adjustmentsTotal}
                pageSize={20}
                onPageChange={setAdjustmentsPage}
                showPageSizeSelector={false}
              />
            )}
          </Card>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: FEFO ALLOCATION SIMULATOR VIEW                     */}
      {/* ========================================================= */}
      {activeTab === 'fefo' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card
            className="lg:col-span-1"
            header={
              <span className="font-bold text-charcoal-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-brand-500" />
                <span>FEFO Allocation Parameters</span>
              </span>
            }
          >
            <form onSubmit={handleSimulateFefo} className="p-4 space-y-3.5 text-xs">
              <div>
                <label htmlFor="fefo-product-select" className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Target Product *
                </label>
                <select
                  id="fefo-product-select"
                  value={fefoProductId}
                  onChange={(e) => {
                    setFefoProductId(e.target.value);
                    setFefoResult(null);
                  }}
                  className="w-full px-2.5 py-1.5 text-xs bg-surface-card border border-surface-border rounded text-charcoal-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  required
                >
                  <option value="">Select Pharmaceutical Product...</option>
                  {catalogProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Target Warehouse Location
                </label>
                <select
                  value={selectedWarehouseId}
                  onChange={(e) => {
                    setSelectedWarehouseId(e.target.value);
                    setFefoResult(null);
                  }}
                  className="w-full px-2.5 py-1.5 text-xs bg-surface-card border border-surface-border rounded text-charcoal-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  required
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.code})
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Requested Allocation Quantity *"
                type="number"
                min={1}
                value={fefoQuantity}
                onChange={(e) => setFefoQuantity(parseInt(e.target.value, 10) || 1)}
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="w-full mt-2"
                disabled={isSimulatingFefo}
              >
                <PackageCheck className="h-3.5 w-3.5 mr-1" />
                Run FEFO Allocation Engine
              </Button>
            </form>
          </Card>

          {/* FEFO Allocation Results */}
          <Card
            className="lg:col-span-2"
            header={
              <div className="flex items-center justify-between">
                <span className="font-bold text-charcoal-900 text-xs uppercase tracking-wider">
                  Chronological Batch Pick Plan (Earliest Expiry First)
                </span>
                {fefoResult && (
                  <StatusBadge variant={fefoResult.isFullyAllocated ? 'success' : 'warning'}>
                    {fefoResult.isFullyAllocated ? '100% Fulfilled' : `Shortfall: ${fefoResult.shortfall} Units`}
                  </StatusBadge>
                )}
              </div>
            }
          >
            {fefoResult ? (
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-3 gap-3 p-3 bg-surface-muted border border-surface-border rounded text-xs">
                  <div>
                    <span className="text-charcoal-500 block">Requested Demand:</span>
                    <span className="font-mono font-bold text-charcoal-900 text-sm">
                      {fefoResult.requestedQuantity} units
                    </span>
                  </div>
                  <div>
                    <span className="text-charcoal-500 block">Allocated from Lots:</span>
                    <span className="font-mono font-bold text-green-700 text-sm">
                      {fefoResult.allocatedQuantity} units
                    </span>
                  </div>
                  <div>
                    <span className="text-charcoal-500 block">Stock Shortfall:</span>
                    <span className={`font-mono font-bold text-sm ${fefoResult.shortfall > 0 ? 'text-red-700' : 'text-charcoal-600'}`}>
                      {fefoResult.shortfall} units
                    </span>
                  </div>
                </div>

                <div className="border border-surface-border rounded overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-surface-border text-charcoal-500 bg-surface-muted">
                        <th className="py-2 px-3 font-semibold">Priority</th>
                        <th className="py-2 px-3 font-semibold">Batch / Lot #</th>
                        <th className="py-2 px-3 font-semibold">Expiry Date</th>
                        <th className="py-2 px-3 font-semibold text-right">Available in WH</th>
                        <th className="py-2 px-3 font-semibold text-right">FEFO Allocated</th>
                        <th className="py-2 px-3 font-semibold text-right">Trade Price (TP)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border">
                      {fefoResult.allocations.map((a, idx) => (
                        <tr key={a.batchId} className="hover:bg-surface-muted/50">
                          <td className="py-2.5 px-3 font-bold text-brand-600">
                            #{idx + 1}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-charcoal-900">
                            {a.batchNumber}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-medium text-charcoal-800">
                            {new Date(a.expiryDate).toLocaleDateString()}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-right text-charcoal-600">
                            {a.availableQuantity}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-right text-green-700 text-sm">
                            {a.allocatedQuantity}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-right text-charcoal-800">
                            Rs. {a.tradePrice.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                      {fefoResult.allocations.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-charcoal-400">
                            No active, non-expired batches with positive stock available in this warehouse.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-charcoal-400 text-xs">
                Select product and click &quot;Run FEFO Allocation Engine&quot; to preview lot-level pick sequence.
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ========================================================= */}
      {/* PRODUCT DETAIL & BATCH STOCK DRAWER                       */}
      {/* ========================================================= */}
      {selectedProductStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-surface-card border border-surface-border rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-surface-border bg-surface-muted/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded bg-brand-50 border border-brand-200 text-brand-600">
                  <Boxes className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-charcoal-900">
                      {selectedProductStock.product.name}
                    </h2>
                    <span className="font-mono text-xs px-2 py-0.2 rounded bg-surface-card border border-surface-border font-semibold text-charcoal-700">
                      SKU: {selectedProductStock.product.sku}
                    </span>
                  </div>
                  <p className="text-xs text-charcoal-600 mt-0.5">
                    Generic: <span className="font-medium text-charcoal-800">{selectedProductStock.product.genericName}</span>
                    {selectedProductStock.product.dosageForm ? ` • ${selectedProductStock.product.dosageForm}` : ''}
                    {selectedProductStock.product.unit ? ` • Unit: ${selectedProductStock.product.unit.symbol}` : ''}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedProductStock(null)}
                className="text-charcoal-400 hover:text-charcoal-700 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 flex-1 overflow-y-auto space-y-4">
              <div className="border border-surface-border rounded overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-surface-border text-charcoal-500 bg-surface-muted">
                      <th className="py-2 px-3 font-semibold">Batch / Lot #</th>
                      <th className="py-2 px-3 font-semibold">Expiry Date</th>
                      <th className="py-2 px-3 font-semibold">Batch Status</th>
                      <th className="py-2 px-3 font-semibold text-right">Physical Balance</th>
                      <th className="py-2 px-3 font-semibold text-right">Purchase Cost</th>
                      <th className="py-2 px-3 font-semibold text-right">Trade Price (TP)</th>
                      <th className="py-2 px-3 font-semibold text-right">Stock Valuation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {selectedProductStock.batches.map((b) => (
                      <tr key={b.id} className="hover:bg-surface-muted/50">
                        <td className="py-2.5 px-3 font-mono font-bold text-charcoal-900">
                          {b.batchNumber}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-medium">
                          {new Date(b.expiryDate).toLocaleDateString()}{' '}
                          {b.isExpired && (
                            <span className="text-[10px] text-red-600 font-semibold ml-1">
                              (EXPIRED)
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <StatusBadge
                            variant={
                              b.status === 'ACTIVE'
                                ? 'success'
                                : b.status === 'QUARANTINED'
                                ? 'warning'
                                : 'error'
                            }
                          >
                            {b.status}
                          </StatusBadge>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-right text-charcoal-900">
                          {b.totalQuantity}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-right text-charcoal-700">
                          Rs. {b.purchaseCost.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-right text-brand-600 font-semibold">
                          Rs. {b.tradePrice.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-right text-charcoal-900">
                          Rs. {(b.totalQuantity * b.purchaseCost).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    {selectedProductStock.batches.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-charcoal-400">
                          No batches registered for this product yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* NEW STOCK ADJUSTMENT MODAL                                */}
      {/* ========================================================= */}
      {isAdjModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-surface-card border border-surface-border rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-surface-border">
              <h3 className="font-bold text-sm text-charcoal-900 flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-brand-500" />
                <span>Record Physical Stock Adjustment</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAdjModalOpen(false)}
                className="text-charcoal-400 hover:text-charcoal-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAndPostAdjustment} className="p-4 flex-1 overflow-y-auto space-y-4 text-xs">
              {/* Header Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-surface-muted border border-surface-border rounded">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                    Warehouse Location *
                  </label>
                  <select
                    value={adjWarehouseId}
                    onChange={(e) => {
                      setAdjWarehouseId(e.target.value);
                      setAdjItems([]);
                    }}
                    className="w-full px-2.5 py-1.5 text-xs bg-surface-card border border-surface-border rounded text-charcoal-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    required
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                    Adjustment Reason *
                  </label>
                  <select
                    value={adjReason}
                    onChange={(e) => setAdjReason(e.target.value as StockAdjustmentReason)}
                    className="w-full px-2.5 py-1.5 text-xs bg-surface-card border border-surface-border rounded text-charcoal-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    required
                  >
                    <option value="PHYSICAL_INVENTORY_VARIANCE">Physical Inventory Variance</option>
                    <option value="INITIAL_COUNT">Initial Physical Count</option>
                    <option value="DAMAGED_EXPIRED_DISPOSAL">Damaged / Expired Disposal</option>
                    <option value="PILFERAGE_LOSS">Pilferage / Shrinkage Loss</option>
                    <option value="CORRECTION">Manual Error Correction</option>
                  </select>
                </div>
              </div>

              {/* Add Line Item Box */}
              <div className="p-3 border border-brand-200 bg-brand-50/40 rounded space-y-3">
                <span className="font-bold text-brand-800 text-xs block">
                  Add Stock Count / Variance Line
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-charcoal-700 mb-1">
                      Product
                    </label>
                    <Combobox
                      options={productComboboxOptions}
                      value={selectedAdjProduct?.id || ''}
                      onChange={(val) => handleSelectAdjProduct(val)}
                      onSearchChange={handleProductSearch}
                      placeholder="Select Product..."
                      className="w-full text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-charcoal-700 mb-1">
                      Batch / Lot #
                    </label>
                    <select
                      value={selectedAdjBatch?.id || ''}
                      onChange={(e) => handleSelectAdjBatch(e.target.value)}
                      disabled={!selectedAdjProduct}
                      className="w-full px-2 py-1 text-xs bg-surface-card border border-surface-border rounded text-charcoal-800 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-50"
                    >
                      <option value="">Select Batch...</option>
                      {productBatches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.batchNumber} (Exp: {new Date(b.expiryDate).toLocaleDateString()})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-charcoal-700 mb-1">
                      Current System Qty
                    </label>
                    <input
                      type="text"
                      disabled
                      value={currentBatchBalance}
                      className="w-full px-2 py-1 text-xs bg-surface-muted border border-surface-border rounded font-mono font-bold text-charcoal-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-charcoal-700 mb-1">
                      Counted Quantity
                    </label>
                    <input
                      type="number"
                      value={countedQtyInput}
                      onChange={(e) => setCountedQtyInput(parseInt(e.target.value, 10) || 0)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddAdjustmentLine();
                        }
                      }}
                      disabled={!selectedAdjBatch}
                      className="w-full px-2 py-1 text-xs bg-surface-card border border-surface-border rounded font-mono font-bold text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="text-xs">
                    <span className="text-charcoal-500">Calculated Variance: </span>
                    <span
                      className={`font-mono font-bold ${
                        countedQtyInput - currentBatchBalance > 0
                          ? 'text-green-700'
                          : countedQtyInput - currentBatchBalance < 0
                          ? 'text-red-700'
                          : 'text-charcoal-500'
                      }`}
                    >
                      {countedQtyInput - currentBatchBalance > 0
                        ? `+${countedQtyInput - currentBatchBalance}`
                        : countedQtyInput - currentBatchBalance}{' '}
                      units
                    </span>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={handleAddAdjustmentLine}
                    disabled={!selectedAdjBatch}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Line
                  </Button>
                </div>
              </div>

              {/* Added Lines Table */}
              <div className="border border-surface-border rounded overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-surface-border text-charcoal-500 bg-surface-muted">
                      <th className="py-2 px-3 font-semibold">SKU</th>
                      <th className="py-2 px-3 font-semibold">Product Name</th>
                      <th className="py-2 px-3 font-semibold">Batch #</th>
                      <th className="py-2 px-3 font-semibold text-right">System Qty</th>
                      <th className="py-2 px-3 font-semibold text-right">Counted Qty</th>
                      <th className="py-2 px-3 font-semibold text-right">Variance</th>
                      <th className="py-2 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {adjItems.map((item, idx) => (
                      <tr key={item.batchId}>
                        <td className="py-2 px-3 font-mono font-bold text-charcoal-800">
                          {item.sku}
                        </td>
                        <td className="py-2 px-3 text-charcoal-900 font-medium">
                          {item.productName}
                        </td>
                        <td className="py-2 px-3 font-mono font-bold text-charcoal-800">
                          {item.batchNumber}
                        </td>
                        <td className="py-2 px-3 font-mono text-right text-charcoal-600">
                          {item.currentQuantity}
                        </td>
                        <td className="py-2 px-3 font-mono font-bold text-right text-charcoal-900">
                          {item.countedQuantity}
                        </td>
                        <td className="py-2 px-3 font-mono font-bold text-right">
                          <span className={item.varianceQuantity > 0 ? 'text-green-700' : 'text-red-700'}>
                            {item.varianceQuantity > 0 ? `+${item.varianceQuantity}` : item.varianceQuantity}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveAdjustmentLine(idx)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {adjItems.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-4 text-center text-charcoal-400">
                          No lines added yet. Pick product & batch above to calculate variance.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <Input
                label="Adjustment Document Notes / Reason Details"
                value={adjNotes}
                onChange={(e) => setAdjNotes(e.target.value)}
                placeholder="Optional audit notes regarding the count variance"
              />

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAdjModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSavingAdjustment || adjItems.length === 0}
                >
                  Commit & Post Adjustment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* OPENING BALANCE SETUP MODAL                               */}
      {/* ========================================================= */}
      {isOpeningModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-surface-card border border-surface-border rounded-lg shadow-xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border pb-2.5">
              <h3 className="font-bold text-sm text-charcoal-900 flex items-center gap-2">
                <Plus className="h-4 w-4 text-brand-500" />
                <span>Initialize Batch Opening Balance</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsOpeningModalOpen(false)}
                className="text-charcoal-400 hover:text-charcoal-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveOpeningBalance} className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Warehouse Location *
                </label>
                <select
                  value={openingWarehouseId}
                  onChange={(e) => setOpeningWarehouseId(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-surface-card border border-surface-border rounded text-charcoal-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  required
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Product SKU *
                </label>
                <Combobox
                  options={productComboboxOptions}
                  value={openingProductId}
                  onChange={(val) => handleSelectOpeningProduct(val)}
                  onSearchChange={handleProductSearch}
                  placeholder="Search and choose product..."
                  className="w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Batch / Lot *
                </label>
                <select
                  value={openingBatchId}
                  onChange={(e) => {
                    setOpeningBatchId(e.target.value);
                    const b = openingProductBatches.find((batch) => batch.id === e.target.value);
                    if (b) setOpeningUnitCost(Number(b.purchaseCost));
                  }}
                  disabled={!openingProductId}
                  className="w-full px-2.5 py-1.5 text-xs bg-surface-card border border-surface-border rounded text-charcoal-800 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-50"
                  required
                >
                  <option value="">Select Batch...</option>
                  {openingProductBatches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.batchNumber} (Exp: {new Date(b.expiryDate).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Initial Quantity *"
                  type="number"
                  min={1}
                  value={openingQuantity}
                  onChange={(e) => setOpeningQuantity(parseInt(e.target.value, 10) || 1)}
                  required
                />

                <Input
                  label="Unit Cost (Rs)"
                  type="number"
                  step="0.01"
                  value={openingUnitCost}
                  onChange={(e) => setOpeningUnitCost(parseFloat(e.target.value) || 0)}
                />
              </div>

              <Input
                label="Setup Notes"
                value={openingNotes}
                onChange={(e) => setOpeningNotes(e.target.value)}
              />

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsOpeningModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSavingOpening}
                >
                  Commit Opening Balance
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shared Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        description={confirmConfig.description}
        confirmText={confirmConfig.confirmText}
        variant={confirmConfig.variant || 'danger'}
      />
    </div>
  );
};
