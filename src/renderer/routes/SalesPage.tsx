import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Receipt,
  Search,
  RefreshCw,
  Plus,
  Trash2,
  Printer,
  Ban,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  ShoppingBag,
  CreditCard,
  X,
  AlertTriangle,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import {
  salesApi,
  customersApi,
  warehousesApi,
  productsApi,
  settingsApi,
  Customer,
  Warehouse,
  Product,
  SalesInvoice,
  PaymentMethod,
  FefoPreviewResponse,
  SalesMetricsResponse,
} from '../api';


interface CartItem {
  id: string; // temporary cart row id
  productId: string;
  productName: string;
  sku: string;
  genericName: string;
  batchId?: string;
  batchNumber?: string;
  expiryDate?: string;
  billedQuantity: number;
  bonusQuantity: number;
  unitCost: number;
  tradePrice: number;
  retailPrice: number;
  unitPrice: number;
  discountPercentage: number;
  taxPercentage: number;
  lineTotal: number;
  remarks?: string;
}

export const SalesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'POS' | 'INVOICES'>('POS');

  // Master dropdown data
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [defaultPricingBase, setDefaultPricingBase] = useState<'TP' | 'MRP'>('TP');

  // Selected POS header state
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [overallDiscount, setOverallDiscount] = useState<number>(0);
  const [invoiceNotes, setInvoiceNotes] = useState<string>('');

  // Cart state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Product search & active selection state
  const [productSearch, setProductSearch] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [fefoData, setFefoData] = useState<FefoPreviewResponse | null>(null);
  const [fefoLoading, setFefoLoading] = useState<boolean>(false);

  // Active line inputs
  const [lineBilledQty, setLineBilledQty] = useState<number>(1);
  const [lineBonusQty, setLineBonusQty] = useState<number>(0);
  const [lineBatchId, setLineBatchId] = useState<string>('');
  const [lineUnitPrice, setLineUnitPrice] = useState<number>(0);
  const [lineDiscountPct, setLineDiscountPct] = useState<number>(0);
  const [lineTaxPct, setLineTaxPct] = useState<number>(0);

  // Modals state
  const [isTenderModalOpen, setIsTenderModalOpen] = useState<boolean>(false);
  const [tenderCashAmount, setTenderCashAmount] = useState<number>(0);
  const [tenderCardAmount, setTenderCardAmount] = useState<number>(0);
  const [tenderCardRef, setTenderCardRef] = useState<string>('');
  const [tenderBankAmount, setTenderBankAmount] = useState<number>(0);
  const [tenderBankRef, setTenderBankRef] = useState<string>('');
  const [isPosting, setIsPosting] = useState<boolean>(false);

  // Receipt Preview state
  const [receiptInvoice, setReceiptInvoice] = useState<SalesInvoice | null>(null);
  const [receiptFormat, setReceiptFormat] = useState<'80mm' | 'A4'>('80mm');

  // Invoices History state
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState<boolean>(false);
  const [invoiceSearch, setInvoiceSearch] = useState<string>('');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<string>('ALL');
  const [cancellingInvoice, setCancellingInvoice] = useState<SalesInvoice | null>(null);
  const [cancellationReason, setCancellationReason] = useState<string>('');
  const [metrics, setMetrics] = useState<SalesMetricsResponse | null>(null);

  // Toast feedback
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4500);
  };

  // Load master data
  const loadMasterData = useCallback(async () => {
    try {
      const [custRes, whData, prodRes, settingsRes, metricsRes] = await Promise.all([
        customersApi.getCustomers({ isActive: true, limit: 300 }),
        warehousesApi.getWarehouses(),
        productsApi.getProducts({ limit: 500, isActive: 'true' }),
        settingsApi.getSettings().catch(() => ({ items: [], map: {} })),
        salesApi.getSalesMetrics().catch(() => null),
      ]);

      const custList = custRes?.items || [];
      setCustomers(custList);
      setWarehouses(whData || []);
      setProducts(prodRes?.items || []);
      setMetrics(metricsRes);

      // Set default warehouse
      const defaultWh = whData.find((w) => w.isDefault) || whData[0];
      if (defaultWh) {
        setSelectedWarehouseId(defaultWh.id);
      }

      // Set default walk-in customer if exists
      const walkIn = custList.find((c) => c.code === 'CUST-WALKIN') || custList[0];
      if (walkIn) {
        setSelectedCustomerId(walkIn.id);
      }

      // Check default pricing base setting
      const pricingSetting = (settingsRes as any)?.settings?.find(
        (s: any) => s.key === 'DEFAULT_SALES_PRICING_BASE',
      );
      if (pricingSetting?.value === 'MRP') {
        setDefaultPricingBase('MRP');
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadMasterData();
  }, [loadMasterData]);

  // Load invoices history
  const loadInvoices = useCallback(async () => {
    setInvoicesLoading(true);
    try {
      const res = await salesApi.getInvoices({
        search: invoiceSearch.trim() || undefined,
        status: invoiceStatusFilter === 'ALL' ? undefined : (invoiceStatusFilter as any),
        limit: 100,
      });
      setInvoices(res?.items || []);
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || err.message || 'Failed to load invoices');
    } finally {
      setInvoicesLoading(false);
    }
  }, [invoiceSearch, invoiceStatusFilter]);

  useEffect(() => {
    if (activeTab === 'INVOICES') {
      loadInvoices();
    }
  }, [activeTab, loadInvoices]);

  // When product is chosen or quantity changes, fetch advisory FEFO & customer pricing
  const fetchFefoDetails = useCallback(
    async (productId: string, qty: number, customerId: string, whId: string) => {
      if (!productId || !whId) return;
      setFefoLoading(true);
      try {
        const preview = await salesApi.previewFefo({
          productId,
          warehouseId: whId,
          requestedQuantity: Math.max(1, qty),
          customerId: customerId || undefined,
        });
        setFefoData(preview);

        // Resolve unit price & discounts based on precedence
        const alloc = preview.allocation.allocations[0];
        let basePrice = alloc ? (defaultPricingBase === 'MRP' ? alloc.retailPrice : alloc.tradePrice) : 0;
        let discPct = preview.customerPricing?.discountPercentage || 0;

        if (preview.customerPricing?.customPrice) {
          basePrice = preview.customerPricing.customPrice;
        }

        setLineUnitPrice(basePrice);
        setLineDiscountPct(discPct);
        setLineTaxPct(preview.product.taxPercentage || 0);

        if (alloc) {
          setLineBatchId(alloc.batchId);
        }
      } catch {
        setFefoData(null);
      } finally {
        setFefoLoading(false);
      }
    },
    [defaultPricingBase],
  );

  const handleSelectProduct = (prod: Product) => {
    setSelectedProduct(prod);
    setProductSearch(`${prod.name} (${prod.sku})`);
    setLineBilledQty(1);
    setLineBonusQty(0);
    fetchFefoDetails(prod.id, 1, selectedCustomerId, selectedWarehouseId);
  };

  // Add Item to Cart
  const handleAddToCart = () => {
    if (!selectedProduct) {
      showFeedback('error', 'Please select a product first.');
      return;
    }
    if (lineBilledQty <= 0) {
      showFeedback('error', 'Billed quantity must be at least 1.');
      return;
    }

    const alloc = fefoData?.allocation.allocations.find((a) => a.batchId === lineBatchId) ||
      fefoData?.allocation.allocations[0];

    const mrp = alloc ? alloc.retailPrice : 0;
    if (lineUnitPrice > mrp && mrp > 0) {
      showFeedback('error', `Selling price Rs.${lineUnitPrice} exceeds Maximum Retail Price (MRP) Rs.${mrp}`);
      return;
    }

    const gross = lineBilledQty * lineUnitPrice;
    const discAmt = gross * (lineDiscountPct / 100);
    const taxable = gross - discAmt;
    const taxAmt = taxable * (lineTaxPct / 100);
    const lineTotal = taxable + taxAmt;

    const newItem: CartItem = {
      id: `cart-${Date.now()}-${Math.random().toString().slice(2, 6)}`,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      sku: selectedProduct.sku,
      genericName: selectedProduct.genericName,
      batchId: lineBatchId || alloc?.batchId,
      batchNumber: alloc?.batchNumber || 'AUTO (FEFO)',
      expiryDate: alloc ? new Date(alloc.expiryDate).toLocaleDateString('en-GB') : '—',
      billedQuantity: lineBilledQty,
      bonusQuantity: lineBonusQty,
      unitCost: alloc ? alloc.purchaseCost : 0,
      tradePrice: alloc ? alloc.tradePrice : 0,
      retailPrice: mrp,
      unitPrice: lineUnitPrice,
      discountPercentage: lineDiscountPct,
      taxPercentage: lineTaxPct,
      lineTotal,
    };

    setCartItems((prev) => [...prev, newItem]);
    setSelectedProduct(null);
    setProductSearch('');
    setFefoData(null);
    setLineBilledQty(1);
    setLineBonusQty(0);
    searchInputRef.current?.focus();
    showFeedback('success', `Added ${newItem.productName} to cart.`);
  };

  const handleRemoveCartItem = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Financial calculations
  const cartSubtotal = cartItems.reduce(
    (acc, it) => acc + it.billedQuantity * it.unitPrice,
    0,
  );
  const cartLineDiscounts = cartItems.reduce(
    (acc, it) => acc + (it.billedQuantity * it.unitPrice * (it.discountPercentage / 100)),
    0,
  );
  const totalDiscount = cartLineDiscounts + (Number(overallDiscount) || 0);
  const cartTax = cartItems.reduce((acc, it) => {
    const gross = it.billedQuantity * it.unitPrice;
    const disc = gross * (it.discountPercentage / 100);
    return acc + (gross - disc) * (it.taxPercentage / 100);
  }, 0);
  const netTotal = Math.max(0, cartSubtotal - totalDiscount + cartTax);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
  const currentCustBalance = Number(selectedCustomer?.currentBalance || 0);
  const custCreditLimit = Number(selectedCustomer?.creditLimit || 0);
  const isCreditExceeded =
    paymentMethod === 'CREDIT_ACCOUNT' &&
    currentCustBalance + netTotal > custCreditLimit &&
    custCreditLimit > 0;

  // Open Tender Modal
  const handleOpenTender = () => {
    if (cartItems.length === 0) {
      showFeedback('error', 'Cart is empty. Add products before proceeding to settlement.');
      return;
    }
    if (!selectedWarehouseId) {
      showFeedback('error', 'Please select a dispatch warehouse.');
      return;
    }
    if (paymentMethod === 'CREDIT_ACCOUNT' && isCreditExceeded) {
      showFeedback('error', 'Credit limit exceeded for this customer.');
      return;
    }

    setTenderCashAmount(netTotal);
    setTenderCardAmount(0);
    setTenderBankAmount(0);
    setIsTenderModalOpen(true);
  };

  // Post Invoice (Immediate checkout)
  const handlePostInvoice = async (isParkDraft: boolean = false) => {
    if (cartItems.length === 0) return;
    setIsPosting(true);
    try {
      const paymentsPayload = [];
      if (!isParkDraft) {
        if (paymentMethod === 'CASH') {
          paymentsPayload.push({
            paymentMethod: 'CASH' as const,
            amount: netTotal,
            notes: 'Cash payment tendered at POS checkout',
          });
        } else if (paymentMethod === 'CREDIT_CARD' || tenderCardAmount > 0) {
          paymentsPayload.push({
            paymentMethod: 'CREDIT_CARD' as const,
            amount: tenderCardAmount || netTotal,
            referenceNumber: tenderCardRef || undefined,
          });
        } else if (paymentMethod === 'BANK_TRANSFER' || tenderBankAmount > 0) {
          paymentsPayload.push({
            paymentMethod: 'BANK_TRANSFER' as const,
            amount: tenderBankAmount || netTotal,
            referenceNumber: tenderBankRef || undefined,
          });
        }
      }

      const res = await salesApi.createInvoice({
        customerId: selectedCustomerId,
        warehouseId: selectedWarehouseId,
        paymentMethod,
        overallDiscountAmount: Number(overallDiscount) || 0,
        notes: invoiceNotes.trim() || undefined,
        isDraft: isParkDraft,
        items: cartItems.map((it) => ({
          productId: it.productId,
          batchId: it.batchId,
          billedQuantity: it.billedQuantity,
          bonusQuantity: it.bonusQuantity,
          unitPrice: it.unitPrice,
          discountPercentage: it.discountPercentage,
          taxPercentage: it.taxPercentage,
        })),
        payments: paymentsPayload,
      });

      setIsTenderModalOpen(false);
      setCartItems([]);
      setOverallDiscount(0);
      setInvoiceNotes('');

      if (isParkDraft) {
        showFeedback('success', `Draft invoice saved (${res.draftNumber || 'Parked'}).`);
      } else {
        showFeedback('success', `Sales Invoice ${res.invoiceNumber} posted successfully.`);
        // Open receipt modal
        const fullInv = await salesApi.getInvoiceById(res.id);
        setReceiptInvoice(fullInv);
      }

      loadMasterData();
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || err.message || 'Failed to post invoice');
    } finally {
      setIsPosting(false);
    }
  };

  // Cancel Invoice
  const handleCancelInvoice = async () => {
    if (!cancellingInvoice || !cancellationReason.trim()) {
      showFeedback('error', 'Please provide a reason for cancelling this invoice.');
      return;
    }
    try {
      await salesApi.cancelInvoice(cancellingInvoice.id, {
        cancellationReason: cancellationReason.trim(),
      });
      showFeedback('success', `Invoice ${cancellingInvoice.invoiceNumber} cancelled and stock restored.`);
      setCancellingInvoice(null);
      setCancellationReason('');
      loadInvoices();
      loadMasterData();
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || err.message || 'Failed to cancel invoice');
    }
  };

  // Post Draft from History
  const handlePostDraft = async (draftId: string) => {
    try {
      const res = await salesApi.postDraftInvoice(draftId);
      showFeedback('success', `Draft promoted to POSTED Invoice ${res.invoiceNumber}`);
      loadInvoices();
      loadMasterData();
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || err.message || 'Failed to post draft');
    }
  };

  // Filter products for dropdown
  const filteredProducts = productSearch.trim()
    ? products
        .filter(
          (p) =>
            p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
            p.sku.toLowerCase().includes(productSearch.toLowerCase()) ||
            p.genericName.toLowerCase().includes(productSearch.toLowerCase()),
        )
        .slice(0, 8)
    : [];

  return (
    <div className="space-y-4">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-lg border text-xs font-medium transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-surface-border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600">
            <Receipt className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-charcoal-900">
              Sales & Invoicing Terminal
            </h1>
            <p className="text-xs text-charcoal-500">
              High-speed retail dispensing, wholesale distribution bills, and FEFO stock deduction
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-surface-muted p-1 rounded-lg flex items-center gap-1 border border-surface-border">
            <button
              onClick={() => setActiveTab('POS')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'POS'
                  ? 'bg-white text-brand-700 shadow-xs'
                  : 'text-charcoal-600 hover:text-charcoal-900'
              }`}
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>POS / Billing Counter</span>
            </button>
            <button
              onClick={() => setActiveTab('INVOICES')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'INVOICES'
                  ? 'bg-white text-brand-700 shadow-xs'
                  : 'text-charcoal-600 hover:text-charcoal-900'
              }`}
            >
              <Receipt className="h-3.5 w-3.5" />
              <span>Invoices History</span>
            </button>
          </div>
        </div>
      </div>

      {/* Daily Sales Metrics Highlights */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-white rounded-lg border border-surface-border">
            <p className="text-[10px] uppercase font-semibold text-charcoal-500">Today's Sales</p>
            <p className="text-sm font-bold text-charcoal-900 mt-0.5">
              PKR {Number(metrics.today?.grossSales || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="p-3 bg-white rounded-lg border border-surface-border">
            <p className="text-[10px] uppercase font-semibold text-charcoal-500">Invoices Billed</p>
            <p className="text-sm font-bold text-brand-600 mt-0.5">{metrics.today?.invoiceCount || 0}</p>
          </div>
          <div className="p-3 bg-white rounded-lg border border-surface-border">
            <p className="text-[10px] uppercase font-semibold text-charcoal-500">Cash Collected</p>
            <p className="text-sm font-bold text-emerald-700 mt-0.5">
              PKR {Number(metrics.today?.cashCollected || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="p-3 bg-white rounded-lg border border-surface-border">
            <p className="text-[10px] uppercase font-semibold text-charcoal-500">Receivables Added</p>
            <p className="text-sm font-bold text-amber-700 mt-0.5">
              PKR {Number(metrics.today?.creditReceivablesAdded || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      )}

      {activeTab === 'POS' ? (
        /* ========================================================================= */
        /* TAB 1: POS BILLING COUNTER & TERMINAL                                     */
        /* ========================================================================= */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* LEFT 8-COLS: Product Search, FEFO Batch Card, and Cart Items */}
          <div className="lg:col-span-8 space-y-4">
            {/* Header Settings Bar */}
            <Card className="p-3.5 bg-white border border-surface-border space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-charcoal-600 mb-1">
                    Customer / Party *
                  </label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full h-8.5 px-2.5 rounded border border-surface-border bg-white text-xs font-medium text-charcoal-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code}) - {c.customerType.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-charcoal-600 mb-1">
                    Dispatch Warehouse *
                  </label>
                  <select
                    value={selectedWarehouseId}
                    onChange={(e) => setSelectedWarehouseId(e.target.value)}
                    className="w-full h-8.5 px-2.5 rounded border border-surface-border bg-white text-xs font-medium text-charcoal-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.code}) {w.isDefault ? '• Default' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-charcoal-600 mb-1">
                    Payment Terms
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full h-8.5 px-2.5 rounded border border-surface-border bg-white text-xs font-semibold text-charcoal-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="CASH">Cash Counter (Direct Settle)</option>
                    <option value="CREDIT_ACCOUNT">Credit Account (On Terms)</option>
                    <option value="CREDIT_CARD">Credit / Debit Card</option>
                    <option value="BANK_TRANSFER">Bank Online Transfer</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>
              </div>

              {/* Customer Balance / Credit Limit Warning Bar */}
              {selectedCustomer && (
                <div className="flex items-center justify-between px-3 py-1.5 rounded bg-surface-muted/40 border border-surface-border text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-charcoal-700">
                      {selectedCustomer.name}
                    </span>
                    <span className="text-charcoal-400">•</span>
                    <span className="text-charcoal-500 text-[11px]">
                      Credit Terms: {selectedCustomer.creditDays} Days
                    </span>
                    {Number(selectedCustomer.defaultDiscountPercentage) > 0 && (
                      <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                        {Number(selectedCustomer.defaultDiscountPercentage)}% Default Disc
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-charcoal-600">
                      Limit:{' '}
                      <strong>
                        PKR {Number(selectedCustomer.creditLimit).toLocaleString('en-PK')}
                      </strong>
                    </span>
                    <span
                      className={`font-bold ${
                        isCreditExceeded
                          ? 'text-rose-600'
                          : Number(selectedCustomer.currentBalance) > 0
                          ? 'text-amber-700'
                          : 'text-emerald-700'
                      }`}
                    >
                      Balance: PKR{' '}
                      {Number(selectedCustomer.currentBalance).toLocaleString('en-PK', {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              )}
            </Card>

            {/* Fast Product Lookup Bar */}
            <Card className="p-3.5 bg-white border border-surface-border relative">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-charcoal-400" />
                  <Input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Scan Barcode or type SKU / Medicine Brand / Generic name..."
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      if (selectedProduct) setSelectedProduct(null);
                    }}
                    className="pl-9 text-xs h-9 font-medium"
                  />

                  {/* Dropdown Suggestions */}
                  {!selectedProduct && filteredProducts.length > 0 && (
                    <div className="absolute left-0 right-0 top-10 z-30 bg-white rounded-lg shadow-xl border border-surface-border divide-y divide-surface-border overflow-hidden">
                      {filteredProducts.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => handleSelectProduct(p)}
                          className="p-2.5 hover:bg-brand-50/50 cursor-pointer flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-semibold text-charcoal-900">
                              {p.name}
                            </div>
                            <div className="text-[11px] text-charcoal-500 font-mono">
                              {p.sku} • Generic: {p.genericName}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-brand-50 text-brand-700">
                              GST: {Number(p.taxPercentage)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Selected Product FEFO & Pricing Panel */}
              {selectedProduct && (
                <div className="mt-3 p-3 rounded-lg bg-brand-50/20 border border-brand-200/60 space-y-3 animate-in fade-in duration-100">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-brand-200/40 pb-2">
                    <div>
                      <span className="text-xs font-bold text-charcoal-900">
                        {selectedProduct.name}
                      </span>
                      <span className="text-[11px] text-charcoal-500 ml-2 font-mono">
                        ({selectedProduct.sku}) • {selectedProduct.genericName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {fefoLoading && (
                        <span className="text-[11px] text-brand-600 flex items-center gap-1 font-medium">
                          <RefreshCw className="h-3 w-3 animate-spin" />
                          Evaluating FEFO batches...
                        </span>
                      )}
                    </div>
                  </div>

                  {/* FEFO Advisory Batches */}
                  {fefoData?.allocation && (
                    <div>
                      <p className="text-[10px] font-bold uppercase text-charcoal-500 mb-1">
                        Earliest Expiring Available Batches (FEFO):
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {fefoData.allocation.allocations.map((a) => (
                          <div
                            key={a.batchId}
                            onClick={() => {
                              setLineBatchId(a.batchId);
                              setLineUnitPrice(
                                defaultPricingBase === 'MRP' ? a.retailPrice : a.tradePrice,
                              );
                            }}
                            className={`px-2.5 py-1.5 rounded-md border text-xs cursor-pointer transition-all ${
                              lineBatchId === a.batchId
                                ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
                                : 'bg-white text-charcoal-700 border-surface-border hover:border-brand-300'
                            }`}
                          >
                            <div className="font-bold flex items-center gap-1.5">
                              <span>Batch: {a.batchNumber}</span>
                              <span className="text-[10px] opacity-85">
                                (Avail: {a.availableQuantity})
                              </span>
                            </div>
                            <div className="text-[10px] opacity-90 flex items-center gap-2 mt-0.5">
                              <span>Exp: {new Date(a.expiryDate).toLocaleDateString('en-GB')}</span>
                              <span>•</span>
                              <span>TP: Rs.{a.tradePrice}</span>
                              <span>•</span>
                              <span>MRP: Rs.{a.retailPrice}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Line Entry Inputs */}
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5 pt-1">
                    <div>
                      <label className="block text-[10px] font-semibold text-charcoal-600 mb-0.5">
                        Billed Qty *
                      </label>
                      <Input
                        type="number"
                        min="1"
                        value={lineBilledQty}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setLineBilledQty(val);
                          fetchFefoDetails(selectedProduct.id, val, selectedCustomerId, selectedWarehouseId);
                        }}
                        className="h-8 text-xs font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-charcoal-600 mb-0.5">
                        Bonus / Free Qty
                      </label>
                      <Input
                        type="number"
                        min="0"
                        value={lineBonusQty}
                        onChange={(e) => setLineBonusQty(Number(e.target.value))}
                        className="h-8 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-charcoal-600 mb-0.5">
                        Unit Rate (PKR) *
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={lineUnitPrice}
                        onChange={(e) => setLineUnitPrice(Number(e.target.value))}
                        className="h-8 text-xs font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-charcoal-600 mb-0.5">
                        Discount %
                      </label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={lineDiscountPct}
                        onChange={(e) => setLineDiscountPct(Number(e.target.value))}
                        className="h-8 text-xs text-emerald-700 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-charcoal-600 mb-0.5">
                        Tax %
                      </label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={lineTaxPct}
                        onChange={(e) => setLineTaxPct(Number(e.target.value))}
                        className="h-8 text-xs text-charcoal-700 font-semibold"
                      />
                    </div>

                    <div className="flex items-end">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleAddToCart}
                        className="w-full h-8 text-xs font-bold"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" /> Add Line
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* Cart Table */}
            <Card className="bg-white border border-surface-border overflow-hidden">
              <div className="px-4 py-2.5 bg-surface-muted/30 border-b border-surface-border flex items-center justify-between">
                <span className="text-xs font-bold text-charcoal-800 flex items-center gap-1.5">
                  <ShoppingBag className="h-4 w-4 text-brand-600" />
                  Cart Line Items ({cartItems.length})
                </span>
                {cartItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCartItems([])}
                    className="text-[11px] text-rose-600 hover:text-rose-800 font-medium"
                  >
                    Clear Cart
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-surface-muted/50 border-b border-surface-border text-[10px] text-charcoal-600 uppercase font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Product Name & SKU</th>
                      <th className="py-2.5 px-3">Batch & Expiry</th>
                      <th className="py-2.5 px-3 text-center">Billed Qty</th>
                      <th className="py-2.5 px-3 text-center">Bonus Qty</th>
                      <th className="py-2.5 px-3 text-right">Unit Rate</th>
                      <th className="py-2.5 px-3 text-right">Disc %</th>
                      <th className="py-2.5 px-3 text-right">Tax %</th>
                      <th className="py-2.5 px-3 text-right">Line Total</th>
                      <th className="py-2.5 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {cartItems.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-charcoal-400">
                          <ShoppingBag className="h-7 w-7 text-charcoal-300 mx-auto mb-1.5" />
                          <p className="font-medium text-charcoal-600 text-xs">
                            No items in invoice cart
                          </p>
                          <p className="text-[11px]">
                            Scan a barcode or search a medicine above to add lines
                          </p>
                        </td>
                      </tr>
                    ) : (
                      cartItems.map((item) => (
                        <tr key={item.id} className="hover:bg-brand-50/15">
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-charcoal-900">
                              {item.productName}
                            </div>
                            <div className="text-[10px] text-charcoal-500 font-mono">
                              {item.sku}
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-surface-muted text-charcoal-800">
                              {item.batchNumber}
                            </span>
                            <div className="text-[10px] text-charcoal-500 mt-0.5">
                              Exp: {item.expiryDate}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-charcoal-900">
                            {item.billedQuantity}
                          </td>
                          <td className="py-2.5 px-3 text-center font-semibold text-emerald-700">
                            {item.bonusQuantity > 0 ? `+${item.bonusQuantity}` : '—'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-medium text-charcoal-800">
                            Rs.{item.unitPrice.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-medium text-emerald-600">
                            {item.discountPercentage > 0 ? `${item.discountPercentage}%` : '—'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-medium text-charcoal-600">
                            {item.taxPercentage > 0 ? `${item.taxPercentage}%` : '—'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-charcoal-900">
                            Rs.{item.lineTotal.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveCartItem(item.id)}
                              className="p-1 rounded text-charcoal-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* RIGHT 4-COLS: Settlement & Payment Tender Sidebar */}
          <div className="lg:col-span-4 space-y-4">
            <Card className="p-4 bg-white border border-surface-border space-y-4 sticky top-4">
              <div className="flex items-center justify-between border-b border-surface-border pb-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-charcoal-700">
                  Settlement Summary
                </span>
                <StatusBadge variant="info">
                  {paymentMethod.replace('_', ' ')}
                </StatusBadge>
              </div>

              {/* Financial Calculation Breakdown */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-charcoal-600">
                  <span>Gross Subtotal:</span>
                  <span className="font-semibold text-charcoal-900">
                    PKR {cartSubtotal.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between items-center text-charcoal-600">
                  <span>Invoice Discount:</span>
                  <div className="w-24">
                    <Input
                      type="number"
                      min="0"
                      value={overallDiscount}
                      onChange={(e) => setOverallDiscount(Number(e.target.value))}
                      className="h-7 text-right text-xs font-semibold text-emerald-700"
                    />
                  </div>
                </div>

                <div className="flex justify-between text-charcoal-600">
                  <span>Sales Tax (GST):</span>
                  <span className="font-semibold text-charcoal-900">
                    PKR {cartTax.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="border-t border-surface-border pt-3 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-charcoal-900">
                    Net Total:
                  </span>
                  <span className="text-xl font-extrabold text-brand-700">
                    PKR {netTotal.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Notes Input */}
              <div>
                <label className="block text-[11px] font-semibold text-charcoal-600 mb-1">
                  Invoice Notes / Remarks
                </label>
                <Input
                  type="text"
                  placeholder="Optional customer purchase memo..."
                  value={invoiceNotes}
                  onChange={(e) => setInvoiceNotes(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleOpenTender}
                  disabled={cartItems.length === 0 || isPosting}
                  className="w-full h-10 text-xs font-bold shadow-md flex items-center justify-center gap-1.5"
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Tender & Post Invoice (F9)</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePostInvoice(true)}
                  disabled={cartItems.length === 0 || isPosting}
                  className="w-full h-8 text-xs text-charcoal-700 flex items-center justify-center gap-1.5"
                >
                  <Clock className="h-3.5 w-3.5" />
                  <span>Park as Draft (Quotation)</span>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* TAB 2: INVOICES HISTORY & CANCEL REVERSAL                                 */
        /* ========================================================================= */
        <Card className="bg-white border border-surface-border overflow-hidden space-y-4 p-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-surface-border">
            <div className="relative flex-1 max-w-sm w-full">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-charcoal-400" />
              <Input
                type="text"
                placeholder="Search Invoice #, Draft #, Customer..."
                value={invoiceSearch}
                onChange={(e) => setInvoiceSearch(e.target.value)}
                className="pl-8 text-xs h-9 w-full"
              />
            </div>

            <div className="flex items-center gap-2.5">
              <select
                value={invoiceStatusFilter}
                onChange={(e) => setInvoiceStatusFilter(e.target.value)}
                className="h-9 px-3 rounded-md border border-surface-border bg-white text-xs font-medium text-charcoal-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="ALL">All Status</option>
                <option value="POSTED">POSTED (Finalized)</option>
                <option value="DRAFT">DRAFT (Parked)</option>
                <option value="CANCELLED">CANCELLED (Reversed)</option>
              </select>

              <Button
                variant="outline"
                size="sm"
                onClick={loadInvoices}
                className="h-9 text-xs flex items-center gap-1"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Refresh</span>
              </Button>
            </div>
          </div>

          {/* Invoices List Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-surface-border bg-surface-muted/40 text-charcoal-600 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Invoice # / Draft</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-center">Items</th>
                  <th className="py-3 px-4 text-right">Net Total</th>
                  <th className="py-3 px-4 text-right">Paid</th>
                  <th className="py-3 px-4 text-right">Balance</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {invoicesLoading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-charcoal-400">
                      <RefreshCw className="h-6 w-6 animate-spin text-brand-600 mx-auto mb-1" />
                      <span>Loading invoices...</span>
                    </td>
                  </tr>
                ) : invoices.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-charcoal-400">
                      No sales invoices recorded yet.
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-brand-50/20">
                      <td className="py-3 px-4 font-mono font-bold text-charcoal-900">
                        {inv.invoiceNumber || inv.draftNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-charcoal-800">
                          {inv.customer?.name}
                        </div>
                        <div className="text-[10px] text-charcoal-500 font-mono">
                          {inv.customer?.code}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-charcoal-600">
                        {new Date(inv.invoiceDate).toLocaleDateString('en-GB')}
                      </td>
                      <td className="py-3 px-4 text-center font-medium text-charcoal-700">
                        {inv._count?.items || 0}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-charcoal-900">
                        PKR{' '}
                        {Number(inv.netTotal).toLocaleString('en-PK', {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-emerald-700">
                        PKR{' '}
                        {Number(inv.paidAmount).toLocaleString('en-PK', {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold">
                        <span
                          className={
                            Number(inv.balanceAmount) > 0
                              ? 'text-rose-600 font-bold'
                              : 'text-charcoal-500'
                          }
                        >
                          PKR{' '}
                          {Number(inv.balanceAmount).toLocaleString('en-PK', {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge
                          variant={
                            inv.status === 'POSTED'
                              ? 'success'
                              : inv.status === 'DRAFT'
                              ? 'warning'
                              : 'error'
                          }
                        >
                          {inv.status}
                        </StatusBadge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={async () => {
                              const full = await salesApi.getInvoiceById(inv.id);
                              setReceiptInvoice(full);
                            }}
                            title="Print Receipt / Invoice"
                            className="p-1 rounded hover:bg-brand-50 text-charcoal-600 hover:text-brand-600"
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </button>

                          {inv.status === 'DRAFT' && (
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handlePostDraft(inv.id)}
                              className="h-6 text-[10px] px-2"
                            >
                              Post Now
                            </Button>
                          )}

                          {inv.status === 'POSTED' && (
                            <button
                              type="button"
                              onClick={() => setCancellingInvoice(inv)}
                              title="Cancel / Void Invoice"
                              className="p-1 rounded hover:bg-rose-50 text-charcoal-400 hover:text-rose-600"
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
      )}

      {/* Settlement / Tender Modal */}
      {isTenderModalOpen && (
        <div className="fixed inset-0 z-50 bg-charcoal-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-surface-border max-w-lg w-full overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border bg-surface-muted/30">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-brand-600" />
                <h2 className="text-base font-bold text-charcoal-900">
                  Checkout Tender Settlement
                </h2>
              </div>
              <button
                onClick={() => setIsTenderModalOpen(false)}
                className="p-1 rounded-md text-charcoal-400 hover:text-charcoal-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 rounded-lg bg-brand-50 border border-brand-200 text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                  Total Amount Payable
                </p>
                <p className="text-3xl font-extrabold text-brand-900 mt-1">
                  PKR {netTotal.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                </p>
              </div>

              {paymentMethod === 'CASH' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                      Cash Tendered by Customer (PKR) *
                    </label>
                    <Input
                      type="number"
                      step="1"
                      min="0"
                      value={tenderCashAmount}
                      onChange={(e) => setTenderCashAmount(Number(e.target.value))}
                      className="text-base font-bold text-charcoal-900 h-10"
                    />
                  </div>

                  <div className="p-3 rounded-lg bg-surface-muted/60 border border-surface-border flex items-center justify-between">
                    <span className="text-xs font-bold text-charcoal-700">
                      Change to Return:
                    </span>
                    <span
                      className={`text-lg font-bold ${
                        tenderCashAmount >= netTotal
                          ? 'text-emerald-700'
                          : 'text-rose-600'
                      }`}
                    >
                      PKR{' '}
                      {Math.max(0, tenderCashAmount - netTotal).toLocaleString('en-PK', {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              )}

              {paymentMethod === 'CREDIT_CARD' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                      Card Authorization / Slip Ref #
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g. AUTH-88219"
                      value={tenderCardRef}
                      onChange={(e) => setTenderCardRef(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                </div>
              )}

              {paymentMethod === 'BANK_TRANSFER' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                      Bank Transfer Transaction / UTR Ref #
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g. UTR-9901827"
                      value={tenderBankRef}
                      onChange={(e) => setTenderBankRef(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                </div>
              )}

              {paymentMethod === 'CREDIT_ACCOUNT' && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-1">
                  <p className="font-bold flex items-center gap-1">
                    <ShieldCheck className="h-4 w-4 text-amber-600" />
                    Credit Sale Authorization
                  </p>
                  <p>
                    Full net total of PKR {netTotal.toFixed(2)} will be debited to{' '}
                    <strong>{selectedCustomer?.name}</strong> sub-ledger on {selectedCustomer?.creditDays}-day terms.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-surface-border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsTenderModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => handlePostInvoice(false)}
                  disabled={isPosting}
                  className="font-bold text-xs"
                >
                  {isPosting ? 'Processing Sale...' : 'Confirm & Print Bill'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice / Receipt Print Preview Modal */}
      {receiptInvoice && (
        <div className="fixed inset-0 z-50 bg-charcoal-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-surface-border max-w-md w-full overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border bg-surface-muted/30">
              <span className="text-xs font-bold text-charcoal-800 flex items-center gap-1.5">
                <Printer className="h-4 w-4 text-brand-600" />
                Receipt Preview ({receiptFormat})
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setReceiptFormat(receiptFormat === '80mm' ? 'A4' : '80mm')
                  }
                  className="text-[10px] px-2 py-0.5 rounded border border-surface-border font-medium hover:bg-surface-muted"
                >
                  Switch to {receiptFormat === '80mm' ? 'A4' : '80mm'}
                </button>
                <button
                  onClick={() => setReceiptInvoice(null)}
                  className="p-1 rounded text-charcoal-400 hover:text-charcoal-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Thermal 80mm Receipt Layout */}
            <div className="p-6 font-mono text-xs text-charcoal-900 space-y-3 bg-white max-h-[70vh] overflow-y-auto">
              <div className="text-center space-y-0.5 border-b border-dashed border-charcoal-400 pb-3">
                <h3 className="text-sm font-extrabold uppercase">
                  MEDIX PHARMACY
                </h3>
                <p className="text-[10px]">Head Office & Distribution Centre</p>
                <p className="text-[10px]">DSL #: DSL-KAR-99012 • NTN: 1234567-8</p>
                <p className="text-[10px] font-bold mt-1">
                  TAX INVOICE / CASH RECEIPT
                </p>
              </div>

              <div className="text-[11px] space-y-0.5 border-b border-dashed border-charcoal-300 pb-2">
                <div className="flex justify-between">
                  <span>Inv #: {receiptInvoice.invoiceNumber}</span>
                  <span>{new Date(receiptInvoice.invoiceDate).toLocaleDateString('en-GB')}</span>
                </div>
                <div>Customer: {receiptInvoice.customer?.name}</div>
                <div>Terms: {receiptInvoice.paymentMethod}</div>
              </div>

              {/* Items List */}
              <div className="border-b border-dashed border-charcoal-300 pb-2 space-y-2">
                {receiptInvoice.items?.map((it) => (
                  <div key={it.id} className="text-[11px]">
                    <div className="font-bold flex justify-between">
                      <span>{it.product?.name}</span>
                      <span>Rs.{Number(it.lineTotal).toFixed(2)}</span>
                    </div>
                    <div className="text-[10px] text-charcoal-600 flex justify-between">
                      <span>
                        BN: {it.batch?.batchNumber || it.batchNumber} (Exp:{' '}
                        {new Date(it.batch?.expiryDate || it.expiryDate).toLocaleDateString(
                          'en-GB',
                        )}
                        )
                      </span>
                      <span>
                        {it.billedQuantity} x Rs.{Number(it.unitPrice).toFixed(2)}{' '}
                        {it.bonusQuantity > 0 ? `(+${it.bonusQuantity} free)` : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Financial Summary */}
              <div className="text-[11px] space-y-1 border-b border-dashed border-charcoal-400 pb-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>Rs.{Number(receiptInvoice.subtotal).toFixed(2)}</span>
                </div>
                {Number(receiptInvoice.discountAmount) > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount:</span>
                    <span>-Rs.{Number(receiptInvoice.discountAmount).toFixed(2)}</span>
                  </div>
                )}
                {Number(receiptInvoice.taxAmount) > 0 && (
                  <div className="flex justify-between">
                    <span>GST Tax:</span>
                    <span>Rs.{Number(receiptInvoice.taxAmount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-extrabold text-sm pt-1">
                  <span>NET TOTAL:</span>
                  <span>Rs.{Number(receiptInvoice.netTotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-charcoal-600">
                  <span>Paid:</span>
                  <span>Rs.{Number(receiptInvoice.paidAmount).toFixed(2)}</span>
                </div>
                {Number(receiptInvoice.balanceAmount) > 0 && (
                  <div className="flex justify-between font-bold text-rose-700">
                    <span>Balance Due:</span>
                    <span>Rs.{Number(receiptInvoice.balanceAmount).toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="text-center text-[10px] text-charcoal-500 pt-2 space-y-0.5">
                <p>Goods once sold will not be returned without cash receipt.</p>
                <p>Warranty under Section 23 of Drug Act 1976.</p>
                <p className="font-bold">THANK YOU FOR YOUR BUSINESS!</p>
              </div>
            </div>

            <div className="p-4 bg-surface-muted/30 border-t border-surface-border flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReceiptInvoice(null)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => window.print()}
                className="flex items-center gap-1"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Document</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Invoice Confirmation Modal */}
      {cancellingInvoice && (
        <div className="fixed inset-0 z-50 bg-charcoal-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-surface-border max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border bg-rose-50/50">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-rose-600" />
                <h2 className="text-base font-bold text-rose-900">
                  Cancel Sales Invoice
                </h2>
              </div>
              <button
                onClick={() => setCancellingInvoice(null)}
                className="p-1 rounded-md text-charcoal-400 hover:text-charcoal-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-3 text-xs">
              <p className="text-charcoal-700">
                Are you sure you want to cancel invoice{' '}
                <strong className="font-mono text-charcoal-900">
                  {cancellingInvoice.invoiceNumber}
                </strong>{' '}
                (PKR {Number(cancellingInvoice.netTotal).toFixed(2)})?
              </p>
              <p className="text-charcoal-500">
                This will create compensating positive stock return movements into original batches and post ledger credit reversals.
              </p>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Cancellation Reason *
                </label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. Incorrect medicine selected, returned immediately"
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-surface-border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCancellingInvoice(null)}
                >
                  Back
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleCancelInvoice}
                  disabled={!cancellationReason.trim()}
                >
                  Confirm Cancellation
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
