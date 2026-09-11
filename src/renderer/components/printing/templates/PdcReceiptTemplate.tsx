import React from 'react';
import { PrintablePdcReceipt, PrintableCompanyInfo, PrintLayoutType } from '../types';

interface PdcReceiptTemplateProps {
  pdcReceipt: PrintablePdcReceipt;
  company: PrintableCompanyInfo;
  layout: PrintLayoutType;
}

// Convert numbers to words for Pakistani Rupees
function numberToWords(num: number): string {
  const a = [
    '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ',
    'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen ',
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const n = ('000000000' + Math.floor(num)).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';
  let str = '';
  str += Number(n[1]) !== 0 ? (a[Number(n[1])] || b[Number(n[1][0])] + ' ' + a[Number(n[1][1])]) + 'Crore ' : '';
  str += Number(n[2]) !== 0 ? (a[Number(n[2])] || b[Number(n[2][0])] + ' ' + a[Number(n[2][1])]) + 'Lakh ' : '';
  str += Number(n[3]) !== 0 ? (a[Number(n[3])] || b[Number(n[3][0])] + ' ' + a[Number(n[3][1])]) + 'Thousand ' : '';
  str += Number(n[4]) !== 0 ? (a[Number(n[4])] || b[Number(n[4][0])] + ' ' + a[Number(n[4][1])]) + 'Hundred ' : '';
  str += Number(n[5]) !== 0 ? ((str !== '' ? 'and ' : '') + (a[Number(n[5])] || b[Number(n[5][0])] + ' ' + a[Number(n[5][1])])) : '';
  return str.trim() ? `${str.trim()} Rupees Only` : 'Zero Rupees';
}

export const PdcReceiptTemplate: React.FC<PdcReceiptTemplateProps> = ({
  pdcReceipt,
  company,
  layout,
}) => {
  const isThermal = layout === 'THERMAL';
  const effectiveCompany = pdcReceipt.company || company;

  if (isThermal) {
    return (
      <div className="print-thermal-container bg-white text-black p-2 font-mono text-[10px] leading-tight space-y-2">
        <div className="text-center border-b border-dashed border-black pb-2 space-y-0.5">
          <div className="font-bold text-xs uppercase">{effectiveCompany.legalName || effectiveCompany.name}</div>
          {effectiveCompany.address && <div>{effectiveCompany.address}</div>}
          <div className="font-bold text-[10.5px] pt-1 border-t border-dotted border-black mt-1 uppercase">
            PDC CUSTODY RECEIPT
          </div>
          <div className="text-[8px] uppercase tracking-wider text-gray-700">
            [ Custodial Instrument ]
          </div>
        </div>

        <div className="border-b border-dashed border-black pb-2 space-y-0.5 text-[9px]">
          <div className="flex justify-between">
            <span>PDC #: <strong>{pdcReceipt.pdcNumber}</strong></span>
            <span>Date: {pdcReceipt.receivedDate ? new Date(pdcReceipt.receivedDate).toLocaleDateString() : ''}</span>
          </div>
          <div>Received From: <strong>{pdcReceipt.customer.name}</strong></div>
          {pdcReceipt.customer.code && <div>Cust Code: {pdcReceipt.customer.code}</div>}
          <div>Cheque #: <strong>{pdcReceipt.chequeNumber}</strong></div>
          <div>Bank: {pdcReceipt.bankName}</div>
          <div>Maturity Date: <strong>{pdcReceipt.chequeDate ? new Date(pdcReceipt.chequeDate).toLocaleDateString() : ''}</strong></div>
          <div>Status: <strong className="uppercase">{pdcReceipt.status}</strong></div>
        </div>

        <div className="border-b border-dashed border-black pb-2 space-y-1">
          <div className="flex justify-between font-bold text-xs border-y border-black py-1">
            <span>CHEQUE AMOUNT:</span>
            <span>Rs. {pdcReceipt.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="text-[8px] italic">
            {numberToWords(pdcReceipt.amount)}
          </div>
        </div>

        {pdcReceipt.allocations && pdcReceipt.allocations.length > 0 && (
          <div className="border-b border-dashed border-black pb-2 space-y-0.5 text-[8.5px]">
            <div className="font-bold border-b border-dotted border-black pb-0.5">Intended Invoice Pre-allocations:</div>
            {pdcReceipt.allocations.map((alloc, idx) => (
              <div key={idx} className="flex justify-between">
                <span>{alloc.invoiceNumber}</span>
                <span>Rs. {alloc.amountAllocated.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}

        <div className="text-[7.5px] leading-tight text-gray-800 border-b border-dotted border-black pb-1.5 pt-0.5">
          * CUSTODIAL NOTICE: This receipt confirms safe physical custody only. Funds are not settled until clearance by the drawee bank.
        </div>

        <div className="flex justify-between pt-3 text-[8px]">
          <div>
            <div>___________________</div>
            <div>Custody Officer</div>
          </div>
          <div className="text-right">
            <div>___________________</div>
            <div>Customer Signature</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto bg-white text-black p-8 font-sans text-xs print:p-0 print:max-w-none print:w-full space-y-6">
      {/* Top Header */}
      <div className="flex justify-between items-start border-b-2 border-indigo-900 pb-4">
        <div className="space-y-1 max-w-[60%]">
          <h1 className="text-xl font-bold uppercase tracking-tight text-indigo-950">
            {effectiveCompany.legalName || effectiveCompany.name}
          </h1>
          <p className="text-gray-600 text-[11px] leading-snug">
            {effectiveCompany.address}{effectiveCompany.city ? `, ${effectiveCompany.city}` : ''}
          </p>
          <div className="flex flex-wrap gap-x-4 text-[11px] text-gray-700 pt-0.5">
            {effectiveCompany.phone && <span><strong>Tel:</strong> {effectiveCompany.phone}</span>}
            {effectiveCompany.email && <span><strong>Email:</strong> {effectiveCompany.email}</span>}
            {effectiveCompany.ntn && <span><strong>NTN:</strong> {effectiveCompany.ntn}</span>}
            {effectiveCompany.drugSaleLicenseNo && <span><strong>DSL:</strong> {effectiveCompany.drugSaleLicenseNo}</span>}
          </div>
        </div>

        <div className="text-right space-y-1">
          <div className="inline-block bg-indigo-50 border border-indigo-200 text-indigo-900 px-3 py-1 rounded font-bold text-sm uppercase tracking-wide">
            PDC CUSTODY ACKNOWLEDGMENT
          </div>
          <div className="text-xs font-semibold text-gray-800 pt-1">
            Receipt Ref: <span className="font-mono text-sm font-bold text-indigo-950">{pdcReceipt.pdcNumber}</span>
          </div>
          <div className="text-gray-600 text-[11px]">
            Received Date: {pdcReceipt.receivedDate ? new Date(pdcReceipt.receivedDate).toLocaleDateString() : '—'}
          </div>
          <div className="text-xs">
            Status: <span className="font-bold uppercase px-2 py-0.5 rounded text-[10px] bg-gray-100 text-gray-800 border">{pdcReceipt.status}</span>
          </div>
        </div>
      </div>

      {/* Custody Warning Banner */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-3 text-[11px] text-amber-900 rounded flex items-start gap-2">
        <div>
          <span className="font-bold">Custodial Instrument Notice: </span>
          This document acknowledges safe custody of a post-dated cheque. It does <strong>not</strong> affect customer ledger balances or invoice settlements until bank clearance is formally processed on or after maturity.
        </div>
      </div>

      {/* 2-Column Info: Customer & Cheque Details */}
      <div className="grid grid-cols-2 gap-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
        {/* Customer Details */}
        <div className="space-y-1 text-[11px]">
          <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-2 border-b border-gray-200 pb-1">
            Customer / Drawer Details
          </h3>
          <div className="font-bold text-sm text-gray-900">{pdcReceipt.customer.name}</div>
          {pdcReceipt.customer.code && (
            <div className="text-gray-600">Customer Code: <span className="font-mono font-medium">{pdcReceipt.customer.code}</span></div>
          )}
          {pdcReceipt.customer.phone && (
            <div className="text-gray-600">Phone: {pdcReceipt.customer.phone}</div>
          )}
          {pdcReceipt.customer.address && (
            <div className="text-gray-600">Address: {pdcReceipt.customer.address}{pdcReceipt.customer.city ? `, ${pdcReceipt.customer.city}` : ''}</div>
          )}
        </div>

        {/* Cheque Details */}
        <div className="space-y-1 text-[11px]">
          <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-2 border-b border-gray-200 pb-1">
            Cheque & Banking Instrument
          </h3>
          <div className="flex justify-between">
            <span className="text-gray-600">Cheque Number:</span>
            <span className="font-mono font-bold text-gray-900">{pdcReceipt.chequeNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Drawee Bank:</span>
            <span className="font-medium text-gray-900">{pdcReceipt.bankName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Cheque Maturity Date:</span>
            <span className="font-bold text-indigo-900">{pdcReceipt.chequeDate ? new Date(pdcReceipt.chequeDate).toLocaleDateString() : '—'}</span>
          </div>
          {pdcReceipt.depositBankName && (
            <div className="flex justify-between pt-1 border-t border-gray-200 text-gray-700">
              <span>Deposited In:</span>
              <span>{pdcReceipt.depositBankName} {pdcReceipt.depositReference ? `(${pdcReceipt.depositReference})` : ''}</span>
            </div>
          )}
          {pdcReceipt.linkedPaymentNumber && (
            <div className="flex justify-between text-emerald-800 font-semibold">
              <span>Cleared Receipt #:</span>
              <span>{pdcReceipt.linkedPaymentNumber}</span>
            </div>
          )}
        </div>
      </div>

      {/* Amount Hero Box */}
      <div className="bg-indigo-950 text-white rounded-lg p-4 flex justify-between items-center">
        <div>
          <div className="text-[10px] uppercase font-bold tracking-wider text-indigo-200">
            Cheque Face Value (Custody Amount)
          </div>
          <div className="text-xs italic text-indigo-100 mt-0.5">
            {numberToWords(pdcReceipt.amount)}
          </div>
        </div>
        <div className="text-2xl font-bold font-mono text-emerald-300">
          Rs. {pdcReceipt.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </div>

      {/* Intended Pre-allocations Table (if any) */}
      {pdcReceipt.allocations && pdcReceipt.allocations.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase text-gray-700 tracking-wider">
            Intended Invoice Settlement Pre-allocations
          </h3>
          <table className="w-full border-collapse border border-gray-300 text-[11px]">
            <thead>
              <tr className="bg-gray-100 text-gray-700 font-bold border-b border-gray-300">
                <th className="p-2 text-left border-r border-gray-300">#</th>
                <th className="p-2 text-left border-r border-gray-300">Invoice Number</th>
                <th className="p-2 text-left border-r border-gray-300">Invoice Date</th>
                <th className="p-2 text-right border-r border-gray-300">Invoice Net Total</th>
                <th className="p-2 text-right">Intended Pre-allocated (Rs.)</th>
              </tr>
            </thead>
            <tbody>
              {pdcReceipt.allocations.map((alloc, idx) => (
                <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="p-2 border-r border-gray-200 text-gray-500">{idx + 1}</td>
                  <td className="p-2 border-r border-gray-200 font-mono font-medium">{alloc.invoiceNumber}</td>
                  <td className="p-2 border-r border-gray-200 text-gray-600">
                    {alloc.invoiceDate ? new Date(alloc.invoiceDate).toLocaleDateString() : '—'}
                  </td>
                  <td className="p-2 border-r border-gray-200 text-right font-mono text-gray-600">
                    {alloc.netTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-2 text-right font-mono font-bold text-gray-900">
                    {alloc.amountAllocated.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-bold">
                <td colSpan={4} className="p-2 text-right border-r border-gray-300">
                  Total Pre-allocated:
                </td>
                <td className="p-2 text-right font-mono text-indigo-950">
                  Rs. {pdcReceipt.allocatedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              </tr>
              {pdcReceipt.unallocatedAmount > 0 && (
                <tr className="bg-gray-50 font-semibold text-gray-600 text-[10.5px]">
                  <td colSpan={4} className="p-2 text-right border-r border-gray-300">
                    Unallocated (Treated as Customer Advance upon clearance):
                  </td>
                  <td className="p-2 text-right font-mono">
                    Rs. {pdcReceipt.unallocatedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Notes */}
      {pdcReceipt.notes && (
        <div className="bg-gray-50 border border-gray-200 rounded p-3 text-[11px] text-gray-700">
          <span className="font-bold text-gray-900">Remarks / Custody Notes: </span>
          {pdcReceipt.notes}
        </div>
      )}

      {/* Signatures */}
      <div className="grid grid-cols-2 gap-12 pt-8 text-[11px]">
        <div className="border-t border-gray-400 pt-2 text-center">
          <div className="font-bold text-gray-900">{pdcReceipt.receivedBy || 'Authorized Custody Officer'}</div>
          <div className="text-gray-500 text-[10px]">Received & Custodied By (MEDIX)</div>
        </div>
        <div className="border-t border-gray-400 pt-2 text-center">
          <div className="font-bold text-gray-900">{pdcReceipt.customer.name}</div>
          <div className="text-gray-500 text-[10px]">Customer / Drawer Signature & Stamp</div>
        </div>
      </div>
    </div>
  );
};
