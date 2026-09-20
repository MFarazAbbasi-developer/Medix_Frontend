import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Receipt,
  Search,
  RefreshCw,
  Trash2,
  Printer,
  Ban,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  ShoppingBag,
  CreditCard,
  Barcode,
  Building2,
  Edit2,
  Plus,
  Coins,
  Split,
  AlertTriangle,
  UserCheck,
  MapPin,
  Wallet,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Modal } from '../components/ui/Modal';
import { Combobox, ComboboxOption } from '../components/ui/Combobox';
import { toast } from '../components/ui/Toast';
import {
  salesApi,
  customersApi,
  customerAddressesApi,
  warehousesApi,
  productsApi,
  settingsApi,
  organizationApi,
  salesOperationsApi,
  tillSessionApi,
  TillSession,
  Customer,
  CustomerDeliveryAddress,
  Warehouse,
  Product,
  SalesInvoice,
  PaymentMethod,
  FefoPreviewResponse,
  Salesman,
  SalesRoute,
} from '../api';
import {
  DocumentPrintModal,
  SalesInvoicePrintTemplate,
  PrintableCompanyInfo,
  PrintableSalesInvoice,
} from '../components/printing';
import { usePermission } from '../hooks/usePermission';
import { formatApiErrorMessage } from '../utils';
import { clsx } from 'clsx';

export interface CartItem {
  id: string; // temporary cart row id
  productId: string;
  productName: string;
  sku: string;
  genericName: string;
  batchId?: string;
  batchNumber: string;
  expiryDate: string;
  billedQuantity: number;
  bonusQuantity: number;
  unitCost: number;
  tradePrice: number;
  retailPrice: number;
  unitPrice: number;
  discountPercentage: number;
  taxPercentage: number;
  lineTotal: number;
  pricingSource?: string;
  schemeName?: string;
  reason?: string;
  remarks?: string;
  allowMrpOverride?: boolean;
  mrpOverrideReason?: string;
}

