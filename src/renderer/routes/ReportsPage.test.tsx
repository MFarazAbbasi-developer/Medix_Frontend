import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReportsPage } from './ReportsPage';
import {
  reportsApi,
  warehousesApi,
  customersApi,
  suppliersApi,
  productsApi,
  masterDataApi,
} from '../api';

describe('ReportsPage Component', () => {
  const mockWarehouse = {
    id: 'wh-1',
    organizationId: 'org-1',
    branchId: 'branch-1',
    code: 'WH-MAIN',
    name: 'Main Distribution Hub',
    warehouseType: 'STANDARD' as const,
    isDefault: false,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockCustomer = {
    id: 'cust-1',
    organizationId: 'org-1',
    code: 'CUST-001',
    name: 'Al-Shifa Pharmacy',
    customerType: 'RETAIL_PHARMACY' as const,
    currentBalance: 5000,
    creditLimit: 50000,
    creditDays: 30,
    defaultDiscountPercentage: 0,
    isTaxExempt: false,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockSupplier = {
    id: 'supp-1',
    organizationId: 'org-1',
    code: 'SUPP-001',
    name: 'Novartis PK',
    currentBalance: 12000,
    creditLimit: 100000,
    creditDays: 30,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockProduct = {
    id: 'prod-1',
    organizationId: 'org-1',
    sku: 'PAN-500',
    name: 'Panadol Extra 500mg',
    genericName: 'Paracetamol',
    taxPercentage: 0,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockSalesSummary = {
    invoiceCount: 5,
    totalQuantity: 250,
    grossSales: 50000,
    discountAmount: 2000,
    taxAmount: 1000,
    netSales: 49000,
    paidAmount: 40000,
    outstandingAmount: 9000,
    totalCogs: 35000,
    grossProfit: 14000,
    marginPercentage: 28.57,
  };

  const mockSalesRegister = [
    {
      id: 'inv-1',
      invoiceNumber: 'INV-2026-0001',
      invoiceDate: '2026-03-01T10:00:00Z',
      customerCode: 'CUST-001',
      customerName: 'Al-Shifa Pharmacy',
      warehouseName: 'Main Distribution Hub',
      subtotal: 10000,
      discountAmount: 500,
      taxAmount: 200,
      netTotal: 9700,
      paidAmount: 9700,
      balanceDue: 0,
      paymentStatus: 'PAID',
      itemCount: 2,
      totalUnits: 50,
      totalCogs: 7000,
      grossProfit: 2700,
      marginPercentage: 27.84,
    },
  ];

  const mockProductSales = [
    {
      productId: 'prod-1',
      sku: 'PAN-500',
      name: 'Panadol Extra 500mg',
      genericName: 'Paracetamol',
      manufacturerName: 'GSK',
      unitSymbol: 'TAB',
      billedQuantity: 100,
      bonusQuantity: 10,
      totalQuantity: 110,
      grossAmount: 10000,
      discountAmount: 500,
      taxAmount: 200,
      netSales: 9700,
      historicalCost: 7000,
      grossProfit: 2700,
      marginPercentage: 27.84,
    },
  ];

  const mockCustomerAging = {
    summary: {
      grandTotalDue: 5000,
      grandCurrent: 3000,
      grand1to30: 2000,
      grand31to60: 0,
      grand61to90: 0,
      grand90Plus: 0,
    },
    data: [
      {
        customerId: 'cust-1',
        customerCode: 'CUST-001',
        customerName: 'Al-Shifa Pharmacy',
        customerType: 'RETAIL_PHARMACY',
        creditDays: 30,
        creditLimit: 50000,
        currentBalance: 5000,
        current: 3000,
        days1to30: 2000,
        days31to60: 0,
        days61to90: 0,
        days90Plus: 0,
      },
    ],
  };

  const mockProfitabilitySummary = {
    invoiceCount: 10,
    netRevenue: 100000,
    totalCogs: 70000,
    grossProfit: 30000,
    marginPercentage: 30.0,
    totalDiscount: 3000,
    totalTax: 2000,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(warehousesApi, 'getWarehouses').mockResolvedValue([mockWarehouse]);
    vi.spyOn(customersApi, 'getCustomers').mockResolvedValue({ items: [mockCustomer as any], meta: { page: 1, limit: 500, total: 1, totalPages: 1 } });
    vi.spyOn(suppliersApi, 'getSuppliers').mockResolvedValue({ items: [mockSupplier as any], meta: { page: 1, limit: 500, total: 1, totalPages: 1 } });
    vi.spyOn(productsApi, 'getProducts').mockResolvedValue({ items: [mockProduct as any], meta: { page: 1, limit: 500, total: 1, totalPages: 1 } });
    vi.spyOn(masterDataApi, 'getManufacturers').mockResolvedValue([]);

    vi.spyOn(reportsApi, 'getSalesSummary').mockResolvedValue(mockSalesSummary);
    vi.spyOn(reportsApi, 'getSalesRegister').mockResolvedValue({ data: mockSalesRegister, totalCount: 1 });
    vi.spyOn(reportsApi, 'getProductWiseSales').mockResolvedValue({ data: mockProductSales, totalCount: 1 });
    vi.spyOn(reportsApi, 'getCustomerAgingReport').mockResolvedValue(mockCustomerAging);
    vi.spyOn(reportsApi, 'getProfitabilitySummary').mockResolvedValue(mockProfitabilitySummary);
  });

  it('should render the Reports workspace and default to Sales Summary', async () => {
    render(<ReportsPage />);

    expect(screen.getByText('Reports & Operational Analytics')).toBeInTheDocument();
    expect(screen.getByText('Sales Reports')).toBeInTheDocument();
    expect(screen.getByText('Purchase Reports')).toBeInTheDocument();
    expect(screen.getByText('Inventory & Stock')).toBeInTheDocument();

    await waitFor(() => {
      expect(reportsApi.getSalesSummary).toHaveBeenCalled();
    });

    expect(screen.getByText('Gross Sales')).toBeInTheDocument();
    expect(screen.getByText('PKR 50,000')).toBeInTheDocument();
    expect(screen.getByText('PKR 49,000')).toBeInTheDocument();
    expect(screen.getByText('PKR 14,000')).toBeInTheDocument();
  });

  it('should switch between sub-report tabs (e.g. Sales Register)', async () => {
    render(<ReportsPage />);

    await waitFor(() => {
      expect(reportsApi.getSalesSummary).toHaveBeenCalled();
    });

    const registerTab = screen.getByRole('button', { name: 'Invoice Register' });
    fireEvent.click(registerTab);

    await waitFor(() => {
      expect(reportsApi.getSalesRegister).toHaveBeenCalled();
    });

    expect(screen.getByText('INV-2026-0001')).toBeInTheDocument();
    expect(screen.getByText('Al-Shifa Pharmacy')).toBeInTheDocument();
  });

  it('should navigate to Receivables / Payables and show Customer Aging', async () => {
    render(<ReportsPage />);

    const recPayTab = screen.getByRole('button', { name: /Receivables \/ Payables/i });
    fireEvent.click(recPayTab);

    await waitFor(() => {
      expect(reportsApi.getCustomerAgingReport).toHaveBeenCalled();
    });

    expect(screen.getByText('Total Receivables')).toBeInTheDocument();
    expect(screen.getByText('PKR 5,000')).toBeInTheDocument();
    expect(screen.getByText('1–30 Days')).toBeInTheDocument();
  });

  it('should navigate to Profitability & Margins report', async () => {
    render(<ReportsPage />);

    const profitTab = screen.getByRole('button', { name: /Profitability & Margins/i });
    fireEvent.click(profitTab);

    await waitFor(() => {
      expect(reportsApi.getProfitabilitySummary).toHaveBeenCalled();
    });

    expect(screen.getByText('Gross Profit (GP)')).toBeInTheDocument();
    expect(screen.getByText('PKR 30,000')).toBeInTheDocument();
    expect(screen.getByText('30%')).toBeInTheDocument();
  });

  it('should trigger print on Print A4 button click', async () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});

    render(<ReportsPage />);

    const printBtn = screen.getByRole('button', { name: /Print A4/i });
    fireEvent.click(printBtn);

    expect(printSpy).toHaveBeenCalled();
    printSpy.mockRestore();
  });

  it('should trigger CSV Export when Export CSV button is clicked', async () => {
    vi.spyOn(reportsApi, 'getSalesRegister').mockResolvedValue({
      csv: '"Invoice Number","Date"\n"INV-001","2026-01-01"',
    });

    render(<ReportsPage />);

    const registerTab = screen.getByRole('button', { name: 'Invoice Register' });
    fireEvent.click(registerTab);

    await waitFor(() => {
      expect(reportsApi.getSalesRegister).toHaveBeenCalled();
    });

    const exportBtn = screen.getByRole('button', { name: /Export CSV/i });
    fireEvent.click(exportBtn);

    await waitFor(() => {
      expect(reportsApi.getSalesRegister).toHaveBeenCalledWith(
        expect.objectContaining({ format: 'csv' }),
      );
    });
  });

  it('should apply preset date filters when clicked', async () => {
    render(<ReportsPage />);

    const todayBtn = screen.getByRole('button', { name: 'Today' });
    fireEvent.click(todayBtn);

    const applyBtn = screen.getByRole('button', { name: 'Apply' });
    fireEvent.click(applyBtn);

    await waitFor(() => {
      expect(reportsApi.getSalesSummary).toHaveBeenCalled();
    });
  });
});
