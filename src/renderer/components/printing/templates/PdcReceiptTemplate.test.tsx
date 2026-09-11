import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PdcReceiptTemplate } from './PdcReceiptTemplate';
import { PrintablePdcReceipt, PrintableCompanyInfo } from '../types';

const mockCompany: PrintableCompanyInfo = {
  name: 'Medix Pharma Distribution',
  legalName: 'Medix Healthcare (Pvt) Ltd',
  address: 'Plot 45, Sector 15, Korangi Industrial Area',
  city: 'Karachi',
  phone: '021-35001122',
  email: 'custody@medix.pk',
  ntn: 'NTN-1234567-8',
  strn: 'STRN-9876543210',
  drugSaleLicenseNo: 'DSL-KHI-2026-99',
};

const mockPdcReceipt: PrintablePdcReceipt = {
  company: mockCompany,
  branch: {
    name: 'Head Office',
    code: 'HO',
    address: 'Main Blvd, Karachi',
    phone: '021-3580000',
  },
  pdcNumber: 'PDC-00001',
  chequeNumber: 'CHQ-778899',
  bankName: 'Meezan Bank Ltd',
  chequeDate: '2026-09-25T00:00:00Z',
  receivedDate: '2026-09-12T10:00:00Z',
  amount: 45000,
  allocatedAmount: 30000,
  unallocatedAmount: 15000,
  status: 'RECEIVED',
  notes: 'Received for September invoice batch settlement',
  customer: {
    name: 'Al-Shifa Pharmacy',
    code: 'CUST-001',
    phone: '0300-1234567',
    address: 'Shop 12, Block 5, Clifton',
    city: 'Karachi',
    currentBalance: 75000,
  },
  receivedBy: 'Dr. Tariq Mahmood',
  allocations: [
    {
      invoiceNumber: 'INV-00101',
      invoiceDate: '2026-09-01T00:00:00Z',
      netTotal: 30000,
      amountAllocated: 30000,
    },
  ],
};

describe('PdcReceiptTemplate', () => {
  it('renders A4 custody acknowledgment receipt with prominent custodial instrument notice and cheque details', () => {
    render(
      <PdcReceiptTemplate
        pdcReceipt={mockPdcReceipt}
        company={mockCompany}
        layout="A4"
      />,
    );

    // Title and Reference
    expect(screen.getByText(/PDC CUSTODY ACKNOWLEDGMENT/i)).toBeInTheDocument();
    expect(screen.getByText('PDC-00001')).toBeInTheDocument();

    // Custodial Notice
    expect(screen.getByText(/Custodial Instrument Notice:/i)).toBeInTheDocument();

    // Customer & Cheque details
    expect(screen.getAllByText('Al-Shifa Pharmacy')[0]).toBeInTheDocument();
    expect(screen.getByText('CHQ-778899')).toBeInTheDocument();
    expect(screen.getByText('Meezan Bank Ltd')).toBeInTheDocument();

    // Amount & pre-allocations
    expect(screen.getByText(/45,000.00/)).toBeInTheDocument();
    expect(screen.getByText('INV-00101')).toBeInTheDocument();

    // Signatures
    expect(screen.getByText('Dr. Tariq Mahmood')).toBeInTheDocument();
    expect(screen.getByText(/Received & Custodied By/i)).toBeInTheDocument();
  });

  it('renders thermal receipt format with custodial notice and compact layout', () => {
    render(
      <PdcReceiptTemplate
        pdcReceipt={mockPdcReceipt}
        company={mockCompany}
        layout="THERMAL"
      />,
    );

    expect(screen.getByText(/PDC CUSTODY RECEIPT/i)).toBeInTheDocument();
    expect(screen.getByText(/CHQ-778899/i)).toBeInTheDocument();
    expect(screen.getByText(/CUSTODIAL NOTICE:/i)).toBeInTheDocument();
  });
});
