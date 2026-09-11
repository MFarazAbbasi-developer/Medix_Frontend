import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DeliveryChallanPrintTemplate } from './DeliveryChallanPrintTemplate';
import { PrintableDeliveryChallan, PrintableCompanyInfo } from '../types';

const mockCompany: PrintableCompanyInfo = {
  name: 'Medix Pharma Distribution',
  legalName: 'Medix Healthcare (Pvt) Ltd',
  address: 'Plot 45, Sector 15, Korangi Industrial Area',
  city: 'Karachi',
  phone: '021-35001122',
  email: 'dispatch@medix.pk',
  ntn: 'NTN-1234567-8',
  strn: 'STRN-9876543210',
  drugSaleLicenseNo: 'DSL-KHI-2026-99',
};

const mockChallan: PrintableDeliveryChallan = {
  company: mockCompany,
  branch: {
    name: 'Clifton Branch',
    code: 'BR-CLF',
    address: 'Main Clifton Rd',
    city: 'Karachi',
    phone: '021-3580000',
  },
  challanNumber: 'DC-00001',
  fulfillmentDate: '2026-09-12T10:30:00Z',
  fulfillmentNumber: 1,
  doNumber: 'DO-00001',
  invoiceNumber: 'INV-00010',
  invoiceDate: '2026-09-12T09:00:00Z',
  status: 'PARTIALLY_DELIVERED',
  notes: 'Dispatched via Delivery Van 3, Driver Kamran',
  customer: {
    name: 'Al-Shifa Pharmacy',
    code: 'CUST-001',
  },
  deliveryDestination: {
    title: 'Main Pharmacy Clifton',
    recipientName: 'Dr. Tariq',
    phone: '03001234567',
    address: 'Shop 12, Block 5, Clifton',
    city: 'Karachi',
    instructions: 'Deliver before 5 PM at receiving dock',
  },
  salesAttribution: {
    salesmanName: 'Ahmed Khan',
    salesmanCode: 'SM-001',
    routeName: 'Saddar Route',
    routeCode: 'RT-001',
  },
  dispatchedBy: 'Dr. Tariq Mahmood',
  lines: [
    {
      itemNumber: 1,
      productName: 'Panadol Extra 500mg',
      productSku: 'SKU-PAN-500',
      genericName: 'Paracetamol',
      packSize: '10x10',
      unitOfMeasurement: 'Tab',
      batchNumber: 'BN-101',
      expiryDate: '2027-12-31T00:00:00Z',
      orderedBilledQuantity: 100,
      orderedBonusQuantity: 10,
      deliveredBilledQuantity: 60,
      deliveredBonusQuantity: 5,
      totalDispatchedQuantity: 65,
    },
    {
      itemNumber: 2,
      productName: 'Augmentin 625mg Tablets',
      productSku: 'SKU-AUG-625',
      genericName: 'Co-Amoxiclav',
      packSize: '2x7',
      unitOfMeasurement: 'Box',
      batchNumber: 'BN-AUG-99',
      expiryDate: '2028-06-30T00:00:00Z',
      orderedBilledQuantity: 50,
      orderedBonusQuantity: 0,
      deliveredBilledQuantity: 50,
      deliveredBonusQuantity: 0,
      totalDispatchedQuantity: 50,
    },
  ],
  summary: {
    totalBilledQuantity: 110,
    totalBonusQuantity: 5,
    totalDispatchedQuantity: 115,
    totalLinesCount: 2,
  },
};

