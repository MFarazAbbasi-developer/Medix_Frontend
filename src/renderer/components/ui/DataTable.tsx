import React from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, Inbox } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ColumnDef<T> {
  key: string;
  header: React.ReactNode;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  width?: string;
  isNumeric?: boolean;
  className?: string;
  headerClassName?: string;
  render?: (row: T, index: number) => React.ReactNode;
}

export interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  keyExtractor?: (row: T, index: number) => string | number;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (columnKey: string, direction: 'asc' | 'desc') => void;
  stickyHeader?: boolean;
  isLoading?: boolean;
  loadingMessage?: string;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  zebra?: boolean;
  dense?: boolean;
  onRowClick?: (row: T, index: number) => void;
  selectedRowKeys?: (string | number)[];
  highlightRowKey?: string | number;
  className?: string;
  tableClassName?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  sortColumn,
  sortDirection,
  onSort,
  stickyHeader = false,
  isLoading = false,
  loadingMessage = 'Loading data records...',
  emptyMessage = 'No records found',
  emptyIcon,
  zebra = false,
  dense = true,
  onRowClick,
  selectedRowKeys = [],
  highlightRowKey,
  className,
  tableClassName,
}: DataTableProps<T>) {
  const handleHeaderClick = (col: ColumnDef<T>) => {
    if (!col.sortable || !onSort) return;

    if (sortColumn === col.key) {
      const nextDir = sortDirection === 'asc' ? 'desc' : 'asc';
      onSort(col.key, nextDir);
    } else {
      onSort(col.key, 'asc');
    }
  };

  const getRowKey = (row: T, index: number): string | number => {
    if (keyExtractor) return keyExtractor(row, index);
    if (typeof row === 'object' && row !== null && 'id' in row) {
      return (row as { id: string | number }).id;
    }
    return index;
  };

  return (
    <div
      className={twMerge(
        clsx(
          'relative w-full overflow-auto rounded border border-surface-border bg-surface-card shadow-xs',
          className,
        ),
      )}
    >
      <table
        className={twMerge(
          clsx('w-full border-collapse text-left text-xs text-charcoal-800', tableClassName),
        )}
      >
        <thead
          className={clsx(
            'border-b border-surface-border bg-surface-muted/80 text-charcoal-700 font-semibold select-none',
            stickyHeader && 'sticky top-0 z-10 shadow-xs',
          )}
        >
          <tr>
            {columns.map((col) => {
              const isSorted = sortColumn === col.key;
              const alignClass =
                col.align === 'right' || col.isNumeric
                  ? 'text-right'
                  : col.align === 'center'
                  ? 'text-center'
                  : 'text-left';

              return (
                <th
                  key={col.key}
                  style={col.width ? { width: col.width } : undefined}
                  onClick={() => handleHeaderClick(col)}
                  className={twMerge(
                    clsx(
                      'px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-charcoal-600',
                      alignClass,
                      col.sortable && 'cursor-pointer hover:bg-surface-muted hover:text-charcoal-900 transition-colors',
                      col.headerClassName,
                    ),
                  )}
                >
                  <div
                    className={clsx(
                      'inline-flex items-center gap-1',
                      alignClass === 'text-right' && 'justify-end w-full',
                      alignClass === 'text-center' && 'justify-center w-full',
                    )}
                  >
                    <span>{col.header}</span>
                    {col.sortable && (
                      <span className="shrink-0 text-charcoal-400">
                        {isSorted ? (
                          sortDirection === 'asc' ? (
                            <ChevronUp className="h-3.5 w-3.5 text-brand-600" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5 text-brand-600" />
                          )
                        ) : (
                          <ChevronsUpDown className="h-3 w-3 opacity-60" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody className="divide-y divide-surface-border">
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="p-8 text-center">
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
                  <span className="text-xs font-medium text-charcoal-500">
                    {loadingMessage}
                  </span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="p-8 text-center">
                <div className="flex flex-col items-center justify-center gap-1.5 text-charcoal-400">
                  {emptyIcon || <Inbox className="h-7 w-7 text-charcoal-300" />}
                  <p className="text-xs font-medium text-charcoal-600">
                    {emptyMessage}
                  </p>
                </div>
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => {
              const rowKey = getRowKey(row, rowIndex);
              const isSelected = selectedRowKeys.includes(rowKey);
              const isHighlighted = highlightRowKey === rowKey;

              return (
                <tr
                  key={rowKey}
                  onClick={() => onRowClick?.(row, rowIndex)}
                  className={clsx(
                    'transition-colors',
                    onRowClick && 'cursor-pointer',
                    isSelected && 'bg-brand-50/70 text-brand-900 font-medium',
                    isHighlighted && 'bg-amber-50/60',
                    !isSelected &&
                      !isHighlighted &&
                      (zebra && rowIndex % 2 === 1
                        ? 'bg-surface-muted/30 hover:bg-surface-muted/60'
                        : 'bg-surface-card hover:bg-surface-muted/50'),
                  )}
                >
                  {columns.map((col) => {
                    const alignClass =
                      col.align === 'right' || col.isNumeric
                        ? 'text-right'
                        : col.align === 'center'
                        ? 'text-center'
                        : 'text-left';

                    const content = col.render
                      ? col.render(row, rowIndex)
                      : (row as any)[col.key];

                    return (
                      <td
                        key={col.key}
                        className={twMerge(
                          clsx(
                            dense ? 'px-3 py-1.5 text-xs' : 'px-3 py-2.5 text-xs',
                            alignClass,
                            col.isNumeric && 'tabular-nums font-mono',
                            col.className,
                          ),
                        )}
                      >
                        {content}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
