import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Settings,
  Package,
  Layers,
  ShoppingCart,
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
  UploadCloud,
  Sparkles,
  ShoppingBag,
  UserCheck,
  MapPin,
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { clsx } from 'clsx';

interface NavGroup {
  group: string;
  items: {
    to: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    end?: boolean;
  }[];
}

export const AppSidebar: React.FC = () => {
  const { isSidebarCollapsed, toggleSidebar } = useAppStore();

  const navigationGroups: NavGroup[] = [
    {
      group: 'Overview',
      items: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true }],
    },
    {
      group: 'Sales',
      items: [
        { to: '/sales', label: 'POS Billing', icon: ShoppingBag },
        { to: '/sales-returns', label: 'Returns', icon: RotateCcw },
        { to: '/payments', label: 'Payments', icon: CreditCard },
      ],
    },
    {
      group: 'Sales Operations',
      items: [
        { to: '/salesmen', label: 'Salesmen', icon: UserCheck },
        { to: '/routes', label: 'Routes', icon: MapPin },
      ],
    },
    {
      group: 'Purchasing',
      items: [
        { to: '/purchasing', label: 'Receiving & PO', icon: ShoppingCart },
        { to: '/purchase-returns', label: 'Returns', icon: RotateCcw },
        { to: '/supplier-payments', label: 'Payments', icon: CreditCard },
      ],
    },
    {
      group: 'Inventory',
      items: [
        { to: '/inventory', label: 'Stock Ledger', icon: Layers },
        { to: '/transfers', label: 'Transfers', icon: ArrowLeftRight },
        { to: '/expiry-recalls', label: 'Expiry & Recalls', icon: ShieldAlert },
      ],
    },
    {
      group: 'Parties',
      items: [
        { to: '/customers', label: 'Customers', icon: Users },
        { to: '/suppliers', label: 'Suppliers', icon: Building2 },
      ],
    },
    {
      group: 'Catalog',
      items: [
        { to: '/products', label: 'Products', icon: Package },
        { to: '/pricing', label: 'Pricing & Schemes', icon: Tag },
      ],
    },
    {
      group: 'Reports',
      items: [{ to: '/reports', label: 'Reports & Analytics', icon: BarChart3 }],
    },
    {
      group: 'System',
      items: [
        { to: '/imports', label: 'Data Imports', icon: UploadCloud },
        { to: '/admin', label: 'Administration', icon: Shield },
        { to: '/settings', label: 'Settings', icon: Settings },
        { to: '/onboarding', label: 'Setup & Onboarding', icon: Sparkles },
      ],
    },
  ];

  return (
    <aside
      className={clsx(
        'border-r border-surface-border bg-surface-card flex flex-col justify-between transition-all duration-200 select-none z-20 shrink-0 h-full',
        isSidebarCollapsed ? 'w-16' : 'w-60',
      )}
    >
      {/* Scrollable Navigation List */}
      <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden py-2 divide-y divide-surface-border/50">
        {navigationGroups.map((navGroup) => (
          <div key={navGroup.group} className="px-2 py-2">
            {!isSidebarCollapsed && (
              <p className="px-2.5 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-charcoal-400">
                {navGroup.group}
              </p>
            )}

            <nav className="space-y-0.5">
              {navGroup.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to + item.label}
                    to={item.to}
                    end={item.end}
                    title={isSidebarCollapsed ? `${navGroup.group}: ${item.label}` : undefined}
                    className={({ isActive }) =>
                      clsx(
                        'flex items-center gap-2.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors',
                        isActive
                          ? 'bg-brand-50 text-brand-700 font-semibold border border-brand-200/60 shadow-2xs'
                          : 'text-charcoal-700 hover:bg-surface-muted hover:text-charcoal-900 border border-transparent',
                        isSidebarCollapsed && 'justify-center px-0 py-2',
                      )
                    }
                  >
                    <Icon className="h-4 w-4 shrink-0 text-charcoal-600" />
                    {!isSidebarCollapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Collapse Toggle Footer */}
      <div className="p-2 border-t border-surface-border shrink-0 bg-surface-muted/20">
        <button
          type="button"
          onClick={toggleSidebar}
          title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          className="w-full flex items-center justify-center p-1.5 rounded text-charcoal-500 hover:text-charcoal-800 hover:bg-surface-muted transition-colors text-xs border border-transparent hover:border-surface-border"
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
