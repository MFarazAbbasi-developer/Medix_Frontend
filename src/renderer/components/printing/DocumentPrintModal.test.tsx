import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DocumentPrintModal } from './DocumentPrintModal';
import {
  SalesInvoicePrintTemplate,
  GrnPrintTemplate,
  SalesReturnPrintTemplate,
  PurchaseReturnPrintTemplate,
  CustomerPaymentReceiptTemplate,
  SupplierPaymentVoucherTemplate,
} from './templates';
import {
  PrintableCompanyInfo,
  PrintableSalesInvoice,
  PrintableGrn,
  PrintableSalesReturn,
  PrintablePurchaseReturn,
  PrintableCustomerPayment,
  PrintableSupplierPayment,
} from './types';

const mockCompany: PrintableCompanyInfo = {
  name: 'FARMAX Pharma Distribution',
  legalName: 'FARMAX Pharmaceuticals (Pvt) Ltd',
  address: '12-Commercial Area, Phase 4',
  city: 'Lahore',
  phone: '042-35991122',
  email: 'info@farmax.pk',
  ntn: 'NTN-778899-0',
  strn: 'STRN-12345678',
  drugSaleLicenseNo: 'DSL-LHR-2026-441',
};

const mockInvoice: PrintableSalesInvoice = {
  invoiceNumber: 'INV-2026-0001',
  invoiceDate: '06/09/2026',
  dueDate: '20/09/2026',
  status: 'POSTED',
  customer: {
    name: 'Al-Shifa Pharmacy',
    code: 'CUST-001',
    address: 'Main Market, Gulberg III',
    city: 'Lahore',
    phone: '0300-1122334',
    ntn: 'NTN-998811',
    drugSaleLicenseNo: 'DSL-CUST-881',
  },
  lines: [
    {
      itemNumber: 1,
      sku: 'MED-PAN-500',
      productName: 'Panadol 500mg Tablets (Box of 200)',
      batchNumber: 'BN-88910',
      expiryDate: '12/2027',
      quantity: 10,
      bonusQuantity: 1,
      unitPrice: 450.0,
      discountPercent: 5,
      salesTaxPercent: 0,
      lineTotal: 4275.0,
    },
  ],
  subtotal: 4500.0,
  totalDiscount: 225.0,
  totalTax: 0,
  grandTotal: 4275.0,
  amountPaid: 4275.0,
  balanceDue: 0,
  footerNotes: 'Configurable footer notes from settings',
  termsAndConditions: 'Payment due within 14 days',
};

const mockGrn: PrintableGrn = {
  grnNumber: 'GRN-2026-0088',
  grnDate: '06/09/2026',
  poNumber: 'PO-2026-0019',
  status: 'POSTED',
  supplier: {
    name: 'GSK Pakistan Ltd',
    phone: '021-111475755',
  },
  lines: [
    {
      itemNumber: 1,
      sku: 'MED-AUG-625',
      productName: 'Augmentin 625mg Tablets',
      batchNumber: 'AUG-771',
      expiryDate: '10/2027',
      receivedQuantity: 50,
      bonusQuantity: 5,
      unitCost: 320.0,
      discountPercent: 2,
      taxPercent: 0,
      lineTotal: 15680.0,
    },
  ],
  grossTotal: 16000.0,
  totalDiscount: 320.0,
  totalTax: 0,
  netTotal: 15680.0,
  footerNotes: 'Goods received in standard physical conditions',
};

const mockSalesReturn: PrintableSalesReturn = {
  returnNumber: 'SR-2026-0012',
  returnDate: '06/09/2026',
  originalInvoiceNumber: 'INV-2026-0001',
  status: 'POSTED',
  customer: {
    name: 'Al-Shifa Pharmacy',
  },
  lines: [
    {
      itemNumber: 1,
      sku: 'MED-PAN-500',
      productName: 'Panadol 500mg Tablets',
      batchNumber: 'BN-88910',
      quantity: 2,
      unitPrice: 450.0,
      reason: 'Damaged packing',
      lineTotal: 900.0,
    },
  ],
  subtotal: 900.0,
  totalTax: 0,
  totalCreditAmount: 900.0,
};

const mockPurchaseReturn: PrintablePurchaseReturn = {
  returnNumber: 'PR-2026-0005',
  returnDate: '06/09/2026',
  originalGrnNumber: 'GRN-2026-0088',
  status: 'POSTED',
  supplier: {
    name: 'GSK Pakistan Ltd',
  },
  lines: [
    {
      itemNumber: 1,
      sku: 'MED-AUG-625',
      productName: 'Augmentin 625mg',
      batchNumber: 'AUG-771',
      quantity: 5,
      unitPrice: 320.0,
      reason: 'Batch recall',
      lineTotal: 1600.0,
    },
  ],
  subtotal: 1600.0,
  totalTax: 0,
  totalDebitAmount: 1600.0,
};

const mockCustomerPayment: PrintableCustomerPayment = {
  voucherNumber: 'RCPT-2026-0042',
  paymentDate: '06/09/2026',
  paymentMethod: 'CASH',
  customer: {
    name: 'Al-Shifa Pharmacy',
  },
  amount: 4275.0,
  previousOutstandingBalance: 10000.0,
  remainingOutstandingBalance: 5725.0,
  allocations: [
    {
      documentNumber: 'INV-2026-0001',
      documentDate: '06/09/2026',
      totalDocumentAmount: 4275.0,
      previousBalance: 4275.0,
      allocatedAmount: 4275.0,
      remainingBalance: 0,
    },
  ],
};

