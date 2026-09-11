import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DeliveryOrdersPage } from './DeliveryOrdersPage';
import { deliveryOrdersApi } from '../api/delivery-orders.api';
import { customersApi } from '../api/customers.api';
import { salesOperationsApi } from '../api/sales-operations.api';
import { useAuthStore } from '../store/authStore';

describe('DeliveryOrdersPage Component', () => {
  const mockDeliveryOrder = {
    id: 'do-1',
    organizationId: 'org-1',
    branchId: 'branch-1',
    warehouseId: 'wh-1',
    salesInvoiceId: 'inv-1',
    doNumber: 'DO-00001',
    status: 'READY' as const,
    customerId: 'cust-1',
    invoiceNumber: 'INV-00010',
    invoiceDate: '2026-09-12T00:00:00.000Z',
    customerName: 'Al-Shifa Pharmacy',
    customerCode: 'CUST-001',
    deliveryAddressId: 'addr-1',
    deliveryTitle: 'Main Branch Pharmacy',
    deliveryRecipient: 'Dr. Tariq',
    deliveryPhone: '03001234567',
    deliveryAddress: 'Shop 12, Main Market',
    deliveryCity: 'Karachi',
    deliveryInstructions: 'Deliver 10am-4pm',
    salesmanId: 'sm-1',
    salesmanName: 'Ahmed Khan',
    salesmanCode: 'SM-001',
    routeId: 'rt-1',
    routeName: 'Saddar Route',
    routeCode: 'RT-001',
    notes: 'Urgent clinic dispatch',
    createdAt: '2026-09-12T10:00:00.000Z',
    updatedAt: '2026-09-12T10:00:00.000Z',
    customer: { id: 'cust-1', code: 'CUST-001', name: 'Al-Shifa Pharmacy', phone: '03001234567' },
    salesman: { id: 'sm-1', code: 'SM-001', name: 'Ahmed Khan', phone: '03009999999' },
    route: { id: 'rt-1', code: 'RT-001', name: 'Saddar Route', city: 'Karachi', area: 'Saddar' },
    branch: { id: 'branch-1', code: 'HO', name: 'Head Office' },
    createdByUser: { id: 'user-1', displayName: 'Admin User', username: 'admin' },
    items: [
      {
        id: 'do-item-1',
        deliveryOrderId: 'do-1',
        salesInvoiceItemId: 'inv-item-1',
        productId: 'prod-1',
        batchId: 'batch-1',
        batchNumber: 'BN-101',
        expiryDate: '2027-12-31T00:00:00.000Z',
        productName: 'Panadol Extra 500mg',
        productSku: 'SKU-PAN-500',
        genericName: 'Paracetamol',
        unitOfMeasurement: 'Tab',
        packSize: '10x10',
        orderedBilledQuantity: 100,
        orderedBonusQuantity: 10,
        deliveredBilledQuantity: 0,
        deliveredBonusQuantity: 0,
      },
    ],
    fulfillments: [],
  };

  const mockEligibleInvoice = {
    id: 'inv-2',
    invoiceNumber: 'INV-00011',
    invoiceDate: '2026-09-12T11:00:00.000Z',
    netTotal: 15000,
    deliveryTitle: 'Korangi Clinic',
    deliveryRecipient: 'Dr. Imran',
    deliveryAddress: 'Plot 44, Korangi Sector 15',
    deliveryCity: 'Karachi',
    deliveryPhone: '03219876543',
    customer: { id: 'cust-2', code: 'CUST-002', name: 'Korangi Care Clinic', phone: '03219876543' },
    salesman: { id: 'sm-1', code: 'SM-001', name: 'Ahmed Khan' },
    route: { id: 'rt-1', code: 'RT-001', name: 'Saddar Route' },
    _count: { items: 3 },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(deliveryOrdersApi, 'getDeliveryOrders').mockResolvedValue({
      data: {
        items: [mockDeliveryOrder],
        meta: { page: 1, limit: 50, total: 1, totalPages: 1 },
      },
    } as any);

    vi.spyOn(deliveryOrdersApi, 'getDeliveryOrderById').mockResolvedValue({
      data: mockDeliveryOrder,
    } as any);

    vi.spyOn(deliveryOrdersApi, 'getEligibleInvoices').mockResolvedValue({
      data: [mockEligibleInvoice],
    } as any);

    vi.spyOn(deliveryOrdersApi, 'createDeliveryOrder').mockResolvedValue({
      data: { ...mockDeliveryOrder, id: 'do-2', doNumber: 'DO-00002' },
    } as any);

    vi.spyOn(deliveryOrdersApi, 'recordFulfillment').mockResolvedValue({
      data: {
        ...mockDeliveryOrder,
        status: 'PARTIALLY_DELIVERED',
        items: [
          {
            ...mockDeliveryOrder.items[0],
            deliveredBilledQuantity: 60,
            deliveredBonusQuantity: 6,
          },
        ],
        fulfillments: [
          {
            id: 'ful-1',
            organizationId: 'org-1',
            deliveryOrderId: 'do-1',
            fulfillmentNumber: 1,
            fulfilledAt: '2026-09-12T12:00:00.000Z',
            notes: 'First dispatch batch',
            fulfilledByUser: { id: 'user-1', displayName: 'Admin User', username: 'admin' },
            items: [
              {
                id: 'ful-item-1',
                fulfillmentId: 'ful-1',
                deliveryOrderItemId: 'do-item-1',
                deliveredBilledQuantity: 60,
                deliveredBonusQuantity: 6,
                deliveryOrderItem: mockDeliveryOrder.items[0],
              },
            ],
          },
        ],
      },
    } as any);

    vi.spyOn(deliveryOrdersApi, 'cancelDeliveryOrder').mockResolvedValue({
      data: { ...mockDeliveryOrder, status: 'CANCELLED' },
    } as any);

    vi.spyOn(customersApi, 'getCustomers').mockResolvedValue({
      data: { items: [mockDeliveryOrder.customer], meta: { total: 1, page: 1, limit: 50, totalPages: 1 } },
    } as any);

    vi.spyOn(salesOperationsApi, 'getSalesmen').mockResolvedValue({
      data: { items: [mockDeliveryOrder.salesman], meta: { total: 1, page: 1, limit: 50, totalPages: 1 } },
    } as any);

    vi.spyOn(salesOperationsApi, 'getRoutes').mockResolvedValue({
      data: { items: [mockDeliveryOrder.route], meta: { total: 1, page: 1, limit: 50, totalPages: 1 } },
    } as any);
  });

  it('renders Delivery Orders page and table with order data', async () => {
    render(<DeliveryOrdersPage />);

    expect(screen.getByText('Delivery Orders')).toBeInTheDocument();
    expect(screen.getByText('Phase 20C')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('DO-00001')).toBeInTheDocument();
      expect(screen.getByText('INV-00010')).toBeInTheDocument();
      expect(screen.getByText('Al-Shifa Pharmacy')).toBeInTheDocument();
      expect(screen.getByText('READY')).toBeInTheDocument();
    });
  });

  it('opens Create Delivery Order modal and creates order from eligible invoice', async () => {
    render(<DeliveryOrdersPage />);

    const createBtn = screen.getByRole('button', { name: /create delivery order/i });
    fireEvent.click(createBtn);

    await waitFor(() => {
      expect(screen.getByText('INV-00011')).toBeInTheDocument();
      expect(screen.getByText('Korangi Care Clinic')).toBeInTheDocument();
    });

    // Select the eligible invoice
    const radioBtn = screen.getByRole('radio');
    fireEvent.click(radioBtn);

    const submitBtns = screen.getAllByRole('button', { name: /create delivery order/i });
    fireEvent.click(submitBtns[1]);

    await waitFor(() => {
      expect(deliveryOrdersApi.createDeliveryOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          salesInvoiceId: 'inv-2',
        }),
      );
    });
  });

  it('opens details/fulfillment workspace and populates quantities via Fulfill All Remaining', async () => {
    render(<DeliveryOrdersPage />);

    await waitFor(() => {
      expect(screen.getByText('DO-00001')).toBeInTheDocument();
    });

    const workspaceBtn = screen.getByRole('button', { name: /workspace/i });
    fireEvent.click(workspaceBtn);

    await waitFor(() => {
      expect(screen.getByText('Delivery Destination Snapshot')).toBeInTheDocument();
      expect(screen.getByText('Panadol Extra 500mg')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /fulfill all remaining/i })).toBeInTheDocument();
    });

    // Click Fulfill All Remaining
    const fulfillAllBtn = screen.getByRole('button', { name: /fulfill all remaining/i });
    fireEvent.click(fulfillAllBtn);

    // Submit fulfillment
    const recordDispatchBtn = screen.getByRole('button', { name: /record dispatch/i });
    fireEvent.click(recordDispatchBtn);

    await waitFor(() => {
      expect(deliveryOrdersApi.recordFulfillment).toHaveBeenCalledWith(
        'do-1',
        expect.objectContaining({
          items: [
            expect.objectContaining({
              deliveryOrderItemId: 'do-item-1',
              billedQuantity: 100,
              bonusQuantity: 10,
            }),
          ],
        }),
      );
    });
  });

  it('cancels a READY Delivery Order when cancellation is confirmed', async () => {
    render(<DeliveryOrdersPage />);

    await waitFor(() => {
      expect(screen.getByText('DO-00001')).toBeInTheDocument();
    });

    const workspaceBtn = screen.getByRole('button', { name: /workspace/i });
    fireEvent.click(workspaceBtn);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /cancel delivery order/i })).toBeInTheDocument();
    });

    // Open cancel modal
    const cancelBtn = screen.getByRole('button', { name: /cancel delivery order/i });
    fireEvent.click(cancelBtn);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/state the reason for cancelling/i)).toBeInTheDocument();
    });

    const reasonInput = screen.getByPlaceholderText(/state the reason for cancelling/i);
    fireEvent.change(reasonInput, { target: { value: 'Customer canceled delivery' } });

    const confirmCancelBtn = screen.getByRole('button', { name: /confirm cancellation/i });
    fireEvent.click(confirmCancelBtn);

    await waitFor(() => {
      expect(deliveryOrdersApi.cancelDeliveryOrder).toHaveBeenCalledWith(
        'do-1',
        { cancellationReason: 'Customer canceled delivery' },
      );
    });
  });

  describe('Phase 20D — Delivery Challan Printing in UI', () => {
    const mockDoWithFulfillment = {
      ...mockDeliveryOrder,
      status: 'PARTIALLY_DELIVERED' as const,
      items: [
        {
          ...mockDeliveryOrder.items[0],
          deliveredBilledQuantity: 60,
          deliveredBonusQuantity: 5,
        },
      ],
      fulfillments: [
        {
          id: 'ful-1',
          organizationId: 'org-1',
          deliveryOrderId: 'do-1',
          fulfillmentNumber: 1,
          challanNumber: 'DC-00001',
          fulfilledAt: '2026-09-12T10:30:00.000Z',
          notes: 'Dispatched via Van 3',
          fulfilledByUser: { id: 'user-1', displayName: 'Admin User', username: 'admin' },
          items: [
            {
              id: 'ful-item-1',
              fulfillmentId: 'ful-1',
              deliveryOrderItemId: 'do-item-1',
              deliveredBilledQuantity: 60,
              deliveredBonusQuantity: 5,
              deliveryOrderItem: mockDeliveryOrder.items[0],
            },
          ],
        },
      ],
    };

    const mockPrintPayload = {
      company: {
        name: 'Medix Pharma Distribution',
        legalName: 'Medix Healthcare (Pvt) Ltd',
        address: 'Plot 45, Sector 15, Korangi',
        city: 'Karachi',
        phone: '021-35001122',
        drugSaleLicenseNo: 'DSL-KHI-2026-99',
      },
      branch: { name: 'Head Office', code: 'HO' },
      challanNumber: 'DC-00001',
      fulfillmentDate: '2026-09-12T10:30:00.000Z',
      fulfillmentNumber: 1,
      doNumber: 'DO-00001',
      invoiceNumber: 'INV-00010',
      invoiceDate: '2026-09-12T00:00:00.000Z',
      status: 'PARTIALLY_DELIVERED',
      notes: 'Dispatched via Van 3',
      customer: { name: 'Al-Shifa Pharmacy', code: 'CUST-001' },
      deliveryDestination: {
        recipientName: 'Dr. Tariq',
        phone: '03001234567',
        address: 'Shop 12, Main Market',
        city: 'Karachi',
      },
      salesAttribution: { salesmanName: 'Ahmed Khan', routeName: 'Saddar Route' },
      dispatchedBy: 'Admin User',
      lines: [
        {
          itemNumber: 1,
          productName: 'Panadol Extra 500mg',
          productSku: 'SKU-PAN-500',
          batchNumber: 'BN-101',
          expiryDate: '2027-12-31T00:00:00.000Z',
          orderedBilledQuantity: 100,
          orderedBonusQuantity: 10,
          deliveredBilledQuantity: 60,
          deliveredBonusQuantity: 5,
          totalDispatchedQuantity: 65,
        },
      ],
      summary: {
        totalBilledQuantity: 60,
        totalBonusQuantity: 5,
        totalDispatchedQuantity: 65,
        totalLinesCount: 1,
      },
    };

    it('renders Print Challan button in fulfillment history and opens print modal on click', async () => {
      useAuthStore.setState({
        user: {
          id: 'user-1',
          username: 'admin',
          roles: ['ADMIN'],
          permissions: ['delivery_orders.view', 'delivery_orders.fulfill', 'delivery_orders.print'],
        } as any,
      });

      vi.spyOn(deliveryOrdersApi, 'getDeliveryOrderById').mockResolvedValue({
        data: mockDoWithFulfillment,
      } as any);

      vi.spyOn(deliveryOrdersApi, 'getFulfillmentPrintData').mockResolvedValue({
        data: mockPrintPayload,
      } as any);

      render(<DeliveryOrdersPage />);

      await waitFor(() => {
        expect(screen.getByText('DO-00001')).toBeInTheDocument();
      });

      const workspaceBtn = screen.getByRole('button', { name: /workspace/i });
      fireEvent.click(workspaceBtn);

      await waitFor(() => {
        expect(screen.getByText('DC-00001')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /print challan/i })).toBeInTheDocument();
      });

      const printBtn = screen.getByRole('button', { name: /print challan/i });
      fireEvent.click(printBtn);

      await waitFor(() => {
        expect(deliveryOrdersApi.getFulfillmentPrintData).toHaveBeenCalledWith('do-1', 'ful-1');
        // Modal title should appear
        expect(screen.getByText('Delivery Challan — DC-00001')).toBeInTheDocument();
        expect(screen.getByText('DELIVERY CHALLAN')).toBeInTheDocument();
      });
    });

    it('disables Print Challan when user lacks delivery_orders.print permission', async () => {
      useAuthStore.setState({
        user: {
          id: 'user-clerk',
          username: 'clerk',
          roles: ['CLERK'],
          permissions: ['delivery_orders.view'], // no print permission
        } as any,
      });

      vi.spyOn(deliveryOrdersApi, 'getDeliveryOrderById').mockResolvedValue({
        data: mockDoWithFulfillment,
      } as any);

      render(<DeliveryOrdersPage />);

      await waitFor(() => {
        expect(screen.getByText('DO-00001')).toBeInTheDocument();
      });

      const workspaceBtn = screen.getByRole('button', { name: /workspace/i });
      fireEvent.click(workspaceBtn);

      await waitFor(() => {
        const printBtn = screen.getByRole('button', { name: /print challan/i });
        expect(printBtn).toBeDisabled();
      });
    });
  });
});
