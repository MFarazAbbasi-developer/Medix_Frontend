import React, { useState, useEffect, useCallback } from 'react';
import {
  ShoppingCart,
  Search,
  RefreshCw,
  Plus,
  FileText,
  PackageCheck,
  CheckCircle2,
  AlertCircle,
  X,
  Trash2,
  Send,
  Ban,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import {
  getPurchaseOrders,
  getGoodsReceiveNotes,
  createPurchaseOrder,
  issuePurchaseOrder,
  cancelPurchaseOrder,
  createGoodsReceiveNote,
  postGoodsReceiveNote,
  deleteDraftGoodsReceiveNote,
  getGoodsReceiveNoteById,
  getPurchaseOrderById,
  getSuppliers,
  warehousesApi,
  productsApi,
  Supplier,
  Warehouse,
  Product,
  PurchaseOrder,
  GoodsReceiveNote,
  CreatePoPayload,
  CreateGrnPayload,
} from '../api';

export const PurchasingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'grn' | 'orders'>('grn');

  // Master lists
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Tab 1: GRN State
  const [grnList, setGrnList] = useState<GoodsReceiveNote[]>([]);
  const [grnLoading, setGrnLoading] = useState<boolean>(false);
  const [grnSearch, setGrnSearch] = useState<string>('');
  const [grnStatusFilter, setGrnStatusFilter] = useState<string>('ALL');

  // Tab 2: PO State
  const [poList, setPoList] = useState<PurchaseOrder[]>([]);
  const [poLoading, setPoLoading] = useState<boolean>(false);
  const [poSearch, setPoSearch] = useState<string>('');
  const [poStatusFilter, setPoStatusFilter] = useState<string>('ALL');

  // Feedback Toast
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4500);
  };

  // --- Modals State ---
  const [isNewGrnOpen, setIsNewGrnOpen] = useState<boolean>(false);
  const [isNewPoOpen, setIsNewPoOpen] = useState<boolean>(false);
  const [viewingGrn, setViewingGrn] = useState<GoodsReceiveNote | null>(null);
  const [viewingPo, setViewingPo] = useState<PurchaseOrder | null>(null);
  const [isPosting, setIsPosting] = useState<boolean>(false);

  // Load master dropdown data
  const loadMasterData = useCallback(async () => {
    try {
      const [supRes, whData, prodRes] = await Promise.all([
        getSuppliers({ isActive: true, limit: 200 }),
        warehousesApi.getWarehouses(),
        productsApi.getProducts({ limit: 500, isActive: 'true' }),
      ]);
      setSuppliers(supRes?.items || []);
      setWarehouses(whData || []);
      setProducts(prodRes.items || []);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadMasterData();
  }, [loadMasterData]);

  // Load GRNs
  const loadGrnList = useCallback(async () => {
    setGrnLoading(true);
    try {
      const res = await getGoodsReceiveNotes({
        search: grnSearch.trim() || undefined,
        status: grnStatusFilter === 'ALL' ? undefined : (grnStatusFilter as any),
        limit: 100,
      });
      setGrnList(res?.items || []);
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || err.message || 'Failed to load GRN records');
    } finally {
      setGrnLoading(false);
    }
  }, [grnSearch, grnStatusFilter]);

  // Load POs
  const loadPoList = useCallback(async () => {
    setPoLoading(true);
    try {
      const res = await getPurchaseOrders({
        search: poSearch.trim() || undefined,
        status: poStatusFilter === 'ALL' ? undefined : (poStatusFilter as any),
        limit: 100,
      });
      setPoList(res?.items || []);
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || err.message || 'Failed to load Purchase Orders');
    } finally {
      setPoLoading(false);
    }
  }, [poSearch, poStatusFilter]);

  useEffect(() => {
    if (activeTab === 'grn') {
      loadGrnList();
    } else {
      loadPoList();
    }
  }, [activeTab, loadGrnList, loadPoList]);

  // ----------------------------------------------------
  // GRN FORM STATE & LOGIC
  // ----------------------------------------------------
  interface GrnFormLine {
    productId: string;
    poItemId?: string;
    batchNumber: string;
    mfgDate: string;
    expiryDate: string;
    receivedQuantity: number;
    bonusQuantity: number;
    unitCost: number;
    tradePrice: number;
    retailPrice: number;
    discountPercentage: number;
    taxPercentage: number;
  }

  const [grnHeader, setGrnHeader] = useState<{
    branchId: string;
    warehouseId: string;
    supplierId: string;
    purchaseOrderId: string;
    supplierInvoiceNumber: string;
    supplierInvoiceDate: string;
    receivedDate: string;
    notes: string;
  }>({
    branchId: '',
    warehouseId: '',
    supplierId: '',
    purchaseOrderId: '',
    supplierInvoiceNumber: '',
    supplierInvoiceDate: '',
    receivedDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [grnLines, setGrnLines] = useState<GrnFormLine[]>([]);

  const createEmptyGrnLine = (): GrnFormLine => ({
    productId: products[0]?.id || '',
    batchNumber: `BN-${Date.now().toString().slice(-5)}`,
    mfgDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 730 * 86400000).toISOString().split('T')[0],
    receivedQuantity: 10,
    bonusQuantity: 0,
    unitCost: 100,
    tradePrice: 115,
    retailPrice: 130,
    discountPercentage: 0,
    taxPercentage: 0,
  });

  // Open New GRN
  const openNewGrn = (fromPo?: PurchaseOrder) => {
    const defaultWh = warehouses.find((w) => w.isDefault) || warehouses[0];
    const defaultBranchId = defaultWh?.branchId || '';

    if (fromPo) {
      setGrnHeader({
        branchId: fromPo.branchId,
        warehouseId: defaultWh?.id || '',
        supplierId: fromPo.supplierId,
        purchaseOrderId: fromPo.id,
        supplierInvoiceNumber: '',
        supplierInvoiceDate: '',
        receivedDate: new Date().toISOString().split('T')[0],
        notes: `Receiving against PO ${fromPo.poNumber}`,
      });

      // Populate lines from unreceived PO items
      const poLines: GrnFormLine[] = (fromPo.items || [])
        .filter((item) => item.orderedQuantity > item.receivedQuantity)
        .map((item) => {
          const remaining = item.orderedQuantity - item.receivedQuantity;
          const cost = Number(item.unitCost || 0);
          return {
            productId: item.productId,
            poItemId: item.id,
            batchNumber: `BN-${Date.now().toString().slice(-5)}`,
            mfgDate: new Date().toISOString().split('T')[0],
            expiryDate: new Date(Date.now() + 730 * 86400000).toISOString().split('T')[0],
            receivedQuantity: remaining,
            bonusQuantity: 0,
            unitCost: cost,
            tradePrice: Math.round(cost * 1.15),
            retailPrice: Math.round(cost * 1.25),
            discountPercentage: Number(item.discountPercentage || 0),
            taxPercentage: Number(item.taxPercentage || 0),
          };
        });

      setGrnLines(poLines.length > 0 ? poLines : [createEmptyGrnLine()]);
    } else {
      setGrnHeader({
        branchId: defaultBranchId,
        warehouseId: defaultWh?.id || '',
        supplierId: suppliers[0]?.id || '',
        purchaseOrderId: '',
        supplierInvoiceNumber: '',
        supplierInvoiceDate: '',
        receivedDate: new Date().toISOString().split('T')[0],
        notes: '',
      });
      setGrnLines([createEmptyGrnLine()]);
    }

    setIsNewGrnOpen(true);
  };

  const addGrnLine = () => {
    setGrnLines([...grnLines, createEmptyGrnLine()]);
  };

  const removeGrnLine = (index: number) => {
    if (grnLines.length <= 1) return;
    setGrnLines(grnLines.filter((_, i) => i !== index));
  };

  const updateGrnLine = (index: number, field: keyof GrnFormLine, value: any) => {
    const updated = [...grnLines];
    updated[index] = { ...updated[index], [field]: value };
    setGrnLines(updated);
  };

  // Calculate live GRN summary
  const computeGrnTotals = () => {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    for (const line of grnLines) {
      const gross = line.receivedQuantity * line.unitCost;
      const discount = gross * (line.discountPercentage / 100);
      const taxable = gross - discount;
      const tax = taxable * (line.taxPercentage / 100);

      subtotal += gross;
      totalDiscount += discount;
      totalTax += tax;
    }

    const netPayable = subtotal - totalDiscount + totalTax;
    return { subtotal, totalDiscount, totalTax, netPayable };
  };

  const grnTotals = computeGrnTotals();

  // Save or Post GRN
  const handleSaveGrn = async (andPost = false) => {
    if (!grnHeader.warehouseId || !grnHeader.supplierId) {
      showFeedback('error', 'Warehouse and Supplier are required');
      return;
    }

    if (grnLines.length === 0) {
      showFeedback('error', 'Add at least one line item');
      return;
    }

    for (const line of grnLines) {
      if (!line.productId) {
        showFeedback('error', 'All rows must have a valid product selected');
        return;
      }
      if (!line.batchNumber.trim()) {
        showFeedback('error', 'Batch number is required on all items');
        return;
      }
      if (new Date(line.expiryDate) <= new Date()) {
        showFeedback('error', `Batch ${line.batchNumber} expiry must be in the future`);
        return;
      }
    }

    const selectedWh = warehouses.find((w) => w.id === grnHeader.warehouseId);
    const branchId = selectedWh?.branchId || grnHeader.branchId;

    const payload: CreateGrnPayload = {
      branchId,
      warehouseId: grnHeader.warehouseId,
      supplierId: grnHeader.supplierId,
      purchaseOrderId: grnHeader.purchaseOrderId || undefined,
      supplierInvoiceNumber: grnHeader.supplierInvoiceNumber || undefined,
      supplierInvoiceDate: grnHeader.supplierInvoiceDate || undefined,
      receivedDate: grnHeader.receivedDate || undefined,
      notes: grnHeader.notes || undefined,
      items: grnLines.map((line) => ({
        productId: line.productId,
        poItemId: line.poItemId || undefined,
        batchNumber: line.batchNumber,
        mfgDate: line.mfgDate || undefined,
        expiryDate: line.expiryDate,
        receivedQuantity: Number(line.receivedQuantity) || 1,
        bonusQuantity: Number(line.bonusQuantity) || 0,
        unitCost: Number(line.unitCost) || 0,
        tradePrice: Number(line.tradePrice) || 0,
        retailPrice: Number(line.retailPrice) || 0,
        discountPercentage: Number(line.discountPercentage) || 0,
        taxPercentage: Number(line.taxPercentage) || 0,
      })),
    };

    setIsPosting(true);
    try {
      const createdRes = await createGoodsReceiveNote(payload);
      const grnId = createdRes?.id;

      if (andPost && grnId) {
        await postGoodsReceiveNote(grnId);
        showFeedback(
          'success',
          `GRN created & posted! Physical stock received and vendor ledger credited.`,
        );
      } else {
        showFeedback('success', `Draft GRN saved successfully`);
      }

      setIsNewGrnOpen(false);
      loadGrnList();
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || err.message || 'Failed to save GRN');
    } finally {
      setIsPosting(false);
    }
  };

  // Direct Post Draft GRN
  const handlePostExistingGrn = async (grn: GoodsReceiveNote) => {
    if (!window.confirm(`Post GRN ${grn.grnNumber} now? This will immediately receive ${grn._count?.items || 0} items into stock and update supplier payable.`)) {
      return;
    }

    setIsPosting(true);
    try {
      const res = await postGoodsReceiveNote(grn.id);
      showFeedback('success', `GRN ${res?.grnNumber} posted successfully into stock ledger!`);
      loadGrnList();
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || err.message || 'Failed to post GRN');
    } finally {
      setIsPosting(false);
    }
  };

  // Discard Draft GRN
  const handleDiscardGrn = async (grn: GoodsReceiveNote) => {
    if (!window.confirm(`Discard draft GRN ${grn.grnNumber}?`)) return;

    try {
      await deleteDraftGoodsReceiveNote(grn.id);
      showFeedback('success', 'Draft GRN discarded');
      loadGrnList();
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || err.message || 'Failed to discard GRN');
    }
  };

  // ----------------------------------------------------
  // PURCHASE ORDER CREATION & ACTIONS
  // ----------------------------------------------------
  interface PoFormLine {
    productId: string;
    orderedQuantity: number;
    unitCost: number;
    discountPercentage: number;
    taxPercentage: number;
  }

  const [poHeader, setPoHeader] = useState<{
    branchId: string;
    supplierId: string;
    orderDate: string;
    expectedDate: string;
    notes: string;
  }>({
    branchId: '',
    supplierId: '',
    orderDate: new Date().toISOString().split('T')[0],
    expectedDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    notes: '',
  });

  const [poLines, setPoLines] = useState<PoFormLine[]>([]);

  const openNewPo = () => {
    const defaultWh = warehouses.find((w) => w.isDefault) || warehouses[0];
    setPoHeader({
      branchId: defaultWh?.branchId || '',
      supplierId: suppliers[0]?.id || '',
      orderDate: new Date().toISOString().split('T')[0],
      expectedDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      notes: '',
    });
    setPoLines([
      {
        productId: products[0]?.id || '',
        orderedQuantity: 50,
        unitCost: 100,
        discountPercentage: 0,
        taxPercentage: 0,
      },
    ]);
    setIsNewPoOpen(true);
  };

  const handleSavePo = async () => {
    if (!poHeader.supplierId || !poHeader.branchId) {
      showFeedback('error', 'Supplier and Branch are required');
      return;
    }

    const payload: CreatePoPayload = {
      branchId: poHeader.branchId,
      supplierId: poHeader.supplierId,
      orderDate: poHeader.orderDate || undefined,
      expectedDate: poHeader.expectedDate || undefined,
      notes: poHeader.notes || undefined,
      items: poLines.map((line) => ({
        productId: line.productId,
        orderedQuantity: Number(line.orderedQuantity) || 1,
        unitCost: Number(line.unitCost) || 0,
        discountPercentage: Number(line.discountPercentage) || 0,
        taxPercentage: Number(line.taxPercentage) || 0,
      })),
    };

    try {
      await createPurchaseOrder(payload);
      showFeedback('success', 'Purchase Order generated successfully');
      setIsNewPoOpen(false);
      loadPoList();
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || err.message || 'Failed to create PO');
    }
  };

  const handleIssuePo = async (po: PurchaseOrder) => {
    try {
      await issuePurchaseOrder(po.id);
      showFeedback('success', `Purchase Order ${po.poNumber} issued`);
      loadPoList();
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || err.message || 'Failed to issue PO');
    }
  };

  const handleCancelPo = async (po: PurchaseOrder) => {
    if (!window.confirm(`Cancel Purchase Order ${po.poNumber}?`)) return;
    try {
      await cancelPurchaseOrder(po.id);
      showFeedback('success', `Purchase Order ${po.poNumber} cancelled`);
      loadPoList();
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || err.message || 'Failed to cancel PO');
    }
  };

  // View full GRN detail modal
  const handleViewGrn = async (id: string) => {
    try {
      const res = await getGoodsReceiveNoteById(id);
      setViewingGrn(res);
    } catch (err: any) {
      showFeedback('error', 'Failed to load GRN document');
    }
  };

  // View full PO detail modal
  const handleViewPo = async (id: string) => {
    try {
      const res = await getPurchaseOrderById(id);
      setViewingPo(res);
    } catch (err: any) {
      showFeedback('error', 'Failed to load PO document');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border text-sm font-medium transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-600" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-brand-600" />
            <h1 className="text-xl font-bold text-charcoal-900">Purchasing & Goods Receiving</h1>
          </div>
          <p className="text-xs text-charcoal-500 mt-1">
            Complete pharma procurement: Purchase Orders → Physical GRN Receipts → Batch & Stock Realization → Supplier Ledger
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={activeTab === 'grn' ? loadGrnList : loadPoList}
            disabled={grnLoading || poLoading}
            className="flex items-center gap-1.5 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${grnLoading || poLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>

          {activeTab === 'grn' ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => openNewGrn()}
              className="flex items-center gap-1.5 text-xs bg-brand-600 hover:bg-brand-700 text-white"
            >
              <PackageCheck className="h-3.5 w-3.5" />
              <span>Receive Goods (GRN)</span>
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={openNewPo}
              className="flex items-center gap-1.5 text-xs bg-brand-600 hover:bg-brand-700 text-white"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Purchase Order</span>
            </Button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-surface-border gap-6">
        <button
          onClick={() => setActiveTab('grn')}
          className={`pb-3 text-xs font-semibold flex items-center gap-2 transition-all relative ${
            activeTab === 'grn'
              ? 'text-brand-600 border-b-2 border-brand-600'
              : 'text-charcoal-500 hover:text-charcoal-800'
          }`}
        >
          <PackageCheck className="h-4 w-4" />
          <span>Goods Receive Notes (GRN)</span>
          <span className="bg-brand-50 text-brand-700 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
            {grnList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 text-xs font-semibold flex items-center gap-2 transition-all relative ${
            activeTab === 'orders'
              ? 'text-brand-600 border-b-2 border-brand-600'
              : 'text-charcoal-500 hover:text-charcoal-800'
          }`}
        >
          <ShoppingCart className="h-4 w-4" />
          <span>Purchase Orders</span>
          <span className="bg-charcoal-100 text-charcoal-700 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
            {poList.length}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: GOODS RECEIVE NOTES (GRN) */}
      {/* ========================================================================= */}
      {activeTab === 'grn' && (
        <div className="space-y-4">
          {/* GRN Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card className="p-3.5 bg-white border border-surface-border">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-500">
                Total Receiving Bills
              </p>
              <p className="text-2xl font-bold text-charcoal-900 mt-1">
                {grnList.length}
              </p>
            </Card>

            <Card className="p-3.5 bg-white border border-surface-border">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-500">
                Posted (Stock Received)
              </p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                {grnList.filter((g) => g.status === 'POSTED').length}
              </p>
            </Card>

            <Card className="p-3.5 bg-white border border-surface-border">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-500">
                Pending Drafts
              </p>
              <p className="text-2xl font-bold text-amber-600 mt-1">
                {grnList.filter((g) => g.status === 'DRAFT').length}
              </p>
            </Card>

            <Card className="p-3.5 bg-white border border-surface-border">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-500">
                Total Inflow Value
              </p>
              <p className="text-2xl font-bold text-brand-600 mt-1">
                PKR{' '}
                {grnList
                  .filter((g) => g.status === 'POSTED')
                  .reduce((sum, g) => sum + Number(g.netTotal || 0), 0)
                  .toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </Card>
          </div>

          {/* Filters Bar */}
          <Card className="p-3 bg-white border border-surface-border flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="w-full sm:w-80 relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-charcoal-400" />
              <Input
                placeholder="Search GRN #, vendor invoice #, supplier..."
                value={grnSearch}
                onChange={(e) => setGrnSearch(e.target.value)}
                className="pl-8 text-xs h-9"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-charcoal-500 font-medium">Status:</span>
              <select
                value={grnStatusFilter}
                onChange={(e) => setGrnStatusFilter(e.target.value)}
                className="h-9 px-3 text-xs border border-surface-border rounded bg-white text-charcoal-700 focus:outline-none focus:border-brand-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="POSTED">Posted (In Inventory)</option>
                <option value="DRAFT">Draft</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </Card>

          {/* GRN Table */}
          <Card className="overflow-hidden bg-white border border-surface-border shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-surface-muted/60 border-b border-surface-border text-charcoal-600 font-semibold">
                    <th className="py-2.5 px-3">GRN Number</th>
                    <th className="py-2.5 px-3">Supplier & Invoice</th>
                    <th className="py-2.5 px-3">Warehouse</th>
                    <th className="py-2.5 px-3">Received Date</th>
                    <th className="py-2.5 px-3 text-center">Items</th>
                    <th className="py-2.5 px-3 text-right">Net Billed (PKR)</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {grnLoading ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-charcoal-400">
                        <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-brand-600" />
                        Loading GRN records...
                      </td>
                    </tr>
                  ) : grnList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-charcoal-500">
                        No Goods Receive Notes found. Click "Receive Goods (GRN)" to create one.
                      </td>
                    </tr>
                  ) : (
                    grnList.map((grn) => (
                      <tr key={grn.id} className="hover:bg-surface-muted/40 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-medium text-charcoal-900">
                          {grn.grnNumber}
                          {grn.purchaseOrder && (
                            <div className="text-[10px] text-brand-600 font-normal">
                              PO: {grn.purchaseOrder.poNumber}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-charcoal-900">
                            {grn.supplier?.name || '-'}
                          </div>
                          {grn.supplierInvoiceNumber && (
                            <div className="text-[10px] text-charcoal-400">
                              Bill: {grn.supplierInvoiceNumber}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-charcoal-600">
                          {grn.warehouse?.name || '-'}
                        </td>
                        <td className="py-2.5 px-3 text-charcoal-600">
                          {new Date(grn.receivedDate).toLocaleDateString()}
                        </td>
                        <td className="py-2.5 px-3 text-center font-medium">
                          {grn._count?.items || 0}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-charcoal-900">
                          PKR {Number(grn.netTotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <StatusBadge
                            variant={
                              grn.status === 'POSTED'
                                ? 'success'
                                : grn.status === 'DRAFT'
                                ? 'warning'
                                : 'neutral'
                            }
                          >
                            {grn.status}
                          </StatusBadge>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleViewGrn(grn.id)}
                              title="View / Print GRN Document"
                              className="p-1 text-charcoal-600 hover:bg-surface-muted rounded transition-colors"
                            >
                              <FileText className="h-3.5 w-3.5" />
                            </button>
                            {grn.status === 'DRAFT' && (
                              <>
                                <button
                                  onClick={() => handlePostExistingGrn(grn)}
                                  title="Post GRN & Receive Stock"
                                  className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition-colors font-semibold"
                                >
                                  <PackageCheck className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDiscardGrn(grn)}
                                  title="Discard Draft"
                                  className="p-1 text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PURCHASE ORDERS (PO) */}
      {/* ========================================================================= */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {/* PO Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card className="p-3.5 bg-white border border-surface-border">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-500">
                Total Purchase Orders
              </p>
              <p className="text-2xl font-bold text-charcoal-900 mt-1">
                {poList.length}
              </p>
            </Card>

            <Card className="p-3.5 bg-white border border-surface-border">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-500">
                Issued / In Transit
              </p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {poList.filter((p) => p.status === 'ISSUED').length}
              </p>
            </Card>

            <Card className="p-3.5 bg-white border border-surface-border">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-500">
                Fully Received
              </p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                {poList.filter((p) => p.status === 'RECEIVED').length}
              </p>
            </Card>

            <Card className="p-3.5 bg-white border border-surface-border">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-500">
                Open Requisition Value
              </p>
              <p className="text-2xl font-bold text-brand-600 mt-1">
                PKR{' '}
                {poList
                  .filter((p) => p.status === 'ISSUED' || p.status === 'PARTIALLY_RECEIVED')
                  .reduce((sum, p) => sum + Number(p.netTotal || 0), 0)
                  .toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </Card>
          </div>

          {/* Filters Bar */}
          <Card className="p-3 bg-white border border-surface-border flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="w-full sm:w-80 relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-charcoal-400" />
              <Input
                placeholder="Search PO #, supplier name, code..."
                value={poSearch}
                onChange={(e) => setPoSearch(e.target.value)}
                className="pl-8 text-xs h-9"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-charcoal-500 font-medium">Status:</span>
              <select
                value={poStatusFilter}
                onChange={(e) => setPoStatusFilter(e.target.value)}
                className="h-9 px-3 text-xs border border-surface-border rounded bg-white text-charcoal-700 focus:outline-none focus:border-brand-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="ISSUED">Issued</option>
                <option value="PARTIALLY_RECEIVED">Partially Received</option>
                <option value="RECEIVED">Fully Received</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </Card>

          {/* PO Table */}
          <Card className="overflow-hidden bg-white border border-surface-border shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-surface-muted/60 border-b border-surface-border text-charcoal-600 font-semibold">
                    <th className="py-2.5 px-3">PO Number</th>
                    <th className="py-2.5 px-3">Supplier Name</th>
                    <th className="py-2.5 px-3">Order Date</th>
                    <th className="py-2.5 px-3">Expected Date</th>
                    <th className="py-2.5 px-3 text-center">Items</th>
                    <th className="py-2.5 px-3 text-right">Net Value (PKR)</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {poLoading ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-charcoal-400">
                        <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-brand-600" />
                        Loading Purchase Orders...
                      </td>
                    </tr>
                  ) : poList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-charcoal-500">
                        No Purchase Orders found. Click "New Purchase Order" to create one.
                      </td>
                    </tr>
                  ) : (
                    poList.map((po) => (
                      <tr key={po.id} className="hover:bg-surface-muted/40 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-medium text-charcoal-900">
                          {po.poNumber}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-charcoal-900">
                          {po.supplier?.name || '-'}
                        </td>
                        <td className="py-2.5 px-3 text-charcoal-600">
                          {new Date(po.orderDate).toLocaleDateString()}
                        </td>
                        <td className="py-2.5 px-3 text-charcoal-600">
                          {po.expectedDate ? new Date(po.expectedDate).toLocaleDateString() : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-center font-medium">
                          {po._count?.items || 0}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-charcoal-900">
                          PKR {Number(po.netTotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <StatusBadge
                            variant={
                              po.status === 'RECEIVED'
                                ? 'success'
                                : po.status === 'PARTIALLY_RECEIVED' || po.status === 'ISSUED'
                                ? 'info'
                                : po.status === 'DRAFT'
                                ? 'warning'
                                : 'neutral'
                            }
                          >
                            {po.status}
                          </StatusBadge>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleViewPo(po.id)}
                              title="View / Print PO"
                              className="p-1 text-charcoal-600 hover:bg-surface-muted rounded transition-colors"
                            >
                              <FileText className="h-3.5 w-3.5" />
                            </button>
                            {po.status === 'DRAFT' && (
                              <button
                                onClick={() => handleIssuePo(po)}
                                title="Issue PO to Vendor"
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              >
                                <Send className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {(po.status === 'ISSUED' || po.status === 'PARTIALLY_RECEIVED') && (
                              <button
                                onClick={() => openNewGrn(po)}
                                title="Receive via GRN"
                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                              >
                                <PackageCheck className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {po.status !== 'RECEIVED' && po.status !== 'CANCELLED' && (
                              <button
                                onClick={() => handleCancelPo(po)}
                                title="Cancel PO"
                                className="p-1 text-rose-600 hover:bg-rose-50 rounded transition-colors"
                              >
                                <Ban className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NEW GRN RECEIVING WORKSPACE */}
      {/* ========================================================================= */}
      {isNewGrnOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3">
          <Card className="w-full max-w-6xl bg-white border border-surface-border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-surface-border flex items-center justify-between bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <PackageCheck className="h-5 w-5 text-brand-600" />
                <div>
                  <h2 className="text-sm font-bold text-charcoal-900">
                    Goods Receiving Note (GRN) Entry Dock
                  </h2>
                  <p className="text-[11px] text-charcoal-500">
                    Capture batches, regulatory expiry, landed purchase cost, and TP/MRP
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsNewGrnOpen(false)}
                className="text-charcoal-400 hover:text-charcoal-700 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Document Header Controls */}
            <div className="p-4 border-b border-surface-border bg-surface-card grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">
                  Receiving Warehouse *
                </label>
                <select
                  value={grnHeader.warehouseId}
                  onChange={(e) => {
                    const wh = warehouses.find((w) => w.id === e.target.value);
                    setGrnHeader({
                      ...grnHeader,
                      warehouseId: e.target.value,
                      branchId: wh?.branchId || grnHeader.branchId,
                    });
                  }}
                  className="w-full h-8 px-2 border border-surface-border rounded bg-white text-charcoal-800"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">
                  Supplier / Vendor *
                </label>
                <select
                  value={grnHeader.supplierId}
                  onChange={(e) => setGrnHeader({ ...grnHeader, supplierId: e.target.value })}
                  className="w-full h-8 px-2 border border-surface-border rounded bg-white text-charcoal-800"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">
                  Supplier Invoice / Bill #
                </label>
                <Input
                  value={grnHeader.supplierInvoiceNumber}
                  onChange={(e) => setGrnHeader({ ...grnHeader, supplierInvoiceNumber: e.target.value })}
                  placeholder="e.g. INV-88912"
                  className="h-8 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">
                  Received Date
                </label>
                <Input
                  type="date"
                  value={grnHeader.receivedDate}
                  onChange={(e) => setGrnHeader({ ...grnHeader, receivedDate: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            {/* Line Items Grid */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-charcoal-700">
                  Received Pharma Batches ({grnLines.length} line items)
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={addGrnLine}
                  className="h-7 text-xs flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  <span>Add Line</span>
                </Button>
              </div>

              <div className="overflow-x-auto border border-surface-border rounded">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-surface-muted/70 text-charcoal-700 font-semibold border-b border-surface-border">
                      <th className="py-2 px-2.5 w-60">Product SKU / Brand</th>
                      <th className="py-2 px-2 w-28">Batch No.</th>
                      <th className="py-2 px-2 w-28">Expiry Date</th>
                      <th className="py-2 px-2 w-20 text-right">Billed Qty</th>
                      <th className="py-2 px-2 w-16 text-right" title="Free / Scheme Units">
                        Bonus
                      </th>
                      <th className="py-2 px-2 w-24 text-right">Cost (PKR)</th>
                      <th className="py-2 px-2 w-24 text-right">TP (PKR)</th>
                      <th className="py-2 px-2 w-24 text-right">MRP (PKR)</th>
                      <th className="py-2 px-2 w-16 text-right">Disc %</th>
                      <th className="py-2 px-2 w-16 text-right">Tax %</th>
                      <th className="py-2 px-2.5 w-28 text-right">Line Total</th>
                      <th className="py-2 px-2 w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {grnLines.map((line, idx) => {
                      const gross = line.receivedQuantity * line.unitCost;
                      const lineTotal = gross * (1 - line.discountPercentage / 100) * (1 + line.taxPercentage / 100);

                      return (
                        <tr key={idx} className="hover:bg-surface-muted/30">
                          {/* Product */}
                          <td className="py-1.5 px-2">
                            <select
                              value={line.productId}
                              onChange={(e) => updateGrnLine(idx, 'productId', e.target.value)}
                              className="w-full h-7 px-1.5 text-xs border border-surface-border rounded bg-white text-charcoal-900 font-medium"
                            >
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({p.sku})
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* Batch No */}
                          <td className="py-1.5 px-2">
                            <input
                              type="text"
                              value={line.batchNumber}
                              onChange={(e) => updateGrnLine(idx, 'batchNumber', e.target.value)}
                              className="w-full h-7 px-1.5 text-xs font-mono border border-surface-border rounded bg-white"
                              placeholder="Batch #"
                            />
                          </td>

                          {/* Expiry Date */}
                          <td className="py-1.5 px-2">
                            <input
                              type="date"
                              value={line.expiryDate}
                              onChange={(e) => updateGrnLine(idx, 'expiryDate', e.target.value)}
                              className="w-full h-7 px-1 text-xs border border-surface-border rounded bg-white"
                            />
                          </td>

                          {/* Billed Qty */}
                          <td className="py-1.5 px-2">
                            <input
                              type="number"
                              min="1"
                              value={line.receivedQuantity}
                              onChange={(e) => updateGrnLine(idx, 'receivedQuantity', parseFloat(e.target.value) || 0)}
                              className="w-full h-7 px-1 text-xs text-right font-semibold border border-surface-border rounded bg-white"
                            />
                          </td>

                          {/* Bonus Qty */}
                          <td className="py-1.5 px-2">
                            <input
                              type="number"
                              min="0"
                              value={line.bonusQuantity}
                              onChange={(e) => updateGrnLine(idx, 'bonusQuantity', parseFloat(e.target.value) || 0)}
                              className="w-full h-7 px-1 text-xs text-right text-emerald-700 font-semibold border border-surface-border rounded bg-emerald-50/50"
                              title="Free scheme units (0 billed cost, added to physical inventory)"
                            />
                          </td>

                          {/* Purchase Cost */}
                          <td className="py-1.5 px-2">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={line.unitCost}
                              onChange={(e) => updateGrnLine(idx, 'unitCost', parseFloat(e.target.value) || 0)}
                              className="w-full h-7 px-1 text-xs text-right border border-surface-border rounded bg-white"
                            />
                          </td>

                          {/* Trade Price (TP) */}
                          <td className="py-1.5 px-2">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={line.tradePrice}
                              onChange={(e) => updateGrnLine(idx, 'tradePrice', parseFloat(e.target.value) || 0)}
                              className="w-full h-7 px-1 text-xs text-right border border-surface-border rounded bg-white text-charcoal-700"
                            />
                          </td>

                          {/* Retail Price (MRP) */}
                          <td className="py-1.5 px-2">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={line.retailPrice}
                              onChange={(e) => updateGrnLine(idx, 'retailPrice', parseFloat(e.target.value) || 0)}
                              className="w-full h-7 px-1 text-xs text-right border border-surface-border rounded bg-white text-charcoal-700"
                            />
                          </td>

                          {/* Discount % */}
                          <td className="py-1.5 px-2">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={line.discountPercentage}
                              onChange={(e) => updateGrnLine(idx, 'discountPercentage', parseFloat(e.target.value) || 0)}
                              className="w-full h-7 px-1 text-xs text-right border border-surface-border rounded bg-white"
                            />
                          </td>

                          {/* Tax % */}
                          <td className="py-1.5 px-2">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={line.taxPercentage}
                              onChange={(e) => updateGrnLine(idx, 'taxPercentage', parseFloat(e.target.value) || 0)}
                              className="w-full h-7 px-1 text-xs text-right border border-surface-border rounded bg-white"
                            />
                          </td>

                          {/* Computed Line Total */}
                          <td className="py-1.5 px-2.5 text-right font-bold text-charcoal-900">
                            {lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>

                          {/* Remove */}
                          <td className="py-1.5 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeGrnLine(idx)}
                              disabled={grnLines.length <= 1}
                              className="text-charcoal-400 hover:text-rose-600 disabled:opacity-30"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer Summary & Action Controls */}
            <div className="px-5 py-3 border-t border-surface-border bg-surface-muted/40 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-6 text-xs">
                <div>
                  <span className="text-charcoal-400">Gross:</span>{' '}
                  <span className="font-semibold text-charcoal-800">
                    PKR {grnTotals.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div>
                  <span className="text-charcoal-400">Discount:</span>{' '}
                  <span className="font-semibold text-emerald-700">
                    - PKR {grnTotals.totalDiscount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div>
                  <span className="text-charcoal-400">Tax:</span>{' '}
                  <span className="font-semibold text-charcoal-800">
                    + PKR {grnTotals.totalTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="bg-brand-50 px-3 py-1 rounded border border-brand-200">
                  <span className="text-brand-800 font-bold text-sm">
                    Net Payable: PKR {grnTotals.netPayable.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsNewGrnOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isPosting}
                  onClick={() => handleSaveGrn(false)}
                >
                  Save as Draft
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={isPosting}
                  onClick={() => handleSaveGrn(true)}
                  className="bg-brand-600 hover:bg-brand-700 text-white font-semibold flex items-center gap-1.5"
                >
                  <PackageCheck className="h-3.5 w-3.5" />
                  <span>{isPosting ? 'Posting...' : 'Post & Receive into Stock'}</span>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NEW PURCHASE ORDER (PO) */}
      {/* ========================================================================= */}
      {isNewPoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3">
          <Card className="w-full max-w-4xl bg-white border border-surface-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-3.5 border-b border-surface-border flex items-center justify-between bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <ShoppingCart className="h-5 w-5 text-brand-600" />
                <div>
                  <h2 className="text-sm font-bold text-charcoal-900">
                    Create Purchase Order
                  </h2>
                  <p className="text-[11px] text-charcoal-500">
                    Formal procurement order sent to pharmaceutical distributor
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsNewPoOpen(false)}
                className="text-charcoal-400 hover:text-charcoal-700 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 border-b border-surface-border bg-surface-card grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">
                  Supplier / Vendor *
                </label>
                <select
                  value={poHeader.supplierId}
                  onChange={(e) => setPoHeader({ ...poHeader, supplierId: e.target.value })}
                  className="w-full h-8 px-2 border border-surface-border rounded bg-white text-charcoal-800"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">
                  Order Date
                </label>
                <Input
                  type="date"
                  value={poHeader.orderDate}
                  onChange={(e) => setPoHeader({ ...poHeader, orderDate: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">
                  Expected Delivery Date
                </label>
                <Input
                  type="date"
                  value={poHeader.expectedDate}
                  onChange={(e) => setPoHeader({ ...poHeader, expectedDate: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            {/* PO Line Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-charcoal-700">
                  Order Lines ({poLines.length})
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setPoLines([
                      ...poLines,
                      {
                        productId: products[0]?.id || '',
                        orderedQuantity: 50,
                        unitCost: 100,
                        discountPercentage: 0,
                        taxPercentage: 0,
                      },
                    ])
                  }
                  className="h-7 text-xs flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  <span>Add Line</span>
                </Button>
              </div>

              <div className="overflow-x-auto border border-surface-border rounded">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-surface-muted/70 text-charcoal-700 font-semibold border-b border-surface-border">
                      <th className="py-2 px-3">Product SKU / Brand</th>
                      <th className="py-2 px-3 text-right">Ordered Qty</th>
                      <th className="py-2 px-3 text-right">Unit Cost (PKR)</th>
                      <th className="py-2 px-3 text-right">Disc %</th>
                      <th className="py-2 px-3 text-right">Tax %</th>
                      <th className="py-2 px-3 text-right">Total (PKR)</th>
                      <th className="py-2 px-3 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {poLines.map((line, idx) => {
                      const total = line.orderedQuantity * line.unitCost * (1 - line.discountPercentage / 100) * (1 + line.taxPercentage / 100);
                      return (
                        <tr key={idx} className="hover:bg-surface-muted/30">
                          <td className="py-1.5 px-3">
                            <select
                              value={line.productId}
                              onChange={(e) => {
                                const updated = [...poLines];
                                updated[idx].productId = e.target.value;
                                setPoLines(updated);
                              }}
                              className="w-full h-7 px-1.5 text-xs border border-surface-border rounded bg-white"
                            >
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({p.sku})
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-1.5 px-3">
                            <input
                              type="number"
                              min="1"
                              value={line.orderedQuantity}
                              onChange={(e) => {
                                const updated = [...poLines];
                                updated[idx].orderedQuantity = parseFloat(e.target.value) || 0;
                                setPoLines(updated);
                              }}
                              className="w-24 h-7 px-1 text-xs text-right font-semibold border border-surface-border rounded ml-auto block"
                            />
                          </td>
                          <td className="py-1.5 px-3">
                            <input
                              type="number"
                              min="0"
                              value={line.unitCost}
                              onChange={(e) => {
                                const updated = [...poLines];
                                updated[idx].unitCost = parseFloat(e.target.value) || 0;
                                setPoLines(updated);
                              }}
                              className="w-24 h-7 px-1 text-xs text-right border border-surface-border rounded ml-auto block"
                            />
                          </td>
                          <td className="py-1.5 px-3">
                            <input
                              type="number"
                              min="0"
                              value={line.discountPercentage}
                              onChange={(e) => {
                                const updated = [...poLines];
                                updated[idx].discountPercentage = parseFloat(e.target.value) || 0;
                                setPoLines(updated);
                              }}
                              className="w-16 h-7 px-1 text-xs text-right border border-surface-border rounded ml-auto block"
                            />
                          </td>
                          <td className="py-1.5 px-3">
                            <input
                              type="number"
                              min="0"
                              value={line.taxPercentage}
                              onChange={(e) => {
                                const updated = [...poLines];
                                updated[idx].taxPercentage = parseFloat(e.target.value) || 0;
                                setPoLines(updated);
                              }}
                              className="w-16 h-7 px-1 text-xs text-right border border-surface-border rounded ml-auto block"
                            />
                          </td>
                          <td className="py-1.5 px-3 text-right font-bold text-charcoal-900">
                            {total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-1.5 px-3 text-center">
                            <button
                              onClick={() => {
                                if (poLines.length > 1) {
                                  setPoLines(poLines.filter((_, i) => i !== idx));
                                }
                              }}
                              disabled={poLines.length <= 1}
                              className="text-charcoal-400 hover:text-rose-600 disabled:opacity-30"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-surface-border bg-surface-muted/40 flex items-center justify-end gap-2.5">
              <Button variant="outline" size="sm" onClick={() => setIsNewPoOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSavePo}
                className="bg-brand-600 hover:bg-brand-700 text-white font-semibold"
              >
                Create Purchase Order
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: VIEW GRN DOCUMENT */}
      {/* ========================================================================= */}
      {viewingGrn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <Card className="w-full max-w-3xl bg-white border border-surface-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-3.5 border-b border-surface-border flex items-center justify-between bg-surface-muted/30">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-brand-600" />
                <h2 className="text-sm font-bold text-charcoal-900">
                  Goods Receive Note #{viewingGrn.grnNumber}
                </h2>
              </div>
              <button
                onClick={() => setViewingGrn(null)}
                className="text-charcoal-400 hover:text-charcoal-700 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-surface-muted/40 p-3 rounded border border-surface-border">
                <div>
                  <span className="text-charcoal-400 block">Status:</span>
                  <StatusBadge
                    variant={
                      viewingGrn.status === 'POSTED'
                        ? 'success'
                        : viewingGrn.status === 'DRAFT'
                        ? 'warning'
                        : 'neutral'
                    }
                  >
                    {viewingGrn.status}
                  </StatusBadge>
                </div>
                <div>
                  <span className="text-charcoal-400 block">Supplier:</span>
                  <span className="font-semibold text-charcoal-900">{viewingGrn.supplier?.name}</span>
                </div>
                <div>
                  <span className="text-charcoal-400 block">Warehouse:</span>
                  <span className="font-semibold text-charcoal-900">{viewingGrn.warehouse?.name}</span>
                </div>
                <div>
                  <span className="text-charcoal-400 block">Received Date:</span>
                  <span className="font-semibold text-charcoal-900">
                    {new Date(viewingGrn.receivedDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <table className="w-full text-left text-xs border border-surface-border rounded">
                <thead>
                  <tr className="bg-surface-muted/60 text-charcoal-700 border-b border-surface-border font-semibold">
                    <th className="py-2 px-2.5">Product</th>
                    <th className="py-2 px-2">Batch</th>
                    <th className="py-2 px-2">Expiry</th>
                    <th className="py-2 px-2 text-right">Received</th>
                    <th className="py-2 px-2 text-right">Bonus</th>
                    <th className="py-2 px-2 text-right">Cost</th>
                    <th className="py-2 px-2 text-right">TP</th>
                    <th className="py-2 px-2 text-right">MRP</th>
                    <th className="py-2 px-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {viewingGrn.items?.map((item) => (
                    <tr key={item.id}>
                      <td className="py-2 px-2.5 font-medium text-charcoal-900">{item.product?.name}</td>
                      <td className="py-2 px-2 font-mono">{item.batchNumber}</td>
                      <td className="py-2 px-2">{new Date(item.expiryDate).toLocaleDateString()}</td>
                      <td className="py-2 px-2 text-right font-semibold">{item.receivedQuantity}</td>
                      <td className="py-2 px-2 text-right text-emerald-600">{item.bonusQuantity}</td>
                      <td className="py-2 px-2 text-right">PKR {Number(item.unitCost).toFixed(2)}</td>
                      <td className="py-2 px-2 text-right text-charcoal-500">PKR {Number(item.tradePrice).toFixed(2)}</td>
                      <td className="py-2 px-2 text-right text-charcoal-500">PKR {Number(item.retailPrice).toFixed(2)}</td>
                      <td className="py-2 px-2.5 text-right font-bold">
                        PKR {Number(item.lineTotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end pt-2">
                <div className="bg-brand-50 p-3 rounded border border-brand-200 text-right space-y-1">
                  <div className="text-xs text-charcoal-600">
                    Net Billed Payable:{' '}
                    <span className="font-bold text-base text-brand-800">
                      PKR {Number(viewingGrn.netTotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-surface-border bg-surface-muted/30 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setViewingGrn(null)}>
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: VIEW PO DOCUMENT */}
      {/* ========================================================================= */}
      {viewingPo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <Card className="w-full max-w-3xl bg-white border border-surface-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-3.5 border-b border-surface-border flex items-center justify-between bg-surface-muted/30">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-brand-600" />
                <h2 className="text-sm font-bold text-charcoal-900">
                  Purchase Order #{viewingPo.poNumber}
                </h2>
              </div>
              <button
                onClick={() => setViewingPo(null)}
                className="text-charcoal-400 hover:text-charcoal-700 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-surface-muted/40 p-3 rounded border border-surface-border">
                <div>
                  <span className="text-charcoal-400 block">Status:</span>
                  <StatusBadge
                    variant={
                      viewingPo.status === 'RECEIVED'
                        ? 'success'
                        : viewingPo.status === 'PARTIALLY_RECEIVED' || viewingPo.status === 'ISSUED'
                        ? 'info'
                        : viewingPo.status === 'DRAFT'
                        ? 'warning'
                        : 'neutral'
                    }
                  >
                    {viewingPo.status}
                  </StatusBadge>
                </div>
                <div>
                  <span className="text-charcoal-400 block">Supplier:</span>
                  <span className="font-semibold text-charcoal-900">{viewingPo.supplier?.name}</span>
                </div>
                <div>
                  <span className="text-charcoal-400 block">Order Date:</span>
                  <span className="font-semibold text-charcoal-900">
                    {new Date(viewingPo.orderDate).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-charcoal-400 block">Expected:</span>
                  <span className="font-semibold text-charcoal-900">
                    {viewingPo.expectedDate ? new Date(viewingPo.expectedDate).toLocaleDateString() : '-'}
                  </span>
                </div>
              </div>

              <table className="w-full text-left text-xs border border-surface-border rounded">
                <thead>
                  <tr className="bg-surface-muted/60 text-charcoal-700 border-b border-surface-border font-semibold">
                    <th className="py-2 px-2.5">Product</th>
                    <th className="py-2 px-2 text-right">Ordered</th>
                    <th className="py-2 px-2 text-right">Received</th>
                    <th className="py-2 px-2 text-right">Unit Cost</th>
                    <th className="py-2 px-2.5 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {viewingPo.items?.map((item) => (
                    <tr key={item.id}>
                      <td className="py-2 px-2.5 font-medium text-charcoal-900">{item.product?.name}</td>
                      <td className="py-2 px-2 text-right font-semibold">{item.orderedQuantity}</td>
                      <td className="py-2 px-2 text-right text-emerald-600 font-semibold">{item.receivedQuantity}</td>
                      <td className="py-2 px-2 text-right">PKR {Number(item.unitCost).toFixed(2)}</td>
                      <td className="py-2 px-2.5 text-right font-bold">
                        PKR {Number(item.lineTotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end pt-2">
                <div className="bg-brand-50 p-3 rounded border border-brand-200 text-right">
                  <div className="text-xs text-charcoal-600">
                    Total Order Value:{' '}
                    <span className="font-bold text-base text-brand-800">
                      PKR {Number(viewingPo.netTotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-surface-border bg-surface-muted/30 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setViewingPo(null)}>
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
