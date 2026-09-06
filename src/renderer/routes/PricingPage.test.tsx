import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PricingPage } from './PricingPage';
import { pricingApi, customersApi, productsApi } from '../api';

describe('PricingPage Component', () => {
  const mockCustomer = {
    id: 'cust-1',
    organizationId: 'org-1',
    code: 'CUST-001',
    name: 'Al-Shifa Pharmacy',
    customerType: 'RETAIL_PHARMACY' as const,
    currentBalance: 0,
    creditLimit: 50000,
    creditDays: 30,
    defaultDiscountPercentage: 5,
    isTaxExempt: false,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockProduct = {
    id: 'prod-1',
    organizationId: 'org-1',
    sku: 'PAN-500',
    name: 'Panadol 500mg',
    genericName: 'Paracetamol',
    taxPercentage: 0,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockPricingRule = {
    id: 'rule-1',
    organizationId: 'org-1',
    customerId: 'cust-1',
    productId: 'prod-1',
    customPrice: 205.0,
    discountPercentage: null,
    minQuantity: 1,
    startDate: null,
    endDate: null,
    notes: 'Contracted rate for Q3',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    customer: {
      id: 'cust-1',
      code: 'CUST-001',
      name: 'Al-Shifa Pharmacy',
      customerType: 'RETAIL_PHARMACY' as const,
    },
    product: {
      id: 'prod-1',
      sku: 'PAN-500',
      name: 'Panadol 500mg',
      genericName: 'Paracetamol',
      taxPercentage: 0,
    },
  };

  const mockScheme = {
    id: 'sch-1',
    organizationId: 'org-1',
    name: 'Panadol Monsoon 10+1 Special',
    code: 'SCH-PAN-10P1',
    description: 'Monsoon bonus campaign',
    schemeType: 'BUY_X_GET_Y_FREE' as const,
    productId: 'prod-1',
    minQuantity: 10,
    bonusQuantity: 1,
    bonusProductId: null,
    discountPercentage: null,
    overridePrice: null,
    customerId: null,
    customerType: null,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    product: {
      id: 'prod-1',
      sku: 'PAN-500',
      name: 'Panadol 500mg',
    },
  };

  beforeEach(() => {
    vi.spyOn(customersApi, 'getCustomers').mockResolvedValue({
      items: [mockCustomer],
      meta: { page: 1, limit: 50, total: 1, totalPages: 1 },
    } as any);

    vi.spyOn(productsApi, 'getProducts').mockResolvedValue({
      items: [mockProduct],
      meta: { page: 1, limit: 50, total: 1, totalPages: 1 },
    } as any);

    vi.spyOn(pricingApi, 'getRules').mockResolvedValue({
      items: [mockPricingRule],
      meta: { page: 1, limit: 50, total: 1, totalPages: 1 },
    });

    vi.spyOn(pricingApi, 'getSchemes').mockResolvedValue({
      items: [mockScheme],
      meta: { page: 1, limit: 50, total: 1, totalPages: 1 },
    });
  });

  it('renders pricing rules list on initial mount', async () => {
    render(<PricingPage />);

    expect(
      screen.getByText('Pricing, Schemes & Commercial Rules'),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Al-Shifa Pharmacy')).toBeInTheDocument();
      expect(screen.getByText('Panadol 500mg')).toBeInTheDocument();
      expect(screen.getByText('Rs.205.00')).toBeInTheDocument();
    });
  });

  it('switches to Promotional Schemes tab and displays active schemes', async () => {
    render(<PricingPage />);

    await waitFor(() => {
      expect(screen.getByText('Al-Shifa Pharmacy')).toBeInTheDocument();
    });

    const schemesTabButton = screen.getByRole('button', {
      name: /Promotional Schemes/i,
    });
    fireEvent.click(schemesTabButton);

    await waitFor(() => {
      expect(pricingApi.getSchemes).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(
        screen.getByText('Panadol Monsoon 10+1 Special'),
      ).toBeInTheDocument();
      expect(screen.getByText('SCH-PAN-10P1')).toBeInTheDocument();
    });
  });

  it('switches to Pricing Simulator tab and executes simulation', async () => {
    vi.spyOn(pricingApi, 'previewPricing').mockResolvedValue({
      customer: {
        id: 'cust-1',
        code: 'CUST-001',
        name: 'Al-Shifa Pharmacy',
        customerType: 'RETAIL_PHARMACY',
        defaultDiscountPercentage: 5,
        isTaxExempt: false,
      },
      product: {
        id: 'prod-1',
        sku: 'PAN-500',
        name: 'Panadol 500mg',
        genericName: 'Paracetamol',
        taxPercentage: 0,
      },
      availableBatches: [
        {
          id: 'b-1',
          batchNumber: 'BN-101',
          expiryDate: '2028-01-01',
          tradePrice: 50,
          retailPrice: 60,
          purchaseCost: 40,
        },
      ],
      applicableSchemes: [],
      resolution: {
        productId: 'prod-1',
        billedQuantity: 20,
        bonusQuantity: 2,
        totalQuantity: 22,
        tradePrice: 50,
        retailPrice: 60,
        unitCost: 40,
        baseUnitPrice: 50,
        discountPercentage: 0,
        discountAmount: 0,
        effectiveUnitPrice: 50,
        grossTotal: 1000,
        netLineTotal: 1000,
        taxPercentage: 0,
        taxAmount: 0,
        finalTotalWithTax: 1000,
        pricingSource: 'PROMOTIONAL_SCHEME',
        schemeName: 'Panadol Monsoon 10+1 Special',
        reason: 'Promotional scheme applied: Buy 10, Get 1 Free',
      },
    });

    render(<PricingPage />);

    // Wait for master data to load
    await waitFor(() => {
      expect(customersApi.getCustomers).toHaveBeenCalled();
      expect(productsApi.getProducts).toHaveBeenCalled();
    });

    const simTabButton = screen.getByRole('button', {
      name: /Pricing Simulator/i,
    });
    fireEvent.click(simTabButton);

    expect(
      screen.getByText('Live Pricing & Scheme Simulator'),
    ).toBeInTheDocument();

    const customerSelect = screen.getByTestId('sim-customer-select');
    const productSelect = screen.getByTestId('sim-product-select');

    fireEvent.change(customerSelect, { target: { value: 'cust-1' } });
    fireEvent.change(productSelect, { target: { value: 'prod-1' } });

    const evalButton = screen.getByTestId('sim-evaluate-btn');
    fireEvent.click(evalButton);

    await waitFor(() => {
      expect(
        screen.getByText('Authoritative Engine Resolution'),
      ).toBeInTheDocument();
      expect(screen.getByText(/20 Billed/i)).toBeInTheDocument();
      expect(screen.getByText(/\+2 Bonus Free/i)).toBeInTheDocument();
      expect(screen.getByText('Rs.1000.00')).toBeInTheDocument();
    });
  });

  it('opens and submits create pricing rule modal', async () => {
    vi.spyOn(pricingApi, 'createRule').mockResolvedValue({
      ...mockPricingRule,
      id: 'rule-new',
    });

    render(<PricingPage />);

    await waitFor(() => {
      expect(customersApi.getCustomers).toHaveBeenCalled();
    });

    const addRuleButton = screen.getByRole('button', {
      name: /Add Customer Pricing Rule/i,
    });
    fireEvent.click(addRuleButton);

    expect(screen.getByText('New Customer Pricing Rule')).toBeInTheDocument();

    const priceInput = screen.getByPlaceholderText('e.g. 210.00');
    fireEvent.change(priceInput, { target: { value: '205' } });

    const saveButton = screen.getByRole('button', { name: /Save Rule/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(pricingApi.createRule).toHaveBeenCalledWith(
        expect.objectContaining({
          customPrice: 205,
        }),
      );
    });
  });
});
