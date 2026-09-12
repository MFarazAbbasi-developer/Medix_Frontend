import React from 'react';
import {
  PrintableSupplierReturnChallan,
  PrintableCompanyInfo,
  PrintLayoutType,
} from '../types';

interface SupplierReturnChallanPrintTemplateProps {
  challan: PrintableSupplierReturnChallan;
  company: PrintableCompanyInfo;
  layout: PrintLayoutType;
}

export const SupplierReturnChallanPrintTemplate: React.FC<SupplierReturnChallanPrintTemplateProps> = ({
  challan,
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
            SUPPLIER RETURN CHALLAN
          </div>
          <div className="text-[9px] text-gray-700">TRANSPORT / GATE PASS</div>
        </div>

        <div className="border-b border-dashed border-black pb-2 space-y-0.5 text-[9px]">
          <div className="flex justify-between">
            <span>Challan #: <strong>{challan.challanNumber}</strong></span>
            <span>Date: {challan.dispatchedAt ? challan.dispatchedAt.split('T')[0] : challan.returnDate}</span>
          </div>
          <div className="flex justify-between">
            <span>Return Ref #: {challan.returnNumber}</span>
            {challan.rgaNumber && <span>RGA: <strong>{challan.rgaNumber}</strong></span>}
          </div>
          {challan.originalGrnNumber && (
            <div>Original GRN #: {challan.originalGrnNumber}</div>
          )}
          <div>Supplier: <strong>{challan.supplier.name}</strong></div>
          {challan.reason && <div>Reason: {challan.reason}</div>}
        </div>

        <div className="border-b border-dashed border-black pb-2 space-y-1">
          <div className="flex justify-between font-bold border-b border-black text-[9px] pb-0.5">
            <span>Item / Batch / Expiry</span>
            <span>Qty (B+B)</span>
          </div>
          {challan.lines.map((line, idx) => (
            <div key={idx} className="space-y-0.5 text-[9px]">
              <div className="font-bold truncate">{line.productName}</div>
              <div className="flex justify-between text-gray-700">
                <span>B: {line.batchNumber} | Exp: {line.expiryDate ? line.expiryDate.split('T')[0] : 'N/A'}</span>
                <span>
                  {line.returnedQuantity}
                  {line.bonusReturnedQuantity ? ` + ${line.bonusReturnedQuantity}B` : ''}
                  {line.unitSymbol ? ` ${line.unitSymbol}` : ''}
                </span>
              </div>
              <div className="text-[8px] text-gray-600">
                Condition: {line.stockCondition} {line.sourceWarehouseName ? `(${line.sourceWarehouseName})` : ''}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-0.5 border-b border-dashed border-black pb-2 text-[9px]">
          <div className="flex justify-between">
            <span>Total Billed Qty:</span>
            <span>{challan.summary.totalBilledQuantity}</span>
          </div>
          {challan.summary.totalBonusQuantity > 0 && (
            <div className="flex justify-between">
              <span>Total Bonus Qty:</span>
              <span>{challan.summary.totalBonusQuantity}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-[10px] border-t border-black pt-1">
            <span>TOTAL PHYSICAL UNITS:</span>
            <span>{challan.summary.totalReturnedQuantity}</span>
          </div>
        </div>

        <div className="pt-2 text-[8px] text-center space-y-3">
          <div className="flex justify-between pt-4">
            <span className="border-t border-black px-2">Dispatched By</span>
            <span className="border-t border-black px-2">Receiver Stamp</span>
          </div>
          {challan.footerNotes && (
            <div className="italic pt-1 border-t border-dotted border-black whitespace-pre-wrap">
              {challan.footerNotes}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto bg-white text-black p-8 font-sans text-xs print:p-0 print:max-w-none print:w-full space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-emerald-900 pb-4">
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
            {company.drugSaleLicenseNo && <span><strong>D.S.L:</strong> {company.drugSaleLicenseNo}</span>}
          </div>
        </div>

        <div className="text-right space-y-1">
          <span className="inline-block px-3 py-1 bg-emerald-900 text-white font-bold text-sm tracking-wider uppercase rounded-sm">
            SUPPLIER RETURN CHALLAN
          </span>
          <div className="font-mono text-sm font-bold text-gray-900 pt-1">
            {challan.challanNumber}
          </div>
          <div className="text-[11px] text-gray-600">
            Dispatch Gate Pass
          </div>
        </div>
      </div>

      {/* Meta Grid */}
      <div className="grid grid-cols-2 gap-4 bg-gray-50 border border-gray-200 rounded-sm p-3 text-[11px]">
        <div className="space-y-1 border-r border-gray-200 pr-3">
          <div className="font-bold text-gray-800 uppercase tracking-wider text-[10px] text-emerald-950">
            Return Delivery To (Supplier)
          </div>
          <div className="font-bold text-gray-900 text-sm">{challan.supplier.name}</div>
          {challan.supplier.code && <div className="text-gray-600">Code: {challan.supplier.code}</div>}
          {challan.supplier.address && <div className="text-gray-600">{challan.supplier.address}</div>}
          {challan.supplier.phone && <div className="text-gray-600">Tel: {challan.supplier.phone}</div>}
        </div>

        <div className="space-y-1 pl-1">
          <div className="flex justify-between">
            <span className="text-gray-600">Challan Number:</span>
            <span className="font-bold">{challan.challanNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Return Document #:</span>
            <span className="font-bold">{challan.returnNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Dispatch Date:</span>
            <span>{challan.dispatchedAt ? challan.dispatchedAt.split('T')[0] : challan.returnDate}</span>
          </div>
          {challan.rgaNumber && (
            <div className="flex justify-between bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200">
              <span className="text-emerald-900 font-semibold">Vendor RGA / RMA #:</span>
              <span className="font-bold text-emerald-950">{challan.rgaNumber}</span>
            </div>
          )}
          {challan.originalGrnNumber && (
            <div className="flex justify-between">
              <span className="text-gray-600">Original GRN #:</span>
              <span>{challan.originalGrnNumber}</span>
            </div>
          )}
          {challan.reason && (
            <div className="flex justify-between">
              <span className="text-gray-600">Return Reason:</span>
              <span className="font-medium text-gray-800">{challan.reason}</span>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <table className="w-full border-collapse border border-gray-300 text-[11px]">
        <thead>
          <tr className="bg-emerald-950 text-white font-semibold">
            <th className="border border-emerald-900 p-2 text-center w-8">#</th>
            <th className="border border-emerald-900 p-2 text-left">Product / Description</th>
            <th className="border border-emerald-900 p-2 text-left">Batch #</th>
            <th className="border border-emerald-900 p-2 text-center">Expiry</th>
            <th className="border border-emerald-900 p-2 text-center">Condition</th>
            <th className="border border-emerald-900 p-2 text-right">Billed Qty</th>
            <th className="border border-emerald-900 p-2 text-right">Bonus Qty</th>
            <th className="border border-emerald-900 p-2 text-right">Total Units</th>
          </tr>
        </thead>
        <tbody>
          {challan.lines.map((line, index) => (
            <tr key={index} className={index % 2 === 1 ? 'bg-gray-50' : 'bg-white'}>
              <td className="border border-gray-300 p-2 text-center text-gray-500">{index + 1}</td>
              <td className="border border-gray-300 p-2">
                <div className="font-bold text-gray-900">{line.productName}</div>
                <div className="text-[10px] text-gray-500 flex gap-2">
                  <span>SKU: {line.productSku}</span>
                  {line.genericName && <span>| {line.genericName}</span>}
                  {line.packSize && <span>| Pack: {line.packSize}</span>}
                </div>
              </td>
              <td className="border border-gray-300 p-2 font-mono font-semibold">{line.batchNumber}</td>
              <td className="border border-gray-300 p-2 text-center font-mono">
                {line.expiryDate ? line.expiryDate.split('T')[0] : 'N/A'}
              </td>
              <td className="border border-gray-300 p-2 text-center">
                <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                  line.stockCondition === 'SALEABLE' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {line.stockCondition}
                </span>
              </td>
              <td className="border border-gray-300 p-2 text-right font-medium">{line.returnedQuantity}</td>
              <td className="border border-gray-300 p-2 text-right font-medium">{line.bonusReturnedQuantity || 0}</td>
              <td className="border border-gray-300 p-2 text-right font-bold text-gray-900">
                {line.totalQuantity} {line.unitSymbol || ''}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-gray-100 font-bold border-t-2 border-emerald-900">
            <td colSpan={5} className="border border-gray-300 p-2 text-right uppercase">
              Total Quantities:
            </td>
            <td className="border border-gray-300 p-2 text-right">{challan.summary.totalBilledQuantity}</td>
            <td className="border border-gray-300 p-2 text-right">{challan.summary.totalBonusQuantity}</td>
            <td className="border border-gray-300 p-2 text-right text-emerald-950 font-bold text-xs">
              {challan.summary.totalReturnedQuantity}
            </td>
          </tr>
        </tfoot>
      </table>

      {/* Notes & Signatures */}
      <div className="space-y-6 pt-4">
        {challan.notes && (
          <div className="text-[11px] bg-gray-50 border border-gray-200 p-2 rounded">
            <strong>Transport / Return Remarks:</strong> {challan.notes}
          </div>
        )}

        <div className="grid grid-cols-3 gap-6 text-center text-[10px] pt-8">
          <div>
            <div className="border-t border-gray-800 pt-1 font-semibold">Warehouse Officer / Dispatcher</div>
            <div className="text-gray-500">{challan.dispatchedByUser?.displayName || 'Authorized Signatory'}</div>
          </div>
          <div>
            <div className="border-t border-gray-800 pt-1 font-semibold">Driver / Transport Carrier</div>
            <div className="text-gray-500">Vehicle / Driver Signature</div>
          </div>
          <div>
            <div className="border-t border-gray-800 pt-1 font-semibold">Supplier Receiving Stamp & Signature</div>
            <div className="text-gray-500">Date & Physical Count Verified</div>
          </div>
        </div>
      </div>
    </div>
  );
};
