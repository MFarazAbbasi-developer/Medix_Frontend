import React from 'react';
import { PrintableTillSession, PrintLayoutType } from '../types';

interface TillCloseSlipTemplateProps {
  data: PrintableTillSession;
  layout?: PrintLayoutType;
}

export const TillCloseSlipTemplate: React.FC<TillCloseSlipTemplateProps> = ({
  data,
  layout = 'THERMAL',
}) => {
  const { company, branch, session } = data || ({} as any);
  const financials = session?.financials || ({} as any);

  const isThermal = layout === 'THERMAL';
  const formatCurrency = (amount?: number | null) =>
    `PKR ${(Number(amount) || 0).toLocaleString('en-PK', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const formatShortDate = (dateStr?: string | null) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return `${d.toLocaleDateString('en-PK', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
      })} ${d.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return dateStr;
    }
  };

  const openingCash = Number(financials.openingCash ?? 0);
  const cashSales = Number(financials.cashSalesAmount ?? financials.cashSales ?? 0);
  const cashCollections = Number(financials.cashPaymentsAmount ?? financials.cashCollections ?? 0);
  const cashIn = Number(financials.cashInAmount ?? financials.cashIn ?? 0);
  const cashRefunds = Number(financials.cashRefundsAmount ?? financials.cashRefunds ?? 0);
  const cashOut = Number(financials.cashOutAmount ?? financials.cashOut ?? 0);
  const expectedCash = Number(financials.expectedCash ?? 0);
  const actualCash = Number(financials.actualCash ?? financials.countedCash ?? 0);
  const varianceAmount = Number(financials.varianceAmount ?? financials.variance ?? 0);
  const varianceReason = session?.approval?.varianceReason || session?.varianceReason || (session as any)?.varianceJustification;
  const approvedBy = session?.approval?.approvedBy || (session as any)?.approvedBy;

  // ==========================================
  // 1. 80mm THERMAL PRINT SLIP
  // ==========================================
  if (isThermal) {
    return (
      <div
        className="till-thermal-slip bg-white text-slate-900 mx-auto font-mono text-[11px] leading-tight"
        style={{ width: '76mm', padding: '2mm' }}
      >
        {/* Header */}
        <div className="text-center pb-2 mb-2 border-b border-dashed border-slate-400">
          <h1 className="text-sm font-bold uppercase tracking-wider">{company?.name || 'MEDIX PHARMACY'}</h1>
          {company?.address && <p className="text-[10px] text-slate-600">{company.address}</p>}
          <p className="text-[10px] text-slate-600">
            {branch?.name || 'Main Branch'} {branch?.phone ? `| Tel: ${branch.phone}` : ''}
          </p>
          <div className="inline-block bg-slate-100 font-bold uppercase px-2 py-0.5 mt-1 text-[11px] border border-slate-300">
            TILL CLOSE SLIP ({session?.sessionNumber || 'CS-00000'})
          </div>
        </div>

        {/* Session Metadata */}
        <div className="space-y-0.5 pb-2 mb-2 border-b border-dashed border-slate-300 text-[10px]">
          <div className="flex justify-between">
            <span className="text-slate-500">Cashier:</span>
            <span className="font-bold">{session?.cashier?.displayName || 'Cashier'}</span>
          </div>
          {session?.stationName && (
            <div className="flex justify-between">
              <span className="text-slate-500">Station / Till:</span>
              <span>{session.stationName}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-slate-500">Status:</span>
            <span className="font-bold">{session?.status || 'CLOSED'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Opened:</span>
            <span>{formatShortDate(session?.openedAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Closed:</span>
            <span>{formatShortDate(session?.closedAt)}</span>
          </div>
        </div>

        {/* Cash Drawer Flow Table */}
        <div className="pb-2 mb-2 border-b border-dashed border-slate-300 space-y-1">
          <div className="font-bold text-[10px] uppercase tracking-wide text-slate-700">
            Cash Drawer Breakdown
          </div>
          <div className="flex justify-between">
            <span>Opening Cash Float:</span>
            <span className="font-medium">{formatCurrency(openingCash)}</span>
          </div>
          <div className="flex justify-between text-emerald-700">
            <span>(+) Cash Sales:</span>
            <span className="font-medium">+{formatCurrency(cashSales)}</span>
          </div>
          <div className="flex justify-between text-emerald-700">
            <span>(+) Cash Collections:</span>
            <span className="font-medium">+{formatCurrency(cashCollections)}</span>
          </div>
          {cashIn > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span>(+) Cash In (Top-up):</span>
              <span className="font-medium">+{formatCurrency(cashIn)}</span>
            </div>
          )}
          {cashRefunds > 0 && (
            <div className="flex justify-between text-rose-700">
              <span>(-) Cash Refunds:</span>
              <span className="font-medium">-{formatCurrency(cashRefunds)}</span>
            </div>
          )}
          {cashOut > 0 && (
            <div className="flex justify-between text-rose-700">
              <span>(-) Cash Out (Drops):</span>
              <span className="font-medium">-{formatCurrency(cashOut)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold pt-1 border-t border-slate-200">
            <span>Expected Cash:</span>
            <span>{formatCurrency(expectedCash)}</span>
          </div>
          <div className="flex justify-between font-bold text-slate-900">
            <span>Actual Counted Cash:</span>
            <span>{formatCurrency(actualCash)}</span>
          </div>
          <div
            className={`flex justify-between font-bold text-[11px] pt-1 border-t border-dashed border-slate-300 ${
              varianceAmount === 0
                ? 'text-slate-800'
                : varianceAmount < 0
                ? 'text-rose-700'
                : 'text-emerald-700'
            }`}
          >
            <span>
              Variance (
              {varianceAmount === 0
                ? 'Balanced'
                : varianceAmount < 0
                ? 'Shortage'
                : 'Surplus'}
              ):
            </span>
            <span>{formatCurrency(varianceAmount)}</span>
          </div>
          {varianceReason && (
            <div className="text-[10px] text-slate-600 mt-1 p-1 bg-slate-50 border border-slate-200 rounded">
              <span className="font-bold text-slate-800">VARIANCE DETAILS:</span> {varianceReason}
              {approvedBy && (
                <div className="text-[9px] text-slate-500 mt-0.5">
                  Approved By: <span className="font-semibold text-slate-700">{approvedBy}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Non-Cash Tenders Summary */}
        <div className="pb-2 mb-2 border-b border-dashed border-slate-300 space-y-0.5 text-[10px]">
          <div className="font-bold text-[10px] uppercase text-slate-700">Non-Cash Tenders</div>
          <div className="flex justify-between">
            <span>Card Payments:</span>
            <span>{formatCurrency(financials.cardSalesAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span>Bank / Online:</span>
            <span>{formatCurrency(financials.bankSalesAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span>Cheque Sales:</span>
            <span>{formatCurrency(financials.chequeSalesAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span>Credit Account Sales:</span>
            <span>{formatCurrency(financials.creditSalesAmount)}</span>
          </div>
        </div>

        {/* Denominations Count Summary (if recorded) */}
        {session?.denominations && session.denominations.length > 0 && (
          <div className="pb-2 mb-2 border-b border-dashed border-slate-300 text-[10px]">
            <div className="font-bold uppercase text-slate-700 mb-1">Denomination Count</div>
            <div className="grid grid-cols-3 gap-1 text-[9px] text-slate-600">
              {session.denominations.map((d: any, i: number) => (
                <div key={i} className="flex justify-between border-b border-slate-100 py-0.5">
                  <span>Rs.{d.denominationValue || d.denomination}:</span>
                  <span className="font-bold text-slate-800">x{d.noteCount || d.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Signatures */}
        <div className="pt-3 pb-1 text-[9px] text-center space-y-4">
          <div className="flex justify-between items-end px-2">
            <div className="text-center">
              <div className="w-20 border-b border-slate-400 mb-1"></div>
              <span>Cashier Signature</span>
            </div>
            <div className="text-center">
              <div className="w-20 border-b border-slate-400 mb-1"></div>
              <span>Supervisor / Manager</span>
            </div>
          </div>
          <p className="text-[8px] text-slate-400">
            Medix Pharma Distribution Suite | Farmax
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // 2. A4 MANAGEMENT RECONCILIATION REPORT
  // ==========================================
  return (
    <div className="till-a4-report bg-white text-slate-900 p-8 max-w-[210mm] mx-auto font-sans text-xs">
      {/* Company & Header */}
      <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4 mb-6">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-wide text-slate-900">
            {company?.name || 'MEDIX PHARMACY'}
          </h1>
          {company?.legalName && (
            <p className="text-xs text-slate-600 font-medium">{company.legalName}</p>
          )}
          <p className="text-xs text-slate-500 mt-1">{company?.address}</p>
          <p className="text-xs text-slate-500">
            Branch: <span className="font-semibold text-slate-700">{branch?.name || 'Main'} ({branch?.code || 'BR-01'})</span>
            {branch?.phone ? ` | Tel: ${branch.phone}` : ''}
          </p>
        </div>
        <div className="text-right">
          <div className="inline-block bg-slate-900 text-white font-bold px-3 py-1 text-sm rounded uppercase tracking-wider mb-2">
            DAY-END TILL CASH RECONCILIATION
          </div>
          <p className="font-mono font-bold text-slate-800 text-sm">
            Session: {session?.sessionNumber || 'CS-00000'}
          </p>
          <p className="text-slate-500 text-xs">
            Business Date: <span className="font-semibold text-slate-700">{session?.businessDate || 'Today'}</span>
          </p>
        </div>
      </div>

      {/* Session Metadata Grid */}
      <div className="bg-slate-50 border border-slate-200 rounded p-4 mb-6 grid grid-cols-4 gap-4">
        <div>
          <span className="block text-slate-500 text-[11px]">Assigned Cashier:</span>
          <span className="font-bold text-slate-900">{session?.cashier?.displayName || 'Cashier'}</span>
          <span className="block text-[10px] text-slate-400">@{session?.cashier?.username}</span>
        </div>
        <div>
          <span className="block text-slate-500 text-[11px]">Station / Terminal:</span>
          <span className="font-semibold text-slate-800">{session?.stationName || 'Default POS Terminal'}</span>
        </div>
        <div>
          <span className="block text-slate-500 text-[11px]">Session Timeline:</span>
          <span className="font-medium text-slate-700">Opened: {formatShortDate(session?.openedAt)}</span>
          <span className="block text-slate-700">Closed: {formatShortDate(session?.closedAt)}</span>
        </div>
        <div>
          <span className="block text-slate-500 text-[11px]">Session Status:</span>
          <span
            className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full mt-0.5 ${
              session?.status === 'OPEN'
                ? 'bg-emerald-100 text-emerald-800'
                : session?.status === 'COUNTED'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-slate-200 text-slate-800'
            }`}
          >
            {session?.status || 'CLOSED'}
          </span>
        </div>
      </div>

      {/* Main Reconciliation Comparison */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Left: Expected Cash Calculation */}
        <div className="border border-slate-200 rounded overflow-hidden">
          <div className="bg-slate-100 px-4 py-2 font-bold text-slate-800 border-b border-slate-200 uppercase text-[11px] tracking-wide">
            1. Authoritative Physical Cash Flow
          </div>
          <div className="p-4 space-y-2">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">Opening Cash Float:</span>
              <span className="font-semibold text-slate-800">
                {formatCurrency(openingCash)}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 text-emerald-700">
              <span>(+) POS Cash Sales:</span>
              <span className="font-semibold">+{formatCurrency(cashSales)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 text-emerald-700">
              <span>(+) Customer Cash Collections:</span>
              <span className="font-semibold">+{formatCurrency(cashCollections)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 text-emerald-700">
              <span>(+) Approved Cash-In Movements:</span>
              <span className="font-semibold">+{formatCurrency(cashIn)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 text-rose-700">
              <span>(-) Sales Cash Refunds:</span>
              <span className="font-semibold">-{formatCurrency(cashRefunds)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 text-rose-700">
              <span>(-) Approved Cash-Out Movements:</span>
              <span className="font-semibold">-{formatCurrency(cashOut)}</span>
            </div>
            <div className="flex justify-between py-2 pt-3 border-t-2 border-slate-800 font-bold text-sm text-slate-900">
              <span>Total Expected Cash:</span>
              <span>{formatCurrency(expectedCash)}</span>
            </div>
          </div>
        </div>

        {/* Right: Actual Physical Count & Variance */}
        <div className="border border-slate-200 rounded overflow-hidden">
          <div className="bg-slate-100 px-4 py-2 font-bold text-slate-800 border-b border-slate-200 uppercase text-[11px] tracking-wide">
            2. Cash Count & Variance Audit
          </div>
          <div className="p-4 space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-slate-200">
              <span className="font-bold text-slate-700">Actual Physical Count:</span>
              <span className="text-base font-extrabold text-slate-900">
                {formatCurrency(actualCash)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-200">
              <span className="font-bold text-slate-700">Expected Amount:</span>
              <span className="text-base font-medium text-slate-600">
                {formatCurrency(expectedCash)}
              </span>
            </div>
            <div
              className={`flex justify-between items-center p-3 rounded border font-bold text-sm ${
                varianceAmount === 0
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : varianceAmount < 0
                  ? 'bg-rose-50 border-rose-300 text-rose-800'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-800'
              }`}
            >
              <span>
                Net Variance:{' '}
                {varianceAmount === 0
                  ? 'EXACT MATCH'
                  : varianceAmount < 0
                  ? 'SHORTAGE'
                  : 'SURPLUS'}
              </span>
              <span>{formatCurrency(varianceAmount)}</span>
            </div>
            {varianceReason && (
              <div className="bg-slate-50 border border-slate-200 p-3 rounded text-xs text-slate-700">
                <span className="font-bold block text-slate-800 mb-0.5">
                  Variance Justification / Explanation:
                </span>
                {varianceReason}
              </div>
            )}
            {session?.notes && (
              <div className="text-xs text-slate-600">
                <span className="font-semibold">Closing Notes:</span> {session.notes}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Non-Cash Tenders Summary Grid */}
      <div className="border border-slate-200 rounded overflow-hidden mb-6">
        <div className="bg-slate-100 px-4 py-2 font-bold text-slate-800 border-b border-slate-200 uppercase text-[11px] tracking-wide">
          3. Non-Cash Tender Collections (Informational Tenders)
        </div>
        <div className="grid grid-cols-4 divide-x divide-slate-200 p-3 text-center">
          <div>
            <span className="block text-[10px] text-slate-500 uppercase font-semibold">
              Card Payments
            </span>
            <span className="font-bold text-slate-800 text-sm">
              {formatCurrency(financials.cardSalesAmount)}
            </span>
          </div>
          <div>
            <span className="block text-[10px] text-slate-500 uppercase font-semibold">
              Bank / Online Transfer
            </span>
            <span className="font-bold text-slate-800 text-sm">
              {formatCurrency(financials.bankSalesAmount)}
            </span>
          </div>
          <div>
            <span className="block text-[10px] text-slate-500 uppercase font-semibold">
              Cheques Received
            </span>
            <span className="font-bold text-slate-800 text-sm">
              {formatCurrency(financials.chequeSalesAmount)}
            </span>
          </div>
          <div>
            <span className="block text-[10px] text-slate-500 uppercase font-semibold">
              Customer Credit Billed
            </span>
            <span className="font-bold text-slate-800 text-sm">
              {formatCurrency(financials.creditSalesAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* Audited Physical Cash Breakdown */}
      {session?.denominations && session.denominations.length > 0 && (
        <div className="border border-slate-200 rounded overflow-hidden mb-6">
          <div className="bg-slate-100 px-4 py-2 font-bold text-slate-800 border-b border-slate-200 uppercase text-[11px] tracking-wide">
            Audited Physical Cash Breakdown
          </div>
          <div className="grid grid-cols-3 gap-2 p-3 text-xs">
            {session.denominations.map((d: any, i: number) => (
              <div
                key={i}
                className="flex justify-between items-center bg-slate-50 border border-slate-200 px-3 py-1.5 rounded"
              >
                <span className="font-bold text-slate-700">Rs. {d.denominationValue || d.denomination}</span>
                <span className="text-slate-500 font-mono">x {d.noteCount || d.count} notes</span>
                <span className="font-semibold text-slate-900">{formatCurrency(d.totalAmount || d.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Intra-day Cash Movements Log (if any) */}
      {session?.movements && session.movements.length > 0 && (
        <div className="border border-slate-200 rounded overflow-hidden mb-6">
          <div className="bg-slate-100 px-4 py-2 font-bold text-slate-800 border-b border-slate-200 uppercase text-[11px] tracking-wide">
            Cash-In & Cash-Out Movements
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="py-1.5 px-3">Type</th>
                <th className="py-1.5 px-3">Amount</th>
                <th className="py-1.5 px-3">Reason / Justification</th>
                <th className="py-1.5 px-3">Performed By</th>
                <th className="py-1.5 px-3">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {session.movements.map((m: any, idx: number) => (
                <tr key={idx}>
                  <td className="py-1.5 px-3">
                    <span
                      className={`inline-block font-bold text-[10px] px-1.5 py-0.5 rounded ${
                        m.type === 'CASH_IN'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {m.type}
                    </span>
                  </td>
                  <td className="py-1.5 px-3 font-mono font-semibold">
                    {formatCurrency(m.amount)}
                  </td>
                  <td className="py-1.5 px-3 text-slate-700">{m.reason}</td>
                  <td className="py-1.5 px-3 text-slate-600">{m.performedBy}</td>
                  <td className="py-1.5 px-3 text-slate-500 font-mono text-[11px]">
                    {formatShortDate(m.timestamp)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Signature Signoff Section */}
      <div className="grid grid-cols-3 gap-8 pt-8 mt-6 border-t border-slate-200">
        <div className="text-center">
          <div className="border-b border-slate-400 pb-12 mb-2"></div>
          <p className="font-bold text-slate-800">{session?.cashier?.displayName || 'Cashier'}</p>
          <p className="text-[10px] text-slate-500">Cashier / Operator Signature</p>
        </div>
        <div className="text-center">
          <div className="border-b border-slate-400 pb-12 mb-2"></div>
          <p className="font-bold text-slate-800">
            {approvedBy || 'Supervisor / Manager'}
          </p>
          <p className="text-[10px] text-slate-500">Audited & Verified By</p>
        </div>
        <div className="text-center">
          <div className="border-b border-slate-400 pb-12 mb-2"></div>
          <p className="font-bold text-slate-800">Branch Accountant</p>
          <p className="text-[10px] text-slate-500">Ledger Posting Signoff</p>
        </div>
      </div>
    </div>
  );
};