describe('DeliveryChallanPrintTemplate', () => {
  describe('A4 Standard Format', () => {
    it('renders the official Delivery Challan header, document tags, and company details', () => {
      render(
        <DeliveryChallanPrintTemplate
          challan={mockChallan}
          company={mockCompany}
          layout="A4"
        />,
      );

      expect(screen.getByText('DELIVERY CHALLAN')).toBeInTheDocument();
      expect(screen.getByText('DISPATCH NOTE & GATE PASS')).toBeInTheDocument();
      expect(screen.getByText('Medix Healthcare (Pvt) Ltd')).toBeInTheDocument();
      expect(screen.getByText('DSL-KHI-2026-99')).toBeInTheDocument();
      expect(screen.getByText('DC-00001')).toBeInTheDocument();
      expect(screen.getByText('DO-00001')).toBeInTheDocument();
      expect(screen.getByText('INV-00010')).toBeInTheDocument();
    });

    it('renders frozen consignee destination and sales attribution snapshots', () => {
      render(
        <DeliveryChallanPrintTemplate
          challan={mockChallan}
          company={mockCompany}
          layout="A4"
        />,
      );

      expect(screen.getByText('Al-Shifa Pharmacy')).toBeInTheDocument();
      expect(screen.getByText(/Shop 12, Block 5, Clifton/)).toBeInTheDocument();
      expect(screen.getByText(/03001234567/)).toBeInTheDocument();
      expect(screen.getByText(/Deliver before 5 PM at receiving dock/)).toBeInTheDocument();
      expect(screen.getByText('Ahmed Khan')).toBeInTheDocument();
      expect(screen.getByText('Saddar Route')).toBeInTheDocument();
    });

    it('renders physical quantities, batches, and expiries while omitting financial pricing', () => {
      render(
        <DeliveryChallanPrintTemplate
          challan={mockChallan}
          company={mockCompany}
          layout="A4"
        />,
      );

      // Product & batch verification
      expect(screen.getByText('Panadol Extra 500mg')).toBeInTheDocument();
      expect(screen.getByText('BN-101')).toBeInTheDocument();
      expect(screen.getByText('Augmentin 625mg Tablets')).toBeInTheDocument();
      expect(screen.getByText('BN-AUG-99')).toBeInTheDocument();

      // Quantities verification
      expect(screen.getByText('65')).toBeInTheDocument();
      expect(screen.getByText('115 Units')).toBeInTheDocument();

      // Invariant: Non-financial document — No Rs., unit price, discount, or tax columns
      expect(screen.queryByText('Unit Price')).not.toBeInTheDocument();
      expect(screen.queryByText('Line Total')).not.toBeInTheDocument();
      expect(screen.queryByText('Net Amount')).not.toBeInTheDocument();
    });

    it('renders mandatory legal disclaimer and blank physical signature blocks', () => {
      render(
        <DeliveryChallanPrintTemplate
          challan={mockChallan}
          company={mockCompany}
          layout="A4"
        />,
      );

      expect(screen.getByText(/LEGAL NOTICE:/)).toBeInTheDocument();
      expect(screen.getByText(/constitute a Sales Tax Invoice/)).toBeInTheDocument();
      expect(screen.getByText('Prepared By')).toBeInTheDocument();
      expect(screen.getByText('Dispatched By / Driver')).toBeInTheDocument();
      expect(screen.getByText('Received By & Stamp')).toBeInTheDocument();
    });
  });

  describe('80mm Thermal Slip Format', () => {
    it('renders compact thermal format with challan number and physical quantities', () => {
      render(
        <DeliveryChallanPrintTemplate
          challan={mockChallan}
          company={mockCompany}
          layout="THERMAL"
        />,
      );

      expect(screen.getByText('DELIVERY CHALLAN / DISPATCH NOTE')).toBeInTheDocument();
      expect(screen.getByText(/Operational Dispatch Document — Not an Invoice/)).toBeInTheDocument();
      expect(screen.getByText('DC-00001')).toBeInTheDocument();
      expect(screen.getByText('Al-Shifa Pharmacy')).toBeInTheDocument();
      expect(screen.getByText('TOTAL DISPATCHED UNITS:')).toBeInTheDocument();
      expect(screen.getByText("Receiver's Sign & Stamp:")).toBeInTheDocument();
    });
  });
});
