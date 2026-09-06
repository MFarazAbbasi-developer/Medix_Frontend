import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ImportsPage } from './ImportsPage';
import { importsApi } from '../api/imports.api';
import { useAuthStore } from '../store/authStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

describe('ImportsPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: {
        id: 'user-1',
        username: 'admin',
        displayName: 'Administrator',
        roles: ['ADMIN'],
        permissions: ['imports.view', 'imports.manage'],
      },
    });

    vi.spyOn(importsApi, 'findAll').mockResolvedValue({
      items: [
        {
          id: 'job-1',
          type: 'PRODUCTS',
          status: 'COMPLETED',
          originalFilename: 'products_v1.csv',
          totalRows: 150,
          validRows: 150,
          invalidRows: 0,
          importedRows: 150,
          failedRows: 0,
          createdAt: new Date().toISOString(),
          createdByUser: { id: 'u-1', username: 'admin', displayName: 'Admin' },
        },
      ],
      meta: { page: 1, limit: 50, total: 1, totalPages: 1 },
    });

    vi.spyOn(importsApi, 'downloadTemplate').mockResolvedValue(
      new Blob(['SKU,Name\nMED-1,Panadol']),
    );
  });

  it('renders Import Center title, step cards, and upload area', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ImportsPage />
      </QueryClientProvider>,
    );

    expect(screen.getByText('Data Import & Migration Center')).toBeInTheDocument();
    expect(screen.getByText('Products Master')).toBeInTheDocument();
    expect(screen.getByText('Customers Directory')).toBeInTheDocument();
    expect(screen.getByText('Suppliers & Vendors')).toBeInTheDocument();
    expect(screen.getByText('Opening Stock (Batch-Aware)')).toBeInTheDocument();
  });

  it('switches to history tab and displays past imports', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ImportsPage />
      </QueryClientProvider>,
    );

    const historyTab = screen.getByRole('button', { name: /import history/i });
    fireEvent.click(historyTab);

    await waitFor(() => {
      expect(screen.getByText('products_v1.csv')).toBeInTheDocument();
      expect(screen.getByText('COMPLETED')).toBeInTheDocument();
    });
  });

  it('handles template download trigger', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ImportsPage />
      </QueryClientProvider>,
    );

    const downloadBtn = screen.getByRole('button', { name: /download products master template/i });
    fireEvent.click(downloadBtn);

    await waitFor(() => {
      expect(importsApi.downloadTemplate).toHaveBeenCalledWith('PRODUCTS');
    });
  });

  it('displays preview data and confirms import', async () => {
    vi.spyOn(importsApi, 'upload').mockResolvedValue({
      job: {
        id: 'job-new',
        type: 'PRODUCTS',
        status: 'READY',
        originalFilename: 'new_products.csv',
        totalRows: 2,
        validRows: 2,
        invalidRows: 0,
        importedRows: 0,
        failedRows: 0,
        createdAt: new Date().toISOString(),
      },
      preview: {
        totalRows: 2,
        validRows: 2,
        invalidRows: 0,
        errors: [],
        warnings: [],
        summary: { totalProducts: 2 },
        previewRows: [
          { sku: 'MED-101', name: 'Panadol 500mg', _row: 1, _valid: true },
          { sku: 'MED-102', name: 'Brufen 400mg', _row: 2, _valid: true },
        ],
      },
    });

    vi.spyOn(importsApi, 'confirm').mockResolvedValue({
      id: 'job-new',
      type: 'PRODUCTS',
      status: 'COMPLETED',
      originalFilename: 'new_products.csv',
      totalRows: 2,
      validRows: 2,
      invalidRows: 0,
      importedRows: 2,
      failedRows: 0,
      createdAt: new Date().toISOString(),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ImportsPage />
      </QueryClientProvider>,
    );

    const file = new File(['SKU,Name\nMED-101,Panadol\nMED-102,Brufen'], 'new_products.csv', {
      type: 'text/csv',
    });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    const parseBtn = await screen.findByRole('button', { name: /parse & validate file/i });
    fireEvent.click(parseBtn);

    await waitFor(() => {
      expect(screen.getByText(/validation preview: new_products.csv/i)).toBeInTheDocument();
      expect(screen.getByText('Panadol 500mg')).toBeInTheDocument();
    });

    const confirmBtn = screen.getByRole('button', { name: /confirm & execute import/i });
    fireEvent.click(confirmBtn);

    const modalConfirmBtn = await screen.findByRole('button', { name: /yes, execute import/i });
    fireEvent.click(modalConfirmBtn);

    await waitFor(() => {
      expect(importsApi.confirm).toHaveBeenCalledWith('job-new');
      expect(screen.getByText(/successfully completed/i)).toBeInTheDocument();
    });
  });
});
