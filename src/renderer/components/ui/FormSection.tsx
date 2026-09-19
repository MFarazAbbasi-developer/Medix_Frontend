import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { clsx } from 'clsx';

export interface FormSectionProps {
  title: string;
  description?: React.ReactNode;
  badge?: React.ReactNode;
  children: React.ReactNode;
  isCollapsible?: boolean;
  defaultExpanded?: boolean;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
}

/**
 * Lightweight progressive-disclosure section for forms.
 * Keeps forms visually clean without turning every group into heavy nested cards.
 */
export const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  badge,
  children,
  isCollapsible = false,
  defaultExpanded = true,
  className,
  headerClassName,
  contentClassName,
}) => {
  const [isExpanded, setIsExpanded] = useState(isCollapsible ? defaultExpanded : true);

  const toggleExpanded = () => {
    if (isCollapsible) {
      setIsExpanded((prev) => !prev);
    }
  };

  return (
    <div className={clsx('space-y-2.5 select-none', className)}>
      <div
        onClick={isCollapsible ? toggleExpanded : undefined}
        className={clsx(
          'flex items-center justify-between gap-2 py-1',
          isCollapsible && 'cursor-pointer hover:opacity-80 transition-opacity',
          headerClassName,
        )}
        role={isCollapsible ? 'button' : undefined}
        aria-expanded={isCollapsible ? isExpanded : undefined}
        tabIndex={isCollapsible ? 0 : undefined}
        onKeyDown={(e) => {
          if (isCollapsible && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            toggleExpanded();
          }
        }}
      >
        <div className="flex items-baseline gap-2 min-w-0">
          <h4 className="text-xs font-bold tracking-tight text-charcoal-800 uppercase">
            {title}
          </h4>
          {badge && <div className="shrink-0">{badge}</div>}
          {description && (
            <span className="text-[11px] text-charcoal-400 font-normal truncate hidden sm:inline">
              • {description}
            </span>
          )}
        </div>

        {isCollapsible && (
          <div className="flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:text-brand-700 shrink-0">
            <span>{isExpanded ? 'Hide' : 'Show details'}</span>
            {isExpanded ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </div>
        )}
      </div>

      {(!isCollapsible || isExpanded) && (
        <div className={clsx('pt-0.5', contentClassName)}>
          {children}
        </div>
      )}
    </div>
  );
};
