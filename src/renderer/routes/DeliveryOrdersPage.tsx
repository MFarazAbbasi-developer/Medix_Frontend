import React, { useState, useEffect, useCallback } from 'react';
import {
  Truck,
  Search,
  RefreshCw,
  Plus,
  Ban,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  UserCheck,
  Check,
  PackageCheck,
  Info,
  Printer,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import {
  deliveryOrdersApi,
  DeliveryOrder,
  DeliveryOrderStatus,
  EligibleInvoice,
  DeliveryOrderItem,
  customersApi,
  salesOperationsApi,
  Salesman,
  SalesRoute,
  Customer,
} from '../api';
import { DocumentPrintModal, DeliveryChallanPrintTemplate, PrintableDeliveryChallan } from '../components/printing';
import { usePermission } from '../hooks/usePermission';

export const DeliveryOrdersPage: React.FC = () => {
  const [deliveryOrders, setDeliveryOrders] = useState<DeliveryOrder[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [customerFilter, setCustomerFilter] = useState<string>('ALL');
  const [routeFilter, setRouteFilter] = useState<string>('ALL');
  const [salesmanFilter, setSalesmanFilter] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Pagination
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Reference master data for filters
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [salesmen, setSalesmen] = useState<Salesman[]>([]);
  const [routes, setRoutes] = useState<SalesRoute[]>([]);

  // Feedback Toast
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4500);
  };

  // Create Delivery Order Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [eligibleInvoices, setEligibleInvoices] = useState<EligibleInvoice[]>([]);
  const [loadingEligible, setLoadingEligible] = useState<boolean>(false);
  const [eligibleSearch, setEligibleSearch] = useState<string>('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [createNotes, setCreateNotes] = useState<string>('');
  const [isSubmittingCreate, setIsSubmittingCreate] = useState<boolean>(false);

  // Detail / Fulfillment Workspace Modal
  const [activeDO, setActiveDO] = useState<DeliveryOrder | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState<boolean>(false);

  // Fulfillment Inputs (deliveryOrderItemId -> { billedQuantity, bonusQuantity })
  const [fulfillmentInputs, setFulfillmentInputs] = useState<
    Record<string, { billedQuantity: number; bonusQuantity: number }>
  >({});
  const [fulfillmentNotes, setFulfillmentNotes] = useState<string>('');
  const [isSubmittingFulfill, setIsSubmittingFulfill] = useState<boolean>(false);

  // Cancel Modal / Prompt State
  const [isCancelModalOpen, setIsCancelModalOpen] = useState<boolean>(false);
  const [cancellationReason, setCancellationReason] = useState<string>('');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState<boolean>(false);

  // Phase 20D — Delivery Challan Printing State
  const { hasPermission } = usePermission();
  const canPrint = hasPermission('delivery_orders.print');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [printData, setPrintData] = useState<PrintableDeliveryChallan | null>(null);
  const [loadingPrintId, setLoadingPrintId] = useState<string | null>(null);

  const handlePrintChallan = async (doId: string, fulfillmentId: string) => {
    if (!canPrint) {
      showFeedback('error', 'You do not have permission to print delivery challans.');
      return;
    }
    setLoadingPrintId(fulfillmentId);
    try {
      const res = await deliveryOrdersApi.getFulfillmentPrintData(doId, fulfillmentId);
      if (res.data) {
        setPrintData(res.data);
        setIsPrintModalOpen(true);
      }
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || 'Failed to load challan print data');
    } finally {
      setLoadingPrintId(null);
    }
  };

  // 1. Fetch Masters for Filter Dropdowns
  useEffect(() => {
    const fetchMasters = async () => {
      try {
        const [custRes, smRes, rtRes] = await Promise.all([
          customersApi.getCustomers({ limit: 200 }),
          salesOperationsApi.getSalesmen({ limit: 200 }),
          salesOperationsApi.getRoutes({ limit: 200 }),
        ]);
        if (custRes?.items) setCustomers(custRes.items);
        if (smRes?.items) setSalesmen(smRes.items);
        if (rtRes?.items) setRoutes(rtRes.items);
      } catch {
        // Silently tolerate filter fetch errors
      }
    };
    fetchMasters();
  }, []);

  // 2. Fetch Delivery Orders List
  const fetchDeliveryOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = {
        page: currentPage,
        limit: 50,
      };
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== 'ALL') params.status = statusFilter as DeliveryOrderStatus;
      if (customerFilter !== 'ALL') params.customerId = customerFilter;
      if (routeFilter !== 'ALL') params.routeId = routeFilter;
      if (salesmanFilter !== 'ALL') params.salesmanId = salesmanFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await deliveryOrdersApi.getDeliveryOrders(params);
      if (res.data) {
        setDeliveryOrders(res.data.items);
        setTotalRecords(res.data.meta.total);
        setTotalPages(res.data.meta.totalPages);
      }
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || 'Failed to load delivery orders');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, search, statusFilter, customerFilter, routeFilter, salesmanFilter, startDate, endDate]);

  useEffect(() => {
    fetchDeliveryOrders();
  }, [fetchDeliveryOrders]);

  // 3. Fetch Eligible Invoices for DO Creation Modal
  const fetchEligibleInvoices = async () => {
    setLoadingEligible(true);
    try {
      const res = await deliveryOrdersApi.getEligibleInvoices({
        search: eligibleSearch.trim() || undefined,
      });
      if (res.data) {
        setEligibleInvoices(res.data);
      }
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || 'Failed to fetch eligible invoices');
    } finally {
      setLoadingEligible(false);
    }
  };

  const handleOpenCreateModal = () => {
    setSelectedInvoiceId('');
    setCreateNotes('');
    setEligibleSearch('');
    setIsCreateModalOpen(true);
    fetchEligibleInvoices();
  };

  const handleCreateDeliveryOrder = async () => {
    if (!selectedInvoiceId) {
      showFeedback('error', 'Please select a sales invoice to create a delivery order');
      return;
    }

    setIsSubmittingCreate(true);
    try {
      const res = await deliveryOrdersApi.createDeliveryOrder({
        salesInvoiceId: selectedInvoiceId,
        notes: createNotes.trim() || undefined,
      });
      showFeedback('success', `Delivery Order ${res.data?.doNumber} created successfully!`);
      setIsCreateModalOpen(false);
      fetchDeliveryOrders();
      if (res.data?.id) {
        handleOpenDetails(res.data.id);
      }
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || 'Failed to create delivery order');
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  // 4. Open Details / Fulfillment Workspace
  const handleOpenDetails = async (id: string) => {
    setIsDetailsModalOpen(true);
    try {
      const res = await deliveryOrdersApi.getDeliveryOrderById(id);
      if (res.data) {
        setActiveDO(res.data);
        // Initialize fulfillment inputs to 0
        const initialInputs: Record<string, { billedQuantity: number; bonusQuantity: number }> = {};
        res.data.items.forEach((it) => {
          initialInputs[it.id] = { billedQuantity: 0, bonusQuantity: 0 };
        });
        setFulfillmentInputs(initialInputs);
        setFulfillmentNotes('');
      }
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || 'Failed to load delivery order details');
      setIsDetailsModalOpen(false);
    }
  };

  // Helper: "Fulfill All Remaining" Action
  const handleFulfillAllRemaining = () => {
    if (!activeDO) return;
    const filledInputs: Record<string, { billedQuantity: number; bonusQuantity: number }> = {};
    activeDO.items.forEach((it) => {
      const pendingBilled = Math.max(0, it.orderedBilledQuantity - it.deliveredBilledQuantity);
      const pendingBonus = Math.max(0, it.orderedBonusQuantity - it.deliveredBonusQuantity);
      filledInputs[it.id] = {
        billedQuantity: pendingBilled,
        bonusQuantity: pendingBonus,
      };
    });
    setFulfillmentInputs(filledInputs);
  };

  // Helper: Submit Fulfillment Event
  const handleSubmitFulfillment = async () => {
    if (!activeDO) return;

    const itemsToFulfill = Object.entries(fulfillmentInputs)
      .filter(([_, qty]) => (qty.billedQuantity || 0) + (qty.bonusQuantity || 0) > 0)
      .map(([itemId, qty]) => ({
        deliveryOrderItemId: itemId,
        billedQuantity: Number(qty.billedQuantity || 0),
        bonusQuantity: Number(qty.bonusQuantity || 0),
      }));

    if (itemsToFulfill.length === 0) {
      showFeedback('error', 'Please enter at least one item quantity to fulfill.');
      return;
    }

    setIsSubmittingFulfill(true);
    try {
      const res = await deliveryOrdersApi.recordFulfillment(activeDO.id, {
        items: itemsToFulfill,
        notes: fulfillmentNotes.trim() || undefined,
      });
      showFeedback('success', `Fulfillment recorded successfully! New status: ${res.data?.status}`);
      if (res.data) {
        setActiveDO(res.data);
        const resetInputs: Record<string, { billedQuantity: number; bonusQuantity: number }> = {};
        res.data.items.forEach((it) => {
          resetInputs[it.id] = { billedQuantity: 0, bonusQuantity: 0 };
        });
        setFulfillmentInputs(resetInputs);
        setFulfillmentNotes('');

        // Phase 20D: Offer/open print modal for the newly generated Delivery Challan
        const latestFulfillment = res.data.fulfillments?.[0];
        if (latestFulfillment && canPrint) {
          handlePrintChallan(res.data.id, latestFulfillment.id);
        }
      }
      fetchDeliveryOrders();
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || 'Failed to record fulfillment');
    } finally {
      setIsSubmittingFulfill(false);
    }
  };

  // Helper: Cancel Delivery Order
  const handleCancelDeliveryOrder = async () => {
    if (!activeDO) return;
    if (!cancellationReason.trim()) {
      showFeedback('error', 'Please provide a valid cancellation reason');
      return;
    }

    setIsSubmittingCancel(true);
    try {
      await deliveryOrdersApi.cancelDeliveryOrder(activeDO.id, {
        cancellationReason: cancellationReason.trim(),
      });
      showFeedback('success', `Delivery Order ${activeDO.doNumber} cancelled successfully`);
      setIsCancelModalOpen(false);
      setIsDetailsModalOpen(false);
      fetchDeliveryOrders();
    } catch (err: any) {
      showFeedback('error', err.response?.data?.message || 'Failed to cancel delivery order');
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  // Helper: Status Badge Styling
  const renderStatusBadge = (status: DeliveryOrderStatus) => {
    switch (status) {
      case 'READY':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
            <Clock className="w-3 h-3 text-amber-500" />
            READY
          </span>
        );
      case 'PARTIALLY_DELIVERED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/80">
            <PackageCheck className="w-3 h-3 text-blue-500" />
            PARTIALLY DELIVERED
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            DELIVERED
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-300">
            <Ban className="w-3 h-3 text-slate-400" />
            CANCELLED
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  // Helper: Compact Fulfillment Summary
  const renderCompactFulfillment = (items: DeliveryOrderItem[]) => {
    const totalOrderedBilled = items.reduce((acc, i) => acc + i.orderedBilledQuantity, 0);
    const totalDeliveredBilled = items.reduce((acc, i) => acc + i.deliveredBilledQuantity, 0);
    const totalOrderedBonus = items.reduce((acc, i) => acc + i.orderedBonusQuantity, 0);
    const totalDeliveredBonus = items.reduce((acc, i) => acc + i.deliveredBonusQuantity, 0);

    return (
      <div className="text-xs">
        <span className="font-mono font-medium text-charcoal-900">
          {totalDeliveredBilled}/{totalOrderedBilled} billed
        </span>
        {totalOrderedBonus > 0 && (
          <span className="font-mono text-charcoal-500 ml-1.5">
            · {totalDeliveredBonus}/{totalOrderedBonus} bonus
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-surface-base select-none overflow-hidden">
      {/* Toast Notification */}
      {feedback && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-lg border transition-all text-xs font-medium animate-in fade-in duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="ml-2 hover:opacity-75"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="bg-surface-card border-b border-surface-border px-6 py-3.5 flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg font-bold text-charcoal-900 tracking-tight flex items-center gap-2">
              <Truck className="w-5 h-5 text-brand-600" />
              Delivery Orders
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
              Phase 20C
            </span>
          </div>
          <p className="text-xs text-charcoal-500 mt-0.5">
            Operational fulfillment & dispatch tracking for posted sales invoices
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={fetchDeliveryOrders}
            className="h-8 gap-1.5 text-xs text-charcoal-700"
            disabled={isLoading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleOpenCreateModal}
            className="h-8 gap-1.5 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Delivery Order
          </Button>
        </div>
      </div>

      {/* Compact Filters & Search Bar */}
      <div className="bg-surface-card/60 border-b border-surface-border px-6 py-2.5 flex flex-wrap items-center gap-2.5 text-xs shrink-0">
        {/* Search */}
        <div className="relative min-w-[220px] flex-1">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-charcoal-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search DO #, Invoice #, Customer..."
            className="pl-8 h-8 text-xs bg-white"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-8 px-2.5 bg-white border border-surface-border rounded text-xs text-charcoal-800 focus:outline-hidden focus:border-brand-500"
        >
          <option value="ALL">All Statuses</option>
          <option value="READY">Ready</option>
          <option value="PARTIALLY_DELIVERED">Partially Delivered</option>
          <option value="DELIVERED">Delivered</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        {/* Route Filter */}
        <select
          value={routeFilter}
          onChange={(e) => setRouteFilter(e.target.value)}
          className="h-8 px-2.5 bg-white border border-surface-border rounded text-xs text-charcoal-800 focus:outline-hidden focus:border-brand-500 max-w-[150px]"
        >
          <option value="ALL">All Routes</option>
          {routes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.code} - {r.name}
            </option>
          ))}
        </select>

        {/* Salesman Filter */}
        <select
          value={salesmanFilter}
          onChange={(e) => setSalesmanFilter(e.target.value)}
          className="h-8 px-2.5 bg-white border border-surface-border rounded text-xs text-charcoal-800 focus:outline-hidden focus:border-brand-500 max-w-[150px]"
        >
          <option value="ALL">All Salesmen</option>
          {salesmen.map((s) => (
            <option key={s.id} value={s.id}>
              {s.code} - {s.name}
            </option>
          ))}
        </select>

        {/* Customer Filter */}
        <select
          value={customerFilter}
          onChange={(e) => setCustomerFilter(e.target.value)}
          className="h-8 px-2.5 bg-white border border-surface-border rounded text-xs text-charcoal-800 focus:outline-hidden focus:border-brand-500 max-w-[170px]"
        >
          <option value="ALL">All Customers</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code} - {c.name}
            </option>
          ))}
        </select>

        {/* Date Range */}
        <div className="flex items-center gap-1">
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-8 text-xs bg-white w-32"
          />
          <span className="text-charcoal-400">to</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-8 text-xs bg-white w-32"
          />
        </div>

        {(search || statusFilter !== 'ALL' || routeFilter !== 'ALL' || salesmanFilter !== 'ALL' || customerFilter !== 'ALL' || startDate || endDate) && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch('');
              setStatusFilter('ALL');
              setRouteFilter('ALL');
              setSalesmanFilter('ALL');
              setCustomerFilter('ALL');
              setStartDate('');
              setEndDate('');
            }}
            className="h-8 px-2 text-xs text-charcoal-500 hover:text-charcoal-800"
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Dense DataTable Container */}
      <div className="flex-1 overflow-auto p-6">
        <Card className="border border-surface-border overflow-hidden bg-surface-card shadow-2xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-surface-muted/75 border-b border-surface-border text-charcoal-600 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3.5">DO #</th>
                <th className="py-2.5 px-3.5">Invoice #</th>
                <th className="py-2.5 px-3.5">Customer & Destination</th>
                <th className="py-2.5 px-3.5">Route</th>
                <th className="py-2.5 px-3.5">Salesman</th>
                <th className="py-2.5 px-3.5">Fulfillment</th>
                <th className="py-2.5 px-3.5">Status</th>
                <th className="py-2.5 px-3.5">Created Date</th>
                <th className="py-2.5 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/50">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-charcoal-400">
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-brand-600" />
                      <span>Loading delivery orders...</span>
                    </div>
                  </td>
                </tr>
              ) : deliveryOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-charcoal-400">
                    <div className="flex flex-col items-center gap-2">
                      <Truck className="w-8 h-8 text-charcoal-300" />
                      <span className="font-medium text-charcoal-600">No delivery orders found</span>
                      <span className="text-[11px] text-charcoal-400">
                        Create a Delivery Order from any eligible posted sales invoice
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                deliveryOrders.map((dOrder) => (
                  <tr
                    key={dOrder.id}
                    className="hover:bg-surface-muted/40 transition-colors group cursor-pointer"
                    onClick={() => handleOpenDetails(dOrder.id)}
                  >
                    {/* DO # */}
                    <td className="py-2.5 px-3.5 font-mono font-semibold text-brand-700">
                      {dOrder.doNumber}
                    </td>

                    {/* Invoice # */}
                    <td className="py-2.5 px-3.5 font-mono text-charcoal-800">
                      {dOrder.invoiceNumber}
                    </td>

                    {/* Customer & Destination */}
                    <td className="py-2.5 px-3.5 max-w-[240px]">
                      <div className="font-semibold text-charcoal-900 truncate">
                        {dOrder.customerName}
                      </div>
                      <div className="text-[11px] text-charcoal-500 truncate flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 shrink-0 text-charcoal-400" />
                        <span className="truncate">{dOrder.deliveryAddress || 'No address'}</span>
                        {dOrder.deliveryCity && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1 rounded">
                            {dOrder.deliveryCity}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Route */}
                    <td className="py-2.5 px-3.5">
                      {dOrder.routeName ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-charcoal-700 bg-surface-muted px-1.5 py-0.5 rounded">
                          {dOrder.routeCode && <span className="font-mono font-bold text-charcoal-500">{dOrder.routeCode}</span>}
                          <span>{dOrder.routeName}</span>
                        </span>
                      ) : (
                        <span className="text-charcoal-400 italic">None</span>
                      )}
                    </td>

                    {/* Salesman */}
                    <td className="py-2.5 px-3.5">
                      {dOrder.salesmanName ? (
                        <div className="text-xs text-charcoal-800">
                          <span>{dOrder.salesmanName}</span>
                          {dOrder.salesmanCode && (
                            <span className="text-[10px] text-charcoal-400 font-mono ml-1">
                              ({dOrder.salesmanCode})
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-charcoal-400 italic">None</span>
                      )}
                    </td>

                    {/* Fulfillment Compact Text */}
                    <td className="py-2.5 px-3.5">
                      {renderCompactFulfillment(dOrder.items || [])}
                    </td>

                    {/* Status */}
                    <td className="py-2.5 px-3.5">
                      {renderStatusBadge(dOrder.status)}
                    </td>

                    {/* Created Date */}
                    <td className="py-2.5 px-3.5 text-charcoal-600 text-[11px]">
                      {new Date(dOrder.createdAt).toLocaleDateString()}{' '}
                      <span className="text-charcoal-400">
                        {new Date(dOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenDetails(dOrder.id)}
                          className="h-7 px-2 text-[11px] text-charcoal-700"
                        >
                          Workspace
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination Footer */}
          <div className="bg-surface-card border-t border-surface-border px-4 py-2.5 flex items-center justify-between text-xs text-charcoal-500">
            <div>
              Showing {deliveryOrders.length} of {totalRecords} records
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="h-7 px-2 text-xs"
                >
                  Previous
                </Button>
                <span className="text-xs px-2">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="h-7 px-2 text-xs"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* ========================================================================= */}
      {/* CREATE DELIVERY ORDER MODAL (Select from eligible posted invoices)         */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal-950/40 backdrop-blur-2xs p-4">
          <div className="bg-surface-card border border-surface-border rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 border-b border-surface-border flex items-center justify-between bg-surface-muted/40">
              <div className="flex items-center gap-2.5">
                <Truck className="w-5 h-5 text-brand-600" />
                <div>
                  <h2 className="text-sm font-bold text-charcoal-900">
                    Create Delivery Order
                  </h2>
                  <p className="text-xs text-charcoal-500 mt-0.5">
                    Select an eligible POSTED sales invoice with delivery address snapshot
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-charcoal-400 hover:text-charcoal-700 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content & Invoice Table */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {/* Search Bar */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-charcoal-400" />
                  <Input
                    value={eligibleSearch}
                    onChange={(e) => setEligibleSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchEligibleInvoices()}
                    placeholder="Search invoice number, customer name, destination city..."
                    className="pl-8 h-8 text-xs"
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={fetchEligibleInvoices}
                  className="h-8 text-xs gap-1"
                >
                  <Search className="w-3.5 h-3.5" />
                  Find Invoices
                </Button>
              </div>

              {/* Eligible Invoices Table */}
              <div className="border border-surface-border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-muted sticky top-0 text-charcoal-600 font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="py-2 px-3 w-10 text-center">Select</th>
                      <th className="py-2 px-3">Invoice #</th>
                      <th className="py-2 px-3">Customer & Destination</th>
                      <th className="py-2 px-3">Route</th>
                      <th className="py-2 px-3">Salesman</th>
                      <th className="py-2 px-3 text-right">Items</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {loadingEligible ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-charcoal-400">
                          <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-1 text-brand-600" />
                          <span>Searching eligible posted invoices...</span>
                        </td>
                      </tr>
                    ) : eligibleInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-charcoal-400">
                          <span>No eligible posted invoices found with a delivery address.</span>
                        </td>
                      </tr>
                    ) : (
                      eligibleInvoices.map((inv) => (
                        <tr
                          key={inv.id}
                          onClick={() => setSelectedInvoiceId(inv.id)}
                          className={`cursor-pointer transition-colors ${
                            selectedInvoiceId === inv.id
                              ? 'bg-brand-50/80 font-medium'
                              : 'hover:bg-surface-muted/50'
                          }`}
                        >
                          <td className="py-2 px-3 text-center">
                            <input
                              type="radio"
                              name="selectedInvoice"
                              checked={selectedInvoiceId === inv.id}
                              onChange={() => setSelectedInvoiceId(inv.id)}
                              className="text-brand-600 focus:ring-brand-500"
                            />
                          </td>
                          <td className="py-2 px-3 font-mono font-semibold text-brand-700">
                            {inv.invoiceNumber}
                          </td>
                          <td className="py-2 px-3">
                            <div className="font-semibold text-charcoal-900">{inv.customer.name}</div>
                            <div className="text-[11px] text-charcoal-500 truncate max-w-xs">
                              {inv.deliveryAddress || 'No address'}{' '}
                              {inv.deliveryCity && `(${inv.deliveryCity})`}
                            </div>
                          </td>
                          <td className="py-2 px-3 text-charcoal-700">
                            {inv.route?.name || <span className="text-charcoal-400 italic">None</span>}
                          </td>
                          <td className="py-2 px-3 text-charcoal-700">
                            {inv.salesman?.name || <span className="text-charcoal-400 italic">None</span>}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-semibold text-charcoal-800">
                            {inv._count?.items ?? 0} lines
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Notes Input */}
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Delivery Order Notes (Optional)
                </label>
                <Input
                  value={createNotes}
                  onChange={(e) => setCreateNotes(e.target.value)}
                  placeholder="e.g. Priority dispatch, fragile cold-chain transport..."
                  className="h-8 text-xs"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 border-t border-surface-border bg-surface-muted/30 flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setIsCreateModalOpen(false)}
                disabled={isSubmittingCreate}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleCreateDeliveryOrder}
                disabled={!selectedInvoiceId || isSubmittingCreate}
                className="gap-1.5"
              >
                {isSubmittingCreate ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                Create Delivery Order
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FULFILLMENT & DETAILS WORKSPACE MODAL                                      */}
      {/* ========================================================================= */}
      {isDetailsModalOpen && activeDO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal-950/40 backdrop-blur-2xs p-4">
          <div className="bg-surface-card border border-surface-border rounded-xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 border-b border-surface-border flex items-center justify-between bg-surface-muted/40 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-50 border border-brand-200/80 rounded-lg text-brand-700">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-base font-bold text-charcoal-900 font-mono">
                      {activeDO.doNumber}
                    </h2>
                    {renderStatusBadge(activeDO.status)}
                  </div>
                  <p className="text-xs text-charcoal-500 mt-0.5">
                    Linked Invoice: <span className="font-mono font-semibold text-charcoal-700">{activeDO.invoiceNumber}</span> · Issued {new Date(activeDO.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {activeDO.status === 'READY' && (
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      setCancellationReason('');
                      setIsCancelModalOpen(true);
                    }}
                    className="h-8 gap-1.5 text-xs"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    Cancel Delivery Order
                  </Button>
                )}
                <button
                  type="button"
                  onClick={() => setIsDetailsModalOpen(false)}
                  className="text-charcoal-400 hover:text-charcoal-700 p-1.5 rounded-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Workspace Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Frozen Snapshot Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {/* Destination Snapshot */}
                <div className="p-3.5 bg-surface-muted/40 border border-surface-border rounded-lg text-xs space-y-1">
                  <div className="text-[10px] font-bold text-charcoal-400 uppercase tracking-wider flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-brand-600" />
                    Delivery Destination Snapshot
                  </div>
                  <div className="font-bold text-charcoal-900">{activeDO.customerName}</div>
                  <div className="text-charcoal-700">{activeDO.deliveryAddress || 'No address provided'}</div>
                  {activeDO.deliveryRecipient && (
                    <div className="text-charcoal-600">
                      <span className="text-charcoal-400">Recipient:</span> {activeDO.deliveryRecipient} ({activeDO.deliveryPhone || 'No phone'})
                    </div>
                  )}
                  {activeDO.deliveryInstructions && (
                    <div className="text-amber-700 bg-amber-50/70 p-1.5 rounded border border-amber-200/50 text-[11px] mt-1">
                      <span className="font-semibold">Instructions:</span> {activeDO.deliveryInstructions}
                    </div>
                  )}
                </div>

                {/* Sales Attribution */}
                <div className="p-3.5 bg-surface-muted/40 border border-surface-border rounded-lg text-xs space-y-1">
                  <div className="text-[10px] font-bold text-charcoal-400 uppercase tracking-wider flex items-center gap-1">
                    <UserCheck className="w-3 h-3 text-brand-600" />
                    Sales Attribution Snapshot
                  </div>
                  <div>
                    <span className="text-charcoal-400">Route:</span>{' '}
                    <span className="font-semibold text-charcoal-900">
                      {activeDO.routeName ? `${activeDO.routeCode || ''} ${activeDO.routeName}` : 'No route'}
                    </span>
                  </div>
                  <div>
                    <span className="text-charcoal-400">Salesman:</span>{' '}
                    <span className="font-semibold text-charcoal-900">
                      {activeDO.salesmanName ? `${activeDO.salesmanCode || ''} ${activeDO.salesmanName}` : 'No salesman'}
                    </span>
                  </div>
                  <div>
                    <span className="text-charcoal-400">Branch:</span>{' '}
                    <span className="font-semibold text-charcoal-900">
                      {activeDO.branch?.name || 'Head Office'}
                    </span>
                  </div>
                </div>

                {/* Audit & Notes */}
                <div className="p-3.5 bg-surface-muted/40 border border-surface-border rounded-lg text-xs space-y-1">
                  <div className="text-[10px] font-bold text-charcoal-400 uppercase tracking-wider flex items-center gap-1">
                    <Info className="w-3 h-3 text-brand-600" />
                    Order Info & Notes
                  </div>
                  <div>
                    <span className="text-charcoal-400">Created By:</span>{' '}
                    <span className="font-medium text-charcoal-800">
                      {activeDO.createdByUser?.displayName || 'System'}
                    </span>
                  </div>
                  {activeDO.notes && (
                    <div className="text-charcoal-600 bg-white p-1.5 rounded border border-surface-border text-[11px]">
                      {activeDO.notes}
                    </div>
                  )}
                  {activeDO.status === 'CANCELLED' && activeDO.cancellationReason && (
                    <div className="text-rose-700 bg-rose-50 p-1.5 rounded border border-rose-200 text-[11px]">
                      <span className="font-semibold">Cancellation Reason:</span> {activeDO.cancellationReason}
                    </div>
                  )}
                </div>
              </div>

              {/* Items Fulfillment Workspace */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-charcoal-900 uppercase tracking-wider flex items-center gap-2">
                    <PackageCheck className="w-4 h-4 text-brand-600" />
                    Items & Dispatch Fulfillment
                  </h3>

                  {activeDO.status !== 'CANCELLED' && activeDO.status !== 'DELIVERED' && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleFulfillAllRemaining}
                      className="h-7 text-xs gap-1 text-brand-700 font-semibold"
                    >
                      <Check className="w-3 h-3" />
                      Fulfill All Remaining
                    </Button>
                  )}
                </div>

                <div className="border border-surface-border rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-muted/80 text-charcoal-600 font-semibold uppercase text-[10px]">
                      <tr className="border-b border-surface-border">
                        <th className="py-2.5 px-3">Product & Batch</th>
                        <th className="py-2.5 px-3 text-center">Ordered</th>
                        <th className="py-2.5 px-3 text-center">Delivered</th>
                        <th className="py-2.5 px-3 text-center">Pending</th>
                        {activeDO.status !== 'CANCELLED' && activeDO.status !== 'DELIVERED' && (
                          <th className="py-2.5 px-3 text-right">Fulfill Now (Billed + Bonus)</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border">
                      {activeDO.items.map((item) => {
                        const pendingBilled = Math.max(0, item.orderedBilledQuantity - item.deliveredBilledQuantity);
                        const pendingBonus = Math.max(0, item.orderedBonusQuantity - item.deliveredBonusQuantity);
                        const isLineComplete = pendingBilled === 0 && pendingBonus === 0;

                        return (
                          <tr key={item.id} className={isLineComplete ? 'bg-emerald-50/20' : 'hover:bg-surface-muted/30'}>
                            {/* Product & Batch */}
                            <td className="py-2.5 px-3">
                              <div className="font-semibold text-charcoal-900">{item.productName}</div>
                              <div className="text-[11px] text-charcoal-500 font-mono mt-0.5">
                                Batch: <span className="font-semibold text-charcoal-700">{item.batchNumber}</span> · Exp: {new Date(item.expiryDate).toLocaleDateString()}
                              </div>
                            </td>

                            {/* Ordered Quantities */}
                            <td className="py-2.5 px-3 text-center font-mono">
                              <span className="font-semibold text-charcoal-800">{item.orderedBilledQuantity}</span>
                              {item.orderedBonusQuantity > 0 && (
                                <span className="text-charcoal-500 ml-1">+{item.orderedBonusQuantity} free</span>
                              )}
                            </td>

                            {/* Delivered Quantities */}
                            <td className="py-2.5 px-3 text-center font-mono text-emerald-700 font-semibold">
                              {item.deliveredBilledQuantity}
                              {item.orderedBonusQuantity > 0 && (
                                <span className="text-emerald-600 font-normal ml-1">+{item.deliveredBonusQuantity}</span>
                              )}
                            </td>

                            {/* Pending Quantities */}
                            <td className="py-2.5 px-3 text-center font-mono font-bold">
                              {isLineComplete ? (
                                <span className="text-emerald-600 font-semibold text-[11px]">Fulfilled</span>
                              ) : (
                                <span className="text-amber-700">
                                  {pendingBilled}
                                  {pendingBonus > 0 && <span className="text-amber-600 font-normal ml-1">+{pendingBonus}</span>}
                                </span>
                              )}
                            </td>

                            {/* Fulfill Now Inputs */}
                            {activeDO.status !== 'CANCELLED' && activeDO.status !== 'DELIVERED' && (
                              <td className="py-2.5 px-3 text-right">
                                {isLineComplete ? (
                                  <span className="text-xs text-charcoal-400 font-medium">Done</span>
                                ) : (
                                  <div className="flex items-center justify-end gap-1.5">
                                    <div className="flex items-center gap-1">
                                      <span className="text-[10px] text-charcoal-500">Billed:</span>
                                      <input
                                        type="number"
                                        min={0}
                                        max={pendingBilled}
                                        value={fulfillmentInputs[item.id]?.billedQuantity ?? 0}
                                        onChange={(e) => {
                                          const val = Math.max(0, Math.min(pendingBilled, parseInt(e.target.value) || 0));
                                          setFulfillmentInputs((prev) => ({
                                            ...prev,
                                            [item.id]: {
                                              ...prev[item.id],
                                              billedQuantity: val,
                                            },
                                          }));
                                        }}
                                        className="w-16 h-7 px-1.5 text-right font-mono text-xs border border-surface-border rounded bg-white focus:outline-hidden focus:border-brand-500"
                                      />
                                    </div>

                                    {item.orderedBonusQuantity > 0 && (
                                      <div className="flex items-center gap-1">
                                        <span className="text-[10px] text-charcoal-500">Bonus:</span>
                                        <input
                                          type="number"
                                          min={0}
                                          max={pendingBonus}
                                          value={fulfillmentInputs[item.id]?.bonusQuantity ?? 0}
                                          onChange={(e) => {
                                            const val = Math.max(0, Math.min(pendingBonus, parseInt(e.target.value) || 0));
                                            setFulfillmentInputs((prev) => ({
                                              ...prev,
                                              [item.id]: {
                                                ...prev[item.id],
                                                bonusQuantity: val,
                                              },
                                            }));
                                          }}
                                          className="w-14 h-7 px-1.5 text-right font-mono text-xs border border-surface-border rounded bg-white focus:outline-hidden focus:border-brand-500"
                                        />
                                      </div>
                                    )}
                                  </div>
                                )}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Fulfillment Submission Bar */}
                {activeDO.status !== 'CANCELLED' && activeDO.status !== 'DELIVERED' && (
                  <div className="p-3.5 bg-brand-50/50 border border-brand-200/60 rounded-lg flex flex-wrap items-center justify-between gap-3">
                    <div className="flex-1 min-w-[240px]">
                      <Input
                        value={fulfillmentNotes}
                        onChange={(e) => setFulfillmentNotes(e.target.value)}
                        placeholder="Optional fulfillment notes (e.g. Dispatched in Van 3, Driver Kamran)..."
                        className="h-8 text-xs bg-white"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={handleSubmitFulfillment}
                      disabled={isSubmittingFulfill}
                      className="h-8 gap-1.5 text-xs font-semibold"
                    >
                      {isSubmittingFulfill ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      Record Dispatch / Fulfillment
                    </Button>
                  </div>
                )}
              </div>

              {/* Chronological Fulfillment History */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold text-charcoal-900 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-brand-600" />
                  Fulfillment History Events ({activeDO.fulfillments?.length || 0})
                </h3>

                {!activeDO.fulfillments || activeDO.fulfillments.length === 0 ? (
                  <div className="p-6 text-center text-xs text-charcoal-400 bg-surface-muted/30 border border-surface-border rounded-lg">
                    No fulfillment events recorded yet. Ready for first dispatch.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {activeDO.fulfillments.map((evt) => (
                      <div
                        key={evt.id}
                        className="p-3.5 bg-surface-card border border-surface-border rounded-lg text-xs space-y-2"
                      >
                        <div className="flex items-center justify-between border-b border-surface-border/50 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                              {evt.challanNumber || `Event #${evt.fulfillmentNumber}`}
                            </span>
                            <span className="text-charcoal-600 font-medium">
                              {new Date(evt.fulfilledAt).toLocaleString()}
                            </span>
                            {evt.fulfilledByUser && (
                              <span className="text-charcoal-400 text-[11px]">
                                by <strong className="text-charcoal-700">{evt.fulfilledByUser.displayName}</strong>
                              </span>
                            )}
                          </div>

                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => handlePrintChallan(activeDO.id, evt.id)}
                            disabled={loadingPrintId === evt.id || !canPrint}
                            className="h-7 text-[11px] gap-1 px-2.5 font-medium border-surface-border bg-white hover:bg-brand-50 hover:text-brand-700 hover:border-brand-300 transition-colors"
                            title={!canPrint ? "Requires 'delivery_orders.print' permission" : "Print Delivery Challan"}
                          >
                            {loadingPrintId === evt.id ? (
                              <RefreshCw className="w-3 h-3 animate-spin text-brand-600" />
                            ) : (
                              <Printer className="w-3 h-3 text-brand-600" />
                            )}
                            <span>Print Challan</span>
                          </Button>
                        </div>

                        {evt.notes && (
                          <div className="text-charcoal-600 italic text-[11px]">
                            Notes: "{evt.notes}"
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                          {evt.items.map((fit) => (
                            <div
                              key={fit.id}
                              className="p-2 bg-surface-muted/50 rounded border border-surface-border/60 text-[11px]"
                            >
                              <div className="font-semibold text-charcoal-900 truncate">
                                {fit.deliveryOrderItem?.productName || 'Product'}
                              </div>
                              <div className="font-mono text-emerald-700 font-bold mt-0.5">
                                Dispatched: {fit.deliveredBilledQuantity} billed
                                {fit.deliveredBonusQuantity > 0 && ` + ${fit.deliveredBonusQuantity} free`}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-surface-border bg-surface-muted/30 flex items-center justify-end">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setIsDetailsModalOpen(false)}
              >
                Close Workspace
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CANCEL DELIVERY ORDER CONFIRMATION MODAL                                   */}
      {/* ========================================================================= */}
      {isCancelModalOpen && activeDO && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-charcoal-950/50 backdrop-blur-2xs p-4">
          <div className="bg-surface-card border border-surface-border rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg">
                <Ban className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-charcoal-900">
                  Cancel Delivery Order {activeDO.doNumber}
                </h3>
                <p className="text-xs text-charcoal-500">
                  This action cancels the delivery order.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Cancellation Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="State the reason for cancelling this delivery order..."
                rows={3}
                className="w-full p-2.5 text-xs border border-surface-border rounded-lg bg-white focus:outline-hidden focus:border-rose-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setIsCancelModalOpen(false)}
                disabled={isSubmittingCancel}
              >
                Go Back
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={handleCancelDeliveryOrder}
                disabled={!cancellationReason.trim() || isSubmittingCancel}
                className="gap-1.5"
              >
                {isSubmittingCancel ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Ban className="w-3.5 h-3.5" />
                )}
                Confirm Cancellation
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PHASE 20D — DELIVERY CHALLAN PRINT MODAL                                  */}
      {/* ========================================================================= */}
      {isPrintModalOpen && printData && (
        <DocumentPrintModal
          isOpen={isPrintModalOpen}
          onClose={() => {
            setIsPrintModalOpen(false);
            setPrintData(null);
          }}
          title={`Delivery Challan — ${printData.challanNumber}`}
          subtitle={`Linked DO: ${printData.doNumber} · Invoice: ${printData.invoiceNumber}`}
          defaultLayout="A4"
          allowThermalToggle={true}
        >
          {(layout) => (
            <DeliveryChallanPrintTemplate
              challan={printData}
              layout={layout}
            />
          )}
        </DocumentPrintModal>
      )}
    </div>
  );
};
