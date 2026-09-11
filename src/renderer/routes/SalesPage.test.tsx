import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SalesPage } from './SalesPage';
import { salesApi } from '../api/sales.api';
import { customersApi, customerAddressesApi } from '../api/customers.api';
import { warehousesApi } from '../api/warehouses.api';
import { productsApi } from '../api/products.api';
import { settingsApi } from '../api/settings.api';
import { salesOperationsApi } from '../api/sales-operations.api';
import { useAuthStore } from '../store/authStore';

const mockHasPermission = vi.fn((_perm: string) => true);

vi.mock('../hooks/usePermission', () => ({
  usePermission: () => ({
    hasPermission: (perm: string) => mockHasPermission(perm),
    hasAnyPermission: () => true,
    hasRole: () => true,
    isAdmin: true,
    permissions: ['sales.override_mrp', 'sales.override_discount'],
    roles: ['ADMIN'],
  }),
}));

describe('SalesPage Component - Keyboard Ergonomics & POS Workflow', () => {
  const mockWarehouse = {
    id: 'wh-1',
    branchId: 'branch-1',
    organizationId: 'org-1',
    name: 'Main Dispensary',
    code: 'WH-MAIN',
    isDefault: true,
    isActive: true,
  };

  const mockCustomer = {
    id: 'cust-walkin',
    organizationId: 'org-1',
    code: 'CUST-WALKIN',
    name: 'Walk-in Customer (Cash)',
    customerType: 'WALK_IN' as const,
    creditDays: 0,
    creditLimit: 0,
    currentBalance: 0,
    defaultDiscountPercentage: 0,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockCreditCustomer = {
    id: 'cust-credit',
    organizationId: 'org-1',
    code: 'CUST-CREDIT',
    name: 'Al-Shifa Pharmacy',
    customerType: 'CREDIT' as const,
    creditDays: 30,
    creditLimit: 50000,
    currentBalance: 49500,
    defaultDiscountPercentage: 0,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockProduct = {
    id: 'prod-1',
    organizationId: 'org-1',
    name: 'Panadol 500mg Tab',
    sku: 'MED-PAN-500',
    genericName: 'Paracetamol',
    unit: 'Box',
    tradePrice: 400,
    retailPrice: 500,
    taxPercentage: 0,
    isActive: true,
    batches: [
      {
        id: 'batch-1',
        batchNumber: 'BT-PAN-01',
        expiryDate: '2027-12-31T00:00:00.000Z',
        quantity: 50,
        tradePrice: 400,
        retailPrice: 500,
      },
    ],
  };

  const mockFefoResponse = {
    product: {
      id: 'prod-1',
      sku: 'MED-PAN-500',
      name: 'Panadol 500mg Tab',
      genericName: 'Paracetamol',
      taxPercentage: 0,
    },
    customerPricing: {
      customPrice: null,
      discountPercentage: 0,
    },
    allocation: {
      productId: 'prod-1',
      warehouseId: 'wh-1',
      requestedQuantity: 1,
      allocatedQuantity: 1,
      shortfallQuantity: 0,
      isFullyAllocated: true,
      allocations: [
        {
          batchId: 'batch-1',
          batchNumber: 'BT-PAN-01',
          mfgDate: null,
          expiryDate: '2027-12-31T00:00:00.000Z',
          allocatedQuantity: 1,
          availableQuantity: 50,
          purchaseCost: 350,
          tradePrice: 400,
          retailPrice: 500,
        },
      ],
    },
  };

  const mockInvoice = {
    id: 'inv-1',
    organizationId: 'org-1',
    branchId: 'branch-1',
    warehouseId: 'wh-1',
    customerId: 'cust-walkin',
    invoiceNumber: 'INV-2026-0001',
    invoiceDate: new Date().toISOString(),
    status: 'POSTED' as const,
    paymentMethod: 'CASH' as const,
    subtotal: 400,
    discountAmount: 0,
    taxAmount: 0,
    netTotal: 400,
    paidAmount: 400,
    balanceAmount: 0,
    totalCostPrice: 350,
    grossProfit: 50,
    customer: mockCustomer,
    warehouse: mockWarehouse,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    items: [
      {
        id: 'item-1',
        salesInvoiceId: 'inv-1',
        productId: 'prod-1',
        batchId: 'batch-1',
        batchNumber: 'BT-PAN-01',
        expiryDate: '2027-12-31T00:00:00.000Z',
        billedQuantity: 1,
        bonusQuantity: 0,
        totalQuantity: 1,
        unitCost: 350,
        tradePrice: 400,
        retailPrice: 500,
        unitPrice: 400,
        discountPercentage: 0,
        discountAmount: 0,
        taxPercentage: 0,
        taxAmount: 0,
        lineTotal: 400,
        lineCost: 350,
        lineProfit: 50,
        product: mockProduct,
      },
    ],
    payments: [
      {
        id: 'pay-1',
        salesInvoiceId: 'inv-1',
        paymentMethod: 'CASH' as const,
        amount: 400,
        paidAt: new Date().toISOString(),
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: {
        id: 'user-admin',
        username: 'admin',
        displayName: 'System Admin',
        roles: ['ADMIN'],
        permissions: ['sales.override_mrp', 'sales.override_discount'],
      } as any,
      accessToken: 'mock-token',
      authStatus: 'authenticated',
    });

    vi.spyOn(warehousesApi, 'getWarehouses').mockResolvedValue([mockWarehouse as any]);
    vi.spyOn(customersApi, 'getCustomers').mockResolvedValue({
      items: [mockCustomer as any, mockCreditCustomer as any],
      meta: { page: 1, limit: 100, total: 2, totalPages: 1 },
    } as any);

    vi.spyOn(productsApi, 'getProducts').mockResolvedValue({
      items: [mockProduct as any],
      meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
    } as any);

    vi.spyOn(salesApi, 'getInvoices').mockResolvedValue({
      items: [mockInvoice as any],
      meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
    } as any);

    vi.spyOn(salesApi, 'getInvoiceById').mockResolvedValue(mockInvoice as any);
    vi.spyOn(salesApi, 'createInvoice').mockResolvedValue(mockInvoice as any);
    vi.spyOn(salesApi, 'previewFefo').mockResolvedValue(mockFefoResponse as any);
    vi.spyOn(settingsApi, 'getSettings').mockResolvedValue({ items: [], map: { ENFORCE_CREDIT_LIMIT: 'false' } } as any);
    vi.spyOn(salesOperationsApi, 'getSalesmen').mockResolvedValue({
      items: [{ id: 'sm-1', code: 'SM-001', name: 'Tariq Mehmood', isActive: true } as any],
      meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
    } as any);
    vi.spyOn(salesOperationsApi, 'getRoutes').mockResolvedValue({
      items: [
        { id: 'rt-1', code: 'RT-001', name: 'South Route', isActive: true } as any,
        { id: 'rt-2', code: 'RT-002', name: 'North Route', isActive: true } as any,
      ],
      meta: { page: 1, limit: 100, total: 2, totalPages: 1 },
    } as any);
    vi.spyOn(customerAddressesApi, 'list').mockResolvedValue([
      {
        id: 'addr-1',
        organizationId: 'org-1',
        customerId: 'cust-credit',
        title: 'Main Warehouse Depot',
        recipientName: 'Dr. Tariq',
        phone: '+92 300 7654321',
        address: 'Plot 45, Sector 12-A, Korangi Industrial Area',
        city: 'Karachi',
        routeId: 'rt-1',
        deliveryInstructions: 'Ring bell at Gate 2',
        isDefault: true,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as any,
      {
        id: 'addr-2',
        organizationId: 'org-1',
        customerId: 'cust-credit',
        title: 'North Branch Depot',
        recipientName: 'Dr. Sarah',
        phone: '+92 300 1122334',
        address: 'Shop 10, Nazimabad Block 3',
        city: 'Karachi',
        routeId: 'rt-2',
        isDefault: false,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as any,
    ]);
  });

  it('renders POS Terminal interface with customer and warehouse controls', async () => {
    render(<SalesPage />);

    expect(screen.getAllByText('POS Billing')[0]).toBeInTheDocument();
    expect(screen.getByText('Invoices History')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole('option', { name: /Main Dispensary/i })).toBeInTheDocument();
    });
  });

  it('switches to Invoice History tab and displays invoice list', async () => {
    render(<SalesPage />);

    await waitFor(() => {
      expect(screen.getByRole('option', { name: /Main Dispensary/i })).toBeInTheDocument();
    });

    const historyTab = screen.getByText('Invoices History');
    fireEvent.click(historyTab);

    await waitFor(() => {
      expect(screen.getByText('INV-2026-0001')).toBeInTheDocument();
    });
  });

  it('executes the complete keyboard operator flow: F2 -> Search -> Add -> F9 -> F12 -> Print', async () => {
    const { container } = render(<SalesPage />);

    await waitFor(() => {
      expect(screen.getByRole('option', { name: /Main Dispensary/i })).toBeInTheDocument();
      expect(container.querySelector('#pos-product-search')).toBeInTheDocument();
    });

    const searchInput = container.querySelector('#pos-product-search') as HTMLInputElement;

    // 1. F2 to focus product search
    fireEvent.keyDown(window, { key: 'F2' });
    expect(document.activeElement).toBe(searchInput);

    // 2. Search product
    fireEvent.change(searchInput, { target: { value: 'Panadol' } });

    await waitFor(() => {
      expect(screen.getByText('Panadol 500mg Tab')).toBeInTheDocument();
    });

    // 3. Select product (adds directly to cart)
    fireEvent.click(screen.getByText('Panadol 500mg Tab'));

    await waitFor(() => {
      expect(screen.getByText('Cart Items (1)')).toBeInTheDocument();
      expect(screen.getAllByText('Rs. 400.00')[0]).toBeInTheDocument();
    });

    // 4. F9 opens payment tender modal
    fireEvent.keyDown(window, { key: 'F9' });

    await waitFor(() => {
      expect(screen.getByText(/Payment & Tender Settlement/i)).toBeInTheDocument();
      expect(screen.getByText(/Total Amount Due/i)).toBeInTheDocument();
    });

    // 5. Complete Sale via F12
    fireEvent.keyDown(window, { key: 'F12' });

    await waitFor(() => {
      expect(salesApi.createInvoice).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentMethod: 'CASH',
          payments: expect.arrayContaining([
            expect.objectContaining({
              paymentMethod: 'CASH',
              amount: 400,
            }),
          ]),
        }),
      );
      // Document print modal should open
      expect(screen.getByText(/Sales Invoice — INV-2026-0001/i)).toBeInTheDocument();
    });
  });

  it('supports Split / Multi-Tender payment with backend payments[] payload', async () => {
    const { container } = render(<SalesPage />);

    await waitFor(() => {
      expect(screen.getByRole('option', { name: /Main Dispensary/i })).toBeInTheDocument();
      expect(container.querySelector('#pos-product-search')).toBeInTheDocument();
    });

    const searchInput = container.querySelector('#pos-product-search') as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: 'Panadol' } });

    await waitFor(() => {
      expect(screen.getByText('Panadol 500mg Tab')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Panadol 500mg Tab'));

    await waitFor(() => {
      expect(screen.getByText('Cart Items (1)')).toBeInTheDocument();
    });

    // Open Payment Modal
    fireEvent.keyDown(window, { key: 'F9' });

    await waitFor(() => {
      expect(screen.getByText(/Payment & Tender Settlement/i)).toBeInTheDocument();
    });

    // Switch to Split / Multi mode (Key 5)
    fireEvent.click(screen.getByRole('button', { name: /Split \/ Multi/i }));

    await waitFor(() => {
      expect(screen.getByText(/Multiple Payment Tenders/i)).toBeInTheDocument();
    });

    // Add first tender: Cash 100
    const amtInput = screen.getByPlaceholderText(/Amount \(PKR\)\.\.\./i);
    fireEvent.change(amtInput, { target: { value: '100' } });

    const addBtn = screen.getByRole('button', { name: /^Add$/i });
    fireEvent.click(addBtn);

    await waitFor(() => {
      expect(screen.getAllByText('PKR 100.00').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/Remaining balance of PKR 300/i)).toBeInTheDocument();
    });

    // Checkout button should be disabled since underpaid (100 < 400)
    const completeBtn = screen.getByRole('button', { name: /Complete Sale & Print/i });
    expect(completeBtn).toBeDisabled();

    // Add second tender: Card 300 with Auth #
    const methodSelect = screen.getByDisplayValue('Cash');
    fireEvent.change(methodSelect, { target: { value: 'CREDIT_CARD' } });

    const amtInput2 = screen.getByPlaceholderText(/Amount \(PKR\)\.\.\./i);
    fireEvent.change(amtInput2, { target: { value: '300' } });

    const refInput = screen.getByPlaceholderText(/Ref \/ Auth #\.\.\./i);
    fireEvent.change(refInput, { target: { value: 'AUTH-7788' } });

    fireEvent.click(addBtn);

    await waitFor(() => {
      expect(screen.getByText('AUTH-7788')).toBeInTheDocument();
      expect(screen.getAllByText('PKR 300.00').length).toBeGreaterThanOrEqual(1);
      expect(completeBtn).not.toBeDisabled();
    });

    // Complete sale
    fireEvent.click(completeBtn);

    await waitFor(() => {
      expect(salesApi.createInvoice).toHaveBeenCalledWith(
        expect.objectContaining({
          payments: [
            expect.objectContaining({
              paymentMethod: 'CASH',
              amount: 100,
            }),
            expect.objectContaining({
              paymentMethod: 'CREDIT_CARD',
              amount: 300,
              referenceNumber: 'AUTH-7788',
            }),
          ],
        }),
      );
    });
  });

  it('displays customer credit status and prevents WALK_IN customer credit sale', async () => {
    const { container } = render(<SalesPage />);

    await waitFor(() => {
      expect(screen.getByRole('option', { name: /Main Dispensary/i })).toBeInTheDocument();
      expect(container.querySelector('#pos-product-search')).toBeInTheDocument();
    });

    const searchInput = container.querySelector('#pos-product-search') as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: 'Panadol' } });

    await waitFor(() => {
      expect(screen.getByText('Panadol 500mg Tab')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Panadol 500mg Tab'));

    await waitFor(() => {
      expect(screen.getByText('Cart Items (1)')).toBeInTheDocument();
    });

    // Open Payment Modal
    fireEvent.keyDown(window, { key: 'F9' });

    await waitFor(() => {
      expect(screen.getByText(/Payment & Tender Settlement/i)).toBeInTheDocument();
    });

    // Switch to Credit Account mode
    fireEvent.click(screen.getByRole('button', { name: /Credit Account/i }));

    // Walk-in customer is default -> should show warning and block checkout
    await waitFor(() => {
      expect(screen.getByText(/Credit Sales Not Permitted for Walk-in Customer/i)).toBeInTheDocument();
    });

    const completeBtn = screen.getByRole('button', { name: /Complete Sale & Print/i });
    expect(completeBtn).toBeDisabled();
  });

  it('calculates cash change and supports quick cash presets', async () => {
    const { container } = render(<SalesPage />);

    await waitFor(() => {
      expect(screen.getByRole('option', { name: /Main Dispensary/i })).toBeInTheDocument();
      expect(container.querySelector('#pos-product-search')).toBeInTheDocument();
    });

    const searchInput = container.querySelector('#pos-product-search') as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: 'Panadol' } });

    await waitFor(() => {
      expect(screen.getByText('Panadol 500mg Tab')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Panadol 500mg Tab'));

    await waitFor(() => {
      expect(screen.getByText('Cart Items (1)')).toBeInTheDocument();
    });

    // Open Payment Modal
    fireEvent.keyDown(window, { key: 'F9' });

    await waitFor(() => {
      expect(screen.getByText(/Payment & Tender Settlement/i)).toBeInTheDocument();
    });

    // Click Rs. 500 preset
    const preset500 = screen.getByRole('button', { name: /^Rs\.\s*500$/i });
    fireEvent.click(preset500);

    await waitFor(() => {
      expect(screen.getByText(/Change to Return/i)).toBeInTheDocument();
      expect(screen.getByText('PKR 100.00')).toBeInTheDocument();
    });
  });

  it('parks bill as draft when F4 / Alt+P is pressed', async () => {
    const { container } = render(<SalesPage />);

    await waitFor(() => {
      expect(screen.getByRole('option', { name: /Main Dispensary/i })).toBeInTheDocument();
      expect(container.querySelector('#pos-product-search')).toBeInTheDocument();
    });

    const searchInput = container.querySelector('#pos-product-search') as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: 'Panadol' } });

    await waitFor(() => {
      expect(screen.getByText('Panadol 500mg Tab')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Panadol 500mg Tab'));

    await waitFor(() => {
      expect(screen.getByText('Cart Items (1)')).toBeInTheDocument();
    });

    // Press F4
    fireEvent.keyDown(window, { key: 'F4' });

    await waitFor(() => {
      expect(salesApi.createInvoice).toHaveBeenCalledWith(
        expect.objectContaining({
          isDraft: true,
        }),
      );
    });
  });

  it('allows cart row keyboard navigation and row removal with Delete key', async () => {
    const { container } = render(<SalesPage />);

    await waitFor(() => {
      expect(screen.getByRole('option', { name: /Main Dispensary/i })).toBeInTheDocument();
      expect(container.querySelector('#pos-product-search')).toBeInTheDocument();
    });

    const searchInput = container.querySelector('#pos-product-search') as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: 'Panadol' } });

    await waitFor(() => {
      expect(screen.getByText('Panadol 500mg Tab')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Panadol 500mg Tab'));

    await waitFor(() => {
      expect(screen.getByText('Cart Items (1)')).toBeInTheDocument();
    });

    // Blur search input so body receives cart navigation keys
    searchInput.blur();

    // Select row via ArrowDown
    fireEvent.keyDown(window, { key: 'ArrowDown' });

    // Press Delete to remove row
    fireEvent.keyDown(window, { key: 'Delete' });

    await waitFor(() => {
      expect(screen.getByText('Cart Items (0)')).toBeInTheDocument();
      expect(screen.getByText(/Scan or search a product to begin/i)).toBeInTheDocument();
    });
  });

  it('opens MRP Override Authorization modal when rate exceeds MRP and requires reason', async () => {
    vi.spyOn(salesApi, 'previewFefo').mockResolvedValue({
      ...mockFefoResponse,
      customerPricing: {
        customPrice: 600, // exceeds MRP 500
        discountPercentage: 0,
      },
    } as any);

    const { container } = render(<SalesPage />);

    await waitFor(() => {
      expect(screen.getByRole('option', { name: /Main Dispensary/i })).toBeInTheDocument();
      expect(container.querySelector('#pos-product-search')).toBeInTheDocument();
    });

    const searchInput = container.querySelector('#pos-product-search') as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: 'Panadol' } });

    await waitFor(() => {
      expect(screen.getByText('Panadol 500mg Tab')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Panadol 500mg Tab'));

    // Should open MRP Ceiling Override Modal
    await waitFor(() => {
      expect(screen.getByText('MRP Ceiling Override Authorization')).toBeInTheDocument();
    });

    const confirmBtn = screen.getByRole('button', { name: /Authorize & Add Line/i });
    expect(confirmBtn).toBeDisabled();

    // Fill reason and submit via Enter
    const reasonInput = screen.getByPlaceholderText(/Special imported formulation/i);
    fireEvent.change(reasonInput, { target: { value: 'Emergency import surcharge' } });
    expect(confirmBtn).not.toBeDisabled();

    fireEvent.keyDown(reasonInput, { key: 'Enter' });

    // Cart should now contain the item with MRP OVR badge
    await waitFor(() => {
      expect(screen.getByText('MRP OVR')).toBeInTheDocument();
    });
  });

  it('rejects above-MRP line when user does not have sales.override_mrp permission', async () => {
    mockHasPermission.mockImplementation((perm: string) => perm !== 'sales.override_mrp');

    vi.spyOn(salesApi, 'previewFefo').mockResolvedValue({
      ...mockFefoResponse,
      customerPricing: {
        customPrice: 600,
        discountPercentage: 0,
      },
    } as any);

    const { container } = render(<SalesPage />);

    await waitFor(() => {
      expect(screen.getByRole('option', { name: /Main Dispensary/i })).toBeInTheDocument();
      expect(container.querySelector('#pos-product-search')).toBeInTheDocument();
    });

    const searchInput = container.querySelector('#pos-product-search') as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: 'Panadol' } });

    await waitFor(() => {
      expect(screen.getByText('Panadol 500mg Tab')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Panadol 500mg Tab'));

    await waitFor(() => {
      expect(screen.getByText(/exceeds MRP.*Requires sales\.override_mrp permission/i)).toBeInTheDocument();
    });
    expect(screen.queryByText('MRP Ceiling Override Authorization')).not.toBeInTheDocument();
  });

  it('handles delivery address lifecycle: default auto-selection, route suggestion, manual override preservation, and invoice snapshot payload', async () => {
    const { container } = render(<SalesPage />);

    await waitFor(() => {
      expect(screen.getByRole('option', { name: /Main Dispensary/i })).toBeInTheDocument();
    });

    // 1. WALK_IN customer is selected by default -> delivery address selector is not rendered
    expect(screen.queryByTitle('Delivery Destination Address')).not.toBeInTheDocument();

    // 2. Select normal credit customer
    const customerCombobox = container.querySelector('#pos-customer-select') as HTMLInputElement;
    fireEvent.click(customerCombobox);
    fireEvent.change(customerCombobox, { target: { value: 'Al-Shifa' } });

    await waitFor(() => {
      expect(screen.getByText(/Al-Shifa Pharmacy \(CUST-CREDIT\)/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Al-Shifa Pharmacy \(CUST-CREDIT\)/i));

    // 3. Delivery address selector should now be visible with default address auto-selected
    await waitFor(() => {
      const addrSelect = screen.getByTitle('Delivery Destination Address') as HTMLSelectElement;
      expect(addrSelect).toBeInTheDocument();
      expect(addrSelect.value).toBe('addr-1');
    });

    // Route should automatically suggest default address route (rt-1 / South Route)
    const routeSelect = screen.getByTitle('Assigned Route') as HTMLSelectElement;
    expect(routeSelect.value).toBe('rt-1');

    // 4. Manually change Route to North Route (rt-2)
    fireEvent.change(routeSelect, { target: { value: 'rt-2' } });
    expect(routeSelect.value).toBe('rt-2');

    // 5. Switch Delivery Address to addr-2 or Counter Sale -> manual route override MUST BE PRESERVED
    const addrSelect = screen.getByTitle('Delivery Destination Address') as HTMLSelectElement;
    fireEvent.change(addrSelect, { target: { value: 'addr-2' } });
    expect(addrSelect.value).toBe('addr-2');
    expect(routeSelect.value).toBe('rt-2'); // Still rt-2 due to manual override!

    // 6. Add product to cart
    const searchInput = container.querySelector('#pos-product-search') as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: 'Panadol' } });
    await waitFor(() => {
      expect(screen.getByText('Panadol 500mg Tab')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Panadol 500mg Tab'));

    await waitFor(() => {
      expect(screen.getByText('Cart Items (1)')).toBeInTheDocument();
    });

    // 7. Park bill -> should pass deliveryAddressId: 'addr-2'
    fireEvent.keyDown(window, { key: 'F4' });

    await waitFor(() => {
      expect(salesApi.createInvoice).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId: 'cust-credit',
          deliveryAddressId: 'addr-2',
          routeId: 'rt-2',
          isDraft: true,
        }),
      );
    });
  });
});
