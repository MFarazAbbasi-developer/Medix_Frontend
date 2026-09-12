import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { ProtectedRoute } from './ProtectedRoute';

// Loading fallback spinner for lazy-loaded route chunks
const RouteLoadingFallback: React.FC = () => (
  <div className="flex h-64 w-full items-center justify-center">
    <div className="flex flex-col items-center gap-2">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
      <span className="text-xs font-medium text-charcoal-500">Loading module...</span>
    </div>
  </div>
);

// Eagerly loaded critical landing routes
import { LoginPage } from './LoginPage';
import { DashboardPage } from './DashboardPage';

// Lazy-loaded feature modules for bundle splitting and faster startup
const OnboardingPage = lazy(() =>
  import('./OnboardingPage').then((m) => ({ default: m.OnboardingPage })),
);
const ProductsPage = lazy(() =>
  import('./ProductsPage').then((m) => ({ default: m.ProductsPage })),
);
const InventoryPage = lazy(() =>
  import('./InventoryPage').then((m) => ({ default: m.InventoryPage })),
);
const ImportsPage = lazy(() =>
  import('./ImportsPage').then((m) => ({ default: m.ImportsPage })),
);
const TransfersPage = lazy(() =>
  import('./TransfersPage').then((m) => ({ default: m.TransfersPage })),
);
const ExpiryRecallPage = lazy(() =>
  import('./ExpiryRecallPage').then((m) => ({ default: m.ExpiryRecallPage })),
);
const ReportsPage = lazy(() =>
  import('./ReportsPage').then((m) => ({ default: m.ReportsPage })),
);
const PricingPage = lazy(() =>
  import('./PricingPage').then((m) => ({ default: m.PricingPage })),
);
const SalesPage = lazy(() =>
  import('./SalesPage').then((m) => ({ default: m.SalesPage })),
);
const SalesReturnsPage = lazy(() =>
  import('./SalesReturnsPage').then((m) => ({ default: m.SalesReturnsPage })),
);
const CustomerPaymentsPage = lazy(() =>
  import('./CustomerPaymentsPage').then((m) => ({ default: m.CustomerPaymentsPage })),
);
const CustomersPage = lazy(() =>
  import('./CustomersPage').then((m) => ({ default: m.CustomersPage })),
);
const SalesmenPage = lazy(() =>
  import('./SalesmenPage').then((m) => ({ default: m.SalesmenPage })),
);
const SalesRoutesPage = lazy(() =>
  import('./SalesRoutesPage').then((m) => ({ default: m.SalesRoutesPage })),
);
const DeliveryOrdersPage = lazy(() =>
  import('./DeliveryOrdersPage').then((m) => ({ default: m.DeliveryOrdersPage })),
);
const PurchaseSuggestionsPage = lazy(() =>
  import('./PurchaseSuggestionsPage').then((m) => ({ default: m.PurchaseSuggestionsPage })),
);
const PurchasingPage = lazy(() =>
  import('./PurchasingPage').then((m) => ({ default: m.PurchasingPage })),
);
const PurchaseReturnsPage = lazy(() =>
  import('./PurchaseReturnsPage').then((m) => ({ default: m.PurchaseReturnsPage })),
);
const SuppliersPage = lazy(() =>
  import('./SuppliersPage').then((m) => ({ default: m.SuppliersPage })),
);
const SupplierPaymentsPage = lazy(() =>
  import('./SupplierPaymentsPage').then((m) => ({ default: m.SupplierPaymentsPage })),
);
const AdminPage = lazy(() =>
  import('./AdminPage').then((m) => ({ default: m.AdminPage })),
);
const SettingsPage = lazy(() =>
  import('./SettingsPage').then((m) => ({ default: m.SettingsPage })),
);
const TillSessionsPage = lazy(() =>
  import('./TillSessionsPage').then((m) => ({ default: m.TillSessionsPage })),
);

export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>
        {/* Public Authentication Route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Desktop Application Shell */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="onboarding" element={<OnboardingPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="imports" element={<ImportsPage />} />
            <Route path="transfers" element={<TransfersPage />} />
            <Route path="expiry-recalls" element={<ExpiryRecallPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="pricing" element={<PricingPage />} />
            <Route path="sales" element={<SalesPage />} />
            <Route path="sales-returns" element={<SalesReturnsPage />} />
            <Route path="payments" element={<CustomerPaymentsPage />} />
            <Route path="till-sessions" element={<TillSessionsPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="salesmen" element={<SalesmenPage />} />
            <Route path="routes" element={<SalesRoutesPage />} />
            <Route path="delivery-orders" element={<DeliveryOrdersPage />} />
            <Route path="purchase-suggestions" element={<PurchaseSuggestionsPage />} />
            <Route path="purchasing" element={<PurchasingPage />} />
            <Route path="purchase-returns" element={<PurchaseReturnsPage />} />
            <Route path="suppliers" element={<SuppliersPage />} />
            <Route path="supplier-payments" element={<SupplierPaymentsPage />} />
            <Route path="admin" element={<AdminPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
};
