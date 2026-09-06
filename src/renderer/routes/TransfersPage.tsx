import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeftRight,
  Plus,
  Search,
  RefreshCw,
  Eye,
  Edit2,
  Send,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Truck,
  Layers,
  Sparkles,
  Trash2,
  Building2,
  X,
  ArrowRight,
} from 'lucide-react';
import {
  transfersApi,
  StockTransfer,
  StockTransferStatus,
  StockTransferMetricsResponse,
  warehousesApi,
  Warehouse,
  productsApi,
  Product,
  batchesApi,
  Batch,
} from '../api';
import { useAuthStore } from '../store/authStore';
import { clsx } from 'clsx';

export const TransfersPage: React.FC = () => {
  const { user } = useAuthStore();
  const canManage =
    user?.roles?.includes('ADMIN') ||
    user?.permissions?.includes('transfers.manage');
  const canDispatch =
    user?.roles?.includes('ADMIN') ||
    user?.permissions?.includes('transfers.dispatch');
  const canReceive =
    user?.roles?.includes('ADMIN') ||
    user?.permissions?.includes('transfers.receive');
  const canCancel =
    user?.roles?.includes('ADMIN') ||
    user?.permissions?.includes('transfers.cancel');

  // Master Data
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);

  // Transfer register & metrics
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [metrics, setMetrics] = useState<StockTransferMetricsResponse>({
    totalTransfers: 0,
    draftCount: 0,
    inTransitCount: 0,
    receivedCount: 0,
    cancelledCount: 0,
  });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sourceWarehouseFilter, setSourceWarehouseFilter] = useState<string>('ALL');
  const [destWarehouseFilter, setDestWarehouseFilter] = useState<string>('ALL');

  // Notifications
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4500);
  };

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState<StockTransfer | null>(null);

  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [dispatchingTransfer, setDispatchingTransfer] = useState<StockTransfer | null>(null);
  const [dispatchItems, setDispatchItems] = useState<
    Array<{ itemId: string; batchNumber: string; requestedQty: number; dispatchQty: number }>
  >([]);
  const [dispatchNotes, setDispatchNotes] = useState('');
  const [submittingDispatch, setSubmittingDispatch] = useState(false);

  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [receivingTransfer, setReceivingTransfer] = useState<StockTransfer | null>(null);
  const [receiveItems, setReceiveItems] = useState<
    Array<{
      itemId: string;
      productName: string;
      batchNumber: string;
      dispatchedQty: number;
      alreadyReceivedQty: number;
      pendingQty: number;
      receiveQty: number;
    }>
  >([]);
  const [receiveNotes, setReceiveNotes] = useState('');
  const [submittingReceive, setSubmittingReceive] = useState(false);

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancellingTransfer, setCancellingTransfer] = useState<StockTransfer | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [submittingCancel, setSubmittingCancel] = useState(false);

  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<StockTransfer | null>(null);

  // Form State for Create/Edit Modal
  const [formSourceWarehouseId, setFormSourceWarehouseId] = useState('');
  const [formDestWarehouseId, setFormDestWarehouseId] = useState('');
  const [formTransferDate, setFormTransferDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [formNotes, setFormNotes] = useState('');
  const [formItems, setFormItems] = useState<
    Array<{
      productId: string;
      productName: string;
      sku: string;
      batchId: string;
      batchNumber: string;
      expiryDate: string;
      requestedQuantity: number;
      unitCost: number;
      notes?: string;
    }>
  >([]);

  // Item selector helpers inside Modal
  const [selectedProdId, setSelectedProdId] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [itemRequestedQty, setItemRequestedQty] = useState<number>(10);
  const [itemNotes, setItemNotes] = useState('');
  const [fefoLoading, setFefoLoading] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Load Master Data
  const loadMasterData = useCallback(async () => {
    try {
      const [whRes, prodRes, batchRes] = await Promise.all([
        warehousesApi.getWarehouses(),
        productsApi.getProducts({ limit: 300 }),
        batchesApi.getAllBatches({ limit: 300 }),
      ]);
      setWarehouses(whRes || []);
      setProducts(prodRes.items || []);
      setBatches(batchRes.items || []);
    } catch (err) {
      console.error('Failed to load master data for transfers:', err);
    }
  }, []);

  // Load Transfers List and Metrics
  const loadTransfers = useCallback(async () => {
    try {
      setLoading(true);
      const [data, metricsRes] = await Promise.all([
        transfersApi.getTransfers({
          search: search.trim() || undefined,
          status:
            statusFilter !== 'ALL'
              ? (statusFilter as StockTransferStatus)
              : undefined,
          sourceWarehouseId:
            sourceWarehouseFilter !== 'ALL'
              ? sourceWarehouseFilter
              : undefined,
          destinationWarehouseId:
            destWarehouseFilter !== 'ALL' ? destWarehouseFilter : undefined,
          limit: 100,
        }),
        transfersApi.getMetrics(),
      ]);
      setTransfers(data.items || []);
      setMetrics(metricsRes);
    } catch (err: any) {
      showNotification(
        'error',
        err.response?.data?.message || 'Failed to load stock transfers',
      );
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, sourceWarehouseFilter, destWarehouseFilter]);

  useEffect(() => {
    loadMasterData();
  }, [loadMasterData]);

  useEffect(() => {
    loadTransfers();
  }, [loadTransfers]);

  // Handle FEFO Preview Allocation
  const handleAutoFefoSuggest = async () => {
    if (!formSourceWarehouseId || !selectedProdId || itemRequestedQty <= 0) {
      showNotification(
        'error',
        'Please select source warehouse, product, and positive quantity first.',
      );
      return;
    }

    try {
      setFefoLoading(true);
      const res = await transfersApi.previewFefo({
        sourceWarehouseId: formSourceWarehouseId,
        productId: selectedProdId,
        quantity: itemRequestedQty,
      });

      if (!res.allocations || res.allocations.length === 0) {
        showNotification(
          'error',
          'No available active/unexpired batches found in source warehouse for this product.',
        );
        return;
      }

      const topBatch = res.allocations[0];
      const foundProduct = products.find((p) => p.id === selectedProdId);

      // Check if already in form items
      const existingIdx = formItems.findIndex((i) => i.batchId === topBatch.batchId);
      if (existingIdx >= 0) {
        setFormItems((prev) => {
          const updated = [...prev];
          updated[existingIdx].requestedQuantity += topBatch.allocatedQuantity;
          return updated;
        });
      } else {
        setFormItems((prev) => [
          ...prev,
          {
            productId: selectedProdId,
            productName: foundProduct?.name || 'Product',
            sku: foundProduct?.sku || '',
            batchId: topBatch.batchId,
            batchNumber: topBatch.batchNumber,
            expiryDate: topBatch.expiryDate,
            requestedQuantity: topBatch.allocatedQuantity,
            unitCost: topBatch.purchaseCost,
            notes: itemNotes.trim() || undefined,
          },
        ]);
      }

      showNotification(
        'success',
        `FEFO suggested batch ${topBatch.batchNumber} (Expires: ${new Date(topBatch.expiryDate).toLocaleDateString()})`,
      );
      setSelectedBatchId('');
      setItemNotes('');
    } catch (err: any) {
      showNotification(
        'error',
        err.response?.data?.message || 'FEFO allocation calculation failed',
      );
    } finally {
      setFefoLoading(false);
    }
  };

  // Add Manual Batch to Items
  const handleAddItemToForm = () => {
    if (!selectedProdId || !selectedBatchId || itemRequestedQty <= 0) {
      showNotification(
        'error',
        'Please select product, specific batch, and requested quantity.',
      );
      return;
    }

    const foundProduct = products.find((p) => p.id === selectedProdId);
    const foundBatch = batches.find((b) => b.id === selectedBatchId);

    if (!foundBatch) {
      showNotification('error', 'Selected batch not found.');
      return;
    }

    const existingIdx = formItems.findIndex((i) => i.batchId === selectedBatchId);
    if (existingIdx >= 0) {
      setFormItems((prev) => {
        const updated = [...prev];
        updated[existingIdx].requestedQuantity += itemRequestedQty;
        return updated;
      });
    } else {
      setFormItems((prev) => [
        ...prev,
        {
          productId: selectedProdId,
          productName: foundProduct?.name || 'Product',
          sku: foundProduct?.sku || '',
          batchId: foundBatch.id,
          batchNumber: foundBatch.batchNumber,
          expiryDate: foundBatch.expiryDate,
          requestedQuantity: itemRequestedQty,
          unitCost: Number(foundBatch.purchaseCost),
          notes: itemNotes.trim() || undefined,
        },
      ]);
    }

    setSelectedBatchId('');
    setItemNotes('');
  };

  const handleRemoveItem = (index: number) => {
    setFormItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Open Create Modal
  const openCreateModal = () => {
    setEditingTransfer(null);
    setFormSourceWarehouseId(warehouses[0]?.id || '');
    setFormDestWarehouseId(warehouses[1]?.id || '');
    setFormTransferDate(new Date().toISOString().split('T')[0]);
    setFormNotes('');
    setFormItems([]);
    setSelectedProdId('');
    setSelectedBatchId('');
    setItemRequestedQty(10);
    setItemNotes('');
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = async (transfer: StockTransfer) => {
    try {
      const detailed = await transfersApi.getTransferById(transfer.id);
      setEditingTransfer(detailed);
      setFormSourceWarehouseId(detailed.sourceWarehouseId);
      setFormDestWarehouseId(detailed.destinationWarehouseId);
      setFormTransferDate(new Date(detailed.transferDate).toISOString().split('T')[0]);
      setFormNotes(detailed.notes || '');
      setFormItems(
        (detailed.items || []).map((i) => ({
          productId: i.productId,
          productName: i.product?.name || 'Product',
          sku: i.product?.sku || '',
          batchId: i.batchId,
          batchNumber: i.batchNumber,
          expiryDate: i.expiryDate,
          requestedQuantity: i.requestedQuantity,
          unitCost: Number(i.unitCost),
          notes: i.notes || undefined,
        })),
      );
      setIsCreateModalOpen(true);
    } catch (err: any) {
      showNotification('error', 'Failed to load transfer details for editing');
    }
  };

  // Save Transfer (Create or Update Draft)
  const handleSaveTransfer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formSourceWarehouseId === formDestWarehouseId) {
      showNotification('error', 'Source and destination warehouses must be different.');
      return;
    }

    if (formItems.length === 0) {
      showNotification('error', 'Please add at least one line item to the transfer.');
      return;
    }

    try {
      setFormSubmitting(true);
      if (editingTransfer) {
        await transfersApi.updateDraft(editingTransfer.id, {
          sourceWarehouseId: formSourceWarehouseId,
          destinationWarehouseId: formDestWarehouseId,
          transferDate: formTransferDate,
          notes: formNotes.trim() || undefined,
          items: formItems.map((i) => ({
            productId: i.productId,
            batchId: i.batchId,
            requestedQuantity: i.requestedQuantity,
            notes: i.notes,
          })),
        });
        showNotification('success', 'Transfer draft updated successfully.');
      } else {
        await transfersApi.createDraft({
          sourceWarehouseId: formSourceWarehouseId,
          destinationWarehouseId: formDestWarehouseId,
          transferDate: formTransferDate,
          notes: formNotes.trim() || undefined,
          items: formItems.map((i) => ({
            productId: i.productId,
            batchId: i.batchId,
            requestedQuantity: i.requestedQuantity,
            notes: i.notes,
          })),
        });
        showNotification('success', 'Stock transfer draft created successfully.');
      }
      setIsCreateModalOpen(false);
      loadTransfers();
    } catch (err: any) {
      showNotification(
        'error',
        err.response?.data?.message || 'Failed to save stock transfer',
      );
    } finally {
      setFormSubmitting(false);
    }
  };

  // Open Dispatch Modal
  const openDispatchModal = async (transfer: StockTransfer) => {
    try {
      const detailed = await transfersApi.getTransferById(transfer.id);
      setDispatchingTransfer(detailed);
      setDispatchItems(
        (detailed.items || []).map((i) => ({
          itemId: i.id,
          batchNumber: i.batchNumber,
          requestedQty: i.requestedQuantity,
          dispatchQty: i.requestedQuantity,
        })),
      );
      setDispatchNotes(detailed.notes || '');
      setIsDispatchModalOpen(true);
    } catch (err: any) {
      showNotification('error', 'Failed to load transfer for dispatch');
    }
  };

  // Submit Dispatch
  const handleSubmitDispatch = async () => {
    if (!dispatchingTransfer) return;

    try {
      setSubmittingDispatch(true);
      await transfersApi.dispatchTransfer(dispatchingTransfer.id, {
        items: dispatchItems.map((i) => ({
          itemId: i.itemId,
          dispatchedQuantity: Number(i.dispatchQty),
        })),
        notes: dispatchNotes.trim() || undefined,
      });
      showNotification(
        'success',
        `Transfer ${dispatchingTransfer.transferNumber} dispatched successfully. Stock is now in transit.`,
      );
      setIsDispatchModalOpen(false);
      loadTransfers();
    } catch (err: any) {
      showNotification(
        'error',
        err.response?.data?.message || 'Failed to dispatch stock transfer',
      );
    } finally {
      setSubmittingDispatch(false);
    }
  };

  // Open Receive Modal
  const openReceiveModal = async (transfer: StockTransfer) => {
    try {
      const detailed = await transfersApi.getTransferById(transfer.id);
      setReceivingTransfer(detailed);
      setReceiveItems(
        (detailed.items || []).map((i) => {
          const pending = i.dispatchedQuantity - i.receivedQuantity;
          return {
            itemId: i.id,
            productName: i.product?.name || 'Product',
            batchNumber: i.batchNumber,
            dispatchedQty: i.dispatchedQuantity,
            alreadyReceivedQty: i.receivedQuantity,
            pendingQty: pending,
            receiveQty: pending, // default to receive all remaining
          };
        }),
      );
      setReceiveNotes(detailed.notes || '');
      setIsReceiveModalOpen(true);
    } catch (err: any) {
      showNotification('error', 'Failed to load transfer for receiving');
    }
  };

  // Submit Receive
  const handleSubmitReceive = async () => {
    if (!receivingTransfer) return;

    const itemsToSubmit = receiveItems
      .filter((i) => i.receiveQty > 0)
      .map((i) => ({
        itemId: i.itemId,
        receivedQuantity: Number(i.receiveQty),
      }));

    if (itemsToSubmit.length === 0) {
      showNotification('error', 'Please enter a positive receive quantity for at least one item.');
      return;
    }

    try {
      setSubmittingReceive(true);
      const updated = await transfersApi.receiveTransfer(receivingTransfer.id, {
        items: itemsToSubmit,
        notes: receiveNotes.trim() || undefined,
      });
      showNotification(
        'success',
        `Transfer ${updated.transferNumber} received (Status: ${updated.status}). Stock added to ${updated.destinationWarehouse?.name}.`,
      );
      setIsReceiveModalOpen(false);
      loadTransfers();
    } catch (err: any) {
      showNotification(
        'error',
        err.response?.data?.message || 'Failed to receive stock transfer',
      );
    } finally {
      setSubmittingReceive(false);
    }
  };

  // Open Cancel Modal
  const openCancelModal = (transfer: StockTransfer) => {
    setCancellingTransfer(transfer);
    setCancelReason('');
    setIsCancelModalOpen(true);
  };

  // Submit Cancel
  const handleSubmitCancel = async () => {
    if (!cancellingTransfer || !cancelReason.trim()) {
      showNotification('error', 'Please provide a valid reason for cancelling this transfer.');
      return;
    }

    try {
      setSubmittingCancel(true);
      await transfersApi.cancelTransfer(cancellingTransfer.id, {
        cancellationReason: cancelReason.trim(),
      });
      showNotification(
        'success',
        `Transfer ${cancellingTransfer.transferNumber} cancelled. Any moved stock has been reversed.`,
      );
      setIsCancelModalOpen(false);
      loadTransfers();
    } catch (err: any) {
      showNotification(
        'error',
        err.response?.data?.message || 'Failed to cancel stock transfer',
      );
    } finally {
      setSubmittingCancel(false);
    }
  };

  // Open View Details Drawer
  const openDetailDrawer = async (transfer: StockTransfer) => {
    try {
      const detailed = await transfersApi.getTransferById(transfer.id);
      setSelectedTransfer(detailed);
      setIsDetailDrawerOpen(true);
    } catch (err: any) {
      showNotification('error', 'Failed to load transfer detail');
    }
  };

  const getStatusBadge = (status: StockTransferStatus) => {
    switch (status) {
      case 'DRAFT':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-charcoal-100 text-charcoal-700 border border-charcoal-200">
            DRAFT
          </span>
        );
      case 'DISPATCHED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1 w-fit">
            <Truck className="w-3 h-3" />
            IN TRANSIT
          </span>
        );
      case 'PARTIALLY_RECEIVED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1 w-fit">
            <Layers className="w-3 h-3" />
            PARTIAL RECEIPT
          </span>
        );
      case 'RECEIVED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-fit">
            <CheckCircle2 className="w-3 h-3" />
            RECEIVED
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1 w-fit">
            <XCircle className="w-3 h-3" />
            CANCELLED
          </span>
        );
    }
  };

  // Filtered available batches for product selector in modal
  const availableBatchesForProduct = batches.filter(
    (b) => b.productId === selectedProdId,
  );

  return (
    <div className="flex flex-col h-full bg-surface-ground p-6 overflow-y-auto font-sans">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-charcoal-900">
              Warehouse & Stock Transfers
            </h1>
            <span className="px-2 py-0.5 text-xs font-semibold bg-brand-50 text-brand-700 rounded-full border border-brand-200">
              Multi-Location Logistics
            </span>
          </div>
          <p className="text-xs text-charcoal-500 mt-1">
            Inter-warehouse stock dispatch, in-transit quarantine management, and verified physical receiving
          </p>
        </div>

        {canManage && (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Stock Transfer
          </button>
        )}
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className={clsx(
            'mb-4 p-3 rounded-lg flex items-center justify-between text-xs font-medium animate-in fade-in',
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200',
          )}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-charcoal-400 hover:text-charcoal-700"
          >
            ✕
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="bg-surface-card p-3.5 rounded-lg border border-surface-border shadow-xs">
          <div className="text-[11px] font-medium text-charcoal-500 uppercase tracking-wider">
            Total Transfers
          </div>
          <div className="text-xl font-bold text-charcoal-900 mt-1">
            {metrics.totalTransfers}
          </div>
        </div>

        <div className="bg-surface-card p-3.5 rounded-lg border border-surface-border shadow-xs">
          <div className="text-[11px] font-medium text-charcoal-500 uppercase tracking-wider">
            Draft Transfers
          </div>
          <div className="text-xl font-bold text-charcoal-700 mt-1">
            {metrics.draftCount}
          </div>
        </div>

        <div className="bg-surface-card p-3.5 rounded-lg border border-purple-200 bg-purple-50/30 shadow-xs">
          <div className="text-[11px] font-medium text-purple-700 uppercase tracking-wider flex items-center gap-1">
            <Truck className="w-3.5 h-3.5" />
            In Transit
          </div>
          <div className="text-xl font-bold text-purple-900 mt-1">
            {metrics.inTransitCount}
          </div>
        </div>

        <div className="bg-surface-card p-3.5 rounded-lg border border-emerald-200 bg-emerald-50/30 shadow-xs">
          <div className="text-[11px] font-medium text-emerald-700 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Received
          </div>
          <div className="text-xl font-bold text-emerald-900 mt-1">
            {metrics.receivedCount}
          </div>
        </div>

        <div className="bg-surface-card p-3.5 rounded-lg border border-surface-border shadow-xs">
          <div className="text-[11px] font-medium text-charcoal-500 uppercase tracking-wider">
            Cancelled
          </div>
          <div className="text-xl font-bold text-rose-700 mt-1">
            {metrics.cancelledCount}
          </div>
        </div>
      </div>

      {/* Control / Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-card p-3 rounded-lg border border-surface-border mb-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[300px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400" />
            <input
              type="text"
              placeholder="Search transfer # or notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-surface-ground border border-surface-border rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-surface-ground border border-surface-border rounded-md px-2.5 py-1.5 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="DISPATCHED">In Transit (Dispatched)</option>
            <option value="PARTIALLY_RECEIVED">Partially Received</option>
            <option value="RECEIVED">Received</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select
            value={sourceWarehouseFilter}
            onChange={(e) => setSourceWarehouseFilter(e.target.value)}
            className="text-xs bg-surface-ground border border-surface-border rounded-md px-2.5 py-1.5 focus:outline-none max-w-[160px]"
          >
            <option value="ALL">All Source WH</option>
            {warehouses.map((wh) => (
              <option key={wh.id} value={wh.id}>
                {wh.code} - {wh.name}
              </option>
            ))}
          </select>

          <select
            value={destWarehouseFilter}
            onChange={(e) => setDestWarehouseFilter(e.target.value)}
            className="text-xs bg-surface-ground border border-surface-border rounded-md px-2.5 py-1.5 focus:outline-none max-w-[160px]"
          >
            <option value="ALL">All Dest WH</option>
            {warehouses.map((wh) => (
              <option key={wh.id} value={wh.id}>
                {wh.code} - {wh.name}
              </option>
            ))}
          </select>

          <button
            onClick={loadTransfers}
            className="p-1.5 border border-surface-border rounded-md hover:bg-surface-muted text-charcoal-600 transition-colors"
            title="Refresh Transfers"
          >
            <RefreshCw className={clsx('w-3.5 h-3.5', loading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Main Transfers Table */}
      <div className="bg-surface-card rounded-lg border border-surface-border overflow-hidden shadow-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-muted border-b border-surface-border text-[11px] font-semibold text-charcoal-600 uppercase tracking-wider">
              <th className="py-2.5 px-4">Transfer #</th>
              <th className="py-2.5 px-3">Date</th>
              <th className="py-2.5 px-4">Route (Source → Destination)</th>
              <th className="py-2.5 px-3 text-center">Items</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border text-xs text-charcoal-800">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-charcoal-400">
                  Loading stock transfers...
                </td>
              </tr>
            ) : transfers.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-charcoal-400">
                  No stock transfers found. Click &quot;New Stock Transfer&quot; to initiate a movement.
                </td>
              </tr>
            ) : (
              transfers.map((t) => (
                <tr key={t.id} className="hover:bg-surface-ground/50 transition-colors">
                  <td className="py-2.5 px-4">
                    <span className="font-mono font-bold text-brand-700">
                      {t.transferNumber}
                    </span>
                    {t.notes && (
                      <div className="text-[10px] text-charcoal-400 truncate max-w-xs mt-0.5">
                        {t.notes}
                      </div>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-charcoal-600">
                    {new Date(t.transferDate).toLocaleDateString()}
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 font-medium text-charcoal-900">
                        <Building2 className="w-3.5 h-3.5 text-charcoal-400" />
                        <span>{t.sourceWarehouse?.name || 'Source'}</span>
                        <span className="text-[10px] font-mono text-charcoal-500">
                          ({t.sourceWarehouse?.code})
                        </span>
                      </div>
                      <ArrowRight className="w-3 h-3 text-charcoal-400" />
                      <div className="flex items-center gap-1 font-medium text-charcoal-900">
                        <span>{t.destinationWarehouse?.name || 'Dest'}</span>
                        <span className="text-[10px] font-mono text-charcoal-500">
                          ({t.destinationWarehouse?.code})
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-center font-semibold text-charcoal-700">
                    {t._count?.items || (t.items ? t.items.length : 0)}
                  </td>
                  <td className="py-2.5 px-3">{getStatusBadge(t.status)}</td>
                  <td className="py-2.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openDetailDrawer(t)}
                        className="p-1 hover:bg-surface-muted rounded text-charcoal-600 hover:text-brand-600 transition-colors"
                        title="View Transfer Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {t.status === 'DRAFT' && canManage && (
                        <button
                          onClick={() => openEditModal(t)}
                          className="p-1 hover:bg-surface-muted rounded text-charcoal-600 hover:text-brand-600 transition-colors"
                          title="Edit Draft"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {t.status === 'DRAFT' && canDispatch && (
                        <button
                          onClick={() => openDispatchModal(t)}
                          className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded text-[11px] font-medium flex items-center gap-1 transition-colors"
                          title="Dispatch Transfer"
                        >
                          <Send className="w-3 h-3" />
                          Dispatch
                        </button>
                      )}

                      {(t.status === 'DISPATCHED' || t.status === 'PARTIALLY_RECEIVED') &&
                        canReceive && (
                          <button
                            onClick={() => openReceiveModal(t)}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded text-[11px] font-medium flex items-center gap-1 transition-colors"
                            title="Receive Stock"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            Receive
                          </button>
                        )}

                      {t.status !== 'RECEIVED' && t.status !== 'CANCELLED' && canCancel && (
                        <button
                          onClick={() => openCancelModal(t)}
                          className="p-1 hover:bg-rose-50 rounded text-charcoal-400 hover:text-rose-600 transition-colors"
                          title="Cancel Transfer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
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

      {/* MODAL 1: CREATE / EDIT TRANSFER MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-surface-card rounded-xl border border-surface-border shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-4 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-brand-600" />
                <h2 className="text-sm font-bold text-charcoal-900">
                  {editingTransfer ? `Edit Stock Transfer (${editingTransfer.transferNumber})` : 'New Stock Transfer'}
                </h2>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-charcoal-400 hover:text-charcoal-700 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTransfer} className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              {/* Route & Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-charcoal-700 mb-1">
                    Source Warehouse *
                  </label>
                  <select
                    value={formSourceWarehouseId}
                    onChange={(e) => setFormSourceWarehouseId(e.target.value)}
                    className="w-full text-xs bg-surface-ground border border-surface-border rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    required
                  >
                    {warehouses.map((wh) => (
                      <option key={wh.id} value={wh.id}>
                        {wh.code} - {wh.name} ({wh.warehouseType})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-charcoal-700 mb-1">
                    Destination Warehouse *
                  </label>
                  <select
                    value={formDestWarehouseId}
                    onChange={(e) => setFormDestWarehouseId(e.target.value)}
                    className="w-full text-xs bg-surface-ground border border-surface-border rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    required
                  >
                    {warehouses.map((wh) => (
                      <option key={wh.id} value={wh.id}>
                        {wh.code} - {wh.name} ({wh.warehouseType})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-charcoal-700 mb-1">
                    Transfer Date *
                  </label>
                  <input
                    type="date"
                    value={formTransferDate}
                    onChange={(e) => setFormTransferDate(e.target.value)}
                    className="w-full text-xs bg-surface-ground border border-surface-border rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-charcoal-700 mb-1">
                  Reason / Operational Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Stock balancing for peak dispensary demand"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full text-xs bg-surface-ground border border-surface-border rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              {/* Line Items Builder Section */}
              <div className="bg-surface-ground p-3 rounded-lg border border-surface-border flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-charcoal-800">
                    Add Product & Batch to Transfer
                  </span>
                  <button
                    type="button"
                    onClick={handleAutoFefoSuggest}
                    disabled={fefoLoading || !selectedProdId}
                    className={clsx(
                      'flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md border transition-colors',
                      selectedProdId
                        ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                        : 'bg-charcoal-100 text-charcoal-400 border-charcoal-200 cursor-not-allowed',
                    )}
                  >
                    <Sparkles className={clsx('w-3.5 h-3.5', fefoLoading && 'animate-spin')} />
                    Auto FEFO Allocate
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-medium text-charcoal-500 mb-0.5">
                      Product
                    </label>
                    <select
                      value={selectedProdId}
                      onChange={(e) => {
                        setSelectedProdId(e.target.value);
                        setSelectedBatchId('');
                      }}
                      className="w-full text-xs bg-white border border-surface-border rounded-md px-2 py-1.5 focus:outline-none"
                    >
                      <option value="">Select product...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-charcoal-500 mb-0.5">
                      Specific Batch
                    </label>
                    <select
                      value={selectedBatchId}
                      onChange={(e) => setSelectedBatchId(e.target.value)}
                      disabled={!selectedProdId}
                      className="w-full text-xs bg-white border border-surface-border rounded-md px-2 py-1.5 focus:outline-none disabled:bg-charcoal-50"
                    >
                      <option value="">Choose batch...</option>
                      {availableBatchesForProduct.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.batchNumber} (Exp: {new Date(b.expiryDate).toLocaleDateString()})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-charcoal-500 mb-0.5">
                      Requested Qty
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="1"
                        value={itemRequestedQty}
                        onChange={(e) => setItemRequestedQty(Math.max(1, Number(e.target.value)))}
                        className="w-full text-xs bg-white border border-surface-border rounded-md px-2 py-1.5 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddItemToForm}
                        disabled={!selectedBatchId}
                        className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 disabled:bg-charcoal-300 text-white rounded text-xs font-semibold"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-surface-border rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-muted text-[10px] font-semibold text-charcoal-600 uppercase border-b border-surface-border">
                    <tr>
                      <th className="py-2 px-3">Product / SKU</th>
                      <th className="py-2 px-3">Batch #</th>
                      <th className="py-2 px-2">Expiry</th>
                      <th className="py-2 px-2 text-right">Requested Qty</th>
                      <th className="py-2 px-2 text-right">Unit Cost</th>
                      <th className="py-2 px-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {formItems.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-charcoal-400">
                          No items added yet. Use the product selector above or click &quot;Auto FEFO Allocate&quot;.
                        </td>
                      </tr>
                    ) : (
                      formItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-surface-ground">
                          <td className="py-2 px-3">
                            <div className="font-semibold text-charcoal-900">{item.productName}</div>
                            <div className="text-[10px] text-charcoal-400 font-mono">{item.sku}</div>
                          </td>
                          <td className="py-2 px-3 font-mono font-medium text-brand-700">
                            {item.batchNumber}
                          </td>
                          <td className="py-2 px-2 text-charcoal-600">
                            {new Date(item.expiryDate).toLocaleDateString()}
                          </td>
                          <td className="py-2 px-2 text-right font-bold text-charcoal-900">
                            {item.requestedQuantity}
                          </td>
                          <td className="py-2 px-2 text-right font-mono text-charcoal-600">
                            Rs.{item.unitCost.toFixed(2)}
                          </td>
                          <td className="py-2 px-2 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="p-1 text-charcoal-400 hover:text-rose-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-border mt-auto">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3.5 py-1.5 border border-surface-border rounded-md text-xs font-medium text-charcoal-700 hover:bg-surface-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting || formItems.length === 0}
                  className="px-4 py-1.5 bg-brand-600 hover:bg-brand-700 disabled:bg-charcoal-300 text-white rounded-md text-xs font-semibold shadow-xs"
                >
                  {formSubmitting ? 'Saving...' : editingTransfer ? 'Update Draft' : 'Create Draft'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: DISPATCH MODAL */}
      {isDispatchModalOpen && dispatchingTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-surface-card rounded-xl border border-surface-border shadow-xl max-w-xl w-full flex flex-col animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-4 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-purple-600" />
                <h2 className="text-sm font-bold text-charcoal-900">
                  Dispatch Stock Transfer ({dispatchingTransfer.transferNumber})
                </h2>
              </div>
              <button
                onClick={() => setIsDispatchModalOpen(false)}
                className="text-charcoal-400 hover:text-charcoal-700 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <div className="p-4 flex flex-col gap-4">
              <div className="p-3 bg-purple-50/50 border border-purple-200 rounded-lg text-xs text-purple-900 flex items-start gap-2">
                <Truck className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold">Stock Outflow Confirmation</div>
                  <div className="text-[11px] text-purple-700 mt-0.5">
                    Dispatching will deduct items from <strong>{dispatchingTransfer.sourceWarehouse?.name}</strong>.
                    Stock will remain in transit and will NOT be saleable until confirmed by receiving warehouse.
                  </div>
                </div>
              </div>

              <div className="border border-surface-border rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-muted text-[10px] font-semibold text-charcoal-600 uppercase border-b border-surface-border">
                    <tr>
                      <th className="py-2 px-3">Batch #</th>
                      <th className="py-2 px-2 text-right">Requested</th>
                      <th className="py-2 px-3 text-right">Dispatch Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {dispatchItems.map((item, idx) => (
                      <tr key={item.itemId}>
                        <td className="py-2 px-3 font-mono font-medium text-charcoal-900">
                          {item.batchNumber}
                        </td>
                        <td className="py-2 px-2 text-right font-medium text-charcoal-600">
                          {item.requestedQty}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <input
                            type="number"
                            min="1"
                            value={item.dispatchQty}
                            onChange={(e) => {
                              const val = Math.max(1, Number(e.target.value));
                              setDispatchItems((prev) => {
                                const updated = [...prev];
                                updated[idx].dispatchQty = val;
                                return updated;
                              });
                            }}
                            className="w-20 text-xs font-bold text-right bg-surface-ground border border-surface-border rounded px-2 py-1 focus:outline-none"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-charcoal-700 mb-1">
                  Dispatch Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dispatched via Logistics Van #3"
                  value={dispatchNotes}
                  onChange={(e) => setDispatchNotes(e.target.value)}
                  className="w-full text-xs bg-surface-ground border border-surface-border rounded-md px-2.5 py-1.5 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-border">
                <button
                  type="button"
                  onClick={() => setIsDispatchModalOpen(false)}
                  className="px-3.5 py-1.5 border border-surface-border rounded-md text-xs font-medium text-charcoal-700 hover:bg-surface-muted"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitDispatch}
                  disabled={submittingDispatch}
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:bg-charcoal-300 text-white rounded-md text-xs font-semibold shadow-xs flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submittingDispatch ? 'Dispatching...' : 'Confirm Dispatch'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: RECEIVE MODAL */}
      {isReceiveModalOpen && receivingTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-surface-card rounded-xl border border-surface-border shadow-xl max-w-2xl w-full flex flex-col animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-4 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h2 className="text-sm font-bold text-charcoal-900">
                  Receive Stock Transfer ({receivingTransfer.transferNumber})
                </h2>
              </div>
              <button
                onClick={() => setIsReceiveModalOpen(false)}
                className="text-charcoal-400 hover:text-charcoal-700 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <div className="p-4 flex flex-col gap-4">
              <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-start gap-2">
                <Layers className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold">Destination Inventory Inflow</div>
                  <div className="text-[11px] text-emerald-700 mt-0.5">
                    Receiving adds inventory into <strong>{receivingTransfer.destinationWarehouse?.name}</strong>.
                    You may receive full or partial quantities. Unreceived units remain in transit.
                  </div>
                </div>
              </div>

              <div className="border border-surface-border rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-muted text-[10px] font-semibold text-charcoal-600 uppercase border-b border-surface-border">
                    <tr>
                      <th className="py-2 px-3">Product / Batch</th>
                      <th className="py-2 px-2 text-right">Dispatched</th>
                      <th className="py-2 px-2 text-right">Received So Far</th>
                      <th className="py-2 px-2 text-right">Pending In-Transit</th>
                      <th className="py-2 px-3 text-right">Receive Now</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {receiveItems.map((item, idx) => (
                      <tr key={item.itemId}>
                        <td className="py-2 px-3">
                          <div className="font-semibold text-charcoal-900">{item.productName}</div>
                          <div className="text-[10px] font-mono text-brand-700">{item.batchNumber}</div>
                        </td>
                        <td className="py-2 px-2 text-right font-medium text-charcoal-600">
                          {item.dispatchedQty}
                        </td>
                        <td className="py-2 px-2 text-right text-emerald-700 font-medium">
                          {item.alreadyReceivedQty}
                        </td>
                        <td className="py-2 px-2 text-right font-bold text-purple-800">
                          {item.pendingQty}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <input
                            type="number"
                            min="0"
                            max={item.pendingQty}
                            value={item.receiveQty}
                            onChange={(e) => {
                              const val = Math.min(
                                item.pendingQty,
                                Math.max(0, Number(e.target.value)),
                              );
                              setReceiveItems((prev) => {
                                const updated = [...prev];
                                updated[idx].receiveQty = val;
                                return updated;
                              });
                            }}
                            className="w-20 text-xs font-bold text-right bg-surface-ground border border-surface-border rounded px-2 py-1 focus:outline-none"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-charcoal-700 mb-1">
                  Receiving Notes / Quality Remarks
                </label>
                <input
                  type="text"
                  placeholder="e.g. Verified physically against gate pass, cartons intact"
                  value={receiveNotes}
                  onChange={(e) => setReceiveNotes(e.target.value)}
                  className="w-full text-xs bg-surface-ground border border-surface-border rounded-md px-2.5 py-1.5 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-border">
                <button
                  type="button"
                  onClick={() => setIsReceiveModalOpen(false)}
                  className="px-3.5 py-1.5 border border-surface-border rounded-md text-xs font-medium text-charcoal-700 hover:bg-surface-muted"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitReceive}
                  disabled={submittingReceive}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-charcoal-300 text-white rounded-md text-xs font-semibold shadow-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {submittingReceive ? 'Receiving...' : 'Confirm Receipt'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: CANCEL MODAL */}
      {isCancelModalOpen && cancellingTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-surface-card rounded-xl border border-surface-border shadow-xl max-w-md w-full flex flex-col animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-4 border-b border-surface-border">
              <div className="flex items-center gap-2 text-rose-700">
                <XCircle className="w-5 h-5" />
                <h2 className="text-sm font-bold text-charcoal-900">
                  Cancel Transfer ({cancellingTransfer.transferNumber})
                </h2>
              </div>
              <button
                onClick={() => setIsCancelModalOpen(false)}
                className="text-charcoal-400 hover:text-charcoal-700 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <div className="p-4 flex flex-col gap-4">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900">
                <div className="font-semibold">Reversal Notice</div>
                <div className="text-[11px] text-rose-700 mt-1">
                  Cancelling this transfer will reverse all moved inventory. In-transit stock will be restored to source warehouse, and any received stock will be reversed back.
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-charcoal-700 mb-1">
                  Cancellation Reason *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Specify why this transfer is being cancelled..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full text-xs bg-surface-ground border border-surface-border rounded-md p-2.5 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-border">
                <button
                  type="button"
                  onClick={() => setIsCancelModalOpen(false)}
                  className="px-3.5 py-1.5 border border-surface-border rounded-md text-xs font-medium text-charcoal-700 hover:bg-surface-muted"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleSubmitCancel}
                  disabled={submittingCancel || !cancelReason.trim()}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:bg-charcoal-300 text-white rounded-md text-xs font-semibold shadow-xs"
                >
                  {submittingCancel ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DRAWER: TRANSFER DETAIL VIEW */}
      {isDetailDrawerOpen && selectedTransfer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-xs">
          <div className="bg-surface-card border-l border-surface-border shadow-2xl w-full max-w-xl h-full flex flex-col animate-in slide-in-from-right">
            <div className="flex items-center justify-between p-4 border-b border-surface-border bg-surface-muted">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-charcoal-900 font-mono">
                    {selectedTransfer.transferNumber}
                  </h2>
                  {getStatusBadge(selectedTransfer.status)}
                </div>
                <div className="text-xs text-charcoal-500 mt-0.5">
                  Transfer Date: {new Date(selectedTransfer.transferDate).toLocaleDateString()}
                </div>
              </div>
              <button
                onClick={() => setIsDetailDrawerOpen(false)}
                className="p-1.5 rounded-md hover:bg-surface-ground text-charcoal-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              {/* Route Summary */}
              <div className="bg-surface-ground p-3 rounded-lg border border-surface-border flex items-center justify-between text-xs">
                <div>
                  <div className="text-[10px] text-charcoal-500 font-medium uppercase">Source</div>
                  <div className="font-bold text-charcoal-900">{selectedTransfer.sourceWarehouse?.name}</div>
                  <div className="text-[10px] font-mono text-charcoal-600">{selectedTransfer.sourceWarehouse?.code}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-charcoal-400" />
                <div className="text-right">
                  <div className="text-[10px] text-charcoal-500 font-medium uppercase">Destination</div>
                  <div className="font-bold text-charcoal-900">{selectedTransfer.destinationWarehouse?.name}</div>
                  <div className="text-[10px] font-mono text-charcoal-600">{selectedTransfer.destinationWarehouse?.code}</div>
                </div>
              </div>

              {/* Timeline Cards */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 bg-surface-ground rounded border border-surface-border">
                  <div className="text-charcoal-500">Created by</div>
                  <div className="font-semibold text-charcoal-900">
                    {selectedTransfer.createdByUser?.displayName || 'System'}
                  </div>
                  <div className="text-[10px] text-charcoal-400">
                    {new Date(selectedTransfer.createdAt).toLocaleString()}
                  </div>
                </div>

                {selectedTransfer.dispatchedAt && (
                  <div className="p-2 bg-surface-ground rounded border border-surface-border">
                    <div className="text-charcoal-500">Dispatched by</div>
                    <div className="font-semibold text-charcoal-900">
                      {selectedTransfer.dispatchedByUser?.displayName || 'User'}
                    </div>
                    <div className="text-[10px] text-charcoal-400">
                      {new Date(selectedTransfer.dispatchedAt).toLocaleString()}
                    </div>
                  </div>
                )}

                {selectedTransfer.receivedAt && (
                  <div className="p-2 bg-surface-ground rounded border border-surface-border">
                    <div className="text-charcoal-500">Received by</div>
                    <div className="font-semibold text-charcoal-900">
                      {selectedTransfer.receivedByUser?.displayName || 'User'}
                    </div>
                    <div className="text-[10px] text-charcoal-400">
                      {new Date(selectedTransfer.receivedAt).toLocaleString()}
                    </div>
                  </div>
                )}

                {selectedTransfer.cancelledAt && (
                  <div className="p-2 bg-rose-50 rounded border border-rose-200 col-span-2 text-rose-900">
                    <div className="font-semibold">
                      Cancelled on {new Date(selectedTransfer.cancelledAt).toLocaleString()}
                    </div>
                    <div className="text-[11px] mt-0.5">
                      Reason: {selectedTransfer.cancellationReason}
                    </div>
                  </div>
                )}
              </div>

              {/* Items List */}
              <div>
                <div className="text-xs font-bold text-charcoal-800 mb-2">
                  Line Items ({selectedTransfer.items?.length || 0})
                </div>
                <div className="border border-surface-border rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-muted text-[10px] font-semibold text-charcoal-600 uppercase border-b border-surface-border">
                      <tr>
                        <th className="py-2 px-3">Product</th>
                        <th className="py-2 px-2">Batch</th>
                        <th className="py-2 px-2 text-right">Req</th>
                        <th className="py-2 px-2 text-right">Disp</th>
                        <th className="py-2 px-2 text-right">Recv</th>
                        <th className="py-2 px-3 text-right">In Transit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border">
                      {selectedTransfer.items?.map((item) => {
                        const inTransit = item.dispatchedQuantity - item.receivedQuantity;
                        return (
                          <tr key={item.id} className="hover:bg-surface-ground">
                            <td className="py-2 px-3">
                              <div className="font-semibold text-charcoal-900">{item.product?.name}</div>
                              <div className="text-[10px] text-charcoal-500 font-mono">{item.product?.sku}</div>
                            </td>
                            <td className="py-2 px-2">
                              <div className="font-mono text-brand-700 font-medium">{item.batchNumber}</div>
                              <div className="text-[10px] text-charcoal-400">
                                Exp: {new Date(item.expiryDate).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="py-2 px-2 text-right text-charcoal-700 font-medium">
                              {item.requestedQuantity}
                            </td>
                            <td className="py-2 px-2 text-right font-medium text-purple-700">
                              {item.dispatchedQuantity}
                            </td>
                            <td className="py-2 px-2 text-right font-bold text-emerald-700">
                              {item.receivedQuantity}
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-charcoal-900">
                              {inTransit > 0 ? (
                                <span className="text-purple-700 font-bold">+{inTransit}</span>
                              ) : (
                                <span className="text-charcoal-400">0</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
