import React, { useRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface TabItem {
  id: string;
  label: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  badgeVariant?: 'neutral' | 'success' | 'warning' | 'error' | 'brand';
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  variant?: 'pills' | 'underline' | 'boxed';
  size?: 'sm' | 'md';
  className?: string;
  tabClassName?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'boxed',
  size = 'sm',
  className,
  tabClassName,
}) => {
  const tabsRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const enabledTabs = tabs.filter((t) => !t.disabled);
    const currentIndex = enabledTabs.findIndex((t) => t.id === activeTab);

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextTab = enabledTabs[(currentIndex + 1) % enabledTabs.length];
      if (nextTab) onChange(nextTab.id);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevTab =
        enabledTabs[(currentIndex - 1 + enabledTabs.length) % enabledTabs.length];
      if (prevTab) onChange(prevTab.id);
    }
  };

  const badgeVariants: Record<string, string> = {
    neutral: 'bg-surface-muted text-charcoal-700 border-surface-border',
    success: 'bg-status-success-bg text-status-success-text border-status-success-border',
    warning: 'bg-status-warning-bg text-status-warning-text border-status-warning-border',
    error: 'bg-status-error-bg text-status-error-text border-status-error-border',
    brand: 'bg-brand-50 text-brand-700 border-brand-200',
  };

  const getContainerStyles = () => {
    switch (variant) {
      case 'pills':
        return 'flex items-center gap-1.5 p-1 bg-surface-muted rounded border border-surface-border';
      case 'underline':
        return 'flex items-center gap-4 border-b border-surface-border';
      case 'boxed':
      default:
        return 'flex items-center gap-1 p-1 bg-surface-muted/80 rounded border border-surface-border';
    }
  };

  const getTabStyles = (isActive: boolean, disabled?: boolean) => {
    if (disabled) {
      return 'opacity-40 cursor-not-allowed text-charcoal-400';
    }

    const sizeStyles =
      size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-xs font-semibold';

    switch (variant) {
      case 'pills':
        return clsx(
          sizeStyles,
          'rounded font-semibold transition-all select-none',
          isActive
            ? 'bg-brand-500 text-white shadow-xs'
            : 'text-charcoal-600 hover:text-charcoal-900 hover:bg-white/60',
        );
      case 'underline':
        return clsx(
          sizeStyles,
          '-mb-px border-b-2 font-semibold transition-all select-none',
          isActive
            ? 'border-brand-500 text-brand-600'
            : 'border-transparent text-charcoal-600 hover:text-charcoal-900 hover:border-surface-borderStrong',
        );
      case 'boxed':
      default:
        return clsx(
          sizeStyles,
          'rounded font-medium transition-all select-none',
          isActive
            ? 'bg-white text-brand-700 font-semibold shadow-2xs border border-surface-border'
            : 'text-charcoal-600 hover:text-charcoal-900 hover:bg-white/40 border border-transparent',
        );
    }
  };

  return (
    <div
      ref={tabsRef}
      role="tablist"
      className={twMerge(clsx(getContainerStyles(), className))}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={isActive}
            disabled={tab.disabled}
            onClick={() => !tab.disabled && onChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e)}
            className={twMerge(clsx(getTabStyles(isActive, tab.disabled), tabClassName))}
          >
            <div className="flex items-center gap-1.5">
              {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={clsx(
                    'px-1.5 py-0.2 rounded-full text-[10px] font-bold border tabular-nums',
                    badgeVariants[tab.badgeVariant || 'neutral'],
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};
