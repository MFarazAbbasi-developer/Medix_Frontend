import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Package,
  Search,
  RefreshCw,
  ShoppingCart,
  Settings2,
  Building2,
  Calendar,
  Layers,
  ArrowRight,
  ShieldAlert,
  Info,
  X,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { usePermission } from '../hooks/usePermission';
import {
  reorderSuggestionsApi,
  ProductSuggestionItem,
  SuggestionsSummary,
  SuggestionHealthStatus,
  getSuppliers,
  Supplier,
  organizationApi,
  Branch,
} from '../api';

export const PurchaseSuggestionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermission();

  const canView = hasPermission('purchases.suggestions_view');
  const canConfigure = hasPermission('purchases.suggestions_configure');
  const canCreatePo = hasPermission('purchases.create');

  // Master data
  const [branches, setBranches] = useState<Branch[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');

  // Suggestions state
  const [suggestions, setSuggestions] = useState<ProductSuggestionItem[]>([]);
  const [summary, setSummary] = useState<SuggestionsSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<SuggestionHealthStatus>('ALL');
  const [supplierFilter, setSupplierFilter] = useState<string>('ALL');
  const [lookbackDays, setLookbackDays] = useState<number>(30);
  const [excludeShortExpiry, setExcludeShortExpiry] = useState<boolean>(false);
  const [shortExpiryDays] = useState<number>(90);

  // Pagination
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(50);
  const [totalItems, setTotalItems] = useState<number>(0);

  // Inline edited quantities map: { [productId]: number }
  const [overrideQuantities, setOverrideQuantities] = useState<Record<string, number>>({});
  // Selected suppliers override map: { [productId]: string }
  const [selectedSuppliers, setSelectedSuppliers] = useState<Record<string, string>>({});
  // Selection set for bulk PO creation
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());

  // Modals
  const [configModalItem, setConfigModalItem] = useState<ProductSuggestionItem | null>(null);
  const [isPoModalOpen, setIsPoModalOpen] = useState<boolean>(false);
  const [isCreatingPo, setIsCreatingPo] = useState<boolean>(false);
  const [isSavingConfig, setIsSavingConfig] = useState<boolean>(false);

  // Config Form State
  const [configForm, setConfigForm] = useState<{
    reorderPoint: string;
    targetStock: string;
    minOrderQuantity: string;
    reorderQuantity: string;
    leadTimeDays: string;
    preferredSupplierId: string;
  }>({
    reorderPoint: '',
    targetStock: '',
    minOrderQuantity: '1',
    reorderQuantity: '',
    leadTimeDays: '',
    preferredSupplierId: '',
  });

  // Feedback Toast
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4500);
  };

  // Load Initial Master Data
  useEffect(() => {
    const initMaster = async () => {
      try {
        const [orgRes, supRes] = await Promise.all([
          organizationApi.getOrganization().catch(() => null),
          getSuppliers({ isActive: true, limit: 300 }),
        ]);

        if (orgRes?.branches) {
          setBranches(orgRes.branches);
          if (orgRes.branches.length > 0 && !selectedBranchId) {
            setSelectedBranchId(orgRes.branches[0].id);
          }
        }
        setSuppliers(supRes.items || []);
      } catch {
        // ignore
      }
    };
    initMaster();
  }, [selectedBranchId]);

  // Load Suggestions
  const loadSuggestions = useCallback(async () => {
    if (!selectedBranchId) return;
    setLoading(true);
    try {
      const res = await reorderSuggestionsApi.getSuggestions({
        branchId: selectedBranchId,
        search: search.trim() || undefined,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        supplierId: supplierFilter === 'ALL' ? undefined : supplierFilter,
        lookbackDays,
        excludeShortExpiry,
        shortExpiryDays,
        page,
        limit,
      });

      setSuggestions(res.items);
      setSummary(res.summary);
      setTotalItems(res.meta.total);

      // Initialize default quantities and suppliers
      const initialQtyMap: Record<string, number> = {};
      const initialSupMap: Record<string, string> = {};
      const initialSelected = new Set<string>();

      for (const item of res.items) {
        initialQtyMap[item.productId] = item.suggestedQuantity;
        if (item.supplier?.id) {
          initialSupMap[item.productId] = item.supplier.id;
        }
        if (item.healthStatus === 'REORDER_NEEDED' && item.suggestedQuantity > 0) {
          initialSelected.add(item.productId);
        }
      }

      setOverrideQuantities((prev) => ({ ...initialQtyMap, ...prev }));
      setSelectedSuppliers((prev) => ({ ...initialSupMap, ...prev }));
      setSelectedProductIds(initialSelected);
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || err.message || 'Failed to load purchase suggestions');
    } finally {
      setLoading(false);
    }
  }, [
    selectedBranchId,
    search,
    statusFilter,
    supplierFilter,
    lookbackDays,
    excludeShortExpiry,
    shortExpiryDays,
    page,
    limit,
  ]);

  useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions]);

  // Selection Handlers
  const handleToggleSelectAll = () => {
    if (selectedProductIds.size === suggestions.length && suggestions.length > 0) {
      setSelectedProductIds(new Set());
    } else {
      setSelectedProductIds(new Set(suggestions.map((s) => s.productId)));
    }
  };

  const handleToggleSelectRow = (productId: string) => {
    const next = new Set(selectedProductIds);
    if (next.has(productId)) {
      next.delete(productId);
    } else {
      next.add(productId);
    }
    setSelectedProductIds(next);
  };

  // Inline Quantity Edit
  const handleQuantityChange = (productId: string, val: string) => {
    const parsed = parseInt(val, 10);
    setOverrideQuantities((prev) => ({
      ...prev,
      [productId]: isNaN(parsed) ? 0 : Math.max(0, parsed),
    }));
  };

  // Inline Supplier Change
  const handleSupplierChange = (productId: string, supId: string) => {
    setSelectedSuppliers((prev) => ({
      ...prev,
      [productId]: supId,
    }));
  };

  // Open Quick Config Modal
  const handleOpenConfigModal = (item: ProductSuggestionItem) => {
    setConfigModalItem(item);
    setConfigForm({
      reorderPoint: item.reorderPointSource === 'CONFIGURED' ? String(item.reorderPoint) : '',
      targetStock: item.targetStockSource === 'CONFIGURED' ? String(item.targetStock) : '',
      minOrderQuantity: String(item.minOrderQuantity || 1),
      reorderQuantity: item.reorderQuantity ? String(item.reorderQuantity) : '',
      leadTimeDays: String(item.leadTimeDays || ''),
      preferredSupplierId: item.supplier?.source === 'CONFIGURED' ? item.supplier.id : '',
    });
  };

  // Save Quick Config
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configModalItem || !selectedBranchId) return;

    const rPoint = configForm.reorderPoint !== '' ? parseInt(configForm.reorderPoint, 10) : null;
    const tStock = configForm.targetStock !== '' ? parseInt(configForm.targetStock, 10) : null;
    const moq = parseInt(configForm.minOrderQuantity, 10) || 1;
    const roq = configForm.reorderQuantity !== '' ? parseInt(configForm.reorderQuantity, 10) : null;
    const lTime = configForm.leadTimeDays !== '' ? parseInt(configForm.leadTimeDays, 10) : null;

    if (rPoint !== null && tStock !== null && tStock < rPoint) {
      showFeedback('error', `Target stock (${tStock}) cannot be less than reorder point (${rPoint})`);
      return;
    }

    setIsSavingConfig(true);
    try {
      await reorderSuggestionsApi.upsertConfig(
        configModalItem.productId,
        {
          reorderPoint: rPoint,
          targetStock: tStock,
          minOrderQuantity: moq,
          reorderQuantity: roq,
          leadTimeDays: lTime,
          preferredSupplierId: configForm.preferredSupplierId || null,
        },
        selectedBranchId,
      );

      showFeedback('success', `Replenishment settings updated for ${configModalItem.name}`);
      setConfigModalItem(null);
      loadSuggestions();
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || err.message || 'Failed to update configuration');
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Grouped Selected Items for PO Generation
  const selectedItemsSummary = useMemo(() => {
    const selectedList = suggestions.filter((s) => selectedProductIds.has(s.productId));
    const bySupplier: Record<string, { supplier: Supplier | null; items: { item: ProductSuggestionItem; qty: number }[] }> = {};

    let totalUnits = 0;
    let totalEstimatedValue = 0;
    let missingSupplierCount = 0;

    for (const item of selectedList) {
      const qty = overrideQuantities[item.productId] ?? item.suggestedQuantity;
      if (qty <= 0) continue;

      const supId = selectedSuppliers[item.productId] || item.supplier?.id;
      const sup = suppliers.find((s) => s.id === supId) || null;

      if (!supId) {
        missingSupplierCount++;
      }

      const key = supId || 'UNASSIGNED';
      if (!bySupplier[key]) {
        bySupplier[key] = { supplier: sup, items: [] };
      }

      bySupplier[key].items.push({ item, qty });
      totalUnits += qty;
      totalEstimatedValue += qty * item.estimatedUnitCost;
    }

    return {
      selectedList,
      bySupplier,
      totalUnits,
      totalEstimatedValue,
      missingSupplierCount,
    };
  }, [suggestions, selectedProductIds, overrideQuantities, selectedSuppliers, suppliers]);

  // Execute Create Draft POs
  const handleConfirmCreateDraftPo = async () => {
    if (!selectedBranchId) return;

    if (selectedItemsSummary.missingSupplierCount > 0) {
      showFeedback('error', 'All selected items must have an assigned supplier before creating PO drafts');
      return;
    }

    const payloadItems = selectedItemsSummary.selectedList
      .map((item) => {
        const qty = overrideQuantities[item.productId] ?? item.suggestedQuantity;
        const supId = selectedSuppliers[item.productId] || item.supplier?.id;
        return {
          productId: item.productId,
          supplierId: supId,
          quantity: qty,
          unitCost: item.estimatedUnitCost,
        };
      })
      .filter((i) => i.quantity > 0);

    if (payloadItems.length === 0) {
      showFeedback('error', 'Please ensure at least one selected item has quantity > 0');
      return;
    }

    setIsCreatingPo(true);
    try {
      const res = await reorderSuggestionsApi.createDraftPos({
        branchId: selectedBranchId,
        items: payloadItems,
      });

      showFeedback('success', res.message || 'Draft purchase orders generated successfully');
      setIsPoModalOpen(false);
      // Navigate to Purchasing Page to review/issue the new draft POs
      setTimeout(() => {
        navigate('/purchasing');
      }, 1000);
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || err.message || 'Failed to create draft purchase orders');
    } finally {
      setIsCreatingPo(false);
    }
  };

  if (!canView) {
    return (
      <div className="p-8 text-center text-charcoal-500">
        <ShieldAlert className="w-12 h-12 mx-auto mb-3 text-red-500 opacity-80" />
        <h2 className="text-lg font-bold text-charcoal-800">Access Restricted</h2>
        <p className="text-sm mt-1">You do not have permission to view reorder points and purchase suggestions.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-3 p-4 bg-surface-muted/20 select-none overflow-hidden">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-600 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* Top Header & Compact Summary Strip */}
      <div className="flex flex-col gap-2 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-brand-50 text-brand-700 rounded-lg border border-brand-200 shadow-2xs">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-charcoal-900 leading-none">
                Purchase Suggestions & Reorder Station
              </h1>
              <p className="text-[11px] text-charcoal-500 mt-0.5">
                Deterministic replenishment intelligence • Based on live stock, {lookbackDays}d sales velocity, and lead times
              </p>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-2">
            {branches.length > 1 && (
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="text-xs font-semibold px-2.5 py-1.5 bg-surface-card border border-surface-border rounded-lg text-charcoal-800 focus:outline-hidden focus:border-brand-500"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={loadSuggestions}
              disabled={loading}
              className="gap-1.5 text-xs h-8"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            {canCreatePo && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsPoModalOpen(true)}
                disabled={selectedItemsSummary.selectedList.length === 0}
                className="gap-1.5 text-xs h-8 font-semibold shadow-xs"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                Create PO Draft ({selectedItemsSummary.selectedList.length})
              </Button>
            )}
          </div>
        </div>

        {/* Compact KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <div className="bg-surface-card border border-red-200/80 rounded-lg p-2.5 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase text-red-600 tracking-wider">Reorder Needed</p>
              <p className="text-lg font-bold text-charcoal-900 leading-tight">
                {summary?.reorderNeededCount ?? 0}{' '}
                <span className="text-[10px] font-normal text-charcoal-500">SKUs</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-charcoal-400">Est. Order</p>
              <p className="text-xs font-bold text-charcoal-800">
                Rs. {(summary?.totalEstimatedPurchaseValue ?? 0).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="bg-surface-card border border-amber-200/80 rounded-lg p-2.5 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase text-amber-600 tracking-wider">Low Stock (Watch)</p>
              <p className="text-lg font-bold text-charcoal-900 leading-tight">
                {summary?.watchCount ?? 0}{' '}
                <span className="text-[10px] font-normal text-charcoal-500">SKUs</span>
              </p>
            </div>
            <AlertTriangle className="w-4 h-4 text-amber-500 opacity-70" />
          </div>

          <div className="bg-surface-card border border-emerald-200/80 rounded-lg p-2.5 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase text-emerald-600 tracking-wider">Healthy Stock</p>
              <p className="text-lg font-bold text-charcoal-900 leading-tight">
                {summary?.healthyCount ?? 0}{' '}
                <span className="text-[10px] font-normal text-charcoal-500">SKUs</span>
              </p>
            </div>
            <CheckCircle2 className="w-4 h-4 text-emerald-500 opacity-70" />
          </div>

          <div className="bg-surface-card border border-blue-200/80 rounded-lg p-2.5 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase text-blue-600 tracking-wider">Open PO Pipeline</p>
              <p className="text-lg font-bold text-charcoal-900 leading-tight">
                {summary?.totalOpenPoUnits ?? 0}{' '}
                <span className="text-[10px] font-normal text-charcoal-500">units on order</span>
              </p>
            </div>
            <Package className="w-4 h-4 text-blue-500 opacity-70" />
          </div>

          <div className="bg-surface-card border border-surface-border rounded-lg p-2.5 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase text-charcoal-500 tracking-wider">Total Evaluated</p>
              <p className="text-lg font-bold text-charcoal-900 leading-tight">
                {summary?.totalSkusAnalyzed ?? 0}{' '}
                <span className="text-[10px] font-normal text-charcoal-500">catalog items</span>
              </p>
            </div>
            <Layers className="w-4 h-4 text-charcoal-400" />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-2.5 shrink-0 bg-surface-card border-surface-border shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Left Search & Dropdowns */}
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[320px]">
            {/* Search */}
            <div className="relative w-56">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-charcoal-400" />
              <input
                type="text"
                placeholder="Search brand, generic, SKU..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-8 pr-2.5 py-1.5 bg-surface-muted/50 border border-surface-border rounded-md text-xs text-charcoal-900 focus:outline-hidden focus:border-brand-500 focus:bg-surface-card"
              />
            </div>

            {/* Health Filter */}
            <div className="flex items-center gap-1 bg-surface-muted/60 p-0.5 rounded-lg border border-surface-border">
              {(['ALL', 'REORDER_NEEDED', 'WATCH', 'HEALTHY', 'OVERSTOCK'] as SuggestionHealthStatus[]).map((st) => (
                <button
                  key={st}
                  onClick={() => {
                    setStatusFilter(st);
                    setPage(1);
                  }}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition-all ${
                    statusFilter === st
                      ? 'bg-surface-card text-charcoal-900 font-bold shadow-2xs'
                      : 'text-charcoal-600 hover:text-charcoal-900'
                  }`}
                >
                  {st === 'ALL' && 'All'}
                  {st === 'REORDER_NEEDED' && '🔴 Reorder'}
                  {st === 'WATCH' && '🟡 Watch'}
                  {st === 'HEALTHY' && '🟢 Healthy'}
                  {st === 'OVERSTOCK' && '🔵 Overstock'}
                </button>
              ))}
            </div>

            {/* Supplier Filter */}
            <select
              value={supplierFilter}
              onChange={(e) => {
                setSupplierFilter(e.target.value);
                setPage(1);
              }}
              className="px-2 py-1.5 bg-surface-card border border-surface-border rounded-md text-xs text-charcoal-700 focus:outline-hidden focus:border-brand-500 max-w-[180px] truncate"
            >
              <option value="ALL">All Suppliers</option>
              {suppliers.map((sup) => (
                <option key={sup.id} value={sup.id}>
                  {sup.name}
                </option>
              ))}
            </select>
          </div>

          {/* Right Lookback & Expiry Controls */}
          <div className="flex items-center gap-3">
            {/* Lookback Selector */}
            <div className="flex items-center gap-1.5 text-charcoal-600">
              <Calendar className="w-3.5 h-3.5 text-charcoal-400" />
              <span className="text-[11px] font-medium">Lookback:</span>
              <select
                value={lookbackDays}
                onChange={(e) => setLookbackDays(parseInt(e.target.value, 10))}
                className="px-1.5 py-1 bg-surface-card border border-surface-border rounded text-[11px] font-semibold text-charcoal-800"
              >
                <option value={15}>15 Days</option>
                <option value={30}>30 Days (Std)</option>
                <option value={60}>60 Days</option>
                <option value={90}>90 Days</option>
              </select>
            </div>

            {/* Exclude Short-Expiry Toggle */}
            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-medium text-charcoal-700">
              <input
                type="checkbox"
                checked={excludeShortExpiry}
                onChange={(e) => setExcludeShortExpiry(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-surface-border text-brand-600 focus:ring-brand-500"
              />
              <span>Exclude Short-Expiry (&lt;{shortExpiryDays}d)</span>
            </label>
          </div>
        </div>
      </Card>

      {/* Dense Operational Table */}
      <Card className="flex-1 bg-surface-card border-surface-border shadow-2xs overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-surface-muted/60 sticky top-0 z-10 border-b border-surface-border text-[11px] font-semibold text-charcoal-600 uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3 w-8 text-center">
                  <input
                    type="checkbox"
                    checked={suggestions.length > 0 && selectedProductIds.size === suggestions.length}
                    onChange={handleToggleSelectAll}
                    className="w-3.5 h-3.5 rounded border-surface-border text-brand-600 focus:ring-brand-500"
                  />
                </th>
                <th className="py-2.5 px-3">Product / SKU</th>
                <th className="py-2.5 px-2 text-right">Physical</th>
                <th className="py-2.5 px-2 text-right">Saleable</th>
                <th className="py-2.5 px-2 text-right">On-Order</th>
                <th className="py-2.5 px-2 text-right">Net Pos.</th>
                <th className="py-2.5 px-2 text-right">ADS (v)</th>
                <th className="py-2.5 px-2 text-right">ROP</th>
                <th className="py-2.5 px-2 text-right">Target</th>
                <th className="py-2.5 px-3 text-center">Health</th>
                <th className="py-2.5 px-3 text-center w-28">Suggested Qty</th>
                <th className="py-2.5 px-3">Supplier</th>
                <th className="py-2.5 px-3 text-center w-16">Config</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/60">
              {loading && suggestions.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-charcoal-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-600" />
                    Calculating replenishment positions and sales velocities...
                  </td>
                </tr>
              ) : suggestions.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-charcoal-400">
                    No products matching filter criteria.
                  </td>
                </tr>
              ) : (
                suggestions.map((item) => {
                  const isSelected = selectedProductIds.has(item.productId);
                  const currentQty = overrideQuantities[item.productId] ?? item.suggestedQuantity;
                  const currentSupId = selectedSuppliers[item.productId] || item.supplier?.id || '';

                  return (
                    <tr
                      key={item.productId}
                      className={`hover:bg-surface-muted/30 transition-colors ${
                        item.healthStatus === 'REORDER_NEEDED'
                          ? 'bg-red-50/25'
                          : item.healthStatus === 'WATCH'
                          ? 'bg-amber-50/20'
                          : ''
                      } ${isSelected ? 'bg-brand-50/30' : ''}`}
                    >
                      {/* Checkbox */}
                      <td className="py-2 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectRow(item.productId)}
                          className="w-3.5 h-3.5 rounded border-surface-border text-brand-600 focus:ring-brand-500"
                        />
                      </td>

                      {/* Product details */}
                      <td className="py-2 px-3">
                        <div className="font-bold text-charcoal-900 leading-tight truncate max-w-[220px]" title={item.name}>
                          {item.name}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-charcoal-500 font-mono mt-0.5">
                          <span>{item.sku}</span>
                          {item.genericName && (
                            <>
                              <span>•</span>
                              <span className="truncate max-w-[120px]" title={item.genericName}>
                                {item.genericName}
                              </span>
                            </>
                          )}
                          {item.packSize && (
                            <>
                              <span>•</span>
                              <span>{item.packSize}</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Physical Stock */}
                      <td className="py-2 px-2 text-right font-mono text-charcoal-700">
                        {item.physicalStock}
                      </td>

                      {/* Saleable Stock */}
                      <td className="py-2 px-2 text-right font-mono font-semibold text-charcoal-900">
                        {item.saleableStock}
                        {item.shortExpiryStock > 0 && (
                          <div className="text-[9px] font-normal text-amber-600 leading-none">
                            +{item.shortExpiryStock} short
                          </div>
                        )}
                      </td>

                      {/* On-Order PO Qty */}
                      <td className="py-2 px-2 text-right font-mono text-blue-600">
                        {item.openPoQuantity > 0 ? `+${item.openPoQuantity}` : '0'}
                      </td>

                      {/* Net Position */}
                      <td className="py-2 px-2 text-right font-mono font-bold text-charcoal-900">
                        {item.netPosition}
                      </td>

                      {/* ADS Velocity */}
                      <td className="py-2 px-2 text-right font-mono text-charcoal-800">
                        {item.averageDailySales.toFixed(1)}
                        <span className="text-[9px] text-charcoal-400 font-sans">/d</span>
                      </td>

                      {/* Reorder Point */}
                      <td className="py-2 px-2 text-right font-mono text-charcoal-700">
                        <span>{item.reorderPoint}</span>
                        <span
                          className={`ml-1 text-[9px] px-1 py-0.2 rounded font-sans font-bold ${
                            item.reorderPointSource === 'CONFIGURED'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-charcoal-100 text-charcoal-500'
                          }`}
                          title={item.reorderPointSource === 'CONFIGURED' ? 'Manually Configured Policy' : 'Auto-calculated Heuristic'}
                        >
                          {item.reorderPointSource === 'CONFIGURED' ? 'M' : 'A'}
                        </span>
                      </td>

                      {/* Target Stock */}
                      <td className="py-2 px-2 text-right font-mono text-charcoal-700">
                        <span>{item.targetStock}</span>
                        <span
                          className={`ml-1 text-[9px] px-1 py-0.2 rounded font-sans font-bold ${
                            item.targetStockSource === 'CONFIGURED'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-charcoal-100 text-charcoal-500'
                          }`}
                          title={item.targetStockSource === 'CONFIGURED' ? 'Manually Configured Policy' : 'Auto-calculated Heuristic'}
                        >
                          {item.targetStockSource === 'CONFIGURED' ? 'M' : 'A'}
                        </span>
                      </td>

                      {/* Health Status */}
                      <td className="py-2 px-3 text-center">
                        {item.healthStatus === 'REORDER_NEEDED' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                            Reorder
                          </span>
                        )}
                        {item.healthStatus === 'WATCH' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                            Watch
                          </span>
                        )}
                        {item.healthStatus === 'HEALTHY' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Healthy
                          </span>
                        )}
                        {item.isOverstocked && (
                          <div className="text-[9px] font-bold text-blue-600 mt-0.5">Overstock</div>
                        )}
                      </td>

                      {/* Suggested Order Qty (Inline Editable) */}
                      <td className="py-2 px-3 text-center">
                        <input
                          type="number"
                          min={0}
                          value={currentQty}
                          onChange={(e) => handleQuantityChange(item.productId, e.target.value)}
                          className={`w-20 px-2 py-1 text-center font-mono font-bold text-xs rounded border ${
                            currentQty > 0
                              ? 'bg-white border-brand-300 text-brand-700 ring-1 ring-brand-100'
                              : 'bg-surface-muted/40 border-surface-border text-charcoal-400'
                          } focus:outline-hidden focus:border-brand-500 focus:bg-white`}
                        />
                      </td>

                      {/* Supplier Resolution */}
                      <td className="py-2 px-3">
                        <select
                          value={currentSupId}
                          onChange={(e) => handleSupplierChange(item.productId, e.target.value)}
                          className={`w-full max-w-[160px] text-[11px] py-1 px-1.5 rounded border ${
                            !currentSupId
                              ? 'bg-red-50 border-red-300 text-red-700 font-semibold'
                              : 'bg-surface-card border-surface-border text-charcoal-800'
                          } focus:outline-hidden focus:border-brand-500 truncate`}
                        >
                          <option value="">-- No Supplier --</option>
                          {suppliers.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                        {item.supplier && (
                          <div className="text-[9px] text-charcoal-400 mt-0.5">
                            Source: {item.supplier.source === 'CONFIGURED' ? 'Preferred' : 'Last Purchase'}
                          </div>
                        )}
                      </td>

                      {/* Quick Config Button */}
                      <td className="py-2 px-3 text-center">
                        {canConfigure && (
                          <button
                            type="button"
                            onClick={() => handleOpenConfigModal(item)}
                            title="Configure branch replenishment rules"
                            className="p-1 rounded text-charcoal-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                          >
                            <Settings2 className="w-4 h-4" />
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

        {/* Dense Table Footer & Pagination */}
        <div className="p-2 border-t border-surface-border bg-surface-muted/30 flex items-center justify-between text-xs text-charcoal-500 shrink-0">
          <div>
            Showing <span className="font-semibold text-charcoal-800">{suggestions.length}</span> of{' '}
            <span className="font-semibold text-charcoal-800">{totalItems}</span> items •{' '}
            <span className="font-semibold text-brand-700">{selectedProductIds.size}</span> selected
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-7 px-2.5 text-xs"
            >
              Prev
            </Button>
            <span className="px-2 font-mono text-xs">Page {page}</span>
            <Button
              variant="outline"
              size="sm"
              disabled={suggestions.length < limit || loading}
              onClick={() => setPage((p) => p + 1)}
              className="h-7 px-2.5 text-xs"
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* Quick Config Modal */}
      {configModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4">
          <Card className="w-full max-w-md bg-surface-card border-surface-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-3.5 bg-surface-muted/60 border-b border-surface-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-brand-600" />
                <h3 className="text-sm font-bold text-charcoal-900">Replenishment Policy</h3>
              </div>
              <button
                type="button"
                onClick={() => setConfigModalItem(null)}
                className="text-charcoal-400 hover:text-charcoal-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="p-4 space-y-3.5 text-xs">
              <div>
                <p className="font-bold text-charcoal-900 text-sm">{configModalItem.name}</p>
                <p className="text-charcoal-500 font-mono text-[11px]">{configModalItem.sku} • {configModalItem.genericName}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-charcoal-700 mb-1">
                    Static Reorder Point (ROP)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="Auto if blank"
                    value={configForm.reorderPoint}
                    onChange={(e) => setConfigForm((f) => ({ ...f, reorderPoint: e.target.value }))}
                  />
                  <span className="text-[10px] text-charcoal-400">Triggers order when stock &le; ROP</span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-charcoal-700 mb-1">
                    Target Stock Level
                  </label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="Auto if blank"
                    value={configForm.targetStock}
                    onChange={(e) => setConfigForm((f) => ({ ...f, targetStock: e.target.value }))}
                  />
                  <span className="text-[10px] text-charcoal-400">Replenish to this ceiling</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-charcoal-700 mb-1">
                    Min Order Qty (MOQ)
                  </label>
                  <Input
                    type="number"
                    min={1}
                    value={configForm.minOrderQuantity}
                    onChange={(e) => setConfigForm((f) => ({ ...f, minOrderQuantity: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-charcoal-700 mb-1">
                    Lot Increment (ROQ)
                  </label>
                  <Input
                    type="number"
                    min={1}
                    placeholder="Optional"
                    value={configForm.reorderQuantity}
                    onChange={(e) => setConfigForm((f) => ({ ...f, reorderQuantity: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-charcoal-700 mb-1">
                    Lead Time (days)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="7 days default"
                    value={configForm.leadTimeDays}
                    onChange={(e) => setConfigForm((f) => ({ ...f, leadTimeDays: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-charcoal-700 mb-1">
                  Preferred Supplier
                </label>
                <select
                  value={configForm.preferredSupplierId}
                  onChange={(e) => setConfigForm((f) => ({ ...f, preferredSupplierId: e.target.value }))}
                  className="w-full px-2.5 py-1.5 bg-surface-card border border-surface-border rounded-md text-xs text-charcoal-800 focus:outline-hidden focus:border-brand-500"
                >
                  <option value="">-- No Preferred Supplier (Use Last Purchase) --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-surface-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setConfigModalItem(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSavingConfig}
                >
                  {isSavingConfig ? 'Saving...' : 'Save Policy'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Create Draft PO Confirmation Modal */}
      {isPoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4">
          <Card className="w-full max-w-xl bg-surface-card border-surface-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-3.5 bg-surface-muted/60 border-b border-surface-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-brand-600" />
                <h3 className="text-sm font-bold text-charcoal-900">Generate Draft Purchase Orders</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPoModalOpen(false)}
                className="text-charcoal-400 hover:text-charcoal-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3.5 text-xs max-h-[70vh] overflow-y-auto">
              <div className="bg-brand-50/60 border border-brand-200 rounded-lg p-3 text-brand-900">
                <div className="flex items-center gap-1.5 font-bold text-xs mb-1">
                  <Info className="w-4 h-4 text-brand-700" />
                  Convenience Action: Draft Creation
                </div>
                <p className="text-[11px] leading-relaxed text-brand-800">
                  This will generate <strong>DRAFT</strong> purchase orders grouped by vendor. You will be redirected to the Receiving & PO page where you can review, adjust terms, and formally issue each order.
                </p>
              </div>

              {selectedItemsSummary.missingSupplierCount > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 text-red-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>
                    <strong>{selectedItemsSummary.missingSupplierCount} selected item(s)</strong> do not have a supplier assigned. Please select a supplier for each item in the table before proceeding.
                  </span>
                </div>
              )}

              <div className="space-y-2">
                <p className="font-semibold text-charcoal-700 uppercase text-[10px] tracking-wider">
                  Purchase Orders to be created ({Object.keys(selectedItemsSummary.bySupplier).length}):
                </p>

                {Object.entries(selectedItemsSummary.bySupplier).map(([supKey, group]) => (
                  <div
                    key={supKey}
                    className="p-3 bg-surface-muted/40 border border-surface-border rounded-lg space-y-1.5"
                  >
                    <div className="flex items-center justify-between font-bold text-charcoal-900">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-charcoal-500" />
                        <span>{group.supplier ? group.supplier.name : '⚠️ UNASSIGNED SUPPLIER'}</span>
                      </div>
                      <span className="font-mono text-brand-700">
                        {group.items.length} item(s)
                      </span>
                    </div>

                    <div className="pl-5 space-y-0.5 text-[11px] text-charcoal-600">
                      {group.items.map(({ item, qty }) => (
                        <div key={item.productId} className="flex items-center justify-between">
                          <span className="truncate max-w-[280px]">{item.name}</span>
                          <span className="font-mono font-semibold">{qty} units</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-surface-card border border-surface-border rounded-lg flex items-center justify-between font-bold text-charcoal-900">
                <span>Total Units: {selectedItemsSummary.totalUnits}</span>
                <span className="text-charcoal-500 font-normal">
                  Est. Value: <strong className="text-charcoal-900">Rs. {selectedItemsSummary.totalEstimatedValue.toLocaleString()}</strong> (informational)
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-surface-muted/40 border-t border-surface-border flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPoModalOpen(false)}
                disabled={isCreatingPo}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmCreateDraftPo}
                disabled={isCreatingPo || selectedItemsSummary.missingSupplierCount > 0}
                className="gap-1.5 font-semibold"
              >
                {isCreatingPo ? 'Creating Orders...' : 'Confirm & Create Draft POs'}
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
