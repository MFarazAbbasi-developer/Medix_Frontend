import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  Circle,
  Building2,
  Layers,
  Users,
  Package,
  CreditCard,
  Boxes,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  RotateCcw,
  Plus,
  UploadCloud,
} from 'lucide-react';
import { onboardingApi } from '../api/onboarding.api';
import { useAuthStore } from '../store/authStore';

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const userPermissions = user?.permissions || [];
  const canManage = userPermissions.includes('settings.manage') || user?.roles?.includes('ADMIN');

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch live onboarding readiness metrics
  const { data: statusData, isLoading, refetch } = useQuery({
    queryKey: ['onboarding-status'],
    queryFn: () => onboardingApi.getStatus(),
  });

  // Complete Onboarding Mutation
  const completeMutation = useMutation({
    mutationFn: () => onboardingApi.complete(),
    onSuccess: () => {
      setShowCompleteModal(false);
      setSuccessMessage('Congratulations! System onboarding is complete. Your station is fully active.');
      queryClient.invalidateQueries({ queryKey: ['onboarding-status'] });
    },
    onError: (err: Error) => {
      setShowCompleteModal(false);
      setErrorMessage(err.message || 'Failed to complete onboarding.');
    },
  });

  // Reset Onboarding Mutation
  const resetMutation = useMutation({
    mutationFn: () => onboardingApi.reset(),
    onSuccess: () => {
      setSuccessMessage('Onboarding status has been reset. You can now revisit the setup wizard.');
      queryClient.invalidateQueries({ queryKey: ['onboarding-status'] });
    },
    onError: (err: Error) => {
      setErrorMessage(err.message || 'Failed to reset onboarding.');
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center space-y-3">
          <RefreshCw className="h-8 w-8 animate-spin text-brand-600 mx-auto" />
          <p className="text-xs font-semibold text-charcoal-600">Loading system onboarding readiness...</p>
        </div>
      </div>
    );
  }

  const steps = statusData?.steps;
  const progress = statusData?.overallProgress || 0;
  const isInitialized = statusData?.isInitialized || false;

  const STEPS_CONFIG = [
    {
      id: 1,
      title: 'Business Identity',
      subtitle: 'Legal name, NTN, STRN & Drug Sale License',
      icon: Building2,
      isCompleted: !!steps?.businessProfile?.completed,
    },
    {
      id: 2,
      title: 'Branch & Warehouses',
      subtitle: 'Head office, standard racks & quarantine hold',
      icon: Layers,
      isCompleted: !!steps?.branchAndWarehouse?.completed,
    },
    {
      id: 3,
      title: 'Users & Staff Access',
      subtitle: 'Administrators, sales team & station RBAC',
      icon: Users,
      isCompleted: !!steps?.users?.completed,
    },
    {
      id: 4,
      title: 'Catalog & Master Data',
      subtitle: 'Products, customers, suppliers & categories',
      icon: Package,
      isCompleted: !!steps?.masterData?.completed,
    },
    {
      id: 5,
      title: 'Opening Balances',
      subtitle: 'Initial receivables & payable sub-ledgers',
      icon: CreditCard,
      isCompleted: !!steps?.openingBalances?.completed,
    },
    {
      id: 6,
      title: 'Batch Opening Stock',
      subtitle: 'Batch numbers, expiry dates & acquisition costs',
      icon: Boxes,
      isCompleted: !!steps?.openingStock?.completed,
    },
    {
      id: 7,
      title: 'Verification & Launch',
      subtitle: 'System checklist & operational activation',
      icon: ShieldCheck,
      isCompleted: !!isInitialized,
    },
  ];

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Top Banner & Status Header */}
      <div className="rounded-xl border border-surface-border bg-surface-card p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-50 text-brand-700 border border-brand-200">
                <Sparkles className="h-3 w-3 text-brand-600" />
                Medix Setup Engine
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  isInitialized
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {isInitialized ? 'Station Initialized & Active' : 'Setup In Progress'}
              </span>
            </div>
            <h1 className="text-xl font-bold text-charcoal-900 tracking-tight">
              Distributor Onboarding & Setup Wizard
            </h1>
            <p className="text-xs text-charcoal-500 mt-0.5">
              Structured step-by-step bootstrap for your pharmaceutical distribution enterprise
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              className="px-3 py-1.5 rounded-md border border-surface-border hover:bg-surface-muted text-xs font-semibold text-charcoal-700 flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh Status
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-3.5 py-1.5 rounded-md bg-surface-muted hover:bg-surface-borderStrong text-xs font-semibold text-charcoal-700 transition-colors"
            >
              Exit to Dashboard
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5 pt-2 border-t border-surface-border">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-charcoal-700">Overall Onboarding Readiness</span>
            <span className="font-mono font-bold text-brand-700">{progress}% Complete</span>
          </div>
          <div className="h-2 w-full bg-surface-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-600 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2 shadow-sm">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
          <div className="flex-1 font-medium">{successMessage}</div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-900">
            ×
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-lg bg-status-error-bg border border-status-error-border text-status-error-text text-xs flex items-start gap-2 shadow-sm">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{errorMessage}</div>
          <button onClick={() => setErrorMessage(null)}>×</button>
        </div>
      )}

      {/* Wizard Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Stepper Menu */}
        <div className="lg:col-span-4 rounded-xl border border-surface-border bg-surface-card p-4 shadow-sm space-y-1.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-charcoal-400 px-3 pb-2 border-b border-surface-border">
            Onboarding Milestones
          </h2>

          {STEPS_CONFIG.map((step) => {
            const Icon = step.icon;
            const isCurrent = currentStep === step.id;

            return (
              <button
                key={step.id}
                onClick={() => setCurrentStep(step.id)}
                className={`w-full text-left p-3 rounded-lg flex items-start gap-3 transition-all ${
                  isCurrent
                    ? 'bg-brand-50 border border-brand-200 shadow-sm ring-1 ring-brand-500/20'
                    : 'hover:bg-surface-muted border border-transparent'
                }`}
              >
                <div
                  className={`p-2 rounded-md border shrink-0 mt-0.5 ${
                    isCurrent
                      ? 'bg-brand-600 text-white border-brand-600'
                      : step.isCompleted
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-surface-muted text-charcoal-500 border-surface-border'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold truncate ${
                        isCurrent ? 'text-brand-900' : 'text-charcoal-800'
                      }`}
                    >
                      {step.id}. {step.title}
                    </span>
                    {step.isCompleted ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Circle className="h-3.5 w-3.5 text-charcoal-300 shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-charcoal-500 truncate mt-0.5">
                    {step.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Column: Step Content & Actions */}
        <div className="lg:col-span-8 rounded-xl border border-surface-border bg-surface-card p-6 shadow-sm min-h-[460px] flex flex-col justify-between space-y-6">
          {/* STEP 1: BUSINESS PROFILE */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="border-b border-surface-border pb-3">
                <h3 className="text-base font-bold text-charcoal-900 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-brand-600" />
                  Step 1: Business Identity & Drug Act Compliance
                </h3>
                <p className="text-xs text-charcoal-500 mt-1">
                  Configure legal business registration details, National Tax Number (NTN), and Provincial Drug Sale License.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-lg bg-surface-muted/60 border border-surface-border space-y-1">
                  <div className="text-[11px] font-semibold text-charcoal-500 uppercase tracking-wider">Trading Name</div>
                  <div className="text-xs font-bold text-charcoal-900">{steps?.businessProfile.name || 'Not Configured'}</div>
                </div>
                <div className="p-3.5 rounded-lg bg-surface-muted/60 border border-surface-border space-y-1">
                  <div className="text-[11px] font-semibold text-charcoal-500 uppercase tracking-wider">Operating City</div>
                  <div className="text-xs font-bold text-charcoal-900">{steps?.businessProfile.city || 'Karachi'}</div>
                </div>
                <div className="p-3.5 rounded-lg bg-surface-muted/60 border border-surface-border space-y-1">
                  <div className="text-[11px] font-semibold text-charcoal-500 uppercase tracking-wider">National Tax Number (NTN)</div>
                  <div className="text-xs font-mono font-bold text-charcoal-900">{steps?.businessProfile.ntn || '7100234-5'}</div>
                </div>
                <div className="p-3.5 rounded-lg bg-surface-muted/60 border border-surface-border space-y-1">
                  <div className="text-[11px] font-semibold text-charcoal-500 uppercase tracking-wider">Drug Sale License (DSL)</div>
                  <div className="text-xs font-mono font-bold text-charcoal-900">{steps?.businessProfile.drugSaleLicenseNo || 'DSL-KHI-2026-894'}</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-lg bg-brand-50 border border-brand-200">
                <div className="text-xs text-brand-900">
                  Need to update your organization profile or licensing details?
                </div>
                <button
                  onClick={() => navigate('/settings')}
                  className="text-xs font-bold text-brand-700 hover:text-brand-900 flex items-center gap-1 underline shrink-0"
                >
                  Edit in Settings <ExternalLink className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: BRANCHES & WAREHOUSES */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="border-b border-surface-border pb-3">
                <h3 className="text-base font-bold text-charcoal-900 flex items-center gap-2">
                  <Layers className="h-5 w-5 text-brand-600" />
                  Step 2: Branches & Warehouse Locations
                </h3>
                <p className="text-xs text-charcoal-500 mt-1">
                  Verify your primary Head Office branch, main stock warehouse, and mandatory Quarantine section.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-lg border border-surface-border bg-surface-muted/50 space-y-1.5">
                  <div className="text-xs font-bold text-charcoal-900 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Active Branches ({steps?.branchAndWarehouse.branchCount || 0})
                  </div>
                  <p className="text-[11px] text-charcoal-500">
                    Primary Head Office distribution hub configured.
                  </p>
                </div>

                <div className="p-4 rounded-lg border border-surface-border bg-surface-muted/50 space-y-1.5">
                  <div className="text-xs font-bold text-charcoal-900 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Warehouses ({steps?.branchAndWarehouse.warehouseCount || 0})
                  </div>
                  <p className="text-[11px] text-charcoal-500">
                    Includes Standard saleable warehouse & Quarantine holding zone.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-lg bg-surface-muted border border-surface-border">
                <div className="text-xs text-charcoal-700">
                  Configure additional branches or storage locations in the administration console.
                </div>
                <button
                  onClick={() => navigate('/admin')}
                  className="text-xs font-bold text-brand-700 hover:text-brand-900 flex items-center gap-1 underline shrink-0"
                >
                  Manage Warehouses <ExternalLink className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: USERS & ACCESS */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="border-b border-surface-border pb-3">
                <h3 className="text-base font-bold text-charcoal-900 flex items-center gap-2">
                  <Users className="h-5 w-5 text-brand-600" />
                  Step 3: Staff Accounts & Role-Based Access Control
                </h3>
                <p className="text-xs text-charcoal-500 mt-1">
                  Manage operator profiles, cashier permissions, and administrative credentials.
                </p>
              </div>

              <div className="p-4 rounded-lg border border-surface-border bg-surface-muted/50 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-charcoal-900">
                    Active User Accounts ({steps?.users.userCount || 0})
                  </div>
                  <p className="text-[11px] text-charcoal-500 mt-0.5">
                    Full administrator security profile active.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/admin')}
                  className="px-3 py-1.5 rounded-md bg-surface-card border border-surface-border text-xs font-semibold text-charcoal-800 hover:bg-surface-borderStrong flex items-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add User Account
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: MASTER DATA SETUP */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="border-b border-surface-border pb-3">
                <h3 className="text-base font-bold text-charcoal-900 flex items-center gap-2">
                  <Package className="h-5 w-5 text-brand-600" />
                  Step 4: Master Catalog & Parties Setup
                </h3>
                <p className="text-xs text-charcoal-500 mt-1">
                  Populate your master products catalog, customer pharmacies directory, and supplier vendors.
                </p>
              </div>

              {/* Master Data Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-lg border border-surface-border bg-surface-muted/50 text-center">
                  <div className="text-lg font-bold font-mono text-brand-700">{steps?.masterData.productsCount || 0}</div>
                  <div className="text-xs font-semibold text-charcoal-700">Products in Catalog</div>
                </div>
                <div className="p-3.5 rounded-lg border border-surface-border bg-surface-muted/50 text-center">
                  <div className="text-lg font-bold font-mono text-emerald-700">{steps?.masterData.customersCount || 0}</div>
                  <div className="text-xs font-semibold text-charcoal-700">Registered Customers</div>
                </div>
                <div className="p-3.5 rounded-lg border border-surface-border bg-surface-muted/50 text-center">
                  <div className="text-lg font-bold font-mono text-purple-700">{steps?.masterData.suppliersCount || 0}</div>
                  <div className="text-xs font-semibold text-charcoal-700">Active Suppliers</div>
                </div>
              </div>

              {/* Quick Action Shortcuts */}
              <div className="p-4 rounded-lg bg-brand-50 border border-brand-200 space-y-3">
                <div className="text-xs font-bold text-brand-900 flex items-center gap-1.5">
                  <UploadCloud className="h-4 w-4 text-brand-700" />
                  Batch Import via Import Center
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => navigate('/imports')}
                    className="px-3 py-1.5 rounded-md bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5"
                  >
                    <Package className="h-3.5 w-3.5" />
                    Open Product / Customer Importer
                  </button>
                  <button
                    onClick={() => navigate('/products')}
                    className="px-3 py-1.5 rounded-md bg-surface-card border border-brand-300 text-brand-800 text-xs font-semibold hover:bg-brand-100"
                  >
                    Manage Products
                  </button>
                  <button
                    onClick={() => navigate('/customers')}
                    className="px-3 py-1.5 rounded-md bg-surface-card border border-brand-300 text-brand-800 text-xs font-semibold hover:bg-brand-100"
                  >
                    Manage Customers
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: OPENING BALANCES */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="border-b border-surface-border pb-3">
                <h3 className="text-base font-bold text-charcoal-900 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-brand-600" />
                  Step 5: Customer & Supplier Opening Balances
                </h3>
                <p className="text-xs text-charcoal-500 mt-1">
                  Migrate existing accounts receivable and payable balances with full sub-ledger audit trail.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-lg border border-cyan-200 bg-cyan-50/50 space-y-1">
                  <div className="text-xs font-bold text-cyan-900">Customer Receivables</div>
                  <div className="text-lg font-bold font-mono text-cyan-800">
                    Rs. {steps?.openingBalances.totalReceivable.toLocaleString() || '0.00'}
                  </div>
                  <div className="text-[11px] text-cyan-700">
                    {steps?.openingBalances.customerBalancesCount || 0} customers with initial opening balance
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-rose-200 bg-rose-50/50 space-y-1">
                  <div className="text-xs font-bold text-rose-900">Supplier Payables</div>
                  <div className="text-lg font-bold font-mono text-rose-800">
                    Rs. {steps?.openingBalances.totalPayable.toLocaleString() || '0.00'}
                  </div>
                  <div className="text-[11px] text-rose-700">
                    {steps?.openingBalances.supplierBalancesCount || 0} suppliers with initial opening balance
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-surface-muted border border-surface-border text-xs text-charcoal-700 space-y-1">
                <div className="font-bold text-charcoal-900">Financial Ledger Note:</div>
                <div>• Customer positive balance: Money owed to you (Debit).</div>
                <div>• Supplier positive balance: Money you owe to the vendor (Credit).</div>
              </div>

              <button
                onClick={() => navigate('/imports')}
                className="px-4 py-2 rounded-md bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5"
              >
                <UploadCloud className="h-4 w-4" />
                Launch Opening Balances Importer
              </button>
            </div>
          )}

          {/* STEP 6: OPENING STOCK */}
          {currentStep === 6 && (
            <div className="space-y-4">
              <div className="border-b border-surface-border pb-3">
                <h3 className="text-base font-bold text-charcoal-900 flex items-center gap-2">
                  <Boxes className="h-5 w-5 text-brand-600" />
                  Step 6: Batch Inventory & Opening Stock
                </h3>
                <p className="text-xs text-charcoal-500 mt-1">
                  Initialize physical warehouse stock with exact batch numbers, expiry dates, and acquisition unit costs.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-lg border border-surface-border bg-surface-muted/50 text-center">
                  <div className="text-lg font-bold font-mono text-amber-700">{steps?.openingStock.batchesCount || 0}</div>
                  <div className="text-xs font-semibold text-charcoal-700">Batches Registered</div>
                </div>
                <div className="p-3.5 rounded-lg border border-surface-border bg-surface-muted/50 text-center">
                  <div className="text-lg font-bold font-mono text-charcoal-900">{steps?.openingStock.totalUnitsInStock || 0}</div>
                  <div className="text-xs font-semibold text-charcoal-700">Units in Physical Stock</div>
                </div>
                <div className="p-3.5 rounded-lg border border-surface-border bg-surface-muted/50 text-center">
                  <div className="text-lg font-bold font-mono text-emerald-700">
                    Rs. {steps?.openingStock.totalStockValuation.toLocaleString() || '0.00'}
                  </div>
                  <div className="text-xs font-semibold text-charcoal-700">Stock Valuation (Cost)</div>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <span className="font-bold">Authoritative Ledger Invariant: </span>
                  Stock is initialized strictly through <code>StockMovementType.OPENING_BALANCE</code> entries without direct quantity overrides.
                </div>
              </div>

              <button
                onClick={() => navigate('/imports')}
                className="px-4 py-2 rounded-md bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5"
              >
                <UploadCloud className="h-4 w-4" />
                Launch Opening Stock Importer
              </button>
            </div>
          )}

          {/* STEP 7: VERIFICATION & LAUNCH */}
          {currentStep === 7 && (
            <div className="space-y-4">
              <div className="border-b border-surface-border pb-3">
                <h3 className="text-base font-bold text-charcoal-900 flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-brand-600" />
                  Step 7: Final System Verification & Station Launch
                </h3>
                <p className="text-xs text-charcoal-500 mt-1">
                  Review the operational checklist before finalizing your installation.
                </p>
              </div>

              <div className="space-y-2 rounded-lg border border-surface-border bg-surface-muted/30 p-4">
                <div className="flex items-center justify-between text-xs py-1 border-b border-surface-border/50">
                  <span className="flex items-center gap-2 font-medium text-charcoal-800">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Business & Tax Compliance Profile
                  </span>
                  <span className="font-mono text-emerald-700 font-semibold">Configured</span>
                </div>
                <div className="flex items-center justify-between text-xs py-1 border-b border-surface-border/50">
                  <span className="flex items-center gap-2 font-medium text-charcoal-800">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Head Office & Warehouses
                  </span>
                  <span className="font-mono text-emerald-700 font-semibold">{steps?.branchAndWarehouse.warehouseCount} Active</span>
                </div>
                <div className="flex items-center justify-between text-xs py-1 border-b border-surface-border/50">
                  <span className="flex items-center gap-2 font-medium text-charcoal-800">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Master Products Catalog
                  </span>
                  <span className="font-mono text-emerald-700 font-semibold">{steps?.masterData.productsCount} Items</span>
                </div>
                <div className="flex items-center justify-between text-xs py-1 border-b border-surface-border/50">
                  <span className="flex items-center gap-2 font-medium text-charcoal-800">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Customer & Supplier Directory
                  </span>
                  <span className="font-mono text-emerald-700 font-semibold">
                    {steps?.masterData.customersCount} Customers / {steps?.masterData.suppliersCount} Suppliers
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs py-1">
                  <span className="flex items-center gap-2 font-medium text-charcoal-800">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Sequential Numbering & System Settings
                  </span>
                  <span className="font-mono text-emerald-700 font-semibold">Ready</span>
                </div>
              </div>

              {canManage && (
                <div className="pt-2">
                  {!isInitialized ? (
                    <button
                      onClick={() => setShowCompleteModal(true)}
                      className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      <Sparkles className="h-4 w-4" />
                      Complete Setup & Finalize System Onboarding
                    </button>
                  ) : (
                    <div className="flex items-center justify-between p-3.5 rounded-lg bg-emerald-50 border border-emerald-200">
                      <div className="text-xs text-emerald-900 font-medium">
                        System is fully initialized and operational.
                      </div>
                      <button
                        onClick={() => resetMutation.mutate()}
                        disabled={resetMutation.isPending}
                        className="px-3 py-1 rounded bg-surface-card border border-emerald-300 text-emerald-800 hover:bg-emerald-100 text-xs font-semibold flex items-center gap-1.5"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Reopen Setup Mode
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Stepper Navigation Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-surface-border mt-auto">
            <button
              onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
              disabled={currentStep === 1}
              className="px-3.5 py-1.5 rounded-md border border-surface-border hover:bg-surface-muted disabled:opacity-40 text-charcoal-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Previous Step
            </button>

            <span className="text-[11px] font-semibold text-charcoal-500">
              Step {currentStep} of {STEPS_CONFIG.length}
            </span>

            <button
              onClick={() => setCurrentStep((prev) => Math.min(STEPS_CONFIG.length, prev + 1))}
              disabled={currentStep === STEPS_CONFIG.length}
              className="px-4 py-1.5 rounded-md bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              Next Step
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* COMPLETE SETUP MODAL */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl bg-surface-card border border-surface-border p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2.5 text-emerald-600">
              <Sparkles className="h-6 w-6" />
              <h3 className="text-base font-bold text-charcoal-900">
                Finalize System Onboarding
              </h3>
            </div>

            <p className="text-xs text-charcoal-600 leading-relaxed">
              You are about to complete the first-run installation for <strong className="text-charcoal-900">Medix by FARMAX</strong>. This will enable full live billing, inventory dispensing, and daily commercial distribution operations.
            </p>

            <div className="p-3 rounded-lg bg-surface-muted text-xs text-charcoal-700 border border-surface-border space-y-1">
              <div>• Business profile & branches marked verified.</div>
              <div>• Opening ledger and stock history preserved.</div>
              <div>• You can reopen or revisit setup anytime from the sidebar.</div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowCompleteModal(false)}
                disabled={completeMutation.isPending}
                className="px-4 py-1.5 rounded-md text-charcoal-600 hover:text-charcoal-900 text-xs font-semibold border border-surface-border hover:bg-surface-muted"
              >
                Cancel
              </button>
              <button
                onClick={() => completeMutation.mutate()}
                disabled={completeMutation.isPending}
                className="px-4 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5"
              >
                {completeMutation.isPending ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Finalizing...
                  </>
                ) : (
                  'Yes, Complete Setup'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
