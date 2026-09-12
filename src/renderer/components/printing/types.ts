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
  challanNumber?: string | null;
  rgaNumber?: string | null;
  rgaDate?: string | null;
  vendorCreditNoteNumber?: string | null;
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

export interface PrintableSupplierReturnChallanLine {
  itemNumber?: number;
  productName: string;
  productSku: string;
  genericName?: string | null;
  packSize?: string | null;
  unitSymbol?: string | null;
  batchNumber: string;
  expiryDate: string;
  returnedQuantity: number;
  bonusReturnedQuantity?: number;
  totalQuantity: number;
  stockCondition: string;
  sourceWarehouseName?: string | null;
}

export interface PrintableSupplierReturnChallan {
  challanNumber: string;
  returnNumber: string;
  returnDate: string;
  dispatchedAt?: string | null;
  rgaNumber?: string | null;
  rgaDate?: string | null;
  originalGrnNumber?: string | null;
  reason?: string | null;
  status: string;
  supplier: PrintablePartyInfo;
  dispatchedByUser?: {
    displayName: string;
    username: string;
  } | null;
  lines: PrintableSupplierReturnChallanLine[];
  summary: {
    totalBilledQuantity: number;
    totalBonusQuantity: number;
    totalReturnedQuantity: number;
    totalLinesCount: number;
  };
  notes?: string | null;
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

export interface PrintablePdcReceipt {
  company: PrintableCompanyInfo;
  branch?: {
    name?: string | null;
    code?: string | null;
    address?: string | null;
    phone?: string | null;
  } | null;
  pdcNumber: string;
  chequeNumber: string;
  bankName: string;
  chequeDate: string;
  receivedDate: string;
  amount: number;
  allocatedAmount: number;
  unallocatedAmount: number;
  status: string;
  notes?: string | null;
  depositBankName?: string | null;
  depositReference?: string | null;
  depositedAt?: string | null;
  clearedAt?: string | null;
  bouncedAt?: string | null;
  bounceReason?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  customer: PrintablePartyInfo & { currentBalance?: number };
  receivedBy: string;
  linkedPaymentNumber?: string | null;
  allocations?: Array<{
    invoiceNumber: string;
    invoiceDate?: string;
    netTotal: number;
    amountAllocated: number;
  }>;
}

export interface PrintableTillSession {
  company: PrintableCompanyInfo;
  branch: {
    name: string;
    code: string;
    city?: string | null;
    phone?: string | null;
    address?: string | null;
  };
  session: {
    id?: string;
    sessionNumber: string;
    stationName?: string | null;
    status: string;
    businessDate?: string | null;
    openedAt: string;
    countedAt?: string | null;
    closedAt?: string | null;
    cashier: {
      id?: string;
      username: string;
      displayName: string;
    };
    closedBy?: {
      id?: string;
      username: string;
      displayName: string;
    } | null;
    approvedBy?: {
      id?: string;
      username: string;
      displayName: string;
    } | string | null;
    financials: {
      openingCash: number;
      cashSalesAmount?: number;
      cashPaymentsAmount?: number;
      cashRefundsAmount?: number;
      cashInAmount?: number;
      cashOutAmount?: number;
      expectedCash: number;
      actualCash?: number;
      varianceAmount?: number;
      varianceType?: string;
      cardSalesAmount?: number;
      bankSalesAmount?: number;
      chequeSalesAmount?: number;
      creditSalesAmount?: number;
      cashSales?: number;
      cashCollections?: number;
      cashIn?: number;
      cashRefunds?: number;
      cashOut?: number;
      countedCash?: number | null;
      variance?: number | null;
    };
    approval?: {
      varianceReason?: string | null;
      approvedBy?: string | null;
      approvedAt?: string | null;
    };
    varianceReason?: string | null;
    notes?: string | null;
    denominations?: Array<{
      denominationValue?: number;
      denomination?: string | number;
      noteCount?: number;
      count?: number;
      totalAmount?: number;
      amount?: number;
    }>;
    movements?: Array<{
      id?: string;
      movementType?: string;
      type?: string;
      amount: number;
      reason: string;
      referenceNo?: string | null;
      performedBy: string | { id?: string; username: string; displayName: string };
      createdAt?: string;
      timestamp?: string;
    }>;
  };
}
