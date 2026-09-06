import React, { useState, useEffect, useCallback } from 'react';
import {
  Package,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  X,
  Layers,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Tag,
  Boxes,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import {
  productsApi,
  Product,
  CreateProductDto,
  UpdateProductDto,
  batchesApi,
  Batch,
  BatchStatus,
  CreateBatchDto,
  UpdateBatchDto,
  masterDataApi,
  Manufacturer,
  ProductCategory,
  UnitOfMeasurement,
} from '../api';

export const ProductsPage: React.FC = () => {
  // --- Product List State ---
  const [products, setProducts] = useState<Product[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // --- Reference Master Data ---
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [units, setUnits] = useState<UnitOfMeasurement[]>([]);

  // --- Product Modal State ---
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  // --- Product Details & Batches Drawer State ---
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productBatches, setProductBatches] = useState<Batch[]>([]);
  const [isLoadingBatches, setIsLoadingBatches] = useState(false);

  // --- Batch Modal State ---
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Partial<Batch> | null>(null);
  const [isSavingBatch, setIsSavingBatch] = useState(false);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Load Master Data (Manufacturers, Categories, Units)
  const loadMasterData = useCallback(async () => {
    try {
      const [mfgList, catList, unitList] = await Promise.all([
        masterDataApi.getManufacturers(),
        masterDataApi.getCategories(),
        masterDataApi.getUnits(),
      ]);
      setManufacturers(mfgList);
      setCategories(catList);
      setUnits(unitList);
    } catch {
      // Ignored
    }
  }, []);

  // Load Products
  const loadProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await productsApi.getProducts({
        search: search.trim() || undefined,
        categoryId: selectedCategory || undefined,
        manufacturerId: selectedManufacturer || undefined,
        isActive: selectedStatus || undefined,
        page,
        limit: 20,
      });
      setProducts(res.items);
      setTotalProducts(res.meta.total);
    } catch (err: unknown) {
      showFeedback('error', (err as Error)?.message || 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  }, [search, selectedCategory, selectedManufacturer, selectedStatus, page]);

  // Load Batches for Selected Product
  const loadProductBatches = useCallback(async (productId: string) => {
    try {
      setIsLoadingBatches(true);
      const batches = await batchesApi.getBatchesByProduct(productId);
      setProductBatches(batches);
    } catch (err: unknown) {
      showFeedback('error', (err as Error)?.message || 'Failed to load batches');
    } finally {
      setIsLoadingBatches(false);
    }
  }, []);

  useEffect(() => {
    loadMasterData();
  }, [loadMasterData]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Open Drawer and Load Batches
  const handleOpenProductDetails = (product: Product) => {
    setSelectedProduct(product);
    loadProductBatches(product.id);
  };

  // Handler: Save Product (Create or Update)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.sku || !editingProduct?.name || !editingProduct?.genericName) {
      showFeedback('error', 'SKU, Brand Name, and Generic Composition are required.');
      return;
    }

    try {
      setIsSavingProduct(true);
      if (editingProduct.id) {
        const payload: UpdateProductDto = {
          sku: editingProduct.sku,
          name: editingProduct.name,
          genericName: editingProduct.genericName,
          manufacturerId: editingProduct.manufacturerId || undefined,
          categoryId: editingProduct.categoryId || undefined,
          unitId: editingProduct.unitId || undefined,
          dosageForm: editingProduct.dosageForm || undefined,
          strength: editingProduct.strength || undefined,
          packSize: editingProduct.packSize || undefined,
          barcode: editingProduct.barcode || undefined,
          taxPercentage: Number(editingProduct.taxPercentage) || 0,
          description: editingProduct.description || undefined,
          isActive: editingProduct.isActive,
        };
        await productsApi.updateProduct(editingProduct.id, payload);
        showFeedback('success', `Product "${editingProduct.name}" updated successfully.`);
      } else {
        const payload: CreateProductDto = {
          sku: editingProduct.sku,
          name: editingProduct.name,
          genericName: editingProduct.genericName,
          manufacturerId: editingProduct.manufacturerId || undefined,
          categoryId: editingProduct.categoryId || undefined,
          unitId: editingProduct.unitId || undefined,
          dosageForm: editingProduct.dosageForm || undefined,
          strength: editingProduct.strength || undefined,
          packSize: editingProduct.packSize || undefined,
          barcode: editingProduct.barcode || undefined,
          taxPercentage: Number(editingProduct.taxPercentage) || 0,
          description: editingProduct.description || undefined,
          isActive: editingProduct.isActive ?? true,
        };
        await productsApi.createProduct(payload);
        showFeedback('success', `Product "${editingProduct.name}" created successfully.`);
      }

      setIsProductModalOpen(false);
      setEditingProduct(null);
      loadProducts();
    } catch (err: unknown) {
      showFeedback('error', (err as Error)?.message || 'Failed to save product.');
    } finally {
      setIsSavingProduct(false);
    }
  };

  // Handler: Save Batch (Create or Update)
  const handleSaveBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    if (
      !editingBatch?.batchNumber ||
      !editingBatch?.expiryDate ||
      editingBatch.purchaseCost === undefined ||
      editingBatch.tradePrice === undefined ||
      editingBatch.retailPrice === undefined
    ) {
      showFeedback('error', 'Batch Number, Expiry Date, Purchase Cost, TP, and MRP are required.');
      return;
    }

    try {
      setIsSavingBatch(true);
      if (editingBatch.id) {
        const payload: UpdateBatchDto = {
          batchNumber: editingBatch.batchNumber,
          mfgDate: editingBatch.mfgDate ? editingBatch.mfgDate.split('T')[0] : undefined,
          expiryDate: editingBatch.expiryDate.split('T')[0],
          purchaseCost: Number(editingBatch.purchaseCost),
          tradePrice: Number(editingBatch.tradePrice),
          retailPrice: Number(editingBatch.retailPrice),
          status: editingBatch.status,
          remarks: editingBatch.remarks || undefined,
        };
        await batchesApi.updateBatch(editingBatch.id, payload);
        showFeedback('success', `Batch "${editingBatch.batchNumber}" updated.`);
      } else {
        const payload: CreateBatchDto = {
          batchNumber: editingBatch.batchNumber,
          mfgDate: editingBatch.mfgDate ? editingBatch.mfgDate.split('T')[0] : undefined,
          expiryDate: editingBatch.expiryDate.split('T')[0],
          purchaseCost: Number(editingBatch.purchaseCost),
          tradePrice: Number(editingBatch.tradePrice),
          retailPrice: Number(editingBatch.retailPrice),
          status: editingBatch.status || 'ACTIVE',
          remarks: editingBatch.remarks || undefined,
        };
        await batchesApi.createBatch(selectedProduct.id, payload);
        showFeedback('success', `Batch "${editingBatch.batchNumber}" registered successfully.`);
      }

      setIsBatchModalOpen(false);
      setEditingBatch(null);
      loadProductBatches(selectedProduct.id);
      loadProducts();
    } catch (err: unknown) {
      showFeedback('error', (err as Error)?.message || 'Failed to save batch.');
    } finally {
      setIsSavingBatch(false);
    }
  };

  // Handler: Toggle Product Active Status
  const handleToggleStatus = async (product: Product) => {
    try {
      const updated = await productsApi.toggleProductStatus(product.id, !product.isActive);
      showFeedback(
        'success',
        `Product "${product.name}" ${updated.isActive ? 'activated' : 'deactivated'}.`,
      );
      loadProducts();
      if (selectedProduct?.id === product.id) {
        setSelectedProduct(updated);
      }
    } catch (err: unknown) {
      showFeedback('error', (err as Error)?.message || 'Failed to toggle status.');
    }
  };

  // Expiry date status helper
  const getExpiryBadge = (expiryDateStr: string) => {
    const exp = new Date(expiryDateStr);
    const now = new Date();
    const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <AlertTriangle className="h-3 w-3" />
          Expired ({exp.toLocaleDateString()})
        </span>
      );
    } else if (diffDays <= 90) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <Calendar className="h-3 w-3" />
          Expiring Soon ({diffDays}d)
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          {exp.toLocaleDateString()}
        </span>
      );
    }
  };

  return (
    <div className="space-y-4">
      {/* Page Title & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-surface-border pb-3 gap-3">
        <div>
          <h1 className="text-base font-bold text-charcoal-900 tracking-tight flex items-center gap-2">
            <Package className="h-4 w-4 text-brand-500" />
            <span>Pharmaceutical Products & Batches</span>
          </h1>
          <p className="text-xs text-charcoal-500 mt-0.5">
            Manage pharmaceutical catalog, generic compositions, packaging, and lot-level pricing
          </p>
        </div>

        <div className="flex items-center gap-2">
          {feedback && (
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs border ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="h-3.5 w-3.5 shrink-0 text-rose-600" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          <Button
            variant="primary"
            size="xs"
            onClick={() => {
              setEditingProduct({
                sku: '',
                name: '',
                genericName: '',
                dosageForm: 'Tablet',
                strength: '',
                packSize: '',
                taxPercentage: 0,
                isActive: true,
              });
              setIsProductModalOpen(true);
            }}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <Card className="p-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 items-center">
          {/* Search Input */}
          <div className="md:col-span-2 relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-charcoal-400" />
            <input
              type="text"
              placeholder="Search by Brand, Generic, SKU, or Barcode..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-surface-card border border-surface-border rounded text-charcoal-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            className="w-full px-2.5 py-1.5 text-xs bg-surface-card border border-surface-border rounded text-charcoal-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Manufacturer Filter */}
          <select
            value={selectedManufacturer}
            onChange={(e) => {
              setSelectedManufacturer(e.target.value);
              setPage(1);
            }}
            className="w-full px-2.5 py-1.5 text-xs bg-surface-card border border-surface-border rounded text-charcoal-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">All Manufacturers</option>
            {manufacturers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>

          {/* Status Filter & Refresh */}
          <div className="flex items-center gap-2">
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-1.5 text-xs bg-surface-card border border-surface-border rounded text-charcoal-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">All Statuses</option>
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
            </select>
            <Button
              variant="outline"
              size="xs"
              onClick={loadProducts}
              disabled={isLoading}
              title="Refresh Products"
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </Card>

      {/* Main Products Table */}
      <Card
        header={
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-charcoal-800">
              <Boxes className="h-4 w-4 text-brand-500" />
              <span>Registered Products ({totalProducts})</span>
            </div>
            <span className="text-[11px] text-charcoal-500">
              Page {page} of {Math.ceil(totalProducts / 20) || 1}
            </span>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-surface-border text-charcoal-500 bg-surface-muted">
                <th className="py-2.5 px-3 font-semibold">SKU / Code</th>
                <th className="py-2.5 px-3 font-semibold">Brand / Product Name</th>
                <th className="py-2.5 px-3 font-semibold">Generic Composition</th>
                <th className="py-2.5 px-3 font-semibold">Dosage / Strength</th>
                <th className="py-2.5 px-3 font-semibold">Packaging</th>
                <th className="py-2.5 px-3 font-semibold">Manufacturer</th>
                <th className="py-2.5 px-3 font-semibold">Batches</th>
                <th className="py-2.5 px-3 font-semibold">Status</th>
                <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {products.map((product) => (
                <tr
                  key={product.id}
                  className="hover:bg-surface-muted/60 transition-colors cursor-pointer"
                  onClick={() => handleOpenProductDetails(product)}
                >
                  <td className="py-2 px-3 font-mono font-bold text-charcoal-900">
                    {product.sku}
                  </td>
                  <td className="py-2 px-3">
                    <div className="font-semibold text-charcoal-900">
                      {product.name}
                    </div>
                    {product.barcode && (
                      <span className="text-[10px] text-charcoal-400 font-mono">
                        BC: {product.barcode}
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-charcoal-700 italic">
                    {product.genericName}
                  </td>
                  <td className="py-2 px-3 text-charcoal-700">
                    <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[11px] font-medium bg-surface-muted border border-surface-border mr-1.5">
                      {product.dosageForm || 'Item'}
                    </span>
                    {product.strength && (
                      <span className="text-charcoal-600 font-mono text-[11px]">
                        {product.strength}
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-charcoal-700">
                    {product.packSize || '—'}{' '}
                    <span className="text-charcoal-400 text-[11px]">
                      {product.unit?.symbol ? `(${product.unit.symbol})` : ''}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-charcoal-600">
                    {product.manufacturer?.name || '—'}
                  </td>
                  <td className="py-2 px-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-brand-50 text-brand-600 border border-brand-200">
                      <Layers className="h-3 w-3" />
                      {product._count?.batches || 0} batches
                    </span>
                  </td>
                  <td className="py-2 px-3" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(product)}
                      className="cursor-pointer"
                    >
                      <StatusBadge variant={product.isActive ? 'success' : 'neutral'}>
                        {product.isActive ? 'Active' : 'Disabled'}
                      </StatusBadge>
                    </button>
                  </td>
                  <td
                    className="py-2 px-3 text-right space-x-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => handleOpenProductDetails(product)}
                      title="View Batches & Details"
                    >
                      <Layers className="h-3 w-3 mr-1" />
                      Batches
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => {
                        setEditingProduct(product);
                        setIsProductModalOpen(true);
                      }}
                      title="Edit Product Master"
                    >
                      <Edit2 className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-charcoal-400">
                    No products found matching criteria. Click &quot;Add Product&quot; to register a new SKU.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalProducts > 20 && (
          <div className="flex items-center justify-between pt-3 border-t border-surface-border text-xs text-charcoal-600">
            <span>Total {totalProducts} products</span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="xs"
                disabled={page <= 1 || isLoading}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <span className="px-2 font-semibold text-charcoal-800">
                Page {page} of {Math.ceil(totalProducts / 20)}
              </span>
              <Button
                variant="outline"
                size="xs"
                disabled={page * 20 >= totalProducts || isLoading}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* ========================================================= */}
      {/* PRODUCT DETAILS & BATCHES DRAWER / MODAL                 */}
      {/* ========================================================= */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-surface-card border border-surface-border rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-surface-border bg-surface-muted/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded bg-brand-50 border border-brand-200 text-brand-600">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-charcoal-900">
                      {selectedProduct.name}
                    </h2>
                    <span className="font-mono text-xs px-2 py-0.2 rounded bg-surface-card border border-surface-border font-semibold text-charcoal-700">
                      SKU: {selectedProduct.sku}
                    </span>
                    <StatusBadge variant={selectedProduct.isActive ? 'success' : 'neutral'}>
                      {selectedProduct.isActive ? 'Active' : 'Disabled'}
                    </StatusBadge>
                  </div>
                  <p className="text-xs text-charcoal-600 mt-0.5">
                    Generic: <span className="font-medium text-charcoal-800">{selectedProduct.genericName}</span>
                    {selectedProduct.dosageForm ? ` • ${selectedProduct.dosageForm}` : ''}
                    {selectedProduct.strength ? ` • ${selectedProduct.strength}` : ''}
                    {selectedProduct.packSize ? ` • Pack: ${selectedProduct.packSize}` : ''}
                    {selectedProduct.manufacturer?.name ? ` • Mfr: ${selectedProduct.manufacturer.name}` : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="xs"
                  onClick={() => {
                    setEditingBatch({
                      batchNumber: '',
                      expiryDate: '',
                      purchaseCost: 0,
                      tradePrice: 0,
                      retailPrice: 0,
                      status: 'ACTIVE',
                    });
                    setIsBatchModalOpen(true);
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Register Batch
                </Button>
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="text-charcoal-400 hover:text-charcoal-700 p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Batches Table Body */}
            <div className="p-4 flex-1 overflow-y-auto space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-charcoal-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-brand-500" />
                  <span>Manufacturing Batches (FEFO Chronological Order)</span>
                </h3>
                <span className="text-[11px] text-charcoal-500">
                  {productBatches.length} registered lot(s)
                </span>
              </div>

              <div className="border border-surface-border rounded overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-surface-border text-charcoal-500 bg-surface-muted">
                      <th className="py-2 px-3 font-semibold">Batch / Lot #</th>
                      <th className="py-2 px-3 font-semibold">Expiry Date</th>
                      <th className="py-2 px-3 font-semibold">Mfg Date</th>
                      <th className="py-2 px-3 font-semibold text-right">Purchase Cost</th>
                      <th className="py-2 px-3 font-semibold text-right">Trade Price (TP)</th>
                      <th className="py-2 px-3 font-semibold text-right">Retail (MRP)</th>
                      <th className="py-2 px-3 font-semibold">Status</th>
                      <th className="py-2 px-3 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {productBatches.map((batch) => (
                      <tr key={batch.id} className="hover:bg-surface-muted/50">
                        <td className="py-2.5 px-3 font-mono font-bold text-charcoal-900">
                          {batch.batchNumber}
                        </td>
                        <td className="py-2.5 px-3">
                          {getExpiryBadge(batch.expiryDate)}
                        </td>
                        <td className="py-2.5 px-3 text-charcoal-600">
                          {batch.mfgDate ? new Date(batch.mfgDate).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-right text-charcoal-700">
                          Rs. {Number(batch.purchaseCost).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-right text-brand-600">
                          Rs. {Number(batch.tradePrice).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-right text-charcoal-900">
                          Rs. {Number(batch.retailPrice).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3">
                          <StatusBadge
                            variant={
                              batch.status === 'ACTIVE'
                                ? 'success'
                                : batch.status === 'QUARANTINED'
                                ? 'warning'
                                : 'error'
                            }
                          >
                            {batch.status}
                          </StatusBadge>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => {
                              setEditingBatch(batch);
                              setIsBatchModalOpen(true);
                            }}
                          >
                            <Edit2 className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {productBatches.length === 0 && !isLoadingBatches && (
                      <tr>
                        <td colSpan={8} className="py-6 text-center text-charcoal-400">
                          No batches registered for this product yet. Click &quot;Register Batch&quot; above.
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
      {/* ADD / EDIT PRODUCT MODAL                                 */}
      {/* ========================================================= */}
      {isProductModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-surface-card border border-surface-border rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border pb-2.5">
              <h3 className="font-bold text-sm text-charcoal-900 flex items-center gap-2">
                <Tag className="h-4 w-4 text-brand-500" />
                <span>{editingProduct.id ? 'Edit Pharmaceutical Product' : 'Register New Pharmaceutical Product'}</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsProductModalOpen(false);
                  setEditingProduct(null);
                }}
                className="text-charcoal-400 hover:text-charcoal-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input
                  label="User-Defined SKU / Item Code *"
                  value={editingProduct.sku || ''}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, sku: e.target.value })
                  }
                  placeholder="e.g. PAN-500-TAB"
                  required
                />
                <div className="md:col-span-2">
                  <Input
                    label="Commercial Brand Name *"
                    value={editingProduct.name || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, name: e.target.value })
                    }
                    placeholder="e.g. Panadol 500mg Tablets"
                    required
                  />
                </div>
              </div>

              <Input
                label="Generic Composition / Molecule *"
                value={editingProduct.genericName || ''}
                onChange={(e) =>
                  setEditingProduct({ ...editingProduct, genericName: e.target.value })
                }
                placeholder="e.g. Paracetamol"
                required
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input
                  label="Dosage Form"
                  value={editingProduct.dosageForm || ''}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, dosageForm: e.target.value })
                  }
                  placeholder="e.g. Tablet, Syrup, Injection"
                />
                <Input
                  label="Strength / Potency"
                  value={editingProduct.strength || ''}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, strength: e.target.value })
                  }
                  placeholder="e.g. 500mg, 250mg/5ml"
                />
                <Input
                  label="Pack Size / Configuration"
                  value={editingProduct.packSize || ''}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, packSize: e.target.value })
                  }
                  placeholder="e.g. 10x10, 1x60ml"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Manufacturer Select */}
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                    Manufacturer / Principal
                  </label>
                  <select
                    value={editingProduct.manufacturerId || ''}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        manufacturerId: e.target.value || null,
                      })
                    }
                    className="w-full px-2.5 py-1.5 text-xs bg-surface-card border border-surface-border rounded text-charcoal-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="">Select Manufacturer</option>
                    {manufacturers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category Select */}
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                    Product Category
                  </label>
                  <select
                    value={editingProduct.categoryId || ''}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        categoryId: e.target.value || null,
                      })
                    }
                    className="w-full px-2.5 py-1.5 text-xs bg-surface-card border border-surface-border rounded text-charcoal-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Unit Select */}
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                    Packaging Unit
                  </label>
                  <select
                    value={editingProduct.unitId || ''}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        unitId: e.target.value || null,
                      })
                    }
                    className="w-full px-2.5 py-1.5 text-xs bg-surface-card border border-surface-border rounded text-charcoal-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="">Select Unit</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.symbol})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  label="Barcode / EAN (Optional)"
                  value={editingProduct.barcode || ''}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, barcode: e.target.value })
                  }
                  placeholder="e.g. 8964000123456"
                />
                <Input
                  label="Tax Configuration % (0 for Exempt Medicine)"
                  type="number"
                  step="0.01"
                  min={0}
                  value={editingProduct.taxPercentage || 0}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      taxPercentage: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <label className="flex items-center gap-2 text-xs text-charcoal-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProduct.isActive ?? true}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        isActive: e.target.checked,
                      })
                    }
                    className="rounded border-charcoal-300 text-brand-500 focus:ring-brand-500"
                  />
                  <span className="font-medium">Active in Product Catalog</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-surface-border">
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => {
                    setIsProductModalOpen(false);
                    setEditingProduct(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="xs"
                  disabled={isSavingProduct}
                >
                  {isSavingProduct ? 'Saving...' : 'Save Product'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ADD / EDIT BATCH MODAL                                    */}
      {/* ========================================================= */}
      {isBatchModalOpen && editingBatch && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-surface-card border border-surface-border rounded-lg shadow-xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border pb-2.5">
              <h3 className="font-bold text-sm text-charcoal-900 flex items-center gap-2">
                <Layers className="h-4 w-4 text-brand-500" />
                <span>{editingBatch.id ? 'Edit Batch Lot' : `New Batch for ${selectedProduct.name}`}</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsBatchModalOpen(false);
                  setEditingBatch(null);
                }}
                className="text-charcoal-400 hover:text-charcoal-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBatch} className="space-y-3.5 text-xs">
              <Input
                label="Batch / Lot Number *"
                value={editingBatch.batchNumber || ''}
                onChange={(e) =>
                  setEditingBatch({ ...editingBatch, batchNumber: e.target.value })
                }
                placeholder="e.g. BN-2026-09"
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Mfg Date (Optional)"
                  type="date"
                  value={editingBatch.mfgDate ? editingBatch.mfgDate.split('T')[0] : ''}
                  onChange={(e) =>
                    setEditingBatch({ ...editingBatch, mfgDate: e.target.value })
                  }
                />
                <Input
                  label="Expiry Date *"
                  type="date"
                  value={editingBatch.expiryDate ? editingBatch.expiryDate.split('T')[0] : ''}
                  onChange={(e) =>
                    setEditingBatch({ ...editingBatch, expiryDate: e.target.value })
                  }
                  required
                />
              </div>

              {/* Price Points */}
              <div className="p-3 bg-surface-muted border border-surface-border rounded space-y-2.5">
                <span className="font-semibold text-charcoal-800 text-[11px] block">
                  Lot Pricing (Pakistani Drug Pricing Rules)
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    label="Purchase Cost (Rs) *"
                    type="number"
                    step="0.01"
                    min={0}
                    value={editingBatch.purchaseCost ?? 0}
                    onChange={(e) =>
                      setEditingBatch({
                        ...editingBatch,
                        purchaseCost: parseFloat(e.target.value) || 0,
                      })
                    }
                    required
                  />
                  <Input
                    label="Trade Price (TP) *"
                    type="number"
                    step="0.01"
                    min={0}
                    value={editingBatch.tradePrice ?? 0}
                    onChange={(e) =>
                      setEditingBatch({
                        ...editingBatch,
                        tradePrice: parseFloat(e.target.value) || 0,
                      })
                    }
                    required
                  />
                  <Input
                    label="Retail (MRP) *"
                    type="number"
                    step="0.01"
                    min={0}
                    value={editingBatch.retailPrice ?? 0}
                    onChange={(e) =>
                      setEditingBatch({
                        ...editingBatch,
                        retailPrice: parseFloat(e.target.value) || 0,
                      })
                    }
                    required
                  />
                </div>
              </div>

              {/* Batch Operational Status */}
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Batch Operational Status
                </label>
                <select
                  value={editingBatch.status || 'ACTIVE'}
                  onChange={(e) =>
                    setEditingBatch({
                      ...editingBatch,
                      status: e.target.value as BatchStatus,
                    })
                  }
                  className="w-full px-2.5 py-1.5 text-xs bg-surface-card border border-surface-border rounded text-charcoal-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="ACTIVE">ACTIVE (Available for Transaction)</option>
                  <option value="QUARANTINED">QUARANTINED (Hold / Quality Check)</option>
                  <option value="RECALLED">RECALLED (Withdrawn from Market)</option>
                </select>
              </div>

              <Input
                label="Remarks / Lot Notes"
                value={editingBatch.remarks || ''}
                onChange={(e) =>
                  setEditingBatch({ ...editingBatch, remarks: e.target.value })
                }
                placeholder="Optional supplier notes or storage instructions"
              />

              <div className="flex justify-end gap-2 pt-3 border-t border-surface-border">
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => {
                    setIsBatchModalOpen(false);
                    setEditingBatch(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="xs"
                  disabled={isSavingBatch}
                >
                  {isSavingBatch ? 'Saving...' : 'Save Batch'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
