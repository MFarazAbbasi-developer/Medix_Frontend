import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Table = React.forwardRef<
  HTMLTableElement,
  React.TableHTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto rounded border border-surface-border bg-surface-card">
    <table
      ref={ref}
      className={twMerge(
        clsx('w-full caption-bottom text-xs text-charcoal-800', className),
      )}
      {...props}
    />
  </div>
));
Table.displayName = 'Table';

export const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={twMerge(
      clsx('border-b border-surface-border bg-surface-muted/70 text-charcoal-700 font-semibold', className),
    )}
    {...props}
  />
));
TableHeader.displayName = 'TableHeader';

export const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={twMerge(
      clsx('[&_tr:last-child]:border-0 divide-y divide-surface-border', className),
    )}
    {...props}
  />
));
TableBody.displayName = 'TableBody';

export const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={twMerge(
      clsx(
        'transition-colors hover:bg-surface-muted/50 data-[state=selected]:bg-surface-muted',
        className,
      ),
    )}
    {...props}
  />
));
TableRow.displayName = 'TableRow';

export const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={twMerge(
      clsx(
        'h-8 px-3 text-left align-middle font-semibold text-charcoal-700 [&:has([role=checkbox])]:pr-0',
        className,
      ),
    )}
    {...props}
  />
));
TableHead.displayName = 'TableHead';

export const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={twMerge(
      clsx('p-2.5 align-middle text-charcoal-800 tabular-nums [&:has([role=checkbox])]:pr-0', className),
    )}
    {...props}
  />
));
TableCell.displayName = 'TableCell';
