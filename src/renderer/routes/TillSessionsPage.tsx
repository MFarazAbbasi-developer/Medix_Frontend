import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  tillSessionApi,
  TillSession,
  DenominationCountItem,
  TillMovementType,
} from '../api/till-session.api';
import { usePermission } from '../hooks/usePermission';
import { DocumentPrintModal, PrintableTillSession } from '../components/printing';
import { TillCloseSlipTemplate } from '../components/printing/templates';
import {
  Wallet,
  PlusCircle,
  ArrowUpRight,
  ArrowDownRight,
  Calculator,
  Printer,
  History,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Eye,
  Search,
  Filter,
} from 'lucide-react';

const STANDARD_PKR_DENOMINATIONS = [
  { value: 5000, label: 'Rs. 5,000' },
  { value: 1000, label: 'Rs. 1,000' },
  { value: 500, label: 'Rs. 500' },
  { value: 100, label: 'Rs. 100' },
  { value: 50, label: 'Rs. 50' },
  { value: 20, label: 'Rs. 20' },
  { value: 10, label: 'Rs. 10' },
  { value: 5, label: 'Rs. 5' },
  { value: 2, label: 'Rs. 2' },
  { value: 1, label: 'Rs. 1' },
];

export const TillSessionsPage: React.FC = () => {
  const [activeSession, setActiveSession] = useState<TillSession | null>(null);
  const [sessions, setSessions] = useState<TillSession[]>([]);
  const [loadingActive, setLoadingActive] = useState<boolean>(true);
  const [loadingList, setLoadingList] = useState<boolean>(false);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  );

  // Modals state
  const [showOpenModal, setShowOpenModal] = useState<boolean>(false);
  const [showMovementModal, setShowMovementModal] = useState<boolean>(false);
  const [showCloseModal, setShowCloseModal] = useState<boolean>(false);
  const [selectedSessionForDetails, setSelectedSessionForDetails] = useState<TillSession | null>(
    null,
  );
  const [printData, setPrintData] = useState<PrintableTillSession | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);

  // Form states
  const [openFloatInput, setOpenFloatInput] = useState<string>('0');
  const [openStationInput, setOpenStationInput] = useState<string>('');
  const [openNotesInput, setOpenNotesInput] = useState<string>('');

  const [movementType, setMovementType] = useState<TillMovementType>('CASH_IN');
  const [movementAmount, setMovementAmount] = useState<string>('');
  const [movementReason, setMovementReason] = useState<string>('');
  const [movementRef, setMovementRef] = useState<string>('');

  // Close / Counting form state
  const [countMode, setCountMode] = useState<'DENOMINATIONS' | 'DIRECT'>('DENOMINATIONS');
  const [denominationCounts, setDenominationCounts] = useState<Record<number, number>>({
    5000: 0,
    1000: 0,
    500: 0,
    100: 0,
    50: 0,
    20: 0,
    10: 0,
    5: 0,
    2: 0,
    1: 0,
  });
  const [looseCoinsInput, setLooseCoinsInput] = useState<string>('0');
  const [directActualCashInput, setDirectActualCashInput] = useState<string>('');
  const [varianceReasonInput, setVarianceReasonInput] = useState<string>('');
  const [closeNotesInput, setCloseNotesInput] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Permissions
  const { hasPermission } = usePermission();
  const canOpen = hasPermission('cash_sessions.open');
  const canAdjust = hasPermission('cash_sessions.adjust');
  const canCount = hasPermission('cash_sessions.count');
  const canClose = hasPermission('cash_sessions.close');
  const canApproveVariance = hasPermission('cash_sessions.approve_variance');

  const showToast = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4500);
  };

  const loadActiveSession = useCallback(async () => {
    try {
      setLoadingActive(true);
      const res = await tillSessionApi.getActiveSession();
      setActiveSession(res);
    } catch (err: any) {
      console.error('Failed to load active till session', err);
    } finally {
      setLoadingActive(false);
    }
  }, []);

  const loadSessionsRegister = useCallback(async () => {
    try {
      setLoadingList(true);
      const res = await tillSessionApi.getSessions({
        status: filterStatus === 'ALL' ? undefined : (filterStatus as any),
        limit: 100,
      });
      setSessions(res.items || []);
    } catch (err: any) {
      console.error('Failed to load till sessions register', err);
    } finally {
      setLoadingList(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    loadActiveSession();
    loadSessionsRegister();
  }, [loadActiveSession, loadSessionsRegister]);

  // Denomination total calculation
  const calculatedActualCash = useMemo(() => {
    if (countMode === 'DIRECT') {
      return Number(directActualCashInput) || 0;
    }
    let sum = Number(looseCoinsInput) || 0;
    for (const [val, count] of Object.entries(denominationCounts)) {
      sum += Number(val) * (Number(count) || 0);
    }
    return sum;
  }, [countMode, directActualCashInput, looseCoinsInput, denominationCounts]);

  const activeExpectedCash = activeSession ? Number(activeSession.expectedCash) : 0;
  const liveVariance = Math.round((calculatedActualCash - activeExpectedCash) * 100) / 100;
  const requiresVarianceApproval = Math.abs(liveVariance) > 500;

  // Handle Open Session
  const handleOpenSession = async (e: React.FormEvent) => {
    e.preventDefault();
    const floatVal = Number(openFloatInput);
    if (isNaN(floatVal) || floatVal < 0) {
      showToast('error', 'Please enter a valid opening cash float (>= 0)');
      return;
    }
    try {
      setSubmitting(true);
      await tillSessionApi.openSession({
        openingCash: floatVal,
        stationName: openStationInput.trim() || undefined,
        notes: openNotesInput.trim() || undefined,
      });
      showToast('success', 'Till session opened successfully');
      setShowOpenModal(false);
      setOpenFloatInput('0');
      setOpenStationInput('');
      setOpenNotesInput('');
      loadActiveSession();
      loadSessionsRegister();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to open till session');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Record Movement
  const handleRecordMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession) return;
    const amt = Number(movementAmount);
    if (isNaN(amt) || amt <= 0) {
      showToast('error', 'Please enter a valid movement amount (> 0)');
      return;
    }
    if (!movementReason.trim()) {
      showToast('error', 'A reason is mandatory for cash movement');
      return;
    }
    try {
      setSubmitting(true);
      await tillSessionApi.recordMovement(activeSession.id, {
        movementType,
        amount: amt,
        reason: movementReason.trim(),
        referenceNo: movementRef.trim() || undefined,
      });
      showToast('success', `Recorded ${movementType === 'CASH_IN' ? 'Cash-In' : 'Cash-Out'} successfully`);
      setShowMovementModal(false);
      setMovementAmount('');
      setMovementReason('');
      setMovementRef('');
      loadActiveSession();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to record movement');
    } finally {
      setSubmitting(false);
    }
  };

  // Build denominations payload
  const buildDenominationsPayload = (): DenominationCountItem[] => {
    const list: DenominationCountItem[] = [];
    for (const [valStr, count] of Object.entries(denominationCounts)) {
      const val = Number(valStr);
      const c = Number(count) || 0;
      if (c > 0) {
        list.push({
          denominationValue: val,
          noteCount: c,
          totalAmount: val * c,
        });
      }
    }
    const loose = Number(looseCoinsInput) || 0;
    if (loose > 0) {
      list.push({
        denominationValue: 1,
        noteCount: Math.round(loose),
        totalAmount: loose,
      });
    }
    return list;
  };

  // Handle Count (Save Interim Count)
  const handleSaveCount = async () => {
    if (!activeSession) return;
    try {
      setSubmitting(true);
      const denoms = countMode === 'DENOMINATIONS' ? buildDenominationsPayload() : undefined;
      await tillSessionApi.countSession(activeSession.id, {
        actualCash: calculatedActualCash,
        denominations: denoms,
        varianceReason: varianceReasonInput.trim() || undefined,
      });
      showToast('success', 'Physical count recorded. Session status set to COUNTED.');
      loadActiveSession();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to save count');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Final Close
  const handleFinalizeClose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession) return;

    if (liveVariance !== 0 && !varianceReasonInput.trim()) {
      showToast('error', 'A variance explanation reason is mandatory for any cash shortage or excess');
      return;
    }

    if (requiresVarianceApproval && !canApproveVariance) {
      showToast(
        'error',
        'Cash variance exceeds Rs. 500 threshold. Supervisor authorization permission (cash_sessions.approve_variance) is required.',
      );
      return;
    }

    try {
      setSubmitting(true);
      const denoms = countMode === 'DENOMINATIONS' ? buildDenominationsPayload() : undefined;
      await tillSessionApi.closeSession(activeSession.id, {
        actualCash: calculatedActualCash,
        denominations: denoms,
        varianceReason: varianceReasonInput.trim() || undefined,
        notes: closeNotesInput.trim() || undefined,
      });
      showToast('success', 'Till session finalized and closed successfully');
      setShowCloseModal(false);
      loadActiveSession();
      loadSessionsRegister();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to finalize till session');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Print Trigger
  const handlePrintSession = async (sessionId: string) => {
    try {
      const data = await tillSessionApi.getSessionPrintData(sessionId);
      setPrintData(data);
      setIsPrintModalOpen(true);
    } catch (err: any) {
      showToast('error', 'Failed to generate print data for session');
    }
  };

  const filteredSessions = sessions.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const cashierName = (s.user?.displayName || s.cashierUser?.displayName || '').toLowerCase();
    return (
      s.sessionNumber.toLowerCase().includes(q) ||
      cashierName.includes(q) ||
      (s.stationName && s.stationName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 text-sm font-medium ${
            feedback.type === 'success'
              ? 'bg-emerald-600 text-white'
              : 'bg-rose-600 text-white'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <AlertTriangle className="w-4 h-4" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
            <Wallet className="w-7 h-7 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Cash Reconciliation & Till Close</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Cashier shift management, intra-day cash drops, denomination counting, and variance audit
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              loadActiveSession();
              loadSessionsRegister();
            }}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          {!activeSession && canOpen && (
            <button
              onClick={() => setShowOpenModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Open New Till Session</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Session Card / KPIs */}
      {loadingActive ? (
        <div className="p-8 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
          Loading active till session...
        </div>
      ) : activeSession ? (
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white p-6 rounded-xl shadow-lg border border-slate-700">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center space-x-3">
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-xs font-bold tracking-wide uppercase">
                Active Session: {activeSession.status}
              </span>
              <span className="font-mono text-sm font-semibold text-slate-300">
                {activeSession.sessionNumber}
              </span>
              {activeSession.stationName && (
                <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                  {activeSession.stationName}
                </span>
              )}
            </div>

            <div className="flex space-x-2">
              {canAdjust && activeSession.status === 'OPEN' && (
                <button
                  onClick={() => setShowMovementModal(true)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-600 transition"
                >
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Cash In / Out</span>
                </button>
              )}
              {canClose && (
                <button
                  onClick={() => {
                    setDirectActualCashInput(String(activeSession.actualCash || activeExpectedCash));
                    setShowCloseModal(true);
                  }}
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold rounded-lg transition"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Count & Close Till</span>
                </button>
              )}
              <button
                onClick={() => handlePrintSession(activeSession.id)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-600 transition"
                title="Print Session"
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-slate-800/60 backdrop-blur p-4 rounded-xl border border-slate-700">
              <span className="text-xs text-slate-400 block font-medium">Opening Cash Float</span>
              <span className="text-xl font-bold text-white mt-1 block">
                PKR {Number(activeSession.openingCash).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5 block">Handed at shift start</span>
            </div>

            <div className="bg-slate-800/60 backdrop-blur p-4 rounded-xl border border-slate-700">
              <span className="text-xs text-emerald-400 block font-medium">(+) Cash Sales</span>
              <span className="text-xl font-bold text-emerald-300 mt-1 block">
                +PKR {Number(activeSession.cashSalesAmount ?? activeSession.cashSales ?? 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5 block">POS cash tenders</span>
            </div>

            <div className="bg-slate-800/60 backdrop-blur p-4 rounded-xl border border-slate-700">
              <span className="text-xs text-emerald-400 block font-medium">(+) Cash Collections</span>
              <span className="text-xl font-bold text-emerald-300 mt-1 block">
                +PKR {Number(activeSession.cashPaymentsAmount ?? activeSession.cashCollections ?? 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5 block">AR cash receipts</span>
            </div>

            <div className="bg-slate-800/60 backdrop-blur p-4 rounded-xl border border-slate-700">
              <span className="text-xs text-rose-400 block font-medium">(-) Refunds & Drops</span>
              <span className="text-xl font-bold text-rose-300 mt-1 block">
                -PKR {(Number(activeSession.cashRefundsAmount ?? activeSession.cashRefunds ?? 0) + Number(activeSession.cashOutAmount ?? activeSession.cashOut ?? 0)).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5 block">Returns & Safe Drops</span>
            </div>

            <div className="bg-emerald-950/80 backdrop-blur p-4 rounded-xl border border-emerald-500/40">
              <span className="text-xs text-emerald-300 block font-bold uppercase tracking-wider">
                Expected Drawer Cash
              </span>
              <span className="text-2xl font-black text-emerald-200 mt-1 block">
                PKR {activeExpectedCash.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-emerald-400/70 mt-0.5 block">Theoretical Cash Sum</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center space-y-3">
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Active Till Session Open</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Physical cash sales, AR cash collections, and cash refunds cannot be processed without an active till session. Open your till with your physical float to start transactions.
          </p>
          {canOpen && (
            <button
              onClick={() => setShowOpenModal(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Open Till Session</span>
            </button>
          )}
        </div>
      )}

      {/* Historical Till Sessions Register */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex justify-between items-center gap-4">
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-slate-600" />
            <h2 className="text-base font-bold text-slate-900">Till Session History & Audit Register</h2>
          </div>

          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search session #, cashier..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-lg p-1 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
              {(['ALL', 'OPEN', 'COUNTED', 'CLOSED'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-2.5 py-1 rounded-md font-medium transition ${
                    filterStatus === st
                      ? 'bg-white text-slate-900 shadow-sm font-semibold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Session Ref</th>
                <th className="py-3 px-4">Cashier</th>
                <th className="py-3 px-4">Station</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Opened At</th>
                <th className="py-3 px-4">Closed At</th>
                <th className="py-3 px-4 text-right">Opening Float</th>
                <th className="py-3 px-4 text-right">Expected Cash</th>
                <th className="py-3 px-4 text-right">Actual Count</th>
                <th className="py-3 px-4 text-right">Variance</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loadingList ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400">
                    Loading sessions...
                  </td>
                </tr>
              ) : filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400">
                    No till sessions found
                  </td>
                </tr>
              ) : (
                filteredSessions.map((s) => {
                  const variance = s.varianceAmount ? Number(s.varianceAmount) : 0;
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {s.sessionNumber}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {s.user?.displayName || s.cashierUser?.displayName || 'Cashier'}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{s.stationName || '—'}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            s.status === 'OPEN'
                              ? 'bg-emerald-100 text-emerald-800'
                              : s.status === 'COUNTED'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(s.openedAt).toLocaleDateString('en-PK', {
                          month: 'short',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {s.closedAt
                          ? new Date(s.closedAt).toLocaleDateString('en-PK', {
                              month: 'short',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono">
                        PKR {Number(s.openingCash).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold">
                        PKR {Number(s.expectedCash).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-mono">
                        {s.actualCash !== null && s.actualCash !== undefined
                          ? `PKR ${Number(s.actualCash).toLocaleString('en-PK', { minimumFractionDigits: 2 })}`
                          : '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        {s.status === 'CLOSED' ? (
                          <span
                            className={
                              variance === 0
                                ? 'text-slate-600'
                                : variance < 0
                                ? 'text-rose-600'
                                : 'text-emerald-600'
                            }
                          >
                            PKR {variance.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => setSelectedSessionForDetails(s)}
                            className="p-1 hover:bg-slate-200 text-slate-600 rounded transition"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handlePrintSession(s.id)}
                            className="p-1 hover:bg-slate-200 text-slate-600 rounded transition"
                            title="Print Close Slip"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================== */}
      {/* MODAL 1: OPEN NEW TILL SESSION             */}
      {/* ========================================== */}
      {showOpenModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Open New Till Session</h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter the exact physical cash float handed to start shift transactions.
            </p>

            <form onSubmit={handleOpenSession} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Opening Cash Float (PKR) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">
                    PKR
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={openFloatInput}
                    onChange={(e) => setOpenFloatInput(e.target.value)}
                    className="w-full pl-12 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                    placeholder="0.00"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Station / Counter Name (Optional)
                </label>
                <input
                  type="text"
                  value={openStationInput}
                  onChange={(e) => setOpenStationInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. Counter 1, Main POS"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Opening Remarks (Optional)
                </label>
                <textarea
                  rows={2}
                  value={openNotesInput}
                  onChange={(e) => setOpenNotesInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Shift notes..."
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowOpenModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition disabled:opacity-50"
                >
                  {submitting ? 'Opening...' : 'Start Till Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 2: CASH-IN / CASH-OUT MOVEMENT       */}
      {/* ========================================== */}
      {showMovementModal && activeSession && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Record Cash In / Cash Out</h3>
            <p className="text-xs text-slate-500 mb-4">
              Session Ref: <span className="font-mono font-bold">{activeSession.sessionNumber}</span>
            </p>

            <form onSubmit={handleRecordMovement} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMovementType('CASH_IN')}
                  className={`p-3 rounded-lg border text-center transition ${
                    movementType === 'CASH_IN'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <ArrowUpRight className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
                  <span className="text-xs block">Cash-In (Float Add)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMovementType('CASH_OUT')}
                  className={`p-3 rounded-lg border text-center transition ${
                    movementType === 'CASH_OUT'
                      ? 'bg-rose-50 border-rose-500 text-rose-800 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <ArrowDownRight className="w-5 h-5 mx-auto mb-1 text-rose-600" />
                  <span className="text-xs block">Cash-Out (Safe Drop)</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Amount (PKR) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={movementAmount}
                  onChange={(e) => setMovementAmount(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                  placeholder="0.00"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason / Purpose *
                </label>
                <input
                  type="text"
                  required
                  value={movementReason}
                  onChange={(e) => setMovementReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. Change drawer top-up, Safe skim drop"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reference # (Optional)
                </label>
                <input
                  type="text"
                  value={movementRef}
                  onChange={(e) => setMovementRef(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  placeholder="Slip/Receipt Ref"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowMovementModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Record Movement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 3: COUNT & CLOSE TILL                */}
      {/* ========================================== */}
      {showCloseModal && activeSession && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 my-8">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Physical Cash Count & Till Close</h3>
                <p className="text-xs text-slate-500">
                  Session: <span className="font-mono font-bold text-slate-700">{activeSession.sessionNumber}</span> | Cashier: <span className="font-semibold">{activeSession.user?.displayName || activeSession.cashierUser?.displayName || 'Cashier'}</span>
                </p>
              </div>
              <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setCountMode('DENOMINATIONS')}
                  className={`px-3 py-1 rounded-md transition ${
                    countMode === 'DENOMINATIONS'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Denominations
                </button>
                <button
                  type="button"
                  onClick={() => setCountMode('DIRECT')}
                  className={`px-3 py-1 rounded-md transition ${
                    countMode === 'DIRECT'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Direct Total
                </button>
              </div>
            </div>

            <form onSubmit={handleFinalizeClose} className="space-y-4">
              {/* Denomination Counter Table */}
              {countMode === 'DENOMINATIONS' ? (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 max-h-64 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-[10px] text-slate-500 font-bold uppercase border-b border-slate-200 pb-1">
                        <th className="text-left py-1">Denomination</th>
                        <th className="text-center py-1">Note Count</th>
                        <th className="text-right py-1">Total (PKR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {STANDARD_PKR_DENOMINATIONS.map((d) => {
                        const count = denominationCounts[d.value] || 0;
                        const subtotal = d.value * count;
                        return (
                          <tr key={d.value} className="py-1">
                            <td className="py-1.5 font-bold text-slate-700">{d.label}</td>
                            <td className="py-1.5 text-center">
                              <input
                                type="number"
                                min="0"
                                value={count || ''}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10) || 0;
                                  setDenominationCounts((prev) => ({
                                    ...prev,
                                    [d.value]: Math.max(0, val),
                                  }));
                                }}
                                className="w-20 px-2 py-1 text-center bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-xs font-bold"
                                placeholder="0"
                              />
                            </td>
                            <td className="py-1.5 text-right font-mono font-semibold text-slate-800">
                              {subtotal.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        );
                      })}
                      <tr>
                        <td className="py-1.5 font-bold text-slate-700">Other / Coins & Loose</td>
                        <td className="py-1.5 text-center">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={looseCoinsInput || ''}
                            onChange={(e) => setLooseCoinsInput(e.target.value)}
                            className="w-20 px-2 py-1 text-center bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-xs font-bold"
                            placeholder="0.00"
                          />
                        </td>
                        <td className="py-1.5 text-right font-mono font-semibold text-slate-800">
                          {(Number(looseCoinsInput) || 0).toLocaleString('en-PK', {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Direct Counted Physical Cash Total (PKR) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={directActualCashInput}
                    onChange={(e) => setDirectActualCashInput(e.target.value)}
                    className="w-full px-3 py-2 text-base font-bold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    placeholder="0.00"
                    autoFocus
                  />
                </div>
              )}

              {/* Real-time Reconciliation Bar */}
              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-100 rounded-lg border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block font-semibold">Expected Cash</span>
                  <span className="font-bold text-slate-800 text-sm font-mono">
                    PKR {activeExpectedCash.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block font-semibold">Actual Count</span>
                  <span className="font-bold text-slate-900 text-sm font-mono">
                    PKR {calculatedActualCash.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block font-semibold">Variance</span>
                  <span
                    className={`font-bold text-sm font-mono ${
                      liveVariance === 0
                        ? 'text-slate-700'
                        : liveVariance < 0
                        ? 'text-rose-600'
                        : 'text-emerald-600'
                    }`}
                  >
                    PKR {liveVariance.toLocaleString('en-PK', { minimumFractionDigits: 2 })} (
                    {liveVariance === 0 ? 'Exact' : liveVariance < 0 ? 'Short' : 'Surplus'})
                  </span>
                </div>
              </div>

              {/* Mandatory Variance Reason */}
              {liveVariance !== 0 && (
                <div>
                  <label className="block text-xs font-bold text-rose-700 mb-1">
                    Variance Explanation Reason (Mandatory for non-zero variance) *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={varianceReasonInput}
                    onChange={(e) => setVarianceReasonInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-rose-50 border border-rose-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                    placeholder="Provide reason for cash discrepancy..."
                  />
                </div>
              )}

              {/* Threshold Supervisor Notice */}
              {requiresVarianceApproval && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-800 flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Supervisor Authorization Required</span>
                    Variance exceeds the Rs. 500 threshold. Closing requires the{' '}
                    <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">
                      cash_sessions.approve_variance
                    </code>{' '}
                    permission.
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Closing Notes (Optional)
                </label>
                <input
                  type="text"
                  value={closeNotesInput}
                  onChange={(e) => setCloseNotesInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Any hand-over notes..."
                />
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                {canCount && (
                  <button
                    type="button"
                    onClick={handleSaveCount}
                    disabled={submitting}
                    className="px-3.5 py-2 text-xs bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg font-semibold transition"
                  >
                    Save Interim Count
                  </button>
                )}

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowCloseModal(false)}
                    className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm transition disabled:opacity-50"
                  >
                    {submitting ? 'Closing...' : 'Finalize & Close Till'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 4: SESSION DETAILS & AUDIT           */}
      {/* ========================================== */}
      {selectedSessionForDetails && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 space-y-4">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Till Session Details: {selectedSessionForDetails.sessionNumber}
                </h3>
                <p className="text-xs text-slate-500">
                  Cashier: {selectedSessionForDetails.user?.displayName || selectedSessionForDetails.cashierUser?.displayName || 'Cashier'}
                </p>
              </div>
              <button
                onClick={() => setSelectedSessionForDetails(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-500 block">Opening Cash:</span>
                <span className="font-bold">
                  PKR {Number(selectedSessionForDetails.openingCash).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Expected Cash:</span>
                <span className="font-bold">
                  PKR {Number(selectedSessionForDetails.expectedCash).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Actual Cash:</span>
                <span className="font-bold">
                  {selectedSessionForDetails.actualCash
                    ? `PKR ${Number(selectedSessionForDetails.actualCash).toLocaleString('en-PK', { minimumFractionDigits: 2 })}`
                    : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Variance:</span>
                <span className="font-bold">
                  {selectedSessionForDetails.varianceAmount
                    ? `PKR ${Number(selectedSessionForDetails.varianceAmount).toLocaleString('en-PK', { minimumFractionDigits: 2 })}`
                    : 'N/A'}
                </span>
              </div>
            </div>

            {selectedSessionForDetails.varianceReason && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
                <span className="font-bold block">Variance Reason:</span>
                {selectedSessionForDetails.varianceReason}
              </div>
            )}

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  handlePrintSession(selectedSessionForDetails.id);
                  setSelectedSessionForDetails(null);
                }}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
              >
                <Printer className="w-4 h-4" />
                <span>Print Reconciliation</span>
              </button>
              <button
                onClick={() => setSelectedSessionForDetails(null)}
                className="px-4 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* PRINT MODAL                                */}
      {/* ========================================== */}
      {printData && (
        <DocumentPrintModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          title={`Till Close Slip — ${printData.session.sessionNumber}`}
          subtitle="Day-End Cash Reconciliation & Shift Close"
          defaultLayout="THERMAL"
          allowThermalToggle={true}
        >
          {(layout) => <TillCloseSlipTemplate data={printData} layout={layout} />}
        </DocumentPrintModal>
      )}
    </div>
  );
};
