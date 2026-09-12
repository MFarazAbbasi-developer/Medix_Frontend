import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TillCloseSlipTemplate } from './TillCloseSlipTemplate';
import { PrintableTillSession } from '../types';

describe('TillCloseSlipTemplate', () => {
  const mockPrintableData: PrintableTillSession = {
    company: {
      name: 'Medix Pharmacy',
      legalName: 'Medix Healthcare Pvt Ltd',
      address: '123 Health Ave, Lahore',
      city: 'Lahore',
      phone: '042-111-222-333',
      email: 'info@medix.pk',
      ntn: 'NTN-1234567',
      strn: 'STRN-7654321',
      drugSaleLicenseNo: 'DSL-2026-LHR',
    },
    branch: {
      name: 'Main Dispensary',
      code: 'BR-01',
      phone: '042-111-222-333',
      address: '123 Health Ave, Lahore',
    },
    session: {
      sessionNumber: 'CS-00001',
      status: 'CLOSED',
      businessDate: '2026-09-12',
      openedAt: '2026-09-12T08:00:00.000Z',
      closedAt: '2026-09-12T18:00:00.000Z',
      countedAt: '2026-09-12T17:50:00.000Z',
      cashier: {
        displayName: 'Farhan Cashier',
        username: 'farhan',
      },
      stationName: 'Counter 1',
      financials: {
        openingCash: 5000,
        cashSales: 15000,
        cashCollections: 5000,
        cashIn: 2000,
        cashRefunds: 1000,
        cashOut: 1500,
        expectedCash: 24500,
        countedCash: 24500,
        varianceAmount: 0,
        varianceType: 'MATCH',
      },
      approval: {
        varianceReason: null,
        approvedBy: null,
        approvedAt: null,
      },
      denominations: [
        { denomination: '5000', count: 4, amount: 20000 },
        { denomination: '1000', count: 4, amount: 4000 },
        { denomination: '500', count: 1, amount: 500 },
      ],
      movements: [
        {
          type: 'CASH_IN',
          amount: 2000,
          reason: 'Change replenishment from main safe',
          timestamp: '2026-09-12T11:00:00.000Z',
          performedBy: 'Farhan Cashier',
        },
        {
          type: 'CASH_OUT',
          amount: 1500,
          reason: 'Tea and petty supplies',
          timestamp: '2026-09-12T14:00:00.000Z',
          performedBy: 'Farhan Cashier',
        },
      ],
      notes: 'Standard shift close',
    },
  };

  it('renders thermal 80mm slip layout correctly', () => {
    render(<TillCloseSlipTemplate data={mockPrintableData} layout="THERMAL" />);

    expect(screen.getByText(/TILL CLOSE SLIP/)).toBeInTheDocument();
    expect(screen.getAllByText(/CS-00001/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Farhan Cashier/)).toBeInTheDocument();
    expect(screen.getAllByText(/5,000\.00/).length).toBeGreaterThan(0); // Opening float
    expect(screen.getAllByText(/15,000\.00/).length).toBeGreaterThan(0); // Cash sales
    expect(screen.getAllByText(/24,500\.00/).length).toBeGreaterThan(0); // Expected & Counted
  });

  it('renders A4 reconciliation sheet layout with breakdown tables', () => {
    render(<TillCloseSlipTemplate data={mockPrintableData} layout="A4" />);

    expect(screen.getByText('DAY-END TILL CASH RECONCILIATION')).toBeInTheDocument();
    expect(screen.getByText('Session: CS-00001')).toBeInTheDocument();
    expect(screen.getByText('Audited Physical Cash Breakdown')).toBeInTheDocument();
    expect(screen.getByText('Cash-In & Cash-Out Movements')).toBeInTheDocument();
    expect(screen.getByText('Change replenishment from main safe')).toBeInTheDocument();
    expect(screen.getByText('Tea and petty supplies')).toBeInTheDocument();
  });

  it('displays variance details and supervisor approval when variance exists', () => {
    const dataWithVariance: PrintableTillSession = {
      ...mockPrintableData,
      session: {
        ...mockPrintableData.session,
        financials: {
          ...mockPrintableData.session.financials,
          countedCash: 23500,
          varianceAmount: -1000,
          varianceType: 'SHORTAGE',
        },
        approval: {
          varianceReason: 'Shortage due to wrong change during rush',
          approvedBy: 'Supervisor Bilal',
          approvedAt: '2026-09-12T18:05:00.000Z',
        },
      },
    };

    render(<TillCloseSlipTemplate data={dataWithVariance} layout="THERMAL" />);

    expect(screen.getByText(/VARIANCE DETAILS/)).toBeInTheDocument();
    expect(screen.getByText(/Shortage due to wrong change/)).toBeInTheDocument();
    expect(screen.getByText(/Supervisor Bilal/)).toBeInTheDocument();
  });
});
