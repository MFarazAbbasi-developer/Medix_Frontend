import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DeliveryOrdersPage } from './DeliveryOrdersPage';
import { deliveryOrdersApi } from '../api/delivery-orders.api';
import { customersApi } from '../api/customers.api';
import { salesOperationsApi } from '../api/sales-operations.api';

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
});
