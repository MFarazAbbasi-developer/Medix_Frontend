import React from 'react';
import { PrintableCustomerPayment, PrintableCompanyInfo, PrintLayoutType } from '../types';

interface CustomerPaymentReceiptTemplateProps {
  payment: PrintableCustomerPayment;
  company: PrintableCompanyInfo;
  layout: PrintLayoutType;
}

export const CustomerPaymentReceiptTemplate: React.FC<CustomerPaymentReceiptTemplateProps> = ({
  payment,
  company,
  layout,
}) => {
  const isThermal = layout === 'THERMAL';

  if (isThermal) {
    return (
      <div className="print-thermal-container bg-white text-black p-2 font-mono text-[10px] leading-tight space-y-2">
        <div className="text-center border-b border-dashed border-black pb-2 space-y-0.5">
          <div className="font-bold text-xs uppercase">{company.legalName || company.name}</div>
          {company.address && <div>{company.address}</div>}
          <div className="font-bold text-[11px] pt-1 border-t border-dotted border-black mt-1">
            PAYMENT RECEIPT
          </div>
        </div>

        <div className="border-b border-dashed border-black pb-2 space-y-0.5 text-[9px]">
          <div className="flex justify-between">
            <span>Receipt #: <strong>{payment.voucherNumber}</strong></span>
            <span>Date: {payment.paymentDate}</span>
          </div>
          <div>Received From: <strong>{payment.customer.name}</strong></div>
          {payment.customer.code && <div>Cust Code: {payment.customer.code}</div>}
          <div>Payment Mode: <strong className="uppercase">{payment.paymentMethod}</strong></div>
          {payment.referenceNumber && <div>Ref/Cheque #: {payment.referenceNumber}</div>}
          {payment.bankName && <div>Bank: {payment.bankName}</div>}
        </div>

        <div className="border-b border-dashed border-black pb-2 space-y-1">
          <div className="flex justify-between font-bold text-xs border-y border-black py-1">
            <span>AMOUNT RECEIVED:</span>
            <span>Rs. {payment.amount.toFixed(2)}</span>
          </div>

          {payment.previousOutstandingBalance !== undefined && (
            <div className="flex justify-between text-[9px]">
              <span>Previous Balance:</span>
              <span>Rs. {payment.previousOutstandingBalance.toFixed(2)}</span>
            </div>
          )}
          {payment.remainingOutstandingBalance !== undefined && (
            <div className="flex justify-between font-bold text-[10px]">
              <span>Current Outstanding:</span>
              <span>Rs. {payment.remainingOutstandingBalance.toFixed(2)}</span>
            </div>
          )}
        </div>

        {payment.allocations && payment.allocations.length > 0 && (
          <div className="border-b border-dashed border-black pb-2 space-y-0.5 text-[8.5px]">
            <div className="font-bold border-b border-dotted border-black pb-0.5">Allocated Invoices:</div>
            {payment.allocations.map((alloc, idx) => (
              <div key={idx} className="flex justify-between">
                <span>{alloc.documentNumber}</span>
                <span>Rs. {alloc.allocatedAmount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}

        {payment.footerNotes && (
          <div className="text-center text-[8px] italic pt-1 border-t border-dotted border-black whitespace-pre-wrap">
            {payment.footerNotes}
          </div>
        )}

        <div className="text-center text-[8px] pt-1">
          Thank you for prompt payment!
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto bg-white text-black p-8 font-sans text-xs print:p-0 print:max-w-none print:w-full space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-emerald-800 pb-4">
        <div className="space-y-1 max-w-[60%]">
          <h1 className="text-xl font-bold uppercase tracking-tight text-emerald-950">
            {company.legalName || company.name}
          </h1>
          <p className="text-gray-600 text-[11px] leading-snug">
            {company.address}{company.city ? `, ${company.city}` : ''}
          </p>
          <div className="flex flex-wrap gap-x-4 text-[11px] text-gray-700 pt-0.5">
            {company.phone && <span><strong>Tel:</strong> {company.phone}</span>}
            {company.ntn && <span><strong>NTN:</strong> {company.ntn}</span>}
          </div>
        </div>

        <div className="text-right space-y-1">
          <span className="inline-block px-3 py-1 bg-emerald-800 text-white font-bold text-sm tracking-wider uppercase rounded-sm">
            OFFICIAL PAYMENT RECEIPT
          </span>
          <div className="font-mono text-sm font-bold text-gray-900 pt-1">
            {payment.voucherNumber}
          </div>
          <div className="text-gray-600 text-[11px]">
            <strong>Payment Date:</strong> {payment.paymentDate}
          </div>
        </div>
      </div>

      {/* Customer & Receipt Details */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 border border-gray-200 rounded">
        <div>
          <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
            Received From Customer:
          </span>
          <div className="text-sm font-bold text-gray-900 mt-0.5">
            {payment.customer.name}
          </div>
          {payment.customer.code && (
            <div className="text-gray-600 text-[11px]">Customer Code: {payment.customer.code}</div>
          )}
          {payment.customer.address && (
            <div className="text-gray-600 text-[11px]">{payment.customer.address}</div>
          )}
        </div>

        <div className="text-right space-y-1 text-[11px]">
          <div>
            <strong>Payment Mode:</strong>{' '}
            <span className="font-bold uppercase text-emerald-800">{payment.paymentMethod}</span>
          </div>
          {payment.referenceNumber && (
            <div><strong>Ref / Cheque #:</strong> {payment.referenceNumber}</div>
          )}
          {payment.bankName && (
            <div><strong>Bank Branch:</strong> {payment.bankName}</div>
          )}
          {payment.collectedBy && (
            <div><strong>Collected By:</strong> {payment.collectedBy}</div>
          )}
        </div>
      </div>

      {/* Payment Amount Box */}
      <div className="p-4 rounded border-2 border-emerald-600 bg-emerald-50/50 flex justify-between items-center">
        <div>
          <span className="text-[11px] font-bold uppercase text-emerald-900 tracking-wider">
            Total Payment Received:
          </span>
          {payment.notes && (
            <p className="text-[11px] text-gray-700 italic mt-0.5">{payment.notes}</p>
          )}
        </div>
        <div className="text-2xl font-bold font-mono text-emerald-900">
          Rs. {payment.amount.toFixed(2)}
        </div>
      </div>

      {/* Invoice Allocations Table */}
      {payment.allocations && payment.allocations.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-700">
            Invoice Settlement Allocations (FIFO / Selective):
          </h4>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-700 text-[10px] uppercase font-semibold">
                <th className="py-1.5 px-2 border border-gray-200">Invoice Ref</th>
                <th className="py-1.5 px-2 border border-gray-200">Date</th>
                <th className="py-1.5 px-2 border border-gray-200 text-right">Invoice Total</th>
                <th className="py-1.5 px-2 border border-gray-200 text-right">Pre-Payment Balance</th>
                <th className="py-1.5 px-2 border border-gray-200 text-right">Allocated Amount</th>
                <th className="py-1.5 px-2 border border-gray-200 text-right">Remaining Balance</th>
              </tr>
            </thead>
            <tbody className="text-[11px] divide-y divide-gray-200">
              {payment.allocations.map((alloc, idx) => (
                <tr key={idx}>
                  <td className="py-1.5 px-2 border border-gray-200 font-mono font-semibold">
                    {alloc.documentNumber}
                  </td>
                  <td className="py-1.5 px-2 border border-gray-200 text-gray-600">
                    {alloc.documentDate}
                  </td>
                  <td className="py-1.5 px-2 border border-gray-200 text-right font-mono">
                    Rs. {alloc.totalDocumentAmount.toFixed(2)}
                  </td>
                  <td className="py-1.5 px-2 border border-gray-200 text-right font-mono text-gray-600">
                    Rs. {alloc.previousBalance.toFixed(2)}
                  </td>
                  <td className="py-1.5 px-2 border border-gray-200 text-right font-mono font-bold text-emerald-800">
                    Rs. {alloc.allocatedAmount.toFixed(2)}
                  </td>
                  <td className="py-1.5 px-2 border border-gray-200 text-right font-mono text-gray-800">
                    Rs. {alloc.remainingBalance.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Ledger Balance Summary & Signatures */}
      <div className="grid grid-cols-12 gap-6 pt-4">
        <div className="col-span-7 space-y-4">
          <div className="grid grid-cols-2 gap-8 pt-10 text-center text-[10px] text-gray-600">
            <div className="border-t border-gray-400 pt-1">Cashier / Receiver Signature</div>
            <div className="border-t border-gray-400 pt-1">Customer / Depositor Signature</div>
          </div>
        </div>

        <div className="col-span-5">
          <div className="border border-gray-200 rounded p-3 bg-gray-50/50 space-y-1.5 text-[11px]">
            {payment.previousOutstandingBalance !== undefined && (
              <div className="flex justify-between text-gray-700">
                <span>Previous Balance:</span>
                <span className="font-mono font-semibold">
                  Rs. {payment.previousOutstandingBalance.toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-emerald-700">
              <span>Amount Received:</span>
              <span className="font-mono font-semibold">
                - Rs. {payment.amount.toFixed(2)}
              </span>
            </div>
            {payment.remainingOutstandingBalance !== undefined && (
              <div className="flex justify-between font-bold text-xs text-gray-900 border-t border-gray-300 pt-1.5">
                <span>Closing Customer Balance:</span>
                <span className="font-mono text-brand-950">
                  Rs. {payment.remainingOutstandingBalance.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {payment.footerNotes && (
        <div className="text-center text-[10px] text-gray-500 pt-4 border-t border-gray-200 italic whitespace-pre-wrap">
          {payment.footerNotes}
        </div>
      )}
    </div>
  );
};
