import React from 'react';
import {
  PrintableDeliveryChallan,
  PrintableCompanyInfo,
  PrintLayoutType,
} from '../types';

interface DeliveryChallanPrintTemplateProps {
  challan: PrintableDeliveryChallan;
  company?: PrintableCompanyInfo;
  layout: PrintLayoutType;
}

export const DeliveryChallanPrintTemplate: React.FC<DeliveryChallanPrintTemplateProps> = ({
  challan,
  company: propCompany,
  layout,
}) => {
  const company = propCompany || challan.company;
  const isThermal = layout === 'THERMAL';

  if (isThermal) {
    return (
      <div className="print-thermal-container bg-white text-black p-2 font-mono text-[10px] leading-tight space-y-2">
        {/* Thermal Header */}
        <div className="text-center border-b border-dashed border-black pb-2 space-y-0.5">
          <div className="font-bold text-xs uppercase">{company?.legalName || company?.name || 'MEDIX PHARMA'}</div>
          {company?.address && <div>{company.address}</div>}
          {company?.city && <div>{company.city}</div>}
          {company?.phone && <div>Tel: {company.phone}</div>}
          {company?.drugSaleLicenseNo && <div>DSL: {company.drugSaleLicenseNo}</div>}
          <div className="font-bold text-[11px] pt-1 border-t border-dotted border-black mt-1 uppercase">
            DELIVERY CHALLAN / DISPATCH NOTE
          </div>
          <div className="text-[8px] italic text-gray-700">
            * Operational Dispatch Document — Not an Invoice *
          </div>
        </div>

        {/* Challan & Destination Metadata */}
        <div className="border-b border-dashed border-black pb-2 space-y-0.5 text-[9px]">
          <div className="flex justify-between">
            <span>Challan #: <strong>{challan.challanNumber}</strong></span>
            <span>Event: #{challan.fulfillmentNumber}</span>
          </div>
          <div className="flex justify-between">
            <span>Date: {new Date(challan.fulfillmentDate).toLocaleDateString()}</span>
            <span>Time: {new Date(challan.fulfillmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="flex justify-between">
            <span>DO #: {challan.doNumber}</span>
            <span>Inv #: {challan.invoiceNumber}</span>
          </div>
          <div className="pt-1 border-t border-dotted border-black mt-1">
            <div>Customer: <strong>{challan.customer.name}</strong> {challan.customer.code ? `(${challan.customer.code})` : ''}</div>
            {challan.deliveryDestination.recipientName && (
              <div>Recipient: {challan.deliveryDestination.recipientName}</div>
            )}
            {challan.deliveryDestination.address && (
              <div>Address: {challan.deliveryDestination.address}{challan.deliveryDestination.city ? `, ${challan.deliveryDestination.city}` : ''}</div>
            )}
            {challan.deliveryDestination.phone && <div>Tel: {challan.deliveryDestination.phone}</div>}
            {challan.deliveryDestination.instructions && (
              <div className="font-semibold">Note: {challan.deliveryDestination.instructions}</div>
            )}
          </div>
          {(challan.salesAttribution.salesmanName || challan.salesAttribution.routeName) && (
            <div className="flex justify-between pt-0.5 text-[8px] text-gray-700">
              {challan.salesAttribution.salesmanName && <span>Salesman: {challan.salesAttribution.salesmanName}</span>}
              {challan.salesAttribution.routeName && <span>Route: {challan.salesAttribution.routeName}</span>}
            </div>
          )}
        </div>

        {/* Items List (Physical Quantities Only) */}
        <div className="border-b border-dashed border-black pb-2 space-y-1">
          <div className="flex justify-between font-bold border-b border-black text-[9px] pb-0.5">
            <span>Item / Batch / Exp</span>
            <span>Billed + Free = Total</span>
          </div>
          {challan.lines.map((line, idx) => (
            <div key={idx} className="space-y-0.5 text-[9px]">
              <div className="font-bold truncate">{line.productName}</div>
              <div className="flex justify-between text-gray-700 text-[8.5px]">
                <span>B: {line.batchNumber} | Exp: {new Date(line.expiryDate).toLocaleDateString()}</span>
                <span className="font-bold text-black">
                  {line.deliveredBilledQuantity}
                  {line.deliveredBonusQuantity > 0 ? ` + ${line.deliveredBonusQuantity}` : ''}
                  {' = '}{line.totalDispatchedQuantity}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Physical Totals Summary */}
        <div className="space-y-0.5 border-b border-dashed border-black pb-2 text-[9px]">
          <div className="flex justify-between">
            <span>Total Items:</span>
            <span>{challan.summary.totalLinesCount}</span>
          </div>
          <div className="flex justify-between">
            <span>Billed Units:</span>
            <span>{challan.summary.totalBilledQuantity}</span>
          </div>
          {challan.summary.totalBonusQuantity > 0 && (
            <div className="flex justify-between">
              <span>Free / Bonus Units:</span>
              <span>{challan.summary.totalBonusQuantity}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-[10px] border-t border-black pt-1">
            <span>TOTAL DISPATCHED UNITS:</span>
            <span>{challan.summary.totalDispatchedQuantity}</span>
          </div>
        </div>

        {/* Dispatch Notes */}
        {challan.notes && (
          <div className="text-[8px] italic text-gray-700 border-b border-dotted border-black pb-1">
            Dispatch Note: {challan.notes}
          </div>
        )}

        {/* Thermal Signatures */}
        <div className="pt-2 text-[9px] space-y-3">
          <div className="flex justify-between">
            <span>Dispatched By: <strong>{challan.dispatchedBy}</strong></span>
          </div>
          <div className="pt-4 border-t border-dotted border-black flex justify-between items-end">
            <span>Receiver's Sign & Stamp:</span>
            <span className="border-b border-black w-24 inline-block"></span>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // A4 STANDARD PRINT LAYOUT
  // =========================================================================
  return (
    <div className="print-a4-container bg-white text-charcoal-900 p-8 text-xs leading-normal font-sans max-w-4xl mx-auto shadow-sm print:shadow-none print:p-0">
      {/* 1. Official Header & Document Type */}
      <div className="flex justify-between items-start border-b-2 border-brand-700 pb-4 mb-4">
        <div>
          <h1 className="text-xl font-black tracking-tight text-brand-900 uppercase">
            {company?.legalName || company?.name || 'MEDIX PHARMACEUTICAL DISTRIBUTORS'}
          </h1>
          <div className="text-xs text-charcoal-600 mt-1 space-y-0.5">
            {company?.address && <div>{company.address}{company.city ? `, ${company.city}` : ''}</div>}
            <div className="flex gap-4">
              {company?.phone && <span><strong>Tel:</strong> {company.phone}</span>}
              {company?.email && <span><strong>Email:</strong> {company.email}</span>}
            </div>
            <div className="flex gap-4">
              {company?.ntn && <span><strong>NTN:</strong> {company.ntn}</span>}
              {company?.drugSaleLicenseNo && <span><strong>DSL #:</strong> {company.drugSaleLicenseNo}</span>}
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="inline-block bg-brand-50 border-2 border-brand-700 text-brand-900 px-3.5 py-1.5 rounded-lg text-sm font-black uppercase tracking-wider">
            DELIVERY CHALLAN
          </div>
          <div className="text-[11px] font-bold text-charcoal-500 mt-1 uppercase tracking-wider">
            DISPATCH NOTE & GATE PASS
          </div>
          <div className="mt-2 text-xs font-mono">
            <div>Challan #: <strong className="text-sm text-brand-900">{challan.challanNumber}</strong></div>
            <div className="text-charcoal-600">Event #{challan.fulfillmentNumber}</div>
            <div className="text-charcoal-600">Date: {new Date(challan.fulfillmentDate).toLocaleDateString()} {new Date(challan.fulfillmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        </div>
      </div>

      {/* 2. Destination Snapshot vs Sales Attribution & Order Meta */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
        {/* Delivery Destination Snapshot */}
        <div className="p-3 bg-surface-muted/30 border border-surface-border rounded-lg space-y-1">
          <div className="text-[10px] font-bold text-brand-700 uppercase tracking-wider">
            Consignee & Delivery Destination
          </div>
          <div className="font-bold text-sm text-charcoal-900">
            {challan.customer.name}
            {challan.customer.code && (
              <span className="text-xs font-normal text-charcoal-500 ml-1.5">
                ({challan.customer.code})
              </span>
            )}
          </div>
          <div className="text-charcoal-700">
            {challan.deliveryDestination.address || 'Standard Delivery Site'}
            {challan.deliveryDestination.city ? `, ${challan.deliveryDestination.city}` : ''}
          </div>
          {challan.deliveryDestination.recipientName && (
            <div className="text-charcoal-600">
              <span className="text-charcoal-400">Recipient:</span> {challan.deliveryDestination.recipientName}
              {challan.deliveryDestination.phone && ` (Tel: ${challan.deliveryDestination.phone})`}
            </div>
          )}
          {challan.deliveryDestination.instructions && (
            <div className="text-[11px] text-amber-800 bg-amber-50 p-1 rounded border border-amber-200/60 mt-1">
              <strong>Instructions:</strong> {challan.deliveryDestination.instructions}
            </div>
          )}
        </div>

        {/* Order Reference & Sales Attribution */}
        <div className="p-3 bg-surface-muted/30 border border-surface-border rounded-lg space-y-1">
          <div className="text-[10px] font-bold text-brand-700 uppercase tracking-wider">
            Order Reference & Sales Attribution
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
            <div>
              <span className="text-charcoal-400">DO Reference:</span>{' '}
              <strong className="font-mono text-charcoal-800">{challan.doNumber}</strong>
            </div>
            <div>
              <span className="text-charcoal-400">Sales Invoice:</span>{' '}
              <strong className="font-mono text-charcoal-800">{challan.invoiceNumber}</strong>
            </div>
            <div>
              <span className="text-charcoal-400">Invoice Date:</span>{' '}
              <span className="text-charcoal-700">{new Date(challan.invoiceDate).toLocaleDateString()}</span>
            </div>
            <div>
              <span className="text-charcoal-400">Branch:</span>{' '}
              <span className="text-charcoal-700">{challan.branch?.name || 'Head Office'}</span>
            </div>
            <div>
              <span className="text-charcoal-400">Salesman:</span>{' '}
              <span className="font-medium text-charcoal-800">
                {challan.salesAttribution.salesmanName || 'Direct'}
              </span>
            </div>
            <div>
              <span className="text-charcoal-400">Route / Area:</span>{' '}
              <span className="font-medium text-charcoal-800">
                {challan.salesAttribution.routeName || 'Standard'}
              </span>
            </div>
            <div className="col-span-2 pt-0.5">
              <span className="text-charcoal-400">Dispatched By:</span>{' '}
              <strong className="text-charcoal-800">{challan.dispatchedBy}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Items Dispatch Table (Physical Quantities Only) */}
      <div className="mb-4">
        <table className="w-full text-left border-collapse text-xs border border-surface-border">
          <thead>
            <tr className="bg-surface-muted/80 text-charcoal-700 border-b border-surface-border font-bold text-[10px] uppercase tracking-wider">
              <th className="py-2 px-2.5 w-8 text-center">#</th>
              <th className="py-2 px-2.5">Product Name & Generic</th>
              <th className="py-2 px-2.5 w-24">Pack / UOM</th>
              <th className="py-2 px-2.5 w-24">Batch #</th>
              <th className="py-2 px-2.5 w-20">Expiry</th>
              <th className="py-2 px-2.5 w-20 text-right">Billed Qty</th>
              <th className="py-2 px-2.5 w-20 text-right">Free Qty</th>
              <th className="py-2 px-2.5 w-24 text-right bg-brand-50/50 text-brand-900">Total Dispatched</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border/60">
            {challan.lines.map((line, idx) => (
              <tr key={idx} className="hover:bg-surface-muted/20">
                <td className="py-2 px-2.5 text-center text-charcoal-400 font-mono text-[11px]">
                  {line.itemNumber || idx + 1}
                </td>
                <td className="py-2 px-2.5">
                  <div className="font-bold text-charcoal-900">{line.productName}</div>
                  <div className="text-[10px] text-charcoal-500 font-mono">
                    {line.productSku} {line.genericName && `· ${line.genericName}`}
                  </div>
                </td>
                <td className="py-2 px-2.5 text-charcoal-700">
                  {line.packSize || line.unitOfMeasurement || '—'}
                </td>
                <td className="py-2 px-2.5 font-mono font-bold text-charcoal-800">
                  {line.batchNumber}
                </td>
                <td className="py-2 px-2.5 text-charcoal-600 font-mono text-[11px]">
                  {new Date(line.expiryDate).toLocaleDateString()}
                </td>
                <td className="py-2 px-2.5 text-right font-mono font-semibold text-charcoal-800">
                  {line.deliveredBilledQuantity}
                </td>
                <td className="py-2 px-2.5 text-right font-mono text-emerald-700 font-semibold">
                  {line.deliveredBonusQuantity > 0 ? `+${line.deliveredBonusQuantity}` : '—'}
                </td>
                <td className="py-2 px-2.5 text-right font-mono font-bold text-brand-900 bg-brand-50/30">
                  {line.totalDispatchedQuantity}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 4. Physical Totals Summary & Notes */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Notes & Operational Remarks */}
        <div className="p-3 bg-surface-muted/20 border border-surface-border rounded-lg text-xs space-y-1">
          <div className="text-[10px] font-bold text-charcoal-500 uppercase tracking-wider">
            Dispatch Remarks & Logistics Notes
          </div>
          <div className="text-charcoal-700 italic">
            {challan.notes || 'No specific dispatch remarks provided.'}
          </div>
        </div>

        {/* Physical Totals Box */}
        <div className="p-3 bg-surface-muted/30 border border-surface-border rounded-lg text-xs space-y-1.5">
          <div className="flex justify-between text-charcoal-600">
            <span>Total Item Lines:</span>
            <span className="font-mono font-semibold">{challan.summary.totalLinesCount}</span>
          </div>
          <div className="flex justify-between text-charcoal-600">
            <span>Total Billed Units:</span>
            <span className="font-mono font-semibold">{challan.summary.totalBilledQuantity}</span>
          </div>
          {challan.summary.totalBonusQuantity > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span>Total Bonus / Free Units:</span>
              <span className="font-mono font-semibold">+{challan.summary.totalBonusQuantity}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-bold text-brand-900 border-t border-surface-border pt-1.5">
            <span>GRAND TOTAL DISPATCHED:</span>
            <span className="font-mono">{challan.summary.totalDispatchedQuantity} Units</span>
          </div>
        </div>
      </div>

      {/* 5. Mandatory Business & Legal Disclaimer */}
      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] text-slate-600 text-center leading-relaxed mb-8">
        <strong>LEGAL NOTICE:</strong> This document is an operational <strong>Delivery Challan / Gate Pass</strong> issued solely for the physical transport and acknowledgment of goods. It does <strong>NOT</strong> constitute a Sales Tax Invoice, bill, or receipt of payment. Title of goods and financial liabilities are governed exclusively by the referenced Sales Invoice ({challan.invoiceNumber}).
      </div>

      {/* 6. Physical Blank Signature Blocks */}
      <div className="grid grid-cols-3 gap-6 pt-4 border-t border-surface-border text-center text-xs">
        <div>
          <div className="border-b border-charcoal-400 h-10 mb-1.5"></div>
          <div className="font-bold text-charcoal-800">Prepared By</div>
          <div className="text-[10px] text-charcoal-400">Warehouse Staff / Inventory</div>
        </div>
        <div>
          <div className="border-b border-charcoal-400 h-10 mb-1.5"></div>
          <div className="font-bold text-charcoal-800">Dispatched By / Driver</div>
          <div className="text-[10px] text-charcoal-400">Vehicle / Gate Pass Clear</div>
        </div>
        <div>
          <div className="border-b border-charcoal-400 h-10 mb-1.5"></div>
          <div className="font-bold text-charcoal-800">Received By & Stamp</div>
          <div className="text-[10px] text-charcoal-400">Customer Signature, Date & Stamp</div>
        </div>
      </div>
    </div>
  );
};