const mockSupplierPayment: PrintableSupplierPayment = {
  voucherNumber: 'PAY-2026-0018',
  paymentDate: '06/09/2026',
  paymentMethod: 'BANK_TRANSFER',
  referenceNumber: 'UTR-99182377',
  bankName: 'Meezan Bank Ltd',
  supplier: {
    name: 'GSK Pakistan Ltd',
  },
  amount: 15680.0,
  previousPayableBalance: 50000.0,
  remainingPayableBalance: 34320.0,
  allocations: [
    {
      documentNumber: 'GRN-2026-0088',
      documentDate: '06/09/2026',
      totalDocumentAmount: 15680.0,
      previousBalance: 15680.0,
      allocatedAmount: 15680.0,
      remainingBalance: 0,
    },
  ],
};

describe('DocumentPrintModal and Templates Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'print').mockImplementation(() => {});
  });

  it('renders print modal, title, format switcher, and triggers window.print on click', () => {
    const handleClose = vi.fn();

    render(
      <DocumentPrintModal
        isOpen={true}
        onClose={handleClose}
        title="Sales Invoice Preview"
      >
        {(layout) => (
          <SalesInvoicePrintTemplate
            invoice={mockInvoice}
            company={mockCompany}
            layout={layout}
          />
        )}
      </DocumentPrintModal>,
    );

    expect(screen.getByText('Sales Invoice Preview')).toBeInTheDocument();
    expect(screen.getByText('A4 Sheet')).toBeInTheDocument();
    expect(screen.getByText('80mm Thermal')).toBeInTheDocument();

    const printBtn = screen.getByRole('button', { name: /print \(ctrl\+p\)/i });
    fireEvent.click(printBtn);
    expect(window.print).toHaveBeenCalled();
  });

  it('switches between A4 and 80mm thermal layout modes', () => {
    render(
      <DocumentPrintModal
        isOpen={true}
        onClose={vi.fn()}
        title="Sales Invoice"
      >
        {(layout) => (
          <SalesInvoicePrintTemplate
            invoice={mockInvoice}
            company={mockCompany}
            layout={layout}
          />
        )}
      </DocumentPrintModal>,
    );

    expect(screen.getByText('SALES INVOICE')).toBeInTheDocument();
    expect(screen.getByText('Al-Shifa Pharmacy')).toBeInTheDocument();

    const thermalBtn = screen.getByRole('button', { name: /80mm thermal/i });
    fireEvent.click(thermalBtn);

    expect(screen.getByText('Thank you for your business.')).toBeInTheDocument();
  });

  it('renders GRN print template in A4 and Thermal modes', () => {
    render(
      <GrnPrintTemplate
        grn={mockGrn}
        company={mockCompany}
        layout="A4"
      />,
    );

    expect(screen.getByText('GOODS RECEIVED NOTE (GRN)')).toBeInTheDocument();
    expect(screen.getByText('GRN-2026-0088')).toBeInTheDocument();
    expect(screen.getByText('GSK Pakistan Ltd')).toBeInTheDocument();
    expect(screen.getByText('Augmentin 625mg Tablets')).toBeInTheDocument();
  });

  it('renders Sales Return Credit Note and Purchase Return Debit Note templates', () => {
    const { rerender } = render(
      <SalesReturnPrintTemplate
        salesReturn={mockSalesReturn}
        company={mockCompany}
        layout="A4"
      />,
    );

    expect(screen.getByText('SALES RETURN CREDIT NOTE')).toBeInTheDocument();
    expect(screen.getByText('SR-2026-0012')).toBeInTheDocument();

    rerender(
      <PurchaseReturnPrintTemplate
        purchaseReturn={mockPurchaseReturn}
        company={mockCompany}
        layout="A4"
      />,
    );

    expect(screen.getByText('PURCHASE RETURN DEBIT NOTE')).toBeInTheDocument();
    expect(screen.getByText('PR-2026-0005')).toBeInTheDocument();
  });

  it('renders Customer Payment Receipt and Supplier Payment Voucher templates', () => {
    const { rerender } = render(
      <CustomerPaymentReceiptTemplate
        payment={mockCustomerPayment}
        company={mockCompany}
        layout="A4"
      />,
    );

    expect(screen.getByText('OFFICIAL PAYMENT RECEIPT')).toBeInTheDocument();
    expect(screen.getByText('RCPT-2026-0042')).toBeInTheDocument();

    rerender(
      <SupplierPaymentVoucherTemplate
        payment={mockSupplierPayment}
        company={mockCompany}
        layout="A4"
      />,
    );

    expect(screen.getByText('PAYMENT DISBURSEMENT VOUCHER')).toBeInTheDocument();
    expect(screen.getByText('PAY-2026-0018')).toBeInTheDocument();
  });

  it('handles keyboard hotkeys: Escape closes modal, Ctrl+P triggers print', () => {
    const handleClose = vi.fn();

    render(
      <DocumentPrintModal
        isOpen={true}
        onClose={handleClose}
        title="Test Modal"
      >
        {() => <div>Modal Content</div>}
      </DocumentPrintModal>,
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalled();

    fireEvent.keyDown(window, { key: 'p', ctrlKey: true });
    expect(window.print).toHaveBeenCalled();
  });
});
