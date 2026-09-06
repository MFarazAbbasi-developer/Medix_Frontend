import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProductsPage } from './ProductsPage';
import { productsApi } from '../api/products.api';
import { batchesApi } from '../api/batches.api';
import { masterDataApi } from '../api/master-data.api';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

describe('ProductsPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(productsApi, 'getProducts').mockResolvedValue({
      items: [
        {
          id: 'prod-1',
          organizationId: 'org-1',
          name: 'Panadol Extra 500mg/65mg',
          genericName: 'Paracetamol + Caffeine',
          sku: 'MED-PAN-001',
          barcode: '8964000123456',
          dosageForm: 'Tablet',
          strength: '500mg / 65mg',
          packSize: '200',
          taxPercentage: '0',
          isActive: true,
          category: {
            id: 'cat-1',
            organizationId: 'org-1',
            name: 'Analgesics',
            code: 'ANALG',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          manufacturer: {
            id: 'mfg-1',
            organizationId: 'org-1',
            name: 'GSK Pakistan',
            code: 'GSK',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          unit: {
            id: 'u-1',
            organizationId: 'org-1',
            name: 'Box',
            symbol: 'BOX',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          _count: {
            batches: 1,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      meta: { page: 1, limit: 15, total: 1, totalPages: 1 },
    });

    vi.spyOn(batchesApi, 'getBatchesByProduct').mockResolvedValue([
      {
        id: 'batch-1',
        productId: 'prod-1',
        batchNumber: 'B-2026-001',
        mfgDate: '2026-01-01T00:00:00.000Z',
        expiryDate: '2028-01-01T00:00:00.000Z',
        purchaseCost: 450,
        tradePrice: 500,
        retailPrice: 575,
        status: 'ACTIVE',
        remarks: 'Standard batch',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);

    vi.spyOn(masterDataApi, 'getManufacturers').mockResolvedValue([
      {
        id: 'mfg-1',
        organizationId: 'org-1',
        name: 'GSK Pakistan',
        code: 'GSK',
        isActive: true,
        createdAt: '',
        updatedAt: '',
      },
    ]);

    vi.spyOn(masterDataApi, 'getCategories').mockResolvedValue([
      {
        id: 'cat-1',
        organizationId: 'org-1',
        name: 'Analgesics',
        code: 'ANALG',
        isActive: true,
        createdAt: '',
        updatedAt: '',
      },
    ]);

    vi.spyOn(masterDataApi, 'getUnits').mockResolvedValue([
      {
        id: 'u-1',
        organizationId: 'org-1',
        name: 'Box',
        symbol: 'BOX',
        isActive: true,
        createdAt: '',
        updatedAt: '',
      },
    ]);
  });

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <ProductsPage />
      </QueryClientProvider>,
    );

  it('renders products workspace and displays product list table', async () => {
    renderComponent();

    expect(screen.getByText('Pharmaceutical Products & Batches')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search by Brand, Generic, SKU, or Barcode.../i)).toBeInTheDocument();

    expect(await screen.findByText('Panadol Extra 500mg/65mg')).toBeInTheDocument();
    expect(screen.getByText('MED-PAN-001')).toBeInTheDocument();
    expect(screen.getByText('Paracetamol + Caffeine')).toBeInTheDocument();
    expect(screen.getAllByText('GSK Pakistan').length).toBeGreaterThanOrEqual(1);
  });

  it('opens new product modal when Add Product button is clicked', async () => {
    renderComponent();

    const addProductBtn = screen.getByRole('button', { name: /Add Product/i });
    fireEvent.click(addProductBtn);

    expect(await screen.findByText('Register New Pharmaceutical Product')).toBeInTheDocument();
    expect(screen.getByLabelText(/Commercial Brand Name \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/User-Defined SKU \/ Item Code \*/i)).toBeInTheDocument();
  });

  it('opens product detail drawer and displays batches when Batches button is clicked', async () => {
    renderComponent();

    const batchesBtn = await screen.findByRole('button', { name: /Batches/i });
    fireEvent.click(batchesBtn);

    expect(await screen.findByText('B-2026-001')).toBeInTheDocument();
    expect(screen.getByText(/Manufacturing Batches \(FEFO Chronological Order\)/i)).toBeInTheDocument();
    expect(screen.getByText('Rs. 450.00')).toBeInTheDocument();
    expect(screen.getByText('Rs. 500.00')).toBeInTheDocument();
    expect(screen.getByText('Rs. 575.00')).toBeInTheDocument();
  });

  it('opens new batch modal when Register Batch is clicked in drawer', async () => {
    renderComponent();

    const batchesBtn = await screen.findByRole('button', { name: /Batches/i });
    fireEvent.click(batchesBtn);

    const registerBatchBtn = await screen.findByRole('button', { name: /Register Batch/i });
    fireEvent.click(registerBatchBtn);

    expect(await screen.findByText(/New Batch for Panadol Extra 500mg\/65mg/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Batch \/ Lot Number \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Expiry Date \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Purchase Cost/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Trade Price \(TP\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Retail \(MRP\)/i)).toBeInTheDocument();
  });
});
