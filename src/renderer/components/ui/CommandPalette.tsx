import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  LayoutDashboard,
  ShoppingBag,
  RotateCcw,
  CreditCard,
  Wallet,
  UserCheck,
  MapPin,
  Truck,
  TrendingDown,
  ShoppingCart,
  Layers,
  ArrowLeftRight,
  ShieldAlert,
  Users,
  Building2,
  Package,
  Tag,
  BarChart3,
  UploadCloud,
  Shield,
  Settings,
  Sparkles,
  CornerDownLeft,
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { usePermission } from '../../hooks/usePermission';
import { clsx } from 'clsx';

interface CommandItem {
  id: string;
  title: string;
  category: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  keywords: string;
  permission?: string;
}

const COMMAND_ITEMS: CommandItem[] = [
  {
    id: 'dashboard',
    title: 'Dashboard & Overview',
    category: 'Navigation',
    to: '/',
    icon: LayoutDashboard,
    keywords: 'home overview kpi metrics summary revenue',
  },
  {
    id: 'pos-billing',
    title: 'New Sale / POS Billing',
    category: 'Sales',
    to: '/sales',
    icon: ShoppingBag,
    keywords: 'pos counter billing sale invoice cash checkout terminal',
    permission: 'sales.create',
  },
  {
    id: 'sales-returns',
    title: 'Sales Returns & Credit Notes',
    category: 'Sales',
    to: '/sales-returns',
    icon: RotateCcw,
    keywords: 'sales return refund credit note customer invoice return disposition',
    permission: 'sales_returns.create',
  },
  {
    id: 'customer-payments',
    title: 'Customer Payments & PDC',
    category: 'Sales',
    to: '/payments',
    icon: CreditCard,
    keywords: 'customer payments vouchers allocation pdc receipts collections cheque',
    permission: 'payments.create',
  },
  {
    id: 'till-sessions',
    title: 'Till Sessions & Cash Close',
    category: 'Sales',
    to: '/till-sessions',
    icon: Wallet,
    keywords: 'till register cash drawer handover shift close reconciliation',
    permission: 'till_sessions.view',
  },
  {
    id: 'salesmen',
    title: 'Salesmen & Representatives',
    category: 'Sales',
    to: '/salesmen',
    icon: UserCheck,
    keywords: 'salesmen field rep target commission sales team',
    permission: 'salesmen.view',
  },
  {
    id: 'routes',
    title: 'Sales & Delivery Routes',
    category: 'Sales',
    to: '/routes',
    icon: MapPin,
    keywords: 'routes territory delivery beats sector geographic distribution',
    permission: 'routes.view',
  },
  {
    id: 'delivery-orders',
    title: 'Delivery Orders & Challans',
    category: 'Sales',
    to: '/delivery-orders',
    icon: Truck,
    keywords: 'delivery orders challan dispatch van trip fulfillment transport',
    permission: 'delivery_orders.view',
  },
  {
    id: 'purchase-suggestions',
    title: 'Purchase Suggestions (Reorder)',
    category: 'Purchasing',
    to: '/purchase-suggestions',
    icon: TrendingDown,
    keywords: 'purchase suggestions reorder point low stock replenisment velocity forecast',
    permission: 'purchases.suggestions_view',
  },
  {
    id: 'receiving-po',
    title: 'Receive Stock (GRN & Purchasing)',
    category: 'Purchasing',
    to: '/purchasing',
    icon: ShoppingCart,
    keywords: 'grn receiving goods receive note purchase order vendor po',
    permission: 'purchases.receive',
  },
  {
    id: 'purchase-returns',
    title: 'Purchase Returns (Debit Notes)',
    category: 'Purchasing',
    to: '/purchase-returns',
    icon: RotateCcw,
    keywords: 'purchase returns debit note vendor return supplier recall return',
    permission: 'purchase_returns.view',
  },
  {
    id: 'supplier-payments',
    title: 'Supplier Payments & Settlements',
    category: 'Purchasing',
    to: '/supplier-payments',
    icon: CreditCard,
    keywords: 'supplier payments vendor payment voucher pdc cheque settlement',
    permission: 'supplier_payments.create',
  },
  {
    id: 'inventory-ledger',
    title: 'Stock Ledger & Balances',
    category: 'Inventory',
    to: '/inventory',
    icon: Layers,
    keywords: 'inventory stock ledger movements audit trail batches physical stock balance',
    permission: 'inventory.view',
  },
  {
    id: 'stock-adjustment',
    title: 'Stock Variance & Adjustments',
    category: 'Inventory',
    to: '/inventory',
    icon: Layers,
    keywords: 'stock adjustment variance physical count audit write off inventory adjust',
    permission: 'inventory.view',
  },
  {
    id: 'transfers',
    title: 'Warehouse Stock Transfers',
    category: 'Inventory',
    to: '/transfers',
    icon: ArrowLeftRight,
    keywords: 'warehouse transfers dispatch inter branch transit movement transfer',
    permission: 'transfers.view',
  },
  {
    id: 'expiry-recalls',
    title: 'Expiry Tracking & Drug Recalls',
    category: 'Inventory',
    to: '/expiry-recalls',
    icon: ShieldAlert,
    keywords: 'expiry recalls quarantine near expiry drug batch alert hazard',
    permission: 'inventory.view',
  },
  {
    id: 'customers',
    title: 'Customers Directory',
    category: 'Parties',
    to: '/customers',
    icon: Users,
    keywords: 'customers pharmacy clinic hospital doctor customer list balance credit limit',
    permission: 'customers.view',
  },
  {
    id: 'suppliers',
    title: 'Suppliers Directory',
    category: 'Parties',
    to: '/suppliers',
    icon: Building2,
    keywords: 'suppliers vendor distributor manufacturer supplier list payables',
    permission: 'suppliers.view',
  },
  {
    id: 'products',
    title: 'Pharmaceutical Products Catalog',
    category: 'Catalog',
    to: '/products',
    icon: Package,
    keywords: 'products sku drug medicine generic brand barcode formulation pack size',
    permission: 'products.view',
  },
  {
    id: 'pricing',
    title: 'Pricing, Schemes & Commercial Rules',
    category: 'Catalog',
    to: '/pricing',
    icon: Tag,
    keywords: 'pricing rules promotional schemes contracted rates trade discounts bonus precedence',
    permission: 'pricing.view',
  },
  {
    id: 'reports',
    title: 'Reports & Operational Analytics',
    category: 'Reports',
    to: '/reports',
    icon: BarChart3,
    keywords: 'reports analytics sales register purchase valuation aging profit margin export csv print',
    permission: 'reports.view',
  },
  {
    id: 'imports',
    title: 'Data Imports & Bulk Upload',
    category: 'System',
    to: '/imports',
    icon: UploadCloud,
    keywords: 'data imports csv excel upload products customers opening stock bulk migrate',
    permission: 'imports.manage',
  },
  {
    id: 'admin',
    title: 'System Administration & Security',
    category: 'System',
    to: '/admin',
    icon: Shield,
    keywords: 'administration users roles permissions security audit logs system admin',
    permission: 'users.view',
  },
  {
    id: 'settings',
    title: 'System Settings & Configuration',
    category: 'System',
    to: '/settings',
    icon: Settings,
    keywords: 'settings configuration branch tax sequences invoice print station profile',
    permission: 'settings.view',
  },
  {
    id: 'onboarding',
    title: 'Setup & System Onboarding',
    category: 'System',
    to: '/onboarding',
    icon: Sparkles,
    keywords: 'onboarding setup initial configuration master data wizard',
    permission: 'settings.view',
  },
];

