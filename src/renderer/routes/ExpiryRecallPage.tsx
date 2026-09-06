import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  Archive,
  RefreshCw,
  Search,
  Plus,
  CheckCircle2,
  XCircle,
  Calendar,
  Layers,
  Eye,
  Sliders,
  X,
  Lock,
  Unlock,
} from 'lucide-react';
import {
  expiryApi,
  ExpiryMetrics,
  ExpiringBatchItem,
  QuarantineStockItem,
  ProductRecall,
  warehousesApi,
  Warehouse,
  productsApi,
  Product,
  batchesApi,
  Batch,
  masterDataApi,
  Manufacturer,
} from '../api';
import { useAuthStore } from '../store/authStore';
import { clsx } from 'clsx';

export const ExpiryRecallPage: React.FC = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.roles?.includes('ADMIN');
  const canManageQuarantine = isAdmin || user?.permissions?.includes('quarantine.manage');
  const canManageRecalls = isAdmin || user?.permissions?.includes('recalls.manage');

  // Active workspace tab
  const [activeTab, setActiveTab] = useState<'expiry' | 'quarantine' | 'recalls'>('expiry');

  // Master Data
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);

  // Notifications
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4500);
  };

  // ----------------------------------------------------
  // TAB 1: EXPIRY MANAGEMENT STATE
  // ----------------------------------------------------
  const [expiryMetrics, setExpiryMetrics] = useState<ExpiryMetrics | null>(null);
  const [expiringBatches, setExpiringBatches] = useState<ExpiringBatchItem[]>([]);
  const [loadingExpiry, setLoadingExpiry] = useState(false);
  const [thresholdDays, setThresholdDays] = useState<number>(90);
  const [expiryStatusFilter, setExpiryStatusFilter] = useState<string>('ALL_AFFECTED');
  const [expiryWarehouseFilter, setExpiryWarehouseFilter] = useState<string>('ALL');
  const [expiryManufacturerFilter, setExpiryManufacturerFilter] = useState<string>('ALL');
  const [expirySearch, setExpirySearch] = useState('');
  const [selectedBatchBreakdown, setSelectedBatchBreakdown] = useState<any | null>(null);
  const [isBreakdownModalOpen, setIsBreakdownModalOpen] = useState(false);

  // ----------------------------------------------------
  // TAB 2: QUARANTINE OPERATIONS STATE
  // ----------------------------------------------------
  const [quarantineStock, setQuarantineStock] = useState<QuarantineStockItem[]>([]);
  const [loadingQuarantine, setLoadingQuarantine] = useState(false);
  const [quarantineWhFilter, setQuarantineWhFilter] = useState<string>('ALL');
  const [quarantineSearch, setQuarantineSearch] = useState('');

  // Quarantine Move Modal (Standard -> Quarantine)
  const [isQuarantineMoveOpen, setIsQuarantineMoveOpen] = useState(false);
  const [moveSourceWhId, setMoveSourceWhId] = useState('');
  const [moveDestWhId, setMoveDestWhId] = useState('');
  const [moveProductId, setMoveProductId] = useState('');
  const [moveBatchId, setMoveBatchId] = useState('');
  const [moveQuantity, setMoveQuantity] = useState<number>(1);
  const [moveReason, setMoveReason] = useState('Suspected Damage / Cold Chain Hold');
  const [moveNotes, setMoveNotes] = useState('');
  const [submittingMove, setSubmittingMove] = useState(false);
  const [productBatchesForMove, setProductBatchesForMove] = useState<Batch[]>([]);

  // Quarantine Release Modal (Quarantine -> Standard)
  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);
  const [releaseItem, setReleaseItem] = useState<QuarantineStockItem | null>(null);
  const [releaseDestWhId, setReleaseDestWhId] = useState('');
  const [releaseQuantity, setReleaseQuantity] = useState<number>(1);
  const [releaseReason, setReleaseReason] = useState('Passed Quality Assurance');
  const [releaseNotes, setReleaseNotes] = useState('');
  const [submittingRelease, setSubmittingRelease] = useState(false);

  // ----------------------------------------------------
  // TAB 3: PRODUCT RECALLS STATE
  // ----------------------------------------------------
  const [recalls, setRecalls] = useState<ProductRecall[]>([]);
  const [loadingRecalls, setLoadingRecalls] = useState(false);
  const [recallStatusFilter, setRecallStatusFilter] = useState<string>('ALL');
  const [recallSeverityFilter, setRecallSeverityFilter] = useState<string>('ALL');
  const [recallSearch, setRecallSearch] = useState('');

  // Create Recall Modal
  const [isCreateRecallOpen, setIsCreateRecallOpen] = useState(false);
  const [newRecallProductId, setNewRecallProductId] = useState('');
  const [newRecallBatchId, setNewRecallBatchId] = useState('');
  const [newRecallReason, setNewRecallReason] = useState('');
  const [newRecallSeverity, setNewRecallSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('HIGH');
  const [newRecallNotes, setNewRecallNotes] = useState('');
  const [newRecallAutoQuarantine, setNewRecallAutoQuarantine] = useState(true);
  const [submittingCreateRecall, setSubmittingCreateRecall] = useState(false);
  const [productBatchesForRecall, setProductBatchesForRecall] = useState<Batch[]>([]);

  // Recall Details & Status Update Modal
  const [selectedRecall, setSelectedRecall] = useState<ProductRecall | null>(null);
  const [isRecallDetailsOpen, setIsRecallDetailsOpen] = useState(false);
  const [isUpdateStatusOpen, setIsUpdateStatusOpen] = useState(false);
  const [updateStatusValue, setUpdateStatusValue] = useState<'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED'>('IN_PROGRESS');
  const [updateStatusNotes, setUpdateStatusNotes] = useState('');
  const [updateCancellationReason, setUpdateCancellationReason] = useState('');
  const [submittingStatusUpdate, setSubmittingStatusUpdate] = useState(false);

  // ----------------------------------------------------
  // MASTER DATA FETCHING
  // ----------------------------------------------------
  const fetchMasterData = async () => {
    try {
      const [whRes, prodRes, manRes] = await Promise.all([
        warehousesApi.getWarehouses(),
        productsApi.getProducts({ limit: 500 }),
        masterDataApi.getManufacturers(),
      ]);
      setWarehouses(whRes);
      setProducts(prodRes.items || []);
      setManufacturers(manRes || []);
    } catch (err: any) {
      console.error('Failed to load master data:', err);
    }
  };

  useEffect(() => {
    fetchMasterData();
  }, []);

  // ----------------------------------------------------
  // TAB 1: EXPIRY FETCHING
  // ----------------------------------------------------
  const loadExpiryData = useCallback(async () => {
    setLoadingExpiry(true);
    try {
      const [metricsRes, batchesRes] = await Promise.all([
        expiryApi.getMetrics(undefined, '30,60,90,180'),
        expiryApi.getBatches({
          thresholdDays,
          status: expiryStatusFilter as any,
          warehouseId: expiryWarehouseFilter !== 'ALL' ? expiryWarehouseFilter : undefined,
          manufacturerId: expiryManufacturerFilter !== 'ALL' ? expiryManufacturerFilter : undefined,
          search: expirySearch.trim() || undefined,
          limit: 100,
        }),
      ]);
      setExpiryMetrics(metricsRes);
      setExpiringBatches(batchesRes.data);
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Failed to load expiry data');
    } finally {
      setLoadingExpiry(false);
    }
  }, [thresholdDays, expiryStatusFilter, expiryWarehouseFilter, expiryManufacturerFilter, expirySearch]);

  // ----------------------------------------------------
  // TAB 2: QUARANTINE FETCHING
  // ----------------------------------------------------
  const loadQuarantineData = useCallback(async () => {
    setLoadingQuarantine(true);
    try {
      const res = await expiryApi.getQuarantineStock({
        warehouseId: quarantineWhFilter !== 'ALL' ? quarantineWhFilter : undefined,
        search: quarantineSearch.trim() || undefined,
        limit: 100,
      });
      setQuarantineStock(res.data);
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Failed to load quarantine stock');
    } finally {
      setLoadingQuarantine(false);
    }
  }, [quarantineWhFilter, quarantineSearch]);

  // ----------------------------------------------------
  // TAB 3: RECALLS FETCHING
  // ----------------------------------------------------
  const loadRecallsData = useCallback(async () => {
    setLoadingRecalls(true);
    try {
      const res = await expiryApi.getRecalls({
        status: recallStatusFilter !== 'ALL' ? (recallStatusFilter as any) : undefined,
        severity: recallSeverityFilter !== 'ALL' ? (recallSeverityFilter as any) : undefined,
        search: recallSearch.trim() || undefined,
        limit: 100,
      });
      setRecalls(res.data);
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Failed to load product recalls');
    } finally {
      setLoadingRecalls(false);
    }
  }, [recallStatusFilter, recallSeverityFilter, recallSearch]);

  // Tab change trigger
  useEffect(() => {
    if (activeTab === 'expiry') loadExpiryData();
    else if (activeTab === 'quarantine') loadQuarantineData();
    else if (activeTab === 'recalls') loadRecallsData();
  }, [activeTab, loadExpiryData, loadQuarantineData, loadRecallsData]);

  // Load batches when product is selected in Quarantine Move
  const handleMoveProductChange = async (productId: string) => {
    setMoveProductId(productId);
    setMoveBatchId('');
    if (!productId) {
      setProductBatchesForMove([]);
      return;
    }
    try {
      const res = await batchesApi.getBatchesByProduct(productId);
      setProductBatchesForMove(res || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Load batches when product is selected in Create Recall
  const handleRecallProductChange = async (productId: string) => {
    setNewRecallProductId(productId);
    setNewRecallBatchId('');
    if (!productId) {
      setProductBatchesForRecall([]);
      return;
    }
    try {
      const res = await batchesApi.getBatchesByProduct(productId);
      setProductBatchesForRecall(res || []);
    } catch (err) {
      console.error(err);
    }
  };

  // ----------------------------------------------------
  // HANDLERS: TAB 1 (EXPIRY)
  // ----------------------------------------------------
  const handleOpenBreakdown = async (batchId: string) => {
    try {
      const data = await expiryApi.getBatchBreakdown(batchId);
      setSelectedBatchBreakdown(data);
      setIsBreakdownModalOpen(true);
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Failed to fetch batch breakdown');
    }
  };

  const handleQuickQuarantineFromExpiry = (batch: ExpiringBatchItem) => {
    // Prefill Quarantine Move modal with standard warehouse having stock
    const stdWh = warehouses.find((w) => w.warehouseType === 'STANDARD' && w.isDefault) ||
      warehouses.find((w) => w.warehouseType === 'STANDARD');
    const quarWh = warehouses.find((w) => w.warehouseType === 'QUARANTINE' && w.isDefault) ||
      warehouses.find((w) => w.warehouseType === 'QUARANTINE');

    if (stdWh) setMoveSourceWhId(stdWh.id);
    if (quarWh) setMoveDestWhId(quarWh.id);

    setMoveProductId(batch.product.id);
    setMoveBatchId(batch.id);
    setMoveQuantity(batch.standardQuantity > 0 ? batch.standardQuantity : 1);
    setMoveReason(batch.isExpired ? 'Expired Stock Segregation' : `Near-Expiry Stock (${batch.daysToExpiry}d remaining)`);
    setMoveNotes('');

    // Fetch batches for this product so selector works
    batchesApi.getBatchesByProduct(batch.product.id).then((res) => {
      setProductBatchesForMove(res || []);
      setIsQuarantineMoveOpen(true);
    });
  };

  // ----------------------------------------------------
  // HANDLERS: TAB 2 (QUARANTINE OPERATIONS)
  // ----------------------------------------------------
  const handleSubmitQuarantineMove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moveSourceWhId || !moveDestWhId || !moveBatchId || moveQuantity <= 0) {
      showNotification('error', 'Please fill in all required fields with valid values');
      return;
    }
    setSubmittingMove(true);
    try {
      await expiryApi.moveStockToQuarantine({
        sourceWarehouseId: moveSourceWhId,
        destinationWarehouseId: moveDestWhId,
        batchId: moveBatchId,
        quantity: moveQuantity,
        reason: moveReason,
        notes: moveNotes.trim() || undefined,
      });
      showNotification('success', 'Physical stock successfully transferred to Quarantine warehouse');
      setIsQuarantineMoveOpen(false);
      if (activeTab === 'expiry') loadExpiryData();
      else if (activeTab === 'quarantine') loadQuarantineData();
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Quarantine movement failed');
    } finally {
      setSubmittingMove(false);
    }
  };

  const handleOpenReleaseModal = (item: QuarantineStockItem) => {
    setReleaseItem(item);
    const stdWh = warehouses.find((w) => w.warehouseType === 'STANDARD' && w.isDefault) ||
      warehouses.find((w) => w.warehouseType === 'STANDARD');
    if (stdWh) setReleaseDestWhId(stdWh.id);
    setReleaseQuantity(item.quantity);
    setReleaseReason('Passed Quality Assurance');
    setReleaseNotes('');
    setIsReleaseModalOpen(true);
  };

  const handleSubmitQuarantineRelease = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!releaseItem || !releaseDestWhId || releaseQuantity <= 0) {
      showNotification('error', 'Please select a destination warehouse and valid quantity');
      return;
    }
    setSubmittingRelease(true);
    try {
      await expiryApi.releaseQuarantineStock({
        sourceWarehouseId: releaseItem.warehouseId,
        destinationWarehouseId: releaseDestWhId,
        batchId: releaseItem.batchId,
        quantity: releaseQuantity,
        reason: releaseReason,
        notes: releaseNotes.trim() || undefined,
      });
      showNotification('success', 'Stock successfully released back to Standard saleable inventory');
      setIsReleaseModalOpen(false);
      loadQuarantineData();
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Stock release failed');
    } finally {
      setSubmittingRelease(false);
    }
  };

  // ----------------------------------------------------
  // HANDLERS: TAB 3 (PRODUCT RECALLS)
  // ----------------------------------------------------
  const handleSubmitCreateRecall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecallProductId || !newRecallBatchId || !newRecallReason.trim()) {
      showNotification('error', 'Please select product, batch, and provide a recall reason');
      return;
    }
    setSubmittingCreateRecall(true);
    try {
      const created = await expiryApi.createRecall({
        productId: newRecallProductId,
        batchId: newRecallBatchId,
        reason: newRecallReason.trim(),
        severity: newRecallSeverity,
        notes: newRecallNotes.trim() || undefined,
        autoQuarantine: newRecallAutoQuarantine,
      });
      showNotification('success', `Product Recall ${created.recallNumber} created successfully`);
      setIsCreateRecallOpen(false);
      setNewRecallProductId('');
      setNewRecallBatchId('');
      setNewRecallReason('');
      setNewRecallNotes('');
      loadRecallsData();
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Recall creation failed');
    } finally {
      setSubmittingCreateRecall(false);
    }
  };

  const handleOpenStatusUpdateModal = (recall: ProductRecall) => {
    setSelectedRecall(recall);
    setUpdateStatusValue(recall.status === 'OPEN' ? 'IN_PROGRESS' : recall.status);
    setUpdateStatusNotes('');
    setUpdateCancellationReason('');
    setIsUpdateStatusOpen(true);
  };

  const handleSubmitStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecall) return;
    if (updateStatusValue === 'CANCELLED' && !updateCancellationReason.trim()) {
      showNotification('error', 'Cancellation reason is mandatory when cancelling a recall');
      return;
    }
    setSubmittingStatusUpdate(true);
    try {
      await expiryApi.updateRecallStatus(selectedRecall.id, {
        status: updateStatusValue,
        notes: updateStatusNotes.trim() || undefined,
        cancellationReason: updateCancellationReason.trim() || undefined,
      });
      showNotification('success', `Recall ${selectedRecall.recallNumber} status updated to ${updateStatusValue}`);
      setIsUpdateStatusOpen(false);
      loadRecallsData();
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Status update failed');
    } finally {
      setSubmittingStatusUpdate(false);
    }
  };

  const handleQuarantineRecalledStock = async (recall: ProductRecall) => {
    try {
      const res: any = await expiryApi.quarantineRecalledStock(recall.id);
      showNotification('success', res.message || 'Recalled stock quarantined successfully');
      loadRecallsData();
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Failed to quarantine recalled stock');
    }
  };

  const handleViewRecallDetails = (recall: ProductRecall) => {
    setSelectedRecall(recall);
    setIsRecallDetailsOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={clsx(
            'fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all duration-300 border',
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200',
          )}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          ) : (
            <XCircle className="h-5 w-5 text-rose-600" />
          )}
          <span>{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            className="ml-2 text-charcoal-400 hover:text-charcoal-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header & Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-50 border border-amber-200/60 text-amber-700">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-charcoal-900">Expiry Management & Recall Operations</h1>
              <p className="text-xs text-charcoal-500">
                Track expiring batches, enforce automatic FEFO protection, quarantine damaged lots, and execute product recalls.
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Bar */}
        <div className="flex items-center gap-2">
          {activeTab === 'quarantine' && canManageQuarantine && (
            <button
              onClick={() => {
                const stdWh = warehouses.find((w) => w.warehouseType === 'STANDARD' && w.isDefault) ||
                  warehouses.find((w) => w.warehouseType === 'STANDARD');
                const quarWh = warehouses.find((w) => w.warehouseType === 'QUARANTINE' && w.isDefault) ||
                  warehouses.find((w) => w.warehouseType === 'QUARANTINE');
                if (stdWh) setMoveSourceWhId(stdWh.id);
                if (quarWh) setMoveDestWhId(quarWh.id);
                setMoveProductId('');
                setMoveBatchId('');
                setMoveQuantity(1);
                setIsQuarantineMoveOpen(true);
              }}
              className="btn btn-primary flex items-center gap-2 text-xs"
            >
              <Lock className="h-4 w-4" />
              <span>Quarantine Stock</span>
            </button>
          )}

          {activeTab === 'recalls' && canManageRecalls && (
            <button
              onClick={() => {
                setNewRecallProductId('');
                setNewRecallBatchId('');
                setNewRecallReason('');
                setNewRecallNotes('');
                setIsCreateRecallOpen(true);
              }}
              className="btn btn-danger flex items-center gap-2 text-xs"
            >
              <AlertTriangle className="h-4 w-4" />
              <span>Create Product Recall</span>
            </button>
          )}

          <button
            onClick={() => {
              if (activeTab === 'expiry') loadExpiryData();
              else if (activeTab === 'quarantine') loadQuarantineData();
              else if (activeTab === 'recalls') loadRecallsData();
            }}
            className="btn btn-secondary flex items-center gap-2 text-xs"
            title="Refresh Data"
          >
            <RefreshCw className={clsx('h-4 w-4', (loadingExpiry || loadingQuarantine || loadingRecalls) && 'animate-spin')} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-surface-border">
        <nav className="flex space-x-4">
          <button
            onClick={() => setActiveTab('expiry')}
            className={clsx(
              'flex items-center gap-2 py-2.5 px-3 border-b-2 text-xs font-semibold transition-colors',
              activeTab === 'expiry'
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-charcoal-500 hover:text-charcoal-800 hover:border-charcoal-300',
            )}
          >
            <Calendar className="h-4 w-4" />
            <span>Expiry Management</span>
            {expiryMetrics && expiryMetrics.expired.batchCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                {expiryMetrics.expired.batchCount} expired
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('quarantine')}
            className={clsx(
              'flex items-center gap-2 py-2.5 px-3 border-b-2 text-xs font-semibold transition-colors',
              activeTab === 'quarantine'
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-charcoal-500 hover:text-charcoal-800 hover:border-charcoal-300',
            )}
          >
            <Archive className="h-4 w-4" />
            <span>Quarantine Operations</span>
            {quarantineStock.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                {quarantineStock.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('recalls')}
            className={clsx(
              'flex items-center gap-2 py-2.5 px-3 border-b-2 text-xs font-semibold transition-colors',
              activeTab === 'recalls'
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-charcoal-500 hover:text-charcoal-800 hover:border-charcoal-300',
            )}
          >
            <ShieldAlert className="h-4 w-4" />
            <span>Product Recalls</span>
            {recalls.filter((r) => r.status === 'OPEN' || r.status === 'IN_PROGRESS').length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                {recalls.filter((r) => r.status === 'OPEN' || r.status === 'IN_PROGRESS').length} Active
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: EXPIRY MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'expiry' && (
        <div className="space-y-6">
          {/* KPI Summary Cards */}
          {expiryMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Already Expired */}
              <div className="card p-4 bg-gradient-to-br from-rose-50 to-white border-rose-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-rose-800">
                    Already Expired
                  </span>
                  <div className="p-2 rounded-lg bg-rose-100 text-rose-700">
                    <XCircle className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-2">
                  <div className="text-2xl font-bold text-rose-900">
                    {expiryMetrics.expired.batchCount}{' '}
                    <span className="text-xs font-medium text-rose-700">batches</span>
                  </div>
                  <div className="flex items-center justify-between mt-1 text-xs text-rose-700">
                    <span>{expiryMetrics.expired.totalQuantity.toLocaleString()} total units</span>
                    <span className="font-semibold">Rs. {expiryMetrics.expired.totalValuation.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Soon Expiring (<= 30 Days) */}
              {(() => {
                const metric30 = expiryMetrics.thresholds.find((t) => t.thresholdDays === 30) || {
                  batchCount: 0,
                  totalQuantity: 0,
                  totalValuation: 0,
                };
                return (
                  <div className="card p-4 bg-gradient-to-br from-amber-50 to-white border-amber-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">
                        Expiring $\le$ 30 Days
                      </span>
                      <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="text-2xl font-bold text-amber-900">
                        {metric30.batchCount}{' '}
                        <span className="text-xs font-medium text-amber-700">batches</span>
                      </div>
                      <div className="flex items-center justify-between mt-1 text-xs text-amber-700">
                        <span>{metric30.totalQuantity.toLocaleString()} units</span>
                        <span className="font-semibold">Rs. {metric30.totalValuation.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Card 3: Expiring (<= 90 Days) */}
              {(() => {
                const metric90 = expiryMetrics.thresholds.find((t) => t.thresholdDays === 90) || {
                  batchCount: 0,
                  totalQuantity: 0,
                  totalValuation: 0,
                };
                return (
                  <div className="card p-4 bg-gradient-to-br from-blue-50 to-white border-blue-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-blue-800">
                        Expiring $\le$ 90 Days
                      </span>
                      <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                        <Calendar className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="text-2xl font-bold text-blue-900">
                        {metric90.batchCount}{' '}
                        <span className="text-xs font-medium text-blue-700">batches</span>
                      </div>
                      <div className="flex items-center justify-between mt-1 text-xs text-blue-700">
                        <span>{metric90.totalQuantity.toLocaleString()} units</span>
                        <span className="font-semibold">Rs. {metric90.totalValuation.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Card 4: Warehouse Breakdown */}
              <div className="card p-4 bg-gradient-to-br from-slate-50 to-white border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-700">
                    Stock Segregation
                  </span>
                  <div className="p-2 rounded-lg bg-slate-100 text-charcoal-700">
                    <Layers className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-2 space-y-1 text-xs">
                  <div className="flex justify-between text-charcoal-700">
                    <span className="font-medium text-emerald-700">Standard Saleable:</span>
                    <span>
                      {expiryMetrics.warehouseBreakdown.standard.quantity.toLocaleString()} units (Rs.{' '}
                      {expiryMetrics.warehouseBreakdown.standard.valuation.toLocaleString()})
                    </span>
                  </div>
                  <div className="flex justify-between text-charcoal-700">
                    <span className="font-medium text-amber-700">Quarantine Hold:</span>
                    <span>
                      {expiryMetrics.warehouseBreakdown.quarantine.quantity.toLocaleString()} units (Rs.{' '}
                      {expiryMetrics.warehouseBreakdown.quarantine.valuation.toLocaleString()})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Expiry Filter Bar */}
          <div className="card p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-charcoal-400" />
                <input
                  type="text"
                  placeholder="Search SKU, Product, Batch..."
                  value={expirySearch}
                  onChange={(e) => setExpirySearch(e.target.value)}
                  className="input pl-9 text-xs w-full"
                />
              </div>

              {/* Threshold Selector */}
              <div>
                <select
                  value={thresholdDays}
                  onChange={(e) => setThresholdDays(Number(e.target.value))}
                  className="input text-xs w-full"
                >
                  <option value={30}>Threshold: $\le$ 30 Days (Critical)</option>
                  <option value={60}>Threshold: $\le$ 60 Days</option>
                  <option value={90}>Threshold: $\le$ 90 Days (Quarterly)</option>
                  <option value={180}>Threshold: $\le$ 180 Days (Half Year)</option>
                  <option value={365}>Threshold: $\le$ 365 Days (1 Year)</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={expiryStatusFilter}
                  onChange={(e) => setExpiryStatusFilter(e.target.value)}
                  className="input text-xs w-full"
                >
                  <option value="ALL_AFFECTED">Status: All Impacted (Expired + Expiring)</option>
                  <option value="EXPIRED">Status: Expired Only</option>
                  <option value="EXPIRING_SOON">Status: Expiring Soon Only</option>
                  <option value="ALL">Status: All Active Lots</option>
                </select>
              </div>

              {/* Warehouse Filter */}
              <div>
                <select
                  value={expiryWarehouseFilter}
                  onChange={(e) => setExpiryWarehouseFilter(e.target.value)}
                  className="input text-xs w-full"
                >
                  <option value="ALL">Warehouse: All Locations</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.warehouseType})
                    </option>
                  ))}
                </select>
              </div>

              {/* Manufacturer Filter */}
              <div>
                <select
                  value={expiryManufacturerFilter}
                  onChange={(e) => setExpiryManufacturerFilter(e.target.value)}
                  className="input text-xs w-full"
                >
                  <option value="ALL">Manufacturer: All</option>
                  {manufacturers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Expiring Batches Table */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table w-full text-left">
                <thead>
                  <tr className="bg-surface-muted border-b border-surface-border text-[11px] font-semibold text-charcoal-600 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Product & SKU</th>
                    <th className="py-2.5 px-3">Batch Number</th>
                    <th className="py-2.5 px-3">Expiry Date</th>
                    <th className="py-2.5 px-3">Aging Status</th>
                    <th className="py-2.5 px-3 text-right">Standard Stock</th>
                    <th className="py-2.5 px-3 text-right">Quarantine Stock</th>
                    <th className="py-2.5 px-3 text-right">Total Units</th>
                    <th className="py-2.5 px-3 text-right">Stock Valuation</th>
                    <th className="py-2.5 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border text-xs text-charcoal-800">
                  {loadingExpiry ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-charcoal-500">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto text-brand-600 mb-2" />
                        Analyzing inventory aging & expiry data...
                      </td>
                    </tr>
                  ) : expiringBatches.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-charcoal-500">
                        <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                        No expired or near-expiry batches found for selected threshold and filters.
                      </td>
                    </tr>
                  ) : (
                    expiringBatches.map((b) => (
                      <tr key={b.id} className="hover:bg-surface-muted/50 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-charcoal-900">{b.product.name}</div>
                          <div className="text-[11px] text-charcoal-500 flex items-center gap-1.5">
                            <span>SKU: {b.product.sku}</span>
                            {b.product.manufacturer && (
                              <span>• {b.product.manufacturer.name}</span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-medium">
                          {b.batchNumber}
                          {b.status === 'RECALLED' && (
                            <span className="ml-1.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-600 text-white">
                              RECALLED
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          {new Date(b.expiryDate).toLocaleDateString()}
                        </td>
                        <td className="py-2.5 px-3">
                          {b.isExpired ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800">
                              <XCircle className="h-3 w-3" />
                              Expired ({Math.abs(b.daysToExpiry)}d ago)
                            </span>
                          ) : b.daysToExpiry <= 30 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-900">
                              <AlertTriangle className="h-3 w-3" />
                              Critical ({b.daysToExpiry}d left)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-800">
                              <Calendar className="h-3 w-3" />
                              {b.daysToExpiry} days left
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium text-emerald-700">
                          {b.standardQuantity.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium text-amber-700">
                          {b.quarantineQuantity.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-charcoal-900">
                          {b.totalQuantity.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold">
                          Rs. {b.totalValuation.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenBreakdown(b.id)}
                              className="p-1 rounded hover:bg-surface-muted text-charcoal-600 hover:text-brand-600"
                              title="Warehouse Locations Breakdown"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {canManageQuarantine && b.standardQuantity > 0 && (
                              <button
                                onClick={() => handleQuickQuarantineFromExpiry(b)}
                                className="px-2 py-1 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 flex items-center gap-1"
                                title="Move to Quarantine Warehouse"
                              >
                                <Lock className="h-3 w-3" />
                                <span>Quarantine</span>
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
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: QUARANTINE OPERATIONS */}
      {/* ========================================================================= */}
      {activeTab === 'quarantine' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="card p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-charcoal-400" />
                <input
                  type="text"
                  placeholder="Search Product, Batch, Reason..."
                  value={quarantineSearch}
                  onChange={(e) => setQuarantineSearch(e.target.value)}
                  className="input pl-9 text-xs w-full"
                />
              </div>

              <div>
                <select
                  value={quarantineWhFilter}
                  onChange={(e) => setQuarantineWhFilter(e.target.value)}
                  className="input text-xs w-full"
                >
                  <option value="ALL">All Quarantine Warehouses</option>
                  {warehouses
                    .filter((w) => w.warehouseType === 'QUARANTINE')
                    .map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.code})
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex justify-end">
                {canManageQuarantine && (
                  <button
                    onClick={() => {
                      const stdWh = warehouses.find((w) => w.warehouseType === 'STANDARD' && w.isDefault) ||
                        warehouses.find((w) => w.warehouseType === 'STANDARD');
                      const quarWh = warehouses.find((w) => w.warehouseType === 'QUARANTINE' && w.isDefault) ||
                        warehouses.find((w) => w.warehouseType === 'QUARANTINE');
                      if (stdWh) setMoveSourceWhId(stdWh.id);
                      if (quarWh) setMoveDestWhId(quarWh.id);
                      setMoveProductId('');
                      setMoveBatchId('');
                      setMoveQuantity(1);
                      setIsQuarantineMoveOpen(true);
                    }}
                    className="btn btn-primary flex items-center gap-2 text-xs"
                  >
                    <Lock className="h-4 w-4" />
                    <span>Quarantine Stock</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Quarantined Inventory Table */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table w-full text-left">
                <thead>
                  <tr className="bg-surface-muted border-b border-surface-border text-[11px] font-semibold text-charcoal-600 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Quarantine Warehouse</th>
                    <th className="py-2.5 px-3">Product & SKU</th>
                    <th className="py-2.5 px-3">Batch & Expiry</th>
                    <th className="py-2.5 px-3">Batch Status</th>
                    <th className="py-2.5 px-3 text-right">Quarantined Quantity</th>
                    <th className="py-2.5 px-3 text-right">Stock Valuation</th>
                    <th className="py-2.5 px-3">Reason / Source</th>
                    <th className="py-2.5 px-3">Date Quarantined</th>
                    <th className="py-2.5 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border text-xs text-charcoal-800">
                  {loadingQuarantine ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-charcoal-500">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto text-brand-600 mb-2" />
                        Loading quarantined inventory...
                      </td>
                    </tr>
                  ) : quarantineStock.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-charcoal-500">
                        <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                        No inventory currently held in quarantine.
                      </td>
                    </tr>
                  ) : (
                    quarantineStock.map((item) => {
                      const canRelease =
                        !item.isExpired && item.batchStatus !== 'RECALLED';

                      return (
                        <tr key={`${item.warehouseId}_${item.batchId}`} className="hover:bg-surface-muted/50">
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-charcoal-900">{item.warehouseName}</div>
                            <div className="text-[11px] text-charcoal-500 font-mono">{item.warehouseCode}</div>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-charcoal-900">{item.productName}</div>
                            <div className="text-[11px] text-charcoal-500">SKU: {item.productSku}</div>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-mono font-medium">{item.batchNumber}</div>
                            <div className="text-[11px] text-charcoal-500">
                              Exp: {new Date(item.expiryDate).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            {item.batchStatus === 'RECALLED' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white">
                                RECALLED
                              </span>
                            ) : item.isExpired ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                                EXPIRED
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-800">
                                ACTIVE HOLD
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-amber-900">
                            {item.quantity.toLocaleString()} {item.unitSymbol || 'units'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-semibold">
                            Rs. {item.totalValuation.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-charcoal-600 max-w-xs truncate" title={item.latestReason || ''}>
                            {item.latestReason || 'Manual quarantine'}
                          </td>
                          <td className="py-2.5 px-3 text-charcoal-500">
                            {new Date(item.latestMovementDate).toLocaleDateString()}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {canManageQuarantine && (
                              <button
                                onClick={() => handleOpenReleaseModal(item)}
                                disabled={!canRelease}
                                className={clsx(
                                  'px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 mx-auto',
                                  canRelease
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                                    : 'bg-slate-100 text-charcoal-400 border border-slate-200 cursor-not-allowed',
                                )}
                                title={
                                  !canRelease
                                    ? item.isExpired
                                      ? 'Cannot release expired stock'
                                      : 'Cannot release recalled stock'
                                    : 'Release to Standard Saleable Inventory'
                                }
                              >
                                <Unlock className="h-3 w-3" />
                                <span>Release</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PRODUCT RECALLS */}
      {/* ========================================================================= */}
      {activeTab === 'recalls' && (
        <div className="space-y-6">
          {/* Recalls Filter Bar */}
          <div className="card p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-charcoal-400" />
                <input
                  type="text"
                  placeholder="Search Recall #, Product, Batch, Reason..."
                  value={recallSearch}
                  onChange={(e) => setRecallSearch(e.target.value)}
                  className="input pl-9 text-xs w-full"
                />
              </div>

              <div>
                <select
                  value={recallStatusFilter}
                  onChange={(e) => setRecallStatusFilter(e.target.value)}
                  className="input text-xs w-full"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="OPEN">OPEN</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="RESOLVED">RESOLVED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div>
                <select
                  value={recallSeverityFilter}
                  onChange={(e) => setRecallSeverityFilter(e.target.value)}
                  className="input text-xs w-full"
                >
                  <option value="ALL">All Severities</option>
                  <option value="CRITICAL">CRITICAL</option>
                  <option value="HIGH">HIGH</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LOW">LOW</option>
                </select>
              </div>

              <div className="flex justify-end">
                {canManageRecalls && (
                  <button
                    onClick={() => {
                      setNewRecallProductId('');
                      setNewRecallBatchId('');
                      setNewRecallReason('');
                      setNewRecallNotes('');
                      setIsCreateRecallOpen(true);
                    }}
                    className="btn btn-danger flex items-center gap-2 text-xs"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create Recall</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Recalls Table */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table w-full text-left">
                <thead>
                  <tr className="bg-surface-muted border-b border-surface-border text-[11px] font-semibold text-charcoal-600 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Recall Reference</th>
                    <th className="py-2.5 px-3">Product & Batch</th>
                    <th className="py-2.5 px-3">Severity</th>
                    <th className="py-2.5 px-3">Recall Status</th>
                    <th className="py-2.5 px-3">Recall Reason</th>
                    <th className="py-2.5 px-3 text-right">Standard Stock</th>
                    <th className="py-2.5 px-3 text-right">Quarantined Stock</th>
                    <th className="py-2.5 px-3 text-right">Total Affected</th>
                    <th className="py-2.5 px-3">Recall Date</th>
                    <th className="py-2.5 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border text-xs text-charcoal-800">
                  {loadingRecalls ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-charcoal-500">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto text-brand-600 mb-2" />
                        Loading product recall records...
                      </td>
                    </tr>
                  ) : recalls.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-charcoal-500">
                        <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                        No product recalls registered.
                      </td>
                    </tr>
                  ) : (
                    recalls.map((r) => (
                      <tr key={r.id} className="hover:bg-surface-muted/50">
                        <td className="py-2.5 px-3">
                          <div className="font-mono font-bold text-rose-700">{r.recallNumber}</div>
                          <div className="text-[11px] text-charcoal-500">
                            By: {r.createdByUser?.displayName || 'System'}
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-charcoal-900">{r.product.name}</div>
                          <div className="text-[11px] text-charcoal-600 font-mono">
                            Batch: <span className="font-semibold">{r.batch.batchNumber}</span> (Exp:{' '}
                            {new Date(r.batch.expiryDate).toLocaleDateString()})
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={clsx(
                              'px-2 py-0.5 rounded-full text-[10px] font-bold',
                              r.severity === 'CRITICAL' && 'bg-rose-600 text-white',
                              r.severity === 'HIGH' && 'bg-rose-100 text-rose-800',
                              r.severity === 'MEDIUM' && 'bg-amber-100 text-amber-900',
                              r.severity === 'LOW' && 'bg-blue-100 text-blue-800',
                            )}
                          >
                            {r.severity}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={clsx(
                              'px-2 py-0.5 rounded-full text-[10px] font-bold',
                              r.status === 'OPEN' && 'bg-rose-50 text-rose-700 border border-rose-200',
                              r.status === 'IN_PROGRESS' && 'bg-amber-50 text-amber-700 border border-amber-200',
                              r.status === 'RESOLVED' && 'bg-emerald-50 text-emerald-700 border border-emerald-200',
                              r.status === 'CANCELLED' && 'bg-slate-100 text-charcoal-600 border border-slate-200',
                            )}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 max-w-xs truncate" title={r.reason}>
                          {r.reason}
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold text-rose-700">
                          {r.stock.standardQuantity.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold text-amber-700">
                          {r.stock.quarantineQuantity.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-charcoal-900">
                          {r.stock.totalQuantity.toLocaleString()} units
                        </td>
                        <td className="py-2.5 px-3 text-charcoal-500">
                          {new Date(r.recallDate).toLocaleDateString()}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleViewRecallDetails(r)}
                              className="p-1 rounded hover:bg-surface-muted text-charcoal-600 hover:text-brand-600"
                              title="View Recall Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>

                            {canManageRecalls && r.stock.standardQuantity > 0 && (r.status === 'OPEN' || r.status === 'IN_PROGRESS') && (
                              <button
                                onClick={() => handleQuarantineRecalledStock(r)}
                                className="px-2 py-1 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 flex items-center gap-1"
                                title="Move remaining standard stock to Quarantine"
                              >
                                <Lock className="h-3 w-3" />
                                <span>Quarantine</span>
                              </button>
                            )}

                            {canManageRecalls && (
                              <button
                                onClick={() => handleOpenStatusUpdateModal(r)}
                                className="px-2 py-1 rounded text-[11px] font-semibold bg-slate-100 text-charcoal-700 hover:bg-slate-200 border border-slate-300 flex items-center gap-1"
                                title="Update Status"
                              >
                                <Sliders className="h-3 w-3" />
                                <span>Status</span>
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
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: BATCH WAREHOUSE BREAKDOWN */}
      {/* ========================================================================= */}
      {isBreakdownModalOpen && selectedBatchBreakdown && (
        <div className="fixed inset-0 z-50 bg-charcoal-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-card rounded-xl border border-surface-border shadow-2xl max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div>
                <h3 className="text-base font-bold text-charcoal-900">
                  Batch Warehouse Breakdown
                </h3>
                <p className="text-xs text-charcoal-500 font-mono">
                  {selectedBatchBreakdown.batch.batchNumber} • {selectedBatchBreakdown.product.name}
                </p>
              </div>
              <button
                onClick={() => setIsBreakdownModalOpen(false)}
                className="text-charcoal-400 hover:text-charcoal-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-surface-muted rounded-lg space-y-1">
                <div className="text-charcoal-500">Expiry Date:</div>
                <div className="font-semibold text-charcoal-900">
                  {new Date(selectedBatchBreakdown.batch.expiryDate).toLocaleDateString()}{' '}
                  {selectedBatchBreakdown.batch.isExpired ? (
                    <span className="text-rose-600 font-bold">(EXPIRED)</span>
                  ) : (
                    <span className="text-blue-600">({selectedBatchBreakdown.batch.daysToExpiry}d left)</span>
                  )}
                </div>
              </div>
              <div className="p-3 bg-surface-muted rounded-lg space-y-1">
                <div className="text-charcoal-500">Batch Status:</div>
                <div className="font-semibold text-charcoal-900">
                  {selectedBatchBreakdown.batch.status}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-charcoal-600">
                Physical Balances by Warehouse
              </h4>
              <div className="border border-surface-border rounded-lg overflow-hidden">
                <table className="table w-full text-xs text-left">
                  <thead className="bg-surface-muted text-charcoal-600 text-[11px]">
                    <tr>
                      <th className="py-2 px-3">Warehouse</th>
                      <th className="py-2 px-3">Type</th>
                      <th className="py-2 px-3 text-right">Physical Quantity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {selectedBatchBreakdown.warehouses.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-4 text-center text-charcoal-400">
                          No stock recorded across warehouses.
                        </td>
                      </tr>
                    ) : (
                      selectedBatchBreakdown.warehouses.map((w: any) => (
                        <tr key={w.warehouseId}>
                          <td className="py-2 px-3 font-medium">{w.warehouseName} ({w.warehouseCode})</td>
                          <td className="py-2 px-3">
                            <span
                              className={clsx(
                                'px-2 py-0.5 rounded text-[10px] font-semibold',
                                w.warehouseType === 'STANDARD' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800',
                              )}
                            >
                              {w.warehouseType}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right font-bold">{w.quantity.toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsBreakdownModalOpen(false)}
                className="btn btn-secondary text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: QUARANTINE STOCK MOVE (Standard -> Quarantine) */}
      {/* ========================================================================= */}
      {isQuarantineMoveOpen && (
        <div className="fixed inset-0 z-50 bg-charcoal-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-card rounded-xl border border-surface-border shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div className="flex items-center gap-2 text-amber-700">
                <Lock className="h-5 w-5" />
                <h3 className="text-base font-bold text-charcoal-900">
                  Quarantine Physical Stock
                </h3>
              </div>
              <button
                onClick={() => setIsQuarantineMoveOpen(false)}
                className="text-charcoal-400 hover:text-charcoal-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitQuarantineMove} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                {/* Source Standard Warehouse */}
                <div>
                  <label className="block text-charcoal-700 font-semibold mb-1">
                    Source Warehouse (Standard) *
                  </label>
                  <select
                    value={moveSourceWhId}
                    onChange={(e) => setMoveSourceWhId(e.target.value)}
                    required
                    className="input text-xs w-full"
                  >
                    <option value="">Select standard warehouse</option>
                    {warehouses
                      .filter((w) => w.warehouseType === 'STANDARD')
                      .map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name} ({w.code})
                        </option>
                      ))}
                  </select>
                </div>

                {/* Destination Quarantine Warehouse */}
                <div>
                  <label className="block text-charcoal-700 font-semibold mb-1">
                    Target Quarantine Warehouse *
                  </label>
                  <select
                    value={moveDestWhId}
                    onChange={(e) => setMoveDestWhId(e.target.value)}
                    required
                    className="input text-xs w-full"
                  >
                    <option value="">Select quarantine warehouse</option>
                    {warehouses
                      .filter((w) => w.warehouseType === 'QUARANTINE')
                      .map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name} ({w.code})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Product */}
              <div>
                <label className="block text-charcoal-700 font-semibold mb-1">
                  Product *
                </label>
                <select
                  value={moveProductId}
                  onChange={(e) => handleMoveProductChange(e.target.value)}
                  required
                  className="input text-xs w-full"
                >
                  <option value="">Select product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>

              {/* Batch */}
              <div>
                <label className="block text-charcoal-700 font-semibold mb-1">
                  Batch / Lot Number *
                </label>
                <select
                  value={moveBatchId}
                  onChange={(e) => setMoveBatchId(e.target.value)}
                  required
                  className="input text-xs w-full"
                  disabled={!moveProductId}
                >
                  <option value="">Select batch</option>
                  {productBatchesForMove.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.batchNumber} (Exp: {new Date(b.expiryDate).toLocaleDateString()}) - {b.status}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-charcoal-700 font-semibold mb-1">
                  Quantity to Quarantine *
                </label>
                <input
                  type="number"
                  min="1"
                  value={moveQuantity}
                  onChange={(e) => setMoveQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  required
                  className="input text-xs w-full"
                />
              </div>

              {/* Reason */}
              <div>
                <label className="block text-charcoal-700 font-semibold mb-1">
                  Quarantine Reason *
                </label>
                <input
                  type="text"
                  value={moveReason}
                  onChange={(e) => setMoveReason(e.target.value)}
                  required
                  placeholder="e.g. Broken packaging, Temperature excursion, QA hold..."
                  className="input text-xs w-full"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-charcoal-700 font-semibold mb-1">
                  Additional Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={moveNotes}
                  onChange={(e) => setMoveNotes(e.target.value)}
                  placeholder="Audit details / inspection observations..."
                  className="input text-xs w-full"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-border">
                <button
                  type="button"
                  onClick={() => setIsQuarantineMoveOpen(false)}
                  className="btn btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingMove}
                  className="btn btn-primary flex items-center gap-2 text-xs"
                >
                  {submittingMove && <RefreshCw className="h-3 w-3 animate-spin" />}
                  <span>Execute Quarantine</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: RELEASE QUARANTINE STOCK (Quarantine -> Standard) */}
      {/* ========================================================================= */}
      {isReleaseModalOpen && releaseItem && (
        <div className="fixed inset-0 z-50 bg-charcoal-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-card rounded-xl border border-surface-border shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div className="flex items-center gap-2 text-emerald-700">
                <Unlock className="h-5 w-5" />
                <h3 className="text-base font-bold text-charcoal-900">
                  Release Stock to Saleable Inventory
                </h3>
              </div>
              <button
                onClick={() => setIsReleaseModalOpen(false)}
                className="text-charcoal-400 hover:text-charcoal-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitQuarantineRelease} className="space-y-4 text-xs">
              <div className="p-3 bg-surface-muted rounded-lg space-y-1">
                <div className="font-semibold text-charcoal-900">{releaseItem.productName}</div>
                <div className="text-charcoal-600">
                  Batch: <span className="font-mono font-bold">{releaseItem.batchNumber}</span> (Exp:{' '}
                  {new Date(releaseItem.expiryDate).toLocaleDateString()})
                </div>
                <div className="text-charcoal-600">
                  Source: {releaseItem.warehouseName} • Quarantined Quantity: {releaseItem.quantity} units
                </div>
              </div>

              <div>
                <label className="block text-charcoal-700 font-semibold mb-1">
                  Destination Standard Warehouse *
                </label>
                <select
                  value={releaseDestWhId}
                  onChange={(e) => setReleaseDestWhId(e.target.value)}
                  required
                  className="input text-xs w-full"
                >
                  <option value="">Select standard saleable warehouse</option>
                  {warehouses
                    .filter((w) => w.warehouseType === 'STANDARD')
                    .map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.code})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-charcoal-700 font-semibold mb-1">
                  Quantity to Release (Max {releaseItem.quantity}) *
                </label>
                <input
                  type="number"
                  min="1"
                  max={releaseItem.quantity}
                  value={releaseQuantity}
                  onChange={(e) =>
                    setReleaseQuantity(
                      Math.min(releaseItem.quantity, Math.max(1, parseInt(e.target.value) || 1)),
                    )
                  }
                  required
                  className="input text-xs w-full"
                />
              </div>

              <div>
                <label className="block text-charcoal-700 font-semibold mb-1">
                  Release Reason / Authorization *
                </label>
                <input
                  type="text"
                  value={releaseReason}
                  onChange={(e) => setReleaseReason(e.target.value)}
                  required
                  placeholder="e.g. Passed QA inspection, Batch test verified..."
                  className="input text-xs w-full"
                />
              </div>

              <div>
                <label className="block text-charcoal-700 font-semibold mb-1">
                  Notes
                </label>
                <textarea
                  rows={2}
                  value={releaseNotes}
                  onChange={(e) => setReleaseNotes(e.target.value)}
                  placeholder="Inspection certificate / sign-off notes..."
                  className="input text-xs w-full"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-border">
                <button
                  type="button"
                  onClick={() => setIsReleaseModalOpen(false)}
                  className="btn btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRelease}
                  className="btn btn-primary flex items-center gap-2 text-xs"
                >
                  {submittingRelease && <RefreshCw className="h-3 w-3 animate-spin" />}
                  <span>Confirm Release</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE PRODUCT RECALL */}
      {/* ========================================================================= */}
      {isCreateRecallOpen && (
        <div className="fixed inset-0 z-50 bg-charcoal-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-card rounded-xl border border-surface-border shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div className="flex items-center gap-2 text-rose-700">
                <ShieldAlert className="h-5 w-5" />
                <h3 className="text-base font-bold text-charcoal-900">
                  Initiate Product Recall (Batch-Specific)
                </h3>
              </div>
              <button
                onClick={() => setIsCreateRecallOpen(false)}
                className="text-charcoal-400 hover:text-charcoal-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitCreateRecall} className="space-y-4 text-xs">
              <div>
                <label className="block text-charcoal-700 font-semibold mb-1">
                  Product *
                </label>
                <select
                  value={newRecallProductId}
                  onChange={(e) => handleRecallProductChange(e.target.value)}
                  required
                  className="input text-xs w-full"
                >
                  <option value="">Select product to recall</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-charcoal-700 font-semibold mb-1">
                  Affected Batch Number *
                </label>
                <select
                  value={newRecallBatchId}
                  onChange={(e) => setNewRecallBatchId(e.target.value)}
                  required
                  className="input text-xs w-full"
                  disabled={!newRecallProductId}
                >
                  <option value="">Select affected batch</option>
                  {productBatchesForRecall.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.batchNumber} (Exp: {new Date(b.expiryDate).toLocaleDateString()}) - {b.status}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-charcoal-500 mt-1">
                  Important: Recalls are batch-specific. Only this lot will be blocked from sales.
                </p>
              </div>

              <div>
                <label className="block text-charcoal-700 font-semibold mb-1">
                  Recall Severity *
                </label>
                <select
                  value={newRecallSeverity}
                  onChange={(e) => setNewRecallSeverity(e.target.value as any)}
                  required
                  className="input text-xs w-full"
                >
                  <option value="CRITICAL">CRITICAL (Immediate safety risk / regulatory alert)</option>
                  <option value="HIGH">HIGH (Defective formulation / labelling error)</option>
                  <option value="MEDIUM">MEDIUM (Minor packaging non-compliance)</option>
                  <option value="LOW">LOW (Voluntary manufacturer caution)</option>
                </select>
              </div>

              <div>
                <label className="block text-charcoal-700 font-semibold mb-1">
                  Recall Reason *
                </label>
                <input
                  type="text"
                  value={newRecallReason}
                  onChange={(e) => setNewRecallReason(e.target.value)}
                  required
                  placeholder="e.g. Regulatory Authority notice #892, Contamination alert..."
                  className="input text-xs w-full"
                />
              </div>

              <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-lg">
                <input
                  type="checkbox"
                  id="autoQuarantine"
                  checked={newRecallAutoQuarantine}
                  onChange={(e) => setNewRecallAutoQuarantine(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500"
                />
                <label htmlFor="autoQuarantine" className="text-xs text-rose-900 font-medium cursor-pointer">
                  Auto-quarantine all physical stock in standard warehouses immediately
                </label>
              </div>

              <div>
                <label className="block text-charcoal-700 font-semibold mb-1">
                  Additional Notes
                </label>
                <textarea
                  rows={2}
                  value={newRecallNotes}
                  onChange={(e) => setNewRecallNotes(e.target.value)}
                  placeholder="Notice references, supplier communications..."
                  className="input text-xs w-full"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-border">
                <button
                  type="button"
                  onClick={() => setIsCreateRecallOpen(false)}
                  className="btn btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCreateRecall}
                  className="btn btn-danger flex items-center gap-2 text-xs"
                >
                  {submittingCreateRecall && <RefreshCw className="h-3 w-3 animate-spin" />}
                  <span>Submit Product Recall</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: UPDATE RECALL STATUS */}
      {/* ========================================================================= */}
      {isUpdateStatusOpen && selectedRecall && (
        <div className="fixed inset-0 z-50 bg-charcoal-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-card rounded-xl border border-surface-border shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div>
                <h3 className="text-base font-bold text-charcoal-900">
                  Update Recall Status
                </h3>
                <p className="text-xs text-charcoal-500 font-mono">
                  {selectedRecall.recallNumber} • {selectedRecall.product.name}
                </p>
              </div>
              <button
                onClick={() => setIsUpdateStatusOpen(false)}
                className="text-charcoal-400 hover:text-charcoal-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitStatusUpdate} className="space-y-4 text-xs">
              <div>
                <label className="block text-charcoal-700 font-semibold mb-1">
                  New Status *
                </label>
                <select
                  value={updateStatusValue}
                  onChange={(e) => setUpdateStatusValue(e.target.value as any)}
                  required
                  className="input text-xs w-full"
                >
                  <option value="OPEN">OPEN</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="RESOLVED">RESOLVED (Restores active batch if non-expired)</option>
                  <option value="CANCELLED">CANCELLED (Void recall)</option>
                </select>
              </div>

              {updateStatusValue === 'CANCELLED' && (
                <div>
                  <label className="block text-charcoal-700 font-semibold mb-1">
                    Cancellation Reason *
                  </label>
                  <input
                    type="text"
                    value={updateCancellationReason}
                    onChange={(e) => setUpdateCancellationReason(e.target.value)}
                    required
                    placeholder="Reason for cancelling recall notice..."
                    className="input text-xs w-full"
                  />
                </div>
              )}

              <div>
                <label className="block text-charcoal-700 font-semibold mb-1">
                  Status Notes / Findings
                </label>
                <textarea
                  rows={3}
                  value={updateStatusNotes}
                  onChange={(e) => setUpdateStatusNotes(e.target.value)}
                  placeholder="Investigation progress / resolution outcome..."
                  className="input text-xs w-full"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-border">
                <button
                  type="button"
                  onClick={() => setIsUpdateStatusOpen(false)}
                  className="btn btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingStatusUpdate}
                  className="btn btn-primary flex items-center gap-2 text-xs"
                >
                  {submittingStatusUpdate && <RefreshCw className="h-3 w-3 animate-spin" />}
                  <span>Update Status</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: VIEW RECALL DETAILS */}
      {/* ========================================================================= */}
      {isRecallDetailsOpen && selectedRecall && (
        <div className="fixed inset-0 z-50 bg-charcoal-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-card rounded-xl border border-surface-border shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div>
                <h3 className="text-base font-bold text-rose-700">
                  Recall Details — {selectedRecall.recallNumber}
                </h3>
                <p className="text-xs text-charcoal-500">
                  Created on {new Date(selectedRecall.recallDate).toLocaleString()} by{' '}
                  {selectedRecall.createdByUser?.displayName || 'Admin'}
                </p>
              </div>
              <button
                onClick={() => setIsRecallDetailsOpen(false)}
                className="text-charcoal-400 hover:text-charcoal-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-surface-muted rounded-lg">
                <div className="text-charcoal-500">Status</div>
                <div className="font-bold text-charcoal-900">{selectedRecall.status}</div>
              </div>
              <div className="p-3 bg-surface-muted rounded-lg">
                <div className="text-charcoal-500">Severity</div>
                <div className="font-bold text-charcoal-900">{selectedRecall.severity}</div>
              </div>
              <div className="p-3 bg-surface-muted rounded-lg">
                <div className="text-charcoal-500">Product SKU</div>
                <div className="font-mono font-bold text-charcoal-900">{selectedRecall.product.sku}</div>
              </div>
              <div className="p-3 bg-surface-muted rounded-lg">
                <div className="text-charcoal-500">Batch Number</div>
                <div className="font-mono font-bold text-charcoal-900">{selectedRecall.batch.batchNumber}</div>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <div className="font-semibold text-charcoal-700">Recall Reason:</div>
              <div className="p-3 bg-surface-muted rounded-lg text-charcoal-800 font-medium">
                {selectedRecall.reason}
              </div>
            </div>

            {selectedRecall.notes && (
              <div className="space-y-1 text-xs">
                <div className="font-semibold text-charcoal-700">Notes & Directives:</div>
                <div className="p-3 bg-surface-muted rounded-lg text-charcoal-800">
                  {selectedRecall.notes}
                </div>
              </div>
            )}

            {/* Warehouse stock distribution */}
            <div className="space-y-2 text-xs">
              <h4 className="font-semibold uppercase tracking-wider text-charcoal-600">
                Current Warehouse Quantities
              </h4>
              <div className="border border-surface-border rounded-lg overflow-hidden">
                <table className="table w-full text-xs text-left">
                  <thead className="bg-surface-muted text-charcoal-600">
                    <tr>
                      <th className="py-2 px-3">Warehouse</th>
                      <th className="py-2 px-3">Warehouse Type</th>
                      <th className="py-2 px-3 text-right">Physical Units</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {selectedRecall.warehouses.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-3 text-center text-charcoal-400">
                          Zero physical stock on hand.
                        </td>
                      </tr>
                    ) : (
                      selectedRecall.warehouses.map((w) => (
                        <tr key={w.warehouseId}>
                          <td className="py-2 px-3 font-medium">{w.name}</td>
                          <td className="py-2 px-3">
                            <span
                              className={clsx(
                                'px-2 py-0.5 rounded text-[10px] font-semibold',
                                w.type === 'STANDARD' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800',
                              )}
                            >
                              {w.type}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right font-bold">{w.quantity.toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsRecallDetailsOpen(false)}
                className="btn btn-secondary text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
