import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Search,
  RefreshCw,
  Plus,
  Edit2,
  FileText,
  DollarSign,
  X,
  CheckCircle2,
  AlertCircle,
  Phone,
  ShieldCheck,
  Tag,
  Percent,
  MapPin,
  Trash2,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Pagination } from '../components/ui/Pagination';
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  getCustomerLedger,
  getCustomerPricing,
  upsertCustomerPricing,
  customerAddressesApi,
  productsApi,
  salesOperationsApi,
  Customer,
  CustomerType,
  CustomerLedgerResponse,
  CreateCustomerPayload,
  UpdateCustomerPayload,
  CustomerPricingRule,
  CustomerDeliveryAddress,
  CreateCustomerAddressPayload,
  Product,
  Salesman,
  SalesRoute,
} from '../api';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [salesmenList, setSalesmenList] = useState<Salesman[]>([]);
  const [routesList, setRoutesList] = useState<SalesRoute[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [salesmanFilter, setSalesmanFilter] = useState<string>('ALL');
  const [routeFilter, setRouteFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);

  // Feedback toast
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4500);
  };

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [ledgerCustomer, setLedgerCustomer] = useState<Customer | null>(null);
  const [ledgerData, setLedgerData] = useState<CustomerLedgerResponse | null>(null);
  const [ledgerLoading, setLedgerLoading] = useState<boolean>(false);
  const [ledgerDateRange, setLedgerDateRange] = useState<{ startDate: string; endDate: string }>({
    startDate: '',
    endDate: '',
  });

  // Pricing Rule Modal state
  const [pricingCustomer, setPricingCustomer] = useState<Customer | null>(null);
  const [pricingRules, setPricingRules] = useState<CustomerPricingRule[]>([]);
  const [pricingLoading, setPricingLoading] = useState<boolean>(false);
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [newRuleProduct, setNewRuleProduct] = useState<string>('');
  const [newRuleCustomPrice, setNewRuleCustomPrice] = useState<string>('');
  const [newRuleDiscountPct, setNewRuleDiscountPct] = useState<string>('');

  // Delivery Addresses Modal state
  const [addressesCustomer, setAddressesCustomer] = useState<Customer | null>(null);
  const [customerAddresses, setCustomerAddresses] = useState<CustomerDeliveryAddress[]>([]);
  const [addressesLoading, setAddressesLoading] = useState<boolean>(false);
  const [isAddressFormOpen, setIsAddressFormOpen] = useState<boolean>(false);
  const [editingAddress, setEditingAddress] = useState<CustomerDeliveryAddress | null>(null);
  const [addressToDelete, setAddressToDelete] = useState<CustomerDeliveryAddress | null>(null);
  const [addressFormData, setAddressFormData] = useState<CreateCustomerAddressPayload>({
    title: '',
    recipientName: '',
    phone: '',
    address: '',
    city: '',
    routeId: '',
    deliveryInstructions: '',
    isDefault: false,
    isActive: true,
  });

  // Form State
  const [formData, setFormData] = useState<CreateCustomerPayload>({
    code: '',
    name: '',
    customerType: 'RETAIL_PHARMACY',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    ntn: '',
    strn: '',
    drugSaleLicenseNo: '',
    creditDays: 30,
    creditLimit: 0,
    defaultDiscountPercentage: 0,
    defaultSalesmanId: '',
    routeId: '',
    isTaxExempt: false,
    openingBalance: 0,
    isActive: true,
  });

  // Load master data (salesmen & routes)
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [smRes, rtRes] = await Promise.all([
          salesOperationsApi.getSalesmen({ isActive: true, limit: 500 }),
          salesOperationsApi.getRoutes({ isActive: true, limit: 500 }),
        ]);
        setSalesmenList(smRes.items || []);
        setRoutesList(rtRes.items || []);
      } catch (e) {
        console.error('Failed to load salesmen/routes master data', e);
      }
    };
    fetchMasterData();
  }, []);

  // Load customers list
  const loadCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getCustomers({
        search: search.trim() || undefined,
        customerType: typeFilter === 'ALL' ? undefined : (typeFilter as CustomerType),
        salesmanId: salesmanFilter === 'ALL' ? undefined : salesmanFilter,
        routeId: routeFilter === 'ALL' ? undefined : routeFilter,
        isActive: statusFilter === 'ALL' ? undefined : statusFilter === 'ACTIVE',
        page: currentPage,
        limit: 20,
      });
      setCustomers(res?.items || []);
      setTotalRecords(res?.meta?.total || 0);
      setTotalPages(res?.meta?.totalPages || 1);
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || err.message || 'Failed to load customers');
    } finally {
      setIsLoading(false);
    }
  }, [search, typeFilter, salesmanFilter, routeFilter, statusFilter, currentPage]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  // Handle Form Submit (Create / Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      showFeedback('error', 'Customer Code and Name are required.');
      return;
    }

    try {
      if (editingCustomer) {
        const payload: UpdateCustomerPayload = {
          code: formData.code.trim(),
          name: formData.name.trim(),
          customerType: formData.customerType,
          contactPerson: formData.contactPerson?.trim() || undefined,
          phone: formData.phone?.trim() || undefined,
          email: formData.email?.trim() || undefined,
          address: formData.address?.trim() || undefined,
          city: formData.city?.trim() || undefined,
          ntn: formData.ntn?.trim() || undefined,
          strn: formData.strn?.trim() || undefined,
          drugSaleLicenseNo: formData.drugSaleLicenseNo?.trim() || undefined,
          creditDays: Number(formData.creditDays) || 0,
          creditLimit: Number(formData.creditLimit) || 0,
          defaultDiscountPercentage: Number(formData.defaultDiscountPercentage) || 0,
          defaultSalesmanId: formData.defaultSalesmanId || undefined,
          routeId: formData.routeId || undefined,
          isTaxExempt: formData.isTaxExempt,
          isActive: formData.isActive,
        };
        await updateCustomer(editingCustomer.id, payload);
        showFeedback('success', `Customer "${formData.name}" updated successfully.`);
      } else {
        await createCustomer({
          ...formData,
          creditDays: Number(formData.creditDays) || 0,
          creditLimit: Number(formData.creditLimit) || 0,
          defaultDiscountPercentage: Number(formData.defaultDiscountPercentage) || 0,
          defaultSalesmanId: formData.defaultSalesmanId || undefined,
          routeId: formData.routeId || undefined,
          openingBalance: Number(formData.openingBalance) || 0,
        });
        showFeedback('success', `Customer "${formData.name}" created successfully.`);
      }

      setIsCreateModalOpen(false);
      setEditingCustomer(null);
      loadCustomers();
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || err.message || 'Failed to save customer');
    }
  };

  // Open Edit Modal
  const openEditModal = (cust: Customer) => {
    setEditingCustomer(cust);
    setFormData({
      code: cust.code,
      name: cust.name,
      customerType: cust.customerType,
      contactPerson: cust.contactPerson || '',
      phone: cust.phone || '',
      email: cust.email || '',
      address: cust.address || '',
      city: cust.city || '',
      ntn: cust.ntn || '',
      strn: cust.strn || '',
      drugSaleLicenseNo: cust.drugSaleLicenseNo || '',
      creditDays: cust.creditDays || 0,
      creditLimit: Number(cust.creditLimit) || 0,
      defaultDiscountPercentage: Number(cust.defaultDiscountPercentage) || 0,
      defaultSalesmanId: cust.defaultSalesmanId || '',
      routeId: cust.routeId || '',
      isTaxExempt: cust.isTaxExempt || false,
      openingBalance: 0,
      isActive: cust.isActive,
    });
    setIsCreateModalOpen(true);
  };

  // Open Add Modal
  const openCreateModal = () => {
    setEditingCustomer(null);
    setFormData({
      code: '',
      name: '',
      customerType: 'RETAIL_PHARMACY',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      ntn: '',
      strn: '',
      drugSaleLicenseNo: '',
      creditDays: 30,
      creditLimit: 0,
      defaultDiscountPercentage: 0,
      defaultSalesmanId: '',
      routeId: '',
      isTaxExempt: false,
      openingBalance: 0,
      isActive: true,
    });
    setIsCreateModalOpen(true);
  };

  // Open Sub-Ledger Statement Modal
  const openLedgerModal = async (cust: Customer) => {
    setLedgerCustomer(cust);
    setLedgerLoading(true);
    setLedgerDateRange({ startDate: '', endDate: '' });
    try {
      const data = await getCustomerLedger(cust.id);
      setLedgerData(data);
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || err.message || 'Failed to load ledger');
    } finally {
      setLedgerLoading(false);
    }
  };

  // Reload filtered ledger
  const handleFilterLedger = async () => {
    if (!ledgerCustomer) return;
    setLedgerLoading(true);
    try {
      const data = await getCustomerLedger(ledgerCustomer.id, {
        startDate: ledgerDateRange.startDate || undefined,
        endDate: ledgerDateRange.endDate || undefined,
      });
      setLedgerData(data);
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || err.message || 'Failed to filter ledger');
    } finally {
      setLedgerLoading(false);
    }
  };

  // Open Pricing Rules Modal
  const openPricingModal = async (cust: Customer) => {
    setPricingCustomer(cust);
    setPricingLoading(true);
    setNewRuleProduct('');
    setNewRuleCustomPrice('');
    setNewRuleDiscountPct('');
    try {
      const [rules, prods] = await Promise.all([
        getCustomerPricing(cust.id),
        productsApi.getProducts({ limit: 500, isActive: 'true' }),
      ]);
      setPricingRules(rules || []);
      setProductsList(prods?.items || []);
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || err.message || 'Failed to load pricing');
    } finally {
      setPricingLoading(false);
    }
  };

  // Add/Save Pricing Rule
  const handleSavePricingRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pricingCustomer || !newRuleProduct) {
      showFeedback('error', 'Select a product first.');
      return;
    }
    try {
      await upsertCustomerPricing(pricingCustomer.id, {
        productId: newRuleProduct,
        customPrice: newRuleCustomPrice ? Number(newRuleCustomPrice) : undefined,
        discountPercentage: newRuleDiscountPct ? Number(newRuleDiscountPct) : undefined,
        isActive: true,
      });
      showFeedback('success', 'Customer pricing rule saved.');
      const rules = await getCustomerPricing(pricingCustomer.id);
      setPricingRules(rules || []);
      setNewRuleProduct('');
      setNewRuleCustomPrice('');
      setNewRuleDiscountPct('');
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || err.message || 'Failed to save rule');
    }
  };

  // =========================================================================
  // DELIVERY ADDRESSES HANDLERS
  // =========================================================================

  const loadCustomerAddresses = async (customerId: string) => {
    setAddressesLoading(true);
    try {
      const res = await customerAddressesApi.list(customerId);
      setCustomerAddresses(Array.isArray(res) ? res : (res as any)?.items || []);
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || err.message || 'Failed to load delivery addresses');
    } finally {
      setAddressesLoading(false);
    }
  };

  const openAddressesModal = (cust: Customer) => {
    setAddressesCustomer(cust);
    loadCustomerAddresses(cust.id);
  };

  const openAddAddressForm = () => {
    setEditingAddress(null);
    setAddressFormData({
      title: '',
      recipientName: '',
      phone: '',
      address: '',
      city: addressesCustomer?.city || '',
      routeId: addressesCustomer?.routeId || '',
      deliveryInstructions: '',
      isDefault: customerAddresses.length === 0,
      isActive: true,
    });
    setIsAddressFormOpen(true);
  };

  const openEditAddressForm = (addr: CustomerDeliveryAddress) => {
    setEditingAddress(addr);
    setAddressFormData({
      title: addr.title,
      recipientName: addr.recipientName || '',
      phone: addr.phone || '',
      address: addr.address,
      city: addr.city || '',
      routeId: addr.routeId || '',
      deliveryInstructions: addr.deliveryInstructions || '',
      isDefault: addr.isDefault,
      isActive: addr.isActive,
    });
    setIsAddressFormOpen(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressesCustomer) return;
    if (!addressFormData.title.trim() || !addressFormData.address.trim()) {
      showFeedback('error', 'Title and physical address are required.');
      return;
    }

    try {
      if (editingAddress) {
        await customerAddressesApi.update(addressesCustomer.id, editingAddress.id, {
          title: addressFormData.title.trim(),
          recipientName: addressFormData.recipientName?.trim() || undefined,
          phone: addressFormData.phone?.trim() || undefined,
          address: addressFormData.address.trim(),
          city: addressFormData.city?.trim() || undefined,
          routeId: addressFormData.routeId || undefined,
          deliveryInstructions: addressFormData.deliveryInstructions?.trim() || undefined,
          isDefault: addressFormData.isDefault,
          isActive: addressFormData.isActive,
        });
        showFeedback('success', `Delivery address "${addressFormData.title}" updated.`);
      } else {
        await customerAddressesApi.create(addressesCustomer.id, {
          title: addressFormData.title.trim(),
          recipientName: addressFormData.recipientName?.trim() || undefined,
          phone: addressFormData.phone?.trim() || undefined,
          address: addressFormData.address.trim(),
          city: addressFormData.city?.trim() || undefined,
          routeId: addressFormData.routeId || undefined,
          deliveryInstructions: addressFormData.deliveryInstructions?.trim() || undefined,
          isDefault: addressFormData.isDefault,
          isActive: addressFormData.isActive,
        });
        showFeedback('success', `Delivery address "${addressFormData.title}" added.`);
      }

      setIsAddressFormOpen(false);
      setEditingAddress(null);
      loadCustomerAddresses(addressesCustomer.id);
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || err.message || 'Failed to save address');
    }
  };

  const handleSetDefaultAddress = async (addr: CustomerDeliveryAddress) => {
    if (!addressesCustomer) return;
    try {
      await customerAddressesApi.setDefault(addressesCustomer.id, addr.id);
      showFeedback('success', `Address "${addr.title}" set as default.`);
      loadCustomerAddresses(addressesCustomer.id);
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || err.message || 'Failed to set default address');
    }
  };

  const handleConfirmDeleteAddress = async () => {
    if (!addressesCustomer || !addressToDelete) return;
    try {
      const res = await customerAddressesApi.delete(addressesCustomer.id, addressToDelete.id);
      showFeedback('success', res.message || 'Address removed.');
      setAddressToDelete(null);
      loadCustomerAddresses(addressesCustomer.id);
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || err.message || 'Failed to delete address');
    }
  };

  // Overall metric statistics
  const totalReceivable = customers.reduce(
    (acc, c) => acc + (Number(c.currentBalance) || 0),
    0,
  );
  const totalCreditLimit = customers.reduce(
    (acc, c) => acc + (Number(c.creditLimit) || 0),
    0,
  );

  return (
    <div className="space-y-6">
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

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-brand-600" />
            <h1 className="text-xl font-bold text-charcoal-900">
              Customers & Parties
            </h1>
          </div>
          <p className="text-xs text-charcoal-500 mt-1">
            Manage retail pharmacies, clinics, wholesale clients, trade credit limits, and receivable sub-ledgers
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={loadCustomers}
            className="flex items-center gap-1.5 text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={openCreateModal}
            className="flex items-center gap-1.5 text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Customer</span>
          </Button>
        </div>
      </div>

      {/* Metrics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-white border border-surface-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-charcoal-500">
                Total Customers
              </p>
              <p className="text-2xl font-bold text-charcoal-900 mt-1">
                {customers.length}
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-[11px] text-charcoal-500">
            Active in system directory
          </div>
        </Card>

        <Card className="p-4 bg-white border border-surface-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-charcoal-500">
                Outstanding Receivables
              </p>
              <p className="text-2xl font-bold text-rose-600 mt-1">
                PKR {totalReceivable.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-[11px] text-charcoal-500">
            Total unpaid customer balances
          </div>
        </Card>

        <Card className="p-4 bg-white border border-surface-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-charcoal-500">
                Total Credit Limit Exposure
              </p>
              <p className="text-2xl font-bold text-charcoal-800 mt-1">
                PKR {totalCreditLimit.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-[11px] text-charcoal-500">
            Approved trade credit pool
          </div>
        </Card>
      </div>

      {/* Main Customers Table Card */}
      <Card className="bg-white border border-surface-border overflow-hidden">
        {/* Filter Toolbar */}
        <div className="p-4 border-b border-surface-border bg-surface-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm w-full">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-charcoal-400" />
            <Input
              type="text"
              placeholder="Search code, pharmacy name, phone, license..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-8 text-xs h-9 w-full"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <select
              value={salesmanFilter}
              onChange={(e) => {
                setSalesmanFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 px-3 rounded-md border border-surface-border bg-white text-xs font-medium text-charcoal-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="ALL">All Salesmen</option>
              {salesmenList.map((sm) => (
                <option key={sm.id} value={sm.id}>
                  {sm.name} ({sm.code})
                </option>
              ))}
            </select>

            <select
              value={routeFilter}
              onChange={(e) => {
                setRouteFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 px-3 rounded-md border border-surface-border bg-white text-xs font-medium text-charcoal-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="ALL">All Routes</option>
              {routesList.map((rt) => (
                <option key={rt.id} value={rt.id}>
                  {rt.name} ({rt.code})
                </option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 px-3 rounded-md border border-surface-border bg-white text-xs font-medium text-charcoal-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="ALL">All Types</option>
              <option value="RETAIL_PHARMACY">Retail Pharmacy</option>
              <option value="HOSPITAL">Hospital / Clinic</option>
              <option value="DISTRIBUTOR">Distributor</option>
              <option value="WALK_IN">Walk-In Cash</option>
              <option value="INSTITUTIONAL">Institutional</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="h-9 px-3 rounded-md border border-surface-border bg-white text-xs font-medium text-charcoal-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Deactivated</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-surface-border bg-surface-muted/40 text-charcoal-600 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Code / ID</th>
                <th className="py-3 px-4">Customer Name & Type</th>
                <th className="py-3 px-4">Salesman & Route</th>
                <th className="py-3 px-4">Contact Info</th>
                <th className="py-3 px-4">Credit Terms</th>
                <th className="py-3 px-4 text-right">Credit Limit</th>
                <th className="py-3 px-4 text-right">Current Balance</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-charcoal-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="h-6 w-6 animate-spin text-brand-600" />
                      <span>Loading customer directory...</span>
                    </div>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-charcoal-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users className="h-8 w-8 text-charcoal-300" />
                      <span className="font-medium text-charcoal-600">No customers found</span>
                      <span className="text-[11px]">Add your first customer to begin processing sales</span>
                    </div>
                  </td>
                </tr>
              ) : (
                customers.map((cust) => {
                  const currentBal = Number(cust.currentBalance) || 0;
                  const credLimit = Number(cust.creditLimit) || 0;

                  return (
                    <tr
                      key={cust.id}
                      className="hover:bg-brand-50/20 transition-colors group"
                    >
                      <td className="py-3 px-4 font-mono font-medium text-charcoal-800">
                        {cust.code}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-charcoal-900 flex items-center gap-1.5">
                          {cust.name}
                          {cust.isTaxExempt && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800">
                              TAX EXEMPT
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-charcoal-500 flex items-center gap-1 mt-0.5">
                          <span className="px-1.5 py-0.2 rounded bg-surface-muted text-charcoal-600 font-medium">
                            {cust.customerType.replace('_', ' ')}
                          </span>
                          {cust.drugSaleLicenseNo && (
                            <span className="text-charcoal-400">
                              • Lic: {cust.drugSaleLicenseNo}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-charcoal-800 flex items-center gap-1">
                          {cust.defaultSalesman ? (
                            <span>{cust.defaultSalesman.name}</span>
                          ) : (
                            <span className="text-charcoal-400 italic">No Salesman</span>
                          )}
                        </div>
                        <div className="text-[11px] text-charcoal-500 flex items-center gap-1 mt-0.5">
                          {cust.route ? (
                            <span className="px-1.5 py-0.2 rounded bg-brand-50 text-brand-700 font-medium">
                              Route: {cust.route.name}
                            </span>
                          ) : (
                            <span className="text-charcoal-400 italic">No Route</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-charcoal-700">
                          {cust.contactPerson || '—'}
                        </div>
                        {cust.phone && (
                          <div className="text-[11px] text-charcoal-500 flex items-center gap-1 mt-0.5">
                            <Phone className="h-3 w-3 text-charcoal-400" />
                            {cust.phone}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-charcoal-800">
                          {cust.creditDays} Days
                        </span>
                        {Number(cust.defaultDiscountPercentage) > 0 && (
                          <div className="text-[11px] text-emerald-600 font-medium flex items-center gap-0.5 mt-0.5">
                            <Percent className="h-3 w-3" />
                            {Number(cust.defaultDiscountPercentage)}% Default Disc
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-charcoal-800">
                        PKR {credLimit.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold">
                        <span
                          className={
                            currentBal > 0
                              ? 'text-rose-600 font-bold'
                              : 'text-emerald-700'
                          }
                        >
                          PKR {currentBal.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge
                          variant={cust.isActive ? 'success' : 'neutral'}
                        >
                          {cust.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </StatusBadge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {cust.customerType !== 'WALK_IN' && (
                            <button
                              type="button"
                              onClick={() => openAddressesModal(cust)}
                              title="Customer Delivery Addresses"
                              className="p-1 rounded hover:bg-brand-50 text-charcoal-600 hover:text-brand-600 transition-colors"
                            >
                              <MapPin className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => openPricingModal(cust)}
                            title="Customer Pricing Overrides"
                            className="p-1 rounded hover:bg-brand-50 text-charcoal-600 hover:text-brand-600 transition-colors"
                          >
                            <Tag className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openLedgerModal(cust)}
                            title="View Sub-Ledger Statement"
                            className="p-1 rounded hover:bg-brand-50 text-charcoal-600 hover:text-brand-600 transition-colors"
                          >
                            <FileText className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(cust)}
                            title="Edit Customer"
                            className="p-1 rounded hover:bg-brand-50 text-charcoal-600 hover:text-brand-600 transition-colors"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
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

      {/* Add / Edit Customer Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-charcoal-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-surface-border max-w-2xl w-full overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border bg-surface-muted/30">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-brand-600" />
                <h2 className="text-base font-bold text-charcoal-900">
                  {editingCustomer ? 'Edit Customer Profile' : 'Add New Customer / Party'}
                </h2>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-md text-charcoal-400 hover:text-charcoal-700 hover:bg-surface-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                    Customer Code *
                  </label>
                  <Input
                    type="text"
                    required
                    placeholder="e.g. CUST-00101"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value.toUpperCase() })
                    }
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                    Customer / Pharmacy Name *
                  </label>
                  <Input
                    type="text"
                    required
                    placeholder="e.g. Al-Shifa Pharmacy & Stores"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                    Customer Type
                  </label>
                  <select
                    value={formData.customerType}
                    onChange={(e) =>
                      setFormData({ ...formData, customerType: e.target.value as CustomerType })
                    }
                    className="w-full h-9 px-3 rounded-md border border-surface-border bg-white text-xs text-charcoal-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="RETAIL_PHARMACY">Retail Pharmacy</option>
                    <option value="HOSPITAL">Hospital / Clinic</option>
                    <option value="DISTRIBUTOR">Sub-Distributor</option>
                    <option value="WALK_IN">Walk-In Cash Customer</option>
                    <option value="INSTITUTIONAL">Institutional / NGO</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                    Contact Person
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. Dr. Tariq Mehmood"
                    value={formData.contactPerson || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, contactPerson: e.target.value })
                    }
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                    Phone / Mobile
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. 0300-1234567"
                    value={formData.phone || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    placeholder="e.g. orders@alshifa.pk"
                    value={formData.email || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                    Physical Address
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. Shop # 12, Main Commercial Market"
                    value={formData.address || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                    City
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. Karachi"
                    value={formData.city || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                    Drug Sale License (DSL) No.
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. DSL-KAR-99821"
                    value={formData.drugSaleLicenseNo || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, drugSaleLicenseNo: e.target.value })
                    }
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                    NTN Number
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. 1234567-8"
                    value={formData.ntn || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, ntn: e.target.value })
                    }
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                    Sales Tax (STRN)
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. 11-22-3333-444"
                    value={formData.strn || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, strn: e.target.value })
                    }
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                    Credit Period (Days)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="30"
                    value={formData.creditDays}
                    onChange={(e) =>
                      setFormData({ ...formData, creditDays: Number(e.target.value) })
                    }
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                    Credit Limit (PKR)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="100000"
                    value={formData.creditLimit}
                    onChange={(e) =>
                      setFormData({ ...formData, creditLimit: Number(e.target.value) })
                    }
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                    Default Salesman
                  </label>
                  <select
                    value={formData.defaultSalesmanId || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, defaultSalesmanId: e.target.value })
                    }
                    className="w-full h-9 px-3 rounded-md border border-surface-border bg-white text-xs text-charcoal-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="">-- No Salesman Assigned --</option>
                    {salesmenList.map((sm) => (
                      <option key={sm.id} value={sm.id}>
                        {sm.name} ({sm.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                    Sales Route / Territory
                  </label>
                  <select
                    value={formData.routeId || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, routeId: e.target.value })
                    }
                    className="w-full h-9 px-3 rounded-md border border-surface-border bg-white text-xs text-charcoal-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="">-- No Route Assigned --</option>
                    {routesList.map((rt) => (
                      <option key={rt.id} value={rt.id}>
                        {rt.name} ({rt.code}){rt.city ? ` - ${rt.city}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                    Default Discount %
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="0"
                    value={formData.defaultDiscountPercentage}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        defaultDiscountPercentage: Number(e.target.value),
                      })
                    }
                    className="text-xs"
                  />
                </div>

                {!editingCustomer && (
                  <div>
                    <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                      Opening Balance Receivable (PKR)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0.00"
                      value={formData.openingBalance}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          openingBalance: Number(e.target.value),
                        })
                      }
                      className="text-xs"
                    />
                    <p className="text-[10px] text-charcoal-500 mt-0.5">
                      Creates an initial OPENING_BALANCE ledger entry
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-4 sm:col-span-2 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-charcoal-700">
                    <input
                      type="checkbox"
                      checked={formData.isTaxExempt}
                      onChange={(e) =>
                        setFormData({ ...formData, isTaxExempt: e.target.checked })
                      }
                      className="rounded border-surface-border text-brand-600 focus:ring-brand-500"
                    />
                    <span>Tax Exempt Customer (0% GST on all invoices)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-charcoal-700">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) =>
                        setFormData({ ...formData, isActive: e.target.checked })
                      }
                      className="rounded border-surface-border text-brand-600 focus:ring-brand-500"
                    />
                    <span>Active Account</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-surface-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  {editingCustomer ? 'Update Customer' : 'Create Customer'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sub-Ledger Statement Modal */}
      {ledgerCustomer && (
        <div className="fixed inset-0 z-50 bg-charcoal-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-surface-border max-w-4xl w-full overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border bg-surface-muted/30">
              <div>
                <h2 className="text-base font-bold text-charcoal-900">
                  Customer Statement: {ledgerCustomer.name}
                </h2>
                <p className="text-xs text-charcoal-500 font-mono">
                  Code: {ledgerCustomer.code} • Credit Limit: PKR{' '}
                  {Number(ledgerCustomer.creditLimit).toLocaleString('en-PK')} • Terms: {ledgerCustomer.creditDays} Days
                </p>
              </div>
              <button
                onClick={() => setLedgerCustomer(null)}
                className="p-1 rounded-md text-charcoal-400 hover:text-charcoal-700 hover:bg-surface-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Summary Totals Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg border border-surface-border bg-surface-muted/10">
                  <p className="text-[10px] font-semibold uppercase text-charcoal-500">
                    Total Invoiced (Debit)
                  </p>
                  <p className="text-base font-bold text-charcoal-900 mt-0.5">
                    PKR{' '}
                    {Number(ledgerData?.summary.totalDebit || 0).toLocaleString('en-PK', {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-surface-border bg-surface-muted/10">
                  <p className="text-[10px] font-semibold uppercase text-charcoal-500">
                    Total Paid / Returned (Credit)
                  </p>
                  <p className="text-base font-bold text-emerald-700 mt-0.5">
                    PKR{' '}
                    {Number(ledgerData?.summary.totalCredit || 0).toLocaleString('en-PK', {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-surface-border bg-rose-50/50 border-rose-200">
                  <p className="text-[10px] font-semibold uppercase text-rose-700">
                    Outstanding Balance
                  </p>
                  <p className="text-base font-bold text-rose-700 mt-0.5">
                    PKR{' '}
                    {Number(ledgerData?.summary.netBalance || 0).toLocaleString('en-PK', {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>

              {/* Date Filter Bar */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-charcoal-600 font-medium">From:</span>
                  <Input
                    type="date"
                    value={ledgerDateRange.startDate}
                    onChange={(e) =>
                      setLedgerDateRange({
                        ...ledgerDateRange,
                        startDate: e.target.value,
                      })
                    }
                    className="h-8 text-xs"
                  />
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-charcoal-600 font-medium">To:</span>
                  <Input
                    type="date"
                    value={ledgerDateRange.endDate}
                    onChange={(e) =>
                      setLedgerDateRange({
                        ...ledgerDateRange,
                        endDate: e.target.value,
                      })
                    }
                    className="h-8 text-xs"
                  />
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleFilterLedger}
                  className="h-8 text-xs"
                >
                  Filter Statement
                </Button>
              </div>

              {/* Chronological Statement Table */}
              <div className="border border-surface-border rounded-lg overflow-hidden max-h-80 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-surface-muted/60 sticky top-0 border-b border-surface-border">
                    <tr className="text-[10px] text-charcoal-600 uppercase font-semibold">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Entry Type</th>
                      <th className="py-2.5 px-3">Reference #</th>
                      <th className="py-2.5 px-3 text-right">Debit (+)</th>
                      <th className="py-2.5 px-3 text-right">Credit (-)</th>
                      <th className="py-2.5 px-3 text-right">Running Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {ledgerLoading ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-charcoal-400">
                          <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-1 text-brand-600" />
                          <span>Loading statement...</span>
                        </td>
                      </tr>
                    ) : !ledgerData?.items || ledgerData.items.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-charcoal-400">
                          No ledger transactions found in this period.
                        </td>
                      </tr>
                    ) : (
                      ledgerData.items.map((entry) => (
                        <tr key={entry.id} className="hover:bg-surface-muted/20">
                          <td className="py-2 px-3 text-charcoal-600">
                            {new Date(entry.transactionDate).toLocaleDateString('en-GB')}
                          </td>
                          <td className="py-2 px-3">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-surface-muted text-charcoal-700">
                              {entry.entryType}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-mono font-medium text-charcoal-800">
                            {entry.referenceNumber}
                          </td>
                          <td className="py-2 px-3 text-right font-medium text-charcoal-900">
                            {Number(entry.debit) > 0
                              ? `PKR ${Number(entry.debit).toLocaleString('en-PK', {
                                  minimumFractionDigits: 2,
                                })}`
                              : '—'}
                          </td>
                          <td className="py-2 px-3 text-right font-medium text-emerald-700">
                            {Number(entry.credit) > 0
                              ? `PKR ${Number(entry.credit).toLocaleString('en-PK', {
                                  minimumFractionDigits: 2,
                                })}`
                              : '—'}
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-charcoal-900">
                            PKR{' '}
                            {Number(entry.runningBalance).toLocaleString('en-PK', {
                              minimumFractionDigits: 2,
                            })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLedgerCustomer(null)}
                >
                  Close Statement
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer Pricing Overrides Modal */}
      {pricingCustomer && (
        <div className="fixed inset-0 z-50 bg-charcoal-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-surface-border max-w-3xl w-full overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border bg-surface-muted/30">
              <div>
                <h2 className="text-base font-bold text-charcoal-900">
                  Custom Contract Pricing: {pricingCustomer.name}
                </h2>
                <p className="text-xs text-charcoal-500 font-mono">
                  Override standard TP/MRP rates or set fixed contract discounts per product
                </p>
              </div>
              <button
                onClick={() => setPricingCustomer(null)}
                className="p-1 rounded-md text-charcoal-400 hover:text-charcoal-700 hover:bg-surface-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Add New Rule Form */}
              <form onSubmit={handleSavePricingRule} className="p-4 rounded-lg bg-surface-muted/30 border border-surface-border space-y-3">
                <p className="text-xs font-bold text-charcoal-800">Add / Override Product Price Rule</p>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-charcoal-600 mb-1">
                      Select Product *
                    </label>
                    <select
                      value={newRuleProduct}
                      onChange={(e) => setNewRuleProduct(e.target.value)}
                      className="w-full h-8 px-2.5 rounded border border-surface-border bg-white text-xs text-charcoal-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    >
                      <option value="">-- Choose Product --</option>
                      {productsList.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-charcoal-600 mb-1">
                      Fixed Price (PKR)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Optional"
                      value={newRuleCustomPrice}
                      onChange={(e) => setNewRuleCustomPrice(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-charcoal-600 mb-1">
                      Custom Discount %
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      placeholder="Optional"
                      value={newRuleDiscountPct}
                      onChange={(e) => setNewRuleDiscountPct(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" variant="primary" size="sm" className="h-8 text-xs">
                    Save Pricing Rule
                  </Button>
                </div>
              </form>

              {/* Active Rules List */}
              <div className="border border-surface-border rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-surface-muted/60 sticky top-0 border-b border-surface-border">
                    <tr className="text-[10px] text-charcoal-600 uppercase font-semibold">
                      <th className="py-2.5 px-3">Product Name</th>
                      <th className="py-2.5 px-3">SKU</th>
                      <th className="py-2.5 px-3 text-right">Fixed Custom Price</th>
                      <th className="py-2.5 px-3 text-right">Contract Discount</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {pricingLoading ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-charcoal-400">
                          <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-1 text-brand-600" />
                          <span>Loading pricing rules...</span>
                        </td>
                      </tr>
                    ) : pricingRules.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-charcoal-400">
                          No custom pricing rules defined for this customer.
                        </td>
                      </tr>
                    ) : (
                      pricingRules.map((rule) => (
                        <tr key={rule.id} className="hover:bg-surface-muted/20">
                          <td className="py-2 px-3 font-medium text-charcoal-900">
                            {rule.product?.name || '—'}
                          </td>
                          <td className="py-2 px-3 font-mono text-charcoal-600">
                            {rule.product?.sku || '—'}
                          </td>
                          <td className="py-2 px-3 text-right font-medium text-charcoal-900">
                            {rule.customPrice ? `PKR ${Number(rule.customPrice).toFixed(2)}` : '—'}
                          </td>
                          <td className="py-2 px-3 text-right font-medium text-emerald-600">
                            {rule.discountPercentage ? `${Number(rule.discountPercentage)}%` : '—'}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <StatusBadge variant={rule.isActive ? 'success' : 'neutral'}>
                              {rule.isActive ? 'ACTIVE' : 'INACTIVE'}
                            </StatusBadge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPricingCustomer(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Customer Delivery Addresses Management */}
      <Modal
        isOpen={!!addressesCustomer}
        onClose={() => {
          setAddressesCustomer(null);
          setCustomerAddresses([]);
        }}
        title={addressesCustomer ? `Delivery Addresses — ${addressesCustomer.name}` : 'Delivery Addresses'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-charcoal-500">
              Manage physical receiving locations, site contact persons, and default dispatch routes.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={openAddAddressForm}
              className="flex items-center gap-1.5 text-xs font-semibold"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Delivery Address</span>
            </Button>
          </div>

          <div className="border border-surface-border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-surface-muted/60 sticky top-0 border-b border-surface-border">
                <tr className="text-[10px] text-charcoal-600 uppercase font-semibold">
                  <th className="py-2.5 px-3">Location / Site</th>
                  <th className="py-2.5 px-3">Recipient & Contact</th>
                  <th className="py-2.5 px-3">Physical Address</th>
                  <th className="py-2.5 px-3">Default Route</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {addressesLoading ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-charcoal-400">
                      <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-1.5 text-brand-600" />
                      <span>Loading delivery addresses...</span>
                    </td>
                  </tr>
                ) : customerAddresses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-charcoal-400">
                      <MapPin className="h-8 w-8 text-charcoal-300 mx-auto mb-2" />
                      <p className="font-semibold text-charcoal-700">No delivery addresses configured</p>
                      <p className="text-[11px] text-charcoal-400 mt-0.5">
                        Add destination branch, hospital ward, or dispensary unit addresses for this customer.
                      </p>
                    </td>
                  </tr>
                ) : (
                  customerAddresses.map((addr) => (
                    <tr key={addr.id} className="hover:bg-surface-muted/20 transition-colors">
                      <td className="py-2.5 px-3 align-top">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-charcoal-900">{addr.title}</span>
                          {addr.isDefault && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                              DEFAULT
                            </span>
                          )}
                          {!addr.isActive && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-charcoal-100 text-charcoal-600 border border-charcoal-200">
                              INACTIVE
                            </span>
                          )}
                        </div>
                        {addr.deliveryInstructions && (
                          <p className="text-[10px] text-amber-800 italic mt-0.5" title={addr.deliveryInstructions}>
                            Note: {addr.deliveryInstructions}
                          </p>
                        )}
                      </td>
                      <td className="py-2.5 px-3 align-top">
                        <div className="text-charcoal-800 font-medium">{addr.recipientName || '—'}</div>
                        {addr.phone && <div className="text-[11px] text-charcoal-500">{addr.phone}</div>}
                      </td>
                      <td className="py-2.5 px-3 align-top">
                        <div className="text-charcoal-800">{addr.address}</div>
                        {addr.city && <div className="text-[11px] text-charcoal-500">{addr.city}</div>}
                      </td>
                      <td className="py-2.5 px-3 align-top">
                        {addr.route ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-brand-50 text-brand-700 border border-brand-200">
                            {addr.route.name}
                          </span>
                        ) : (
                          <span className="text-charcoal-400">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right align-top">
                        <div className="flex items-center justify-end gap-1.5">
                          {!addr.isDefault && addr.isActive && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSetDefaultAddress(addr)}
                              className="h-7 text-[11px] px-2 text-brand-700 hover:text-brand-900 font-semibold"
                            >
                              Set Default
                            </Button>
                          )}
                          <button
                            type="button"
                            onClick={() => openEditAddressForm(addr)}
                            title="Edit Address"
                            className="p-1 rounded hover:bg-surface-muted text-charcoal-500 hover:text-brand-600 transition-colors"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setAddressToDelete(addr)}
                            title="Delete / Deactivate Address"
                            className="p-1 rounded hover:bg-rose-50 text-charcoal-500 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-2 border-t border-surface-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setAddressesCustomer(null);
                setCustomerAddresses([]);
              }}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* SUB-MODAL: Add / Edit Customer Delivery Address */}
      <Modal
        isOpen={isAddressFormOpen}
        onClose={() => {
          setIsAddressFormOpen(false);
          setEditingAddress(null);
        }}
        title={editingAddress ? 'Edit Delivery Address' : 'Add Delivery Address'}
        size="md"
      >
        <form onSubmit={handleSaveAddress} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-charcoal-700 mb-1">
              Address Title / Site Name *
            </label>
            <Input
              type="text"
              required
              placeholder="e.g. Main Hospital Pharmacy, OPD Branch, Warehouse 2"
              value={addressFormData.title}
              onChange={(e) => setAddressFormData({ ...addressFormData, title: e.target.value })}
              className="text-xs"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Recipient / Contact Person
              </label>
              <Input
                type="text"
                placeholder="e.g. Dr. Tariq Mehmood"
                value={addressFormData.recipientName || ''}
                onChange={(e) => setAddressFormData({ ...addressFormData, recipientName: e.target.value })}
                className="text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Site Contact Phone
              </label>
              <Input
                type="text"
                placeholder="e.g. 0300-1234567"
                value={addressFormData.phone || ''}
                onChange={(e) => setAddressFormData({ ...addressFormData, phone: e.target.value })}
                className="text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-700 mb-1">
              Physical Street / Unit Address *
            </label>
            <Input
              type="text"
              required
              placeholder="e.g. Shop # 12, Main Commercial Market, Saddar"
              value={addressFormData.address}
              onChange={(e) => setAddressFormData({ ...addressFormData, address: e.target.value })}
              className="text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                City
              </label>
              <Input
                type="text"
                placeholder="e.g. Karachi"
                value={addressFormData.city || ''}
                onChange={(e) => setAddressFormData({ ...addressFormData, city: e.target.value })}
                className="text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Default Route (Suggestion)
              </label>
              <select
                value={addressFormData.routeId || ''}
                onChange={(e) => setAddressFormData({ ...addressFormData, routeId: e.target.value })}
                className="w-full h-9 px-3 rounded-md border border-surface-border bg-white text-xs font-medium text-charcoal-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="">No Default Route</option>
                {routesList.map((rt) => (
                  <option key={rt.id} value={rt.id}>
                    {rt.name} ({rt.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-700 mb-1">
              Delivery / Receiving Instructions
            </label>
            <Input
              type="text"
              placeholder="e.g. Deliver to back loading dock between 10am-4pm"
              value={addressFormData.deliveryInstructions || ''}
              onChange={(e) => setAddressFormData({ ...addressFormData, deliveryInstructions: e.target.value })}
              className="text-xs"
            />
          </div>

          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-charcoal-700">
              <input
                type="checkbox"
                checked={addressFormData.isDefault}
                onChange={(e) => setAddressFormData({ ...addressFormData, isDefault: e.target.checked })}
                className="rounded border-surface-border text-brand-600 focus:ring-brand-500 h-4 w-4"
              />
              <span>Set as Default Delivery Address</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-charcoal-700">
              <input
                type="checkbox"
                checked={addressFormData.isActive}
                onChange={(e) => setAddressFormData({ ...addressFormData, isActive: e.target.checked })}
                className="rounded border-surface-border text-brand-600 focus:ring-brand-500 h-4 w-4"
              />
              <span>Active Address</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-surface-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsAddressFormOpen(false);
                setEditingAddress(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" className="font-semibold text-xs px-4">
              {editingAddress ? 'Update Address' : 'Save Address'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* CONFIRM DIALOG: Delete / Deactivate Address */}
      {addressToDelete && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setAddressToDelete(null)}
          onConfirm={handleConfirmDeleteAddress}
          title="Remove Delivery Address"
          description={`Are you sure you want to remove delivery address "${addressToDelete.title}"? If referenced by existing sales invoices, it will be safely deactivated to preserve historical invoice records.`}
          confirmText="Remove Address"
          variant="danger"
        />
      )}
    </div>
  );
};
