import React, { useState, useEffect, useCallback } from 'react';
import {
  UserCheck,
  Search,
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Building2,
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
  Salesman,
  SalesRoute,
  CreateSalesmanPayload,
  UpdateSalesmanPayload,
  warehousesApi,
} from '../api';

export const SalesmenPage: React.FC = () => {
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

  const [salesmen, setSalesmen] = useState<Salesman[]>([]);
  const [routesList, setRoutesList] = useState<SalesRoute[]>([]);
  const [branchesList, setBranchesList] = useState<{ id: string; name: string; code: string }[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [branchFilter, setBranchFilter] = useState<string>('ALL');
  const [routeFilter, setRouteFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingSalesman, setEditingSalesman] = useState<Salesman | null>(null);
  const [deletingSalesman, setDeletingSalesman] = useState<Salesman | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState<{
    code: string;
    name: string;
    phone: string;
    email: string;
    branchId: string;
    routeIds: string[];
    notes: string;
    isActive: boolean;
  }>({
    code: '',
    name: '',
    phone: '',
    email: '',
    branchId: '',
    routeIds: [],
    notes: '',
    isActive: true,
  });

  // Load master data (routes & branches)
  const loadMasterData = useCallback(async () => {
    try {
      const [routesRes, whRes] = await Promise.all([
        salesOperationsApi.getSalesRoutes({ limit: 100, isActive: true }),
        warehousesApi.getWarehouses(),
      ]);
      setRoutesList(routesRes.items || []);

      // Extract unique branches from warehouse response
      const branchesMap = new Map<string, { id: string; name: string; code: string }>();
      whRes.forEach((w: any) => {
        if (w.branch) {
          branchesMap.set(w.branch.id, w.branch);
        }
      });
      setBranchesList(Array.from(branchesMap.values()));
    } catch {
      // Fallback silently if master data fails
    }
  }, []);

  // Load salesmen list
  const loadSalesmen = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await salesOperationsApi.getSalesmen({
        search: search.trim() || undefined,
        branchId: branchFilter === 'ALL' ? undefined : branchFilter,
        routeId: routeFilter === 'ALL' ? undefined : routeFilter,
        isActive: statusFilter === 'ALL' ? undefined : statusFilter === 'ACTIVE',
        page: currentPage,
        limit: 20,
      });
      setSalesmen(res?.items || []);
      setTotalRecords(res?.meta?.total || 0);
      setTotalPages(res?.meta?.totalPages || 1);
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || 'Failed to load salesmen', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [search, branchFilter, routeFilter, statusFilter, currentPage, showToast]);

  useEffect(() => {
    loadMasterData();
  }, [loadMasterData]);

  useEffect(() => {
    loadSalesmen();
  }, [loadSalesmen]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingSalesman(null);
    setFormData({
      code: `SM-${String(salesmen.length + 1).padStart(3, '0')}`,
      name: '',
      phone: '',
      email: '',
      branchId: '',
      routeIds: [],
      notes: '',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (sm: Salesman) => {
    setEditingSalesman(sm);
    setFormData({
      code: sm.code,
      name: sm.name,
      phone: sm.phone || '',
      email: sm.email || '',
      branchId: sm.branchId || '',
      routeIds: sm.assignedRoutes?.map((r) => r.id) || [],
      notes: sm.notes || '',
      isActive: sm.isActive,
    });
    setIsModalOpen(true);
  };

  // Toggle Route selection in form
  const handleToggleRoute = (routeId: string) => {
    setFormData((prev) => {
      const exists = prev.routeIds.includes(routeId);
      return {
        ...prev,
        routeIds: exists ? prev.routeIds.filter((id) => id !== routeId) : [...prev.routeIds, routeId],
      };
    });
  };

  // Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      showToast('Salesman Code and Name are required.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingSalesman) {
        const payload: UpdateSalesmanPayload = {
          code: formData.code.trim().toUpperCase(),
          name: formData.name.trim(),
          phone: formData.phone.trim() || undefined,
          email: formData.email.trim() || undefined,
          branchId: formData.branchId || undefined,
          routeIds: formData.routeIds,
          notes: formData.notes.trim() || undefined,
          isActive: formData.isActive,
        };
        await salesOperationsApi.updateSalesman(editingSalesman.id, payload);
        showToast(`Salesman "${formData.name}" updated successfully.`, 'success');
      } else {
        const payload: CreateSalesmanPayload = {
          code: formData.code.trim().toUpperCase(),
          name: formData.name.trim(),
          phone: formData.phone.trim() || undefined,
          email: formData.email.trim() || undefined,
          branchId: formData.branchId || undefined,
          routeIds: formData.routeIds,
          notes: formData.notes.trim() || undefined,
          isActive: formData.isActive,
        };
        await salesOperationsApi.createSalesman(payload);
        showToast(`Salesman "${formData.name}" created successfully.`, 'success');
      }
      setIsModalOpen(false);
      loadSalesmen();
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || 'Operation failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm Delete / Deactivate
  const handleConfirmDelete = async () => {
    if (!deletingSalesman) return;
    try {
      const res = await salesOperationsApi.deleteSalesman(deletingSalesman.id);
      showToast(res.message, res.deactivated ? 'info' : 'success');
      setDeletingSalesman(null);
      loadSalesmen();
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || 'Failed to delete salesman', 'error');
    }
  };

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Header */}
      <div className="bg-white px-3.5 py-2.5 rounded-lg border border-surface-border flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded bg-brand-50 flex items-center justify-center text-brand-700">
            <UserCheck className="h-4.5 w-4.5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-charcoal-900 leading-tight">Salesmen Directory</h1>
            <p className="text-[11px] text-charcoal-500">
              Manage field commercial representatives, territory route assignments, and customer attribution
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" onClick={handleOpenCreate} className="h-8 text-xs font-semibold gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            <span>Add Salesman</span>
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
                placeholder="Search by code, name, phone, email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-8 text-xs h-8"
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
              value={routeFilter}
              onChange={(e) => {
                setRouteFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-8 px-2.5 rounded border border-surface-border bg-white text-xs text-charcoal-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="ALL">All Routes</option>
              {routesList.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.code} — {r.name}
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

          <Button variant="outline" size="sm" onClick={loadSalesmen} className="h-8 text-xs flex items-center gap-1.5">
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>

        {/* Data Table */}
        <div className="flex-1 overflow-y-auto min-h-0 border border-surface-border rounded">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-surface-muted/60 sticky top-0 z-10 border-b border-surface-border text-[10px] text-charcoal-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Salesman Code</th>
                <th className="py-2.5 px-3">Representative Name</th>
                <th className="py-2.5 px-3">Contact Info</th>
                <th className="py-2.5 px-3">Branch Scope</th>
                <th className="py-2.5 px-3">Assigned Routes / Territories</th>
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
                    <span>Loading salesmen directory...</span>
                  </td>
                </tr>
              ) : salesmen.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-charcoal-400">
                    <UserCheck className="h-8 w-8 mx-auto mb-2 text-charcoal-300 stroke-[1.5]" />
                    <p className="font-semibold text-charcoal-700">No salesmen records found</p>
                    <p className="text-[11px] text-charcoal-400 mt-0.5">
                      {search ? 'Try adjusting your search filters.' : 'Click "Add Salesman" to register a field rep.'}
                    </p>
                  </td>
                </tr>
              ) : (
                salesmen.map((sm) => (
                  <tr key={sm.id} className="hover:bg-surface-muted/40 transition-colors">
                    <td className="py-2 px-3 font-mono font-bold text-charcoal-900">{sm.code}</td>
                    <td className="py-2 px-3 font-bold text-charcoal-900">{sm.name}</td>
                    <td className="py-2 px-3 text-charcoal-600 space-y-0.5">
                      {sm.phone && (
                        <div className="flex items-center gap-1 text-[11px]">
                          <Phone className="h-3 w-3 text-charcoal-400 shrink-0" />
                          <span>{sm.phone}</span>
                        </div>
                      )}
                      {sm.email && (
                        <div className="flex items-center gap-1 text-[11px]">
                          <Mail className="h-3 w-3 text-charcoal-400 shrink-0" />
                          <span className="truncate max-w-[150px]">{sm.email}</span>
                        </div>
                      )}
                      {!sm.phone && !sm.email && <span className="text-charcoal-400">—</span>}
                    </td>
                    <td className="py-2 px-3 text-charcoal-600">
                      {sm.branch ? (
                        <span className="inline-flex items-center gap-1 bg-surface-muted px-1.5 py-0.5 rounded text-[11px] font-medium">
                          <Building2 className="h-3 w-3 text-charcoal-500" />
                          {sm.branch.name}
                        </span>
                      ) : (
                        <span className="text-[11px] text-charcoal-400 italic">All Branches (Org-wide)</span>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      {sm.assignedRoutes && sm.assignedRoutes.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {sm.assignedRoutes.map((r) => (
                            <span
                              key={r.id}
                              className="inline-flex items-center gap-0.5 bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded text-[10px] font-semibold"
                              title={`${r.code} — ${r.name} (${r.city || ''})`}
                            >
                              <MapPin className="h-2.5 w-2.5 shrink-0" />
                              <span>{r.code}</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[11px] text-charcoal-400 italic">No routes assigned</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className="font-mono font-semibold text-charcoal-700">
                        {sm.customerCount || 0}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <StatusBadge variant={sm.isActive ? 'success' : 'neutral'}>
                        {sm.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </StatusBadge>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(sm)}
                          className="h-7 w-7 p-0 text-charcoal-500 hover:text-brand-700"
                          title="Edit Salesman"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingSalesman(sm)}
                          className="h-7 w-7 p-0 text-charcoal-400 hover:text-rose-600"
                          title="Delete or Deactivate Salesman"
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
          <span>Showing {salesmen.length} of {totalRecords} salesmen</span>
          <span>Tip: Assigning routes enables automated customer default routing.</span>
        </div>
      </Card>

      {/* CREATE / EDIT MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSalesman ? `Edit Salesman — ${editingSalesman.code}` : 'Add New Salesman'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Salesman Code <span className="text-rose-600">*</span>
              </label>
              <Input
                type="text"
                placeholder="e.g. SM-001"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
                className="h-8 text-xs font-mono uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Full Name <span className="text-rose-600">*</span>
              </label>
              <Input
                type="text"
                placeholder="e.g. Tariq Mahmood"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="h-8 text-xs font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">Phone Number</label>
              <Input
                type="text"
                placeholder="e.g. +92-300-1122334"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="h-8 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">Email Address</label>
              <Input
                type="email"
                placeholder="e.g. tariq.sales@medixpharma.pk"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                <span className="text-xs font-semibold text-charcoal-800">Active Field Representative</span>
              </label>
            </div>
          </div>

          {/* Assigned Routes Multi-Select Box */}
          <div className="space-y-1.5 pt-1">
            <label className="block text-xs font-semibold text-charcoal-700">
              Assigned Sales Routes / Territories
            </label>
            <div className="p-2.5 rounded border border-surface-border bg-surface-muted/30 max-h-36 overflow-y-auto space-y-1.5">
              {routesList.length === 0 ? (
                <p className="text-xs text-charcoal-400 py-2 text-center">No sales routes configured yet.</p>
              ) : (
                routesList.map((r) => {
                  const isChecked = formData.routeIds.includes(r.id);
                  return (
                    <label
                      key={r.id}
                      className="flex items-center justify-between p-1.5 rounded hover:bg-white cursor-pointer transition-colors text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleRoute(r.id)}
                          className="rounded border-surface-border text-brand-600 focus:ring-brand-500 h-3.5 w-3.5"
                        />
                        <span className="font-semibold text-charcoal-900">
                          {r.code} — {r.name}
                        </span>
                      </div>
                      {r.city && <span className="text-[11px] text-charcoal-500">{r.city}</span>}
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
              placeholder="Territory notes, commission terms, or special instructions..."
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
              {isSubmitting ? 'Saving...' : editingSalesman ? 'Update Salesman' : 'Create Salesman'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={!!deletingSalesman}
        onClose={() => setDeletingSalesman(null)}
        onConfirm={handleConfirmDelete}
        title={`Delete Salesman — ${deletingSalesman?.name || ''}`}
        description={`Are you sure you want to remove salesman "${deletingSalesman?.name}" (${deletingSalesman?.code})? If this salesman is referenced by existing customers or sales invoices, they will be safely deactivated instead.`}
        confirmText="Delete / Deactivate"
        variant="danger"
      />
    </div>
  );
};
