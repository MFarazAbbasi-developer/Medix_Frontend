import React from 'react';
import { PrintableSalesReturn, PrintableCompanyInfo, PrintLayoutType } from '../types';

interface SalesReturnPrintTemplateProps {
  salesReturn: PrintableSalesReturn;
  company: PrintableCompanyInfo;
  layout: PrintLayoutType;
}

export const SalesReturnPrintTemplate: React.FC<SalesReturnPrintTemplateProps> = ({
  salesReturn,
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
            SALES RETURN CREDIT NOTE
          </div>
        </div>

        <div className="border-b border-dashed border-black pb-2 space-y-0.5 text-[9px]">
          <div className="flex justify-between">
            <span>Credit Note #: <strong>{salesReturn.returnNumber}</strong></span>
            <span>Date: {salesReturn.returnDate}</span>
          </div>
          {salesReturn.originalInvoiceNumber && (
            <div>Original Inv #: {salesReturn.originalInvoiceNumber}</div>
          )}
          <div>Customer: <strong>{salesReturn.customer.name}</strong></div>
        </div>

        <div className="border-b border-dashed border-black pb-2 space-y-1">
          <div className="flex justify-between font-bold border-b border-black text-[9px] pb-0.5">
            <span>Item / Batch / Reason</span>
            <span>Qty x Rate = Credit</span>
          </div>
          {salesReturn.lines.map((line, idx) => (
            <div key={idx} className="space-y-0.5 text-[9px]">
              <div className="font-bold truncate">{line.productName}</div>
              <div className="flex justify-between text-gray-700">
                <span>B: {line.batchNumber} {line.reason ? `(${line.reason})` : ''}</span>
                <span>{line.quantity} x Rs.{line.unitPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-end font-semibold">
                <span>Rs. {line.lineTotal.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-0.5 border-b border-dashed border-black pb-2 text-[9px]">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>Rs. {salesReturn.subtotal.toFixed(2)}</span>
          </div>
          {salesReturn.totalTax > 0 && (
            <div className="flex justify-between">
              <span>Tax Refunded:</span>
              <span>Rs. {salesReturn.totalTax.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-[11px] border-t border-black pt-1">
            <span>TOTAL CREDIT:</span>
            <span>Rs. {salesReturn.totalCreditAmount.toFixed(2)}</span>
          </div>
        </div>

        {salesReturn.footerNotes && (
          <div className="text-center text-[8px] italic pt-1 border-t border-dotted border-black whitespace-pre-wrap">
            {salesReturn.footerNotes}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto bg-white text-black p-8 font-sans text-xs print:p-0 print:max-w-none print:w-full space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-rose-800 pb-4">
        <div className="space-y-1 max-w-[60%]">
          <h1 className="text-xl font-bold uppercase tracking-tight text-rose-950">
            {company.legalName || company.name}
          </h1>
          <p className="text-gray-600 text-[11px] leading-snug">
            {company.address}{company.city ? `, ${company.city}` : ''}
          </p>
          <div className="flex flex-wrap gap-x-4 text-[11px] text-gray-700 pt-0.5">
            {company.phone && <span><strong>Tel:</strong> {company.phone}</span>}
            {company.ntn && <span><strong>NTN:</strong> {company.ntn}</span>}
            {company.drugSaleLicenseNo && (
              <span><strong>Drug Sale Lic #:</strong> {company.drugSaleLicenseNo}</span>
            )}
          </div>
        </div>

        <div className="text-right space-y-1">
          <span className="inline-block px-3 py-1 bg-rose-900 text-white font-bold text-sm tracking-wider uppercase rounded-sm">
            SALES RETURN CREDIT NOTE
          </span>
          <div className="font-mono text-sm font-bold text-gray-900 pt-1">
            {salesReturn.returnNumber}
          </div>
          <div className="text-gray-600 text-[11px]">
            <strong>Date:</strong> {salesReturn.returnDate}
          </div>
          {salesReturn.originalInvoiceNumber && (
            <div className="text-gray-600 text-[11px]">
              <strong>Original Inv Ref:</strong> {salesReturn.originalInvoiceNumber}
            </div>
          )}
        </div>
      </div>

      {/* Customer & Return Info */}
      <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 border border-gray-200 rounded">
        <div>
          <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
            Credited Customer:
          </span>
          <div className="text-sm font-bold text-gray-900 mt-0.5">
            {salesReturn.customer.name}
          </div>
          {salesReturn.customer.address && (
            <div className="text-gray-600 text-[11px]">
              {salesReturn.customer.address}
            </div>
          )}
        </div>

        <div className="text-right space-y-1 text-[11px]">
          <div>
            <strong>Status:</strong>{' '}
            <span className="font-semibold uppercase">{salesReturn.status}</span>
          </div>
          {salesReturn.reason && (
            <div><strong>Primary Reason:</strong> {salesReturn.reason}</div>
          )}
          {salesReturn.approvedBy && (
            <div><strong>Approved By:</strong> {salesReturn.approvedBy}</div>
          )}
        </div>
      </div>

      {/* Returned Lines Table */}
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-rose-950 text-white text-[10px] uppercase font-semibold">
            <th className="py-2 px-2 border border-rose-900 w-8 text-center">#</th>
            <th className="py-2 px-2 border border-rose-900">Product Name / SKU</th>
            <th className="py-2 px-2 border border-rose-900">Batch #</th>
            <th className="py-2 px-2 border border-rose-900">Return Reason</th>
            <th className="py-2 px-2 border border-rose-900 text-right">Return Qty</th>
            <th className="py-2 px-2 border border-rose-900 text-right">Unit Rate (Rs.)</th>
            <th className="py-2 px-2 border border-rose-900 text-right">Credit Total (Rs.)</th>
          </tr>
        </thead>
        <tbody className="text-[11px] divide-y divide-gray-200">
          {salesReturn.lines.map((line, index) => (
            <tr key={index} className={index % 2 === 1 ? 'bg-gray-50/50' : 'bg-white'}>
              <td className="py-1.5 px-2 border border-gray-200 text-center font-mono text-gray-500">
                {line.itemNumber || index + 1}
              </td>
              <td className="py-1.5 px-2 border border-gray-200">
                <div className="font-bold text-gray-900">{line.productName}</div>
                <div className="text-[10px] font-mono text-gray-500">{line.sku}</div>
              </td>
              <td className="py-1.5 px-2 border border-gray-200 font-mono text-gray-800">
                {line.batchNumber}
              </td>
              <td className="py-1.5 px-2 border border-gray-200 text-gray-600">
                {line.reason || '-'}
              </td>
              <td className="py-1.5 px-2 border border-gray-200 text-right font-mono font-semibold">
                {line.quantity}
              </td>
              <td className="py-1.5 px-2 border border-gray-200 text-right font-mono">
                {line.unitPrice.toFixed(2)}
              </td>
              <td className="py-1.5 px-2 border border-gray-200 text-right font-mono font-bold text-gray-900">
                {line.lineTotal.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Summary Totals & Signatures */}
      <div className="grid grid-cols-12 gap-6 pt-2">
        <div className="col-span-7 space-y-3">
          <div className="grid grid-cols-2 gap-8 pt-8 text-center text-[10px] text-gray-600">
            <div className="border-t border-gray-400 pt-1">Return Received By</div>
            <div className="border-t border-gray-400 pt-1">Authorized Inspection Signature</div>
          </div>
        </div>

        <div className="col-span-5">
          <div className="border border-gray-200 rounded p-3 bg-gray-50/50 space-y-1.5 text-[11px]">
            <div className="flex justify-between text-gray-700">
              <span>Items Subtotal:</span>
              <span className="font-mono font-semibold">Rs. {salesReturn.subtotal.toFixed(2)}</span>
            </div>
            {salesReturn.totalTax > 0 && (
              <div className="flex justify-between text-gray-700">
                <span>Tax Refund Adjustment:</span>
                <span className="font-mono font-semibold">+ Rs. {salesReturn.totalTax.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm text-rose-950 border-t border-gray-300 pt-1.5">
              <span>Total Credit Amount:</span>
              <span className="font-mono">Rs. {salesReturn.totalCreditAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {salesReturn.footerNotes && (
        <div className="text-center text-[10px] text-gray-500 pt-4 border-t border-gray-200 italic whitespace-pre-wrap">
          {salesReturn.footerNotes}
        </div>
      )}
    </div>
  );
};
