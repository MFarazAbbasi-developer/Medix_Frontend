export type PrintLayoutType = 'A4' | 'THERMAL';

export interface PrintableCompanyInfo {
  name: string;
  legalName?: string | null;
  address?: string | null;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  ntn?: string | null;
  strn?: string | null;
  drugSaleLicenseNo?: string | null;
  logoUrl?: string | null;
}

export interface PrintablePartyInfo {
  name: string;
  code?: string | null;
  address?: string | null;
  city?: string | null;
  phone?: string | null;
  ntn?: string | null;
  strn?: string | null;
  drugSaleLicenseNo?: string | null;
}

export interface PrintableInvoiceLine {
  itemNumber?: number;
  sku: string;
  productName: string;
  packSize?: string | null;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  bonusQuantity?: number;
  unitPrice: number;
  mrp?: number | null;
  tp?: number | null;
  discountPercent?: number;
  discountAmount?: number;
  salesTaxPercent?: number;
  salesTaxAmount?: number;
  lineTotal: number;
}

export interface PrintableSalesInvoice {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string | null;
  orderNumber?: string | null;
  status: string;
  paymentTerms?: string | null;
  salesmanName?: string | null;
  branchName?: string | null;
  customer: PrintablePartyInfo;
  deliveryInfo?: {
    title?: string | null;
    recipientName?: string | null;
    phone?: string | null;
    address?: string | null;
    city?: string | null;
    instructions?: string | null;
  } | null;
  lines: PrintableInvoiceLine[];
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  grandTotal: number;
  amountPaid: number;
  balanceDue: number;
  previousBalance?: number;
  netPayableWithPrevious?: number;
  notes?: string | null;
  footerNotes?: string | null;
  termsAndConditions?: string | null;
}

export interface PrintableGrnLine {
  itemNumber?: number;
  sku: string;
  productName: string;
  batchNumber: string;
  expiryDate: string;
  receivedQuantity: number;
  bonusQuantity?: number;
  unitCost: number;
  tradePrice?: number | null;
  mrp?: number | null;
  discountPercent?: number;
  taxPercent?: number;
  lineTotal: number;
}

export interface PrintableGrn {
  grnNumber: string;
  grnDate: string;
  poNumber?: string | null;
  supplierInvoiceNumber?: string | null;
  supplierInvoiceDate?: string | null;
  status: string;
  warehouseName?: string | null;
  supplier: PrintablePartyInfo;
  lines: PrintableGrnLine[];
  grossTotal: number;
  totalDiscount: number;
  totalTax: number;
  netTotal: number;
  receivedBy?: string | null;
  verifiedBy?: string | null;
  notes?: string | null;
  footerNotes?: string | null;
}

export interface PrintableReturnLine {
  itemNumber?: number;
  sku: string;
  productName: string;
  batchNumber: string;
  expiryDate?: string | null;
  quantity: number;
  bonusQuantity?: number;
  unitPrice: number;
  reason?: string | null;
  lineTotal: number;
}

export interface PrintableSalesReturn {
  returnNumber: string;
  returnDate: string;
  originalInvoiceNumber?: string | null;
  originalInvoiceDate?: string | null;
  status: string;
  customer: PrintablePartyInfo;
  lines: PrintableReturnLine[];
  subtotal: number;
  totalTax: number;
  totalCreditAmount: number;
  adjustedCustomerBalance?: number | null;
  reason?: string | null;
  approvedBy?: string | null;
  footerNotes?: string | null;
}

export interface PrintablePurchaseReturn {
  returnNumber: string;
  returnDate: string;
  originalGrnNumber?: string | null;
  originalGrnDate?: string | null;
  supplierDebitNoteNumber?: string | null;
  status: string;
  supplier: PrintablePartyInfo;
  lines: PrintableReturnLine[];
  subtotal: number;
  totalDiscount?: number;
  totalTax: number;
  totalDebitAmount: number;
  reason?: string | null;
  approvedBy?: string | null;
  footerNotes?: string | null;
}

export interface PrintablePaymentAllocation {
  documentNumber: string;
  documentDate: string;
  totalDocumentAmount: number;
  previousBalance: number;
  allocatedAmount: number;
  remainingBalance: number;
}

export interface PrintableCustomerPayment {
  voucherNumber: string;
  paymentDate: string;
  paymentMethod: string;
  referenceNumber?: string | null;
  chequeNumber?: string | null;
  bankName?: string | null;
  customer: PrintablePartyInfo;
  amount: number;
  previousOutstandingBalance?: number;
  remainingOutstandingBalance?: number;
  allocations?: PrintablePaymentAllocation[];
  collectedBy?: string | null;
  notes?: string | null;
  footerNotes?: string | null;
}

export interface PrintableSupplierPayment {
  voucherNumber: string;
  paymentDate: string;
  paymentMethod: string;
  referenceNumber?: string | null;
  chequeNumber?: string | null;
  bankName?: string | null;
  supplier: PrintablePartyInfo;
  amount: number;
  previousPayableBalance?: number;
  remainingPayableBalance?: number;
  allocations?: PrintablePaymentAllocation[];
  disbursedBy?: string | null;
  notes?: string | null;
  footerNotes?: string | null;
}

export interface PrintableDeliveryChallanLine {
  itemNumber?: number;
  productName: string;
  productSku: string;
  genericName?: string | null;
  packSize?: string | null;
  unitOfMeasurement?: string | null;
  batchNumber: string;
  expiryDate: string;
  orderedBilledQuantity: number;
  orderedBonusQuantity: number;
  deliveredBilledQuantity: number;
  deliveredBonusQuantity: number;
  totalDispatchedQuantity: number;
}

export interface PrintableDeliveryChallan {
  company: PrintableCompanyInfo;
  branch?: {
    name?: string | null;
    code?: string | null;
    address?: string | null;
    city?: string | null;
    phone?: string | null;
  } | null;
  challanNumber: string;
  fulfillmentDate: string;
  fulfillmentNumber: number;
  doNumber: string;
  invoiceNumber: string;
  invoiceDate: string;
  status: string;
  notes?: string | null;
  customer: {
    name: string;
    code?: string | null;
  };
  deliveryDestination: {
    title?: string | null;
    recipientName?: string | null;
    phone?: string | null;
    address?: string | null;
    city?: string | null;
    instructions?: string | null;
  };
  salesAttribution: {
    salesmanName?: string | null;
    salesmanCode?: string | null;
    routeName?: string | null;
    routeCode?: string | null;
  };
  dispatchedBy: string;
  lines: PrintableDeliveryChallanLine[];
  summary: {
    totalBilledQuantity: number;
    totalBonusQuantity: number;
    totalDispatchedQuantity: number;
    totalLinesCount: number;
  };
}
