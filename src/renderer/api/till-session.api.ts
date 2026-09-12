import { apiClient } from './client';

export type TillSessionStatus = 'OPEN' | 'COUNTED' | 'CLOSED';
export type TillMovementType = 'CASH_IN' | 'CASH_OUT';

export interface DenominationCountItem {
  denominationValue: number;
  noteCount: number;
  totalAmount: number;
}

export interface TillSessionMovement {
  id: string;
  tillSessionId?: string;
  movementType: TillMovementType;
  amount: number;
  reason: string;
  referenceNo?: string | null;
  performedByUserId?: string;
  performedBy: {
    id: string;
    username: string;
    displayName: string;
  } | any;
  performedByUser?: {
    id: string;
    username: string;
    displayName: string;
  };
  createdAt: string;
}

export interface TillSession {
  id: string;
  organizationId: string;
  branchId: string;
  userId: string;
  sessionNumber: string;
  stationName?: string | null;
  status: TillSessionStatus;
  openedAt: string;
  countedAt?: string | null;
  closedAt?: string | null;
  openingCash: number;
  cashSalesAmount: number;
  cashPaymentsAmount: number;
  cashRefundsAmount: number;
  cashInAmount: number;
  cashOutAmount: number;
  expectedCash: number;
  actualCash?: number | null;
  varianceAmount?: number | null;
  cardSalesAmount?: number;
  bankSalesAmount?: number;
  chequeSalesAmount?: number;
  creditSalesAmount?: number;
  varianceReason?: string | null;
  notes?: string | null;
  approvedByUserId?: string | null;
  closedByUserId?: string | null;
  cashierUser?: {
    id: string;
    username: string;
    displayName: string;
  };
  user?: {
    id: string;
    username: string;
    displayName: string;
  };
  closedByUser?: {
    id: string;
    username: string;
    displayName: string;
  } | null;
  approvedByUser?: {
    id: string;
    username: string;
    displayName: string;
  } | null;
  cashSales?: number;
  cashCollections?: number;
  cashRefunds?: number;
  cashIn?: number;
  cashOut?: number;
  countedCash?: number | null;
  variance?: number | null;
  businessDate?: string;
  createdAt?: string;
  updatedAt?: string;
  movements?: TillSessionMovement[];
  denominations?: DenominationCountItem[];
}

export interface OpenTillSessionPayload {
  openingCash: number;
  stationName?: string;
  notes?: string;
}

export interface RecordTillMovementPayload {
  movementType: TillMovementType;
  amount: number;
  reason: string;
  referenceNo?: string;
}

export interface CountTillSessionPayload {
  actualCash: number;
  denominations?: DenominationCountItem[];
  varianceReason?: string;
}

export interface CloseTillSessionPayload {
  actualCash: number;
  denominations?: DenominationCountItem[];
  varianceReason?: string;
  notes?: string;
  approvedByUserId?: string;
}

export interface QueryTillSessionParams {
  status?: TillSessionStatus;
  userId?: string;
  branchId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface TillSessionRegisterResponse {
  items: TillSession[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const tillSessionApi = {
  getActiveSession: async (branchId?: string): Promise<TillSession | null> => {
    return apiClient.get('/till-sessions/active', {
      params: branchId ? { branchId } : undefined,
    });
  },

  openSession: async (payload: OpenTillSessionPayload, branchId?: string): Promise<TillSession> => {
    return apiClient.post('/till-sessions/open', payload, {
      params: branchId ? { branchId } : undefined,
    });
  },

  recordMovement: async (
    sessionId: string,
    payload: RecordTillMovementPayload,
  ): Promise<TillSessionMovement> => {
    return apiClient.post(`/till-sessions/${sessionId}/movement`, payload);
  },

  countSession: async (
    sessionId: string,
    payload: CountTillSessionPayload,
  ): Promise<TillSession> => {
    return apiClient.post(`/till-sessions/${sessionId}/count`, payload);
  },

  closeSession: async (
    sessionId: string,
    payload: CloseTillSessionPayload,
  ): Promise<TillSession> => {
    return apiClient.post(`/till-sessions/${sessionId}/close`, payload);
  },

  getSessionById: async (sessionId: string): Promise<TillSession> => {
    return apiClient.get(`/till-sessions/${sessionId}`);
  },

  getSessions: async (
    params?: QueryTillSessionParams,
  ): Promise<TillSessionRegisterResponse> => {
    return apiClient.get('/till-sessions', { params });
  },

  getSessionPrintData: async (sessionId: string): Promise<any> => {
    return apiClient.get(`/till-sessions/${sessionId}/print`);
  },
};
