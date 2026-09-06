import React from 'react';
import { PrintableSalesInvoice, PrintableCompanyInfo, PrintLayoutType } from '../types';

interface SalesInvoicePrintTemplateProps {
  invoice: PrintableSalesInvoice;
  company: PrintableCompanyInfo;
  layout: PrintLayoutType;
}

export const SalesInvoicePrintTemplate: React.FC<SalesInvoicePrintTemplateProps> = ({
  invoice,
  company,
  layout,
}) => {
  const isThermal = layout === 'THERMAL';

  if (isThermal) {
    return (
      <div className="print-thermal-container bg-white text-black p-2 font-mono text-[10px] leading-tight space-y-2">
        {/* Thermal Header */}
        <div className="text-center border-b border-dashed border-black pb-2 space-y-0.5">
          <div className="font-bold text-xs uppercase">{company.legalName || company.name}</div>
          {company.address && <div>{company.address}</div>}
          {company.city && <div>{company.city}</div>}
          {company.phone && <div>Tel: {company.phone}</div>}
          {company.ntn && <div>NTN: {company.ntn}</div>}
          {company.drugSaleLicenseNo && <div>DSL: {company.drugSaleLicenseNo}</div>}
          <div className="font-bold text-[11px] pt-1 border-t border-dotted border-black mt-1">
            SALES INVOICE
          </div>
        </div>

        {/* Invoice & Customer Meta */}
        <div className="border-b border-dashed border-black pb-2 space-y-0.5 text-[9px]">
          <div className="flex justify-between">
            <span>Inv #: <strong>{invoice.invoiceNumber}</strong></span>
            <span>Date: {invoice.invoiceDate}</span>
          </div>
          <div>Customer: <strong>{invoice.customer.name}</strong></div>
          {invoice.customer.code && <div>Cust Code: {invoice.customer.code}</div>}
          {invoice.customer.drugSaleLicenseNo && <div>Cust DSL: {invoice.customer.drugSaleLicenseNo}</div>}
          {invoice.salesmanName && <div>Salesman: {invoice.salesmanName}</div>}
        </div>

        {/* Items List */}
        <div className="border-b border-dashed border-black pb-2 space-y-1">
          <div className="flex justify-between font-bold border-b border-black text-[9px] pb-0.5">
            <span>Item / Batch / Exp</span>
            <span>Qty x Rate = Net</span>
          </div>
          {invoice.lines.map((line, idx) => (
            <div key={idx} className="space-y-0.5 text-[9px]">
              <div className="font-bold truncate">{line.productName}</div>
              <div className="flex justify-between text-gray-700">
                <span>B: {line.batchNumber} | Exp: {line.expiryDate}</span>
                <span>{line.quantity} {line.bonusQuantity ? `(+${line.bonusQuantity})` : ''} x Rs.{line.unitPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>{line.discountPercent ? `Disc: ${line.discountPercent}%` : ''}</span>
                <span>Rs. {line.lineTotal.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Totals Summary */}
        <div className="space-y-0.5 border-b border-dashed border-black pb-2 text-[9px]">
          <div className="flex justify-between">
            <span>Gross Total:</span>
            <span>Rs. {invoice.subtotal.toFixed(2)}</span>
          </div>
          {invoice.totalDiscount > 0 && (
            <div className="flex justify-between">
              <span>Total Discount:</span>
              <span>- Rs. {invoice.totalDiscount.toFixed(2)}</span>
            </div>
          )}
          {invoice.totalTax > 0 && (
            <div className="flex justify-between">
              <span>Sales Tax:</span>
              <span>+ Rs. {invoice.totalTax.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-[11px] border-t border-black pt-1">
            <span>NET AMOUNT:</span>
            <span>Rs. {invoice.grandTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Amount Paid:</span>
            <span>Rs. {invoice.amountPaid.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>Balance Due:</span>
            <span>Rs. {invoice.balanceDue.toFixed(2)}</span>
          </div>
        </div>

        {/* Configurable Footer Notes */}
        {invoice.footerNotes && (
          <div className="text-center text-[8px] italic pt-1 border-t border-dotted border-black whitespace-pre-wrap">
            {invoice.footerNotes}
          </div>
        )}

        <div className="text-center text-[8px] pt-1">
          Thank you for your business.
        </div>
      </div>
    );
  }

  // A4 Standard Layout
  return (
    <div className="w-full max-w-4xl mx-auto bg-white text-black p-8 font-sans text-xs print:p-0 print:max-w-none print:w-full space-y-6">
      {/* Header & Distributor Letterhead */}
      <div className="flex justify-between items-start border-b-2 border-brand-800 pb-4">
        <div className="space-y-1 max-w-[60%]">
          <h1 className="text-xl font-bold uppercase tracking-tight text-brand-900">
            {company.legalName || company.name}
          </h1>
          <p className="text-gray-600 text-[11px] leading-snug">
            {company.address}{company.city ? `, ${company.city}` : ''}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-gray-700 pt-0.5">
            {company.phone && <span><strong>Tel:</strong> {company.phone}</span>}
            {company.email && <span><strong>Email:</strong> {company.email}</span>}
            {company.ntn && <span><strong>NTN:</strong> {company.ntn}</span>}
            {company.strn && <span><strong>STRN:</strong> {company.strn}</span>}
            {company.drugSaleLicenseNo && (
              <span><strong>Drug Sale Lic #:</strong> {company.drugSaleLicenseNo}</span>
            )}
          </div>
        </div>

        <div className="text-right space-y-1">
          <span className="inline-block px-3 py-1 bg-brand-900 text-white font-bold text-sm tracking-wider uppercase rounded-sm">
            SALES INVOICE
          </span>
          <div className="font-mono text-sm font-bold text-gray-900 pt-1">
            {invoice.invoiceNumber}
          </div>
          <div className="text-gray-600 text-[11px]">
            <strong>Date:</strong> {invoice.invoiceDate}
          </div>
          {invoice.dueDate && (
            <div className="text-gray-600 text-[11px]">
              <strong>Due Date:</strong> {invoice.dueDate}
            </div>
          )}
          {invoice.salesmanName && (
            <div className="text-gray-600 text-[11px]">
              <strong>Salesman:</strong> {invoice.salesmanName}
            </div>
          )}
        </div>
      </div>

      {/* Bill To & Dispatch Details */}
      <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 border border-gray-200 rounded">
        <div>
          <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
            Billed To Customer:
          </span>
          <div className="text-sm font-bold text-gray-900 mt-0.5">
            {invoice.customer.name}
          </div>
          {invoice.customer.code && (
            <div className="text-gray-600 text-[11px]">Customer Code: {invoice.customer.code}</div>
          )}
          {invoice.customer.address && (
            <div className="text-gray-600 text-[11px]">
              {invoice.customer.address}{invoice.customer.city ? `, ${invoice.customer.city}` : ''}
            </div>
          )}
          <div className="flex flex-wrap gap-x-3 text-[11px] text-gray-700 mt-1">
            {invoice.customer.phone && <span><strong>Phone:</strong> {invoice.customer.phone}</span>}
            {invoice.customer.ntn && <span><strong>NTN:</strong> {invoice.customer.ntn}</span>}
            {invoice.customer.drugSaleLicenseNo && (
              <span><strong>DSL #:</strong> {invoice.customer.drugSaleLicenseNo}</span>
            )}
          </div>
        </div>

        <div className="text-right space-y-1 text-[11px]">
          <div><strong>Payment Terms:</strong> {invoice.paymentTerms || 'Cash / Credit'}</div>
          {invoice.orderNumber && <div><strong>Order Ref #:</strong> {invoice.orderNumber}</div>}
          {invoice.branchName && <div><strong>Fulfillment Branch:</strong> {invoice.branchName}</div>}
          <div>
            <strong>Status:</strong>{' '}
            <span className="font-semibold uppercase">{invoice.status}</span>
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-brand-900 text-white text-[10px] uppercase font-semibold">
            <th className="py-2 px-2 border border-brand-950 w-8 text-center">#</th>
            <th className="py-2 px-2 border border-brand-950">Product Name / SKU</th>
            <th className="py-2 px-2 border border-brand-950">Batch #</th>
            <th className="py-2 px-2 border border-brand-950">Expiry</th>
            <th className="py-2 px-2 border border-brand-950 text-right">Qty</th>
            <th className="py-2 px-2 border border-brand-950 text-right">Bonus</th>
            <th className="py-2 px-2 border border-brand-950 text-right">Rate/TP</th>
            <th className="py-2 px-2 border border-brand-950 text-right">Disc %</th>
            <th className="py-2 px-2 border border-brand-950 text-right">Tax %</th>
            <th className="py-2 px-2 border border-brand-950 text-right">Total (Rs.)</th>
          </tr>
        </thead>
        <tbody className="text-[11px] divide-y divide-gray-200">
          {invoice.lines.map((line, index) => (
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
              <td className="py-1.5 px-2 border border-gray-200 font-mono text-gray-800">
                {line.expiryDate}
              </td>
              <td className="py-1.5 px-2 border border-gray-200 text-right font-mono font-semibold">
                {line.quantity}
              </td>
              <td className="py-1.5 px-2 border border-gray-200 text-right font-mono text-gray-600">
                {line.bonusQuantity || 0}
              </td>
              <td className="py-1.5 px-2 border border-gray-200 text-right font-mono">
                {line.unitPrice.toFixed(2)}
              </td>
              <td className="py-1.5 px-2 border border-gray-200 text-right font-mono text-gray-600">
                {line.discountPercent ? `${line.discountPercent}%` : '-'}
              </td>
              <td className="py-1.5 px-2 border border-gray-200 text-right font-mono text-gray-600">
                {line.salesTaxPercent ? `${line.salesTaxPercent}%` : '-'}
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
          {invoice.notes && (
            <div className="p-2.5 rounded bg-gray-50 border border-gray-200 text-[11px] text-gray-700">
              <strong>Invoice Remarks:</strong> {invoice.notes}
            </div>
          )}

          {invoice.termsAndConditions && (
            <div className="p-2.5 rounded bg-gray-50 border border-gray-200 text-[10px] text-gray-600 space-y-1">
              <strong className="text-gray-800">Terms & Conditions:</strong>
              <div className="whitespace-pre-wrap">{invoice.termsAndConditions}</div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-8 pt-8 text-center text-[10px] text-gray-600">
            <div className="border-t border-gray-400 pt-1">Prepared / Dispatched By</div>
            <div className="border-t border-gray-400 pt-1">Customer Stamp & Signature</div>
          </div>
        </div>

        <div className="col-span-5">
          <div className="border border-gray-200 rounded p-3 bg-gray-50/50 space-y-1.5 text-[11px]">
            <div className="flex justify-between text-gray-700">
              <span>Gross Subtotal:</span>
              <span className="font-mono font-semibold">Rs. {invoice.subtotal.toFixed(2)}</span>
            </div>
            {invoice.totalDiscount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Total Discount:</span>
                <span className="font-mono font-semibold">- Rs. {invoice.totalDiscount.toFixed(2)}</span>
              </div>
            )}
            {invoice.totalTax > 0 && (
              <div className="flex justify-between text-gray-700">
                <span>Sales Tax (GST):</span>
                <span className="font-mono font-semibold">+ Rs. {invoice.totalTax.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm text-brand-950 border-t border-gray-300 pt-1.5">
              <span>Invoice Total:</span>
              <span className="font-mono">Rs. {invoice.grandTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-700 border-t border-gray-200 pt-1">
              <span>Amount Paid / Receipt:</span>
              <span className="font-mono">Rs. {invoice.amountPaid.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-xs text-rose-700">
              <span>Balance Due:</span>
              <span className="font-mono">Rs. {invoice.balanceDue.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Configurable Footer Notes */}
      {invoice.footerNotes && (
        <div className="text-center text-[10px] text-gray-500 pt-4 border-t border-gray-200 italic whitespace-pre-wrap">
          {invoice.footerNotes}
        </div>
      )}
    </div>
  );
};