export const SalesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'POS' | 'INVOICES'>('POS');
  const { hasPermission } = usePermission();
  const canOverrideDiscount = hasPermission('sales.override_discount');
  const canOverrideMrp = hasPermission('sales.override_mrp');

  // Master dropdown data
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [salesmen, setSalesmen] = useState<Salesman[]>([]);
  const [routes, setRoutes] = useState<SalesRoute[]>([]);
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [isProductsLoading, setIsProductsLoading] = useState<boolean>(false);
  const [defaultPricingBase, setDefaultPricingBase] = useState<'TP' | 'MRP'>('TP');

  // Selected POS header state
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [deliveryAddresses, setDeliveryAddresses] = useState<CustomerDeliveryAddress[]>([]);
  const [selectedDeliveryAddressId, setSelectedDeliveryAddressId] = useState<string>('');
  const [isRouteManuallyOverridden, setIsRouteManuallyOverridden] = useState<boolean>(false);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
  const [selectedSalesmanId, setSelectedSalesmanId] = useState<string>('');
  const [selectedRouteId, setSelectedRouteId] = useState<string>('');
  const [overallDiscount, setOverallDiscount] = useState<number>(0);
  const [invoiceNotes, setInvoiceNotes] = useState<string>('');

  // Cart state & selected row for keyboard navigation / inline editing
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number>(-1);
  const [isEditingRow, setIsEditingRow] = useState<boolean>(false);

  // MRP Override confirmation modal state
  const [isMrpOverrideModalOpen, setIsMrpOverrideModalOpen] = useState<boolean>(false);
  const [pendingMrpCartItem, setPendingMrpCartItem] = useState<CartItem | null>(null);
  const [mrpOverrideReasonInput, setMrpOverrideReasonInput] = useState<string>('');

  // Payment Tender Modal state
  const [isTenderModalOpen, setIsTenderModalOpen] = useState<boolean>(false);
  const [paymentMode, setPaymentMode] = useState<PaymentMethod | 'SPLIT'>('CASH');
  const [tenderCashAmount, setTenderCashAmount] = useState<number>(0);
  const [tenderCardRef, setTenderCardRef] = useState<string>('');
  const [tenderBankRef, setTenderBankRef] = useState<string>('');
  
  // Split Tenders State
  const [splitTenders, setSplitTenders] = useState<
    Array<{
      id: string;
      paymentMethod: PaymentMethod;
      amount: number;
      referenceNumber?: string;
      notes?: string;
    }>
  >([]);
  const [newSplitMethod, setNewSplitMethod] = useState<PaymentMethod>('CASH');
  const [newSplitAmount, setNewSplitAmount] = useState<string>('');
  const [newSplitRef, setNewSplitRef] = useState<string>('');
  const [newSplitNotes, setNewSplitNotes] = useState<string>('');

  const [isPosting, setIsPosting] = useState<boolean>(false);

  // Till Session & POS Quick-Open State
  const [activeTillSession, setActiveTillSession] = useState<TillSession | null>(null);
  const [isQuickOpenTillModalOpen, setIsQuickOpenTillModalOpen] = useState<boolean>(false);
  const [quickOpeningCash, setQuickOpeningCash] = useState<string>('0');
  const [quickOpenNotes, setQuickOpenNotes] = useState<string>('');
  const [isSubmittingQuickOpen, setIsSubmittingQuickOpen] = useState<boolean>(false);

  // Batch Picker Modal state
  const [batchPickerItem, setBatchPickerItem] = useState<CartItem | null>(null);
  const [batchPickerOptions, setBatchPickerOptions] = useState<FefoPreviewResponse | null>(null);
  const [isBatchPickerLoading, setIsBatchPickerLoading] = useState<boolean>(false);

  // Company & Settings for printable invoices
  const [company, setCompany] = useState<PrintableCompanyInfo>({
    name: 'MEDIX Pharmacy',
    legalName: 'MEDIX Pharma Distribution',
  });
  const [settingsMap, setSettingsMap] = useState<Record<string, string>>({});

  // Receipt Preview state
  const [receiptInvoice, setReceiptInvoice] = useState<SalesInvoice | null>(null);

  // Invoices History state
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState<boolean>(false);
  const [invoiceSearch, setInvoiceSearch] = useState<string>('');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<string>('ALL');
  const [cancellingInvoice, setCancellingInvoice] = useState<SalesInvoice | null>(null);
  const [cancellationReason, setCancellationReason] = useState<string>('');
  const [parkedDraftsCount, setParkedDraftsCount] = useState<number>(0);

  // Toast feedback
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const tenderCashInputRef = useRef<HTMLInputElement>(null);
  const cartItemsRef = useRef<CartItem[]>(cartItems);
  cartItemsRef.current = cartItems;

  const showFeedback = (type: 'success' | 'error', message: string | unknown) => {
    const formatted = type === 'error' ? formatApiErrorMessage(message) : (typeof message === 'string' ? message : String(message));
    setFeedback({ type, message: formatted });
    if (type === 'error') {
      toast.error(formatted);
    } else {
      toast.success(formatted);
    }
    setTimeout(() => setFeedback(null), 4500);
  };

  const focusProductSearch = useCallback(() => {
    if (typeof document === 'undefined') return;
    const input = document.getElementById('pos-product-search') as HTMLInputElement | null;
    if (input) {
      input.focus();
      input.select();
    }
  }, []);

  const focusCustomerSelect = useCallback(() => {
    if (typeof document === 'undefined') return;
    const input = document.getElementById('pos-customer-select') as HTMLInputElement | null;
    if (input) {
      input.focus();
      input.select();
    }
  }, []);

  // Load master data
  const loadMasterData = useCallback(async () => {
    try {
      const [custRes, whData, prodRes, settingsRes, orgRes, smRes, rtRes, activeSessionRes] = await Promise.all([
        customersApi.getCustomers({ isActive: true, limit: 100 }),
        warehousesApi.getWarehouses(),
        productsApi.getProducts({ limit: 50, isActive: 'true' }),
        settingsApi.getSettings().catch(() => ({ items: [], map: {} })),
        organizationApi.getOrganization().catch(() => null),
        salesOperationsApi.getSalesmen({ isActive: true, limit: 500 }).catch(() => ({ items: [] })),
        salesOperationsApi.getRoutes({ isActive: true, limit: 500 }).catch(() => ({ items: [] })),
        tillSessionApi.getActiveSession().catch(() => null),
      ]);

      if (activeSessionRes) {
        setActiveTillSession(activeSessionRes);
      }

      const custList = custRes?.items || [];
      setCustomers(custList);
      setWarehouses(whData || []);
      setProductsList(prodRes?.items || []);
      setSalesmen(smRes.items || []);
      setRoutes(rtRes.items || []);

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

      // Set default warehouse
      const defaultWh = whData?.find((w) => w.isDefault) || whData?.[0];
      if (defaultWh) {
        setSelectedWarehouseId((prev) => prev || defaultWh.id);
      }

      // Set default walk-in customer if exists
      const walkIn = custList.find((c) => c.code === 'CUST-WALKIN') || custList[0];
      if (walkIn) {
        setSelectedCustomerId((prev) => prev || walkIn.id);
        setSelectedSalesmanId((prev) => prev || walkIn.defaultSalesmanId || '');
        setSelectedRouteId((prev) => prev || walkIn.routeId || '');
        if (walkIn.customerType !== 'WALK_IN') {
          customerAddressesApi
            .list(walkIn.id, { isActive: true })
            .then((res) => {
              const addrs: CustomerDeliveryAddress[] = Array.isArray(res) ? res : (res as any)?.items || [];
              setDeliveryAddresses(addrs);
              const defaultAddr = addrs.find((a: CustomerDeliveryAddress) => a.isDefault);
              if (defaultAddr) {
                setSelectedDeliveryAddressId(defaultAddr.id);
                if (defaultAddr.routeId) {
                  setSelectedRouteId(defaultAddr.routeId);
                }
              }
            })
            .catch(() => {});
        }
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

  // Fetch / Refresh active till session
  const fetchActiveTill = useCallback(async () => {
    try {
      const session = await tillSessionApi.getActiveSession();
      setActiveTillSession(session);
      return session;
    } catch {
      setActiveTillSession(null);
      return null;
    }
  }, []);

  // Handle Quick Open Till Session from POS
  const handleQuickOpenTill = async () => {
    const openingAmt = parseFloat(quickOpeningCash);
    if (isNaN(openingAmt) || openingAmt < 0) {
      showFeedback('error', 'Please enter a valid positive opening cash amount.');
      return;
    }
    setIsSubmittingQuickOpen(true);
    try {
      const newSession = await tillSessionApi.openSession({
        openingCash: openingAmt,
        notes: quickOpenNotes.trim() || undefined,
      });
      setActiveTillSession(newSession);
      setIsQuickOpenTillModalOpen(false);
      setQuickOpeningCash('0');
      setQuickOpenNotes('');
      showFeedback('success', `Cash Till Session ${newSession.sessionNumber} opened successfully.`);
    } catch (err: any) {
      showFeedback('error', err?.response?.data?.message || err?.message || 'Failed to open till session.');
    } finally {
      setIsSubmittingQuickOpen(false);
    }
  };

  // Customer change handler
  const handleCustomerChange = useCallback(
    async (val: string) => {
      setSelectedCustomerId(val);
      setIsRouteManuallyOverridden(false);
      const cust = customers.find((c) => c.id === val);
      setSelectedSalesmanId(cust?.defaultSalesmanId || '');

      if (!cust || cust.customerType === 'WALK_IN') {
        setDeliveryAddresses([]);
        setSelectedDeliveryAddressId('');
        setSelectedRouteId(cust?.routeId || '');
        return;
      }

      try {
        const res = await customerAddressesApi.list(val, { isActive: true });
        const addrs: CustomerDeliveryAddress[] = Array.isArray(res) ? res : (res as any)?.items || [];
        setDeliveryAddresses(addrs);
        const defaultAddr = addrs.find((a: CustomerDeliveryAddress) => a.isDefault);
        if (defaultAddr) {
          setSelectedDeliveryAddressId(defaultAddr.id);
          if (defaultAddr.routeId) {
            setSelectedRouteId(defaultAddr.routeId);
          } else {
            setSelectedRouteId(cust.routeId || '');
          }
        } else {
          setSelectedDeliveryAddressId('');
          setSelectedRouteId(cust.routeId || '');
        }
      } catch {
        setDeliveryAddresses([]);
        setSelectedDeliveryAddressId('');
        setSelectedRouteId(cust?.routeId || '');
      }
    },
    [customers],
  );

  // Delivery Address change handler
  const handleDeliveryAddressChange = useCallback(
    (addrId: string) => {
      setSelectedDeliveryAddressId(addrId);
      if (!isRouteManuallyOverridden) {
        const chosen = deliveryAddresses.find((a) => a.id === addrId);
        if (chosen?.routeId) {
          setSelectedRouteId(chosen.routeId);
        } else {
          const cust = customers.find((c) => c.id === selectedCustomerId);
          setSelectedRouteId(cust?.routeId || '');
        }
      }
    },
    [deliveryAddresses, isRouteManuallyOverridden, customers, selectedCustomerId],
  );

  // Route change handler (records manual override)
  const handleRouteChange = useCallback((routeId: string) => {
    setIsRouteManuallyOverridden(true);
    setSelectedRouteId(routeId);
  }, []);

  useEffect(() => {
    loadMasterData();
  }, [loadMasterData]);

  // Load draft counts & invoices history
  const loadInvoices = useCallback(async () => {
    setInvoicesLoading(true);
    try {
      const res = await salesApi.getInvoices({
        search: invoiceSearch.trim() || undefined,
        status: invoiceStatusFilter === 'ALL' ? undefined : (invoiceStatusFilter as any),
        limit: 100,
      });
      const items = res?.items || [];
      setInvoices(items);
      const drafts = items.filter((i) => i.status === 'DRAFT').length;
      setParkedDraftsCount(drafts);
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || err.message || 'Failed to load invoices');
    } finally {
      setInvoicesLoading(false);
    }
  }, [invoiceSearch, invoiceStatusFilter]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  // Dynamic search for products (debounced)
  const handleProductSearch = useCallback(async (query: string) => {
    if (!query.trim()) return;
    setIsProductsLoading(true);
    try {
      const res = await productsApi.getProducts({
        search: query.trim(),
        isActive: 'true',
        limit: 25,
      });
      setProductsList(res.items || []);
    } catch {
      // ignore
    } finally {
      setIsProductsLoading(false);
    }
  }, []);

  // Customer options for Combobox
  const customerOptions: ComboboxOption[] = useMemo(() => {
    return customers.map((c) => ({
      value: c.id,
      label: `${c.name} (${c.code})`,
      sublabel: `Bal: PKR ${Number(c.currentBalance || 0).toLocaleString()} • Limit: PKR ${Number(c.creditLimit || 0).toLocaleString()} • ${c.creditDays}d`,
      badge: c.customerType === 'WALK_IN' ? 'WALK-IN' : 'ACCOUNT',
    }));
  }, [customers]);

  // Product options for Combobox
  const productOptions: ComboboxOption[] = useMemo(() => {
    return productsList.map((p) => ({
      value: p.id,
      label: p.name,
      sublabel: `SKU: ${p.sku} | Generic: ${p.genericName} | GST: ${p.taxPercentage}%`,
      badge: p.packSize ? `Pack: ${p.packSize}` : undefined,
    }));
  }, [productsList]);

  // Add Product Directly to Cart
  const handleAddProductToCart = useCallback(
    async (productId: string, overrideQty?: number) => {
      if (!productId || !selectedWarehouseId) {
        showFeedback('error', 'Please ensure a warehouse is selected.');
        return;
      }

      const product = productsList.find((p) => p.id === productId);
      if (!product) return;

      const qtyToAdd = overrideQty || 1;

      try {
        const preview = await salesApi.previewFefo({
          productId,
          warehouseId: selectedWarehouseId,
          requestedQuantity: qtyToAdd,
          customerId: selectedCustomerId || undefined,
        });

        const alloc = preview.allocation.allocations[0];
        let basePrice = alloc
          ? defaultPricingBase === 'MRP'
            ? alloc.retailPrice
            : alloc.tradePrice
          : 0;
        const discPct = preview.customerPricing?.discountPercentage || 0;

        if (preview.customerPricing?.customPrice) {
          basePrice = preview.customerPricing.customPrice;
        }

        const bonusQty = preview.customerPricing?.bonusQuantity || 0;
        const mrp = alloc ? alloc.retailPrice : 0;
        const isAboveMrp = basePrice > mrp && mrp > 0;

        const gross = qtyToAdd * basePrice;
        const discAmt = gross * (discPct / 100);
        const taxable = gross - discAmt;
        const taxPct = Number(product.taxPercentage || 0);
        const taxAmt = taxable * (taxPct / 100);
        const lineTotal = taxable + taxAmt;

        const candidateItem: CartItem = {
          id: `cart-${Date.now()}-${Math.random().toString().slice(2, 6)}`,
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          genericName: product.genericName,
          batchId: alloc?.batchId,
          batchNumber: alloc?.batchNumber ? alloc.batchNumber : 'AUTO · FEFO',
          expiryDate: alloc ? new Date(alloc.expiryDate).toLocaleDateString('en-GB') : '—',
          billedQuantity: qtyToAdd,
          bonusQuantity: bonusQty,
          unitCost: alloc ? alloc.purchaseCost : 0,
          tradePrice: alloc ? alloc.tradePrice : 0,
          retailPrice: mrp,
          unitPrice: basePrice,
          discountPercentage: discPct,
          taxPercentage: taxPct,
          lineTotal,
          pricingSource: preview.customerPricing?.pricingSource || undefined,
          schemeName: preview.customerPricing?.schemeName || undefined,
          reason: preview.customerPricing?.reason || undefined,
        };

        if (isAboveMrp) {
          if (!canOverrideMrp) {
            showFeedback(
              'error',
              `Unit rate Rs.${basePrice} exceeds MRP Rs.${mrp}. Requires sales.override_mrp permission.`,
            );
            return;
          }
          setPendingMrpCartItem(candidateItem);
          setMrpOverrideReasonInput('');
          setIsMrpOverrideModalOpen(true);
          return;
        }

        // Add to cart or increment if identical product + batch exists
        setCartItems((prev) => {
          const existingIdx = prev.findIndex(
            (it) => it.productId === candidateItem.productId && it.batchId === candidateItem.batchId,
          );
          if (existingIdx >= 0) {
            const updated = [...prev];
            const old = updated[existingIdx];
            const newQty = old.billedQuantity + qtyToAdd;
            const newGross = newQty * old.unitPrice;
            const newDiscAmt = newGross * (old.discountPercentage / 100);
            const newTaxable = newGross - newDiscAmt;
            const newTaxAmt = newTaxable * (old.taxPercentage / 100);
            updated[existingIdx] = {
              ...old,
              billedQuantity: newQty,
              lineTotal: newTaxable + newTaxAmt,
            };
            setSelectedRowIndex(existingIdx);
            return updated;
          } else {
            const newItems = [...prev, candidateItem];
            setSelectedRowIndex(newItems.length - 1);
            return newItems;
          }
        });

        showFeedback('success', `Added ${product.name} (Qty: ${qtyToAdd})`);
      } catch (err: any) {
        showFeedback('error', err.response?.data?.message || err.message || 'Failed to allocate product');
      } finally {
        // Return focus to search box for continuous barcode scanning
        setTimeout(focusProductSearch, 50);
      }
    },
    [productsList, selectedWarehouseId, selectedCustomerId, defaultPricingBase, canOverrideMrp, focusProductSearch],
  );

  // Confirm MRP Override
  const handleConfirmMrpOverride = () => {
    if (!mrpOverrideReasonInput.trim()) {
      showFeedback('error', 'Please provide a valid justification for the MRP override.');
      return;
    }
    if (pendingMrpCartItem) {
      const finalItem: CartItem = {
        ...pendingMrpCartItem,
        allowMrpOverride: true,
        mrpOverrideReason: mrpOverrideReasonInput.trim(),
        reason: `MRP Override (${mrpOverrideReasonInput.trim()})`,
      };
      setCartItems((prev) => {
        const next = [...prev, finalItem];
        setSelectedRowIndex(next.length - 1);
        return next;
      });
      setIsMrpOverrideModalOpen(false);
      setPendingMrpCartItem(null);
      setMrpOverrideReasonInput('');
      setTimeout(focusProductSearch, 50);
      showFeedback('success', `Added ${finalItem.productName} with authorized MRP override.`);
    }
  };

  // Remove Item from Cart
  const handleRemoveCartItem = useCallback((id: string) => {
    setCartItems((prev) => {
      const filtered = prev.filter((item) => item.id !== id);
      return filtered;
    });
    setSelectedRowIndex(-1);
    setIsEditingRow(false);
  }, []);

  // Update Cart Item In-Place (Selected Row Editing)
  const handleUpdateCartItem = (
    id: string,
    updates: Partial<Pick<CartItem, 'billedQuantity' | 'bonusQuantity' | 'unitPrice' | 'discountPercentage'>>,
  ) => {
    setCartItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;

        const newBilledQty = updates.billedQuantity !== undefined ? Math.max(1, updates.billedQuantity) : it.billedQuantity;
        const newBonusQty = updates.bonusQuantity !== undefined ? Math.max(0, updates.bonusQuantity) : it.bonusQuantity;
        const newUnitPrice = updates.unitPrice !== undefined ? Math.max(0, updates.unitPrice) : it.unitPrice;
        const newDiscountPct =
          updates.discountPercentage !== undefined && canOverrideDiscount
            ? Math.min(100, Math.max(0, updates.discountPercentage))
            : it.discountPercentage;

        const gross = newBilledQty * newUnitPrice;
        const discAmt = gross * (newDiscountPct / 100);
        const taxable = gross - discAmt;
        const taxAmt = taxable * (it.taxPercentage / 100);
        const lineTotal = taxable + taxAmt;

        return {
          ...it,
          billedQuantity: newBilledQty,
          bonusQuantity: newBonusQty,
          unitPrice: newUnitPrice,
          discountPercentage: newDiscountPct,
          lineTotal,
        };
      }),
    );
  };

  // Open Batch Picker for an item
  const handleOpenBatchPicker = async (item: CartItem) => {
    setBatchPickerItem(item);
    setIsBatchPickerLoading(true);
    try {
      const preview = await salesApi.previewFefo({
        productId: item.productId,
        warehouseId: selectedWarehouseId,
        requestedQuantity: item.billedQuantity,
        customerId: selectedCustomerId || undefined,
      });
      setBatchPickerOptions(preview);
    } catch {
      setBatchPickerOptions(null);
    } finally {
      setIsBatchPickerLoading(false);
    }
  };

  const handleSelectBatch = (allocBatch: {
    batchId: string;
    batchNumber: string;
    expiryDate: string;
    tradePrice: number;
    retailPrice: number;
    purchaseCost: number;
  }) => {
    if (!batchPickerItem) return;
    const targetId = batchPickerItem.id;
    setCartItems((prev) => {
      const targetIdx = prev.findIndex((it) => it.id === targetId);
      const updated = prev.map((it) => {
        if (it.id !== targetId) return it;
        const unitRate = defaultPricingBase === 'MRP' ? allocBatch.retailPrice : allocBatch.tradePrice;
        const gross = it.billedQuantity * unitRate;
        const discAmt = gross * (it.discountPercentage / 100);
        const taxable = gross - discAmt;
        const taxAmt = taxable * (it.taxPercentage / 100);
        return {
          ...it,
          batchId: allocBatch.batchId,
          batchNumber: allocBatch.batchNumber,
          expiryDate: new Date(allocBatch.expiryDate).toLocaleDateString('en-GB'),
          unitCost: allocBatch.purchaseCost,
          tradePrice: allocBatch.tradePrice,
          retailPrice: allocBatch.retailPrice,
          unitPrice: unitRate,
          lineTotal: taxable + taxAmt,
        };
      });
      if (targetIdx !== -1) {
        setSelectedRowIndex(targetIdx);
        setIsEditingRow(true);
      }
      return updated;
    });
    setBatchPickerItem(null);
    setBatchPickerOptions(null);
  };

  // Financial Calculations
  const cartSubtotal = cartItems.reduce((acc, it) => acc + it.billedQuantity * it.unitPrice, 0);
  const cartLineDiscounts = cartItems.reduce(
    (acc, it) => acc + it.billedQuantity * it.unitPrice * (it.discountPercentage / 100),
    0,
  );
  const totalDiscount = cartLineDiscounts + (Number(overallDiscount) || 0);
  const cartTax = cartItems.reduce((acc, it) => {
    const gross = it.billedQuantity * it.unitPrice;
    const disc = gross * (it.discountPercentage / 100);
    return acc + (gross - disc) * (it.taxPercentage / 100);
  }, 0);
  const netTotal = Math.max(0, cartSubtotal - totalDiscount + cartTax);

  // Customer Credit checks
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
  const currentCustBalance = Number(selectedCustomer?.currentBalance || 0);
  const custCreditLimit = Number(selectedCustomer?.creditLimit || 0);
  const isWalkInCustomer = selectedCustomer?.customerType === 'WALK_IN';
  const enforceCreditLimit = settingsMap['ENFORCE_CREDIT_LIMIT'] === 'true';
  const isCreditExceeded =
    paymentMode === 'CREDIT_ACCOUNT' &&
    currentCustBalance + netTotal > custCreditLimit &&
    custCreditLimit > 0;

  // Split calculations
  const totalSplitTendered = splitTenders.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  const splitRemainingDue = Math.max(0, netTotal - totalSplitTendered);
  const splitChangeToReturn = totalSplitTendered > netTotal ? totalSplitTendered - netTotal : 0;

  // Evaluation of payment completeness & validity
  const isPaymentValid = useMemo(() => {
    if (cartItems.length === 0 || netTotal <= 0) return false;

    if (paymentMode === 'CASH') {
      return (tenderCashAmount || netTotal) >= netTotal;
    }

    if (paymentMode === 'CREDIT_ACCOUNT') {
      if (isWalkInCustomer) return false;
      if (isCreditExceeded && enforceCreditLimit) return false;
      return true;
    }

    if (paymentMode === 'CREDIT_CARD') {
      return true;
    }

    if (paymentMode === 'BANK_TRANSFER') {
      return true;
    }

    if (paymentMode === 'SPLIT') {
      return totalSplitTendered >= netTotal && splitTenders.length > 0;
    }

    return false;
  }, [
    cartItems.length,
    netTotal,
    paymentMode,
    tenderCashAmount,
    isWalkInCustomer,
    isCreditExceeded,
    enforceCreditLimit,
    totalSplitTendered,
    splitTenders.length,
  ]);

  // Open Tender Modal
  const handleOpenTender = useCallback(() => {
    const currentCart = cartItemsRef.current || [];
    if (currentCart.length === 0) {
      showFeedback('error', 'Cart is empty. Scan or search products to begin.');
      return;
    }
    if (!selectedWarehouseId) {
      showFeedback('error', 'Please select a dispatch warehouse.');
      return;
    }

    setPaymentMode('CASH');
    setTenderCashAmount(netTotal);
    setTenderCardRef('');
    setTenderBankRef('');
    setSplitTenders([]);
    setNewSplitMethod('CASH');
    setNewSplitAmount(netTotal > 0 ? String(netTotal) : '');
    setNewSplitRef('');
    setNewSplitNotes('');
    setIsTenderModalOpen(true);

    setTimeout(() => {
      tenderCashInputRef.current?.focus();
      tenderCashInputRef.current?.select();
    }, 100);
  }, [selectedWarehouseId, netTotal]);

  // Add Split Tender row
  const handleAddSplitTender = () => {
    const amt = parseFloat(newSplitAmount);
    if (isNaN(amt) || amt <= 0) {
      showFeedback('error', 'Please enter a valid positive payment amount.');
      return;
    }

    const newTender = {
      id: `tender-${Date.now()}-${Math.random().toString().slice(2, 6)}`,
      paymentMethod: newSplitMethod,
      amount: amt,
      referenceNumber: newSplitRef.trim() || undefined,
      notes: newSplitNotes.trim() || undefined,
    };

    const updated = [...splitTenders, newTender];
    const newTotal = updated.reduce((sum, t) => sum + t.amount, 0);
    const rem = Math.max(0, netTotal - newTotal);

    setSplitTenders(updated);
    setNewSplitAmount(rem > 0 ? String(rem) : '');
    setNewSplitRef('');
    setNewSplitNotes('');
  };

  const handleRemoveSplitTender = (id: string) => {
    const updated = splitTenders.filter((t) => t.id !== id);
    const newTotal = updated.reduce((sum, t) => sum + t.amount, 0);
    const rem = Math.max(0, netTotal - newTotal);
    setSplitTenders(updated);
    setNewSplitAmount(rem > 0 ? String(rem) : '');
  };

  // Park Bill as Draft
  const handleParkBill = useCallback(async () => {
    if (cartItems.length === 0) {
      showFeedback('error', 'Cart is empty. Add products before parking bill.');
      return;
    }
    setIsPosting(true);
    try {
      const res = await salesApi.createInvoice({
        customerId: selectedCustomerId,
        deliveryAddressId: selectedDeliveryAddressId || undefined,
        warehouseId: selectedWarehouseId,
        salesmanId: selectedSalesmanId || undefined,
        routeId: selectedRouteId || undefined,
        paymentMethod: paymentMode === 'SPLIT' ? 'CASH' : paymentMode,
        overallDiscountAmount: Number(overallDiscount) || 0,
        notes: invoiceNotes.trim() || undefined,
        isDraft: true,
        items: cartItems.map((it) => ({
          productId: it.productId,
          batchId: it.batchId,
          billedQuantity: it.billedQuantity,
          bonusQuantity: it.bonusQuantity,
          unitPrice: it.unitPrice,
          discountPercentage: it.discountPercentage,
          taxPercentage: it.taxPercentage,
          allowMrpOverride: it.allowMrpOverride,
          mrpOverrideReason: it.mrpOverrideReason,
        })),
      });

      setCartItems([]);
      setSelectedRowIndex(-1);
      setIsEditingRow(false);
      setOverallDiscount(0);
      setInvoiceNotes('');
      showFeedback('success', `Bill parked successfully (${res.draftNumber || 'Draft'}).`);
      loadInvoices();
      setTimeout(focusProductSearch, 50);
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || err.message || 'Failed to park bill');
    } finally {
      setIsPosting(false);
    }
  }, [
    cartItems,
    selectedCustomerId,
    selectedDeliveryAddressId,
    selectedWarehouseId,
    selectedSalesmanId,
    selectedRouteId,
    paymentMode,
    overallDiscount,
    invoiceNotes,
    loadInvoices,
    focusProductSearch,
  ]);

  // Post Invoice (Checkout)
  const handlePostInvoice = async (isParkDraft: boolean = false) => {
    if (cartItems.length === 0) return;

    if (!isParkDraft && !isPaymentValid) {
      showFeedback('error', 'Please ensure payment amount satisfies total due before checkout.');
      return;
    }

    if (!isParkDraft) {
      const hasCashTender =
        paymentMode === 'CASH' ||
        (paymentMode === 'SPLIT' && splitTenders.some((t) => t.paymentMethod === 'CASH'));
      if (hasCashTender && !activeTillSession) {
        setIsQuickOpenTillModalOpen(true);
        showFeedback('error', 'A cash till session must be OPEN to process cash transactions.');
        return;
      }
    }

    setIsPosting(true);
    try {
      let paymentsPayload: Array<{
        paymentMethod: PaymentMethod;
        amount: number;
        referenceNumber?: string;
        notes?: string;
      }> = [];

      let finalPaymentMethod: PaymentMethod = 'CASH';

      if (!isParkDraft) {
        if (paymentMode === 'CASH') {
          finalPaymentMethod = 'CASH';
          const cashAmt = tenderCashAmount > 0 ? tenderCashAmount : netTotal;
          paymentsPayload = [
            {
              paymentMethod: 'CASH',
              amount: netTotal,
              notes:
                cashAmt > netTotal
                  ? `Tendered: PKR ${cashAmt.toLocaleString()} (Change: PKR ${(
                      cashAmt - netTotal
                    ).toLocaleString()})`
                  : 'Cash payment tendered at POS checkout',
            },
          ];
        } else if (paymentMode === 'CREDIT_ACCOUNT') {
          finalPaymentMethod = 'CREDIT_ACCOUNT';
          paymentsPayload = []; // Full credit debited to sub-ledger
        } else if (paymentMode === 'CREDIT_CARD') {
          finalPaymentMethod = 'CREDIT_CARD';
          paymentsPayload = [
            {
              paymentMethod: 'CREDIT_CARD',
              amount: netTotal,
              referenceNumber: tenderCardRef.trim() || undefined,
            },
          ];
        } else if (paymentMode === 'BANK_TRANSFER') {
          finalPaymentMethod = 'BANK_TRANSFER';
          paymentsPayload = [
            {
              paymentMethod: 'BANK_TRANSFER',
              amount: netTotal,
              referenceNumber: tenderBankRef.trim() || undefined,
            },
          ];
        } else if (paymentMode === 'SPLIT') {
          finalPaymentMethod = splitTenders[0]?.paymentMethod || 'CASH';
          paymentsPayload = splitTenders.map((t) => ({
            paymentMethod: t.paymentMethod,
            amount: Number(t.amount),
            referenceNumber: t.referenceNumber?.trim() || undefined,
            notes: t.notes?.trim() || undefined,
          }));
        }
      }

      const res = await salesApi.createInvoice({
        customerId: selectedCustomerId,
        deliveryAddressId: selectedDeliveryAddressId || undefined,
        warehouseId: selectedWarehouseId,
        salesmanId: selectedSalesmanId || undefined,
        routeId: selectedRouteId || undefined,
        paymentMethod: finalPaymentMethod,
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
          allowMrpOverride: it.allowMrpOverride,
          mrpOverrideReason: it.mrpOverrideReason,
        })),
        payments: paymentsPayload.length > 0 ? paymentsPayload : undefined,
      });

      setIsTenderModalOpen(false);
      setCartItems([]);
      setSelectedRowIndex(-1);
      setIsEditingRow(false);
      setOverallDiscount(0);
      setInvoiceNotes('');
      setSplitTenders([]);

      if (isParkDraft) {
        showFeedback('success', `Draft invoice saved (${res.draftNumber || 'Parked'}).`);
      } else {
        const creditWarnings = (res as any)?.creditWarnings;
        if (creditWarnings && creditWarnings.length > 0) {
          showFeedback('success', `Invoice ${res.invoiceNumber} posted. ${creditWarnings.join(' | ')}`);
        } else {
          showFeedback('success', `Sales Invoice ${res.invoiceNumber} posted successfully.`);
        }
        // Open receipt modal
        const fullInv = await salesApi.getInvoiceById(res.id);
        setReceiptInvoice(fullInv);
      }

      loadMasterData();
      fetchActiveTill();
      loadInvoices();
      setTimeout(focusProductSearch, 50);
    } catch (err: any) {
      // Keep active cart completely intact on error
      const errorMsg = err.response?.data?.message || err.message || 'Failed to post invoice';
      showFeedback('error', errorMsg);
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

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      const activeElement = document.activeElement as HTMLElement | null;
      const isInput = activeElement && ['input', 'textarea', 'select'].includes(activeElement.tagName.toLowerCase());

      // F12: Complete Sale inside Payment Modal (works reliably regardless of active input focus)
      if (e.key === 'F12' && isTenderModalOpen) {
        e.preventDefault();
        e.stopPropagation();
        if (isPaymentValid && !isPosting) {
          handlePostInvoice(false);
        } else if (!isPaymentValid) {
          showFeedback('error', 'Cannot complete sale: payment amount or credit authorization is incomplete.');
        }
        return;
      }

      // Quick payment method hotkeys 1-5 inside Payment modal when not typing in input
      if (isTenderModalOpen && !isInput) {
        if (e.key === '1') {
          e.preventDefault();
          setPaymentMode('CASH');
          setTimeout(() => tenderCashInputRef.current?.focus(), 50);
          return;
        }
        if (e.key === '2') {
          e.preventDefault();
          setPaymentMode('CREDIT_ACCOUNT');
          return;
        }
        if (e.key === '3') {
          e.preventDefault();
          setPaymentMode('CREDIT_CARD');
          return;
        }
        if (e.key === '4') {
          e.preventDefault();
          setPaymentMode('BANK_TRANSFER');
          return;
        }
        if (e.key === '5') {
          e.preventDefault();
          setPaymentMode('SPLIT');
          return;
        }
      }

      // F2 / Alt+S: Focus product search
      if (e.key === 'F2' || (e.altKey && e.key.toLowerCase() === 's')) {
        e.preventDefault();
        focusProductSearch();
        return;
      }

      // F3: Focus Customer selector
      if (e.key === 'F3') {
        e.preventDefault();
        focusCustomerSelect();
        return;
      }

      // F4 / Alt+P: Park Bill
      if (e.key === 'F4' || (e.altKey && e.key.toLowerCase() === 'p')) {
        e.preventDefault();
        handleParkBill();
        return;
      }

      // F9: Open Payment / Tender
      if (e.key === 'F9') {
        e.preventDefault();
        if (activeTab === 'POS' && !isTenderModalOpen) {
          handleOpenTender();
        }
        return;
      }

      // Escape: Close active modals or exit row editing
      if (e.key === 'Escape') {
        if (isTenderModalOpen) {
          e.preventDefault();
          setIsTenderModalOpen(false);
          setTimeout(focusProductSearch, 50);
          return;
        }
        if (isMrpOverrideModalOpen) {
          e.preventDefault();
          setIsMrpOverrideModalOpen(false);
          setPendingMrpCartItem(null);
          setMrpOverrideReasonInput('');
          setTimeout(focusProductSearch, 50);
          return;
        }
        if (batchPickerItem) {
          e.preventDefault();
          setBatchPickerItem(null);
          setBatchPickerOptions(null);
          setTimeout(focusProductSearch, 50);
          return;
        }
        if (isEditingRow) {
          e.preventDefault();
          setIsEditingRow(false);
          setTimeout(focusProductSearch, 50);
          return;
        }
      }

      // Cart Navigation via Up / Down arrow when not typing in text/combobox
      if (!isInput && activeTab === 'POS' && !isTenderModalOpen && !isMrpOverrideModalOpen && cartItems.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedRowIndex((prev) => (prev < cartItems.length - 1 ? prev + 1 : 0));
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedRowIndex((prev) => (prev > 0 ? prev - 1 : cartItems.length - 1));
          return;
        }
        if (e.key === 'Enter' && selectedRowIndex >= 0) {
          e.preventDefault();
          setIsEditingRow(true);
          return;
        }
      }

      // Delete key: Remove selected cart row when not typing in an input
      if (e.key === 'Delete' && !isInput && selectedRowIndex >= 0 && cartItems[selectedRowIndex] && activeTab === 'POS') {
        e.preventDefault();
        handleRemoveCartItem(cartItems[selectedRowIndex].id);
      }
    };

    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, [
    activeTab,
    isTenderModalOpen,
    isPaymentValid,
    isPosting,
    isMrpOverrideModalOpen,
    batchPickerItem,
    isEditingRow,
    selectedRowIndex,
    cartItems,
    handleParkBill,
    handleOpenTender,
    handleRemoveCartItem,
    focusProductSearch,
    focusCustomerSelect,
  ]);

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`fixed top-4 right-4 z-[9999] flex items-center gap-2 px-3.5 py-2.5 rounded-lg shadow-lg border text-xs font-semibold transition-all ${
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

      {/* COMPACT OPERATOR TOP BAR: Customer, Warehouse, Active Till, Tab Switcher */}
      <div className="bg-white px-3.5 py-2.5 rounded-lg border border-surface-border flex flex-wrap items-center justify-between gap-2.5 shrink-0 shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 shrink-0">
            <div className="h-8 w-8 rounded-lg bg-brand-50 flex items-center justify-center text-brand-700 border border-brand-100">
              <ShoppingBag className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-charcoal-900 leading-tight">POS Billing & Counter</h1>
              <p className="text-[10px] text-charcoal-500 hidden sm:block">Dispense medicines & print bill</p>
            </div>
          </div>

          <div className="h-6 w-[1px] bg-surface-border hidden md:block shrink-0" />

          {/* Customer Selection Combobox */}
          {activeTab === 'POS' && (
            <div className="w-56 lg:w-64 shrink-0">
              <Combobox
                options={customerOptions}
                value={selectedCustomerId}
                onChange={handleCustomerChange}
                placeholder="Select Customer / Khata (F3)..."
                isClearable={false}
                inputClassName="h-8 text-xs font-semibold"
                id="pos-customer-select"
              />
            </div>
          )}

          {/* Warehouse Selector */}
          {activeTab === 'POS' && (
            <div className="flex items-center gap-1.5 shrink-0 bg-surface-muted/50 px-2 py-0.5 rounded border border-surface-border">
              <Building2 className="h-3.5 w-3.5 text-charcoal-500 shrink-0" />
              <select
                value={selectedWarehouseId}
                onChange={(e) => setSelectedWarehouseId(e.target.value)}
                className="h-7 bg-transparent text-xs font-semibold text-charcoal-800 focus:outline-none max-w-[140px] truncate cursor-pointer"
                title="Dispatch Stock Warehouse"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} {w.isDefault ? '• Main' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Delivery Address Selector - visible only for non-WALK_IN customers */}
          {activeTab === 'POS' && selectedCustomer && selectedCustomer.customerType !== 'WALK_IN' && (
            <div className="flex items-center gap-1 shrink-0 bg-surface-muted/50 px-2 py-0.5 rounded border border-surface-border">
              <MapPin className="h-3.5 w-3.5 text-charcoal-500 shrink-0" />
              <select
                value={selectedDeliveryAddressId}
                onChange={(e) => handleDeliveryAddressChange(e.target.value)}
                className="h-7 bg-transparent text-xs font-medium text-charcoal-800 focus:outline-none max-w-[140px] truncate cursor-pointer"
                title="Delivery Destination Address"
              >
                <option value="">Counter / No Delivery</option>
                {deliveryAddresses.map((addr) => (
                  <option key={addr.id} value={addr.id}>
                    {addr.title}: {addr.address}, {addr.city} {addr.isDefault ? '• Default' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Salesman & Route (Progressive Selector for Delivery/Field orders) */}
          {activeTab === 'POS' && (
            <div className="flex items-center gap-1 shrink-0 text-xs">
              <select
                value={selectedSalesmanId}
                onChange={(e) => setSelectedSalesmanId(e.target.value)}
                className="h-8 px-2 rounded border border-surface-border bg-white text-xs font-medium text-charcoal-700 focus:outline-none max-w-[120px] truncate"
                title="Assigned Sales Representative"
              >
                <option value="">No Salesman</option>
                {salesmen.map((sm) => (
                  <option key={sm.id} value={sm.id}>
                    {sm.name} ({sm.code})
                  </option>
                ))}
              </select>

              <select
                value={selectedRouteId}
                onChange={(e) => handleRouteChange(e.target.value)}
                className="h-8 px-2 rounded border border-surface-border bg-white text-xs font-medium text-charcoal-700 focus:outline-none max-w-[110px] truncate"
                title="Assigned Route"
              >
                <option value="">No Route</option>
                {routes.map((rt) => (
                  <option key={rt.id} value={rt.id}>
                    {rt.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Right Tab Controls & Parked Drafts Indicator */}
        <div className="flex items-center gap-2 shrink-0">
          {activeTillSession ? (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold"
              title="Cash Drawer: Open"
            >
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <Wallet className="h-3.5 w-3.5 text-emerald-600" />
              <span>Cash Drawer: Open</span>
            </div>
          ) : (
            <button
              onClick={() => setIsQuickOpenTillModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold hover:bg-amber-100 transition-colors"
              title="Cash drawer is closed. Click to open."
            >
              <div className="h-2 w-2 rounded-full bg-amber-500" />
              <Wallet className="h-3.5 w-3.5 text-amber-600" />
              <span>Open Cash Drawer</span>
            </button>
          )}

          {parkedDraftsCount > 0 && (
            <button
              onClick={() => setActiveTab('INVOICES')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold hover:bg-amber-100 transition-colors"
              title="View Parked / Hold Bills"
            >
              <Clock className="h-3.5 w-3.5 text-amber-600" />
              <span>Hold Bills: {parkedDraftsCount}</span>
            </button>
          )}

          <div className="bg-surface-muted p-0.5 rounded flex items-center border border-surface-border text-xs">
            <button
              onClick={() => setActiveTab('POS')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'POS' ? 'bg-white text-brand-700 shadow-xs' : 'text-charcoal-600 hover:text-charcoal-900'
              }`}
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>POS Billing</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('INVOICES');
                loadInvoices();
              }}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'INVOICES' ? 'bg-white text-brand-700 shadow-xs' : 'text-charcoal-600 hover:text-charcoal-900'
              }`}
            >
              <Receipt className="h-3.5 w-3.5" />
              <span>Invoices History</span>
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'POS' ? (
        /* ========================================================================= */
        /* TAB 1: OPERATIONAL WORKSTATION (72% Cart + 28% Settlement)                */
        /* ========================================================================= */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0">
          {/* LEFT 72%: Product Combobox + Cart DataTable */}
          <div className="lg:col-span-9 flex flex-col h-full min-h-0 space-y-2.5">
            {/* Prominent Barcode / Product Search Combobox */}
            <div className="bg-white p-2.5 rounded-lg border border-surface-border shadow-xs shrink-0 flex items-center gap-2">
              <div className="relative flex-1">
                <Combobox
                  options={productOptions}
                  value=""
                  onChange={(val) => {
                    if (val) {
                      handleAddProductToCart(val, 1);
                    }
                  }}
                  onSearchChange={handleProductSearch}
                  isLoading={isProductsLoading}
                  placeholder="Scan barcode or type medicine brand / generic / SKU (F2)..."
                  inputClassName="h-9 text-xs font-medium pl-8"
                  id="pos-product-search"
                />
                <Barcode className="absolute left-2.5 top-2.5 h-4 w-4 text-charcoal-400 pointer-events-none" />
              </div>
            </div>

            {/* Dense Full-Height Cart DataTable */}
            <Card className="flex-1 min-h-0 bg-white border border-surface-border flex flex-col overflow-hidden">
              <div className="px-3 py-2 bg-surface-muted/40 border-b border-surface-border flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-charcoal-800">
                    Cart Items ({cartItems.length})
                  </span>
                  {selectedRowIndex >= 0 && cartItems[selectedRowIndex] && (
                    <span className="text-[10px] text-charcoal-500 font-medium">
                      • {isEditingRow ? 'Editing row (Enter: commit, Esc: cancel)' : 'Row selected (Enter: edit, Delete: remove)'}
                    </span>
                  )}
                </div>
                {cartItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setCartItems([]);
                      setSelectedRowIndex(-1);
                      setIsEditingRow(false);
                      setTimeout(focusProductSearch, 50);
                    }}
                    className="text-[11px] text-rose-600 hover:text-rose-800 font-medium"
                  >
                    Clear All
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto min-h-0">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-surface-muted/60 sticky top-0 z-10 border-b border-surface-border text-[10px] text-charcoal-600 uppercase font-bold tracking-wider">
                    <tr>
                      <th className="py-2 px-3 w-[26%]">Item / Medicine</th>
                      <th className="py-2 px-2.5 w-[14%]">Batch #</th>
                      <th className="py-2 px-2 w-[10%]">Expiry</th>
                      <th className="py-2 px-2 text-center w-[9%]">Qty (Packs)</th>
                      <th className="py-2 px-2 text-center w-[7%]" title="Free / Scheme Bonus Units">Bonus</th>
                      <th className="py-2 px-2.5 text-right w-[11%]">Rate / TP (PKR)</th>
                      <th className="py-2 px-2 text-right w-[9%]">Disc %</th>
                      <th className="py-2 px-3 text-right w-[11%]">Total (PKR)</th>
                      <th className="py-2 px-2 text-center w-[3%]"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {cartItems.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-20 text-center text-charcoal-400">
                          <ShoppingBag className="h-8 w-8 text-charcoal-300 mx-auto mb-2" />
                          <p className="font-semibold text-charcoal-700 text-xs">
                            Scan or search a product to begin
                          </p>
                          <p className="text-[11px] text-charcoal-400 mt-0.5">
                            Press <kbd className="px-1 py-0.5 bg-surface-muted rounded border border-surface-border text-[10px] font-mono">F2</kbd> to search or scan hardware barcode
                          </p>
                        </td>
                      </tr>
                    ) : (
                      cartItems.map((item, idx) => {
                        const isSelected = selectedRowIndex === idx;
                        const isEditingThisRow = isSelected && isEditingRow;

                        return (
                          <tr
                            key={item.id}
                            onClick={() => {
                              setSelectedRowIndex(idx);
                              setIsEditingRow(true);
                            }}
                            className={clsx(
                              'cursor-pointer transition-colors text-xs',
                              isSelected
                                ? 'bg-brand-50/50 ring-1 ring-inset ring-brand-300'
                                : 'hover:bg-surface-muted/30',
                            )}
                          >
                            {/* Product Name & Details */}
                            <td className="py-2 px-3 align-middle">
                              <div className="font-bold text-charcoal-900 truncate" title={item.productName}>
                                {item.productName}
                              </div>
                              <div className="text-[10px] text-charcoal-500 font-mono flex items-center gap-1.5 mt-0.5 truncate">
                                <span>{item.sku}</span>
                                {item.genericName && (
                                  <>
                                    <span>•</span>
                                    <span className="truncate">{item.genericName}</span>
                                  </>
                                )}
                                {item.schemeName && (
                                  <span className="px-1 py-0.2 rounded text-[9px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                                    {item.schemeName}
                                  </span>
                                )}
                                {item.allowMrpOverride && (
                                  <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                    MRP OVR
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Batch Pill & Selector */}
                            <td className="py-2 px-2.5 align-middle">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenBatchPicker(item);
                                }}
                                className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-surface-muted hover:bg-brand-100 text-charcoal-800 border border-surface-border flex items-center gap-1"
                                title="Click to view/change batch"
                              >
                                <span>{item.batchNumber}</span>
                                <Edit2 className="h-2.5 w-2.5 text-charcoal-400" />
                              </button>
                            </td>

                            {/* Expiry */}
                            <td className="py-2 px-2 align-middle text-[11px] text-charcoal-600 font-mono">
                              {item.expiryDate}
                            </td>

                            {/* Billed Quantity */}
                            <td className="py-2 px-2 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                              {isEditingThisRow ? (
                                <input
                                  type="number"
                                  min="1"
                                  value={item.billedQuantity}
                                  onChange={(e) =>
                                    handleUpdateCartItem(item.id, {
                                      billedQuantity: parseInt(e.target.value, 10) || 1,
                                    })
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      setIsEditingRow(false);
                                      focusProductSearch();
                                    } else if (e.key === 'Escape') {
                                      e.preventDefault();
                                      setIsEditingRow(false);
                                      focusProductSearch();
                                    }
                                  }}
                                  className="w-14 h-7 text-center font-bold text-xs border border-brand-500 rounded bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                                  autoFocus
                                />
                              ) : (
                                <span className="font-bold text-charcoal-900">{item.billedQuantity}</span>
                              )}
                            </td>

                            {/* Bonus Quantity */}
                            <td className="py-2 px-2 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                              {isEditingThisRow ? (
                                <input
                                  type="number"
                                  min="0"
                                  value={item.bonusQuantity}
                                  onChange={(e) =>
                                    handleUpdateCartItem(item.id, {
                                      bonusQuantity: parseInt(e.target.value, 10) || 0,
                                    })
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      setIsEditingRow(false);
                                      focusProductSearch();
                                    } else if (e.key === 'Escape') {
                                      e.preventDefault();
                                      setIsEditingRow(false);
                                      focusProductSearch();
                                    }
                                  }}
                                  className="w-12 h-7 text-center text-xs font-semibold text-purple-700 border border-purple-300 rounded bg-white focus:outline-none"
                                />
                              ) : item.bonusQuantity > 0 ? (
                                <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 font-bold text-[10px] border border-purple-200">
                                  +{item.bonusQuantity}
                                </span>
                              ) : (
                                <span className="text-charcoal-400">—</span>
                              )}
                            </td>

                            {/* Unit Price */}
                            <td className="py-2 px-2.5 text-right align-middle" onClick={(e) => e.stopPropagation()}>
                              {isEditingThisRow ? (
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={item.unitPrice}
                                  onChange={(e) =>
                                    handleUpdateCartItem(item.id, {
                                      unitPrice: parseFloat(e.target.value) || 0,
                                    })
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      setIsEditingRow(false);
                                      focusProductSearch();
                                    } else if (e.key === 'Escape') {
                                      e.preventDefault();
                                      setIsEditingRow(false);
                                      focusProductSearch();
                                    }
                                  }}
                                  className="w-20 h-7 text-right font-bold text-xs border border-brand-500 rounded bg-white focus:outline-none"
                                />
                              ) : (
                                <span className="font-medium text-charcoal-800">
                                  Rs. {item.unitPrice.toFixed(2)}
                                </span>
                              )}
                            </td>

                            {/* Discount Percentage */}
                            <td className="py-2 px-2 text-right align-middle" onClick={(e) => e.stopPropagation()}>
                              {isEditingThisRow && canOverrideDiscount ? (
                                <input
                                  type="number"
                                  step="0.5"
                                  min="0"
                                  max="100"
                                  value={item.discountPercentage}
                                  onChange={(e) =>
                                    handleUpdateCartItem(item.id, {
                                      discountPercentage: parseFloat(e.target.value) || 0,
                                    })
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      setIsEditingRow(false);
                                      focusProductSearch();
                                    } else if (e.key === 'Escape') {
                                      e.preventDefault();
                                      setIsEditingRow(false);
                                      focusProductSearch();
                                    }
                                  }}
                                  className="w-14 h-7 text-right text-xs font-semibold text-emerald-700 border border-emerald-400 rounded bg-white focus:outline-none"
                                />
                              ) : item.discountPercentage > 0 ? (
                                <span className="font-semibold text-emerald-600">
                                  {item.discountPercentage}%
                                </span>
                              ) : (
                                <span className="text-charcoal-400">—</span>
                              )}
                            </td>

                            {/* Line Total */}
                            <td className="py-2 px-3 text-right font-bold text-charcoal-900 align-middle">
                              Rs. {item.lineTotal.toFixed(2)}
                            </td>

                            {/* Actions */}
                            <td className="py-2 px-2 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => handleRemoveCartItem(item.id)}
                                className="p-1 rounded text-charcoal-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Remove line (Delete)"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* RIGHT 28%: Compact Settlement & Payment Panel */}
          <div className="lg:col-span-3 flex flex-col h-full min-h-0 space-y-2.5">
            {/* Customer Credit Status Box */}
            {selectedCustomer && (
              <Card className="p-3 bg-white border border-surface-border text-xs shrink-0 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-charcoal-800 truncate" title={selectedCustomer.name}>
                    {selectedCustomer.name}
                  </span>
                  <StatusBadge
                    variant={
                      isCreditExceeded
                        ? enforceCreditLimit
                          ? 'error'
                          : 'warning'
                        : Number(selectedCustomer.currentBalance) > 0
                        ? 'warning'
                        : 'success'
                    }
                  >
                    {isCreditExceeded ? (enforceCreditLimit ? 'BLOCKED' : 'OVER LIMIT') : 'ACTIVE'}
                  </StatusBadge>
                </div>

                <div className="grid grid-cols-2 gap-1 pt-1 text-[11px] text-charcoal-600 border-t border-surface-border">
                  <div>
                    <span className="block text-[10px] text-charcoal-400 uppercase font-semibold">Credit Limit</span>
                    <span className="font-bold text-charcoal-800">
                      PKR {Number(selectedCustomer.creditLimit || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[10px] text-charcoal-400 uppercase font-semibold">Customer Balance (Udhaar)</span>
                    <span
                      className={`font-bold ${
                        Number(selectedCustomer.currentBalance) > 0 ? 'text-amber-700' : 'text-emerald-700'
                      }`}
                    >
                      PKR {Number(selectedCustomer.currentBalance || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </Card>
            )}

            {/* Financial Summary & Actions */}
            <Card className="p-3.5 bg-white border border-surface-border flex-1 flex flex-col justify-between overflow-y-auto">
              <div className="space-y-3 text-xs">
                <div className="font-bold text-[11px] uppercase tracking-wider text-charcoal-600 border-b border-surface-border pb-1.5 flex items-center justify-between">
                  <span>Settlement Summary</span>
                  <span className="text-[10px] text-charcoal-400 font-mono">{cartItems.length} lines</span>
                </div>

                {/* Subtotal */}
                <div className="flex justify-between text-charcoal-600">
                  <span>Gross Subtotal:</span>
                  <span className="font-bold text-charcoal-900">
                    PKR {cartSubtotal.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Overall Discount */}
                <div className="flex justify-between items-center text-charcoal-600">
                  <span>Bill Discount:</span>
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

                {/* Sales Tax */}
                <div className="flex justify-between text-charcoal-600">
                  <span>Sales Tax (GST):</span>
                  <span className="font-bold text-charcoal-900">
                    PKR {cartTax.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Invoice Notes Input */}
                <div>
                  <label className="block text-[10px] font-semibold text-charcoal-500 mb-0.5">
                    Order Remarks (Optional)
                  </label>
                  <Input
                    type="text"
                    placeholder="Customer ref / memo..."
                    value={invoiceNotes}
                    onChange={(e) => setInvoiceNotes(e.target.value)}
                    className="h-7 text-xs"
                  />
                </div>

                {/* Net Total Box */}
                <div className="p-3 rounded-lg bg-surface-muted/60 border border-surface-border flex flex-col justify-center text-center">
                  <span className="text-[10px] uppercase font-bold text-charcoal-500 tracking-wider">
                    Net Payable
                  </span>
                  <span className="text-2xl font-black text-brand-700 tracking-tight mt-0.5">
                    PKR {netTotal.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-3 border-t border-surface-border mt-3">
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleOpenTender}
                  disabled={cartItems.length === 0 || isPosting}
                  className="w-full h-10 text-xs font-bold shadow-sm flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white"
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Pay / Complete Sale (F9)</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleParkBill}
                  disabled={cartItems.length === 0 || isPosting}
                  className="w-full h-8 text-xs font-semibold text-charcoal-700 flex items-center justify-center gap-1.5"
                >
                  <Clock className="h-3.5 w-3.5 text-charcoal-500" />
                  <span>Hold / Park Bill (F4)</span>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* TAB 2: INVOICES HISTORY & DRAFTS                                          */
        /* ========================================================================= */
        <Card className="flex-1 min-h-0 bg-white border border-surface-border flex flex-col p-3.5 space-y-3 overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="relative flex-1 max-w-sm w-full">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-charcoal-400" />
              <Input
                type="text"
                placeholder="Search Invoice #, Draft #, Customer..."
                value={invoiceSearch}
                onChange={(e) => setInvoiceSearch(e.target.value)}
                className="pl-8 text-xs h-8.5 w-full"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={invoiceStatusFilter}
                onChange={(e) => setInvoiceStatusFilter(e.target.value)}
                className="h-8.5 px-3 rounded border border-surface-border bg-white text-xs font-medium text-charcoal-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="ALL">All Status</option>
                <option value="POSTED">POSTED (Finalized)</option>
                <option value="DRAFT">DRAFT (Parked)</option>
                <option value="CANCELLED">CANCELLED (Reversed)</option>
              </select>

              <Button variant="outline" size="sm" onClick={loadInvoices} className="h-8.5 text-xs flex items-center gap-1">
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Refresh</span>
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 border border-surface-border rounded">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-surface-muted/60 sticky top-0 z-10 border-b border-surface-border text-[10px] text-charcoal-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Invoice # / Draft</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3 text-center">Items</th>
                  <th className="py-2.5 px-3 text-right">Net Total</th>
                  <th className="py-2.5 px-3 text-right">Paid</th>
                  <th className="py-2.5 px-3 text-right">Balance</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {invoicesLoading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-charcoal-400">
                      <RefreshCw className="h-5 w-5 animate-spin text-brand-600 mx-auto mb-1" />
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
                    <tr key={inv.id} className="hover:bg-brand-50/20 text-xs">
                      <td className="py-2 px-3 font-mono font-bold text-charcoal-900">
                        {inv.invoiceNumber || inv.draftNumber}
                      </td>
                      <td className="py-2 px-3">
                        <div className="font-semibold text-charcoal-800">{inv.customer?.name}</div>
                        <div className="text-[10px] text-charcoal-500 font-mono">{inv.customer?.code}</div>
                      </td>
                      <td className="py-2 px-3 text-charcoal-600">
                        {new Date(inv.invoiceDate).toLocaleDateString('en-GB')}
                      </td>
                      <td className="py-2 px-3 text-center font-medium text-charcoal-700">
                        {inv._count?.items || 0}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-charcoal-900">
                        PKR {Number(inv.netTotal).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-3 text-right font-medium text-emerald-700">
                        PKR {Number(inv.paidAmount).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-3 text-right font-semibold">
                        <span className={Number(inv.balanceAmount) > 0 ? 'text-rose-600 font-bold' : 'text-charcoal-500'}>
                          PKR {Number(inv.balanceAmount).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <StatusBadge
                          variant={inv.status === 'POSTED' ? 'success' : inv.status === 'DRAFT' ? 'warning' : 'error'}
                        >
                          {inv.status}
                        </StatusBadge>
                      </td>
                      <td className="py-2 px-3 text-right">
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

      {/* MODAL 1: Standardized Payment Tender Modal (F9 Payment) */}
      <Modal
        isOpen={isTenderModalOpen}
        onClose={() => {
          setIsTenderModalOpen(false);
          setTimeout(focusProductSearch, 50);
        }}
        title="Payment & Tender Settlement (F9)"
        size="lg"
      >
        <div
          className="space-y-4 text-xs"
          onKeyDown={(e) => {
            if (e.key === 'F12') {
              e.preventDefault();
              e.stopPropagation();
              if (isPaymentValid && !isPosting) {
                handlePostInvoice(false);
              } else if (!isPaymentValid) {
                showFeedback('error', 'Payment amount or credit authorization is incomplete.');
              }
            }
          }}
        >
          {/* Prominent Total Due Banner */}
          <div className="p-3.5 rounded-lg bg-charcoal-900 text-white flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm border border-charcoal-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-charcoal-300">
                  Total Amount Due
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-white/10 text-brand-200">
                  {cartItems.length} lines
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-0.5">
                PKR {netTotal.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            <div className="sm:text-right border-t sm:border-t-0 sm:border-l border-charcoal-700 pt-2 sm:pt-0 sm:pl-4 w-full sm:w-auto">
              <div className="text-[10px] text-charcoal-400 font-medium">Customer Account</div>
              <div className="font-bold text-white text-xs truncate max-w-[200px]" title={selectedCustomer?.name}>
                {selectedCustomer?.name || 'Walk-in Customer'}
              </div>
              <div className="text-[10px] font-mono text-charcoal-300 mt-0.5">
                {isWalkInCustomer ? 'WALK_IN (Cash Only)' : `${selectedCustomer?.code} • ${selectedCustomer?.creditDays}d terms`}
              </div>
            </div>
          </div>

          {/* Payment Method Selector with 1-5 hotkey switching */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-charcoal-800">Select Payment Method</label>
              <span className="text-[10px] text-charcoal-400 font-mono">
                Hotkeys: 1-Cash | 2-Credit | 3-Card | 4-Bank | 5-Split
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              {[
                { id: 'CASH', label: '1. Cash', method: 'CASH', icon: Coins },
                { id: 'CREDIT_ACCOUNT', label: '2. Credit Account', method: 'CREDIT_ACCOUNT', icon: UserCheck },
                { id: 'CREDIT_CARD', label: '3. Card', method: 'CREDIT_CARD', icon: CreditCard },
                { id: 'BANK_TRANSFER', label: '4. Bank UTR', method: 'BANK_TRANSFER', icon: Building2 },
                { id: 'SPLIT', label: '5. Split / Multi', method: 'SPLIT', icon: Split },
              ].map((item) => {
                const IconComponent = item.icon;
                const isSelected = paymentMode === item.method;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setPaymentMode(item.method as any);
                      if (item.method === 'CASH') {
                        if (!activeTillSession) {
                          setIsQuickOpenTillModalOpen(true);
                        } else {
                          setTimeout(() => tenderCashInputRef.current?.focus(), 50);
                        }
                      }
                    }}
                    className={clsx(
                      'px-2.5 py-2 rounded text-xs font-bold border transition-all flex items-center justify-center gap-1.5',
                      isSelected
                        ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
                        : 'bg-white text-charcoal-700 border-surface-border hover:bg-surface-muted',
                    )}
                  >
                    <IconComponent className="h-3.5 w-3.5 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* MODE 1: CASH PAYMENT */}
          {paymentMode === 'CASH' && (
            <div className="space-y-3 bg-surface-muted/40 p-3.5 rounded-lg border border-surface-border">
              {!activeTillSession && (
                <div className="rounded-lg border border-amber-200 bg-amber-50/90 p-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-amber-900">Cash Drawer is Closed</p>
                      <p className="text-[11px] text-amber-700">Open cash drawer to record cash payments and change.</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="primary"
                    className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs px-2.5 py-1"
                    onClick={() => setIsQuickOpenTillModalOpen(true)}
                  >
                    <Wallet className="h-3.5 w-3.5 mr-1" />
                    Open Cash Drawer
                  </Button>
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-charcoal-800 mb-1">
                  Cash Tendered by Customer (PKR)
                </label>
                <div className="relative">
                  <input
                    ref={tenderCashInputRef}
                    type="number"
                    step="1"
                    min="0"
                    value={tenderCashAmount || ''}
                    onChange={(e) => setTenderCashAmount(parseFloat(e.target.value) || 0)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (isPaymentValid && !isPosting) {
                          handlePostInvoice(false);
                        }
                      }
                    }}
                    className="w-full text-lg font-black text-charcoal-900 h-10 px-3 rounded border border-surface-border bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="Enter cash received..."
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setTenderCashAmount(netTotal);
                      tenderCashInputRef.current?.focus();
                    }}
                    className="absolute right-2 top-2 px-2 py-1 rounded bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold text-[10px] border border-brand-200"
                  >
                    Exact Amount
                  </button>
                </div>
              </div>

              {/* Quick Cash Presets & Add Chips */}
              <div>
                <span className="block text-[10px] font-semibold text-charcoal-500 uppercase tracking-wider mb-1">
                  Quick Amount Presets
                </span>
                <div className="flex gap-1.5 flex-wrap">
                  {[
                    netTotal,
                    Math.ceil(netTotal / 100) * 100,
                    Math.ceil(netTotal / 500) * 500,
                    Math.ceil(netTotal / 1000) * 1000,
                    5000,
                  ]
                    .filter((val, idx, arr) => val >= netTotal && arr.indexOf(val) === idx)
                    .map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setTenderCashAmount(preset);
                          tenderCashInputRef.current?.focus();
                        }}
                        className="px-2.5 py-1 rounded bg-white border border-surface-border text-xs font-semibold text-charcoal-800 hover:bg-brand-50 hover:border-brand-300 shadow-2xs"
                      >
                        Rs. {preset.toLocaleString()}
                      </button>
                    ))}

                  <div className="h-5 w-[1px] bg-surface-border mx-1 self-center" />

                  {[100, 500, 1000].map((addAmt) => (
                    <button
                      key={addAmt}
                      type="button"
                      onClick={() => {
                        setTenderCashAmount((prev) => (prev || 0) + addAmt);
                        tenderCashInputRef.current?.focus();
                      }}
                      className="px-2 py-1 rounded bg-surface-muted hover:bg-white border border-surface-border text-[11px] font-medium text-charcoal-600"
                    >
                      +Rs. {addAmt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cash Return / Shortfall Settlement Box */}
              <div className="p-3 rounded-lg bg-white border border-surface-border grid grid-cols-2 gap-3 items-center">
                <div>
                  <span className="block text-[10px] font-bold uppercase text-charcoal-500">Tendered Total</span>
                  <span className="font-bold text-charcoal-800 text-sm">
                    PKR {tenderCashAmount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] font-bold uppercase text-charcoal-500">
                    {tenderCashAmount >= netTotal ? 'Change to Return' : 'Remaining Due'}
                  </span>
                  <span
                    className={clsx(
                      'text-lg font-black',
                      tenderCashAmount >= netTotal ? 'text-emerald-700' : 'text-rose-600',
                    )}
                  >
                    PKR{' '}
                    {Math.abs(tenderCashAmount - netTotal).toLocaleString('en-PK', {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>

              {tenderCashAmount < netTotal && (
                <div className="flex items-center gap-1.5 text-rose-600 text-xs font-semibold">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>
                    Underpaid by PKR {(netTotal - tenderCashAmount).toLocaleString('en-PK', { minimumFractionDigits: 2 })}. Tender must cover total due.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* MODE 2: CREDIT ACCOUNT (No Cash/Change fields) */}
          {paymentMode === 'CREDIT_ACCOUNT' && (
            <div className="space-y-3">
              {isWalkInCustomer ? (
                <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-rose-800">
                    <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                    <span>Credit Sales Not Permitted for Walk-in Customer</span>
                  </div>
                  <p className="text-rose-700">
                    Walk-in customers have no credit facilities and must settle bills via Cash, Card, or Bank transfer.
                    To bill on credit, please select a registered account customer from the top bar (F3).
                  </p>
                </div>
              ) : (
                <div className="space-y-3 bg-surface-muted/30 p-3.5 rounded-lg border border-surface-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-amber-600 shrink-0" />
                      <span className="font-bold text-charcoal-900 text-xs">Customer Credit Profile</span>
                    </div>
                    <StatusBadge
                      variant={
                        isCreditExceeded
                          ? enforceCreditLimit
                            ? 'error'
                            : 'warning'
                          : 'success'
                      }
                    >
                      {isCreditExceeded ? (enforceCreditLimit ? 'CREDIT BLOCKED' : 'EXCEEDS LIMIT') : 'CREDIT AUTHORIZED'}
                    </StatusBadge>
                  </div>

                  {/* 4-Metric Credit Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="p-2.5 rounded bg-white border border-surface-border">
                      <span className="block text-[10px] font-bold text-charcoal-500 uppercase">Credit Limit</span>
                      <span className="font-bold text-charcoal-800 text-xs">
                        PKR {custCreditLimit.toLocaleString()}
                      </span>
                    </div>
                    <div className="p-2.5 rounded bg-white border border-surface-border">
                      <span className="block text-[10px] font-bold text-charcoal-500 uppercase">Customer Balance (Udhaar)</span>
                      <span
                        className={clsx(
                          'font-bold text-xs',
                          currentCustBalance > 0 ? 'text-amber-700' : 'text-emerald-700',
                        )}
                      >
                        PKR {currentCustBalance.toLocaleString()}
                      </span>
                    </div>
                    <div className="p-2.5 rounded bg-white border border-surface-border">
                      <span className="block text-[10px] font-bold text-charcoal-500 uppercase">Available Credit</span>
                      <span className="font-bold text-emerald-700 text-xs">
                        PKR {Math.max(0, custCreditLimit - currentCustBalance).toLocaleString()}
                      </span>
                    </div>
                    <div className="p-2.5 rounded bg-white border border-surface-border">
                      <span className="block text-[10px] font-bold text-charcoal-500 uppercase">Payment Terms</span>
                      <span className="font-bold text-charcoal-800 text-xs font-mono">
                        {selectedCustomer?.creditDays || 0} Days
                      </span>
                    </div>
                  </div>

                  {/* Projected Balance After Sale */}
                  <div className="p-2.5 rounded bg-white border border-surface-border flex items-center justify-between">
                    <span className="text-xs font-semibold text-charcoal-700">Projected Balance After Sale:</span>
                    <span
                      className={clsx(
                        'text-sm font-bold',
                        isCreditExceeded ? 'text-rose-600' : 'text-charcoal-900',
                      )}
                    >
                      PKR {(currentCustBalance + netTotal).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {isCreditExceeded && (
                    <div
                      className={clsx(
                        'p-2.5 rounded border text-xs flex items-center gap-2 font-medium',
                        enforceCreditLimit
                          ? 'bg-rose-50 border-rose-200 text-rose-800'
                          : 'bg-amber-50 border-amber-200 text-amber-800',
                      )}
                    >
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>
                        {enforceCreditLimit
                          ? `Credit limit exceeded by PKR ${(currentCustBalance + netTotal - custCreditLimit).toLocaleString()}. Checkout blocked by policy.`
                          : `Customer will exceed credit limit by PKR ${(currentCustBalance + netTotal - custCreditLimit).toLocaleString()}. Soft warning active.`}
                      </span>
                    </div>
                  )}

                  <p className="text-[11px] text-charcoal-500 leading-relaxed">
                    Posting will debit <strong>PKR {netTotal.toFixed(2)}</strong> to {selectedCustomer?.name} sub-ledger. No cash or physical change will be recorded.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* MODE 3: CREDIT CARD */}
          {paymentMode === 'CREDIT_CARD' && (
            <div className="space-y-3 bg-surface-muted/30 p-3.5 rounded-lg border border-surface-border">
              <div className="flex items-center justify-between p-2.5 bg-white rounded border border-surface-border">
                <span className="text-xs font-bold text-charcoal-700">Card Charge Amount:</span>
                <span className="text-base font-black text-brand-700">
                  PKR {netTotal.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal-800 mb-1">
                  Card Authorization / POS Slip Ref #
                </label>
                <Input
                  type="text"
                  placeholder="e.g. AUTH-99281 / Slip # 4492"
                  value={tenderCardRef}
                  onChange={(e) => setTenderCardRef(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (isPaymentValid && !isPosting) {
                        handlePostInvoice(false);
                      }
                    }
                  }}
                  className="text-xs h-9 font-medium"
                  autoFocus
                />
                <span className="text-[10px] text-charcoal-400 mt-1 block">
                  Optional reference code printed on the debit/credit card machine receipt slip.
                </span>
              </div>
            </div>
          )}

          {/* MODE 4: BANK TRANSFER / UTR */}
          {paymentMode === 'BANK_TRANSFER' && (
            <div className="space-y-3 bg-surface-muted/30 p-3.5 rounded-lg border border-surface-border">
              <div className="flex items-center justify-between p-2.5 bg-white rounded border border-surface-border">
                <span className="text-xs font-bold text-charcoal-700">Bank Transfer Amount:</span>
                <span className="text-base font-black text-brand-700">
                  PKR {netTotal.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal-800 mb-1">
                  Bank Transaction / UTR / Deposit Slip #
                </label>
                <Input
                  type="text"
                  placeholder="e.g. UTR-881920392 / Online IBFT Ref"
                  value={tenderBankRef}
                  onChange={(e) => setTenderBankRef(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (isPaymentValid && !isPosting) {
                        handlePostInvoice(false);
                      }
                    }
                  }}
                  className="text-xs h-9 font-medium"
                  autoFocus
                />
                <span className="text-[10px] text-charcoal-400 mt-1 block">
                  Reference number from bank deposit slip, IBFT, or electronic bank transfer.
                </span>
              </div>
            </div>
          )}

          {/* MODE 5: SPLIT / MULTI-TENDER */}
          {paymentMode === 'SPLIT' && (
            <div className="space-y-3 bg-surface-muted/30 p-3.5 rounded-lg border border-surface-border">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-charcoal-800">
                  Multiple Payment Tenders ({splitTenders.length})
                </span>
                <span className="text-[11px] text-charcoal-500 font-mono">
                  Split settlement across multiple payment channels
                </span>
              </div>

              {/* Tenders Table */}
              <div className="bg-white rounded border border-surface-border overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-surface-muted/60 border-b border-surface-border text-[10px] font-bold text-charcoal-600 uppercase">
                    <tr>
                      <th className="py-2 px-3">Method</th>
                      <th className="py-2 px-3">Reference / Slip</th>
                      <th className="py-2 px-3 text-right">Amount (PKR)</th>
                      <th className="py-2 px-2 text-center w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {splitTenders.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-charcoal-400 text-xs">
                          No tenders added yet. Enter tender details below to add.
                        </td>
                      </tr>
                    ) : (
                      splitTenders.map((t) => (
                        <tr key={t.id} className="hover:bg-surface-muted/30">
                          <td className="py-2 px-3 font-bold text-charcoal-900">
                            {t.paymentMethod === 'CASH'
                              ? 'Cash'
                              : t.paymentMethod === 'CREDIT_CARD'
                              ? 'Credit Card'
                              : 'Bank Transfer'}
                          </td>
                          <td className="py-2 px-3 text-charcoal-600 font-mono text-[11px]">
                            {t.referenceNumber || '—'}
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-charcoal-900">
                            PKR {Number(t.amount).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveSplitTender(t.id)}
                              className="p-1 rounded text-charcoal-400 hover:text-rose-600"
                              title="Remove tender"
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

              {/* Add New Tender Row */}
              <div className="p-2.5 rounded bg-white border border-surface-border space-y-2">
                <span className="block text-[10px] font-bold text-charcoal-600 uppercase">Add Tender Line</span>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                  <div className="sm:col-span-3">
                    <select
                      value={newSplitMethod}
                      onChange={(e) => setNewSplitMethod(e.target.value as PaymentMethod)}
                      className="w-full h-8 px-2 rounded border border-surface-border bg-white text-xs font-semibold text-charcoal-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    >
                      <option value="CASH">Cash</option>
                      <option value="CREDIT_CARD">Credit Card</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                    </select>
                  </div>

                  <div className="sm:col-span-4">
                    <Input
                      type="number"
                      step="1"
                      min="0"
                      placeholder="Amount (PKR)..."
                      value={newSplitAmount}
                      onChange={(e) => setNewSplitAmount(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSplitTender();
                        }
                      }}
                      className="h-8 text-xs font-bold"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <Input
                      type="text"
                      placeholder="Ref / Auth #..."
                      value={newSplitRef}
                      onChange={(e) => setNewSplitRef(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSplitTender();
                        }
                      }}
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddSplitTender}
                      className="w-full h-8 text-xs font-bold flex items-center justify-center gap-1"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add</span>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Split Balance Summary */}
              <div className="p-3 rounded-lg bg-white border border-surface-border grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <span className="block text-[10px] font-bold uppercase text-charcoal-500">Total Tendered</span>
                  <span className="font-bold text-charcoal-900 text-sm">
                    PKR {totalSplitTendered.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase text-charcoal-500">Remaining Due</span>
                  <span
                    className={clsx(
                      'font-black text-sm',
                      splitRemainingDue > 0 ? 'text-rose-600' : 'text-emerald-700',
                    )}
                  >
                    PKR {splitRemainingDue.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase text-charcoal-500">Change to Return</span>
                  <span className="font-bold text-emerald-700 text-sm">
                    PKR {splitChangeToReturn.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {splitRemainingDue > 0 && (
                <div className="flex items-center gap-1.5 text-rose-600 text-xs font-semibold">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Remaining balance of PKR {splitRemainingDue.toLocaleString()} must be satisfied before checkout.</span>
                </div>
              )}
            </div>
          )}

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-surface-border">
            <div className="text-[11px] text-charcoal-500">
              Press <kbd className="px-1.5 py-0.5 rounded bg-surface-muted border border-surface-border font-mono text-[10px] font-bold">F12</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-surface-muted border border-surface-border font-mono text-[10px] font-bold">Enter</kbd> to complete sale
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsTenderModalOpen(false);
                  setTimeout(focusProductSearch, 50);
                }}
              >
                Cancel (Esc)
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => handlePostInvoice(false)}
                disabled={isPosting || !isPaymentValid}
                className="font-bold text-xs px-4"
              >
                {isPosting ? (
                  <div className="flex items-center gap-1.5">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Processing Sale...</span>
                  </div>
                ) : (
                  'Complete Sale & Print (F12 / Enter)'
                )}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* MODAL 2: Batch Picker Modal */}
      <Modal
        isOpen={!!batchPickerItem}
        onClose={() => {
          setBatchPickerItem(null);
          setBatchPickerOptions(null);
          setTimeout(focusProductSearch, 50);
        }}
        title={`Select Batch — ${batchPickerItem?.productName || ''}`}
        size="md"
      >
        <div className="space-y-3">
          {isBatchPickerLoading ? (
            <div className="py-8 text-center text-charcoal-400">
              <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-1 text-brand-600" />
              <span className="text-xs">Evaluating available stock batches...</span>
            </div>
          ) : batchPickerOptions?.allocation?.allocations && batchPickerOptions.allocation.allocations.length > 0 ? (
            <div className="divide-y divide-surface-border border border-surface-border rounded overflow-hidden">
              {batchPickerOptions.allocation.allocations.map((alloc) => (
                <div
                  key={alloc.batchId}
                  onClick={() => handleSelectBatch(alloc)}
                  className="p-3 hover:bg-brand-50/50 cursor-pointer flex items-center justify-between text-xs transition-colors"
                >
                  <div>
                    <div className="font-bold text-charcoal-900 flex items-center gap-2">
                      <span>Batch: {alloc.batchNumber}</span>
                      <span className="text-[11px] font-normal text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                        Avail: {alloc.availableQuantity} units
                      </span>
                    </div>
                    <div className="text-[11px] text-charcoal-500 mt-0.5">
                      Expiry: {new Date(alloc.expiryDate).toLocaleDateString('en-GB')} • TP: Rs.{alloc.tradePrice} • MRP: Rs.{alloc.retailPrice}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="h-7 text-xs">
                    Select
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-xs text-rose-600">
              No other active unexpired batches found in warehouse.
            </p>
          )}

          <div className="flex justify-end pt-2 border-t border-surface-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setBatchPickerItem(null);
                setBatchPickerOptions(null);
                setTimeout(focusProductSearch, 50);
              }}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL 3: MRP Override Authorization Modal */}
      <Modal
        isOpen={isMrpOverrideModalOpen}
        onClose={() => {
          setIsMrpOverrideModalOpen(false);
          setPendingMrpCartItem(null);
          setMrpOverrideReasonInput('');
          setTimeout(focusProductSearch, 50);
        }}
        title="MRP Ceiling Override Authorization"
        size="md"
      >
        <div className="space-y-3 text-xs">
          {pendingMrpCartItem && (
            <div className="p-3 bg-amber-50/60 rounded border border-amber-200 space-y-1">
              <p className="font-bold text-charcoal-900">{pendingMrpCartItem.productName}</p>
              <div className="flex justify-between text-charcoal-700">
                <span>Entered Unit Rate:</span>
                <strong className="text-rose-600 font-mono">
                  PKR {pendingMrpCartItem.unitPrice.toFixed(2)}
                </strong>
              </div>
              <div className="flex justify-between text-charcoal-700">
                <span>Product MRP Ceiling:</span>
                <strong className="text-charcoal-900 font-mono">
                  PKR {pendingMrpCartItem.retailPrice?.toFixed(2) || 'N/A'}
                </strong>
              </div>
            </div>
          )}

          <p className="text-charcoal-600">
            Selling above MRP requires authorization and logs an audit entry with your user credentials.
          </p>

          <div>
            <label className="block text-xs font-semibold text-charcoal-700 mb-1">
              Override Justification / Reason *
            </label>
            <Input
              type="text"
              required
              placeholder="e.g. Special imported formulation, government emergency surcharge"
              value={mrpOverrideReasonInput}
              onChange={(e) => setMrpOverrideReasonInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && mrpOverrideReasonInput.trim()) {
                  e.preventDefault();
                  handleConfirmMrpOverride();
                }
              }}
              className="text-xs"
              autoFocus
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsMrpOverrideModalOpen(false);
                setPendingMrpCartItem(null);
                setMrpOverrideReasonInput('');
                setTimeout(focusProductSearch, 50);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirmMrpOverride}
              disabled={!mrpOverrideReasonInput.trim()}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
            >
              Authorize & Add Line (Enter)
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL 4: Invoice Cancellation Modal */}
      <Modal
        isOpen={!!cancellingInvoice}
        onClose={() => {
          setCancellingInvoice(null);
          setCancellationReason('');
        }}
        title="Cancel Sales Invoice"
        size="md"
      >
        <div className="space-y-3 text-xs">
          {cancellingInvoice && (
            <>
              <p className="text-charcoal-700">
                Are you sure you want to cancel invoice{' '}
                <strong className="font-mono text-charcoal-900">{cancellingInvoice.invoiceNumber}</strong> (PKR{' '}
                {Number(cancellingInvoice.netTotal).toFixed(2)})?
              </p>
              <p className="text-charcoal-500">
                This will create compensating stock return movements and post ledger credit reversals.
              </p>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Cancellation Reason *
                </label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. Incorrect medicine selected, customer returned immediately"
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && cancellationReason.trim()) {
                      e.preventDefault();
                      handleCancelInvoice();
                    }
                  }}
                  className="text-xs"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCancellingInvoice(null);
                    setCancellationReason('');
                  }}
                >
                  Back
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleCancelInvoice}
                  disabled={!cancellationReason.trim()}
                >
                  Confirm Cancellation (Enter)
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Document Print Modal for Invoices & Thermal Receipts */}
      {receiptInvoice && (
        <DocumentPrintModal
          isOpen={true}
          onClose={() => {
            setReceiptInvoice(null);
            setTimeout(focusProductSearch, 50);
          }}
          title={`Sales Invoice — ${receiptInvoice.invoiceNumber || receiptInvoice.draftNumber}`}
          subtitle={`${receiptInvoice.customer?.name || 'Walk-in Customer'} • ${new Date(
            receiptInvoice.invoiceDate,
          ).toLocaleDateString('en-GB')}`}
          defaultLayout="THERMAL"
          allowThermalToggle={true}
        >
          {(layout) => {
            const printableData: PrintableSalesInvoice = {
              invoiceNumber: receiptInvoice.invoiceNumber || receiptInvoice.draftNumber || 'INV-DRAFT',
              invoiceDate: new Date(receiptInvoice.invoiceDate).toLocaleDateString('en-GB'),
              dueDate: (receiptInvoice as any).dueDate
                ? new Date((receiptInvoice as any).dueDate).toLocaleDateString('en-GB')
                : null,
              status: receiptInvoice.status,
              paymentTerms: receiptInvoice.paymentMethod,
              salesmanName:
                (receiptInvoice as any).salesman?.name ||
                (receiptInvoice as any).salesman?.displayName ||
                (receiptInvoice as any).createdByUser?.displayName ||
                null,
              customer: {
                name: receiptInvoice.customer?.name || 'Walk-in Customer',
                code: receiptInvoice.customer?.code || null,
                address: receiptInvoice.customer?.address || null,
                city: receiptInvoice.customer?.city || null,
                phone: receiptInvoice.customer?.phone || null,
                ntn: receiptInvoice.customer?.ntn || null,
                drugSaleLicenseNo: receiptInvoice.customer?.drugSaleLicenseNo || null,
              },
              deliveryInfo: receiptInvoice.deliveryAddress
                ? {
                    title: receiptInvoice.deliveryTitle || null,
                    recipientName: receiptInvoice.deliveryRecipient || null,
                    phone: receiptInvoice.deliveryPhone || null,
                    address: receiptInvoice.deliveryAddress,
                    city: receiptInvoice.deliveryCity || null,
                    instructions: receiptInvoice.deliveryInstructions || null,
                  }
                : null,
              lines: (receiptInvoice.items || []).map((it, idx) => ({
                itemNumber: idx + 1,
                sku: it.product?.sku || (it as any).sku || '',
                productName: it.product?.name || (it as any).productName || 'Unknown Product',
                batchNumber: it.batch?.batchNumber || (it as any).batchNumber || 'STANDARD',
                expiryDate: it.batch?.expiryDate
                  ? new Date(it.batch.expiryDate).toLocaleDateString('en-GB')
                  : (it as any).expiryDate
                  ? new Date((it as any).expiryDate).toLocaleDateString('en-GB')
                  : 'N/A',
                quantity: Number(it.billedQuantity || 0),
                bonusQuantity: Number(it.bonusQuantity || 0),
                unitPrice: Number(it.unitPrice || 0),
                discountPercent: Number(it.discountPercentage || 0),
                discountAmount: Number(it.discountAmount || 0),
                salesTaxPercent: Number(it.taxPercentage || 0),
                salesTaxAmount: Number(it.taxAmount || 0),
                lineTotal: Number(it.lineTotal || 0),
              })),
              subtotal: Number(receiptInvoice.subtotal || 0),
              totalDiscount: Number(receiptInvoice.discountAmount || 0),
              totalTax: Number(receiptInvoice.taxAmount || 0),
              grandTotal: Number(receiptInvoice.netTotal || 0),
              amountPaid: Number(receiptInvoice.paidAmount || 0),
              balanceDue: Number(receiptInvoice.balanceAmount || 0),
              notes: receiptInvoice.notes || null,
              footerNotes:
                settingsMap['invoice_footer_notes'] || settingsMap['sales_invoice_footer'] || null,
              termsAndConditions: settingsMap['terms_and_conditions'] || null,
            };

            return (
              <SalesInvoicePrintTemplate invoice={printableData} company={company} layout={layout} />
            );
          }}
        </DocumentPrintModal>
      )}

      {/* MODAL: POS Quick Open Till Modal */}
      <Modal
        isOpen={isQuickOpenTillModalOpen}
        onClose={() => setIsQuickOpenTillModalOpen(false)}
        title="Open Till Session (Cash Drawer)"
        size="sm"
      >
        <div className="space-y-3 text-xs">
          <p className="text-charcoal-600">
            Enter the verified physical cash float handed over to this workstation drawer to start accepting cash payments.
          </p>

          <div>
            <label className="block text-xs font-semibold text-charcoal-700 mb-1">
              Opening Cash Float (PKR) *
            </label>
            <Input
              type="number"
              min="0"
              step="any"
              required
              autoFocus
              value={quickOpeningCash}
              onChange={(e) => setQuickOpeningCash(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleQuickOpenTill();
                }
              }}
              className="font-mono text-sm font-bold text-charcoal-900"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-700 mb-1">
              Session Notes (Optional)
            </label>
            <Input
              type="text"
              value={quickOpenNotes}
              onChange={(e) => setQuickOpenNotes(e.target.value)}
              placeholder="e.g. Morning Shift - Counter 1"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsQuickOpenTillModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleQuickOpenTill}
              disabled={isSubmittingQuickOpen}
              className="bg-brand-600 hover:bg-brand-700 text-white font-bold"
            >
              {isSubmittingQuickOpen ? 'Opening...' : 'Open Till Session (Enter)'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