export const CommandPalette: React.FC = () => {
  const { isCommandPaletteOpen, closeCommandPalette } = useAppStore();
  const { hasPermission, isAdmin } = usePermission();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter accessible commands
  const accessibleItems = useMemo(() => {
    return COMMAND_ITEMS.filter((item) => {
      if (!item.permission || isAdmin) return true;
      return hasPermission(item.permission);
    });
  }, [hasPermission, isAdmin]);

  // Filter commands by search query
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return accessibleItems;
    return accessibleItems.filter((item) => {
      return (
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.keywords.toLowerCase().includes(q)
      );
    });
  }, [accessibleItems, query]);

  // Reset selected index when query changes or when opened
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, isCommandPaletteOpen]);

  // Auto-focus input when opened
  useEffect(() => {
    if (isCommandPaletteOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isCommandPaletteOpen]);

  // Global Ctrl+K / Cmd+K and Escape shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isCommandPaletteOpen) {
          closeCommandPalette();
        } else {
          useAppStore.getState().openCommandPalette();
        }
      } else if (e.key === 'Escape' && isCommandPaletteOpen) {
        e.preventDefault();
        closeCommandPalette();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, closeCommandPalette]);

  // Execute selected command
  const executeItem = (item: CommandItem) => {
    closeCommandPalette();
    navigate(item.to);
  };

  // Keyboard navigation within the palette
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (filteredItems.length === 0 ? 0 : (prev + 1) % filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        filteredItems.length === 0
          ? 0
          : (prev - 1 + filteredItems.length) % filteredItems.length,
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        executeItem(filteredItems[selectedIndex]);
      }
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`) as HTMLElement | null;
      if (activeEl && typeof activeEl.scrollIntoView === 'function') {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isCommandPaletteOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-charcoal-950/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={closeCommandPalette}
    >
      <div
        className="w-full max-w-xl bg-surface-card border border-surface-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="flex items-center px-3.5 py-2.5 border-b border-surface-border bg-surface-ground">
          <Search className="h-4 w-4 text-brand-500 mr-2.5 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-autocomplete="list"
            aria-controls="command-palette-results"
            placeholder="Type a command or navigate to page (e.g. Sales, GRN, Stock, Reports)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            className="flex-1 bg-transparent text-xs sm:text-sm text-charcoal-900 placeholder:text-charcoal-400 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 rounded text-charcoal-400 hover:text-charcoal-700 hover:bg-surface-muted transition-colors mr-1"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded border border-surface-borderStrong bg-surface-card text-[10px] font-mono text-charcoal-500 shadow-2xs">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div
          id="command-palette-results"
          ref={listRef}
          role="listbox"
          className="flex-1 overflow-y-auto p-2 divide-y divide-surface-border/40"
        >
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-charcoal-400">
              No matching commands found for &quot;{query}&quot;
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  data-index={idx}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => executeItem(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={clsx(
                    'flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors text-xs select-none',
                    isSelected
                      ? 'bg-brand-50 text-charcoal-900 font-medium'
                      : 'text-charcoal-700 hover:bg-surface-muted/70',
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={clsx(
                        'p-1.5 rounded-md shrink-0 transition-colors',
                        isSelected
                          ? 'bg-brand-500 text-white shadow-2xs'
                          : 'bg-surface-muted text-charcoal-600',
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex flex-col truncate">
                      <span className="truncate text-charcoal-900 font-semibold">{item.title}</span>
                      <span className="text-[10px] text-charcoal-400 font-mono truncate">{item.to}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className="text-[10px] uppercase font-semibold tracking-wider text-charcoal-400 bg-surface-muted px-1.5 py-0.5 rounded border border-surface-border">
                      {item.category}
                    </span>
                    {isSelected && (
                      <CornerDownLeft className="h-3.5 w-3.5 text-brand-600 shrink-0" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-3.5 py-2 border-t border-surface-border bg-surface-ground text-[11px] text-charcoal-500 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded border border-surface-borderStrong bg-surface-card font-mono text-[9px]">
                ↑
              </kbd>
              <kbd className="px-1 py-0.5 rounded border border-surface-borderStrong bg-surface-card font-mono text-[9px]">
                ↓
              </kbd>
              <span>Navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded border border-surface-borderStrong bg-surface-card font-mono text-[9px]">
                ↵
              </kbd>
              <span>Execute</span>
            </span>
          </div>
          <span className="font-semibold text-brand-600 text-[10px]">
            Medix Command Palette
          </span>
        </div>
      </div>
    </div>
  );
};
