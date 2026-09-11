import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DataTable, ColumnDef } from './DataTable';

interface ProductRow {
  id: string;
  sku: string;
  name: string;
  stock: number;
  tradePrice: number;
}

const columns: ColumnDef<ProductRow>[] = [
  { key: 'sku', header: 'SKU', sortable: true },
  { key: 'name', header: 'Product Name', sortable: true },
  { key: 'stock', header: 'Stock', isNumeric: true, align: 'right' },
  {
    key: 'tradePrice',
    header: 'Trade Price',
    isNumeric: true,
    align: 'right',
    render: (row) => `PKR ${row.tradePrice.toFixed(2)}`,
  },
];

const testData: ProductRow[] = [
  { id: '1', sku: 'MED-001', name: 'Panadol 500mg', stock: 150, tradePrice: 45.5 },
  { id: '2', sku: 'MED-002', name: 'Augmentin 625mg', stock: 40, tradePrice: 280.0 },
];

describe('DataTable Component', () => {
  it('renders table headers and rows correctly', () => {
    render(<DataTable columns={columns} data={testData} />);

    expect(screen.getByText('SKU')).toBeInTheDocument();
    expect(screen.getByText('Product Name')).toBeInTheDocument();
    expect(screen.getByText('Stock')).toBeInTheDocument();
    expect(screen.getByText('Panadol 500mg')).toBeInTheDocument();
    expect(screen.getByText('Augmentin 625mg')).toBeInTheDocument();
    expect(screen.getByText('PKR 45.50')).toBeInTheDocument();
  });

  it('triggers onSort when sortable header is clicked', () => {
    const handleSort = vi.fn();
    render(
      <DataTable
        columns={columns}
        data={testData}
        sortColumn="name"
        sortDirection="asc"
        onSort={handleSort}
      />,
    );

    fireEvent.click(screen.getByText('Product Name'));
    expect(handleSort).toHaveBeenCalledWith('name', 'desc');
  });

  it('renders loading state when isLoading is true', () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        isLoading={true}
        loadingMessage="Fetching inventory batches..."
      />,
    );

    expect(screen.getByText('Fetching inventory batches...')).toBeInTheDocument();
  });

  it('renders empty state when data is empty', () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        emptyMessage="No products found in catalog"
      />,
    );

    expect(screen.getByText('No products found in catalog')).toBeInTheDocument();
  });
});
