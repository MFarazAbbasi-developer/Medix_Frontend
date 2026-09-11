import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  className?: string;
  showPageSizeSelector?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize = 25,
  pageSizeOptions = [10, 25, 50, 100],
  onPageChange,
  onPageSizeChange,
  className,
  showPageSizeSelector = true,
}) => {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (currentPage > 3) {
        pages.push('...');
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }
      pages.push(totalPages);
    }

    return pages;
  };

  const startEntry = totalItems ? Math.min((currentPage - 1) * pageSize + 1, totalItems) : 0;
  const endEntry = totalItems ? Math.min(currentPage * pageSize, totalItems) : 0;

  return (
    <div
      className={twMerge(
        clsx(
          'flex flex-col sm:flex-row items-center justify-between gap-3 px-3 py-2 border-t border-surface-border bg-surface-muted/40 text-xs text-charcoal-700 select-none',
          className,
        ),
      )}
    >
      {/* Result Summary & Page Size */}
      <div className="flex items-center gap-3">
        {totalItems !== undefined && (
          <span className="text-[11px] text-charcoal-500">
            Showing <strong className="text-charcoal-800 font-mono">{startEntry}</strong> to{' '}
            <strong className="text-charcoal-800 font-mono">{endEntry}</strong> of{' '}
            <strong className="text-charcoal-800 font-mono">{totalItems}</strong> entries
          </span>
        )}

        {showPageSizeSelector && onPageSizeChange && (
          <div className="flex items-center gap-1.5 text-[11px] text-charcoal-500 border-l border-surface-border pl-3">
            <span>Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-6 rounded border border-surface-border bg-surface-card px-1.5 text-[11px] font-semibold text-charcoal-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center gap-1">
        {/* First Page */}
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={currentPage <= 1}
          title="First Page"
          className="h-7 w-7 flex items-center justify-center rounded border border-surface-border bg-surface-card text-charcoal-600 hover:bg-surface-muted hover:text-charcoal-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronsLeft className="h-3.5 w-3.5" />
        </button>

        {/* Prev Page */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          title="Previous Page"
          className="h-7 w-7 flex items-center justify-center rounded border border-surface-border bg-surface-card text-charcoal-600 hover:bg-surface-muted hover:text-charcoal-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1 mx-0.5">
          {getPageNumbers().map((p, idx) => {
            if (p === '...') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-1.5 text-xs text-charcoal-400 select-none"
                >
                  ...
                </span>
              );
            }

            const isCurrent = p === currentPage;
            return (
              <button
                key={`page-${p}`}
                type="button"
                onClick={() => onPageChange(p as number)}
                className={clsx(
                  'h-7 min-w-[28px] px-1.5 flex items-center justify-center rounded text-xs font-semibold transition-colors',
                  isCurrent
                    ? 'bg-brand-500 text-white shadow-xs'
                    : 'border border-surface-border bg-surface-card text-charcoal-700 hover:bg-surface-muted hover:text-charcoal-900',
                )}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Next Page */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages || totalPages === 0}
          title="Next Page"
          className="h-7 w-7 flex items-center justify-center rounded border border-surface-border bg-surface-card text-charcoal-600 hover:bg-surface-muted hover:text-charcoal-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>

        {/* Last Page */}
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages || totalPages === 0}
          title="Last Page"
          className="h-7 w-7 flex items-center justify-center rounded border border-surface-border bg-surface-card text-charcoal-600 hover:bg-surface-muted hover:text-charcoal-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronsRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
