import React, { useState, useEffect, useCallback } from 'react';
import {
  Percent,
  Calculator,
  Plus,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Layers,
  ArrowRight,
  Edit2,
  Trash2,
  Gift,
} from 'lucide-react';
import {
  pricingApi,
  CustomerPricingRule,
  PromotionalScheme,
  SchemeType,
  CustomerType,
  PricingSimulationResponse,
  customersApi,
  Customer,
  productsApi,
  Product,
} from '../api';
import { clsx } from 'clsx';

type ActiveTab = 'rules' | 'schemes' | 'simulator';

export const PricingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('rules');

  // Master lists for selectors
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Tab 1: Pricing Rules State
  const [rules, setRules] = useState<CustomerPricingRule[]>([]);
  const [loadingRules, setLoadingRules] = useState(false);
  const [ruleSearch, setRuleSearch] = useState('');
  const [ruleStatusFilter, setRuleStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<CustomerPricingRule | null>(null);

  // Rule Form State
  const [ruleFormCustomerId, setRuleFormCustomerId] = useState('');
  const [ruleFormProductId, setRuleFormProductId] = useState('');
  const [ruleFormCustomPrice, setRuleFormCustomPrice] = useState<string>('');
  const [ruleFormDiscountPct, setRuleFormDiscountPct] = useState<string>('');
  const [ruleFormMinQty, setRuleFormMinQty] = useState<number>(1);
  const [ruleFormStartDate, setRuleFormStartDate] = useState('');
  const [ruleFormEndDate, setRuleFormEndDate] = useState('');
  const [ruleFormNotes, setRuleFormNotes] = useState('');
  const [ruleFormIsActive, setRuleFormIsActive] = useState(true);
  const [ruleFormSaving, setRuleFormSaving] = useState(false);
  const [ruleFormError, setRuleFormError] = useState<string | null>(null);

  // Tab 2: Promotional Schemes State
  const [schemes, setSchemes] = useState<PromotionalScheme[]>([]);
  const [loadingSchemes, setLoadingSchemes] = useState(false);
  const [schemeSearch, setSchemeSearch] = useState('');
  const [schemeTypeFilter, setSchemeTypeFilter] = useState<string>('ALL');
  const [schemeStatusFilter, setSchemeStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [isSchemeModalOpen, setIsSchemeModalOpen] = useState(false);
  const [editingScheme, setEditingScheme] = useState<PromotionalScheme | null>(null);

  // Scheme Form State
  const [schemeFormName, setSchemeFormName] = useState('');
  const [schemeFormCode, setSchemeFormCode] = useState('');
  const [schemeFormDescription, setSchemeFormDescription] = useState('');
  const [schemeFormType, setSchemeFormType] = useState<SchemeType>('BUY_X_GET_Y_FREE');
  const [schemeFormProductId, setSchemeFormProductId] = useState('');
  const [schemeFormMinQty, setSchemeFormMinQty] = useState<number>(10);
  const [schemeFormBonusQty, setSchemeFormBonusQty] = useState<number>(1);
  const [schemeFormBonusProductId, setSchemeFormBonusProductId] = useState('');
  const [schemeFormDiscountPct, setSchemeFormDiscountPct] = useState<string>('');
  const [schemeFormOverridePrice, setSchemeFormOverridePrice] = useState<string>('');
  const [schemeFormCustomerId, setSchemeFormCustomerId] = useState('');
  const [schemeFormCustomerType, setSchemeFormCustomerType] = useState<string>('');
  const [schemeFormStartDate, setSchemeFormStartDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [schemeFormEndDate, setSchemeFormEndDate] = useState(
    new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
  );
  const [schemeFormIsActive, setSchemeFormIsActive] = useState(true);
  const [schemeFormSaving, setSchemeFormSaving] = useState(false);
  const [schemeFormError, setSchemeFormError] = useState<string | null>(null);

  // Tab 3: Simulator State
  const [simCustomerId, setSimCustomerId] = useState('');
  const [simProductId, setSimProductId] = useState('');
  const [simQuantity, setSimQuantity] = useState<number>(10);
  const [simManualUnitPrice, setSimManualUnitPrice] = useState<string>('');
  const [simManualDiscountPct, setSimManualDiscountPct] = useState<string>('');
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<PricingSimulationResponse | null>(null);
  const [simError, setSimError] = useState<string | null>(null);

  // Notifications
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Load Master Data (Customers & Products)
  const loadMasterData = useCallback(async () => {
    try {
      const [custRes, prodRes] = await Promise.all([
        customersApi.getCustomers({ limit: 200 }),
        productsApi.getProducts({ limit: 200 }),
      ]);
      setCustomers(custRes.items || []);
      setProducts(prodRes.items || []);
    } catch (err: any) {
      console.error('Failed to load master data:', err);
    }
  }, []);

  // Load Rules
  const loadRules = useCallback(async () => {
    try {
      setLoadingRules(true);
      const res = await pricingApi.getRules({
        search: ruleSearch.trim() || undefined,
        isActive:
          ruleStatusFilter === 'ACTIVE'
            ? true
            : ruleStatusFilter === 'INACTIVE'
            ? false
            : undefined,
        limit: 100,
      });
      setRules(res.items || []);
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Failed to load pricing rules');
    } finally {
      setLoadingRules(false);
    }
  }, [ruleSearch, ruleStatusFilter]);

  // Load Schemes
  const loadSchemes = useCallback(async () => {
    try {
      setLoadingSchemes(true);
      const res = await pricingApi.getSchemes({
        search: schemeSearch.trim() || undefined,
        schemeType: schemeTypeFilter !== 'ALL' ? (schemeTypeFilter as SchemeType) : undefined,
        isActive:
          schemeStatusFilter === 'ACTIVE'
            ? true
            : schemeStatusFilter === 'INACTIVE'
            ? false
            : undefined,
        limit: 100,
      });
      setSchemes(res.items || []);
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Failed to load schemes');
    } finally {
      setLoadingSchemes(false);
    }
  }, [schemeSearch, schemeTypeFilter, schemeStatusFilter]);

  useEffect(() => {
    loadMasterData();
  }, [loadMasterData]);

  useEffect(() => {
    if (activeTab === 'rules') {
      loadRules();
    } else if (activeTab === 'schemes') {
      loadSchemes();
    }
  }, [activeTab, loadRules, loadSchemes]);

  // Run Simulation
  const handleRunSimulation = async () => {
    if (!simCustomerId || !simProductId || simQuantity <= 0) {
      setSimError('Please select a customer, product, and positive quantity.');
      return;
    }
    try {
      setSimulating(true);
      setSimError(null);
      const res = await pricingApi.previewPricing({
        customerId: simCustomerId,
        productId: simProductId,
        quantity: Number(simQuantity),
        manualUnitPrice: simManualUnitPrice ? Number(simManualUnitPrice) : undefined,
        manualDiscountPercentage: simManualDiscountPct ? Number(simManualDiscountPct) : undefined,
      });
      setSimResult(res);
    } catch (err: any) {
      setSimError(err.response?.data?.message || 'Failed to simulate pricing calculation');
      setSimResult(null);
    } finally {
      setSimulating(false);
    }
  };

  // Rule Modal Helpers
  const openCreateRuleModal = () => {
    setEditingRule(null);
    setRuleFormCustomerId(customers[0]?.id || '');
    setRuleFormProductId(products[0]?.id || '');
    setRuleFormCustomPrice('');
    setRuleFormDiscountPct('');
    setRuleFormMinQty(1);
    setRuleFormStartDate('');
    setRuleFormEndDate('');
    setRuleFormNotes('');
    setRuleFormIsActive(true);
    setRuleFormError(null);
    setIsRuleModalOpen(true);
  };

  const openEditRuleModal = (rule: CustomerPricingRule) => {
    setEditingRule(rule);
    setRuleFormCustomerId(rule.customerId);
    setRuleFormProductId(rule.productId);
    setRuleFormCustomPrice(rule.customPrice !== null ? String(rule.customPrice) : '');
    setRuleFormDiscountPct(
      rule.discountPercentage !== null ? String(rule.discountPercentage) : '',
    );
    setRuleFormMinQty(rule.minQuantity || 1);
    setRuleFormStartDate(rule.startDate ? rule.startDate.split('T')[0] : '');
    setRuleFormEndDate(rule.endDate ? rule.endDate.split('T')[0] : '');
    setRuleFormNotes(rule.notes || '');
    setRuleFormIsActive(rule.isActive);
    setRuleFormError(null);
    setIsRuleModalOpen(true);
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setRuleFormError(null);

    if (!ruleFormCustomPrice && !ruleFormDiscountPct) {
      setRuleFormError('Please specify either a Custom Contract Price (Rs.) or Discount %');
      return;
    }

    try {
      setRuleFormSaving(true);
      if (editingRule) {
        await pricingApi.updateRule(editingRule.id, {
          customPrice: ruleFormCustomPrice ? Number(ruleFormCustomPrice) : null,
          discountPercentage: ruleFormDiscountPct ? Number(ruleFormDiscountPct) : null,
          minQuantity: Number(ruleFormMinQty) || 1,
          startDate: ruleFormStartDate || null,
          endDate: ruleFormEndDate || null,
          notes: ruleFormNotes || null,
          isActive: ruleFormIsActive,
        });
        showNotification('success', 'Customer pricing rule updated successfully');
      } else {
        await pricingApi.createRule({
          customerId: ruleFormCustomerId,
          productId: ruleFormProductId,
          customPrice: ruleFormCustomPrice ? Number(ruleFormCustomPrice) : undefined,
          discountPercentage: ruleFormDiscountPct ? Number(ruleFormDiscountPct) : undefined,
          minQuantity: Number(ruleFormMinQty) || 1,
          startDate: ruleFormStartDate || undefined,
          endDate: ruleFormEndDate || undefined,
          notes: ruleFormNotes || undefined,
          isActive: ruleFormIsActive,
        });
        showNotification('success', 'Customer pricing rule created successfully');
      }
      setIsRuleModalOpen(false);
      loadRules();
    } catch (err: any) {
      setRuleFormError(err.response?.data?.message || 'Failed to save pricing rule');
    } finally {
      setRuleFormSaving(false);
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this pricing rule?')) return;
    try {
      await pricingApi.deleteRule(id);
      showNotification('success', 'Pricing rule deleted successfully');
      loadRules();
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Failed to delete pricing rule');
    }
  };

  // Scheme Modal Helpers
  const openCreateSchemeModal = () => {
    setEditingScheme(null);
    setSchemeFormName('');
    setSchemeFormCode('');
    setSchemeFormDescription('');
    setSchemeFormType('BUY_X_GET_Y_FREE');
    setSchemeFormProductId(products[0]?.id || '');
    setSchemeFormMinQty(10);
    setSchemeFormBonusQty(1);
    setSchemeFormBonusProductId('');
    setSchemeFormDiscountPct('');
    setSchemeFormOverridePrice('');
    setSchemeFormCustomerId('');
    setSchemeFormCustomerType('');
    setSchemeFormStartDate(new Date().toISOString().split('T')[0]);
    setSchemeFormEndDate(new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0]);
    setSchemeFormIsActive(true);
    setSchemeFormError(null);
    setIsSchemeModalOpen(true);
  };

  const openEditSchemeModal = (scheme: PromotionalScheme) => {
    setEditingScheme(scheme);
    setSchemeFormName(scheme.name);
    setSchemeFormCode(scheme.code);
    setSchemeFormDescription(scheme.description || '');
    setSchemeFormType(scheme.schemeType);
    setSchemeFormProductId(scheme.productId);
    setSchemeFormMinQty(scheme.minQuantity || 1);
    setSchemeFormBonusQty(scheme.bonusQuantity || 0);
    setSchemeFormBonusProductId(scheme.bonusProductId || '');
    setSchemeFormDiscountPct(
      scheme.discountPercentage !== null ? String(scheme.discountPercentage) : '',
    );
    setSchemeFormOverridePrice(
      scheme.overridePrice !== null ? String(scheme.overridePrice) : '',
    );
    setSchemeFormCustomerId(scheme.customerId || '');
    setSchemeFormCustomerType(scheme.customerType || '');
    setSchemeFormStartDate(scheme.startDate.split('T')[0]);
    setSchemeFormEndDate(scheme.endDate.split('T')[0]);
    setSchemeFormIsActive(scheme.isActive);
    setSchemeFormError(null);
    setIsSchemeModalOpen(true);
  };

  const handleSaveScheme = async (e: React.FormEvent) => {
    e.preventDefault();
    setSchemeFormError(null);

    if (!schemeFormName.trim() || !schemeFormCode.trim() || !schemeFormProductId) {
      setSchemeFormError('Scheme Name, Code, and Target Product are required');
      return;
    }

    try {
      setSchemeFormSaving(true);
      if (editingScheme) {
        await pricingApi.updateScheme(editingScheme.id, {
          name: schemeFormName.trim(),
          code: schemeFormCode.trim().toUpperCase(),
          description: schemeFormDescription.trim() || undefined,
          schemeType: schemeFormType,
          productId: schemeFormProductId,
          minQuantity: Number(schemeFormMinQty) || 1,
          bonusQuantity: Number(schemeFormBonusQty) || 0,
          bonusProductId: schemeFormBonusProductId || undefined,
          discountPercentage: schemeFormDiscountPct ? Number(schemeFormDiscountPct) : undefined,
          overridePrice: schemeFormOverridePrice ? Number(schemeFormOverridePrice) : undefined,
          customerId: schemeFormCustomerId || undefined,
          customerType: schemeFormCustomerType ? (schemeFormCustomerType as CustomerType) : undefined,
          startDate: schemeFormStartDate,
          endDate: schemeFormEndDate,
          isActive: schemeFormIsActive,
        });
        showNotification('success', 'Promotional scheme updated successfully');
      } else {
        await pricingApi.createScheme({
          name: schemeFormName.trim(),
          code: schemeFormCode.trim().toUpperCase(),
          description: schemeFormDescription.trim() || undefined,
          schemeType: schemeFormType,
          productId: schemeFormProductId,
          minQuantity: Number(schemeFormMinQty) || 1,
          bonusQuantity: Number(schemeFormBonusQty) || 0,
          bonusProductId: schemeFormBonusProductId || undefined,
          discountPercentage: schemeFormDiscountPct ? Number(schemeFormDiscountPct) : undefined,
          overridePrice: schemeFormOverridePrice ? Number(schemeFormOverridePrice) : undefined,
          customerId: schemeFormCustomerId || undefined,
          customerType: schemeFormCustomerType ? (schemeFormCustomerType as CustomerType) : undefined,
          startDate: schemeFormStartDate,
          endDate: schemeFormEndDate,
          isActive: schemeFormIsActive,
        });
        showNotification('success', 'Promotional scheme created successfully');
      }
      setIsSchemeModalOpen(false);
      loadSchemes();
    } catch (err: any) {
      setSchemeFormError(err.response?.data?.message || 'Failed to save promotional scheme');
    } finally {
      setSchemeFormSaving(false);
    }
  };

  const handleDeleteScheme = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this promotional scheme?')) return;
    try {
      await pricingApi.deleteScheme(id);
      showNotification('success', 'Promotional scheme deleted successfully');
      loadSchemes();
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Failed to delete scheme');
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface-ground p-6 overflow-y-auto">
      {/* Header Banner */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-charcoal-900">
              Pricing, Schemes & Commercial Rules
            </h1>
            <span className="px-2 py-0.5 text-xs font-semibold bg-brand-50 text-brand-700 rounded-full border border-brand-200">
              Engine v2.0
            </span>
          </div>
          <p className="text-xs text-charcoal-500 mt-1">
            Authoritative pharmaceutical pricing precedence, contracted trade rates, and bonus schemes
          </p>
        </div>

        {/* Global Tab Switcher */}
        <div className="flex items-center bg-surface-card p-1 rounded-lg border border-surface-border shadow-sm">
          <button
            onClick={() => setActiveTab('rules')}
            className={clsx(
              'flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
              activeTab === 'rules'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-charcoal-600 hover:text-charcoal-900 hover:bg-surface-muted',
            )}
          >
            <Percent className="w-3.5 h-3.5" />
            Pricing Rules
          </button>
          <button
            onClick={() => setActiveTab('schemes')}
            className={clsx(
              'flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
              activeTab === 'schemes'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-charcoal-600 hover:text-charcoal-900 hover:bg-surface-muted',
            )}
          >
            <Gift className="w-3.5 h-3.5" />
            Promotional Schemes
          </button>
          <button
            onClick={() => setActiveTab('simulator')}
            className={clsx(
              'flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
              activeTab === 'simulator'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-charcoal-600 hover:text-charcoal-900 hover:bg-surface-muted',
            )}
          >
            <Calculator className="w-3.5 h-3.5" />
            Pricing Simulator
          </button>
        </div>
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

      {/* TAB 1: CUSTOMER PRICING RULES */}
      {activeTab === 'rules' && (
        <div className="flex flex-col gap-4">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-card p-3 rounded-lg border border-surface-border">
            <div className="flex items-center gap-3 flex-1 min-w-[280px]">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400" />
                <input
                  type="text"
                  placeholder="Search customer, SKU, product or notes..."
                  value={ruleSearch}
                  onChange={(e) => setRuleSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-surface-ground border border-surface-border rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <select
                value={ruleStatusFilter}
                onChange={(e: any) => setRuleStatusFilter(e.target.value)}
                className="text-xs bg-surface-ground border border-surface-border rounded-md px-2.5 py-1.5 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active Only</option>
                <option value="INACTIVE">Inactive Only</option>
              </select>
              <button
                onClick={loadRules}
                className="p-1.5 border border-surface-border rounded-md hover:bg-surface-muted text-charcoal-600 transition-colors"
                title="Refresh Rules"
              >
                <RefreshCw className={clsx('w-3.5 h-3.5', loadingRules && 'animate-spin')} />
              </button>
            </div>

            <button
              onClick={openCreateRuleModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium rounded-md shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Customer Pricing Rule
            </button>
          </div>

          {/* Rules Table */}
          <div className="bg-surface-card rounded-lg border border-surface-border overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-muted border-b border-surface-border text-[11px] font-semibold text-charcoal-600 uppercase tracking-wider">
                  <th className="py-2.5 px-4">Customer</th>
                  <th className="py-2.5 px-4">Product / SKU</th>
                  <th className="py-2.5 px-3">Contract Rate</th>
                  <th className="py-2.5 px-3">Min Qty</th>
                  <th className="py-2.5 px-4">Effective Validity</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border text-xs text-charcoal-800">
                {loadingRules ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-charcoal-400">
                      Loading pricing rules...
                    </td>
                  </tr>
                ) : rules.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-charcoal-400">
                      No customer pricing rules found. Click &quot;Add Customer Pricing Rule&quot; to establish custom contracted rates.
                    </td>
                  </tr>
                ) : (
                  rules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-surface-ground/50 transition-colors">
                      <td className="py-2.5 px-4">
                        <div className="font-semibold text-charcoal-900">
                          {rule.customer?.name || 'Customer'}
                        </div>
                        <div className="text-[10px] text-charcoal-500 flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono bg-charcoal-100 px-1 py-0.2 rounded text-charcoal-700">
                            {rule.customer?.code}
                          </span>
                          {rule.customer?.customerType && (
                            <span>• {rule.customer.customerType.replace('_', ' ')}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="font-medium text-charcoal-900">
                          {rule.product?.name || 'Product'}
                        </div>
                        <div className="text-[10px] text-charcoal-500 font-mono">
                          {rule.product?.sku}
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        {rule.customPrice !== null ? (
                          <span className="font-semibold text-brand-700">
                            Rs.{Number(rule.customPrice).toFixed(2)}
                          </span>
                        ) : rule.discountPercentage !== null ? (
                          <span className="font-semibold text-amber-700">
                            {Number(rule.discountPercentage).toFixed(1)}% Off
                          </span>
                        ) : (
                          <span className="text-charcoal-400">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono">{rule.minQuantity || 1}</td>
                      <td className="py-2.5 px-4 text-[11px] text-charcoal-600">
                        {rule.startDate || rule.endDate ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-charcoal-400" />
                            <span>
                              {rule.startDate ? rule.startDate.split('T')[0] : 'Any'} →{' '}
                              {rule.endDate ? rule.endDate.split('T')[0] : 'Indefinite'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-charcoal-400">Always Active</span>
                        )}
                        {rule.notes && (
                          <div className="text-[10px] text-charcoal-400 italic truncate max-w-xs mt-0.5">
                            {rule.notes}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={clsx(
                            'px-2 py-0.5 rounded-full text-[10px] font-semibold',
                            rule.isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-charcoal-100 text-charcoal-600 border border-charcoal-200',
                          )}
                        >
                          {rule.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditRuleModal(rule)}
                            className="p-1 hover:bg-surface-muted rounded text-charcoal-600 hover:text-brand-600 transition-colors"
                            title="Edit Rule"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRule(rule.id)}
                            className="p-1 hover:bg-rose-50 rounded text-charcoal-400 hover:text-rose-600 transition-colors"
                            title="Delete Rule"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: PROMOTIONAL SCHEMES */}
      {activeTab === 'schemes' && (
        <div className="flex flex-col gap-4">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-card p-3 rounded-lg border border-surface-border">
            <div className="flex items-center gap-3 flex-1 min-w-[280px]">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400" />
                <input
                  type="text"
                  placeholder="Search scheme name, code or product..."
                  value={schemeSearch}
                  onChange={(e) => setSchemeSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-surface-ground border border-surface-border rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <select
                value={schemeTypeFilter}
                onChange={(e) => setSchemeTypeFilter(e.target.value)}
                className="text-xs bg-surface-ground border border-surface-border rounded-md px-2.5 py-1.5 focus:outline-none"
              >
                <option value="ALL">All Scheme Types</option>
                <option value="BUY_X_GET_Y_FREE">Buy X Get Y Free</option>
                <option value="BUY_X_GET_DISCOUNT">Bulk Tier Discount</option>
                <option value="FLAT_DISCOUNT_PERCENT">Flat Promo Discount %</option>
                <option value="FLAT_PRICE_OVERRIDE">Special Promo Price</option>
              </select>
              <select
                value={schemeStatusFilter}
                onChange={(e: any) => setSchemeStatusFilter(e.target.value)}
                className="text-xs bg-surface-ground border border-surface-border rounded-md px-2.5 py-1.5 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active Only</option>
                <option value="INACTIVE">Inactive Only</option>
              </select>
              <button
                onClick={loadSchemes}
                className="p-1.5 border border-surface-border rounded-md hover:bg-surface-muted text-charcoal-600 transition-colors"
                title="Refresh Schemes"
              >
                <RefreshCw className={clsx('w-3.5 h-3.5', loadingSchemes && 'animate-spin')} />
              </button>
            </div>

            <button
              onClick={openCreateSchemeModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium rounded-md shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Create Promotional Scheme
            </button>
          </div>

          {/* Schemes Table */}
          <div className="bg-surface-card rounded-lg border border-surface-border overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-muted border-b border-surface-border text-[11px] font-semibold text-charcoal-600 uppercase tracking-wider">
                  <th className="py-2.5 px-4">Scheme Code & Title</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-4">Target Product</th>
                  <th className="py-2.5 px-4">Benefit Terms</th>
                  <th className="py-2.5 px-3">Customer Scope</th>
                  <th className="py-2.5 px-4">Validity Range</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border text-xs text-charcoal-800">
                {loadingSchemes ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-charcoal-400">
                      Loading promotional schemes...
                    </td>
                  </tr>
                ) : schemes.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-charcoal-400">
                      No commercial schemes configured. Click &quot;Create Promotional Scheme&quot; to launch trade incentives.
                    </td>
                  </tr>
                ) : (
                  schemes.map((scheme) => (
                    <tr key={scheme.id} className="hover:bg-surface-ground/50 transition-colors">
                      <td className="py-2.5 px-4">
                        <div className="font-semibold text-charcoal-900">{scheme.name}</div>
                        <div className="text-[10px] font-mono text-brand-700 mt-0.5">
                          {scheme.code}
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={clsx(
                            'px-2 py-0.5 rounded text-[10px] font-semibold',
                            scheme.schemeType === 'BUY_X_GET_Y_FREE'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : scheme.schemeType === 'BUY_X_GET_DISCOUNT'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200',
                          )}
                        >
                          {scheme.schemeType.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="font-medium text-charcoal-900">
                          {scheme.product?.name || 'Product'}
                        </div>
                        <div className="text-[10px] text-charcoal-500 font-mono">
                          {scheme.product?.sku}
                        </div>
                      </td>
                      <td className="py-2.5 px-4">
                        {scheme.schemeType === 'BUY_X_GET_Y_FREE' ? (
                          <div className="flex items-center gap-1.5 font-medium text-purple-800">
                            <Gift className="w-3.5 h-3.5 text-purple-600" />
                            <span>
                              Buy <strong>{scheme.minQuantity}</strong>, Get{' '}
                              <strong>{scheme.bonusQuantity} Free</strong>
                            </span>
                          </div>
                        ) : scheme.discountPercentage ? (
                          <span className="font-semibold text-amber-700">
                            {Number(scheme.discountPercentage).toFixed(1)}% Discount (Min {scheme.minQuantity} Qty)
                          </span>
                        ) : scheme.overridePrice ? (
                          <span className="font-semibold text-emerald-700">
                            Rs.{Number(scheme.overridePrice).toFixed(2)} Promo Price
                          </span>
                        ) : (
                          <span className="text-charcoal-400">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-charcoal-600">
                        {scheme.customer ? (
                          <span className="font-medium text-charcoal-900">
                            {scheme.customer.name}
                          </span>
                        ) : scheme.customerType ? (
                          <span className="bg-charcoal-100 text-charcoal-700 px-1.5 py-0.5 rounded text-[10px]">
                            {scheme.customerType.replace('_', ' ')}
                          </span>
                        ) : (
                          <span className="text-charcoal-400">All Customers</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-[11px] text-charcoal-600">
                        <div className="flex items-center gap-1 font-mono text-[10px]">
                          <Calendar className="w-3 h-3 text-charcoal-400" />
                          <span>
                            {scheme.startDate.split('T')[0]} → {scheme.endDate.split('T')[0]}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={clsx(
                            'px-2 py-0.5 rounded-full text-[10px] font-semibold',
                            scheme.isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-charcoal-100 text-charcoal-600 border border-charcoal-200',
                          )}
                        >
                          {scheme.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditSchemeModal(scheme)}
                            className="p-1 hover:bg-surface-muted rounded text-charcoal-600 hover:text-brand-600 transition-colors"
                            title="Edit Scheme"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteScheme(scheme.id)}
                            className="p-1 hover:bg-rose-50 rounded text-charcoal-400 hover:text-rose-600 transition-colors"
                            title="Delete Scheme"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PRICING SIMULATOR & TESTER */}
      {activeTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Simulator Inputs Card */}
          <div className="lg:col-span-5 bg-surface-card p-5 rounded-lg border border-surface-border shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-surface-border pb-3">
              <Calculator className="w-4 h-4 text-brand-600" />
              <h2 className="text-sm font-bold text-charcoal-900">
                Live Pricing & Scheme Simulator
              </h2>
            </div>

            {simError && (
              <div className="p-2.5 bg-rose-50 text-rose-800 border border-rose-200 rounded text-xs">
                {simError}
              </div>
            )}

            <div>
              <label htmlFor="simCustomerSelect" className="block text-xs font-semibold text-charcoal-700 mb-1">
                Select Customer <span className="text-rose-500">*</span>
              </label>
              <select
                id="simCustomerSelect"
                data-testid="sim-customer-select"
                value={simCustomerId}
                onChange={(e) => setSimCustomerId(e.target.value)}
                className="w-full text-xs bg-surface-ground border border-surface-border rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="">-- Choose Customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code}) - {c.customerType} [Def. Disc: {Number(c.defaultDiscountPercentage || 0)}%]
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="simProductSelect" className="block text-xs font-semibold text-charcoal-700 mb-1">
                Select Pharmaceutical Product <span className="text-rose-500">*</span>
              </label>
              <select
                id="simProductSelect"
                data-testid="sim-product-select"
                value={simProductId}
                onChange={(e) => setSimProductId(e.target.value)}
                className="w-full text-xs bg-surface-ground border border-surface-border rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="">-- Choose Product --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku}) {p.genericName ? `• ${p.genericName}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="simQuantityInput" className="block text-xs font-semibold text-charcoal-700 mb-1">
                Billed Order Quantity <span className="text-rose-500">*</span>
              </label>
              <input
                id="simQuantityInput"
                data-testid="sim-quantity-input"
                type="number"
                min="1"
                value={simQuantity}
                onChange={(e) => setSimQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full text-xs bg-surface-ground border border-surface-border rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              <p className="text-[10px] text-charcoal-400 mt-1">
                Threshold evaluation triggers tiered discounts or Buy X Get Y Free bonuses.
              </p>
            </div>

            <div className="pt-2 border-t border-surface-border">
              <span className="text-[11px] font-semibold text-charcoal-600 block mb-2">
                Optional Manual Overrides (Authorized Role)
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-charcoal-600 mb-1">
                    Manual Unit Price (Rs.)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Auto (Engine resolved)"
                    value={simManualUnitPrice}
                    onChange={(e) => setSimManualUnitPrice(e.target.value)}
                    className="w-full text-xs bg-surface-ground border border-surface-border rounded-md px-2.5 py-1.5 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-charcoal-600 mb-1">
                    Manual Line Discount %
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    max="100"
                    placeholder="Auto (Engine resolved)"
                    value={simManualDiscountPct}
                    onChange={(e) => setSimManualDiscountPct(e.target.value)}
                    className="w-full text-xs bg-surface-ground border border-surface-border rounded-md px-2.5 py-1.5 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <button
              data-testid="sim-evaluate-btn"
              onClick={handleRunSimulation}
              disabled={simulating || !simCustomerId || !simProductId}
              className="w-full mt-2 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-semibold rounded-md shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              <Calculator className="w-4 h-4" />
              {simulating ? 'Calculating Commercials...' : 'Evaluate & Simulate Pricing'}
            </button>
          </div>

          {/* Simulation Output Card */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {simResult ? (
              <div className="bg-surface-card p-5 rounded-lg border border-surface-border shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-surface-border pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-charcoal-900">
                      Authoritative Engine Resolution
                    </h3>
                    <p className="text-[11px] text-charcoal-500">
                      Evaluated against active contracted rates, promotional schemes, and MRP constraints
                    </p>
                  </div>
                  <span
                    className={clsx(
                      'px-2.5 py-1 rounded text-xs font-bold border',
                      simResult.resolution.pricingSource === 'CUSTOMER_CUSTOM_PRICE'
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : simResult.resolution.pricingSource === 'CUSTOMER_PRODUCT_DISCOUNT'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : simResult.resolution.pricingSource === 'PROMOTIONAL_SCHEME'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : simResult.resolution.pricingSource === 'CUSTOMER_DEFAULT_DISCOUNT'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-charcoal-50 text-charcoal-700 border-charcoal-200',
                    )}
                  >
                    Source: {simResult.resolution.pricingSource.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Precedence explanation box */}
                <div className="p-3 bg-brand-50/50 border border-brand-200/70 rounded-lg text-xs text-brand-950 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Reasoning: </span>
                    <span>{simResult.resolution.reason}</span>
                  </div>
                </div>

                {/* Metrics Breakdown Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-surface-ground rounded-lg border border-surface-border">
                    <span className="text-[10px] text-charcoal-500 uppercase tracking-wider block">
                      Base Unit Price
                    </span>
                    <span className="text-sm font-bold text-charcoal-900">
                      Rs.{simResult.resolution.baseUnitPrice.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-charcoal-400 block mt-0.5">
                      TP: Rs.{simResult.resolution.tradePrice.toFixed(2)} • MRP: Rs.{simResult.resolution.retailPrice.toFixed(2)}
                    </span>
                  </div>

                  <div className="p-3 bg-surface-ground rounded-lg border border-surface-border">
                    <span className="text-[10px] text-charcoal-500 uppercase tracking-wider block">
                      Effective Unit Price
                    </span>
                    <span className="text-sm font-bold text-brand-700">
                      Rs.{simResult.resolution.effectiveUnitPrice.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-charcoal-500 block mt-0.5 font-medium">
                      Discount: {simResult.resolution.discountPercentage.toFixed(1)}% (Rs.{simResult.resolution.discountAmount.toFixed(2)})
                    </span>
                  </div>

                  <div className="p-3 bg-surface-ground rounded-lg border border-surface-border">
                    <span className="text-[10px] text-charcoal-500 uppercase tracking-wider block">
                      Dispensed Breakdown
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-sm font-bold text-charcoal-900">
                        {simResult.resolution.billedQuantity} Billed
                      </span>
                      {simResult.resolution.bonusQuantity > 0 && (
                        <span className="text-xs font-bold text-purple-700 bg-purple-100 px-1.5 py-0.2 rounded">
                          +{simResult.resolution.bonusQuantity} Bonus Free
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-charcoal-400 block mt-0.5">
                      Total Stock Issue: {simResult.resolution.totalQuantity} units
                    </span>
                  </div>

                  <div className="p-3 bg-surface-ground rounded-lg border border-surface-border">
                    <span className="text-[10px] text-charcoal-500 uppercase tracking-wider block">
                      Net Receivable
                    </span>
                    <span className="text-sm font-bold text-emerald-700">
                      Rs.{simResult.resolution.netLineTotal.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-charcoal-400 block mt-0.5">
                      Bonus units billed at Rs.0.00
                    </span>
                  </div>
                </div>

                {/* Precedence Hierarchy Diagram */}
                <div className="border border-surface-border rounded-lg p-3 bg-surface-ground">
                  <span className="text-[11px] font-semibold text-charcoal-700 block mb-2 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-charcoal-500" />
                    Strict Non-Stacking Pricing Precedence
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                    <span
                      className={clsx(
                        'px-2 py-1 rounded border font-medium',
                        simResult.resolution.pricingSource === 'CUSTOMER_CUSTOM_PRICE'
                          ? 'bg-purple-100 text-purple-800 border-purple-300 font-bold'
                          : 'bg-surface-card text-charcoal-500 border-surface-border',
                      )}
                    >
                      1. Contract Price
                    </span>
                    <ArrowRight className="w-3 h-3 text-charcoal-300" />
                    <span
                      className={clsx(
                        'px-2 py-1 rounded border font-medium',
                        simResult.resolution.pricingSource === 'CUSTOMER_PRODUCT_DISCOUNT'
                          ? 'bg-blue-100 text-blue-800 border-blue-300 font-bold'
                          : 'bg-surface-card text-charcoal-500 border-surface-border',
                      )}
                    >
                      2. Customer/Product Disc
                    </span>
                    <ArrowRight className="w-3 h-3 text-charcoal-300" />
                    <span
                      className={clsx(
                        'px-2 py-1 rounded border font-medium',
                        simResult.resolution.pricingSource === 'PROMOTIONAL_SCHEME'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold'
                          : 'bg-surface-card text-charcoal-500 border-surface-border',
                      )}
                    >
                      3. Promotional Scheme
                    </span>
                    <ArrowRight className="w-3 h-3 text-charcoal-300" />
                    <span
                      className={clsx(
                        'px-2 py-1 rounded border font-medium',
                        simResult.resolution.pricingSource === 'CUSTOMER_DEFAULT_DISCOUNT'
                          ? 'bg-amber-100 text-amber-800 border-amber-300 font-bold'
                          : 'bg-surface-card text-charcoal-500 border-surface-border',
                      )}
                    >
                      4. Customer Default Disc
                    </span>
                    <ArrowRight className="w-3 h-3 text-charcoal-300" />
                    <span
                      className={clsx(
                        'px-2 py-1 rounded border font-medium',
                        simResult.resolution.pricingSource === 'DEFAULT_PRICE'
                          ? 'bg-charcoal-200 text-charcoal-800 border-charcoal-400 font-bold'
                          : 'bg-surface-card text-charcoal-500 border-surface-border',
                      )}
                    >
                      5. Default TP/MRP
                    </span>
                  </div>
                </div>

                {/* Candidate Batches */}
                {simResult.availableBatches && simResult.availableBatches.length > 0 && (
                  <div>
                    <span className="text-[11px] font-semibold text-charcoal-700 block mb-1.5">
                      Available Batches for Product ({simResult.availableBatches.length})
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {simResult.availableBatches.map((b) => (
                        <div
                          key={b.id}
                          className="p-2 bg-surface-ground rounded border border-surface-border flex justify-between items-center"
                        >
                          <div>
                            <span className="font-mono font-bold text-charcoal-900">
                              {b.batchNumber}
                            </span>
                            <span className="text-[10px] text-charcoal-500 block">
                              Exp: {b.expiryDate.split('T')[0]}
                            </span>
                          </div>
                          <div className="text-right text-[11px]">
                            <span className="text-charcoal-700">TP: Rs.{b.tradePrice.toFixed(2)}</span>
                            <span className="text-charcoal-500 block text-[10px]">
                              MRP: Rs.{b.retailPrice.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-surface-card p-12 rounded-lg border border-surface-border text-center flex flex-col items-center justify-center text-charcoal-400">
                <Calculator className="w-12 h-12 stroke-[1.5] text-charcoal-300 mb-3" />
                <h3 className="text-sm font-semibold text-charcoal-700">No Simulation Active</h3>
                <p className="text-xs text-charcoal-400 max-w-sm mt-1">
                  Select a customer and product on the left, then click &quot;Evaluate &amp; Simulate Pricing&quot; to inspect real-time commercial breakdown.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: CREATE / EDIT PRICING RULE */}
      {isRuleModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-surface-card rounded-xl border border-surface-border max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-surface-border flex items-center justify-between bg-surface-ground">
              <h3 className="text-sm font-bold text-charcoal-900">
                {editingRule ? 'Edit Customer Pricing Rule' : 'New Customer Pricing Rule'}
              </h3>
              <button
                onClick={() => setIsRuleModalOpen(false)}
                className="text-charcoal-400 hover:text-charcoal-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRule} className="p-5 space-y-4 text-xs">
              {ruleFormError && (
                <div className="p-2.5 bg-rose-50 text-rose-800 border border-rose-200 rounded text-xs">
                  {ruleFormError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Customer <span className="text-rose-500">*</span>
                </label>
                <select
                  disabled={!!editingRule}
                  value={ruleFormCustomerId}
                  onChange={(e) => setRuleFormCustomerId(e.target.value)}
                  className="w-full bg-surface-ground border border-surface-border rounded-md px-3 py-1.5 focus:outline-none disabled:opacity-60"
                  required
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Product <span className="text-rose-500">*</span>
                </label>
                <select
                  disabled={!!editingRule}
                  value={ruleFormProductId}
                  onChange={(e) => setRuleFormProductId(e.target.value)}
                  className="w-full bg-surface-ground border border-surface-border rounded-md px-3 py-1.5 focus:outline-none disabled:opacity-60"
                  required
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                    Custom Contract Price (Rs.)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g. 210.00"
                    value={ruleFormCustomPrice}
                    onChange={(e) => {
                      setRuleFormCustomPrice(e.target.value);
                      if (e.target.value) setRuleFormDiscountPct('');
                    }}
                    className="w-full bg-surface-ground border border-surface-border rounded-md px-3 py-1.5 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                    OR Special Discount %
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    placeholder="e.g. 10.0"
                    value={ruleFormDiscountPct}
                    onChange={(e) => {
                      setRuleFormDiscountPct(e.target.value);
                      if (e.target.value) setRuleFormCustomPrice('');
                    }}
                    className="w-full bg-surface-ground border border-surface-border rounded-md px-3 py-1.5 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Minimum Trigger Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={ruleFormMinQty}
                  onChange={(e) => setRuleFormMinQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-surface-ground border border-surface-border rounded-md px-3 py-1.5 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                    Effective Start Date
                  </label>
                  <input
                    type="date"
                    value={ruleFormStartDate}
                    onChange={(e) => setRuleFormStartDate(e.target.value)}
                    className="w-full bg-surface-ground border border-surface-border rounded-md px-3 py-1.5 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                    Effective End Date
                  </label>
                  <input
                    type="date"
                    value={ruleFormEndDate}
                    onChange={(e) => setRuleFormEndDate(e.target.value)}
                    className="w-full bg-surface-ground border border-surface-border rounded-md px-3 py-1.5 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Contract Remarks / Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Approved by Commercial Director for Q3 distributor quota"
                  value={ruleFormNotes}
                  onChange={(e) => setRuleFormNotes(e.target.value)}
                  className="w-full bg-surface-ground border border-surface-border rounded-md px-3 py-1.5 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="ruleActiveCheck"
                  checked={ruleFormIsActive}
                  onChange={(e) => setRuleFormIsActive(e.target.checked)}
                  className="rounded text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="ruleActiveCheck" className="text-xs font-medium text-charcoal-700">
                  Rule is actively enforced
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-border">
                <button
                  type="button"
                  onClick={() => setIsRuleModalOpen(false)}
                  className="px-3 py-1.5 border border-surface-border rounded-md hover:bg-surface-muted text-charcoal-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={ruleFormSaving}
                  className="px-4 py-1.5 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-md shadow-xs transition-colors"
                >
                  {ruleFormSaving ? 'Saving...' : editingRule ? 'Update Rule' : 'Save Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CREATE / EDIT PROMOTIONAL SCHEME */}
      {isSchemeModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-surface-card rounded-xl border border-surface-border max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-surface-border flex items-center justify-between bg-surface-ground">
              <h3 className="text-sm font-bold text-charcoal-900">
                {editingScheme ? 'Edit Promotional Scheme' : 'Launch New Promotional Scheme'}
              </h3>
              <button
                onClick={() => setIsSchemeModalOpen(false)}
                className="text-charcoal-400 hover:text-charcoal-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveScheme} className="p-5 space-y-4 text-xs max-h-[85vh] overflow-y-auto">
              {schemeFormError && (
                <div className="p-2.5 bg-rose-50 text-rose-800 border border-rose-200 rounded text-xs">
                  {schemeFormError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                    Scheme Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Augmentin Monsoon Special (10+1)"
                    value={schemeFormName}
                    onChange={(e) => setSchemeFormName(e.target.value)}
                    className="w-full bg-surface-ground border border-surface-border rounded-md px-3 py-1.5 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                    Scheme Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SCH-AUG-10P1"
                    value={schemeFormCode}
                    onChange={(e) => setSchemeFormCode(e.target.value.toUpperCase())}
                    className="w-full font-mono bg-surface-ground border border-surface-border rounded-md px-3 py-1.5 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                    Scheme Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={schemeFormType}
                    onChange={(e: any) => setSchemeFormType(e.target.value)}
                    className="w-full bg-surface-ground border border-surface-border rounded-md px-3 py-1.5 focus:outline-none"
                  >
                    <option value="BUY_X_GET_Y_FREE">Buy X Get Y Free (Bonus Units)</option>
                    <option value="BUY_X_GET_DISCOUNT">Bulk Tier Discount %</option>
                    <option value="FLAT_DISCOUNT_PERCENT">Flat Promo Discount %</option>
                    <option value="FLAT_PRICE_OVERRIDE">Special Promo Fixed Price</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                    Target Product <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={schemeFormProductId}
                    onChange={(e) => setSchemeFormProductId(e.target.value)}
                    className="w-full bg-surface-ground border border-surface-border rounded-md px-3 py-1.5 focus:outline-none"
                    required
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dynamic parameters based on scheme type */}
              {schemeFormType === 'BUY_X_GET_Y_FREE' && (
                <div className="p-3 bg-purple-50/50 border border-purple-200 rounded-lg grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-purple-900 mb-1">
                      Buy Quantity (X) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={schemeFormMinQty}
                      onChange={(e) => setSchemeFormMinQty(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-white border border-purple-200 rounded-md px-3 py-1.5 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-purple-900 mb-1">
                      Get Free Quantity (Y) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={schemeFormBonusQty}
                      onChange={(e) => setSchemeFormBonusQty(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-white border border-purple-200 rounded-md px-3 py-1.5 focus:outline-none"
                      required
                    />
                  </div>
                </div>
              )}

              {(schemeFormType === 'BUY_X_GET_DISCOUNT' ||
                schemeFormType === 'FLAT_DISCOUNT_PERCENT') && (
                <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-lg grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-blue-900 mb-1">
                      Min Trigger Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={schemeFormMinQty}
                      onChange={(e) => setSchemeFormMinQty(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-white border border-blue-200 rounded-md px-3 py-1.5 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-blue-900 mb-1">
                      Discount Percentage % <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="100"
                      value={schemeFormDiscountPct}
                      onChange={(e) => setSchemeFormDiscountPct(e.target.value)}
                      className="w-full bg-white border border-blue-200 rounded-md px-3 py-1.5 focus:outline-none"
                      required
                    />
                  </div>
                </div>
              )}

              {schemeFormType === 'FLAT_PRICE_OVERRIDE' && (
                <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-lg grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-emerald-900 mb-1">
                      Promo Fixed Unit Price (Rs.) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={schemeFormOverridePrice}
                      onChange={(e) => setSchemeFormOverridePrice(e.target.value)}
                      className="w-full bg-white border border-emerald-200 rounded-md px-3 py-1.5 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-emerald-900 mb-1">
                      Min Trigger Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={schemeFormMinQty}
                      onChange={(e) => setSchemeFormMinQty(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-white border border-emerald-200 rounded-md px-3 py-1.5 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                    Customer Category Eligibility
                  </label>
                  <select
                    value={schemeFormCustomerType}
                    onChange={(e) => setSchemeFormCustomerType(e.target.value)}
                    className="w-full bg-surface-ground border border-surface-border rounded-md px-3 py-1.5 focus:outline-none"
                  >
                    <option value="">All Categories (General Public)</option>
                    <option value="RETAIL_PHARMACY">Retail Pharmacy</option>
                    <option value="HOSPITAL">Hospital</option>
                    <option value="CLINIC">Clinic</option>
                    <option value="WHOLESALER">Wholesaler</option>
                    <option value="DISTRIBUTOR">Distributor</option>
                    <option value="INSTITUTION">Institution</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                    Specific Customer (Optional)
                  </label>
                  <select
                    value={schemeFormCustomerId}
                    onChange={(e) => setSchemeFormCustomerId(e.target.value)}
                    className="w-full bg-surface-ground border border-surface-border rounded-md px-3 py-1.5 focus:outline-none"
                  >
                    <option value="">Any Customer in Category</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                    Campaign Start Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={schemeFormStartDate}
                    onChange={(e) => setSchemeFormStartDate(e.target.value)}
                    className="w-full bg-surface-ground border border-surface-border rounded-md px-3 py-1.5 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                    Campaign End Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={schemeFormEndDate}
                    onChange={(e) => setSchemeFormEndDate(e.target.value)}
                    className="w-full bg-surface-ground border border-surface-border rounded-md px-3 py-1.5 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Campaign Description
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Monsoon seasonal stock incentive program for registered retailers"
                  value={schemeFormDescription}
                  onChange={(e) => setSchemeFormDescription(e.target.value)}
                  className="w-full bg-surface-ground border border-surface-border rounded-md px-3 py-1.5 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="schemeActiveCheck"
                  checked={schemeFormIsActive}
                  onChange={(e) => setSchemeFormIsActive(e.target.checked)}
                  className="rounded text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="schemeActiveCheck" className="text-xs font-medium text-charcoal-700">
                  Scheme is active and available for billing
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-border">
                <button
                  type="button"
                  onClick={() => setIsSchemeModalOpen(false)}
                  className="px-3 py-1.5 border border-surface-border rounded-md hover:bg-surface-muted text-charcoal-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={schemeFormSaving}
                  className="px-4 py-1.5 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-md shadow-xs transition-colors"
                >
                  {schemeFormSaving ? 'Saving...' : editingScheme ? 'Update Scheme' : 'Launch Scheme'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
