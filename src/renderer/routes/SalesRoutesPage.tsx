import React, { useState, useEffect, useCallback } from 'react';
import {
  MapPin,
  Search,
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  Building2,
  UserCheck,
  Compass,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Pagination } from '../components/ui/Pagination';
import { useToast } from '../components/ui/Toast';
import {
  salesOperationsApi,
  SalesRoute,
  Salesman,
  CreateSalesRoutePayload,
  UpdateSalesRoutePayload,
  warehousesApi,
} from '../api';

export const SalesRoutesPage: React.FC = () => {
  const toast = useToast();
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'error') => {
    if (type === 'success') {
      toast?.success(message);
    } else if (type === 'warning') {
      toast?.warning(message);
    } else if (type === 'info') {
      toast?.info(message);
    } else {
      toast?.error(message);
    }
  }, [toast]);

  const [routes, setRoutes] = useState<SalesRoute[]>([]);
  const [salesmenList, setSalesmenList] = useState<Salesman[]>([]);
  const [branchesList, setBranchesList] = useState<{ id: string; name: string; code: string }[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [cityFilter, setCityFilter] = useState<string>('');
  const [branchFilter, setBranchFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingRoute, setEditingRoute] = useState<SalesRoute | null>(null);
  const [deletingRoute, setDeletingRoute] = useState<SalesRoute | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState<{
    code: string;
    name: string;
    city: string;
    area: string;
    branchId: string;
    salesmanIds: string[];
    notes: string;
    isActive: boolean;
  }>({
    code: '',
    name: '',
    city: '',
    area: '',
    branchId: '',
    salesmanIds: [],
    notes: '',
    isActive: true,
  });

  // Load master data (salesmen & branches)
  const loadMasterData = useCallback(async () => {
    try {
      const [salesmenRes, whRes] = await Promise.all([
        salesOperationsApi.getSalesmen({ limit: 100, isActive: true }),
        warehousesApi.getWarehouses(),
      ]);
      setSalesmenList(salesmenRes.items || []);

      const branchesMap = new Map<string, { id: string; name: string; code: string }>();
      whRes.forEach((w: any) => {
        if (w.branch) {
          branchesMap.set(w.branch.id, w.branch);
        }
      });
      setBranchesList(Array.from(branchesMap.values()));
    } catch {
      // Fallback
    }
  }, []);

  // Load sales routes list
  const loadRoutes = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await salesOperationsApi.getSalesRoutes({
        search: search.trim() || undefined,
        city: cityFilter.trim() || undefined,
        branchId: branchFilter === 'ALL' ? undefined : branchFilter,
        isActive: statusFilter === 'ALL' ? undefined : statusFilter === 'ACTIVE',
        page: currentPage,
        limit: 20,
      });
      setRoutes(res?.items || []);
      setTotalRecords(res?.meta?.total || 0);
      setTotalPages(res?.meta?.totalPages || 1);
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || 'Failed to load routes', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [search, cityFilter, branchFilter, statusFilter, currentPage, showToast]);

  useEffect(() => {
    loadMasterData();
  }, [loadMasterData]);

  useEffect(() => {
    loadRoutes();
  }, [loadRoutes]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingRoute(null);
    setFormData({
      code: `RT-${String(routes.length + 1).padStart(3, '0')}`,
      name: '',
      city: '',
      area: '',
      branchId: '',
      salesmanIds: [],
      notes: '',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (r: SalesRoute) => {
    setEditingRoute(r);
    setFormData({
      code: r.code,
      name: r.name,
      city: r.city || '',
      area: r.area || '',
      branchId: r.branchId || '',
      salesmanIds: r.assignedSalesmen?.map((s) => s.id) || [],
      notes: r.notes || '',
      isActive: r.isActive,
    });
    setIsModalOpen(true);
  };

  // Toggle Salesman selection in form
  const handleToggleSalesman = (salesmanId: string) => {
    setFormData((prev) => {
      const exists = prev.salesmanIds.includes(salesmanId);
      return {
        ...prev,
        salesmanIds: exists ? prev.salesmanIds.filter((id) => id !== salesmanId) : [...prev.salesmanIds, salesmanId],
      };
    });
  };

  // Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      showToast('Route Code and Name are required.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingRoute) {
        const payload: UpdateSalesRoutePayload = {
          code: formData.code.trim().toUpperCase(),
          name: formData.name.trim(),
          city: formData.city.trim() || undefined,
          area: formData.area.trim() || undefined,
          branchId: formData.branchId || undefined,
          salesmanIds: formData.salesmanIds,
          notes: formData.notes.trim() || undefined,
          isActive: formData.isActive,
        };
        await salesOperationsApi.updateSalesRoute(editingRoute.id, payload);
        showToast(`Route "${formData.name}" updated successfully.`, 'success');
      } else {
        const payload: CreateSalesRoutePayload = {
          code: formData.code.trim().toUpperCase(),
          name: formData.name.trim(),
          city: formData.city.trim() || undefined,
          area: formData.area.trim() || undefined,
          branchId: formData.branchId || undefined,
          salesmanIds: formData.salesmanIds,
          notes: formData.notes.trim() || undefined,
          isActive: formData.isActive,
        };
        await salesOperationsApi.createSalesRoute(payload);
        showToast(`Route "${formData.name}" created successfully.`, 'success');
      }
      setIsModalOpen(false);
      loadRoutes();
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || 'Operation failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm Delete / Deactivate
  const handleConfirmDelete = async () => {
    if (!deletingRoute) return;
    try {
      const res = await salesOperationsApi.deleteSalesRoute(deletingRoute.id);
      showToast(res.message, res.deactivated ? 'info' : 'success');
      setDeletingRoute(null);
      loadRoutes();
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || 'Failed to delete route', 'error');
    }
  };

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Header */}
      <div className="bg-white px-3.5 py-2.5 rounded-lg border border-surface-border flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded bg-brand-50 flex items-center justify-center text-brand-700">
            <Compass className="h-4.5 w-4.5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-charcoal-900 leading-tight">Sales Routes & Territories</h1>
            <p className="text-[11px] text-charcoal-500">
              Configure geographic distribution sectors, territory coverage, and commercial rep assignments
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" onClick={handleOpenCreate} className="h-8 text-xs font-semibold gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            <span>Add Route</span>
          </Button>
        </div>
      </div>

      {/* Main Card */}
      <Card className="flex-1 min-h-0 bg-white border border-surface-border flex flex-col p-3.5 space-y-3 overflow-hidden">
        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div className="flex flex-wrap items-center gap-2 flex-1 max-w-2xl">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-charcoal-400" />
              <Input
                type="text"
                placeholder="Search route code, name, city, area..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-8 text-xs h-8"
              />
            </div>

            <div className="w-36">
              <Input
                type="text"
                placeholder="Filter City..."
                value={cityFilter}
                onChange={(e) => {
                  setCityFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="text-xs h-8"
              />
            </div>

            <select
              value={branchFilter}
              onChange={(e) => {
                setBranchFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-8 px-2.5 rounded border border-surface-border bg-white text-xs text-charcoal-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="ALL">All Branches</option>
              {branchesList.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="h-8 px-2.5 rounded border border-surface-border bg-white text-xs text-charcoal-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>
          </div>

          <Button variant="outline" size="sm" onClick={loadRoutes} className="h-8 text-xs flex items-center gap-1.5">
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>

        {/* Data Table */}
        <div className="flex-1 overflow-y-auto min-h-0 border border-surface-border rounded">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-surface-muted/60 sticky top-0 z-10 border-b border-surface-border text-[10px] text-charcoal-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Route Code</th>
                <th className="py-2.5 px-3">Route Name</th>
                <th className="py-2.5 px-3">City & Sector / Area</th>
                <th className="py-2.5 px-3">Branch Scope</th>
                <th className="py-2.5 px-3">Assigned Salesmen</th>
                <th className="py-2.5 px-3 text-center">Customers</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-charcoal-400">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-1.5 text-brand-600" />
                    <span>Loading sales routes...</span>
                  </td>
                </tr>
              ) : routes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-charcoal-400">
                    <MapPin className="h-8 w-8 mx-auto mb-2 text-charcoal-300 stroke-[1.5]" />
                    <p className="font-semibold text-charcoal-700">No sales routes found</p>
                    <p className="text-[11px] text-charcoal-400 mt-0.5">
                      {search ? 'Try adjusting your search filters.' : 'Click "Add Route" to define a sales territory.'}
                    </p>
                  </td>
                </tr>
              ) : (
                routes.map((r) => (
                  <tr key={r.id} className="hover:bg-surface-muted/40 transition-colors">
                    <td className="py-2 px-3 font-mono font-bold text-charcoal-900">{r.code}</td>
                    <td className="py-2 px-3 font-bold text-charcoal-900">{r.name}</td>
                    <td className="py-2 px-3 text-charcoal-600">
                      <div className="font-medium">{r.city || '—'}</div>
                      {r.area && <div className="text-[11px] text-charcoal-500">{r.area}</div>}
                    </td>
                    <td className="py-2 px-3 text-charcoal-600">
                      {r.branch ? (
                        <span className="inline-flex items-center gap-1 bg-surface-muted px-1.5 py-0.5 rounded text-[11px] font-medium">
                          <Building2 className="h-3 w-3 text-charcoal-500" />
                          {r.branch.name}
                        </span>
                      ) : (
                        <span className="text-[11px] text-charcoal-400 italic">All Branches</span>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      {r.assignedSalesmen && r.assignedSalesmen.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {r.assignedSalesmen.map((sm) => (
                            <span
                              key={sm.id}
                              className="inline-flex items-center gap-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px] font-semibold"
                              title={`${sm.code} — ${sm.name}`}
                            >
                              <UserCheck className="h-2.5 w-2.5 shrink-0" />
                              <span>{sm.name}</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[11px] text-charcoal-400 italic">No salesmen assigned</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className="font-mono font-semibold text-charcoal-700">
                        {r.customerCount || 0}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <StatusBadge variant={r.isActive ? 'success' : 'neutral'}>
                        {r.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </StatusBadge>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(r)}
                          className="h-7 w-7 p-0 text-charcoal-500 hover:text-brand-700"
                          title="Edit Route"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingRoute(r)}
                          className="h-7 w-7 p-0 text-charcoal-400 hover:text-rose-600"
                          title="Delete or Deactivate Route"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Footer info */}
        {totalRecords > 20 && (
          <div className="pt-2 border-t border-surface-border">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalRecords}
              pageSize={20}
              onPageChange={setCurrentPage}
              showPageSizeSelector={false}
            />
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-charcoal-500 pt-1 shrink-0">
          <span>Showing {routes.length} of {totalRecords} sales routes</span>
          <span>Routes provide geographical grouping for customer management and sales operations.</span>
        </div>
      </Card>

      {/* CREATE / EDIT MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRoute ? `Edit Route — ${editingRoute.code}` : 'Add New Sales Route'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Route Code <span className="text-rose-600">*</span>
              </label>
              <Input
                type="text"
                placeholder="e.g. RT-KHI-01"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
                className="h-8 text-xs font-mono uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Route Name <span className="text-rose-600">*</span>
              </label>
              <Input
                type="text"
                placeholder="e.g. Saddar & Clifton Commercial Route"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="h-8 text-xs font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">City</label>
              <Input
                type="text"
                placeholder="e.g. Karachi"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="h-8 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">Area / Sector</label>
              <Input
                type="text"
                placeholder="e.g. District South (Saddar, Cantt, Clifton)"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">Branch Scope</label>
              <select
                value={formData.branchId}
                onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                className="w-full h-8 px-2.5 rounded border border-surface-border bg-white text-xs text-charcoal-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="">All Branches (Organization-wide)</option>
                {branchesList.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.code} — {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded border-surface-border text-brand-600 focus:ring-brand-500 h-4 w-4"
                />
                <span className="text-xs font-semibold text-charcoal-800">Active Sales Route</span>
              </label>
            </div>
          </div>

          {/* Assigned Salesmen Multi-Select Box */}
          <div className="space-y-1.5 pt-1">
            <label className="block text-xs font-semibold text-charcoal-700">
              Assigned Commercial Salesmen
            </label>
            <div className="p-2.5 rounded border border-surface-border bg-surface-muted/30 max-h-36 overflow-y-auto space-y-1.5">
              {salesmenList.length === 0 ? (
                <p className="text-xs text-charcoal-400 py-2 text-center">No active salesmen registered yet.</p>
              ) : (
                salesmenList.map((sm) => {
                  const isChecked = formData.salesmanIds.includes(sm.id);
                  return (
                    <label
                      key={sm.id}
                      className="flex items-center justify-between p-1.5 rounded hover:bg-white cursor-pointer transition-colors text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSalesman(sm.id)}
                          className="rounded border-surface-border text-brand-600 focus:ring-brand-500 h-3.5 w-3.5"
                        />
                        <span className="font-semibold text-charcoal-900">
                          {sm.code} — {sm.name}
                        </span>
                      </div>
                      {sm.phone && <span className="text-[11px] text-charcoal-500 font-mono">{sm.phone}</span>}
                    </label>
                  );
                })
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-700 mb-1">Remarks & Notes</label>
            <Input
              type="text"
              placeholder="Delivery notes, schedule, or geographic boundaries..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="h-8 text-xs"
            />
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-border">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={isSubmitting} className="font-semibold px-4">
              {isSubmitting ? 'Saving...' : editingRoute ? 'Update Route' : 'Create Route'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={!!deletingRoute}
        onClose={() => setDeletingRoute(null)}
        onConfirm={handleConfirmDelete}
        title={`Delete Sales Route — ${deletingRoute?.name || ''}`}
        description={`Are you sure you want to remove route "${deletingRoute?.name}" (${deletingRoute?.code})? If this route is assigned to existing customers or invoices, it will be safely deactivated instead.`}
        confirmText="Delete / Deactivate"
        variant="danger"
      />
    </div>
  );
};
