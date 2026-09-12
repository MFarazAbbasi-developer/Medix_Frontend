import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { PurchaseSuggestionsPage } from './PurchaseSuggestionsPage';
import { reorderSuggestionsApi, getSuppliers, organizationApi } from '../api';

vi.mock('../api', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    reorderSuggestionsApi: {
      getSuggestions: vi.fn(),
      getSummary: vi.fn(),
      upsertConfig: vi.fn(),
      createDraftPos: vi.fn(),
    },
    getSuppliers: vi.fn(),
    organizationApi: {
      getOrganization: vi.fn(),
    },
  };
});

vi.mock('../hooks/usePermission', () => ({
  usePermission: () => ({
    hasPermission: () => true,
    hasAnyPermission: () => true,
  }),
}));

describe('PurchaseSuggestionsPage', () => {
  const mockOrg = {
    id: 'org-1',
    name: 'Medix Pharma',
    branches: [{ id: 'branch-1', name: 'Main Branch', code: 'HQ' }],
  };

  const mockSuppliers = {
    items: [
      { id: 'sup-1', name: 'Getz Pharma Distribution', code: 'SUP-001', isActive: true },
      { id: 'sup-2', name: 'GSK Distributors', code: 'SUP-002', isActive: true },
    ],
  };

  const mockSuggestionsResponse = {
    summary: {
      totalSkusAnalyzed: 25,
      reorderNeededCount: 4,
      watchCount: 3,
      healthyCount: 18,
      overstockCount: 1,
      totalOpenPoUnits: 120,
      totalEstimatedPurchaseValue: 45000,
      lookbackDays: 30,
      excludeShortExpiry: false,
      shortExpiryDays: 90,
      asOfDate: '2026-09-12T10:00:00.000Z',
    },
    items: [
      {
        productId: 'prod-1',
        sku: 'PAN-500',
        name: 'Panadol 500mg Tablets',
        genericName: 'Paracetamol',
        dosageForm: 'Tablet',
        strength: '500mg',
        packSize: '10x10',
        unitSymbol: 'Box',
        categoryName: 'Analgesics',
        manufacturerName: 'GSK',
        isActive: true,
        physicalStock: 120,
        saleableStock: 120,
        shortExpiryStock: 0,
        quarantinedStock: 0,
        expiredStock: 0,
        openPoQuantity: 50,
        netPosition: 170,
        lookbackDays: 30,
        totalUnitsSold: 540,
        averageDailySales: 18.0,
        leadTimeDays: 7,
        leadTimeDemand: 126,
        safetyStockUnits: 126,
        reorderPoint: 252,
        reorderPointSource: 'CALCULATED',
        targetStock: 540,
        targetStockSource: 'CALCULATED',
        minOrderQuantity: 10,
        reorderQuantity: null,
        healthStatus: 'REORDER_NEEDED',
        isOverstocked: false,
        suggestedQuantity: 370,
        estimatedUnitCost: 100,
        estimatedPurchaseValue: 37000,
        supplier: {
          id: 'sup-1',
          name: 'Getz Pharma Distribution',
          code: 'SUP-001',
          source: 'CONFIGURED',
        },
        hasCustomConfig: false,
        configId: null,
      },
      {
        productId: 'prod-2',
        sku: 'AUG-625',
        name: 'Augmentin 625mg',
        genericName: 'Amoxicillin / Clavulanate',
        dosageForm: 'Tablet',
        strength: '625mg',
        packSize: '2x10',
        unitSymbol: 'Box',
        categoryName: 'Antibiotics',
        manufacturerName: 'GSK',
        isActive: true,
        physicalStock: 300,
        saleableStock: 300,
        shortExpiryStock: 20,
        quarantinedStock: 0,
        expiredStock: 0,
        openPoQuantity: 0,
        netPosition: 300,
        lookbackDays: 30,
        totalUnitsSold: 300,
        averageDailySales: 10.0,
        leadTimeDays: 7,
        leadTimeDemand: 70,
        safetyStockUnits: 70,
        reorderPoint: 140,
        reorderPointSource: 'CONFIGURED',
        targetStock: 350,
        targetStockSource: 'CONFIGURED',
        minOrderQuantity: 5,
        reorderQuantity: 10,
        healthStatus: 'HEALTHY',
        isOverstocked: false,
        suggestedQuantity: 0,
        estimatedUnitCost: 400,
        estimatedPurchaseValue: 0,
        supplier: {
          id: 'sup-2',
          name: 'GSK Distributors',
          code: 'SUP-002',
          source: 'LAST_PURCHASE',
        },
        hasCustomConfig: true,
        configId: 'cfg-2',
      },
    ],
    meta: {
      page: 1,
      limit: 50,
      total: 2,
      totalPages: 1,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (organizationApi.getOrganization as any).mockResolvedValue(mockOrg);
    (getSuppliers as any).mockResolvedValue(mockSuppliers);
    (reorderSuggestionsApi.getSuggestions as any).mockResolvedValue(mockSuggestionsResponse);
    (reorderSuggestionsApi.upsertConfig as any).mockResolvedValue({ id: 'cfg-new' });
    (reorderSuggestionsApi.createDraftPos as any).mockResolvedValue({
      message: 'Created 1 draft purchase order(s)',
      orders: [{ id: 'po-1', poNumber: 'PO-00001' }],
    });
  });

  it('renders summary KPI strip and suggestions operational table', async () => {
    render(
      <MemoryRouter>
        <PurchaseSuggestionsPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Purchase Suggestions & Reorder Station/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Panadol 500mg Tablets')).toBeInTheDocument();
      expect(screen.getByText('Augmentin 625mg')).toBeInTheDocument();
    });

    // Check KPI strip values
    expect(screen.getByText('4')).toBeInTheDocument(); // Reorder Needed count
    expect(screen.getByText('Rs. 45,000')).toBeInTheDocument(); // Est. Order value
    expect(screen.getAllByText('120').length).toBeGreaterThan(0); // Open PO units / stock
    expect(screen.getByText('25')).toBeInTheDocument(); // Total Evaluated SKUs
  });

  it('allows inline quantity editing and updates suggested quantities', async () => {
    render(
      <MemoryRouter>
        <PurchaseSuggestionsPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Panadol 500mg Tablets')).toBeInTheDocument();
    });

    const qtyInputs = screen.getAllByRole('spinbutton');
    expect(qtyInputs.length).toBeGreaterThan(0);

    // Edit quantity for Panadol from 370 to 500
    fireEvent.change(qtyInputs[0], { target: { value: '500' } });
    expect((qtyInputs[0] as HTMLInputElement).value).toBe('500');
  });

  it('opens quick config modal and saves replenishment policy', async () => {
    render(
      <MemoryRouter>
        <PurchaseSuggestionsPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Panadol 500mg Tablets')).toBeInTheDocument();
    });

    const configButtons = screen.getAllByTitle(/Configure branch replenishment rules/i);
    fireEvent.click(configButtons[0]);

    expect(screen.getByText('Replenishment Policy')).toBeInTheDocument();

    // Find ROP input in modal (first 'Auto if blank' input)
    const ropInputs = screen.getAllByPlaceholderText(/Auto if blank/i);
    fireEvent.change(ropInputs[0], { target: { value: '300' } });

    const saveButton = screen.getByRole('button', { name: /Save Policy/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(reorderSuggestionsApi.upsertConfig).toHaveBeenCalledWith(
        'prod-1',
        expect.objectContaining({ reorderPoint: 300 }),
        'branch-1',
      );
    });
  });

  it('opens create draft PO modal and executes draft PO generation', async () => {
    render(
      <MemoryRouter>
        <PurchaseSuggestionsPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Panadol 500mg Tablets')).toBeInTheDocument();
    });

    const createPoButton = screen.getByRole('button', { name: /Create PO Draft/i });
    fireEvent.click(createPoButton);

    expect(screen.getByText('Generate Draft Purchase Orders')).toBeInTheDocument();
    expect(screen.getAllByText(/Getz Pharma Distribution/i).length).toBeGreaterThan(0);

    const confirmButton = screen.getByRole('button', { name: /Confirm & Create Draft POs/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(reorderSuggestionsApi.createDraftPos).toHaveBeenCalledWith(
        expect.objectContaining({
          branchId: 'branch-1',
          items: expect.arrayContaining([
            expect.objectContaining({ productId: 'prod-1', quantity: 370 }),
          ]),
        }),
      );
    });
  });
});
