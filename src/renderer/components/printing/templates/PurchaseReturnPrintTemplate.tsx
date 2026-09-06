import React from 'react';
import { PrintablePurchaseReturn, PrintableCompanyInfo, PrintLayoutType } from '../types';

interface PurchaseReturnPrintTemplateProps {
  purchaseReturn: PrintablePurchaseReturn;
  company: PrintableCompanyInfo;
  layout: PrintLayoutType;
}

export const PurchaseReturnPrintTemplate: React.FC<PurchaseReturnPrintTemplateProps> = ({
  purchaseReturn,
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
            PURCHASE RETURN DEBIT NOTE
          </div>
        </div>

        <div className="border-b border-dashed border-black pb-2 space-y-0.5 text-[9px]">
          <div className="flex justify-between">
            <span>Debit Note #: <strong>{purchaseReturn.returnNumber}</strong></span>
            <span>Date: {purchaseReturn.returnDate}</span>
          </div>
          {purchaseReturn.originalGrnNumber && (
            <div>Original GRN #: {purchaseReturn.originalGrnNumber}</div>
          )}
          <div>Supplier: <strong>{purchaseReturn.supplier.name}</strong></div>
        </div>

        <div className="border-b border-dashed border-black pb-2 space-y-1">
          <div className="flex justify-between font-bold border-b border-black text-[9px] pb-0.5">
            <span>Item / Batch / Qty</span>
            <span>Cost x Qty = Total</span>
          </div>
          {purchaseReturn.lines.map((line, idx) => (
            <div key={idx} className="space-y-0.5 text-[9px]">
              <div className="font-bold truncate">{line.productName}</div>
              <div className="flex justify-between text-gray-700">
                <span>B: {line.batchNumber}</span>
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
            <span>Rs. {purchaseReturn.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-[11px] border-t border-black pt-1">
            <span>TOTAL DEBIT:</span>
            <span>Rs. {purchaseReturn.totalDebitAmount.toFixed(2)}</span>
          </div>
        </div>

        {purchaseReturn.footerNotes && (
          <div className="text-center text-[8px] italic pt-1 border-t border-dotted border-black whitespace-pre-wrap">
            {purchaseReturn.footerNotes}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto bg-white text-black p-8 font-sans text-xs print:p-0 print:max-w-none print:w-full space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-indigo-900 pb-4">
        <div className="space-y-1 max-w-[60%]">
          <h1 className="text-xl font-bold uppercase tracking-tight text-indigo-950">
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
          <span className="inline-block px-3 py-1 bg-indigo-900 text-white font-bold text-sm tracking-wider uppercase rounded-sm">
            PURCHASE RETURN DEBIT NOTE
          </span>
          <div className="font-mono text-sm font-bold text-gray-900 pt-1">
            {purchaseReturn.returnNumber}
          </div>
          <div className="text-gray-600 text-[11px]">
            <strong>Date:</strong> {purchaseReturn.returnDate}
          </div>
          {purchaseReturn.originalGrnNumber && (
            <div className="text-gray-600 text-[11px]">
              <strong>Original GRN Ref:</strong> {purchaseReturn.originalGrnNumber}
            </div>
          )}
        </div>
      </div>

      {/* Supplier Info */}
      <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 border border-gray-200 rounded">
        <div>
          <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
            Debited Supplier / Vendor:
          </span>
          <div className="text-sm font-bold text-gray-900 mt-0.5">
            {purchaseReturn.supplier.name}
          </div>
          {purchaseReturn.supplier.address && (
            <div className="text-gray-600 text-[11px]">
              {purchaseReturn.supplier.address}
            </div>
          )}
        </div>

        <div className="text-right space-y-1 text-[11px]">
          <div>
            <strong>Status:</strong>{' '}
            <span className="font-semibold uppercase">{purchaseReturn.status}</span>
          </div>
          {purchaseReturn.reason && (
            <div><strong>Return Reason:</strong> {purchaseReturn.reason}</div>
          )}
          {purchaseReturn.approvedBy && (
            <div><strong>Approved By:</strong> {purchaseReturn.approvedBy}</div>
          )}
        </div>
      </div>

      {/* Lines Table */}
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-indigo-950 text-white text-[10px] uppercase font-semibold">
            <th className="py-2 px-2 border border-indigo-900 w-8 text-center">#</th>
            <th className="py-2 px-2 border border-indigo-900">Product Name / SKU</th>
            <th className="py-2 px-2 border border-indigo-900">Batch #</th>
            <th className="py-2 px-2 border border-indigo-900">Return Reason</th>
            <th className="py-2 px-2 border border-indigo-900 text-right">Return Qty</th>
            <th className="py-2 px-2 border border-indigo-900 text-right">Unit Cost (Rs.)</th>
            <th className="py-2 px-2 border border-indigo-900 text-right">Debit Total (Rs.)</th>
          </tr>
        </thead>
        <tbody className="text-[11px] divide-y divide-gray-200">
          {purchaseReturn.lines.map((line, index) => (
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

      {/* Summary */}
      <div className="grid grid-cols-12 gap-6 pt-2">
        <div className="col-span-7 space-y-3">
          <div className="grid grid-cols-2 gap-8 pt-8 text-center text-[10px] text-gray-600">
            <div className="border-t border-gray-400 pt-1">Dispatch / Store Signature</div>
            <div className="border-t border-gray-400 pt-1">Supplier Representative Signature</div>
          </div>
        </div>

        <div className="col-span-5">
          <div className="border border-gray-200 rounded p-3 bg-gray-50/50 space-y-1.5 text-[11px]">
            <div className="flex justify-between text-gray-700">
              <span>Subtotal:</span>
              <span className="font-mono font-semibold">Rs. {purchaseReturn.subtotal.toFixed(2)}</span>
            </div>
            {purchaseReturn.totalTax > 0 && (
              <div className="flex justify-between text-gray-700">
                <span>Tax Deduction:</span>
                <span className="font-mono font-semibold">+ Rs. {purchaseReturn.totalTax.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm text-indigo-950 border-t border-gray-300 pt-1.5">
              <span>Total Debit Amount:</span>
              <span className="font-mono">Rs. {purchaseReturn.totalDebitAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {purchaseReturn.footerNotes && (
        <div className="text-center text-[10px] text-gray-500 pt-4 border-t border-gray-200 italic whitespace-pre-wrap">
          {purchaseReturn.footerNotes}
        </div>
      )}
    </div>
  );
};
