import { apiClient, ApiResponse } from './client';

export type DeliveryOrderStatus =
  | 'READY'
  | 'PARTIALLY_DELIVERED'
  | 'DELIVERED'
  | 'CANCELLED';

export interface DeliveryOrderItem {
  id: string;
  deliveryOrderId: string;
  salesInvoiceItemId: string;
  productId: string;
  batchId: string;
  batchNumber: string;
  expiryDate: string;
  productName: string;
  productSku: string;
  genericName?: string | null;
  unitOfMeasurement?: string | null;
  packSize?: string | null;
  orderedBilledQuantity: number;
  orderedBonusQuantity: number;
  deliveredBilledQuantity: number;
  deliveredBonusQuantity: number;
  product?: {
    id: string;
    sku: string;
    name: string;
    genericName?: string | null;
    packSize?: string | null;
  };
  batch?: {
    id: string;
    batchNumber: string;
    expiryDate: string;
    mfgDate?: string | null;
  };
}

export interface DeliveryFulfillmentItem {
  id: string;
  fulfillmentId: string;
  deliveryOrderItemId: string;
  deliveredBilledQuantity: number;
  deliveredBonusQuantity: number;
  deliveryOrderItem?: DeliveryOrderItem;
}

export interface DeliveryFulfillment {
  id: string;
  organizationId: string;
  deliveryOrderId: string;
  fulfillmentNumber: number;
  fulfilledAt: string;
  fulfilledById?: string | null;
  notes?: string | null;
  createdAt: string;
  fulfilledByUser?: {
    id: string;
    displayName: string;
    username: string;
  } | null;
  items: DeliveryFulfillmentItem[];
}

export interface DeliveryOrder {
  id: string;
  organizationId: string;
  branchId: string;
  warehouseId: string;
  salesInvoiceId: string;
  doNumber: string;
  status: DeliveryOrderStatus;
  customerId: string;

  invoiceNumber: string;
  invoiceDate: string;
  customerName: string;
  customerCode: string;
  deliveryAddressId?: string | null;
  deliveryTitle?: string | null;
  deliveryRecipient?: string | null;
  deliveryPhone?: string | null;
  deliveryAddress?: string | null;
  deliveryCity?: string | null;
  deliveryInstructions?: string | null;
  salesmanId?: string | null;
  salesmanName?: string | null;
  salesmanCode?: string | null;
  routeId?: string | null;
  routeName?: string | null;
  routeCode?: string | null;

  notes?: string | null;
  createdById?: string | null;
  cancelledById?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  createdAt: string;
  updatedAt: string;

  customer?: {
    id: string;
    code: string;
    name: string;
    phone?: string | null;
  };
  branch?: {
    id: string;
    code: string;
    name: string;
  };
  warehouse?: {
    id: string;
    code: string;
    name: string;
  };
  salesman?: {
    id: string;
    code: string;
    name: string;
    phone?: string | null;
  } | null;
  route?: {
    id: string;
    code: string;
    name: string;
    city?: string | null;
    area?: string | null;
  } | null;
  createdByUser?: {
    id: string;
    displayName: string;
    username: string;
  } | null;
  cancelledByUser?: {
    id: string;
    displayName: string;
    username: string;
  } | null;

  items: DeliveryOrderItem[];
  fulfillments?: DeliveryFulfillment[];
  _count?: {
    fulfillments: number;
  };
}

export interface CreateDeliveryOrderPayload {
  salesInvoiceId: string;
  notes?: string;
}

export interface FulfillmentItemInput {
  deliveryOrderItemId: string;
  billedQuantity: number;
  bonusQuantity?: number;
}

export interface RecordFulfillmentPayload {
  items: FulfillmentItemInput[];
  notes?: string;
}

export interface CancelDeliveryOrderPayload {
  cancellationReason: string;
}

export interface QueryDeliveryOrdersParams {
  search?: string;
  status?: DeliveryOrderStatus;
  customerId?: string;
  routeId?: string;
  salesmanId?: string;
  branchId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface EligibleInvoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  netTotal: number | string;
  deliveryTitle?: string | null;
  deliveryRecipient?: string | null;
  deliveryAddress?: string | null;
  deliveryCity?: string | null;
  deliveryPhone?: string | null;
  deliveryInstructions?: string | null;
  customer: {
    id: string;
    code: string;
    name: string;
    phone?: string | null;
  };
  salesman?: {
    id: string;
    code: string;
    name: string;
  } | null;
  route?: {
    id: string;
    code: string;
    name: string;
    city?: string | null;
    area?: string | null;
  } | null;
  _count?: {
    items: number;
  };
}

export const deliveryOrdersApi = {
  getDeliveryOrders: async (
    params?: QueryDeliveryOrdersParams,
  ): Promise<ApiResponse<{ items: DeliveryOrder[]; meta: { page: number; limit: number; total: number; totalPages: number } }>> => {
    return apiClient.get('/delivery-orders', { params });
  },

  getDeliveryOrderById: async (
    id: string,
  ): Promise<ApiResponse<DeliveryOrder>> => {
    return apiClient.get(`/delivery-orders/${id}`);
  },

  createDeliveryOrder: async (
    payload: CreateDeliveryOrderPayload,
  ): Promise<ApiResponse<DeliveryOrder>> => {
    return apiClient.post('/delivery-orders', payload);
  },

  recordFulfillment: async (
    id: string,
    payload: RecordFulfillmentPayload,
  ): Promise<ApiResponse<DeliveryOrder>> => {
    return apiClient.post(`/delivery-orders/${id}/fulfill`, payload);
  },

  cancelDeliveryOrder: async (
    id: string,
    payload: CancelDeliveryOrderPayload,
  ): Promise<ApiResponse<DeliveryOrder>> => {
    return apiClient.post(`/delivery-orders/${id}/cancel`, payload);
  },

  getEligibleInvoices: async (params?: {
    search?: string;
    customerId?: string;
    branchId?: string;
  }): Promise<ApiResponse<EligibleInvoice[]>> => {
    return apiClient.get('/delivery-orders/eligible-invoices', { params });
  },
};
