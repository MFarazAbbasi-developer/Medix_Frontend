import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TillSessionsPage } from './TillSessionsPage';
import { tillSessionApi, TillSession } from '../api/till-session.api';
import { organizationApi } from '../api/organization.api';
import { settingsApi } from '../api/settings.api';
import { useAuthStore } from '../store/authStore';

describe('TillSessionsPage Component', () => {
  const mockOpenSession: TillSession = {
    id: 'ts-1',
    organizationId: 'org-1',
    branchId: 'branch-1',
    userId: 'u-1',
    sessionNumber: 'CS-00001',
    status: 'OPEN',
    businessDate: new Date().toISOString(),
    openedAt: new Date().toISOString(),
    countedAt: null,
    closedAt: null,
    openingCash: 5000,
    cashSales: 15000,
    cashCollections: 5000,
    cashIn: 1000,
    cashRefunds: 500,
    cashOut: 1000,
    cashSalesAmount: 15000,
    cashPaymentsAmount: 5000,
    cashInAmount: 1000,
    cashRefundsAmount: 500,
    cashOutAmount: 1000,
    cardSalesAmount: 0,
    bankSalesAmount: 0,
    chequeSalesAmount: 0,
    creditSalesAmount: 0,
    expectedCash: 24500,
    countedCash: null,
    variance: null,
    varianceReason: null,
    approvedByUserId: null,
    notes: 'Morning shift',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    user: {
      id: 'u-1',
      displayName: 'Farhan Cashier',
      username: 'farhan',
    },
    movements: [
      {
        id: 'mov-1',
        tillSessionId: 'ts-1',
        movementType: 'CASH_IN',
        amount: 1000,
        reason: 'Change replenishment',
        performedByUserId: 'u-1',
        performedBy: {
          id: 'u-1',
          displayName: 'Farhan Cashier',
          username: 'farhan',
        },
        createdAt: new Date().toISOString(),
        performedByUser: {
          id: 'u-1',
          displayName: 'Farhan Cashier',
          username: 'farhan',
        },
      },
    ],
    denominations: [],
  };

  const mockClosedSession: TillSession = {
    ...mockOpenSession,
    id: 'ts-2',
    sessionNumber: 'CS-00002',
    status: 'CLOSED',
    countedAt: new Date().toISOString(),
    closedAt: new Date().toISOString(),
    countedCash: 24500,
    variance: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    useAuthStore.setState({
      user: {
        id: 'u-1',
        displayName: 'Farhan Cashier',
        username: 'farhan',
        roles: ['ADMIN'],
        permissions: [
          'cash_sessions.view',
          'cash_sessions.open',
          'cash_sessions.adjust',
          'cash_sessions.count',
          'cash_sessions.close',
          'cash_sessions.approve_variance',
          'cash_sessions.print',
        ],
      } as any,
      accessToken: 'token',
      authStatus: 'authenticated',
    });

    vi.spyOn(organizationApi, 'getOrganization').mockResolvedValue({
      id: 'org-1',
      name: 'Medix Pharma',
      legalName: 'Medix Pharma Ltd',
      address: 'Mall Road, Lahore',
      city: 'Lahore',
      phone: '042-998877',
      email: 'info@medix.pk',
      currency: 'PKR',
    } as any);

    vi.spyOn(settingsApi, 'getSettings').mockResolvedValue({
      items: [{ id: 's-1', key: 'CASH_VARIANCE_APPROVAL_THRESHOLD', value: '500' }],
      map: { CASH_VARIANCE_APPROVAL_THRESHOLD: '500' },
    } as any);

    vi.spyOn(tillSessionApi, 'getActiveSession').mockResolvedValue(mockOpenSession);
    vi.spyOn(tillSessionApi, 'getSessions').mockResolvedValue({
      items: [mockOpenSession, mockClosedSession],
      pagination: {
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
      },
    } as any);
  });

  it('renders active session KPI bar and session history table', async () => {
    render(<TillSessionsPage />);

    await waitFor(() => {
      expect(screen.getAllByText('CS-00001').length).toBeGreaterThan(0);
      expect(screen.getByText('CS-00002')).toBeInTheDocument();
    });

    // Check financial metrics in active session banner
    expect(screen.getAllByText(/5,000\.00/).length).toBeGreaterThan(0); // Opening cash
    expect(screen.getAllByText(/15,000\.00/).length).toBeGreaterThan(0); // Cash sales
    expect(screen.getAllByText(/24,500\.00/).length).toBeGreaterThan(0); // Expected cash
  });

  it('opens cash-in movement modal and records movement', async () => {
    const recordMovementSpy = vi.spyOn(tillSessionApi, 'recordMovement').mockResolvedValue({
      id: 'mov-2',
      tillSessionId: 'ts-1',
      movementType: 'CASH_IN',
      amount: 2000,
      reason: 'Additional change float',
      performedByUserId: 'u-1',
      createdAt: new Date().toISOString(),
    } as any);

    render(<TillSessionsPage />);

    const cashInOutBtn = await screen.findByText('Cash In / Out');
    fireEvent.click(cashInOutBtn);

    expect(screen.getByText('Record Cash In / Cash Out')).toBeInTheDocument();

    const amountInput = screen.getByPlaceholderText('0.00');
    fireEvent.change(amountInput, { target: { value: '2000' } });

    const reasonInput = screen.getByPlaceholderText(/Change drawer top-up/);
    fireEvent.change(reasonInput, { target: { value: 'Additional change float' } });

    const submitBtn = screen.getByText('Record Movement');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(recordMovementSpy).toHaveBeenCalledWith('ts-1', {
        movementType: 'CASH_IN',
        amount: 2000,
        reason: 'Additional change float',
      });
    });
  });

  it('opens cash count modal and counts cash using denomination counts', async () => {
    const countSessionSpy = vi.spyOn(tillSessionApi, 'countSession').mockResolvedValue({
      ...mockOpenSession,
      status: 'COUNTED',
      countedCash: 25000,
      variance: 500,
    } as any);

    render(<TillSessionsPage />);

    const countBtn = await screen.findByText('Count & Close Till');
    fireEvent.click(countBtn);

    expect(screen.getByText('Physical Cash Count & Till Close')).toBeInTheDocument();

    // Denominations count input
    const inputs = screen.getAllByRole('spinbutton');
    if (inputs.length > 0) {
      fireEvent.change(inputs[0], { target: { value: '5' } });
    }

    const saveCountBtn = screen.getByText('Save Interim Count');
    fireEvent.click(saveCountBtn);

    await waitFor(() => {
      expect(countSessionSpy).toHaveBeenCalled();
    });
  });

  it('allows opening a new till session when no session is active', async () => {
    vi.spyOn(tillSessionApi, 'getActiveSession').mockResolvedValue(null);
    const openSessionSpy = vi.spyOn(tillSessionApi, 'openSession').mockResolvedValue(mockOpenSession);

    render(<TillSessionsPage />);

    const openSessionBtns = await screen.findAllByText('Open New Till Session');
    expect(openSessionBtns.length).toBeGreaterThan(0);
    fireEvent.click(openSessionBtns[0]);

    const openingInput = screen.getByPlaceholderText('0.00');
    fireEvent.change(openingInput, { target: { value: '5000' } });

    const openBtn = screen.getByText('Start Till Session');
    fireEvent.click(openBtn);

    await waitFor(() => {
      expect(openSessionSpy).toHaveBeenCalledWith({
        openingCash: 5000,
        stationName: undefined,
        notes: undefined,
      });
    });
  });
});
