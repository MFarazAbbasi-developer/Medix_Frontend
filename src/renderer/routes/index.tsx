import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { LoginPage } from './LoginPage';
import { DashboardPage } from './DashboardPage';
import { SettingsPage } from './SettingsPage';
import { ProductsPage } from './ProductsPage';
import { InventoryPage } from './InventoryPage';
import { PurchasingPage } from './PurchasingPage';
import { SuppliersPage } from './SuppliersPage';
import { SalesPage } from './SalesPage';
import { CustomersPage } from './CustomersPage';
import { CustomerPaymentsPage } from './CustomerPaymentsPage';
import { SalesReturnsPage } from './SalesReturnsPage';
import { SupplierPaymentsPage } from './SupplierPaymentsPage';
import { PurchaseReturnsPage } from './PurchaseReturnsPage';
import { PricingPage } from './PricingPage';
import { TransfersPage } from './TransfersPage';
import { ExpiryRecallPage } from './ExpiryRecallPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Authentication Route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Desktop Application Shell */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="transfers" element={<TransfersPage />} />
          <Route path="expiry-recalls" element={<ExpiryRecallPage />} />
          <Route path="pricing" element={<PricingPage />} />
          <Route path="sales" element={<SalesPage />} />
          <Route path="sales-returns" element={<SalesReturnsPage />} />
          <Route path="payments" element={<CustomerPaymentsPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="purchasing" element={<PurchasingPage />} />
          <Route path="purchase-returns" element={<PurchaseReturnsPage />} />
          <Route path="suppliers" element={<SuppliersPage />} />
          <Route path="supplier-payments" element={<SupplierPaymentsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
    </Routes>
  );
};
