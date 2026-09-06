import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Settings,
  Package,
  Layers,
  ShoppingCart,
  Receipt,
  Users,
  Building2,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  RotateCcw,
  Tag,
  ArrowLeftRight,
  ShieldAlert,
  Shield,
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { clsx } from 'clsx';

export const AppSidebar: React.FC = () => {
  const { isSidebarCollapsed, toggleSidebar } = useAppStore();

  const coreNavItems = [
    { to: '/', label: 'Overview', icon: LayoutDashboard },
    { to: '/products', label: 'Products & Batches', icon: Package },
    { to: '/inventory', label: 'Inventory & Stock', icon: Layers },
    { to: '/admin', label: 'Administration & System', icon: Shield },
    { to: '/settings', label: 'System Settings', icon: Settings },
  ];

  const businessNavItems = [
    { to: '/reports', label: 'Reports & Analytics', icon: BarChart3 },
    { to: '/sales', label: 'Sales & Invoicing', icon: Receipt },
    { to: '/pricing', label: 'Pricing & Schemes', icon: Tag },
    { to: '/transfers', label: 'Stock Transfers', icon: ArrowLeftRight },
    { to: '/expiry-recalls', label: 'Expiry & Recalls', icon: ShieldAlert },
    { to: '/sales-returns', label: 'Sales Returns', icon: RotateCcw },
    { to: '/payments', label: 'Customer Payments', icon: CreditCard },
    { to: '/customers', label: 'Customers & Parties', icon: Users },
    { to: '/purchasing', label: 'Purchasing & Receiving', icon: ShoppingCart },
    { to: '/purchase-returns', label: 'Purchase Returns', icon: RotateCcw },
    { to: '/supplier-payments', label: 'Supplier Payments', icon: CreditCard },
    { to: '/suppliers', label: 'Suppliers & Vendors', icon: Building2 },
  ];

  const plannedModules: { label: string; icon: React.ComponentType<{ className?: string }> }[] = [];

  return (
    <aside
      className={clsx(
        'border-r border-surface-border bg-surface-card flex flex-col justify-between transition-all duration-200 select-none z-20',
        isSidebarCollapsed ? 'w-14' : 'w-56',
      )}
    >
      <div className="flex flex-col flex-1 overflow-y-auto">
        {/* Foundation Core Nav */}
        <div className="px-2 py-3">
          {!isSidebarCollapsed && (
            <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-charcoal-400">
              System Foundation
            </p>
          )}
          <nav className="space-y-0.5">
            {coreNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-2.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors',
                      isActive
                        ? 'bg-brand-50 text-brand-700 font-semibold border border-brand-200/60'
                        : 'text-charcoal-700 hover:bg-surface-muted hover:text-charcoal-900 border border-transparent',
                    )
                  }
                >
                  <Icon className="h-4 w-4 shrink-0 text-charcoal-600" />
                  {!isSidebarCollapsed && <span>{item.label}</span>}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Business Modules */}
        <div className="px-2 py-2 border-t border-surface-border">
          {!isSidebarCollapsed && (
            <div className="px-2 pb-1.5 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-400">
                Business Modules
              </span>
            </div>
          )}
          <nav className="space-y-0.5">
            {businessNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-2.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors',
                      isActive
                        ? 'bg-brand-50 text-brand-700 font-semibold border border-brand-200/60'
                        : 'text-charcoal-700 hover:bg-surface-muted hover:text-charcoal-900 border border-transparent',
                    )
                  }
                >
                  <Icon className="h-4 w-4 shrink-0 text-charcoal-600" />
                  {!isSidebarCollapsed && <span>{item.label}</span>}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Upcoming Modules Skeleton */}
        <div className="px-2 py-2 border-t border-surface-border">
          {!isSidebarCollapsed && (
            <div className="px-2 pb-1.5 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-400">
                Upcoming Modules
              </span>
            </div>
          )}
          <div className="space-y-0.5">
            {plannedModules.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  title={isSidebarCollapsed ? `${item.label} (Upcoming)` : undefined}
                  className="flex items-center gap-2.5 px-2.5 py-1.5 rounded text-xs text-charcoal-400 opacity-60 cursor-not-allowed select-none"
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!isSidebarCollapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Collapse Toggle Footer */}
      <div className="p-2 border-t border-surface-border">
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center p-1.5 rounded text-charcoal-500 hover:text-charcoal-800 hover:bg-surface-muted transition-colors text-xs"
        >
          {isSidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <div className="flex items-center gap-1.5">
              <ChevronLeft className="h-4 w-4" />
              <span className="text-[11px] font-medium">Collapse Sidebar</span>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
};
